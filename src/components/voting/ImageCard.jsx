import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from "@/components/ui/skeleton";
import { ImageOff, WifiOff, RefreshCw } from 'lucide-react';

const SLOW_NETWORK_MS = 6000;

export default function ImageCard({ imageUrl, isLoading, isRevealed, isBot, wasCorrect, onError, isMobile }) {
  const [imgError, setImgError] = useState(false);
  const [slow, setSlow] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Reset state when imageUrl changes
  useEffect(() => {
    setImgError(false);
    setLoaded(false);
    setSlow(false);
  }, [imageUrl]);

  // Slow-network detector
  useEffect(() => {
    if (isLoading || loaded || imgError || !imageUrl) return;
    const timer = setTimeout(() => {
      if (!loaded) setSlow(true);
    }, SLOW_NETWORK_MS);
    return () => clearTimeout(timer);
  }, [imageUrl, isLoading, loaded, imgError]);

  const handleError = () => {
    setImgError(true);
    setSlow(false);
    console.error('Image failed to load:', imageUrl);
    if (onError) setTimeout(() => onError(), 300);
  };

  const handleLoad = () => {
    setLoaded(true);
    setSlow(false);
  };

  return (
    <div className={`relative w-full ${isMobile ? 'h-72' : 'max-w-md aspect-square'} mx-auto`}>
      <motion.div
        className="w-full h-full rounded-3xl overflow-hidden shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {isLoading ? (
          <Skeleton className="w-full h-full bg-zinc-800" />
        ) : imgError ? (
          /* ── Friendly error state ── */
          <div className="w-full h-full bg-zinc-900 border border-zinc-700 rounded-3xl flex flex-col items-center justify-center gap-3 p-6 text-center">
            <ImageOff className="w-12 h-12 text-zinc-600" />
            <p className="text-zinc-400 text-sm font-medium">Couldn't load this image</p>
            <p className="text-zinc-600 text-xs">Skipping to the next one…</p>
          </div>
        ) : (
          <div className="relative w-full h-full">
            {/* Slow network overlay */}
            {slow && !loaded && (
              <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center gap-3 z-10 rounded-3xl">
                <WifiOff className="w-10 h-10 text-zinc-600 animate-pulse" />
                <p className="text-zinc-400 text-sm">Slow connection…</p>
                <RefreshCw className="w-5 h-5 text-zinc-600 animate-spin" />
              </div>
            )}

            <img
              src={imageUrl}
              alt="Mystery face"
              className="w-full h-full object-cover"
              onError={handleError}
              onLoad={handleLoad}
              loading="eager"
              crossOrigin="anonymous"
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
                  isBot ? 'bg-violet-500 text-white' : 'bg-emerald-500 text-white'
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
                  wasCorrect ? 'bg-emerald-500/90 text-white' : 'bg-rose-500/90 text-white'
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