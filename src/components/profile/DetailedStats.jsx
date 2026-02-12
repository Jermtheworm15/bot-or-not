import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Target, TrendingUp, Zap, Trophy, BarChart3, Clock } from 'lucide-react';

export default function DetailedStats({ stats, profile }) {
  const statItems = [
    {
      icon: Target,
      label: 'Total Votes',
      value: stats.total,
      color: 'text-purple-400'
    },
    {
      icon: TrendingUp,
      label: 'Win Rate',
      value: `${stats.accuracy.toFixed(1)}%`,
      color: 'text-green-400'
    },
    {
      icon: Zap,
      label: 'Best Streak',
      value: profile?.perfect_streak,
      color: 'text-orange-400'
    },
    {
      icon: BarChart3,
      label: 'Correct Votes',
      value: stats.correct,
      color: 'text-emerald-400'
    },
    {
      icon: Trophy,
      label: 'Badges Earned',
      value: profile?.badges?.length || 0,
      color: 'text-amber-400'
    },
    {
      icon: Clock,
      label: 'Tier',
      value: profile?.tier || 'Bronze',
      color: 'text-pink-400'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {statItems.map((item, idx) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-zinc-800 rounded-lg p-4 border border-zinc-700 hover:border-purple-500/30 transition-colors"
          >
            <Icon className={`w-5 h-5 ${item.color} mb-2`} />
            <p className="text-2xl font-black text-white">{item.value}</p>
            <p className="text-xs text-zinc-400 mt-1">{item.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
}