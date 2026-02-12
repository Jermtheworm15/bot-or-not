import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Gamepad2, Target, Users } from 'lucide-react';

export default function AIBattleLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [friendsLeaderboard, setFriendsLeaderboard] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [viewMode, setViewMode] = useState('global'); // 'global' or 'friends'
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLeaderboards();
  }, []);

  const loadLeaderboards = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      // Fetch all user profiles to get AI battle stats
      const allProfiles = await base44.entities.UserProfile.list();

      // Get all votes to calculate accuracy
      const allVotes = await base44.entities.Vote.list();
      const allVideoVotes = await base44.entities.VideoVote.list();

      // Calculate stats for each player
      const playerStats = allProfiles
        .map(profile => {
          const userVotes = allVotes.filter(v => v.user_email === profile.user_email);
          const userVideoVotes = allVideoVotes.filter(v => v.user_email === profile.user_email);
          const allUserVotes = [...userVotes, ...userVideoVotes];

          const correctVotes = allUserVotes.filter(v => v.was_correct).length;
          const accuracy = allUserVotes.length > 0 ? ((correctVotes / allUserVotes.length) * 100).toFixed(1) : 0;

          return {
            email: profile.user_email,
            name: profile.user_email, // You could fetch full name from User entity
            points: profile.points || 0,
            level: profile.level || 1,
            accuracy: parseFloat(accuracy),
            totalVotes: allUserVotes.length,
            correctVotes,
            streak: profile.perfect_streak || 0,
            badges: profile.badges?.length || 0
          };
        })
        .filter(stat => stat.totalVotes > 0) // Only show players with votes
        .sort((a, b) => {
          // Sort by accuracy first, then points
          if (b.accuracy !== a.accuracy) {
            return b.accuracy - a.accuracy;
          }
          return b.points - a.points;
        });

      setLeaderboard(playerStats);

      // Get user's friends for friend-based leaderboard
      if (user) {
        const friends = await base44.entities.Friend.filter({
          user_email: user.email,
          status: 'accepted'
        });
        const friendEmails = friends.map(f => f.friend_email);
        const friendStats = playerStats.filter(s => friendEmails.includes(s.email) || s.email === user.email);
        setFriendsLeaderboard(friendStats);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
    setIsLoading(false);
  };

  const displayedData = viewMode === 'friends' ? friendsLeaderboard : leaderboard;

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-8">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center space-y-2"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Gamepad2 className="w-8 h-8 text-cyan-400" />
            <h1 className="text-4xl font-black">AI BATTLE LEADERBOARD</h1>
            <Gamepad2 className="w-8 h-8 text-cyan-400" />
          </div>
          <p className="text-zinc-400">Top players ranked by accuracy and points against AI opponents</p>
        </motion.div>

        {/* View Toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-3 justify-center"
        >
          <button
            onClick={() => setViewMode('global')}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${
              viewMode === 'global'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/50'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            <Trophy className="w-4 h-4 inline mr-2" />
            Global
          </button>
          <button
            onClick={() => setViewMode('friends')}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${
              viewMode === 'friends'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/50'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Friends
          </button>
        </motion.div>

        {isLoading ? (
          <div className="text-center text-zinc-400">Loading leaderboard...</div>
        ) : displayedData.length === 0 ? (
          <div className="text-center text-zinc-400">No battles completed yet</div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {displayedData.map((player, idx) => (
              <motion.div
                key={player.email}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card
                  className={`border-cyan-500/30 ${
                    currentUser?.email === player.email
                      ? 'bg-gradient-to-r from-cyan-900/50 to-blue-900/50'
                      : 'bg-zinc-900 hover:bg-zinc-800'
                  } transition-all`}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-600 font-bold text-lg">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-white text-lg">{player.name}</p>
                        <div className="flex gap-2 text-xs text-zinc-400 mt-1">
                          <span>Level {player.level}</span>
                          <span>•</span>
                          <span>{player.badges} badges</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-6 text-center">
                      <div>
                        <p className="text-2xl font-black text-cyan-400">{player.accuracy}%</p>
                        <p className="text-xs text-zinc-400">Accuracy</p>
                      </div>
                      <div>
                        <p className="text-2xl font-black text-purple-400">{player.points}</p>
                        <p className="text-xs text-zinc-400">Points</p>
                      </div>
                      <div>
                        <p className="text-2xl font-black text-orange-400">{player.streak}</p>
                        <p className="text-xs text-zinc-400">Best Streak</p>
                      </div>
                      <div>
                        <p className="text-2xl font-black text-green-400">{player.totalVotes}</p>
                        <p className="text-xs text-zinc-400">Total Votes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Stats Summary */}
        {displayedData.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-4 gap-4 mt-8"
          >
            <Card className="bg-zinc-900 border-cyan-500/30">
              <CardContent className="pt-6 text-center">
                <Target className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                <p className="text-2xl font-black text-white">{displayedData.length}</p>
                <p className="text-xs text-zinc-400">Total Players</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-cyan-500/30">
              <CardContent className="pt-6 text-center">
                <Trophy className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                <p className="text-2xl font-black text-white">{displayedData[0]?.accuracy || 0}%</p>
                <p className="text-xs text-zinc-400">Top Accuracy</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-cyan-500/30">
              <CardContent className="pt-6 text-center">
                <Gamepad2 className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                <p className="text-2xl font-black text-white">{displayedData[0]?.points || 0}</p>
                <p className="text-xs text-zinc-400">Leader Points</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-cyan-500/30">
              <CardContent className="pt-6 text-center">
                <Target className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-black text-white">{displayedData[0]?.totalVotes || 0}</p>
                <p className="text-xs text-zinc-400">Leader Votes</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}