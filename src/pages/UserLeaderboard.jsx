import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Star, Target, TrendingUp, Crown, ChevronLeft, ChevronRight, Users, MapPin, Bot, User } from 'lucide-react';
import LeaderboardFilters from '@/components/leaderboard/LeaderboardFilters';
import ClickableUsername from '@/components/community/ClickableUsername';

export default function UserLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRank, setUserRank] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('points');
  const [timeframe, setTimeframe] = useState('all-time');
  const [viewMode, setViewMode] = useState('global'); // 'global', 'friends', 'nearby'
  const [regionRadius, setRegionRadius] = useState('50'); // miles
  const [friends, setFriends] = useState([]);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 10;

  useEffect(() => {
    loadLeaderboard();
  }, [sortBy, timeframe, viewMode, regionRadius, searchQuery]);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      const user = await base44.auth.me();
      if (!user) return;

      // Get friends where status is accepted
      const [sentRequests, receivedRequests] = await Promise.all([
        base44.entities.Friend.filter({ user_email: user.email, status: 'accepted' }),
        base44.entities.Friend.filter({ friend_email: user.email, status: 'accepted' })
      ]);

      const friendEmails = new Set([
        ...sentRequests.map(f => f.friend_email),
        ...receivedRequests.map(f => f.user_email)
      ]);

      setFriends(Array.from(friendEmails));
    } catch (err) {
      console.error('Error loading friends:', err);
    }
  };

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
      let leaderboardData = profiles.map(profile => {
        const stats = userStats[profile.user_email] || { totalVotes: 0, correctVotes: 0, bestStreak: 0 };
        const accuracy = stats.totalVotes > 0 ? (stats.correctVotes / stats.totalVotes) * 100 : 0;
        
        return {
          email: profile.user_email,
          username: userMap[profile.user_email]?.username || profile.user_email.split('@')[0],
          profileImage: userMap[profile.user_email]?.profile_image,
          points: profile.points || 0,
          level: profile.level || 1,
          totalVotes: stats.totalVotes,
          correctVotes: stats.correctVotes,
          accuracy: accuracy,
          perfectStreak: profile.perfect_streak || 0,
          tier: profile.tier || 'bronze',
          latitude: profile.latitude,
          longitude: profile.longitude,
          zip_code: profile.zip_code
        };
      });

      // Filter by view mode
      if (viewMode === 'friends') {
        leaderboardData = leaderboardData.filter(u => friends.includes(u.email));
      } else if (viewMode === 'nearby' && user) {
        const userProfile = profiles.find(p => p.user_email === user.email);
        if (userProfile?.latitude && userProfile?.longitude) {
          const radiusMiles = parseInt(regionRadius);
          leaderboardData = leaderboardData.filter(u => {
            if (!u.latitude || !u.longitude) return false;
            const distance = calculateDistance(
              userProfile.latitude,
              userProfile.longitude,
              u.latitude,
              u.longitude
            );
            return distance <= radiusMiles;
          });
        }
      }
      
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
      
      // Filter by search query
      let filtered = sorted;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = sorted.filter(u => 
          u.username.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query)
        );
      }

      setLeaderboard(filtered);
      
      // Find user's rank (in original sorted list)
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

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959; // Earth radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const paginatedData = leaderboard.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(leaderboard.length / itemsPerPage);

  const LeaderboardCard = ({ user, rank }) => {
    const isCurrentUser = currentUser?.email === user.email;
    const userInfo = leaderboard.find(u => u.email === user.email);
    const profileImage = userInfo?.profileImage;
    
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
            {profileImage ? (
              <img
                src={profileImage}
                alt={user.username}
                className="flex-shrink-0 w-14 h-14 rounded-full object-cover border-2 border-purple-500/50"
              />
            ) : (
              <div className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg ${
                rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg shadow-yellow-500/50' :
                rank === 2 ? 'bg-gradient-to-br from-zinc-300 to-zinc-500 text-white shadow-lg shadow-zinc-400/50' :
                rank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-lg shadow-amber-600/50' :
                'bg-zinc-800 text-zinc-400'
              }`}>
                {rank === 1 ? <Crown className="w-7 h-7" /> : `#${rank}`}
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white font-bold text-lg">
                  {isCurrentUser ? (
                    <>
                      {user.username}
                      <span className="text-purple-400 text-sm ml-2">(You)</span>
                    </>
                  ) : (
                    <ClickableUsername 
                      username={user.username}
                      userEmail={user.email}
                    />
                  )}
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
        <LeaderboardFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortOptions={[
            { value: 'points', label: 'Points', icon: Star },
            { value: 'accuracy', label: 'Accuracy', icon: Target },
            { value: 'streak', label: 'Streak', icon: Trophy },
            { value: 'correct', label: 'Correct', icon: TrendingUp }
          ]}
        />

        {/* Region Filter for Nearby */}
        {viewMode === 'nearby' && (
          <Select value={regionRadius} onValueChange={setRegionRadius}>
            <SelectTrigger className="bg-zinc-900 border-purple-500/30">
              <SelectValue placeholder="Select radius" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">Within 10 miles</SelectItem>
              <SelectItem value="25">Within 25 miles</SelectItem>
              <SelectItem value="50">Within 50 miles</SelectItem>
              <SelectItem value="100">Within 100 miles</SelectItem>
              <SelectItem value="250">Within 250 miles</SelectItem>
            </SelectContent>
          </Select>
        )}

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
            <div className="text-center py-12">
              <p className="text-zinc-500 mb-2">
                {viewMode === 'friends' ? 'No friends found on the leaderboard yet.' :
                 viewMode === 'nearby' ? 'No players found nearby. Try increasing the radius.' :
                 'No players found. Start voting to join the leaderboard!'}
              </p>
              {viewMode === 'friends' && (
                <p className="text-zinc-600 text-sm">Add friends to see them here!</p>
              )}
            </div>
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