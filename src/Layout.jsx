import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { Trophy, Upload, Flame, Eye, User, Users, Gamepad2, Wand2 } from 'lucide-react';
import TopShowcase from './components/TopShowcase';
import MatrixRain from './components/MatrixRain';
import LiveActivityFeed from './components/LiveActivityFeed';
import PendingChallenges from './components/challenges/PendingChallenges';

export default function Layout({ children, currentPageName }) {
  const [currentUser, setCurrentUser] = React.useState(null);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (err) {
        console.log('Auth error:', err);
      }
    };
    loadUser();
  }, []);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden pb-20">
      <div hidden>Creator: Jeromy Padgett</div>
    {currentUser && <PendingChallenges userEmail={currentUser.email} />}
    <LiveActivityFeed />
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap');

      * {
        font-family: 'Orbitron', sans-serif !important;
      }

      body, p, span, div, h1, h2, h3, h4, h5, h6, button, a, label, input, textarea {
        color: #22c55e !important;
        text-shadow: 
          0 0 10px rgba(34, 197, 94, 0.8),
          0 0 20px rgba(34, 197, 94, 0.6),
          0 0 30px rgba(34, 197, 94, 0.4),
          2px 2px 4px rgba(0, 0, 0, 0.8),
          4px 4px 8px rgba(0, 0, 0, 0.6) !important;
      }

      h1, h2, h3, .font-black, .font-bold {
        text-shadow: 
          0 0 15px rgba(34, 197, 94, 1),
          0 0 25px rgba(34, 197, 94, 0.8),
          0 0 35px rgba(34, 197, 94, 0.6),
          3px 3px 6px rgba(0, 0, 0, 0.9),
          6px 6px 12px rgba(0, 0, 0, 0.7),
          0 8px 16px rgba(34, 197, 94, 0.3) !important;
        letter-spacing: 0.05em !important;
      }

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
      
      {/* Matrix Rain Effect */}
      <MatrixRain />
      
      {/* Cyberpunk animated grid background */}
      <div className="fixed inset-0 cyberpunk-grid opacity-30 pointer-events-none" style={{ zIndex: 2 }} />
      
      {/* Gradient overlays */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-950/40 via-black to-green-950/40 pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-green-600/20 rounded-full blur-3xl pointer-events-none" />
      
      {/* Top Bar with Logo */}
      <div className="relative z-50 bg-black/60 backdrop-blur-md border-b border-purple-500/20 py-3">
        <div className="max-w-6xl mx-auto px-4 flex justify-end">
          <Link to={createPageUrl('Home')} className="flex items-center gap-2 text-white font-bold text-lg neon-text">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/50">
              <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
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
              to={createPageUrl('UserLeaderboard')}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-lg font-medium transition-all ${
                currentPageName === 'UserLeaderboard'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                  : 'text-green-400 hover:text-white hover:bg-purple-900/30'
              }`}
            >
              <Trophy className="w-5 h-5" />
              <span className="text-xs uppercase tracking-wide">Players</span>
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
            <Link
              to={createPageUrl('AITools')}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-lg font-medium transition-all ${
                currentPageName === 'AITools'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                  : 'text-green-400 hover:text-white hover:bg-purple-900/30'
              }`}
            >
              <Wand2 className="w-5 h-5" />
              <span className="text-xs uppercase tracking-wide">AI Tools</span>
            </Link>
            <Link
              to={createPageUrl('Achievements')}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-lg font-medium transition-all ${
                currentPageName === 'Achievements'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                  : 'text-green-400 hover:text-white hover:bg-purple-900/30'
              }`}
            >
              <Trophy className="w-5 h-5" />
              <span className="text-xs uppercase tracking-wide">Achieve</span>
            </Link>
            <Link
              to={createPageUrl('SideGames')}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-lg font-medium transition-all ${
                currentPageName === 'SideGames'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                  : 'text-green-400 hover:text-white hover:bg-purple-900/30'
              }`}
            >
              <Gamepad2 className="w-5 h-5" />
              <span className="text-xs uppercase tracking-wide">Games</span>
            </Link>
            <Link
              to={createPageUrl('Community')}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-lg font-medium transition-all ${
                currentPageName === 'Community'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                  : 'text-green-400 hover:text-white hover:bg-purple-900/30'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-xs uppercase tracking-wide">Board</span>
            </Link>
            <Link
              to={createPageUrl('Referrals')}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-lg font-medium transition-all ${
                currentPageName === 'Referrals'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                  : 'text-green-400 hover:text-white hover:bg-purple-900/30'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-xs uppercase tracking-wide">Refer</span>
            </Link>
            <Link
              to={createPageUrl('Profile')}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-lg font-medium transition-all ${
                currentPageName === 'Profile'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                  : 'text-green-400 hover:text-white hover:bg-purple-900/30'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-xs uppercase tracking-wide">Profile</span>
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