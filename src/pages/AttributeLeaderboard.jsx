import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Trophy, Medal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ATTRIBUTES = [
  { id: 'best_hair', label: 'Best Hair', emoji: '💇' },
  { id: 'best_smile', label: 'Best Smile', emoji: '😊' },
  { id: 'worst_frown', label: 'Worst Frown', emoji: '😞' }
];

export default function AttributeLeaderboard() {
  const [selectedAttribute, setSelectedAttribute] = useState('best_hair');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [selectedAttribute]);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      const votes = await base44.entities.AttributeVote.filter({ attribute_type: selectedAttribute });
      
      // Group by image and calculate average rating
      const imageStats = {};
      votes.forEach(vote => {
        if (!imageStats[vote.image_id]) {
          imageStats[vote.image_id] = { ratings: [], voters: 0 };
        }
        imageStats[vote.image_id].ratings.push(vote.rating);
        imageStats[vote.image_id].voters += 1;
      });

      // Calculate averages and sort
      const sorted = Object.entries(imageStats)
        .map(([imageId, data]) => {
          const avgRating = (data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length).toFixed(1);
          return { imageId, avgRating: parseFloat(avgRating), voters: data.voters };
        })
        .sort((a, b) => b.avgRating - a.avgRating)
        .slice(0, 50);

      setLeaderboardData(sorted);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setLeaderboardData([]);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-12">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-black mb-2">Attribute Rankings</h1>
          <p className="text-zinc-400">See which images rank highest for each feature</p>
        </motion.div>

        <Tabs value={selectedAttribute} onValueChange={setSelectedAttribute} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-900 border border-zinc-800">
            {ATTRIBUTES.map(attr => (
              <TabsTrigger key={attr.id} value={attr.id} className="data-[state=active]:bg-purple-600">
                <span className="mr-2">{attr.emoji}</span>
                {attr.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {ATTRIBUTES.map(attr => (
            <TabsContent key={attr.id} value={attr.id} className="mt-6">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{attr.emoji}</span>
                    {attr.label} Top Rankings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 bg-zinc-800 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : leaderboardData.length === 0 ? (
                    <p className="text-zinc-400 text-center py-8">No votes yet for this attribute</p>
                  ) : (
                    <div className="space-y-3">
                      {leaderboardData.map((item, idx) => (
                        <motion.div
                          key={item.imageId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center gap-4 p-4 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-600 font-bold text-sm">
                            {idx === 0 && <Trophy className="w-5 h-5" />}
                            {idx === 1 && <Medal className="w-5 h-5 text-gray-400" />}
                            {idx === 2 && <Medal className="w-5 h-5 text-yellow-600" />}
                            {idx > 2 && <span>#{idx + 1}</span>}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-zinc-300">Image ID: {item.imageId.slice(0, 8)}...</p>
                            <p className="text-xs text-zinc-500">{item.voters} votes</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-amber-400">{item.avgRating}</p>
                            <p className="text-xs text-zinc-500">/10</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}