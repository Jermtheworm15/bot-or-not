import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import ImageCard from '@/components/voting/ImageCard';
import VotingButtons from '@/components/voting/VotingButtons';
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Clock, Brain } from 'lucide-react';
import DifficultySelector from './DifficultySelector';
import { createPageUrl } from '@/utils';

export default function AIChallenge() {
  const [gameState, setGameState] = useState('difficulty'); // difficulty, loading, playing, finished
  const [difficulty, setDifficulty] = useState(2);
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isAnswering, setIsAnswering] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [aiAnswers, setAiAnswers] = useState([]);
  const [playerStats, setPlayerStats] = useState({});
  const [rounds, setRounds] = useState(5);

  useEffect(() => {
    loadPlayerStats();
  }, []);

  useEffect(() => {
    if (!isAnswering || isGameOver) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          skipImage();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAnswering, isGameOver]);

  const loadPlayerStats = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const profile = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (profile.length > 0) {
        const votes = await base44.entities.Vote.filter({ user_email: user.email });
        const accuracy = votes.length > 0 
          ? (votes.filter(v => v.was_correct).length / votes.length) * 100 
          : 0;
        
        setPlayerStats({ accuracy, totalVotes: votes.length });
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const startGame = async (selectedDifficulty) => {
    setGameState('loading');
    setDifficulty(selectedDifficulty);
    
    try {
      const allImages = await base44.entities.Image.list();
      const shuffled = allImages.sort(() => 0.5 - Math.random()).slice(0, rounds);
      setImages(shuffled);
      setGameState('playing');
      setCurrentIndex(0);
      setIsAnswering(true);
      setPlayerScore(0);
      setAiScore(0);
      setUserAnswers([]);
      setAiAnswers([]);
    } catch (err) {
      console.error('Error starting game:', err);
    }
  };

  const handleVote = async (guessedBot) => {
    if (!isAnswering || currentIndex >= images.length) return;

    const image = images[currentIndex];
    if (!image?.id) return;
    const correct = guessedBot === image.is_bot;

    const playerAnswer = {
      imageId: image.id,
      guessed: guessedBot,
      correct,
      timestamp: new Date()
    };
    
    setUserAnswers(prev => [...prev, playerAnswer]);
    if (correct) setPlayerScore(prev => prev + 10);

    // Get AI decision
    try {
      const aiResponse = await base44.functions.invoke('generateAIOpponentMove', {
        imageId: image.id,
        isBot: image.is_bot,
        difficulty,
        playerAccuracy: playerStats.accuracy
      });

      const aiCorrect = aiResponse.data.guessedBot === image.is_bot;
      const aiAnswer = {
        imageId: image.id,
        guessed: aiResponse.data.guessedBot,
        correct: aiCorrect,
        confidence: aiResponse.data.confidence,
        reasoning: aiResponse.data.reasoning,
        timestamp: new Date()
      };
      
      setAiAnswers(prev => [...prev, aiAnswer]);
      if (aiCorrect) setAiScore(prev => prev + 10);
    } catch (err) {
      console.error('Error getting AI decision:', err);
    }

    setIsAnswering(false);
    setTimeLeft(30);

    setTimeout(() => {
      if (currentIndex < images.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setIsAnswering(true);
      } else {
        finishGame();
      }
    }, 2000);
  };

  const skipImage = async () => {
    const image = images[currentIndex];
    if (!image) return;
    
    setUserAnswers(prev => [...prev, {
      imageId: image.id,
      guessed: null,
      correct: false,
      timestamp: new Date()
    }]);

    // AI always responds, even when player skips
    try {
      const aiResponse = await base44.functions.invoke('generateAIOpponentMove', {
        imageId: image.id,
        isBot: image.is_bot,
        difficulty,
        playerAccuracy: playerStats.accuracy
      });

      const aiCorrect = aiResponse.data.guessedBot === image.is_bot;
      const aiAnswer = {
        imageId: image.id,
        guessed: aiResponse.data.guessedBot,
        correct: aiCorrect,
        confidence: aiResponse.data.confidence,
        reasoning: aiResponse.data.reasoning,
        timestamp: new Date()
      };
      
      setAiAnswers(prev => [...prev, aiAnswer]);
      if (aiCorrect) setAiScore(prev => prev + 10);
    } catch (err) {
      console.error('Error getting AI decision:', err);
    }

    setIsAnswering(false);
    setTimeout(() => {
      if (currentIndex < images.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setIsAnswering(true);
      } else {
        finishGame();
      }
    }, 1000);
  };

  const finishGame = async () => {
    setIsGameOver(true);
    // Save result to profile
    if (currentUser) {
      try {
        const profile = await base44.entities.UserProfile.filter({ user_email: currentUser.email });
        if (profile.length > 0) {
          const newPoints = playerScore + 50; // Bonus for playing
          await base44.entities.UserProfile.update(profile[0].id, {
            points: (profile[0].points || 0) + newPoints
          });
        }
      } catch (err) {
        console.error('Error saving score:', err);
      }
    }
  };

  const currentImage = images[currentIndex];
  const progress = images.length > 0 ? ((currentIndex + 1) / images.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-8">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4">
        <AnimatePresence mode="wait">
          {gameState === 'difficulty' && (
            <motion.div
              key="difficulty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2 mb-8">
                <h1 className="text-4xl font-black flex items-center justify-center gap-2">
                  <Brain className="w-8 h-8 text-purple-400" />
                  Challenge the AI
                </h1>
                <p className="text-zinc-400">Test your AI detection skills against our adaptive opponent</p>
              </div>

              <Card className="bg-zinc-900 border-purple-500/30">
                <CardContent className="p-6 space-y-6">
                  <DifficultySelector
                    selectedDifficulty={difficulty}
                    onSelect={setDifficulty}
                    playerStats={playerStats}
                  />

                  <div className="space-y-3">
                    <label className="text-sm text-zinc-400">Number of rounds:</label>
                    <select
                      value={rounds}
                      onChange={(e) => setRounds(parseInt(e.target.value))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value={5}>5 Rounds</option>
                      <option value={10}>10 Rounds</option>
                    </select>
                  </div>

                  <button
                    onClick={() => startGame(difficulty)}
                    className="w-full bg-gradient-to-r from-purple-600 to-orange-600 hover:from-purple-700 hover:to-orange-700 py-3 rounded-lg font-bold text-lg transition-all"
                  >
                    Start Challenge
                  </button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {gameState === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center min-h-screen"
            >
              <div className="text-center space-y-4">
                <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-zinc-400">Initializing AI opponent...</p>
              </div>
            </motion.div>
          )}

          {gameState === 'playing' && !isGameOver && (
            <motion.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-black">VS AI</h1>
                    <p className="text-zinc-400 text-sm">Difficulty: {['Easy', 'Medium', 'Hard'][difficulty - 1]}</p>
                  </div>
                  <div className="flex items-center gap-2 text-orange-400">
                    <Clock className="w-6 h-6" />
                    <span className="text-2xl font-black">{timeLeft}s</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>Round {currentIndex + 1}/{images.length}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-600 to-orange-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg p-3">
                    <p className="text-zinc-400 text-xs mb-1">You</p>
                    <p className="text-2xl font-black text-green-400">{playerScore}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-3">
                    <p className="text-zinc-400 text-xs mb-1">AI</p>
                    <p className="text-2xl font-black text-purple-400">{aiScore}</p>
                  </div>
                </div>
              </motion.div>

              <ImageCard
                imageUrl={currentImage?.url}
                isLoading={!currentImage}
                isRevealed={!isAnswering}
                isBot={currentImage?.is_bot}
                wasCorrect={userAnswers[currentIndex]?.correct}
              />

              {isAnswering ? (
                <VotingButtons onVote={handleVote} disabled={false} />
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className={`p-3 rounded-lg ${userAnswers[currentIndex]?.correct ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      <p className="font-bold">{userAnswers[currentIndex]?.guessed ? 'Bot' : 'Human'}</p>
                      <p className="text-xs opacity-75">{userAnswers[currentIndex]?.correct ? '✓ Correct' : '✗ Wrong'}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${aiAnswers[currentIndex]?.correct ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                      <p className="font-bold">{aiAnswers[currentIndex]?.guessed ? 'Bot' : 'Human'}</p>
                      <p className="text-xs opacity-75">{aiAnswers[currentIndex]?.confidence}% confident</p>
                    </div>
                  </div>
                  {aiAnswers[currentIndex]?.reasoning && (
                    <p className="text-xs text-zinc-400 bg-zinc-800/50 p-2 rounded italic">
                      AI: "{aiAnswers[currentIndex].reasoning}"
                    </p>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

          {isGameOver && (
            <motion.div
              key="results"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-6"
            >
              <Card className="bg-gradient-to-r from-purple-900/30 to-orange-900/30 border-purple-500/50">
                <CardContent className="pt-6 space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-4xl font-black">Challenge Complete!</h2>
                    {playerScore > aiScore && (
                      <p className="text-yellow-400 font-bold flex items-center justify-center gap-2">
                        <Trophy className="w-5 h-5" />
                        You defeated the AI!
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-800 rounded-lg p-4 text-center space-y-2">
                      <p className="text-zinc-400 text-sm">Your Score</p>
                      <p className="text-4xl font-black text-green-400">{playerScore}</p>
                      <p className="text-xs text-zinc-500">{userAnswers.filter(a => a.correct).length}/{userAnswers.length} correct</p>
                    </div>
                    <div className="bg-zinc-800 rounded-lg p-4 text-center space-y-2">
                      <p className="text-zinc-400 text-sm">AI Score</p>
                      <p className="text-4xl font-black text-purple-400">{aiScore}</p>
                      <p className="text-xs text-zinc-500">{aiAnswers.filter(a => a.correct).length}/{aiAnswers.length} correct</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setGameState('difficulty');
                      setIsGameOver(false);
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-bold transition-colors"
                  >
                    Challenge Again
                  </button>
                  <button
                    onClick={() => window.location.href = createPageUrl('Home')}
                    className="w-full bg-zinc-700 hover:bg-zinc-600 py-3 rounded-lg font-bold transition-colors"
                  >
                    Back to Game
                  </button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}