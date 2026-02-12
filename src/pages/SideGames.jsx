import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Smile, Frown, ArrowRight, RefreshCw } from 'lucide-react';

export default function SideGames() {
  const [selectedGame, setSelectedGame] = useState('best_hair');
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [votedIds, setVotedIds] = useState(new Set());

  const games = [
    { id: 'best_hair', label: 'Best Hair', icon: Sparkles, color: 'from-purple-600 to-pink-600' },
    { id: 'best_smile', label: 'Best Smile', icon: Smile, color: 'from-yellow-600 to-orange-600' },
    { id: 'worst_frown', label: 'Worst Frown', icon: Frown, color: 'from-blue-600 to-cyan-600' }
  ];

  useEffect(() => {
    loadImages();
  }, [selectedGame]);

  const loadImages = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      
      // Load all images and user's votes for this attribute
      const [allImages, userVotes] = await Promise.all([
        base44.entities.Image.list(),
        base44.entities.AttributeVote.filter({ 
          user_email: user.email,
          attribute_type: selectedGame 
        })
      ]);

      // Get IDs of images user has already voted on for this attribute
      const votedImageIds = new Set(userVotes.map(v => v.image_id));
      setVotedIds(votedImageIds);

      // Filter out invalid URLs and already-voted items
      const unseenImages = allImages.filter(img => 
        img.url && 
        img.url.trim() !== '' && 
        !votedImageIds.has(img.id)
      );

      // If user has seen everything, show all images again
      const validImages = unseenImages.length > 0 ? unseenImages : allImages.filter(img => img.url && img.url.trim() !== '');

      // Shuffle images
      const shuffled = [...validImages];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      setImages(shuffled);
      setCurrentIndex(0);
      setRating(5);
    } catch (err) {
      console.error('Error loading images:', err);
    }
    setIsLoading(false);
  };

  const handleVote = async () => {
    const currentImage = images[currentIndex];
    if (!currentImage) return;

    try {
      const user = await base44.auth.me();

      await base44.entities.AttributeVote.create({
        image_id: currentImage.id,
        user_email: user.email,
        attribute_type: selectedGame,
        rating
      });

      // Move to next image
      if (currentIndex < images.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        await loadImages();
      }
      setRating(5);
    } catch (err) {
      console.error('Error submitting vote:', err);
    }
  };

  const handleSkip = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
    setRating(5);
  };

  const currentImage = images[currentIndex];
  const currentGameData = games.find(g => g.id === selectedGame);
  const GameIcon = currentGameData?.icon || Sparkles;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent">
            Side Games
          </h1>
          <p className="text-zinc-400">Vote on specific attributes and discover the best!</p>
        </div>

        {/* Game Selection */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {games.map(game => {
            const Icon = game.icon;
            return (
              <Button
                key={game.id}
                onClick={() => setSelectedGame(game.id)}
                className={`flex-1 min-w-[120px] h-16 text-sm font-bold ${
                  selectedGame === game.id
                    ? `bg-gradient-to-r ${game.color} text-white shadow-lg`
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {game.label}
              </Button>
            );
          })}
        </div>

        {/* Image Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl mx-auto mb-6"
          >
            {isLoading || !currentImage ? (
              <Skeleton className="w-full aspect-square rounded-2xl" />
            ) : (
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-purple-500/30">
                <img
                  src={currentImage.url}
                  alt="Vote on this"
                  className="w-full aspect-square object-cover"
                  onError={() => handleSkip()}
                />
                <div className={`absolute top-4 left-4 bg-gradient-to-r ${currentGameData.color} px-4 py-2 rounded-full flex items-center gap-2 shadow-lg`}>
                  <GameIcon className="w-5 h-5 text-white" />
                  <span className="text-white font-bold text-sm">{currentGameData.label}</span>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Rating Slider */}
        <div className="w-full max-w-md mx-auto mb-6 space-y-4">
          <div className="text-center">
            <p className="text-zinc-400 text-sm uppercase tracking-wider mb-2">Rate this {currentGameData?.label}</p>
            <div className="flex items-center justify-center gap-2">
              <GameIcon className="w-6 h-6 text-purple-400" />
              <span className="text-4xl font-bold text-white">{rating}</span>
              <span className="text-zinc-500 text-xl">/10</span>
            </div>
          </div>

          <div className="px-4">
            <Slider
              value={[rating]}
              onValueChange={(value) => setRating(value[0])}
              min={1}
              max={10}
              step={1}
              className="w-full"
              disabled={isLoading || !currentImage}
            />
            <div className="flex justify-between mt-3 text-xs text-zinc-500">
              <span>Poor</span>
              <span>Amazing</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSkip}
              disabled={isLoading || !currentImage}
              variant="outline"
              className="flex-1 border-purple-500/50 text-green-400 hover:bg-purple-900/30"
            >
              Skip
            </Button>
            <Button
              onClick={handleVote}
              disabled={isLoading || !currentImage}
              className={`flex-1 bg-gradient-to-r ${currentGameData.color} hover:opacity-90 text-white font-semibold text-lg gap-2 shadow-lg`}
            >
              Vote
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          <Button
            onClick={loadImages}
            disabled={isLoading}
            variant="ghost"
            className="w-full text-zinc-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reload Images
          </Button>
        </div>

        {/* Stats */}
        <div className="text-center text-sm text-zinc-500">
          {images.length > 0 && (
            <p>Image {currentIndex + 1} of {images.length}</p>
          )}
        </div>
      </div>
    </div>
  );
}