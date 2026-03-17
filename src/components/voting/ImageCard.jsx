import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from "@/components/ui/skeleton";
import { ImageOff, WifiOff, RefreshCw } from 'lucide-react';

const SLOW_NETWORK_MS = 6000;

export default function ImageCard({ imageUrl, isLoading, isRevealed, isBot, wasCorrect, onError, isMobile }) {
  const [imgError, setImgError] = useState(false);
  const [slow, setSlow] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setImgError(false);
    setLoaded(false);
    setSlow(false);
  }, [imageUrl]);

  useEffect(() => {
    if (isLoading || loaded || imgError || !imageUrl) return;
    const timer = setTimeout(() => { if (!loaded) setSlow(true); }, SLOW_NETWORK_MS);
    return () => clearTimeout(timer);
  }, [imageUrl, isLoading, loaded, imgError]);

  const handleError = () => {
    setImgError(true);
    setSlow(false);
    if (onError) setTimeout(() => onError(), 300);
  };

  const handleLoad = () => { setLoaded(true); setSlow(false); };

  // Responsive sizing: on mobile fixed height, desktop square aspect
  const containerClass = isMobile
    ? 'relative w-full rounded-3xl overflow-hidden shadow-2xl'
    : 'relative w-full max-w-md mx-auto aspect-square rounded-3xl overflow-hidden shadow-2xl';
  const containerStyle = isMobile ? { height: 280, borderRadius: 24 } : { borderRadius: 24 };

  return (
    <motion.div
      className={containerClass}
      style={containerStyle}
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {isLoading ? (
        <Skeleton className="w-full h-full skeleton-pulse" style={{ background: 'rgba(39,39,42,0.8)' }} />
      ) : imgError ? (
        <div className="w-full h-full bg-zinc-900 border border-zinc-700/60 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <ImageOff className="w-12 h-12 text-zinc-600" />
          <p className="text-zinc-400 text-sm font-semibold">Couldn't load image</p>
          <p className="text-zinc-600 text-xs">Skipping automatically…</p>
        </div>
      ) : (
        <div className="relative w-full h-full bg-zinc-900">
          {/* Slow network overlay */}
          {slow && !loaded && (
            <div className="absolute inset-0 bg-zinc-900/95 flex flex-col items-center justify-center gap-3 z-10">
              <WifiOff className="w-10 h-10 text-zinc-600 animate-pulse" />
              <p className="text-zinc-400 text-sm font-medium">Slow connection…</p>
              <RefreshCw className="w-4 h-4 text-zinc-600 animate-spin" />
            </div>
          )}

          <img
            src={imageUrl}
            alt="Mystery face"
            className="w-full h-full object-cover"
            style={{ objectPosition: 'center top' }}
            onError={handleError}
            onLoad={handleLoad}
            loading="eager"
            crossOrigin="anonymous"
          />

          {/* Subtle gradient overlay at bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

          {/* Revealed: Bot/Human badge */}
          <AnimatePresence>
            {isRevealed && (
              <motion.div
                initial={{ scale: 0, rotate: -15, opacity: 0 }}
                animate={{ scale: 1, rotate: -5, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                className={`absolute top-4 right-4 px-4 py-1.5 rounded-full font-black text-sm uppercase tracking-widest shadow-xl border ${
                  isBot
                    ? 'bg-violet-600 border-violet-400/50 text-white shadow-violet-900/60'
                    : 'bg-emerald-600 border-emerald-400/50 text-white shadow-emerald-900/60'
                }`}
              >
                {isBot ? '🤖 Bot' : '👤 Human'}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Correct / Wrong result badge */}
          <AnimatePresence>
            {isRevealed && (
              <motion.div
                initial={{ y: 24, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ delay: 0.18, type: 'spring', stiffness: 320, damping: 20 }}
                className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-2xl font-bold text-base whitespace-nowrap shadow-lg ${
                  wasCorrect
                    ? 'bg-emerald-500/95 text-white vote-correct'
                    : 'bg-rose-600/95 text-white vote-wrong'
                }`}
              >
                {wasCorrect ? '✓ Correct!' : '✗ Wrong!'}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}