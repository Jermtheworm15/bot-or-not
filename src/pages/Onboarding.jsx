import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Target, Trophy, ArrowRight, Upload, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

import ImageCard from '@/components/voting/ImageCard';
import VotingButtons from '@/components/voting/VotingButtons';

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [demoImage, setDemoImage] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadDemoImage();
  }, []);

  const loadDemoImage = async () => {
    try {
      const images = await base44.entities.Image.list();
      if (images.length > 0) {
        setDemoImage(images[Math.floor(Math.random() * images.length)]);
      }
    } catch (err) {
      console.log('Error loading demo:', err);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUsernameSubmit = async () => {
    if (!username.trim()) return;
    
    setIsUploading(true);
    setPasswordError('');
    try {
      const user = await base44.auth.me();
      
      // Upload profile image if provided
      let imageUrl = null;
      if (profileImage) {
        try {
          const result = await base44.integrations.Core.UploadFile({ file: profileImage });
          imageUrl = result.file_url;
        } catch (err) {
          console.log('[Onboarding] Image upload failed, continuing without it:', err);
        }
      }
      
      // Update user display name (and image if available)
      try {
        const updateData = { full_name: username };
        if (imageUrl) updateData.profile_image = imageUrl;
        await base44.auth.updateMe(updateData);
      } catch (err) {
        console.log('[Onboarding] updateMe failed, continuing:', err);
      }
      
      // Upsert profile with silent retry
      const minimalProfile = {
        user_email: user.email,
        points: 0,
        level: 1,
        tier: 'bronze',
        badges: ['newcomer'],
        daily_votes: 0,
        weekly_votes: 0,
        perfect_streak: 0
      };
      if (zipCode.trim()) minimalProfile.zip_code = zipCode.trim();

      let profile = null;
      try {
        const existingProfiles = await base44.entities.UserProfile.filter({ user_email: user.email });
        if (existingProfiles.length > 0) {
          profile = await base44.entities.UserProfile.update(existingProfiles[0].id, {
            ...(zipCode.trim() ? { zip_code: zipCode.trim() } : {})
          });
        } else {
          profile = await base44.entities.UserProfile.create(minimalProfile);
        }
      } catch (err) {
        console.log('[Onboarding] Profile save failed, retrying with minimal data:', err);
        // Retry once with absolute minimum
        try {
          profile = await base44.entities.UserProfile.create({ user_email: user.email });
        } catch (retryErr) {
          console.log('[Onboarding] Retry also failed, proceeding without profile:', retryErr);
          profile = { ...minimalProfile, id: null };
        }
      }
      
      setUserProfile(profile);
      setStep(1);
    } catch (err) {
      console.log('[Onboarding] Unexpected error:', err);
      // Still advance — don't block the user
      setStep(1);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDemoVote = async (guessedBot) => {
    if (!demoImage) return;
    
    const correct = guessedBot === demoImage.is_bot;
    setWasCorrect(correct);
    setHasVoted(true);
    
    // Update profile with first vote bonus
    if (userProfile) {
      await base44.entities.UserProfile.update(userProfile.id, {
        points: 50,
        daily_votes: 1,
        badges: ['newcomer', 'first_vote']
      });
      
      // Create activity
      const user = await base44.auth.me();
      await base44.entities.Activity.create({
        user_email: user.email,
        username: username,
        action_type: 'vote',
        description: 'Completed first vote!'
      });
    }
    
    setTimeout(() => setStep(2), 2000);
  };

  const completeOnboarding = () => {
    window.location.href = '/Home';
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <AnimatePresence mode="wait">
          {/* Step 0: Username */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-6"
            >
              <div className="inline-block p-3 bg-purple-600/20 rounded-full mb-4">
                <Zap className="w-12 h-12 text-purple-400" />
              </div>
              
              <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent">
                Welcome to Bot or Not!
              </h1>
              
              <p className="text-zinc-400 text-lg">
                Test your skills at spotting AI-generated content
              </p>
              
              <div className="max-w-md mx-auto space-y-4">
                <input
                  type="text"
                  placeholder="Choose your username..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-6 py-4 bg-zinc-900 border border-purple-500/30 rounded-xl text-white text-center text-lg focus:outline-none focus:border-purple-500"
                  autoFocus
                />
                
                {passwordError && (
                  <p className="text-red-400 text-sm">{passwordError}</p>
                )}
                
                <input
                  type="text"
                  placeholder="Zip code (optional)..."
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  maxLength="5"
                  className="w-full px-6 py-4 bg-zinc-900 border border-purple-500/30 rounded-xl text-white text-center text-lg focus:outline-none focus:border-purple-500"
                />
                
                {/* Profile Image Upload */}
                <div className="border-2 border-dashed border-purple-500/30 rounded-xl p-6 hover:border-purple-500 transition-colors">
                  <input
                    id="profile-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label htmlFor="profile-upload" className="cursor-pointer">
                    {profileImagePreview ? (
                      <div className="flex flex-col items-center gap-3">
                        <img
                          src={profileImagePreview}
                          alt="Profile"
                          className="w-24 h-24 rounded-full object-cover border-2 border-purple-500"
                        />
                        <p className="text-sm text-purple-400">Click to change photo</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center">
                          <User className="w-12 h-12 text-zinc-600" />
                        </div>
                        <div>
                          <p className="text-white font-medium flex items-center gap-2 justify-center">
                            <Upload className="w-4 h-4" />
                            Upload Profile Photo
                          </p>
                          <p className="text-sm text-zinc-500 mt-1">
                            Optional — PNG, JPG up to 10MB
                          </p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>
                
                <Button
                  onClick={handleUsernameSubmit}
                  disabled={!username.trim() || isUploading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg font-bold"
                >
                  {isUploading ? 'Uploading...' : 'Start Playing'} <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 1: Demo Vote */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <div className="inline-block p-3 bg-green-600/20 rounded-full mb-4">
                  <Target className="w-12 h-12 text-green-400" />
                </div>
                
                <h2 className="text-3xl font-black mb-2">Let's Try One!</h2>
                <p className="text-zinc-400">Is this a bot or a human?</p>
              </div>
              
              <ImageCard
                imageUrl={demoImage?.url}
                isLoading={!demoImage}
                isRevealed={hasVoted}
                isBot={demoImage?.is_bot}
                wasCorrect={wasCorrect}
              />
              
              {!hasVoted && (
                <VotingButtons
                  onVote={handleDemoVote}
                  disabled={!demoImage}
                />
              )}
            </motion.div>
          )}

          {/* Step 2: Rewards */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center space-y-6"
            >
              <div className="inline-block p-3 bg-yellow-600/20 rounded-full mb-4">
                <Trophy className="w-12 h-12 text-yellow-400 animate-bounce" />
              </div>
              
              <h2 className="text-4xl font-black">You're All Set! 🎉</h2>
              
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                <div className="bg-zinc-900 border border-purple-500/30 rounded-xl p-4">
                  <div className="text-3xl font-black text-purple-400">50</div>
                  <div className="text-xs text-zinc-400 mt-1">Points Earned</div>
                </div>
                
                <div className="bg-zinc-900 border border-purple-500/30 rounded-xl p-4">
                  <div className="text-3xl font-black text-green-400">2</div>
                  <div className="text-xs text-zinc-400 mt-1">Badges Unlocked</div>
                </div>
                
                <div className="bg-zinc-900 border border-purple-500/30 rounded-xl p-4">
                  <div className="text-3xl font-black text-orange-400">1</div>
                  <div className="text-xs text-zinc-400 mt-1">Level</div>
                </div>
              </div>
              
              <p className="text-zinc-400 max-w-md mx-auto">
                You've unlocked your first badges! Keep playing to earn more rewards and climb the leaderboard.
              </p>
              
              <Button
                onClick={completeOnboarding}
                className="bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 text-white py-6 px-12 text-lg font-bold"
              >
                Start Playing! <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}