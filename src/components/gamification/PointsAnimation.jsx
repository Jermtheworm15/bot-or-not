import React from 'react';
import { motion } from 'framer-motion';

export default function PointsAnimation({ points, combo, x, y, isCorrect }) {
  const multiplier = Math.floor(1 + combo * 0.1); // 1x at 0 combo, 1.5x at 5, 2x at 10, etc
  const totalPoints = points * multiplier;

  return (
    <motion.div
      initial={{ opacity: 1, x: x || 0, y: y || 0 }}
      animate={{ opacity: 0, y: (y || 0) - 100 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
      className="fixed pointer-events-none font-black text-xl sm:text-2xl"
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.4 }}
        className={`${isCorrect ? 'text-green-400' : 'text-red-400'} drop-shadow-lg`}
      >
        +{totalPoints}
        {multiplier > 1 && (
          <div className={`text-xs sm:text-sm font-bold ${multiplier > 1.5 ? 'text-yellow-300' : 'text-green-300'}`}>
            x{multiplier.toFixed(1)}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}