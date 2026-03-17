import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Clock } from 'lucide-react';

// Deepfake or Nah? — 3 seconds per image, hard mode
export default function DeepfakeOrNahGame({ onComplete }) {
  const [images, setImages] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(3);
  const [phase, setPhase] = useState('loading');
  const [results, setResults] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [showImage, setShowImage] = useState(true);
  const timerRef = useRef(null);
  const TOTAL = 8;
  const TIME_PER = 3;

  useEffect(() => {
    loadImages();
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (phase !== 'playing') return;
    setShowImage(true);
    setTimeLeft(TIME_PER);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setShowImage(false);
          handleAnswer(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [current, phase]);

  const loadImages = async () => {
    try {
      const all = await base44.entities.Image.list('-created_date', 300);
      // Mix bots and humans, prefer clear-cut examples
      const bots = all.filter(i => i.url && i.is_bot === true).sort(() => Math.random() - 0.5).slice(0, 4);
      const humans = all.filter(i => i.url && i.is_bot === false).sort(() => Math.random() - 0.5).slice(0, 4);
      const mixed = [...bots, ...humans].sort(() => Math.random() - 0.5);
      setImages(mixed);
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
    // Hard: no points for timeout, penalty for wrong
    const points = timeout ? 0 : correct ? 150 : -25;

    setScore(s => Math.max(0, s + points));
    setResults(r => [...r, { correct, timeout, is_bot: img.is_bot }]);
    setFeedback(timeout ? 'timeout' : correct ? 'correct' : 'wrong');

    setTimeout(() => {
      setFeedback(null);
      if (current + 1 >= TOTAL) {
        setPhase('done');
        onComplete(Math.max(0, score + points));
      } else {
        setCurrent(c => c + 1);
      }
    }, 700);
  };

  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-pink-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (phase === 'done') {
    const correct = results.filter(r => r.correct).length;
    return (
      <div className="text-center p-8">
        <div className="text-6xl mb-4">👁️</div>
        <h2 className="text-3xl font-bold text-white mb-2">Analysis Complete!</h2>
        <div className="text-5xl font-black text-yellow-400 mb-4">{score}</div>
        <p className="text-green-400">{correct}/{TOTAL} detected</p>
        <p className="text-xs text-zinc-500 mt-1">Hard mode • -25pts for mistakes</p>
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
          <Eye className="w-4 h-4" /> {score}pts
        </div>
        <div className="text-sm text-green-400">{current + 1} / {TOTAL}</div>
        <div className={`flex items-center gap-1 font-bold ${timeLeft <= 1 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
          <Clock className="w-4 h-4" /> {timeLeft}s
        </div>
      </div>

      {/* Timer bar */}
      <div className="w-full h-2 bg-zinc-800 rounded mb-3">
        <div
          className={`h-full rounded ${timeLeft <= 1 ? 'bg-red-500' : timeLeft <= 2 ? 'bg-orange-500' : 'bg-pink-500'}`}
          style={{ width: `${(timeLeft / TIME_PER) * 100}%`, transition: 'width 1s linear' }}
        />
      </div>

      {/* Image with flash-hide effect */}
      <div className="relative rounded-xl overflow-hidden mb-4 border-2 border-pink-500/40">
        <AnimatePresence mode="wait">
          {showImage && (
            <motion.img
              key={current}
              src={img.url}
              alt=""
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full aspect-square object-cover"
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 flex flex-col items-center justify-center gap-2 ${
                feedback === 'correct' ? 'bg-green-500/70' : 'bg-red-500/70'
              }`}
            >
              <span className="text-6xl">{feedback === 'correct' ? '✓' : feedback === 'timeout' ? '⏱' : '✗'}</span>
              <span className="text-white font-bold text-sm">
                Was: {img.is_bot ? '🤖 Deepfake' : '👤 Real'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="text-center text-xs text-zinc-500 mb-3">Is this image real or AI-generated?</p>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleAnswer(false)}
          disabled={!!feedback}
          className="h-14 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-white text-lg font-bold disabled:opacity-40 active:scale-95 transition-all"
        >
          👤 Real
        </button>
        <button
          onClick={() => handleAnswer(true)}
          disabled={!!feedback}
          className="h-14 rounded-xl bg-gradient-to-br from-pink-600 to-red-700 text-white text-lg font-bold disabled:opacity-40 active:scale-95 transition-all"
        >
          🎭 Deepfake
        </button>
      </div>
    </div>
  );
}