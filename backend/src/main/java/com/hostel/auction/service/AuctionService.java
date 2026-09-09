package com.hostel.auction.service;

import com.hostel.auction.dto.*;
import com.hostel.auction.entity.*;
import com.hostel.auction.exception.AuctionException;
import com.hostel.auction.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuctionService {

    private final AuctionRepository auctionRepository;
    private final PlayerRepository playerRepository;
    private final TeamRepository teamRepository;
    private final BidRepository bidRepository;
    private final AuctionRoundRepository roundRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuthService authService;
    private final TeamService teamService;
    private final AuctionTimerService auctionTimerService;
    private final SimpMessagingTemplate messagingTemplate;

    private final Object bidLock = new Object();

    @Transactional(readOnly = true)
    public AuctionStateResponse getCurrentAuctionState() {
        Optional<Auction> activeOpt = auctionRepository.findFirstByStatusInOrderByStartedAtDesc(
                List.of(AuctionStatus.ACTIVE, AuctionStatus.PAUSED)
        );

        int activeRoundNumber = roundRepository.findFirstByStatusOrderByRoundNumberAsc(RoundStatus.ACTIVE)
                .map(AuctionRound::getRoundNumber)
                .orElse(1);

        if (activeOpt.isEmpty()) {
            // Check for most recent sold/unsold auction to display summary if desired
            Optional<Auction> recentOpt = auctionRepository.findAllByOrderByStartedAtDesc().stream().findFirst();
            if (recentOpt.isPresent()) {
                AuctionStateResponse resp = buildAuctionStateResponse(recentOpt.get(), "LATEST_AUCTION", "No active auction in progress");
                resp.setRoundNumber(activeRoundNumber);
                return resp;
            }
            return AuctionStateResponse.builder()
                    .status(null)
                    .roundNumber(activeRoundNumber)
                    .teams(teamService.getAllTeams())
                    .message("No auction has been started yet")
                    .build();
        }

        AuctionStateResponse resp = buildAuctionStateResponse(activeOpt.get(), "STATE_SYNC", "Current auction synchronized");
        resp.setRoundNumber(activeRoundNumber);
        return resp;
    }

    @Transactional
    public AuctionStateResponse startAuction(Long playerId, Integer startingPrice) {
        synchronized (bidLock) {
            // Check if another auction is active or paused
            Optional<Auction> existingActive = auctionRepository.findFirstByStatusInOrderByStartedAtDesc(
                    List.of(AuctionStatus.ACTIVE, AuctionStatus.PAUSED)
            );
            if (existingActive.isPresent()) {
                throw new AuctionException("AUCTION_ALREADY_ACTIVE",
                        "An auction is already running for " + existingActive.get().getPlayer().getName());
            }

            Player player = playerRepository.findById(playerId)
                    .orElseThrow(() -> new AuctionException("PLAYER_NOT_FOUND", "Player not found with ID: " + playerId));

            // Find or create active round (defaults to Round 1)
            AuctionRound round = roundRepository.findFirstByStatusOrderByRoundNumberAsc(RoundStatus.ACTIVE)
                    .orElseGet(() -> roundRepository.save(AuctionRound.builder()
                            .roundNumber(1)
                            .status(RoundStatus.ACTIVE)
                            .startedAt(LocalDateTime.now())
                            .build()));

            int currentRound = (round.getRoundNumber() != null) ? round.getRoundNumber() : 1;

            // Strict per-round eligibility enforcement based on auction history
            if (!isPlayerEligibleForRound(player, currentRound)) {
                if (player.getStatus() == PlayerStatus.SOLD || auctionRepository.existsByPlayerIdAndStatus(player.getId(), AuctionStatus.SOLD)) {
                    throw new AuctionException("PLAYER_ALREADY_SOLD", "Player " + player.getName() + " has already been sold and cannot appear again!");
                }
                if (auctionRepository.existsByPlayerIdAndRoundRoundNumberAndStatusIn(player.getId(), currentRound,
                        List.of(AuctionStatus.ACTIVE, AuctionStatus.PAUSED, AuctionStatus.SOLD, AuctionStatus.UNSOLD))) {
                    throw new AuctionException("PLAYER_ALREADY_APPEARED_IN_ROUND",
                            "Player " + player.getName() + " has already appeared in Round " + currentRound + " and cannot appear again in this round!");
                }
                if (currentRound > 1) {
                    throw new AuctionException("PLAYER_NOT_UNSOLD_PREVIOUS_ROUND",
                            "Player " + player.getName() + " is not eligible for Round " + currentRound + " (Round " + currentRound + " is strictly for players who went UNSOLD in Round " + (currentRound - 1) + ")!");
                }
                throw new AuctionException("PLAYER_NOT_ELIGIBLE_FOR_ROUND",
                        "Player " + player.getName() + " is not eligible for Round " + currentRound);
            }

            int startPrice = (startingPrice != null && startingPrice > 0) ? startingPrice : player.getBasePrice();

            player.setStatus(PlayerStatus.IN_AUCTION);
            playerRepository.save(player);

            Auction auction = Auction.builder()
                    .player(player)
                    .round(round)
                    .startingPrice(startPrice)
                    .currentPrice(startPrice)
                    .highestBidderTeam(null)
                    .status(AuctionStatus.ACTIVE)
                    .callState(CallState.NORMAL)
                    .timerSeconds(auctionTimerService.getDefaultDuration())
                    .startedAt(LocalDateTime.now())
                    .build();

            Auction savedAuction = auctionRepository.save(auction);
            auctionTimerService.startTimer(auctionTimerService.getDefaultDuration());

            auditLogRepository.save(AuditLog.builder()
                    .username("admin")
                    .action("START_AUCTION")
                    .description("Started auction for " + player.getName() + " with base price " + startPrice)
                    .timestamp(LocalDateTime.now())
                    .build());

            AuctionStateResponse response = buildAuctionStateResponse(savedAuction, "AUCTION_STARTED",
                    "Auction started for " + player.getName());
            broadcastAuctionState(response);
            return response;
        }
    }

    public AuctionStateResponse placeBid(BidRequest request) {
        synchronized (bidLock) {
            // 1. Validate captain authority for team
            if (request.getCaptainUsername() != null && !request.getCaptainUsername().isBlank()) {
                authService.validateCaptainForTeam(request.getCaptainUsername(), request.getTeamId());
            }

            // 2. Load active auction
            Auction auction = auctionRepository.findFirstByStatusOrderByStartedAtDesc(AuctionStatus.ACTIVE)
                    .orElseThrow(() -> new AuctionException("AUCTION_NOT_ACTIVE", "No active auction to place a bid on"));

            // 3. Validate auction status
            if (auction.getStatus() != AuctionStatus.ACTIVE) {
                throw new AuctionException("AUCTION_NOT_ACTIVE", "Auction is currently " + auction.getStatus());
            }

            // 4. Validate player
            Player player = auction.getPlayer();
            if (player.getStatus() != PlayerStatus.IN_AUCTION) {
                throw new AuctionException("PLAYER_NOT_AVAILABLE", "Player is not currently in auction");
            }

            // 5. Load bidding team
            Team team = teamRepository.findById(request.getTeamId())
                    .orElseThrow(() -> new AuctionException("TEAM_NOT_FOUND", "Team not found with ID: " + request.getTeamId()));

            // 6. Check insufficient purse
            if (request.getAmount() > team.getCurrentPurse()) {
                throw new AuctionException("INSUFFICIENT_PURSE",
                        "Insufficient purse! " + team.getName() + " has " + team.getCurrentPurse() + " points, but bid is " + request.getAmount());
            }

            // 7. Check bid amount rule: must be higher than current price
            // Exception: If no highest bidder yet, a bid equal to startingPrice is accepted; otherwise it must be strictly greater.
            if (auction.getHighestBidderTeam() == null) {
                if (request.getAmount() < auction.getCurrentPrice()) {
                    throw new AuctionException("INVALID_BID", "First bid must be at least the starting price of " + auction.getCurrentPrice());
                }
            } else {
                if (request.getAmount() <= auction.getCurrentPrice()) {
                    throw new AuctionException("INVALID_BID",
                            "Bid amount must be strictly greater than current highest bid of " + auction.getCurrentPrice());
                }
            }

            // 8. Cannot outbid yourself if you are already the highest bidder with equal or higher bid
            if (auction.getHighestBidderTeam() != null && auction.getHighestBidderTeam().getId().equals(team.getId())) {
                throw new AuctionException("ALREADY_HIGHEST_BIDDER", "Your team is already the highest bidder!");
            }

            // 9. Save Bid
            Bid bid = Bid.builder()
                    .auction(auction)
                    .team(team)
                    .amount(request.getAmount())
                    .createdAt(LocalDateTime.now())
                    .build();
            bidRepository.save(bid);

            // 10. Update Auction state (NOTE: Team purse is NOT reduced here!)
            auction.setCurrentPrice(request.getAmount());
            auction.setHighestBidderTeam(team);
            auction.setCallState(CallState.NORMAL);
            Auction savedAuction = auctionRepository.save(auction);

            // 11. Reset timer on valid higher bid
            auctionTimerService.resetTimer();

            AuctionStateResponse response = buildAuctionStateResponse(savedAuction, "BID_PLACED",
                    team.getName() + " placed a bid of " + request.getAmount());
            broadcastAuctionState(response);
            return response;
        }
    }

    @Transactional
    public AuctionStateResponse setCallState(Long auctionId, CallState callState) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new AuctionException("AUCTION_NOT_FOUND", "Auction not found with ID: " + auctionId));

        auction.setCallState(callState);
        Auction savedAuction = auctionRepository.save(auction);

        AuctionStateResponse response = buildAuctionStateResponse(savedAuction, "CALL_STATE_CHANGED",
                "Auction call updated to " + callState);
        broadcastAuctionState(response);
        return response;
    }

    @Transactional
    public AuctionStateResponse pauseAuction(Long auctionId) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new AuctionException("AUCTION_NOT_FOUND", "Auction not found with ID: " + auctionId));

        auction.setStatus(AuctionStatus.PAUSED);
        Auction savedAuction = auctionRepository.save(auction);
        auctionTimerService.pauseTimer();

        AuctionStateResponse response = buildAuctionStateResponse(savedAuction, "AUCTION_PAUSED", "Auction paused by admin");
        broadcastAuctionState(response);
        return response;
    }

    @Transactional
    public AuctionStateResponse resumeAuction(Long auctionId) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new AuctionException("AUCTION_NOT_FOUND", "Auction not found with ID: " + auctionId));

        auction.setStatus(AuctionStatus.ACTIVE);
        Auction savedAuction = auctionRepository.save(auction);
        auctionTimerService.resumeTimer();

        AuctionStateResponse response = buildAuctionStateResponse(savedAuction, "AUCTION_RESUMED", "Auction resumed by admin");
        broadcastAuctionState(response);
        return response;
    }

    @Transactional
    public AuctionStateResponse markSold(Long auctionId) {
        synchronized (bidLock) {
            Auction auction = auctionRepository.findById(auctionId)
                    .orElseThrow(() -> new AuctionException("AUCTION_NOT_FOUND", "Auction not found with ID: " + auctionId));

            if (auction.getStatus() == AuctionStatus.SOLD) {
                throw new AuctionException("PLAYER_ALREADY_SOLD", "Auction is already marked as SOLD");
            }

            Team winningTeam = auction.getHighestBidderTeam();
            if (winningTeam == null) {
                throw new AuctionException("NO_BIDS_PLACED", "Cannot sell player without any bids. Mark as UNSOLD instead.");
            }

            Player player = auction.getPlayer();
            if (player.getStatus() == PlayerStatus.SOLD) {
                throw new AuctionException("PLAYER_ALREADY_SOLD", "Player is already sold!");
            }

            int finalPrice = auction.getCurrentPrice();

            // Refresh team to ensure purse accuracy
            Team teamFromDb = teamRepository.findById(winningTeam.getId())
                    .orElseThrow(() -> new AuctionException("TEAM_NOT_FOUND", "Winning team not found"));

            if (teamFromDb.getCurrentPurse() < finalPrice) {
                throw new AuctionException("INSUFFICIENT_PURSE",
                        "Winning team " + teamFromDb.getName() + " does not have enough purse (" +
                                teamFromDb.getCurrentPurse() + " vs required " + finalPrice + ")");
            }

            // 1. Mark player SOLD
            player.setStatus(PlayerStatus.SOLD);
            player.setSoldPrice(finalPrice);
            player.setTeam(teamFromDb);
            playerRepository.save(player);

            // 2. Atomically deduct winning team's purse
            teamFromDb.setCurrentPurse(teamFromDb.getCurrentPurse() - finalPrice);
            teamRepository.save(teamFromDb);

            // 3. Mark auction SOLD
            auction.setStatus(AuctionStatus.SOLD);
            auction.setEndedAt(LocalDateTime.now());
            Auction savedAuction = auctionRepository.save(auction);

            // 4. Stop authoritative timer
            auctionTimerService.stopTimer();

            // 5. Create audit log
            auditLogRepository.save(AuditLog.builder()
                    .username("admin")
                    .action("PLAYER_SOLD")
                    .description(player.getName() + " sold to " + teamFromDb.getName() + " for " + finalPrice)
                    .timestamp(LocalDateTime.now())
                    .build());

            AuctionStateResponse response = buildAuctionStateResponse(savedAuction, "PLAYER_SOLD",
                    player.getName() + " SOLD to " + teamFromDb.getName() + " for ₹" + finalPrice + "!");
            broadcastAuctionState(response);
            broadcastTeamsUpdate();
            return response;
        }
    }

    @Transactional
    public AuctionStateResponse markUnsold(Long auctionId) {
        synchronized (bidLock) {
            Auction auction = auctionRepository.findById(auctionId)
                    .orElseThrow(() -> new AuctionException("AUCTION_NOT_FOUND", "Auction not found with ID: " + auctionId));

            if (auction.getStatus() == AuctionStatus.SOLD) {
                throw new AuctionException("PLAYER_ALREADY_SOLD", "Cannot mark sold player as unsold. Use UNDO if needed.");
            }

            Player player = auction.getPlayer();
            player.setStatus(PlayerStatus.UNSOLD);
            player.setTeam(null);
            player.setSoldPrice(null);
            playerRepository.save(player);

            auction.setStatus(AuctionStatus.UNSOLD);
            auction.setEndedAt(LocalDateTime.now());
            Auction savedAuction = auctionRepository.save(auction);

            auctionTimerService.stopTimer();

            auditLogRepository.save(AuditLog.builder()
                    .username("admin")
                    .action("PLAYER_UNSOLD")
                    .description(player.getName() + " marked as UNSOLD")
                    .timestamp(LocalDateTime.now())
                    .build());

            AuctionStateResponse response = buildAuctionStateResponse(savedAuction, "PLAYER_UNSOLD",
                    player.getName() + " goes UNSOLD. Player eligible for later rounds.");
            broadcastAuctionState(response);
            broadcastTeamsUpdate();
            return response;
        }
    }

    @Transactional
    public AuctionStateResponse undoLastSale() {
        synchronized (bidLock) {
            Auction lastSold = auctionRepository.findTopByStatusOrderByEndedAtDesc(AuctionStatus.SOLD)
                    .orElseThrow(() -> new AuctionException("NO_SALE_TO_UNDO", "No sold auction found to undo"));

            Player player = lastSold.getPlayer();
            Team team = lastSold.getHighestBidderTeam();
            int refundedAmount = lastSold.getCurrentPrice();

            // 1. Restore team purse
            if (team != null) {
                Team teamDb = teamRepository.findById(team.getId()).orElse(team);
                teamDb.setCurrentPurse(teamDb.getCurrentPurse() + refundedAmount);
                teamRepository.save(teamDb);
            }

            // 2. Reset player
            player.setStatus(PlayerStatus.AVAILABLE);
            player.setTeam(null);
            player.setSoldPrice(null);
            playerRepository.save(player);

            // 3. Mark auction as PENDING or delete/reopen
            lastSold.setStatus(AuctionStatus.PENDING);
            lastSold.setEndedAt(null);
            auctionRepository.save(lastSold);

            auctionTimerService.stopTimer();

            auditLogRepository.save(AuditLog.builder()
                    .username("admin")
                    .action("UNDO_LAST_SALE")
                    .description("Undid sale of " + player.getName() + " to " + (team != null ? team.getName() : "None") +
                            ". Refunded " + refundedAmount + " points.")
                    .timestamp(LocalDateTime.now())
                    .build());

            AuctionStateResponse response = buildAuctionStateResponse(lastSold, "UNDO_COMPLETED",
                    "Sale of " + player.getName() + " was undone. " + refundedAmount + " refunded to " + (team != null ? team.getName() : ""));
            broadcastAuctionState(response);
            broadcastTeamsUpdate();
            return response;
        }
    }

    @Transactional(readOnly = true)
    public boolean isPlayerEligibleForRound(Player player, int roundNumber) {
        if (player == null || player.getStatus() == PlayerStatus.SOLD) {
            return false;
        }
        // If player was ever marked SOLD in any auction record, never appear again
        if (auctionRepository.existsByPlayerIdAndStatus(player.getId(), AuctionStatus.SOLD)) {
            return false;
        }
        // Player can appear only once in each round: check auction history for this round
        if (auctionRepository.existsByPlayerIdAndRoundRoundNumberAndStatusIn(
                player.getId(), roundNumber, List.of(AuctionStatus.ACTIVE, AuctionStatus.PAUSED, AuctionStatus.SOLD, AuctionStatus.UNSOLD))) {
            return false;
        }

        if (roundNumber == 1) {
            // Round 1: Eligible if not yet appeared in Round 1 and not sold
            return true;
        } else if (roundNumber == 2) {
            // Round 2: Strictly for players who went UNSOLD in Round 1 and have not yet appeared in Round 2
            return auctionRepository.existsByPlayerIdAndRoundRoundNumberAndStatus(
                    player.getId(), 1, AuctionStatus.UNSOLD);
        } else if (roundNumber == 3) {
            // Round 3: Strictly for players who went UNSOLD in Round 2 and have not yet appeared in Round 3
            return auctionRepository.existsByPlayerIdAndRoundRoundNumberAndStatus(
                    player.getId(), 2, AuctionStatus.UNSOLD);
        }
        return false;
    }

    @Transactional(readOnly = true)
    public List<PlayerResponse> getEligiblePlayersForRound(Integer roundNumber) {
        int round = (roundNumber != null) ? roundNumber : 1;
        List<Player> eligible = playerRepository.findAll().stream()
                .filter(p -> isPlayerEligibleForRound(p, round))
                .collect(Collectors.toList());

        // Interleave across years: 1st Year -> 2nd Year -> 3rd Year -> 4th Year
        List<Player> y1 = new ArrayList<>();
        List<Player> y2 = new ArrayList<>();
        List<Player> y3 = new ArrayList<>();
        List<Player> y4 = new ArrayList<>();
        List<Player> others = new ArrayList<>();

        for (Player p : eligible) {
            int rank = PlayerService.getYearRank(p.getYear());
            if (rank == 1) {
                y1.add(p);
            } else if (rank == 2) {
                y2.add(p);
            } else if (rank == 3) {
                y3.add(p);
            } else if (rank == 4) {
                y4.add(p);
            } else {
                others.add(p);
            }
        }

        List<PlayerResponse> result = new ArrayList<>();
        int max = Math.max(Math.max(y1.size(), y2.size()), Math.max(y3.size(), y4.size()));
        for (int i = 0; i < max; i++) {
            if (i < y1.size()) result.add(PlayerResponse.fromEntity(y1.get(i)));
            if (i < y2.size()) result.add(PlayerResponse.fromEntity(y2.get(i)));
            if (i < y3.size()) result.add(PlayerResponse.fromEntity(y3.get(i)));
            if (i < y4.size()) result.add(PlayerResponse.fromEntity(y4.get(i)));
        }
        for (Player p : others) {
            result.add(PlayerResponse.fromEntity(p));
        }

        return result;
    }

    @Transactional(readOnly = true)
    public PlayerResponse getNextEligiblePlayer(Integer roundNumber) {
        int round = (roundNumber != null) ? roundNumber : 1;
        List<PlayerResponse> eligible = getEligiblePlayersForRound(round);
        if (eligible.isEmpty()) {
            return null;
        }
        return eligible.get(0);
    }

    @Transactional
    public AuctionRound setRound(int roundNumber) {
        if (roundNumber < 1 || roundNumber > 3) {
            throw new AuctionException("INVALID_ROUND", "Round must be between 1 and 3");
        }

        // Complete any current active rounds
        roundRepository.findAll().forEach(r -> {
            if (r.getStatus() == RoundStatus.ACTIVE) {
                r.setStatus(RoundStatus.COMPLETED);
                r.setEndedAt(LocalDateTime.now());
                roundRepository.save(r);
            }
        });

        AuctionRound round = roundRepository.findByRoundNumber(roundNumber)
                .orElseGet(() -> AuctionRound.builder()
                        .roundNumber(roundNumber)
                        .build());

        round.setStatus(RoundStatus.ACTIVE);
        round.setStartedAt(LocalDateTime.now());
        round.setEndedAt(null);
        AuctionRound saved = roundRepository.save(round);

        // Broadcast full state response so all clients update their active round immediately
        AuctionStateResponse stateResponse = getCurrentAuctionState();
        stateResponse.setRoundNumber(roundNumber);
        stateResponse.setEventType("ROUND_CHANGED");
        stateResponse.setMessage("Auction moved to Round " + roundNumber);
        broadcastAuctionState(stateResponse);

        return saved;
    }

    @Transactional(readOnly = true)
    public List<AuctionStateResponse> getAuctionHistory() {
        return auctionRepository.findAllByOrderByStartedAtDesc().stream()
                .map(a -> buildAuctionStateResponse(a, "HISTORY_ITEM", null))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AuctionReportResponse getAnalytics() {
        List<Player> allPlayers = playerRepository.findAll();
        List<PlayerResponse> soldPlayers = allPlayers.stream()
                .filter(p -> p.getStatus() == PlayerStatus.SOLD)
                .map(PlayerResponse::fromEntity)
                .sorted((a, b) -> Integer.compare(b.getSoldPrice() != null ? b.getSoldPrice() : 0, a.getSoldPrice() != null ? a.getSoldPrice() : 0))
                .collect(Collectors.toList());

        List<PlayerResponse> unsoldPlayers = allPlayers.stream()
                .filter(p -> p.getStatus() == PlayerStatus.UNSOLD)
                .map(PlayerResponse::fromEntity)
                .collect(Collectors.toList());

        long availableCount = allPlayers.stream().filter(p -> p.getStatus() == PlayerStatus.AVAILABLE).count();

        int totalSpent = soldPlayers.stream().mapToInt(p -> p.getSoldPrice() != null ? p.getSoldPrice() : 0).sum();
        double avgPrice = soldPlayers.isEmpty() ? 0.0 : (double) totalSpent / soldPlayers.size();
        int maxPrice = soldPlayers.isEmpty() ? 0 : soldPlayers.get(0).getSoldPrice();
        int minPrice = soldPlayers.isEmpty() ? 0 : soldPlayers.get(soldPlayers.size() - 1).getSoldPrice();

        PlayerResponse highestPlayer = soldPlayers.isEmpty() ? null : soldPlayers.get(0);

        return AuctionReportResponse.builder()
                .totalPlayers(allPlayers.size())
                .soldPlayers(soldPlayers.size())
                .unsoldPlayers(unsoldPlayers.size())
                .availablePlayers((int) availableCount)
                .totalPointsSpent(totalSpent)
                .averagePlayerPrice(Math.round(avgPrice * 10.0) / 10.0)
                .highestPlayerPrice(maxPrice)
                .lowestPlayerPrice(minPrice)
                .highestPurchasedPlayer(highestPlayer)
                .teams(teamService.getAllTeams())
                .topPurchases(soldPlayers.stream().limit(5).collect(Collectors.toList()))
                .unsoldList(unsoldPlayers)
                .build();
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getAuditLogs() {
        return auditLogRepository.findAllByOrderByTimestampDesc();
    }

    private AuctionStateResponse buildAuctionStateResponse(Auction auction, String eventType, String message) {
        List<BidResponse> bids = (auction.getId() != null) ?
                bidRepository.findByAuctionIdOrderByCreatedAtDesc(auction.getId()).stream()
                        .map(BidResponse::fromEntity)
                        .collect(Collectors.toList()) :
                Collections.emptyList();

        List<TeamSummaryResponse> teams = teamService.getAllTeams();

        int roundNum = roundRepository.findFirstByStatusOrderByRoundNumberAsc(RoundStatus.ACTIVE)
                .map(AuctionRound::getRoundNumber)
                .orElse(auction.getRound() != null ? auction.getRound().getRoundNumber() : 1);

        return AuctionStateResponse.builder()
                .auctionId(auction.getId())
                .status(auction.getStatus())
                .callState(auction.getCallState())
                .roundNumber(roundNum)
                .player(PlayerResponse.fromEntity(auction.getPlayer()))
                .startingPrice(auction.getStartingPrice())
                .currentPrice(auction.getCurrentPrice())
                .highestBidderTeamId(auction.getHighestBidderTeam() != null ? auction.getHighestBidderTeam().getId() : null)
                .highestBidderTeamName(auction.getHighestBidderTeam() != null ? auction.getHighestBidderTeam().getName() : null)
                .timerSeconds(auctionTimerService.getRemainingSeconds().get())
                .recentBids(bids)
                .teams(teams)
                .eventType(eventType)
                .message(message)
                .build();
    }

    private void broadcastAuctionState(AuctionStateResponse response) {
        try {
            messagingTemplate.convertAndSend("/topic/auction", response);
        } catch (Exception e) {
            log.warn("Failed to broadcast auction state: {}", e.getMessage());
        }
    }

    public void broadcastTeamsUpdate() {
        try {
            messagingTemplate.convertAndSend("/topic/teams", teamService.getAllTeams());
        } catch (Exception e) {
            log.warn("Failed to broadcast teams update: {}", e.getMessage());
        }
    }

    @Transactional
    public Map<String, Object> resetTournament(boolean deletePlayers) {
        synchronized (bidLock) {
            auctionTimerService.stopTimer();
            bidRepository.deleteAll();
            auctionRepository.deleteAll();

            if (deletePlayers) {
                playerRepository.deleteAll();
            } else {
                playerRepository.findAll().forEach(p -> {
                    p.setStatus(PlayerStatus.AVAILABLE);
                    p.setTeam(null);
                    p.setSoldPrice(null);
                    p.setBasePrice(PlayerService.getBasePriceForYear(p.getYear()));
                    playerRepository.save(p);
                });
            }

            teamRepository.findAll().forEach(t -> {
                t.setCurrentPurse(t.getInitialPurse() != null ? t.getInitialPurse() : 1000);
                t.getPlayers().clear();
                teamRepository.save(t);
            });

            roundRepository.deleteAll();
            roundRepository.save(AuctionRound.builder()
                    .roundNumber(1)
                    .status(RoundStatus.ACTIVE)
                    .startedAt(LocalDateTime.now())
                    .build());

            auditLogRepository.save(AuditLog.builder()
                    .username("admin")
                    .action("RESET_TOURNAMENT")
                    .description("Tournament reset to clean initial state (deletePlayers: " + deletePlayers + ")")
                    .timestamp(LocalDateTime.now())
                    .build());

            AuctionStateResponse freshState = getCurrentAuctionState();
            freshState.setEventType("RESET_COMPLETED");
            freshState.setMessage("Tournament auction has been reset to Round 1");
            broadcastAuctionState(freshState);
            broadcastTeamsUpdate();

            return Map.of("message", "Tournament reset to clean initial state", "playersDeleted", deletePlayers);
        }
    }
}
