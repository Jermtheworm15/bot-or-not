import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Zap, TrendingUp } from 'lucide-react';

export default function RewardNotification({ reward, onComplete }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onComplete?.(), 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!reward) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
        >
          <motion.div 
            className="bg-gradient-to-br from-yellow-600 to-yellow-700 text-white px-4 py-2 rounded-lg shadow-xl shadow-yellow-500/30 border border-yellow-400"
            animate={{ opacity: visible ? 1 : 0 }}
            transition={{ delay: 2.5, duration: 0.5 }}
          >
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5" />
              <div>
                <div className="text-lg font-bold">+{reward.amount} 🪙</div>
                {reward.streak > 0 && (
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    <span className="text-xs font-bold">{reward.streak} streak!</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}