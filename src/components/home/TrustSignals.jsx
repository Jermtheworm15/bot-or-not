import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';

export default function TrustSignals() {
  const [stats, setStats] = useState({ totalVotes: null, activeThisWeek: null });

  useEffect(() => {
    const load = async () => {
      try {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekISO = weekAgo.toISOString();
        const [bigList, recentVotes] = await Promise.all([
          base44.entities.Vote.list('-created_date', 5000),
          base44.entities.Vote.filter({ created_date: { $gte: weekISO } }),
        ]);
        const uniqueActive = new Set(recentVotes.map(v => v.user_email).filter(Boolean));
        setStats({ totalVotes: bigList.length, activeThisWeek: uniqueActive.size });
      } catch (_) {}
    };
    load();
  }, []);

  const fmt = (n) => {
    if (n === null) return '…';
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K+`;
    return `${n}+`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="flex items-center justify-center gap-2 flex-wrap px-3 py-1.5"
    >
      <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 rounded-full px-3 py-1 text-[11px] text-zinc-400 backdrop-blur-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
        <span className="font-bold text-green-400">{fmt(stats.totalVotes)}</span>
        <span>votes</span>
      </div>
      <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 rounded-full px-3 py-1 text-[11px] text-zinc-400 backdrop-blur-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse inline-block" />
        <span className="font-bold text-purple-400">{fmt(stats.activeThisWeek)}</span>
        <span>playing</span>
      </div>
      <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-green-500/30 rounded-full px-3 py-1 text-[11px] text-green-400 font-semibold backdrop-blur-sm">
        ✓ Free · No Ads
      </div>
    </motion.div>
  );
}