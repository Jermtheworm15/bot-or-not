import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wand2 } from 'lucide-react';

const STYLES = ['Photorealistic', 'Oil Painting', 'Watercolor', 'Digital Art', 'Concept Art', 'Anime', 'Cyberpunk', 'Fantasy', 'Steampunk', '3D Render'];
const MOODS = ['Serene', 'Dramatic', 'Moody', 'Vibrant', 'Dark', 'Bright', 'Mysterious', 'Peaceful', 'Energetic', 'Melancholic'];
const INFLUENCES = ['Renaissance', 'Art Deco', 'Modernism', 'Surrealism', 'Impressionism', 'Film Noir', 'Baroque', 'Minimalist', 'Maximalist', 'Retro'];

export default function PromptBuilder({ onGenerate, isLoading }) {
  const [basePrompt, setBasePrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
  const [selectedMood, setSelectedMood] = useState(MOODS[0]);
  const [selectedInfluence, setSelectedInfluence] = useState(INFLUENCES[0]);

  const buildFullPrompt = () => {
    const parts = [basePrompt, `style: ${selectedStyle}`, `mood: ${selectedMood}`, `influence: ${selectedInfluence}`];
    return parts.filter(p => p).join(', ');
  };

  const handleGenerate = () => {
    if (basePrompt.trim()) {
      onGenerate(buildFullPrompt());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto space-y-6"
    >
      <div className="space-y-3">
        <label className="block text-sm font-medium text-green-400">What do you want to create?</label>
        <Textarea
          value={basePrompt}
          onChange={(e) => setBasePrompt(e.target.value)}
          placeholder="Describe the image you want to generate... e.g., 'A futuristic city at night with flying cars'"
          className="min-h-24 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="block text-xs font-medium text-green-400 uppercase tracking-wide">Style</label>
          <select
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
          >
            {STYLES.map(style => (
              <option key={style} value={style}>{style}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-green-400 uppercase tracking-wide">Mood</label>
          <select
            value={selectedMood}
            onChange={(e) => setSelectedMood(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
          >
            {MOODS.map(mood => (
              <option key={mood} value={mood}>{mood}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-green-400 uppercase tracking-wide">Influence</label>
          <select
            value={selectedInfluence}
            onChange={(e) => setSelectedInfluence(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
          >
            {INFLUENCES.map(influence => (
              <option key={influence} value={influence}>{influence}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-4">
        <p className="text-xs text-zinc-400 mb-2">Full Prompt:</p>
        <p className="text-sm text-green-400 font-mono">{buildFullPrompt()}</p>
      </div>

      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={handleGenerate}
          disabled={!basePrompt.trim() || isLoading}
          className="w-full h-12 bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 text-white font-semibold gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              Generate Image
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
}