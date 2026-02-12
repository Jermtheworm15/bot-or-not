import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from 'framer-motion';
import { Wand2, Copy, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a description');
      return;
    }

    setIsGenerating(true);
    try {
      const { url } = await base44.integrations.Core.GenerateImage({
        prompt: `${prompt}. Generate a photo-realistic image of either a real human or an AI-generated bot. Make it ambiguous and challenging to distinguish.`
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