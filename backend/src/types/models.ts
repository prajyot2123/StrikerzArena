export type PlayerStatus =
  | "REGISTERED"
  | "QUALIFIED"
  | "AUCTIONED"
  | "REJECTED"
  | "SOLD"
  | "UNSOLD";

export interface ITeamPlayerEntry {
  playerId: string;
  biddedPrice: number;
  role: string;
}

export interface IPlayer {
  _id: string;
  userId: string;
  fullName: string;
  age: number;
  role: "Batsman" | "Bowler" | "All-rounder" | "Wicketkeeper";
  yearsOfExperience: number;
  battingStyle: "Right" | "Left";
  bowlingStyle: "Pace" | "Spin" | "Medium" | "None";
  status: PlayerStatus;
  category: "Beginner" | "Intermediate" | "Advanced" | null;
  basePrice: number;
  soldPrice: number;
  soldTo: string | null;
}

export interface ITeam {
  _id: string;
  tournamentId: string;
  ownerId: string;
  name: string;
  shortName: string;
  totalPurse: number;
  usedPurse: number;
  remainingPurse: number;
  players: ITeamPlayerEntry[];
}

export interface IBid {
  _id: string;
  auctionId: string;
  playerId: string;
  teamId: string;
  amount: number;
  isWinningBid: boolean;
}

export interface IAuctionSoldEntry {
  playerId: string;
  teamId: string;
  soldPrice: number;
  soldTime: string;
}

export interface IAuction {
  _id: string;
  tournamentId: string;
  status: "SCHEDULED" | "LIVE" | "PAUSED" | "COMPLETED";
  startTime: string;
  endTime: string | null;
  currentPlayerIndex: number;
  minimumIncrement: number;
  playersToAuction: string[];
  soldPlayers: IAuctionSoldEntry[];
  unsoldPlayers: string[];
}

