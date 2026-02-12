import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from 'framer-motion';
import { Wand2, Copy, CheckCircle, Square, Maximize, Minimize } from 'lucide-react';
import { toast } from 'sonner';

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('square');
  const [quality, setQuality] = useState('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const aspectRatios = {
    square: { label: '1:1 Square', icon: Square },
    landscape: { label: '16:9 Landscape', icon: Maximize },
    portrait: { label: '9:16 Portrait', icon: Minimize }
  };

  const qualityLevels = {
    low: 'Low (Basic)',
    medium: 'Medium (Detailed)',
    high: 'High (Very Detailed)'
  };

  const buildEnhancedPrompt = () => {
    let enhancedPrompt = `${prompt}. Generate a photo-realistic image of either a real human or an AI-generated bot. Make it ambiguous and challenging to distinguish.`;
    
    // Add quality instructions
    if (quality === 'high') {
      enhancedPrompt += ' High quality, intricate details, professional photography, sharp focus, studio lighting.';
    } else if (quality === 'medium') {
      enhancedPrompt += ' Good quality, clear details, natural lighting.';
    } else {
      enhancedPrompt += ' Standard quality image.';
    }

    return enhancedPrompt;
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a description');
      return;
    }

    setIsGenerating(true);
    try {
      const enhancedPrompt = buildEnhancedPrompt();
      let fullPrompt = enhancedPrompt;

      if (negativePrompt.trim()) {
        fullPrompt = `${enhancedPrompt} (Avoid: ${negativePrompt})`;
      }

      const { url } = await base44.integrations.Core.GenerateImage({
        prompt: fullPrompt
      });

      setGeneratedImageUrl(url);
      toast.success('Image generated!');
    } catch (error) {
      toast.error('Failed to generate image. Please try again.');
      console.error('Image generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveImage = async () => {
    if (!generatedImageUrl) return;

    setIsSaving(true);
    try {
      const user = await base44.auth.me();

      // Save to Image entity
      await base44.entities.Image.create({
        url: generatedImageUrl,
        is_bot: Math.random() > 0.5, // Randomly assign bot/human for mystery
        source: 'ai_generated',
        user_uploaded: true,
        uploader_name: user.full_name || user.email
      });

      toast.success('Image added to voting pool!');
      setGeneratedImageUrl(null);
      setPrompt('');
    } catch (error) {
      toast.error('Failed to save image. Please try again.');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedImageUrl) {
      navigator.clipboard.writeText(generatedImageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="text-white font-semibold flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-purple-400" />
          Image Description
        </label>
        <Textarea
          placeholder="Describe the image you want to generate... (e.g., 'A person with striking blue eyes', 'A digital portrait of someone in futuristic clothing')"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="bg-zinc-800 border-zinc-700 text-white min-h-24"
        />
        <p className="text-xs text-zinc-400">
          Be descriptive! The better your prompt, the better the generated image.
        </p>
      </div>

      <div className="space-y-3">
        <label className="text-white font-semibold">Negative Prompt (Optional)</label>
        <Textarea
          placeholder="What to exclude from the image... (e.g., 'blur, watermark, low quality, distorted faces')"
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          className="bg-zinc-800 border-zinc-700 text-white min-h-16"
        />
        <p className="text-xs text-zinc-400">
          Describe things you don't want in the image.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="text-white font-semibold text-sm">Aspect Ratio</label>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(aspectRatios).map(([key, { label, icon: Icon }]) => (
              <button
                key={key}
                onClick={() => setAspectRatio(key)}
                className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all text-xs font-medium ${
                  aspectRatio === key
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-white font-semibold text-sm">Quality Level</label>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm"
          >
            {Object.entries(qualityLevels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3"
      >
        {isGenerating ? (
          <>
            <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            Generating...
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4 mr-2" />
            Generate Image
          </>
        )}
      </Button>

      {generatedImageUrl && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 bg-zinc-800 rounded-xl p-4 border border-purple-500/30"
        >
          <p className="text-sm text-zinc-300">Generated Image:</p>
          <img
            src={generatedImageUrl}
            alt="Generated"
            className="w-full rounded-lg aspect-square object-cover"
          />

          <div className="flex gap-2">
            <Button
              onClick={copyToClipboard}
              variant="outline"
              className="flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-700"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy URL
                </>
              )}
            </Button>

            <Button
              onClick={handleSaveImage}
              disabled={isSaving}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isSaving ? 'Saving...' : 'Add to Voting Pool'}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}