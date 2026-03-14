import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Target } from 'lucide-react';

export default function DodgeGame({ onComplete }) {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [playerX, setPlayerX] = useState(50);
  const [enemies, setEnemies] = useState([]);
  
  const animationRef = useRef();
  const startTimeRef = useRef();
  const touchStartRef = useRef(null);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      animationRef.current = requestAnimationFrame(gameLoop);
      return () => cancelAnimationFrame(animationRef.current);
    }
  }, [gameStarted, gameOver, playerX, enemies]);

  const gameLoop = () => {
    // Update enemies
    const updatedEnemies = enemies
      .map(enemy => ({ ...enemy, y: enemy.y + enemy.speed }))
      .filter(enemy => enemy.y < 100);

    // Add new enemies
    if (Math.random() < 0.03) {
      updatedEnemies.push({
        x: Math.random() * 90,
        y: -5,
        speed: 0.5 + Math.random() * 1.5,
        size: 8 + Math.random() * 8
      });
    }

    setEnemies(updatedEnemies);

    // Check collisions
    const playerSize = 8;
    for (const enemy of updatedEnemies) {
      const dx = Math.abs(playerX - enemy.x);
      const dy = Math.abs(85 - enemy.y);
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < (playerSize + enemy.size) / 2) {
        handleGameOver();
        return;
      }
    }

    // Update score
    const duration = (Date.now() - startTimeRef.current) / 1000;
    setScore(Math.round(duration * 20));

    animationRef.current = requestAnimationFrame(gameLoop);
  };

  const handleMouseMove = (e) => {
    if (!gameStarted) {
      setGameStarted(true);
      startTimeRef.current = Date.now();
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setPlayerX(Math.max(5, Math.min(95, x)));
  };

  const handleTouchMove = (e) => {
    if (!gameStarted) {
      setGameStarted(true);
      startTimeRef.current = Date.now();
    }
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    setPlayerX(Math.max(5, Math.min(95, x)));
  };

  const handleGameOver = () => {
    setGameOver(true);
    cancelAnimationFrame(animationRef.current);
    
    setTimeout(() => {
      const duration = (Date.now() - startTimeRef.current) / 1000;
      onComplete(score, { duration });
    }, 1000);
  };

  return (
    <Card className="bg-black/80 border-purple-500/30 p-8 max-w-2xl w-full">
      <div className="text-center mb-4">
        <Target className="w-12 h-12 mx-auto mb-2 text-red-400" />
        <h3 className="text-2xl font-bold text-white">Dodge Master</h3>
        <div className="text-3xl font-bold text-yellow-400">{score}</div>
        {!gameStarted && (
          <div className="text-green-400 text-sm mt-2">Move to start!</div>
        )}
      </div>

      <div
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        className="relative w-full h-96 bg-zinc-900 rounded-lg overflow-hidden cursor-none"
      >
        {/* Player */}
        <div
          className="absolute bg-green-500 rounded-full transition-all duration-100"
          style={{
            left: `${playerX}%`,
            bottom: '15%',
            width: '8%',
            height: '8%',
            transform: 'translate(-50%, 50%)'
          }}
        />

        {/* Enemies */}
        {enemies.map((enemy, index) => (
          <div
            key={index}
            className="absolute bg-red-500 rounded-full"
            style={{
              left: `${enemy.x}%`,
              top: `${enemy.y}%`,
              width: `${enemy.size}%`,
              height: `${enemy.size}%`,
              transform: 'translate(-50%, -50%)'
            }}
          />
        ))}

        {gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center">
              <div className="text-4xl font-bold text-red-400 mb-2">Game Over!</div>
              <div className="text-2xl text-yellow-400">Score: {score}</div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}