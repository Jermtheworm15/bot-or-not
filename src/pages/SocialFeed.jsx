import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Trophy, Upload, TrendingUp, Flame, Award, Coins, Share2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SocialFeed() {
  const [loading, setLoading] = useState(true);
  const [feed, setFeed] = useState([]);
  const [user, setUser] = useState(null);
  const [commentText, setCommentText] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [feedItems, likes, comments] = await Promise.all([
        base44.entities.SocialFeed.list('-created_date', 100),
        base44.entities.FeedLike.list('', 1000),
        base44.entities.FeedComment.list('', 1000)
      ]);

      // Enrich feed with like/comment data
      const enrichedFeed = feedItems.map(item => ({
        ...item,
        userLiked: likes.some(l => l.feed_id === item.id && l.user_email === currentUser.email),
        likes: likes.filter(l => l.feed_id === item.id),
        comments: comments.filter(c => c.feed_id === item.id)
      }));

      setFeed(enrichedFeed);

    } catch (error) {
      console.error('[Feed] Load error:', error);
    }
    setLoading(false);
  };

  const handleLike = async (feedId) => {
    try {
      const item = feed.find(f => f.id === feedId);
      if (item.userLiked) {
        // Unlike
        const like = item.likes.find(l => l.user_email === user.email);
        if (like) {
          await base44.entities.FeedLike.delete(like.id);
        }
      } else {
        // Like
        await base44.entities.FeedLike.create({
          feed_id: feedId,
          user_email: user.email
        });
      }
      loadData();
    } catch (error) {
      console.error('[Feed] Like error:', error);
      toast.error('Failed to like');
    }
  };

  const handleComment = async (feedId) => {
    const text = commentText[feedId];
    if (!text?.trim()) return;

    try {
      await base44.entities.FeedComment.create({
        feed_id: feedId,
        user_email: user.email,
        comment: text.trim()
      });

      setCommentText({ ...commentText, [feedId]: '' });
      loadData();
      toast.success('Comment added');
    } catch (error) {
      console.error('[Feed] Comment error:', error);
      toast.error('Failed to comment');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'upload': return <Upload className="w-5 h-5 text-blue-400" />;
      case 'tournament_win': return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 'achievement': return <Award className="w-5 h-5 text-purple-400" />;
      case 'streak_milestone': return <Flame className="w-5 h-5 text-orange-400" />;
      case 'rare_trade': return <TrendingUp className="w-5 h-5 text-green-400" />;
      default: return <TrendingUp className="w-5 h-5 text-green-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center pb-32">
        <div className="animate-spin w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 p-4 pb-32 overflow-y-auto">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />
      
      <div className="relative z-10 max-w-2xl mx-auto">
        <h1 className="text-3xl font-black mb-6">Community Feed</h1>

        {feed.length === 0 ? (
          <Card className="bg-black/60 border-purple-500/30 p-8 text-center">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-green-500/30" />
            <p className="text-green-500/60">No activity yet</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {feed.map((item) => (
              <Card key={item.id} className="bg-black/60 border-purple-500/30 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getIcon(item.activity_type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-bold text-white">{item.user_email.split('@')[0]}</div>
                        <div className="text-xs text-green-500/60">
                          {new Date(item.created_date).toLocaleDateString()}
                        </div>
                      </div>
                      {item.is_featured && (
                        <Badge className="bg-yellow-600">Featured</Badge>
                      )}
                    </div>

                    <h3 className="font-bold text-white mb-1">{item.title}</h3>
                    <p className="text-sm text-green-500/80 mb-3">{item.description}</p>

                    <div className="flex items-center gap-4 mb-3">
                      <button
                        onClick={() => handleLike(item.id)}
                        className={`flex items-center gap-1 ${
                          item.userLiked ? 'text-red-400' : 'text-green-500/60'
                        } hover:text-red-400 transition-colors cursor-pointer`}
                      >
                        <Heart className={`w-4 h-4 ${item.userLiked ? 'fill-current' : ''}`} />
                        <span className="text-sm">{item.likes.length}</span>
                      </button>

                      <button className="flex items-center gap-1 text-green-500/60 hover:text-blue-400 transition-colors cursor-pointer">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm">{item.comments.length}</span>
                      </button>

                      <button 
                        onClick={() => {
                          const shareUrl = window.location.origin;
                          navigator.share?.({ url: shareUrl, title: item.title }) || toast.info('Share link copied');
                        }}
                        className="flex items-center gap-1 text-green-500/60 hover:text-purple-400 transition-colors cursor-pointer"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Comments */}
                    {item.comments.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {item.comments.map((comment) => (
                          <div key={comment.id} className="bg-black/40 rounded p-2">
                            <div className="text-xs font-bold text-purple-400 mb-1">
                              {comment.user_email.split('@')[0]}
                            </div>
                            <div className="text-sm text-green-500/80">{comment.comment}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Comment input */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a comment..."
                        value={commentText[item.id] || ''}
                        onChange={(e) => setCommentText({ ...commentText, [item.id]: e.target.value })}
                        className="bg-black/40 border-purple-500/30"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleComment(item.id)}
                        disabled={!commentText[item.id]?.trim()}
                        className="cursor-pointer disabled:cursor-not-allowed"
                      >
                        Post
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}