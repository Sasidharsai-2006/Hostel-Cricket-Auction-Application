package com.hostel.auction.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "auctions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Auction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "round_id", nullable = false)
    private AuctionRound round;

    @Column(name = "starting_price", nullable = false)
    private Integer startingPrice;

    @Column(name = "current_price", nullable = false)
    private Integer currentPrice;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "highest_team_id")
    private Team highestBidderTeam;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AuctionStatus status = AuctionStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "call_state", nullable = false)
    @Builder.Default
    private CallState callState = CallState.NORMAL;

    @Column(name = "timer_seconds")
    @Builder.Default
    private Integer timerSeconds = 10;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;
}
