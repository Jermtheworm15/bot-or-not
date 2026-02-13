import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Users, Target, Zap, Share2 } from 'lucide-react';
import ShareButton from '@/components/social/ShareButton';

export default function Analytics() {
  const [userStats, setUserStats] = useState(null);
  const [leaderboardPosition, setLeaderboardPosition] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      
      // Load user profile and votes
      const [profiles, userVotes, allProfiles, allVotes] = await Promise.all([
        base44.entities.UserProfile.filter({ user_email: user.email }),
        base44.entities.Vote.filter({ user_email: user.email }),
        base44.entities.UserProfile.list(),
        base44.entities.Vote.list()
      ]);

      const profile = profiles[0];
      
      // Calculate user stats
      const accuracy = userVotes.length > 0 
        ? (userVotes.filter(v => v.was_correct).length / userVotes.length * 100).toFixed(1)
        : 0;

      setUserStats({
        totalVotes: userVotes.length,
        correctVotes: userVotes.filter(v => v.was_correct).length,
        accuracy,
        points: profile?.points || 0,
        streak: profile?.perfect_streak || 0,
        level: profile?.level || 1
      });

      // Calculate user's rank
      const userRankings = allProfiles
        .map(p => ({ email: p.user_email, points: p.points || 0 }))
        .sort((a, b) => b.points - a.points);
      
      const rank = userRankings.findIndex(p => p.email === user.email) + 1;
      setLeaderboardPosition(rank);

      // Comparison data with top 5 users
      const topUsers = userRankings.slice(0, 5);
      const comparisonStats = topUsers.map(topUser => {
        const userVotesData = allVotes.filter(v => {
          const creator = v.created_by;
          return creator === topUser.email;
        });
        const userCorrect = userVotesData.filter(v => v.was_correct).length;
        return {
          email: topUser.email.split('@')[0],
          votes: userVotesData.length,
          accuracy: userVotesData.length > 0 ? (userCorrect / userVotesData.length * 100).toFixed(1) : 0,
          points: topUser.points
        };
      });

      setComparisonData(comparisonStats);
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
    setIsLoading(false);
  };

  if (isLoading || !userStats) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white py-12">
        <div className="flex items-center justify-center h-screen">
          <div className="text-zinc-400">Loading analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-12">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />
      
      <div className="relative z-10 max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl font-black">Advanced Analytics</h1>
            <ShareButton 
              userStats={userStats}
              analyticsMode={true}
            />
          </div>
          <p className="text-zinc-400">Your detailed performance and player comparisons</p>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Target, label: 'Total Votes', value: userStats.totalVotes, color: 'blue' },
            { icon: TrendingUp, label: 'Accuracy', value: `${userStats.accuracy}%`, color: 'emerald' },
            { icon: Zap, label: 'Streak', value: userStats.streak, color: 'amber' },
            { icon: Users, label: 'Global Rank', value: `#${leaderboardPosition}`, color: 'purple' }
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-zinc-400">{stat.label}</p>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                      </div>
                      <Icon className={`w-8 h-8 text-${stat.color}-400`} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <Tabs defaultValue="comparison" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="comparison">Player Comparison</TabsTrigger>
            <TabsTrigger value="breakdown">Your Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="comparison" className="mt-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle>How You Compare to Top Players</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="email" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #444' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="points" fill="#a855f7" name="Points" />
                    <Bar dataKey="votes" fill="#06b6d4" name="Votes" />
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-8">
                  <h3 className="text-lg font-bold mb-4">Accuracy Comparison</h3>
                  <div className="space-y-3">
                    {comparisonData.map((player, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                        <span className="font-medium text-sm">{player.email}</span>
                        <div className="flex items-center gap-4">
                          <div className="w-32 bg-zinc-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-violet-500 to-purple-500 h-2 rounded-full" 
                              style={{ width: `${player.accuracy}%` }}
                            />
                          </div>
                          <span className="text-amber-400 font-bold w-12">{player.accuracy}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="breakdown" className="mt-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle>Your Performance Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-bold mb-4">Correct vs Incorrect</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Correct', value: userStats.correctVotes },
                            { name: 'Incorrect', value: userStats.totalVotes - userStats.correctVotes }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="#ef4444" />
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #444' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex flex-col justify-center">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-zinc-400 mb-2">Total Votes</p>
                        <p className="text-3xl font-bold text-white">{userStats.totalVotes}</p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-400 mb-2">Correct Votes</p>
                        <p className="text-3xl font-bold text-emerald-400">{userStats.correctVotes}</p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-400 mb-2">Points Earned</p>
                        <p className="text-3xl font-bold text-violet-400">{userStats.points}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}