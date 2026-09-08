package com.hostel.auction.config;

import com.hostel.auction.entity.*;
import com.hostel.auction.repository.AuctionRepository;
import com.hostel.auction.repository.AuctionRoundRepository;
import com.hostel.auction.repository.BidRepository;
import com.hostel.auction.repository.PlayerRepository;
import com.hostel.auction.repository.TeamRepository;
import com.hostel.auction.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;
    private final AuctionRoundRepository roundRepository;
    private final AuctionRepository auctionRepository;
    private final BidRepository bidRepository;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Initializing auction database...");

        // 1. Seed Round 1 if none exists
        if (roundRepository.count() == 0) {
            roundRepository.save(AuctionRound.builder()
                    .roundNumber(1)
                    .status(RoundStatus.ACTIVE)
                    .startedAt(LocalDateTime.now())
                    .build());
            log.info("Seeded Round 1");
        }

        // 2. Seed Teams if none exist
        if (teamRepository.count() == 0) {
            List<Team> teams = List.of(
                    Team.builder().name("Team Tigers").captainName("Captain 1").initialPurse(1000).currentPurse(1000)
                            .logoUrl("https://api.dicebear.com/7.x/identicon/svg?seed=tigers").build(),
                    Team.builder().name("Team Lions").captainName("Captain 2").initialPurse(1000).currentPurse(1000)
                            .logoUrl("https://api.dicebear.com/7.x/identicon/svg?seed=lions").build(),
                    Team.builder().name("Team Warriors").captainName("Captain 3").initialPurse(1000).currentPurse(1000)
                            .logoUrl("https://api.dicebear.com/7.x/identicon/svg?seed=warriors").build(),
                    Team.builder().name("Team Kings").captainName("Captain 4").initialPurse(1000).currentPurse(1000)
                            .logoUrl("https://api.dicebear.com/7.x/identicon/svg?seed=kings").build(),
                    Team.builder().name("Team Strikers").captainName("Captain 5").initialPurse(1000).currentPurse(1000)
                            .logoUrl("https://api.dicebear.com/7.x/identicon/svg?seed=strikers").build(),
                    Team.builder().name("Team Challengers").captainName("Captain 6").initialPurse(1000).currentPurse(1000)
                            .logoUrl("https://api.dicebear.com/7.x/identicon/svg?seed=challengers").build()
            );
            teamRepository.saveAll(teams);
            log.info("Seeded 6 Teams with 1000 purse each");
        }

        // 3. Seed Users (1 Admin + 6 Captains)
        if (userRepository.count() == 0) {
            Team tigers = teamRepository.findByName("Team Tigers").orElse(null);
            Team lions = teamRepository.findByName("Team Lions").orElse(null);
            Team warriors = teamRepository.findByName("Team Warriors").orElse(null);
            Team kings = teamRepository.findByName("Team Kings").orElse(null);
            Team strikers = teamRepository.findByName("Team Strikers").orElse(null);
            Team challengers = teamRepository.findByName("Team Challengers").orElse(null);

            List<User> users = List.of(
                    User.builder()
                            .username("admin")
                            .password("Admin@123")
                            .displayName("Auction Administrator")
                            .userType(UserType.ADMIN)
                            .team(null)
                            .build(),
                    User.builder()
                            .username("captain1")
                            .password("Captain@101")
                            .displayName("Captain 1 (Tigers)")
                            .userType(UserType.CAPTAIN)
                            .team(tigers)
                            .build(),
                    User.builder()
                            .username("captain2")
                            .password("Captain@102")
                            .displayName("Captain 2 (Lions)")
                            .userType(UserType.CAPTAIN)
                            .team(lions)
                            .build(),
                    User.builder()
                            .username("captain3")
                            .password("Captain@103")
                            .displayName("Captain 3 (Warriors)")
                            .userType(UserType.CAPTAIN)
                            .team(warriors)
                            .build(),
                    User.builder()
                            .username("captain4")
                            .password("Captain@104")
                            .displayName("Captain 4 (Kings)")
                            .userType(UserType.CAPTAIN)
                            .team(kings)
                            .build(),
                    User.builder()
                            .username("captain5")
                            .password("Captain@105")
                            .displayName("Captain 5 (Strikers)")
                            .userType(UserType.CAPTAIN)
                            .team(strikers)
                            .build(),
                    User.builder()
                            .username("captain6")
                            .password("Captain@106")
                            .displayName("Captain 6 (Challengers)")
                            .userType(UserType.CAPTAIN)
                            .team(challengers)
                            .build()
            );
            userRepository.saveAll(users);
            log.info("Seeded 1 Admin and 6 Captain accounts");
        }

        // 4. Seed Players (Exact 10 official tournament participants with year-based pricing)
        // 2nd Year: ₹15, 3rd Year: ₹20, 4th Year: ₹20 (no 1st year in auction)
        List<Player> official10Players = List.of(
                Player.builder()
                        .name("Hardik Pandya")
                        .rollNumber("21MECH101")
                        .year("4th Year")
                        .role(PlayerRole.ALL_ROUNDER)
                        .basePrice(20)
                        .status(PlayerStatus.AVAILABLE)
                        .build(),
                Player.builder()
                        .name("Rishabh Pant")
                        .rollNumber("22CSE045")
                        .year("3rd Year")
                        .role(PlayerRole.WICKET_KEEPER)
                        .basePrice(20)
                        .status(PlayerStatus.AVAILABLE)
                        .build(),
                Player.builder()
                        .name("Kuldeep Yadav")
                        .rollNumber("23ECE019")
                        .year("2nd Year")
                        .role(PlayerRole.BOWLER)
                        .basePrice(15)
                        .status(PlayerStatus.AVAILABLE)
                        .build(),
                Player.builder()
                        .name("Yashasvi Jaiswal")
                        .rollNumber("24AIDS003")
                        .year("2nd Year")
                        .role(PlayerRole.BATSMAN)
                        .basePrice(15)
                        .status(PlayerStatus.AVAILABLE)
                        .build(),
                Player.builder()
                        .name("Axar Patel")
                        .rollNumber("22IT078")
                        .year("3rd Year")
                        .role(PlayerRole.ALL_ROUNDER)
                        .basePrice(20)
                        .status(PlayerStatus.AVAILABLE)
                        .build(),
                Player.builder()
                        .name("Mohammed Siraj")
                        .rollNumber("21CIVIL034")
                        .year("4th Year")
                        .role(PlayerRole.BOWLER)
                        .basePrice(20)
                        .status(PlayerStatus.AVAILABLE)
                        .build(),
                Player.builder()
                        .name("Shubman Gill")
                        .rollNumber("23CSE099")
                        .year("2nd Year")
                        .role(PlayerRole.BATSMAN)
                        .basePrice(15)
                        .status(PlayerStatus.AVAILABLE)
                        .build(),
                Player.builder()
                        .name("Sanju Samson")
                        .rollNumber("21ECE014")
                        .year("4th Year")
                        .role(PlayerRole.WICKET_KEEPER)
                        .basePrice(20)
                        .status(PlayerStatus.AVAILABLE)
                        .build(),
                Player.builder()
                        .name("Arshdeep Singh")
                        .rollNumber("24MECH011")
                        .year("2nd Year")
                        .role(PlayerRole.BOWLER)
                        .basePrice(15)
                        .status(PlayerStatus.AVAILABLE)
                        .build(),
                Player.builder()
                        .name("Rinku Singh")
                        .rollNumber("22AIDS056")
                        .year("3rd Year")
                        .role(PlayerRole.BATSMAN)
                        .basePrice(20)
                        .status(PlayerStatus.AVAILABLE)
                        .build()
        );

        // Check if legacy dummy players exist (e.g. 24CSE001) or if database has no players
        boolean hasLegacyPlayers = playerRepository.findByRollNumber("24CSE001").isPresent()
                || playerRepository.findByRollNumber("24ECE012").isPresent();

        if (hasLegacyPlayers || playerRepository.count() == 0) {
            log.info("Purging legacy dummy players and seeding exactly the 10 official tournament players...");
            bidRepository.deleteAll();
            auctionRepository.deleteAll();
            playerRepository.deleteAll();

            // Reset team purse balances to clean initial state
            List<Team> teams = teamRepository.findAll();
            for (Team t : teams) {
                t.setCurrentPurse(t.getInitialPurse());
                t.setPlayers(new ArrayList<>());
            }
            teamRepository.saveAll(teams);

            playerRepository.saveAll(official10Players);
            log.info("Seeded exactly 10 official tournament players!");
        }

        // Ensure all existing players match the official year-based base prices
        playerRepository.findAll().forEach(p -> {
            int targetBp = com.hostel.auction.service.PlayerService.getBasePriceForYear(p.getYear());
            if (p.getBasePrice() == null || p.getBasePrice() != targetBp) {
                p.setBasePrice(targetBp);
                playerRepository.save(p);
            }
        });

        log.info("Database initialization complete!");
    }
}
