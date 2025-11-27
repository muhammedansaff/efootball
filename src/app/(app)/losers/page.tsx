'use client';

import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skull, Trophy, TrendingDown, Flame } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Match, User } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface LoserStats {
  user: User;
  totalLosses: number;
  totalGoalsConceded: number;
  biggestDefeat: number;
  biggestDefeatScore: string;
}

export default function LosersPage() {
  const firestore = useFirestore();

  // Fetch all matches and users
  const matchesQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'matches'), orderBy('date', 'desc')) : null,
    [firestore]
  );
  const { data: matches, isLoading: isLoadingMatches } = useCollection<Match>(matchesQuery);

  const usersQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'users')) : null,
    [firestore]
  );
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);

  const [activeTab, setActiveTab] = useState<'day' | 'month' | 'year'>('day');
  const [showCelebration, setShowCelebration] = useState(false);

  // Filter matches by time period
  const getFilteredMatches = (period: 'day' | 'month' | 'year') => {
    if (!matches) return [];
    
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    return matches.filter(match => {
      const matchDate = match.date ? new Date((match.date as any).seconds * 1000) : new Date();
      
      switch (period) {
        case 'day':
          return matchDate >= startOfDay;
        case 'month':
          return matchDate >= startOfMonth;
        case 'year':
          return matchDate >= startOfYear;
        default:
          return true;
      }
    });
  };

  // Calculate loser stats
  const calculateLoserStats = (filteredMatches: Match[]): LoserStats[] => {
    if (!users || !filteredMatches) return [];

    const loserMap = new Map<string, { losses: number; goalsConceded: number; biggestDefeat: number; biggestDefeatScore: string }>();

    filteredMatches.forEach(match => {
      if (match.winnerId === 'draw') return;

      const loserId = match.winnerId === match.team1Stats.userId 
        ? match.team2Stats.userId 
        : match.team1Stats.userId;

      if (!loserId) return; // Skip if loserId is undefined

      const loserScore = match.winnerId === match.team1Stats.userId
        ? match.team2Stats.score
        : match.team1Stats.score;
      
      const winnerScore = match.winnerId === match.team1Stats.userId
        ? match.team1Stats.score
        : match.team2Stats.score;

      const goalsConceded = winnerScore;
      const goalDifference = winnerScore - loserScore;

      if (!loserMap.has(loserId)) {
        loserMap.set(loserId, { losses: 0, goalsConceded: 0, biggestDefeat: -1, biggestDefeatScore: '' });
      }

      const stats = loserMap.get(loserId)!;
      stats.losses += 1;
      stats.goalsConceded += goalsConceded;
      
      if (goalDifference > stats.biggestDefeat) {
        stats.biggestDefeat = goalDifference;
        stats.biggestDefeatScore = `${loserScore} - ${winnerScore}`;
      }
    });

    const loserStats: LoserStats[] = [];
    loserMap.forEach((stats, userId) => {
      const user = users.find(u => u.id === userId);
      if (user) {
        loserStats.push({
          user,
          totalLosses: stats.losses,
          totalGoalsConceded: stats.goalsConceded,
          biggestDefeat: stats.biggestDefeat,
          biggestDefeatScore: stats.biggestDefeatScore,
        });
      }
    });

    return loserStats.sort((a, b) => b.totalGoalsConceded - a.totalGoalsConceded);
  };

  const dailyLosers = useMemo(() => calculateLoserStats(getFilteredMatches('day')), [matches, users]);
  const monthlyLosers = useMemo(() => calculateLoserStats(getFilteredMatches('month')), [matches, users]);
  const yearlyLosers = useMemo(() => calculateLoserStats(getFilteredMatches('year')), [matches, users]);

  // Show celebration for biggest loser of the day
  useEffect(() => {
    if (dailyLosers.length > 0 && !isLoadingMatches && !isLoadingUsers) {
      setTimeout(() => {
        setShowCelebration(true);
      }, 500);
      // Celebration stays visible - no auto-hide
    }
  }, [dailyLosers, isLoadingMatches, isLoadingUsers]);

  const currentLosers = activeTab === 'day' ? dailyLosers : activeTab === 'month' ? monthlyLosers : yearlyLosers;
  const biggestLoser = currentLosers[0];

  if (isLoadingMatches || isLoadingUsers) {
    return (
      <div className="flex h-full items-center justify-center">
        <Skull className="h-12 w-12 animate-spin text-destructive" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Hall of Losers"
        description="Where defeat is celebrated and shame is eternal! 💀"
      />

      {/* Biggest Loser of the Day Celebration */}
      {showCelebration && biggestLoser && activeTab === 'day' && (
        <Card className="border-destructive bg-gradient-to-r from-destructive/20 via-destructive/10 to-destructive/20 animate-in fade-in zoom-in duration-700">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-destructive/30 blur-3xl animate-pulse" />
                <Avatar className="h-32 w-32 border-8 border-destructive shadow-2xl relative z-10 animate-bounce">
                  <AvatarImage src={biggestLoser.user.avatarUrl || ''} alt={biggestLoser.user.name || 'User'} />
                  <AvatarFallback className="text-5xl bg-destructive/20">
                    {biggestLoser.user.name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-4 -right-4 z-20">
                  <Skull className="h-16 w-16 text-destructive animate-pulse" />
                </div>
              </div>
              
              <div className="flex-1 text-center md:text-left space-y-2">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <Flame className="h-8 w-8 text-destructive animate-pulse" />
                  <h2 className="text-3xl md:text-4xl font-headline text-destructive">
                    BIGGEST LOSER OF THE DAY!
                  </h2>
                  <Flame className="h-8 w-8 text-destructive animate-pulse" />
                </div>
                <p className="text-5xl font-bold text-destructive animate-pulse">
                  {biggestLoser.user.name}
                </p>
                <div className="flex gap-6 justify-center md:justify-start text-lg">
                  <div>
                    <span className="text-muted-foreground">Losses: </span>
                    <span className="font-bold text-destructive">{biggestLoser.totalLosses}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Goals Conceded: </span>
                    <span className="font-bold text-destructive">{biggestLoser.totalGoalsConceded}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Day/Month/Year */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'day' | 'month' | 'year')} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="day">Today</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
          <TabsTrigger value="year">This Year</TabsTrigger>
        </TabsList>

        <TabsContent value="day" className="space-y-4 mt-6">
          <LosersList losers={dailyLosers} period="Today" />
        </TabsContent>

        <TabsContent value="month" className="space-y-4 mt-6">
          <LosersList losers={monthlyLosers} period="This Month" />
        </TabsContent>

        <TabsContent value="year" className="space-y-4 mt-6">
          <LosersList losers={yearlyLosers} period="This Year" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LosersList({ losers, period }: { losers: LoserStats[]; period: string }) {
  if (losers.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          <Skull className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p>No losers found for {period.toLowerCase()}. Everyone's a winner... for now!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {losers.map((loser, index) => (
        <Card 
          key={loser.user.id} 
          className={cn(
            "transition-all hover:scale-[1.02]",
            index === 0 && "border-destructive/50 bg-destructive/5",
            index === 1 && "border-orange-500/50 bg-orange-500/5",
            index === 2 && "border-yellow-500/50 bg-yellow-500/5"
          )}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              {/* Rank */}
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                {index === 0 ? (
                  <Skull className="h-10 w-10 text-destructive" />
                ) : index === 1 ? (
                  <TrendingDown className="h-8 w-8 text-orange-500" />
                ) : index === 2 ? (
                  <TrendingDown className="h-8 w-8 text-yellow-500" />
                ) : (
                  <span className="text-2xl font-bold text-muted-foreground">#{index + 1}</span>
                )}
              </div>

              {/* Avatar */}
              <Avatar className={cn(
                "h-16 w-16 border-4",
                index === 0 && "border-destructive",
                index === 1 && "border-orange-500",
                index === 2 && "border-yellow-500",
                index > 2 && "border-muted"
              )}>
                <AvatarImage src={loser.user.avatarUrl} alt={loser.user.name} />
                <AvatarFallback className="text-2xl">
                  {loser.user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1">
                <h3 className={cn(
                  "text-xl font-bold",
                  index === 0 && "text-destructive",
                  index === 1 && "text-orange-500",
                  index === 2 && "text-yellow-500"
                )}>
                  {loser.user.name}
                </h3>
                <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                  <span>Losses: <strong className="text-foreground">{loser.totalLosses}</strong></span>
                  <span>Goals Conceded: <strong className="text-foreground">{loser.totalGoalsConceded}</strong></span>
                  <span>Biggest Defeat: <strong className="text-foreground">{loser.biggestDefeatScore}</strong></span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
