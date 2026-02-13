import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function ImageComments({ imageId, isRevealed }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (isExpanded) {
      loadComments();
    }
  }, [isExpanded, imageId]);

  const loadUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
    } catch (err) {
      console.log('Auth error:', err);
    }
  };

  const loadComments = async () => {
    try {
      const allComments = await base44.entities.Comment.filter(
        { target_type: 'image', target_id: imageId },
        '-created_date',
        50
      );
      setComments(allComments);
    } catch (err) {
      console.log('Error loading comments:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    setIsSubmitting(true);
    try {
      const comment = await base44.entities.Comment.create({
        content: newComment.trim(),
        author_email: currentUser.email,
        author_name: currentUser.full_name || currentUser.email,
        target_type: 'image',
        target_id: imageId
      });

      setComments(prev => [comment, ...prev]);
      setNewComment('');
      toast.success('Comment posted!');

      // Create activity
      await base44.entities.Activity.create({
        user_email: currentUser.email,
        username: currentUser.full_name || currentUser.email,
        action_type: 'vote',
        description: 'commented on an image',
        metadata: { image_id: imageId }
      });
    } catch (err) {
      console.error('Error posting comment:', err);
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await base44.entities.Comment.delete(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comment deleted');
    } catch (err) {
      console.error('Error deleting comment:', err);
      toast.error('Failed to delete comment');
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (!isRevealed) return null;

  return (
    <div className="mt-4">
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        variant="outline"
        className="w-full flex items-center justify-between bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
      >
        <span className="flex items-center gap-2 text-white">
          <MessageCircle className="w-4 h-4" />
          Comments ({comments.length})
        </span>
      </Button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-4 bg-zinc-900 rounded-lg p-4">
              {/* Comment Form */}
              <form onSubmit={handleSubmit} className="space-y-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="bg-zinc-800 border-zinc-700 text-white resize-none"
                  rows={3}
                />
                <Button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Post Comment
                </Button>
              </form>

              {/* Comments List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-center text-zinc-500 py-4">No comments yet. Be the first!</p>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="bg-zinc-800 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-green-400 text-sm">
                              {comment.author_name}
                            </span>
                            <span className="text-xs text-zinc-500">
                              {getTimeAgo(comment.created_date)}
                            </span>
                          </div>
                          <p className="text-white text-sm">{comment.content}</p>
                        </div>
                        {currentUser && comment.author_email === currentUser.email && (
                          <Button
                            onClick={() => handleDelete(comment.id)}
                            variant="ghost"
                            size="icon"
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}