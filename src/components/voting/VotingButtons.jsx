import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User, HelpCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function VotingButtons({ onVote, disabled }) {
  return (
    <div className="flex gap-2 justify-center w-full max-w-2xl mx-auto">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex-1"
      >
        <Button
          onClick={() => onVote('bot')}
          disabled={disabled}
          className="w-full h-14 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-base gap-1 shadow-lg shadow-violet-500/30 transition-all duration-200"
        >
          <Bot className="w-5 h-5" />
          Bot
        </Button>
      </motion.div>
      
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex-1"
      >
        <Button
          onClick={() => onVote('human')}
          disabled={disabled}
          className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base gap-1 shadow-lg shadow-emerald-500/30 transition-all duration-200"
        >
          <User className="w-5 h-5" />
          Human
        </Button>
      </motion.div>

      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex-1"
      >
        <Button
          onClick={() => onVote('other')}
          disabled={disabled}
          className="w-full h-14 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-base gap-1 shadow-lg shadow-amber-500/30 transition-all duration-200"
        >
          <HelpCircle className="w-5 h-5" />
          Other
        </Button>
      </motion.div>
    </div>
  );
}