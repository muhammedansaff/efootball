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

      {/* First Place Celebration - Redesigned */}
      {firstPlaceUser && (firstPlaceUser.leaderboardImageUrl || firstPlaceUser.leaderboardAudioUrl || firstPlaceUser.bannerUrl) && (
        <Card className="overflow-hidden border-primary/50 bg-gradient-to-br from-primary/5 via-background to-primary/10">
          <CardContent className="p-0">
            {/* Banner Section - Full Width on Mobile */}
            {firstPlaceUser.bannerUrl && (
              <div className="relative w-full h-48 md:h-64 bg-gradient-to-br from-primary/20 to-primary/5">
                {firstPlaceUser.bannerType === 'video' ? (
                  <video
                    src={firstPlaceUser.bannerUrl}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={firstPlaceUser.bannerUrl}
                    alt={`${firstPlaceUser.name}'s banner`}
                    className="w-full h-full object-cover"
                  />
                )}
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
              </div>
            )}

            {/* Content Section */}
            <div className="relative p-6 -mt-16 md:-mt-20">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Avatar & Celebration Image */}
                <div className="flex flex-col items-center gap-4 flex-shrink-0">
                  {/* Large Avatar with Crown */}
                  <div className="relative">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
                      <Crown className="h-10 w-10 text-yellow-500 fill-yellow-500 animate-bounce drop-shadow-lg" />
                    </div>
                    <Avatar className="h-28 w-28 border-4 border-primary shadow-2xl ring-4 ring-background">
                      <AvatarImage src={firstPlaceUser.avatarUrl || undefined} />
                      <AvatarFallback className="text-4xl bg-primary/20">{firstPlaceUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Celebration Image */}
                  {firstPlaceUser.leaderboardImageUrl && (
                    <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-primary/30 shadow-lg">
                      <img
                        src={firstPlaceUser.leaderboardImageUrl}
                        alt={`${firstPlaceUser.name}'s celebration`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Champion Info */}
                <div className="flex-1 text-center md:text-left space-y-4">
                  {/* Title */}
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                      <Crown className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">Current Champion</span>
                    </div>
                    <h2 className="font-headline text-4xl md:text-5xl text-primary tracking-tight">
                      {firstPlaceUser.name}
                    </h2>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Wins</p>
                      <p className="text-2xl font-bold text-primary">{firstPlaceUser.stats.wins}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Losses</p>
                      <p className="text-2xl font-bold">{firstPlaceUser.stats.losses}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Goals</p>
                      <p className="text-2xl font-bold text-green-500">{firstPlaceUser.stats.goalsFor}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">W/L Ratio</p>
                      <p className="text-2xl font-bold text-yellow-500">
                        {firstPlaceUser.stats.losses > 0 
                          ? (firstPlaceUser.stats.wins / firstPlaceUser.stats.losses).toFixed(2)
                          : firstPlaceUser.stats.wins}
                      </p>
                    </div>
                  </div>

                  {/* Achievement Badge */}
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                      <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">🏆 Rank #1</span>
                    </div>
                    {firstPlaceUser.stats.wins >= 10 && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                        <span className="text-xs font-medium text-purple-600 dark:text-purple-400">⚡ 10+ Wins</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
