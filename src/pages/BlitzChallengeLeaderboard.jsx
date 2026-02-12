import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Zap, Target, Users } from 'lucide-react';

export default function BlitzChallengeLeaderboard() {
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

      // Fetch all challenges
      const allChallenges = await base44.entities.UserChallenge.filter({ status: 'completed' });

      // Calculate stats for each player
      const playerStats = {};
      allChallenges.forEach(challenge => {
        // Challenger stats
        if (challenge.challenger_email) {
          if (!playerStats[challenge.challenger_email]) {
            playerStats[challenge.challenger_email] = {
              email: challenge.challenger_email,
              name: challenge.challenger_name,
              wins: 0,
              losses: 0,
              totalScore: 0,
              challengesCount: 0
            };
          }
          playerStats[challenge.challenger_email].totalScore += challenge.challenger_score || 0;
          playerStats[challenge.challenger_email].challengesCount += 1;
          if (challenge.winner_email === challenge.challenger_email) {
            playerStats[challenge.challenger_email].wins += 1;
          } else {
            playerStats[challenge.challenger_email].losses += 1;
          }
        }

        // Opponent stats
        if (challenge.opponent_email) {
          if (!playerStats[challenge.opponent_email]) {
            playerStats[challenge.opponent_email] = {
              email: challenge.opponent_email,
              name: challenge.opponent_name,
              wins: 0,
              losses: 0,
              totalScore: 0,
              challengesCount: 0
            };
          }
          playerStats[challenge.opponent_email].totalScore += challenge.opponent_score || 0;
          playerStats[challenge.opponent_email].challengesCount += 1;
          if (challenge.winner_email === challenge.opponent_email) {
            playerStats[challenge.opponent_email].wins += 1;
          } else {
            playerStats[challenge.opponent_email].losses += 1;
          }
        }
      });

      // Calculate averages and win rate
      const statsArray = Object.values(playerStats).map(stat => ({
        ...stat,
        avgScore: stat.challengesCount > 0 ? (stat.totalScore / stat.challengesCount).toFixed(1) : 0,
        winRate: stat.challengesCount > 0 ? ((stat.wins / stat.challengesCount) * 100).toFixed(1) : 0
      }));

      // Sort by win rate and average score
      const sorted = statsArray.sort((a, b) => {
        if (parseFloat(b.winRate) !== parseFloat(a.winRate)) {
          return parseFloat(b.winRate) - parseFloat(a.winRate);
        }
        return parseFloat(b.avgScore) - parseFloat(a.avgScore);
      });

      setLeaderboard(sorted);

      // Get user's friends for friend-based leaderboard
      if (user) {
        const friends = await base44.entities.Friend.filter({
          user_email: user.email,
          status: 'accepted'
        });
        const friendEmails = friends.map(f => f.friend_email);
        const friendStats = sorted.filter(s => friendEmails.includes(s.email) || s.email === user.email);
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
            <Zap className="w-8 h-8 text-yellow-400" />
            <h1 className="text-4xl font-black">BLITZ CHALLENGE LEADERBOARD</h1>
            <Zap className="w-8 h-8 text-yellow-400" />
          </div>
          <p className="text-zinc-400">Top players ranked by win rate and average score</p>
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
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
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
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
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
          <div className="text-center text-zinc-400">No challenges completed yet</div>
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
                  className={`border-purple-500/30 ${
                    currentUser?.email === player.email
                      ? 'bg-gradient-to-r from-purple-900/50 to-green-900/50'
                      : 'bg-zinc-900 hover:bg-zinc-800'
                  } transition-all`}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 font-bold text-lg">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-white text-lg">{player.name || player.email}</p>
                        <p className="text-xs text-zinc-400">{player.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 text-center">
                      <div>
                        <p className="text-2xl font-black text-green-400">{player.winRate}%</p>
                        <p className="text-xs text-zinc-400">Win Rate</p>
                      </div>
                      <div>
                        <p className="text-2xl font-black text-yellow-400">{player.avgScore}</p>
                        <p className="text-xs text-zinc-400">Avg Score</p>
                      </div>
                      <div>
                        <p className="text-2xl font-black text-purple-400">
                          {player.wins}-{player.losses}
                        </p>
                        <p className="text-xs text-zinc-400">Record</p>
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
            <Card className="bg-zinc-900 border-purple-500/30">
              <CardContent className="pt-6 text-center">
                <Target className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-black text-white">{displayedData.length}</p>
                <p className="text-xs text-zinc-400">Total Players</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-purple-500/30">
              <CardContent className="pt-6 text-center">
                <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                <p className="text-2xl font-black text-white">
                  {displayedData[0]?.challengesCount || 0}
                </p>
                <p className="text-xs text-zinc-400">Top Player Matches</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-purple-500/30">
              <CardContent className="pt-6 text-center">
                <Trophy className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                <p className="text-2xl font-black text-white">
                  {displayedData[0]?.wins || 0}
                </p>
                <p className="text-xs text-zinc-400">Leader Wins</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-purple-500/30">
              <CardContent className="pt-6 text-center">
                <Target className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-black text-white">
                  {displayedData[0]?.avgScore || 0}
                </p>
                <p className="text-xs text-zinc-400">Leader Avg Score</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}