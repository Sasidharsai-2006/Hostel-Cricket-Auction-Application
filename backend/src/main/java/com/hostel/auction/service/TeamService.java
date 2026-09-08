package com.hostel.auction.service;

import com.hostel.auction.dto.TeamSummaryResponse;
import com.hostel.auction.entity.Team;
import com.hostel.auction.exception.AuctionException;
import com.hostel.auction.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;

    @Transactional(readOnly = true)
    public List<TeamSummaryResponse> getAllTeams() {
        return teamRepository.findAll().stream()
                .map(TeamSummaryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TeamSummaryResponse getTeamById(Long id) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new AuctionException("TEAM_NOT_FOUND", "Team not found with ID: " + id));
        return TeamSummaryResponse.fromEntity(team);
    }

    @Transactional(readOnly = true)
    public Team getTeamEntity(Long id) {
        return teamRepository.findById(id)
                .orElseThrow(() -> new AuctionException("TEAM_NOT_FOUND", "Team not found with ID: " + id));
    }
}
