import type { Match, User } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";
import { format, parseISO } from 'date-fns';
import { Trophy, Skull, Shield, MessageSquareQuote, ChevronsRight, Crown } from "lucide-react";
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

    // Determine avatars based on userId in stats
    // If team1Stats.userId matches currentUser, show currentUser avatar.
    // If team2Stats.userId matches currentUser, show currentUser avatar.
    // For the opponent, we don't always have the avatar URL unless we fetch it.
    // However, we can try to infer it if we know the match participants.
    
    // Logic:
    // 1. If team1Stats.userId === currentUser.id -> Team 1 is Current User
    // 2. If team2Stats.userId === currentUser.id -> Team 2 is Current User
    
    let team1AvatarUrl = '';
    let team2AvatarUrl = '';

    // Check if we have userIds in stats (new matches)
    if (match.team1Stats.userId || match.team2Stats.userId) {
        if (match.team1Stats.userId === currentUser.id) {
            team1AvatarUrl = currentUser.avatarUrl;
        }
        if (match.team2Stats.userId === currentUser.id) {
            team2AvatarUrl = currentUser.avatarUrl;
        }
    } else {
        // Fallback for old matches without userIds in stats
        // Use the old logic: check createdBy/userId and userTeamSide
        const uploaderId = match.createdBy || (match as any).userId;
        const isUploaderTeam1 = match.userTeamSide ? match.userTeamSide === 'team1' : true; // Default to true for very old matches
        
        if (uploaderId === currentUser.id) {
            if (isUploaderTeam1) team1AvatarUrl = currentUser.avatarUrl;
            else team2AvatarUrl = currentUser.avatarUrl;
        }
    }

    const score1 = match.team1Stats.score;
    const score2 = match.team2Stats.score;
    const winner = score1 > score2 ? 'team1' : score2 > score1 ? 'team2' : 'draw';

    return (
        <Card className={cn("transition-all hover:shadow-lg hover:shadow-primary/10")}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="grid flex-grow grid-cols-[1fr_auto_1fr] items-center gap-4">
                        {/* Team 1 (Left) */}
                        <div className="flex items-center gap-3 justify-end">
                            <span className="font-semibold text-right truncate">{match.team1Name}</span>
                            <div className="relative">
                                <Avatar>
                                    <AvatarImage src={team1AvatarUrl} alt={match.team1Name} />
                                    <AvatarFallback>{match.team1Name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {winner === 'team1' && (
                                    <div className="absolute -top-3 -right-1 bg-background rounded-full p-0.5 shadow-sm border border-border/50">
                                        <Crown className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Score */}
                        <div className="text-center">
                            <div className="flex items-center gap-2 justify-center">
                                <span className={cn("font-headline text-4xl", winner === 'team1' ? "text-yellow-500" : winner === 'team2' ? "text-red-500" : "")}>{score1}</span>
                                <span className="font-headline text-2xl text-muted-foreground">-</span>
                                <span className={cn("font-headline text-4xl", winner === 'team2' ? "text-yellow-500" : winner === 'team1' ? "text-red-500" : "")}>{score2}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-2">
                                <OutcomeIcon outcome={outcome} />
                                <span>{getDate(match.date)}</span>
                            </div>
                        </div>

                        {/* Team 2 (Right) */}
                        <div className="flex items-center gap-3 justify-start">
                             <div className="relative">
                                <Avatar>
                                    <AvatarImage src={team2AvatarUrl} alt={match.team2Name} />
                                    <AvatarFallback>{match.team2Name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {winner === 'team2' && (
                                    <div className="absolute -top-3 -left-1 bg-background rounded-full p-0.5 shadow-sm border border-border/50">
                                        <Crown className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                    </div>
                                )}
                            </div>
                            <span className="font-semibold text-left truncate">{match.team2Name}</span>
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
