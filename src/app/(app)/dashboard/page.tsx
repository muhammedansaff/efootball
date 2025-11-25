'use client';

import { useAuth } from '@/providers/auth-provider';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MatchCard } from '@/components/match-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowRight, Crown } from 'lucide-react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import type { Match, User } from '@/lib/types';


export default function DashboardPage() {
  const { appUser } = useAuth();
  const firestore = useFirestore();

  const allUsersQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'users'), orderBy('stats.wins', 'desc'), limit(5)) : null, 
    [firestore]
  );
  const { data: leaderboard, isLoading: isLoadingLeaderboard } = useCollection<User>(allUsersQuery);

  const recentMatchesQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'matches'), orderBy('date', 'desc'), limit(4)) : null,
    [firestore]
  );
  const { data: recentMatches, isLoading: isLoadingMatches } = useCollection<Match>(recentMatchesQuery);


  if (!appUser) return null;

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${appUser.name}!`}
        description="Here's the latest action from the Banter Barn."
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
            <div className='flex items-center justify-between'>
                <h2 className="font-headline text-3xl text-primary">Recent Matches</h2>
                 <Link href="/matches" passHref>
                    <Button variant="ghost" size="sm">View All <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </Link>
            </div>
            {isLoadingMatches && <p>Loading matches...</p>}
            {recentMatches && recentMatches.map((match) => (
                <MatchCard key={match.id} match={match} currentUser={appUser} showRoast={true} />
            ))}
            {!isLoadingMatches && recentMatches?.length === 0 && (
              <Card className="flex items-center justify-center h-40">
                <CardContent className="text-center text-muted-foreground p-6">
                  <p>No matches yet. Upload your first match to get started!</p>
                </CardContent>
              </Card>
            )}
        </div>

        <div className="space-y-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Leaderboard</CardTitle>
                    <Link href="/leaderboard" passHref>
                        <Button variant="ghost" size="sm">View All <ArrowRight className="ml-2 h-4 w-4" /></Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {isLoadingLeaderboard && <p>Loading leaderboard...</p>}
                    {leaderboard && (
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead className="w-[50px]">Rank</TableHead>
                                  <TableHead>Player</TableHead>
                                  <TableHead className="text-right">Wins</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                          {leaderboard.map((player, index) => (
                              <TableRow key={player.id} className={cn(index + 1 === 1 && "bg-primary/10")}>
                                  <TableCell className="font-medium text-center">
                                      <div className="flex items-center justify-center">
                                          {index + 1 === 1 ? <Crown className="h-5 w-5 text-primary" /> : index + 1}
                                      </div>
                                  </TableCell>
                                  <TableCell>
                                      <div className="flex items-center gap-2">
                                          <Avatar className='h-8 w-8'>
                                              <AvatarImage src={player.avatarUrl} alt={player.name} />
                                              <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                                          </Avatar>
                                          <span className="font-semibold text-sm truncate">{player.name}</span>
                                      </div>
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-sm">{player.stats.wins}</TableCell>
                              </TableRow>
                          ))}
                          </TableBody>
                      </Table>
                    )}
                </CardContent>
</Card>
<div className="space-y-8">
  <Card className="h-full">
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle>Stats Overview</CardTitle>
      <Link href="/stats" passHref>
        <Button variant="ghost" size="sm">
          View All <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </CardHeader>
    <CardContent className="p-4">
      <p className="text-sm text-muted-foreground">
        Check top performers: best passer, most violent player, best shooter.
      </p>
    </CardContent>
  </Card>
</div>
</div>
      </div>
    </div>
  );
}
