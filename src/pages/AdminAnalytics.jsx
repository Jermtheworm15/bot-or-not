import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Image, Trophy, ShoppingCart, TrendingUp, Activity, Bot, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (currentUser.role !== 'admin') {
        toast.error('Admin access required');
        setLoading(false);
        return;
      }

      // Load all analytics data
      const [users, images, tournaments, listings, events, aiProfiles, votes, collectibles, trades] = await Promise.all([
        base44.entities.User.list('', 1000),
        base44.entities.Image.list('', 1000),
        base44.entities.Tournament.list('', 1000),
        base44.entities.MarketplaceListing.list('', 1000),
        base44.entities.AnalyticsEvent.list('-created_date', 1000),
        base44.entities.AIProfile.list('', 100),
        base44.entities.Vote.list('', 5000),
        base44.entities.ImageCollectible.list('', 1000),
        base44.entities.TradeOffer.list('', 1000)
      ]);

      const humanUsers = users.filter(u => !u.is_ai);
      const aiUsers = users.filter(u => u.is_ai);
      const humanImages = images.filter(i => !i.user_uploaded || !aiUsers.some(ai => ai.email === i.created_by));
      const aiImages = images.filter(i => aiUsers.some(ai => ai.email === i.created_by));

      const activeListings = listings.filter(l => l.status === 'active');
      const completedListings = listings.filter(l => l.status === 'sold');

      const openTournaments = tournaments.filter(t => t.status === 'open');
      const completedTournaments = tournaments.filter(t => t.status === 'completed');

      const humanVotes = votes.filter(v => humanUsers.some(u => u.email === v.user_email));
      const aiVotes = votes.filter(v => aiUsers.some(u => u.email === v.user_email));

      const completedTrades = trades.filter(t => t.status === 'accepted');

      setAnalytics({
        users: {
          total: users.length,
          human: humanUsers.length,
          ai: aiUsers.length,
          aiActive: aiProfiles.filter(p => p.enabled).length
        },
        images: {
          total: images.length,
          human: humanImages.length,
          ai: aiImages.length,
          totalVotes: votes.length
        },
        tournaments: {
          total: tournaments.length,
          open: openTournaments.length,
          completed: completedTournaments.length
        },
        marketplace: {
          activeListings: activeListings.length,
          completedSales: completedListings.length,
          totalTrades: trades.length,
          completedTrades: completedTrades.length
        },
        engagement: {
          totalVotes: votes.length,
          humanVotes: humanVotes.length,
          aiVotes: aiVotes.length,
          totalEvents: events.length
        },
        collections: {
          total: collectibles.length,
          avgPerUser: (collectibles.length / users.length).toFixed(1)
        }
      });

    } catch (error) {
      console.error('[Analytics] Load error:', error);
      toast.error('Failed to load analytics');
    }
    setLoading(false);
  };

  const handleInitializeAI = async () => {
    try {
      console.log('[Analytics] Initializing AI users...');
      const { data } = await base44.functions.invoke('initializeAIUsers', {});
      toast.success(data.message || 'AI users initialized');
      loadAnalytics();
    } catch (error) {
      console.error('[Analytics] AI init error:', error);
      toast.error('Failed to initialize AI users');
    }
  };

  const handleRunAIActions = async () => {
    try {
      console.log('[Analytics] Running AI actions...');
      const { data } = await base44.functions.invoke('runAIActions', {});
      toast.success(`AI performed ${data.count} actions`);
      loadAnalytics();
    } catch (error) {
      console.error('[Analytics] AI actions error:', error);
      toast.error('Failed to run AI actions');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-black text-green-400 p-4 pb-32">
        <div className="max-w-4xl mx-auto text-center py-12">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-green-500/30" />
          <h2 className="text-2xl font-bold text-white mb-2">Admin Access Required</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 p-4 pb-32 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-black mb-2 flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-purple-400" />
            Admin Analytics
          </h1>
          <p className="text-green-500/60">Platform metrics and AI management</p>
        </div>

        {/* AI Management */}
        <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-blue-500/30 p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-400" />
            AI User Management
          </h3>
          <div className="flex gap-3">
            <Button onClick={handleInitializeAI} className="bg-blue-600 hover:bg-blue-700">
              Initialize AI Users
            </Button>
            <Button onClick={handleRunAIActions} className="bg-purple-600 hover:bg-purple-700">
              Run AI Actions
            </Button>
          </div>
        </Card>

        <Tabs defaultValue="overview" className="mb-6">
          <TabsList className="bg-black/60 border border-purple-500/30">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-black/60 border-purple-500/30 p-4">
                <Users className="w-6 h-6 mb-2 text-purple-400" />
                <div className="text-2xl font-bold text-white">{analytics.users.total}</div>
                <div className="text-xs text-green-500/60">Total Users</div>
                <div className="text-xs text-green-500/40 mt-1">
                  {analytics.users.human} human / {analytics.users.ai} AI
                </div>
              </Card>

              <Card className="bg-black/60 border-blue-500/30 p-4">
                <Image className="w-6 h-6 mb-2 text-blue-400" />
                <div className="text-2xl font-bold text-white">{analytics.images.total}</div>
                <div className="text-xs text-green-500/60">Total Images</div>
                <div className="text-xs text-green-500/40 mt-1">
                  {analytics.images.totalVotes} votes
                </div>
              </Card>

              <Card className="bg-black/60 border-yellow-500/30 p-4">
                <Trophy className="w-6 h-6 mb-2 text-yellow-400" />
                <div className="text-2xl font-bold text-white">{analytics.tournaments.total}</div>
                <div className="text-xs text-green-500/60">Tournaments</div>
                <div className="text-xs text-green-500/40 mt-1">
                  {analytics.tournaments.open} open
                </div>
              </Card>

              <Card className="bg-black/60 border-green-500/30 p-4">
                <ShoppingCart className="w-6 h-6 mb-2 text-green-400" />
                <div className="text-2xl font-bold text-white">{analytics.marketplace.activeListings}</div>
                <div className="text-xs text-green-500/60">Active Listings</div>
                <div className="text-xs text-green-500/40 mt-1">
                  {analytics.marketplace.completedSales} sold
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-black/60 border-purple-500/30 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Human Users</h3>
                <div className="text-4xl font-bold text-purple-400 mb-2">{analytics.users.human}</div>
                <div className="text-sm text-green-500/60">Active human players</div>
              </Card>

              <Card className="bg-black/60 border-blue-500/30 p-6">
                <h3 className="text-lg font-bold text-white mb-4">AI Users</h3>
                <div className="text-4xl font-bold text-blue-400 mb-2">{analytics.users.ai}</div>
                <div className="text-sm text-green-500/60">{analytics.users.aiActive} active AI profiles</div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card className="bg-black/60 border-purple-500/30 p-4">
                <Activity className="w-6 h-6 mb-2 text-purple-400" />
                <div className="text-2xl font-bold text-white">{analytics.engagement.totalVotes}</div>
                <div className="text-xs text-green-500/60">Total Votes</div>
              </Card>

              <Card className="bg-black/60 border-green-500/30 p-4">
                <Users className="w-6 h-6 mb-2 text-green-400" />
                <div className="text-2xl font-bold text-white">{analytics.engagement.humanVotes}</div>
                <div className="text-xs text-green-500/60">Human Votes</div>
              </Card>

              <Card className="bg-black/60 border-blue-500/30 p-4">
                <Bot className="w-6 h-6 mb-2 text-blue-400" />
                <div className="text-2xl font-bold text-white">{analytics.engagement.aiVotes}</div>
                <div className="text-xs text-green-500/60">AI Votes</div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="marketplace" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-black/60 border-purple-500/30 p-4">
                <div className="text-2xl font-bold text-white">{analytics.marketplace.activeListings}</div>
                <div className="text-xs text-green-500/60">Active Listings</div>
              </Card>

              <Card className="bg-black/60 border-green-500/30 p-4">
                <div className="text-2xl font-bold text-white">{analytics.marketplace.completedSales}</div>
                <div className="text-xs text-green-500/60">Completed Sales</div>
              </Card>

              <Card className="bg-black/60 border-yellow-500/30 p-4">
                <div className="text-2xl font-bold text-white">{analytics.marketplace.totalTrades}</div>
                <div className="text-xs text-green-500/60">Total Trades</div>
              </Card>

              <Card className="bg-black/60 border-blue-500/30 p-4">
                <div className="text-2xl font-bold text-white">{analytics.marketplace.completedTrades}</div>
                <div className="text-xs text-green-500/60">Completed Trades</div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}