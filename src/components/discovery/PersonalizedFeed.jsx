import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';
import ImageCard from '@/components/voting/ImageCard';
import VotingButtons from '@/components/voting/VotingButtons';
import RatingSlider from '@/components/voting/RatingSlider';

export default function PersonalizedFeed() {
  const [personalizedImages, setPersonalizedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [rating, setRating] = useState(5);
  const [userProfile, setUserProfile] = useState(null);

  const currentItem = personalizedImages[currentIndex];

  useEffect(() => {
    loadPersonalizedContent();
  }, []);

  const loadPersonalizedContent = async () => {
    setIsLoading(true);

    try {
      const user = await base44.auth.me();
      if (!user) return;

      // Get user profile to understand preferences
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (profiles.length > 0) {
        setUserProfile(profiles[0]);
      }

      // Get all images user hasn't voted on
      const [allImages, userVotes] = await Promise.all([
        base44.entities.Image.list(),
        base44.entities.Vote.filter({ user_email: user.email })
      ]);

      const votedIds = new Set(userVotes.map(v => v.image_id));

      // Filter by user preferences and recently voted content
      const preferredImages = allImages.filter(img => {
        if (votedIds.has(img.id)) return false;

        // Prioritize images with tags/style that match user interests
        if (userProfile?.favorite_bot_types?.length > 0) {
          const hasMutualTag = img.tags?.some(tag =>
            userProfile.favorite_bot_types.some(fav =>
              tag.toLowerCase().includes(fav.toLowerCase())
            )
          );
          return hasMutualTag;
        }

        return true;
      });

      // Sort by most relevant and shuffle
      const shuffled = [...preferredImages].sort(() => Math.random() - 0.5);
      setPersonalizedImages(shuffled.slice(0, 30));
    } catch (err) {
      console.error('Error loading personalized content:', err);
      setPersonalizedImages([]);
    }

    setIsLoading(false);
  };

  const handleVote = async (guessedBot) => {
    if (!currentItem) return;

    const correct = guessedBot === currentItem.is_bot;
    setWasCorrect(correct);
    setHasVoted(true);

    // Update user favorite types based on voting
    const user = await base44.auth.me();
    if (userProfile && currentItem.tags && currentItem.tags.length > 0) {
      const newFavs = [...(userProfile.favorite_bot_types || [])];
      if (correct) {
        currentItem.tags.forEach(tag => {
          if (!newFavs.includes(tag)) {
            newFavs.push(tag);
          }
        });
        await base44.entities.UserProfile.update(userProfile.id, {
          favorite_bot_types: newFavs.slice(0, 10)
        });
      }
    }

    // Save vote
    await base44.entities.Vote.create({
      image_id: currentItem.id,
      guessed_bot: guessedBot,
      was_correct: correct,
      user_email: user.email
    });
  };

  const handleSubmitRating = async () => {
    const votes = await base44.entities.Vote.filter({ image_id: currentItem.id }, '-created_date', 1);
    if (votes.length > 0) {
      await base44.entities.Vote.update(votes[0].id, { rating });
    }

    setRating(5);
    setHasVoted(false);

    if (currentIndex < personalizedImages.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      loadPersonalizedContent();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-8 pb-28">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <h1 className="text-3xl font-black">Personalized Discovery</h1>
          </div>
          <p className="text-zinc-400">Images tailored to your interests based on your voting history</p>
        </motion.div>

        {/* Content */}
        {personalizedImages.length > 0 && currentItem ? (
          <div className="w-full max-w-3xl space-y-6">
            <ImageCard
              imageUrl={currentItem?.url}
              isLoading={isLoading || !currentItem}
              isRevealed={hasVoted}
              isBot={currentItem?.is_bot}
              wasCorrect={wasCorrect}
            />

            {/* Tags Display */}
            {currentItem?.tags && currentItem.tags.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-wrap gap-2 justify-center"
              >
                {currentItem.tags.map(tag => (
                  <span
                    key={tag}
                    className="text-xs bg-purple-600/30 border border-purple-500/50 rounded-full px-3 py-1 text-purple-300"
                  >
                    {tag}
                  </span>
                ))}
              </motion.div>
            )}

            {/* Voting Section */}
            <div className="w-full max-w-2xl mx-auto">
              {!hasVoted ? (
                <VotingButtons onVote={handleVote} disabled={isLoading} />
              ) : (
                <RatingSlider
                  rating={rating}
                  onRatingChange={setRating}
                  onSubmit={handleSubmitRating}
                />
              )}
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-zinc-400 mb-4">No more personalized content available.</p>
            <button
              onClick={loadPersonalizedContent}
              className="text-purple-400 hover:text-purple-300 font-medium"
            >
              Refresh Feed
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}