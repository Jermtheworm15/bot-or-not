import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronRight } from 'lucide-react';

const SLIDES = [
  {
    emoji: '🤖',
    title: 'Can YOU Spot the Fake?',
    body: "Every image is either a real human — or AI-generated. Can you tell the difference? Millions can't.",
    accent: 'from-purple-500 to-violet-500',
    bg: 'from-violet-950/60 to-black',
  },
  {
    emoji: '🏆',
    title: 'Compete & Earn',
    body: 'Climb global leaderboards, win tournaments, collect tokens, and unlock exclusive badges.',
    accent: 'from-yellow-500 to-orange-500',
    bg: 'from-orange-950/40 to-black',
  },
  {
    emoji: '🎯',
    title: 'Play Free. Get Good.',
    body: 'No paywalls. No ads. Just pure skill-based gameplay that gets harder as you improve.',
    accent: 'from-green-500 to-emerald-500',
    bg: 'from-emerald-950/40 to-black',
    cta: true,
  },
];

export default function SplashScreen({ onComplete }) {
  const [slide, setSlide] = useState(0);
  const current = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;

  const next = () => {
    if (isLast) onComplete();
    else setSlide(s => s + 1);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${current.bg} text-white flex flex-col items-center justify-between p-6 pb-10`}>
      {/* Skip */}
      <div className="w-full flex justify-end pt-2">
        <button
          onClick={onComplete}
          className="text-zinc-500 hover:text-zinc-300 text-sm min-h-[44px] px-4 transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Slide content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.35 }}
          className="flex-1 flex flex-col items-center justify-center text-center max-w-xs mx-auto gap-6"
        >
          <div className="text-8xl leading-none select-none">{current.emoji}</div>
          <h1 className={`text-3xl font-black bg-gradient-to-r ${current.accent} bg-clip-text text-transparent leading-tight`}>
            {current.title}
          </h1>
          <p className="text-zinc-300 text-base leading-relaxed">{current.body}</p>
        </motion.div>
      </AnimatePresence>

      {/* Bottom controls */}
      <div className="w-full max-w-xs space-y-5">
        {/* Dots */}
        <div className="flex justify-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={`rounded-full transition-all min-h-[20px] ${
                i === slide ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-zinc-600'
              }`}
            />
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={next}
          className={`w-full min-h-[52px] rounded-2xl font-black text-lg text-white bg-gradient-to-r ${current.accent} shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2`}
        >
          {isLast ? (
            <>Start Playing <ArrowRight className="w-5 h-5" /></>
          ) : (
            <>Next <ChevronRight className="w-5 h-5" /></>
          )}
        </button>
      </div>
    </div>
  );
}