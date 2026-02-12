import React from 'react';
import { motion } from 'framer-motion';
import BadgeDisplay from '@/components/gamification/BadgeDisplay';
import { Star, Lock } from 'lucide-react';

const ACHIEVEMENT_MILESTONES = [
  { badge: 'first_vote', title: 'First Step', description: 'Cast your first vote' },
  { badge: 'streak_5', title: 'On Fire', description: 'Achieve a 5-vote streak' },
  { badge: 'streak_10', title: 'Unstoppable', description: 'Achieve a 10-vote streak' },
  { badge: 'perfect_day', title: 'Perfect Day', description: 'Get 100% accuracy in a session' },
  { badge: 'collector', title: 'Collector', description: 'Upload 10 images' },
  { badge: 'social_butterfly', title: 'Social Butterfly', description: 'Refer 3 friends' },
];

export default function AchievementsShowcase({ earnedBadges = [] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <Star className="w-5 h-5 text-yellow-400" />
        Achievement Milestones
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {ACHIEVEMENT_MILESTONES.map((achievement) => {
          const isEarned = earnedBadges.includes(achievement.badge);
          
          return (
            <motion.div
              key={achievement.badge}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={isEarned ? { scale: 1.05 } : {}}
              className={`relative rounded-lg p-4 text-center border transition-all ${
                isEarned
                  ? 'bg-yellow-500/10 border-yellow-500/30 shadow-lg shadow-yellow-500/20'
                  : 'bg-zinc-800/50 border-zinc-700 opacity-50'
              }`}
            >
              {isEarned ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute top-1 right-1"
                >
                  <Star className="w-4 h-4 text-yellow-400" />
                </motion.div>
              ) : (
                <Lock className="absolute top-2 right-2 w-4 h-4 text-zinc-600" />
              )}
              
              <div className="text-2xl mb-1">🏆</div>
              <p className="font-bold text-sm text-white">{achievement.title}</p>
              <p className="text-xs text-zinc-400 mt-1">{achievement.description}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Earned Badges Display */}
      {earnedBadges.length > 0 && (
        <div className="mt-6 pt-4 border-t border-zinc-800">
          <h4 className="text-sm font-bold text-zinc-300 mb-3">All Badges</h4>
          <BadgeDisplay badges={earnedBadges} size="lg" />
        </div>
      )}
    </div>
  );
}