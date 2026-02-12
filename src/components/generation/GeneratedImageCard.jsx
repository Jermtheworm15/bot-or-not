import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Download, Plus, Loader2, CheckCircle2 } from 'lucide-react';

export default function GeneratedImageCard({ image, onAddToLibrary, isAdding, isAdded }) {
  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = image.url;
    a.download = `ai-generated-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative group overflow-hidden rounded-lg bg-zinc-800"
    >
      <img
        src={image.url}
        alt={image.prompt}
        className="w-full aspect-square object-cover"
      />

      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
        <Button
          onClick={handleDownload}
          variant="outline"
          className="border-white/30 text-white hover:bg-white/10"
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>

        <Button
          onClick={onAddToLibrary}
          disabled={isAdding || isAdded}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isAdded ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Added
            </>
          ) : isAdding ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add to Library
            </>
          )}
        </Button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        <p className="text-xs text-zinc-300 line-clamp-2">{image.prompt}</p>
      </div>
    </motion.div>
  );
}