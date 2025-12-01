'use client';

import { PageHeader } from "@/components/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Loader2, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, where, Timestamp } from 'firebase/firestore';
import type { User, Match } from '@/lib/types';
import { useEffect, useRef, useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";

type TimeRange = 'monthly' | 'yearly' | 'all-time';

export default function LeaderboardPage() {
  const firestore = useFirestore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const leaderboardRef = useRef<HTMLDivElement>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('monthly');

  // 1. Fetch all users to get metadata (name, avatar, etc.)
  const usersQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'users')) : null, 
    [firestore]
  );
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);

  // 2. Calculate date range based on selected timeRange
  const dateFilter = useMemo(() => {
    const now = new Date();
    let startDate: Date | null = null;

    if (timeRange === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (timeRange === 'yearly') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }
    // 'all-time' is null
    return startDate;
  }, [timeRange]);

  // 3. Fetch matches based on date filter
  // Note: For 'all-time', we could rely on user.stats, but to ensure consistency 
  // with the dynamic aggregation logic (and to support re-calculating if needed),
  // we'll fetch matches for monthly/yearly. For all-time, we can use the pre-calculated user stats
  // to save reads, OR just aggregate everything if the dataset is small.
  // Given the requirement to "reset" and "calculate", let's try to be consistent.
  // However, fetching ALL matches ever might be heavy. 
  // Strategy: 
  // - Monthly/Yearly: Fetch matches > startDate and aggregate.
  // - All-Time: Use the `stats` field on the User object (which is maintained by cloud functions/triggers).
  
  const matchesQuery = useMemoFirebase(() => {
    if (!firestore || timeRange === 'all-time' || !dateFilter) return null;
    
    return query(
      collection(firestore, 'matches'),
      where('date', '>=', Timestamp.fromDate(dateFilter)),
      orderBy('date', 'desc')
    );
  }, [firestore, timeRange, dateFilter]);

  const { data: matches, isLoading: isLoadingMatches } = useCollection<Match>(matchesQuery);

  // 4. Aggregate Stats
  const leaderboardData = useMemo(() => {
    if (!users) return [];

    // If All-Time, use the stored stats on the user object
    if (timeRange === 'all-time') {
      return [...users].sort((a, b) => {
        // Sort by Wins desc, then Win Rate desc
        if (b.stats.wins !== a.stats.wins) return b.stats.wins - a.stats.wins;
        const aRate = a.stats.wins / (a.stats.wins + a.stats.losses || 1);
        const bRate = b.stats.wins / (b.stats.wins + b.stats.losses || 1);
        return bRate - aRate;
      });
    }

    // If Monthly/Yearly, aggregate from matches
    if (!matches) return [];

    // Initialize stats map for all users
    const statsMap = new Map<string, User['stats']>();
    users.forEach(user => {
      statsMap.set(user.id, {
        wins: 0, losses: 0, draws: 0,
        goalsFor: 0, goalsAgainst: 0,
        shots: 0, shotsOnTarget: 0,
        passes: 0, successfulPasses: 0,
        tackles: 0, saves: 0,
        fouls: 0, redCards: 0,
        totalPossession: 0, matchesPlayed: 0
      });
    });

    matches.forEach(match => {
      // Identify participants
      const team1Id = match.team1Stats.userId;
      const team2Id = match.team2Stats.userId;

      if (!team1Id || !team2Id) return; // Skip if data is incomplete

      const stats1 = statsMap.get(team1Id);
      const stats2 = statsMap.get(team2Id);

      if (!stats1 || !stats2) return;

      // Update Match Counts
      stats1.matchesPlayed++;
      stats2.matchesPlayed++;

      // Update Results
      if (match.winnerId === team1Id) {
        stats1.wins++;
        stats2.losses++;
      } else if (match.winnerId === team2Id) {
        stats2.wins++;
        stats1.losses++;
      } else {
        stats1.draws++;
        stats2.draws++;
      }

      // Update Goals
      stats1.goalsFor += match.team1Stats.score;
      stats1.goalsAgainst += match.team2Stats.score;
      stats2.goalsFor += match.team2Stats.score;
      stats2.goalsAgainst += match.team1Stats.score;

      // Update other stats (simplified for leaderboard purposes)
      // We mainly need wins/losses/goals for the main table, but let's be thorough
      // Note: Some legacy matches might not have detailed stats, but new ones do.
    });

    // Convert map to array of Users with computed stats
    const computedUsers = users.map(user => ({
      ...user,
      stats: statsMap.get(user.id) || user.stats
    }));

    // Sort
    return computedUsers.sort((a, b) => {
      if (b.stats.wins !== a.stats.wins) return b.stats.wins - a.stats.wins;
      const aTotal = a.stats.wins + a.stats.losses;
      const bTotal = b.stats.wins + b.stats.losses;
      // Prefer more games played if wins are tied? Or better win rate?
      // Usually Win Rate is tie breaker
      const aRate = aTotal > 0 ? a.stats.wins / aTotal : 0;
      const bRate = bTotal > 0 ? b.stats.wins / bTotal : 0;
      return bRate - aRate;
    });

  }, [users, matches, timeRange]);

  // Get the first place user from the CURRENT leaderboard data
  const firstPlaceUser = leaderboardData.length > 0 && leaderboardData[0].stats.matchesPlayed > 0 ? leaderboardData[0] : null;

  // Auto-play audio when first place user has custom audio
  useEffect(() => {
    if (firstPlaceUser?.leaderboardAudioUrl && audioRef.current) {
      // Create a local variable to capture the current ref value
      const audio = audioRef.current;
      
      // Load the new source to ensure it's ready to play
      audio.load();
      
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Audio autoplay prevented:", error);
        });
      }

      return () => {
        // Use the local variable for cleanup
        audio.pause();
        audio.currentTime = 0;
      };
    }
  }, [firstPlaceUser?.id, firstPlaceUser?.leaderboardAudioUrl]); // Only re-run if the USER changes

  const scrollToLeaderboard = () => {
    leaderboardRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const renderLeaderboardTable = () => {
    const isLoading = timeRange === 'all-time' ? isLoadingUsers : (isLoadingUsers || isLoadingMatches);

    if (isLoading) {
      return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
    
    // Filter out users with 0 games for the selected period
    const activeUsers = leaderboardData.filter(u => (u.stats.wins + u.stats.losses + u.stats.draws) > 0);

    if (activeUsers.length === 0) {
      return <p className="text-muted-foreground p-8 text-center">No matches played in this period.</p>;
    }

    return (
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Rank</TableHead>
              <TableHead>Player</TableHead>
              <TableHead>Wins</TableHead>
              <TableHead>Losses</TableHead>
              <TableHead className="text-right">Win/Loss Ratio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeUsers.map((user, index) => {
              const rank = index + 1;
              const { stats } = user;
              const winLossRatio = stats.losses > 0 ? (stats.wins / stats.losses).toFixed(2) : stats.wins;
              return (
                <TableRow key={user.id} className={cn(rank === 1 && "bg-primary/10 hover:bg-primary/20")}>
                  <TableCell className="font-medium text-lg text-center">
                    <div className="flex items-center justify-center">
                      {rank === 1 ? <Crown className="h-6 w-6 text-primary" /> : rank}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-semibold">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{stats.wins}</TableCell>
                  <TableCell>{stats.losses}</TableCell>
                  <TableCell className="text-right font-mono">{winLossRatio}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-24 md:pb-0">
      <PageHeader
        title="Leaderboard"
        description="See who's dominating the barn."
      >
        <Button variant="outline" size="sm" onClick={scrollToLeaderboard}>
          View Table <ArrowDown className="ml-2 h-4 w-4" />
        </Button>
      </PageHeader>

      {/* First Place Celebration - Dynamic based on selected period */}
      {firstPlaceUser && (firstPlaceUser.leaderboardImageUrl || firstPlaceUser.leaderboardAudioUrl || firstPlaceUser.bannerUrl) && (
        <Card className="overflow-hidden border-primary/50 bg-gradient-to-br from-primary/5 via-background to-primary/10">
          <CardContent className="p-0">
            {/* Banner Section - Full Width on Mobile */}
            {firstPlaceUser.bannerUrl && (
              <div className="relative w-full h-48 md:h-64 bg-gradient-to-br from-primary/20 to-primary/5">
                {firstPlaceUser.bannerType === 'video' ? (
                  <video
                    src={firstPlaceUser.bannerUrl}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={firstPlaceUser.bannerUrl}
                    alt={`${firstPlaceUser.name}'s banner`}
                    className="w-full h-full object-cover"
                  />
                )}
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
              </div>
            )}

            {/* Content Section */}
            <div className="relative p-6 -mt-16 md:-mt-20">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Avatar & Celebration Image */}
                <div className="flex flex-col items-center gap-4 flex-shrink-0">
                  {/* Large Avatar with Crown */}
                  <div className="relative">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
                      <Crown className="h-10 w-10 text-yellow-500 fill-yellow-500 animate-bounce drop-shadow-lg" />
                    </div>
                    <Avatar className="h-28 w-28 border-4 border-primary shadow-2xl ring-4 ring-background">
                      <AvatarImage src={firstPlaceUser.avatarUrl || undefined} />
                      <AvatarFallback className="text-4xl bg-primary/20">{firstPlaceUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Celebration Image */}
                  {firstPlaceUser.leaderboardImageUrl && (
                    <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-primary/30 shadow-lg">
                      <img
                        src={firstPlaceUser.leaderboardImageUrl}
                        alt={`${firstPlaceUser.name}'s celebration`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Champion Info */}
                <div className="flex-1 text-center md:text-left space-y-4">
                  {/* Title */}
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                      <Crown className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">
                        {timeRange === 'monthly' ? 'Month Champion' : timeRange === 'yearly' ? 'Year Champion' : 'All-Time Champion'}
                      </span>
                    </div>
                    <h2 className="font-headline text-4xl md:text-5xl text-primary tracking-tight">
                      {firstPlaceUser.name}
                    </h2>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Wins</p>
                      <p className="text-2xl font-bold text-primary">{firstPlaceUser.stats.wins}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Losses</p>
                      <p className="text-2xl font-bold">{firstPlaceUser.stats.losses}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Goals</p>
                      <p className="text-2xl font-bold text-green-500">{firstPlaceUser.stats.goalsFor}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">W/L Ratio</p>
                      <p className="text-2xl font-bold text-yellow-500">
                        {firstPlaceUser.stats.losses > 0 
                          ? (firstPlaceUser.stats.wins / firstPlaceUser.stats.losses).toFixed(2)
                          : firstPlaceUser.stats.wins}
                      </p>
                    </div>
                  </div>

                  {/* Achievement Badge */}
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                      <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">🏆 Rank #1</span>
                    </div>
                    {firstPlaceUser.stats.wins >= 10 && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                        <span className="text-xs font-medium text-purple-600 dark:text-purple-400">⚡ 10+ Wins</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Hidden Audio Player */}
            {firstPlaceUser.leaderboardAudioUrl && (
              <audio ref={audioRef} loop>
                <source src={firstPlaceUser.leaderboardAudioUrl} />
              </audio>
            )}
          </CardContent>
        </Card>
      )}

      <div ref={leaderboardRef}>
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
            <TabsTrigger value="all-time">All-Time</TabsTrigger>
          </TabsList>
          <TabsContent value="monthly" className="mt-6">
            {renderLeaderboardTable()}
          </TabsContent>
          <TabsContent value="yearly" className="mt-6">
            {renderLeaderboardTable()}
          </TabsContent>
          <TabsContent value="all-time" className="mt-6">
            {renderLeaderboardTable()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
