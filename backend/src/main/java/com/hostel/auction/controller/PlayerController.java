package com.hostel.auction.controller;

import com.hostel.auction.dto.ImportResultResponse;
import com.hostel.auction.dto.PlayerRequest;
import com.hostel.auction.dto.PlayerResponse;
import com.hostel.auction.entity.PlayerRole;
import com.hostel.auction.entity.PlayerStatus;
import com.hostel.auction.service.PlayerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/players")
@RequiredArgsConstructor
public class PlayerController {

    private final PlayerService playerService;

    @GetMapping
    public ResponseEntity<List<PlayerResponse>> getPlayers(
            @RequestParam(required = false) PlayerStatus status,
            @RequestParam(required = false) PlayerRole role,
            @RequestParam(required = false) String year,
            @RequestParam(required = false) Long teamId,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(playerService.getPlayers(status, role, year, teamId, search));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlayerResponse> getPlayerById(@PathVariable Long id) {
        return ResponseEntity.ok(playerService.getPlayerById(id));
    }

    @PostMapping
    public ResponseEntity<PlayerResponse> createPlayer(@Valid @RequestBody PlayerRequest request) {
        return ResponseEntity.ok(playerService.createPlayer(request));
    }

    @PutMapping("/{id}/base-price")
    public ResponseEntity<PlayerResponse> updateBasePrice(
            @PathVariable Long id,
            @RequestBody Map<String, Integer> payload) {
        Integer newBasePrice = payload.get("basePrice");
        return ResponseEntity.ok(playerService.updateBasePrice(id, newBasePrice));
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImportResultResponse> importPlayers(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "defaultBasePrice", required = false) Integer defaultBasePrice,
            @RequestParam(value = "wipeExisting", defaultValue = "false") Boolean wipeExisting) {
        return ResponseEntity.ok(playerService.importPlayersFromCsv(file, defaultBasePrice, wipeExisting));
    }
}
