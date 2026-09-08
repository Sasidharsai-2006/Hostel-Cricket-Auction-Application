package com.hostel.auction.service;

import com.hostel.auction.dto.AuctionReportResponse;
import com.hostel.auction.dto.PlayerResponse;
import com.hostel.auction.dto.TeamSummaryResponse;
import com.hostel.auction.exception.AuctionException;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class PdfService {

    private final TeamService teamService;
    private final AuctionService auctionService;

    public byte[] generateTeamPdf(Long teamId) {
        TeamSummaryResponse team = teamService.getTeamById(teamId);
        if (team == null) {
            throw new AuctionException("TEAM_NOT_FOUND", "Team not found with ID: " + teamId);
        }

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, out);
            document.open();

            // Colors
            Color primaryDark = new Color(15, 23, 42); // slate 900
            Color gold = new Color(217, 119, 6);        // amber 600
            Color headerBg = new Color(30, 41, 59);    // slate 800
            Color altRow = new Color(248, 250, 252);   // slate 50

            // Fonts
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, gold);
            Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, primaryDark);
            Font metaFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.GRAY);
            Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, primaryDark);
            Font thFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE);
            Font tdFont = FontFactory.getFont(FontFactory.HELVETICA, 9, primaryDark);
            Font tdBoldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, primaryDark);

            // Title
            Paragraph title = new Paragraph("HOSTEL CRICKET AUCTION", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);

            Paragraph subtitle = new Paragraph("Official Squad Roster & Financial Statement", subTitleFont);
            subtitle.setAlignment(Element.ALIGN_CENTER);
            subtitle.setSpacingAfter(4);
            document.add(subtitle);

            Paragraph timestamp = new Paragraph("Generated on: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a")), metaFont);
            timestamp.setAlignment(Element.ALIGN_CENTER);
            timestamp.setSpacingAfter(15);
            document.add(timestamp);

            // Team Info Card Table
            PdfPTable infoTable = new PdfPTable(4);
            infoTable.setWidthPercentage(100);
            infoTable.setSpacingAfter(15);

            addInfoCell(infoTable, "TEAM NAME", team.getName(), headerBg, thFont, primaryDark, subTitleFont);
            addInfoCell(infoTable, "CAPTAIN", team.getCaptainName(), headerBg, thFont, primaryDark, subTitleFont);
            addInfoCell(infoTable, "TOTAL SPENT", "₹" + team.getTotalSpent(), headerBg, thFont, gold, subTitleFont);
            addInfoCell(infoTable, "REMAINING PURSE", "₹" + team.getCurrentPurse() + " / " + team.getInitialPurse(),
                    headerBg, thFont, new Color(16, 185, 129), subTitleFont);

            document.add(infoTable);

            // Section Header
            Paragraph squadHeader = new Paragraph("Purchased Squad (" + team.getPlayerCount() + " Players)", sectionFont);
            squadHeader.setSpacingAfter(8);
            document.add(squadHeader);

            // Squad Table
            PdfPTable squadTable = new PdfPTable(6);
            squadTable.setWidthPercentage(100);
            squadTable.setWidths(new float[]{6f, 32f, 18f, 16f, 24f, 14f});
            squadTable.setSpacingAfter(20);

            // Table Header
            String[] headers = {"#", "Player", "Roll No", "Year", "Player Style", "Price"};
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, thFont));
                cell.setBackgroundColor(headerBg);
                cell.setPadding(6);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                squadTable.addCell(cell);
            }

            // Table Rows
            int index = 1;
            for (PlayerResponse player : team.getPlayers()) {
                Color rowBg = (index % 2 == 0) ? altRow : Color.WHITE;

                addTableCell(squadTable, String.valueOf(index++), tdFont, rowBg, Element.ALIGN_CENTER);
                addTableCell(squadTable, player.getName(), tdBoldFont, rowBg, Element.ALIGN_LEFT);
                addTableCell(squadTable, player.getRollNumber(), tdFont, rowBg, Element.ALIGN_CENTER);
                addTableCell(squadTable, player.getYear(), tdFont, rowBg, Element.ALIGN_CENTER);
                addTableCell(squadTable, player.getRole().toString().replace("_", " "), tdFont, rowBg, Element.ALIGN_CENTER);
                addTableCell(squadTable, "₹" + player.getSoldPrice(), tdBoldFont, rowBg, Element.ALIGN_RIGHT);
            }

            if (team.getPlayers().isEmpty()) {
                PdfPCell emptyCell = new PdfPCell(new Phrase("No players purchased yet.", tdFont));
                emptyCell.setColspan(6);
                emptyCell.setPadding(12);
                emptyCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                squadTable.addCell(emptyCell);
            }

            document.add(squadTable);

            // Official Note
            Paragraph footerNote = new Paragraph("Certified Official Record - College Hostel Cricket Tournament", metaFont);
            footerNote.setAlignment(Element.ALIGN_CENTER);
            document.add(footerNote);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate Team PDF", e);
            throw new AuctionException("PDF_GENERATION_FAILED", "Failed to generate Team PDF: " + e.getMessage());
        }
    }

    public byte[] generateAuctionReport() {
        AuctionReportResponse report = auctionService.getAnalytics();

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, out);
            document.open();

            // Colors
            Color primaryDark = new Color(15, 23, 42);
            Color gold = new Color(217, 119, 6);
            Color headerBg = new Color(30, 41, 59);
            Color altRow = new Color(248, 250, 252);

            // Fonts
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, gold);
            Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, primaryDark);
            Font metaFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.GRAY);
            Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, primaryDark);
            Font thFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
            Font tdFont = FontFactory.getFont(FontFactory.HELVETICA, 9, primaryDark);
            Font tdBoldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, primaryDark);

            // Header
            Paragraph title = new Paragraph("HOSTEL CRICKET AUCTION", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);

            Paragraph subtitle = new Paragraph("Official Auction Event Report & Financial Audit", subTitleFont);
            subtitle.setAlignment(Element.ALIGN_CENTER);
            subtitle.setSpacingAfter(4);
            document.add(subtitle);

            Paragraph timestamp = new Paragraph("Generated on: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a")), metaFont);
            timestamp.setAlignment(Element.ALIGN_CENTER);
            timestamp.setSpacingAfter(15);
            document.add(timestamp);

            // Summary Stats Cards
            PdfPTable statsTable = new PdfPTable(4);
            statsTable.setWidthPercentage(100);
            statsTable.setSpacingAfter(15);

            addInfoCell(statsTable, "TOTAL PLAYERS", String.valueOf(report.getTotalPlayers()), headerBg, thFont, primaryDark, subTitleFont);
            addInfoCell(statsTable, "PLAYERS SOLD", String.valueOf(report.getSoldPlayers()), headerBg, thFont, new Color(16, 185, 129), subTitleFont);
            addInfoCell(statsTable, "UNSOLD PLAYERS", String.valueOf(report.getUnsoldPlayers()), headerBg, thFont, new Color(239, 68, 68), subTitleFont);
            addInfoCell(statsTable, "TOTAL SPENT", "₹" + report.getTotalPointsSpent(), headerBg, thFont, gold, subTitleFont);

            document.add(statsTable);

            // Teams Financial Overview
            Paragraph teamsHeader = new Paragraph("Teams Standing & Balance", sectionFont);
            teamsHeader.setSpacingAfter(8);
            document.add(teamsHeader);

            PdfPTable teamsTable = new PdfPTable(6);
            teamsTable.setWidthPercentage(100);
            teamsTable.setWidths(new float[]{25f, 20f, 15f, 15f, 15f, 10f});
            teamsTable.setSpacingAfter(20);

            String[] tHeaders = {"Team Name", "Captain", "Initial Purse", "Total Spent", "Remaining Purse", "Players"};
            for (String h : tHeaders) {
                PdfPCell cell = new PdfPCell(new Phrase(h, thFont));
                cell.setBackgroundColor(headerBg);
                cell.setPadding(6);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                teamsTable.addCell(cell);
            }

            int idx = 1;
            for (TeamSummaryResponse t : report.getTeams()) {
                Color rowBg = (idx++ % 2 == 0) ? altRow : Color.WHITE;
                addTableCell(teamsTable, t.getName(), tdBoldFont, rowBg, Element.ALIGN_LEFT);
                addTableCell(teamsTable, t.getCaptainName(), tdFont, rowBg, Element.ALIGN_LEFT);
                addTableCell(teamsTable, "₹" + t.getInitialPurse(), tdFont, rowBg, Element.ALIGN_RIGHT);
                addTableCell(teamsTable, "₹" + t.getTotalSpent(), tdFont, rowBg, Element.ALIGN_RIGHT);
                addTableCell(teamsTable, "₹" + t.getCurrentPurse(), tdBoldFont, rowBg, Element.ALIGN_RIGHT);
                addTableCell(teamsTable, String.valueOf(t.getPlayerCount()), tdFont, rowBg, Element.ALIGN_CENTER);
            }
            document.add(teamsTable);

            // Top 5 Highest Purchases
            Paragraph topBuysHeader = new Paragraph("Top 5 Highest Purchases", sectionFont);
            topBuysHeader.setSpacingAfter(8);
            document.add(topBuysHeader);

            PdfPTable topTable = new PdfPTable(5);
            topTable.setWidthPercentage(100);
            topTable.setWidths(new float[]{8f, 32f, 25f, 20f, 15f});
            topTable.setSpacingAfter(20);

            String[] topHeaders = {"Rank", "Player", "Sold To", "Role", "Price"};
            for (String h : topHeaders) {
                PdfPCell cell = new PdfPCell(new Phrase(h, thFont));
                cell.setBackgroundColor(headerBg);
                cell.setPadding(5);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                topTable.addCell(cell);
            }

            int rk = 1;
            for (PlayerResponse p : report.getTopPurchases()) {
                Color rowBg = (rk % 2 == 0) ? altRow : Color.WHITE;
                addTableCell(topTable, "#" + rk++, tdBoldFont, rowBg, Element.ALIGN_CENTER);
                addTableCell(topTable, p.getName(), tdBoldFont, rowBg, Element.ALIGN_LEFT);
                addTableCell(topTable, p.getTeamName() != null ? p.getTeamName() : "-", tdFont, rowBg, Element.ALIGN_LEFT);
                addTableCell(topTable, p.getRole().toString().replace("_", " "), tdFont, rowBg, Element.ALIGN_CENTER);
                addTableCell(topTable, "₹" + p.getSoldPrice(), tdBoldFont, rowBg, Element.ALIGN_RIGHT);
            }
            if (report.getTopPurchases().isEmpty()) {
                PdfPCell empty = new PdfPCell(new Phrase("No purchases recorded yet.", tdFont));
                empty.setColspan(5);
                empty.setPadding(10);
                empty.setHorizontalAlignment(Element.ALIGN_CENTER);
                topTable.addCell(empty);
            }
            document.add(topTable);

            // Footer
            Paragraph footer = new Paragraph("Hostel Cricket Auction Committee - All Rights Reserved", metaFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate Auction Report PDF", e);
            throw new AuctionException("PDF_GENERATION_FAILED", "Failed to generate Auction Report: " + e.getMessage());
        }
    }

    private void addInfoCell(PdfPTable table, String label, String value, Color headerColor, Font thFont, Color valColor, Font valFont) {
        PdfPCell cell = new PdfPCell();
        cell.setPadding(6);
        cell.setBackgroundColor(new Color(241, 245, 249));

        Paragraph pLabel = new Paragraph(label, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, Color.GRAY));
        Paragraph pVal = new Paragraph(value, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, valColor));
        pLabel.setAlignment(Element.ALIGN_CENTER);
        pVal.setAlignment(Element.ALIGN_CENTER);

        cell.addElement(pLabel);
        cell.addElement(pVal);
        table.addCell(cell);
    }

    private void addTableCell(PdfPTable table, String text, Font font, Color bgColor, int align) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "", font));
        cell.setBackgroundColor(bgColor);
        cell.setPadding(5);
        cell.setHorizontalAlignment(align);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        table.addCell(cell);
    }
}
