import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { AuctionState, Team, TimerUpdate } from '../types';
import { auctionService, teamService } from '../services/api';
import { wsService } from '../services/websocket';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AuctionContextType {
  auctionState: AuctionState | null;
  timer: TimerUpdate;
  teams: Team[];
  connected: boolean;
  refreshState: () => Promise<void>;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
}

const AuctionContext = createContext<AuctionContextType | undefined>(undefined);

export const AuctionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auctionState, setAuctionState] = useState<AuctionState | null>(null);
  const [timer, setTimer] = useState<TimerUpdate>({ remainingSeconds: 10, isRunning: false, defaultDuration: 10 });
  const [teams, setTeams] = useState<Team[]>([]);
  const [connected, setConnected] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshState = useCallback(async () => {
    try {
      const [curr, teamList] = await Promise.all([
        auctionService.getCurrent(),
        teamService.getTeams(),
      ]);
      setAuctionState(curr);
      setTeams(teamList);
      if (curr.timerSeconds !== undefined) {
        setTimer((prev) => ({ ...prev, remainingSeconds: curr.timerSeconds || 10 }));
      }
    } catch (e) {
      console.error('Failed to load initial auction state', e);
    }
  }, []);

  useEffect(() => {
    refreshState();
    wsService.connect();

    const unsubConn = wsService.onConnectionChange((status) => {
      setConnected(status);
      if (status) {
        refreshState(); // Always sync state on reconnect
      }
    });

    const unsubAuction = wsService.onAuctionUpdate((data) => {
      setAuctionState(data);
      if (data.teams && data.teams.length > 0) {
        setTeams(data.teams);
      }

      if (data.eventType === 'PLAYER_SOLD') {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#10B981', '#3B82F6', '#EF4444'],
        });
        showToast(data.message || 'Player Sold!', 'success');
      } else if (data.eventType === 'PLAYER_UNSOLD') {
        showToast(data.message || 'Player Unsold', 'info');
      } else if (data.eventType === 'BID_PLACED') {
        showToast(data.message || 'New Bid Placed!', 'info');
      } else if (data.eventType === 'UNDO_COMPLETED') {
        showToast(data.message || 'Sale Undone', 'info');
      } else if (data.eventType === 'ROUND_CHANGED') {
        showToast(data.message || `Switched to Round ${data.roundNumber}`, 'info');
      }
    });

    const unsubTimer = wsService.onTimerUpdate((t) => {
      setTimer(t);
    });

    const unsubTeams = wsService.onTeamsUpdate((tList) => {
      setTeams(tList);
    });

    return () => {
      unsubConn();
      unsubAuction();
      unsubTimer();
      unsubTeams();
      wsService.disconnect();
    };
  }, [refreshState, showToast]);

  return (
    <AuctionContext.Provider
      value={{
        auctionState,
        timer,
        teams,
        connected,
        refreshState,
        toasts,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </AuctionContext.Provider>
  );
};

export const useAuction = () => {
  const context = useContext(AuctionContext);
  if (!context) {
    throw new Error('useAuction must be used within an AuctionProvider');
  }
  return context;
};
