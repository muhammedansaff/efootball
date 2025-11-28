'use client';

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Loader2, BarChart2, Shield, Goal, Swords } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, where } from "firebase/firestore";
import type { Match, User } from "@/lib/types";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatCard } from "@/components/stat-card";

interface Rival extends User {
    matchCount: number;
    wins: number;
    losses: number;
    draws: number;
    goalsFor: number;
    goalsAgainst: number;
}

export default function RivalsPage() {
    const { appUser } = useAuth();
    const firestore = useFirestore();
    const [topRival, setTopRival] = useState<Rival | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const matchesQuery = useMemoFirebase(() =>
        (appUser && firestore) ? query(collection(firestore, 'matches'), where('participants', 'array-contains', appUser.id), orderBy('date', 'desc')) : null,
        [firestore, appUser]
    );
    const { data: matches, isLoading: isLoadingMatches } = useCollection<Match>(matchesQuery);

    const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users')) : null, [firestore]);
    const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);

    useEffect(() => {
        if (isLoadingMatches || isLoadingUsers || !matches || !users || !appUser) {
            setIsLoading(isLoadingMatches || isLoadingUsers || !appUser);
            return;
        }

        const rivalries: Record<string, { matchCount: number, wins: number, losses: number, draws: number, goalsFor: number, goalsAgainst: number }> = {};

        matches.forEach(match => {
            const opponentId = match.participants.find(p => p !== appUser.id);
            if (!opponentId) return;

            if (!rivalries[opponentId]) {
                rivalries[opponentId] = { matchCount: 0, wins: 0, losses: 0, draws: 0, goalsFor: 0, goalsAgainst: 0 };
            }

            rivalries[opponentId].matchCount++;
            
            const userIsTeam1 = match.team1Name.toLowerCase().trim() === appUser.name.toLowerCase().trim();
            const userScore = userIsTeam1 ? match.team1Stats.score : match.team2Stats.score;
            const opponentScore = userIsTeam1 ? match.team2Stats.score : match.team1Stats.score;

            rivalries[opponentId].goalsFor += userScore;
            rivalries[opponentId].goalsAgainst += opponentScore;

            if (match.winnerId === appUser.id) {
                rivalries[opponentId].wins++;
            } else if (match.winnerId === opponentId) {
                rivalries[opponentId].losses++;
            } else {
                rivalries[opponentId].draws++;
            }
        });

        const topRivalId = Object.keys(rivalries).sort((a, b) => rivalries[b].matchCount - rivalries[a].matchCount)[0];

        if (topRivalId) {
            const rivalUser = users.find(u => u.id === topRivalId);
            if (rivalUser) {
                setTopRival({
                    ...rivalUser,
                    ...rivalries[topRivalId],
                });
            }
        }

        setIsLoading(false);

    }, [matches, users, appUser, isLoadingMatches, isLoadingUsers]);


    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
            <PageHeader
                title="Rivals"
                description="Know your enemy. Especially the one who keeps beating you."
            />
            
            {topRival ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-4">
                            <Swords className="h-8 w-8 text-primary"/>
                            <div>
                                Your Top Rival: 
                                <span className="text-primary ml-2">{topRival.name}</span>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-lg bg-card-foreground/5">
                             <Avatar className="h-24 w-24 border-4 border-primary">
                                <AvatarImage src={topRival.avatarUrl} alt={topRival.name} />
                                <AvatarFallback className="text-3xl">{topRival.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 flex-grow">
                                <StatCard icon={<BarChart2/>} title="Matches Played" value={topRival.matchCount} />
                                <StatCard icon={<Shield/>} title="Your Wins" value={`${topRival.wins} (${Math.round((topRival.wins/topRival.matchCount)*100)}%)`} />
                                <StatCard icon={<Shield className="text-destructive"/>} title="Your Losses" value={`${topRival.losses} (${Math.round((topRival.losses/topRival.matchCount)*100)}%)`} />
                                <StatCard icon={<Goal/>} title="Goal Difference" value={topRival.goalsFor - topRival.goalsAgainst} />
                            </div>
                        </div>
                        
                         <h3 className="font-headline text-2xl text-primary">Recent Matches vs {topRival.name}</h3>
                         <div className="space-y-4">
                            {matches?.filter(m => m.participants.includes(topRival!.id)).slice(0, 5).map(match => (
                                <Card key={match.id} className="p-4">
                                     <div className="flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground">
                                            {match.date ? new Date((match.date as any).seconds * 1000).toLocaleDateString() : ''}
                                        </p>
                                        <div className="text-center">
                                            <p className="font-bold text-lg">
                                                {match.team1Name} {match.team1Stats.score} - {match.team2Stats.score} {match.team2Name}
                                            </p>
                                            {match.penaltyScore && (
                                                <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                                                    ⚽ Penalties: {match.penaltyScore.team1} - {match.penaltyScore.team2}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>

                    </CardContent>
                </Card>
            ) : (
                <Card className="flex flex-col items-center justify-center text-center min-h-[400px]">
                    <CardHeader>
                        <Users className="h-16 w-16 mx-auto text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <h3 className="text-xl font-bold">No Rivals Yet</h3>
                        <p className="text-muted-foreground">
                            Play some matches to establish a rivalry!
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
