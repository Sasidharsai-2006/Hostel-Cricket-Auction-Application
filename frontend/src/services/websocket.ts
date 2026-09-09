import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { AuctionState, Team, TimerUpdate } from '../types';

type AuctionListener = (state: AuctionState) => void;
type TimerListener = (timer: TimerUpdate) => void;
type TeamsListener = (teams: Team[]) => void;
type ConnectionListener = (connected: boolean) => void;

class WebSocketService {
  private client: Client | null = null;
  private auctionListeners: Set<AuctionListener> = new Set();
  private timerListeners: Set<TimerListener> = new Set();
  private teamsListeners: Set<TeamsListener> = new Set();
  private connectionListeners: Set<ConnectionListener> = new Set();
  private isConnected: boolean = false;

  public connect() {
    if (this.client && this.isConnected) return;

    const wsUrl = import.meta.env.VITE_WS_URL || 
      (import.meta.env.VITE_API_BASE_URL 
        ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '')}/ws-auction` 
        : '/ws-auction');

    // Use SockJS fallback compatible with Spring Boot /ws-auction
    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        this.isConnected = true;
        this.notifyConnection(true);

        // Subscribe to live auction channel
        this.client?.subscribe('/topic/auction', (message) => {
          try {
            const data: AuctionState = JSON.parse(message.body);
            this.auctionListeners.forEach((fn) => fn(data));
          } catch (e) {
            console.error('Error parsing auction event', e);
          }
        });

        // Subscribe to server authoritative timer
        this.client?.subscribe('/topic/timer', (message) => {
          try {
            const data: TimerUpdate = JSON.parse(message.body);
            this.timerListeners.forEach((fn) => fn(data));
          } catch (e) {
            console.error('Error parsing timer event', e);
          }
        });

        // Subscribe to teams purse updates
        this.client?.subscribe('/topic/teams', (message) => {
          try {
            const data: Team[] = JSON.parse(message.body);
            this.teamsListeners.forEach((fn) => fn(data));
          } catch (e) {
            console.error('Error parsing teams event', e);
          }
        });
      },
      onDisconnect: () => {
        this.isConnected = false;
        this.notifyConnection(false);
      },
      onStompError: (frame) => {
        console.error('STOMP error: ', frame.headers['message']);
        this.isConnected = false;
        this.notifyConnection(false);
      },
    });

    this.client.activate();
  }

  public disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.isConnected = false;
      this.notifyConnection(false);
    }
  }

  public onAuctionUpdate(callback: AuctionListener) {
    this.auctionListeners.add(callback);
    return () => this.auctionListeners.delete(callback);
  }

  public onTimerUpdate(callback: TimerListener) {
    this.timerListeners.add(callback);
    return () => this.timerListeners.delete(callback);
  }

  public onTeamsUpdate(callback: TeamsListener) {
    this.teamsListeners.add(callback);
    return () => this.teamsListeners.delete(callback);
  }

  public onConnectionChange(callback: ConnectionListener) {
    this.connectionListeners.add(callback);
    callback(this.isConnected);
    return () => this.connectionListeners.delete(callback);
  }

  private notifyConnection(status: boolean) {
    this.connectionListeners.forEach((fn) => fn(status));
  }
}

export const wsService = new WebSocketService();
