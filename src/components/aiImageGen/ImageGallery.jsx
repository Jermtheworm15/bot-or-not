import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Download, Share2, Trash2, Copy } from 'lucide-react';

export default function ImageGallery({ images, onDelete, onShare }) {
  const [copiedId, setCopiedId] = React.useState(null);

  const downloadImage = async (url, id) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `bot-or-not-${id}.png`;
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const copyPrompt = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (images.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <p className="text-zinc-500">Generate your first image to see it here</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {images.map((image) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-700 hover:border-green-500/50 transition-colors group"
            >
              <div className="relative aspect-square bg-zinc-800 overflow-hidden">
                <img
                  src={image.url}
                  alt="Generated"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => downloadImage(image.url, image.id)}
                    className="text-white hover:bg-green-600"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onShare(image)}
                    className="text-white hover:bg-purple-600"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onDelete(image.id)}
                    className="text-white hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="p-3 space-y-2">
                <p className="text-xs text-zinc-400 line-clamp-2">{image.prompt}</p>
                <button
                  onClick={() => copyPrompt(image.prompt)}
                  className="w-full text-xs bg-zinc-800 hover:bg-zinc-700 text-green-400 py-1.5 rounded flex items-center justify-center gap-1 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  {copiedId === image.prompt ? 'Copied!' : 'Copy Prompt'}
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}