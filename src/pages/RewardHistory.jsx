import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, TrendingUp, Trophy, Users, Upload, Zap } from 'lucide-react';

export default function RewardHistory() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [txs, rewardStats] = await Promise.all([
        base44.entities.TokenTransaction.filter({ user_email: currentUser.email }, '-created_date', 100),
        base44.entities.UserRewardStats.filter({ user_email: currentUser.email })
      ]);

      setTransactions(txs);
      setStats(rewardStats.length > 0 ? rewardStats[0] : null);

    } catch (error) {
      console.error('[Rewards] Load error:', error);
    }
    setLoading(false);
  };

  const getIcon = (type) => {
    if (type.includes('vote')) return <Zap className="w-4 h-4 text-yellow-400" />;
    if (type.includes('tournament')) return <Trophy className="w-4 h-4 text-purple-400" />;
    if (type.includes('referral')) return <Users className="w-4 h-4 text-blue-400" />;
    if (type.includes('upload')) return <Upload className="w-4 h-4 text-green-400" />;
    return <Coins className="w-4 h-4 text-yellow-400" />;
  };

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
        <h1 className="text-3xl font-black mb-6 flex items-center gap-2">
          <Coins className="w-8 h-8 text-yellow-400" />
          Reward History
        </h1>

        {/* Stats Summary */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-black/60 border-purple-500/30 p-4">
              <div className="text-2xl font-bold text-yellow-400">{stats.lifetime_rewards_earned}</div>
              <div className="text-xs text-green-500/60">Lifetime Rewards</div>
            </Card>

            <Card className="bg-black/60 border-yellow-500/30 p-4">
              <div className="text-2xl font-bold text-yellow-400">{stats.current_vote_streak}</div>
              <div className="text-xs text-green-500/60">Current Streak</div>
            </Card>

            <Card className="bg-black/60 border-blue-500/30 p-4">
              <div className="text-2xl font-bold text-blue-400">{stats.best_vote_streak}</div>
              <div className="text-xs text-green-500/60">Best Streak</div>
            </Card>

            <Card className="bg-black/60 border-green-500/30 p-4">
              <div className="text-2xl font-bold text-green-400">{stats.referral_count}</div>
              <div className="text-xs text-green-500/60">Referrals</div>
            </Card>
          </div>
        )}

        {/* Transaction History */}
        <Card className="bg-black/60 border-purple-500/30 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Transaction History</h2>

          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <Coins className="w-12 h-12 mx-auto mb-4 text-green-500/30" />
              <p className="text-green-500/60">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 bg-black/40 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getIcon(tx.transaction_type)}
                    <div>
                      <div className="text-sm font-bold text-white">
                        {tx.transaction_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div className="text-xs text-green-500/60">
                        {new Date(tx.created_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount} 🪙
                    </div>
                    <div className="text-xs text-green-500/60">
                      Balance: {tx.balance_after}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}