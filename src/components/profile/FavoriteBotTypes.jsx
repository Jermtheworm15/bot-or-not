import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

const BOT_TYPES = [
  { id: 'faces', label: 'AI Faces', emoji: '🤖', color: 'bg-purple-500/30' },
  { id: 'art', label: 'AI Art', emoji: '🎨', color: 'bg-blue-500/30' },
  { id: 'text', label: 'AI Text', emoji: '📝', color: 'bg-green-500/30' },
  { id: 'video', label: 'AI Video', emoji: '🎬', color: 'bg-red-500/30' },
  { id: 'music', label: 'AI Music', emoji: '🎵', color: 'bg-yellow-500/30' },
  { id: 'code', label: 'AI Code', emoji: '💻', color: 'bg-cyan-500/30' },
];

export default function FavoriteBotTypes({ favorites = [] }) {
  const favoriteTypes = BOT_TYPES.filter(type => favorites.includes(type.id));
  
  if (favoriteTypes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-8 text-zinc-400"
      >
        <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Vote on more content to discover your favorites!</p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {favoriteTypes.map((type) => (
        <motion.div
          key={type.id}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          className={`${type.color} rounded-lg p-4 text-center border border-white/10 backdrop-blur-sm`}
        >
          <div className="text-2xl mb-2">{type.emoji}</div>
          <p className="font-semibold text-sm text-white">{type.label}</p>
        </motion.div>
      ))}
    </div>
  );
}