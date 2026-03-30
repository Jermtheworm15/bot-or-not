import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Newspaper, Brain, Shield, Cpu, BookOpen, Globe, Zap } from 'lucide-react';

const NEWS_SOURCES = [
  { name: 'TechCrunch', url: 'https://techcrunch.com', category: 'Tech News', icon: '📰' },
  { name: 'The Verge', url: 'https://theverge.com', category: 'Tech News', icon: '📱' },
  { name: 'Wired', url: 'https://wired.com', category: 'Tech News', icon: '🔌' },
  { name: 'MIT Technology Review', url: 'https://technologyreview.com', category: 'Academic', icon: '🎓' },
  { name: 'VentureBeat', url: 'https://venturebeat.com', category: 'AI Business', icon: '💼' },
  { name: 'Bloomberg Technology', url: 'https://bloomberg.com/technology', category: 'Finance', icon: '📊' },
  { name: 'Reuters Technology', url: 'https://reuters.com/technology', category: 'News Wire', icon: '🌐' },
  { name: 'ArXiv AI Papers', url: 'https://arxiv.org/list/cs.AI/recent', category: 'Research', icon: '📄' },
  { name: 'Hacker News', url: 'https://news.ycombinator.com', category: 'Community', icon: '🔶' },
  { name: 'Ars Technica', url: 'https://arstechnica.com', category: 'Tech News', icon: '⚙️' },
  { name: 'The Information', url: 'https://theinformation.com', category: 'Enterprise', icon: '💡' },
  { name: 'CNBC Technology', url: 'https://cnbc.com/technology', category: 'Finance', icon: '📺' },
  { name: 'BBC Technology', url: 'https://bbc.com/news/technology', category: 'News Wire', icon: '🏛️' },
  { name: 'IEEE Spectrum', url: 'https://spectrum.ieee.org', category: 'Research', icon: '🔬' },
  { name: 'Nature Machine Intelligence', url: 'https://nature.com/natmachintell', category: 'Academic', icon: '🧬' },
  { name: 'Science Daily AI', url: 'https://sciencedaily.com/news/computers_math/artificial_intelligence', category: 'Academic', icon: '🔭' },
  { name: 'AI News (ainews.io)', url: 'https://ainews.io', category: 'AI Focused', icon: '🤖' },
  { name: 'Semafor Tech', url: 'https://semafor.com/tech-and-science', category: 'News Wire', icon: '📡' },
  { name: 'Fortune Technology', url: 'https://fortune.com/section/technology', category: 'Finance', icon: '💰' },
  { name: 'Forbes AI', url: 'https://forbes.com/ai', category: 'Finance', icon: '📈' },
  { name: 'Wall Street Journal Tech', url: 'https://wsj.com/tech', category: 'Finance', icon: '🗞️' },
  { name: 'Financial Times Tech', url: 'https://ft.com/technology', category: 'Finance', icon: '🏦' },
  { name: 'New York Times Tech', url: 'https://nytimes.com/section/technology', category: 'News Wire', icon: '🗽' },
  { name: 'The Guardian Tech', url: 'https://theguardian.com/technology', category: 'News Wire', icon: '🛡️' },
  { name: 'Washington Post Tech', url: 'https://washingtonpost.com/technology', category: 'News Wire', icon: '🏛️' },
  { name: 'Engadget', url: 'https://engadget.com', category: 'Tech News', icon: '📲' },
  { name: 'ZDNet', url: 'https://zdnet.com', category: 'Enterprise', icon: '💻' },
  { name: 'Business Insider Tech', url: 'https://businessinsider.com/tech', category: 'Finance', icon: '📉' },
  { name: 'Platformer', url: 'https://platformer.news', category: 'AI Focused', icon: '🧩' },
  { name: 'Stratechery', url: 'https://stratechery.com', category: 'Analysis', icon: '🎯' },
];

const RESEARCH_BENCHMARKS = [
  { name: 'NIST FRVT', description: 'Face Recognition Vendor Testing — official US government face recognition benchmark', url: 'https://pages.nist.gov/frvt/html/frvt11.html' },
  { name: 'Papers With Code', description: 'ML benchmarks and state-of-the-art results across all domains', url: 'https://paperswithcode.com' },
  { name: 'Stanford HAI', description: 'Stanford Human-Centered AI Institute annual AI index report', url: 'https://hai.stanford.edu' },
  { name: 'MIT Media Lab', description: 'Deepfake and synthetic media detection research', url: 'https://media.mit.edu' },
  { name: 'AI Index Report', description: 'Annual Stanford AI Index — comprehensive AI progress tracking', url: 'https://aiindex.stanford.edu' },
  { name: 'Nightingale & Farid 2022', description: 'Humans struggle to detect synthetic faces — landmark study on AI face detection', url: 'https://doi.org/10.1073/pnas.2120481119' },
  { name: 'Groh et al. 2022', description: 'Deepfake detection by humans vs. machines — MIT/Brown study', url: 'https://doi.org/10.1145/3491102.3517446' },
];

