import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star, Target, TrendingUp, Crown, Medal } from 'lucide-react';

export default function GlobalLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRank, setUserRank] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [metric, setMetric] = useState('points');

  useEffect(() => {
    loadLeaderboard();
  }, [metric]);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      const [profiles, votes, users] = await Promise.all([
        base44.entities.UserProfile.list(),
        base44.entities.Vote.list(),
        base44.entities.User.list()
      ]);
      
      const userMap = {};
      users.forEach(u => { if (u.email) userMap[u.email] = u; });
      
      // Calculate stats for each user
      const userStats = {};
      votes.forEach(vote => {
        if (!vote.user_email) return;
        if (!userStats[vote.user_email]) {
          userStats[vote.user_email] = { totalVotes: 0, correctVotes: 0 };
        }
        userStats[vote.user_email].totalVotes++;
        if (vote.was_correct) {
          userStats[vote.user_email].correctVotes++;
        }
      });
      
      // Build leaderboard
      const leaderboardData = profiles.map(profile => {
        const stats = userStats[profile.user_email] || { totalVotes: 0, correctVotes: 0 };
        const accuracy = stats.totalVotes > 0 ? (stats.correctVotes / stats.totalVotes) * 100 : 0;
        
        return {
          email: profile.user_email,
          username: userMap[profile.user_email]?.full_name || profile.user_email.split('@')[0],
          points: profile.points || 0,
          level: profile.level || 1,
          totalVotes: stats.totalVotes,
          correctVotes: stats.correctVotes,
          accuracy: accuracy,
          streak: profile.perfect_streak || 0,
          tier: profile.tier || 'bronze'
        };
      });
      
      // Sort by selected metric
      let sorted;
      if (metric === 'points') {
        sorted = leaderboardData.sort((a, b) => b.points - a.points);
      } else if (metric === 'accuracy') {
        sorted = leaderboardData.filter(u => u.totalVotes > 0).sort((a, b) => b.accuracy - a.accuracy);
      } else if (metric === 'votes') {
        sorted = leaderboardData.sort((a, b) => b.totalVotes - a.totalVotes);
      } else {
        sorted = leaderboardData.sort((a, b) => b.streak - a.streak);
      }
      
      setLeaderboard(sorted);
      
      // Find user's rank
      const rank = sorted.findIndex(u => u.email === user.email);
      setUserRank(rank >= 0 ? rank + 1 : null);
      
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    }
    setIsLoading(false);
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'platinum': return 'text-cyan-400';
      case 'gold': return 'text-yellow-400';
      case 'silver': return 'text-zinc-300';
      default: return 'text-amber-600';
    }
  };

  const getTierBg = (tier) => {
    switch (tier) {
      case 'platinum': return 'bg-cyan-500/20';
      case 'gold': return 'bg-yellow-500/20';
      case 'silver': return 'bg-zinc-400/20';
      default: return 'bg-amber-600/20';
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-7 h-7" />;
    if (rank === 2) return <Medal className="w-7 h-7" />;
    if (rank === 3) return <Trophy className="w-7 h-7" />;
    return null;
  };

  const LeaderboardCard = ({ user, rank }) => {
    const isCurrentUser = currentUser?.email === user.email;
    const metricValue = metric === 'points' ? user.points : 
                       metric === 'accuracy' ? user.accuracy.toFixed(0) + '%' :
                       metric === 'votes' ? user.totalVotes :
                       user.streak;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: (rank - 1) * 0.03 }}
      >
        <Card className={`bg-zinc-900 p-4 hover:border-purple-500/50 transition-colors ${
          isCurrentUser ? 'border-purple-500 shadow-lg shadow-purple-500/20' : 'border-zinc-800'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg ${
              rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg shadow-yellow-500/50' :
              rank === 2 ? 'bg-gradient-to-br from-zinc-300 to-zinc-500 text-white shadow-lg shadow-zinc-400/50' :
              rank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-lg shadow-amber-600/50' :
              'bg-zinc-800 text-zinc-400'
            }`}>
              {getRankIcon(rank) || `#${rank}`}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-white font-bold text-lg">
                  {user.username}
                  {isCurrentUser && <span className="text-purple-400 text-sm ml-2">(You)</span>}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getTierBg(user.tier)} ${getTierColor(user.tier)}`}>
                  {user.tier}
                </span>
              </div>
              
              <div className="flex gap-3 text-xs text-zinc-400">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-400" />
                  {user.points} pts
                </div>
                <div className="flex items-center gap-1">
                  <Target className="w-3 h-3 text-green-400" />
                  {user.accuracy.toFixed(0)}%
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-orange-400" />
                  {user.totalVotes} votes
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{metricValue}</p>
              <p className="text-xs text-zinc-500">
                {metric === 'points' ? 'points' :
                 metric === 'accuracy' ? 'accuracy' :
                 metric === 'votes' ? 'votes' :
                 'streak'}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-24 bg-zinc-800" />
      ))}
    </div>
  );

  return (
    <div className="w-full space-y-6">
      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <TabsList className="bg-zinc-900 border border-purple-500/30">
          <TabsTrigger 
            value="points"
            onClick={() => setMetric('points')}
            className="data-[state=active]:bg-purple-600"
          >
            <Star className="w-4 h-4 mr-2" />
            Points
          </TabsTrigger>
          <TabsTrigger 
            value="accuracy"
            onClick={() => setMetric('accuracy')}
            className="data-[state=active]:bg-purple-600"
          >
            <Target className="w-4 h-4 mr-2" />
            Accuracy
          </TabsTrigger>
          <TabsTrigger 
            value="votes"
            onClick={() => setMetric('votes')}
            className="data-[state=active]:bg-purple-600"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Votes
          </TabsTrigger>
          <TabsTrigger 
            value="streak"
            onClick={() => setMetric('streak')}
            className="data-[state=active]:bg-purple-600"
          >
            <Trophy className="w-4 h-4 mr-2" />
            Streak
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Your Rank Card */}
      {userRank && !isLoading && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Card className="bg-gradient-to-r from-purple-900/30 to-green-900/30 border-purple-500/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center font-bold text-xl">
                  #{userRank}
                </div>
                <div>
                  <p className="text-white font-bold">Your Rank</p>
                  <p className="text-zinc-400 text-sm">Keep climbing!</p>
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </Card>
        </motion.div>
      )}

      {/* Leaderboard */}
      <div className="space-y-4">
        {isLoading ? (
          <LoadingSkeleton />
        ) : leaderboard.length > 0 ? (
          leaderboard.slice(0, 20).map((user, index) => (
            <LeaderboardCard 
              key={user.email} 
              user={user} 
              rank={index + 1} 
            />
          ))
        ) : (
          <p className="text-center text-zinc-500 py-12">No players yet. Start voting to join!</p>
        )}
      </div>
    </div>
  );
}