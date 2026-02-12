import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Download, Plus, Loader2, CheckCircle2, Tag } from 'lucide-react';
import ImageTagger from './ImageTagger';

export default function GeneratedImageCardWithTags({ image, onAddToLibrary, isAdding, isAdded }) {
  const [showTagger, setShowTagger] = useState(false);
  const [tags, setTags] = useState([]);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = image.url;
    a.download = `ai-generated-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleAddToLibrary = async () => {
    await onAddToLibrary(image, tags);
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
          onClick={() => setShowTagger(!showTagger)}
          variant="outline"
          className="border-purple-500/30 text-purple-300 hover:bg-purple-900/30"
        >
          <Tag className="w-4 h-4 mr-2" />
          {tags.length > 0 ? `${tags.length} Tags` : 'Add Tags'}
        </Button>

        <Button
          onClick={handleAddToLibrary}
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

      {/* Tag Panel */}
      <AnimatePresence>
        {showTagger && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute inset-0 bg-black/95 flex flex-col p-4 z-20"
          >
            <ImageTagger tags={tags} onTagsChange={setTags} />
            <Button
              onClick={() => setShowTagger(false)}
              variant="outline"
              className="mt-auto border-white/30 text-white hover:bg-white/10"
            >
              Done
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        <p className="text-xs text-zinc-300 line-clamp-2">{image.prompt}</p>
      </div>
    </motion.div>
  );
}