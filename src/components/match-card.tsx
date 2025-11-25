import type { Match, User } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";
import { format, parseISO } from 'date-fns';
import { Trophy, Skull, Shield, MessageSquareQuote, ChevronsRight } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";

interface MatchCardProps {
    match: Match;
    currentUser: User;
    showRoast?: boolean;
}

const getOutcome = (match: Match, currentUserId: string) => {
    if (match.winnerId === 'draw') return 'draw';
    return match.winnerId === currentUserId ? 'win' : 'loss';
}

const OutcomeIcon = ({ outcome }: { outcome: 'win' | 'loss' | 'draw' }) => {
    switch (outcome) {
        case 'win':
            return <Trophy className="h-5 w-5 text-primary" />;
        case 'loss':
            return <Skull className="h-5 w-5 text-destructive" />;
        case 'draw':
            return <Shield className="h-5 w-5 text-muted-foreground" />;
    }
}

const getDate = (date: any) => {
    if (!date) return 'Date unknown';
    if (date.toDate) {
      return format(date.toDate(), 'dd MMM yyyy');
    }
    // Attempt to parse if it's a string, might need more robust handling
    try {
        const parsedDate = parseISO(date);
        return format(parsedDate, 'dd MMM yyyy');
    } catch (e) {
        // If it's a different string format or just invalid
        return date.toString();
    }
}

export function MatchCard({ match, currentUser, showRoast = false }: MatchCardProps) {
    const outcome = getOutcome(match, currentUser.id);

    // Determine if current user is Team 1
    let isUserTeam1 = false;
    
    if (match.userTeamSide) {
        // New matches have explicit side
        if (match.userId === currentUser.id) {
            isUserTeam1 = match.userTeamSide === 'team1';
        } else {
            // If viewing as opponent, flip the side
            isUserTeam1 = match.userTeamSide === 'team2';
        }
    } else {
        // Fallback for old matches: try name matching
        isUserTeam1 = match.team1Name.toLowerCase().trim() === currentUser.name.toLowerCase().trim();
    }
    const user = isUserTeam1 ? { name: match.team1Name, avatarUrl: currentUser.avatarUrl } : { name: match.team2Name, avatarUrl: currentUser.avatarUrl };
    const opponent = { name: isUserTeam1 ? match.team2Name : match.team1Name, avatarUrl: '' }; // opponent avatar not stored in match
    
    const userScore = isUserTeam1 ? match.team1Stats.score : match.team2Stats.score;
    const opponentScore = isUserTeam1 ? match.team2Stats.score : match.team1Stats.score;

    const outcomeBgClass = {
        'win': 'bg-primary/10 border-primary/50',
        'loss': 'bg-destructive/10 border-destructive/50',
        'draw': 'bg-muted/10 border-muted/50'
    }[outcome];

    return (
        <Card className={cn("transition-all hover:shadow-lg hover:shadow-primary/10", outcomeBgClass)}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="grid flex-grow grid-cols-[1fr_auto_1fr] items-center gap-4">
                        {/* User */}
                        <div className="flex items-center gap-3 justify-end">
                            <span className="font-semibold text-right truncate">{user.name}</span>
                            <Avatar>
                                <AvatarImage src={user.avatarUrl} alt={user.name} />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </div>

                        {/* Score */}
                        <div className="text-center">
                            <div className="flex items-center gap-2">
                                <span className={cn("font-headline text-4xl", outcome === 'win' && 'text-primary')}>{userScore}</span>
                                <span className="font-headline text-2xl text-muted-foreground">-</span>
                                <span className={cn("font-headline text-4xl", outcome === 'loss' && 'text-destructive/80')}>{opponentScore}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-2">
                                <OutcomeIcon outcome={outcome} />
                                <span>{getDate(match.date)}</span>
                            </div>
                        </div>

                        {/* Opponent */}
                        <div className="flex items-center gap-3 justify-start">
                             <Avatar>
                                <AvatarFallback>{opponent.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-left truncate">{opponent.name}</span>
                        </div>
                    </div>
                    <Link href={`/matches/${match.id}`} passHref>
                        <Button variant="ghost" size="icon" className="ml-4">
                            <ChevronsRight className="h-5 w-5"/>
                        </Button>
                    </Link>
                </div>
                 {showRoast && match.roast && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                        <blockquote className="flex items-start gap-3 text-sm text-muted-foreground italic">
                            <MessageSquareQuote className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                           <span>"{match.roast}"</span>
                        </blockquote>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
