import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, TrendingUp, Upload, Award, Zap } from 'lucide-react';

export default function LiveActivityFeed() {
  const [currentActivity, setCurrentActivity] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Subscribe to real-time activity updates
    const unsubscribe = base44.entities.Activity.subscribe((event) => {
      if (event.type === 'create') {
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

  if (!isVisible || activities.length === 0) return null;

  return (
    <div className="fixed bottom-24 right-4 z-40 w-80 max-h-96 overflow-hidden">
      <div className="bg-black/80 backdrop-blur-md border border-purple-500/30 rounded-xl p-4 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-green-400" />
            Live Activity
          </h3>
          <button
            onClick={() => setIsVisible(false)}
            className="text-zinc-500 hover:text-white text-xs"
          >
            Hide
          </button>
        </div>

        <div className="space-y-2 overflow-y-auto max-h-80">
          <AnimatePresence mode="popLayout">
            {activities.map((activity) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-start gap-2 bg-zinc-900/50 p-2 rounded-lg"
              >
                <div className="mt-1">{getIcon(activity.action_type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white font-medium truncate">
                    {activity.username || 'User'}
                  </p>
                  <p className="text-xs text-zinc-400 truncate">
                    {activity.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}