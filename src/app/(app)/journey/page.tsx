'use client';
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, GitCommitHorizontal, Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import type { User, Milestone } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";

export default function JourneyPage() {
    const { appUser } = useAuth();
    const firestore = useFirestore();

    const milestonesQuery = useMemoFirebase(() => 
        firestore ? query(collection(firestore, 'milestones'), orderBy('target')) : null, 
        [firestore]
    );
    const { data: milestones, isLoading: isLoadingMilestones } = useCollection<Milestone>(milestonesQuery);

    if (!appUser || isLoadingMilestones) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    const calculateProgress = (milestone: Milestone, currentUser: User) => {
        let currentProgress = 0;
        switch (milestone.stat) {
            case 'wins':
                currentProgress = currentUser.stats.wins;
                break;
            case 'goalsFor':
                currentProgress = currentUser.stats.goalsFor;
                break;
            case 'tackles':
                 currentProgress = currentUser.stats.tackles;
                break;
            case 'matchesPlayed':
                currentProgress = currentUser.stats.wins + currentUser.stats.losses + currentUser.stats.draws;
                break;
            // Add other stat cases here
            default:
                currentProgress = 0;
        }
        
        const progressPercentage = Math.min((currentProgress / milestone.target) * 100, 100);
        const achieved = currentProgress >= milestone.target;

        return {
            ...milestone,
            progress: currentProgress,
            achieved,
            progressPercentage: progressPercentage,
        };
    };

    const userMilestones = milestones?.map(m => calculateProgress(m, appUser)) || [];


    return (
        <div className="space-y-8">
            <PageHeader
                title="Your Journey"
                description="Track your progress towards becoming a legend."
            />
            
            <div className="space-y-6">
                {userMilestones.length > 0 ? userMilestones.map(milestone => (
                    <Card key={milestone.id} className={milestone.achieved ? "bg-primary/10 border-primary/50" : ""}>
                        <CardHeader className="flex flex-row items-start justify-between">
                            <div>
                                <CardTitle className="text-xl">{milestone.title}</CardTitle>
                                <CardDescription>{milestone.description}</CardDescription>
                            </div>
                            {milestone.achieved && <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />}
                        </CardHeader>
                        {!milestone.achieved && (
                            <CardContent>
                                <div className="flex items-center gap-4">
                                    <Progress value={milestone.progressPercentage} className="h-3" />
                                    <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">
                                        {milestone.progress} / {milestone.target}
                                    </span>
                                </div>
                            </CardContent>
                        )}
                    </Card>
                )) : (
                     <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            Milestones are being generated. Check back soon!
                        </CardContent>
                    </Card>
                )}
            </div>

            <Card className="flex flex-col items-center justify-center text-center min-h-[200px] border-dashed">
                <CardHeader>
                    <GitCommitHorizontal className="h-12 w-12 mx-auto text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <h3 className="text-xl font-bold">More Milestones Coming Soon</h3>
                    <p className="text-muted-foreground">
                        Keep playing to unlock new achievements and celebrations!
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
