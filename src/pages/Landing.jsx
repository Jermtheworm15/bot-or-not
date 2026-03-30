import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { ArrowRight, FlaskConical, BarChart3, Brain, ShieldCheck } from 'lucide-react';
import AppFooter from '@/components/common/AppFooter';
import AIResearchStats from '@/components/research/AIResearchStats';

const SPLASH_KEY = 'splash_seen_v1';

export default function Landing() {
  const [isLoading, setIsLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(() => !localStorage.getItem(SPLASH_KEY));

  const handleSplashComplete = () => {
    localStorage.setItem(SPLASH_KEY, '1');
    setShowSplash(false);
  };

  // Check if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          window.location.href = '/Home';
        }
      } catch (err) {
        // Not authenticated, stay on landing
      }
    };
    checkAuth();
  }, []);

  const handleSignIn = async () => {
    setIsLoading(true);
    const nextUrl = window.location.origin + '/Home';
    base44.auth.redirectToLogin(nextUrl);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white overflow-x-hidden flex flex-col">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950 to-violet-950/20 pointer-events-none" />
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-violet-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-emerald-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col">
        {/* Hero */}
        <section className="flex flex-col items-center justify-center text-center px-6 pt-20 pb-16 max-w-3xl mx-auto w-full">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-zinc-700 shadow-xl">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698d8f79de41b00a2a2dd6e3/60edcef10_d5e77535-5a3b-4139-8a3f-6489d39444dc.jpg"
                  alt="Bot or Not"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 mb-4 font-semibold">AI Detection Platform</p>

            <h1 className="text-5xl md:text-6xl font-black mb-5 tracking-tight leading-none">
              Can You Tell the{' '}
              <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
                Difference?
              </span>
            </h1>

            <p className="text-lg text-zinc-300 mb-4 leading-relaxed max-w-xl mx-auto">
              Research shows humans identify AI-generated images at near-random accuracy.
              This platform measures your detection ability against global benchmarks and peer-reviewed studies.
            </p>

            <p className="text-sm text-zinc-500 mb-10 max-w-lg mx-auto">
              Crowd-sourced data from our users is compared in real time against results from published Turing Test experiments, cognitive science research, and AI capability assessments.
            </p>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              onClick={handleSignIn}
              disabled={isLoading}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold py-3.5 px-10 rounded-xl shadow-lg shadow-violet-900/50 transition-all text-base"
            >
              {isLoading ? 'Signing in…' : 'Begin Your Assessment'}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </motion.button>

            <p className="mt-4 text-xs text-zinc-600">Free to join · No advertising · Your data contributes to research</p>
          </motion.div>
        </section>

        {/* Feature pillars */}
        <section className="max-w-4xl mx-auto w-full px-4 pb-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="grid md:grid-cols-4 gap-4"
          >
            {[
              { icon: <Brain className="w-5 h-5" />, title: 'Cognitive Benchmark', desc: 'Measure and track your AI detection accuracy over time.', color: 'text-violet-400' },
              { icon: <FlaskConical className="w-5 h-5" />, title: 'Live Research Data', desc: 'Your votes feed a real-time dataset compared against published studies.', color: 'text-emerald-400' },
              { icon: <BarChart3 className="w-5 h-5" />, title: 'Performance Analytics', desc: 'Detailed breakdowns by image type, gender, and AI generation method.', color: 'text-sky-400' },
              { icon: <ShieldCheck className="w-5 h-5" />, title: 'Leaderboards', desc: 'Global and demographic rankings updated in real time.', color: 'text-amber-400' },
            ].map((f, i) => (
              <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
                <div className={`mb-3 ${f.color}`}>{f.icon}</div>
                <p className="font-semibold text-white text-sm mb-1">{f.title}</p>
                <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </motion.div>
        </section>

        {/* Research stats section */}
        <AIResearchStats />

        {/* Bottom CTA */}
        <section className="text-center px-6 py-16">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <p className="text-zinc-400 text-sm mb-4">Ready to test your perception?</p>
            <button
              onClick={handleSignIn}
              disabled={isLoading}
              className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-semibold py-3 px-8 rounded-xl transition-all text-sm"
            >
              {isLoading ? 'Signing in…' : 'Create Free Account'}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </motion.div>
        </section>
      </div>

      <AppFooter />
    </div>
  );
}