import React from 'react';
import { motion } from 'framer-motion';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Star, ArrowRight } from 'lucide-react';

export default function RatingSlider({ rating, onRatingChange, onSubmit }) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="w-full max-w-md mx-auto space-y-6"
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
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={onSubmit}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-lg gap-2 shadow-lg shadow-amber-500/30"
        >
          Next Image
          <ArrowRight className="w-5 h-5" />
        </Button>
      </motion.div>
    </motion.div>
  );
}