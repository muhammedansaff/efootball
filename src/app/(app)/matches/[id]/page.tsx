'use client';

import { useDoc, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import type { Match, PlayerStats, User } from "@/lib/types";
import { doc, collection } from "firebase/firestore";
import { notFound, useParams } from "next/navigation";
import { Loader2, Shield, Goal, Target, Disc3, Percent, Footprints, Hand, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const StatItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
    <div className="flex justify-between items-center text-sm py-2 border-b border-border/50">
        <div className="flex items-center gap-2 text-muted-foreground">
            {icon}
            <span>{label}</span>
        </div>
        <span className="font-semibold">{value}</span>
    </div>
);

const PlayerStatsCard = ({ player, stats, avatarUrl }: { player: string, stats: PlayerStats, avatarUrl?: string }) => {
    const passAccuracy = stats.passes > 0 ? Math.round((stats.successfulPasses / stats.passes) * 100) : 0;
    const shotAccuracy = stats.shots > 0 ? Math.round((stats.shotsOnTarget / stats.shots) * 100) : 0;

    return (
        <Card>
            <CardHeader className="flex-row items-center gap-4 space-y-0">
                <Avatar className="h-12 w-12">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={player} />}
                    <AvatarFallback>{player.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-2xl">{player}</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <StatItem icon={<Target className="h-4 w-4"/>} label="Shots (on target)" value={`${stats.shots} (${stats.shotsOnTarget})`} />
                <StatItem icon={<Percent className="h-4 w-4"/>} label="Shot Accuracy" value={`${shotAccuracy}%`} />
                <StatItem icon={<Disc3 className="h-4 w-4"/>} label="Passes (completed)" value={`${stats.passes} (${stats.successfulPasses})`} />
                <StatItem icon={<Percent className="h-4 w-4"/>} label="Pass Accuracy" value={`${passAccuracy}%`} />
                <StatItem icon={<Footprints className="h-4 w-4"/>} label="Tackles" value={stats.tackles} />
                <StatItem icon={<Hand className="h-4 w-4"/>} label="Saves" value={stats.saves} />
                <StatItem icon={<AlertTriangle className="h-4 w-4"/>} label="Fouls" value={stats.fouls} />
            </CardContent>
        </Card>
    )
}


export default function MatchDetailsPage() {
    const params = useParams();
    const matchId = params.id as string;
    const firestore = useFirestore();

    const matchRef = useMemoFirebase(() => firestore ? doc(firestore, 'matches', matchId) : null, [firestore, matchId]);
    const { data: match, isLoading: isLoadingMatch } = useDoc<Match>(matchRef);
    
    const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
    const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);

    if (isLoadingMatch || isLoadingUsers) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    if (!match) {
        notFound();
    }
    
    const team1Id = match.participants.find(p => p !== match.opponentId)!;
    const team2Id = match.opponentId;

    const team1User = users?.find(u => u.id === team1Id);
    const team2User = users?.find(u => u.id === team2Id);

    const date = match.date ? (match.date as any).toDate ? format((match.date as any).toDate(), 'PPP') : format(new Date(match.date as string), 'PPP') : 'N/A';

    return (
        <div className="space-y-8">
            <PageHeader 
                title={`${match.team1Name} vs ${match.team2Name}`}
                description={`Match played on ${date}`}
            />
            
            <Card>
                <CardContent className="p-6 text-center">
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                        <div className="flex flex-col items-center gap-2">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={team1User?.avatarUrl} />
                                <AvatarFallback>{match.team1Name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-bold text-xl">{match.team1Name}</span>
                        </div>
                        <div className="font-headline text-6xl">
                            <span className={cn(match.team1Stats.score > match.team2Stats.score && "text-primary")}>{match.team1Stats.score}</span>
                            <span className="mx-4 text-muted-foreground">-</span>
                            <span className={cn(match.team2Stats.score > match.team1Stats.score && "text-primary")}>{match.team2Stats.score}</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                             <Avatar className="h-16 w-16">
                                <AvatarImage src={team2User?.avatarUrl} />
                                <AvatarFallback>{match.team2Name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-bold text-xl">{match.team2Name}</span>
                        </div>
                    </div>
                    {match.roast && (
                        <blockquote className="mt-6 text-accent-foreground italic text-center text-sm max-w-2xl mx-auto">
                            "{match.roast}"
                        </blockquote>
                    )}
                </CardContent>
            </Card>

            <h2 className="font-headline text-3xl text-primary">Match Statistics</h2>

            <div className="grid md:grid-cols-2 gap-8">
                <PlayerStatsCard player={match.team1Name} stats={match.team1Stats} avatarUrl={team1User?.avatarUrl} />
                <PlayerStatsCard player={match.team2Name} stats={match.team2Stats} avatarUrl={team2User?.avatarUrl} />
            </div>

        </div>
    )
}
