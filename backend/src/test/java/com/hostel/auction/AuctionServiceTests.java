package com.hostel.auction;

import com.hostel.auction.dto.AuctionStateResponse;
import com.hostel.auction.dto.BidRequest;
import com.hostel.auction.dto.PlayerResponse;
import com.hostel.auction.entity.*;
import com.hostel.auction.exception.AuctionException;
import com.hostel.auction.repository.AuctionRepository;
import com.hostel.auction.repository.PlayerRepository;
import com.hostel.auction.repository.TeamRepository;
import com.hostel.auction.dto.ImportResultResponse;
import com.hostel.auction.service.AuctionService;
import com.hostel.auction.service.PlayerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class AuctionServiceTests {

    @Autowired
    private AuctionService auctionService;

    @Autowired
    private PlayerService playerService;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private AuctionRepository auctionRepository;

    private Team teamTigers;
    private Team teamLions;
    private Player testPlayer;

    @BeforeEach
    void setUp() {
        auctionRepository.findAll().forEach(a -> {
            if (a.getStatus() == AuctionStatus.ACTIVE || a.getStatus() == AuctionStatus.PAUSED) {
                a.setStatus(AuctionStatus.UNSOLD);
                auctionRepository.save(a);
            }
        });

        teamTigers = teamRepository.findByName("Team Tigers").orElseThrow();
        teamTigers.setCurrentPurse(1000);
        teamRepository.save(teamTigers);

        teamLions = teamRepository.findByName("Team Lions").orElseThrow();
        teamLions.setCurrentPurse(1000);
        teamRepository.save(teamLions);

        // Always ensure Round 1 is active for tests
        auctionService.setRound(1);

        // Fresh test player
        testPlayer = playerRepository.save(Player.builder()
                .name("Unit Test Star")
                .rollNumber("TEST_ROLL_" + System.currentTimeMillis())
                .year("3rd Year")
                .role(PlayerRole.ALL_ROUNDER)
                .basePrice(20)
                .status(PlayerStatus.AVAILABLE)
                .build());
    }

    @Test
    @DisplayName("1. Team starts with exactly 1000 points")
    void testTeamInitialPurse() {
        assertEquals(1000, teamTigers.getInitialPurse());
        assertEquals(1000, teamTigers.getCurrentPurse());
    }

    @Test
    @DisplayName("2. Valid bid succeeds and updates highest bidder")
    void testValidBidSucceeds() {
        AuctionStateResponse state = auctionService.startAuction(testPlayer.getId(), 50);
        assertEquals(AuctionStatus.ACTIVE, state.getStatus());
        assertEquals(50, state.getCurrentPrice());

        BidRequest bid = BidRequest.builder()
                .captainUsername("captain1")
                .teamId(teamTigers.getId())
                .amount(60)
                .build();

        AuctionStateResponse updated = auctionService.placeBid(bid);
        assertEquals(60, updated.getCurrentPrice());
        assertEquals(teamTigers.getId(), updated.getHighestBidderTeamId());
    }

    @Test
    @DisplayName("3. Lower bid is rejected")
    void testLowerBidRejected() {
        auctionService.startAuction(testPlayer.getId(), 50);

        // Place initial bid of 60
        auctionService.placeBid(BidRequest.builder()
                .captainUsername("captain1")
                .teamId(teamTigers.getId())
                .amount(60)
                .build());

        // Attempt lower bid of 55
        BidRequest lowerBid = BidRequest.builder()
                .captainUsername("captain2")
                .teamId(teamLions.getId())
                .amount(55)
                .build();

        AuctionException ex = assertThrows(AuctionException.class, () -> auctionService.placeBid(lowerBid));
        assertEquals("INVALID_BID", ex.getErrorCode());
    }

    @Test
    @DisplayName("4. Equal bid is rejected")
    void testEqualBidRejected() {
        auctionService.startAuction(testPlayer.getId(), 50);

        auctionService.placeBid(BidRequest.builder()
                .captainUsername("captain1")
                .teamId(teamTigers.getId())
                .amount(80)
                .build());

        BidRequest equalBid = BidRequest.builder()
                .captainUsername("captain2")
                .teamId(teamLions.getId())
                .amount(80)
                .build();

        AuctionException ex = assertThrows(AuctionException.class, () -> auctionService.placeBid(equalBid));
        assertEquals("INVALID_BID", ex.getErrorCode());
    }

    @Test
    @DisplayName("5. Insufficient purse bid is rejected")
    void testInsufficientPurseBidRejected() {
        auctionService.startAuction(testPlayer.getId(), 50);

        BidRequest hugeBid = BidRequest.builder()
                .captainUsername("captain1")
                .teamId(teamTigers.getId())
                .amount(1200) // 1200 > 1000
                .build();

        AuctionException ex = assertThrows(AuctionException.class, () -> auctionService.placeBid(hugeBid));
        assertEquals("INSUFFICIENT_PURSE", ex.getErrorCode());
    }

    @Test
    @DisplayName("6. Purse is NOT deducted on intermediate bids")
    void testPurseNotDeductedDuringBidding() {
        auctionService.startAuction(testPlayer.getId(), 50);

        auctionService.placeBid(BidRequest.builder()
                .captainUsername("captain1")
                .teamId(teamTigers.getId())
                .amount(100)
                .build());

        // Reload team from DB
        Team reloaded = teamRepository.findById(teamTigers.getId()).orElseThrow();
        assertEquals(1000, reloaded.getCurrentPurse(), "Purse must remain 1000 during active bidding!");
    }

    @Test
    @DisplayName("7. SOLD atomically deducts purse and assigns player")
    void testSoldFlow() {
        AuctionStateResponse auction = auctionService.startAuction(testPlayer.getId(), 50);

        auctionService.placeBid(BidRequest.builder()
                .captainUsername("captain1")
                .teamId(teamTigers.getId())
                .amount(250)
                .build());

        AuctionStateResponse soldState = auctionService.markSold(auction.getAuctionId());
        assertEquals(AuctionStatus.SOLD, soldState.getStatus());

        // Verify Player
        Player playerDb = playerRepository.findById(testPlayer.getId()).orElseThrow();
        assertEquals(PlayerStatus.SOLD, playerDb.getStatus());
        assertEquals(250, playerDb.getSoldPrice());
        assertNotNull(playerDb.getTeam());
        assertEquals(teamTigers.getId(), playerDb.getTeam().getId());

        // Verify Team Purse deducted by 250
        Team teamDb = teamRepository.findById(teamTigers.getId()).orElseThrow();
        assertEquals(750, teamDb.getCurrentPurse());
    }

    @Test
    @DisplayName("8. Sold player cannot be auctioned again")
    void testSoldPlayerCannotBeAuctionedAgain() {
        AuctionStateResponse auction = auctionService.startAuction(testPlayer.getId(), 50);
        auctionService.placeBid(BidRequest.builder()
                .captainUsername("captain1")
                .teamId(teamTigers.getId())
                .amount(100)
                .build());
        auctionService.markSold(auction.getAuctionId());

        AuctionException ex = assertThrows(AuctionException.class, () ->
                auctionService.startAuction(testPlayer.getId(), 50));
        assertEquals("PLAYER_ALREADY_SOLD", ex.getErrorCode());
    }

    @Test
    @DisplayName("9. UNSOLD marks player unsold and keeps purse intact")
    void testUnsoldFlow() {
        AuctionStateResponse auction = auctionService.startAuction(testPlayer.getId(), 50);
        auctionService.markUnsold(auction.getAuctionId());

        Player playerDb = playerRepository.findById(testPlayer.getId()).orElseThrow();
        assertEquals(PlayerStatus.UNSOLD, playerDb.getStatus());
        assertNull(playerDb.getTeam());
        assertNull(playerDb.getSoldPrice());

        Team teamDb = teamRepository.findById(teamTigers.getId()).orElseThrow();
        assertEquals(1000, teamDb.getCurrentPurse());
    }

    @Test
    @DisplayName("10. Unsold player can return in round 2, but sold player cannot")
    void testRoundEligibility() {
        // Player goes unsold in round 1
        AuctionStateResponse auction = auctionService.startAuction(testPlayer.getId(), 50);
        auctionService.markUnsold(auction.getAuctionId());

        // In round 1, player should NOT be eligible anymore
        assertFalse(auctionService.isPlayerEligibleForRound(testPlayer, 1));

        // In round 2, player SHOULD be eligible
        assertTrue(auctionService.isPlayerEligibleForRound(testPlayer, 2));
        PlayerResponse nextRound2 = auctionService.getNextEligiblePlayer(2);
        assertNotNull(nextRound2);
        assertEquals(testPlayer.getId(), nextRound2.getId());

        // Move to round 2 and sell the player
        auctionService.setRound(2);
        AuctionStateResponse round2Auction = auctionService.startAuction(testPlayer.getId(), 50);
        auctionService.placeBid(BidRequest.builder()
                .captainUsername("captain1")
                .teamId(teamTigers.getId())
                .amount(100)
                .build());
        auctionService.markSold(round2Auction.getAuctionId());

        // Sold player must never be eligible in round 2 or any future round
        assertFalse(auctionService.isPlayerEligibleForRound(testPlayer, 2));
        assertFalse(auctionService.isPlayerEligibleForRound(testPlayer, 3));
        PlayerResponse afterSold = auctionService.getNextEligiblePlayer(2);
        if (afterSold != null) {
            assertNotEquals(testPlayer.getId(), afterSold.getId());
        }
    }

    @Test
    @DisplayName("11. Undo restores team purse and removes player from team")
    void testUndoLastSale() {
        AuctionStateResponse auction = auctionService.startAuction(testPlayer.getId(), 50);
        auctionService.placeBid(BidRequest.builder()
                .captainUsername("captain1")
                .teamId(teamTigers.getId())
                .amount(200)
                .build());
        auctionService.markSold(auction.getAuctionId());

        // Ensure sold
        Team TigersSold = teamRepository.findById(teamTigers.getId()).orElseThrow();
        assertEquals(800, TigersSold.getCurrentPurse());

        // Perform UNDO
        AuctionStateResponse undoState = auctionService.undoLastSale();
        assertNotNull(undoState);

        // Check restored purse
        Team tigersRestored = teamRepository.findById(teamTigers.getId()).orElseThrow();
        assertEquals(1000, tigersRestored.getCurrentPurse());

        // Check player status restored
        Player playerRestored = playerRepository.findById(testPlayer.getId()).orElseThrow();
        assertEquals(PlayerStatus.AVAILABLE, playerRestored.getStatus());
        assertNull(playerRestored.getTeam());
        assertNull(playerRestored.getSoldPrice());
    }

    @Test
    @DisplayName("12. Captain cannot place bids on behalf of another team")
    void testCaptainCannotBidForOtherTeam() {
        auctionService.startAuction(testPlayer.getId(), 50);

        BidRequest invalidBid = BidRequest.builder()
                .captainUsername("captain1") // captain1 owns Team Tigers
                .teamId(teamLions.getId())   // attempting to bid for Team Lions
                .amount(100)
                .build();

        AuctionException ex = assertThrows(AuctionException.class, () -> auctionService.placeBid(invalidBid));
        assertEquals("INVALID_CAPTAIN", ex.getErrorCode());
    }

    @Test
    @DisplayName("13. Strict multi-round rules: Once per round, Unsold moves to next round, Sold never returns")
    void testStrictMultiRoundProgressionRules() {
        // Create Rahul, Arjun, Vijay
        Player rahul = playerRepository.save(Player.builder()
                .name("Rahul RoundTest")
                .rollNumber("RAHUL_" + System.currentTimeMillis())
                .year("2nd Year")
                .role(PlayerRole.BATSMAN)
                .basePrice(50)
                .status(PlayerStatus.AVAILABLE)
                .build());

        Player arjun = playerRepository.save(Player.builder()
                .name("Arjun RoundTest")
                .rollNumber("ARJUN_" + System.currentTimeMillis())
                .year("3rd Year")
                .role(PlayerRole.BOWLER)
                .basePrice(40)
                .status(PlayerStatus.AVAILABLE)
                .build());

        Player vijay = playerRepository.save(Player.builder()
                .name("Vijay RoundTest")
                .rollNumber("VIJAY_" + System.currentTimeMillis())
                .year("2nd Year")
                .role(PlayerRole.ALL_ROUNDER)
                .basePrice(30)
                .status(PlayerStatus.AVAILABLE)
                .build());

        // Ensure Round 1 is active
        auctionService.setRound(1);

        // --- ROUND 1 ---
        // 1. Rahul is auctioned and SOLD in Round 1
        AuctionStateResponse rahulR1 = auctionService.startAuction(rahul.getId(), 50);
        auctionService.placeBid(BidRequest.builder()
                .captainUsername("captain1")
                .teamId(teamTigers.getId())
                .amount(300)
                .build());
        auctionService.markSold(rahulR1.getAuctionId());

        // 2. Arjun is auctioned in Round 1 and goes UNSOLD
        AuctionStateResponse arjunR1 = auctionService.startAuction(arjun.getId(), 40);
        auctionService.markUnsold(arjunR1.getAuctionId());

        // Rule Check: Arjun cannot appear again in Round 1!
        AuctionException arjunR1Again = assertThrows(AuctionException.class, () ->
                auctionService.startAuction(arjun.getId(), 40));
        assertEquals("PLAYER_ALREADY_APPEARED_IN_ROUND", arjunR1Again.getErrorCode());

        // 3. Vijay is auctioned in Round 1 and goes UNSOLD
        AuctionStateResponse vijayR1 = auctionService.startAuction(vijay.getId(), 30);
        auctionService.markUnsold(vijayR1.getAuctionId());

        // Rule Check: Vijay cannot appear again in Round 1!
        AuctionException vijayR1Again = assertThrows(AuctionException.class, () ->
                auctionService.startAuction(vijay.getId(), 30));
        assertEquals("PLAYER_ALREADY_APPEARED_IN_ROUND", vijayR1Again.getErrorCode());

        // Rule Check: Rahul is SOLD, cannot appear in Round 1
        AuctionException rahulR1Again = assertThrows(AuctionException.class, () ->
                auctionService.startAuction(rahul.getId(), 50));
        assertEquals("PLAYER_ALREADY_SOLD", rahulR1Again.getErrorCode());

        // --- MOVE TO ROUND 2 ---
        auctionService.setRound(2);

        // Rule Check: Rahul (sold) cannot appear in Round 2
        AuctionException rahulR2 = assertThrows(AuctionException.class, () ->
                auctionService.startAuction(rahul.getId(), 50));
        assertEquals("PLAYER_ALREADY_SOLD", rahulR2.getErrorCode());

        // Arjun (unsold in R1) is eligible in Round 2!
        assertTrue(auctionService.isPlayerEligibleForRound(arjun, 2));

        // Vijay (unsold in R1) is eligible in Round 2!
        assertTrue(auctionService.isPlayerEligibleForRound(vijay, 2));

        // 4. Arjun is auctioned in Round 2 and SOLD to Team Lions
        AuctionStateResponse arjunR2 = auctionService.startAuction(arjun.getId(), 40);
        auctionService.placeBid(BidRequest.builder()
                .captainUsername("captain2")
                .teamId(teamLions.getId())
                .amount(200)
                .build());
        auctionService.markSold(arjunR2.getAuctionId());

        // 5. Vijay is auctioned in Round 2 and goes UNSOLD
        AuctionStateResponse vijayR2 = auctionService.startAuction(vijay.getId(), 30);
        auctionService.markUnsold(vijayR2.getAuctionId());

        // Rule Check: Vijay cannot appear again in Round 2!
        AuctionException vijayR2Again = assertThrows(AuctionException.class, () ->
                auctionService.startAuction(vijay.getId(), 30));
        assertEquals("PLAYER_ALREADY_APPEARED_IN_ROUND", vijayR2Again.getErrorCode());

        // Rule Check: Arjun (now sold) cannot appear in Round 2
        AuctionException arjunR2Again = assertThrows(AuctionException.class, () ->
                auctionService.startAuction(arjun.getId(), 40));
        assertEquals("PLAYER_ALREADY_SOLD", arjunR2Again.getErrorCode());

        // --- MOVE TO ROUND 3 ---
        auctionService.setRound(3);

        // Rule Check: Rahul and Arjun are SOLD, can never appear in Round 3
        assertFalse(auctionService.isPlayerEligibleForRound(rahul, 3));
        assertFalse(auctionService.isPlayerEligibleForRound(arjun, 3));

        // Vijay (unsold in R2) is eligible again in Round 3!
        assertTrue(auctionService.isPlayerEligibleForRound(vijay, 3));

        // Vijay can be auctioned in Round 3!
        AuctionStateResponse vijayR3 = auctionService.startAuction(vijay.getId(), 30);
        assertNotNull(vijayR3);
        assertEquals(AuctionStatus.ACTIVE, vijayR3.getStatus());
        assertEquals(vijay.getId(), vijayR3.getPlayer().getId());
    }

    @Test
    @DisplayName("Google Form CSV Import enforces year-based pricing, skips 1st year, and interleaves")
    void testGoogleFormCsvImportWith4Fields() {
        String csvContent = "Roll Number,Name,Year,Player Style\n" +
                "99TEST001,Form Player One,1st Year,BATSMAN\n" +
                "99TEST002,Form Player Two,2nd Year,BOWLER\n" +
                "99TEST003,Form Player Three,3rd Year,ALL_ROUNDER\n" +
                "99TEST004,Form Player Four,4th Year,WICKET_KEEPER\n";

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "google_form.csv",
                "text/csv",
                csvContent.getBytes(StandardCharsets.UTF_8)
        );

        // Import CSV
        ImportResultResponse result = playerService.importPlayersFromCsv(file);

        assertEquals(4, result.getTotal());
        assertEquals(3, result.getImported()); // 1st year skipped!
        assertEquals(0, result.getDuplicates());
        assertEquals(1, result.getInvalid()); // 1st year marked invalid/skipped

        // 1st Year player was NOT created
        assertTrue(playerRepository.findByRollNumber("99TEST001").isEmpty());

        // 2nd Year player has base price 15
        Player p2 = playerRepository.findByRollNumber("99TEST002").orElseThrow();
        assertEquals("Form Player Two", p2.getName());
        assertEquals("2nd Year", p2.getYear());
        assertEquals(PlayerRole.BOWLER, p2.getRole());
        assertEquals(15, p2.getBasePrice());
        assertEquals(PlayerStatus.AVAILABLE, p2.getStatus());

        // 3rd Year player has base price 20
        Player p3 = playerRepository.findByRollNumber("99TEST003").orElseThrow();
        assertEquals(20, p3.getBasePrice());

        // 4th Year player has base price 20
        Player p4 = playerRepository.findByRollNumber("99TEST004").orElseThrow();
        assertEquals(20, p4.getBasePrice());

        // Test updating base price by admin
        PlayerResponse updated = playerService.updateBasePrice(p2.getId(), 25);
        assertEquals(25, updated.getBasePrice());
        assertEquals(25, playerRepository.findById(p2.getId()).orElseThrow().getBasePrice());
    }
}
