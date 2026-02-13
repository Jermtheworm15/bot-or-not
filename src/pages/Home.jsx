import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { SkipForward } from 'lucide-react';
import ImageCard from '@/components/voting/ImageCard';
import VotingButtons from '@/components/voting/VotingButtons';

import StatsBar from '@/components/voting/StatsBar';
import ShareButton from '@/components/social/ShareButton';
import InviteFriends from '@/components/social/InviteFriends';
import SuccessExplosion from '@/components/gamification/SuccessExplosion';
import ComboCounter from '@/components/gamification/ComboCounter';
import PointsAnimation from '@/components/gamification/PointsAnimation';
import MilestonePopup from '@/components/gamification/MilestonePopup';
import ImageAnalysis from '@/components/ImageAnalysis';
import MobileNav from '@/components/mobile/MobileNav';
import ImageComments from '@/components/comments/ImageComments';

import { createPageUrl } from '@/utils';


export default function Home() {
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);

  const [stats, setStats] = useState({ total: 0, correct: 0, streak: 0 });
  const [showExplosion, setShowExplosion] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [imageLoadTimeout, setImageLoadTimeout] = useState(null);
  const [combo, setCombo] = useState(0);
  const [pointsAnimations, setPointsAnimations] = useState([]);
  const [milestone, setMilestone] = useState(null);
  const [showMilestone, setShowMilestone] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [errorSkipInProgress, setErrorSkipInProgress] = useState(false);
  const currentItem = items[currentIndex];

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    checkUsernameAndLoad();
  }, []);

  // Preload next image
  useEffect(() => {
    if (items.length > 0 && currentIndex < items.length - 1) {
      const nextImage = items[currentIndex + 1];
      if (nextImage?.url) {
        const img = new Image();
        img.src = nextImage.url;
      }
    }
  }, [currentIndex, items]);
  
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
        base44.entities.Image.list('-created_date', 100),
        base44.entities.Vote.filter({ user_email: user.email })
      ]);

      // Extract data from entity structure - NO FILTERING
      const data = rawData.map(item => ({
        id: item.id,
        url: item.url || item.data?.url,
        is_bot: item.is_bot ?? item.data?.is_bot,
        is_other: item.is_other ?? item.data?.is_other ?? false,
        gender: item.gender || item.data?.gender || 'unknown',
        source: item.source || item.data?.source,
        user_uploaded: item.user_uploaded ?? item.data?.user_uploaded,
        uploader_name: item.uploader_name || item.data?.uploader_name,
        ai_category: item.ai_category || item.data?.ai_category,
        ai_tags: item.ai_tags || item.data?.ai_tags,
        nsfw_flag: item.nsfw_flag ?? item.data?.nsfw_flag,
        created_date: item.created_date
      }));

      // Filter out items without valid URLs
      const validData = data.filter(item => {
        const hasUrl = item.url && typeof item.url === 'string' && item.url.trim() !== '';
        if (!hasUrl) {
          console.log('Skipping item without valid URL:', item.id);
        }
        return hasUrl;
      });

      if (validData.length === 0) {
        setItems([]);
        setIsLoading(false);
        return;
      }

      // Separate by gender for balanced distribution
      const maleImages = validData.filter(item => item.gender === 'male');
      const femaleImages = validData.filter(item => item.gender === 'female');
      const otherImages = validData.filter(item => item.gender === 'other' || item.gender === 'unknown');

      // Shuffle each group
      const shuffleMale = [...maleImages].sort(() => Math.random() - 0.5);
      const shuffleFemale = [...femaleImages].sort(() => Math.random() - 0.5);
      const shuffleOther = [...otherImages].sort(() => Math.random() - 0.5);

      // Interleave male and female images evenly
      const shuffled = [];
      const maxLength = Math.max(shuffleMale.length, shuffleFemale.length);
      
      for (let i = 0; i < maxLength; i++) {
        if (shuffleMale[i]) shuffled.push(shuffleMale[i]);
        if (shuffleFemale[i]) shuffled.push(shuffleFemale[i]);
        if (shuffleOther[i]) shuffled.push(shuffleOther[i]);
      }
      
      // Add any remaining other images
      if (shuffleOther.length > maxLength) {
        shuffled.push(...shuffleOther.slice(maxLength));
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

  
  const handleVote = async (guess) => {
    if (!currentItem) return;

    // Determine if the guess was correct
    let correct = false;
    if (currentItem.is_other) {
      correct = guess === 'other';
    } else if (guess === 'other') {
      correct = false;
    } else {
      correct = (guess === 'bot') === currentItem.is_bot;
    }

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

    // Save vote
            await base44.entities.Vote.create({
              image_id: currentItem.id,
              guess: guess,
              guessed_bot: guess === 'bot',
              was_correct: correct,
              user_email: user.email
            });

            // Auto-advance after 2 seconds
            setTimeout(moveToNextImage, 2000);
          };
  
  const handleContentError = () => {
    // Prevent rapid-fire error skips
    if (errorSkipInProgress) return;

    setErrorSkipInProgress(true);

    // Skip to next image after brief delay
    setTimeout(() => {
      if (currentIndex < items.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // Reload content if we're at the end
        loadContent();
      }
      setErrorSkipInProgress(false);
    }, 500);
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


  
  const moveToNextImage = () => {
    setHasVoted(false);
    setPointsAnimations(prev => prev.slice(-5));
    
    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Generate fresh content and reload
      setIsLoading(true);
      loadContent().catch(error => {
        console.error('Error loading content:', error);
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-zinc-950 text-white overflow-x-hidden">
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
      
      <div className={`relative z-10 flex flex-col items-center ${isMobile ? 'justify-center h-screen overflow-hidden pt-16 pb-24' : 'justify-center min-h-screen py-8'} px-4`}>
        {/* Content Display - Main Focal Point */}
        <div className={`w-full ${isMobile ? 'max-w-xs mb-1' : 'max-w-3xl mb-6'} space-y-1`}>
          <ImageCard
            imageUrl={currentItem?.url}
            isLoading={isLoading || !currentItem}
            isRevealed={hasVoted}
            isBot={currentItem?.is_bot}
            wasCorrect={wasCorrect}
            onError={handleContentError}
            isMobile={isMobile}
          />
          {hasVoted && currentItem && !isMobile && (
            <>
              <ImageAnalysis image={currentItem} />
              <ImageComments imageId={currentItem.id} isRevealed={hasVoted} />
            </>
          )}
        </div>
        
        {/* Voting Section */}
        <div className={`w-full ${isMobile ? 'max-w-xs' : 'max-w-2xl'}`}>
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
              !isMobile && (
                <motion.div
                  key="share"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-center"
                >
                  <ShareButton
                    contentUrl={currentItem?.url}
                    contentType="image"
                    isBot={currentItem?.is_bot}
                    wasCorrect={wasCorrect}
                  />
                </motion.div>
              )
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
        <div className={`${isMobile ? 'relative mt-1' : 'absolute bottom-32 left-4 right-4'}`}>
          <StatsBar 
            totalVotes={stats.total}
            correctVotes={stats.correct}
            streak={stats.streak}
          />
        </div>

      </div>

      {/* Mobile Navigation and Skip Button */}
      {isMobile && (
        <>
          <MobileNav currentPageName="Home" />
          <button
            onClick={handleSkip}
            disabled={isLoading || hasVoted}
            className="fixed top-20 right-4 z-50 w-12 h-12 rounded-full bg-black/80 backdrop-blur-md border-2 border-purple-500/30 text-green-400 hover:bg-purple-900/30 hover:text-white flex items-center justify-center shadow-lg transition-all disabled:opacity-50"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
}