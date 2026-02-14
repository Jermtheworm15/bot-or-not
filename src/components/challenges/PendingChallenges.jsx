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

  const handleAccept = async () => {
    if (!currentChallenge) return;
    try {
      playSound.click();
      await base44.entities.UserChallenge.update(currentChallenge.id, { status: 'accepted' });
      setIsOpen(false);
      window.location.href = createPageUrl(`BlitzGame?challengeId=${currentChallenge.id}`);
    } catch (err) {
      console.error('Error accepting challenge:', err);
    }
  };

  const handleDecline = async () => {
    if (!currentChallenge) return;
    try {
      playSound.click();
      await base44.entities.UserChallenge.update(currentChallenge.id, { status: 'declined' });
      setIsOpen(false);
      setCurrentChallenge(null);
      
      // Show next challenge if any
      const remaining = challenges.filter(c => c.id !== currentChallenge.id);
      if (remaining.length > 0) {
        setTimeout(() => {
          setCurrentChallenge(remaining[0]);
          setIsOpen(true);
        }, 500);
      }
    } catch (err) {
      console.error('Error declining challenge:', err);
    }
  };

  if (isLoading || !currentChallenge) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="bg-gradient-to-br from-purple-950 to-black border-2 border-purple-500/50 max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-2xl text-center justify-center">
            <Gamepad2 className="w-8 h-8 text-purple-400 animate-pulse" />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Challenge Received!
            </span>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-4 pt-4">
            <div className="text-white text-lg font-bold">
              <span className="text-purple-400">{currentChallenge.challenger_name}</span> has challenged you to a blitz battle!
            </div>
            <div className="bg-purple-900/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Rounds:</span>
                <span className="text-white font-bold">{currentChallenge.rounds}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Mode:</span>
                <span className="text-white font-bold">Head-to-Head</span>
              </div>
            </div>
            {challenges.length > 1 && (
              <p className="text-xs text-gray-400">
                +{challenges.length - 1} more {challenges.length === 2 ? 'challenge' : 'challenges'} pending
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            onClick={handleDecline}
            variant="outline"
            className="w-full border-red-500/50 text-red-400 hover:bg-red-900/20"
          >
            Decline
          </Button>
          <Button
            onClick={handleAccept}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            Accept Challenge
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}