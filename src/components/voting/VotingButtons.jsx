import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import { playSound } from '@/components/audio/SoundEffects';

export default function VotingButtons({ onVote, disabled }) {
  return (
    <div className="flex gap-3 w-full max-w-md mx-auto px-1">
      {/* Bot Button */}
      <motion.button
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => {
          if (disabled) return;
          playSound.click();
          onVote(true);
        }}
        disabled={disabled}
        className="
          flex-1 flex items-center justify-center gap-2.5
          min-h-[64px] rounded-2xl
          bg-gradient-to-br from-violet-600 to-violet-800
          hover:from-violet-500 hover:to-violet-700
          text-white font-bold text-lg
          shadow-lg shadow-violet-900/50
          border border-violet-500/40
          disabled:opacity-40 disabled:cursor-not-allowed
          transition-all duration-150
          active:shadow-none
        "
        style={{ minHeight: 64 }}
      >
        <Bot className="w-6 h-6 flex-shrink-0" />
        <span className="tracking-wide">BOT</span>
      </motion.button>

      {/* Human Button */}
      <motion.button
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => {
          if (disabled) return;
          playSound.click();
          onVote(false);
        }}
        disabled={disabled}
        className="
          flex-1 flex items-center justify-center gap-2.5
          min-h-[64px] rounded-2xl
          bg-gradient-to-br from-emerald-600 to-emerald-800
          hover:from-emerald-500 hover:to-emerald-700
          text-white font-bold text-lg
          shadow-lg shadow-emerald-900/50
          border border-emerald-500/40
          disabled:opacity-40 disabled:cursor-not-allowed
          transition-all duration-150
          active:shadow-none
        "
        style={{ minHeight: 64 }}
      >
        <User className="w-6 h-6 flex-shrink-0" />
        <span className="tracking-wide">HUMAN</span>
      </motion.button>
    </div>
  );
}