const CATEGORY_COLORS = {
  'Tech News': 'bg-blue-900/40 border-blue-700/40 text-blue-300',
  'Academic': 'bg-violet-900/40 border-violet-700/40 text-violet-300',
  'AI Focused': 'bg-emerald-900/40 border-emerald-700/40 text-emerald-300',
  'Finance': 'bg-amber-900/40 border-amber-700/40 text-amber-300',
  'Research': 'bg-pink-900/40 border-pink-700/40 text-pink-300',
  'News Wire': 'bg-sky-900/40 border-sky-700/40 text-sky-300',
  'Community': 'bg-orange-900/40 border-orange-700/40 text-orange-300',
  'Enterprise': 'bg-zinc-800/60 border-zinc-600/40 text-zinc-300',
  'Analysis': 'bg-purple-900/40 border-purple-700/40 text-purple-300',
};

const categories = [...new Set(NEWS_SOURCES.map(s => s.category))];

export default function About() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-28">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/20 via-zinc-950 to-emerald-950/10 pointer-events-none" />
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Hero */}
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center">
          <h1 className="text-3xl md:text-4xl font-black mb-3 flex items-center justify-center gap-3">
            <Brain className="w-8 h-8 text-violet-400" />Bot or Not
          </h1>
          <p className="text-zinc-400 max-w-xl mx-auto text-sm leading-relaxed">
            A real-time AI perception benchmark. We measure humanity's ability to detect AI-generated faces
            against peer-reviewed academic standards — and track how that gap widens every year.
          </p>
        </motion.div>

        {/* Mission */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Shield className="w-4 h-4 text-violet-400" />Our Mission</CardTitle></CardHeader>
          <CardContent className="text-sm text-zinc-400 leading-relaxed space-y-2">
            <p>
              Synthetic media — AI-generated faces, deepfakes, voice clones — are proliferating faster than humans can detect them.
              Studies show the average person now performs at near-random chance (51%) when trying to identify an AI-generated face.
            </p>
            <p>
              Bot or Not trains and benchmarks human perception at scale. Every vote contributes to a living dataset that measures
              collective human AI-detection ability over time, comparable to the NIST FRVT and Stanford AI Index.
            </p>
          </CardContent>
        </Card>

        {/* News Sources */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-violet-400" />Daily News & Intelligence Sources
            <Badge className="bg-violet-900/50 border border-violet-700/50 text-violet-300 text-xs ml-2">{NEWS_SOURCES.length} Sources</Badge>
          </h2>
          <p className="text-xs text-zinc-500 mb-4">Our news ticker pulls real-time headlines from these publications daily via AI aggregation with internet access.</p>

          {/* Category legend */}
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map(cat => (
              <span key={cat} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[cat] || 'bg-zinc-800 text-zinc-400'}`}>{cat}</span>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {NEWS_SOURCES.map((source, i) => (
              <motion.a
                key={i}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl px-3 py-2 transition-colors group"
              >
                <span className="text-lg">{source.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate group-hover:text-violet-300 transition-colors">{source.name}</p>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${CATEGORY_COLORS[source.category] || 'bg-zinc-800 text-zinc-400'}`}>
                  {source.category}
                </span>
                <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400 flex-shrink-0" />
              </motion.a>
            ))}
          </div>
        </div>

        {/* Research Benchmarks */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-violet-400" />Research & Academic Benchmarks
          </h2>
          <div className="space-y-2">
            {RESEARCH_BENCHMARKS.map((r, i) => (
              <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                className="flex items-start gap-3 bg-zinc-900 border border-zinc-800 hover:border-violet-700/50 rounded-xl p-3 transition-colors group">
                <BookOpen className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors">{r.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{r.description}</p>
                </div>
                <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400 flex-shrink-0 mt-0.5" />
              </a>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Cpu className="w-4 h-4 text-violet-400" />Platform</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            {[
              { label: 'Images in Pool', value: '3,000+', color: 'text-violet-400' },
              { label: 'News Sources', value: '30+', color: 'text-emerald-400' },
              { label: 'Daily Updates', value: '28 Headlines', color: 'text-sky-400' },
              { label: 'Benchmark Data', value: '7 Studies', color: 'text-amber-400' },
            ].map((s, i) => (
              <div key={i} className="bg-zinc-800/50 rounded-xl p-3">
                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}