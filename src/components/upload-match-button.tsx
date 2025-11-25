'use client';

import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Upload, FileImage, Loader2, Plus, Crown, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { extractMatchStatsFromImage, ExtractMatchStatsFromImageOutput, PlayerStats } from "@/ai/flows/extract-match-stats-from-image";
import { useAuth } from "@/providers/auth-provider";
import { Card, CardContent } from "./ui/card";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, getDoc, writeBatch, query, arrayUnion, DocumentReference, where, getDocs } from "firebase/firestore";
import { generateMatchRoast } from "@/ai/flows/generate-match-roast";
import type { User, Match, Badge, HallEntry } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { manageBadges } from "@/providers/auth-provider";
import { generateHallOfShameRoast } from "@/ai/flows/generate-hall-of-shame-roast";

const checkAndAwardBadges = async (
    firestore: any,
    userId: string,
    allBadges: Badge[],
): Promise<string[]> => {

    const userRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) return [];
    
    const user = userDoc.data() as User;
    const userStats = user.stats;
    const earnedBadges = user.badges || [];
    
    const newlyAwardedBadges: string[] = [];

    for (const badge of allBadges) {
        if (earnedBadges.includes(badge.id)) continue; // Skip already earned badges

        let criteriaMet = false;
        switch (badge.criteria.stat) {
            case 'wins':
                if (userStats.wins >= badge.criteria.value) criteriaMet = true;
                break;
            case 'losses':
                if (userStats.losses >= badge.criteria.value) criteriaMet = true;
                break;
            case 'goalsFor':
                if (userStats.goalsFor >= badge.criteria.value) criteriaMet = true;
                break;
            case 'winStreak':
                 // NOTE: Win streak logic is complex and would require storing historical match data.
                 // This is a simplified placeholder.
                if (userStats.wins > 0 && userStats.wins % badge.criteria.value === 0) criteriaMet = true;
                break;
            case 'cleanSheets':
                // NOTE: Clean sheets are not tracked yet.
                break;
             case 'tackles':
                if (userStats.tackles >= badge.criteria.value) criteriaMet = true;
                break;
            case 'matchesPlayed':
                if ((userStats.wins + userStats.losses + userStats.draws) >= badge.criteria.value) criteriaMet = true;
                break;
        }

        if (criteriaMet) {
            newlyAwardedBadges.push(badge.id);
        }
    }
    
    return newlyAwardedBadges;
};


const createMatchHash = (stats: ExtractMatchStatsFromImageOutput, userId: string, opponentId: string): string => {
    const { team1Stats, team2Stats } = stats;
    const sortedParticipants = [userId, opponentId].sort();

    const fields = [
        sortedParticipants[0],
        sortedParticipants[1],
        team1Stats.score, team2Stats.score,
        team1Stats.possession, team2Stats.possession,
        team1Stats.shots, team2Stats.shots,
        team1Stats.shotsOnTarget, team2Stats.shotsOnTarget,
        team1Stats.saves, team2Stats.saves,
        team1Stats.passes, team2Stats.passes,
        team1Stats.tackles, team2Stats.tackles,
        team1Stats.fouls, team2Stats.fouls,
    ];
    return fields.join('|');
}

