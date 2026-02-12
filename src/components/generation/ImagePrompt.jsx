import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Wand2, Loader2 } from 'lucide-react';

export default function ImagePrompt({ onGenerate, isGenerating }) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = () => {
    if (prompt.trim()) {
      onGenerate(prompt);
      setPrompt('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-900/30 to-green-900/30 border border-purple-500/30 rounded-xl p-6 mb-6"
    >
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Wand2 className="w-5 h-5 text-purple-400" />
        Generate New Image
      </h3>

      <div className="space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want to create... (e.g., 'a futuristic city at sunset with flying cars')"
          className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 resize-none"
          rows={4}
          disabled={isGenerating}
        />

        <div className="flex justify-between items-center">
          <p className="text-xs text-zinc-400">
            {prompt.length}/500 characters
          </p>
          <Button
            onClick={handleSubmit}
            disabled={isGenerating || !prompt.trim()}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Image
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}