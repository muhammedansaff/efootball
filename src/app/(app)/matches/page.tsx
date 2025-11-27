'use client';

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { MatchCard } from "@/components/match-card";
import { useAuth } from "@/providers/auth-provider";
import { UploadMatchButton } from "@/components/upload-match-button";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, where } from "firebase/firestore";
import type { Match } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trophy } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
