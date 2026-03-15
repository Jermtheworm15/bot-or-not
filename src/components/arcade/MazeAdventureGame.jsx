import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';

export default function MazeAdventureGame({ onComplete }) {
  const [playerX, setPlayerX] = useState(1);
  const [playerY, setPlayerY] = useState(1);
  const [gems, setGems] = useState([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gemsCollected, setGemsCollected] = useState(0);

  const maze = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 1, 1, 0, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 2, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ];

  useEffect(() => {
    setGems([
      { x: 3, y: 1 },
      { x: 7, y: 2 },
      { x: 3, y: 5 },
      { x: 7, y: 7 },
    ]);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      e.preventDefault();
      let newX = playerX;
      let newY = playerY;

      if (e.key === 'ArrowUp') newY = playerY - 1;
      if (e.key === 'ArrowDown') newY = playerY + 1;
      if (e.key === 'ArrowLeft') newX = playerX - 1;
      if (e.key === 'ArrowRight') newX = playerX + 1;

      if (maze[newY]?.[newX] !== 1) {
        setPlayerX(newX);
        setPlayerY(newY);
        setMoves(prev => prev + 1);

        const gemIndex = gems.findIndex(g => g.x === newX && g.y === newY && !g.collected);
        if (gemIndex !== -1) {
          setGems(prev => prev.map((g, i) => i === gemIndex ? { ...g, collected: true } : g));
          setScore(prev => prev + 250);
          setGemsCollected(prev => prev + 1);
        }

        if (maze[newY][newX] === 2) {
          const finalScore = score + 1000 - (moves * 5);
          setTimeout(() => onComplete(finalScore, { moves, gemsCollected }), 1000);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerX, playerY, gems, score, moves]);

  return (
    <Card className="bg-black/80 border-purple-500/30 p-8 max-w-2xl w-full">
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold text-white mb-2">Maze Adventure</h3>
        <div className="flex justify-between items-center">
          <div className="text-yellow-400 font-bold">{score}</div>
          <div className="text-green-400">Gems: {gemsCollected}/4</div>
          <div className="text-blue-400">Moves: {moves}</div>
        </div>
        <div className="text-sm text-green-500/60 mt-2">Find gems and reach the exit!</div>
      </div>

      <div className="grid gap-1 bg-zinc-900 p-4 rounded-lg" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
        {maze.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              className={`aspect-square rounded ${
                playerX === x && playerY === y
                  ? 'bg-blue-500'
                  : cell === 1
                  ? 'bg-zinc-700'
                  : cell === 2
                  ? 'bg-green-500'
                  : gems.find(g => g.x === x && g.y === y && !g.collected)
                  ? 'bg-yellow-400 animate-pulse'
                  : 'bg-zinc-800'
              }`}
            />
          ))
        )}
      </div>
    </Card>
  );
}