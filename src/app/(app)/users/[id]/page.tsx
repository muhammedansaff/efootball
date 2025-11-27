'use client';

import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { Trophy, Shield, Goal, Ratio, Percent, AlertTriangle, Loader2, Disc3, Footprints, Target, Hand, User as UserIcon, ShieldQuestion } from "lucide-react";
import { MatchCard } from "@/components/match-card";
import { notFound } from 'next/navigation';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, collection, query, orderBy, where } from 'firebase/firestore';
import type { User, Match, Badge } from "@/lib/types";
import { allBadges as staticBadges } from "@/lib/data";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { use, useEffect } from 'react';

const getIcon = (iconName: string) => {
    const badge = staticBadges.find(b => b.iconName === iconName);
    return badge ? badge.icon : Trophy;
}

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
    console.log('🔵 [UserProfilePage] Component rendered');
    console.log('🔵 [UserProfilePage] params type:', typeof params);
    console.log('🔵 [UserProfilePage] params value:', params);
    
    // Unwrap the params Promise
    const { id } = use(params);
    console.log('🟢 [UserProfilePage] Unwrapped id:', id);
    
    const firestore = useFirestore();
    console.log('🟡 [UserProfilePage] firestore:', firestore ? 'initialized' : 'null');

    const userRef = useMemoFirebase(() => {
        const ref = firestore ? doc(firestore, 'users', id) : null;
        console.log('🟣 [UserProfilePage] userRef created:', ref ? `users/${id}` : 'null');
        return ref;
    }, [firestore, id]);
    
    const { data: user, isLoading: isLoadingUser } = useDoc<User>(userRef);
    
    useEffect(() => {
        console.log('🔴 [UserProfilePage] useDoc state changed:');
        console.log('  - isLoadingUser:', isLoadingUser);
        console.log('  - user:', user);
        console.log('  - user exists:', !!user);
    }, [user, isLoadingUser]);

    const matchesQuery = useMemoFirebase(() => {
        const q = firestore ? query(collection(firestore, 'matches'), where('participants', 'array-contains', id), orderBy('date', 'desc')) : null;
        console.log('🟠 [UserProfilePage] matchesQuery created for id:', id);
        return q;
    }, [firestore, id]);
    
    const { data: userMatches, isLoading: isLoadingMatches } = useCollection<Match>(matchesQuery);
    
    useEffect(() => {
        console.log('🟤 [UserProfilePage] matches state:');
        console.log('  - isLoadingMatches:', isLoadingMatches);
        console.log('  - userMatches count:', userMatches?.length || 0);
    }, [userMatches, isLoadingMatches]);

    const badgesQuery = useMemoFirebase(() => {
        const q = firestore ? query(collection(firestore, 'badges'), orderBy('name')) : null;
        console.log('⚫ [UserProfilePage] badgesQuery created');
        return q;
    }, [firestore]);
    
    const { data: allBadges, isLoading: isLoadingBadges } = useCollection<Badge>(badgesQuery);
    
    useEffect(() => {
        console.log('⚪ [UserProfilePage] badges state:');
        console.log('  - isLoadingBadges:', isLoadingBadges);
        console.log('  - allBadges count:', allBadges?.length || 0);
    }, [allBadges, isLoadingBadges]);

    console.log('📊 [UserProfilePage] Loading states:', {
        isLoadingUser,
        isLoadingMatches,
        isLoadingBadges,
        allLoading: isLoadingUser || isLoadingMatches || isLoadingBadges
    });

    if (isLoadingUser || isLoadingMatches || isLoadingBadges) {
        console.log('⏳ [UserProfilePage] Showing loading spinner');
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    if (!user) {
        console.log('❌ [UserProfilePage] User not found, calling notFound()');
        console.log('❌ [UserProfilePage] Firestore check - firestore exists:', !!firestore);
        console.log('❌ [UserProfilePage] UserRef check:', userRef);
        notFound();
    }
    
    console.log('✅ [UserProfilePage] User found:', user.name);
    console.log('🖼️ [UserProfilePage] Avatar URL:', user.avatarUrl ? 'set' : 'not set');

    const { stats, badges: earnedBadgeIds } = user;
    const earnedBadges = allBadges?.filter(badge => earnedBadgeIds?.includes(badge.id)) || [];
    console.log('🏆 [UserProfilePage] Earned badges count:', earnedBadges.length);
    
    const totalGames = stats.wins + stats.losses + stats.draws;
    const winRate = totalGames > 0 ? Math.round((stats.wins / totalGames) * 100) : 0;
    const winLossRatio = stats.losses > 0 ? (stats.wins / stats.losses).toFixed(2) : stats.wins;
    const passCompletionRate = stats.passes > 0 ? Math.round((stats.successfulPasses / stats.passes) * 100) : 0;
    const shotAccuracy = stats.shots > 0 ? Math.round((stats.shotsOnTarget / stats.shots) * 100) : 0;

    console.log('📈 [UserProfilePage] Stats calculated:', { totalGames, winRate, winLossRatio });
    console.log('🎨 [UserProfilePage] Rendering main content');

    return (
        <div className="space-y-8">
            {/* Banner Section */}
            {user.bannerUrl && (
                <Card className="overflow-hidden">
                    <div className="relative h-48 md:h-72 lg:h-80 bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center">
                        {user.bannerType === 'video' ? (
                            <video
                                src={user.bannerUrl}
                                className="w-full h-full object-contain"
                                autoPlay
                                loop
                                muted
                                playsInline
                            />
                        ) : (
                            <img
                                src={user.bannerUrl}
                                alt={`${user.name}'s banner`}
                                className="w-full h-full object-contain"
                            />
                        )}
                    </div>
                </Card>
            )}

            {/* Profile Card */}
            <Card>
                <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
                    <Avatar className="h-28 w-28 border-4 border-primary">
                        <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
                        <AvatarFallback className="text-4xl">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                        <h1 className="font-headline text-5xl">{user.name}</h1>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-sm text-muted-foreground">
                            {user.realName && (
                                <div className="flex items-center gap-2">
                                    <UserIcon className="h-4 w-4" />
                                    <span>{user.realName}</span>
                                </div>
                            )}
                             {user.pesTeamName && (
                                <div className="flex items-center gap-2">
                                    <ShieldQuestion className="h-4 w-4" />
                                    <span>{user.pesTeamName}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

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
                    <div className="space-y-4">
                        {userMatches && userMatches.map(match => (
                            <MatchCard key={match.id} match={match} currentUser={user} />
                        ))}
                         {!isLoadingMatches && userMatches?.length === 0 && (
                            <Card>
                                <CardContent className="p-8 text-center text-muted-foreground">
                                    This user hasn't played any matches yet.
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
                                    <p className="text-sm text-muted-foreground p-4 text-center w-full">No badges earned yet.</p>
                                )}
                            </CardContent>
                        </TooltipProvider>
                    </Card>
                </div>
            </div>
        </div>
    );
}