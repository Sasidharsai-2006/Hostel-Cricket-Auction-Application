package com.hostel.auction.dto;

import com.hostel.auction.entity.AuctionStatus;
import com.hostel.auction.entity.CallState;
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
public class AuctionStateResponse {
    private Long auctionId;
    private AuctionStatus status;
    private CallState callState;
    private Integer roundNumber;
    private PlayerResponse player;
    private Integer startingPrice;
    private Integer currentPrice;
    private Long highestBidderTeamId;
    private String highestBidderTeamName;
    private Integer timerSeconds;
    @Builder.Default
    private List<BidResponse> recentBids = new ArrayList<>();
    @Builder.Default
    private List<TeamSummaryResponse> teams = new ArrayList<>();
    private String eventType;
    private String message;
}
