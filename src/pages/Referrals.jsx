import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Users, Copy, Check, Gift, Lock, Unlock, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function Referrals() {
  const [referralCode, setReferralCode] = useState('');
  const [referrals, setReferrals] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      const user = await base44.auth.me();
      
      // Generate referral code from user ID
      const code = btoa(user.email).slice(0, 8).toUpperCase();
      setReferralCode(code);
      
      // Load referrals
      const userReferrals = await base44.entities.Referral.filter({ referrer_email: user.email });
      setReferrals(userReferrals);
      
      // Load profile
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (profiles.length > 0) {
        setUserProfile(profiles[0]);
      }
    } catch (err) {
      console.log('Error loading referrals:', err);
    }
    setIsLoading(false);
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const completedReferrals = referrals.filter(r => r.completed).length;
  const isPremium = completedReferrals >= 3;
  const progressPercentage = Math.min((completedReferrals / 3) * 100, 100);

  const premiumFeatures = [
    { name: 'Ad-Free Experience', unlocked: isPremium },
    { name: 'Exclusive Badges', unlocked: isPremium },
    { name: 'Priority Support', unlocked: isPremium },
    { name: 'Custom Themes', unlocked: isPremium },
    { name: 'Advanced Stats', unlocked: isPremium }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center"
        >
          <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent">
            Refer Friends
          </h1>
          <p className="text-zinc-400">Unlock premium features by inviting 3 friends!</p>
        </motion.div>

        {/* Progress Card */}
        <Card className="bg-zinc-900 border-purple-500/30">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-white">Your Progress</span>
              {isPremium ? (
                <div className="flex items-center gap-2 text-green-400">
                  <Unlock className="w-5 h-5" />
                  Premium Unlocked!
                </div>
              ) : (
                <div className="flex items-center gap-2 text-purple-400">
                  <Lock className="w-5 h-5" />
                  {3 - completedReferrals} more to go
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Referrals</span>
                <span className="font-bold text-white">{completedReferrals} / 3</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>

            {/* Referral Link */}
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Your Referral Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={`${window.location.origin}?ref=${referralCode}`}
                  readOnly
                  className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                />
                <Button
                  onClick={copyReferralLink}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Premium Features */}
        <Card className="bg-zinc-900 border-purple-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Gift className="w-6 h-6 text-purple-400" />
              Premium Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {premiumFeatures.map((feature, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    feature.unlocked ? 'bg-green-900/20 border border-green-500/30' : 'bg-zinc-800'
                  }`}
                >
                  <span className={feature.unlocked ? 'text-white font-medium' : 'text-zinc-400'}>
                    {feature.name}
                  </span>
                  {feature.unlocked ? (
                    <Unlock className="w-5 h-5 text-green-400" />
                  ) : (
                    <Lock className="w-5 h-5 text-zinc-600" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Referral History */}
        <Card className="bg-zinc-900 border-purple-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="w-6 h-6 text-purple-400" />
              Your Referrals ({completedReferrals})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <p className="text-center text-zinc-500 py-8">
                No referrals yet. Share your link to get started!
              </p>
            ) : (
              <div className="space-y-2">
                {referrals.map((ref) => (
                  <div
                    key={ref.id}
                    className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg"
                  >
                    <div>
                      <div className="text-white text-sm font-medium">
                        {ref.referred_email}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {new Date(ref.created_date).toLocaleDateString()}
                      </div>
                    </div>
                    {ref.completed ? (
                      <div className="text-green-400 text-xs font-bold px-2 py-1 bg-green-900/20 rounded">
                        ✓ Completed
                      </div>
                    ) : (
                      <div className="text-orange-400 text-xs font-bold px-2 py-1 bg-orange-900/20 rounded">
                        Pending
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}