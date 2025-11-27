'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MatchCard } from '@/components/match-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowRight, Crown, Skull, X } from 'lucide-react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import type { Match, User } from '@/lib/types';


export default function DashboardPage() {
  const { appUser } = useAuth();
  const firestore = useFirestore();

  const allUsersQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'users'), orderBy('stats.wins', 'desc'), limit(5)) : null, 
    [firestore]
  );
  const { data: leaderboard, isLoading: isLoadingLeaderboard } = useCollection<User>(allUsersQuery);

  const recentMatchesQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'matches'), orderBy('date', 'desc'), limit(4)) : null,
    [firestore]
  );
  const { data: recentMatches, isLoading: isLoadingMatches } = useCollection<Match>(recentMatchesQuery);

  // Get all matches for biggest loser calculation
  const allMatchesQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'matches'), orderBy('date', 'desc')) : null,
    [firestore]
  );
  const { data: allMatches } = useCollection<Match>(allMatchesQuery);

  // Get all users for loser profile
  const allUsersQuery2 = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'users')) : null, 
    [firestore]
  );
  const { data: allUsers } = useCollection<User>(allUsersQuery2);

  // Calculate the biggest loss (highest losing score conceded)
  const biggestLoss = useMemo<Match | null>(() => {
    if (!allMatches || allMatches.length === 0) return null;
    
    let maxConceded = 0;
    let biggestLossMatch: Match | null = null;
    
    allMatches.forEach(match => {
      // Skip draws
      if (match.winnerId === 'draw') return;
      
      // Get the loser's conceded score
      const team1Score = match.team1Stats.score;
      const team2Score = match.team2Stats.score;
      const loserConceded = Math.max(team1Score, team2Score);
      
      if (loserConceded > maxConceded) {
        maxConceded = loserConceded;
        biggestLossMatch = match;
      }
    });
    
    return biggestLossMatch;
  }, [allMatches]);

  // Get loser info
  const getLoserInfo = () => {
    if (!biggestLoss || !allUsers) return null;
    
    const loserId = biggestLoss.winnerId === biggestLoss.team1Stats.userId 
      ? biggestLoss.team2Stats.userId 
      : biggestLoss.team1Stats.userId;
    
    const loser = allUsers.find(u => u.id === loserId);
    const loserScore = biggestLoss.winnerId === biggestLoss.team1Stats.userId
      ? biggestLoss.team2Stats.score
      : biggestLoss.team1Stats.score;
    const winnerScore = biggestLoss.winnerId === biggestLoss.team1Stats.userId
      ? biggestLoss.team1Stats.score
      : biggestLoss.team2Stats.score;
    
    return { loser, loserScore, winnerScore };
  };

  // First-time display logic for dashboard
  const [showLoserCelebration, setShowLoserCelebration] = useState(false);
  const [showSuspense, setShowSuspense] = useState(true);
  
  useEffect(() => {
    const lastSeenTimestamp = localStorage.getItem('hasSeenBiggestLoserDashboard');
    const now = Date.now();
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
    
    // Show if never seen OR if more than 1 hour has passed since last viewing
    const shouldShow = !lastSeenTimestamp || (now - parseInt(lastSeenTimestamp)) > oneHour;
    
    if (shouldShow && biggestLoss && !isLoadingMatches) {
      // Delay to create suspense
      setTimeout(() => {
        setShowLoserCelebration(true);
        setShowSuspense(true);
        // Hide suspense text and reveal profile after 2.5 seconds
        setTimeout(() => {
          setShowSuspense(false);
        }, 2500);
      }, 1500);
    }
  }, [biggestLoss, isLoadingMatches]);

  const handleCloseLoserCelebration = () => {
    setShowLoserCelebration(false);
    setShowSuspense(true);
    // Store current timestamp instead of just 'true'
    localStorage.setItem('hasSeenBiggestLoserDashboard', Date.now().toString());
  };


  if (!appUser) return null;

  return (
    <div className="space-y-8">
      {/* Biggest Loser Celebration Modal */}
      {showLoserCelebration && getLoserInfo() && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background p-4 animate-in fade-in duration-500">
          <div className="relative w-full max-w-lg animate-in zoom-in duration-700">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-2 -right-2 z-30 h-10 w-10 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg"
              onClick={handleCloseLoserCelebration}
            >
              <X className="h-5 w-5" />
            </Button>
            
            {showSuspense ? (
              // Suspense Phase
              <Card className="border-destructive/50 bg-gradient-to-br from-destructive/20 via-background to-destructive/10 shadow-2xl">
                <CardContent className="p-12 text-center space-y-6">
                  <div className="flex justify-center">
                    <Skull className="h-24 w-24 text-destructive animate-bounce" />
                  </div>
                  <h2 className="text-4xl md:text-5xl font-headline text-destructive animate-pulse">
                    Guess who's the
                  </h2>
                  <h1 className="text-6xl md:text-7xl font-headline text-destructive animate-pulse">
                    LOOOOOSER
                  </h1>
                  <h2 className="text-4xl md:text-5xl font-headline text-destructive animate-pulse">
                    of the day?
                  </h2>
                  <div className="flex justify-center gap-2 mt-8">
                    <div className="h-3 w-3 bg-destructive rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-3 w-3 bg-destructive rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-3 w-3 bg-destructive rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </CardContent>
              </Card>
            ) : (
              // Reveal Phase
              <Card className="border-destructive/50 bg-gradient-to-br from-destructive/20 via-background to-destructive/10 shadow-2xl animate-in zoom-in duration-500">
                <CardHeader className="text-center space-y-3 pb-6">
                  <div className="flex justify-center animate-bounce">
                    <Skull className="h-16 w-16 text-destructive animate-pulse" />
                  </div>
                  <CardTitle className="text-3xl md:text-4xl font-headline text-destructive">
                    BIGGEST LOOOOOSER!
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4 pb-6">
                  <div className="relative animate-in zoom-in duration-700">
                    <div className="absolute inset-0 bg-destructive/20 blur-2xl animate-pulse" />
                    <Avatar className="h-28 w-28 border-6 border-destructive shadow-2xl relative z-10">
                      <AvatarImage src={getLoserInfo()?.loser?.avatarUrl || ''} alt={getLoserInfo()?.loser?.name || 'User'} />
                      <AvatarFallback className="text-5xl bg-destructive/20">
                        {getLoserInfo()?.loser?.name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="text-center space-y-2 animate-in slide-in-from-bottom duration-700">
                    <h2 className="text-3xl font-bold text-destructive">
                      {getLoserInfo()?.loser?.name}
                    </h2>
                    <p className="text-xl text-muted-foreground">
                      Conceded <span className="text-destructive font-bold text-3xl">{getLoserInfo()?.winnerScore}</span> Goals!
                    </p>
                    <p className="text-lg text-muted-foreground">
                      Score: {getLoserInfo()?.loserScore} - {getLoserInfo()?.winnerScore}
                    </p>
                  </div>

                  <div className="w-full max-w-sm space-y-1.5 animate-in slide-in-from-bottom duration-700 delay-150">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Shame Level</span>
                      <span className="font-bold text-destructive">MAXIMUM</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-destructive to-red-600 animate-pulse" style={{ width: '100%' }} />
                    </div>
                  </div>

                  <p className="text-center text-sm text-muted-foreground italic max-w-sm animate-in fade-in duration-700 delay-300">
                    "This performance will be remembered... for all the wrong reasons! 💀"
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      <PageHeader
        title={`Welcome back, ${appUser.name}!`}
        description="Here's the latest action from the Banter Barn."
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
            <div className='flex items-center justify-between'>
                <h2 className="font-headline text-3xl text-primary">Recent Matches</h2>
                 <Link href="/matches" passHref>
                    <Button variant="ghost" size="sm">View All <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </Link>
            </div>
            {isLoadingMatches && <p>Loading matches...</p>}
            {recentMatches && recentMatches.map((match) => (
                <MatchCard key={match.id} match={match} currentUser={appUser} showRoast={true} />
            ))}
            {!isLoadingMatches && recentMatches?.length === 0 && (
              <Card className="flex items-center justify-center h-40">
                <CardContent className="text-center text-muted-foreground p-6">
                  <p>No matches yet. Upload your first match to get started!</p>
                </CardContent>
              </Card>
            )}
        </div>

        <div className="space-y-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Leaderboard</CardTitle>
                    <Link href="/leaderboard" passHref>
                        <Button variant="ghost" size="sm">View All <ArrowRight className="ml-2 h-4 w-4" /></Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {isLoadingLeaderboard && <p>Loading leaderboard...</p>}
                    {leaderboard && (
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead className="w-[50px]">Rank</TableHead>
                                  <TableHead>Player</TableHead>
                                  <TableHead className="text-right">Wins</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                          {leaderboard.map((player, index) => (
                              <TableRow key={player.id} className={cn(index + 1 === 1 && "bg-primary/10")}>
                                  <TableCell className="font-medium text-center">
                                      <div className="flex items-center justify-center">
                                          {index + 1 === 1 ? <Crown className="h-5 w-5 text-primary" /> : index + 1}
                                      </div>
                                  </TableCell>
                                  <TableCell>
                                      <div className="flex items-center gap-2">
                                          <Avatar className='h-8 w-8'>
                                              <AvatarImage src={player.avatarUrl} alt={player.name} />
                                              <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                                          </Avatar>
                                          <span className="font-semibold text-sm truncate">{player.name}</span>
                                      </div>
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-sm">{player.stats.wins}</TableCell>
                              </TableRow>
                          ))}
                          </TableBody>
                      </Table>
                    )}
                </CardContent>
</Card>
<div className="space-y-8">
  <Card className="h-full">
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle>Stats Overview</CardTitle>
      <Link href="/stats" passHref>
        <Button variant="ghost" size="sm">
          View All <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </CardHeader>
    <CardContent className="p-4">
      <p className="text-sm text-muted-foreground">
        Check top performers: best passer, most violent player, best shooter.
      </p>
    </CardContent>
  </Card>
</div>
</div>
      </div>
    </div>
  );
}
