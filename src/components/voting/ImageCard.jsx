import React from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from "@/components/ui/skeleton";

export default function ImageCard({ imageUrl, isLoading, isRevealed, isBot, wasCorrect, onError }) {
  return (
    <div className="relative w-full max-w-md mx-auto aspect-square">
      <motion.div
        className="w-full h-full rounded-3xl overflow-hidden shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {isLoading ? (
          <Skeleton className="w-full h-full bg-zinc-800" />
        ) : (
          <div className="relative w-full h-full">
            <img
              src={imageUrl}
              alt="Mystery face"
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Image failed to load:', imageUrl);
                if (onError) onError();
              }}
              loading="eager"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
            />
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Revealed badge */}
            {isRevealed && (
              <motion.div
                initial={{ scale: 0, rotate: -12 }}
                animate={{ scale: 1, rotate: -6 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className={`absolute top-6 right-6 px-5 py-2 rounded-full font-bold text-lg uppercase tracking-wider shadow-lg ${
                  isBot 
                    ? 'bg-violet-500 text-white' 
                    : 'bg-emerald-500 text-white'
                }`}
              >
                {isBot ? '🤖 Bot' : '👤 Human'}
              </motion.div>
            )}
            
            {/* Correct/Wrong indicator */}
            {isRevealed && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={`absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl font-semibold text-lg ${
                  wasCorrect
                    ? 'bg-emerald-500/90 text-white'
                    : 'bg-rose-500/90 text-white'
                }`}
              >
                {wasCorrect ? '✓ Correct!' : '✗ Wrong!'}
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}