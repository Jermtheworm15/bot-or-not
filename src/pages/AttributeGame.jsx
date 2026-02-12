import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import ImageCard from '@/components/voting/ImageCard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ChevronLeft } from 'lucide-react';
import { createPageUrl } from '@/utils';

const ATTRIBUTES = [
  { id: 'best_hair', label: 'Best Hair', emoji: '💇', color: 'from-amber-500 to-orange-500' },
  { id: 'best_smile', label: 'Best Smile', emoji: '😊', color: 'from-yellow-500 to-orange-500' },
  { id: 'worst_frown', label: 'Worst Frown', emoji: '😞', color: 'from-red-500 to-pink-500' }
];

export default function AttributeGame() {
  const [selectedAttribute, setSelectedAttribute] = useState(null);
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [hasRated, setHasRated] = useState(false);
  const [userVotes, setUserVotes] = useState({});

  const currentItem = items[currentIndex];

  useEffect(() => {
    if (selectedAttribute) {
      loadAttributeContent();
    }
  }, [selectedAttribute]);

  const loadAttributeContent = async () => {
    setIsLoading(true);
    setCurrentIndex(0);
    setHasRated(false);
    
    try {
      const user = await base44.auth.me();
      const images = await base44.entities.Image.list();
      
      // Get user's existing votes for this attribute
      const votes = await base44.entities.AttributeVote.filter({
        user_email: user.email,
        attribute_type: selectedAttribute
      });
      
      const votedIds = new Set(votes.map(v => v.image_id));
      const unseenImages = images.filter(img => !votedIds.has(img.id) && img.url);
      
      const validImages = unseenImages.length > 0 ? unseenImages : images.filter(img => img.url);
      
      setItems(validImages);
      setUserVotes(Object.fromEntries(votes.map(v => [v.image_id, v.rating])));
    } catch (err) {
      console.error('Error loading content:', err);
      setItems([]);
    }
    setIsLoading(false);
  };

  const handleRate = async () => {
    if (!currentItem || !selectedAttribute) return;

    try {
      const user = await base44.auth.me();
      
      await base44.entities.AttributeVote.create({
        image_id: currentItem.id,
        user_email: user.email,
        attribute_type: selectedAttribute,
        rating
      });

      setUserVotes(prev => ({ ...prev, [currentItem.id]: rating }));
      setRating(5);
      setHasRated(false);

      if (currentIndex < items.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        await loadAttributeContent();
      }
    } catch (err) {
      console.error('Error saving rating:', err);
    }
  };

  if (!selectedAttribute) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white py-12">
        <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-black mb-2">Attribute Voting</h1>
            <p className="text-zinc-400">Vote on specific features and build your custom leaderboards</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4">
            {ATTRIBUTES.map(attr => (
              <motion.button
                key={attr.id}
                onClick={() => setSelectedAttribute(attr.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className={`bg-gradient-to-br ${attr.color} p-8 rounded-xl text-center hover:shadow-2xl transition-all`}
              >
                <div className="text-5xl mb-3">{attr.emoji}</div>
                <h2 className="text-2xl font-bold text-white">{attr.label}</h2>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const attribute = ATTRIBUTES.find(a => a.id === selectedAttribute);

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-12">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />
      
      <div className="relative z-10 max-w-3xl mx-auto px-4">
        <button
          onClick={() => setSelectedAttribute(null)}
          className="mb-6 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Attributes
        </button>

        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-8">
          <div className="text-5xl mb-3">{attribute.emoji}</div>
          <h1 className="text-4xl font-black">{attribute.label}</h1>
          <p className="text-zinc-400 mt-2">Rate from 1-10</p>
        </motion.div>

        <div className="mb-6">
          <ImageCard
            imageUrl={currentItem?.url}
            isLoading={isLoading || !currentItem}
            isRevealed={hasRated}
            onError={() => {
              if (currentIndex < items.length - 1) {
                setCurrentIndex(prev => prev + 1);
              }
            }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Rating</label>
                  <span className="text-2xl font-bold text-amber-400">{rating}/10</span>
                </div>
                <Slider
                  value={[rating]}
                  onValueChange={(val) => setRating(val[0])}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex gap-2 justify-between text-xs text-zinc-500">
                  <span>1 - Poor</span>
                  <span>10 - Excellent</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleRate}
            disabled={isLoading || !currentItem}
            className="w-full h-12 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white font-semibold"
          >
            Rate & Continue
          </Button>
        </motion.div>
      </div>
    </div>
  );
}