import type { Match, User } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";
import { format, parseISO } from 'date-fns';
import { Trophy, Skull, Shield, MessageSquareQuote, ChevronsRight, Pencil } from "lucide-react";
import { Crown } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { MessageCircle, Send, Mic } from "lucide-react";
import { useState, useEffect } from "react";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { Input } from "./ui/input";
import type { Comment } from "@/lib/types";
import { EditRoastDialog } from "./edit-roast-dialog";
import { useToast } from "@/hooks/use-toast";
import { VoiceNoteRecorder, VoiceNotePlayer } from "./voice-note";
import type { VoiceRecording } from "@/lib/audio-recorder";

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
    const { toast } = useToast();
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditRoastOpen, setIsEditRoastOpen] = useState(false);
    const [isRecordingVoice, setIsRecordingVoice] = useState(false);
    const [voiceRecording, setVoiceRecording] = useState<VoiceRecording | null>(null);

    // Fetch opponent's user data to get their avatar
    const team1UserId = match.team1Stats.userId;
    const team2UserId = match.team2Stats.userId;
    
    const team1UserRef = useMemoFirebase(() => 
        (firestore && team1UserId && team1UserId !== currentUser.id) 
            ? doc(firestore, 'users', team1UserId) 
            : null,
        [firestore, team1UserId, currentUser.id]
    );
    
    const team2UserRef = useMemoFirebase(() => 
        (firestore && team2UserId && team2UserId !== currentUser.id) 
            ? doc(firestore, 'users', team2UserId) 
            : null,
        [firestore, team2UserId, currentUser.id]
    );
    
    const { data: team1User } = useDoc<User>(team1UserRef);
    const { data: team2User } = useDoc<User>(team2UserRef);

    const handlePostComment = async () => {
        if ((!newComment.trim() && !voiceRecording) || !firestore) return;
        
        setIsSubmitting(true);
        try {
            const comment: Comment = {
                id: crypto.randomUUID(),
                user: currentUser,
                text: newComment.trim() || '🎤 Voice note',
                timestamp: new Date().toISOString(),
                ...(voiceRecording && { voiceNote: voiceRecording })
            };

            const matchRef = doc(firestore, 'matches', match.id);
            await updateDoc(matchRef, {
                comments: arrayUnion(comment)
            });
            
            setNewComment('');
            setVoiceRecording(null);
            
            toast({
                title: "Comment Posted!",
                description: "Your comment has been added successfully.",
            });
        } catch (error) {
            console.error("Error adding comment:", error);
            toast({
                variant: "destructive",
                title: "Failed to Post Comment",
                description: error instanceof Error ? error.message : "Could not post your comment. Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVoiceRecordingComplete = (recording: VoiceRecording) => {
        setVoiceRecording(recording);
        setIsRecordingVoice(false);
    };

    const handleCancelVoiceRecording = () => {
        setIsRecordingVoice(false);
        setVoiceRecording(null);
    };

    const handleSaveRoast = async (newRoast: string) => {
        if (!firestore) return;

        try {
            const matchRef = doc(firestore, 'matches', match.id);
            await updateDoc(matchRef, { roast: newRoast });
            
            toast({
                title: "Roast Updated!",
                description: "Match roast has been successfully updated.",
            });
        } catch (error) {
            console.error("Error updating roast:", error);
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: "Could not update the roast. Please try again.",
            });
        }
    };

    // Check if current user can edit the roast (must be the winner)
    const canEditRoast = match.winnerId && match.winnerId !== 'draw' && match.winnerId === currentUser.id;

    const outcome = getOutcome(match, currentUser.id);

    // Determine avatars - now fetching opponent's avatar too!
    let team1AvatarUrl = '';
    let team2AvatarUrl = '';

    // Set avatars based on who played
    if (team1UserId === currentUser.id) {
        team1AvatarUrl = currentUser.avatarUrl;
        team2AvatarUrl = team2User?.avatarUrl || '';
    } else if (team2UserId === currentUser.id) {
        team2AvatarUrl = currentUser.avatarUrl;
        team1AvatarUrl = team1User?.avatarUrl || '';
    } else {
        // Neither team is current user (viewing someone else's match)
        team1AvatarUrl = team1User?.avatarUrl || '';
        team2AvatarUrl = team2User?.avatarUrl || '';
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
                        {/* Comments List */}
                        {match.comments && match.comments.length > 0 ? (
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                {match.comments.map((comment) => (
                                    <div key={comment.id} className="flex gap-3">
                                        <Avatar className="h-8 w-8 flex-shrink-0">
                                            <AvatarImage src={comment.user.avatarUrl} alt={comment.user.name} />
                                            <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-sm">{comment.user.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(comment.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <p className="text-sm mt-0.5">{comment.text}</p>
                                            {/* Voice Note Player */}
                                            {comment.voiceNote && (
                                                <VoiceNotePlayer 
                                                    voiceNote={comment.voiceNote} 
                                                    className="mt-2"
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-2">No comments yet. Be the first!</p>
                        )}

                        {/* Voice Note Recorder / Comment Input */}
                        {isRecordingVoice ? (
                            <VoiceNoteRecorder
                                onRecordingComplete={handleVoiceRecordingComplete}
                                onCancel={handleCancelVoiceRecording}
                            />
                        ) : (
                            <div className="space-y-3">
                                {/* Voice Note Player (if exists) */}
                                {voiceRecording && (
                                    <div className="space-y-2 p-2 bg-muted/30 rounded-lg border border-border/50">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                                <Mic className="h-3 w-3" /> Voice note ready
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 text-xs hover:text-destructive"
                                                    onClick={() => setVoiceRecording(null)}
                                                >
                                                    Remove
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    className="h-6 text-xs gap-1"
                                                    onClick={handlePostComment}
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting ? (
                                                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-background border-t-transparent" />
                                                    ) : (
                                                        <>
                                                            <Send className="h-3 w-3" />
                                                            Send
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                        <VoiceNotePlayer voiceNote={voiceRecording} />
                                    </div>
                                )}

                                {/* Input Area */}
                                <div className="flex gap-2">
                                    <Input
                                        placeholder={voiceRecording ? "Add a caption..." : "Add a comment..."}
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handlePostComment();
                                            }
                                        }}
                                        disabled={isSubmitting}
                                    />
                                    {!voiceRecording && (
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            onClick={() => setIsRecordingVoice(true)}
                                            disabled={isSubmitting}
                                            title="Record voice note (10s max)"
                                        >
                                            <Mic className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button
                                        size="icon"
                                        onClick={handlePostComment}
                                        disabled={isSubmitting || (!newComment.trim() && !voiceRecording)}
                                    >
                                        {isSubmitting ? (
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                 {showRoast && match.roast && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                        <div className="flex items-start justify-between gap-3">
                            <blockquote className="flex items-start gap-3 text-sm text-muted-foreground italic flex-1">
                                <MessageSquareQuote className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                                <span>"{match.roast}"</span>
                            </blockquote>
                            {canEditRoast && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsEditRoastOpen(true)}
                                    className="h-8 w-8 flex-shrink-0"
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                )}
                
                {/* Edit Roast Dialog */}
                {match.roast && (
                    <EditRoastDialog
                        open={isEditRoastOpen}
                        onOpenChange={setIsEditRoastOpen}
                        initialRoast={match.roast}
                        onSave={handleSaveRoast}
                        title="Edit Match Roast"
                        description="Update the match roast below."
                    />
                )}
            </CardContent>
        </Card>
    );
}
