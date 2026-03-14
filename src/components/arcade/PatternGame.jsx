import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Grid3x3 } from 'lucide-react';

const COLORS = ['red', 'blue', 'green', 'yellow'];

export default function PatternGame({ onComplete }) {
  const [sequence, setSequence] = useState([]);
  const [playerSequence, setPlayerSequence] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [activeColor, setActiveColor] = useState(null);

  useEffect(() => {
    if (round === 1) {
      startNewRound();
    }
  }, []);

  const startNewRound = () => {
    const newSequence = [...sequence, COLORS[Math.floor(Math.random() * COLORS.length)]];
    setSequence(newSequence);
    setPlayerSequence([]);
    playSequence(newSequence);
  };

  const playSequence = async (seq) => {
    setIsPlaying(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    for (let i = 0; i < seq.length; i++) {
      setActiveColor(seq[i]);
      await new Promise(resolve => setTimeout(resolve, 500));
      setActiveColor(null);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setIsPlaying(false);
  };

  const handleColorClick = (color) => {
    if (isPlaying || gameOver) return;

    const newPlayerSequence = [...playerSequence, color];
    setPlayerSequence(newPlayerSequence);

    // Flash the color
    setActiveColor(color);
    setTimeout(() => setActiveColor(null), 200);

    // Check if correct
    const currentIndex = newPlayerSequence.length - 1;
    if (newPlayerSequence[currentIndex] !== sequence[currentIndex]) {
      setGameOver(true);
      onComplete(score, { rounds: round });
      return;
    }

    // Check if sequence complete
    if (newPlayerSequence.length === sequence.length) {
      const points = round * 100;
      setScore(prev => prev + points);
      setRound(prev => prev + 1);
      setTimeout(() => startNewRound(), 1000);
    }
  };

  const getColorClass = (color) => {
    const classes = {
      red: 'bg-red-600',
      blue: 'bg-blue-600',
      green: 'bg-green-600',
      yellow: 'bg-yellow-600'
    };
    return classes[color];
  };

  return (
    <Card className="bg-black/80 border-purple-500/30 p-8 max-w-2xl w-full">
      <div className="text-center mb-6">
        <Grid3x3 className="w-12 h-12 mx-auto mb-4 text-purple-400" />
        <h3 className="text-2xl font-bold text-white mb-2">Pattern Memory</h3>
        <div className="flex justify-between items-center">
          <div className="text-green-400">Round {round}</div>
          <div className="text-3xl font-bold text-yellow-400">{score}</div>
        </div>
        {isPlaying && <div className="text-sm text-orange-400 mt-2">Watch the pattern...</div>}
        {!isPlaying && !gameOver && <div className="text-sm text-green-400 mt-2">Repeat the pattern!</div>}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {COLORS.map(color => (
          <button
            key={color}
            onClick={() => handleColorClick(color)}
            disabled={isPlaying || gameOver}
            className={`
              aspect-square rounded-lg transition-all duration-200 cursor-pointer
              ${getColorClass(color)}
              ${activeColor === color ? 'scale-95 brightness-150' : 'brightness-75 hover:brightness-100'}
              ${isPlaying || gameOver ? 'cursor-not-allowed opacity-50' : ''}
            `}
          />
        ))}
      </div>

      {gameOver && (
        <div className="bg-black/80 rounded-lg p-6 text-center">
          <div className="text-4xl font-bold text-red-400 mb-2">Game Over!</div>
          <div className="text-2xl text-yellow-400">Final Score: {score}</div>
          <div className="text-lg text-green-400">Rounds: {round}</div>
        </div>
      )}
    </Card>
  );
}