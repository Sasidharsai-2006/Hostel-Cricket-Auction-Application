package com.hostel.auction.service;

import com.hostel.auction.dto.ImportResultResponse;
import com.hostel.auction.dto.PlayerRequest;
import com.hostel.auction.dto.PlayerResponse;
import com.hostel.auction.entity.Player;
import com.hostel.auction.entity.PlayerRole;
import com.hostel.auction.entity.PlayerStatus;
import com.hostel.auction.exception.AuctionException;
import com.hostel.auction.repository.PlayerRepository;
import com.opencsv.CSVReader;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.hostel.auction.entity.AuctionRound;
import com.hostel.auction.entity.RoundStatus;
import com.hostel.auction.repository.AuctionRepository;
import com.hostel.auction.repository.AuctionRoundRepository;
import com.hostel.auction.repository.BidRepository;
import com.hostel.auction.repository.TeamRepository;

import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final AuctionRepository auctionRepository;
    private final BidRepository bidRepository;
    private final TeamRepository teamRepository;
    private final AuctionRoundRepository roundRepository;

    public static boolean isFirstYear(String year) {
        if (year == null) return false;
        String y = year.trim().toLowerCase();
        return y.contains("1st") || y.contains("first") || y.matches(".*\\b1\\b.*");
    }

    public static int getBasePriceForYear(String year) {
        if (year == null) return 20;
        String y = year.trim().toLowerCase();
        if (y.contains("2nd") || y.contains("second") || y.matches(".*\\b2\\b.*")) {
            return 15;
        } else if (y.contains("3rd") || y.contains("third") || y.matches(".*\\b3\\b.*")) {
            return 20;
        } else if (y.contains("4th") || y.contains("fourth") || y.contains("final") || y.matches(".*\\b4\\b.*")) {
            return 20;
        }
        return 20;
    }

    @Transactional(readOnly = true)
    public List<PlayerResponse> getPlayers(PlayerStatus status, PlayerRole role, String year, Long teamId, String search) {
        return playerRepository.searchPlayers(status, role, year, teamId, search)
                .stream()
                .map(PlayerResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PlayerResponse getPlayerById(Long id) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new AuctionException("PLAYER_NOT_FOUND", "Player not found with ID: " + id));
        return PlayerResponse.fromEntity(player);
    }

    @Transactional
    public PlayerResponse createPlayer(PlayerRequest request) {
        if (isFirstYear(request.getYear())) {
            throw new AuctionException("FIRST_YEAR_NOT_ELIGIBLE", "1st Year players cannot participate in the auction");
        }

        if (playerRepository.findByRollNumber(request.getRollNumber().trim()).isPresent()) {
            throw new AuctionException("DUPLICATE_ROLL_NUMBER", "Player with roll number " + request.getRollNumber() + " already exists");
        }

        int basePrice = (request.getBasePrice() != null && request.getBasePrice() > 0)
                ? request.getBasePrice()
                : getBasePriceForYear(request.getYear());

        Player player = Player.builder()
                .name(request.getName().trim())
                .rollNumber(request.getRollNumber().trim())
                .year(request.getYear().trim())
                .role(request.getRole())
                .basePrice(basePrice)
                .status(PlayerStatus.AVAILABLE)
                .build();

        Player saved = playerRepository.save(player);
        return PlayerResponse.fromEntity(saved);
    }

    @Transactional
    public PlayerResponse updateBasePrice(Long id, Integer newBasePrice) {
        if (newBasePrice == null || newBasePrice <= 0) {
            throw new AuctionException("INVALID_BASE_PRICE", "Base price must be greater than 0");
        }

        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new AuctionException("PLAYER_NOT_FOUND", "Player not found with ID: " + id));

        if (player.getStatus() == PlayerStatus.SOLD) {
            throw new AuctionException("PLAYER_ALREADY_SOLD", "Cannot update base price for sold player");
        }
        if (player.getStatus() == PlayerStatus.IN_AUCTION) {
            throw new AuctionException("AUCTION_ACTIVE", "Cannot update base price while player is in live auction");
        }

        player.setBasePrice(newBasePrice);
        return PlayerResponse.fromEntity(playerRepository.save(player));
    }

    @Transactional
    public ImportResultResponse importPlayersFromCsv(MultipartFile file) {
        return importPlayersFromCsv(file, null, false);
    }

    @Transactional
    public ImportResultResponse importPlayersFromCsv(MultipartFile file, Integer customDefaultBasePrice) {
        return importPlayersFromCsv(file, customDefaultBasePrice, false);
    }

    @Transactional
    public ImportResultResponse importPlayersFromCsv(MultipartFile file, Integer customDefaultBasePrice, Boolean wipeExisting) {
        if (file.isEmpty()) {
            throw new AuctionException("EMPTY_FILE", "Uploaded CSV file is empty");
        }

        if (Boolean.TRUE.equals(wipeExisting)) {
            bidRepository.deleteAll();
            auctionRepository.deleteAll();
            playerRepository.deleteAll();
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
        }

        int total = 0;
        int imported = 0;
        int duplicates = 0;
        int invalid = 0;
        int skipped1stYears = 0;
        List<String> duplicateRollNumbers = new ArrayList<>();
        List<String> invalidRows = new ArrayList<>();
        Set<String> seenRollNumbersInBatch = new HashSet<>();

        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
             CSVReader csvReader = new CSVReader(reader)) {

            String[] header = csvReader.readNext();
            if (header == null) {
                throw new AuctionException("INVALID_CSV", "CSV file does not contain a header");
            }

            // Map header indexes flexibly
            Map<String, Integer> colMap = new HashMap<>();
            for (int i = 0; i < header.length; i++) {
                colMap.put(header[i].trim().toLowerCase().replaceAll("[ _.-]", ""), i);
            }

            String[] row;
            int rowNum = 1;
            List<Player> playersToSave = new ArrayList<>();

            while ((row = csvReader.readNext()) != null) {
                rowNum++;
                if (row.length == 0 || (row.length == 1 && row[0].isBlank())) {
                    continue;
                }
                total++;

                try {
                    // Google Form fields: 1. Roll Number, 2. Name, 3. Year, 4. Player Style
                    String rollNumber = findColumnValue(row, colMap, "rollnumber", "rollno", "roll", "id");
                    String name = findColumnValue(row, colMap, "name", "playername", "fullname");
                    String year = findColumnValue(row, colMap, "year", "currentyear", "studyyear");
                    String roleStr = findColumnValue(row, colMap, "playerstyle", "role", "style", "playerrole");

                    // Positional fallback if headers didn't match
                    if (rollNumber.isBlank() && row.length >= 4) rollNumber = row[0].trim();
                    if (name.isBlank() && row.length >= 4) name = row[1].trim();
                    if (year.isBlank() && row.length >= 4) year = row[2].trim();
                    if (roleStr.isBlank() && row.length >= 4) roleStr = row[3].trim();

                    // Validation of the 4 mandatory fields
                    if (name.isBlank()) {
                        invalid++;
                        invalidRows.add("Row " + rowNum + ": Missing Name");
                        continue;
                    }
                    if (rollNumber.isBlank()) {
                        invalid++;
                        invalidRows.add("Row " + rowNum + ": Missing Roll Number for " + name);
                        continue;
                    }
                    if (year.isBlank()) {
                        invalid++;
                        invalidRows.add("Row " + rowNum + ": Missing Year for " + name);
                        continue;
                    }
                    if (roleStr.isBlank()) {
                        invalid++;
                        invalidRows.add("Row " + rowNum + ": Missing Player Style for " + name);
                        continue;
                    }

                    // Strictly NO 1st Year in auction
                    if (isFirstYear(year)) {
                        invalid++;
                        skipped1stYears++;
                        invalidRows.add("Row " + rowNum + ": Skipped " + name + " (1st Year students are not eligible for auction)");
                        continue;
                    }

                    // Check duplicate roll number
                    if (seenRollNumbersInBatch.contains(rollNumber) || playerRepository.findByRollNumber(rollNumber).isPresent()) {
                        duplicates++;
                        duplicateRollNumbers.add(rollNumber + " (" + name + ")");
                        continue;
                    }

                    // Parse and normalize Player Style
                    PlayerRole role = parsePlayerRole(roleStr);
                    if (role == null) {
                        invalid++;
                        invalidRows.add("Row " + rowNum + ": Invalid Player Style '" + roleStr + "' for " + name +
                                ". Allowed: BATSMAN, BOWLER, ALL_ROUNDER, WICKET_KEEPER");
                        continue;
                    }

                    // Automatic Base Price by Year: 2nd Year -> 15, 3rd Year -> 20, 4th Year -> 20
                    int playerBasePrice = getBasePriceForYear(year);
                    String basePriceStr = findColumnValue(row, colMap, "baseprice");
                    if (!basePriceStr.isBlank()) {
                        try {
                            playerBasePrice = Integer.parseInt(basePriceStr.trim());
                        } catch (NumberFormatException ignored) {}
                    } else if (customDefaultBasePrice != null && customDefaultBasePrice > 0) {
                        playerBasePrice = customDefaultBasePrice;
                    }

                    seenRollNumbersInBatch.add(rollNumber);
                    playersToSave.add(Player.builder()
                            .name(name)
                            .rollNumber(rollNumber)
                            .year(year)
                            .role(role)
                            .basePrice(playerBasePrice)
                            .status(PlayerStatus.AVAILABLE)
                            .team(null)
                            .soldPrice(null)
                            .build());

                    imported++;
                } catch (Exception e) {
                    invalid++;
                    invalidRows.add("Row " + rowNum + ": Parsing error - " + e.getMessage());
                }
            }

            // Group by year and interleave across years: 2nd Year, 3rd Year, 4th Year
            List<Player> y2List = new ArrayList<>();
            List<Player> y3List = new ArrayList<>();
            List<Player> y4List = new ArrayList<>();
            List<Player> otherList = new ArrayList<>();

            for (Player p : playersToSave) {
                String y = p.getYear() != null ? p.getYear().toLowerCase() : "";
                if (y.contains("2nd") || y.contains("second") || y.matches(".*\\b2\\b.*")) {
                    y2List.add(p);
                } else if (y.contains("3rd") || y.contains("third") || y.matches(".*\\b3\\b.*")) {
                    y3List.add(p);
                } else if (y.contains("4th") || y.contains("fourth") || y.contains("final") || y.matches(".*\\b4\\b.*")) {
                    y4List.add(p);
                } else {
                    otherList.add(p);
                }
            }

            // Shuffle within each year bucket for excitement and fairness
            Collections.shuffle(y2List);
            Collections.shuffle(y3List);
            Collections.shuffle(y4List);

            // Interleave round-robin: 1 from 2nd, 1 from 3rd, 1 from 4th
            List<Player> interleaved = new ArrayList<>();
            int maxBucket = Math.max(y2List.size(), Math.max(y3List.size(), y4List.size()));
            for (int i = 0; i < maxBucket; i++) {
                if (i < y2List.size()) interleaved.add(y2List.get(i));
                if (i < y3List.size()) interleaved.add(y3List.get(i));
                if (i < y4List.size()) interleaved.add(y4List.get(i));
            }
            interleaved.addAll(otherList);

            if (!interleaved.isEmpty()) {
                playerRepository.saveAll(interleaved);
            }

        } catch (Exception e) {
            log.error("Failed to parse CSV", e);
            throw new AuctionException("CSV_PARSE_ERROR", "Failed to parse CSV file: " + e.getMessage());
        }

        String msg = "Successfully imported " + imported + " players.";
        if (skipped1stYears > 0) {
            msg += " (" + skipped1stYears + " 1st Year students skipped - not eligible for auction).";
        }

        return ImportResultResponse.builder()
                .total(total)
                .imported(imported)
                .duplicates(duplicates)
                .invalid(invalid)
                .duplicateRollNumbers(duplicateRollNumbers)
                .invalidRows(invalidRows)
                .message(msg)
                .build();
    }

    private String findColumnValue(String[] row, Map<String, Integer> colMap, String... keys) {
        for (String k : keys) {
            Integer idx = colMap.get(k);
            if (idx != null && idx < row.length && row[idx] != null && !row[idx].trim().isBlank()) {
                return row[idx].trim();
            }
        }
        return "";
    }

    private PlayerRole parsePlayerRole(String rawRole) {
        if (rawRole == null) return null;
        String normalized = rawRole.trim().toUpperCase().replaceAll("[ _-]", "");
        switch (normalized) {
            case "BATSMAN":
            case "BAT":
            case "BATSMEN":
                return PlayerRole.BATSMAN;
            case "BOWLER":
            case "BOWL":
                return PlayerRole.BOWLER;
            case "ALLROUNDER":
            case "ALLROUND":
            case "ALL":
                return PlayerRole.ALL_ROUNDER;
            case "WICKETKEEPER":
            case "WK":
            case "KEEPER":
                return PlayerRole.WICKET_KEEPER;
            default:
                return null;
        }
    }
}

