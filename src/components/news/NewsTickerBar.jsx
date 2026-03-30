import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Radio } from 'lucide-react';

const CATEGORY_COLORS = {
  'model-release': 'text-violet-400',
  'funding': 'text-emerald-400',
  'regulation': 'text-amber-400',
  'research': 'text-sky-400',
  'product': 'text-pink-400',
  'acquisition': 'text-orange-400',
};

const FALLBACK_NEWS = [
  { headline: 'OpenAI raises $40B at $300B valuation', company: 'OpenAI', category: 'funding' },
  { headline: 'Google DeepMind launches Gemini 2.0 Ultra', company: 'Google', category: 'model-release' },
  { headline: 'EU AI Act enforcement begins across member states', company: 'EU', category: 'regulation' },
  { headline: 'Anthropic Claude 3.7 scores record on MMLU benchmark', company: 'Anthropic', category: 'research' },
  { headline: 'Meta releases Llama 4 as open-source model suite', company: 'Meta', category: 'model-release' },
  { headline: 'NVIDIA H200 GPUs sold out through Q3 2026', company: 'NVIDIA', category: 'product' },
  { headline: 'xAI Grok-3 integrates real-time X data feeds', company: 'xAI', category: 'product' },
  { headline: 'Figure humanoid robot completes unsupervised factory shift', company: 'Figure', category: 'research' },
  { headline: 'Humans average 50.2% on AI face detection — near random chance', company: 'Research', category: 'research' },
  { headline: 'Microsoft Copilot gains autonomous multi-step agent capabilities', company: 'Microsoft', category: 'product' },
];

export default function NewsTickerBar() {
  const [news, setNews] = useState(FALLBACK_NEWS);

  useEffect(() => {
    let cancelled = false;
    base44.functions.invoke('fetchAINews', {})
      .then(res => {
        if (!cancelled && res.data?.news?.length > 0) {
          setNews(res.data.news);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Duplicate for seamless loop
  const items = [...news, ...news];

  return (
    <div
      className="relative bg-zinc-950/98 border-b border-zinc-800 overflow-hidden"
      style={{ height: 34 }}
    >
      {/* "AI NEWS" badge — pinned left */}
      <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center gap-1.5 pl-3 pr-4 bg-zinc-950 border-r border-zinc-800">
        <Radio className="w-3 h-3 text-red-500 animate-pulse flex-shrink-0" />
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400 whitespace-nowrap">
          AI News
        </span>
      </div>

      {/* Scrolling content */}
      <div className="absolute left-[88px] right-0 top-0 bottom-0 flex items-center overflow-hidden">
        <div className="ticker-track flex items-center whitespace-nowrap">
          {items.map((item, i) => (
            <span key={i} className="flex items-center">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 flex-shrink-0 ${CATEGORY_COLORS[item.category] || 'text-zinc-500'}`}>
                {item.company}
              </span>
              <span className="text-[11px] text-zinc-300 pr-5 flex-shrink-0">
                {item.headline}
              </span>
              <span className="text-zinc-700 pr-5 text-[10px] flex-shrink-0">◆</span>
            </span>
          ))}
        </div>
      </div>

      <style>{`
        .ticker-track {
          animation: ticker-scroll 80s linear infinite;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}