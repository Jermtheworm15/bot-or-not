import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, TrendingUp, Upload, Award, Zap } from 'lucide-react';
import ClickableUsername from './community/ClickableUsername';

export default function LiveActivityFeed() {
  const [currentActivity, setCurrentActivity] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Subscribe to real-time activity updates
    const unsubscribe = base44.entities.Activity.subscribe((event) => {
      if (event.type === 'create' && event.data.action_type !== 'streak') {
        setCurrentActivity(event.data);
        setIsVisible(true);
        
        // Auto-hide after 4 seconds
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 4000);
        
        return () => clearTimeout(timer);
      }
    });

    return unsubscribe;
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'streak': return <Flame className="w-4 h-4 text-orange-400" />;
      case 'level_up': return <TrendingUp className="w-4 h-4 text-purple-400" />;
      case 'badge_earned': return <Award className="w-4 h-4 text-yellow-400" />;
      case 'challenge_complete': return <Trophy className="w-4 h-4 text-green-400" />;
      case 'upload': return <Upload className="w-4 h-4 text-blue-400" />;
      default: return <Zap className="w-4 h-4 text-green-400" />;
    }
  };

  if (!isVisible || !currentActivity) return null;

  return (
    <div className="fixed bottom-24 right-4 z-40">
      <AnimatePresence mode="wait">
        {isVisible && currentActivity && (
          <motion.div
            key={currentActivity.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-black/80 backdrop-blur-md border border-purple-500/30 rounded-xl p-4 shadow-2xl w-80"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{getIcon(currentActivity.action_type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">
                  <ClickableUsername 
                    username={currentActivity.username || 'User'}
                    userEmail={currentActivity.user_email}
                  />
                </p>
                <p className="text-sm text-zinc-400 truncate">
                  {currentActivity.description}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}