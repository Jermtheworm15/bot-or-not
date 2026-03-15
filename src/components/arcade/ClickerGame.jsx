import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { MousePointer2 } from 'lucide-react';

export default function ClickerGame({ onComplete }) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [targets, setTargets] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [clicks, setClicks] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [missedClicks, setMissedClicks] = useState(0);
  
  const intervalRef = useRef();

  useEffect(() => {
    if (gameStarted && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);

      return () => clearInterval(intervalRef.current);
    } else if (timeLeft === 0) {
      const bonusScore = Math.round(score * (accuracy / 100));
      onComplete(score + bonusScore, { clicks, accuracy, duration: 45 });
    }
  }, [gameStarted, timeLeft]);

  useEffect(() => {
    if (gameStarted && timeLeft > 0) {
      const interval = setInterval(() => {
        setTargets(prev => {
          const newTargets = prev.filter(t => t.lifetime > 0)
            .map(t => ({ ...t, lifetime: t.lifetime - 100 }));
          
          const maxTargets = 3 + Math.floor((45 - timeLeft) / 10);
          if (newTargets.length < maxTargets && Math.random() < 0.6) {
            const fastTarget = Math.random() < 0.3;
            newTargets.push({
              id: Date.now(),
              x: Math.random() * 85,
              y: Math.random() * 85,
              size: fastTarget ? 6 + Math.random() * 6 : 8 + Math.random() * 8,
              points: fastTarget ? Math.round(100 + Math.random() * 100) : Math.round(50 + Math.random() * 50),
              lifetime: fastTarget ? 1500 : 2500,
              isFast: fastTarget
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
    setTimeLeft(45);
    setClicks(0);
    setMissedClicks(0);
    setAccuracy(100);
  };

  const handleTargetClick = (e, target) => {
    e.stopPropagation();
    setScore(prev => prev + target.points);
    setTargets(prev => prev.filter(t => t.id !== target.id));
    setClicks(prev => prev + 1);
    updateAccuracy(clicks + 1, missedClicks);
  };
  
  const handleMiss = () => {
    setMissedClicks(prev => prev + 1);
    updateAccuracy(clicks, missedClicks + 1);
  };
  
  const updateAccuracy = (totalClicks, missed) => {
    if (totalClicks + missed > 0) {
      setAccuracy(Math.round((totalClicks / (totalClicks + missed)) * 100));
    }
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
        {gameStarted && (
          <div className="text-sm text-green-500/60">Accuracy: {accuracy}% • Clicks: {clicks}</div>
        )}
      </div>

      {!gameStarted ? (
        <div 
          onClick={handleStart}
          className="w-full h-96 bg-zinc-900 rounded-lg flex items-center justify-center cursor-pointer hover:bg-zinc-800"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-2">Click to Start!</div>
            <div className="text-green-400">Click as many targets as you can in 45 seconds</div>
            <div className="text-sm text-green-500/60 mt-2">⚡ Fast targets = More points!</div>
          </div>
        </div>
      ) : (
        <div 
          className="relative w-full h-96 bg-zinc-900 rounded-lg overflow-hidden"
          onClick={handleMiss}
        >
          {targets.map(target => (
            <div
              key={target.id}
              onClick={(e) => handleTargetClick(e, target)}
              className={`absolute rounded-full cursor-pointer hover:scale-110 transition-transform flex items-center justify-center font-bold text-white ${
                target.isFast 
                  ? 'bg-gradient-to-br from-orange-500 to-red-600 animate-pulse' 
                  : 'bg-gradient-to-br from-blue-500 to-purple-600'
              }`}
              style={{
                left: `${target.x}%`,
                top: `${target.y}%`,
                width: `${target.size}%`,
                height: `${target.size}%`,
                opacity: target.lifetime / (target.isFast ? 1500 : 2500)
              }}
            >
              <span className="text-xs">{target.points}</span>
            </div>
          ))}
          
          {timeLeft === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">Time's Up!</div>
                <div className="text-2xl text-yellow-400 mb-2">Score: {score}</div>
                <div className="text-sm text-green-500/60">Accuracy: {accuracy}% • Clicks: {clicks}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}