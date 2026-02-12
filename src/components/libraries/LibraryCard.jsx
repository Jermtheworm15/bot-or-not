import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

export default function LibraryCard({ library, onSelect }) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      onClick={() => onSelect(library)}
      className="relative group overflow-hidden rounded-xl"
    >
      {/* Background Image Grid */}
      <div className="absolute inset-0 grid grid-cols-3 gap-1 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {library.preview.slice(0, 9).map((img, idx) => (
          <img 
            key={idx}
            src={img} 
            alt="" 
            className="w-full h-full object-cover rounded-sm"
          />
        ))}
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent group-hover:via-black/20 transition-all" />

      {/* Content */}
      <div className="relative z-10 h-64 p-6 flex flex-col justify-end">
        <h3 className="text-2xl font-black text-white mb-2">{library.name}</h3>
        <p className="text-zinc-300 text-sm mb-4">{library.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs bg-purple-600 text-white px-3 py-1 rounded-full">
            {library.count} Images
          </span>
          <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </motion.button>
  );
}