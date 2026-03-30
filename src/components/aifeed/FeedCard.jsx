import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { TrendingUp, Zap, BarChart2, Brain, Flame, ThumbsUp, MessageCircle, Share2, ChevronRight } from 'lucide-react';

const CATEGORY_COLORS = {
  'ai-models': 'text-violet-400 bg-violet-900/30 border-violet-700/40',
  'hardware': 'text-cyan-400 bg-cyan-900/30 border-cyan-700/40',
  'regulation': 'text-amber-400 bg-amber-900/30 border-amber-700/40',
  'robotics': 'text-emerald-400 bg-emerald-900/30 border-emerald-700/40',
  'research': 'text-pink-400 bg-pink-900/30 border-pink-700/40',
  'funding': 'text-green-400 bg-green-900/30 border-green-700/40',
  'society': 'text-sky-400 bg-sky-900/30 border-sky-700/40',
};

const TYPE_META = {
  news: { icon: TrendingUp, label: 'AI News', color: 'text-blue-400' },
  prediction: { icon: Zap, label: 'Prediction', color: 'text-yellow-400' },
  poll: { icon: BarChart2, label: 'Poll', color: 'text-violet-400' },
  challenge: { icon: Brain, label: 'Challenge', color: 'text-pink-400' },
  insight: { icon: Flame, label: 'Insight', color: 'text-orange-400' },
};

function ScoreBar({ label, value, color }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-zinc-500 w-12">{label}</span>
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${(value / 10) * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <span className={`text-[10px] font-bold ${color.replace('bg-', 'text-')}`}>{value}/10</span>
    </div>
  );
}

