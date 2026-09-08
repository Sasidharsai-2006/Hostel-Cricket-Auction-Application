package com.hostel.auction.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionReportResponse {
    private int totalPlayers;
    private int soldPlayers;
    private int unsoldPlayers;
    private int availablePlayers;
    private int totalPointsSpent;
    private double averagePlayerPrice;
    private int highestPlayerPrice;
    private int lowestPlayerPrice;
    private PlayerResponse highestPurchasedPlayer;
    @Builder.Default
    private List<TeamSummaryResponse> teams = new ArrayList<>();
    @Builder.Default
    private List<PlayerResponse> topPurchases = new ArrayList<>();
    @Builder.Default
    private List<PlayerResponse> unsoldList = new ArrayList<>();
}
