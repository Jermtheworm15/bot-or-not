import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Zap } from 'lucide-react';

export default function StatsBar({ totalVotes, correctVotes, streak }) {
  const accuracy = totalVotes > 0 ? Math.round((correctVotes / totalVotes) * 100) : 0;
  
  return (
    <motion.div
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex justify-center gap-6 text-center"
    >
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-xl bg-zinc-800">
          <Target className="w-4 h-4 text-blue-400" />
        </div>
        <div className="text-left">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Accuracy</p>
          <p className="text-lg font-bold text-white">{accuracy}%</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-xl bg-zinc-800">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="text-left">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Votes</p>
          <p className="text-lg font-bold text-white">{totalVotes}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-xl bg-zinc-800">
          <Zap className="w-4 h-4 text-amber-400" />
        </div>
        <div className="text-left">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Streak</p>
          <p className="text-lg font-bold text-white">{streak}</p>
        </div>
      </div>
    </motion.div>
  );
}