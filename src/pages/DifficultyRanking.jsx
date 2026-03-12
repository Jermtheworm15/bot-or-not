import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Gauge, TrendingUp, BarChart2, RefreshCw } from 'lucide-react';

const difficultyColor = (r) => {
  if (r >= 9) return 'text-red-400';
  if (r >= 7) return 'text-orange-400';
  if (r >= 5) return 'text-yellow-400';
  if (r >= 3) return 'text-lime-400';
  return 'text-green-400';
};

const difficultyBadge = (r) => {
  if (r >= 9) return { text: 'Impossible', cls: 'bg-red-900/40 text-red-400 border-red-500/30' };
  if (r >= 7) return { text: 'Very Hard', cls: 'bg-orange-900/40 text-orange-400 border-orange-500/30' };
  if (r >= 5) return { text: 'Tricky', cls: 'bg-yellow-900/40 text-yellow-400 border-yellow-500/30' };
  if (r >= 3) return { text: 'Moderate', cls: 'bg-lime-900/40 text-lime-400 border-lime-500/30' };
  return { text: 'Easy', cls: 'bg-green-900/40 text-green-400 border-green-500/30' };
};

const SORT_OPTIONS = [
  { key: 'avg_desc', label: 'Most Difficult', icon: TrendingUp },
  { key: 'avg_asc', label: 'Easiest First', icon: BarChart2 },
  { key: 'votes_desc', label: 'Most Voted', icon: Gauge },
];

export default function DifficultyRanking() {
  const [rankings, setRankings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('avg_desc');

  useEffect(() => { loadRankings(); }, []);

  const loadRankings = async () => {
    setIsLoading(true);
    try {
      const [votes, images] = await Promise.all([
        base44.entities.ImageDifficultyVote.list('-created_date', 2000),
        base44.entities.Image.list('-created_date', 500),
      ]);

      // Aggregate votes by image_id
      const agg = {};
      for (const v of votes) {
        if (!v.image_id) continue;
        if (!agg[v.image_id]) agg[v.image_id] = { total: 0, count: 0 };
        agg[v.image_id].total += v.difficulty_rating || 0;
        agg[v.image_id].count++;
      }

      // Map images
      const imageMap = {};
      for (const img of images) imageMap[img.id] = img;

      const ranked = Object.entries(agg)
        .map(([id, data]) => ({
          image_id: id,
          image: imageMap[id],
          avg_rating: Math.round((data.total / data.count) * 10) / 10,
          vote_count: data.count,
        }))
        .filter(r => r.image?.url);

      setRankings(ranked);
    } catch (err) {
      console.log('Ranking load error:', err);
    }
    setIsLoading(false);
  };

  const sorted = [...rankings].sort((a, b) => {
    if (sortBy === 'avg_desc') return b.avg_rating - a.avg_rating;
    if (sortBy === 'avg_asc') return a.avg_rating - b.avg_rating;
    return b.vote_count - a.vote_count;
  });

  return (
    <div className="min-h-screen pb-32 max-w-2xl mx-auto px-4">
      {/* Header */}
      <div className="flex items-center justify-between mt-6 mb-5">
        <div className="flex items-center gap-3">
          <Gauge className="w-6 h-6 text-purple-400" />
          <h1 className="text-xl font-bold text-green-400 uppercase tracking-wider">Difficulty Rankings</h1>
        </div>
        <button
          onClick={loadRankings}
          disabled={isLoading}
          className="text-green-400/60 hover:text-green-400 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats strip */}
      {!isLoading && rankings.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: 'Images Rated', value: rankings.length },
            { label: 'Total Votes', value: rankings.reduce((s, r) => s + r.vote_count, 0) },
            {
              label: 'Avg Difficulty',
              value: (rankings.reduce((s, r) => s + r.avg_rating, 0) / rankings.length).toFixed(1),
            },
          ].map(s => (
            <div key={s.label} className="bg-black/40 border border-purple-500/20 rounded-xl p-2 text-center">
              <p className="text-green-400 font-bold text-lg">{s.value}</p>
              <p className="text-green-500/50 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sort tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {SORT_OPTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => setSortBy(s.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
              sortBy === s.key
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                : 'bg-black/40 border border-purple-500/20 text-green-400 hover:bg-purple-900/30'
            }`}
          >
            <s.icon className="w-3 h-3" />
            {s.label}
          </button>
        ))}
      </div>

      {/* Rankings list */}
      {isLoading ? (
        <div className="text-green-400/40 text-center py-20 uppercase tracking-widest text-sm">Loading…</div>
      ) : sorted.length === 0 ? (
        <div className="text-green-400/40 text-center py-20 text-sm">
          No difficulty ratings yet.<br />Play the game and rate some images!
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((item, idx) => {
            const badge = difficultyBadge(item.avg_rating);
            return (
              <div
                key={item.image_id}
                className="flex items-center gap-3 p-3 bg-black/40 border border-purple-500/20 rounded-xl hover:border-purple-500/40 transition-all"
              >
                {/* Rank */}
                <div className={`font-bold text-base w-7 text-center shrink-0 ${idx < 3 ? 'text-purple-400' : 'text-green-500/40'}`}>
                  #{idx + 1}
                </div>

                {/* Thumbnail */}
                <img
                  src={item.image?.url}
                  alt=""
                  className="w-14 h-14 object-cover rounded-lg border border-purple-500/20 shrink-0"
                  onError={e => { e.target.style.opacity = '0.3'; }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-2xl font-bold ${difficultyColor(item.avg_rating)}`}>
                      {item.avg_rating.toFixed(1)}
                    </span>
                    <span className="text-green-500/30 text-xs">/ 10</span>
                  </div>
                  <p className="text-green-500/40 text-xs">{item.vote_count} vote{item.vote_count !== 1 ? 's' : ''}</p>
                  <p className="text-green-500/30 text-xs truncate">
                    {item.image?.is_bot ? '🤖 Bot image' : '👤 Human image'}
                    {item.image?.source ? ` · ${item.image.source}` : ''}
                  </p>
                </div>

                {/* Badge */}
                <div className={`text-xs px-2 py-1 rounded-full font-bold border shrink-0 ${badge.cls}`}>
                  {badge.text}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}