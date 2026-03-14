import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gamepad2, Trophy, Flame, Target, Users, Star, Play, TrendingUp, Crown, Swords } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function ArcadeHub() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState([]);
  const [myStats, setMyStats] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [user, setUser] = useState(null);
  const [arcadeMaster, setArcadeMaster] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [gamesData, statsData, scoresData, challengesData, masterData] = await Promise.all([
        base44.entities.ArcadeGame.list(),
        base44.entities.ArcadeStats.filter({ user_email: currentUser.email }),
        base44.entities.ArcadeScore.list('-score', 100),
        base44.entities.ArcadeChallenge.filter({ 
          challenged_email: currentUser.email, 
          status: 'pending' 
        }),
        base44.entities.ArcadeMaster.filter({ user_email: currentUser.email })
      ]);

      // Filter active games on client side
      const activeGames = gamesData.filter(g => g.is_active !== false);
      
      setGames(activeGames);
      setMyStats(statsData);
      setChallenges(challengesData);
      setArcadeMaster(masterData.length > 0 ? masterData[0] : null);

      // Build leaderboard
      const userScores = {};
      scoresData.forEach(score => {
        if (!userScores[score.user_email]) {
          userScores[score.user_email] = {
            email: score.user_email,
            totalScore: 0,
            gamesPlayed: 0,
            tokensEarned: 0
          };
        }
        userScores[score.user_email].totalScore += score.score;
        userScores[score.user_email].gamesPlayed++;
        userScores[score.user_email].tokensEarned += score.tokens_earned || 0;
      });

      const leaderboardData = Object.values(userScores)
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, 20);

      setLeaderboard(leaderboardData);

    } catch (error) {
      console.error('[Arcade] Load error:', error);
      toast.error('Failed to load arcade');
    }
    setLoading(false);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      reaction: '⚡',
      timing: '⏱️',
      memory: '🧠',
      runner: '🏃',
      puzzle: '🧩',
      arcade: '🎮'
    };
    return icons[category] || '🎮';
  };

  const getGameStats = (gameId) => {
    return myStats.find(s => s.game_id === gameId) || {};
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center pb-32">
        <div className="animate-spin w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 p-4 pb-32">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Gamepad2 className="w-10 h-10 text-purple-400" />
            <h1 className="text-4xl font-black text-white">Retro Arcade</h1>
          </div>
          <p className="text-green-500/80">Play games, earn tokens, compete with friends</p>
        </div>

        {/* Arcade Master Card */}
        {arcadeMaster?.unlocked && (
          <Card className="bg-gradient-to-br from-yellow-900/30 to-orange-900/20 border-yellow-500/50 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Crown className="w-12 h-12 text-yellow-400" />
                <div>
                  <div className="text-2xl font-black text-white mb-1">
                    👑 Arcade Master
                  </div>
                  <div className="text-sm text-yellow-300 mb-2">
                    The ultimate challenge awaits
                  </div>
                  <div className="flex gap-4 text-xs text-green-500/80">
                    <span>Record: {arcadeMaster.wins}W - {arcadeMaster.losses}L</span>
                    {arcadeMaster.best_victory_score && (
                      <span>Best Victory: {arcadeMaster.best_victory_score}</span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                onClick={() => navigate('/ArcadeGame/reaction-test?arcadeMaster=true')}
                className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 cursor-pointer"
              >
                <Swords className="w-5 h-5 mr-2" />
                Challenge
              </Button>
            </div>
          </Card>
        )}

        {/* Pending Challenges */}
        {challenges.length > 0 && (
          <Card className="bg-gradient-to-br from-orange-900/30 to-red-900/20 border-orange-500/50 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="w-6 h-6 text-orange-400" />
                <div>
                  <div className="font-bold text-white">
                    {challenges.length} Challenge{challenges.length > 1 ? 's' : ''} Waiting
                  </div>
                  <div className="text-sm text-orange-300">Beat your friends' scores!</div>
                </div>
              </div>
              <Button
                onClick={() => navigate('/ArcadeChallenges')}
                className="bg-orange-600 hover:bg-orange-700 cursor-pointer"
              >
                View
              </Button>
            </div>
          </Card>
        )}

        <Tabs defaultValue="games" className="space-y-6">
          <TabsList className="bg-black/60 border border-purple-500/30">
            <TabsTrigger value="games">
              <Gamepad2 className="w-4 h-4 mr-2" />
              Games
            </TabsTrigger>
            <TabsTrigger value="leaderboard">
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="stats">
              <TrendingUp className="w-4 h-4 mr-2" />
              My Stats
            </TabsTrigger>
          </TabsList>

          {/* Games Grid */}
          <TabsContent value="games">
            {games.length === 0 ? (
              <Card className="bg-black/60 border-purple-500/30 p-12 text-center">
                <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-purple-400/30" />
                <p className="text-green-500/60 mb-4">No games available yet</p>
                <Button
                  onClick={async () => {
                    try {
                      await base44.functions.invoke('seedArcadeGames', {});
                      toast.success('Games seeded! Refreshing...');
                      await loadData();
                    } catch (error) {
                      toast.error('Failed to seed games');
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700 cursor-pointer"
                >
                  Initialize Arcade Games
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {games.map(game => {
                  const stats = getGameStats(game.game_id);
                  return (
                    <Card
                      key={game.id}
                      className="bg-black/60 border-purple-500/30 hover:border-purple-500/60 transition-all cursor-pointer overflow-hidden group"
                      onClick={() => {
                        if (game.game_id) {
                          navigate(`/ArcadeGame/${game.game_id}`);
                        }
                      }}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="text-5xl">{game.icon || getCategoryIcon(game.category)}</div>
                          <Badge className="bg-purple-600">{game.category}</Badge>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2">{game.name}</h3>
                        <p className="text-sm text-green-500/60 mb-4">{game.description}</p>

                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <div className="bg-black/40 rounded p-2 text-center">
                            <Play className="w-4 h-4 mx-auto mb-1 text-green-400" />
                            <div className="text-xs font-bold text-white">{stats.games_played || 0}</div>
                            <div className="text-xs text-green-500/60">Played</div>
                          </div>
                          <div className="bg-black/40 rounded p-2 text-center">
                            <Trophy className="w-4 h-4 mx-auto mb-1 text-yellow-400" />
                            <div className="text-xs font-bold text-white">{stats.best_score || 0}</div>
                            <div className="text-xs text-green-500/60">Best</div>
                          </div>
                          <div className="bg-black/40 rounded p-2 text-center">
                            <Flame className="w-4 h-4 mx-auto mb-1 text-orange-400" />
                            <div className="text-xs font-bold text-white">{stats.current_streak || 0}</div>
                            <div className="text-xs text-green-500/60">Streak</div>
                          </div>
                        </div>

                        <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 group-hover:scale-105 transition-transform cursor-pointer">
                          <Play className="w-4 h-4 mr-2" />
                          Play Now
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Leaderboard */}
          <TabsContent value="leaderboard">
            <Card className="bg-black/60 border-purple-500/30 p-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
                Global Leaderboard
              </h2>

              {leaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 mx-auto mb-4 text-purple-400/30" />
                  <p className="text-green-500/60">No scores yet. Be the first!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={entry.email}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        entry.email === user?.email
                          ? 'bg-purple-900/30 border-2 border-purple-500/50'
                          : 'bg-black/40'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`text-2xl font-black ${
                          index === 0 ? 'text-yellow-400' :
                          index === 1 ? 'text-gray-300' :
                          index === 2 ? 'text-orange-400' :
                          'text-green-500/60'
                        }`}>
                          #{index + 1}
                        </div>
                        <div>
                          <div className="font-bold text-white">
                            {entry.email.split('@')[0]}
                            {entry.email === user?.email && (
                              <Badge className="ml-2 bg-purple-600">You</Badge>
                            )}
                          </div>
                          <div className="text-xs text-green-500/60">
                            {entry.gamesPlayed} games • {entry.tokensEarned} tokens
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-yellow-400">
                          {entry.totalScore.toLocaleString()}
                        </div>
                        <div className="text-xs text-green-500/60">Total Score</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* My Stats */}
          <TabsContent value="stats">
            <div className="grid gap-6">
              {myStats.length === 0 ? (
                <Card className="bg-black/60 border-purple-500/30 p-12 text-center">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 text-purple-400/30" />
                  <p className="text-green-500/60">Play some games to see your stats!</p>
                </Card>
              ) : (
                myStats.map(stat => {
                  const game = games.find(g => g.game_id === stat.game_id);
                  if (!game) return null;

                  return (
                    <Card key={stat.id} className="bg-black/60 border-purple-500/30 p-6">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="text-4xl">{game.icon || getCategoryIcon(game.category)}</div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{game.name}</h3>
                          <p className="text-sm text-green-500/60">{stat.games_played} games played</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-black/40 rounded p-4 text-center">
                          <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                          <div className="text-2xl font-bold text-white">{stat.best_score}</div>
                          <div className="text-xs text-green-500/60">Best Score</div>
                        </div>

                        <div className="bg-black/40 rounded p-4 text-center">
                          <Star className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                          <div className="text-2xl font-bold text-white">{stat.total_tokens_earned}</div>
                          <div className="text-xs text-green-500/60">Tokens Earned</div>
                        </div>

                        <div className="bg-black/40 rounded p-4 text-center">
                          <Flame className="w-6 h-6 mx-auto mb-2 text-orange-400" />
                          <div className="text-2xl font-bold text-white">{stat.best_streak}</div>
                          <div className="text-xs text-green-500/60">Best Streak</div>
                        </div>

                        <div className="bg-black/40 rounded p-4 text-center">
                          <Target className="w-6 h-6 mx-auto mb-2 text-green-400" />
                          <div className="text-2xl font-bold text-white">#{stat.leaderboard_rank || '-'}</div>
                          <div className="text-xs text-green-500/60">Rank</div>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}