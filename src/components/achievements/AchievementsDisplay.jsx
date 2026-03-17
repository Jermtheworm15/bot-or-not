import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Lock } from 'lucide-react';

const CATEGORY_META = {
  detection:   { label: 'Detection',    emoji: '🎯' },
  streaks:     { label: 'Streaks',      emoji: '🔥' },
  social:      { label: 'Social',       emoji: '👥' },
  tournament:  { label: 'Tournaments',  emoji: '🏆' },
  arcade:      { label: 'Arcade',       emoji: '🕹️' },
  collector:   { label: 'Collector',    emoji: '🖼️' },
  progression: { label: 'Progression',  emoji: '⬆️' },
};

const TIER_STYLE = {
  bronze:   'border-orange-700/60 shadow-orange-900/30',
  silver:   'border-zinc-400/60 shadow-zinc-400/20',
  gold:     'border-yellow-400/70 shadow-yellow-400/30',
  platinum: 'border-cyan-400/70 shadow-cyan-400/30',
  diamond:  'border-purple-400/80 shadow-purple-400/40',
};

export default function AchievementsDisplay({ userEmail }) {
  const [allAchievements, setAllAchievements] = useState([]);
  const [unlocked, setUnlocked] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    if (!userEmail) return;
    const load = async () => {
      const [achievs, userAchievs] = await Promise.all([
        base44.entities.Achievement.list(),
        base44.entities.UserAchievement.filter({ user_email: userEmail }),
      ]);
      setAllAchievements(achievs.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
      setUnlocked(new Set(userAchievs.map(u => u.achievement_id)));
      setLoading(false);
    };
    load();
  }, [userEmail]);

  const categories = ['all', ...Object.keys(CATEGORY_META)];

  const filtered = activeCategory === 'all'
    ? allAchievements
    : allAchievements.filter(a => a.category === activeCategory);

  const unlockedCount = filtered.filter(a => unlocked.has(a.achievement_id)).length;

  if (loading) return <div className="text-zinc-500 text-sm py-4 text-center">Loading achievements...</div>;

  return (
    <div>
      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {categories.map(cat => {
          const meta = CATEGORY_META[cat];
          const count = cat === 'all'
            ? allAchievements.filter(a => unlocked.has(a.achievement_id)).length
            : allAchievements.filter(a => a.category === cat && unlocked.has(a.achievement_id)).length;
          const total = cat === 'all' ? allAchievements.length : allAchievements.filter(a => a.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                activeCategory === cat
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-purple-500/50'
              }`}
            >
              {meta ? meta.emoji : '🏅'} {meta ? meta.label : 'All'}
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeCategory === cat ? 'bg-purple-500/50' : 'bg-zinc-700'}`}>
                {count}/{total}
              </span>
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-zinc-500 mb-1">
          <span>{unlockedCount} / {filtered.length} unlocked</span>
          <span>{filtered.length > 0 ? Math.round((unlockedCount / filtered.length) * 100) : 0}%</span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${filtered.length > 0 ? (unlockedCount / filtered.length) * 100 : 0}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
      </div>

      {/* Achievement grid */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
        {filtered.map((achievement, i) => {
          const isUnlocked = unlocked.has(achievement.achievement_id);
          return (
            <motion.div
              key={achievement.achievement_id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className="relative group"
              onMouseEnter={() => setTooltip(achievement.achievement_id)}
              onMouseLeave={() => setTooltip(null)}
            >
              <div className={`w-full aspect-square rounded-xl flex flex-col items-center justify-center border-2 shadow-lg transition-all cursor-pointer ${
                isUnlocked
                  ? `bg-gradient-to-br from-zinc-800 to-zinc-900 ${TIER_STYLE[achievement.tier] || TIER_STYLE.bronze} hover:scale-105`
                  : 'bg-zinc-900/50 border-zinc-800 opacity-40'
              }`}>
                <div className={`text-2xl mb-0.5 ${!isUnlocked ? 'grayscale' : ''}`}>
                  {isUnlocked ? achievement.icon || '🏅' : <Lock className="w-5 h-5 text-zinc-600" />}
                </div>
                <span className="text-[9px] text-zinc-400 text-center leading-tight px-1 line-clamp-2">
                  {isUnlocked ? achievement.name : '???'}
                </span>
              </div>

              {/* Tooltip */}
              <AnimatePresence>
                {tooltip === achievement.achievement_id && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-44 bg-zinc-900 border border-purple-500/40 rounded-lg p-2 shadow-xl pointer-events-none"
                  >
                    <p className="text-white font-bold text-xs mb-0.5">
                      {isUnlocked ? achievement.name : 'Locked'}
                    </p>
                    <p className="text-zinc-400 text-xs">
                      {isUnlocked ? achievement.description : 'Keep playing to unlock'}
                    </p>
                    {isUnlocked && achievement.token_reward > 0 && (
                      <p className="text-yellow-400 text-xs mt-1">🪙 +{achievement.token_reward} tokens</p>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        achievement.tier === 'diamond' ? 'bg-purple-800 text-purple-300' :
                        achievement.tier === 'platinum' ? 'bg-cyan-900 text-cyan-300' :
                        achievement.tier === 'gold' ? 'bg-yellow-900 text-yellow-300' :
                        achievement.tier === 'silver' ? 'bg-zinc-700 text-zinc-300' :
                        'bg-orange-900 text-orange-300'
                      }`}>{achievement.tier}</span>
                      <span className="text-zinc-600 text-xs">{CATEGORY_META[achievement.category]?.emoji} {CATEGORY_META[achievement.category]?.label}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}