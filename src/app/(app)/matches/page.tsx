'use client';

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { MatchCard } from "@/components/match-card";
import { useAuth } from "@/providers/auth-provider";
import { UploadMatchButton } from "@/components/upload-match-button";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, where } from "firebase/firestore";
import type { Match } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MatchesPage() {
    const { appUser } = useAuth();
    const firestore = useFirestore();
    const [filter, setFilter] = useState<'all' | 'mine'>('all');

    const matchesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        
        if (filter === 'mine' && appUser) {
            return query(
                collection(firestore, 'matches'), 
                where('participants', 'array-contains', appUser.id), 
                orderBy('date', 'desc')
            );
        }
        
        return query(collection(firestore, 'matches'), orderBy('date', 'desc'));
    }, [firestore, filter, appUser]);
    
    const { data: matches, isLoading } = useCollection<Match>(matchesQuery);

    if (!appUser) return null;

    return (
        <div className="space-y-8">
            <PageHeader
                title="Matches"
                description="Every match from the Banter Barn community."
            >
                <UploadMatchButton />
            </PageHeader>
            
            <Tabs value={filter} onValueChange={(value) => setFilter(value as 'all' | 'mine')} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="all">All Matches</TabsTrigger>
                    <TabsTrigger value="mine">My Matches Only</TabsTrigger>
                </TabsList>
            </Tabs>
            
            <div className="space-y-4">
                {isLoading && (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
                {matches && matches.map(match => (
                    <MatchCard key={match.id} match={match} currentUser={appUser} />
                ))}
                {!isLoading && matches?.length === 0 && (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            {filter === 'mine' 
                                ? "You haven't uploaded any matches yet."
                                : "No matches have been uploaded yet. Be the first!"
                            }
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
