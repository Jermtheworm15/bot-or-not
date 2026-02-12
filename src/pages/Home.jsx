import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import ImageCard from '@/components/voting/ImageCard';
import VideoCard from '@/components/voting/VideoCard';
import VotingButtons from '@/components/voting/VotingButtons';
import RatingSlider from '@/components/voting/RatingSlider';
import StatsBar from '@/components/voting/StatsBar';
import ShareButton from '@/components/social/ShareButton';
import InviteFriends from '@/components/social/InviteFriends';
import SuccessExplosion from '@/components/gamification/SuccessExplosion';
import ChallengesSidebar from '@/components/gamification/ChallengesSidebar';
import { createPageUrl } from '@/utils';
import { Bot, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function Home() {
  const [contentType, setContentType] = useState('image'); // 'image' or 'video'
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [rating, setRating] = useState(5);
  const [stats, setStats] = useState({ total: 0, correct: 0, streak: 0 });
  const [showExplosion, setShowExplosion] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  
  useEffect(() => {
    checkUsernameAndLoad();
  }, [contentType]);
  
  const checkUsernameAndLoad = async () => {
    try {
      const user = await base44.auth.me();
      if (!user.username) {
        window.location.href = createPageUrl('UsernameSetup');
        return;
      }
    } catch (err) {
      console.log('Auth check error:', err);
    }
    
    loadContent();
    loadUserProfile();
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
    
    const data = contentType === 'image' 
      ? await base44.entities.Image.list()
      : await base44.entities.Video.list();
    
    // Shuffle content with Fisher-Yates algorithm for better randomization
    const shuffled = [...data];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setItems(shuffled);
    setIsLoading(false);
  };
  
  const currentItem = items[currentIndex];
  
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
      
      await base44.entities.UserProfile.update(userProfile.id, {
        points: (userProfile.points || 0) + pointsEarned,
        daily_votes: (userProfile.daily_votes || 0) + 1,
        weekly_votes: (userProfile.weekly_votes || 0) + 1,
        perfect_streak: Math.max(userProfile.perfect_streak || 0, newStreak),
        badges: newBadges,
        last_vote_date: new Date().toISOString()
      });
      
      await loadUserProfile();
    }
    
    // Get current user
    const user = await base44.auth.me();
    
    // Save vote (without rating yet)
    if (contentType === 'image') {
      await base44.entities.Vote.create({
        image_id: currentItem.id,
        guessed_bot: guessedBot,
        was_correct: correct,
        user_email: user.email
      });
    } else {
      await base44.entities.VideoVote.create({
        video_id: currentItem.id,
        guessed_bot: guessedBot,
        was_correct: correct,
        user_email: user.email
      });
    }
  };
  
  const handleSubmitRating = async () => {
    // Update the vote with rating
    if (contentType === 'image') {
      const votes = await base44.entities.Vote.filter({ image_id: currentItem.id }, '-created_date', 1);
      if (votes.length > 0) {
        await base44.entities.Vote.update(votes[0].id, { rating });
      }
    } else {
      const votes = await base44.entities.VideoVote.filter({ video_id: currentItem.id }, '-created_date', 1);
      if (votes.length > 0) {
        await base44.entities.VideoVote.update(votes[0].id, { rating });
      }
    }
    
    // Move to next item
    setRating(5);
    setHasVoted(false);
    
    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Reload and shuffle content
      await loadContent();
      setCurrentIndex(0);
    }
  };
  
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />
      
      {/* Success Explosion */}
      <SuccessExplosion show={showExplosion} />
      
      {/* Challenges Sidebar */}
      <ChallengesSidebar userProfile={userProfile} />
      
      <div className="relative z-10 max-w-lg mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-4xl font-black tracking-tight">
              Bot or Not
            </h1>
          </div>
          <div className="flex items-center justify-center gap-3">
            <p className="text-zinc-400">
              {contentType === 'image' ? 'Can you spot the AI-generated faces?' : 'Can you spot the AI-generated characters?'}
            </p>
            <InviteFriends />
          </div>
          
          {/* Content Type Selector */}
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => setContentType('image')}
              variant={contentType === 'image' ? 'default' : 'outline'}
              className={contentType === 'image' 
                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                : 'border-purple-500/50 text-green-400 hover:bg-purple-900/30'}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Images
            </Button>
            <Button
              onClick={() => setContentType('video')}
              variant={contentType === 'video' ? 'default' : 'outline'}
              className={contentType === 'video' 
                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                : 'border-purple-500/50 text-green-400 hover:bg-purple-900/30'}
            >
              <VideoIcon className="w-4 h-4 mr-2" />
              Videos
            </Button>
          </div>
        </motion.div>
        
        {/* Stats */}
        <StatsBar 
          totalVotes={stats.total}
          correctVotes={stats.correct}
          streak={stats.streak}
        />
        
        {/* Content Display */}
        {contentType === 'image' ? (
          <ImageCard
            imageUrl={currentItem?.url}
            isLoading={isLoading || !currentItem}
            isRevealed={hasVoted}
            isBot={currentItem?.is_bot}
            wasCorrect={wasCorrect}
          />
        ) : (
          <VideoCard
            videoUrl={currentItem?.url}
            isLoading={isLoading || !currentItem}
            isRevealed={hasVoted}
            isBot={currentItem?.is_bot}
            wasCorrect={wasCorrect}
          />
        )}
        
        {/* Voting/Rating Section */}
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
                  contentType={contentType}
                  isBot={currentItem?.is_bot}
                  wasCorrect={wasCorrect}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Progress indicator */}
        {items.length > 0 && (
          <div className="text-center text-zinc-600 text-sm">
            {contentType === 'image' ? 'Image' : 'Video'} {currentIndex + 1} of {items.length}
          </div>
        )}
      </div>
    </div>
  );
}