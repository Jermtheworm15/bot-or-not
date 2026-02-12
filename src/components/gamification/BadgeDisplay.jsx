import React from 'react';
import { motion } from 'framer-motion';
import { Award, Zap, Target, Crown, Star, Flame, Trophy, Shield } from 'lucide-react';

const BADGES = {
  'first_vote': { name: 'First Step', icon: Star, color: 'text-blue-400', description: 'Cast your first vote' },
  'streak_5': { name: 'On Fire', icon: Flame, color: 'text-orange-400', description: '5 correct in a row' },
  'streak_10': { name: 'Unstoppable', icon: Zap, color: 'text-yellow-400', description: '10 correct in a row' },
  'voter_100': { name: 'Centurion', icon: Target, color: 'text-purple-400', description: '100 total votes' },
  'accuracy_90': { name: 'Sharp Eye', icon: Award, color: 'text-green-400', description: '90% accuracy' },
  'daily_champion': { name: 'Daily Champion', icon: Crown, color: 'text-amber-400', description: 'Complete daily challenge' },
  'leaderboard_top10': { name: 'Elite', icon: Trophy, color: 'text-cyan-400', description: 'Reach top 10' },
  'accuracy_master': { name: 'Accuracy Master', icon: Target, color: 'text-green-500', description: '90%+ accuracy' },
  'vote_veteran': { name: 'Vote Veteran', icon: Award, color: 'text-yellow-500', description: '100+ votes cast' },
  'challenge_champion': { name: 'Challenge Champion', icon: Trophy, color: 'text-purple-500', description: 'Completed 10 challenges' },
  'speed_demon': { name: 'Speed Demon', icon: Zap, color: 'text-cyan-500', description: 'Lightning fast decisions' },
  'daily_warrior': { name: 'Daily Warrior', icon: Shield, color: 'text-red-500', description: '7 day voting streak' }
};

export default function BadgeDisplay({ badges, size = 'md' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };
  
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };
  
  if (!badges || badges.length === 0) {
    return (
      <div className="text-zinc-500 text-sm text-center py-4">
        No badges earned yet. Complete challenges to earn badges!
      </div>
    );
  }
  
  return (
    <div className="flex flex-wrap gap-3">
      {badges.map((badgeId, index) => {
        const badge = BADGES[badgeId];
        if (!badge) return null;
        
        const Icon = badge.icon;
        
        return (
          <motion.div
            key={badgeId}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="group relative"
          >
            <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border-2 border-purple-500/50 flex items-center justify-center shadow-lg hover:shadow-xl hover:border-purple-400 transition-all cursor-pointer`}>
              <Icon className={`${iconSizes[size]} ${badge.color}`} />
            </div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-900 border border-purple-500/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              <p className="text-white font-semibold text-xs">{badge.name}</p>
              <p className="text-zinc-400 text-xs">{badge.description}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}