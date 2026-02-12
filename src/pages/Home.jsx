import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import ImageCard from '@/components/voting/ImageCard';
import VotingButtons from '@/components/voting/VotingButtons';
import RatingSlider from '@/components/voting/RatingSlider';
import StatsBar from '@/components/voting/StatsBar';
import { Bot } from 'lucide-react';

export default function Home() {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [rating, setRating] = useState(5);
  const [stats, setStats] = useState({ total: 0, correct: 0, streak: 0 });
  
  useEffect(() => {
    loadImages();
  }, []);
  
  const loadImages = async () => {
    setIsLoading(true);
    const data = await base44.entities.Image.list();
    // Shuffle images
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    setImages(shuffled);
    setIsLoading(false);
  };
  
  const currentImage = images[currentIndex];
  
  const handleVote = async (guessedBot) => {
    if (!currentImage) return;
    
    const correct = guessedBot === currentImage.is_bot;
    setWasCorrect(correct);
    setHasVoted(true);
    
    // Update stats
    setStats(prev => ({
      total: prev.total + 1,
      correct: prev.correct + (correct ? 1 : 0),
      streak: correct ? prev.streak + 1 : 0
    }));
    
    // Get current user
    const user = await base44.auth.me();
    
    // Save vote (without rating yet)
    await base44.entities.Vote.create({
      image_id: currentImage.id,
      guessed_bot: guessedBot,
      was_correct: correct,
      user_email: user.email
    });
  };
  
  const handleSubmitRating = async () => {
    // Update the vote with rating
    const votes = await base44.entities.Vote.filter({ image_id: currentImage.id }, '-created_date', 1);
    if (votes.length > 0) {
      await base44.entities.Vote.update(votes[0].id, { rating });
    }
    
    // Move to next image
    setRating(5);
    setHasVoted(false);
    
    if (currentIndex < images.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Reload and shuffle images
      await loadImages();
      setCurrentIndex(0);
    }
  };
  
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />
      
      <div className="relative z-10 max-w-lg mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center space-y-2"
        >
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 shadow-lg shadow-violet-500/30">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tight">
              Bot or Not
            </h1>
          </div>
          <p className="text-zinc-400">Can you spot the AI-generated faces?</p>
        </motion.div>
        
        {/* Stats */}
        <StatsBar 
          totalVotes={stats.total}
          correctVotes={stats.correct}
          streak={stats.streak}
        />
        
        {/* Image Card */}
        <ImageCard
          imageUrl={currentImage?.url}
          isLoading={isLoading || !currentImage}
          isRevealed={hasVoted}
          isBot={currentImage?.is_bot}
          wasCorrect={wasCorrect}
        />
        
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
                disabled={isLoading || !currentImage}
              />
            </motion.div>
          ) : (
            <motion.div
              key="rating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <RatingSlider
                rating={rating}
                onRatingChange={setRating}
                onSubmit={handleSubmitRating}
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Progress indicator */}
        {images.length > 0 && (
          <div className="text-center text-zinc-600 text-sm">
            Image {currentIndex + 1} of {images.length}
          </div>
        )}
      </div>
    </div>
  );
}