import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, RefreshCw, TrendingUp, BarChart2, Brain, Flame, Filter, Loader2 } from 'lucide-react';
import FeedCard from '@/components/aifeed/FeedCard';
import AIFeedCopilot from '@/components/aifeed/AIFeedCopilot';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const CATEGORIES = ['all', 'ai-models', 'hardware', 'regulation', 'robotics', 'research', 'funding'];
const TYPE_FILTERS = [
  { id: 'all', label: 'All', icon: Flame },
  { id: 'news', label: 'News', icon: TrendingUp },
  { id: 'prediction', label: 'Predict', icon: Zap },
  { id: 'poll', label: 'Poll', icon: BarChart2 },
  { id: 'challenge', label: 'Brain', icon: Brain },
];

function SentimentTrendChart({ items }) {
  const data = items
    .filter(i => typeof i.sentiment_score === 'number')
    .slice(0, 12)
    .reverse()
    .map((item, idx) => ({
      name: `${idx + 1}`,
      sentiment: Math.round((item.sentiment_score || 0) * 100),
      hype: item.hype_score || 0,
    }));

  if (data.length < 2) return null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4">
      <p className="text-xs font-bold text-zinc-400 mb-3 flex items-center gap-1">
        <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
        Live Sentiment & Hype Pulse
      </p>
      <ResponsiveContainer width="100%" height={100}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="name" hide />
          <YAxis hide domain={[-100, 100]} />
          <Tooltip
            contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 10 }}
            formatter={(v, name) => [name === 'sentiment' ? `${v > 0 ? '+' : ''}${v}%` : `${v}/10`, name === 'sentiment' ? 'Sentiment' : 'Hype']}
          />
          <Line type="monotone" dataKey="sentiment" stroke="#a855f7" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="hype" stroke="#f59e0b" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-1 text-[10px]">
        <span className="flex items-center gap-1 text-violet-400"><span className="w-4 h-0.5 bg-violet-500 inline-block" />Sentiment</span>
        <span className="flex items-center gap-1 text-amber-400"><span className="w-4 h-0.5 bg-amber-500 inline-block" />Hype</span>
      </div>
    </div>
  );
}

function PersonalInsightCard({ profile }) {
  if (!profile) return null;
  const botAcc = profile.bot_accuracy || 0;
  const humanAcc = profile.human_accuracy || 0;
  const weak = botAcc < humanAcc ? 'Bot Detection' : 'Human Detection';
  const strongPct = Math.max(botAcc, humanAcc).toFixed(0);
  const weakPct = Math.min(botAcc, humanAcc).toFixed(0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="bg-gradient-to-r from-violet-900/30 to-cyan-900/20 border border-violet-700/30 rounded-2xl p-4 mb-4">
      <p className="text-xs font-black text-white mb-2">⚡ Your AI Insight</p>
      <p className="text-xs text-zinc-300 leading-relaxed">
        You're strongest at <span className="text-emerald-400 font-bold">{botAcc >= humanAcc ? 'Bot' : 'Human'} Detection ({strongPct}%)</span>.
        Focus on improving <span className="text-amber-400 font-bold">{weak} ({weakPct}%)</span> to level up.
        You're Level <span className="text-violet-400 font-bold">{profile.level || 1}</span> with <span className="text-violet-400 font-bold">{(profile.points || 0).toLocaleString()}</span> pts.
      </p>
    </motion.div>
  );
}

