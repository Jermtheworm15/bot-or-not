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
import ComboCounter from '@/components/gamification/ComboCounter';
import PointsAnimation from '@/components/gamification/PointsAnimation';
import MilestonePopup from '@/components/gamification/MilestonePopup';
import ImageAnalysis from '@/components/ImageAnalysis';
import MobileActionButtons from '@/components/mobile/MobileActionButtons';
import { createPageUrl } from '@/utils';


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
  const [combo, setCombo] = useState(0);
  const [pointsAnimations, setPointsAnimations] = useState([]);
  const [milestone, setMilestone] = useState(null);
  const [showMilestone, setShowMilestone] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const currentItem = items[currentIndex];

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      if (!user) {
        window.location.href = createPageUrl('Onboarding');
        return;
      }

      // Check if user needs onboarding
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (profiles.length === 0 || !user.full_name) {
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
   if (!refCode) return;
   try {
     const existing = await base44.entities.Referral.filter({ 
       referral_code: refCode,
       referred_email: userEmail 
     });

     if (existing.length === 0) {
       await base44.entities.Referral.create({
         referrer_email: refCode,
         referred_email: userEmail,
         referral_code: refCode,
         completed: false
       });
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

      // Validate that images actually load
      const loadableImages = [];
      for (const item of shuffled) {
        try {
          await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => reject();
            img.src = item.url;
            // Timeout after 5 seconds
            setTimeout(() => reject(), 5000);
          });
          loadableImages.push(item);
          if (loadableImages.length >= 20) break; // Only validate first 20
        } catch {
          // Image failed to load, skip it
          console.log('Skipping broken image:', item.url);
        }
      }

      setItems(loadableImages.length > 0 ? loadableImages : shuffled.slice(0, 10));
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

    // Update combo and show animations
    const newCombo = correct ? combo + 1 : 0;
    setCombo(newCombo);

    // Show explosion effect for correct answers (desktop only)
    if (correct && !isMobile) {
      setShowExplosion(true);
      setTimeout(() => setShowExplosion(false), 2500);
    }
    
    // Get current user (do before updating stats)
    const user = await base44.auth.me();
    if (!user) return;

    // Update stats
    const newStreak = correct ? stats.streak + 1 : 0;
    setStats(prev => ({
      total: prev.total + 1,
      correct: prev.correct + (correct ? 1 : 0),
      streak: newStreak
    }));
    
    // Update user profile with points and challenges  
    if (userProfile) {
      const pointsEarned = correct ? 10 : 5;
      const multiplier = Math.floor(1 + newCombo * 0.1);
      const totalPoints = pointsEarned * multiplier;

      // Add points animation (desktop only)
      if (!isMobile) {
        setPointsAnimations(prev => [...prev, {
          id: Date.now(),
          points: pointsEarned,
          combo: newCombo,
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
          isCorrect: correct
        }]);
      }
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
        points: (userProfile.points || 0) + totalPoints,
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
          try {
            const referrals = await base44.entities.Referral.filter({ 
              referred_email: user.email,
              completed: false 
            });

            for (const ref of referrals) {
              await base44.entities.Referral.update(ref.id, { 
                completed: true,
                completed_date: new Date().toISOString()
              });

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
          } catch (err) {
            console.log('Referral completion error:', err);
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
      base44.functions.invoke('generateFreshContent', { count: 50 }).catch(console.error);
      loadContent();
    }
  };

  const handleSkip = () => {
    if (!hasVoted) {
      handleContentError();
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await loadContent();
  };

  const handleShowInfo = () => {
    if (currentItem) {
      alert(`Image Info:\nSource: ${currentItem.source || 'Unknown'}\nUploader: ${currentItem.uploader_name || 'N/A'}\nCategory: ${currentItem.ai_category || 'N/A'}`);
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

    // Clean up points animations
    setPointsAnimations(prev => prev.slice(-5));
    
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

      {/* Combo Counter - Desktop only */}
      {!isMobile && (
        <ComboCounter 
          combo={combo} 
          onMilestone={(m) => {
            setMilestone(m);
            setShowMilestone(true);
            setTimeout(() => setShowMilestone(false), 2500);
          }}
        />
      )}

      {/* Points Animations - Desktop only */}
      {!isMobile && pointsAnimations.map(anim => (
        <PointsAnimation
          key={anim.id}
          points={anim.points}
          combo={anim.combo}
          x={anim.x}
          y={anim.y}
          isCorrect={anim.isCorrect}
        />
      ))}

      {/* Success Explosion - Desktop only */}
      {!isMobile && <SuccessExplosion show={showExplosion} />}
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        {/* Content Display - Main Focal Point */}
        <div className="w-full max-w-3xl mb-6 space-y-4">
          <ImageCard
            imageUrl={currentItem?.url}
            isLoading={isLoading || !currentItem}
            isRevealed={hasVoted}
            isBot={currentItem?.is_bot}
            wasCorrect={wasCorrect}
            onError={handleContentError}
          />
          {hasVoted && currentItem && (
            <ImageAnalysis image={currentItem} />
          )}
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
        
        {/* Compact bottom controls - Desktop only */}
        {!isMobile && (
          <div className="absolute top-4 right-4 z-20">
            <InviteFriends />
          </div>
        )}

        {/* Stats bar - positioned to not overlap on mobile */}
        <div className={`${isMobile ? 'relative mt-4 mb-4' : 'absolute bottom-32 left-4 right-4'}`}>
          <StatsBar 
            totalVotes={stats.total}
            correctVotes={stats.correct}
            streak={stats.streak}
          />
        </div>

        {/* Mobile Action Buttons */}
        {isMobile && (
          <MobileActionButtons
            onSkip={handleSkip}
            onRefresh={handleRefresh}
            onInfo={handleShowInfo}
            disabled={isLoading}
          />
        )}
        </div>
        </div>
        );
        }