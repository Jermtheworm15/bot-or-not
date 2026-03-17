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

        const [allVotes, recentVotes] = await Promise.all([
          base44.entities.Vote.list('-created_date', 1),   // just for count metadata
          base44.entities.Vote.filter({ created_date: { $gte: weekISO } }),
        ]);

        // For total votes we use a large list and let the user see a rounded number
        const bigList = await base44.entities.Vote.list('-created_date', 5000);
        const uniqueActiveEmails = new Set(recentVotes.map(v => v.user_email).filter(Boolean));

        setStats({
          totalVotes: bigList.length,
          activeThisWeek: uniqueActiveEmails.size,
        });
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="flex items-center justify-center gap-3 flex-wrap px-4 py-2"
    >
      <div className="flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-700 rounded-full px-3 py-1.5 text-xs text-zinc-300">
        <span className="text-green-400 font-bold">{fmt(stats.totalVotes)}</span>
        <span>votes cast</span>
      </div>
      <div className="flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-700 rounded-full px-3 py-1.5 text-xs text-zinc-300">
        <span className="text-purple-400 font-bold">{fmt(stats.activeThisWeek)}</span>
        <span>active this week</span>
      </div>
      <div className="flex items-center gap-1.5 bg-zinc-900/80 border border-green-500/30 rounded-full px-3 py-1.5 text-xs text-green-400 font-bold">
        ✓ No ads. Free to play.
      </div>
    </motion.div>
  );
}