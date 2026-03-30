import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Sparkles, Trophy, User, Menu, Rss } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import SectionalMenu from './SectionalMenu';

const NAV_ITEMS = [
  { path: '/Home',            icon: Home,     label: 'Home'    },
  { path: '/AIFeed',          icon: Rss,      label: 'AI Feed' },
  { path: '/UserLeaderboard', icon: Trophy,   label: 'Ranks'   },
  { path: '/Profile',         icon: User,     label: 'Profile' },
];

export default function CompactBottomNav({ currentPageName }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path || currentPageName === path.replace('/', '');

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-t border-purple-500/25 bottom-nav-safe"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)' }}
    >
      <div className="flex justify-around items-center h-[60px]">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all duration-200 min-w-0 ${
                active
                  ? 'text-violet-400'
                  : 'text-zinc-500 hover:text-zinc-300 active:scale-90'
              }`}
            >
              <div className={`relative flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200 ${
                active ? 'bg-violet-500/20' : ''
              }`}>
                <Icon className={`transition-all duration-200 ${active ? 'w-5 h-5' : 'w-5 h-5'}`} />
                {active && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-400" />
                )}
              </div>
              <span className={`text-[10px] font-medium tracking-wide leading-none ${active ? 'text-violet-400' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* More menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-zinc-500 hover:text-zinc-300 transition-all active:scale-90">
              <div className="flex items-center justify-center w-10 h-7 rounded-xl">
                <Menu className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium tracking-wide leading-none">More</span>
            </button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="bg-black/98 border-purple-500/30 rounded-t-2xl overflow-y-auto"
            style={{ maxHeight: '80vh', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
          >
            <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mt-2 mb-4" />
            <h2 className="text-lg font-bold text-white mb-3 px-4">Navigation</h2>
            <SectionalMenu currentPageName={currentPageName} isMobile={true} />
            <div className="h-4" />
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}