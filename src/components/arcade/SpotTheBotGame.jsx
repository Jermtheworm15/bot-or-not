import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Clock } from 'lucide-react';

// Spot the Bot Blitz — rapid-fire AI detection speed game
export default function SpotTheBotGame({ onComplete }) {
  const [images, setImages] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(3); // 3 seconds per image
  const [phase, setPhase] = useState('loading'); // loading, playing, result
  const [results, setResults] = useState([]);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong' | 'timeout'
  const timerRef = useRef(null);
  const TOTAL = 10;
  const TIME_PER = 3;

  useEffect(() => {
    loadImages();
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (phase !== 'playing') return;
    setTimeLeft(TIME_PER);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleAnswer(null); // timeout
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [current, phase]);

  const loadImages = async () => {
    try {
      const all = await base44.entities.Image.list('-created_date', 200);
      const valid = all.filter(i => i.url && typeof i.url === 'string');
      const shuffled = [...valid].sort(() => Math.random() - 0.5).slice(0, TOTAL);
      setImages(shuffled);
      setPhase('playing');
    } catch (e) {
      onComplete(0);
    }
  };

  const handleAnswer = (guessedBot) => {
    clearInterval(timerRef.current);
    const img = images[current];
    if (!img) return;

    const timeout = guessedBot === null;
    const correct = !timeout && guessedBot === img.is_bot;
    const newCombo = correct ? combo + 1 : 0;
    const points = timeout ? 0 : correct ? (100 + newCombo * 25) : 0;

    setCombo(newCombo);
    setScore(s => s + points);
    setResults(r => [...r, { correct, timeout, is_bot: img.is_bot }]);
    setFeedback(timeout ? 'timeout' : correct ? 'correct' : 'wrong');

    setTimeout(() => {
      setFeedback(null);
      if (current + 1 >= TOTAL) {
        setPhase('done');
        onComplete(score + points);
      } else {
        setCurrent(c => c + 1);
      }
    }, 600);
  };

  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (phase === 'done') {
    const correct = results.filter(r => r.correct).length;
    return (
      <div className="text-center p-8">
        <div className="text-6xl mb-4">🤖</div>
        <h2 className="text-3xl font-bold text-white mb-2">Blitz Complete!</h2>
        <div className="text-5xl font-black text-yellow-400 mb-4">{score}</div>
        <p className="text-green-400">{correct}/{TOTAL} correct</p>
      </div>
    );
  }

  const img = images[current];
  if (!img) return null;

  return (
    <div className="w-full max-w-md mx-auto select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-yellow-400 font-bold">
          <Zap className="w-4 h-4" /> {score}
        </div>
        <div className="text-sm text-green-400">{current + 1} / {TOTAL}</div>
        <div className={`flex items-center gap-1 font-bold ${timeLeft <= 1 ? 'text-red-400' : 'text-white'}`}>
          <Clock className="w-4 h-4" /> {timeLeft}s
        </div>
      </div>

      {/* Timer bar */}
      <div className="w-full h-1.5 bg-zinc-800 rounded mb-3">
        <div
          className={`h-full rounded transition-all ${timeLeft <= 1 ? 'bg-red-500' : 'bg-purple-500'}`}
          style={{ width: `${(timeLeft / TIME_PER) * 100}%`, transition: 'width 1s linear' }}
        />
      </div>

      {/* Combo */}
      {combo >= 2 && (
        <div className="text-center mb-2 text-orange-400 font-bold text-sm">🔥 {combo}x Combo!</div>
      )}

      {/* Image */}
      <div className="relative rounded-xl overflow-hidden mb-4 border border-purple-500/30">
        <img src={img.url} alt="" className="w-full aspect-square object-cover" />

        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 flex items-center justify-center text-7xl font-black ${
                feedback === 'correct' ? 'bg-green-500/60' : 'bg-red-500/60'
              }`}
            >
              {feedback === 'correct' ? '✓' : feedback === 'timeout' ? '⏱' : '✗'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleAnswer(false)}
          disabled={!!feedback}
          className="h-16 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 to-blue-600 text-white text-xl font-bold disabled:opacity-40 transition-all active:scale-95"
        >
          👤 Human
        </button>
        <button
          onClick={() => handleAnswer(true)}
          disabled={!!feedback}
          className="h-16 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 to-purple-600 text-white text-xl font-bold disabled:opacity-40 transition-all active:scale-95"
        >
          🤖 Bot
        </button>
      </div>
    </div>
  );
}