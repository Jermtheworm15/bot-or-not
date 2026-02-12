import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import PromptBuilder from '@/components/aiImageGen/PromptBuilder';
import ImageGallery from '@/components/aiImageGen/ImageGallery';
import { Loader2 } from 'lucide-react';

export default function AIImageGenerator() {
  const [generatedImages, setGeneratedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        await loadUserImages();
      } catch (error) {
        console.error('Auth error:', error);
      }
    };
    loadUser();
  }, []);

  const loadUserImages = async () => {
    try {
      const user = await base44.auth.me();
      const images = await base44.entities.Image.filter({
        created_by: user.email,
        source: 'ai_generated'
      }, '-created_date', 50);
      setGeneratedImages(images.map(img => ({
        id: img.id,
        url: img.url || img.data?.url,
        prompt: img.prompt || 'AI Generated Image',
        created_date: img.created_date
      })));
    } catch (error) {
      console.error('Load images error:', error);
    }
  };

  const handleGenerate = async (prompt) => {
    setIsLoading(true);
    try {
      const result = await base44.integrations.Core.GenerateImage({
        prompt
      });

      if (result?.url) {
        // Save to database as user-generated AI image
        const savedImage = await base44.entities.Image.create({
          url: result.url,
          is_bot: false,
          source: 'ai_generated_user',
          user_uploaded: false,
          prompt: prompt
        });

        // Add to local state
        setGeneratedImages(prev => [{
          id: savedImage.id,
          url: result.url,
          prompt: prompt,
          created_date: new Date().toISOString()
        }, ...prev]);
      }
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (imageId) => {
    try {
      await base44.entities.Image.delete(imageId);
      setGeneratedImages(prev => prev.filter(img => img.id !== imageId));
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleShare = (image) => {
    const shareText = `I generated this AI image: "${image.prompt}"`;
    if (navigator.share) {
      navigator.share({
        title: 'AI Generated Image',
        text: shareText,
        url: image.url
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareText}\n${image.url}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white py-8 px-4">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-950/30 via-black to-green-950/20 pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent">
            AI Image Generator
          </h1>
          <p className="text-zinc-400">Create stunning images from text descriptions</p>
        </motion.div>

        {/* Generator Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-8 mb-12 backdrop-blur-sm"
        >
          <PromptBuilder onGenerate={handleGenerate} isLoading={isLoading} />
        </motion.div>

        {/* Gallery Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold mb-6 text-green-400">Your Generated Images</h2>
          <ImageGallery
            images={generatedImages}
            onDelete={handleDelete}
            onShare={handleShare}
          />
        </motion.div>
      </div>
    </div>
  );
}