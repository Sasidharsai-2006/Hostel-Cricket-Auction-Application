package com.hostel.auction.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BidRequest {
    private String captainUsername;

    @NotNull(message = "Team ID is required")
    private Long teamId;

    @NotNull(message = "Bid amount is required")
    @Min(value = 1, message = "Bid amount must be greater than 0")
    private Integer amount;
}
