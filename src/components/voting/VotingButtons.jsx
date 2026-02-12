import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function VotingButtons({ onVote, disabled }) {
  return (
    <div className="flex gap-4 justify-center w-full max-w-md mx-auto">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex-1"
      >
        <Button
          onClick={() => onVote(true)}
          disabled={disabled}
          className="w-full h-16 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-lg gap-3 shadow-lg shadow-violet-500/30 transition-all duration-200"
        >
          <Bot className="w-6 h-6" />
          Bot
        </Button>
      </motion.div>
      
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex-1"
      >
        <Button
          onClick={() => onVote(false)}
          disabled={disabled}
          className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg gap-3 shadow-lg shadow-emerald-500/30 transition-all duration-200"
        >
          <User className="w-6 h-6" />
          Human
        </Button>
      </motion.div>
    </div>
  );
}