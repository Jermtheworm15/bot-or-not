import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Bot, Trophy, Upload, Flame } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  return (
    <div className="min-h-screen bg-zinc-950">
      <nav className="bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl('Home')} className="flex items-center gap-2 text-white font-bold text-xl">
              <Bot className="w-6 h-6 text-violet-500" />
              Bot or Not
            </Link>
            <div className="flex gap-2">
              <Link
                to={createPageUrl('Home')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPageName === 'Home'
                    ? 'bg-violet-600 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                Vote
              </Link>
              <Link
                to={createPageUrl('Leaderboard')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  currentPageName === 'Leaderboard'
                    ? 'bg-violet-600 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <Trophy className="w-4 h-4" />
                Top 10
              </Link>
              <Link
                to={createPageUrl('StreakLeaderboard')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  currentPageName === 'StreakLeaderboard'
                    ? 'bg-violet-600 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <Flame className="w-4 h-4" />
                Streaks
              </Link>
              <Link
                to={createPageUrl('Upload')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  currentPageName === 'Upload'
                    ? 'bg-violet-600 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <Upload className="w-4 h-4" />
                Upload
              </Link>
            </div>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}