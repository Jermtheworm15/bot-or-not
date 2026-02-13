import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { playSound } from '@/components/audio/SoundEffects';

export default function ComboCounter({ combo, onMilestone }) {
  const isMilestone = combo > 0 && combo % 5 === 0;

  React.useEffect(() => {
    if (isMilestone && onMilestone) {
      playSound.combo();
      onMilestone(combo);
    }
  }, [combo, isMilestone, onMilestone]);

  if (combo === 0) return null;

  return (
    <motion.div
      initial={{ scale: 0, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0, y: -20 }}
      className="fixed top-24 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none"
    >
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          repeatDelay: 1
        }}
        className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full font-black text-lg sm:text-xl mx-4 ${
          isMilestone
            ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/50'
            : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/50'
        }`}
      >
        <Flame className={`w-5 h-5 sm:w-6 sm:h-6 ${isMilestone ? 'animate-pulse' : ''}`} />
        <span>{combo}</span>
      </motion.div>
    </motion.div>
  );
}