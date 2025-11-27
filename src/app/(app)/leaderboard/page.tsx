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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { useEffect, useRef } from 'react';


export default function LeaderboardPage() {
  const firestore = useFirestore();
  const audioRef = useRef<HTMLAudioElement>(null);

  const allTimeQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'users'), orderBy('stats.wins', 'desc'), limit(10)) : null, 
    [firestore]
  );
  const { data: allTime, isLoading: isLoadingAllTime } = useCollection<User>(allTimeQuery);

  // Get the first place user
  const firstPlaceUser = allTime?.[0];

  // Auto-play audio when first place user has custom audio
  useEffect(() => {
    if (firstPlaceUser?.leaderboardAudioUrl && audioRef.current) {
      audioRef.current.play().catch(error => {
        console.log("Audio autoplay prevented:", error);
      });
    }
  }, [firstPlaceUser?.leaderboardAudioUrl]);

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
    <div className="space-y-8 pb-24 md:pb-0">
      <PageHeader
        title="Leaderboard"
        description="See who's dominating the barn."
      />

      {/* First Place Celebration with Banner */}
      {firstPlaceUser && (firstPlaceUser.leaderboardImageUrl || firstPlaceUser.leaderboardAudioUrl || firstPlaceUser.bannerUrl) && (
        <Card className="overflow-hidden border-primary/50 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row items-start gap-6">
              {/* Left Side - Celebration Image & Text */}
              <div className="flex-1 flex flex-col md:flex-row items-center gap-6">
                {/* Celebration Image */}
                {firstPlaceUser.leaderboardImageUrl && (
                  <div className="relative w-full md:w-48 h-48 rounded-lg overflow-hidden border-2 border-primary/30 flex-shrink-0">
                    <img
                      src={firstPlaceUser.leaderboardImageUrl}
                      alt={`${firstPlaceUser.name}'s celebration`}
                      className="w-full h-full object-contain bg-muted"
                    />
                  </div>
                )}
                
                {/* Celebration Text */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                    <Crown className="h-8 w-8 text-primary animate-bounce-slow" />
                    <h3 className="font-headline text-3xl text-primary">Current Champion</h3>
                  </div>
                  <p className="text-xl font-semibold mb-1">{firstPlaceUser.name}</p>
                  <p className="text-muted-foreground">
                    {firstPlaceUser.stats.wins} wins • {firstPlaceUser.stats.losses} losses
                  </p>
                </div>
              </div>

              {/* Right Side - Banner */}
              {firstPlaceUser.bannerUrl && (
                <div className="w-full lg:w-80 flex-shrink-0">
                  <div className="relative h-64 rounded-lg overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
                    {firstPlaceUser.bannerType === 'video' ? (
                      <video
                        src={firstPlaceUser.bannerUrl}
                        className="w-full h-full object-contain"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    ) : (
                      <img
                        src={firstPlaceUser.bannerUrl}
                        alt={`${firstPlaceUser.name}'s banner`}
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Hidden Audio Player */}
            {firstPlaceUser.leaderboardAudioUrl && (
              <audio ref={audioRef} loop>
                <source src={firstPlaceUser.leaderboardAudioUrl} />
              </audio>
            )}
          </CardContent>
        </Card>
      )}

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
