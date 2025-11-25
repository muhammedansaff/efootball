'use client';

import { PageHeader } from "@/components/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { User } from '@/lib/types';


export default function LeaderboardPage() {
  const firestore = useFirestore();

  const allTimeQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'users'), orderBy('stats.wins', 'desc'), limit(10)) : null, 
    [firestore]
  );
  const { data: allTime, isLoading: isLoadingAllTime } = useCollection<User>(allTimeQuery);

  const renderLeaderboard = (data: User[] | null, isLoading: boolean) => {
    if (isLoading) {
      return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
    if (!data || data.length === 0) {
      return <p className="text-muted-foreground p-8 text-center">No players on the leaderboard yet.</p>;
    }
    return (
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Rank</TableHead>
              <TableHead>Player</TableHead>
              <TableHead>Wins</TableHead>
              <TableHead>Losses</TableHead>
              <TableHead className="text-right">Win/Loss Ratio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((user, index) => {
              const rank = index + 1;
              const { stats } = user;
              const totalGames = stats.wins + stats.losses;
              const winLossRatio = stats.losses > 0 ? (stats.wins / stats.losses).toFixed(2) : stats.wins;
              return (
                <TableRow key={user.id} className={cn(rank === 1 && "bg-primary/10 hover:bg-primary/20")}>
                  <TableCell className="font-medium text-lg text-center">
                    <div className="flex items-center justify-center">
                      {rank === 1 ? <Crown className="h-6 w-6 text-primary" /> : rank}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-semibold">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{stats.wins}</TableCell>
                  <TableCell>{stats.losses}</TableCell>
                  <TableCell className="text-right font-mono">{winLossRatio}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Leaderboard"
        description="See who's dominating the barn."
      />
      <Tabs defaultValue="all-time">
        <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="all-time">All-Time</TabsTrigger>
        </TabsList>
        <TabsContent value="all-time">
          {renderLeaderboard(allTime, isLoadingAllTime)}
        </TabsContent>
        <TabsContent value="daily">
          <p className="text-muted-foreground p-8 text-center">Daily leaderboards are coming soon!</p>
        </TabsContent>
        <TabsContent value="monthly">
          <p className="text-muted-foreground p-8 text-center">Monthly leaderboards are coming soon!</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
