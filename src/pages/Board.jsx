import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import CommentSection from '@/components/community/CommentSection';

export default function Board() {
  const [searchParams] = useSearchParams();
  const boardId = searchParams.get('id');
  
  const [board, setBoard] = useState(null);
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [showAddImages, setShowAddImages] = useState(false);

  useEffect(() => {
    loadData();
  }, [boardId]);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      const boardData = await base44.entities.Board.filter({ id: boardId }, '', 1);
      if (boardData.length > 0) {
        setBoard(boardData[0]);
        
        // Load images for this board
        const allImages = await base44.entities.Image.list('', 1000);
        const boardImages = allImages.filter(img => 
          boardData[0].image_ids?.includes(img.id)
        );
        setImages(boardImages);
      }
    } catch (err) {
      console.error('Load error:', err);
    }
    setIsLoading(false);
  };

  const handleAddImages = async () => {
    if (!board || selectedImages.length === 0) return;

    try {
      const newImageIds = [...(board.image_ids || []), ...selectedImages];
      await base44.entities.Board.update(board.id, {
        image_ids: newImageIds
      });
      
      setSelectedImages([]);
      setShowAddImages(false);
      loadData();
    } catch (err) {
      console.error('Add images error:', err);
    }
  };

  const handleRemoveImage = async (imageId) => {
    if (!board) return;

    try {
      const newImageIds = board.image_ids?.filter(id => id !== imageId) || [];
      await base44.entities.Board.update(board.id, {
        image_ids: newImageIds
      });
      loadData();
    } catch (err) {
      console.error('Remove image error:', err);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-zinc-950" />;
  if (!board) return <div className="min-h-screen bg-zinc-950 text-white p-6">Board not found</div>;

  const isOwner = currentUser?.email === board.owner_email;

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-32 pt-6">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <a href={createPageUrl('Community')} className="flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Community
          </a>
          
          <h1 className="text-4xl font-black mb-2">{board.title}</h1>
          <p className="text-zinc-400 mb-4">{board.description}</p>
          <p className="text-sm text-purple-400">by {board.owner_email.split('@')[0]}</p>
        </motion.div>

        {/* Add Images Button */}
        {isOwner && (
          <Button
            onClick={() => setShowAddImages(!showAddImages)}
            className="mt-6 mb-6 bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Images
          </Button>
        )}

        {/* Add Images Selection */}
        {showAddImages && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-zinc-900 border border-purple-500/30 rounded-lg p-6 mb-8"
          >
            <h3 className="font-bold mb-4">Select images to add</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto mb-4">
              {/* Load unvoted images from user's uploads */}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowAddImages(false)}
                variant="outline"
                className="border-zinc-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddImages}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Add Selected
              </Button>
            </div>
          </motion.div>
        )}

        {/* Images Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {images.map((image) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative bg-zinc-900 rounded-lg overflow-hidden border border-purple-500/20 hover:border-purple-500/60 transition-all"
            >
              <div className="aspect-square overflow-hidden bg-zinc-800">
                <img
                  src={image.url}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              
              {isOwner && (
                <button
                  onClick={() => handleRemoveImage(image.id)}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          ))}
        </div>

        {/* Comments */}
        <CommentSection targetType="board" targetId={board.id} />
      </div>
    </div>
  );
}