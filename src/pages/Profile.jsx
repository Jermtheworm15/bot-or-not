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
import SocialMediaLinks from '@/components/profile/SocialMediaLinks';
import ChallengeUser from '@/components/challenges/ChallengeUser';
import FriendButton from '@/components/social/FriendButton';
import FriendsList from '@/components/messaging/FriendsList';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, Edit, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ total: 0, correct: 0, accuracy: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    loadProfile();
  }, []);
  
  const loadProfile = async () => {
    setIsLoading(true);
    
    try {
      const loggedInUser = await base44.auth.me();
      if (!loggedInUser) {
        navigate('/Landing');
        return;
      }
      setCurrentUser(loggedInUser);
    
    // Check if viewing another user's profile via URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const viewUserEmail = urlParams.get('user');
    const targetEmail = viewUserEmail || loggedInUser.email;
    const isOwn = !viewUserEmail || viewUserEmail === loggedInUser.email;
    setIsOwnProfile(isOwn);
    
    // Load target user data
    if (!isOwn) {
      const allUsers = await base44.entities.User.list();
      const targetUser = allUsers.find(u => u.email === targetEmail);
      if (!targetUser) {
        navigate('/Community');
        return;
      }
      setUser(targetUser);
    } else {
      setUser(loggedInUser);
    }
    
    // Load or create profile
    const profiles = await base44.entities.UserProfile.filter({ user_email: targetEmail });
    let userProfile;
    
    if (profiles.length === 0) {
      if (isOwn) {
        userProfile = await base44.entities.UserProfile.create({
          user_email: targetEmail,
          points: 0,
          level: 1,
          badges: [],
          daily_votes: 0,
          weekly_votes: 0,
          perfect_streak: 0
        });
      } else {
        // Viewing user with no profile
        userProfile = {
          user_email: targetEmail,
          points: 0,
          level: 1,
          badges: [],
          daily_votes: 0,
          weekly_votes: 0,
          perfect_streak: 0
        };
      }
    } else {
      userProfile = profiles[0];
    }
    
    setProfile(userProfile);
    
    // Calculate stats and rank
    const [imageVotes, videoVotes, allProfiles] = await Promise.all([
      base44.entities.Vote.filter({ user_email: targetEmail }),
      base44.entities.VideoVote.filter({ user_email: targetEmail }),
      base44.entities.UserProfile.list()
    ]);
    
    const allVotes = [...imageVotes, ...videoVotes];
    const correct = allVotes.filter(v => v.was_correct).length;
    const accuracy = allVotes.length > 0 ? (correct / allVotes.length) * 100 : 0;
    
    // Calculate rank
    const sortedByPoints = [...allProfiles].sort((a, b) => (b.points || 0) - (a.points || 0));
    const rank = sortedByPoints.findIndex(p => p.user_email === targetEmail) + 1;
    
    // Load followers and following
    const [followerData, followingData] = await Promise.all([
      base44.entities.Follow.filter({ following_email: targetEmail }),
      base44.entities.Follow.filter({ follower_email: targetEmail })
    ]);
    
    setFollowers(followerData);
    setFollowing(followingData);
    
    setStats({
      total: allVotes.length,
      correct,
      accuracy,
      rank: rank || null
    });
    
    setIsLoading(false);
    } catch (err) {
      console.error('Error loading profile:', err);
      navigate('/Landing');
    }
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

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // Delete user profile and related data
      if (profile) {
        await base44.entities.UserProfile.delete(profile.id);
      }
      // Logout and redirect
      await base44.auth.logout('/Landing');
    } catch (err) {
      console.error('Error deleting account:', err);
      setIsDeleting(false);
    }
  };

  const handleResetProfile = async () => {
    setIsResetting(true);
    try {
      if (profile) {
        // Reset profile to initial state
        await base44.entities.UserProfile.update(profile.id, {
          points: 0,
          level: 1,
          badges: ['newcomer'],
          daily_votes: 0,
          weekly_votes: 0,
          perfect_streak: 0,
          bio: '',
          zip_code: ''
        });
        await loadProfile();
        setShowResetDialog(false);
      }
    } catch (err) {
      console.error('Error resetting profile:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await base44.auth.logout('/Landing');
    } catch (err) {
      console.error('Sign out error:', err);
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
                <div className="flex items-center justify-between mb-4">
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
                {!isOwnProfile && currentUser && user && (
                  <ChallengeUser 
                    targetUserEmail={user?.email} 
                    targetUserName={user?.username || user?.email}
                    currentUserEmail={currentUser?.email}
                    currentUserName={currentUser?.username || currentUser?.email}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Friends & Follow Stats */}
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

        {/* Friend Actions */}
        {!isOwnProfile && currentUser && user && (
          <div className="flex gap-2">
            <FriendButton 
              targetUserEmail={user?.email}
              currentUserEmail={currentUser?.email}
            />
            <FollowButton
              targetUserEmail={user?.email}
              currentUserEmail={currentUser?.email}
            />
          </div>
        )}

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
        {isOwnProfile ? (
          <BioEditor bio={profile?.bio} onSave={handleBioSave} />
        ) : profile?.bio ? (
          <Card className="bg-zinc-900 border-purple-500/30">
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-zinc-300 whitespace-pre-wrap">{profile.bio}</div>
            </CardContent>
          </Card>
        ) : null}

        {/* Social Media Links */}
        <SocialMediaLinks userProfile={profile} onUpdate={isOwnProfile ? loadProfile : null} />

        {/* Portfolio */}
        <PortfolioShowcase userEmail={user?.email} isOwnProfile={isOwnProfile} />

        {/* Friends List */}
        {isOwnProfile && (
          <FriendsList userEmail={user?.email} userName={user?.username || user?.email} />
        )}

        {/* Demographics */}
        {isOwnProfile && (
          <DemographicsForm profile={profile} onSave={handleDemographicsSave} />
        )}

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

        {/* Account Settings */}
        {isOwnProfile && (
          <Card className="bg-zinc-900 border-purple-500/30 border-red-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-400">
                <Trash2 className="w-6 h-6" />
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => navigate('/Onboarding')}
                variant="outline"
                className="w-full border-purple-500/30 text-purple-400 hover:bg-purple-900/30"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile Setup
              </Button>
              <p className="text-xs text-zinc-400">
                Re-do your onboarding to update your username, password, and profile photo.
              </p>

              <button
                onClick={() => setShowResetDialog(true)}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Reset Profile Stats
              </button>
              <p className="text-xs text-zinc-400">
                Clear all points, badges, and streaks. This cannot be undone.
              </p>

              <button
                onClick={() => setShowDeleteDialog(true)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Delete Account
              </button>
              <p className="text-xs text-zinc-400">
                Deleting your account is permanent and cannot be undone. All your data will be removed.
              </p>

              <button
                onClick={handleSignOut}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
              <p className="text-xs text-zinc-400 mt-3">
                Sign out of your account and return to the login page.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Reset Profile Dialog */}
        <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <AlertDialogContent className="bg-zinc-900 border-purple-500/30">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-orange-400">Reset Profile Stats</AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-300">
                Are you sure? This will reset all your points, badges, streaks, and profile information. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3 justify-end">
              <AlertDialogCancel className="bg-zinc-800 text-white hover:bg-zinc-700">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleResetProfile}
                disabled={isResetting}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isResetting ? 'Resetting...' : 'Reset'}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Account Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="bg-zinc-900 border-purple-500/30">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-400">Delete Account</AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-300">
                Are you sure? This will permanently delete your account and all associated data. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3 justify-end">
              <AlertDialogCancel className="bg-zinc-800 text-white hover:bg-zinc-700">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

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