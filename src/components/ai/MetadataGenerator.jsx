import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader, Copy, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function MetadataGenerator() {
  const [content, setContent] = useState('');
  const [metadata, setMetadata] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState(0);
  const [selectedDesc, setSelectedDesc] = useState(0);

  const generateMetadata = async () => {
    if (!content.trim()) {
      toast.error('Please enter content');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await base44.functions.invoke('generateMetadata', { content });
      setMetadata(data.metadata);
      toast.success('Metadata generated!');
    } catch (error) {
      toast.error('Failed to generate metadata');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyMetadata = () => {
    if (!metadata) return;
    const text = `Title: ${metadata.titles[selectedTitle]}\nDescription: ${metadata.meta_descriptions[selectedDesc]}\nKeywords: ${metadata.keywords.join(', ')}\nSlug: ${metadata.slug}`;
    navigator.clipboard.writeText(text);
    toast.success('Metadata copied!');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="block text-sm font-medium text-white">Content/Description</label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste your content or describe what it's about..."
          className="bg-zinc-800 border-zinc-700 text-white h-24"
        />
      </div>

      <Button
        onClick={generateMetadata}
        disabled={isLoading}
        className="w-full bg-purple-600 hover:bg-purple-700"
      >
        {isLoading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
        Generate Metadata
      </Button>

      {metadata && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="space-y-3">
            <h4 className="text-white font-semibold">Page Titles</h4>
            {metadata.titles.map((title, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedTitle(idx)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  selectedTitle === idx ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">{title}</span>
                  <span className="text-xs opacity-70">{title.length}/60</span>
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <h4 className="text-white font-semibold">Meta Descriptions</h4>
            {metadata.meta_descriptions.map((desc, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedDesc(idx)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  selectedDesc === idx ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm line-clamp-2">{desc}</span>
                  <span className="text-xs opacity-70">{desc.length}/160</span>
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <h4 className="text-white font-semibold">Keywords</h4>
            <div className="flex flex-wrap gap-2">
              {metadata.keywords.map((keyword, idx) => (
                <span key={idx} className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm">
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-white font-semibold">URL Slug</h4>
            <div className="bg-zinc-800 p-3 rounded-lg text-zinc-300 font-mono text-sm break-all">
              /{metadata.slug}
            </div>
          </div>

          <Button onClick={copyMetadata} variant="outline" className="w-full">
            <Copy className="w-4 h-4 mr-2" /> Copy All Metadata
          </Button>
        </motion.div>
      )}
    </div>
  );
}