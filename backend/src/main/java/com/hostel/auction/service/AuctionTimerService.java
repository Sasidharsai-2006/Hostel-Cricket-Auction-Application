package com.hostel.auction.service;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuctionTimerService {

    private final SimpMessagingTemplate messagingTemplate;

    @Getter
    private final AtomicInteger remainingSeconds = new AtomicInteger(10);
    private final AtomicBoolean isRunning = new AtomicBoolean(false);
    @Getter
    private int defaultDuration = 10;

    public void startTimer(int seconds) {
        // Timer disabled: auction continues until Admin clicks SOLD or UNSOLD
    }

    public void resetTimer() {
        // No-op
    }

    public void pauseTimer() {
        // No-op
    }

    public void resumeTimer() {
        // No-op
    }

    public void stopTimer() {
        // No-op
    }

    public void setDefaultDuration(int seconds) {
        // No-op
    }

    public boolean isTimerRunning() {
        return false;
    }

    public void tick() {
        // No-op: Automatic timer countdown is disabled per event rules
    }
}
