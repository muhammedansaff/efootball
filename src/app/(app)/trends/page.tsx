'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { User, Match } from '@/lib/types';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TrendingUp, Users, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TrendsPage() {
  const { appUser } = useAuth();
  const firestore = useFirestore();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Fetch all users
  const usersQuery = useMemoFirebase(() => 
    firestore ? collection(firestore, 'users') : null, 
    [firestore]
  );
  const { data: allUsers } = useCollection<User>(usersQuery);

  // Fetch all matches
  const matchesQuery = useMemoFirebase(() => 
    firestore ? collection(firestore, 'matches') : null,
    [firestore]
  );
  const { data: allMatches } = useCollection<Match>(matchesQuery);

  // Calculate monthly stats for current user
  const monthlyStats = useMemo(() => {
    if (!allMatches || !appUser) return [];

    const last6Months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date()
    });

    return last6Months.map(monthStart => {
      const monthEnd = endOfMonth(monthStart);
      const monthMatches = allMatches.filter(match => {
        const matchDate = match.date && typeof match.date === 'object' && 'toDate' in match.date 
          ? match.date.toDate() 
          : new Date(match.date);
        return matchDate >= monthStart && matchDate <= monthEnd &&
               match.participants.includes(appUser.id);
      });

      const wins = monthMatches.filter(m => m.winnerId === appUser.id).length;
      const losses = monthMatches.filter(m => m.winnerId !== 'draw' && m.winnerId !== appUser.id).length;
      const draws = monthMatches.filter(m => m.winnerId === 'draw').length;
      
      const goalsFor = monthMatches.reduce((sum, m) => {
        const isTeam1 = m.team1Stats.userId === appUser.id;
        return sum + (isTeam1 ? m.team1Stats.score : m.team2Stats.score);
      }, 0);

      const goalsAgainst = monthMatches.reduce((sum, m) => {
        const isTeam1 = m.team1Stats.userId === appUser.id;
        return sum + (isTeam1 ? m.team2Stats.score : m.team1Stats.score);
      }, 0);

      const winRate = monthMatches.length > 0 ? (wins / monthMatches.length) * 100 : 0;

      return {
        month: format(monthStart, 'MMM'),
        wins,
        losses,
        draws,
        goalsFor,
        goalsAgainst,
        winRate: Math.round(winRate),
        matches: monthMatches.length
      };
    });
  }, [allMatches, appUser]);

  // Calculate comparison data
  const comparisonData = useMemo(() => {
    if (!allUsers || selectedUsers.length === 0) return null;

    const users = allUsers.filter(u => selectedUsers.includes(u.id));
    
    return {
      stats: [
        {
          category: 'Wins',
          ...users.reduce((acc, user) => ({
            ...acc,
            [user.name]: user.stats.wins
          }), {})
        },
        {
          category: 'Losses',
          ...users.reduce((acc, user) => ({
            ...acc,
            [user.name]: user.stats.losses
          }), {})
        },
        {
          category: 'Draws',
          ...users.reduce((acc, user) => ({
            ...acc,
            [user.name]: user.stats.draws
          }), {})
        },
        {
          category: 'Goals For',
          ...users.reduce((acc, user) => ({
            ...acc,
            [user.name]: user.stats.goalsFor
          }), {})
        },
        {
          category: 'Goals Against',
          ...users.reduce((acc, user) => ({
            ...acc,
            [user.name]: user.stats.goalsAgainst
          }), {})
        },
        {
          category: 'Pass Acc %',
          ...users.reduce((acc, user) => ({
            ...acc,
            [user.name]: Math.round((user.stats.successfulPasses / user.stats.passes) * 100)
          }), {})
        },
        {
          category: 'Shot Acc %',
          ...users.reduce((acc, user) => ({
            ...acc,
            [user.name]: Math.round((user.stats.shotsOnTarget / user.stats.shots) * 100)
          }), {})
        },
        {
          category: 'Tackles',
          ...users.reduce((acc, user) => ({
            ...acc,
            [user.name]: user.stats.tackles
          }), {})
        },
        {
          category: 'Saves',
          ...users.reduce((acc, user) => ({
            ...acc,
            [user.name]: user.stats.saves
          }), {})
        },
        {
          category: 'Fouls',
          ...users.reduce((acc, user) => ({
            ...acc,
            [user.name]: user.stats.fouls
          }), {})
        },
        {
          category: 'Red Cards',
          ...users.reduce((acc, user) => ({
            ...acc,
            [user.name]: user.stats.redCards
          }), {})
        },
        {
          category: 'Avg Possession %',
          ...users.reduce((acc, user) => ({
            ...acc,
            [user.name]: Math.round((user.stats.totalPossession / user.stats.matchesPlayed))
          }), {})
        }
      ],
      users: users,
      leaders: {
        wins: users.reduce((a, b) => b.stats.wins > a.stats.wins ? b : a),
        losses: users.reduce((a, b) => b.stats.losses > a.stats.losses ? b : a),
        draws: users.reduce((a, b) => b.stats.draws > a.stats.draws ? b : a),
        goals: users.reduce((a, b) => b.stats.goalsFor > a.stats.goalsFor ? b : a),
        goalsAgainst: users.reduce((a, b) => b.stats.goalsAgainst > a.stats.goalsAgainst ? b : a),
        passAcc: users.reduce((a, b) => {
          const aAcc = (a.stats.successfulPasses / a.stats.passes) * 100;
          const bAcc = (b.stats.successfulPasses / b.stats.passes) * 100;
          return bAcc > aAcc ? b : a;
        }),
        shotAcc: users.reduce((a, b) => {
          const aAcc = (a.stats.shotsOnTarget / a.stats.shots) * 100;
          const bAcc = (b.stats.shotsOnTarget / b.stats.shots) * 100;
          return bAcc > aAcc ? b : a;
        }),
        tackles: users.reduce((a, b) => b.stats.tackles > a.stats.tackles ? b : a),
        saves: users.reduce((a, b) => b.stats.saves > a.stats.saves ? b : a),
        fouls: users.reduce((a, b) => b.stats.fouls > a.stats.fouls ? b : a),
        redCards: users.reduce((a, b) => b.stats.redCards > a.stats.redCards ? b : a),
        possession: users.reduce((a, b) => {
          const aAvg = a.stats.totalPossession / a.stats.matchesPlayed;
          const bAvg = b.stats.totalPossession / b.stats.matchesPlayed;
          return bAvg > aAvg ? b : a;
        }),
      }
    };
  }, [allUsers, selectedUsers]);

  const handleAddUser = (userId: string) => {
    if (!selectedUsers.includes(userId) && selectedUsers.length < 4) {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(id => id !== userId));
  };

  const colors = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

  if (!appUser) return null;

  return (
    <div className="space-y-8 pb-24 md:pb-0">
      <PageHeader
        title="Performance Trends"
        description="Track your performance over time and compare with other players."
      />

      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="trends">
            <TrendingUp className="h-4 w-4 mr-2" />
            My Trends
          </TabsTrigger>
          <TabsTrigger value="compare">
            <Users className="h-4 w-4 mr-2" />
            Compare Players
          </TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          {/* Wins/Losses Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Wins & Losses (Last 6 Months)</CardTitle>
              <CardDescription>Track your match results over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="wins" fill="#10b981" name="Wins" />
                  <Bar dataKey="losses" fill="#ef4444" name="Losses" />
                  <Bar dataKey="draws" fill="#6b7280" name="Draws" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Goals Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Goals Scored vs Conceded</CardTitle>
              <CardDescription>Your attacking and defensive performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="goalsFor" stroke="#8b5cf6" strokeWidth={2} name="Goals For" />
                  <Line type="monotone" dataKey="goalsAgainst" stroke="#ef4444" strokeWidth={2} name="Goals Against" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Win Rate Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Win Rate Trend</CardTitle>
              <CardDescription>Your win percentage over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="winRate" stroke="#10b981" strokeWidth={3} name="Win Rate %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compare Tab */}
        <TabsContent value="compare" className="space-y-6">
          {/* User Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Players to Compare</CardTitle>
              <CardDescription>Choose up to 4 players (including yourself)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select onValueChange={handleAddUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Add player to comparison..." />
                </SelectTrigger>
                <SelectContent>
                  {allUsers?.filter(u => !selectedUsers.includes(u.id)).map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Selected Users */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((userId, index) => {
                    const user = allUsers?.find(u => u.id === userId);
                    if (!user) return null;
                    return (
                      <div key={userId} className="flex items-center gap-2 bg-muted rounded-full pl-1 pr-3 py-1">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatarUrl || undefined} />
                          <AvatarFallback className="text-xs">{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{user.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 rounded-full"
                          onClick={() => handleRemoveUser(userId)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comparison Charts */}
          {comparisonData && (
            <>
              {/* Radar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Overall Comparison</CardTitle>
                  <CardDescription>Multi-dimensional performance comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={comparisonData.stats}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="category" />
                      <PolarRadiusAxis />
                      {comparisonData.users.map((user, index) => (
                        <Radar
                          key={user.id}
                          name={user.name}
                          dataKey={user.name}
                          stroke={colors[index]}
                          fill={colors[index]}
                          fillOpacity={0.3}
                        />
                      ))}
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Leaders Board */}
              <Card>
                <CardHeader>
                  <CardTitle>Category Leaders</CardTitle>
                  <CardDescription>Who leads in each category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(comparisonData.leaders).map(([category, user]) => (
                      <div key={category} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                        <Avatar className="h-12 w-12 border-2 border-primary">
                          <AvatarImage src={user.avatarUrl || undefined} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground capitalize">{category.replace(/([A-Z])/g, ' $1').trim()}</p>
                          <p className="font-semibold truncate">{user.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Bar Chart Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Stats Comparison</CardTitle>
                  <CardDescription>Side-by-side comparison of key metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={comparisonData.stats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {comparisonData.users.map((user, index) => (
                        <Bar key={user.id} dataKey={user.name} fill={colors[index]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}

          {selectedUsers.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Select players above to start comparing</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
