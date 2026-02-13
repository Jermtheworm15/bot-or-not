import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Trophy, Upload, Flame, Eye, User, Users, Gamepad2, Wand2, Sparkles, TrendingUp, MessageCircle } from 'lucide-react';

export default function MobileNav({ currentPageName }) {
  const [open, setOpen] = useState(false);

  const navItems = [
    { name: 'Analytics', icon: TrendingUp, label: 'Analytics' },
    { name: 'Home', icon: Eye, label: 'Vote' },
    { name: 'UserLeaderboard', icon: Trophy, label: 'Players' },
    { name: 'StreakLeaderboard', icon: Flame, label: 'Streaks' },
    { name: 'Upload', icon: Upload, label: 'Upload' },
    { name: 'AITools', icon: Wand2, label: 'AI Tools' },
    { name: 'Achievements', icon: Trophy, label: 'Achievements' },
    { name: 'AIChallenge', icon: Gamepad2, label: 'AI Battle' },
    { name: 'Community', icon: Users, label: 'Community Board' },
    { name: 'Referrals', icon: Users, label: 'Referrals' },
    { name: 'AttributeGame', icon: Sparkles, label: 'Attributes' },
    { name: 'AttributeLeaderboard', icon: Trophy, label: 'Attribute Rankings' },
    { name: 'Messages', icon: MessageCircle, label: 'Messages' },
    { name: 'CreateChallenge', icon: Gamepad2, label: 'Create Challenge' },
    { name: 'Profile', icon: User, label: 'Profile' },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="fixed top-20 left-4 z-50 w-12 h-12 rounded-full bg-black/80 backdrop-blur-md border-2 border-purple-500/30 text-green-400 hover:bg-purple-900/30 hover:text-white flex items-center justify-center shadow-lg transition-all">
          <Menu className="w-6 h-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="bg-black/95 backdrop-blur-md border-purple-500/30 w-72 overflow-y-auto">
        <div className="py-6">
          <h2 className="text-2xl font-bold text-green-400 mb-6 px-2">Navigation</h2>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.name;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.name)}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'text-green-400 hover:bg-purple-900/30 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}