package com.hostel.auction.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImportResultResponse {
    private int total;
    private int imported;
    private int duplicates;
    private int invalid;
    @Builder.Default
    private List<String> duplicateRollNumbers = new ArrayList<>();
    @Builder.Default
    private List<String> invalidRows = new ArrayList<>();
    private String message;
}
