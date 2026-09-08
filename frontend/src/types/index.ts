export type UserType = 'ADMIN' | 'CAPTAIN';

export type PlayerRole = 'BATSMAN' | 'BOWLER' | 'ALL_ROUNDER' | 'WICKET_KEEPER';

export type PlayerStatus = 'AVAILABLE' | 'IN_AUCTION' | 'SOLD' | 'UNSOLD';

export type AuctionStatus = 'PENDING' | 'ACTIVE' | 'PAUSED' | 'SOLD' | 'UNSOLD';

export type CallState = 'NORMAL' | 'GOING_ONCE' | 'GOING_TWICE';

export interface User {
  username: string;
  displayName: string;
  userType: UserType;
  teamId?: number | null;
  teamName?: string | null;
  initialPurse?: number | null;
  currentPurse?: number | null;
  message?: string;
}

export interface Player {
  id: number;
  name: string;
  rollNumber: string;
  email?: string;
  year: string;
  branch: string;
  hostel?: string;
  role: PlayerRole;
  battingStyle?: string;
  bowlingStyle?: string;
  photoUrl?: string;
  basePrice: number;
  status: PlayerStatus;
  teamId?: number | null;
  teamName?: string | null;
  soldPrice?: number | null;
}

export interface Team {
  id: number;
  name: string;
  captainName: string;
  initialPurse: number;
  currentPurse: number;
  totalSpent: number;
  playerCount: number;
  logoUrl?: string;
  players?: Player[];
}

export interface Bid {
  id: number;
  auctionId: number;
  teamId: number;
  teamName: string;
  amount: number;
  createdAt: string;
}

export interface AuctionState {
  auctionId?: number;
  status?: AuctionStatus | null;
  callState?: CallState;
  roundNumber?: number;
  player?: Player | null;
  startingPrice?: number;
  currentPrice?: number;
  highestBidderTeamId?: number | null;
  highestBidderTeamName?: string | null;
  timerSeconds?: number;
  recentBids?: Bid[];
  teams?: Team[];
  eventType?: string;
  message?: string;
}

export interface TimerUpdate {
  remainingSeconds: number;
  isRunning: boolean;
  defaultDuration?: number;
  timeUp?: boolean;
}

export interface ImportResult {
  total: number;
  imported: number;
  duplicates: number;
  invalid: number;
  duplicateRollNumbers: string[];
  invalidRows: string[];
  message: string;
}

export interface AuctionReport {
  totalPlayers: number;
  soldPlayers: number;
  unsoldPlayers: number;
  availablePlayers: number;
  totalPointsSpent: number;
  averagePlayerPrice: number;
  highestPlayerPrice: number;
  lowestPlayerPrice: number;
  highestPurchasedPlayer?: Player | null;
  teams: Team[];
  topPurchases: Player[];
  unsoldList: Player[];
}

export interface AuditLog {
  id: number;
  username: string;
  action: string;
  description: string;
  timestamp: string;
}
