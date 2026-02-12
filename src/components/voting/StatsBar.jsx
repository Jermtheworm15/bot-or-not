import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Zap } from 'lucide-react';

export default function StatsBar({ totalVotes, correctVotes, streak }) {
  const accuracy = totalVotes > 0 ? Math.round((correctVotes / totalVotes) * 100) : 0;
  
  return (
    <motion.div
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex justify-center gap-3 text-center"
    >
      <div className="flex items-center gap-1.5">
        <div className="p-1.5 rounded-lg bg-zinc-800">
          <Target className="w-3 h-3 text-blue-400" />
        </div>
        <div className="text-left min-w-fit">
          <p className="text-xs text-zinc-500 uppercase tracking-tight leading-tight">Accuracy</p>
          <p className="text-base font-bold text-white">{accuracy}%</p>
        </div>
      </div>
      
      <div className="flex items-center gap-1.5">
        <div className="p-1.5 rounded-lg bg-zinc-800">
          <TrendingUp className="w-3 h-3 text-emerald-400" />
        </div>
        <div className="text-left min-w-fit">
          <p className="text-xs text-zinc-500 uppercase tracking-tight leading-tight">Votes</p>
          <p className="text-base font-bold text-white">{totalVotes}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-1.5">
        <div className="p-1.5 rounded-lg bg-zinc-800">
          <Zap className="w-3 h-3 text-amber-400" />
        </div>
        <div className="text-left min-w-fit">
          <p className="text-xs text-zinc-500 uppercase tracking-tight leading-tight">Streak</p>
          <p className="text-base font-bold text-white">{streak}</p>
        </div>
      </div>
    </motion.div>
  );
}