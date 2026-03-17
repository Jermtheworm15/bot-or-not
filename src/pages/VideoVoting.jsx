import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Upload, ThumbsUp, ThumbsDown, SkipForward, Award, Zap, Bookmark, BookmarkCheck, Star } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  { id: 'all', label: 'All', emoji: '🎥' },
  { id: 'deepfake', label: 'Deepfakes', emoji: '🤖', match: (v) => v.is_bot && (v.category === 'entertainment' || v.category === 'news' || v.source?.includes('DeepLab') || v.source?.includes('FaceSwap')) },
  { id: 'ai_art', label: 'AI Art', emoji: '🎨', match: (v) => v.is_bot && (v.category === 'art' || v.source?.includes('Midjourney') || v.source?.includes('Pika') || v.source?.includes('Runway')) },
  { id: 'real', label: 'Real People', emoji: '👤', match: (v) => !v.is_bot && (v.category === 'vlog' || v.category === 'interview' || v.category === 'personal' || v.category === 'documentary') },
  { id: 'nature', label: 'Nature', emoji: '🌿', match: (v) => v.category === 'wildlife' || v.category === 'adventure' },
  { id: 'sports', label: 'Sports', emoji: '⚽', match: (v) => v.category === 'sports' },
  { id: 'news', label: 'News', emoji: '📰', match: (v) => v.category === 'news' },
  { id: 'entertainment', label: 'Entertainment', emoji: '🎬', match: (v) => v.category === 'entertainment' || v.category === 'music' || v.category === 'concert' },
];

