package com.hostel.auction;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CricketAuctionApplication {

    public static void main(String[] args) {
        SpringApplication.run(CricketAuctionApplication.class, args);
    }
}
