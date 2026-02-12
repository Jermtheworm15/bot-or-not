import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trophy, Star, Target, TrendingUp, Crown, ChevronLeft, ChevronRight } from 'lucide-react';

export default function UserLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRank, setUserRank] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('points');
  const [timeframe, setTimeframe] = useState('all-time');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadLeaderboard();
  }, [sortBy, timeframe]);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    setPage(1);
    
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      const [profiles, votes, users] = await Promise.all([
        base44.entities.UserProfile.list(),
        base44.entities.Vote.list('-created_date'),
        base44.entities.User.list()
      ]);
      
      const userMap = {};
      users.forEach(u => { if (u.email) userMap[u.email] = u; });
      
      // Calculate vote stats per user
      const userStats = {};
      votes.forEach(vote => {
        if (!vote.user_email) return;
        
        // Filter by timeframe
        const voteDate = new Date(vote.created_date);
        const now = new Date();
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        if (timeframe === 'daily' && voteDate < dayAgo) return;
        if (timeframe === 'weekly' && voteDate < weekAgo) return;
        
        if (!userStats[vote.user_email]) {
          userStats[vote.user_email] = {
            totalVotes: 0,
            correctVotes: 0,
            currentStreak: 0,
            bestStreak: 0
          };
        }
        
        const stats = userStats[vote.user_email];
        stats.totalVotes++;
        
        if (vote.was_correct) {
          stats.currentStreak++;
          stats.correctVotes++;
          if (stats.currentStreak > stats.bestStreak) {
            stats.bestStreak = stats.currentStreak;
          }
        } else {
          stats.currentStreak = 0;
        }
      });
      
      // Combine profile data with vote stats
      const leaderboardData = profiles.map(profile => {
        const stats = userStats[profile.user_email] || { totalVotes: 0, correctVotes: 0, bestStreak: 0 };
        const accuracy = stats.totalVotes > 0 ? (stats.correctVotes / stats.totalVotes) * 100 : 0;
        
        return {
          email: profile.user_email,
          username: userMap[profile.user_email]?.username || profile.user_email.split('@')[0],
          points: profile.points || 0,
          level: profile.level || 1,
          totalVotes: stats.totalVotes,
          correctVotes: stats.correctVotes,
          accuracy: accuracy,
          perfectStreak: profile.perfect_streak || 0,
          tier: profile.tier || 'bronze'
        };
      });
      
      // Sort based on selected criteria
      let sorted;
      if (sortBy === 'points') {
        sorted = leaderboardData.sort((a, b) => b.points - a.points);
      } else if (sortBy === 'accuracy') {
        sorted = leaderboardData.sort((a, b) => b.accuracy - a.accuracy);
      } else if (sortBy === 'streak') {
        sorted = leaderboardData.sort((a, b) => b.perfectStreak - a.perfectStreak);
      } else {
        sorted = leaderboardData.sort((a, b) => b.correctVotes - a.correctVotes);
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

  const paginatedData = leaderboard.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(leaderboard.length / itemsPerPage);

  const LeaderboardCard = ({ user, rank }) => {
    const isCurrentUser = currentUser?.email === user.email;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: (rank % itemsPerPage) * 0.03 }}
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
              {rank === 1 ? <Crown className="w-7 h-7" /> : `#${rank}`}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white font-bold text-lg">
                  {user.username}
                  {isCurrentUser && <span className="text-purple-400 text-sm ml-2">(You)</span>}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getTierBg(user.tier)} ${getTierColor(user.tier)}`}>
                  {user.tier}
                </span>
              </div>
              
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-white font-semibold">{user.points}</span>
                  <span className="text-zinc-500">pts</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="w-4 h-4 text-green-400" />
                  <span className="text-white">{user.accuracy.toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-orange-400" />
                  <span className="text-white">{user.perfectStreak}</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{user.correctVotes}</p>
              <p className="text-xs text-zinc-500">correct</p>
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
    <div className="min-h-screen bg-zinc-950 text-white py-8">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-6"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <Trophy className="w-10 h-10 text-purple-400" />
            <h1 className="text-4xl font-black">Leaderboard</h1>
          </div>
          <p className="text-zinc-400">Top players ranked by performance</p>
        </motion.div>

        {/* Your Rank Card */}
        {userRank && !isLoading && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6"
          >
            <Card className="bg-gradient-to-r from-purple-900/30 to-green-900/30 border-purple-500/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center font-bold text-xl">
                    #{userRank}
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">Your Rank</p>
                    <p className="text-zinc-400 text-sm">Keep climbing the leaderboard!</p>
                  </div>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </Card>
          </motion.div>
        )}

        {/* Filters */}
        <div className="mb-6 space-y-4">
          <Tabs value={timeframe} onValueChange={setTimeframe}>
            <TabsList className="bg-zinc-900 border border-purple-500/30 w-full">
              <TabsTrigger value="all-time" className="data-[state=active]:bg-purple-600 flex-1">
                All-Time
              </TabsTrigger>
              <TabsTrigger value="weekly" className="data-[state=active]:bg-purple-600 flex-1">
                This Week
              </TabsTrigger>
              <TabsTrigger value="daily" className="data-[state=active]:bg-purple-600 flex-1">
                Today
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={sortBy === 'points' ? 'default' : 'outline'}
              onClick={() => setSortBy('points')}
              className={sortBy === 'points' ? 'bg-purple-600' : 'border-purple-500/30'}
            >
              <Star className="w-4 h-4 mr-2" />
              Points
            </Button>
            <Button
              variant={sortBy === 'accuracy' ? 'default' : 'outline'}
              onClick={() => setSortBy('accuracy')}
              className={sortBy === 'accuracy' ? 'bg-purple-600' : 'border-purple-500/30'}
            >
              <Target className="w-4 h-4 mr-2" />
              Accuracy
            </Button>
            <Button
              variant={sortBy === 'streak' ? 'default' : 'outline'}
              onClick={() => setSortBy('streak')}
              className={sortBy === 'streak' ? 'bg-purple-600' : 'border-purple-500/30'}
            >
              <Trophy className="w-4 h-4 mr-2" />
              Streak
            </Button>
            <Button
              variant={sortBy === 'correct' ? 'default' : 'outline'}
              onClick={() => setSortBy('correct')}
              className={sortBy === 'correct' ? 'bg-purple-600' : 'border-purple-500/30'}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Correct
            </Button>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="space-y-4">
          {isLoading ? (
            <LoadingSkeleton />
          ) : paginatedData.length > 0 ? (
            paginatedData.map((user, index) => (
              <LeaderboardCard 
                key={user.email} 
                user={user} 
                rank={(page - 1) * itemsPerPage + index + 1} 
              />
            ))
          ) : (
            <p className="text-center text-zinc-500 py-12">No players found. Start voting to join the leaderboard!</p>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border-purple-500/30"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <Button
                  key={i}
                  variant={page === i + 1 ? 'default' : 'outline'}
                  onClick={() => setPage(i + 1)}
                  className={page === i + 1 ? 'bg-purple-600' : 'border-purple-500/30'}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="border-purple-500/30"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}