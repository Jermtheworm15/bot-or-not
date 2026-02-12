import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';

export default function LibrarySearchFilter({ onFiltersChange, tags = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedModel, setSelectedModel] = useState('');

  const styles = ['realistic', 'abstract', 'digital', 'surreal', 'cyberpunk', 'fantasy', 'vintage', 'minimalist'];
  const models = ['DALL-E', 'Midjourney', 'Stable Diffusion', 'User Generated'];

  const handleTagToggle = (tag) => {
    const updated = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(updated);
    updateFilters(searchTerm, updated, selectedStyle, selectedModel);
  };

  const handleStyleChange = (style) => {
    const updated = selectedStyle === style ? '' : style;
    setSelectedStyle(updated);
    updateFilters(searchTerm, selectedTags, updated, selectedModel);
  };

  const handleModelChange = (model) => {
    const updated = selectedModel === model ? '' : model;
    setSelectedModel(updated);
    updateFilters(searchTerm, selectedTags, selectedStyle, updated);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    updateFilters(value, selectedTags, selectedStyle, selectedModel);
  };

  const updateFilters = (search, tagsArray, style, model) => {
    onFiltersChange({
      search,
      tags: tagsArray,
      style,
      model
    });
  };

  const hasActiveFilters = searchTerm || selectedTags.length > 0 || selectedStyle || selectedModel;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-900/20 to-green-900/20 border border-purple-500/30 rounded-xl p-6 mb-6 space-y-4"
    >
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-purple-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search images by prompt or description..."
          className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Style Filter */}
      <div>
        <h4 className="text-sm font-semibold text-white mb-2">Style</h4>
        <div className="flex flex-wrap gap-2">
          {styles.map(style => (
            <button
              key={style}
              onClick={() => handleStyleChange(style)}
              className={`px-3 py-1 rounded-full text-sm transition-all ${
                selectedStyle === style
                  ? 'bg-purple-600 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {/* AI Model Filter */}
      <div>
        <h4 className="text-sm font-semibold text-white mb-2">AI Model</h4>
        <div className="flex flex-wrap gap-2">
          {models.map(model => (
            <button
              key={model}
              onClick={() => handleModelChange(model)}
              className={`px-3 py-1 rounded-full text-sm transition-all ${
                selectedModel === model
                  ? 'bg-green-600 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {model}
            </button>
          ))}
        </div>
      </div>

      {/* Tag Filter */}
      {tags.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-white mb-2">Tags</h4>
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 12).map(tag => (
              <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  selectedTags.includes(tag)
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Filters Badge */}
      {hasActiveFilters && (
        <button
          onClick={() => {
            setSearchTerm('');
            setSelectedTags([]);
            setSelectedStyle('');
            setSelectedModel('');
            updateFilters('', [], '', '');
          }}
          className="flex items-center gap-2 text-xs text-zinc-400 hover:text-purple-400 transition-colors"
        >
          <X className="w-4 h-4" />
          Clear all filters
        </button>
      )}
    </motion.div>
  );
}