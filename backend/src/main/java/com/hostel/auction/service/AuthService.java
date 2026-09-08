package com.hostel.auction.service;

import com.hostel.auction.dto.LoginRequest;
import com.hostel.auction.dto.LoginResponse;
import com.hostel.auction.entity.User;
import com.hostel.auction.entity.UserType;
import com.hostel.auction.exception.AuctionException;
import com.hostel.auction.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;

    public LoginResponse authenticate(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername().trim())
                .orElseThrow(() -> new AuctionException("INVALID_CREDENTIALS", "Invalid username or password"));

        if (!user.getPassword().equals(request.getPassword().trim())) {
            throw new AuctionException("INVALID_CREDENTIALS", "Invalid username or password");
        }

        Long teamId = null;
        String teamName = null;
        Integer initialPurse = null;
        Integer currentPurse = null;

        if (user.getTeam() != null) {
            teamId = user.getTeam().getId();
            teamName = user.getTeam().getName();
            initialPurse = user.getTeam().getInitialPurse();
            currentPurse = user.getTeam().getCurrentPurse();
        }

        return LoginResponse.builder()
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .userType(user.getUserType())
                .teamId(teamId)
                .teamName(teamName)
                .initialPurse(initialPurse)
                .currentPurse(currentPurse)
                .message("Login successful")
                .build();
    }

    public void validateCaptainForTeam(String captainUsername, Long teamId) {
        if (captainUsername == null || captainUsername.isBlank()) {
            throw new AuctionException("INVALID_CAPTAIN", "Captain username is required for bidding");
        }

        User user = userRepository.findByUsername(captainUsername.trim())
                .orElseThrow(() -> new AuctionException("INVALID_CAPTAIN", "Captain account not found: " + captainUsername));

        if (user.getUserType() != UserType.CAPTAIN) {
            throw new AuctionException("INVALID_CAPTAIN", "Only captains can place bids");
        }

        if (user.getTeam() == null || !user.getTeam().getId().equals(teamId)) {
            throw new AuctionException("INVALID_CAPTAIN", "Captain " + captainUsername + " is not authorized to bid for team ID " + teamId);
        }
    }
}
