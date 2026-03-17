import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Trophy, Crown, Sparkles, Zap, Shield } from 'lucide-react';

const TIER_CONFIGS = {
  bronze:   { color: 'from-orange-700 to-yellow-600',  glow: 'rgba(180,83,9,0.8)',   icon: Shield, label: 'Bronze' },
  silver:   { color: 'from-slate-400 to-gray-300',     glow: 'rgba(148,163,184,0.8)', icon: Star,   label: 'Silver' },
  gold:     { color: 'from-yellow-500 to-amber-400',   glow: 'rgba(245,158,11,0.8)', icon: Trophy,  label: 'Gold' },
  platinum: { color: 'from-purple-400 to-cyan-300',    glow: 'rgba(167,139,250,0.8)', icon: Crown,  label: 'Platinum' },
};

export default function LevelUpCelebration({ newLevel, newTier, onComplete }) {
  const config = TIER_CONFIGS[newTier] || TIER_CONFIGS.bronze;
  const Icon = config.icon;

  React.useEffect(() => {
    const timer = setTimeout(onComplete, 3500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
      >
        {/* Dark backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          className="absolute inset-0 bg-black"
        />

        {/* Main card */}
        <motion.div
          initial={{ scale: 0.2, opacity: 0, y: 60 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: -40 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className={`relative bg-gradient-to-br ${config.color} rounded-2xl p-8 shadow-2xl border-2 border-white/30 text-center max-w-xs mx-4`}
          style={{ boxShadow: `0 0 60px ${config.glow}, 0 0 120px ${config.glow}` }}
        >
          {/* Sparkle corner */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-4 -right-4"
          >
            <Sparkles className="w-8 h-8 text-yellow-300 drop-shadow-lg" />
          </motion.div>

          {/* Icon */}
          <motion.div
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 0.7, repeat: 3 }}
            className="flex justify-center mb-3"
          >
            <Icon className="w-16 h-16 text-white drop-shadow-lg" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/80 text-sm font-bold uppercase tracking-widest mb-1"
          >
            Level Up!
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="text-white font-black text-4xl mb-2"
          >
            Level {newLevel}
          </motion.h2>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="inline-block bg-white/20 rounded-full px-4 py-1 text-white font-bold text-sm"
          >
            {config.label} Tier
          </motion.div>

          {/* Burst particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              animate={{
                opacity: 0,
                x: Math.cos((i / 8) * Math.PI * 2) * 120,
                y: Math.sin((i / 8) * Math.PI * 2) * 120,
                scale: 0,
              }}
              transition={{ duration: 1.2, delay: 0.1 + i * 0.05 }}
              className="absolute top-1/2 left-1/2 w-3 h-3 bg-yellow-300 rounded-full"
            />
          ))}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}