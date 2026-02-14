import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Zap, Eye, Trophy, Users, Gamepad2, ArrowRight } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function Landing() {
  const [isLoading, setIsLoading] = useState(false);

  // Check if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          window.location.href = createPageUrl('Home');
        }
      } catch (err) {
        // Not authenticated, stay on landing
      }
    };
    checkAuth();
  }, []);

  const handleSignIn = () => {
    window.location.href = createPageUrl('Login');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/40 via-zinc-950 to-emerald-950/30 pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-green-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Animated Grid */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(147,51,234,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.2)_1px,transparent_1px)] bg-[60px_60px]" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 max-w-2xl"
        >
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center shadow-lg shadow-purple-500/50 border-2 border-purple-500/50">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698d8f79de41b00a2a2dd6e3/60edcef10_d5e77535-5a3b-4139-8a3f-6489d39444dc.jpg" 
                alt="Bot or Not Logo" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl font-black mb-4 tracking-wider uppercase">
            <span className="bg-gradient-to-r from-purple-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
              Bot or Not
            </span>
          </h1>
          
          <p className="text-xl text-zinc-300 mb-6">
            Test your AI detection skills in the ultimate guessing game
          </p>
          
          <p className="text-sm text-zinc-400 mb-8">
            Compete on leaderboards, earn badges, and prove you can spot the difference between human and AI
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="grid md:grid-cols-2 gap-6 mb-16 max-w-2xl w-full"
        >
          <div className="bg-zinc-900/50 backdrop-blur-md border border-purple-500/30 rounded-lg p-6 hover:border-purple-500/60 transition-colors">
            <Eye className="w-8 h-8 text-green-400 mb-3" />
            <h3 className="font-bold text-lg mb-2">Vote & Analyze</h3>
            <p className="text-sm text-zinc-400">
              Guess whether images are AI-generated or human
            </p>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-md border border-purple-500/30 rounded-lg p-6 hover:border-purple-500/60 transition-colors">
            <Trophy className="w-8 h-8 text-amber-400 mb-3" />
            <h3 className="font-bold text-lg mb-2">Climb Rankings</h3>
            <p className="text-sm text-zinc-400">
              Compete globally and earn your place on the leaderboard
            </p>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-md border border-purple-500/30 rounded-lg p-6 hover:border-purple-500/60 transition-colors">
            <Gamepad2 className="w-8 h-8 text-pink-400 mb-3" />
            <h3 className="font-bold text-lg mb-2">Challenge Friends</h3>
            <p className="text-sm text-zinc-400">
              Battle other players in real-time AI detection showdowns
            </p>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-md border border-purple-500/30 rounded-lg p-6 hover:border-purple-500/60 transition-colors">
            <Zap className="w-8 h-8 text-orange-400 mb-3" />
            <h3 className="font-bold text-lg mb-2">Earn Rewards</h3>
            <p className="text-sm text-zinc-400">
              Unlock badges, points, and premium features
            </p>
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          onClick={handleSignIn}
          disabled={isLoading}
          className="bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-500 hover:to-green-500 disabled:opacity-50 text-white font-bold py-4 px-12 rounded-lg shadow-lg shadow-purple-500/50 transition-all flex items-center gap-2 text-lg"
        >
          {isLoading ? 'Signing In...' : 'Start Playing'}
          {!isLoading && <ArrowRight className="w-5 h-5" />}
        </motion.button>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-16 grid grid-cols-3 gap-8 text-center"
        >
          <div>
            <p className="text-3xl font-black text-green-400">10K+</p>
            <p className="text-sm text-zinc-400">Active Players</p>
          </div>
          <div>
            <p className="text-3xl font-black text-purple-400">50K+</p>
            <p className="text-sm text-zinc-400">AI Images</p>
          </div>
          <div>
            <p className="text-3xl font-black text-pink-400">24/7</p>
            <p className="text-sm text-zinc-400">Gameplay</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}