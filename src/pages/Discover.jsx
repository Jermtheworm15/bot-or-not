import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ImageSearchBar from '@/components/search/ImageSearchBar';
import ImageFilters from '@/components/search/ImageFilters';
import ImageSearchResults from '@/components/search/ImageSearchResults';
import { Search, TrendingUp } from 'lucide-react';

export default function Discover() {
  const [images, setImages] = useState([]);
  const [filteredImages, setFilteredImages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: null,
    source: null,
    dateRange: null,
    nsfw: 'all'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [trendingTags, setTrendingTags] = useState([]);

  useEffect(() => {
    loadImages();
  }, []);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [searchQuery, filters, images]);

  const loadImages = async () => {
    setIsLoading(true);
    try {
      const allImages = await base44.entities.Image.list('-created_date');
      setImages(allImages);
      
      // Calculate trending tags
      const tagCounts = {};
      allImages.forEach(img => {
        if (img.ai_tags) {
          img.ai_tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });
      
      const trending = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([tag]) => tag);
      
      setTrendingTags(trending);
    } catch (err) {
      console.error('Error loading images:', err);
    }
    setIsLoading(false);
  };

  const applyFiltersAndSearch = () => {
    let results = [...images];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(img => {
        const tagMatch = img.ai_tags?.some(tag => tag.toLowerCase().includes(query));
        const categoryMatch = img.ai_category?.toLowerCase().includes(query);
        const uploaderMatch = img.uploader_name?.toLowerCase().includes(query);
        return tagMatch || categoryMatch || uploaderMatch;
      });
    }

    // Apply category filter
    if (filters.category) {
      results = results.filter(img => img.ai_category === filters.category);
    }

    // Apply source filter
    if (filters.source) {
      results = results.filter(img => img.source === filters.source);
    }

    // Apply date range filter
    if (filters.dateRange) {
      const now = new Date();
      const cutoffDate = new Date();
      
      if (filters.dateRange === 'today') {
        cutoffDate.setHours(0, 0, 0, 0);
      } else if (filters.dateRange === 'week') {
        cutoffDate.setDate(now.getDate() - 7);
      } else if (filters.dateRange === 'month') {
        cutoffDate.setMonth(now.getMonth() - 1);
      }
      
      results = results.filter(img => new Date(img.created_date) >= cutoffDate);
    }

    // Apply NSFW filter
    if (filters.nsfw === 'safe') {
      results = results.filter(img => !img.nsfw_flag);
    } else if (filters.nsfw === 'flagged') {
      results = results.filter(img => img.nsfw_flag);
    }

    setFilteredImages(results);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      category: null,
      source: null,
      dateRange: null,
      nsfw: 'all'
    });
    setSearchQuery('');
  };

  const handleTrendingTagClick = (tag) => {
    setSearchQuery(tag);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-8">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <Search className="w-10 h-10 text-purple-400" />
            <h1 className="text-4xl font-black">Discover Images</h1>
          </div>
          <p className="text-zinc-400">Search and explore AI-analyzed images</p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-zinc-900 border-purple-500/30 p-4">
            <ImageSearchBar onSearch={handleSearch} initialQuery={searchQuery} />
          </Card>
        </motion.div>

        {/* Trending Tags */}
        {trendingTags.length > 0 && !searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-zinc-900 border-purple-500/30 p-4">
              <h3 className="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Trending Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {trendingTags.map(tag => (
                  <Button
                    key={tag}
                    variant="outline"
                    size="sm"
                    onClick={() => handleTrendingTagClick(tag)}
                    className="bg-zinc-800 hover:bg-purple-600/20 border-purple-500/30 hover:border-purple-500/60"
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-zinc-900 border-purple-500/30 p-4">
            <ImageFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
          </Card>
        </motion.div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm">
          <p className="text-zinc-400">
            {isLoading ? 'Loading...' : `${filteredImages.length} ${filteredImages.length === 1 ? 'image' : 'images'} found`}
          </p>
        </div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {isLoading ? (
            <div className="text-center py-16">
              <p className="text-zinc-400">Loading images...</p>
            </div>
          ) : (
            <ImageSearchResults images={filteredImages} />
          )}
        </motion.div>
      </div>
    </div>
  );
}