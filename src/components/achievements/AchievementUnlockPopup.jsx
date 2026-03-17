import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

// Queue of popups to show one at a time
let popupQueue = [];
let listeners = [];

export function triggerAchievementPopup(achievement) {
  popupQueue.push(achievement);
  listeners.forEach(fn => fn([...popupQueue]));
}

export default function AchievementUnlockPopup() {
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    const listener = (q) => setQueue(q);
    listeners.push(listener);
    return () => { listeners = listeners.filter(l => l !== listener); };
  }, []);

  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      popupQueue = popupQueue.slice(1);
      setQueue(q => q.slice(1));
    }
  }, [queue, current]);

  const dismiss = () => setCurrent(null);

  useEffect(() => {
    if (current) {
      const t = setTimeout(dismiss, 4000);
      return () => clearTimeout(t);
    }
  }, [current]);

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={dismiss}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] cursor-pointer"
        >
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-purple-500/60 rounded-2xl px-5 py-4 shadow-2xl shadow-purple-500/30 flex items-center gap-4 min-w-64 max-w-xs">
            <div className="text-4xl flex-shrink-0">{current.icon || '🏅'}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-purple-400 font-bold uppercase tracking-wider mb-0.5">Achievement Unlocked!</p>
              <p className="text-white font-black text-sm">{current.name}</p>
              <p className="text-zinc-400 text-xs truncate">{current.description}</p>
              {current.token_reward > 0 && (
                <p className="text-yellow-400 text-xs mt-1">🪙 +{current.token_reward} tokens earned</p>
              )}
            </div>
            <div className="w-1 h-full absolute left-0 top-0 bottom-0 rounded-l-2xl bg-gradient-to-b from-purple-500 to-pink-500" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}