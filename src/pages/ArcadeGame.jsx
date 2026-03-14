import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Trophy, Coins, Users, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import ReactionGame from '@/components/arcade/ReactionGame';
import MemoryGame from '@/components/arcade/MemoryGame';
import RunnerGame from '@/components/arcade/RunnerGame';

export default function ArcadeGame() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState(null);
  const [gameState, setGameState] = useState('menu'); // menu, playing, result
  const [score, setScore] = useState(0);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [rewardData, setRewardData] = useState(null);

  useEffect(() => {
    loadGame();
  }, [gameId]);

  const loadGame = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const games = await base44.entities.ArcadeGame.filter({ game_id: gameId });
      if (games.length === 0) {
        toast.error('Game not found');
        navigate('/ArcadeHub');
        return;
      }

      setGame(games[0]);

      const userStats = await base44.entities.ArcadeStats.filter({
        user_email: currentUser.email,
        game_id: gameId
      });

      setStats(userStats[0] || null);

    } catch (error) {
      console.error('[Arcade] Load error:', error);
      toast.error('Failed to load game');
    }
    setLoading(false);
  };

  const handleGameComplete = async (finalScore, metadata = {}) => {
    setScore(finalScore);
    setGameState('result');

    try {
      // Check daily limit
      const today = new Date().toISOString().split('T')[0];
      const playsToday = stats?.last_played_date === today ? (stats.plays_today || 0) : 0;
      const dailyLimit = game.reward_config?.daily_limit || 10;

      let tokensEarned = 0;
      if (playsToday < dailyLimit) {
        // Calculate rewards
        const baseTokens = game.reward_config?.base_tokens || 10;
        const scoreMultiplier = game.reward_config?.score_multiplier || 0.1;
        const streakBonus = game.reward_config?.streak_bonus || 5;
        
        tokensEarned = Math.round(
          baseTokens + 
          (finalScore * scoreMultiplier) + 
          ((stats?.current_streak || 0) * streakBonus)
        );

        // Grant tokens
        await base44.functions.invoke('grantReward', {
          transaction_type: 'reward_engagement',
          amount: tokensEarned,
          metadata: {
            source: 'arcade',
            game_id: gameId,
            score: finalScore
          }
        });
      }

      // Save score
      const isPersonalBest = !stats || finalScore > (stats.best_score || 0);
      const isGlobalBest = finalScore > (game.high_score || 0);

      await base44.entities.ArcadeScore.create({
        user_email: user.email,
        game_id: gameId,
        score: finalScore,
        duration: metadata.duration || 0,
        tokens_earned: tokensEarned,
        is_personal_best: isPersonalBest,
        is_global_best: isGlobalBest,
        metadata
      });

      // Update stats
      const newStreak = stats?.last_played_date === today 
        ? (stats.current_streak || 0) + 1 
        : 1;

      if (stats) {
        await base44.entities.ArcadeStats.update(stats.id, {
          games_played: (stats.games_played || 0) + 1,
          best_score: Math.max(stats.best_score || 0, finalScore),
          total_tokens_earned: (stats.total_tokens_earned || 0) + tokensEarned,
          current_streak: newStreak,
          best_streak: Math.max(stats.best_streak || 0, newStreak),
          last_played_date: today,
          plays_today: playsToday + 1
        });
      } else {
        await base44.entities.ArcadeStats.create({
          user_email: user.email,
          game_id: gameId,
          games_played: 1,
          best_score: finalScore,
          total_tokens_earned: tokensEarned,
          current_streak: 1,
          best_streak: 1,
          last_played_date: today,
          plays_today: 1
        });
      }

      // Update game stats
      if (isGlobalBest) {
        await base44.entities.ArcadeGame.update(game.id, {
          high_score: finalScore,
          total_plays: (game.total_plays || 0) + 1
        });
      } else {
        await base44.entities.ArcadeGame.update(game.id, {
          total_plays: (game.total_plays || 0) + 1
        });
      }

      // Create social feed entry for high scores
      if (isPersonalBest && finalScore >= 1000) {
        await base44.entities.SocialFeed.create({
          user_email: user.email,
          activity_type: 'achievement',
          title: `New High Score in ${game.name}!`,
          description: `Scored ${finalScore} points`,
          metadata: { game_id: gameId, score: finalScore }
        });
      }

      setRewardData({
        tokensEarned,
        isPersonalBest,
        isGlobalBest,
        hitLimit: playsToday >= dailyLimit
      });

      await loadGame();

    } catch (error) {
      console.error('[Arcade] Save error:', error);
      toast.error('Failed to save score');
    }
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setRewardData(null);
  };

  const GameComponent = {
    'reaction-test': ReactionGame,
    'memory-match': MemoryGame,
    'pixel-runner': RunnerGame
  }[gameId] || null;

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!game || !GameComponent) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center">
        <Card className="bg-black/60 border-purple-500/30 p-12 text-center">
          <p className="text-xl mb-4">Game not available</p>
          <Button onClick={() => navigate('/ArcadeHub')}>
            Back to Arcade
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="p-4 flex items-center justify-between bg-black/60 backdrop-blur-md border-b border-purple-500/30">
          <Button
            variant="ghost"
            onClick={() => navigate('/ArcadeHub')}
            className="text-green-400 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Arcade
          </Button>
          
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">{game.name}</h1>
            {stats && (
              <div className="text-xs text-green-500/60">
                Best: {stats.best_score} • Streak: {stats.current_streak}
              </div>
            )}
          </div>

          <div className="w-20" />
        </div>

        {/* Game Area */}
        <div className="flex-1 flex items-center justify-center p-4">
          {gameState === 'menu' && (
            <Card className="bg-black/80 border-purple-500/30 p-8 max-w-2xl w-full">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">{game.icon}</div>
                <h2 className="text-3xl font-bold text-white mb-2">{game.name}</h2>
                <p className="text-green-500/80 mb-4">{game.description}</p>
                <Badge className="bg-purple-600">{game.category}</Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-black/60 rounded p-4 text-center">
                  <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                  <div className="text-xl font-bold text-white">{stats?.best_score || 0}</div>
                  <div className="text-xs text-green-500/60">Your Best</div>
                </div>
                <div className="bg-black/60 rounded p-4 text-center">
                  <Coins className="w-6 h-6 mx-auto mb-2 text-green-400" />
                  <div className="text-xl font-bold text-white">{stats?.total_tokens_earned || 0}</div>
                  <div className="text-xs text-green-500/60">Tokens Earned</div>
                </div>
                <div className="bg-black/60 rounded p-4 text-center">
                  <Users className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                  <div className="text-xl font-bold text-white">{game.high_score || 0}</div>
                  <div className="text-xs text-green-500/60">Global Best</div>
                </div>
              </div>

              <Button
                onClick={startGame}
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
              >
                Start Game
              </Button>
            </Card>
          )}

          {gameState === 'playing' && (
            <GameComponent onComplete={handleGameComplete} />
          )}

          {gameState === 'result' && rewardData && (
            <Card className="bg-black/80 border-purple-500/30 p-8 max-w-2xl w-full">
              <div className="text-center mb-6">
                <Trophy className="w-20 h-20 mx-auto mb-4 text-yellow-400" />
                <h2 className="text-4xl font-bold text-white mb-2">Game Over!</h2>
                <div className="text-5xl font-black text-yellow-400 mb-4">{score}</div>
                
                {rewardData.isGlobalBest && (
                  <Badge className="bg-gradient-to-r from-yellow-600 to-orange-600 text-lg px-4 py-2 mb-2">
                    🏆 NEW GLOBAL RECORD!
                  </Badge>
                )}
                {rewardData.isPersonalBest && !rewardData.isGlobalBest && (
                  <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-lg px-4 py-2 mb-2">
                    ⭐ Personal Best!
                  </Badge>
                )}
              </div>

              <div className="bg-black/60 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-green-400">Tokens Earned:</span>
                  <span className="text-2xl font-bold text-yellow-400">
                    +{rewardData.tokensEarned} 🪙
                  </span>
                </div>
                {rewardData.hitLimit && (
                  <div className="text-xs text-orange-400 text-center">
                    Daily reward limit reached. Keep playing for fun!
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={startGame}
                  className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                >
                  Play Again
                </Button>
                <Button
                  onClick={() => navigate('/ArcadeHub')}
                  variant="outline"
                  className="h-12 px-8 border-green-500/30 text-green-400 hover:bg-green-900/30"
                >
                  Exit
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}