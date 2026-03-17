import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const STEPS = [
  {
    emoji: '🤖',
    title: 'Welcome to Bot or Not!',
    body: "I'm B.O.T. — your personal guide to the game. I'll show you everything you need to know to start earning tokens and climbing the leaderboard.",
    cta: 'Let\'s go →',
  },
  {
    emoji: '👁️',
    title: 'The Core Game',
    body: 'You\'ll see images one at a time. Your job: decide if each one was created by a human or an AI. Tap 🧑 Human or 🤖 Bot. The faster and more accurately you guess, the more points you earn.',
    cta: 'Got it →',
  },
  {
    emoji: '🪙',
    title: 'Earning Tokens',
    body: 'Every correct vote earns you tokens. Build a streak of correct votes for bonus multipliers. Tokens unlock collectibles, let you enter tournaments, and boost your rank.',
    cta: 'Nice! →',
  },
  {
    emoji: '🏆',
    title: 'Tournaments',
    body: 'Enter tournaments to compete against other players. Spend tokens as entry fee, score the most correct votes in the round, and walk away with a prize pool. Check the Tournament Hub regularly.',
    cta: 'Cool →',
  },
  {
    emoji: '🕹️',
    title: 'Arcade Games',
    body: 'Need a break from voting? Head to the Arcade! Play retro games to earn extra tokens. Unlock special AI-themed games like Spot the Bot Blitz and Deepfake or Nah once you\'ve played 3 games.',
    cta: 'Awesome →',
  },
  {
    emoji: '🚀',
    title: 'You\'re Ready!',
    body: "That's everything! Start voting now to build your streak. Tap the 🤖 button in the corner any time to get quick help. Good luck!",
    cta: 'Start Playing!',
    isLast: true,
  },
];

const HELP_TOPICS = [
  {
    id: 'tokens',
    emoji: '🪙',
    question: 'How do I earn tokens?',
    answer: 'Vote correctly on images to earn tokens. Correct votes earn ~10 tokens. Build a streak of correct answers for a multiplier bonus. You also earn tokens from arcade games and tournament wins.',
  },
  {
    id: 'tournaments',
    emoji: '🏆',
    question: 'How do tournaments work?',
    answer: 'Tournaments cost tokens to enter. Players compete over a set period — whoever votes most accurately wins the prize pool. Check the Tournament Hub tab to browse active events and join.',
  },
  {
    id: 'collectibles',
    emoji: '🖼️',
    question: 'What are collectibles?',
    answer: 'Rare images you own as digital collectibles! When you upload or buy images, they go in your Collection. Their value is based on difficulty and vote count. Trade or sell them in the Marketplace.',
  },
  {
    id: 'accuracy',
    emoji: '🎯',
    question: 'How is accuracy calculated?',
    answer: 'Accuracy = (correct votes / total votes) × 100. It\'s split into Bot Accuracy (how well you spot AI images) and Human Accuracy (how well you spot real images). Both are shown on your Profile.',
  },
  {
    id: 'levelup',
    emoji: '⬆️',
    question: 'How do I level up?',
    answer: 'Earn XP points by voting, winning challenges, and completing achievements. Each level requires more points than the last. Higher levels unlock Bronze → Silver → Gold → Platinum tiers with better token multipliers.',
  },
];

const STORAGE_KEY = 'bot_guide_completed';