export default function AIFeed() {
  const [feedItems, setFeedItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [behaviorLog, setBehaviorLog] = useState([]);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    init();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [feedItems, typeFilter, categoryFilter]);

  const init = async () => {
    const u = await base44.auth.me();
    setUser(u);
    const [items, profiles] = await Promise.all([
      base44.entities.FeedItem.filter({ is_active: true }),
      base44.entities.UserProfile.filter({ user_email: u.email })
    ]);

    let feed = items;
    if (items.length === 0) {
      // Auto-generate on first visit
      await generateFeed(true);
      return;
    }

    // Personalization: sort by engagement + user affinity
    if (profiles[0]) {
      setUserProfile(profiles[0]);
      const preferredCats = profiles[0].content_preferences?.preferred_categories || [];
      feed = items.sort((a, b) => {
        const aBoost = preferredCats.includes(a.category) ? 15 : 0;
        const bBoost = preferredCats.includes(b.category) ? 15 : 0;
        return (b.engagement_score + bBoost) - (a.engagement_score + aBoost);
      });
    }
    setFeedItems(feed);
    setLoading(false);
  };

  const applyFilters = () => {
    let f = feedItems;
    if (typeFilter !== 'all') f = f.filter(i => i.type === typeFilter);
    if (categoryFilter !== 'all') f = f.filter(i => i.category === categoryFilter);
    setFiltered(f);
  };

  const generateFeed = async (silent = false) => {
    if (!silent) setGenerating(true);
    else setLoading(true);
    await base44.functions.invoke('generateDailyFeed', {});
    const items = await base44.entities.FeedItem.filter({ is_active: true });
    setFeedItems(items);
    if (!silent) setGenerating(false);
    else setLoading(false);
  };

  // Track engagement and update personalization
  const handleEngaged = useCallback(async (item, dwellSeconds) => {
    if (!user) return;
    const log = [...behaviorLog, { category: item.category, type: item.type, dwell: dwellSeconds }];
    setBehaviorLog(log);

    // Update content preferences every 5 interactions
    if (log.length % 5 === 0 && userProfile) {
      const catCounts = {};
      log.forEach(l => { catCounts[l.category] = (catCounts[l.category] || 0) + 1; });
      const preferred_categories = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
      const avgDwell = log.reduce((a, b) => a + b.dwell, 0) / log.length;

      await base44.entities.UserProfile.update(userProfile.id, {
        content_preferences: {
          ...(userProfile.content_preferences || {}),
          preferred_categories,
          avg_dwell_seconds: Math.round(avgDwell),
          last_updated: new Date().toISOString()
        }
      });
    }

    // Increment item view count
    await base44.entities.FeedItem.update(item.id, {
      views: (item.views || 0) + 1,
      engagement_score: (item.engagement_score || 0) + Math.min(dwellSeconds, 10)
    }).catch(() => {});
  }, [user, userProfile, behaviorLog]);

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-3">
      <Brain className="w-10 h-10 text-violet-400 animate-pulse" />
      <p className="text-zinc-400 text-sm">Building your personalized AI feed...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-28">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/20 via-zinc-950 to-cyan-950/10 pointer-events-none" />
      <div className="relative z-10 max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />AI Intelligence Feed
            </h1>
            <p className="text-[11px] text-zinc-500">Personalized • Real-time • AI-powered</p>
          </div>
          <button onClick={() => generateFeed()} disabled={generating}
            className="flex items-center gap-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 text-violet-400 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Generating...' : 'Refresh AI'}
          </button>
        </div>

        {/* Type Filter pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {TYPE_FILTERS.map(f => {
            const Icon = f.icon;
            return (
              <button key={f.id} onClick={() => setTypeFilter(f.id)}
                className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  typeFilter === f.id
                    ? 'bg-violet-600 border-violet-500 text-white'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
                }`}>
                <Icon className="w-3 h-3" />{f.label}
              </button>
            );
          })}
        </div>

        {/* Category Filter */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategoryFilter(c)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize transition-all ${
                categoryFilter === c
                  ? 'bg-cyan-700 border-cyan-500 text-white'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}>
              {c === 'all' ? '🌐 All Topics' : c}
            </button>
          ))}
        </div>

        {/* Sentiment Chart */}
        <SentimentTrendChart items={feedItems} />

        {/* Personal Insight */}
        <PersonalInsightCard profile={userProfile} />

        {/* Feed Items */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Brain className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No items match your filter</p>
            <button onClick={() => { setTypeFilter('all'); setCategoryFilter('all'); }}
              className="mt-3 text-xs text-violet-400 underline">Clear filters</button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item, i) => (
              <FeedCard key={item.id} item={item} userEmail={user?.email} onEngaged={handleEngaged} />
            ))}
          </div>
        )}

        {/* Load more indicator */}
        {filtered.length > 0 && (
          <div className="text-center py-4">
            <button onClick={() => generateFeed()} disabled={generating}
              className="text-xs text-zinc-600 hover:text-violet-400 transition-colors flex items-center gap-1 mx-auto">
              {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              Generate fresh AI content
            </button>
          </div>
        )}
      </div>

      {/* AI Copilot */}
      <AIFeedCopilot userProfile={userProfile} feedItems={feedItems} />
    </div>
  );
}