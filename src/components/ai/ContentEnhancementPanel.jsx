import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, X, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContentEnhancementPanel({ topic, onClose, onApply }) {
  const [loading, setLoading] = useState(false);
  const [enhancements, setEnhancements] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);

  const generateEnhancements = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await base44.functions.invoke('generateContentEnhancements', {
        topic,
        contentType: 'image'
      });
      
      if (response.data.success) {
        setEnhancements(response.data.data);
      } else {
        setError('Failed to generate enhancements');
      }
    } catch (err) {
      setError(err.message || 'Error generating enhancements');
      console.error(err);
    }
    setLoading(false);
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="w-full space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          AI Content Enhancer
        </h3>
        <button onClick={onClose} className="text-zinc-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {!enhancements ? (
        <Button
          onClick={generateEnhancements}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Enhancements
            </>
          )}
        </Button>
      ) : (
        <div className="space-y-4">
          {/* Poll Questions */}
          <Card className="bg-zinc-900 border-purple-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-purple-400">Poll Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {enhancements.poll_questions?.map((q, idx) => (
                <div key={idx} className="bg-zinc-800 p-3 rounded-lg flex items-start justify-between gap-3 group">
                  <p className="text-sm text-white flex-1">{q}</p>
                  <button
                    onClick={() => copyToClipboard(q, `q${idx}`)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5"
                  >
                    {copied === `q${idx}` ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-zinc-400 hover:text-white" />
                    )}
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Description */}
          <Card className="bg-zinc-900 border-green-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-green-400">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-zinc-800 p-3 rounded-lg flex items-start justify-between gap-3 group">
                <p className="text-sm text-white flex-1">{enhancements.description}</p>
                <button
                  onClick={() => copyToClipboard(enhancements.description, 'desc')}
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5"
                >
                  {copied === 'desc' ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-zinc-400 hover:text-white" />
                  )}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card className="bg-zinc-900 border-amber-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-amber-400">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {enhancements.tags?.map((tag, idx) => (
                  <div
                    key={idx}
                    className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-medium hover:bg-amber-500/30 cursor-pointer group flex items-center gap-2"
                    onClick={() => copyToClipboard(tag, `tag${idx}`)}
                  >
                    #{tag}
                    {copied === `tag${idx}` && (
                      <Check className="w-3 h-3" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => {
                onApply?.(enhancements);
                onClose();
              }}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Apply
            </Button>
            <Button
              onClick={() => setEnhancements(null)}
              variant="outline"
              className="flex-1 border-purple-500/30"
            >
              Regenerate
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}
    </motion.div>
  );
}