import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Plus, Grid3x3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Community() {
  const [boards, setBoards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardDesc, setNewBoardDesc] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      // Load all public boards
      const allBoards = await base44.entities.Board.list('-created_date', 100);
      setBoards(allBoards);
    } catch (err) {
      console.error('Load error:', err);
    }
    setIsLoading(false);
  };

  const handleCreateBoard = async () => {
    if (!newBoardTitle.trim() || !currentUser) return;

    try {
      await base44.entities.Board.create({
        title: newBoardTitle,
        description: newBoardDesc,
        owner_email: currentUser.email,
        image_ids: [],
        is_public: true
      });
      
      setNewBoardTitle('');
      setNewBoardDesc('');
      setShowNewBoard(false);
      loadData();
    } catch (err) {
      console.error('Create board error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-32 pt-6">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-green-400">
              Community Boards
            </h1>
            <p className="text-zinc-400 mt-2">Create and share your image collections</p>
          </motion.div>
          
          <Button
            onClick={() => setShowNewBoard(!showNewBoard)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Board
          </Button>
        </div>

        {/* Create Board Form */}
        {showNewBoard && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-purple-500/30 rounded-lg p-6 mb-8"
          >
            <input
              type="text"
              value={newBoardTitle}
              onChange={(e) => setNewBoardTitle(e.target.value)}
              placeholder="Board title..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white placeholder-zinc-500 mb-3 focus:outline-none focus:border-purple-500"
            />
            <textarea
              value={newBoardDesc}
              onChange={(e) => setNewBoardDesc(e.target.value)}
              placeholder="Board description..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white placeholder-zinc-500 mb-4 focus:outline-none focus:border-purple-500 resize-none"
              rows="3"
            />
            <div className="flex gap-2 justify-end">
              <Button
                onClick={() => setShowNewBoard(false)}
                variant="outline"
                className="border-zinc-700 text-zinc-400"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateBoard}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Create Board
              </Button>
            </div>
          </motion.div>
        )}

        {/* Boards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-zinc-900 rounded-lg h-64 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board) => (
              <motion.div
                key={board.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-purple-900/30 to-zinc-900/50 border border-purple-500/30 rounded-lg p-4 hover:border-purple-500/60 transition-all cursor-pointer group"
              >
                <Link to={`${createPageUrl('Board')}?id=${board.id}`}>
                  <div className="flex items-start justify-between mb-4">
                    <Grid3x3 className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xs text-zinc-500">{board.image_ids?.length || 0} images</span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                    {board.title}
                  </h3>
                  <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{board.description}</p>
                  <p className="text-xs text-purple-400">by {board.owner_email.split('@')[0]}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}