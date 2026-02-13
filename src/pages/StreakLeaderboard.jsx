import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Trophy, Flame, Users, MapPin } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

export default function StreakLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('global');
  const [regionRadius, setRegionRadius] = useState('50');
  const [friends, setFriends] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadStreakLeaderboard();
  }, [viewMode, regionRadius]);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      if (!user) return;

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

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const loadStreakLeaderboard = async () => {
    setIsLoading(true);
    
    const [votes, profiles] = await Promise.all([
      base44.entities.Vote.list('-created_date'),
      base44.entities.UserProfile.list()
    ]);
    
    const profileMap = {};
    profiles.forEach(p => { if (p.user_email) profileMap[p.user_email] = p; });
    
    // Calculate streaks per user
    const userStreaks = {};
    const users = await base44.entities.User.list();
    const userMap = {};
    users.forEach(u => { if (u.email) userMap[u.email] = u; });

    votes.forEach(vote => {
      if (!vote.user_email) return;

      if (!userStreaks[vote.user_email]) {
        const profile = profileMap[vote.user_email];
        userStreaks[vote.user_email] = {
          email: vote.user_email,
          username: userMap[vote.user_email]?.username,
          currentStreak: 0,
          bestStreak: 0,
          totalVotes: 0,
          correctVotes: 0,
          latitude: profile?.latitude,
          longitude: profile?.longitude
        };
      }
      
      const user = userStreaks[vote.user_email];
      user.totalVotes++;
      
      if (vote.was_correct) {
        user.currentStreak++;
        user.correctVotes++;
        if (user.currentStreak > user.bestStreak) {
          user.bestStreak = user.currentStreak;
        }
      } else {
        user.currentStreak = 0;
      }
    });
    
    // Sort by best streak
    let sorted = Object.values(userStreaks)
      .filter(u => u.bestStreak > 0);

    // Filter by view mode
    if (viewMode === 'friends') {
      sorted = sorted.filter(u => friends.includes(u.email));
    } else if (viewMode === 'nearby' && currentUser) {
      const userProfile = profileMap[currentUser.email];
      if (userProfile?.latitude && userProfile?.longitude) {
        const radiusMiles = parseInt(regionRadius);
        sorted = sorted.filter(u => {
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

    sorted = sorted.sort((a, b) => b.bestStreak - a.bestStreak).slice(0, 10);
    
    setLeaderboard(sorted);
    setIsLoading(false);
  };

  const LeaderboardCard = ({ user, rank }) => {
    const displayName = user.username || user.email.split('@')[0];
    const accuracy = Math.round((user.correctVotes / user.totalVotes) * 100);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: rank * 0.05 }}
      >
        <Card className="bg-zinc-900 border-zinc-800 p-4 hover:border-amber-500/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
              rank === 0 ? 'bg-amber-500 text-white' :
              rank === 1 ? 'bg-zinc-400 text-white' :
              rank === 2 ? 'bg-amber-700 text-white' :
              'bg-zinc-800 text-zinc-400'
            }`}>
              {rank === 0 ? <Trophy className="w-6 h-6" /> : `#${rank + 1}`}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="text-white font-bold text-2xl">
                  {user.bestStreak}
                </span>
                <span className="text-zinc-500 text-sm">streak</span>
              </div>
              <p className="text-zinc-400 text-sm">{displayName}</p>
              <div className="flex gap-3 text-xs text-zinc-500 mt-1">
                <span>{accuracy}% accuracy</span>
                <span>•</span>
                <span>{user.totalVotes} votes</span>
              </div>
            </div>
            
            {user.currentStreak > 0 && (
              <div className="flex items-center gap-1 bg-orange-500/20 px-3 py-1 rounded-full">
                <Zap className="w-4 h-4 text-orange-400" />
                <span className="text-orange-400 font-semibold text-sm">
                  {user.currentStreak} now
                </span>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    );
  };

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-20 bg-zinc-800" />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-8">
      <div className="fixed inset-0 bg-gradient-to-br from-orange-950/30 via-zinc-950 to-amber-950/20 pointer-events-none" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <Flame className="w-10 h-10 text-orange-500" />
            <h1 className="text-4xl font-black">Streak Leaderboard</h1>
          </div>
          <p className="text-zinc-400">Top players with the longest winning streaks</p>
        </motion.div>

        {/* View Mode Filters */}
        <div className="mb-6 space-y-4">
          <Tabs value={viewMode} onValueChange={setViewMode}>
            <TabsList className="bg-zinc-900 border border-purple-500/30 w-full grid grid-cols-3">
              <TabsTrigger value="global" className="data-[state=active]:bg-orange-600">
                <Trophy className="w-4 h-4 mr-2" />
                Global
              </TabsTrigger>
              <TabsTrigger value="friends" className="data-[state=active]:bg-orange-600">
                <Users className="w-4 h-4 mr-2" />
                Friends
              </TabsTrigger>
              <TabsTrigger value="nearby" className="data-[state=active]:bg-orange-600">
                <MapPin className="w-4 h-4 mr-2" />
                Nearby
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {viewMode === 'nearby' && (
            <Select value={regionRadius} onValueChange={setRegionRadius}>
              <SelectTrigger className="bg-zinc-900 border-orange-500/30">
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
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <LoadingSkeleton />
          ) : leaderboard.length > 0 ? (
            leaderboard.map((user, index) => (
              <LeaderboardCard key={user.email} user={user} rank={index} />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-zinc-500 mb-2">
                {viewMode === 'friends' ? 'No friends with streaks yet.' :
                 viewMode === 'nearby' ? 'No players found nearby with streaks.' :
                 'No streaks recorded yet. Start voting!'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}