export default function FeedCard({ item, userEmail, onEngaged }) {
  const [voted, setVoted] = useState(null);
  const [pollVotes, setPollVotes] = useState(item.poll_votes || {});
  const [reacted, setReacted] = useState(false);
  const [reactions, setReactions] = useState(item.reactions || 0);
  const [showAnswer, setShowAnswer] = useState(false);
  const cardRef = useRef(null);
  const dwellStart = useRef(Date.now());

  const meta = TYPE_META[item.type] || TYPE_META.news;
  const TypeIcon = meta.icon;
  const catStyle = CATEGORY_COLORS[item.category] || 'text-zinc-400 bg-zinc-800/50 border-zinc-700/40';
  const sentiment = item.sentiment_score || 0;
  const sentimentLabel = sentiment > 0.3 ? '🟢 Positive' : sentiment < -0.3 ? '🔴 Negative' : '🟡 Neutral';

  useEffect(() => {
    // Track dwell time when card unmounts
    return () => {
      const dwell = Math.round((Date.now() - dwellStart.current) / 1000);
      if (dwell > 2 && onEngaged) {
        onEngaged(item, dwell);
      }
    };
  }, []);

  const handlePollVote = async (option) => {
    if (voted) return;
    setVoted(option);
    const updated = { ...pollVotes, [option]: (pollVotes[option] || 0) + 1 };
    setPollVotes(updated);
    await base44.entities.FeedItem.update(item.id, {
      poll_votes: updated,
      reactions: reactions + 1
    });
    if (onEngaged) onEngaged(item, 5);
  };

  const handleReact = async () => {
    if (reacted) return;
    setReacted(true);
    const newCount = reactions + 1;
    setReactions(newCount);
    await base44.entities.FeedItem.update(item.id, { reactions: newCount });
  };

  const totalPollVotes = Object.values(pollVotes).reduce((a, b) => a + b, 0) || 1;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg bg-zinc-800`}>
            <TypeIcon className={`w-3.5 h-3.5 ${meta.color}`} />
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
          {item.category && (
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${catStyle}`}>
              {item.category}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-zinc-600">
          {item.source && <span>{item.source}</span>}
          <span>{sentimentLabel}</span>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pb-3">
        <h3 className="text-sm font-black text-white leading-snug mb-1.5">{item.title}</h3>
        <p className="text-xs text-zinc-400 leading-relaxed">{item.body}</p>
      </div>

      {/* Scores */}
      {(item.hype_score || item.impact_score) && (
        <div className="px-4 pb-3 space-y-1.5">
          {item.hype_score > 0 && <ScoreBar label="Hype" value={item.hype_score} color="bg-violet-500" />}
          {item.impact_score > 0 && <ScoreBar label="Impact" value={item.impact_score} color="bg-emerald-500" />}
        </div>
      )}

      {/* Poll Options */}
      {item.type === 'poll' && item.poll_options?.length > 0 && (
        <div className="px-4 pb-3 space-y-2">
          {item.poll_options.map(opt => {
            const pct = voted ? Math.round(((pollVotes[opt] || 0) / totalPollVotes) * 100) : null;
            return (
              <button key={opt} onClick={() => handlePollVote(opt)} disabled={!!voted}
                className={`w-full text-left relative overflow-hidden rounded-xl border px-3 py-2.5 transition-all text-xs font-bold ${
                  voted === opt
                    ? 'border-violet-500 bg-violet-900/40 text-violet-300'
                    : voted
                      ? 'border-zinc-700 bg-zinc-800/50 text-zinc-400'
                      : 'border-zinc-700 bg-zinc-800 hover:border-violet-600 hover:bg-violet-900/20 text-white'
                }`}>
                {voted && (
                  <motion.div
                    className="absolute inset-0 bg-violet-600/15 rounded-xl"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6 }}
                  />
                )}
                <span className="relative">{opt}</span>
                {voted && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-400 font-black">{pct}%</span>}
              </button>
            );
          })}
          {voted && <p className="text-[10px] text-zinc-600 text-center">{totalPollVotes} total votes</p>}
        </div>
      )}

      {/* Prediction */}
      {item.type === 'prediction' && (
        <div className="px-4 pb-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {(item.poll_options?.length ? item.poll_options : ['Yes ✅', 'No ❌']).map(opt => (
              <button key={opt} onClick={() => { setVoted(opt); setShowAnswer(true); }} disabled={!!voted}
                className={`py-3 rounded-xl text-xs font-black border transition-all ${
                  voted === opt
                    ? (opt === item.prediction_answer ? 'bg-emerald-900/60 border-emerald-500 text-emerald-300' : 'bg-red-900/60 border-red-500 text-red-300')
                    : 'bg-zinc-800 border-zinc-700 hover:border-yellow-600 hover:bg-yellow-900/20 text-white'
                }`}>{opt}</button>
            ))}
          </div>
          {showAnswer && item.prediction_answer && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`text-xs font-bold text-center px-3 py-2 rounded-xl ${voted === item.prediction_answer ? 'bg-emerald-900/40 text-emerald-300' : 'bg-red-900/40 text-red-300'}`}>
              {voted === item.prediction_answer ? '✅ Correct!' : `❌ Wrong — Answer: ${item.prediction_answer}`}
            </motion.p>
          )}
        </div>
      )}

      {/* Challenge */}
      {item.type === 'challenge' && (
        <div className="px-4 pb-3">
          <button onClick={() => setShowAnswer(v => !v)}
            className="w-full flex items-center justify-between px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs text-zinc-300 font-bold transition-colors">
            <span>🧠 Reveal Answer</span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showAnswer ? 'rotate-90' : ''}`} />
          </button>
          {showAnswer && item.prediction_answer && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 px-3 py-2 bg-violet-900/30 border border-violet-700/40 rounded-xl text-xs text-violet-300">
              {item.prediction_answer}
            </motion.div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
        <div className="flex items-center gap-1 text-[10px] text-zinc-600">
          {item.tags?.slice(0, 3).map(t => (
            <span key={t} className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">#{t}</span>
          ))}
        </div>
        <button onClick={handleReact}
          className={`flex items-center gap-1 text-xs transition-colors ${reacted ? 'text-emerald-400' : 'text-zinc-500 hover:text-emerald-400'}`}>
          <ThumbsUp className="w-3.5 h-3.5" />
          <span>{reactions}</span>
        </button>
      </div>
    </motion.div>
  );
}