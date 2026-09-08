package com.hostel.auction.dto;

import com.hostel.auction.entity.Player;
import com.hostel.auction.entity.PlayerRole;
import com.hostel.auction.entity.PlayerStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlayerResponse {
    private Long id;
    private String name;
    private String rollNumber;
    private String year;
    private PlayerRole role;
    private Integer basePrice;
    private PlayerStatus status;
    private Long teamId;
    private String teamName;
    private Integer soldPrice;

    public static PlayerResponse fromEntity(Player player) {
        if (player == null) return null;
        return PlayerResponse.builder()
                .id(player.getId())
                .name(player.getName())
                .rollNumber(player.getRollNumber())
                .year(player.getYear())
                .role(player.getRole())
                .basePrice(player.getBasePrice())
                .status(player.getStatus())
                .teamId(player.getTeam() != null ? player.getTeam().getId() : null)
                .teamName(player.getTeam() != null ? player.getTeam().getName() : null)
                .soldPrice(player.getSoldPrice())
                .build();
    }
}
