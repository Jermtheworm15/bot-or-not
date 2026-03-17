import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Zap, Bot, User } from 'lucide-react';

export default function StatsBar({ totalVotes, correctVotes, streak, botAccuracy, humanAccuracy }) {
  const accuracy = totalVotes > 0 ? Math.round((correctVotes / totalVotes) * 100) : 0;
  
  return (
    <motion.div
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex justify-center gap-3 text-center flex-wrap"
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

      {botAccuracy !== undefined && (
        <div className="flex items-center gap-1.5">
          <div className="p-1.5 rounded-lg bg-zinc-800">
            <Bot className="w-3 h-3 text-red-400" />
          </div>
          <div className="text-left min-w-fit">
            <p className="text-xs text-zinc-500 uppercase tracking-tight leading-tight">Bot ID</p>
            <p className="text-base font-bold text-red-400">{Math.round(botAccuracy)}%</p>
          </div>
        </div>
      )}

      {humanAccuracy !== undefined && (
        <div className="flex items-center gap-1.5">
          <div className="p-1.5 rounded-lg bg-zinc-800">
            <User className="w-3 h-3 text-green-400" />
          </div>
          <div className="text-left min-w-fit">
            <p className="text-xs text-zinc-500 uppercase tracking-tight leading-tight">Human ID</p>
            <p className="text-base font-bold text-green-400">{Math.round(humanAccuracy)}%</p>
          </div>
        </div>
      )}
      
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