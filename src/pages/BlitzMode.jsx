import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Trophy, Target, Clock, Flame, X, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { playSound } from '@/components/audio/SoundEffects';

const DIFFICULTY_SETTINGS = {
  easy: { time: 2000, name: 'Easy', color: 'green', multiplier: 1 },
  medium: { time: 1000, name: 'Medium', color: 'yellow', multiplier: 1.5 },
  hard: { time: 500, name: 'Hard', color: 'red', multiplier: 2 }
};

const COUNTDOWN_TIME = 3;
const POINTS_PER_CORRECT = 50;
const STREAK_BONUS = 25;

export default function BlitzMode() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('difficulty'); // difficulty, countdown, playing, result, gameOver
  const [difficulty, setDifficulty] = useState(null);
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageVisible, setImageVisible] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_TIME);
  const [timeProgress, setTimeProgress] = useState(100);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [lastAnswer, setLastAnswer] = useState(null);
  
  // Stats
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [roundStartTime, setRoundStartTime] = useState(null);
  const [user, setUser] = useState(null);

  const timerRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    loadUser();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.error('Auth error:', err);
      navigate('/Home');
    }
  };

  const loadImages = async () => {
    try {
      const rawData = await base44.entities.Image.list('-created_date', 200);
      
      const validData = rawData
        .map(item => ({
          id: item.id,
          url: item.url || item.data?.url,
          is_bot: item.is_bot ?? item.data?.is_bot,
          is_other: item.is_other ?? item.data?.is_other ?? false
        }))
        .filter(item => item.url && !item.is_other);

      // Fisher-Yates shuffle
      const shuffled = [...validData];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      setImages(shuffled.slice(0, 20)); // Use 20 images per game
    } catch (err) {
      console.error('Error loading images:', err);
      toast.error('Failed to load images');
    }
  };

  const startGame = async (selectedDifficulty) => {
    setDifficulty(selectedDifficulty);
    setGameState('loading');
    await loadImages();
    setGameState('countdown');
    startCountdown();
  };

  const startCountdown = () => {
    let count = COUNTDOWN_TIME;
    setCountdown(count);
    
    const interval = setInterval(() => {
      count--;
      setCountdown(count);
      playSound.click();
      
      if (count === 0) {
        clearInterval(interval);
        startRound();
      }
    }, 1000);
  };

  const startRound = () => {
    setGameState('playing');
    setImageVisible(true);
    setTimeProgress(100);
    setRoundStartTime(Date.now());
    
    const displayTime = DIFFICULTY_SETTINGS[difficulty].time;
    const interval = 10;
    let elapsed = 0;

    progressRef.current = setInterval(() => {
      elapsed += interval;
      const progress = Math.max(0, 100 - (elapsed / displayTime) * 100);
      setTimeProgress(progress);

      if (elapsed >= displayTime) {
        clearInterval(progressRef.current);
        setImageVisible(false);
      }
    }, interval);
  };

  const handleAnswer = async (guessedBot) => {
    if (hasAnswered || imageVisible) return;
    
    setHasAnswered(true);
    const currentImage = images[currentImageIndex];
    const isCorrect = guessedBot === currentImage.is_bot;
    const responseTime = Date.now() - roundStartTime;

    // Play sound
    if (isCorrect) {
      playSound.correct();
    } else {
      playSound.incorrect();
    }

    // Calculate score
    let points = 0;
    if (isCorrect) {
      const basePoints = POINTS_PER_CORRECT * DIFFICULTY_SETTINGS[difficulty].multiplier;
      const streakBonus = streak * STREAK_BONUS;
      points = Math.round(basePoints + streakBonus);
      
      setScore(prev => prev + points);
      setCorrect(prev => prev + 1);
      setStreak(prev => prev + 1);
    } else {
      setIncorrect(prev => prev + 1);
      setStreak(0);
    }

    setLastAnswer({
      correct: isCorrect,
      points,
      responseTime,
      image: currentImage
    });

    // Save vote
    try {
      await base44.entities.Vote.create({
        image_id: currentImage.id,
        guess: guessedBot ? 'bot' : 'human',
        guessed_bot: guessedBot,
        was_correct: isCorrect,
        user_email: user.email
      });
    } catch (err) {
      console.error('Error saving vote:', err);
    }

    setGameState('result');

    // Auto-advance after 1.5 seconds
    setTimeout(() => {
      if (currentImageIndex < images.length - 1) {
        nextRound();
      } else {
        endGame();
      }
    }, 1500);
  };

  const nextRound = () => {
    setCurrentImageIndex(prev => prev + 1);
    setHasAnswered(false);
    setLastAnswer(null);
    startRound();
  };

  const endGame = async () => {
    setGameState('gameOver');
    
    // Grant token reward
    try {
      const reward = Math.round(score * 0.5); // 50% of score as tokens
      await base44.functions.invoke('grantReward', {
        transaction_type: 'reward_engagement',
        amount: reward,
        metadata: {
          mode: 'blitz',
          difficulty,
          score,
          correct,
          incorrect,
          streak
        }
      });

      // Update Blitz stats
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (profiles.length > 0) {
        const profile = profiles[0];
        const currentBlitzStats = profile.blitz_stats || {};
        
        await base44.entities.UserProfile.update(profile.id, {
          blitz_stats: {
            games_played: (currentBlitzStats.games_played || 0) + 1,
            best_streak: Math.max(currentBlitzStats.best_streak || 0, streak),
            highest_score: Math.max(currentBlitzStats.highest_score || 0, score),
            total_correct: (currentBlitzStats.total_correct || 0) + correct,
            total_incorrect: (currentBlitzStats.total_incorrect || 0) + incorrect
          }
        });
      }

      toast.success(`Game Over! Earned ${reward} tokens`);
    } catch (err) {
      console.error('Error updating stats:', err);
    }
  };

  const restartGame = () => {
    setCurrentImageIndex(0);
    setScore(0);
    setStreak(0);
    setCorrect(0);
    setIncorrect(0);
    setHasAnswered(false);
    setLastAnswer(null);
    setGameState('difficulty');
  };

  const currentImage = images[currentImageIndex];
  const accuracy = correct + incorrect > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 0;

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />
      
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 pb-32">
        {/* Header */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/Home')}
            className="text-green-400 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Exit
          </Button>
          
          {gameState !== 'difficulty' && gameState !== 'gameOver' && (
            <div className="flex items-center gap-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg border border-purple-500/30">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="font-bold text-yellow-400">{score}</span>
              </div>
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" />
                <span className="font-bold text-orange-400">{streak}</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                <span className="font-bold text-green-400">{currentImageIndex + 1}/20</span>
              </div>
            </div>
          )}
        </div>

        {/* Difficulty Selection */}
        {gameState === 'difficulty' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl w-full space-y-6"
          >
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Zap className="w-12 h-12 text-yellow-400" />
                <h1 className="text-4xl font-black text-white">Blitz Mode</h1>
              </div>
              <p className="text-green-500/80">Test your reflexes! Identify images in a flash</p>
            </div>

            <div className="grid gap-4">
              {Object.entries(DIFFICULTY_SETTINGS).map(([key, settings]) => (
                <Card
                  key={key}
                  className={`p-6 bg-black/60 border-${settings.color}-500/30 hover:border-${settings.color}-500/60 transition-all cursor-pointer`}
                  onClick={() => startGame(key)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-2xl font-bold text-${settings.color}-400 mb-2`}>
                        {settings.name}
                      </h3>
                      <p className="text-green-500/60 mb-1">
                        {settings.time / 1000}s per image
                      </p>
                      <Badge className={`bg-${settings.color}-600`}>
                        {settings.multiplier}x points
                      </Badge>
                    </div>
                    <Clock className={`w-12 h-12 text-${settings.color}-400`} />
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Countdown */}
        {gameState === 'countdown' && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <motion.div
              key={countdown}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="text-9xl font-black text-yellow-400 mb-4"
            >
              {countdown}
            </motion.div>
            <p className="text-2xl text-green-400">Get Ready!</p>
          </motion.div>
        )}

        {/* Playing / Result */}
        {(gameState === 'playing' || gameState === 'result') && currentImage && (
          <div className="max-w-2xl w-full space-y-4">
            {/* Timer Progress */}
            {imageVisible && (
              <Progress 
                value={timeProgress} 
                className="h-2 bg-zinc-800"
              />
            )}

            {/* Image Container */}
            <Card className="bg-black/80 border-purple-500/30 p-4 overflow-hidden">
              <AnimatePresence mode="wait">
                {imageVisible ? (
                  <motion.div
                    key="image"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="aspect-square relative"
                  >
                    <img
                      src={currentImage.url}
                      alt="Guess"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="aspect-square flex items-center justify-center bg-zinc-900 rounded-lg"
                  >
                    <div className="text-center">
                      <Clock className="w-16 h-16 mx-auto mb-4 text-purple-400 opacity-50" />
                      <p className="text-xl text-green-400">Make your guess!</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* Answer Buttons */}
            {!imageVisible && !hasAnswered && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 gap-4"
              >
                <Button
                  onClick={() => handleAnswer(true)}
                  className="h-20 text-xl font-bold bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600"
                >
                  🤖 Bot
                </Button>
                <Button
                  onClick={() => handleAnswer(false)}
                  className="h-20 text-xl font-bold bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600"
                >
                  👤 Human
                </Button>
              </motion.div>
            )}

            {/* Result */}
            {gameState === 'result' && lastAnswer && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <Card className={`p-6 ${lastAnswer.correct ? 'bg-green-900/30 border-green-500/50' : 'bg-red-900/30 border-red-500/50'}`}>
                  <h3 className={`text-3xl font-black mb-2 ${lastAnswer.correct ? 'text-green-400' : 'text-red-400'}`}>
                    {lastAnswer.correct ? '✓ Correct!' : '✗ Wrong'}
                  </h3>
                  {lastAnswer.correct && (
                    <div className="text-2xl font-bold text-yellow-400 mb-1">
                      +{lastAnswer.points} points
                    </div>
                  )}
                  <div className="text-sm text-green-500/60">
                    Response time: {Math.round(lastAnswer.responseTime)}ms
                  </div>
                </Card>
              </motion.div>
            )}
          </div>
        )}

        {/* Game Over */}
        {gameState === 'gameOver' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl w-full space-y-6"
          >
            <div className="text-center mb-6">
              <Trophy className="w-20 h-20 mx-auto mb-4 text-yellow-400" />
              <h2 className="text-4xl font-black text-white mb-2">Game Over!</h2>
              <p className="text-green-500/80">Final Stats</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card className="bg-black/60 border-yellow-500/30 p-4 text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
                <div className="text-3xl font-bold text-yellow-400">{score}</div>
                <div className="text-sm text-green-500/60">Final Score</div>
              </Card>

              <Card className="bg-black/60 border-orange-500/30 p-4 text-center">
                <Flame className="w-8 h-8 mx-auto mb-2 text-orange-400" />
                <div className="text-3xl font-bold text-orange-400">{streak}</div>
                <div className="text-sm text-green-500/60">Best Streak</div>
              </Card>

              <Card className="bg-black/60 border-green-500/30 p-4 text-center">
                <Target className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <div className="text-3xl font-bold text-green-400">{accuracy}%</div>
                <div className="text-sm text-green-500/60">Accuracy</div>
              </Card>

              <Card className="bg-black/60 border-purple-500/30 p-4 text-center">
                <Zap className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                <div className="text-3xl font-bold text-purple-400">{correct}/{images.length}</div>
                <div className="text-sm text-green-500/60">Correct</div>
              </Card>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={restartGame}
                className="flex-1 h-14 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
              >
                Play Again
              </Button>
              <Button
                onClick={() => navigate('/Home')}
                variant="outline"
                className="h-14 px-8 border-green-500/30 text-green-400 hover:bg-green-900/30"
              >
                Exit
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}