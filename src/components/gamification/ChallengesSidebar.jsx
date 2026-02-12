import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Target, Zap, TrendingUp, ChevronRight, ChevronLeft } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

export default function ChallengesSidebar({ userProfile }) {
  const [challenges, setChallenges] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  
  useEffect(() => {
    loadChallenges();
  }, []);
  
  const loadChallenges = async () => {
    const allChallenges = await base44.entities.Challenge.filter({ active: true });
    setChallenges(allChallenges.slice(0, 5));
  };
  
  const getProgress = (challenge) => {
    if (!userProfile) return 0;
    switch (challenge.metric) {
      case 'votes':
        return challenge.type === 'daily' ? userProfile.daily_votes : userProfile.weekly_votes;
      case 'streak':
        return userProfile.perfect_streak;
      default:
        return 0;
    }
  };
  
  const getChallengeIcon = (metric) => {
    switch (metric) {
      case 'votes': return Target;
      case 'accuracy': return TrendingUp;
      case 'streak': return Zap;
      default: return Trophy;
    }
  };
  
  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div
        initial={{ x: 300 }}
        animate={{ x: isExpanded ? 0 : 280 }}
        className="hidden lg:block fixed right-0 top-32 z-40 w-80 bg-zinc-900/95 backdrop-blur-md border-l border-purple-500/30 shadow-2xl shadow-purple-500/20"
        style={{ height: 'calc(100vh - 220px)' }}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -left-10 top-4 bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-l-lg shadow-lg"
        >
          {isExpanded ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
        
        <div className="p-4 overflow-y-auto h-full">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-bold text-white">Active Challenges</h3>
          </div>
          
          <div className="space-y-3">
            {challenges.map((challenge) => {
              const Icon = getChallengeIcon(challenge.metric);
              const progress = getProgress(challenge);
              const percentage = Math.min((progress / challenge.goal) * 100, 100);
              const isComplete = progress >= challenge.goal;
              
              return (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-3 rounded-lg border ${
                    isComplete 
                      ? 'bg-green-900/30 border-green-500/50' 
                      : 'bg-zinc-800/50 border-purple-500/30'
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <Icon className={`w-4 h-4 mt-0.5 ${isComplete ? 'text-green-400' : 'text-purple-400'}`} />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-white">{challenge.title}</h4>
                      <p className="text-xs text-zinc-400">{challenge.description}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Progress value={percentage} className="h-2" />
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">{progress} / {challenge.goal}</span>
                      <span className="text-yellow-400">+{challenge.reward_points} pts</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
      
      {/* Mobile Bottom Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: isExpanded ? '0%' : 'calc(100% - 60px)' }}
        className="lg:hidden fixed bottom-20 left-0 right-0 z-40 bg-zinc-900/95 backdrop-blur-md border-t border-purple-500/30 shadow-2xl"
        style={{ maxHeight: '60vh' }}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-3 px-4 flex items-center justify-between text-white"
        >
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="font-bold">Challenges ({challenges.length})</span>
          </div>
          {isExpanded ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
        
        {isExpanded && (
          <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(60vh - 60px)' }}>
            <div className="space-y-3">
              {challenges.map((challenge) => {
                const Icon = getChallengeIcon(challenge.metric);
                const progress = getProgress(challenge);
                const percentage = Math.min((progress / challenge.goal) * 100, 100);
                const isComplete = progress >= challenge.goal;
                
                return (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg border ${
                      isComplete 
                        ? 'bg-green-900/30 border-green-500/50' 
                        : 'bg-zinc-800/50 border-purple-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <Icon className={`w-4 h-4 mt-0.5 ${isComplete ? 'text-green-400' : 'text-purple-400'}`} />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-white">{challenge.title}</h4>
                        <p className="text-xs text-zinc-400">{challenge.description}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Progress value={percentage} className="h-2" />
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-400">{progress} / {challenge.goal}</span>
                        <span className="text-yellow-400">+{challenge.reward_points} pts</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
}