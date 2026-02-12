import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Database, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminImagePopulator() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalCreated, setTotalCreated] = useState(0);
  const [targetCount, setTargetCount] = useState(10000);
  const [batchSize, setBatchSize] = useState(50);
  const [status, setStatus] = useState('');
  const [errors, setErrors] = useState([]);

  const populateDatabase = async () => {
    setIsRunning(true);
    setProgress(0);
    setTotalCreated(0);
    setErrors([]);
    setStatus('Starting population...');

    const batches = Math.ceil(targetCount / batchSize);
    
    for (let i = 0; i < batches; i++) {
      try {
        setStatus(`Processing batch ${i + 1} of ${batches}...`);
        
        const result = await base44.functions.invoke('populateLargeImageDatabase', { 
          batchSize: Math.min(batchSize, targetCount - totalCreated) 
        });
        
        if (result.data?.created) {
          setTotalCreated(prev => prev + result.data.created);
        }
        
        setProgress(((i + 1) / batches) * 100);
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error('Batch error:', error);
        setErrors(prev => [...prev, `Batch ${i + 1}: ${error.message}`]);
      }
    }

    setStatus('Population complete!');
    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-8">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <Database className="w-10 h-10 text-purple-400" />
            <h1 className="text-4xl font-black">Image Database Populator</h1>
          </div>
          <p className="text-zinc-400">Generate thousands of validated images</p>
        </motion.div>

        <Card className="bg-zinc-900 border-purple-500/30">
          <CardHeader>
            <CardTitle>Population Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Target Image Count</label>
              <Input
                type="number"
                value={targetCount}
                onChange={(e) => setTargetCount(parseInt(e.target.value))}
                disabled={isRunning}
                className="bg-zinc-800 border-purple-500/30"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Batch Size (per request)</label>
              <Input
                type="number"
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value))}
                disabled={isRunning}
                className="bg-zinc-800 border-purple-500/30"
              />
            </div>

            {isRunning && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">{status}</span>
                  <span className="text-purple-400 font-bold">{totalCreated} / {targetCount}</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>
            )}

            {totalCreated > 0 && !isRunning && (
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <div>
                  <p className="text-white font-semibold">Success!</p>
                  <p className="text-zinc-400 text-sm">Created {totalCreated} validated images</p>
                </div>
              </div>
            )}

            {errors.length > 0 && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-white font-semibold">Errors ({errors.length})</p>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {errors.map((err, i) => (
                    <p key={i} className="text-red-400 text-xs">{err}</p>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={populateDatabase}
              disabled={isRunning}
              className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-lg"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Populating...
                </>
              ) : (
                <>
                  <Database className="w-5 h-5 mr-2" />
                  Start Population
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}