import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { SkipForward, RefreshCw, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { playSound } from '@/components/audio/SoundEffects';
import { Button } from '@/components/ui/button';
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
import DifficultyRating from '@/components/voting/DifficultyRating';
import RewardNotification from '@/components/rewards/RewardNotification';




export default function Home() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
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
  const [currentItem, setCurrentItem] = useState(null);
  const [errorSkipInProgress, setErrorSkipInProgress] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const pullRef = useRef(null);
  const loadingGuard = useRef(false);
  const [rewardNotification, setRewardNotification] = useState(null);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    checkUsernameAndLoad();
  }, []);

  // Preload next image whenever items or currentItem changes
  useEffect(() => {
    if (!items.length || !currentItem) return;
    const idx = items.findIndex(i => i.id === currentItem.id);
    if (idx >= 0 && idx < items.length - 1) {
      const nextImage = items[idx + 1];
      if (nextImage?.url) {
        const img = new Image();
        img.src = nextImage.url;
      }
    }
  }, [currentItem, items]);
  
  const checkUsernameAndLoad = async () => {
    try {
      const user = await base44.auth.me();
      if (!user) {
        window.location.href = '/Landing';
        return;
      }

      // Check if user has completed onboarding (username, password, profile)
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (profiles.length === 0) {
        window.location.href = '/Onboarding';
        return;
      }

      // Check if user has set username
      if (!user.full_name) {
        window.location.href = '/Onboarding';
        return;
      }

      // Check for referral code in URL
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref');
      if (refCode) {
        handleReferral(refCode, user.email);
      }
      
      loadContent();
      loadUserProfile();
    } catch (err) {
      console.log('Auth check error:', err);
      window.location.href = '/Landing';
    }
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
    // Guard against concurrent loads (e.g. React Strict Mode double-invoke)
    if (loadingGuard.current) return;
    loadingGuard.current = true;

    setIsLoading(true);
    setHasVoted(false);

    try {
      const user = await base44.auth.me();
      if (!user) {
        loadingGuard.current = false;
        return;
      }

      // Load images and user's votes in parallel - INCREASED POOL SIZE
      const [rawData, userVotes] = await Promise.all([
        base44.entities.Image.list('-created_date', 500), // Increased from 100 to 500
        base44.entities.Vote.filter({ user_email: user.email })
      ]);

      console.log('[Voting] Loaded', rawData.length, 'total images from database');
      
      // Count user-uploaded images
      const uploadedCount = rawData.filter(img => img.user_uploaded === true).length;
      console.log('[Voting] Found', uploadedCount, 'user-uploaded images in pool');

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
      // Also reject items that are clearly not person images based on source metadata
      const REJECT_TERMS = ['landscape', 'building', 'animal', 'dog', 'cat', 'bird', 'plant', 'flower', 'tree', 'mountain', 'ocean', 'sky', 'sunset', 'abstract', 'food', 'car', 'interior', 'nature', 'forest', 'beach'];
      const validData = data.filter(item => {
        const hasUrl = item.url && typeof item.url === 'string' && item.url.trim() !== '';
        if (!hasUrl) return false;
        // Soft reject based on ai_tags or ai_category metadata
        const tags = (item.ai_tags || []).join(' ').toLowerCase();
        const category = (item.ai_category || '').toLowerCase();
        if (REJECT_TERMS.some(t => tags.includes(t) || category.includes(t))) {
          console.log('[Voting] Filtered out image due to content tags:', item.id, 'tags:', tags, 'category:', category);
          return false;
        }
        return true;
      });

      console.log('[Voting] After filtering:', validData.length, 'valid images');
      const uploadedValidCount = validData.filter(img => img.user_uploaded === true).length;
      console.log('[Voting] User-uploaded images in valid pool:', uploadedValidCount);

      // IMPROVED: Filter out recently voted images (last 100 votes) + session-viewed images
      const sessionViewedIds = JSON.parse(sessionStorage.getItem('viewedImages') || '[]');
      const recentVotedIds = new Set([
        ...userVotes
          .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
          .slice(0, 100) // Increased from 50 to 100
          .map(v => v.image_id),
        ...sessionViewedIds
      ]);
      
      const freshData = validData.filter(item => !recentVotedIds.has(item.id));
      console.log('[Voting] After filtering recently voted:', freshData.length, 'fresh images');
      console.log('[Voting] Session viewed images filtered:', sessionViewedIds.length);
      const uploadedFreshCount = freshData.filter(img => img.user_uploaded === true).length;
      console.log('[Voting] User-uploaded images in fresh pool:', uploadedFreshCount);

      // Use fresh data if available, otherwise fall back to valid data
      const finalData = freshData.length > 10 ? freshData : validData;

      if (finalData.length === 0) {
        console.log('[Voting] No images available for voting');
        setItems([]);
        setIsLoading(false);
        return;
      }

      // IMPROVED RANDOMIZATION: Fisher-Yates shuffle for better distribution
      const fisherYatesShuffle = (array) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      // Separate by gender for balanced distribution
      const maleImages = finalData.filter(item => item.gender === 'male');
      const femaleImages = finalData.filter(item => item.gender === 'female');
      const otherImages = finalData.filter(item => item.gender === 'other' || item.gender === 'unknown');
      
      console.log('[Voting] Gender distribution - Male:', maleImages.length, 'Female:', femaleImages.length, 'Other/Unknown:', otherImages.length);

      // Shuffle each group with Fisher-Yates
      const shuffleMale = fisherYatesShuffle(maleImages);
      const shuffleFemale = fisherYatesShuffle(femaleImages);
      const shuffleOther = fisherYatesShuffle(otherImages);

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

      console.log('[Voting] Final shuffled queue size:', shuffled.length, 'images');
      console.log('[Voting] First image:', shuffled[0]?.id, 'User-uploaded:', shuffled[0]?.user_uploaded);

      // Track session-viewed images (keep last 50 in memory)
      const currentSessionViewed = JSON.parse(sessionStorage.getItem('viewedImages') || '[]');
      sessionStorage.setItem('viewedImages', JSON.stringify([...currentSessionViewed, shuffled[0]?.id].slice(-50)));

      setItems(shuffled);
      // Lock in the first item immediately so it never re-randomizes
      setCurrentItem(shuffled[0]);
    } catch (err) {
      console.error('Error loading content:', err);
      setItems([]);
      setCurrentItem(null);
    }
    setIsLoading(false);
    loadingGuard.current = false;
  };

  
  const handleVote = async (guessedBot) => {
    if (!currentItem || hasVoted) return;
    // Snapshot the item at vote time — prevents any async re-render from changing it
    const votedItem = currentItem;

    // Convert boolean to string format
    const guess = guessedBot ? 'bot' : 'human';

    // Determine if the guess was correct (use snapshot)
    let correct = false;
    if (votedItem.is_other) {
      correct = false;
    } else {
      correct = guessedBot === votedItem.is_bot;
    }

    // Play sound effect
    if (correct) {
      playSound.correct();
    } else {
      playSound.incorrect();
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
        playSound.achievement();
      }
      if (newStreak === 5 && !newBadges.includes('streak_5')) {
        newBadges.push('streak_5');
        playSound.achievement();
      }
      if (newStreak === 10 && !newBadges.includes('streak_10')) {
        newBadges.push('streak_10');
        playSound.achievement();
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
                
                // Calculate referral bonus points
                let bonusPoints = 0;
                if (newRefCount === 1) bonusPoints = 100;
                else if (newRefCount === 2) bonusPoints = 250;
                else if (newRefCount === 3) bonusPoints = 500;
                else bonusPoints = 50; // Bonus for 4th+ referral
                
                // Add referral badge for 1st referral
                const newBadges = [...(refProfile.badges || [])];
                if (newRefCount === 1 && !newBadges.includes('referrer')) {
                  newBadges.push('referrer');
                }
                if (newRefCount === 3 && !newBadges.includes('super_referrer')) {
                  newBadges.push('super_referrer');
                }
                
                await base44.entities.UserProfile.update(refProfile.id, {
                  referral_count: newRefCount,
                  is_premium: newRefCount >= 3,
                  points: (refProfile.points || 0) + bonusPoints,
                  badges: newBadges
                });

                // Create activity for referrer
                await base44.entities.Activity.create({
                  user_email: ref.referrer_email,
                  username: ref.referrer_email.split('@')[0],
                  action_type: 'badge_earned',
                  description: `Earned ${bonusPoints} points from referral!`,
                  metadata: { referralCount: newRefCount, bonusPoints }
                });
              }
            }
          } catch (err) {
            console.log('Referral completion error:', err);
          }
        }
      
      await loadUserProfile();
    }

    // Save vote (use snapshot to guarantee correct image id)
    const vote = await base44.entities.Vote.create({
      image_id: votedItem.id,
      guess: guess,
      guessed_bot: guess === 'bot',
      was_correct: correct,
      user_email: user.email
    });

    // Process vote reward (handles streak tracking + token grants server-side)
    try {
      const rewardResult = await base44.functions.invoke('processVoteReward', {
        vote_id: vote.id,
        was_correct: correct,
        image_id: votedItem.id
      });

      if (correct && rewardResult.data?.success) {
        const rewardData = rewardResult.data;
        let message = `Correct vote!`;
        if (rewardData.streak_bonus > 0) {
          message = rewardData.streak_message || `${rewardData.current_streak}-vote streak!`;
        }
        setRewardNotification({
          amount: rewardData.reward_amount,
          message: message,
          streak: rewardData.current_streak
        });
      }
    } catch (error) {
      console.error('[Reward] Error processing vote reward:', error);
    }

    // Create social feed activity for milestones
    if (correct && newStreak % 10 === 0 && newStreak > 0) {
      try {
        await base44.entities.SocialFeed.create({
          user_email: user.email,
          activity_type: 'vote_milestone',
          title: `${newStreak} Correct Votes!`,
          description: `Achieved ${newStreak} correct votes in a row`,
          metadata: { streak: newStreak }
        });
      } catch (error) {
        console.error('[Feed] Error creating feed item:', error);
      }
    }

            // Do NOT auto-advance — wait for difficulty rating submission
          };
  
  const handleContentError = () => {
    if (errorSkipInProgress) return;
    setErrorSkipInProgress(true);

    setTimeout(() => {
      const idx = items.findIndex(i => i.id === currentItem?.id);
      if (idx >= 0 && idx < items.length - 1) {
        setCurrentItem(items[idx + 1]);
      } else {
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

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    const isFirstItem = items.length === 0 || (currentItem && items[0]?.id === currentItem.id);
    if (isFirstItem) {
      const touch = e.touches[0].clientY;
      const diff = touch - touchStart;
      if (diff > 0 && diff < 100) {
        setIsPulling(true);
      }
    }
  };

  const handleTouchEnd = () => {
    if (isPulling) {
      handleRefresh();
    }
    setIsPulling(false);
  };

  const handleShowInfo = () => {
    if (currentItem) {
      alert(`Image Info:\nSource: ${currentItem.source || 'Unknown'}\nUploader: ${currentItem.uploader_name || 'N/A'}\nCategory: ${currentItem.ai_category || 'N/A'}`);
    }
  };


  
  const moveToNextImage = () => {
    setHasVoted(false);
    setPointsAnimations(prev => prev.slice(-5));

    const idx = items.findIndex(i => i.id === currentItem?.id);
    if (idx >= 0 && idx < items.length - 1) {
      const nextItem = items[idx + 1];
      
      // Track in session storage
      const currentSessionViewed = JSON.parse(sessionStorage.getItem('viewedImages') || '[]');
      sessionStorage.setItem('viewedImages', JSON.stringify([...currentSessionViewed, nextItem.id].slice(-50)));
      
      setCurrentItem(nextItem);
    } else {
      loadContent();
    }
  };
  
  return (
    <div 
      className="min-h-screen bg-zinc-950 text-white overflow-x-hidden"
      ref={pullRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />

      {/* Pull to Refresh Indicator */}
      {isMobile && isPulling && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40"
        >
          <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
        </motion.div>
      )}

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

      {/* Reward Notification */}
      {rewardNotification && (
        <RewardNotification 
          reward={rewardNotification}
          onComplete={() => setRewardNotification(null)}
        />
      )}
      
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
              <DifficultyRating imageId={currentItem.id} onRated={moveToNextImage} onSkip={moveToNextImage} />
              <ImageAnalysis image={currentItem} />
              <ImageComments imageId={currentItem.id} isRevealed={hasVoted} />
            </>
          )}
          {hasVoted && currentItem && isMobile && (
            <DifficultyRating imageId={currentItem.id} onRated={moveToNextImage} onSkip={moveToNextImage} />
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
          <>
            <div className="absolute top-4 right-4 z-20">
              <InviteFriends />
            </div>
            <div className="absolute top-4 left-4 z-20">
              <Button
                onClick={() => navigate('/BlitzMode')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold shadow-lg cursor-pointer"
              >
                <Zap className="w-5 h-5 mr-2" />
                Blitz Mode
              </Button>
            </div>
          </>
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
            className="fixed top-20 right-4 z-50 w-12 h-12 rounded-full bg-black/80 backdrop-blur-md border-2 border-purple-500/30 text-green-400 hover:bg-purple-900/30 hover:text-white flex items-center justify-center shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
}