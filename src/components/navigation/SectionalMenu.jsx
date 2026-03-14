import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Gamepad2, Trophy, ShoppingCart, Users, Zap, Swords, Target, Coins, Gift, Award, WalletIcon, Repeat, Package, Activity, MessageCircle, User as UserIcon, Search, Upload as UploadIcon } from 'lucide-react';
import { SheetClose } from '@/components/ui/sheet';

const menuSections = [
  {
    title: 'Core',
    icon: Gamepad2,
    items: [
      { label: 'Home', path: '/Home', icon: Gamepad2 },
      { label: 'Upload Image', path: '/Upload', icon: UploadIcon },
    ]
  },
  {
    title: 'Games',
    icon: Gamepad2,
    items: [
      { label: 'Arcade Hub', path: '/ArcadeHub', icon: Gamepad2 },
      { label: 'Blitz Mode', path: '/BlitzMode', icon: Zap },
      { label: 'Tournaments', path: '/TournamentHub', icon: Swords },
      { label: 'AI Battle', path: '/AIChallenge', icon: Target },
    ]
  },
  {
    title: 'Rewards',
    icon: Trophy,
    items: [
      { label: 'Leaderboard', path: '/UserLeaderboard', icon: Trophy },
      { label: 'Achievements', path: '/Achievements', icon: Award },
      { label: 'Rewards', path: '/RewardHistory', icon: Coins },
      { label: 'Daily Rewards', path: '/DailyRewards', icon: Gift },
    ]
  },
  {
    title: 'Marketplace',
    icon: ShoppingCart,
    items: [
      { label: 'Marketplace', path: '/Marketplace', icon: ShoppingCart },
      { label: 'Wallet', path: '/Wallet', icon: WalletIcon },
      { label: 'Trades', path: '/Trades', icon: Repeat },
      { label: 'My Collection', path: '/Collection', icon: Package },
    ]
  },
  {
    title: 'Social Network',
    icon: Users,
    items: [
      { label: 'Social Feed', path: '/SocialFeed', icon: Activity },
      { label: 'Messages', path: '/Messages', icon: MessageCircle },
      { label: 'Community', path: '/Community', icon: Users },
      { label: 'Find Players', path: '/ProfileSearch', icon: Search },
      { label: 'Profile', path: '/Profile', icon: UserIcon },
    ]
  },
];

export default function SectionalMenu({ currentPageName, isMobile = false }) {
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (title) => {
    setExpandedSection(expandedSection === title ? null : title);
  };

  // Check if current page is in a section
  const isPageInSection = (section) => {
    return section.items.some(item => {
      const pagePath = item.path.replace('/', '');
      return pagePath === currentPageName || item.path === `/${currentPageName}`;
    });
  };

  return (
    <div className="space-y-1">
      {menuSections.map((section) => {
        const SectionIcon = section.icon;
        const isExpanded = expandedSection === section.title || isPageInSection(section);
        const isActive = isPageInSection(section);

        return (
          <div key={section.title}>
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.title)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all cursor-pointer ${
                isActive 
                  ? 'bg-purple-900/40 text-white' 
                  : 'text-green-400 hover:bg-purple-900/20 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <SectionIcon className="w-5 h-5" />
                <span className="font-semibold">{section.title}</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>

            {/* Submenu Items */}
            {isExpanded && (
              <div className="ml-4 mt-1 space-y-1 border-l-2 border-purple-500/20 pl-2">
                {section.items.map((item) => {
                  const ItemIcon = item.icon;
                  const pagePath = item.path.replace('/', '');
                  const isItemActive = pagePath === currentPageName || item.path === `/${currentPageName}`;

                  return (
                    <SheetClose key={item.path} asChild>
                      <Link
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                          isItemActive
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                            : 'text-green-400 hover:bg-purple-900/20 hover:text-white'
                        }`}
                      >
                        <ItemIcon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SheetClose>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}