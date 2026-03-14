import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { MousePointer2 } from 'lucide-react';

export default function ClickerGame({ onComplete }) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [targets, setTargets] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  
  const intervalRef = useRef();

  useEffect(() => {
    if (gameStarted && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);

      return () => clearInterval(intervalRef.current);
    } else if (timeLeft === 0) {
      onComplete(score, { clicks: score, duration: 30 });
    }
  }, [gameStarted, timeLeft]);

  useEffect(() => {
    if (gameStarted && timeLeft > 0) {
      const interval = setInterval(() => {
        setTargets(prev => {
          const newTargets = prev.filter(t => t.lifetime > 0)
            .map(t => ({ ...t, lifetime: t.lifetime - 100 }));
          
          if (newTargets.length < 5 && Math.random() < 0.5) {
            newTargets.push({
              id: Date.now(),
              x: Math.random() * 85,
              y: Math.random() * 85,
              size: 8 + Math.random() * 8,
              points: Math.round(50 + Math.random() * 50),
              lifetime: 2000
            });
          }
          
          return newTargets;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [gameStarted, timeLeft]);

  const handleStart = () => {
    setGameStarted(true);
    setScore(0);
    setTimeLeft(30);
  };

  const handleTargetClick = (target) => {
    setScore(prev => prev + target.points);
    setTargets(prev => prev.filter(t => t.id !== target.id));
  };

  return (
    <Card className="bg-black/80 border-purple-500/30 p-8 max-w-2xl w-full">
      <div className="text-center mb-4">
        <MousePointer2 className="w-12 h-12 mx-auto mb-2 text-blue-400" />
        <h3 className="text-2xl font-bold text-white">Speed Clicker</h3>
        <div className="flex justify-between items-center mb-2">
          <div className="text-2xl font-bold text-yellow-400">{score}</div>
          <div className="text-2xl font-bold text-green-400">{timeLeft}s</div>
        </div>
      </div>

      {!gameStarted ? (
        <div 
          onClick={handleStart}
          className="w-full h-96 bg-zinc-900 rounded-lg flex items-center justify-center cursor-pointer hover:bg-zinc-800"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-2">Click to Start!</div>
            <div className="text-green-400">Click as many targets as you can in 30 seconds</div>
          </div>
        </div>
      ) : (
        <div className="relative w-full h-96 bg-zinc-900 rounded-lg overflow-hidden">
          {targets.map(target => (
            <div
              key={target.id}
              onClick={() => handleTargetClick(target)}
              className="absolute bg-gradient-to-br from-blue-500 to-purple-600 rounded-full cursor-pointer hover:scale-110 transition-transform flex items-center justify-center font-bold text-white"
              style={{
                left: `${target.x}%`,
                top: `${target.y}%`,
                width: `${target.size}%`,
                height: `${target.size}%`,
                opacity: target.lifetime / 2000
              }}
            >
              <span className="text-xs">{target.points}</span>
            </div>
          ))}
          
          {timeLeft === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">Time's Up!</div>
                <div className="text-2xl text-yellow-400">Score: {score}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}