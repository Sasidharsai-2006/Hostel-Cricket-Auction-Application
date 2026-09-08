package com.hostel.auction.controller;

import com.hostel.auction.dto.*;
import com.hostel.auction.entity.AuditLog;
import com.hostel.auction.entity.CallState;
import com.hostel.auction.service.AuctionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auction")
@RequiredArgsConstructor
public class AuctionController {

    private final AuctionService auctionService;

    @GetMapping("/current")
    public ResponseEntity<AuctionStateResponse> getCurrentAuction() {
        return ResponseEntity.ok(auctionService.getCurrentAuctionState());
    }

    @PostMapping("/start")
    public ResponseEntity<AuctionStateResponse> startAuction(@RequestBody Map<String, Object> payload) {
        Long playerId = Long.valueOf(payload.get("playerId").toString());
        Integer startingPrice = payload.containsKey("startingPrice") && payload.get("startingPrice") != null ?
                Integer.valueOf(payload.get("startingPrice").toString()) : null;
        return ResponseEntity.ok(auctionService.startAuction(playerId, startingPrice));
    }

    @PostMapping("/bid")
    public ResponseEntity<AuctionStateResponse> placeBid(@Valid @RequestBody BidRequest request) {
        return ResponseEntity.ok(auctionService.placeBid(request));
    }

    @PostMapping("/call-state")
    public ResponseEntity<AuctionStateResponse> setCallState(@RequestBody Map<String, Object> payload) {
        Long auctionId = Long.valueOf(payload.get("auctionId").toString());
        CallState callState = CallState.valueOf(payload.get("callState").toString());
        return ResponseEntity.ok(auctionService.setCallState(auctionId, callState));
    }

    @PostMapping("/pause")
    public ResponseEntity<AuctionStateResponse> pauseAuction(@RequestBody Map<String, Object> payload) {
        Long auctionId = Long.valueOf(payload.get("auctionId").toString());
        return ResponseEntity.ok(auctionService.pauseAuction(auctionId));
    }

    @PostMapping("/resume")
    public ResponseEntity<AuctionStateResponse> resumeAuction(@RequestBody Map<String, Object> payload) {
        Long auctionId = Long.valueOf(payload.get("auctionId").toString());
        return ResponseEntity.ok(auctionService.resumeAuction(auctionId));
    }

    @PostMapping("/sold")
    public ResponseEntity<AuctionStateResponse> markSold(@RequestBody Map<String, Object> payload) {
        Long auctionId = Long.valueOf(payload.get("auctionId").toString());
        return ResponseEntity.ok(auctionService.markSold(auctionId));
    }

    @PostMapping("/unsold")
    public ResponseEntity<AuctionStateResponse> markUnsold(@RequestBody Map<String, Object> payload) {
        Long auctionId = Long.valueOf(payload.get("auctionId").toString());
        return ResponseEntity.ok(auctionService.markUnsold(auctionId));
    }

    @PostMapping("/undo")
    public ResponseEntity<AuctionStateResponse> undoLastSale() {
        return ResponseEntity.ok(auctionService.undoLastSale());
    }

    @GetMapping("/eligible-players")
    public ResponseEntity<List<PlayerResponse>> getEligiblePlayers(@RequestParam(defaultValue = "1") Integer round) {
        return ResponseEntity.ok(auctionService.getEligiblePlayersForRound(round));
    }

    @GetMapping("/next-player")
    public ResponseEntity<PlayerResponse> getNextEligiblePlayer(@RequestParam(defaultValue = "1") Integer round) {
        return ResponseEntity.ok(auctionService.getNextEligiblePlayer(round));
    }

    @PostMapping("/round")
    public ResponseEntity<Map<String, Object>> setRound(@RequestBody Map<String, Integer> payload) {
        int roundNumber = payload.get("roundNumber");
        auctionService.setRound(roundNumber);
        return ResponseEntity.ok(Map.of("message", "Round updated to " + roundNumber, "roundNumber", roundNumber));
    }

    @GetMapping("/history")
    public ResponseEntity<List<AuctionStateResponse>> getAuctionHistory() {
        return ResponseEntity.ok(auctionService.getAuctionHistory());
    }

    @GetMapping("/analytics")
    public ResponseEntity<AuctionReportResponse> getAnalytics() {
        return ResponseEntity.ok(auctionService.getAnalytics());
    }

    @PostMapping("/reset")
    public ResponseEntity<Map<String, Object>> resetTournament(@RequestBody(required = false) Map<String, Boolean> payload) {
        boolean deletePlayers = payload != null && Boolean.TRUE.equals(payload.get("deletePlayers"));
        return ResponseEntity.ok(auctionService.resetTournament(deletePlayers));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLog>> getAuditLogs() {
        return ResponseEntity.ok(auctionService.getAuditLogs());
    }
}
