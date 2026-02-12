import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Trophy, Upload, Flame, Eye } from 'lucide-react';
import TopShowcase from './components/TopShowcase';

export default function Layout({ children, currentPageName }) {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden pb-20">
      <style>{`
        @keyframes gridMove {
          0% { transform: translateY(0); }
          100% { transform: translateY(60px); }
        }
        .cyberpunk-grid {
          background-image: 
            linear-gradient(rgba(147, 51, 234, 0.15) 2px, transparent 2px),
            linear-gradient(90deg, rgba(34, 197, 94, 0.15) 2px, transparent 2px);
          background-size: 60px 60px;
          animation: gridMove 2s linear infinite;
        }
        .neon-glow {
          box-shadow: 0 0 20px rgba(147, 51, 234, 0.5), 0 0 40px rgba(34, 197, 94, 0.3);
        }
        .neon-text {
          text-shadow: 0 0 10px rgba(147, 51, 234, 0.8), 0 0 20px rgba(147, 51, 234, 0.5);
        }
      `}</style>
      
      {/* Cyberpunk animated grid background */}
      <div className="fixed inset-0 cyberpunk-grid opacity-30 pointer-events-none" />
      
      {/* Gradient overlays */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-950/40 via-black to-green-950/40 pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-green-600/20 rounded-full blur-3xl pointer-events-none" />
      
      {/* Top Bar with Logo */}
      <div className="relative z-50 bg-black/60 backdrop-blur-md border-b border-purple-500/20 py-3">
        <div className="max-w-6xl mx-auto px-4 flex justify-end">
          <Link to={createPageUrl('Home')} className="flex items-center gap-2 text-white font-bold text-lg neon-text">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-purple-600 flex items-center justify-center shadow-lg shadow-red-500/50">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <span className="tracking-wider uppercase">Bot or Not</span>
          </Link>
        </div>
      </div>

      {/* Top Showcase */}
      <TopShowcase />

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-t-2 border-purple-500/30 neon-glow">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex justify-around gap-2">
            <Link
              to={createPageUrl('Home')}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-lg font-medium transition-all ${
                currentPageName === 'Home'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                  : 'text-green-400 hover:text-white hover:bg-purple-900/30'
              }`}
            >
              <Eye className="w-5 h-5" />
              <span className="text-xs uppercase tracking-wide">Vote</span>
            </Link>
            <Link
              to={createPageUrl('Leaderboard')}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-lg font-medium transition-all ${
                currentPageName === 'Leaderboard'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                  : 'text-green-400 hover:text-white hover:bg-purple-900/30'
              }`}
            >
              <Trophy className="w-5 h-5" />
              <span className="text-xs uppercase tracking-wide">Top 10</span>
            </Link>
            <Link
              to={createPageUrl('StreakLeaderboard')}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-lg font-medium transition-all ${
                currentPageName === 'StreakLeaderboard'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                  : 'text-green-400 hover:text-white hover:bg-purple-900/30'
              }`}
            >
              <Flame className="w-5 h-5" />
              <span className="text-xs uppercase tracking-wide">Streaks</span>
            </Link>
            <Link
              to={createPageUrl('Upload')}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-lg font-medium transition-all ${
                currentPageName === 'Upload'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                  : 'text-green-400 hover:text-white hover:bg-purple-900/30'
              }`}
            >
              <Upload className="w-5 h-5" />
              <span className="text-xs uppercase tracking-wide">Upload</span>
            </Link>
          </div>
        </div>
      </nav>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}