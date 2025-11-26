import type { Match, User } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";
import { format, parseISO } from 'date-fns';
import { Trophy, Skull, Shield, MessageSquareQuote, ChevronsRight } from "lucide-react";
import { Crown } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { useFirestore } from "@/firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { Input } from "./ui/input";
import type { Comment } from "@/lib/types";

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
    const firestore = useFirestore();
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handlePostComment = async () => {
        if (!newComment.trim() || !firestore) return;
        
        setIsSubmitting(true);
        try {
            const comment: Comment = {
                id: crypto.randomUUID(),
                user: currentUser,
                text: newComment.trim(),
                timestamp: new Date().toISOString()
            };

            const matchRef = doc(firestore, 'matches', match.id);
            await updateDoc(matchRef, {
                comments: arrayUnion(comment)
            });
            
            setNewComment('');
        } catch (error) {
            console.error("Error adding comment:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

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
                
                <div className="flex items-center gap-2 mt-4">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-muted-foreground hover:text-primary"
                        onClick={() => setIsCommentsOpen(!isCommentsOpen)}
                    >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {match.comments?.length || 0} Comments
                    </Button>
                </div>

                {isCommentsOpen && (
                    <div className="mt-4 space-y-4 border-t border-border/50 pt-4">
                        <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                            {match.comments?.map((comment) => (
                                <div key={comment.id} className="flex gap-3 items-start">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={comment.user.avatarUrl} alt={comment.user.name} />
                                        <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold">{comment.user.name}</span>
                                            <span className="text-xs text-muted-foreground">{getDate(comment.timestamp)}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{comment.text}</p>
                                    </div>
                                </div>
                            ))}
                            {(!match.comments || match.comments.length === 0) && (
                                <p className="text-sm text-muted-foreground text-center py-2">No comments yet. Be the first!</p>
                            )}
                        </div>
                        
                        <div className="flex gap-2">
                            <Input 
                                placeholder="Add a comment..." 
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handlePostComment();
                                    }
                                }}
                            />
                            <Button 
                                size="icon" 
                                onClick={handlePostComment} 
                                disabled={!newComment.trim() || isSubmitting}
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
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
