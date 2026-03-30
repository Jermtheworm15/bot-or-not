import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Radio, TrendingUp } from 'lucide-react';

const CATEGORY_COLORS = {
  'model-release': 'text-violet-400',
  'funding': 'text-emerald-400',
  'regulation': 'text-amber-400',
  'research': 'text-sky-400',
  'product': 'text-pink-400',
  'acquisition': 'text-orange-400',
};

const FALLBACK_NEWS = [
  { headline: 'NVIDIA H200 demand surges as AI training scales globally', company: 'NVIDIA', category: 'product', ticker: 'NVDA' },
  { headline: 'Microsoft Copilot gains autonomous multi-step agent capabilities', company: 'Microsoft', category: 'product', ticker: 'MSFT' },
  { headline: 'Google DeepMind Gemini 2.0 Ultra sets new benchmark records', company: 'Google', category: 'model-release', ticker: 'GOOGL' },
  { headline: 'Meta Llama 4 released as open-source multimodal suite', company: 'Meta', category: 'model-release', ticker: 'META' },
  { headline: 'Tesla Optimus robot completes unsupervised factory tasks', company: 'Tesla', category: 'research', ticker: 'TSLA' },
  { headline: 'AMD MI300X GPU challenges NVIDIA dominance in AI clusters', company: 'AMD', category: 'product', ticker: 'AMD' },
  { headline: 'OpenAI raises $40B at $300B valuation from SoftBank', company: 'OpenAI', category: 'funding', ticker: null },
  { headline: 'EU AI Act enforcement begins across all member states', company: 'EU', category: 'regulation', ticker: null },
  { headline: 'Anthropic Claude 3.7 scores highest ever on reasoning evals', company: 'Anthropic', category: 'research', ticker: null },
  { headline: 'Palantir AIP platform deployed across 300 enterprise clients', company: 'Palantir', category: 'product', ticker: 'PLTR' },
  { headline: 'Apple Intelligence on-device models expand to 50 languages', company: 'Apple', category: 'product', ticker: 'AAPL' },
  { headline: 'Oracle CloudWorld AI infrastructure investment hits $40B', company: 'Oracle', category: 'funding', ticker: 'ORCL' },
];

function TickerItem({ item }) {
  const color = CATEGORY_COLORS[item.category] || 'text-zinc-500';
  const stockUrl = item.ticker
    ? `https://finance.yahoo.com/quote/${item.ticker}`
    : null;

  return (
    <span className="flex items-center flex-shrink-0">
      {/* Company label */}
      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 flex-shrink-0 ${color}`}>
        {item.company}
      </span>

      {/* Headline */}
      <span className="text-[11px] text-zinc-200 pr-3 flex-shrink-0">
        {item.headline}
      </span>

      {/* Stock ticker badge — clickable */}
      {item.ticker && (
        <a
          href={stockUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="flex items-center gap-0.5 bg-emerald-950/80 border border-emerald-700/50 rounded px-1.5 py-0.5 mr-4 hover:bg-emerald-900/80 hover:border-emerald-500 transition-colors cursor-pointer flex-shrink-0"
          title={`View ${item.ticker} on Yahoo Finance`}
        >
          <TrendingUp className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" />
          <span className="text-[9px] font-bold text-emerald-400 tracking-wider ml-0.5">{item.ticker}</span>
        </a>
      )}

      {/* Separator */}
      <span className="text-zinc-700 pr-5 text-[10px] flex-shrink-0">◆</span>
    </span>
  );
}

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

  // Duplicate for seamless infinite loop
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
            <TickerItem key={i} item={item} />
          ))}
        </div>
      </div>

      <style>{`
        .ticker-track {
          animation: ticker-scroll 160s linear infinite;
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