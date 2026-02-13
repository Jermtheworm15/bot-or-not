import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Trophy, Medal, Users, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ATTRIBUTES = [
  { id: 'best_hair', label: 'Best Hair', emoji: '💇' },
  { id: 'best_smile', label: 'Best Smile', emoji: '😊' },
  { id: 'worst_frown', label: 'Worst Frown', emoji: '😞' }
];

export default function AttributeLeaderboard() {
  const [selectedAttribute, setSelectedAttribute] = useState('best_hair');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('global');
  const [regionRadius, setRegionRadius] = useState('50');
  const [friends, setFriends] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadLeaderboard();
  }, [selectedAttribute, viewMode, regionRadius]);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      if (!user) return;

      const [sentRequests, receivedRequests] = await Promise.all([
        base44.entities.Friend.filter({ user_email: user.email, status: 'accepted' }),
        base44.entities.Friend.filter({ friend_email: user.email, status: 'accepted' })
      ]);

      const friendEmails = new Set([
        ...sentRequests.map(f => f.friend_email),
        ...receivedRequests.map(f => f.user_email)
      ]);

      setFriends(Array.from(friendEmails));
    } catch (err) {
      console.error('Error loading friends:', err);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      let votes = await base44.entities.AttributeVote.filter({ attribute_type: selectedAttribute });
      const profiles = await base44.entities.UserProfile.list();
      const profileMap = {};
      profiles.forEach(p => { if (p.user_email) profileMap[p.user_email] = p; });

      // Filter votes by view mode
      if (viewMode === 'friends') {
        votes = votes.filter(v => friends.includes(v.user_email));
      } else if (viewMode === 'nearby' && currentUser) {
        const userProfile = profileMap[currentUser.email];
        if (userProfile?.latitude && userProfile?.longitude) {
          const radiusMiles = parseInt(regionRadius);
          votes = votes.filter(v => {
            const voterProfile = profileMap[v.user_email];
            if (!voterProfile?.latitude || !voterProfile?.longitude) return false;
            const distance = calculateDistance(
              userProfile.latitude,
              userProfile.longitude,
              voterProfile.latitude,
              voterProfile.longitude
            );
            return distance <= radiusMiles;
          });
        }
      }
      
      // Group by image and calculate average rating
      const imageStats = {};
      votes.forEach(vote => {
        if (!imageStats[vote.image_id]) {
          imageStats[vote.image_id] = { ratings: [], voters: 0 };
        }
        imageStats[vote.image_id].ratings.push(vote.rating);
        imageStats[vote.image_id].voters += 1;
      });

      // Load images to get thumbnails
      const imageIds = Object.keys(imageStats);
      const images = await base44.entities.Image.list();
      const imageMap = {};
      images.forEach(img => { if (img.id) imageMap[img.id] = img; });

      // Calculate averages and sort
      const sorted = Object.entries(imageStats)
        .map(([imageId, data]) => {
          const avgRating = (data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length).toFixed(1);
          return { 
            imageId, 
            avgRating: parseFloat(avgRating), 
            voters: data.voters,
            imageUrl: imageMap[imageId]?.url
          };
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

        {/* View Mode Filters */}
        <div className="mb-6 space-y-4">
          <Tabs value={viewMode} onValueChange={setViewMode}>
            <TabsList className="bg-zinc-900 border border-purple-500/30 w-full grid grid-cols-3">
              <TabsTrigger value="global" className="data-[state=active]:bg-purple-600">
                <Trophy className="w-4 h-4 mr-2" />
                Global
              </TabsTrigger>
              <TabsTrigger value="friends" className="data-[state=active]:bg-purple-600">
                <Users className="w-4 h-4 mr-2" />
                Friends
              </TabsTrigger>
              <TabsTrigger value="nearby" className="data-[state=active]:bg-purple-600">
                <MapPin className="w-4 h-4 mr-2" />
                Nearby
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {viewMode === 'nearby' && (
            <Select value={regionRadius} onValueChange={setRegionRadius}>
              <SelectTrigger className="bg-zinc-900 border-purple-500/30">
                <SelectValue placeholder="Select radius" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">Within 10 miles</SelectItem>
                <SelectItem value="25">Within 25 miles</SelectItem>
                <SelectItem value="50">Within 50 miles</SelectItem>
                <SelectItem value="100">Within 100 miles</SelectItem>
                <SelectItem value="250">Within 250 miles</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

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
                    <div className="text-center py-8">
                      <p className="text-zinc-400 mb-2">
                        {viewMode === 'friends' ? 'No friend votes for this attribute yet.' :
                         viewMode === 'nearby' ? 'No nearby votes for this attribute.' :
                         'No votes yet for this attribute'}
                      </p>
                    </div>
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
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt="Ranked image"
                              className="flex-shrink-0 w-12 h-12 rounded-lg object-cover border-2 border-purple-500/50"
                            />
                          ) : (
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-600 font-bold text-sm">
                              {idx === 0 && <Trophy className="w-5 h-5" />}
                              {idx === 1 && <Medal className="w-5 h-5 text-gray-400" />}
                              {idx === 2 && <Medal className="w-5 h-5 text-yellow-600" />}
                              {idx > 2 && <span>#{idx + 1}</span>}
                            </div>
                          )}
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-600/50 flex items-center justify-center font-bold text-xs">
                            #{idx + 1}
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