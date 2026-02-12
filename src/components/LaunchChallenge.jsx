import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';

export default function LaunchChallenge() {
  const [timeLeft, setTimeLeft] = useState({});
  const [isVisible, setIsVisible] = useState(true);
  
  // Set challenge end date - 7 days from Feb 12, 2026
  const challengeEndDate = new Date('2026-02-19T23:59:59');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const difference = challengeEndDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setIsVisible(false);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        exit={{ y: -100 }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 shadow-lg"
      >
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Trophy className="w-6 h-6 text-yellow-300 animate-pulse" />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-white text-sm md:text-base">
                    🎉 LAUNCH WEEK CHALLENGE
                  </span>
                  <span className="text-white/90 text-xs md:text-sm">
                    Top 10 players win exclusive badges!
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-2 text-yellow-300 text-xs md:text-sm font-mono font-bold">
                    <Clock className="w-3 h-3" />
                    {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <a href={createPageUrl('Leaderboard')}>
                <Button size="sm" className="bg-white text-purple-600 hover:bg-yellow-300 font-bold">
                  Join Now
                </Button>
              </a>
              <button
                onClick={() => setIsVisible(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}