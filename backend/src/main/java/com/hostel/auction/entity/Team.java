package com.hostel.auction.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "teams")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(name = "captain_name")
    private String captainName;

    @Column(name = "initial_purse", nullable = false)
    @Builder.Default
    private Integer initialPurse = 1000;

    @Column(name = "current_purse", nullable = false)
    @Builder.Default
    private Integer currentPurse = 1000;

    @Column(name = "logo_url")
    private String logoUrl;

    @OneToMany(mappedBy = "team", fetch = FetchType.LAZY)
    @JsonIgnoreProperties("team")
    @Builder.Default
    private List<Player> players = new ArrayList<>();
}
