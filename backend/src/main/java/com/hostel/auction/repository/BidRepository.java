package com.hostel.auction.repository;

import com.hostel.auction.entity.Bid;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BidRepository extends JpaRepository<Bid, Long> {
    List<Bid> findByAuctionIdOrderByCreatedAtDesc(Long auctionId);
    Optional<Bid> findTopByAuctionIdOrderByAmountDesc(Long auctionId);
    List<Bid> findAllByOrderByCreatedAtDesc();
}
