package com.hostel.auction.repository;

import com.hostel.auction.entity.Player;
import com.hostel.auction.entity.PlayerRole;
import com.hostel.auction.entity.PlayerStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {

    Optional<Player> findByRollNumber(String rollNumber);

    List<Player> findByStatus(PlayerStatus status);

    List<Player> findByTeamId(Long teamId);

    @Query("SELECT p FROM Player p WHERE " +
            "(:status IS NULL OR p.status = :status) AND " +
            "(:role IS NULL OR p.role = :role) AND " +
            "(:year IS NULL OR p.year = :year) AND " +
            "(:teamId IS NULL OR (p.team IS NOT NULL AND p.team.id = :teamId)) AND " +
            "(:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.rollNumber) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Player> searchPlayers(@Param("status") PlayerStatus status,
                               @Param("role") PlayerRole role,
                               @Param("year") String year,
                               @Param("teamId") Long teamId,
                               @Param("search") String search);
}
