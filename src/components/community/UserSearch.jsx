import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Trophy } from 'lucide-react';

export default function UserSearch() {
  const [zipCode, setZipCode] = useState('');
  const [radius, setRadius] = useState(25);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!zipCode.trim()) return;
    
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const response = await base44.functions.invoke('searchUsersByLocation', {
        zip_code: zipCode,
        radius_miles: radius,
        limit: 20
      });
      setResults(response.users || []);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900 border border-purple-500/30 rounded-lg p-6"
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-purple-400" />
          Find Players Near You
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Zip Code</label>
            <input
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter your zip code..."
              maxLength="5"
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Search Radius: {radius} miles
            </label>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full"
            />
          </div>
          
          <Button
            onClick={handleSearch}
            disabled={!zipCode.trim() || isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            <Search className="w-4 h-4 mr-2" />
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </motion.div>

      {/* Results */}
      <AnimatePresence>
        {hasSearched && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <h3 className="text-lg font-bold text-white">
              Found {results.length} player{results.length !== 1 ? 's' : ''}
            </h3>
            
            {results.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 text-center text-zinc-400">
                No players found in that area. Try expanding your radius!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {results.map((profile) => (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-purple-900/30 to-zinc-900/50 border border-purple-500/30 rounded-lg p-4 hover:border-purple-500/60 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-white">
                          {profile.user_email.split('@')[0]}
                        </h4>
                        <p className="text-xs text-zinc-400">{profile.zip_code}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Trophy className="w-4 h-4 text-amber-400" />
                          <span className="font-bold text-white text-sm">
                            Lvl {profile.level}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-zinc-800 rounded p-2 text-center">
                        <p className="font-bold text-white">{profile.points || 0}</p>
                        <p className="text-zinc-500">Points</p>
                      </div>
                      <div className="bg-zinc-800 rounded p-2 text-center">
                        <p className="font-bold text-white">{profile.perfect_streak || 0}</p>
                        <p className="text-zinc-500">Streak</p>
                      </div>
                      <div className="bg-zinc-800 rounded p-2 text-center">
                        <p className="font-bold text-white">{profile.badges?.length || 0}</p>
                        <p className="text-zinc-500">Badges</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}