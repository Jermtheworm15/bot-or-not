import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import ShareButton from '@/components/social/ShareButton';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import BadgeDisplay from '@/components/gamification/BadgeDisplay';
import { Trophy, Star, Zap, Target, TrendingUp, Users, Heart } from 'lucide-react';
import FollowButton from '@/components/community/FollowButton';
import DemographicsForm from '@/components/community/DemographicsForm';
import BioEditor from '@/components/profile/BioEditor';
import PortfolioShowcase from '@/components/profile/PortfolioShowcase';
import ProfileActivityFeed from '@/components/profile/ProfileActivityFeed';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ total: 0, correct: 0, accuracy: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  
  useEffect(() => {
    loadProfile();
  }, []);
  
  const loadProfile = async () => {
    setIsLoading(true);
    
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    
    // Load or create profile
    const profiles = await base44.entities.UserProfile.filter({ user_email: currentUser.email });
    let userProfile;
    
    if (profiles.length === 0) {
      userProfile = await base44.entities.UserProfile.create({
        user_email: currentUser.email,
        points: 0,
        level: 1,
        badges: [],
        daily_votes: 0,
        weekly_votes: 0,
        perfect_streak: 0
      });
    } else {
      userProfile = profiles[0];
    }
    
    setProfile(userProfile);
    
    // Calculate stats and rank
    const [imageVotes, videoVotes, allProfiles] = await Promise.all([
      base44.entities.Vote.filter({ user_email: currentUser.email }),
      base44.entities.VideoVote.filter({ user_email: currentUser.email }),
      base44.entities.UserProfile.list()
    ]);
    
    const allVotes = [...imageVotes, ...videoVotes];
    const correct = allVotes.filter(v => v.was_correct).length;
    const accuracy = allVotes.length > 0 ? (correct / allVotes.length) * 100 : 0;
    
    // Calculate rank
    const sortedByPoints = [...allProfiles].sort((a, b) => (b.points || 0) - (a.points || 0));
    const rank = sortedByPoints.findIndex(p => p.user_email === currentUser.email) + 1;
    
    // Load followers and following
    const [followerData, followingData] = await Promise.all([
      base44.entities.Follow.filter({ following_email: currentUser.email }),
      base44.entities.Follow.filter({ follower_email: currentUser.email })
    ]);
    
    setFollowers(followerData);
    setFollowing(followingData);
    
    const handleDemographicsSave = async (data) => {
      try {
        await base44.entities.UserProfile.update(profiles[0].id, data);
        await loadProfile();
      } catch (err) {
        console.error('Error saving demographics:', err);
      }
    };
    
    setStats({
      total: allVotes.length,
      correct,
      accuracy,
      rank: rank || null
    });
    
    setIsLoading(false);
  };
  
  const getNextLevelPoints = (level) => level * 100;
  const levelProgress = profile ? (profile.points % getNextLevelPoints(profile.level)) / getNextLevelPoints(profile.level) * 100 : 0;

  const handleDemographicsSave = async (data) => {
    try {
      await base44.entities.UserProfile.update(profile.id, data);
      setProfile(prev => ({ ...prev, ...data }));
    } catch (err) {
      console.error('Error saving demographics:', err);
    }
  };

  const handleBioSave = async (bio) => {
    try {
      await base44.entities.UserProfile.update(profile.id, { bio });
      setProfile(prev => ({ ...prev, bio }));
    } catch (err) {
      console.error('Error saving bio:', err);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-purple-400">Loading profile...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-zinc-950 text-white py-8">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center"
        >
          <h1 className="text-4xl font-black mb-2">
            {user?.username ? `@${user.username}` : 'Your Profile'}
          </h1>
          <p className="text-zinc-400">{user?.email}</p>
        </motion.div>
        
        {/* Rank Card */}
        {stats.rank && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <Card className="bg-gradient-to-r from-purple-900/30 to-green-900/30 border-purple-500/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center">
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-3xl font-black text-white">#{stats.rank}</p>
                      <p className="text-zinc-400">Global Rank</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-zinc-400 text-sm mb-1">Top {((stats.rank / (stats.rank + 100)) * 100).toFixed(0)}%</p>
                    <a href="/UserLeaderboard" className="text-purple-400 text-sm hover:underline">View Leaderboard →</a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Follow Stats */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="grid grid-cols-2 gap-4"
        >
          <Card className="bg-zinc-900 border-purple-500/30">
            <CardContent className="pt-6 flex items-center gap-3">
              <Heart className="w-6 h-6 text-red-400" />
              <div>
                <p className="text-2xl font-bold text-white">{followers.length}</p>
                <p className="text-xs text-zinc-400">Followers</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-purple-500/30">
            <CardContent className="pt-6 flex items-center gap-3">
              <Users className="w-6 h-6 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-white">{following.length}</p>
                <p className="text-xs text-zinc-400">Following</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Level & Points */}
        <Card className="bg-zinc-900 border-purple-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-400" />
              Level {profile?.level}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-400">Progress to Level {profile?.level + 1}</span>
                <span className="text-purple-400 font-bold">{profile?.points} points</span>
              </div>
              <Progress value={levelProgress} className="h-3" />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-zinc-800 rounded-lg p-3 text-center">
                <Target className="w-6 h-6 text-purple-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-xs text-zinc-400">Total Votes</p>
              </div>
              
              <div className="bg-zinc-800 rounded-lg p-3 text-center">
                <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">{stats.accuracy.toFixed(0)}%</p>
                <p className="text-xs text-zinc-400">Accuracy</p>
              </div>
              
              <div className="bg-zinc-800 rounded-lg p-3 text-center">
                <Zap className="w-6 h-6 text-orange-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">{profile?.perfect_streak}</p>
                <p className="text-xs text-zinc-400">Best Streak</p>
              </div>
              
              <div className="bg-zinc-800 rounded-lg p-3 text-center">
                <Trophy className="w-6 h-6 text-amber-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">{profile?.badges?.length || 0}</p>
                <p className="text-xs text-zinc-400">Badges</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Bio */}
        <BioEditor bio={profile?.bio} onSave={handleBioSave} />

        {/* Portfolio */}
        <PortfolioShowcase userEmail={user?.email} isOwnProfile={true} />

        {/* Activity Feed */}
        <ProfileActivityFeed userEmail={user?.email} />

        {/* Demographics */}
        <DemographicsForm profile={profile} onSave={handleDemographicsSave} />

        {/* Badges */}
        <Card className="bg-zinc-900 border-purple-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              Badges & Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BadgeDisplay badges={profile?.badges || []} size="lg" />
          </CardContent>
        </Card>

        {/* Share Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-zinc-900 border-purple-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-green-400" />
                Share Your Achievement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-400 text-sm mb-4">
                Show off your stats to friends and challenge them to beat your score!
              </p>
              <ShareButton 
                userStats={{
                  totalVotes: stats.total,
                  accuracy: stats.accuracy,
                  streak: profile?.perfect_streak || 0
                }}
              />
            </CardContent>
          </Card>
        </motion.div>
        </div>
        </div>
        );
        }