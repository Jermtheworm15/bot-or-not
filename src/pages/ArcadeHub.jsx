import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gamepad2, Trophy, Flame, Target, Star, Play, TrendingUp, Crown, Swords, Search, Settings, Lock } from 'lucide-react';
import ArcadeChat from '@/components/arcade/ArcadeChat';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import EmptyArcadeState from '@/components/arcade/EmptyArcadeState';

const CATEGORY_TABS = [
  { id: 'all', label: 'All', emoji: '🎮' },
  { id: 'puzzle', label: 'Puzzle', emoji: '🧩' },
  { id: 'runner', label: 'Runner', emoji: '🏃' },
  { id: 'shooter', label: 'Shooter', emoji: '👾' },
  { id: 'racing', label: 'Racing', emoji: '🏎️' },
  { id: 'ai', label: 'AI Games', emoji: '🤖' },
];

const AI_GAME_IDS = ['spot-the-bot-blitz', 'deepfake-or-nah', 'ai-artist-challenge'];

const difficultyColor = { easy: 'bg-green-600', medium: 'bg-yellow-600', hard: 'bg-red-600' };

export default function ArcadeHub() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState([]);
  const [myStats, setMyStats] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [user, setUser] = useState(null);
  const [arcadeMaster, setArcadeMaster] = useState(null);
  const [categoryTab, setCategoryTab] = useState('all');
  const [gameOfDay, setGameOfDay] = useState(null);
  const [mostPopular, setMostPopular] = useState([]);
  const [globalScores, setGlobalScores] = useState([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [gamesData, statsData, scoresData, challengesData, masterData] = await Promise.all([
        base44.entities.ArcadeGame.list(),
        base44.entities.ArcadeStats.filter({ user_email: currentUser.email }),
        base44.entities.ArcadeScore.list('-score', 200),
        base44.entities.ArcadeChallenge.filter({ challenged_email: currentUser.email, status: 'pending' }),
        base44.entities.ArcadeMaster.filter({ user_email: currentUser.email })
      ]);

      const activeGames = gamesData.filter(g => g.is_active !== false);
      setGames(activeGames);
      setMyStats(statsData);
      setChallenges(challengesData);
      setArcadeMaster(masterData[0] || null);

      // Game of the Day — deterministic by date
      if (activeGames.length > 0) {
        const dayIndex = new Date().getDate() % activeGames.length;
        setGameOfDay(activeGames[dayIndex]);
      }

      // Most Popular — by total_plays
      const popular = [...activeGames].sort((a, b) => (b.total_plays || 0) - (a.total_plays || 0)).slice(0, 8);
      setMostPopular(popular);

      // Leaderboard
      const userScores = {};
      scoresData.forEach(s => {
        if (!userScores[s.user_email]) userScores[s.user_email] = { email: s.user_email, totalScore: 0, gamesPlayed: 0, tokensEarned: 0 };
        userScores[s.user_email].totalScore += s.score;
        userScores[s.user_email].gamesPlayed++;
        userScores[s.user_email].tokensEarned += s.tokens_earned || 0;
      });
      setLeaderboard(Object.values(userScores).sort((a, b) => b.totalScore - a.totalScore).slice(0, 20));
      setGlobalScores(scoresData.slice(0, 100));

    } catch (error) {
      console.error('[Arcade] Load error:', error);
      toast.error('Failed to load arcade');
    }
    setLoading(false);
  };

  const getMyStats = (gameId) => myStats.find(s => s.game_id === gameId) || {};

  const getGlobalBest = (gameId) => {
    const scores = globalScores.filter(s => s.game_id === gameId);
    if (!scores.length) return 0;
    return Math.max(...scores.map(s => s.score));
  };

  const filteredGames = games.filter(g => {
    if (categoryTab === 'all') return true;
    if (categoryTab === 'ai') return AI_GAME_IDS.includes(g.game_id);
    return g.category === categoryTab;
  });

  // Locked state: AI games require 3 games played total
  const totalGamesPlayed = myStats.reduce((sum, s) => sum + (s.games_played || 0), 0);
  const isGameLocked = (game) => {
    if (!AI_GAME_IDS.includes(game.game_id)) return false;
    return totalGamesPlayed < 3;
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

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Gamepad2 className="w-9 h-9 text-purple-400" />
            <h1 className="text-3xl font-black text-white">Retro Arcade</h1>
          </div>
          <div className="flex gap-2">
            {user?.role === 'admin' && (
              <Button onClick={() => navigate('/ArcadeAdmin')} variant="outline" className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-900/30">
                <Settings className="w-4 h-4" />
              </Button>
            )}
            <Button onClick={() => navigate('/ProfileSearch')} variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-900/30">
              <Search className="w-4 h-4 mr-1" /> Players
            </Button>
          </div>
        </div>

        {/* Arcade Master Banner */}
        {arcadeMaster?.unlocked && (
          <Card className="bg-gradient-to-br from-yellow-900/30 to-orange-900/20 border-yellow-500/50 p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="w-10 h-10 text-yellow-400" />
                <div>
                  <div className="font-black text-white text-lg">👑 Arcade Master</div>
                  <div className="text-xs text-yellow-300">{arcadeMaster.wins}W — {arcadeMaster.losses}L</div>
                </div>
              </div>
              <Button onClick={() => navigate('/ArcadeGame/reaction-test?arcadeMaster=true')} className="bg-gradient-to-r from-yellow-600 to-orange-600">
                <Swords className="w-4 h-4 mr-2" /> Challenge
              </Button>
            </div>
          </Card>
        )}

        {/* Pending Challenges */}
        {challenges.length > 0 && (
          <Card className="bg-gradient-to-br from-orange-900/30 to-red-900/20 border-orange-500/50 p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="w-6 h-6 text-orange-400" />
                <div>
                  <div className="font-bold text-white">{challenges.length} Challenge{challenges.length > 1 ? 's' : ''} Waiting</div>
                  <div className="text-xs text-orange-300">Beat your friends' scores!</div>
                </div>
              </div>
              <Button onClick={() => navigate('/ArcadeChallenges')} className="bg-orange-600 hover:bg-orange-700">View</Button>
            </div>
          </Card>
        )}

        {/* === GAME OF THE DAY HERO BANNER === */}
        {gameOfDay && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-lg font-bold text-yellow-400">Game of the Day</span>
            </div>
            <Card
              className="relative overflow-hidden border-yellow-500/50 bg-gradient-to-br from-yellow-900/20 to-purple-900/20 cursor-pointer hover:border-yellow-400 transition-all"
              onClick={() => navigate(`/ArcadeGame/${gameOfDay.game_id}`)}
            >
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/10 via-purple-600/10 to-pink-600/10" />
              <div className="relative p-6 flex items-center gap-6">
                <div className="text-7xl flex-shrink-0">{gameOfDay.icon || '🎮'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-black text-white">{gameOfDay.name}</h2>
                    <Badge className={`${difficultyColor[gameOfDay.difficulty] || 'bg-purple-600'} text-xs`}>{gameOfDay.difficulty}</Badge>
                  </div>
                  <p className="text-green-400/80 text-sm mb-3 line-clamp-2">{gameOfDay.description}</p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-yellow-400">🏆 Global Best: {getGlobalBest(gameOfDay.game_id) || gameOfDay.high_score || 0}</span>
                    <span className="text-purple-400">⭐ My Best: {getMyStats(gameOfDay.game_id).best_score || 0}</span>
                    <span className="text-green-400">🪙 +{gameOfDay.reward_config?.base_tokens || 10} tokens</span>
                  </div>
                </div>
                <Button className="flex-shrink-0 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-bold px-6">
                  <Play className="w-5 h-5 mr-2" /> Play
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* === MOST POPULAR ROW === */}
        {mostPopular.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="text-lg font-bold text-orange-400">Most Popular</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {mostPopular.map(game => {
                const myBest = getMyStats(game.game_id).best_score || 0;
                const globalBest = getGlobalBest(game.game_id) || game.high_score || 0;
                return (
                  <Card
                    key={game.id}
                    className="flex-shrink-0 w-36 bg-black/60 border-orange-500/20 hover:border-orange-500/60 transition-all cursor-pointer"
                    onClick={() => navigate(`/ArcadeGame/${game.game_id}`)}
                  >
                    <div className="p-3 text-center">
                      <div className="text-3xl mb-1">{game.icon || '🎮'}</div>
                      <h3 className="font-bold text-white text-xs mb-1 line-clamp-2">{game.name}</h3>
                      <div className="text-xs text-orange-400 mb-1">🔥 {game.total_plays || 0} plays</div>
                      {myBest > 0 && <div className="text-xs text-yellow-400">⭐ {myBest}</div>}
                      {globalBest > 0 && <div className="text-xs text-purple-400">🏆 {globalBest}</div>}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        <Tabs defaultValue="games" className="space-y-4">
          <TabsList className="bg-black/60 border border-purple-500/30">
            <TabsTrigger value="games"><Gamepad2 className="w-4 h-4 mr-1" /> All Games</TabsTrigger>
            <TabsTrigger value="leaderboard"><Trophy className="w-4 h-4 mr-1" /> Leaderboard</TabsTrigger>
            <TabsTrigger value="stats"><TrendingUp className="w-4 h-4 mr-1" /> My Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="games">
            {games.length === 0 ? (
              <EmptyArcadeState onSeeded={loadData} />
            ) : (
              <>
                {/* Category Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                  {CATEGORY_TABS.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setCategoryTab(cat.id)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                        categoryTab === cat.id
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-black/60 border-purple-500/30 text-green-400 hover:border-purple-500/60'
                      }`}
                    >
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${categoryTab === cat.id ? 'bg-purple-500/50' : 'bg-zinc-800'}`}>
                        {cat.id === 'all' ? games.length :
                         cat.id === 'ai' ? games.filter(g => AI_GAME_IDS.includes(g.game_id)).length :
                         games.filter(g => g.category === cat.id).length}
                      </span>
                    </button>
                  ))}
                </div>

                {filteredGames.length === 0 ? (
                  <Card className="bg-black/60 border-purple-500/30 p-10 text-center">
                    <p className="text-green-500/60">No games in this category yet.</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredGames.map(game => {
                      const myS = getMyStats(game.game_id);
                      const globalBest = getGlobalBest(game.game_id) || game.high_score || 0;
                      const locked = isGameLocked(game);
                      const isAI = AI_GAME_IDS.includes(game.game_id);
                      return (
                        <Card
                          key={game.id}
                          className={`relative bg-black/60 transition-all overflow-hidden group ${
                            locked
                              ? 'border-zinc-700 opacity-70 cursor-not-allowed'
                              : 'border-purple-500/30 hover:border-purple-500/60 cursor-pointer'
                          } ${isAI ? 'border-purple-500/50' : ''}`}
                          onClick={() => {
                            if (locked) { toast.error('Play 3 games to unlock AI Games!'); return; }
                            navigate(`/ArcadeGame/${game.game_id}`);
                          }}
                        >
                          {isAI && !locked && (
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />
                          )}
                          <div className="p-5">
                            <div className="flex items-start justify-between mb-3">
                              <div className="text-4xl">{game.icon || '🎮'}</div>
                              <div className="flex flex-col items-end gap-1">
                                <Badge className={`${difficultyColor[game.difficulty] || 'bg-purple-600'} text-xs`}>
                                  {game.difficulty}
                                </Badge>
                                {isAI && <Badge className="bg-purple-900 border border-purple-500/50 text-purple-300 text-xs">AI</Badge>}
                              </div>
                            </div>

                            <h3 className="text-lg font-bold text-white mb-1">{game.name}</h3>
                            <p className="text-xs text-green-500/60 mb-3 line-clamp-2">{game.description}</p>

                            {/* High score + personal best */}
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              <div className="bg-black/40 rounded-lg p-2 text-center">
                                <div className="text-xs text-purple-400 mb-0.5">🏆 Global</div>
                                <div className="text-sm font-bold text-white">{globalBest.toLocaleString()}</div>
                              </div>
                              <div className="bg-black/40 rounded-lg p-2 text-center">
                                <div className="text-xs text-yellow-400 mb-0.5">⭐ My Best</div>
                                <div className="text-sm font-bold text-white">{(myS.best_score || 0).toLocaleString()}</div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-green-500/60 mb-3">
                              <span>🎮 {myS.games_played || 0} played</span>
                              <span>🪙 +{game.reward_config?.base_tokens || 10}</span>
                            </div>

                            {locked ? (
                              <div className="w-full h-10 flex items-center justify-center gap-2 rounded-lg bg-zinc-800 text-zinc-500 text-sm font-bold">
                                <Lock className="w-4 h-4" /> Play 3 games to unlock
                              </div>
                            ) : (
                              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 group-hover:scale-105 transition-transform">
                                <Play className="w-4 h-4 mr-2" /> Play Now
                              </Button>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="leaderboard">
            <Card className="bg-black/60 border-purple-500/30 p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" /> Global Leaderboard
              </h2>
              {leaderboard.length === 0 ? (
                <p className="text-center text-green-500/60 py-8">No scores yet. Be the first!</p>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry, index) => (
                    <div key={entry.email} className={`flex items-center justify-between p-3 rounded-lg ${entry.email === user?.email ? 'bg-purple-900/30 border border-purple-500/50' : 'bg-black/40'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`text-xl font-black w-8 ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-orange-400' : 'text-green-500/60'}`}>
                          #{index + 1}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{entry.email.split('@')[0]} {entry.email === user?.email && <Badge className="ml-1 bg-purple-600 text-xs">You</Badge>}</div>
                          <div className="text-xs text-green-500/60">{entry.gamesPlayed} games • {entry.tokensEarned} tokens</div>
                        </div>
                      </div>
                      <div className="text-xl font-bold text-yellow-400">{entry.totalScore.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid gap-4">
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
                    <Card key={stat.id} className="bg-black/60 border-purple-500/30 p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="text-3xl">{game.icon || '🎮'}</div>
                        <div>
                          <h3 className="font-bold text-white">{game.name}</h3>
                          <p className="text-xs text-green-500/60">{stat.games_played} games played</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        <div className="bg-black/40 rounded p-3 text-center">
                          <Trophy className="w-5 h-5 mx-auto mb-1 text-yellow-400" />
                          <div className="text-lg font-bold text-white">{stat.best_score}</div>
                          <div className="text-xs text-green-500/60">Best</div>
                        </div>
                        <div className="bg-black/40 rounded p-3 text-center">
                          <Star className="w-5 h-5 mx-auto mb-1 text-purple-400" />
                          <div className="text-lg font-bold text-white">{stat.total_tokens_earned}</div>
                          <div className="text-xs text-green-500/60">Tokens</div>
                        </div>
                        <div className="bg-black/40 rounded p-3 text-center">
                          <Flame className="w-5 h-5 mx-auto mb-1 text-orange-400" />
                          <div className="text-lg font-bold text-white">{stat.best_streak}</div>
                          <div className="text-xs text-green-500/60">Streak</div>
                        </div>
                        <div className="bg-black/40 rounded p-3 text-center">
                          <Target className="w-5 h-5 mx-auto mb-1 text-green-400" />
                          <div className="text-lg font-bold text-white">#{stat.leaderboard_rank || '-'}</div>
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

      <ArcadeChat />
    </div>
  );
}