import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Image, Video, Download, AlertCircle } from 'lucide-react';

export default function AdminContentManager() {
  const [isLoading, setIsLoading] = useState(false);
  const [count, setCount] = useState(10);
  const [type, setType] = useState('images');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handlePopulate = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await base44.functions.invoke('populateAIContent', {
        count: parseInt(count),
        type
      });

      setResult(response.data);
    } catch (err) {
      setError(err.message || 'Failed to populate content');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-8">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />
      
      <div className="relative z-10 max-w-2xl mx-auto px-4">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-black mb-2 flex items-center justify-center gap-3">
            <Download className="w-10 h-10 text-purple-500" />
            Content Manager
          </h1>
          <p className="text-zinc-400">Populate database with AI-generated content</p>
        </motion.div>

        <Card className="bg-zinc-900 border-zinc-800 p-6 mb-6">
          <div className="space-y-6">
            <div>
              <Label htmlFor="type" className="text-white mb-2 block">Content Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="images">Images Only</SelectItem>
                  <SelectItem value="videos">Videos Only</SelectItem>
                  <SelectItem value="both">Both Images & Videos</SelectItem>
                  <SelectItem value="real">Real Images (for balance)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="count" className="text-white mb-2 block">Number of Items</Label>
              <Input
                id="count"
                type="number"
                min="1"
                max="50"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
              <p className="text-xs text-zinc-500 mt-1">Recommended: 10-20 items per batch</p>
            </div>

            <Button
              onClick={handlePopulate}
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Fetching Content...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Populate Database
                </>
              )}
            </Button>
          </div>
        </Card>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-red-900/20 border-red-500/50 p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-red-400 font-semibold">Error</p>
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-green-900/20 border-green-500/50 p-6">
              <h3 className="text-green-400 font-bold text-xl mb-4">✓ Success!</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Image className="w-5 h-5 text-green-400" />
                  <span className="text-white">{result.results?.images?.length || 0} images added</span>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-green-400" />
                  <span className="text-white">{result.results?.videos?.length || 0} videos added</span>
                </div>
              </div>
              <p className="text-zinc-400 text-sm mt-4">{result.message}</p>
            </Card>
          </motion.div>
        )}

        <Card className="bg-zinc-900/50 border-zinc-800 p-4 mt-6">
          <h4 className="text-white font-semibold mb-2 text-sm">Note:</h4>
          <p className="text-zinc-400 text-xs">
            This tool fetches AI-generated content from public sources like "This Person Does Not Exist" 
            and other AI art generators. The LLM will search for valid, working URLs to populate your database.
            Admin access required.
          </p>
        </Card>
      </div>
    </div>
  );
}