import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { Trophy, Upload, Flame, Eye, User, Users, Gamepad2, Wand2, Sparkles, Menu, X, ChevronLeft, MessageCircle } from 'lucide-react';
import TopShowcase from './components/TopShowcase';
import MatrixRain from './components/MatrixRain';
import HieroglyphicRain from './components/HieroglyphicRain';
import LiveActivityFeed from './components/LiveActivityFeed';
import PendingChallenges from './components/challenges/PendingChallenges';
import ChatbotWindow from './components/chatbot/ChatbotWindow';
import BottomTabBar from './components/mobile/BottomTabBar';
import NotificationBell from './components/notifications/NotificationBell';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function Layout({ children, currentPageName }) {
  const [currentUser, setCurrentUser] = React.useState(null);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const navigate = useNavigate();

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

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    // Load Google Picker API
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('picker', { callback: () => {} });
    };
    document.head.appendChild(script);
  }, []);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden overflow-x-hidden pb-20">
      <div hidden>Creator: Jeromy Padgett</div>
    {!isMobile && currentUser && <PendingChallenges userEmail={currentUser.email} />}
    {!isMobile && <ChatbotWindow />}
    {!isMobile && <LiveActivityFeed />}
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

      {/* Hieroglyphic Rain Effect */}
      <HieroglyphicRain />
      
      {/* Cyberpunk animated grid background */}
      <div className="fixed inset-0 cyberpunk-grid opacity-30 pointer-events-none top-0 left-0 w-screen h-screen" style={{ zIndex: 3 }} />
      
      {/* Gradient overlays */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-950/40 via-black to-green-950/40 pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-green-600/20 rounded-full blur-3xl pointer-events-none" />
      
      {/* Top Bar with Logo */}
      <div className="relative z-50 bg-black/60 backdrop-blur-md border-b border-purple-500/20 py-3">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <Link to={createPageUrl('Home')} className="flex items-center gap-2 text-white font-bold text-lg neon-text">
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shadow-lg shadow-purple-500/50">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698d8f79de41b00a2a2dd6e3/60edcef10_d5e77535-5a3b-4139-8a3f-6489d39444dc.jpg" 
                alt="Bot or Not Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <span className="tracking-wider uppercase">Bot or Not</span>
          </Link>
          <div className="flex items-center gap-2">
                    {currentUser && <NotificationBell />}
                    <Link to={createPageUrl('Messages')} className="hidden md:block">
                      <MessageCircle className="w-5 h-5 text-green-400 hover:text-white transition-colors cursor-pointer" />
                    </Link>
                  </div>
        </div>
      </div>

      {/* Top Showcase */}
      <TopShowcase />

      {/* Bottom Navigation - Desktop */}
        {!isMobile && (
          <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-t-2 border-purple-500/30 neon-glow"
               style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0px)' }}>
            <div className="w-full px-2 py-3">
              <div className="flex gap-1 overflow-x-auto pb-2" style={{ scrollBehavior: 'smooth' }}>
              <Link to={createPageUrl('Home')} className={`flex-shrink-0 flex flex-col items-center gap-1 py-2 px-3 rounded-lg font-medium transition-all whitespace-nowrap ${currentPageName === 'Home' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50' : 'text-green-400 hover:text-white hover:bg-purple-900/30'}`}><Eye className="w-5 h-5" /><span className="text-xs uppercase tracking-wide">Vote</span></Link>
              <Link to={createPageUrl('UserLeaderboard')} className={`flex-shrink-0 flex flex-col items-center gap-1 py-2 px-3 rounded-lg font-medium transition-all whitespace-nowrap ${currentPageName === 'UserLeaderboard' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50' : 'text-green-400 hover:text-white hover:bg-purple-900/30'}`}><Trophy className="w-5 h-5" /><span className="text-xs uppercase tracking-wide">Players</span></Link>
              <Link to={createPageUrl('StreakLeaderboard')} className={`flex-shrink-0 flex flex-col items-center gap-1 py-2 px-3 rounded-lg font-medium transition-all whitespace-nowrap ${currentPageName === 'StreakLeaderboard' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50' : 'text-green-400 hover:text-white hover:bg-purple-900/30'}`}><Flame className="w-5 h-5" /><span className="text-xs uppercase tracking-wide">Streaks</span></Link>
              <Link to={createPageUrl('Upload')} className={`flex-shrink-0 flex flex-col items-center gap-1 py-2 px-3 rounded-lg font-medium transition-all whitespace-nowrap ${currentPageName === 'Upload' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50' : 'text-green-400 hover:text-white hover:bg-purple-900/30'}`}><Upload className="w-5 h-5" /><span className="text-xs uppercase tracking-wide">Upload</span></Link>
              <Link to={createPageUrl('AITools')} className={`flex-shrink-0 flex flex-col items-center gap-1 py-2 px-3 rounded-lg font-medium transition-all whitespace-nowrap ${currentPageName === 'AITools' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50' : 'text-green-400 hover:text-white hover:bg-purple-900/30'}`}><Wand2 className="w-5 h-5" /><span className="text-xs uppercase tracking-wide">AI Tools</span></Link>
              <Link to={createPageUrl('Achievements')} className={`flex-shrink-0 flex flex-col items-center gap-1 py-2 px-3 rounded-lg font-medium transition-all whitespace-nowrap ${currentPageName === 'Achievements' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50' : 'text-green-400 hover:text-white hover:bg-purple-900/30'}`}><Trophy className="w-5 h-5" /><span className="text-xs uppercase tracking-wide">Achieve</span></Link>
              <Link to={createPageUrl('AIChallenge')} className={`flex-shrink-0 flex flex-col items-center gap-1 py-2 px-3 rounded-lg font-medium transition-all whitespace-nowrap ${currentPageName === 'AIChallenge' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50' : 'text-green-400 hover:text-white hover:bg-purple-900/30'}`}><Gamepad2 className="w-5 h-5" /><span className="text-xs uppercase tracking-wide">AI Battle</span></Link>
              <Link to={createPageUrl('Community')} className={`flex-shrink-0 flex flex-col items-center gap-1 py-2 px-3 rounded-lg font-medium transition-all whitespace-nowrap ${currentPageName === 'Community' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50' : 'text-green-400 hover:text-white hover:bg-purple-900/30'}`}><Users className="w-5 h-5" /><span className="text-xs uppercase tracking-wide">Board</span></Link>
              <Link to={createPageUrl('Referrals')} className={`flex-shrink-0 flex flex-col items-center gap-1 py-2 px-3 rounded-lg font-medium transition-all whitespace-nowrap ${currentPageName === 'Referrals' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50' : 'text-green-400 hover:text-white hover:bg-purple-900/30'}`}><Users className="w-5 h-5" /><span className="text-xs uppercase tracking-wide">Refer</span></Link>
              <Link to={createPageUrl('AttributeGame')} className={`flex-shrink-0 flex flex-col items-center gap-1 py-2 px-3 rounded-lg font-medium transition-all whitespace-nowrap ${currentPageName === 'AttributeGame' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50' : 'text-green-400 hover:text-white hover:bg-purple-900/30'}`}><Sparkles className="w-5 h-5" /><span className="text-xs uppercase tracking-wide">Attrbt</span></Link>
              <Link to={createPageUrl('AttributeLeaderboard')} className={`flex-shrink-0 flex flex-col items-center gap-1 py-2 px-3 rounded-lg font-medium transition-all whitespace-nowrap ${currentPageName === 'AttributeLeaderboard' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50' : 'text-green-400 hover:text-white hover:bg-purple-900/30'}`}><Trophy className="w-5 h-5" /><span className="text-xs uppercase tracking-wide">AttrRank</span></Link>
              <Link to={createPageUrl('Messages')} className={`flex-shrink-0 flex flex-col items-center gap-1 py-2 px-3 rounded-lg font-medium transition-all whitespace-nowrap ${currentPageName === 'Messages' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50' : 'text-green-400 hover:text-white hover:bg-purple-900/30'}`}><MessageCircle className="w-5 h-5" /><span className="text-xs uppercase tracking-wide">Messages</span></Link>
              <Link to={createPageUrl('CreateChallenge')} className={`flex-shrink-0 flex flex-col items-center gap-1 py-2 px-3 rounded-lg font-medium transition-all whitespace-nowrap ${currentPageName === 'CreateChallenge' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50' : 'text-green-400 hover:text-white hover:bg-purple-900/30'}`}><Gamepad2 className="w-5 h-5" /><span className="text-xs uppercase tracking-wide">Challenge</span></Link>
              <Link to={createPageUrl('Profile')} className={`flex-shrink-0 flex flex-col items-center gap-1 py-2 px-3 rounded-lg font-medium transition-all whitespace-nowrap ${currentPageName === 'Profile' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50' : 'text-green-400 hover:text-white hover:bg-purple-900/30'}`}><User className="w-5 h-5" /><span className="text-xs uppercase tracking-wide">Profile</span></Link>
            </div>
          </div>
        </nav>
      )}

      {/* Mobile Bottom Tab Bar */}
      {isMobile && (
        <BottomTabBar currentPageName={currentPageName} />
      )}
      <div className="relative z-10 pb-20 md:pb-0" style={{ paddingBottom: 'max(calc(5rem + env(safe-area-inset-bottom, 0px)), 5rem)' }}>
        {children}
      </div>
    </div>
  );
}