import type { User, Match, LeaderboardEntry, ShameCategory, Badge } from '@/lib/types';
import { PlaceHolderImages } from './placeholder-images';
import { Award, Bomb, Bot, Coffee, Crown, Dribbble, HeartCrack, Shield, Swords, ThumbsDown, Trophy, Zap, Footprints, Flame, Goal, Wind, Gauge, Star } from 'lucide-react';

const users: User[] = [
  { id: 'user-1', name: 'BanterKing99', email: 'king@banter.com', avatarUrl: PlaceHolderImages.find(p => p.id === 'user-avatar-1')?.imageUrl!, badges:[], stats: { wins: 68, losses: 30, draws: 12, goalsFor: 210, goalsAgainst: 155, redCards: 2, shots: 1500, shotsOnTarget: 1000, passes: 5000, successfulPasses: 4250, tackles: 300, saves: 100 } },
  { id: 'user-2', name: 'GoalMachine', email: 'gm@banter.com', avatarUrl: PlaceHolderImages.find(p => p.id === 'user-avatar-2')?.imageUrl!, badges:[], stats: { wins: 85, losses: 15, draws: 10, goalsFor: 305, goalsAgainst: 95, redCards: 0, shots: 2000, shotsOnTarget: 1800, passes: 4000, successfulPasses: 3600, tackles: 150, saves: 50 } },
  { id: 'user-3', name: 'SavageSavic', email: 'savage@banter.com', avatarUrl: PlaceHolderImages.find(p => p.id === 'user-avatar-3')?.imageUrl!, badges:[], stats: { wins: 50, losses: 50, draws: 5, goalsFor: 180, goalsAgainst: 180, redCards: 5, shots: 1200, shotsOnTarget: 800, passes: 3000, successfulPasses: 2340, tackles: 500, saves: 200 } },
  { id: 'user-4', name: 'TheWall', email: 'wall@banter.com', avatarUrl: PlaceHolderImages.find(p => p.id === 'user-avatar-4')?.imageUrl!, badges:[], stats: { wins: 40, losses: 10, draws: 50, goalsFor: 100, goalsAgainst: 50, redCards: 1, shots: 500, shotsOnTarget: 300, passes: 6000, successfulPasses: 5700, tackles: 400, saves: 400 } },
  { id: 'user-5', name: 'NoobMaster69', email: 'noob@banter.com', avatarUrl: PlaceHolderImages.find(p => p.id === 'user-avatar-5')?.imageUrl!, badges:[], stats: { wins: 10, losses: 80, draws: 10, goalsFor: 80, goalsAgainst: 320, redCards: 10, shots: 600, shotsOnTarget: 300, passes: 2000, successfulPasses: 1200, tackles: 100, saves: 50 } },
  { id: 'user-6', name: 'SilentAssassin', email: 'silent@banter.com', avatarUrl: PlaceHolderImages.find(p => p.id === 'user-avatar-6')?.imageUrl!, badges:[], stats: { wins: 75, losses: 20, draws: 5, goalsFor: 250, goalsAgainst: 120, redCards: 3, shots: 1800, shotsOnTarget: 1500, passes: 4500, successfulPasses: 3960, tackles: 250, saves: 80 } },
];

export const mockUsers = users;
export const mainUser = users[0];

export const mockMatches: Match[] = [];

export const mockRival = users[2];

export const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, user: users[1], value: 265, change: 5 },
  { rank: 2, user: users[5], value: 230, change: 2 },
  { rank: 3, user: users[0], value: 216, change: -1 },
  { rank: 4, user: users[2], value: 155, change: -1 },
  { rank: 5, user: users[3], value: 130, change: 0 },
];

export const mockHallOfShame: ShameCategory[] = [
  { id: 'shame-1', title: 'The Generous Giver', description: 'Awarded for conceding the most goals in a single match.', user: users[4], stat: '10 goals conceded', roast: "10 goals? Were you playing goalkeeper or just opening doors for them? Your defense has more holes than a cheese grater." },
  { id: 'shame-2', title: 'The Pacifist', description: 'For the player with the least shots on target in a month.', user: users[3], stat: '1 shot on target', roast: "One shot on target all month. Did you think the aim of the game was to pass it back to your keeper?" },
  { id: 'shame-3', title: 'Biggest Goal Difference Defeat', description: 'Lost a match with a goal difference of -7.', user: users[4], stat: '7-0 Loss', roast: "A 7-0 loss... they didn't just beat you, they downloaded a software update on you." },
];

type StaticBadge = {
    iconName: string;
    icon: React.ElementType;
}
export const allBadges: StaticBadge[] = [
    { iconName: 'Zap', icon: Zap },
    { iconName: 'Shield', icon: Shield },
    { iconName: 'Swords', icon: Swords },
    { iconName: 'Crown', icon: Crown },
    { iconName: 'Bomb', icon: Bomb },
    { iconName: 'Trophy', icon: Trophy },
    { iconName: 'Flame', icon: Flame },
    { iconName: 'Award', icon: Award },
    { iconName: 'Footprints', icon: Footprints },
    { iconName: 'Wind', icon: Wind },
    { iconName: 'Gauge', icon: Gauge },
    { iconName: 'Star', icon: Star },
    { iconName: 'HeartCrack', icon: HeartCrack },
    { iconName: 'Bot', icon: Bot },
    { iconName: 'ThumbsDown', icon: ThumbsDown },
    { iconName: 'Coffee', icon: Coffee },
];
