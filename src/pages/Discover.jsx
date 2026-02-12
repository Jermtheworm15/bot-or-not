import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Search, TrendingUp, Calendar, Flame, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Discover() {
  const [contentType, setContentType] = useState('all');
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('trending');
  const [sourceFilter, setSourceFilter] = useState('all'); // all, ai, real
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
  const [isLoading, setIsLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(24);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  const refreshContent = async () => {
    setIsRefreshing(true);
    try {
      // Generate fresh content (3 bots + 3 humans)
      await base44.functions.invoke('generateFreshContent', { count: 6 });
      // Reload all content
      await loadContent();
      setDisplayCount(24);
    } catch (error) {
      console.error('Error generating fresh content:', error);
    }
    setIsRefreshing(false);
  };

  const loadContent = async () => {
    setIsLoading(true);
    try {
      const [imageData, videoData, imageVotes, videoVotes] = await Promise.all([
        base44.entities.Image.list(),
        base44.entities.Video.list(),
        base44.entities.Vote.list(),
        base44.entities.VideoVote.list()
      ]);

      // Calculate engagement scores for images
      const imageEngagement = imageVotes.reduce((acc, vote) => {
        if (!acc[vote.image_id]) {
          acc[vote.image_id] = { votes: 0, avgRating: 0, totalRating: 0 };
        }
        acc[vote.image_id].votes++;
        acc[vote.image_id].totalRating += vote.rating || 0;
        acc[vote.image_id].avgRating = acc[vote.image_id].totalRating / acc[vote.image_id].votes;
        return acc;
      }, {});

      // Calculate engagement scores for videos
      const videoEngagement = videoVotes.reduce((acc, vote) => {
        if (!acc[vote.video_id]) {
          acc[vote.video_id] = { votes: 0, avgRating: 0, totalRating: 0 };
        }
        acc[vote.video_id].votes++;
        acc[vote.video_id].totalRating += vote.rating || 0;
        acc[vote.video_id].avgRating = acc[vote.video_id].totalRating / acc[vote.video_id].votes;
        return acc;
      }, {});

      // Enrich images with engagement data
      const enrichedImages = imageData.map(img => ({
        ...img,
        votes: imageEngagement[img.id]?.votes || 0,
        avgRating: imageEngagement[img.id]?.avgRating || 0,
        engagementScore: (imageEngagement[img.id]?.votes || 0) * (imageEngagement[img.id]?.avgRating || 0)
      }));

      // Enrich videos with engagement data
      const enrichedVideos = videoData.map(vid => ({
        ...vid,
        votes: videoEngagement[vid.id]?.votes || 0,
        avgRating: videoEngagement[vid.id]?.avgRating || 0,
        engagementScore: (videoEngagement[vid.id]?.votes || 0) * (videoEngagement[vid.id]?.avgRating || 0)
      }));

      setImages(enrichedImages);
      setVideos(enrichedVideos);
    } catch (err) {
      console.error('Error loading content:', err);
    }
    setIsLoading(false);
  };

  const filterAndSortContent = (content) => {
    let filtered = [...content];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.source?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.uploader_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by source (AI vs Real)
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(item => 
        sourceFilter === 'ai' ? item.is_bot : !item.is_bot
      );
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.created_date);
        switch (dateFilter) {
          case 'today':
            return itemDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return itemDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return itemDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Sort
    switch (sortBy) {
      case 'trending':
        filtered.sort((a, b) => b.engagementScore - a.engagementScore);
        break;
      case 'popular':
        filtered.sort((a, b) => b.votes - a.votes);
        break;
      case 'rating':
        filtered.sort((a, b) => b.avgRating - a.avgRating);
        break;
      case 'recent':
        filtered.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        break;
      default:
        break;
    }

    return filtered;
  };

  const displayImages = filterAndSortContent(images);
  const displayVideos = filterAndSortContent(videos);
  const allContent = [...displayImages, ...displayVideos].sort((a, b) => b.engagementScore - a.engagementScore);

  const ContentCard = ({ item, type }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className="relative bg-zinc-900 rounded-xl overflow-hidden border border-purple-500/20 hover:border-purple-500/50 transition-all cursor-pointer"
    >
      <div className="aspect-square relative">
        {type === 'image' ? (
          <img src={item.url} alt="" className="w-full h-full object-cover" />
        ) : (
          <video src={item.url} className="w-full h-full object-cover" muted loop playsInline />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        
        {/* Stats overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span>{item.votes} votes</span>
            </div>
            {item.avgRating > 0 && (
              <div className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-orange-400" />
                <span>{item.avgRating.toFixed(1)}</span>
              </div>
            )}
          </div>
          {item.uploader_name && (
            <div className="text-xs text-zinc-300 mt-1">by {item.uploader_name}</div>
          )}
        </div>

        {/* Bot/Human badge */}
        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold ${
          item.is_bot ? 'bg-purple-600' : 'bg-green-600'
        }`}>
          {item.is_bot ? '🤖 Bot' : '👤 Human'}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent">
            Discover
          </h1>
          <p className="text-zinc-400">Explore trending content and discover what's hot</p>
        </motion.div>

        {/* Discover More Button */}
        <div className="mb-6">
          <Button
            onClick={refreshContent}
            disabled={isRefreshing}
            className="w-full bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 text-white font-bold py-6 text-lg shadow-lg"
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Discover More'}
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <Input
              type="text"
              placeholder="Search by source or uploader..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-zinc-900 border-purple-500/30 text-white placeholder:text-zinc-500 focus:border-purple-500"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 bg-zinc-900 border-purple-500/30 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trending">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4" />
                    Trending
                  </div>
                </SelectItem>
                <SelectItem value="popular">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Most Popular
                  </div>
                </SelectItem>
                <SelectItem value="rating">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4" />
                    Top Rated
                  </div>
                </SelectItem>
                <SelectItem value="recent">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Most Recent
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-36 bg-zinc-900 border-purple-500/30 text-white">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="ai">🤖 AI Only</SelectItem>
                <SelectItem value="real">👤 Real Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-36 bg-zinc-900 border-purple-500/30 text-white">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs value={contentType} onValueChange={setContentType}>
          <TabsList className="bg-zinc-900 border border-purple-500/30 mb-6">
            <TabsTrigger value="all" className="data-[state=active]:bg-purple-600">
              All
            </TabsTrigger>
            <TabsTrigger value="images" className="data-[state=active]:bg-purple-600">
              Images
            </TabsTrigger>
            <TabsTrigger value="videos" className="data-[state=active]:bg-purple-600">
              Videos
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="text-center py-12 text-zinc-500">Loading content...</div>
          ) : (
            <>
              <TabsContent value="all">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {allContent.slice(0, displayCount).map((item) => (
                    <ContentCard 
                      key={item.id} 
                      item={item} 
                      type={item.url?.includes('video') || item.url?.includes('.mp4') ? 'video' : 'image'} 
                    />
                  ))}
                </div>
                {allContent.length === 0 && (
                  <div className="text-center py-12 text-zinc-500">No content found</div>
                )}
                {allContent.length > displayCount && (
                  <div className="flex justify-center mt-8">
                    <Button
                      onClick={() => setDisplayCount(prev => prev + 24)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg"
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="images">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {displayImages.slice(0, displayCount).map((item) => (
                    <ContentCard key={item.id} item={item} type="image" />
                  ))}
                </div>
                {displayImages.length === 0 && (
                  <div className="text-center py-12 text-zinc-500">No images found</div>
                )}
                {displayImages.length > displayCount && (
                  <div className="flex justify-center mt-8">
                    <Button
                      onClick={() => setDisplayCount(prev => prev + 24)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg"
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="videos">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {displayVideos.slice(0, displayCount).map((item) => (
                    <ContentCard key={item.id} item={item} type="video" />
                  ))}
                </div>
                {displayVideos.length === 0 && (
                  <div className="text-center py-12 text-zinc-500">No videos found</div>
                )}
                {displayVideos.length > displayCount && (
                  <div className="flex justify-center mt-8">
                    <Button
                      onClick={() => setDisplayCount(prev => prev + 24)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg"
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}