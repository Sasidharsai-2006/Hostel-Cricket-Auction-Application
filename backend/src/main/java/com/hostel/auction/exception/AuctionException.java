package com.hostel.auction.exception;

import lombok.Getter;

@Getter
public class AuctionException extends RuntimeException {
    private final String errorCode;

    public AuctionException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
}