export default function VideoVoting() {
  const navigate = useNavigate();
  const [allVideos, setAllVideos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ total: 0, correct: 0, streak: 0 });
  const [showUpload, setShowUpload] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [watchLater, setWatchLater] = useState(() => {
    try { return JSON.parse(localStorage.getItem('watchLater') || '[]'); } catch { return []; }
  });
  const [featuredVideos, setFeaturedVideos] = useState([]);

  const videoRef = useRef();

  useEffect(() => {
    loadUser();
    loadVideos();
  }, []);

  useEffect(() => {
    if (allVideos.length === 0) return;
    // Featured: top 3 by quality_score
    const sorted = [...allVideos].sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0));
    setFeaturedVideos(sorted.slice(0, 3));
    applyCategory(activeCategory, allVideos);
  }, [allVideos]);

  const applyCategory = (catId, videoPool) => {
    const pool = videoPool || allVideos;
    if (catId === 'all') {
      setVideos(shuffle(pool));
    } else {
      const cat = CATEGORIES.find(c => c.id === catId);
      if (cat?.match) {
        setVideos(shuffle(pool.filter(cat.match)));
      }
    }
  };

  const handleCategoryChange = (catId) => {
    setActiveCategory(catId);
    applyCategory(catId, allVideos);
    setHasVoted(false);
    setWasCorrect(null);
    setVideoEnded(false);
  };

  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

  const getCategoryCount = (cat) => {
    if (cat.id === 'all') return allVideos.length;
    if (!cat.match) return 0;
    return allVideos.filter(cat.match).length;
  };

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      const votes = await base44.entities.VideoVote.filter({ user_email: currentUser.email });
      const correct = votes.filter(v => v.was_correct).length;
      const sorted = [...votes].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      let streak = 0;
      for (const v of sorted) { if (v.was_correct) streak++; else break; }
      setStats({ total: votes.length, correct, streak });
    } catch (error) {
      console.error('Load user error:', error);
    }
  };

  const loadVideos = async () => {
    setLoading(true);
    try {
      const fetched = await base44.entities.Video.filter({ is_active: { $ne: false } }, '-quality_score', 200);
      setAllVideos(fetched);
      const shuffled = shuffle(fetched);
      setVideos(shuffled);
      if (shuffled.length > 0) {
        setCurrentVideo(shuffled[0]);
        trackView(shuffled[0]);
      }
    } catch (error) {
      console.error('Load videos error:', error);
      toast.error('Failed to load videos');
    }
    setLoading(false);
  };

  const trackView = async (video) => {
    try {
      await base44.entities.Video.update(video.id, { views: (video.views || 0) + 1 });
    } catch (e) {}
  };

  const handleVote = async (vote) => {
    if (!currentVideo || hasVoted) return;
    const correct = vote === currentVideo.is_bot;
    setWasCorrect(correct);
    setHasVoted(true);

    try {
      await base44.entities.VideoVote.create({
        user_email: user.email,
        video_id: currentVideo.id,
        vote,
        was_correct: correct
      });

      const newStreak = correct ? stats.streak + 1 : 0;
      setStats(prev => ({ total: prev.total + 1, correct: prev.correct + (correct ? 1 : 0), streak: newStreak }));

      if (correct) {
        base44.functions.invoke('processVoteReward', { vote_type: 'video', was_correct: true }).catch(() => {});
      }

      setTimeout(() => moveToNextVideo(), 2500);
    } catch (error) {
      console.error('Vote error:', error);
      toast.error('Failed to save vote');
    }
  };

  const moveToNextVideo = () => {
    setHasVoted(false);
    setWasCorrect(null);
    setVideoEnded(false);
    const idx = videos.findIndex(v => v.id === currentVideo?.id);
    const next = idx >= 0 && idx < videos.length - 1 ? videos[idx + 1] : videos[0];
    if (next) {
      setCurrentVideo(next);
      trackView(next);
    }
  };

  const handleVideoEnded = () => {
    if (!hasVoted) setVideoEnded(true);
  };

  const toggleWatchLater = (videoId) => {
    const updated = watchLater.includes(videoId)
      ? watchLater.filter(id => id !== videoId)
      : [...watchLater, videoId];
    setWatchLater(updated);
    localStorage.setItem('watchLater', JSON.stringify(updated));
    toast.success(watchLater.includes(videoId) ? 'Removed from Watch Later' : 'Added to Watch Later');
  };

  const showVotePrompt = videoEnded || false;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pb-32">
        <div className="animate-spin w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Video className="w-8 h-8 text-purple-400" />
            <h1 className="text-2xl font-bold">Video Voting</h1>
          </div>
          <Button onClick={() => setShowUpload(true)} variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-900/30">
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>

        {/* Stats Bar */}
        <Card className="bg-black/60 border-purple-500/30 p-3 mb-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-yellow-400">{stats.total}</div>
              <div className="text-xs text-green-500/60">Votes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">
                {stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0}%
              </div>
              <div className="text-xs text-green-500/60">Accuracy</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-400">{stats.streak}</div>
              <div className="text-xs text-green-500/60">Streak</div>
            </div>
          </div>
        </Card>

        {/* Category Filter Bar */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                activeCategory === cat.id
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-black/60 border-purple-500/30 text-green-400 hover:border-purple-500/60'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeCategory === cat.id ? 'bg-purple-500/50' : 'bg-zinc-800'}`}>
                {getCategoryCount(cat)}
              </span>
            </button>
          ))}
        </div>

        {/* Featured Section */}
        {featuredVideos.length > 0 && activeCategory === 'all' && !currentVideo?.id && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-bold text-yellow-400">Featured</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {featuredVideos.map(v => (
                <button
                  key={v.id}
                  onClick={() => { setCurrentVideo(v); setHasVoted(false); setWasCorrect(null); setVideoEnded(false); trackView(v); }}
                  className="relative rounded-lg overflow-hidden border border-yellow-500/30 hover:border-yellow-500 transition-all group"
                >
                  <img src={v.thumbnail_url} alt={v.title} className="w-full aspect-video object-cover" />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all" />
                  <div className="absolute top-1 right-1 bg-yellow-500 rounded text-xs px-1 font-bold text-black">
                    ★{v.quality_score}
                  </div>
                  <p className="absolute bottom-0 left-0 right-0 text-xs p-1 bg-black/70 truncate">{v.title}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Featured always shown as small strip */}
        {featuredVideos.length > 0 && activeCategory === 'all' && currentVideo && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-bold text-yellow-400">Featured</span>
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {featuredVideos.map(v => (
                <button
                  key={v.id}
                  onClick={() => { setCurrentVideo(v); setHasVoted(false); setWasCorrect(null); setVideoEnded(false); trackView(v); }}
                  className={`flex-shrink-0 relative rounded-lg overflow-hidden border transition-all group w-24 ${currentVideo?.id === v.id ? 'border-yellow-500' : 'border-yellow-500/30 hover:border-yellow-500'}`}
                >
                  <img src={v.thumbnail_url} alt={v.title} className="w-full aspect-video object-cover" />
                  <div className="absolute top-0.5 right-0.5 bg-yellow-500 rounded text-xs px-1 font-bold text-black text-[10px]">★{v.quality_score}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Video Player */}
        {currentVideo ? (
          <Card className="bg-black/80 border-purple-500/30 overflow-hidden mb-4">
            <div className="relative aspect-[9/16] bg-zinc-900">
              <video
                ref={videoRef}
                src={currentVideo.url}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
                onEnded={handleVideoEnded}
                poster={currentVideo.thumbnail_url}
              />

              {/* Video ended — prompt to vote */}
              <AnimatePresence>
                {videoEnded && !hasVoted && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-4 p-6"
                  >
                    <div className="text-3xl font-black text-white text-center">Bot or Not?</div>
                    <p className="text-green-400 text-center text-sm">Video finished — make your guess!</p>
                    <div className="grid grid-cols-2 gap-3 w-full">
                      <Button onClick={() => handleVote(false)} className="h-16 bg-gradient-to-br from-blue-600 to-blue-700 text-lg font-bold">
                        <ThumbsUp className="w-5 h-5 mr-2" /> Human
                      </Button>
                      <Button onClick={() => handleVote(true)} className="h-16 bg-gradient-to-br from-purple-600 to-purple-700 text-lg font-bold">
                        <ThumbsDown className="w-5 h-5 mr-2" /> Bot
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Post-vote result overlay */}
              <AnimatePresence>
                {hasVoted && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/70"
                  >
                    <div className="text-center">
                      <div className={`text-6xl mb-4 ${wasCorrect ? 'text-green-400' : 'text-red-400'}`}>
                        {wasCorrect ? '✓' : '✗'}
                      </div>
                      <div className={`text-2xl font-bold mb-2 ${wasCorrect ? 'text-green-400' : 'text-red-400'}`}>
                        {wasCorrect ? 'Correct!' : 'Wrong!'}
                      </div>
                      <div className="text-lg text-white mb-3">
                        This was {currentVideo.is_bot ? 'AI Generated' : 'Human Created'}
                      </div>
                      {wasCorrect && (
                        <Badge className="bg-yellow-600 text-white">
                          <Zap className="w-4 h-4 mr-1" />+10 Tokens
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-4 border-t border-purple-500/30">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {currentVideo.title && <h3 className="font-bold text-white mb-1 truncate">{currentVideo.title}</h3>}
                  {currentVideo.description && <p className="text-sm text-green-400 mb-2 line-clamp-2">{currentVideo.description}</p>}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-green-500/60">
                    {currentVideo.source && <span>📹 {currentVideo.source}</span>}
                    {currentVideo.duration && <span>⏱️ {Math.round(currentVideo.duration)}s</span>}
                    {currentVideo.views > 0 && <span>👁️ {currentVideo.views}</span>}
                  </div>
                </div>
                <button
                  onClick={() => toggleWatchLater(currentVideo.id)}
                  className={`flex-shrink-0 p-2 rounded-lg border transition-all ${watchLater.includes(currentVideo.id) ? 'border-yellow-500 text-yellow-400 bg-yellow-500/10' : 'border-purple-500/30 text-green-500/60 hover:text-yellow-400 hover:border-yellow-500/50'}`}
                  title="Watch Later"
                >
                  {watchLater.includes(currentVideo.id) ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="bg-black/60 border-purple-500/30 p-8 text-center mb-4">
            <p className="text-green-400">No videos in this category yet.</p>
          </Card>
        )}

        {/* Voting Buttons (shown while video plays) */}
        {!hasVoted && !videoEnded && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Button
              onClick={() => handleVote(false)}
              disabled={!currentVideo}
              className="h-20 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-xl font-bold"
            >
              <ThumbsUp className="w-6 h-6 mr-2" /> Human
            </Button>
            <Button
              onClick={() => handleVote(true)}
              disabled={!currentVideo}
              className="h-20 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-xl font-bold"
            >
              <ThumbsDown className="w-6 h-6 mr-2" /> Bot
            </Button>
          </div>
        )}

        {hasVoted && (
          <Button onClick={moveToNextVideo} className="w-full h-16 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-xl font-bold mb-4">
            Next Video <SkipForward className="w-6 h-6 ml-2" />
          </Button>
        )}

        {!hasVoted && !videoEnded && (
          <Button onClick={moveToNextVideo} variant="ghost" className="w-full text-green-500/60 hover:text-green-400 mb-4">
            Skip Video
          </Button>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => navigate('/Home')} variant="outline" className="border-green-500/30 text-green-400 hover:bg-green-900/30">
            Image Voting
          </Button>
          <Button onClick={() => navigate('/Profile')} variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-900/30">
            <Award className="w-4 h-4 mr-2" /> Profile
          </Button>
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <VideoUploadModal
            user={user}
            onClose={() => setShowUpload(false)}
            onSuccess={() => { setShowUpload(false); loadVideos(); toast.success('Video uploaded!'); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function VideoUploadModal({ user, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [isBot, setIsBot] = useState(false);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) { toast.error('Please select a video file'); return; }
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Video.create({ url: file_url, is_bot: isBot, description, user_uploaded: true, uploader_email: user.email });
      onSuccess();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload video');
    }
    setUploading(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()} className="bg-zinc-900 border border-purple-500/30 rounded-xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold text-white mb-4">Upload Video</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-green-400 mb-2">Video File (MP4, WebM)</label>
            <input type="file" accept="video/mp4,video/webm" onChange={(e) => setFile(e.target.files[0])}
              className="w-full bg-black/60 border border-purple-500/30 rounded p-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-green-400 mb-2">Description (Optional)</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="What's in this video?" className="w-full bg-black/60 border border-purple-500/30 rounded p-2 text-white" />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={isBot} onChange={(e) => setIsBot(e.target.checked)} className="w-5 h-5" />
            <label className="text-white">This video is AI-generated</label>
          </div>
          <div className="flex gap-3">
            <Button onClick={onClose} variant="outline" className="flex-1 border-green-500/30 text-green-400" disabled={uploading}>Cancel</Button>
            <Button onClick={handleUpload} className="flex-1 bg-purple-600 hover:bg-purple-700" disabled={uploading || !file}>
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}