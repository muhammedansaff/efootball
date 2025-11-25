'use client';

import { PageHeader } from "@/components/page-header";
import { MatchCard } from "@/components/match-card";
import { useAuth } from "@/providers/auth-provider";
import { UploadMatchButton } from "@/components/upload-match-button";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, where } from "firebase/firestore";
import type { Match } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function MatchesPage() {
    const { appUser } = useAuth();
    const firestore = useFirestore();

    const matchesQuery = useMemoFirebase(() => 
        firestore ? query(collection(firestore, 'matches'), orderBy('date', 'desc')) : null,
        [firestore]
    );
    const { data: matches, isLoading } = useCollection<Match>(matchesQuery);

    if (!appUser) return null;

    return (
        <div className="space-y-8">
            <PageHeader
                title="All Matches"
                description="Every match from the Banter Barn community."
            >
                <UploadMatchButton />
            </PageHeader>
            
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
                            No matches have been uploaded yet. Be the first!
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
