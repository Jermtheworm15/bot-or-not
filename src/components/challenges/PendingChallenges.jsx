import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Zap, Gamepad2 } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { playSound } from '@/components/audio/SoundEffects';

export default function PendingChallenges({ userEmail }) {
  const [challenges, setChallenges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadChallenges();
    const unsubscribe = base44.entities.UserChallenge.subscribe((event) => {
      if (event.type === 'create' || event.type === 'update') {
        loadChallenges();
      }
    });
    return unsubscribe;
  }, [userEmail]);

  const loadChallenges = async () => {
    try {
      const pending = await base44.entities.UserChallenge.filter({ opponent_email: userEmail, status: 'pending' });
      setChallenges(pending);
      
      // Show pop-up for first pending challenge
      if (pending.length > 0 && !currentChallenge) {
        setCurrentChallenge(pending[0]);
        setIsOpen(true);
        playSound.achievement();
      }
    } catch (err) {
      console.error('Error loading challenges:', err);
    }
    setIsLoading(false);
  };

  const handleAccept = async (challengeId) => {
    try {
      await base44.entities.UserChallenge.update(challengeId, { status: 'accepted' });
      window.location.href = createPageUrl(`BlitzGame?challengeId=${challengeId}`);
    } catch (err) {
      console.error('Error accepting challenge:', err);
    }
  };

  const handleDecline = async (challengeId) => {
    try {
      await base44.entities.UserChallenge.update(challengeId, { status: 'declined' });
      await loadChallenges();
    } catch (err) {
      console.error('Error declining challenge:', err);
    }
  };

  if (isLoading) return null;

  if (challenges.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-20 right-4 z-40 max-w-sm"
      >
        <Card className="bg-gradient-to-br from-purple-900/80 to-orange-900/80 border-purple-500/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="w-5 h-5 text-orange-400" />
              Blitz Challenges
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {challenges.map((challenge) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-zinc-900/50 border border-purple-500/30 rounded-lg p-3 space-y-2"
              >
                <p className="text-white font-bold text-sm">
                  {challenge.challenger_name} challenges you!
                </p>
                <p className="text-zinc-300 text-xs">{challenge.rounds} rounds</p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAccept(challenge.id)}
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-xs"
                  >
                    Accept
                  </Button>
                  <Button
                    onClick={() => handleDecline(challenge.id)}
                    size="sm"
                    variant="outline"
                    className="border-red-500/50 text-red-400 hover:bg-red-900/20 text-xs"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}