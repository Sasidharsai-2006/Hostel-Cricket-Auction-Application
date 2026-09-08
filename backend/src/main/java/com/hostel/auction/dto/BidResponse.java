package com.hostel.auction.dto;

import com.hostel.auction.entity.Bid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BidResponse {
    private Long id;
    private Long auctionId;
    private Long teamId;
    private String teamName;
    private Integer amount;
    private LocalDateTime createdAt;

    public static BidResponse fromEntity(Bid bid) {
        if (bid == null) return null;
        return BidResponse.builder()
                .id(bid.getId())
                .auctionId(bid.getAuction() != null ? bid.getAuction().getId() : null)
                .teamId(bid.getTeam() != null ? bid.getTeam().getId() : null)
                .teamName(bid.getTeam() != null ? bid.getTeam().getName() : null)
                .amount(bid.getAmount())
                .createdAt(bid.getCreatedAt())
                .build();
    }
}
