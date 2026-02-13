import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Bot, User, Trophy, RefreshCw } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

export default function Leaderboard() {
  const [botLeaderboard, setBotLeaderboard] = useState([]);
  const [humanLeaderboard, setHumanLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const pullRef = useRef(null);

  useEffect(() => {
    loadLeaderboards();
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadLeaderboards = async () => {
    setIsLoading(true);
    
    const [images, votes] = await Promise.all([
      base44.entities.Image.list(),
      base44.entities.Vote.list()
    ]);

    // Calculate weighted ratings per image
    const imageRatings = {};
    votes.forEach(vote => {
      if (vote.rating && vote.image_id) {
        if (!imageRatings[vote.image_id]) {
          imageRatings[vote.image_id] = { total: 0, count: 0, correct: 0 };
        }
        imageRatings[vote.image_id].total += vote.rating;
        imageRatings[vote.image_id].count += 1;
        if (vote.was_correct) {
          imageRatings[vote.image_id].correct += 1;
        }
      }
    });

    // Add weighted ratings to images
    const imagesWithRatings = images
      .map(img => {
        const stats = imageRatings[img.id];
        if (!stats || stats.count < 3) return null; // Minimum 3 votes
        
        const avgRating = stats.total / stats.count;
        const accuracy = stats.correct / stats.count;
        // Difficulty multiplier: harder images get bonus
        const difficultyBonus = 1 + (1 - accuracy) * 0.3;
        const weightedScore = avgRating * difficultyBonus;
        
        return {
          ...img,
          avgRating,
          voteCount: stats.count,
          accuracy,
          weightedScore
        };
      })
      .filter(img => img !== null);

    // Split into bots and humans, sort by weighted score then vote count
    const bots = imagesWithRatings
      .filter(img => img.is_bot)
      .sort((a, b) => {
        const scoreDiff = b.weightedScore - a.weightedScore;
        return Math.abs(scoreDiff) > 0.1 ? scoreDiff : b.voteCount - a.voteCount;
      })
      .slice(0, 10);

    const humans = imagesWithRatings
      .filter(img => !img.is_bot)
      .sort((a, b) => {
        const scoreDiff = b.weightedScore - a.weightedScore;
        return Math.abs(scoreDiff) > 0.1 ? scoreDiff : b.voteCount - a.voteCount;
      })
      .slice(0, 10);

    setBotLeaderboard(bots);
    setHumanLeaderboard(humans);
    setIsLoading(false);
  };

  const LeaderboardCard = ({ image, rank }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.05 }}
    >
      <Card className="bg-zinc-900 border-zinc-800 p-4 hover:border-violet-500/50 transition-colors">
        <div className="flex items-center gap-4">
          <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
            rank === 0 ? 'bg-amber-500 text-white' :
            rank === 1 ? 'bg-zinc-400 text-white' :
            rank === 2 ? 'bg-amber-700 text-white' :
            'bg-zinc-800 text-zinc-400'
          }`}>
            {rank === 0 ? <Trophy className="w-6 h-6" /> : `#${rank + 1}`}
          </div>
          
          <img
            src={image.url}
            alt={`Rank ${rank + 1}`}
            className="w-16 h-16 rounded-lg object-cover"
          />
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-white font-bold text-lg">
                {image.avgRating.toFixed(1)}
              </span>
              <span className="text-zinc-500 text-sm">/ 10</span>
            </div>
            <p className="text-zinc-500 text-sm">{image.voteCount} votes</p>
            {image.user_uploaded && image.uploader_name && (
              <p className="text-violet-400 text-xs mt-1">by {image.uploader_name}</p>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-24 bg-zinc-800" />
      ))}
    </div>
  );

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0].clientY;
    const diff = touch - touchStart;
    if (diff > 0 && diff < 100 && pullRef.current?.scrollTop === 0) {
      setIsPulling(true);
    }
  };

  const handleTouchEnd = () => {
    if (isPulling) {
      loadLeaderboards();
    }
    setIsPulling(false);
  };

  return (
    <div 
      className="min-h-screen bg-zinc-950 text-white py-8"
      ref={pullRef}
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchMove={isMobile ? handleTouchMove : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
    >
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
      
      <div className="relative z-10 max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <Trophy className="w-10 h-10 text-amber-500" />
            <h1 className="text-4xl font-black">Top 10 Leaderboard</h1>
          </div>
          <p className="text-zinc-400">Highest rated images by community votes</p>
        </motion.div>

        <Tabs defaultValue="bots" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-zinc-900">
            <TabsTrigger value="bots" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Top Bots
            </TabsTrigger>
            <TabsTrigger value="humans" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Top Humans
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bots" className="space-y-4">
            {isLoading ? (
              <LoadingSkeleton />
            ) : botLeaderboard.length > 0 ? (
              botLeaderboard.map((image, index) => (
                <LeaderboardCard key={image.id} image={image} rank={index} />
              ))
            ) : (
              <p className="text-center text-zinc-500 py-12">No bot images rated yet</p>
            )}
          </TabsContent>

          <TabsContent value="humans" className="space-y-4">
            {isLoading ? (
              <LoadingSkeleton />
            ) : humanLeaderboard.length > 0 ? (
              humanLeaderboard.map((image, index) => (
                <LeaderboardCard key={image.id} image={image} rank={index} />
              ))
            ) : (
              <p className="text-center text-zinc-500 py-12">No human images rated yet</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}