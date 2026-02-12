import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminContentManager() {
  const [isAdmin, setIsAdmin] = useState(null);
  const [batchSize, setBatchSize] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  React.useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const user = await base44.auth.me();
      setIsAdmin(user?.role === 'admin');
    } catch (err) {
      setIsAdmin(false);
    }
  };

  const generateBatch = async () => {
    setIsGenerating(true);
    try {
      const { data } = await base44.functions.invoke('batchImageGeneration', { batchSize });
      
      if (data.success) {
        setLastResult({
          generated: data.generated,
          errors: data.errors,
          timestamp: new Date().toLocaleTimeString()
        });
        toast.success(`Generated ${data.generated} AI images!`);
      } else {
        toast.error(data.error || 'Generation failed');
      }
    } catch (error) {
      toast.error('Error generating images');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isAdmin === null) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-zinc-300">Admin access required</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-12">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />
      
      <div className="relative z-10 max-w-2xl mx-auto px-4">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-8">
          <h1 className="text-4xl font-black mb-2">Content Manager</h1>
          <p className="text-zinc-400">Admin panel for batch image generation</p>
        </motion.div>

        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Generate AI Images
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-zinc-300 block mb-2">Batch Size</label>
              <Input
                type="number"
                min="1"
                max="50"
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value) || 10)}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
              <p className="text-xs text-zinc-500 mt-1">Generate 1-50 AI images at once</p>
            </div>

            <Button
              onClick={generateBatch}
              disabled={isGenerating}
              className="w-full h-12 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white font-semibold"
            >
              {isGenerating ? 'Generating...' : `Generate ${batchSize} Images`}
            </Button>
          </CardContent>
        </Card>

        {lastResult && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  Last Generation Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-zinc-400">Generated</p>
                    <p className="text-2xl font-bold text-emerald-400">{lastResult.generated}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Errors</p>
                    <p className="text-2xl font-bold text-red-400">{lastResult.errors.length}</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-500">Generated at {lastResult.timestamp}</p>
                
                {lastResult.errors.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded p-3 mt-4">
                    <p className="text-xs text-red-400 font-medium mb-2">Errors:</p>
                    <div className="space-y-1">
                      {lastResult.errors.slice(0, 3).map((err, i) => (
                        <p key={i} className="text-xs text-red-300">{err}</p>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="mt-8 p-4 bg-zinc-800 rounded-lg border border-zinc-700">
          <h3 className="font-bold mb-2 text-sm">💡 Tips for Best Results:</h3>
          <ul className="text-xs text-zinc-400 space-y-1">
            <li>• Generate 10-20 images per session for better variety</li>
            <li>• Images are automatically marked as AI-generated (is_bot: true)</li>
            <li>• Set up automated generation using scheduled automations</li>
            <li>• Monitor image quality and adjust batch sizes as needed</li>
          </ul>
        </div>
      </div>
    </div>
  );
}