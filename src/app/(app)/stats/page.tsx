// @ts-nocheck
'use client';

import { useAuth } from '@/providers/auth-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import {
  Trophy,
  Shield,
  Goal,
  Ratio,
  Percent,
  AlertTriangle,
  Disc3,
  Footprints,
  Hand,
} from 'lucide-react';

/**
 * Stats Overview Page
 * Shows the top performer for every statistic available in the user profile.
 * Data is pulled from the `users` collection where each document contains a `stats` object.
 */
export default function StatsPage() {
  const { appUser } = useAuth();
  const firestore = useFirestore();

  // Load all users (for demo we load all; consider pagination for large datasets)
  const usersQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'users') : null), [firestore]);
  const { data: users, isLoading } = useCollection(usersQuery);

  if (!appUser || isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-muted-foreground">Loading stats...</p>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">No user data available.</div>;
  }

  // Helper to safely compute percentages
  const safePercent = (num?: number, den?: number) => (den && den > 0 ? Math.round((num! / den) * 100) : 0);
  
  // Helper to calculate average possession
  const avgPossession = (total?: number, matches?: number) => (matches && matches > 0 ? Math.round(total! / matches) : 0);

  // Determine top performers for each metric
  const top = {
    mostWins: users.reduce((a, b) => (b.stats?.wins ?? 0) > (a.stats?.wins ?? 0) ? b : a),
    mostLosses: users.reduce((a, b) => (b.stats?.losses ?? 0) > (a.stats?.losses ?? 0) ? b : a),
    mostDraws: users.reduce((a, b) => (b.stats?.draws ?? 0) > (a.stats?.draws ?? 0) ? b : a),
    bestPasser: users.reduce((a, b) => (b.stats?.successfulPasses ?? 0) > (a.stats?.successfulPasses ?? 0) ? b : a),
    mostViolent: users.reduce((a, b) => (b.stats?.fouls ?? 0) > (a.stats?.fouls ?? 0) ? b : a),
    bestShooter: users.reduce((a, b) => (b.stats?.shotsOnTarget ?? 0) > (a.stats?.shotsOnTarget ?? 0) ? b : a),
    mostGoalsFor: users.reduce((a, b) => (b.stats?.goalsFor ?? 0) > (a.stats?.goalsFor ?? 0) ? b : a),
    mostGoalsAgainst: users.reduce((a, b) => (b.stats?.goalsAgainst ?? 0) > (a.stats?.goalsAgainst ?? 0) ? b : a),
    bestPassAccuracy: users.reduce((a, b) => {
      const aAcc = safePercent(a.stats?.successfulPasses, a.stats?.passes);
      const bAcc = safePercent(b.stats?.successfulPasses, b.stats?.passes);
      return bAcc > aAcc ? b : a;
    }),
    bestShotAccuracy: users.reduce((a, b) => {
      const aAcc = safePercent(a.stats?.shotsOnTarget, a.stats?.shots);
      const bAcc = safePercent(b.stats?.shotsOnTarget, b.stats?.shots);
      return bAcc > aAcc ? b : a;
    }),
    mostTackles: users.reduce((a, b) => (b.stats?.tackles ?? 0) > (a.stats?.tackles ?? 0) ? b : a),
    mostSaves: users.reduce((a, b) => (b.stats?.saves ?? 0) > (a.stats?.saves ?? 0) ? b : a),
    bestPossession: users.reduce((a, b) => {
      const aAvg = avgPossession(a.stats?.totalPossession, a.stats?.matchesPlayed);
      const bAvg = avgPossession(b.stats?.totalPossession, b.stats?.matchesPlayed);
      return bAvg > aAvg ? b : a;
    }),
  };

  const statCards = [
    { title: 'Most Wins', user: top.mostWins, value: top.mostWins.stats?.wins, icon: <Trophy className="h-5 w-5 text-primary" /> },
    { title: 'Most Losses', user: top.mostLosses, value: top.mostLosses.stats?.losses, icon: <Shield className="h-5 w-5 text-destructive" /> },
    { title: 'Most Draws', user: top.mostDraws, value: top.mostDraws.stats?.draws, icon: <Ratio className="h-5 w-5 text-primary" /> },
    { title: 'Best Passer', user: top.bestPasser, value: top.bestPasser.stats?.successfulPasses, icon: <Disc3 className="h-5 w-5 text-primary" /> },
    { title: 'Most Violent', user: top.mostViolent, value: top.mostViolent.stats?.fouls, icon: <AlertTriangle className="h-5 w-5 text-destructive" /> },
    { title: 'Best Shooter', user: top.bestShooter, value: top.bestShooter.stats?.shotsOnTarget, icon: <Goal className="h-5 w-5 text-primary" /> },
    { title: 'Most Goals For', user: top.mostGoalsFor, value: top.mostGoalsFor.stats?.goalsFor, icon: <Goal className="h-5 w-5 text-primary" /> },
    { title: 'Most Goals Against', user: top.mostGoalsAgainst, value: top.mostGoalsAgainst.stats?.goalsAgainst, icon: <Shield className="h-5 w-5 text-muted-foreground" /> },
    { title: 'Best Pass Accuracy', user: top.bestPassAccuracy, value: `${safePercent(top.bestPassAccuracy.stats?.successfulPasses, top.bestPassAccuracy.stats?.passes)}%`, icon: <Percent className="h-5 w-5 text-primary" /> },
    { title: 'Best Shot Accuracy', user: top.bestShotAccuracy, value: `${safePercent(top.bestShotAccuracy.stats?.shotsOnTarget, top.bestShotAccuracy.stats?.shots)}%`, icon: <Ratio className="h-5 w-5 text-primary" /> },
    { title: 'Most Tackles', user: top.mostTackles, value: top.mostTackles.stats?.tackles, icon: <Footprints className="h-5 w-5 text-primary" /> },
    { title: 'Most Saves', user: top.mostSaves, value: top.mostSaves.stats?.saves, icon: <Hand className="h-5 w-5 text-primary" /> },
    { title: 'Best Avg Possession', user: top.bestPossession, value: `${avgPossession(top.bestPossession.stats?.totalPossession, top.bestPossession.stats?.matchesPlayed)}%`, icon: <Percent className="h-5 w-5 text-primary" /> },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-headline text-3xl">Stats Overview</h1>
        <Link href="/" passHref>
          <Button variant="ghost" size="sm">
            Back to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card, idx) => (
          <Card key={idx} className="flex flex-col items-center p-4">
            {card.icon}
            <CardHeader className="p-0 text-center">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            </CardHeader>
            <Avatar className="h-16 w-16 border-2 border-primary mb-2">
              <AvatarImage src={card.user.avatarUrl || null} alt={card.user.name} />
              <AvatarFallback className="text-2xl">{card.user.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <CardContent className="p-0 text-center">
              <p className="font-bold text-lg">{card.value}</p>
              <p className="text-sm text-muted-foreground">{card.user.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
