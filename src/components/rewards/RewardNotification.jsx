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
          initial={{ opacity: 0, y: -50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.8 }}
          className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 text-white px-6 py-4 rounded-xl shadow-2xl shadow-yellow-500/50 border-2 border-yellow-400">
            <div className="flex items-center gap-3">
              <Coins className="w-8 h-8 animate-bounce" />
              <div>
                <div className="text-2xl font-black">+{reward.amount} 🪙</div>
                <div className="text-xs opacity-90">{reward.message}</div>
                {reward.streak > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <Zap className="w-3 h-3" />
                    <span className="text-xs font-bold">{reward.streak} streak!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}