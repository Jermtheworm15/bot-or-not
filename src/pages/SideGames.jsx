import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Smile, Frown, ArrowRight, RefreshCw, Trophy, Filter } from 'lucide-react';

export default function SideGames() {
  const [view, setView] = useState('vote'); // 'vote', 'results', 'explore'
  const [selectedGame, setSelectedGame] = useState('best_hair');
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [votedIds, setVotedIds] = useState(new Set());
  const [topRatedImages, setTopRatedImages] = useState({});
  const [exploreImages, setExploreImages] = useState([]);

  const games = [
    { id: 'best_hair', label: 'Best Hair', icon: Sparkles, color: 'from-purple-600 to-pink-600' },
    { id: 'best_smile', label: 'Best Smile', icon: Smile, color: 'from-yellow-600 to-orange-600' },
    { id: 'worst_frown', label: 'Worst Frown', icon: Frown, color: 'from-blue-600 to-cyan-600' }
  ];

  useEffect(() => {
    if (view === 'vote') {
      loadImages();
    } else if (view === 'results') {
      loadTopRated();
    } else if (view === 'explore') {
      loadExploreImages();
    }
  }, [selectedGame, view]);

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

  const loadTopRated = async () => {
    setIsLoading(true);
    try {
      // Load all votes for each attribute
      const allVotes = await base44.entities.AttributeVote.list();
      
      // Group by attribute and calculate average ratings
      const attributeData = {};
      
      games.forEach(game => {
        const gameVotes = allVotes.filter(v => v.attribute_type === game.id);
        const imageRatings = {};
        
        gameVotes.forEach(vote => {
          if (!imageRatings[vote.image_id]) {
            imageRatings[vote.image_id] = { sum: 0, count: 0, imageId: vote.image_id };
          }
          imageRatings[vote.image_id].sum += vote.rating;
          imageRatings[vote.image_id].count += 1;
        });
        
        // Calculate averages and sort
        const sorted = Object.values(imageRatings)
          .map(r => ({ imageId: r.imageId, avgRating: r.sum / r.count, voteCount: r.count }))
          .filter(r => r.voteCount >= 3) // Minimum 3 votes to appear in results
          .sort((a, b) => b.avgRating - a.avgRating)
          .slice(0, 10);
        
        attributeData[game.id] = sorted;
      });
      
      // Load image details
      const allImages = await base44.entities.Image.list();
      const imageMap = {};
      allImages.forEach(img => imageMap[img.id] = img);
      
      // Attach image data to ratings
      Object.keys(attributeData).forEach(attr => {
        attributeData[attr] = attributeData[attr]
          .map(r => ({ ...r, image: imageMap[r.imageId] }))
          .filter(r => r.image); // Filter out missing images
      });
      
      setTopRatedImages(attributeData);
    } catch (err) {
      console.error('Error loading top rated:', err);
    }
    setIsLoading(false);
  };

  const loadExploreImages = async () => {
    setIsLoading(true);
    try {
      const [allImages, allVotes] = await Promise.all([
        base44.entities.Image.list(),
        base44.entities.AttributeVote.filter({ attribute_type: selectedGame })
      ]);
      
      // Calculate average ratings for each image
      const imageRatings = {};
      allVotes.forEach(vote => {
        if (!imageRatings[vote.image_id]) {
          imageRatings[vote.image_id] = { sum: 0, count: 0 };
        }
        imageRatings[vote.image_id].sum += vote.rating;
        imageRatings[vote.image_id].count += 1;
      });
      
      // Attach ratings to images and filter
      const imagesWithRatings = allImages
        .filter(img => img.url && imageRatings[img.id])
        .map(img => ({
          ...img,
          avgRating: imageRatings[img.id].sum / imageRatings[img.id].count,
          voteCount: imageRatings[img.id].count
        }))
        .sort((a, b) => b.avgRating - a.avgRating);
      
      setExploreImages(imagesWithRatings);
    } catch (err) {
      console.error('Error loading explore images:', err);
    }
    setIsLoading(false);
  };

  const currentImage = images[currentIndex];
  const currentGameData = games.find(g => g.id === selectedGame);
  const GameIcon = currentGameData?.icon || Sparkles;

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent">
            Side Games
          </h1>
          <p className="text-zinc-400">Vote on specific attributes and discover the best!</p>
        </div>

        {/* View Tabs */}
        <Tabs value={view} onValueChange={setView} className="mb-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 bg-zinc-900">
            <TabsTrigger value="vote">Vote</TabsTrigger>
            <TabsTrigger value="results">
              <Trophy className="w-4 h-4 mr-2" />
              Results
            </TabsTrigger>
            <TabsTrigger value="explore">
              <Filter className="w-4 h-4 mr-2" />
              Explore
            </TabsTrigger>
          </TabsList>
        </Tabs>

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

        {/* Vote View */}
        {view === 'vote' && (
          <>
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

            <div className="text-center text-sm text-zinc-500">
              {images.length > 0 && (
                <p>Image {currentIndex + 1} of {images.length}</p>
              )}
            </div>
          </>
        )}

        {/* Results View */}
        {view === 'results' && (
          <div className="space-y-8">
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="w-full aspect-square rounded-xl" />
                ))}
              </div>
            ) : (
              <>
                {topRatedImages[selectedGame]?.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {topRatedImages[selectedGame].map((item, index) => (
                      <motion.div
                        key={item.imageId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative rounded-xl overflow-hidden shadow-xl border border-purple-500/20 group"
                      >
                        <img
                          src={item.image.url}
                          alt={`Ranked #${index + 1}`}
                          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-3xl font-black text-white">#{index + 1}</span>
                              <div className={`bg-gradient-to-r ${currentGameData.color} px-3 py-1 rounded-full`}>
                                <span className="text-white font-bold text-sm">{item.avgRating.toFixed(1)}</span>
                              </div>
                            </div>
                            <span className="text-zinc-400 text-xs">{item.voteCount} votes</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Trophy className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
                    <p className="text-zinc-400">No results yet. Start voting to see top-rated images!</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Explore View */}
        {view === 'explore' && (
          <div className="space-y-6">
            {isLoading ? (
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="w-full aspect-square rounded-lg" />
                ))}
              </div>
            ) : exploreImages.length > 0 ? (
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                {exploreImages.map((img, index) => (
                  <motion.div
                    key={img.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative rounded-lg overflow-hidden shadow-lg border border-purple-500/20 group cursor-pointer hover:scale-105 transition-transform"
                  >
                    <img
                      src={img.url}
                      alt="Image"
                      className="w-full aspect-square object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="flex items-center justify-between">
                          <div className={`bg-gradient-to-r ${currentGameData.color} px-2 py-1 rounded-full`}>
                            <span className="text-white font-bold text-sm">{img.avgRating.toFixed(1)}</span>
                          </div>
                          <span className="text-white text-xs">{img.voteCount} votes</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Filter className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
                <p className="text-zinc-400">No images found. Start voting to populate this view!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}