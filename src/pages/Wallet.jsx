import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet as WalletIcon, TrendingUp, TrendingDown, History } from 'lucide-react';
import { toast } from 'sonner';

export default function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      let wallets = await base44.entities.TokenWallet.filter({ user_email: currentUser.email });
      
      if (wallets.length === 0) {
        const newWallet = await base44.entities.TokenWallet.create({
          user_email: currentUser.email,
          balance: 1000,
          lifetime_earned: 1000,
          lifetime_spent: 0
        });
        wallets = [newWallet];
      }

      setWallet(wallets[0]);

      const allTransactions = await base44.entities.TokenTransaction.filter({
        $or: [
          { from_email: currentUser.email },
          { to_email: currentUser.email }
        ]
      });

      setTransactions(allTransactions.sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      ));
    } catch (error) {
      console.error('Load wallet error:', error);
      toast.error('Failed to load wallet');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 p-4 pb-32">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-black mb-2 flex items-center gap-2">
            <WalletIcon className="w-8 h-8" />
            Token Wallet
          </h1>
          <p className="text-green-500/60">Manage your in-game currency</p>
        </div>

        {wallet && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-black/60 border-purple-500/30 p-6">
              <div className="text-sm text-green-500/60 mb-1">Current Balance</div>
              <div className="text-3xl font-bold text-purple-400">{wallet.balance.toLocaleString()} 🪙</div>
            </Card>
            <Card className="bg-black/60 border-green-500/30 p-6">
              <div className="text-sm text-green-500/60 mb-1">Lifetime Earned</div>
              <div className="text-2xl font-bold text-green-400 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                {wallet.lifetime_earned.toLocaleString()}
              </div>
            </Card>
            <Card className="bg-black/60 border-red-500/30 p-6">
              <div className="text-sm text-green-500/60 mb-1">Lifetime Spent</div>
              <div className="text-2xl font-bold text-red-400 flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                {wallet.lifetime_spent.toLocaleString()}
              </div>
            </Card>
          </div>
        )}

        <div className="mb-4 flex items-center gap-2">
          <History className="w-5 h-5" />
          <h2 className="text-xl font-bold">Transaction History</h2>
        </div>

        {transactions.length === 0 ? (
          <Card className="bg-black/60 border-purple-500/30 p-8 text-center">
            <History className="w-12 h-12 mx-auto mb-4 text-green-500/30" />
            <p className="text-green-500/60">No transactions yet</p>
            <p className="text-green-500/40 text-sm mt-2">
              Start trading and purchasing collectibles to see your history
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => {
              const isIncoming = tx.to_email === user?.email;
              return (
                <Card key={tx.id} className="bg-black/60 border-purple-500/30 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={isIncoming ? 'bg-green-600' : 'bg-red-600'}>
                          {tx.transaction_type}
                        </Badge>
                        <span className="text-xs text-green-500/60">
                          {new Date(tx.created_date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-green-500/80">{tx.description}</p>
                      {tx.from_email && (
                        <p className="text-xs text-green-500/40 mt-1">
                          {isIncoming ? `From: ${tx.from_email}` : `To: ${tx.to_email}`}
                        </p>
                      )}
                    </div>
                    <div className={`text-xl font-bold ${isIncoming ? 'text-green-400' : 'text-red-400'}`}>
                      {isIncoming ? '+' : '-'}{tx.amount.toLocaleString()}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}