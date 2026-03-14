import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Brain } from 'lucide-react';

const EMOJIS = ['🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎬', '🎤'];

export default function MemoryGame({ onComplete }) {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [startTime] = useState(Date.now());

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

  const initGame = () => {
    const gameCards = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({ id: index, emoji }));
    setCards(gameCards);
  };

  const handleCardClick = (index) => {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) {
      return;
    }

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      
      if (cards[newFlipped[0]].emoji === cards[newFlipped[1]].emoji) {
        setMatched([...matched, ...newFlipped]);
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

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
                flex items-center justify-center text-4xl font-bold
                ${isFlipped 
                  ? 'bg-gradient-to-br from-purple-600 to-pink-600 rotate-0' 
                  : 'bg-zinc-800 hover:bg-zinc-700 rotate-y-180'
                }
                ${matched.includes(index) ? 'opacity-50' : ''}
              `}
            >
              {isFlipped ? card.emoji : '?'}
            </div>
          );
        })}
      </div>
    </Card>
  );
}