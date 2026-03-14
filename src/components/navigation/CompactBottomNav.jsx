import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Trophy, ShoppingCart, Users, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import SectionalMenu from './SectionalMenu';

export default function CompactBottomNav({ currentPageName }) {
  const [isOpen, setIsOpen] = useState(false);

  const quickAccess = [
    { path: '/BlitzMode', icon: Gamepad2, label: 'Games' },
    { path: '/UserLeaderboard', icon: Trophy, label: 'Rewards' },
    { path: '/Marketplace', icon: ShoppingCart, label: 'Market' },
    { path: '/SocialFeed', icon: Users, label: 'Social' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-t border-purple-500/30"
         style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0px)' }}>
      <div className="flex justify-around items-center h-16">
        {quickAccess.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center flex-1 h-full transition-all text-green-400 hover:text-white active:scale-95 cursor-pointer"
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}

        {/* Full Menu Toggle */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center flex-1 h-full transition-all text-purple-400 hover:text-white active:scale-95 cursor-pointer">
              <Menu className="w-5 h-5 mb-1" />
              <span className="text-xs">Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-black/95 border-purple-500/30 h-[80vh] overflow-y-auto">
            <div className="mt-4">
              <h2 className="text-xl font-bold text-white mb-4 px-4">Navigation</h2>
              <SectionalMenu currentPageName={currentPageName} isMobile={true} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}