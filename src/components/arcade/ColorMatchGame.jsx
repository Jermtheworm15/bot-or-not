import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette } from 'lucide-react';

const COLORS = [
  { name: 'RED', color: 'bg-red-500', text: 'RED' },
  { name: 'BLUE', color: 'bg-blue-500', text: 'BLUE' },
  { name: 'GREEN', color: 'bg-green-500', text: 'GREEN' },
  { name: 'YELLOW', color: 'bg-yellow-500', text: 'YELLOW' },
  { name: 'PURPLE', color: 'bg-purple-500', text: 'PURPLE' },
  { name: 'ORANGE', color: 'bg-orange-500', text: 'ORANGE' }
];

export default function ColorMatchGame({ onComplete }) {
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(2000);
  const [gameOver, setGameOver] = useState(false);
  
  const startTimeRef = useRef();
  const timerRef = useRef();

  const MAX_ROUNDS = 20;

  useEffect(() => {
    if (round < MAX_ROUNDS && !gameOver) {
      generatePrompt();
    } else if (round >= MAX_ROUNDS) {
      onComplete(score, { rounds: MAX_ROUNDS, avgTime: 2000 - timeLeft });
    }
  }, [round]);

  useEffect(() => {
    if (currentPrompt && !gameOver) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, 2000 - elapsed);
        setTimeLeft(remaining);
        
        if (remaining === 0) {
          handleTimeout();
        }
      }, 50);

      return () => clearInterval(timerRef.current);
    }
  }, [currentPrompt]);

  const generatePrompt = () => {
    const displayColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const textColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    setCurrentPrompt({
      displayColor,
      textColor,
      correctAnswer: Math.random() < 0.5 ? 'match' : 'nomatch',
      isMatch: displayColor.name === textColor.name
    });
    setTimeLeft(2000);
  };

  const handleAnswer = (answer) => {
    clearInterval(timerRef.current);
    
    const correct = (answer === 'match' && currentPrompt.isMatch) || 
                    (answer === 'nomatch' && !currentPrompt.isMatch);
    
    if (correct) {
      const timeBonus = Math.round(timeLeft / 10);
      setScore(prev => prev + 100 + timeBonus);
      setRound(prev => prev + 1);
    } else {
      setGameOver(true);
      onComplete(score, { rounds: round, failed: true });
    }
  };

  const handleTimeout = () => {
    clearInterval(timerRef.current);
    setGameOver(true);
    onComplete(score, { rounds: round, timeout: true });
  };

  if (!currentPrompt) {
    return (
      <Card className="bg-black/80 border-purple-500/30 p-8 max-w-2xl w-full">
        <div className="text-center">
          <Palette className="w-12 h-12 mx-auto mb-4 text-purple-400 animate-pulse" />
          <p className="text-green-400">Loading...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-black/80 border-purple-500/30 p-8 max-w-2xl w-full">
      <div className="text-center mb-6">
        <Palette className="w-12 h-12 mx-auto mb-4 text-purple-400" />
        <h3 className="text-2xl font-bold text-white mb-2">Color Match</h3>
        <div className="flex justify-between items-center">
          <div className="text-green-400">Round {round + 1}/{MAX_ROUNDS}</div>
          <div className="text-3xl font-bold text-yellow-400">{score}</div>
        </div>
      </div>

      <div className="mb-6">
        <div className="w-full bg-zinc-800 h-2 rounded-full mb-4">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${(timeLeft / 2000) * 100}%` }}
          />
        </div>

        <div className="text-center mb-4">
          <div className="text-sm text-green-400 mb-2">Does the COLOR match the WORD?</div>
          <div className={`text-6xl font-black ${currentPrompt.displayColor.color} inline-block px-8 py-4 rounded-lg`}>
            {currentPrompt.textColor.text}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={() => handleAnswer('match')}
          className="h-20 text-xl font-bold bg-green-600 hover:bg-green-700 cursor-pointer"
        >
          ✓ MATCH
        </Button>
        <Button
          onClick={() => handleAnswer('nomatch')}
          className="h-20 text-xl font-bold bg-red-600 hover:bg-red-700 cursor-pointer"
        >
          ✗ NO MATCH
        </Button>
      </div>

      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 rounded-lg">
          <div className="text-center">
            <div className="text-4xl font-bold text-red-400 mb-2">Game Over!</div>
            <div className="text-2xl text-yellow-400">Final Score: {score}</div>
          </div>
        </div>
      )}
    </Card>
  );
}