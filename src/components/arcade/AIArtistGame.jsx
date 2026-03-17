import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette } from 'lucide-react';

// AI Artist Challenge — 4 images, 1 is AI, easy mode
export default function AIArtistGame({ onComplete }) {
  const [rounds, setRounds] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [phase, setPhase] = useState('loading');
  const TOTAL_ROUNDS = 5;

  useEffect(() => {
    loadRounds();
  }, []);

  const loadRounds = async () => {
    try {
      const all = await base44.entities.Image.list('-created_date', 300);
      const bots = all.filter(i => i.url && i.is_bot === true).sort(() => Math.random() - 0.5);
      const humans = all.filter(i => i.url && i.is_bot === false).sort(() => Math.random() - 0.5);

      if (bots.length < TOTAL_ROUNDS || humans.length < TOTAL_ROUNDS * 3) {
        onComplete(0);
        return;
      }

      const built = [];
      for (let i = 0; i < TOTAL_ROUNDS; i++) {
        const bot = bots[i];
        const humanSet = humans.slice(i * 3, i * 3 + 3);
        const insertAt = Math.floor(Math.random() * 4);
        const options = [];
        let h = 0;
        for (let j = 0; j < 4; j++) {
          if (j === insertAt) {
            options.push({ ...bot, is_bot: true });
          } else {
            options.push({ ...humanSet[h++], is_bot: false });
          }
        }
        built.push({ options, botIndex: insertAt });
      }
      setRounds(built);
      setPhase('playing');
    } catch (e) {
      onComplete(0);
    }
  };

  const handleSelect = (index) => {
    if (selected !== null) return;
    setSelected(index);
    const correct = index === rounds[currentRound].botIndex;
    const points = correct ? 200 : 0;
    setScore(s => s + points);

    setTimeout(() => {
      if (currentRound + 1 >= TOTAL_ROUNDS) {
        setPhase('done');
        onComplete(score + points);
      } else {
        setCurrentRound(r => r + 1);
        setSelected(null);
      }
    }, 1200);
  };

  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="text-center p-8">
        <div className="text-6xl mb-4">🎨</div>
        <h2 className="text-3xl font-bold text-white mb-2">Challenge Done!</h2>
        <div className="text-5xl font-black text-yellow-400 mb-4">{score}</div>
        <p className="text-green-400">{score / 200}/{TOTAL_ROUNDS} correct</p>
        <p className="text-xs text-zinc-500 mt-1">Find the AI-generated image</p>
      </div>
    );
  }

  const round = rounds[currentRound];
  if (!round) return null;

  return (
    <div className="w-full max-w-md mx-auto select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-yellow-400 font-bold">
          <Palette className="w-4 h-4" /> {score}pts
        </div>
        <div className="text-sm text-green-400">Round {currentRound + 1}/{TOTAL_ROUNDS}</div>
        <div className="text-sm text-purple-400">Easy</div>
      </div>

      <p className="text-center text-white font-bold mb-1">Which image is AI-generated?</p>
      <p className="text-center text-xs text-zinc-500 mb-4">One of these 4 was made by an AI. Spot it!</p>

      {/* 2×2 grid */}
      <div className="grid grid-cols-2 gap-3">
        {round.options.map((img, idx) => {
          const isSelected = selected === idx;
          const isBot = img.is_bot;
          const revealed = selected !== null;
          let border = 'border-zinc-700';
          if (revealed && isBot) border = 'border-green-400';
          else if (isSelected && !isBot) border = 'border-red-500';

          return (
            <motion.button
              key={idx}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleSelect(idx)}
              disabled={selected !== null}
              className={`relative rounded-xl overflow-hidden border-2 ${border} transition-all`}
            >
              <img src={img.url} alt="" className="w-full aspect-square object-cover" />
              <AnimatePresence>
                {revealed && isBot && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-green-500/60 flex items-center justify-center"
                  >
                    <span className="text-4xl">🤖</span>
                  </motion.div>
                )}
                {revealed && isSelected && !isBot && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-red-500/60 flex items-center justify-center"
                  >
                    <span className="text-4xl">✗</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}