import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Award, Target, Clock, CheckCircle2, Sparkles, TrendingUp, Zap } from 'lucide-react';
import BadgeDisplay from '@/components/gamification/BadgeDisplay';
import { Progress } from "@/components/ui/progress";

export default function Achievements() {
  const [userProfile, setUserProfile] = useState(null);
  const [completions, setCompletions] = useState([]);
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [allActiveChallenges, setAllActiveChallenges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (profiles.length > 0) {
        setUserProfile(profiles[0]);
      }

      const completedChallenges = await base44.entities.ChallengeCompletion.filter(
        { user_email: user.email },
        '-completed_date'
      );
      setCompletions(completedChallenges);

      const challenges = await base44.entities.Challenge.filter({ 
        active: true,
        user_email: user.email 
      });
      setActiveChallenges(challenges);
      
      // Load all active challenges for display
      const allChallenges = await base44.entities.Challenge.filter({ active: true });
      setAllActiveChallenges(allChallenges);
    } catch (err) {
      console.log('Error loading data:', err);
    }
    setIsLoading(false);
  };

  const generatePersonalizedChallenges = async () => {
    setIsGenerating(true);
    try {
      await base44.functions.invoke('generatePersonalizedChallenges', {});
      await loadData();
    } catch (err) {
      console.error('Error generating challenges:', err);
    }
    setIsGenerating(false);
  };

  const getTierColor = (tier) => {
    const colors = {
      bronze: 'from-amber-700 to-amber-900',
      silver: 'from-slate-400 to-slate-600',
      gold: 'from-yellow-400 to-yellow-600',
      platinum: 'from-cyan-400 to-blue-600'
    };
    return colors[tier] || colors.bronze;
  };

  const getTierIcon = (tier) => {
    return <Trophy className={`w-5 h-5 ${tier === 'platinum' ? 'text-cyan-400' : tier === 'gold' ? 'text-yellow-400' : tier === 'silver' ? 'text-slate-400' : 'text-amber-600'}`} />;
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-white">Loading achievements...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-32">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />
      
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center space-y-2"
        >
          <h1 className="text-4xl font-black tracking-tight flex items-center justify-center gap-3">
            <Award className="w-10 h-10 text-purple-500" />
            Achievements
          </h1>
          <p className="text-zinc-400">Track your progress and earn rewards</p>
        </motion.div>

        {/* User Tier Badge */}
        {userProfile && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex justify-center"
          >
            <div className={`bg-gradient-to-br ${getTierColor(userProfile.tier)} px-8 py-4 rounded-2xl shadow-lg flex items-center gap-3`}>
              {getTierIcon(userProfile.tier)}
              <div>
                <div className="text-xs uppercase tracking-wider opacity-80">Current Tier</div>
                <div className="text-2xl font-bold capitalize">{userProfile.tier}</div>
              </div>
            </div>
          </motion.div>
        )}

        <Tabs defaultValue="badges" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-zinc-900">
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="challenges">Personalized</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Badges Tab */}
          <TabsContent value="badges" className="space-y-6">
            <Card className="bg-zinc-900 border-zinc-800 p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Earned Badges
              </h3>
              {userProfile?.badges?.length > 0 ? (
                <BadgeDisplay badges={userProfile.badges} size="lg" />
              ) : (
                <p className="text-zinc-500 text-center py-8">No badges earned yet. Complete challenges to earn badges!</p>
              )}
            </Card>
          </TabsContent>

          {/* All Active Challenges Tab */}
          <TabsContent value="active" className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Active Challenges
            </h3>

            <div className="grid gap-3">
              {allActiveChallenges.length > 0 ? (
                allActiveChallenges.map((challenge) => {
                  const Icon = getChallengeIcon(challenge.metric);
                  const progress = getProgress(challenge);
                  const percentage = Math.min((progress / challenge.goal) * 100, 100);
                  const isComplete = progress >= challenge.goal;
                  
                  return (
                    <motion.div
                      key={challenge.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className={`p-4 ${
                        isComplete 
                          ? 'bg-green-900/30 border-green-500/50' 
                          : 'bg-zinc-900 border-zinc-800'
                      }`}>
                        <div className="flex items-start gap-3 mb-3">
                          <Icon className={`w-5 h-5 mt-0.5 ${isComplete ? 'text-green-400' : 'text-purple-400'}`} />
                          <div className="flex-1">
                            <h4 className="text-base font-semibold">{challenge.title}</h4>
                            <p className="text-sm text-zinc-400">{challenge.description}</p>
                          </div>
                          <Badge variant="secondary" className="bg-yellow-600/20 text-yellow-400">
                            +{challenge.reward_points} pts
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <Progress value={percentage} className="h-2" />
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-400">{progress} / {challenge.goal}</span>
                            <span className="text-zinc-500">{Math.round(percentage)}%</span>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })
              ) : (
                <Card className="bg-zinc-900 border-zinc-800 p-8 text-center">
                  <p className="text-zinc-500">No active challenges available.</p>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Personalized Challenges Tab */}
          <TabsContent value="challenges" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Target className="w-5 h-5 text-green-500" />
                Personalized Challenges
              </h3>
              <Button
                onClick={generatePersonalizedChallenges}
                disabled={isGenerating}
                className="bg-purple-600 hover:bg-purple-700 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2 inline-block" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate New
                  </>
                )}
              </Button>
            </div>

            <div className="grid gap-4">
              {activeChallenges.length > 0 ? (
                activeChallenges.map((challenge) => (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className={`bg-gradient-to-br ${getTierColor(challenge.tier)} border-0 p-6`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          {getTierIcon(challenge.tier)}
                          <h4 className="font-bold text-lg">{challenge.title}</h4>
                        </div>
                        <Badge variant="secondary" className="bg-white/20 text-white">
                          {challenge.reward_points} pts
                        </Badge>
                      </div>
                      <p className="text-white/90 mb-4">{challenge.description}</p>
                      <div className="flex items-center gap-4 text-sm text-white/70">
                        <span className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          Goal: {challenge.goal}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          {challenge.metric}
                        </span>
                        {challenge.end_date && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Ends {new Date(challenge.end_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <Card className="bg-zinc-900 border-zinc-800 p-8 text-center">
                  <p className="text-zinc-500 mb-4">No personalized challenges yet!</p>
                  <Button
                    onClick={generatePersonalizedChallenges}
                    disabled={isGenerating}
                    className="bg-purple-600 hover:bg-purple-700 cursor-pointer"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2 inline-block" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Your First Challenges
                      </>
                    )}
                  </Button>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Completed Challenges
            </h3>

            <div className="space-y-3">
              {completions.length > 0 ? (
                completions.map((completion) => (
                  <motion.div
                    key={completion.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <Card className="bg-zinc-900 border-zinc-800 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          <div>
                            <div className="font-semibold">Challenge Completed</div>
                            <div className="text-sm text-zinc-500">
                              {new Date(completion.completed_date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-400 font-bold">+{completion.points_earned} pts</div>
                          {completion.badge_earned && (
                            <Badge className="mt-1 bg-purple-600">Badge Earned!</Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <Card className="bg-zinc-900 border-zinc-800 p-8 text-center">
                  <p className="text-zinc-500">No completed challenges yet. Start voting to complete challenges!</p>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}