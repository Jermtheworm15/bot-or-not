import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import ImageCard from '@/components/voting/ImageCard';
import VotingButtons from '@/components/voting/VotingButtons';
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Clock } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function BlitzGame() {
  const [challenge, setChallenge] = useState(null);
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isAnswering, setIsAnswering] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [challengerScore, setChallengerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);

  useEffect(() => {
    initializeGame();
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

  const initializeGame = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const urlParams = new URLSearchParams(window.location.search);
      const challengeId = urlParams.get('challengeId');

      if (challengeId) {
        const challengeData = await base44.entities.UserChallenge.filter({ id: challengeId });
        if (challengeData.length > 0) {
          setChallenge(challengeData[0]);
        }
      }

      // Load random images
      const allImages = await base44.entities.Image.list();
      const shuffled = allImages.sort(() => 0.5 - Math.random()).slice(0, 10);
      setImages(shuffled);
    } catch (err) {
      console.error('Error initializing game:', err);
    }
  };

  const handleVote = async (guessedBot) => {
    if (!isAnswering || !images[currentIndex]) return;

    const image = images[currentIndex];
    const correct = guessedBot === image.is_bot;

    setUserAnswers(prev => [...prev, {
      imageId: image.id,
      guessed: guessedBot,
      correct,
      timestamp: new Date()
    }]);

    if (correct) {
      setOpponentScore(prev => prev + 10);
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
    }, 1500);
  };

  const skipImage = () => {
    setUserAnswers(prev => [...prev, {
      imageId: images[currentIndex].id,
      guessed: null,
      correct: false,
      timestamp: new Date()
    }]);

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
    const correctCount = userAnswers.filter(a => a.correct).length;

    if (challenge) {
      const finalScore = correctCount * 10;
      setOpponentScore(finalScore);

      await base44.entities.UserChallenge.update(challenge.id, {
        status: 'completed',
        opponent_score: finalScore,
        opponent_answers: userAnswers,
        completed_at: new Date().toISOString(),
        winner_email: finalScore > challenge.challenger_score ? currentUser.email : challenge.challenger_email
      });
    }
  };

  const currentImage = images[currentIndex];
  const progress = ((currentIndex + 1) / images.length) * 100;

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-8">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black">BLITZ CHALLENGE</h1>
              {challenge && <p className="text-zinc-400 text-sm">vs {challenge.challenger_name}</p>}
            </div>
            <div className="flex items-center gap-2 text-orange-400">
              <Clock className="w-6 h-6" />
              <span className="text-2xl font-black">{timeLeft}s</span>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Question {currentIndex + 1}/{images.length}</span>
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
        </motion.div>

        {/* Game Content */}
        <AnimatePresence mode="wait">
          {!isGameOver ? (
            <motion.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <ImageCard
                imageUrl={currentImage?.url}
                isLoading={!currentImage}
                isRevealed={!isAnswering}
                isBot={currentImage?.is_bot}
                wasCorrect={userAnswers[currentIndex]?.correct}
              />

              {isAnswering ? (
                <VotingButtons
                  onVote={handleVote}
                  disabled={false}
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-zinc-400 text-sm"
                >
                  {userAnswers[currentIndex]?.correct ? (
                    <p className="text-green-400 font-bold">Correct! ✓</p>
                  ) : (
                    <p className="text-red-400 font-bold">Incorrect ✗</p>
                  )}
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-6"
            >
              <Card className="bg-gradient-to-r from-purple-900/30 to-orange-900/30 border-purple-500/50">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <h2 className="text-3xl font-black">Game Over!</h2>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-zinc-800 rounded-lg p-4">
                        <p className="text-zinc-400 text-sm mb-1">You</p>
                        <p className="text-4xl font-black text-green-400">{opponentScore}</p>
                        <p className="text-xs text-zinc-500 mt-1">{userAnswers.filter(a => a.correct).length}/{userAnswers.length} correct</p>
                      </div>
                      <div className="bg-zinc-800 rounded-lg p-4">
                        <p className="text-zinc-400 text-sm mb-1">Opponent</p>
                        <p className="text-4xl font-black text-purple-400">{challenge?.challenger_score || 0}</p>
                      </div>
                    </div>

                    <div className="pt-4">
                      {opponentScore > (challenge?.challenger_score || 0) ? (
                        <motion.div className="flex items-center justify-center gap-2 text-yellow-400 font-bold">
                          <Trophy className="w-6 h-6" />
                          You Won!
                        </motion.div>
                      ) : opponentScore === (challenge?.challenger_score || 0) ? (
                        <p className="text-zinc-400">It's a Tie!</p>
                      ) : (
                        <p className="text-zinc-400">Better luck next time</p>
                      )}
                    </div>

                    <button
                      onClick={() => window.location.href = createPageUrl('Home')}
                      className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-bold transition-colors mt-4"
                    >
                      Back to Game
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}