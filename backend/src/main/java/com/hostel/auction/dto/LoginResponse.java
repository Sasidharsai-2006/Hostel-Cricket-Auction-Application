package com.hostel.auction.dto;

import com.hostel.auction.entity.UserType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {
    private String username;
    private String displayName;
    private UserType userType;
    private Long teamId;
    private String teamName;
    private Integer initialPurse;
    private Integer currentPurse;
    private String message;
}
