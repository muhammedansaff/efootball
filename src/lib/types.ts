import type { Timestamp } from "firebase/firestore";

export type PlayerStats = {
  name: string;
  score: number;
  possession: string;
  shots: number;
  shotsOnTarget: number;
  fouls: number;
  offsides: number;
  cornerKicks: number;
  freeKicks: number;
  passes: number;
  successfulPasses: number;
  crosses: number;
  interceptions: number;
  tackles: number;
  saves: number;
  passAccuracy?: number;
  redCards?: number;
  userId?: string;
};


export type User = {
  id: string;
  name: string;
  realName?: string;
  pesTeamName?: string;
  avatarUrl: string;
  email: string;
  badges: string[];
  stats: {
    wins: number;
    losses: number;
    draws: number;
    goalsFor: number;
    goalsAgainst: number;
    shots: number;
    shotsOnTarget: number;
    passes: number;
    successfulPasses: number;
    tackles: number;
    saves: number;
    redCards: number;
  };
};

export type Match = {
  id: string;
  id: string;
  createdBy: string; // The user who uploaded the match (formerly userId)
  opponentId: string;
  opponentId: string;
  participants: string[]; // Array with userId and opponentId
  date: string | Timestamp;
  comments: Comment[];
  roast?: string;
  winnerId: string; // Can be user ID, opponent ID, or 'draw'
  opponentName: string;
  team1Name: string;
  team2Name: string;
  team1Stats: PlayerStats;
  team2Stats: PlayerStats;
  matchHash: string; // Unique fingerprint for the match
  userTeamSide?: 'team1' | 'team2';
};

export type Comment = {
  id: string;
  user: User;
  text: string;
  timestamp: string;
};

export type BadgeCriteria = {
    stat: 'wins' | 'losses' | 'goalsFor' | 'tackles' | 'cleanSheets' | 'winStreak' | 'matchesPlayed' | 'comebacks' | 'lossStreak' | 'goalsAgainst';
    value: number;
}

export type Badge = {
  id: string;
  name: string;
  description: string;
  iconName: string;
  criteria: BadgeCriteria;
  lastUpdated?: Timestamp;
};


export type LeaderboardEntry = {
  rank: number;
  user: User;
  value: number;
  change: number;
};

export type HallEntry = {
    id: string;
    type: 'fame' | 'shame';
    title: string;
    description: string;
    matchId: string;
    userId: string;
    opponentId: string;
    stat: string; // e.g., 'Won by 5 goals'
    roast: string;
    date: Timestamp;
};


export type ShameCategory = {
  id:string;
  title: string;
  description: string;
  user: Partial<User>;
  stat: string;
  roast: string;
};

export type Milestone = {
    id: string;
    title: string;
    description: string;
    target: number;
    stat: 'wins' | 'goalsFor' | 'tackles' | 'cleanSheets' | 'matchesPlayed';
    lastUpdated?: Timestamp;
};
    