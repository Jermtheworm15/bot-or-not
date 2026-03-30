import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Upload, X, ChevronUp, ChevronDown, Bot, Send, Trash2, Image, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function UploadModal({ onClose, onUploaded, userEmail, userName }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [tool, setTool] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!file || !caption.trim()) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.AIShowcase.create({
      user_email: userEmail,
      username: userName,
      image_url: file_url,
      caption: caption.trim(),
      ai_tool: tool.trim() || 'Unknown',
      votes: 0,
      comments_count: 0,
    });
    setUploading(false);
    onUploaded();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="font-bold text-white text-lg flex items-center gap-2"><Sparkles className="w-5 h-5 text-violet-400" />Share Your AI Creation</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 space-y-4">
          {/* Image upload */}
          <label className={`block w-full border-2 border-dashed rounded-xl cursor-pointer transition-colors ${preview ? 'border-violet-500/50' : 'border-zinc-700 hover:border-violet-500/50'}`}>
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            {preview
              ? <img src={preview} className="w-full h-48 object-cover rounded-xl" />
              : <div className="h-48 flex flex-col items-center justify-center gap-2 text-zinc-500">
                  <Image className="w-10 h-10" />
                  <span className="text-sm">Click to upload your AI image</span>
                </div>
            }
          </label>

          <textarea
            placeholder="Describe your image or the prompt you used..."
            value={caption}
            onChange={e => setCaption(e.target.value)}
            rows={3}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-500 resize-none focus:outline-none focus:border-violet-500"
          />

          <input
            placeholder="AI tool used (e.g. Midjourney, DALL-E 3, Stable Diffusion...)"
            value={tool}
            onChange={e => setTool(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
          />

          <Button
            onClick={handleSubmit}
            disabled={!file || !caption.trim() || uploading}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold"
          >
            {uploading ? 'Uploading...' : 'Share to Community'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CommentsPanel({ postId, userEmail, userName, isOpen }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    base44.entities.AIShowcaseComment.filter({ post_id: postId }).then(setComments);
  }, [isOpen, postId]);

  const submit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    const c = await base44.entities.AIShowcaseComment.create({
      post_id: postId,
      user_email: userEmail,
      username: userName,
      text: text.trim(),
    });
    setComments(prev => [...prev, c]);
    setText('');
    await base44.entities.AIShowcase.update(postId, { comments_count: comments.length + 1 });
    setLoading(false);
  };

  const deleteComment = async (id) => {
    await base44.entities.AIShowcaseComment.delete(id);
    setComments(prev => prev.filter(c => c.id !== id));
  };

  if (!isOpen) return null;

  return (
    <div className="border-t border-zinc-800 px-4 pb-4 pt-3">
      <div className="space-y-3 max-h-48 overflow-y-auto mb-3 scrollbar-hide">
        {comments.length === 0 && <p className="text-xs text-zinc-500 text-center py-2">No comments yet. Be first!</p>}
        {comments.map(c => (
          <div key={c.id} className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-violet-800 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
              {(c.username || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-violet-400 mr-1">{c.username || 'User'}</span>
              <span className="text-xs text-zinc-300">{c.text}</span>
              <p className="text-[10px] text-zinc-600 mt-0.5">{timeAgo(c.created_date)}</p>
            </div>
            {c.user_email === userEmail && (
              <button onClick={() => deleteComment(c.id)} className="text-zinc-600 hover:text-red-400 flex-shrink-0">
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Add a comment..."
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-1.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
        />
        <button onClick={submit} disabled={loading || !text.trim()}
          className="w-8 h-8 rounded-xl bg-violet-600 hover:bg-violet-500 flex items-center justify-center text-white disabled:opacity-40">
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function PostCard({ post, userEmail, userName, onVote, rank }) {
  const [showComments, setShowComments] = useState(false);
  const [userVote, setUserVote] = useState(0);

  const vote = async (dir) => {
    const newVote = userVote === dir ? 0 : dir;
    const delta = newVote - userVote;
    setUserVote(newVote);
    onVote(post.id, delta);
    await base44.entities.AIShowcase.update(post.id, { votes: (post.votes || 0) + delta });
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden hover:border-zinc-700 transition-colors">
      <div className="relative">
        {rank <= 3 && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
            <span className="text-sm">{['🥇', '🥈', '🥉'][rank - 1]}</span>
            <span className="text-[10px] font-bold text-white">{rank === 1 ? 'Top Rated' : rank === 2 ? '2nd Place' : '3rd Place'}</span>
          </div>
        )}
        <img src={post.image_url} alt={post.caption}
          className="w-full object-cover" style={{ maxHeight: 400 }} />
      </div>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-violet-800 flex items-center justify-center text-xs font-bold text-white">
            {(post.username || '?')[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">{post.username || 'Anonymous'}</p>
            <p className="text-[10px] text-zinc-500">{timeAgo(post.created_date)}</p>
          </div>
          <Badge className="bg-violet-900/50 border border-violet-700/50 text-violet-300 text-[10px] flex items-center gap-1">
            <Bot className="w-3 h-3" />{post.ai_tool || 'AI'}
          </Badge>
        </div>

        <p className="text-sm text-zinc-300 leading-relaxed">{post.caption}</p>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Upvote/Downvote */}
          <div className="flex items-center gap-1 bg-zinc-800 rounded-xl p-1">
            <button onClick={() => vote(1)}
              className={`p-1 rounded-lg transition-colors ${userVote === 1 ? 'text-emerald-400' : 'text-zinc-400 hover:text-emerald-400'}`}>
              <ChevronUp className="w-4 h-4" />
            </button>
            <span className={`text-sm font-bold min-w-[24px] text-center ${post.votes > 0 ? 'text-emerald-400' : post.votes < 0 ? 'text-red-400' : 'text-zinc-400'}`}>
              {post.votes || 0}
            </span>
            <button onClick={() => vote(-1)}
              className={`p-1 rounded-lg transition-colors ${userVote === -1 ? 'text-red-400' : 'text-zinc-400 hover:text-red-400'}`}>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <button onClick={() => setShowComments(v => !v)}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-violet-400 transition-colors text-sm">
            <MessageCircle className="w-4 h-4" />
            <span>{post.comments_count || 0}</span>
          </button>
        </div>
      </CardContent>

      <CommentsPanel
        postId={post.id}
        userEmail={userEmail}
        userName={userName}
        isOpen={showComments}
      />
    </Card>
  );
}

export default function CheckOutMyAI() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [sortBy, setSortBy] = useState('new'); // 'new' | 'top'

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const user = await base44.auth.me();
    setUserEmail(user.email);
    const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
    setUserName(profiles[0]?.username || user.full_name || user.email.split('@')[0]);
    loadPosts();
  };

  const loadPosts = async () => {
    setLoading(true);
    const data = await base44.entities.AIShowcase.list('-created_date', 100);
    setPosts(data);
    setLoading(false);
  };

  const handleVote = (postId, delta) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, votes: (p.votes || 0) + delta } : p));
  };

  const sorted = [...posts].sort((a, b) =>
    sortBy === 'top' ? (b.votes || 0) - (a.votes || 0) : new Date(b.created_date) - new Date(a.created_date)
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-28">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/20 via-zinc-950 to-emerald-950/10 pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-violet-400" />Check Out My AI
            </h1>
            <p className="text-zinc-400 text-sm mt-0.5">Share your AI creations. Community votes & comments.</p>
          </div>
          <Button onClick={() => setShowUpload(true)}
            className="bg-violet-600 hover:bg-violet-500 text-white font-bold gap-2 flex-shrink-0">
            <Upload className="w-4 h-4" />Share
          </Button>
        </div>

        {/* Sort tabs */}
        <div className="flex gap-2 mb-5">
          {['new', 'top'].map(s => (
            <button key={s} onClick={() => setSortBy(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors capitalize ${
                sortBy === s ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}>
              {s === 'new' ? '🆕 Newest' : '🔥 Top Voted'}
            </button>
          ))}
        </div>

        {/* Posts */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-zinc-900 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-64 bg-zinc-800" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-zinc-800 rounded w-1/3" />
                  <div className="h-3 bg-zinc-800 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20">
            <Sparkles className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg font-bold">No posts yet</p>
            <p className="text-zinc-600 text-sm mt-1">Be the first to share an AI creation!</p>
            <Button onClick={() => setShowUpload(true)} className="mt-4 bg-violet-600 hover:bg-violet-500">
              <Upload className="w-4 h-4 mr-2" />Upload Now
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {sorted.map((post, i) => {
              // rank is position in top-votes order (regardless of current sort)
              const topVotedIdx = [...posts].sort((a,b) => (b.votes||0)-(a.votes||0)).findIndex(p => p.id === post.id);
              const rank = topVotedIdx + 1;
              return (
                <motion.div key={post.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <PostCard post={post} userEmail={userEmail} userName={userName} onVote={handleVote} rank={rank} />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showUpload && (
          <UploadModal
            userEmail={userEmail}
            userName={userName}
            onClose={() => setShowUpload(false)}
            onUploaded={() => { setShowUpload(false); loadPosts(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}