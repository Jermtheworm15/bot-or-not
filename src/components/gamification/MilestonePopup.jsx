import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Zap } from 'lucide-react';

export default function MilestonePopup({ milestone, isVisible }) {
  const getMilestoneConfig = (num) => {
    if (num % 10 === 0) {
      return {
        title: `${num}-VOTE LEGEND!`,
        icon: Trophy,
        color: 'from-purple-500 to-pink-500',
        textColor: 'text-purple-300',
        message: '🏆 You are unstoppable!',
        size: 'scale-125'
      };
    }
    return {
      title: `${num}-VOTE STREAK!`,
      icon: Zap,
      color: 'from-yellow-500 to-orange-500',
      textColor: 'text-yellow-300',
      message: '⚡ Keep it going!',
      size: 'scale-100'
    };
  };

  const config = getMilestoneConfig(milestone);
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0, y: -20 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 20
          }}
          className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none ${config.size}`}
        >
          {/* Radial burst effect */}
          <motion.div
            animate={{
              boxShadow: [
                '0 0 0 0 rgba(147, 51, 234, 0.7)',
                '0 0 0 40px rgba(147, 51, 234, 0)',
              ]
            }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 rounded-full"
          />

          <div className={`relative bg-gradient-to-br ${config.color} rounded-2xl p-8 shadow-2xl border-2 border-white/30 backdrop-blur-sm`}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="absolute -top-6 -right-6"
            >
              <Sparkles className="w-12 h-12 text-yellow-300" />
            </motion.div>

            <div className="flex flex-col items-center gap-4 text-white">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                <Icon className="w-16 h-16" />
              </motion.div>
              
              <h3 className="text-3xl font-black text-center leading-tight">{config.title}</h3>
              <p className={`text-lg font-bold ${config.textColor}`}>{config.message}</p>
            </div>

            {/* Particle effects */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 1,
                  x: 0,
                  y: 0
                }}
                animate={{
                  opacity: 0,
                  x: Math.cos((i / 6) * Math.PI * 2) * 100,
                  y: Math.sin((i / 6) * Math.PI * 2) * 100
                }}
                transition={{ duration: 1, delay: 0.1 * i }}
                className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-300 rounded-full"
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}