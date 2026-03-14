import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Trophy, Coins, Users, Share2, Swords, Crown } from 'lucide-react';
import { toast } from 'sonner';
import ReactionGame from '@/components/arcade/ReactionGame';
import MemoryGame from '@/components/arcade/MemoryGame';
import RunnerGame from '@/components/arcade/RunnerGame';
import DodgeGame from '@/components/arcade/DodgeGame';
import ClickerGame from '@/components/arcade/ClickerGame';
import ColorMatchGame from '@/components/arcade/ColorMatchGame';
import TypingGame from '@/components/arcade/TypingGame';
import PatternGame from '@/components/arcade/PatternGame';
import SnakeGame from '@/components/arcade/SnakeGame';
import FlappyGame from '@/components/arcade/FlappyGame';
import BreakoutGame from '@/components/arcade/BreakoutGame';
import Match3Game from '@/components/arcade/Match3Game';
import InviteFriends from '@/components/social/InviteFriends';
import ProgressionSystem from '@/components/arcade/ProgressionSystem';
import ArcadeChat from '@/components/arcade/ArcadeChat';
import ArcadeSocialShare from '@/components/arcade/ArcadeSocialShare';

export default function ArcadeGame() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const challengeId = searchParams.get('challengeId');
  const vsArcadeMaster = searchParams.get('arcadeMaster') === 'true';
  
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState(null);
  const [gameState, setGameState] = useState('menu'); // menu, playing, result
  const [score, setScore] = useState(0);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [rewardData, setRewardData] = useState(null);
  const [aiScore, setAiScore] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(1);

  useEffect(() => {
    loadGame();
  }, [gameId, challengeId]);

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
      setCurrentLevel(userStats[0]?.current_level || 1);

      // Load challenge if present
      if (challengeId) {
        const challenges = await base44.entities.ArcadeChallenge.filter({ id: challengeId });
        if (challenges.length > 0) {
          setChallenge(challenges[0]);
        }
      }

    } catch (error) {
      console.error('[Arcade] Load error:', error);
      toast.error('Failed to load game');
    }
    setLoading(false);
  };

  const handleGameComplete = async (finalScore, metadata = {}) => {
    setScore(finalScore);
    
    // Calculate level-based difficulty multiplier (1x to 5x)
    const difficultyMultiplier = 1 + (currentLevel - 1) * 0.04;
    const adjustedScore = Math.round(finalScore * difficultyMultiplier);
    
    // Simulate AI opponent if applicable
    if (vsArcadeMaster || challenge) {
      try {
        const aiResult = await base44.functions.invoke('simulateAIOpponent', {
          game_id: gameId,
          difficulty: 'hard',
          is_arcade_master: vsArcadeMaster
        });
        
        if (aiResult.data?.success) {
          setAiScore(aiResult.data.ai_score);
        }
      } catch (error) {
        console.error('[AI] Simulation error:', error);
      }
    }
    
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

      // Determine if level is passed (score threshold scales with level)
      const levelThreshold = 500 + (currentLevel * 50);
      const levelPassed = adjustedScore >= levelThreshold;
      const newLevel = levelPassed ? currentLevel + 1 : currentLevel;
      
      // Save score
      const isPersonalBest = !stats || adjustedScore > (stats.best_score || 0);
      const isGlobalBest = adjustedScore > (game.high_score || 0);

      await base44.entities.ArcadeScore.create({
        user_email: user.email,
        game_id: gameId,
        score: adjustedScore,
        duration: metadata.duration || 0,
        tokens_earned: tokensEarned,
        is_personal_best: isPersonalBest,
        is_global_best: isGlobalBest,
        metadata: { ...metadata, level: currentLevel, difficulty_multiplier: difficultyMultiplier }
      });

      // Update stats
      const newStreak = stats?.last_played_date === today 
        ? (stats.current_streak || 0) + 1 
        : 1;

      if (stats) {
        await base44.entities.ArcadeStats.update(stats.id, {
          games_played: (stats.games_played || 0) + 1,
          best_score: Math.max(stats.best_score || 0, adjustedScore),
          total_tokens_earned: (stats.total_tokens_earned || 0) + tokensEarned,
          current_streak: newStreak,
          best_streak: Math.max(stats.best_streak || 0, newStreak),
          last_played_date: today,
          plays_today: playsToday + 1,
          current_level: Math.min(newLevel, 100),
          highest_level_reached: Math.max(stats.highest_level_reached || 1, newLevel),
          wins: (stats.wins || 0) + (levelPassed ? 1 : 0),
          losses: (stats.losses || 0) + (levelPassed ? 0 : 1)
        });
      } else {
        await base44.entities.ArcadeStats.create({
          user_email: user.email,
          game_id: gameId,
          games_played: 1,
          best_score: adjustedScore,
          total_tokens_earned: tokensEarned,
          current_streak: 1,
          best_streak: 1,
          last_played_date: today,
          plays_today: 1,
          current_level: Math.min(newLevel, 100),
          highest_level_reached: Math.min(newLevel, 100),
          wins: levelPassed ? 1 : 0,
          losses: levelPassed ? 0 : 1
        });
      }
      
      // Update user profile arcade stats
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (profiles[0]) {
        const arcadeStats = profiles[0].arcade_stats || {};
        await base44.entities.UserProfile.update(profiles[0].id, {
          arcade_stats: {
            total_games_played: (arcadeStats.total_games_played || 0) + 1,
            total_wins: (arcadeStats.total_wins || 0) + (levelPassed ? 1 : 0),
            total_losses: (arcadeStats.total_losses || 0) + (levelPassed ? 0 : 1),
            total_tokens_earned: (arcadeStats.total_tokens_earned || 0) + tokensEarned,
            highest_level_reached_overall: Math.max(arcadeStats.highest_level_reached_overall || 1, newLevel),
            best_game_score: Math.max(arcadeStats.best_game_score || 0, adjustedScore)
          }
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

      // Handle challenge completion
      if (challenge && challenge.status === 'accepted') {
        const won = finalScore > challenge.challenger_score;
        
        await base44.entities.ArcadeChallenge.update(challenge.id, {
          challenged_score: finalScore,
          status: 'completed',
          winner_email: won ? user.email : challenge.challenger_email
        });

        // Notify challenger
        await base44.entities.Notification.create({
          user_email: challenge.challenger_email,
          type: 'arcade_challenge',
          title: 'Challenge Completed!',
          message: `${user.email.split('@')[0]} ${won ? 'beat' : 'lost to'} your challenge in ${game.name}`
        });
      }

      // Handle Arcade Master battle
      if (vsArcadeMaster && aiScore !== null) {
        const won = finalScore > aiScore;
        
        const masterStats = await base44.entities.ArcadeMaster.filter({ user_email: user.email });
        if (masterStats.length > 0) {
          await base44.entities.ArcadeMaster.update(masterStats[0].id, {
            games_played: (masterStats[0].games_played || 0) + 1,
            wins: (masterStats[0].wins || 0) + (won ? 1 : 0),
            losses: (masterStats[0].losses || 0) + (won ? 0 : 1),
            last_played_date: new Date().toISOString(),
            best_victory_score: won ? Math.max(masterStats[0].best_victory_score || 0, finalScore) : masterStats[0].best_victory_score
          });
        }

        if (won) {
          await base44.entities.SocialFeed.create({
            user_email: user.email,
            activity_type: 'achievement',
            title: '👑 Defeated Arcade Master!',
            description: `Beat the legendary Arcade Master in ${game.name} with ${finalScore} points`,
            is_featured: true
          });
        }
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

      // Check for Arcade Master unlock
      try {
        const unlockResult = await base44.functions.invoke('checkArcadeMasterUnlock', {});
        if (unlockResult.data?.just_unlocked) {
          toast.success('🏆 Arcade Master Unlocked!');
        }
      } catch (error) {
        console.error('[Unlock] Check error:', error);
      }

      setRewardData({
        tokensEarned,
        isPersonalBest,
        isGlobalBest,
        hitLimit: playsToday >= dailyLimit,
        challengeResult: challenge ? (adjustedScore > challenge.challenger_score ? 'won' : 'lost') : null,
        arcadeMasterResult: vsArcadeMaster && aiScore !== null ? (adjustedScore > aiScore ? 'won' : 'lost') : null,
        levelPassed,
        newLevel,
        adjustedScore
      });
      
      if (levelPassed && newLevel <= 100) {
        setCurrentLevel(newLevel);
      }

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
    'pixel-runner': RunnerGame,
    'dodge-master': DodgeGame,
    'speed-clicker': ClickerGame,
    'color-match': ColorMatchGame,
    'type-racer': TypingGame,
    'pattern-memory': PatternGame,
    'pixel-snake': SnakeGame,
    'snake-retro': SnakeGame,
    'flappy-bird': FlappyGame,
    'breakout-arcade': BreakoutGame,
    'brick-breaker-retro': BreakoutGame,
    'match3-gems': Match3Game,
    'gem-matcher': Match3Game,
    'endless-runner': RunnerGame,
    'subway-surfer': RunnerGame,
    'jetpack-fly': RunnerGame,
    'parkour-jump': RunnerGame,
    'whack-mole': ReactionGame,
    'fruit-ninja': ReactionGame,
    'bubble-pop': ReactionGame,
    'target-shooter': ReactionGame,
    'quick-click': ClickerGame,
    'simon-says': PatternGame,
    'card-flip': MemoryGame,
    'sequence-recall': PatternGame
  }[gameId] || null;

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center">
        <Card className="bg-black/60 border-purple-500/30 p-12 text-center">
          <p className="text-xl mb-4">Game not found</p>
          <Button onClick={() => navigate('/ArcadeHub')}>
            Back to Arcade
          </Button>
        </Card>
      </div>
    );
  }

  if (!GameComponent) {
    // Handle iframe/embed games
    if (game.embed_type === 'iframe' && game.embed_url) {
      return (
        <div className="min-h-screen bg-black text-white">
          <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />
          
          <div className="relative z-10 min-h-screen flex flex-col">
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
              </div>

              <div className="w-20" />
            </div>

            <div className="flex-1 p-4">
              <Card className="bg-black/80 border-purple-500/30 p-4 max-w-5xl mx-auto">
                <iframe
                  src={game.embed_url}
                  className="w-full h-[600px] rounded-lg"
                  frameBorder="0"
                  allowFullScreen
                  title={game.name}
                />
                <div className="mt-4 text-center text-green-500/60 text-sm">
                  {game.description}
                </div>
              </Card>
            </div>
          </div>
          
          <ArcadeChat gameId={gameId} />
        </div>
      );
    }

    // Game not implemented yet
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center">
        <Card className="bg-black/60 border-purple-500/30 p-12 text-center">
          <div className="text-6xl mb-4">{game.icon || '🎮'}</div>
          <p className="text-xl mb-2">{game.name}</p>
          <p className="text-sm text-green-500/60 mb-6">{game.description}</p>
          <p className="text-sm text-yellow-400 mb-6">Coming Soon!</p>
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
            <div className="space-y-4 w-full max-w-2xl">
              <ProgressionSystem 
                currentLevel={currentLevel}
                stats={stats}
              />
              
              <Card className="bg-black/80 border-purple-500/30 p-8">
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
                  Start Level {currentLevel}
                </Button>
              </Card>
            </div>
          )}

          {gameState === 'playing' && (
            <GameComponent onComplete={handleGameComplete} />
          )}

          {gameState === 'result' && rewardData && (
            <Card className="bg-black/80 border-purple-500/30 p-8 max-w-2xl w-full">
              <div className="text-center mb-6">
                <Trophy className="w-20 h-20 mx-auto mb-4 text-yellow-400" />
                <h2 className="text-4xl font-bold text-white mb-2">
                  {rewardData.levelPassed ? '🎉 Level Complete!' : 'Game Over!'}
                </h2>
                <div className="text-5xl font-black text-yellow-400 mb-2">{rewardData.adjustedScore || score}</div>
                <div className="text-sm text-green-500/60 mb-4">
                  Level {currentLevel} • {(1 + (currentLevel - 1) * 0.04).toFixed(2)}x Multiplier
                </div>
                
                {rewardData.levelPassed && rewardData.newLevel <= 100 && (
                  <Badge className="bg-gradient-to-r from-green-600 to-green-700 text-lg px-4 py-2 mb-2">
                    🎮 Level {rewardData.newLevel} Unlocked!
                  </Badge>
                )}
                
                {rewardData.arcadeMasterResult && (
                  <Badge className={`text-lg px-4 py-2 mb-2 ${
                    rewardData.arcadeMasterResult === 'won'
                      ? 'bg-gradient-to-r from-yellow-600 to-orange-600'
                      : 'bg-gradient-to-r from-red-600 to-red-700'
                  }`}>
                    {rewardData.arcadeMasterResult === 'won' ? '👑 DEFEATED ARCADE MASTER!' : '😔 Arcade Master Wins'}
                  </Badge>
                )}
                
                {rewardData.challengeResult && (
                  <Badge className={`text-lg px-4 py-2 mb-2 ${
                    rewardData.challengeResult === 'won'
                      ? 'bg-gradient-to-r from-green-600 to-green-700'
                      : 'bg-gradient-to-r from-red-600 to-red-700'
                  }`}>
                    {rewardData.challengeResult === 'won' ? '🎯 Challenge Won!' : '😔 Challenge Lost'}
                  </Badge>
                )}
                
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

              {(aiScore !== null || challenge) && (
                <div className="bg-black/60 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="text-center flex-1">
                      <div className="text-sm text-green-400 mb-1">Your Score</div>
                      <div className="text-3xl font-bold text-white">{score}</div>
                    </div>
                    <div className="text-2xl px-4">VS</div>
                    <div className="text-center flex-1">
                      <div className="text-sm text-green-400 mb-1">
                        {vsArcadeMaster ? '👑 Arcade Master' : 'Opponent'}
                      </div>
                      <div className="text-3xl font-bold text-white">
                        {aiScore || challenge?.challenger_score}
                      </div>
                    </div>
                  </div>
                </div>
              )}

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

              <div className="mb-6">
                <ArcadeSocialShare 
                  score={rewardData.adjustedScore || score}
                  gameName={game.name}
                  level={currentLevel}
                />
              </div>

              <div className="flex gap-3 mb-4">
                <InviteFriends />
                <Button
                  onClick={startGame}
                  className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                >
                  {rewardData.levelPassed ? `Play Level ${rewardData.newLevel}` : 'Retry Level'}
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
      
      <ArcadeChat gameId={gameId} />
    </div>
  );
}