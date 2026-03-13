import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Flame, CheckCircle, Lock, Coins } from 'lucide-react';
import { toast } from 'sonner';

const DAILY_REWARDS = [100, 150, 200, 300, 500, 750, 1000];

export default function DailyRewards() {
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(null);
  const [claimed, setClaimed] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const today = new Date().toISOString().split('T')[0];

      // Get login streak
      const streaks = await base44.entities.DailyStreak.filter({
        user_email: currentUser.email,
        streak_type: 'login'
      });

      if (streaks.length > 0) {
        setStreak(streaks[0]);
      }

      // Check if claimed today
      const rewards = await base44.entities.DailyReward.filter({
        user_email: currentUser.email,
        reward_date: today
      });

      setClaimed(rewards.length > 0 && rewards[0].claimed);

    } catch (error) {
      console.error('[Daily Rewards] Load error:', error);
    }
    setLoading(false);
  };

  const handleClaim = async () => {
    try {
      const result = await base44.functions.invoke('claimDailyReward', {});
      
      if (result.data?.success) {
        toast.success(`Claimed ${result.data.reward_amount} tokens!`);
        loadData();
      }
    } catch (error) {
      console.error('[Daily Rewards] Claim error:', error);
      toast.error(error.response?.data?.error || 'Failed to claim reward');
    }
  };

  const currentDay = (streak?.current_streak % 7) || 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center pb-32">
        <div className="animate-spin w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 p-4 pb-32 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-black mb-2 flex items-center gap-2">
            <Gift className="w-8 h-8 text-yellow-400" />
            Daily Rewards
          </h1>
          <p className="text-green-500/60">Claim your daily login reward</p>
        </div>

        {/* Streak Info */}
        <Card className="bg-gradient-to-br from-orange-900/30 to-orange-800/20 border-orange-500/30 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Flame className="w-8 h-8 text-orange-400" />
              <div>
                <div className="text-2xl font-black text-white">{streak?.current_streak || 0} Days</div>
                <div className="text-sm text-green-500/60">Login Streak</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-orange-400">Day {currentDay}/7</div>
              <div className="text-xs text-green-500/60">Current Cycle</div>
            </div>
          </div>
        </Card>

        {/* Reward Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {DAILY_REWARDS.map((reward, idx) => {
            const day = idx + 1;
            const isToday = day === currentDay;
            const isPast = day < currentDay;
            const isFuture = day > currentDay;

            return (
              <Card
                key={day}
                className={`p-6 text-center ${
                  isToday
                    ? 'bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 border-yellow-500/50'
                    : isPast
                    ? 'bg-black/40 border-green-500/30'
                    : 'bg-black/40 border-purple-500/20 opacity-60'
                }`}
              >
                <div className="mb-3">
                  {isPast ? (
                    <CheckCircle className="w-8 h-8 mx-auto text-green-400" />
                  ) : isFuture ? (
                    <Lock className="w-8 h-8 mx-auto text-purple-400/50" />
                  ) : (
                    <Gift className="w-8 h-8 mx-auto text-yellow-400 animate-pulse" />
                  )}
                </div>

                <div className="text-sm font-bold text-green-500/60 mb-1">Day {day}</div>
                <div className="text-2xl font-black text-yellow-400">{reward}</div>
                <div className="text-xs text-green-500/60">Tokens</div>

                {isToday && (
                  <Badge className="mt-3 bg-yellow-600">Today</Badge>
                )}
              </Card>
            );
          })}
        </div>

        {/* Claim Button */}
        <Card className="bg-black/60 border-purple-500/30 p-6 text-center">
          {claimed ? (
            <div>
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
              <h3 className="text-xl font-bold text-white mb-2">Reward Claimed!</h3>
              <p className="text-green-500/60">Come back tomorrow for your next reward</p>
            </div>
          ) : (
            <div>
              <Coins className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
              <h3 className="text-xl font-bold text-white mb-2">
                Claim {DAILY_REWARDS[currentDay - 1]} Tokens
              </h3>
              <p className="text-green-500/60 mb-4">Day {currentDay} reward is ready!</p>
              <Button
                onClick={handleClaim}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-8"
              >
                Claim Reward
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}