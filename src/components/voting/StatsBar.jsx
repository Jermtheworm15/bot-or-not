import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Zap, Bot, User } from 'lucide-react';

function StatChip({ icon: Icon, iconColor, label, value, valueColor = 'text-white' }) {
  return (
    <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800/80 rounded-2xl px-3 py-2 backdrop-blur-sm">
      <div className={`p-1 rounded-lg bg-zinc-800/80 ${iconColor}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="text-left leading-tight">
        <p className="text-[10px] text-zinc-500 uppercase tracking-wide font-medium">{label}</p>
        <p className={`text-sm font-bold ${valueColor}`}>{value}</p>
      </div>
    </div>
  );
}

export default function StatsBar({ totalVotes, correctVotes, streak, botAccuracy, humanAccuracy }) {
  const accuracy = totalVotes > 0 ? Math.round((correctVotes / totalVotes) * 100) : 0;

  return (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="flex flex-wrap justify-center gap-2 px-2"
    >
      <StatChip icon={Target}     iconColor="text-blue-400"    label="Accuracy"  value={`${accuracy}%`} />
      <StatChip icon={TrendingUp} iconColor="text-emerald-400" label="Votes"     value={totalVotes} />
      <StatChip icon={Zap}        iconColor="text-amber-400"   label="Streak"    value={streak} valueColor={streak >= 3 ? 'text-amber-300' : 'text-white'} />
      {botAccuracy !== undefined && (
        <StatChip icon={Bot}  iconColor="text-rose-400"    label="Bot ID"   value={`${Math.round(botAccuracy)}%`}   valueColor="text-rose-300" />
      )}
      {humanAccuracy !== undefined && (
        <StatChip icon={User} iconColor="text-green-400"   label="Human ID" value={`${Math.round(humanAccuracy)}%`} valueColor="text-green-300" />
      )}
    </motion.div>
  );
}