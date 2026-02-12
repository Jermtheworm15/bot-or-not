import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Bot, Trophy, Upload, Flame } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
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
      
      <nav className="relative z-50 bg-black/60 backdrop-blur-md border-b-2 border-purple-500/30 neon-glow">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl('Home')} className="flex items-center gap-2 text-white font-bold text-xl neon-text">
              <Bot className="w-6 h-6 text-purple-400" />
              <span className="tracking-wider uppercase">Bot or Not</span>
            </Link>
            <div className="flex gap-2">
              <Link
                to={createPageUrl('Home')}
                className={`px-4 py-2 rounded-lg font-medium transition-all uppercase tracking-wide ${
                  currentPageName === 'Home'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                    : 'text-green-400 hover:text-white hover:bg-purple-900/30 border border-transparent hover:border-purple-500/50'
                }`}
              >
                Vote
              </Link>
              <Link
                to={createPageUrl('Leaderboard')}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 uppercase tracking-wide ${
                  currentPageName === 'Leaderboard'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                    : 'text-green-400 hover:text-white hover:bg-purple-900/30 border border-transparent hover:border-purple-500/50'
                }`}
              >
                <Trophy className="w-4 h-4" />
                Top 10
              </Link>
              <Link
                to={createPageUrl('StreakLeaderboard')}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 uppercase tracking-wide ${
                  currentPageName === 'StreakLeaderboard'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                    : 'text-green-400 hover:text-white hover:bg-purple-900/30 border border-transparent hover:border-purple-500/50'
                }`}
              >
                <Flame className="w-4 h-4" />
                Streaks
              </Link>
              <Link
                to={createPageUrl('Upload')}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 uppercase tracking-wide ${
                  currentPageName === 'Upload'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                    : 'text-green-400 hover:text-white hover:bg-purple-900/30 border border-transparent hover:border-purple-500/50'
                }`}
              >
                <Upload className="w-4 h-4" />
                Upload
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}