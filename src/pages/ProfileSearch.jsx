import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Trophy, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProfileSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [radius, setRadius] = useState(25);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (profiles[0]?.zip_code) {
        setZipCode(profiles[0].zip_code);
      }
    } catch (error) {
      console.error('[Search] Load user error:', error);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const searchByUsername = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const profiles = await base44.entities.UserProfile.list();
      const filtered = profiles.filter(p => 
        p.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.user_email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setResults(filtered);
    } catch (error) {
      console.error('[Search] Username search error:', error);
    }
    setLoading(false);
  };

  const searchByLocation = async () => {
    if (!zipCode.trim()) return;
    
    setLoading(true);
    try {
      // Geocode the zip code
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${zipCode}&key=YOUR_API_KEY`;
      // Note: In production, use a backend function to protect API key
      
      // For now, search users with zip codes
      const profiles = await base44.entities.UserProfile.list();
      const withLocation = profiles.filter(p => p.zip_code && p.latitude && p.longitude);
      
      // Get current user's location
      const currentProfile = profiles.find(p => p.user_email === currentUser?.email);
      if (!currentProfile?.latitude || !currentProfile?.longitude) {
        setResults(withLocation.slice(0, 20));
        setLoading(false);
        return;
      }

      // Calculate distances and filter
      const nearby = withLocation
        .map(p => ({
          ...p,
          distance: calculateDistance(
            currentProfile.latitude,
            currentProfile.longitude,
            p.latitude,
            p.longitude
          )
        }))
        .filter(p => p.distance <= radius)
        .sort((a, b) => a.distance - b.distance);

      setResults(nearby);
    } catch (error) {
      console.error('[Search] Location search error:', error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-2">Find Players</h1>
          <p className="text-green-500/80">Search by username or find nearby players</p>
        </div>

        {/* Username Search */}
        <Card className="bg-black/60 border-purple-500/30 p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-purple-400" />
            Search by Username
          </h2>
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchByUsername()}
              placeholder="Enter username or email..."
              className="bg-black/60 border-purple-500/30 text-white"
            />
            <Button
              onClick={searchByUsername}
              disabled={!searchQuery.trim() || loading}
              className="bg-purple-600 hover:bg-purple-700 cursor-pointer"
            >
              Search
            </Button>
          </div>
        </Card>

        {/* Location Search */}
        <Card className="bg-black/60 border-purple-500/30 p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-400" />
            Find Nearby Players
          </h2>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="Enter zip code..."
                className="bg-black/60 border-purple-500/30 text-white"
              />
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="bg-black/60 border border-purple-500/30 text-green-400 rounded px-3 cursor-pointer"
              >
                <option value={10}>10 miles</option>
                <option value={25}>25 miles</option>
                <option value={50}>50 miles</option>
                <option value={100}>100 miles</option>
              </select>
            </div>
            <Button
              onClick={searchByLocation}
              disabled={!zipCode.trim() || loading}
              className="w-full bg-green-600 hover:bg-green-700 cursor-pointer"
            >
              Find Nearby
            </Button>
          </div>
        </Card>

        {/* Results */}
        {loading && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              {results.length} Player{results.length !== 1 ? 's' : ''} Found
            </h3>
            {results.map(profile => (
              <Card
                key={profile.id}
                className="bg-black/60 border-purple-500/30 p-4 cursor-pointer hover:border-purple-500/60 transition-all"
                onClick={() => navigate(`/Profile?user=${profile.user_email}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white">
                        {profile.username || profile.user_email?.split('@')[0]}
                      </span>
                      <Badge className="bg-purple-600">Lv. {profile.level || 1}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-green-500/60">
                      {profile.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {profile.location}
                        </span>
                      )}
                      {profile.distance !== undefined && (
                        <span>{profile.distance.toFixed(1)} mi away</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Trophy className="w-4 h-4" />
                      <span className="font-bold">{profile.points || 0}</span>
                    </div>
                    <div className="text-xs text-green-500/60">points</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!loading && results.length === 0 && (searchQuery || zipCode) && (
          <Card className="bg-black/60 border-purple-500/30 p-12 text-center">
            <Search className="w-16 h-16 mx-auto mb-4 text-purple-400/30" />
            <p className="text-green-500/60">No players found</p>
          </Card>
        )}
      </div>
    </div>
  );
}