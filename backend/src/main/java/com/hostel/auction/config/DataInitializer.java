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
                    Team.builder().name("Team Surya").captainName("Surya").initialPurse(1000).currentPurse(1000)
                            .logoUrl("https://api.dicebear.com/7.x/identicon/svg?seed=surya").build(),
                    Team.builder().name("Team Durga").captainName("Durga").initialPurse(1000).currentPurse(1000)
                            .logoUrl("https://api.dicebear.com/7.x/identicon/svg?seed=durga").build(),
                    Team.builder().name("Team Venky").captainName("Venky").initialPurse(1000).currentPurse(1000)
                            .logoUrl("https://api.dicebear.com/7.x/identicon/svg?seed=venky").build(),
                    Team.builder().name("Team Ranjith").captainName("Ranjith").initialPurse(1000).currentPurse(1000)
                            .logoUrl("https://api.dicebear.com/7.x/identicon/svg?seed=ranjith").build(),
                    Team.builder().name("Team Chitti").captainName("Chitti").initialPurse(1000).currentPurse(1000)
                            .logoUrl("https://api.dicebear.com/7.x/identicon/svg?seed=chitti").build(),
                    Team.builder().name("Team Chandu").captainName("Chandu").initialPurse(1000).currentPurse(1000)
                            .logoUrl("https://api.dicebear.com/7.x/identicon/svg?seed=chandu").build()
            );
            teamRepository.saveAll(teams);
            log.info("Seeded 6 Teams (Surya, Durga, Venky, Ranjith, Chitti, Chandu) with 1000 purse each");
        }

        // 3. Seed Users (1 Admin + 6 Captains)
        if (userRepository.count() == 0) {
            Team surya = teamRepository.findByName("Team Surya").orElse(null);
            Team durga = teamRepository.findByName("Team Durga").orElse(null);
            Team venky = teamRepository.findByName("Team Venky").orElse(null);
            Team ranjith = teamRepository.findByName("Team Ranjith").orElse(null);
            Team chitti = teamRepository.findByName("Team Chitti").orElse(null);
            Team chandu = teamRepository.findByName("Team Chandu").orElse(null);

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
                            .displayName("Captain 1 (Surya)")
                            .userType(UserType.CAPTAIN)
                            .team(surya)
                            .build(),
                    User.builder()
                            .username("captain2")
                            .password("Captain@102")
                            .displayName("Captain 2 (Durga)")
                            .userType(UserType.CAPTAIN)
                            .team(durga)
                            .build(),
                    User.builder()
                            .username("captain3")
                            .password("Captain@103")
                            .displayName("Captain 3 (Venky)")
                            .userType(UserType.CAPTAIN)
                            .team(venky)
                            .build(),
                    User.builder()
                            .username("captain4")
                            .password("Captain@104")
                            .displayName("Captain 4 (Ranjith)")
                            .userType(UserType.CAPTAIN)
                            .team(ranjith)
                            .build(),
                    User.builder()
                            .username("captain5")
                            .password("Captain@105")
                            .displayName("Captain 5 (Chitti)")
                            .userType(UserType.CAPTAIN)
                            .team(chitti)
                            .build(),
                    User.builder()
                            .username("captain6")
                            .password("Captain@106")
                            .displayName("Captain 6 (Chandu)")
                            .userType(UserType.CAPTAIN)
                            .team(chandu)
                            .build()
            );
            userRepository.saveAll(users);
            log.info("Seeded 1 Admin and 6 Captain accounts");
        }

        // Automatic migration: Ensure existing database records match new official team names
        List<Team> existingTeams = teamRepository.findAll();
        if (!existingTeams.isEmpty()) {
            String[][] officialTeams = {
                    {"Team Surya", "Surya", "surya"},
                    {"Team Durga", "Durga", "durga"},
                    {"Team Venky", "Venky", "venky"},
                    {"Team Ranjith", "Ranjith", "ranjith"},
                    {"Team Chitti", "Chitti", "chitti"},
                    {"Team Chandu", "Chandu", "chandu"}
            };
            for (int i = 0; i < 6 && i < existingTeams.size(); i++) {
                Team t = existingTeams.get(i);
                if (!t.getName().equals(officialTeams[i][0]) || !t.getCaptainName().equals(officialTeams[i][1])) {
                    t.setName(officialTeams[i][0]);
                    t.setCaptainName(officialTeams[i][1]);
                    t.setLogoUrl("https://api.dicebear.com/7.x/identicon/svg?seed=" + officialTeams[i][2]);
                    teamRepository.save(t);
                }
            }
        }

        String[] capUsernames = {"captain1", "captain2", "captain3", "captain4", "captain5", "captain6"};
        String[] capNames = {"Surya", "Durga", "Venky", "Ranjith", "Chitti", "Chandu"};
        for (int i = 0; i < 6; i++) {
            final int idx = i;
            userRepository.findByUsername(capUsernames[i]).ifPresent(u -> {
                String targetDisplay = "Captain " + (idx + 1) + " (" + capNames[idx] + ")";
                if (!targetDisplay.equals(u.getDisplayName())) {
                    u.setDisplayName(targetDisplay);
                    userRepository.save(u);
                }
            });
        }

        // 4. Seed Players (Exact 10 official tournament participants with year-based pricing)
        // 1st Year: ₹10, 2nd Year: ₹15, 3rd Year: ₹20, 4th Year: ₹20
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
