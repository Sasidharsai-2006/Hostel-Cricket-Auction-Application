package com.hostel.auction.repository;

import com.hostel.auction.entity.AuctionRound;
import com.hostel.auction.entity.RoundStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AuctionRoundRepository extends JpaRepository<AuctionRound, Long> {
    Optional<AuctionRound> findFirstByStatusOrderByRoundNumberAsc(RoundStatus status);
    Optional<AuctionRound> findByRoundNumber(Integer roundNumber);
}
