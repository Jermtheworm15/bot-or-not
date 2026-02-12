import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

export default function SuccessExplosion({ show, onComplete }) {
  useEffect(() => {
    if (show) {
      // Confetti explosion
      const duration = 2000;
      const animationEnd = Date.now() + duration;
      
      const randomInRange = (min, max) => Math.random() * (max - min) + min;
      
      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        
        if (timeLeft <= 0) {
          clearInterval(interval);
          if (onComplete) onComplete();
          return;
        }
        
        const particleCount = 50 * (timeLeft / duration);
        
        confetti({
          particleCount: 2,
          angle: randomInRange(55, 125),
          spread: randomInRange(50, 70),
          origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
          colors: ['#9333ea', '#22c55e', '#eab308', '#3b82f6', '#ec4899'],
          gravity: randomInRange(1, 1.5),
          scalar: randomInRange(0.8, 1.2),
          drift: randomInRange(-0.5, 0.5)
        });
      }, 50);
      
      return () => clearInterval(interval);
    }
  }, [show, onComplete]);
  
  if (!show) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.5, 1] }}
        transition={{ duration: 0.5 }}
        className="text-4xl sm:text-6xl font-black text-green-400 drop-shadow-[0_0_20px_rgba(34,197,94,0.8)] px-4"
      >
        ✓ CORRECT!
      </motion.div>
    </motion.div>
  );
}