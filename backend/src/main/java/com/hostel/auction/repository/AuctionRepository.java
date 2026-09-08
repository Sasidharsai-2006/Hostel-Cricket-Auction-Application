package com.hostel.auction.repository;

import com.hostel.auction.entity.Auction;
import com.hostel.auction.entity.AuctionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AuctionRepository extends JpaRepository<Auction, Long> {
    Optional<Auction> findFirstByStatusInOrderByStartedAtDesc(List<AuctionStatus> statuses);
    Optional<Auction> findFirstByStatusOrderByStartedAtDesc(AuctionStatus status);
    List<Auction> findAllByOrderByStartedAtDesc();
    Optional<Auction> findTopByStatusOrderByEndedAtDesc(AuctionStatus status);

    boolean existsByPlayerIdAndRoundRoundNumber(Long playerId, Integer roundNumber);
    boolean existsByPlayerIdAndRoundRoundNumberAndStatus(Long playerId, Integer roundNumber, AuctionStatus status);
    boolean existsByPlayerIdAndRoundRoundNumberAndStatusIn(Long playerId, Integer roundNumber, List<AuctionStatus> statuses);
    boolean existsByPlayerIdAndStatus(Long playerId, AuctionStatus status);
    List<Auction> findByPlayerId(Long playerId);
}
