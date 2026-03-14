import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { Trophy, Upload, Flame, Eye, User, Users, Gamepad2, Wand2, Sparkles, Menu, X, ChevronLeft, MessageCircle, Home, Settings, LogOut, Gauge, ShoppingCart, Package, Wallet as WalletIcon, Repeat, Swords, BarChart3, Coins, Activity, Gift, Zap } from 'lucide-react';
import TopShowcase from './components/TopShowcase';
import MatrixRain from './components/MatrixRain';
import HieroglyphicRain from './components/HieroglyphicRain';
import LiveActivityFeed from './components/LiveActivityFeed';
import PendingChallenges from './components/challenges/PendingChallenges';
import ChatbotWindow from './components/chatbot/ChatbotWindow';
import BottomTabBar from './components/mobile/BottomTabBar';
import NotificationBell from './components/notifications/NotificationBell';
import LoginForm from './components/auth/LoginForm';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';

export default function Layout({ children, currentPageName }) {
  const [currentUser, setCurrentUser] = React.useState(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState(null);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        setIsAuthenticated(true);
      } catch (err) {
        console.log('Auth error:', err);
        setIsAuthenticated(false);
      }
    };
    checkAuth();
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

  // If not authenticated, redirect to Landing (except if already on Landing)
  React.useEffect(() => {
    if (isAuthenticated === false && currentPageName !== 'Landing' && currentPageName !== 'Onboarding') {
      navigate('/Landing');
    }
  }, [isAuthenticated, currentPageName, navigate]);

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-400">Loading...</div>
      </div>
    );
  }

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
                  <div className="flex items-center gap-3">
                    <Link to={createPageUrl('Profile')} className="text-green-400 hover:text-white transition-colors">
                      <Settings className="w-5 h-5" />
                    </Link>
                    <Sheet>
                      <SheetTrigger asChild>
                        <button className="text-green-400 hover:text-white transition-colors">
                          <Menu className="w-6 h-6" />
                        </button>
                      </SheetTrigger>
                      <SheetContent side="left" className="bg-black/95 border-purple-500/30 w-64 overflow-y-auto">
                        <div className="mt-8 space-y-2 pb-8">
                          <SheetClose asChild>
                            <Link to={createPageUrl('Home')} className="flex items-center gap-3 px-4 py-3 rounded-lg text-green-400 hover:bg-purple-900/30 hover:text-white transition-all">
                              <Eye className="w-5 h-5" /> Vote
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link to={createPageUrl('UserLeaderboard')} className="flex items-center gap-3 px-4 py-3 rounded-lg text-green-400 hover:bg-purple-900/30 hover:text-white transition-all">
                              <Trophy className="w-5 h-5" /> Leaderboard
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link to={createPageUrl('Upload')} className="flex items-center gap-3 px-4 py-3 rounded-lg text-green-400 hover:bg-purple-900/30 hover:text-white transition-all">
                              <Upload className="w-5 h-5" /> Upload
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link to={createPageUrl('AIChallenge')} className="flex items-center gap-3 px-4 py-3 rounded-lg text-green-400 hover:bg-purple-900/30 hover:text-white transition-all">
                              <Gamepad2 className="w-5 h-5" /> AI Battle
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link to="/BlitzMode" className="flex items-center gap-3 px-4 py-3 rounded-lg text-green-400 hover:bg-purple-900/30 hover:text-white transition-all">
                              <Zap className="w-5 h-5" /> Blitz Mode
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link to="/ArcadeHub" className="flex items-center gap-3 px-4 py-3 rounded-lg text-green-400 hover:bg-purple-900/30 hover:text-white transition-all">
                              <Gamepad2 className="w-5 h-5" /> Arcade
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link to={createPageUrl('Achievements')} className="flex items-center gap-3 px-4 py-3 rounded-lg text-green-400 hover:bg-purple-900/30 hover:text-white transition-all">
                              <Trophy className="w-5 h-5" /> Achievements
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link to={createPageUrl('Community')} className="flex items-center gap-3 px-4 py-3 rounded-lg text-green-400 hover:bg-purple-900/30 hover:text-white transition-all">
                              <Users className="w-5 h-5" /> Community
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link to={createPageUrl('Messages')} className="flex items-center gap-3 px-4 py-3 rounded-lg text-green-400 hover:bg-purple-900/30 hover:text-white transition-all">
                              <MessageCircle className="w-5 h-5" /> Messages
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link to={createPageUrl('Profile')} className="flex items-center gap-3 px-4 py-3 rounded-lg text-green-400 hover:bg-purple-900/30 hover:text-white transition-all">
                              <User className="w-5 h-5" /> Profile
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link to="/RewardHistory" className="flex items-center gap-3 px-4 py-3 rounded-lg text-green-400 hover:bg-purple-900/30 hover:text-white transition-all">
                              <Coins className="w-5 h-5" /> Rewards
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link to="/SocialFeed" className="flex items-center gap-3 px-4 py-3 rounded-lg text-green-400 hover:bg-purple-900/30 hover:text-white transition-all">
                              <Activity className="w-5 h-5" /> Social Feed
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link to="/DailyRewards" className="flex items-center gap-3 px-4 py-3 rounded-lg text-green-400 hover:bg-purple-900/30 hover:text-white transition-all">
                              <Gift className="w-5 h-5" /> Daily Rewards
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link to="/DifficultyRanking" className="flex items-center gap-3 px-4 py-3 rounded-lg text-green-400 hover:bg-purple-900/30 hover:text-white transition-all">
                              <Gauge className="w-5 h-5" /> Difficulty Ranks
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link to="/Marketplace" className="flex items-center gap-3 px-4 py-3 rounded-lg text-green-400 hover:bg-purple-900/30 hover:text-white transition-all">
                              <ShoppingCart className="w-5 h-5" /> Marketplace
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link to="/Collection" className="flex items-center gap-3 px-4 py-3 rounded-lg text-green-400 hover:bg-purple-900/30 hover:text-white transition-all">
                              <Package className="w-5 h-5" /> My Collection
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link to="/Wallet" className="flex items-center gap-3 px-4 py-3 rounded-lg text-green-400 hover:bg-purple-900/30 hover:text-white transition-all">
                              <WalletIcon className="w-5 h-5" /> Wallet
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link to="/Trades" className="flex items-center gap-3 px-4 py-3 rounded-lg text-green-400 hover:bg-purple-900/30 hover:text-white transition-all">
                              <Repeat className="w-5 h-5" /> Trades
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link to="/TournamentHub" className="flex items-center gap-3 px-4 py-3 rounded-lg text-green-400 hover:bg-purple-900/30 hover:text-white transition-all">
                              <Swords className="w-5 h-5" /> Tournaments
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link to="/CollectionAnalytics" className="flex items-center gap-3 px-4 py-3 rounded-lg text-green-400 hover:bg-purple-900/30 hover:text-white transition-all">
                              <BarChart3 className="w-5 h-5" /> Analytics
                            </Link>
                          </SheetClose>
                        </div>
                        {/* Bottom safe area for scrolling */}
                        <div className="h-20"></div>
                      </SheetContent>
                    </Sheet>
                            {currentUser && <NotificationBell />}
                            <Link to={createPageUrl('Messages')} className="hidden md:block">
                              <MessageCircle className="w-5 h-5 text-green-400 hover:text-white transition-colors cursor-pointer" />
                            </Link>
                            <button
                              onClick={() => {
                                base44.auth.logout(createPageUrl('Landing'));
                              }}
                              className="text-green-400 hover:text-white transition-colors"
                              title="Logout"
                            >
                              <LogOut className="w-5 h-5" />
                            </button>
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
              <div className="flex w-full">
              <Link to="/Home" className={`flex flex-1 flex-col items-center justify-center gap-1 py-3 font-medium transition-all ${currentPageName === 'Home' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50' : 'text-green-400 hover:text-white hover:bg-purple-900/30'}`}><Eye className="w-5 h-5" /><span className="text-xs uppercase tracking-wide">Vote</span></Link>
              <Link to="/Upload" className={`flex flex-1 flex-col items-center justify-center gap-1 py-3 font-medium transition-all ${currentPageName === 'Upload' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50' : 'text-green-400 hover:text-white hover:bg-purple-900/30'}`}><Upload className="w-5 h-5" /><span className="text-xs uppercase tracking-wide">Upload</span></Link>
              <Link to="/Marketplace" className={`flex flex-1 flex-col items-center justify-center gap-1 py-3 font-medium transition-all ${currentPageName === 'Marketplace' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50' : 'text-green-400 hover:text-white hover:bg-purple-900/30'}`}><ShoppingCart className="w-5 h-5" /><span className="text-xs uppercase tracking-wide">Market</span></Link>
              <Link to="/Collection" className={`flex flex-1 flex-col items-center justify-center gap-1 py-3 font-medium transition-all ${currentPageName === 'Collection' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50' : 'text-green-400 hover:text-white hover:bg-purple-900/30'}`}><Package className="w-5 h-5" /><span className="text-xs uppercase tracking-wide">Items</span></Link>
              <Link to="/TournamentHub" className={`flex flex-1 flex-col items-center justify-center gap-1 py-3 font-medium transition-all ${currentPageName === 'TournamentHub' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50' : 'text-green-400 hover:text-white hover:bg-purple-900/30'}`}><Swords className="w-5 h-5" /><span className="text-xs uppercase tracking-wide">Battle</span></Link>
              <Link to="/Profile" className={`flex flex-1 flex-col items-center justify-center gap-1 py-3 font-medium transition-all ${currentPageName === 'Profile' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50' : 'text-green-400 hover:text-white hover:bg-purple-900/30'}`}><User className="w-5 h-5" /><span className="text-xs uppercase tracking-wide">Profile</span></Link>
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