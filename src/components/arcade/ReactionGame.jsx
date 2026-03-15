import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';

export default function ReactionGame({ onComplete }) {
  const [gameState, setGameState] = useState('waiting'); // waiting, ready, clicked, tooEarly
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [reactionTime, setReactionTime] = useState(null);
  const [totalTime, setTotalTime] = useState(0);
  const [bestTime, setBestTime] = useState(null);
  const [combo, setCombo] = useState(0);
  
  const startTimeRef = useRef(null);
  const timeoutRef = useRef(null);

  const MAX_ROUNDS = 10;

  useEffect(() => {
    if (round < MAX_ROUNDS && gameState === 'waiting') {
      startRound();
    } else if (round >= MAX_ROUNDS) {
      const avgReaction = totalTime / MAX_ROUNDS;
      const finalScore = Math.max(0, Math.round(5000 - avgReaction));
      onComplete(finalScore, { avgReaction, rounds: MAX_ROUNDS });
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [round, gameState]);

  const startRound = () => {
    setGameState('waiting');
    setReactionTime(null);
    
    const delay = 1000 + Math.random() * 3000;
    timeoutRef.current = setTimeout(() => {
      setGameState('ready');
      startTimeRef.current = Date.now();
    }, delay);
  };

  const handleClick = () => {
    if (gameState === 'waiting') {
      setGameState('tooEarly');
      setCombo(0);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setTimeout(() => {
        setRound(prev => prev + 1);
      }, 1000);
    } else if (gameState === 'ready') {
      const time = Date.now() - startTimeRef.current;
      setReactionTime(time);
      setTotalTime(prev => prev + time);
      setGameState('clicked');
      
      if (!bestTime || time < bestTime) {
        setBestTime(time);
      }
      
      const basePoints = Math.max(0, 1000 - time);
      const newCombo = time < 250 ? combo + 1 : 0;
      setCombo(newCombo);
      const comboBonus = newCombo * 100;
      const points = basePoints + comboBonus;
      setScore(prev => prev + points);
      
      setTimeout(() => {
        setRound(prev => prev + 1);
      }, 800);
    }
  };

  return (
    <Card className="bg-black/80 border-purple-500/30 p-8 max-w-2xl w-full">
      <div className="text-center mb-6">
        <Zap className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
        <h3 className="text-2xl font-bold text-white mb-2">Reaction Test</h3>
        <div className="flex justify-between items-center mb-2">
          <div className="text-green-400">Round {round + 1}/{MAX_ROUNDS}</div>
          {combo > 0 && <div className="text-orange-400 font-bold">🔥 {combo}x Combo!</div>}
        </div>
        <div className="text-3xl font-bold text-yellow-400">{score}</div>
        {bestTime && <div className="text-sm text-green-500/60 mt-1">Best: {bestTime}ms</div>}
      </div>

      <div
        onClick={handleClick}
        className={`
          w-full aspect-square rounded-lg cursor-pointer transition-all duration-200
          flex items-center justify-center text-2xl font-bold
          ${gameState === 'waiting' ? 'bg-red-600 hover:bg-red-700' : ''}
          ${gameState === 'ready' ? 'bg-green-600 hover:bg-green-700 scale-110' : ''}
          ${gameState === 'clicked' ? 'bg-blue-600' : ''}
          ${gameState === 'tooEarly' ? 'bg-orange-600' : ''}
        `}
      >
        {gameState === 'waiting' && <div className="text-white">Wait...</div>}
        {gameState === 'ready' && <div className="text-white animate-pulse">CLICK NOW!</div>}
        {gameState === 'clicked' && (
          <div className="text-white">
            {reactionTime}ms
            <div className="text-sm">+{Math.max(0, 1000 - reactionTime)} pts</div>
            {combo > 0 && <div className="text-xs text-orange-400 mt-1">+{combo * 100} combo!</div>}
          </div>
        )}
        {gameState === 'tooEarly' && <div className="text-white">Too Early!</div>}
      </div>
    </Card>
  );
}