export function UploadMatchButton() {
    const { appUser } = useAuth();
    const firestore = useFirestore();
    const isMobile = useIsMobile();

    const [open, setOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [extractedStats, setExtractedStats] = useState<ExtractMatchStatsFromImageOutput | null>(null);
    const [opponentId, setOpponentId] = useState<string | null>(null);
    const [matchResult, setMatchResult] = useState<'win' | 'loss' | 'draw' | null>(null);
    const { toast } = useToast();

    const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users')) : null, [firestore]);
    const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);
    
    const badgesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'badges')) : null, [firestore]);
    const {data: allBadges} = useCollection<Badge>(badgesQuery);

    const opponentOptions = users?.filter(u => u.id !== appUser?.id) || [];

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsUploading(true);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
                setIsUploading(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleReset = () => {
        setPreview(null);
        setExtractedStats(null);
        setOpponentId(null);
        setMatchResult(null);
        setIsProcessing(false);
        setIsUploading(false);
        setIsSaving(false);
    }

    const handleExtract = async () => {
        if (!preview) return;
        setIsProcessing(true);
        try {
            const stats = await extractMatchStatsFromImage({ matchStatsImage: preview });
            setExtractedStats(stats);
            
            if (stats.team1Stats.score > stats.team2Stats.score) {
                const isUserTeam1 = stats.team1Name.toLowerCase().trim() === appUser?.name.toLowerCase().trim();
                setMatchResult(isUserTeam1 ? 'win' : 'loss');
            } else if (stats.team2Stats.score > stats.team1Stats.score) {
                const isUserTeam1 = stats.team1Name.toLowerCase().trim() === appUser?.name.toLowerCase().trim();
                setMatchResult(isUserTeam1 ? 'loss' : 'win');
            } else {
                setMatchResult('draw');
            }

        } catch (error: any) {
            console.error('=== MATCH STATS EXTRACTION ERROR ===' );
            console.error('Error Type:', error?.constructor?.name);
            console.error('Error Message:', error?.message);
            console.error('Error Stack:', error?.stack);
            console.error('Error Details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
            console.error('Preview Image Length:', preview?.length);
            console.error('User Info:', { userId: appUser?.id, userName: appUser?.name });
            console.error('=====================================');
            
            const errorMessage = error?.message || 'Unknown error occurred';
            const isApiKeyError = errorMessage.includes('API key') || errorMessage.includes('GEMINI_API_KEY') || errorMessage.includes('GOOGLE_API_KEY');
            
            toast({
                variant: "destructive",
                title: "Extraction Failed",
                description: isApiKeyError 
                    ? "API key is missing or invalid. Please check your environment configuration."
                    : `Could not extract stats: ${errorMessage}. Please try another image.`,
            });
            handleReset();
        } finally {
            setIsProcessing(false);
        }
    }

    const runBackgroundTask = async (
        matchRef: DocumentReference,
        opponent: User,
        winner: User,
        loser: User,
        userStats: PlayerStats,
        opponentStats: PlayerStats,
        matchResult: 'win' | 'loss'
    ) => {
        if(!firestore) return;
        try {
            const batch = writeBatch(firestore);

            // Try to generate Hall of Fame/Shame roasts, but use fallback if it fails
            let fameRoast = `${winner.name} dominated with an impressive victory!`;
            let shameRoast = `${loser.name} faced a tough defeat this time.`;
            
            try {
                const roastResult = await generateHallOfShameRoast({
                    category: "General",
                    stat: `Score: ${winner.name} ${matchResult === 'win' ? userStats.score : opponentStats.score} - ${loser.name} ${matchResult === 'win' ? opponentStats.score : userStats.score}`,
                    username: winner.name,
                    opponentName: loser.name
                });
                fameRoast = roastResult.fameRoast;
                shameRoast = roastResult.shameRoast;
            } catch (roastError: any) {
                console.warn('Failed to generate Hall of Fame/Shame roasts, using fallback:', roastError?.message);
                // Continue with fallback roasts
            }
            
            const goalDifference = Math.abs(userStats.score - opponentStats.score);

            const fameEntry: Omit<HallEntry, 'id'> = {
                type: 'fame',
                title: 'Glorious Victory',
                description: `${winner.name} defeated ${loser.name}`,
                matchId: matchRef.id,
                userId: winner.id,
                opponentId: loser.id,
                stat: `Won by ${goalDifference} goals`,
                roast: fameRoast,
                date: serverTimestamp() as any,
            };

            const shameEntry: Omit<HallEntry, 'id'> = {
                type: 'shame',
                title: 'Crushing Defeat',
                description: `${loser.name} was defeated by ${winner.name}`,
                matchId: matchRef.id,
                userId: loser.id,
                opponentId: winner.id,
                stat: `Lost by ${goalDifference} goals`,
                roast: shameRoast,
                date: serverTimestamp() as any,
            };

            batch.set(doc(collection(firestore, 'hallofshame')), fameEntry);
            batch.set(doc(collection(firestore, 'hallofshame')), shameEntry);

            await batch.commit();
            
            console.log('✅ Hall of Fame/Shame entries created successfully');

            // Badge Checking
            const checkAndToastBadges = async (userId: string, isCurrentUser: boolean) => {
                if (!allBadges) return;
                const newBadgeIds = await checkAndAwardBadges(firestore, userId, allBadges);
                if (newBadgeIds.length > 0) {
                    const userRef = doc(firestore, 'users', userId);
                    const currentUserDoc = await getDoc(userRef);
                    const existingBadges = currentUserDoc.data()?.badges || [];
                    const badgesToAward = newBadgeIds.filter(id => !existingBadges.includes(id));
                    
                    if (badgesToAward.length > 0) {
                        await updateDoc(userRef, { badges: arrayUnion(...badgesToAward) });
                        if (isCurrentUser) {
                            badgesToAward.forEach(badgeId => {
                                const badgeInfo = allBadges.find(b => b.id === badgeId);
                                if (badgeInfo) {
                                    toast({
                                        title: "Badge Unlocked!",
                                        description: `You've earned the "${badgeInfo.name}" badge!`,
                                        className: "bg-primary text-primary-foreground"
                                    });
                                }
                            });
                            await manageBadges(firestore, true);
                        }
                    }
                }
            };

            await checkAndToastBadges(appUser!.id, true);
            await checkAndToastBadges(opponent.id, false);

        } catch (error: any) {
            console.error('=== BACKGROUND TASK ERROR ===' );
            console.error('Error Type:', error?.constructor?.name);
            console.error('Error Message:', error?.message);
            console.error('Error Stack:', error?.stack);
            console.error('Error Details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
            console.error('Context:', {
                matchId: matchRef.id,
                winnerId: winner.id,
                loserId: loser.id,
                matchResult: matchResult,
            });
            console.error('=====================================');
            // Background task failures are non-critical, so we just log them
        }
    };


    const updateUserStatsAndBadges = async (batch: any, userId: string, userStats: PlayerStats, opponentStats: PlayerStats, result: 'win' | 'loss' | 'draw') => {
        const userRef = doc(firestore!, 'users', userId);
        
        const statsUpdate = {
            'stats.wins': increment(result === 'win' ? 1 : 0),
            'stats.losses': increment(result === 'loss' ? 1 : 0),
            'stats.draws': increment(result === 'draw' ? 1 : 0),
            'stats.goalsFor': increment(userStats.score),
            'stats.goalsAgainst': increment(opponentStats.score),
            'stats.shots': increment(userStats.shots),
            'stats.shotsOnTarget': increment(userStats.shotsOnTarget),
            'stats.passes': increment(userStats.passes),
            'stats.successfulPasses': increment(userStats.successfulPasses),
            'stats.tackles': increment(userStats.tackles),
            'stats.saves': increment(userStats.saves),
            'stats.redCards': increment(userStats.redCards || 0),
        };
        batch.update(userRef, statsUpdate);
    };

    const [userTeamSide, setUserTeamSide] = useState<'team1' | 'team2' | null>(null);

    // Reset userTeamSide when stats are extracted or dialog is closed
    useEffect(() => {
        if (extractedStats) {
            setUserTeamSide(null);
        }
    }, [extractedStats]);

    const handleSaveMatch = async () => {
        if (!extractedStats || !appUser || !opponentId || !matchResult || !userTeamSide) {
            toast({ variant: "destructive", title: "Missing Information", description: "Please fill in all fields." });
            return;
        }

        const opponent = opponentOptions.find(u => u.id === opponentId);
        if (!opponent) {
            toast({ variant: "destructive", title: "Opponent not found" });
            setIsSaving(false);
            return;
        }

        setIsSaving(true);
        
        try {
            // Check for duplicates
            const matchHash = createMatchHash(extractedStats, appUser.id, opponent.id);
            const matchesRef = collection(firestore, 'matches');
            const q = query(matchesRef, where("matchHash", "==", matchHash));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                toast({
                    variant: "destructive",
                    title: "Duplicate Match",
                    description: "This match has already been uploaded.",
                });
                setIsSaving(false);
                return;
            }


            // 1. Prepare Match Data & Generate Roast (optional)
            // Use manual selection to determine stats
            const isUserTeam1 = userTeamSide === 'team1';
            const userStats = isUserTeam1 ? extractedStats.team1Stats : extractedStats.team2Stats;
            const opponentStats = isUserTeam1 ? extractedStats.team2Stats : extractedStats.team1Stats;
            const winnerId = matchResult === 'win' ? appUser.id : matchResult === 'loss' ? opponent.id : 'draw';
            
            // Inject user IDs into stats objects
            if (isUserTeam1) {
                extractedStats.team1Stats.userId = appUser.id;
                extractedStats.team2Stats.userId = opponent.id;
            } else {
                extractedStats.team1Stats.userId = opponent.id;
                extractedStats.team2Stats.userId = appUser.id;
            }

            // Try to generate roast, but don't fail if it doesn't work
            let roastText = '';
            try {
                const roastResult = await generateMatchRoast({
                    winningScore: matchResult === 'win' ? userStats.score : opponentStats.score,
                    losingScore: matchResult === 'win' ? opponentStats.score : userStats.score,
                    winnerName: matchResult === 'win' ? appUser.name : opponent.name,
                    loserName: matchResult === 'win' ? opponent.name : appUser.name,
                });
                roastText = roastResult.roast;
            } catch (roastError: any) {
                console.warn('Failed to generate roast, continuing without it:', roastError?.message);
                // Continue without roast - it's optional
            }

            const matchData: Omit<Match, 'id'> = {
                createdBy: appUser.id,
                opponentId: opponent.id,
                participants: [appUser.id, opponent.id],
                date: serverTimestamp(),
                roast: roastText,
                winnerId: winnerId,
                opponentName: opponent.name,
                team1Name: extractedStats.team1Name,
                team2Name: extractedStats.team2Name,
                team1Stats: extractedStats.team1Stats, // Save exactly as extracted (now with userIds)
                team2Stats: extractedStats.team2Stats, // Save exactly as extracted (now with userIds)
                comments: [],
                matchHash: matchHash,
                userTeamSide: userTeamSide, // Explicitly save which side the user was on
            };
            
            // Use a batch to write to both collections atomically
            const batch = writeBatch(firestore);
            
            const globalMatchRef = doc(collection(firestore, 'matches'));
            batch.set(globalMatchRef, matchData);

            const userMatchRef = doc(collection(firestore, 'users', appUser.id, 'matches'));
            batch.set(userMatchRef, matchData);
            
            toast({
                title: "Match Saved!",
                description: `Match against ${opponent.name} has been recorded.`,
            });
            
            // Close dialog immediately
            setOpen(false);
            handleReset();

            // 3. Update stats and run background tasks without blocking UI
            const updateAndBackgroundTasks = async () => {
                
                // Update stats for both users
                await updateUserStatsAndBadges(batch, appUser.id, userStats, opponentStats, matchResult);
                const opponentResult = matchResult === 'win' ? 'loss' : matchResult === 'loss' ? 'win' : 'draw';
                await updateUserStatsAndBadges(batch, opponent.id, opponentStats, userStats, opponentResult);
                
                await batch.commit(); // Commit all writes together

                // Run non-essential background tasks
                if (matchResult !== 'draw') {
                     const winner = matchResult === 'win' ? appUser : opponent;
                     const loser = matchResult === 'win' ? opponent : appUser;
                     runBackgroundTask(globalMatchRef, opponent, winner, loser, userStats, opponentStats, matchResult);
                }
            };
            
            // Fire and forget
            updateAndBackgroundTasks();

        } catch(error: any) {
            console.error('=== MATCH SAVE ERROR ===' );
            console.error('Error Type:', error?.constructor?.name);
            console.error('Error Message:', error?.message);
            console.error('Error Code:', error?.code);
            console.error('Error Stack:', error?.stack);
            console.error('Error Details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
            console.error('Context:', {
                userId: appUser?.id,
                opponentId: opponentId,
                matchResult: matchResult,
                hasExtractedStats: !!extractedStats,
                hasFirestore: !!firestore,
                hasBadges: !!allBadges,
            });
            console.error('=====================================');
            
            const errorMessage = error?.message || 'An unexpected error occurred';
            const isApiKeyError = errorMessage.includes('API key') || errorMessage.includes('GEMINI_API_KEY') || errorMessage.includes('GOOGLE_API_KEY');
            const isFirestoreError = error?.code?.startsWith('firestore/');
            
            let userFriendlyMessage = errorMessage;
            if (isApiKeyError) {
                userFriendlyMessage = 'API key is missing or invalid. Please contact support.';
            } else if (isFirestoreError) {
                userFriendlyMessage = `Database error: ${errorMessage}`;
            }
            
            toast({
                variant: "destructive",
                title: "Failed to Save Match",
                description: userFriendlyMessage,
            });
            setIsSaving(false); // only set to false on error
        }
    }


    const StatDisplay = ({ stats }: { stats: PlayerStats }) => (
        <Card>
            <CardContent className="p-4 text-sm">
                <h4 className="font-bold text-base mb-2">{stats.name}</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <p>Score: <span className="font-semibold">{stats.score}</span></p>
                    <p>Possession: <span className="font-semibold">{stats.possession}</span></p>
                    <p>Shots: <span className="font-semibold">{stats.shots} ({stats.shotsOnTarget} on target)</span></p>
                    <p>Passes: <span className="font-semibold">{stats.successfulPasses}/{stats.passes}</span></p>
                    <p>Tackles: <span className="font-semibold">{stats.tackles}</span></p>
                    <p>Saves: <span className="font-semibold">{stats.saves}</span></p>
                    <p>Fouls: <span className="font-semibold">{stats.fouls}</span></p>
                    <p>Offsides: <span className="font-semibold">{stats.offsides}</span></p>
                    <p>Corners: <span className="font-semibold">{stats.cornerKicks}</span></p>
                    <p>Free Kicks: <span className="font-semibold">{stats.freeKicks}</span></p>
                    <p>Crosses: <span className="font-semibold">{stats.crosses}</span></p>
                    <p>Interceptions: <span className="font-semibold">{stats.interceptions}</span></p>
                    {stats.redCards !== undefined && <p>Red Cards: <span className="font-semibold">{stats.redCards}</span></p>}
                </div>
            </CardContent>
        </Card>
    );

    const TriggerButton = isMobile ? (
         <Button
            size="icon"
            className="h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
          >
            <Plus className="h-8 w-8" />
          </Button>
    ) : (
        <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload Match
        </Button>
    );

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) {
                handleReset();
            }
            setOpen(isOpen);
        }}>
            <DialogTrigger asChild>
                {TriggerButton}
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Upload Match Screenshot</DialogTitle>
                    <DialogDescription>
                        Upload an image of your match results. Our AI will automatically extract the stats.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="py-4">
                    {!preview && (
                        <div className="relative flex justify-center w-full h-64 border-2 border-dashed rounded-lg border-muted-foreground/50">
                            <label htmlFor="file-upload" className="absolute inset-0 z-10 flex flex-col items-center justify-center w-full h-full cursor-pointer text-muted-foreground hover:bg-accent/50 transition-colors">
                                <FileImage className="w-10 h-10 mb-2"/>
                                <span className="font-semibold">Click to upload</span>
                                <span className="text-xs">PNG, JPG, or GIF</span>
                                {isUploading && <Loader2 className="mt-2 h-4 w-4 animate-spin" />}
                            </label>
                            <input
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                className="sr-only"
                                accept="image/png, image/jpeg, image/gif"
                                onChange={handleFileChange}
                                disabled={isUploading}
                            />
                        </div>
                    )}
                    
                    {preview && !extractedStats && (
                            <div className="space-y-4">
                                <div className="relative w-full aspect-video rounded-md overflow-hidden border">
                                <Image src={preview} alt="Match preview" layout="fill" objectFit="contain" />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={handleReset} disabled={isProcessing}>Choose another file</Button>
                                <Button onClick={handleExtract} disabled={isProcessing}>
                                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Extract Stats
                                </Button>
                            </div>
                        </div>
                    )}

                    {extractedStats && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-center">Confirm Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <StatDisplay stats={extractedStats.team1Stats} />
                                <StatDisplay stats={extractedStats.team2Stats} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                <div className="space-y-2">
                                    <Label>Who are you?</Label>
                                    <RadioGroup value={userTeamSide ?? ''} onValueChange={(val) => setUserTeamSide(val as 'team1' | 'team2')} className="flex flex-col gap-2 pt-2">
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="team1" id="team1" />
                                            <Label htmlFor="team1" className="font-normal cursor-pointer">{extractedStats.team1Name || 'Team 1'}</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="team2" id="team2" />
                                            <Label htmlFor="team2" className="font-normal cursor-pointer">{extractedStats.team2Name || 'Team 2'}</Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                <div className="space-y-2">
                                    <Label>Who was your opponent?</Label>
                                    <Select onValueChange={setOpponentId} value={opponentId ?? ''}>
                                        <SelectTrigger disabled={isLoadingUsers}>
                                            <SelectValue placeholder={isLoadingUsers ? "Loading users..." : "Select opponent"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {opponentOptions.map(user => (
                                                <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>What was the result for you?</Label>
                                    <RadioGroup value={matchResult ?? ''} onValueChange={(val) => setMatchResult(val as 'win' | 'loss' | 'draw')} className="flex gap-2 items-center pt-2">
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="win" id="r-win" />
                                            <Label htmlFor="r-win" className="font-normal cursor-pointer">I Won</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="loss" id="r-loss" />
                                            <Label htmlFor="r-loss" className="font-normal cursor-pointer">I Lost</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="draw" id="r-draw" />
                                            <Label htmlFor="r-draw" className="font-normal cursor-pointer">It was a Draw</Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                            </div>

                                <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={handleReset} disabled={isSaving}>Start Over</Button>
                                <Button onClick={handleSaveMatch} disabled={isSaving || !opponentId || !matchResult}>
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Match
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
