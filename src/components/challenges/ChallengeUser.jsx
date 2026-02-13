import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { playSound } from '@/components/audio/SoundEffects';

export default function ChallengeUser({ targetUserEmail, targetUserName, currentUserEmail, currentUserName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [rounds, setRounds] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChallenge = async () => {
    setIsLoading(true);
    try {
      await base44.entities.UserChallenge.create({
        challenger_email: currentUserEmail,
        challenger_name: currentUserName,
        opponent_email: targetUserEmail,
        opponent_name: targetUserName,
        rounds: rounds,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
      playSound.victory();
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Error creating challenge:', err);
    }
    setIsLoading(false);
  };

  if (currentUserEmail === targetUserEmail) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-purple-600 to-orange-600 hover:from-purple-700 hover:to-orange-700 text-white"
        >
          <Zap className="w-4 h-4 mr-2" />
          Challenge to Blitz
        </Button>
      ) : (
        <div className="bg-zinc-800 border border-purple-500/50 rounded-lg p-4 space-y-4">
          <h3 className="font-bold text-white">Challenge {targetUserName} to Blitz!</h3>

          {success ? (
            <p className="text-green-400 text-sm">Challenge sent! ✓</p>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm text-zinc-300">Rounds:</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRounds(5)}
                    className={`flex-1 py-2 rounded text-sm font-bold transition-all ${
                      rounds === 5
                        ? 'bg-purple-600 text-white'
                        : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                    }`}
                  >
                    5 Rounds (Fast)
                  </button>
                  <button
                    onClick={() => setRounds(10)}
                    className={`flex-1 py-2 rounded text-sm font-bold transition-all ${
                      rounds === 10
                        ? 'bg-purple-600 text-white'
                        : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                    }`}
                  >
                    10 Rounds (Epic)
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleChallenge}
                  disabled={isLoading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {isLoading ? 'Sending...' : 'Send Challenge'}
                </Button>
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="outline"
                  className="border-zinc-700"
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}