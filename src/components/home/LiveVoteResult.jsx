import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

export default function LiveVoteResult({ imageId, isBot, isVisible }) {
  const [votes, setVotes] = useState(null);

  useEffect(() => {
    if (!imageId || !isVisible) return;
    base44.entities.Vote.filter({ image_id: imageId }).then(allVotes => {
      const botVotes = allVotes.filter(v => v.guessed_bot).length;
      const humanVotes = allVotes.length - botVotes;
      setVotes({ bot: botVotes, human: humanVotes, total: allVotes.length });
    }).catch(() => {});
  }, [imageId, isVisible]);

  if (!isVisible || !votes || votes.total === 0) return null;

  const botPct = Math.round((votes.bot / votes.total) * 100);
  const humanPct = 100 - botPct;
  const crowdCorrect = isBot ? votes.bot > votes.human : votes.human > votes.bot;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 mt-2"
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
          <Users className="w-3 h-3" />Community voted ({votes.total} people)
        </p>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${crowdCorrect ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
          Crowd was {crowdCorrect ? '✅ right' : '❌ wrong'}
        </span>
      </div>
      <div className="flex gap-2 items-center">
        <span className="text-[10px] text-violet-300 w-16">🤖 {botPct}%</span>
        <div className="flex-1 h-2.5 bg-zinc-800 rounded-full overflow-hidden flex">
          <motion.div className="h-full bg-violet-500" initial={{ width: 0 }} animate={{ width: `${botPct}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} />
          <motion.div className="h-full bg-emerald-500" initial={{ width: 0 }} animate={{ width: `${humanPct}%` }} transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }} />
        </div>
        <span className="text-[10px] text-emerald-300 w-16 text-right">👤 {humanPct}%</span>
      </div>
    </motion.div>
  );
}