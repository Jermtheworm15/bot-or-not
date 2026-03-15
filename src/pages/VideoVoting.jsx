import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Upload, ThumbsUp, ThumbsDown, SkipForward, TrendingUp, Award, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function VideoVoting() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(null);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ total: 0, correct: 0, streak: 0 });
  const [profile, setProfile] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  
  const videoRef = useRef();

  useEffect(() => {
    loadUser();
    loadVideos();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const profiles = await base44.entities.UserProfile.filter({ user_email: currentUser.email });
      if (profiles[0]) {
        setProfile(profiles[0]);
      }

      const votes = await base44.entities.VideoVote.filter({ user_email: currentUser.email });
      const correct = votes.filter(v => v.was_correct).length;
      const currentStreak = calculateStreak(votes);
      
      setStats({
        total: votes.length,
        correct,
        streak: currentStreak
      });
    } catch (error) {
      console.error('Load user error:', error);
    }
  };

  const calculateStreak = (votes) => {
    if (votes.length === 0) return 0;
    const sorted = votes.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    let streak = 0;
    for (const vote of sorted) {
      if (vote.was_correct) streak++;
      else break;
    }
    return streak;
  };

  const loadVideos = async () => {
    setLoading(true);
    try {
      const viewed = JSON.parse(sessionStorage.getItem('viewedVideos') || '[]');
      const allVideos = await base44.entities.Video.list('-created_date', 100);
      
      const unviewed = allVideos.filter(v => !viewed.includes(v.id));
      const shuffled = unviewed.sort(() => Math.random() - 0.5);
      
      setVideos(shuffled);
      if (shuffled.length > 0) {
        setCurrentVideo(shuffled[0]);
        sessionStorage.setItem('viewedVideos', JSON.stringify([...viewed, shuffled[0].id].slice(-50)));
      } else {
        sessionStorage.setItem('viewedVideos', JSON.stringify([]));
        loadVideos();
      }
    } catch (error) {
      console.error('Load videos error:', error);
      toast.error('Failed to load videos');
    }
    setLoading(false);
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

      const newTotal = stats.total + 1;
      const newCorrect = stats.correct + (correct ? 1 : 0);
      const newStreak = correct ? stats.streak + 1 : 0;

      setStats({
        total: newTotal,
        correct: newCorrect,
        streak: newStreak
      });

      if (correct) {
        try {
          await base44.functions.invoke('processVoteReward', {
            vote_type: 'video',
            was_correct: true
          });
        } catch (error) {
          console.error('Reward error:', error);
        }
      }

      setTimeout(() => {
        moveToNextVideo();
      }, 2000);

    } catch (error) {
      console.error('Vote error:', error);
      toast.error('Failed to save vote');
    }
  };

  const moveToNextVideo = () => {
    setHasVoted(false);
    setWasCorrect(null);

    const idx = videos.findIndex(v => v.id === currentVideo?.id);
    if (idx >= 0 && idx < videos.length - 1) {
      const nextVideo = videos[idx + 1];
      const viewed = JSON.parse(sessionStorage.getItem('viewedVideos') || '[]');
      sessionStorage.setItem('viewedVideos', JSON.stringify([...viewed, nextVideo.id].slice(-50)));
      setCurrentVideo(nextVideo);
    } else {
      loadVideos();
    }
  };

  const handleSkip = () => {
    if (!hasVoted) {
      moveToNextVideo();
    }
  };

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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Video className="w-8 h-8 text-purple-400" />
            <h1 className="text-2xl font-bold">Video Voting</h1>
          </div>
          <Button
            onClick={() => setShowUpload(true)}
            variant="outline"
            className="border-purple-500/30 text-purple-400 hover:bg-purple-900/30"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>

        {/* Stats Bar */}
        <Card className="bg-black/60 border-purple-500/30 p-4 mb-6">
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

        {/* Video Player */}
        {currentVideo && (
          <Card className="bg-black/80 border-purple-500/30 overflow-hidden mb-6">
            <div className="relative aspect-[9/16] bg-zinc-900">
              <video
                ref={videoRef}
                src={currentVideo.url}
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              />
              
              {hasVoted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/60"
                >
                  <div className="text-center">
                    <div className={`text-6xl mb-4 ${wasCorrect ? 'text-green-400' : 'text-red-400'}`}>
                      {wasCorrect ? '✓' : '✗'}
                    </div>
                    <div className={`text-2xl font-bold mb-2 ${wasCorrect ? 'text-green-400' : 'text-red-400'}`}>
                      {wasCorrect ? 'Correct!' : 'Wrong!'}
                    </div>
                    <div className="text-lg text-white">
                      This was {currentVideo.is_bot ? 'AI Generated' : 'Human Created'}
                    </div>
                    {wasCorrect && (
                      <Badge className="mt-4 bg-yellow-600 text-white">
                        <Zap className="w-4 h-4 mr-1" />
                        +10 Tokens
                      </Badge>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {currentVideo.description && (
              <div className="p-4 border-t border-purple-500/30">
                <p className="text-sm text-green-400">{currentVideo.description}</p>
              </div>
            )}
          </Card>
        )}

        {/* Voting Buttons */}
        {!hasVoted ? (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Button
              onClick={() => handleVote(false)}
              disabled={!currentVideo}
              className="h-20 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-xl font-bold"
            >
              <ThumbsUp className="w-6 h-6 mr-2" />
              Human
            </Button>
            <Button
              onClick={() => handleVote(true)}
              disabled={!currentVideo}
              className="h-20 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-xl font-bold"
            >
              <ThumbsDown className="w-6 h-6 mr-2" />
              Bot
            </Button>
          </div>
        ) : (
          <Button
            onClick={moveToNextVideo}
            className="w-full h-16 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-xl font-bold"
          >
            Next Video
            <SkipForward className="w-6 h-6 ml-2" />
          </Button>
        )}

        {!hasVoted && (
          <Button
            onClick={handleSkip}
            variant="ghost"
            className="w-full text-green-500/60 hover:text-green-400"
          >
            Skip Video
          </Button>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <Button
            onClick={() => navigate('/Home')}
            variant="outline"
            className="border-green-500/30 text-green-400 hover:bg-green-900/30"
          >
            Image Voting
          </Button>
          <Button
            onClick={() => navigate('/Profile')}
            variant="outline"
            className="border-purple-500/30 text-purple-400 hover:bg-purple-900/30"
          >
            <Award className="w-4 h-4 mr-2" />
            Profile
          </Button>
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <VideoUploadModal
            user={user}
            onClose={() => setShowUpload(false)}
            onSuccess={() => {
              setShowUpload(false);
              loadVideos();
              toast.success('Video uploaded successfully!');
            }}
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
    if (!file) {
      toast.error('Please select a video file');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      await base44.entities.Video.create({
        url: file_url,
        is_bot: isBot,
        description,
        user_uploaded: true,
        uploader_email: user.email
      });

      onSuccess();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload video');
    }
    setUploading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-900 border border-purple-500/30 rounded-xl p-6 max-w-md w-full"
      >
        <h2 className="text-2xl font-bold text-white mb-4">Upload Video</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-green-400 mb-2">Video File (MP4, WebM)</label>
            <input
              type="file"
              accept="video/mp4,video/webm"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full bg-black/60 border border-purple-500/30 rounded p-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-green-400 mb-2">Description (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's in this video?"
              className="w-full bg-black/60 border border-purple-500/30 rounded p-2 text-white"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isBot}
              onChange={(e) => setIsBot(e.target.checked)}
              className="w-5 h-5"
            />
            <label className="text-white">This video is AI-generated</label>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-green-500/30 text-green-400"
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              disabled={uploading || !file}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}