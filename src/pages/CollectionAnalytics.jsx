import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Package, Star, BarChart3, Award } from 'lucide-react';
import { toast } from 'sonner';

export default function CollectionAnalytics() {
  const [collectibles, setCollectibles] = useState([]);
  const [analytics, setAnalytics] = useState(null);
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

      const myCollectibles = await base44.entities.ImageCollectible.filter({
        owner_email: currentUser.email
      });

      const enriched = await Promise.all(myCollectibles.map(async (c) => {
        try {
          const image = await base44.entities.Image.get(c.image_id);
          return { ...c, image };
        } catch (err) {
          return { ...c, image: null };
        }
      }));

      setCollectibles(enriched);

      // Calculate analytics
      const totalCollectibles = enriched.length;
      const avgDifficulty = enriched.reduce((sum, c) => sum + (c.average_difficulty || 0), 0) / totalCollectibles || 0;
      const totalVotes = enriched.reduce((sum, c) => sum + (c.vote_count || 0), 0);
      const avgValueScore = enriched.reduce((sum, c) => sum + (c.value_score || 0), 0) / totalCollectibles || 0;
      const totalTrades = enriched.reduce((sum, c) => sum + (c.total_trades || 0), 0);

      const rarityDist = enriched.reduce((acc, c) => {
        acc[c.rarity_tier] = (acc[c.rarity_tier] || 0) + 1;
        return acc;
      }, {});

      const sortedByValue = [...enriched].sort((a, b) => (b.value_score || 0) - (a.value_score || 0));
      const topItems = sortedByValue.slice(0, 5);

      const uploadSequenceStats = enriched.filter(c => c.creator_upload_sequence).reduce((acc, c) => {
        const seq = c.creator_upload_sequence;
        if (seq <= 10) acc.early++;
        else if (seq <= 100) acc.mid++;
        else acc.late++;
        return acc;
      }, { early: 0, mid: 0, late: 0 });

      setAnalytics({
        totalCollectibles,
        avgDifficulty,
        totalVotes,
        avgValueScore,
        totalTrades,
        rarityDist,
        topItems,
        uploadSequenceStats
      });

    } catch (error) {
      console.error('Load analytics error:', error);
      toast.error('Failed to load analytics');
    }
    setLoading(false);
  };

  const rarityColors = {
    common: 'bg-gray-600',
    uncommon: 'bg-green-600',
    rare: 'bg-blue-600',
    epic: 'bg-purple-600',
    legendary: 'bg-yellow-600'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-black text-green-400 p-4 pb-32">
        <div className="max-w-4xl mx-auto text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-green-500/30" />
          <p className="text-green-500/60">No collection data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 p-4 pb-32 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-black mb-2 flex items-center gap-2">
            <BarChart3 className="w-8 h-8" />
            Collection Analytics
          </h1>
          <p className="text-green-500/60">Insights into your collectibles</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-black/60 border-purple-500/30 p-4">
            <Package className="w-6 h-6 mb-2 text-purple-400" />
            <div className="text-2xl font-bold text-white">{analytics.totalCollectibles}</div>
            <div className="text-xs text-green-500/60">Total Items</div>
          </Card>
          <Card className="bg-black/60 border-blue-500/30 p-4">
            <Star className="w-6 h-6 mb-2 text-blue-400" />
            <div className="text-2xl font-bold text-white">{analytics.avgDifficulty.toFixed(1)}</div>
            <div className="text-xs text-green-500/60">Avg Difficulty</div>
          </Card>
          <Card className="bg-black/60 border-yellow-500/30 p-4">
            <TrendingUp className="w-6 h-6 mb-2 text-yellow-400" />
            <div className="text-2xl font-bold text-white">{analytics.avgValueScore.toFixed(1)}</div>
            <div className="text-xs text-green-500/60">Avg Value</div>
          </Card>
          <Card className="bg-black/60 border-green-500/30 p-4">
            <Award className="w-6 h-6 mb-2 text-green-400" />
            <div className="text-2xl font-bold text-white">{analytics.totalVotes}</div>
            <div className="text-xs text-green-500/60">Total Votes</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="bg-black/60 border-purple-500/30 p-6">
            <h2 className="text-lg font-bold mb-4">Rarity Distribution</h2>
            <div className="space-y-3">
              {Object.entries(analytics.rarityDist).map(([rarity, count]) => (
                <div key={rarity} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={rarityColors[rarity]}>{rarity}</Badge>
                  </div>
                  <div className="text-lg font-bold text-white">{count}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-black/60 border-purple-500/30 p-6">
            <h2 className="text-lg font-bold mb-4">Upload Provenance</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Early Uploads (#1-10)</span>
                <Badge className="bg-yellow-600">{analytics.uploadSequenceStats.early}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Mid Uploads (#11-100)</span>
                <Badge className="bg-blue-600">{analytics.uploadSequenceStats.mid}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Late Uploads (#100+)</span>
                <Badge className="bg-gray-600">{analytics.uploadSequenceStats.late}</Badge>
              </div>
            </div>
          </Card>
        </div>

        <Card className="bg-black/60 border-purple-500/30 p-6">
          <h2 className="text-lg font-bold mb-4">Top 5 Most Valuable Items</h2>
          <div className="space-y-3">
            {analytics.topItems.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-4 p-3 bg-black/40 rounded-lg">
                <div className="text-2xl font-bold text-yellow-400">#{idx + 1}</div>
                <img
                  src={item.image?.url}
                  alt="Collectible"
                  className="w-16 h-16 rounded object-cover"
                  onError={(e) => e.target.src = 'https://via.placeholder.com/64'}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={rarityColors[item.rarity_tier]}>{item.rarity_tier}</Badge>
                    {item.creator_upload_sequence && (
                      <Badge variant="outline" className="text-xs">Upload #{item.creator_upload_sequence}</Badge>
                    )}
                  </div>
                  <div className="text-sm text-green-500/80">
                    Difficulty: {item.average_difficulty?.toFixed(1)} | Votes: {item.vote_count}
                  </div>
                </div>
                <div className="text-xl font-bold text-purple-400">
                  {item.value_score?.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}