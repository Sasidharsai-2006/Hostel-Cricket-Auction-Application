import axios from 'axios';
import { AuctionReport, AuctionState, ImportResult, Player, PlayerRole, PlayerStatus, Team, User } from '../types';

const API = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authService = {
  login: async (username: string, password: string): Promise<User> => {
    const res = await API.post<User>('/login', { username, password });
    return res.data;
  },
};

export const playerService = {
  getPlayers: async (params?: {
    status?: PlayerStatus;
    role?: PlayerRole;
    year?: string;
    teamId?: number;
    search?: string;
  }): Promise<Player[]> => {
    const res = await API.get<Player[]>('/players', { params });
    return res.data;
  },

  createPlayer: async (player: Partial<Player>): Promise<Player> => {
    const res = await API.post<Player>('/players', player);
    return res.data;
  },

  updateBasePrice: async (id: number, basePrice: number): Promise<Player> => {
    const res = await API.put<Player>(`/players/${id}/base-price`, { basePrice });
    return res.data;
  },

  importCsv: async (file: File, defaultBasePrice?: number, wipeExisting?: boolean): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const params: any = {};
    if (defaultBasePrice !== undefined) params.defaultBasePrice = defaultBasePrice;
    if (wipeExisting) params.wipeExisting = 'true';
    const res = await API.post<ImportResult>('/players/import', formData, {
      params,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

export const teamService = {
  getTeams: async (): Promise<Team[]> => {
    const res = await API.get<Team[]>('/teams');
    return res.data;
  },

  getTeam: async (id: number): Promise<Team> => {
    const res = await API.get<Team>(`/teams/${id}`);
    return res.data;
  },
};

export const auctionService = {
  getCurrent: async (): Promise<AuctionState> => {
    const res = await API.get<AuctionState>('/auction/current');
    return res.data;
  },

  start: async (playerId: number, startingPrice?: number): Promise<AuctionState> => {
    const res = await API.post<AuctionState>('/auction/start', { playerId, startingPrice });
    return res.data;
  },

  bid: async (captainUsername: string, teamId: number, amount: number): Promise<AuctionState> => {
    const res = await API.post<AuctionState>('/auction/bid', { captainUsername, teamId, amount });
    return res.data;
  },

  setCallState: async (auctionId: number, callState: string): Promise<AuctionState> => {
    const res = await API.post<AuctionState>('/auction/call-state', { auctionId, callState });
    return res.data;
  },

  pause: async (auctionId: number): Promise<AuctionState> => {
    const res = await API.post<AuctionState>('/auction/pause', { auctionId });
    return res.data;
  },

  resume: async (auctionId: number): Promise<AuctionState> => {
    const res = await API.post<AuctionState>('/auction/resume', { auctionId });
    return res.data;
  },

  sold: async (auctionId: number): Promise<AuctionState> => {
    const res = await API.post<AuctionState>('/auction/sold', { auctionId });
    return res.data;
  },

  unsold: async (auctionId: number): Promise<AuctionState> => {
    const res = await API.post<AuctionState>('/auction/unsold', { auctionId });
    return res.data;
  },

  undo: async (): Promise<AuctionState> => {
    const res = await API.post<AuctionState>('/auction/undo');
    return res.data;
  },

  getEligiblePlayers: async (round: number = 1): Promise<Player[]> => {
    const res = await API.get<Player[]>('/auction/eligible-players', { params: { round } });
    return res.data;
  },

  getNextPlayer: async (round: number = 1): Promise<Player | null> => {
    const res = await API.get<Player>('/auction/next-player', { params: { round } });
    return res.data;
  },

  setRound: async (roundNumber: number): Promise<{ message: string; roundNumber: number }> => {
    const res = await API.post('/auction/round', { roundNumber });
    return res.data;
  },

  getHistory: async (): Promise<AuctionState[]> => {
    const res = await API.get<AuctionState[]>('/auction/history');
    return res.data;
  },

  getAnalytics: async (): Promise<AuctionReport> => {
    const res = await API.get<AuctionReport>('/auction/analytics');
    return res.data;
  },

  getAuditLogs: async () => {
    const res = await API.get('/auction/audit-logs');
    return res.data;
  },

  resetTournament: async (deletePlayers: boolean = false): Promise<{ message: string }> => {
    const res = await API.post('/auction/reset', { deletePlayers });
    return res.data;
  },
};

export const pdfService = {
  downloadTeamPdf: (teamId: number, teamName: string) => {
    window.open(`/api/pdf/team/${teamId}`, '_blank');
  },

  downloadAuctionReportPdf: () => {
    window.open(`/api/pdf/auction-report`, '_blank');
  },
};

export default API;
