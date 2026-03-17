import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift } from 'lucide-react';
import InviteFriends from './InviteFriends';

const DISMISSED_KEY = 'referral_banner_dismissed';

export default function ReferralBanner() {
  const [dismissed, setDismissed] = useState(() => !!localStorage.getItem(DISMISSED_KEY));

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="relative mx-4 mt-2 mb-1 rounded-2xl overflow-hidden"
        >
          {/* Gradient border effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-emerald-400 to-green-600 rounded-2xl" />
          <div className="relative m-[1.5px] bg-zinc-950 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="text-2xl flex-shrink-0">🎁</div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-black text-sm leading-tight">Invite Friends → Get 100 Tokens Each!</p>
              <p className="text-green-400/80 text-xs mt-0.5">You and your friend both earn when they cast their first vote.</p>
            </div>
            <InviteFriends compact />
            <button onClick={dismiss} className="flex-shrink-0 text-zinc-600 hover:text-white ml-1 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}