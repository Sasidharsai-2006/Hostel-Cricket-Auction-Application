package com.hostel.auction.dto;

import com.hostel.auction.entity.PlayerRole;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlayerRequest {
    @NotBlank(message = "Player name is required")
    private String name;

    @NotBlank(message = "Roll number is required")
    private String rollNumber;

    @NotBlank(message = "Year is required")
    private String year;

    @NotNull(message = "Player Style / Role is required")
    private PlayerRole role;

    @Min(value = 1, message = "Base price must be greater than 0")
    @Builder.Default
    private Integer basePrice = 50;
}
