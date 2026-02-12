import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const SUGGESTED_TAGS = [
  'realistic', 'abstract', 'digital', 'portrait', 'landscape', 'surreal',
  'cyberpunk', 'fantasy', 'sci-fi', 'vintage', 'modern', 'minimalist',
  'colorful', 'monochrome', 'detailed', 'simple', 'dramatic', 'serene'
];

export default function ImageTagger({ tags, onTagsChange }) {
  const [inputValue, setInputValue] = useState('');

  const addTag = (tag) => {
    const normalized = tag.toLowerCase().trim();
    if (normalized && !tags.includes(normalized)) {
      onTagsChange([...tags, normalized]);
      setInputValue('');
    }
  };

  const removeTag = (tag) => {
    onTagsChange(tags.filter(t => t !== tag));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div>
        <label className="text-sm font-medium text-zinc-300 block mb-2">Add Tags</label>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a tag and press Enter..."
          className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Current Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <motion.button
              key={tag}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              onClick={() => removeTag(tag)}
              className="flex items-center gap-2 bg-purple-600/30 border border-purple-500/50 rounded-full px-3 py-1 text-sm text-purple-300 hover:bg-purple-600/50 transition-colors"
            >
              {tag}
              <X className="w-3 h-3" />
            </motion.button>
          ))}
        </div>
      )}

      {/* Suggested Tags */}
      <div>
        <p className="text-xs text-zinc-500 mb-2">Suggested tags:</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_TAGS.filter(t => !tags.includes(t)).map(tag => (
            <button
              key={tag}
              onClick={() => addTag(tag)}
              className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded transition-colors"
            >
              + {tag}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}