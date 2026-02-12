import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from "@/components/ui/skeleton";

export default function VideoCard({ videoUrl, isLoading, isRevealed, isBot, wasCorrect, onError }) {
  const timeoutRef = useRef(null);
  const videoRef = useRef(null);
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && videoUrl) {
      setIsVideoLoading(true);
      
      // Set 10 second timeout for video loading
      timeoutRef.current = setTimeout(() => {
        if (videoRef.current && videoRef.current.readyState < 2) {
          // Video hasn't loaded enough data, skip it
          console.log('Video timeout - skipping');
          onError();
        }
      }, 10000);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [videoUrl, isLoading, onError]);
  return (
    <div className="relative w-full max-w-md mx-auto aspect-[9/16]">
      <motion.div
        className="w-full h-full rounded-3xl overflow-hidden shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {isLoading ? (
          <Skeleton className="w-full h-full bg-zinc-800" />
        ) : (
          <div className="relative w-full h-full bg-black">
            {isVideoLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                <div className="text-white text-sm">Loading video...</div>
              </div>
            )}
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              onError={(e) => {
                console.log('Video error:', e);
                onError();
              }}
              onCanPlay={() => {
                setIsVideoLoading(false);
                // Clear timeout once video can play
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current);
                }
              }}
              onLoadedMetadata={() => {
                console.log('Video metadata loaded');
              }}
            />
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            
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