import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Eye, Trophy, ShoppingCart, Package, User, Upload } from 'lucide-react';
import { playSound } from '@/components/audio/SoundEffects';

export default function BottomTabBar({ currentPageName }) {
  const tabItems = [
    { name: 'Home', icon: Eye, label: 'Vote' },
    { name: 'Upload', icon: Upload, label: 'Upload' },
    { name: 'Marketplace', icon: ShoppingCart, label: 'Market' },
    { name: 'Collection', icon: Package, label: 'Items' },
    { name: 'Profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-t border-purple-500/30 md:hidden"
         style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0px)' }}>
      <div className="flex justify-around items-center h-20">
        {tabItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPageName === item.name;
          return (
            <Link
              key={item.name}
              to={`/${item.name}`}
              onClick={() => playSound.click()}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
                isActive
                  ? 'text-purple-400 bg-purple-900/30'
                  : 'text-green-400 hover:text-white'
              }`}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}