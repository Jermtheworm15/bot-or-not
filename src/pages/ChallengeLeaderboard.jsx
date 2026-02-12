import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award, Crown, TrendingUp } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

export default function ChallengeLeaderboard() {
  const [dailyLeaders, setDailyLeaders] = useState([]);
  const [weeklyLeaders, setWeeklyLeaders] = useState([]);
  const [allTimeLeaders, setAllTimeLeaders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLeaderboards();
  }, []);

  const loadLeaderboards = async () => {
    setIsLoading(true);
    try {
      const allProfiles = await base44.entities.UserProfile.list();
      
      // Get all users data
      const allUsers = await base44.entities.User.list();
      const userMap = {};
      allUsers.forEach(u => {
        userMap[u.email] = u.username || u.email;
      });

      // Daily leaders - most daily votes
      const dailySorted = [...allProfiles]
        .sort((a, b) => (b.daily_votes || 0) - (a.daily_votes || 0))
        .slice(0, 10)
        .map(p => ({
          username: userMap[p.user_email] || p.user_email,
          value: p.daily_votes || 0,
          points: p.points || 0,
          tier: p.tier || 'bronze'
        }));
      setDailyLeaders(dailySorted);

      // Weekly leaders - most weekly votes
      const weeklySorted = [...allProfiles]
        .sort((a, b) => (b.weekly_votes || 0) - (a.weekly_votes || 0))
        .slice(0, 10)
        .map(p => ({
          username: userMap[p.user_email] || p.user_email,
          value: p.weekly_votes || 0,
          points: p.points || 0,
          tier: p.tier || 'bronze'
        }));
      setWeeklyLeaders(weeklySorted);

      // All-time leaders - most points
      const allTimeSorted = [...allProfiles]
        .sort((a, b) => (b.points || 0) - (a.points || 0))
        .slice(0, 10)
        .map(p => ({
          username: userMap[p.user_email] || p.user_email,
          value: p.points || 0,
          badges: (p.badges || []).length,
          tier: p.tier || 'bronze'
        }));
      setAllTimeLeaders(allTimeSorted);
    } catch (err) {
      console.log('Error loading leaderboards:', err);
    }
    setIsLoading(false);
  };

  const getTierBadge = (tier) => {
    const colors = {
      bronze: 'bg-amber-700/30 text-amber-400 border-amber-600',
      silver: 'bg-slate-400/30 text-slate-300 border-slate-500',
      gold: 'bg-yellow-400/30 text-yellow-300 border-yellow-500',
      platinum: 'bg-cyan-400/30 text-cyan-300 border-cyan-500'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${colors[tier] || colors.bronze}`}>
        {tier?.toUpperCase()}
      </span>
    );
  };

  const getRankIcon = (rank) => {
    if (rank === 0) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 1) return <Medal className="w-6 h-6 text-slate-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="w-6 h-6 flex items-center justify-center text-zinc-500 font-bold">#{rank + 1}</span>;
  };

  const LeaderCard = ({ user, rank, type }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
    >
      <Card className={`bg-zinc-900 border-zinc-800 p-4 hover:border-purple-500/50 transition-all ${
        rank < 3 ? 'border-purple-500/30' : ''
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {getRankIcon(rank)}
            <div>
              <div className="font-semibold text-white">{user.username}</div>
              <div className="flex items-center gap-2 mt-1">
                {getTierBadge(user.tier)}
              </div>
            </div>
          </div>
          <div className="text-right">
            {type === 'daily' && (
              <>
                <div className="text-2xl font-bold text-green-400">{user.value}</div>
                <div className="text-xs text-zinc-500">votes today</div>
              </>
            )}
            {type === 'weekly' && (
              <>
                <div className="text-2xl font-bold text-blue-400">{user.value}</div>
                <div className="text-xs text-zinc-500">votes this week</div>
              </>
            )}
            {type === 'alltime' && (
              <>
                <div className="text-2xl font-bold text-purple-400">{user.value}</div>
                <div className="text-xs text-zinc-500">{user.badges} badges</div>
              </>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );

  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-20 w-full bg-zinc-800" />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center space-y-2"
        >
          <h1 className="text-4xl font-black tracking-tight flex items-center justify-center gap-3">
            <Trophy className="w-10 h-10 text-yellow-400" />
            Challenge Champions
          </h1>
          <p className="text-zinc-400">See who's dominating the challenges</p>
        </motion.div>

        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-900">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="alltime">All-Time</TabsTrigger>
          </TabsList>

          {/* Daily Leaderboard */}
          <TabsContent value="daily" className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-bold">Today's Most Active</h3>
            </div>
            {isLoading ? (
              <LoadingSkeleton />
            ) : dailyLeaders.length > 0 ? (
              dailyLeaders.map((user, idx) => (
                <LeaderCard key={idx} user={user} rank={idx} type="daily" />
              ))
            ) : (
              <Card className="bg-zinc-900 border-zinc-800 p-8 text-center">
                <p className="text-zinc-500">No daily activity yet. Be the first to vote today!</p>
              </Card>
            )}
          </TabsContent>

          {/* Weekly Leaderboard */}
          <TabsContent value="weekly" className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-bold">This Week's Champions</h3>
            </div>
            {isLoading ? (
              <LoadingSkeleton />
            ) : weeklyLeaders.length > 0 ? (
              weeklyLeaders.map((user, idx) => (
                <LeaderCard key={idx} user={user} rank={idx} type="weekly" />
              ))
            ) : (
              <Card className="bg-zinc-900 border-zinc-800 p-8 text-center">
                <p className="text-zinc-500">No weekly activity yet. Start voting to claim the top spot!</p>
              </Card>
            )}
          </TabsContent>

          {/* All-Time Leaderboard */}
          <TabsContent value="alltime" className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-bold">Hall of Fame</h3>
            </div>
            {isLoading ? (
              <LoadingSkeleton />
            ) : allTimeLeaders.length > 0 ? (
              allTimeLeaders.map((user, idx) => (
                <LeaderCard key={idx} user={user} rank={idx} type="alltime" />
              ))
            ) : (
              <Card className="bg-zinc-900 border-zinc-800 p-8 text-center">
                <p className="text-zinc-500">No all-time data yet. Keep playing to earn your place!</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}