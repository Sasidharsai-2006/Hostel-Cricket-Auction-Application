package com.hostel.auction.dto;

import com.hostel.auction.entity.Team;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamSummaryResponse {
    private Long id;
    private String name;
    private String captainName;
    private Integer initialPurse;
    private Integer currentPurse;
    private Integer totalSpent;
    private Integer playerCount;
    private String logoUrl;
    @Builder.Default
    private List<PlayerResponse> players = new ArrayList<>();

    public static TeamSummaryResponse fromEntity(Team team) {
        if (team == null) return null;
        int spent = team.getInitialPurse() - team.getCurrentPurse();
        List<PlayerResponse> playerList = team.getPlayers() != null ?
                team.getPlayers().stream().map(PlayerResponse::fromEntity).collect(Collectors.toList()) :
                new ArrayList<>();
        return TeamSummaryResponse.builder()
                .id(team.getId())
                .name(team.getName())
                .captainName(team.getCaptainName())
                .initialPurse(team.getInitialPurse())
                .currentPurse(team.getCurrentPurse())
                .totalSpent(spent)
                .playerCount(playerList.size())
                .logoUrl(team.getLogoUrl())
                .players(playerList)
                .build();
    }
}
