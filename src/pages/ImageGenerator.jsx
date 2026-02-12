import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import ImagePrompt from '@/components/generation/ImagePrompt';
import GeneratedImageCard from '@/components/generation/GeneratedImageCard';

export default function ImageGenerator() {
  const [generatedImages, setGeneratedImages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [addingToLibrary, setAddingToLibrary] = useState({});
  const [error, setError] = useState(null);

  const handleGenerate = async (prompt) => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await base44.integrations.Core.GenerateImage({
        prompt: prompt,
      });

      if (result && result.url) {
        setGeneratedImages(prev => [{
          id: Date.now(),
          url: result.url,
          prompt: prompt,
          createdAt: new Date().toISOString()
        }, ...prev]);
      }
    } catch (err) {
      setError('Failed to generate image. Please try again.');
      console.error('Generation error:', err);
    }

    setIsGenerating(false);
  };

  const handleAddToLibrary = async (image) => {
    setAddingToLibrary(prev => ({ ...prev, [image.id]: true }));

    try {
      const user = await base44.auth.me();

      // Create image in database
      await base44.entities.Image.create({
        url: image.url,
        is_bot: true,
        source: 'User Generated',
        user_uploaded: true,
        uploader_name: user.full_name || user.email
      });

      setAddingToLibrary(prev => {
        const updated = { ...prev };
        delete updated[image.id];
        return updated;
      });

      // Mark as added by removing from list after a delay
      setTimeout(() => {
        setGeneratedImages(prev => prev.filter(img => img.id !== image.id));
      }, 500);
    } catch (err) {
      console.error('Error adding to library:', err);
      setError('Failed to add image to library.');
      setAddingToLibrary(prev => {
        const updated = { ...prev };
        delete updated[image.id];
        return updated;
      });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-8 pb-28">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-black">AI Image Generator</h1>
          </div>
          <p className="text-zinc-400">Create unique AI-generated images with text prompts and add them to your library</p>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 text-red-300"
          >
            {error}
          </motion.div>
        )}

        {/* Prompt Input */}
        <ImagePrompt onGenerate={handleGenerate} isGenerating={isGenerating} />

        {/* Generated Images Grid */}
        {generatedImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h2 className="text-2xl font-bold mb-6">Your Generated Images</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generatedImages.map(image => (
                <GeneratedImageCard
                  key={image.id}
                  image={image}
                  onAddToLibrary={() => handleAddToLibrary(image)}
                  isAdding={addingToLibrary[image.id]}
                  isAdded={false}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {generatedImages.length === 0 && !isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-zinc-400">No images generated yet. Create one with a prompt above!</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}