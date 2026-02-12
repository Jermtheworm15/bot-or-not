import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function ArticleGenerator() {
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [article, setArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateArticle = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await base44.functions.invoke('generateArticle', { topic, keywords });
      setArticle(data.article);
      toast.success('Article generated!');
    } catch (error) {
      toast.error('Failed to generate article');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!article) return;
    const text = `${article.title}\n\n${article.introduction}\n\n${article.sections.map(s => `## ${s.header}\n${s.content}`).join('\n\n')}\n\n${article.conclusion}`;
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="block text-sm font-medium text-white">Article Topic</label>
        <Input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., How AI detection works..."
          className="bg-zinc-800 border-zinc-700 text-white"
        />
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-white">Keywords (optional)</label>
        <Textarea
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="e.g., deepfake, neural networks, AI..."
          className="bg-zinc-800 border-zinc-700 text-white h-20"
        />
      </div>

      <Button
        onClick={generateArticle}
        disabled={isLoading}
        className="w-full bg-purple-600 hover:bg-purple-700"
      >
        {isLoading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
        Generate Article
      </Button>

      {article && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-zinc-800 border border-purple-500/30 rounded-lg p-6 space-y-4 max-h-96 overflow-y-auto">
            <h2 className="text-2xl font-bold text-white">{article.title}</h2>
            <p className="text-zinc-300">{article.introduction}</p>
            {article.sections.map((section, idx) => (
              <div key={idx}>
                <h3 className="text-lg font-semibold text-purple-400 mb-2">{section.header}</h3>
                <p className="text-sm text-zinc-300">{section.content}</p>
              </div>
            ))}
            <p className="text-zinc-300 italic">{article.conclusion}</p>
          </div>

          <div className="flex gap-2">
            <Button onClick={copyToClipboard} variant="outline" className="flex-1">
              <Copy className="w-4 h-4 mr-2" /> Copy
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}