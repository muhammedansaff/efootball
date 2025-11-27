'use client';

import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { MatchCard } from "@/components/match-card";
import { useAuth } from "@/providers/auth-provider";
import { UploadMatchButton } from "@/components/upload-match-button";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, where } from "firebase/firestore";
import type { Match, User } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trophy, Skull, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function MatchesPage() {
    const { appUser } = useAuth();
    const firestore = useFirestore();
    const [filter, setFilter] = useState<'all' | 'mine'>('all');

    const matchesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        
        if (filter === 'mine' && appUser) {
            return query(
                collection(firestore, 'matches'), 
                where('participants', 'array-contains', appUser.id), 
                orderBy('date', 'desc')
            );
        }
        
        return query(collection(firestore, 'matches'), orderBy('date', 'desc'));
    }, [firestore, filter, appUser]);
    
    const { data: matches, isLoading } = useCollection<Match>(matchesQuery);

    // Get all users for loser profile
    const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users')) : null, [firestore]);
    const { data: users } = useCollection<User>(usersQuery);

    // Calculate the biggest win (highest winning score, not goal difference)
    const biggestWin = useMemo<Match | null>(() => {
        if (!matches || matches.length === 0) return null;
        
        let maxScore = 0;
        let biggestWinMatch: Match | null = null;
        
        matches.forEach(match => {
            // Skip draws
            if (match.winnerId === 'draw') return;
            
            // Get the winner's score
            const team1Score = match.team1Stats.score;
            const team2Score = match.team2Stats.score;
            const winnerScore = Math.max(team1Score, team2Score);
            
            if (winnerScore > maxScore) {
                maxScore = winnerScore;
                biggestWinMatch = match;
            }
        });
        
        return biggestWinMatch;
    }, [matches]);

    // Calculate the biggest loss (highest losing score conceded)
    const biggestLoss = useMemo<Match | null>(() => {
        if (!matches || matches.length === 0) return null;
        
        let maxConceded = 0;
        let biggestLossMatch: Match | null = null;
        
        matches.forEach(match => {
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
    }, [matches]);

    // Get loser info
    const getLoserInfo = () => {
        if (!biggestLoss || !users) return null;
        
        const loserId = biggestLoss.winnerId === biggestLoss.team1Stats.userId 
            ? biggestLoss.team2Stats.userId 
            : biggestLoss.team1Stats.userId;
        
        const loser = users.find(u => u.id === loserId);
        const loserScore = biggestLoss.winnerId === biggestLoss.team1Stats.userId
            ? biggestLoss.team2Stats.score
            : biggestLoss.team1Stats.score;
        const winnerScore = biggestLoss.winnerId === biggestLoss.team1Stats.userId
            ? biggestLoss.team1Stats.score
            : biggestLoss.team2Stats.score;
        
        return { loser, loserScore, winnerScore };
    };

    // First-time display logic
  const [showLoserCelebration, setShowLoserCelebration] = useState(false);
  const [showSuspense, setShowSuspense] = useState(true);
  
  useEffect(() => {
    const lastSeenTimestamp = localStorage.getItem('hasSeenBiggestLoser');
    const now = Date.now();
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
    
    // Show if never seen OR if more than 1 hour has passed since last viewing
    const shouldShow = !lastSeenTimestamp || (now - parseInt(lastSeenTimestamp)) > oneHour;
    
    if (shouldShow && biggestLoss && !isLoading) {
      // Delay to create suspense
      setTimeout(() => {
        setShowLoserCelebration(true);
        setShowSuspense(true);
        // Hide suspense text and reveal profile after 2.5 seconds
        setTimeout(() => {
          setShowSuspense(false);
        }, 2500);
      }, 1000);
    }
  }, [biggestLoss, isLoading]);

  const handleCloseLoserCelebration = () => {
    setShowLoserCelebration(false);
    setShowSuspense(true);
    // Store current timestamp instead of just 'true'
    localStorage.setItem('hasSeenBiggestLoser', Date.now().toString());
  };

    if (!appUser) return null;

    return (
        <div className="space-y-8">
            <PageHeader
                title="Matches"
                description="Every match from the Banter Barn community."
            >
                <UploadMatchButton />
            </PageHeader>
            
            <Tabs value={filter} onValueChange={(value) => setFilter(value as 'all' | 'mine')} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="all">All Matches</TabsTrigger>
                    <TabsTrigger value="mine">My Matches Only</TabsTrigger>
                </TabsList>
            </Tabs>

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

            {/* Biggest Win Highlight */}
            {!isLoading && biggestWin && (
                <Card className="border-primary/50 bg-gradient-to-r from-primary/10 to-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Trophy className="h-6 w-6 text-primary" />
                            Biggest Win - Highest Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Winner</p>
                                    <p className="text-2xl font-bold">
                                        {biggestWin.winnerId === biggestWin.team1Stats.userId 
                                            ? biggestWin.team1Name 
                                            : biggestWin.team2Name}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground mb-1">Score</p>
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl font-bold text-primary">
                                            {biggestWin.team1Stats.score}
                                        </span>
                                        <span className="text-2xl text-muted-foreground">-</span>
                                        <span className="text-3xl font-bold text-primary">
                                            {biggestWin.team2Stats.score}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-sm text-muted-foreground">Winning Score</p>
                                    <p className="text-2xl font-bold text-primary">
                                        {Math.max(biggestWin.team1Stats.score, biggestWin.team2Stats.score)} Goals
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
            
            <div className="space-y-4">
                {isLoading && (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
                {matches && matches.map(match => (
                    <MatchCard key={match.id} match={match} currentUser={appUser} />
                ))}
                {!isLoading && matches?.length === 0 && (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            {filter === 'mine' 
                                ? "You haven't uploaded any matches yet."
                                : "No matches have been uploaded yet. Be the first!"
                            }
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
