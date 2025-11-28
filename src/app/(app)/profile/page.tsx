'use client';

import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/providers/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { allBadges as staticBadges } from "@/lib/data";
import { StatCard } from "@/components/stat-card";
import { Trophy, Shield, Goal, Ratio, Percent, AlertTriangle, Disc3, Footprints, Target, GitCommitHorizontal, Spade, Hand, User as UserIcon, ShieldQuestion, Pencil, Crown } from "lucide-react";
import { MatchCard } from "@/components/match-card";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, where, doc, updateDoc } from "firebase/firestore";
import type { Match, Badge } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EditProfileDialog } from "@/components/edit-profile-dialog";
import { useState } from "react";
import { UploadButton } from "@/utils/uploadthing";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

// Helper function to delete file from UploadThing
const deleteFileFromUploadThing = async (url: string | undefined) => {
    if (!url) return;
    try {
        await axios.delete("/api/uploadthing", {
            data: { url }
        });
    } catch (error) {
        console.error("Error deleting file:", error);
    }
};


const getIcon = (iconName: string) => {
    const badge = staticBadges.find(b => b.iconName === iconName);
    return badge ? badge.icon : Trophy; // Default to Trophy icon if not found
}


export default function ProfilePage() {
    const { appUser } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const matchesQuery = useMemoFirebase(() =>
        (appUser && firestore) ? query(collection(firestore, 'matches'), where('participants', 'array-contains', appUser.id), orderBy('date', 'desc')) : null,
        [firestore, appUser]
    );
    const { data: userMatches, isLoading: isLoadingMatches } = useCollection<Match>(matchesQuery);

    const badgesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'badges'), orderBy('name')) : null, [firestore]);
    const { data: allBadges, isLoading: isLoadingBadges } = useCollection<Badge>(badgesQuery);
    
    if (!appUser || isLoadingBadges) return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

    const { stats, badges: earnedBadgeIds } = appUser;
    const earnedBadges = allBadges?.filter(badge => earnedBadgeIds?.includes(badge.id)) || [];

    const totalGames = stats.wins + stats.losses + stats.draws;
    const winRate = totalGames > 0 ? Math.round((stats.wins / totalGames) * 100) : 0;
    const winLossRatio = stats.losses > 0 ? (stats.wins / stats.losses).toFixed(2) : stats.wins;
    const passCompletionRate = stats.passes > 0 ? Math.round((stats.successfulPasses / stats.passes) * 100) : 0;
    const shotAccuracy = stats.shots > 0 ? Math.round((stats.shotsOnTarget / stats.shots) * 100) : 0;

    return (
        <div className="space-y-8">
            {/* Banner Section */}
            <Card className="overflow-hidden">
                <div className="relative h-48 md:h-72 lg:h-80 bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center">
                    {appUser.bannerUrl && (
                        <>
                            {appUser.bannerType === 'video' ? (
                                <video
                                    src={appUser.bannerUrl}
                                    className="w-full h-full object-contain"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                />
                            ) : (
                                <img
                                    src={appUser.bannerUrl}
                                    alt="Profile banner"
                                    className="w-full h-full object-contain"
                                />
                            )}
                        </>
                    )}
                    <div className="absolute bottom-4 right-4 flex gap-2">
                        <UploadButton
                            endpoint="bannerImage"
                            onClientUploadComplete={async (res) => {
                                if (!firestore || !res?.[0]) return;
                                try {
                                    // Delete old banner if it exists
                                    await deleteFileFromUploadThing(appUser.bannerUrl);
                                    
                                    const userRef = doc(firestore, 'users', appUser.id);
                                    await updateDoc(userRef, {
                                        bannerUrl: res[0].url,
                                        bannerType: 'image'
                                    });
                                    toast({
                                        title: "Banner Updated!",
                                        description: "Your banner image has been uploaded successfully.",
                                    });
                                } catch (error) {
                                    console.error("Error updating banner:", error);
                                    toast({
                                        variant: "destructive",
                                        title: "Update Failed",
                                        description: "Could not update banner. Please try again.",
                                    });
                                }
                            }}
                            onUploadError={(error: Error) => {
                                toast({
                                    variant: "destructive",
                                    title: "Upload Failed",
                                    description: error.message,
                                });
                            }}
                            appearance={{
                                button: "bg-primary text-primary-foreground hover:bg-primary/90 text-sm px-3 py-2",
                                allowedContent: "hidden"
                            }}
                            content={{
                                button: "Upload Image"
                            }}
                        />
                        <UploadButton
                            endpoint="bannerVideo"
                            onClientUploadComplete={async (res) => {
                                if (!firestore || !res?.[0]) return;
                                try {
                                    // Delete old banner if it exists
                                    await deleteFileFromUploadThing(appUser.bannerUrl);
                                    
                                    const userRef = doc(firestore, 'users', appUser.id);
                                    await updateDoc(userRef, {
                                        bannerUrl: res[0].url,
                                        bannerType: 'video'
                                    });
                                    toast({
                                        title: "Banner Updated!",
                                        description: "Your banner video has been uploaded successfully.",
                                    });
                                } catch (error) {
                                    console.error("Error updating banner:", error);
                                    toast({
                                        variant: "destructive",
                                        title: "Update Failed",
                                        description: "Could not update banner. Please try again.",
                                    });
                                }
                            }}
                            onUploadError={(error: Error) => {
                                toast({
                                    variant: "destructive",
                                    title: "Upload Failed",
                                    description: error.message,
                                });
                            }}
                            appearance={{
                                button: "bg-secondary text-secondary-foreground hover:bg-secondary/90 text-sm px-3 py-2",
                                allowedContent: "hidden"
                            }}
                            content={{
                                button: "Upload Video"
                            }}
                        />
                    </div>
                </div>
            </Card>

            {/* Leaderboard Customization */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-primary" />
                        Leaderboard Customization
                    </CardTitle>
                    <CardDescription>
                        Upload a custom image and audio that will be displayed when you're #1 on the leaderboard!
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Current Leaderboard Image Preview */}
                    {appUser.leaderboardImageUrl && (
                        <div className="space-y-2">
                            <Label>Current Leaderboard Image</Label>
                            <div className="relative h-32 w-full md:w-64 rounded-lg overflow-hidden border">
                                <img
                                    src={appUser.leaderboardImageUrl}
                                    alt="Leaderboard celebration"
                                    className="w-full h-full object-contain bg-muted"
                                />
                            </div>
                        </div>
                    )}

                    {/* Leaderboard Image Upload */}
                    <div className="space-y-2">
                        <Label>Celebration Image</Label>
                        <UploadButton
                            endpoint="leaderboardImage"
                            onClientUploadComplete={async (res) => {
                                if (!firestore || !res?.[0]) return;
                                try {
                                    // Delete old leaderboard image if it exists
                                    await deleteFileFromUploadThing(appUser.leaderboardImageUrl);
                                    
                                    const userRef = doc(firestore, 'users', appUser.id);
                                    await updateDoc(userRef, {
                                        leaderboardImageUrl: res[0].url
                                    });
                                    toast({
                                        title: "Image Updated!",
                                        description: "Your leaderboard celebration image has been uploaded.",
                                    });
                                } catch (error) {
                                    console.error("Error updating leaderboard image:", error);
                                    toast({
                                        variant: "destructive",
                                        title: "Update Failed",
                                        description: "Could not update image. Please try again.",
                                    });
                                }
                            }}
                            onUploadError={(error: Error) => {
                                toast({
                                    variant: "destructive",
                                    title: "Upload Failed",
                                    description: error.message,
                                });
                            }}
                        />
                    </div>

                    {/* Current Audio Preview */}
                    {appUser.leaderboardAudioUrl && (
                        <div className="space-y-2">
                            <Label>Current Celebration Audio</Label>
                            <audio controls className="w-full">
                                <source src={appUser.leaderboardAudioUrl} />
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    )}

                    {/* Leaderboard Audio Upload */}
                    <div className="space-y-2">
                        <Label>Celebration Audio</Label>
                        <UploadButton
                            endpoint="leaderboardAudio"
                            onClientUploadComplete={async (res) => {
                                if (!firestore || !res?.[0]) return;
                                try {
                                    // Delete old leaderboard audio if it exists
                                    await deleteFileFromUploadThing(appUser.leaderboardAudioUrl);
                                    
                                    const userRef = doc(firestore, 'users', appUser.id);
                                    await updateDoc(userRef, {
                                        leaderboardAudioUrl: res[0].url
                                    });
                                    toast({
                                        title: "Audio Updated!",
                                        description: "Your leaderboard celebration audio has been uploaded.",
                                    });
                                } catch (error) {
                                    console.error("Error updating leaderboard audio:", error);
                                    toast({
                                        variant: "destructive",
                                        title: "Update Failed",
                                        description: "Could not update audio. Please try again.",
                                    });
                                }
                            }}
                            onUploadError={(error: Error) => {
                                toast({
                                    variant: "destructive",
                                    title: "Upload Failed",
                                    description: error.message,
                                });
                            }}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
                    <div className="relative">
                        <Avatar className="h-28 w-28 border-4 border-primary">
                            <AvatarImage src={appUser.avatarUrl} alt={appUser.name} />
                            <AvatarFallback className="text-4xl">{appUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Button
                            size="icon"
                            variant="secondary"
                            className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full shadow-lg"
                            onClick={() => setIsEditDialogOpen(true)}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex-grow">
                        <h1 className="font-headline text-5xl">{appUser.name}</h1>
                        <p className="text-muted-foreground">{appUser.email}</p>
                         <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-sm text-muted-foreground">
                            {appUser.realName && (
                                <div className="flex items-center gap-2">
                                    <UserIcon className="h-4 w-4" />
                                    <span>{appUser.realName}</span>
                                </div>
                            )}
                             {appUser.pesTeamName && (
                                <div className="flex items-center gap-2">
                                    <ShieldQuestion className="h-4 w-4" />
                                    <span>{appUser.pesTeamName}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            {/* Edit Profile Dialog */}
            {appUser && (
                <EditProfileDialog
                    user={appUser}
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                />
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={<Trophy />} title="Wins" value={stats.wins} />
                <StatCard icon={<Shield />} title="Losses" value={stats.losses} />
                <StatCard icon={<Percent />} title="Win Rate" value={`${winRate}%`} />
                <StatCard icon={<Ratio />} title="W/L Ratio" value={winLossRatio} />
                <StatCard icon={<Goal />} title="Goals For" value={stats.goalsFor} />
                <StatCard icon={<Shield />} title="Goals Against" value={stats.goalsAgainst} />
                <StatCard icon={<Disc3 />} title="Passes" value={`${stats.successfulPasses} / ${stats.passes}`} />
                <StatCard icon={<Percent />} title="Pass Accuracy" value={`${passCompletionRate}%`} />
                <StatCard icon={<Target />} title="Shots" value={`${stats.shotsOnTarget} / ${stats.shots}`} />
                <StatCard icon={<Percent />} title="Shot Accuracy" value={`${shotAccuracy}%`} />
                <StatCard icon={<Footprints />} title="Tackles" value={stats.tackles} />
                <StatCard icon={<Hand />} title="Saves" value={stats.saves} />
                <StatCard icon={<AlertTriangle />} title="Red Cards" value={stats.redCards} />
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="font-headline text-3xl text-primary">Match History</h2>
                    {isLoadingMatches && (
                        <div className="flex justify-center items-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}
                    <div className="space-y-4">
                        {userMatches && userMatches.map(match => (
                            <MatchCard key={match.id} match={match} currentUser={appUser} />
                        ))}
                         {!isLoadingMatches && userMatches?.length === 0 && (
                            <Card>
                                <CardContent className="p-8 text-center text-muted-foreground">
                                    No matches found.
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
                <div className="space-y-4">
                    <h2 className="font-headline text-3xl text-primary">Badges</h2>
                    <Card>
                        <TooltipProvider>
                        <CardContent className="p-4 flex flex-wrap gap-4">
                            {earnedBadges.length > 0 ? (
                                earnedBadges.map(badge => {
                                    const Icon = getIcon(badge.iconName);
                                    return (
                                    <Tooltip key={badge.id}>
                                        <TooltipTrigger className="group relative flex flex-col items-center text-center gap-2">
                                            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary/50 bg-card transition-all group-hover:border-primary group-hover:scale-110">
                                                <Icon className="h-8 w-8 text-primary/80 transition-all group-hover:text-primary" />
                                            </div>
                                            <p className="text-xs font-semibold">{badge.name}</p>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="font-bold">{badge.name}</p>
                                            <p>{badge.description}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )})
                            ) : (
                                <p className="text-sm text-muted-foreground p-4 text-center w-full">No badges earned yet. Keep playing!</p>
                            )}
                        </CardContent>
                        </TooltipProvider>
                    </Card>
                </div>
            </div>
        </div>
    );
}
