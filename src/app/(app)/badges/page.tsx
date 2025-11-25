'use client';
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from 'firebase/firestore';
import type { User, Badge } from '@/lib/types';
import { Loader2, Trophy } from "lucide-react";
import { allBadges as staticBadges } from "@/lib/data";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const getIcon = (iconName: string) => {
    const badge = staticBadges.find(b => b.iconName === iconName);
    return badge ? badge.icon : Trophy;
}

export default function BadgesPage() {
    const firestore = useFirestore();
    
    const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), orderBy('name')) : null, [firestore]);
    const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);

    const badgesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'badges'), orderBy('name')) : null, [firestore]);
    const { data: allBadges, isLoading: isLoadingBadges } = useCollection<Badge>(badgesQuery);

    const isLoading = isLoadingUsers || isLoadingBadges;

    return (
        <div className="space-y-8">
            <PageHeader
                title="Badge Hall"
                description="A showcase of all the honors and accolades earned in the barn."
            />

            {isLoading && <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {users && allBadges && users.map(user => {
                    const earnedBadges = allBadges.filter(badge => user.badges?.includes(badge.id));
                    return (
                        <Card key={user.id}>
                            <CardContent className="p-6 flex flex-col items-center text-center">
                                <Avatar className="h-24 w-24 mb-4 border-4 border-primary/20">
                                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <h3 className="text-xl font-bold">{user.name}</h3>
                                <p className="text-muted-foreground mb-4">W: {user.stats.wins} / L: {user.stats.losses}</p>
                                
                                <div className="w-full border-t border-border pt-4">
                                     <h4 className="text-sm font-semibold text-muted-foreground mb-2">Badges</h4>
                                     <TooltipProvider>
                                        <div className="flex flex-wrap gap-3 justify-center min-h-[50px]">
                                            {earnedBadges.length > 0 ? (
                                                earnedBadges.map(badge => {
                                                    const Icon = getIcon(badge.iconName);
                                                    return (
                                                     <Tooltip key={badge.id}>
                                                        <TooltipTrigger>
                                                            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary/30 bg-card transition-all hover:border-primary hover:scale-110">
                                                                <Icon className="h-6 w-6 text-primary/70 transition-all group-hover:text-primary" />
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="font-bold">{badge.name}</p>
                                                            <p>{badge.description}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                )})
                                            ) : (
                                                <p className="text-xs text-muted-foreground p-2">No badges yet.</p>
                                            )}
                                        </div>
                                     </TooltipProvider>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
