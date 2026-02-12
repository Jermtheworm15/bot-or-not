import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import ImageCard from '@/components/voting/ImageCard';
import VotingButtons from '@/components/voting/VotingButtons';
import RatingSlider from '@/components/voting/RatingSlider';
import StatsBar from '@/components/voting/StatsBar';
import ShareButton from '@/components/social/ShareButton';
import InviteFriends from '@/components/social/InviteFriends';
import SuccessExplosion from '@/components/gamification/SuccessExplosion';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { RefreshCw } from 'lucide-react';

export default function Home() {
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [rating, setRating] = useState(5);
  const [stats, setStats] = useState({ total: 0, correct: 0, streak: 0 });
  const [showExplosion, setShowExplosion] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [imageLoadTimeout, setImageLoadTimeout] = useState(null);
  const currentItem = items[currentIndex];

  useEffect(() => {
    checkUsernameAndLoad();
  }, []);

  // Preload next image and set auto-skip timeout
  useEffect(() => {
    if (items.length > 0 && currentIndex < items.length - 1) {
      const nextImage = items[currentIndex + 1];
      if (nextImage?.url) {
        const img = new Image();
        img.src = nextImage.url;
      }
    }

    // Set 10-second timeout to skip to next image if current doesn't load
    if (!hasVoted && items[currentIndex]?.url) {
      const timeout = setTimeout(() => {
        handleContentError();
      }, 10000);
      setImageLoadTimeout(timeout);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, items, hasVoted]);
  
  const checkUsernameAndLoad = async () => {
    try {
      const user = await base44.auth.me();

      // Check if user needs onboarding
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (profiles.length === 0 || !user.username) {
        window.location.href = createPageUrl('Onboarding');
        return;
      }

      // Check if user has uploaded at least one image
      const userUploads = await base44.entities.Image.filter({ created_by: user.email });
      if (userUploads.length === 0) {
        window.location.href = createPageUrl('Upload');
        return;
      }

      // Check for referral code in URL
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref');
      if (refCode) {
        handleReferral(refCode, user.email);
      }
    } catch (err) {
      console.log('Auth check error:', err);
    }

    loadContent();
    loadUserProfile();
  };
  
  const handleReferral = async (refCode, userEmail) => {
    try {
      // Check if referral already exists
      const existing = await base44.entities.Referral.filter({ 
        referral_code: refCode,
        referred_email: userEmail 
      });
      
      if (existing.length === 0) {
        // Find referrer by code (decode from base64)
        const allUsers = await base44.entities.UserProfile.list();
        const referrer = allUsers.find(u => btoa(u.user_email).slice(0, 8).toUpperCase() === refCode);
        
        if (referrer) {
          await base44.entities.Referral.create({
            referrer_email: referrer.user_email,
            referred_email: userEmail,
            referral_code: refCode,
            completed: false
          });
        }
      }
    } catch (err) {
      console.log('Referral error:', err);
    }
  };
  
  const loadUserProfile = async () => {
    try {
      const user = await base44.auth.me();
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      
      if (profiles.length === 0) {
        const newProfile = await base44.entities.UserProfile.create({
          user_email: user.email,
          points: 0,
          level: 1,
          badges: [],
          daily_votes: 0,
          weekly_votes: 0,
          perfect_streak: 0
        });
        setUserProfile(newProfile);
      } else {
        setUserProfile(profiles[0]);
      }
    } catch (err) {
      console.log('Profile load error:', err);
    }
  };
  
  const loadContent = async () => {
    setIsLoading(true);
    setCurrentIndex(0);
    setHasVoted(false);
    
    try {
      const user = await base44.auth.me();
      
      // Load images and user's votes in parallel
      const [rawData, userVotes] = await Promise.all([
        base44.entities.Image.list(),
        base44.entities.Vote.filter({ user_email: user.email })
      ]);
      
      // Flatten data structure and validate URLs
      const data = rawData.map(item => ({
        id: item.id,
        url: item.data?.url || item.url,
        is_bot: item.data?.is_bot ?? item.is_bot,
        source: item.data?.source || item.source,
        user_uploaded: item.data?.user_uploaded || item.user_uploaded,
        uploader_name: item.data?.uploader_name || item.uploader_name
      })).filter(item => {
        // Filter out invalid URLs
        if (!item.url || item.url.trim() === '') return false;
        try {
          new URL(item.url);
          return true;
        } catch {
          return false;
        }
      });
      
      // Get IDs of images user has already voted on
      const votedIds = new Set(userVotes.map(v => v.image_id));
      
      // Filter out already-voted items
      const unseenData = data.filter(item => !votedIds.has(item.id));
      
      // If user has seen everything, show all items again
      const validData = unseenData.length > 0 ? unseenData : data;
      
      if (validData.length === 0) {
        setItems([]);
        setIsLoading(false);
        return;
      }
      
      // Sort by newest first, then shuffle within groups
      const sorted = validData.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

      // Shuffle images efficiently
      const shuffled = [...sorted];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      // Preload first 3 images for smooth transitions
      shuffled.slice(0, 3).forEach(item => {
        const img = new Image();
        img.src = item.url;
      });

      setItems(shuffled);
    } catch (err) {
      console.error('Error loading content:', err);
      setItems([]);
    }
    setIsLoading(false);
  };

  
  const handleVote = async (guessedBot) => {
    if (!currentItem) return;
    
    const correct = guessedBot === currentItem.is_bot;
    setWasCorrect(correct);
    setHasVoted(true);
    
    // Show explosion effect for correct answers
    if (correct) {
      setShowExplosion(true);
      setTimeout(() => setShowExplosion(false), 2500);
    }
    
    // Update stats
    const newStreak = correct ? stats.streak + 1 : 0;
    setStats(prev => ({
      total: prev.total + 1,
      correct: prev.correct + (correct ? 1 : 0),
      streak: newStreak
    }));
    
    // Get current user
    const user = await base44.auth.me();

    // Update user profile with points and challenges
    if (userProfile) {
      const pointsEarned = correct ? 10 : 5;
      const newBadges = [...(userProfile.badges || [])];

      // Award badges
      if (stats.total === 0 && !newBadges.includes('first_vote')) {
        newBadges.push('first_vote');
      }
      if (newStreak === 5 && !newBadges.includes('streak_5')) {
        newBadges.push('streak_5');
      }
      if (newStreak === 10 && !newBadges.includes('streak_10')) {
        newBadges.push('streak_10');
      }

      const updatedProfile = await base44.entities.UserProfile.update(userProfile.id, {
        points: (userProfile.points || 0) + pointsEarned,
        daily_votes: (userProfile.daily_votes || 0) + 1,
        weekly_votes: (userProfile.weekly_votes || 0) + 1,
        perfect_streak: Math.max(userProfile.perfect_streak || 0, newStreak),
        badges: newBadges,
        last_vote_date: new Date().toISOString()
      });

      // Create activity for real-time feed
      await base44.entities.Activity.create({
        user_email: user.email,
        username: user.username || user.email,
        action_type: newStreak >= 5 ? 'streak' : 'vote',
        description: newStreak >= 5 ? `Hit a ${newStreak} vote streak!` : `Voted ${correct ? 'correctly' : 'incorrectly'}`,
        metadata: { streak: newStreak, correct }
      });
      
      // Check and complete referrals on first vote
      if (stats.total === 0) {
        const referrals = await base44.entities.Referral.filter({ 
          referred_email: user.email,
          completed: false 
        });
        
        for (const ref of referrals) {
          await base44.entities.Referral.update(ref.id, { 
            completed: true,
            completed_date: new Date().toISOString()
          });
          
          // Update referrer's profile
          const referrerProfiles = await base44.entities.UserProfile.filter({ 
            user_email: ref.referrer_email 
          });
          if (referrerProfiles.length > 0) {
            const refProfile = referrerProfiles[0];
            const newRefCount = (refProfile.referral_count || 0) + 1;
            await base44.entities.UserProfile.update(refProfile.id, {
              referral_count: newRefCount,
              is_premium: newRefCount >= 3
            });
          }
        }
      }
      
      await loadUserProfile();
    }

    // Save vote (without rating yet)
    await base44.entities.Vote.create({
      image_id: currentItem.id,
      guessed_bot: guessedBot,
      was_correct: correct,
      user_email: user.email
    });
  };
  
  const handleContentError = () => {
    // Clear timeout and skip to next image
    if (imageLoadTimeout) clearTimeout(imageLoadTimeout);
    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Generate fresh content if at end
      setIsLoading(true);
      base44.functions.invoke('generateFreshContent', { count: 6 }).catch(console.error);
      loadContent();
    }
  };
  
  const handleSubmitRating = async () => {
    // Update the vote with rating
    const votes = await base44.entities.Vote.filter({ image_id: currentItem.id }, '-created_date', 1);
    if (votes.length > 0) {
      await base44.entities.Vote.update(votes[0].id, { rating });
    }
    
    // Move to next item
    setRating(5);
    setHasVoted(false);
    
    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Generate fresh content and reload
      setIsLoading(true);
      try {
        await base44.functions.invoke('generateFreshContent', { count: 6 });
      } catch (error) {
        console.error('Error generating fresh content:', error);
      }
      await loadContent();
    }
  };
  
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />
      
      {/* Success Explosion */}
      <SuccessExplosion show={showExplosion} />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        {/* Content Display - Main Focal Point */}
        <div className="w-full max-w-3xl mb-6">
          <ImageCard
            imageUrl={currentItem?.url}
            isLoading={isLoading || !currentItem}
            isRevealed={hasVoted}
            isBot={currentItem?.is_bot}
            wasCorrect={wasCorrect}
            onError={handleContentError}
          />
        </div>
        
        {/* Voting/Rating Section */}
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {!hasVoted ? (
              <motion.div
                key="voting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <VotingButtons
                  onVote={handleVote}
                  disabled={isLoading || !currentItem}
                />
              </motion.div>
            ) : (
              <motion.div
                key="rating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <RatingSlider
                  rating={rating}
                  onRatingChange={setRating}
                  onSubmit={handleSubmitRating}
                />
                <div className="flex justify-center">
                  <ShareButton
                    contentUrl={currentItem?.url}
                    contentType="image"
                    isBot={currentItem?.is_bot}
                    wasCorrect={wasCorrect}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Compact bottom controls */}
        <div className="absolute top-4 right-4 z-20">
          <InviteFriends />
        </div>
        
        {/* Stats bar at bottom */}
        <div className="absolute bottom-32 left-4 right-4">
          <StatsBar 
            totalVotes={stats.total}
            correctVotes={stats.correct}
            streak={stats.streak}
          />
        </div>
      </div>
    </div>
  );
}