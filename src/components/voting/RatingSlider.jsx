import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Slider } from "@/components/ui/slider";
import { Star } from 'lucide-react';

export default function RatingSlider({ rating, onRatingChange, onSubmit }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onSubmit();
    }, 1500); // Auto-submit after 1.5 seconds of rating being set
    return () => clearTimeout(timer);
  }, [rating, onSubmit]);

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="w-full max-w-md mx-auto space-y-8 mb-8"
    >
      <div className="text-center">
        <p className="text-zinc-400 text-sm uppercase tracking-wider mb-2">Would you date this image</p>
        <div className="flex items-center justify-center gap-2">
          <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
          <span className="text-4xl font-bold text-white">{rating}</span>
          <span className="text-zinc-500 text-xl">/10</span>
        </div>
      </div>
      
      <div className="px-4 mb-4">
        <Slider
          value={[rating]}
          onValueChange={(value) => onRatingChange(value[0])}
          min={1}
          max={10}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between mt-3 text-xs text-zinc-500">
          <span>Poor</span>
          <span>Amazing</span>
        </div>
      </div>
      
      <motion.div
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        className="text-center text-xs text-zinc-500 mt-4"
      >
        Moving to next image...
      </motion.div>
    </motion.div>
  );
}