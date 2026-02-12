import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send } from 'lucide-react';

export default function CommentSection({ targetType, targetId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadComments();
    loadCurrentUser();
  }, [targetType, targetId]);

  const loadCurrentUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
    } catch (err) {
      console.log('User load error:', err);
    }
  };

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.Comment.filter({
        target_type: targetType,
        target_id: targetId
      }, '-created_date', 50);
      setComments(data);
    } catch (err) {
      console.error('Load comments error:', err);
    }
    setIsLoading(false);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !currentUser) return;

    try {
      await base44.entities.Comment.create({
        content: newComment,
        author_email: currentUser.email,
        author_name: currentUser.full_name || currentUser.email.split('@')[0],
        target_type: targetType,
        target_id: targetId
      });
      
      setNewComment('');
      loadComments();
    } catch (err) {
      console.error('Submit comment error:', err);
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-purple-500/20 rounded-lg p-4 space-y-4">
      <h3 className="flex items-center gap-2 text-white font-semibold">
        <MessageCircle className="w-4 h-4 text-purple-400" />
        Comments ({comments.length})
      </h3>

      {currentUser && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
            placeholder="Add a comment..."
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
          />
          <Button
            onClick={handleSubmitComment}
            disabled={!newComment.trim()}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div className="space-y-3 max-h-64 overflow-y-auto">
        <AnimatePresence>
          {comments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-800 rounded p-3 text-sm"
            >
              <p className="text-purple-400 font-semibold text-xs">{comment.author_name}</p>
              <p className="text-zinc-200 mt-1">{comment.content}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}