import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import InviteFriends from './InviteFriends';

export default function ReferralNudge({ show, onDismiss }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[80] w-[90vw] max-w-sm"
        >
          <div className="bg-zinc-900 border border-green-500/50 rounded-2xl p-4 shadow-2xl shadow-green-500/20">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎁</span>
                <div>
                  <p className="text-white font-black text-sm">You're on a roll!</p>
                  <p className="text-green-400 text-xs">Invite a friend — you both get 100 tokens 🪙</p>
                </div>
              </div>
              <button onClick={onDismiss} className="text-zinc-600 hover:text-white ml-2 flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <InviteFriends compact />
              <button
                onClick={onDismiss}
                className="flex-1 py-2.5 rounded-xl text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-800 transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}