import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Loader } from 'lucide-react';
import { toast } from 'sonner';

export default function ContentIdeaGenerator() {
  const [topic, setTopic] = useState('');
  const [ideas, setIdeas] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateIdeas = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await base44.functions.invoke('generateContentIdeas', { topic });
      setIdeas(data.ideas);
      toast.success('Content ideas generated!');
    } catch (error) {
      toast.error('Failed to generate ideas');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="block text-sm font-medium text-white">Topic or Theme</label>
        <div className="flex gap-2">
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Celebrity deepfakes, Voice cloning..."
            className="bg-zinc-800 border-zinc-700 text-white"
            onKeyPress={(e) => e.key === 'Enter' && generateIdeas()}
          />
          <Button
            onClick={generateIdeas}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {ideas && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {ideas.map((idea, idx) => (
            <div key={idx} className="bg-zinc-800 border border-purple-500/30 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">{idea.title}</h4>
              <p className="text-sm text-zinc-300 mb-2">{idea.description}</p>
              <div className="flex gap-2">
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">{idea.format}</span>
                <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">{idea.engagement_reason}</span>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}