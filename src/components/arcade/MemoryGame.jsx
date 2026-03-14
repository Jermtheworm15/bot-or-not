import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Brain } from 'lucide-react';

export default function MemoryGame({ onComplete }) {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [startTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initGame();
  }, []);

  useEffect(() => {
    if (matched.length === cards.length && cards.length > 0) {
      const duration = Math.round((Date.now() - startTime) / 1000);
      const score = Math.max(0, 5000 - (moves * 50) - (duration * 10));
      setTimeout(() => {
        onComplete(score, { moves, duration });
      }, 500);
    }
  }, [matched]);

  const initGame = async () => {
    setLoading(true);
    try {
      // Load 8 random images from database
      const images = await base44.entities.Image.list('-created_date', 100);
      
      const validImages = images
        .filter(img => img.url && !img.is_other)
        .slice(0, 8);

      if (validImages.length < 8) {
        console.warn('Not enough images, using available:', validImages.length);
      }

      // Create pairs and shuffle
      const gameCards = [...validImages, ...validImages]
        .sort(() => Math.random() - 0.5)
        .map((img, index) => ({ 
          id: index, 
          imageUrl: img.url,
          imageId: img.id 
        }));
      
      setCards(gameCards);
    } catch (error) {
      console.error('Failed to load images:', error);
      // Fallback to basic cards if image load fails
      setCards([]);
    }
    setLoading(false);
  };

  const handleCardClick = (index) => {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) {
      return;
    }

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
    setMoves(prev => prev + 1);

    if (cards[newFlipped[0]].imageId === cards[newFlipped[1]].imageId) {
      setMatched([...matched, ...newFlipped]);
      setFlipped([]);
    } else {
      setTimeout(() => setFlipped([]), 1000);
    }
    }
  };

  if (loading) {
    return (
      <Card className="bg-black/80 border-purple-500/30 p-8 max-w-2xl w-full">
        <div className="text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 text-purple-400 animate-pulse" />
          <p className="text-green-400">Loading images...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-black/80 border-purple-500/30 p-8 max-w-2xl w-full">
      <div className="text-center mb-6">
        <Brain className="w-12 h-12 mx-auto mb-4 text-purple-400" />
        <h3 className="text-2xl font-bold text-white mb-2">Memory Match</h3>
        <div className="text-green-400">Moves: {moves}</div>
        <div className="text-yellow-400">Matched: {matched.length / 2}/{cards.length / 2}</div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {cards.map((card, index) => {
          const isFlipped = flipped.includes(index) || matched.includes(index);
          return (
            <div
              key={card.id}
              onClick={() => handleCardClick(index)}
              className={`
                aspect-square rounded-lg cursor-pointer transition-all duration-300
                overflow-hidden
                ${isFlipped 
                  ? 'border-2 border-purple-500' 
                  : 'bg-zinc-800 hover:bg-zinc-700'
                }
                ${matched.includes(index) ? 'opacity-50' : ''}
              `}
            >
              {isFlipped ? (
                <img 
                  src={card.imageUrl} 
                  alt="Memory card"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-green-400">
                  ?
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}