export default function BOTGuide({ totalVotes = null }) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [step, setStep] = useState(0);
  const [openTopic, setOpenTopic] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (completed) { setChecked(true); return; }
    // Auto-trigger for new users once we know their vote count
    if (totalVotes !== null) {
      if (totalVotes === 0) {
        setShowOnboarding(true);
      }
      setChecked(true);
    }
  }, [totalVotes]);

  const completeOnboarding = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setShowOnboarding(false);
  };

  const nextStep = () => {
    if (step >= STEPS.length - 1) {
      completeOnboarding();
    } else {
      setStep(s => s + 1);
    }
  };

  const prevStep = () => setStep(s => Math.max(0, s - 1));

  if (!checked && totalVotes === null) return null;

  return (
    <>
      {/* Floating B.O.T. button — only when onboarding is not active */}
      {!showOnboarding && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => { setShowHelp(h => !h); setOpenTopic(null); }}
          className="fixed bottom-36 left-4 z-50 w-13 h-13 w-12 h-12 rounded-full bg-gradient-to-br from-purple-700 to-green-700 border-2 border-green-400/50 shadow-lg shadow-purple-500/30 flex items-center justify-center text-2xl hover:scale-110 transition-transform"
          title="B.O.T. Help"
        >
          🤖
        </motion.button>
      )}

      {/* Help Menu */}
      <AnimatePresence>
        {showHelp && !showOnboarding && (
          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            className="fixed bottom-52 left-4 z-50 w-72 bg-zinc-900 border border-purple-500/40 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-900/60 to-zinc-900 border-b border-purple-500/20">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <div>
                  <p className="text-white font-bold text-sm">B.O.T. Help</p>
                  <p className="text-green-400/60 text-xs">Quick answers</p>
                </div>
              </div>
              <button onClick={() => setShowHelp(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Topics or expanded answer */}
            <div className="p-2 max-h-80 overflow-y-auto">
              <AnimatePresence mode="wait">
                {openTopic === null ? (
                  <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {HELP_TOPICS.map(topic => (
                      <button
                        key={topic.id}
                        onClick={() => setOpenTopic(topic.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-purple-900/30 transition-colors text-left group"
                      >
                        <span className="text-xl">{topic.emoji}</span>
                        <span className="text-sm text-green-400 group-hover:text-white transition-colors flex-1">{topic.question}</span>
                        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-purple-400" />
                      </button>
                    ))}
                    <div className="border-t border-zinc-800 mt-2 pt-2">
                      <button
                        onClick={() => { setShowHelp(false); setShowOnboarding(true); setStep(0); }}
                        className="w-full text-xs text-purple-400 hover:text-purple-300 py-2 text-center transition-colors"
                      >
                        Replay full tutorial →
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="answer" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                    <button onClick={() => setOpenTopic(null)} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white mb-3 px-1">
                      <ChevronLeft className="w-3 h-3" /> Back
                    </button>
                    {(() => {
                      const t = HELP_TOPICS.find(t => t.id === openTopic);
                      return (
                        <div className="px-3 pb-3">
                          <div className="text-3xl mb-2">{t.emoji}</div>
                          <p className="text-white font-bold text-sm mb-2">{t.question}</p>
                          <p className="text-green-400/80 text-xs leading-relaxed">{t.answer}</p>
                        </div>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Onboarding Modal */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-zinc-900 border border-purple-500/50 rounded-2xl p-8 max-w-sm w-full shadow-2xl shadow-purple-500/20 relative"
            >
              {/* Skip */}
              <button
                onClick={completeOnboarding}
                className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-400 text-xs"
              >
                Skip
              </button>

              {/* Step content */}
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">{STEPS[step].emoji}</div>
                <h2 className="text-2xl font-black text-white mb-3">{STEPS[step].title}</h2>
                <p className="text-green-400/80 text-sm leading-relaxed">{STEPS[step].body}</p>
              </div>

              {/* Progress dots */}
              <div className="flex justify-center gap-1.5 mb-6">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all ${i === step ? 'w-4 h-2 bg-purple-400' : 'w-2 h-2 bg-zinc-700'}`}
                  />
                ))}
              </div>

              {/* Navigation */}
              <div className="flex gap-3">
                {step > 0 && (
                  <button
                    onClick={prevStep}
                    className="px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white text-sm transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={nextStep}
                  className={`flex-1 py-3 rounded-xl font-bold text-white text-sm transition-all active:scale-95 ${
                    STEPS[step].isLast
                      ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
                  }`}
                >
                  {STEPS[step].cta}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}