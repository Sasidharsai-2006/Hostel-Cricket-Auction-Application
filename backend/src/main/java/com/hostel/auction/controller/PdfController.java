package com.hostel.auction.controller;

import com.hostel.auction.service.PdfService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pdf")
@RequiredArgsConstructor
public class PdfController {

    private final PdfService pdfService;

    @GetMapping("/team/{teamId}")
    public ResponseEntity<byte[]> getTeamPdf(@PathVariable Long teamId) {
        byte[] pdfBytes = pdfService.generateTeamPdf(teamId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=team-" + teamId + "-squad.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    @GetMapping("/auction-report")
    public ResponseEntity<byte[]> getAuctionReportPdf() {
        byte[] pdfBytes = pdfService.generateAuctionReport();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=auction-full-report.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}
