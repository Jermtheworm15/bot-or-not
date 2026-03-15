import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';

export default function PlatformerGame({ onComplete }) {
  const [gameState, setGameState] = useState('playing');
  const [playerX, setPlayerX] = useState(10);
  const [playerY, setPlayerY] = useState(70);
  const [velocityY, setVelocityY] = useState(0);
  const [platforms, setPlatforms] = useState([]);
  const [coins, setCoins] = useState([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [coinsCollected, setCoinsCollected] = useState(0);
  
  const keysPressed = useRef({});
  const animationRef = useRef();

  const GRAVITY = 0.6;
  const JUMP_FORCE = -12;
  const MOVE_SPEED = 3;
  const PLAYER_SIZE = 8;

  useEffect(() => {
    initLevel(level);
    
    const handleKeyDown = (e) => {
      keysPressed.current[e.key] = true;
      if (e.key === ' ' && playerY >= platforms.find(p => 
        playerX + PLAYER_SIZE > p.x && 
        playerX < p.x + p.width && 
        Math.abs(playerY + PLAYER_SIZE - p.y) < 2
      )) {
        setVelocityY(JUMP_FORCE);
      }
    };
    
    const handleKeyUp = (e) => {
      keysPressed.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [level]);

  useEffect(() => {
    if (gameState === 'playing') {
      animationRef.current = requestAnimationFrame(gameLoop);
      return () => cancelAnimationFrame(animationRef.current);
    }
  }, [gameState, playerX, playerY, velocityY, coins]);

  const initLevel = (lvl) => {
    const newPlatforms = [
      { x: 0, y: 90, width: 100, height: 10 },
      { x: 20, y: 70, width: 15, height: 5 },
      { x: 45, y: 55, width: 20, height: 5 },
      { x: 70, y: 40, width: 25, height: 5 },
    ];

    const newCoins = [
      { x: 25, y: 60, collected: false },
      { x: 50, y: 45, collected: false },
      { x: 75, y: 30, collected: false },
      { x: 85, y: 30, collected: false },
    ];

    setPlatforms(newPlatforms);
    setCoins(newCoins);
    setPlayerX(10);
    setPlayerY(70);
    setVelocityY(0);
  };

  const gameLoop = () => {
    let newX = playerX;
    let newY = playerY;
    let newVelY = velocityY + GRAVITY;

    if (keysPressed.current['ArrowLeft']) newX = Math.max(0, playerX - MOVE_SPEED);
    if (keysPressed.current['ArrowRight']) newX = Math.min(100 - PLAYER_SIZE, playerX + MOVE_SPEED);

    newY += newVelY;

    let onGround = false;
    platforms.forEach(platform => {
      if (
        newX + PLAYER_SIZE > platform.x &&
        newX < platform.x + platform.width &&
        newY + PLAYER_SIZE >= platform.y &&
        playerY + PLAYER_SIZE <= platform.y
      ) {
        newY = platform.y - PLAYER_SIZE;
        newVelY = 0;
        onGround = true;
      }
    });

    coins.forEach((coin, idx) => {
      if (
        !coin.collected &&
        newX + PLAYER_SIZE > coin.x &&
        newX < coin.x + 4 &&
        newY + PLAYER_SIZE > coin.y &&
        newY < coin.y + 4
      ) {
        setCoins(prev => prev.map((c, i) => i === idx ? { ...c, collected: true } : c));
        setScore(prev => prev + 100);
        setCoinsCollected(prev => prev + 1);
      }
    });

    if (newY > 100) {
      setGameState('lost');
      setTimeout(() => onComplete(score, { level, coinsCollected }), 1500);
      return;
    }

    if (coinsCollected >= coins.length - 1 && !coins.every(c => c.collected)) {
      const allCollected = coins.filter((c, i) => 
        !c.collected &&
        newX + PLAYER_SIZE > c.x &&
        newX < c.x + 4 &&
        newY + PLAYER_SIZE > c.y &&
        newY < c.y + 4
      ).length > 0;

      if (allCollected || coins.every(c => c.collected)) {
        setGameState('won');
        setTimeout(() => onComplete(score + 500, { level, coinsCollected: coins.length }), 1500);
        return;
      }
    }

    setPlayerX(newX);
    setPlayerY(newY);
    setVelocityY(newVelY);

    animationRef.current = requestAnimationFrame(gameLoop);
  };

  return (
    <Card className="bg-black/80 border-purple-500/30 p-8 max-w-2xl w-full">
      <div className="text-center mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="text-green-400">Level {level}</div>
          <div className="text-yellow-400 text-2xl font-bold">{score}</div>
          <div className="text-blue-400">Coins: {coinsCollected}/{coins.length}</div>
        </div>
        <div className="text-sm text-green-500/60">Arrow Keys to Move • Space to Jump</div>
      </div>

      <div className="relative w-full h-96 bg-gradient-to-b from-blue-900/30 to-green-900/30 rounded-lg overflow-hidden">
        {platforms.map((platform, idx) => (
          <div
            key={idx}
            className="absolute bg-green-700"
            style={{
              left: `${platform.x}%`,
              top: `${platform.y}%`,
              width: `${platform.width}%`,
              height: `${platform.height}%`,
            }}
          />
        ))}

        {coins.map((coin, idx) => !coin.collected && (
          <div
            key={idx}
            className="absolute bg-yellow-400 rounded-full animate-pulse"
            style={{
              left: `${coin.x}%`,
              top: `${coin.y}%`,
              width: '4%',
              height: '4%',
            }}
          />
        ))}

        <div
          className="absolute bg-blue-500 rounded"
          style={{
            left: `${playerX}%`,
            top: `${playerY}%`,
            width: `${PLAYER_SIZE}%`,
            height: `${PLAYER_SIZE}%`,
          }}
        />

        {gameState === 'won' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">Level Complete!</div>
              <div className="text-2xl text-yellow-400">+500 Bonus</div>
            </div>
          </div>
        )}

        {gameState === 'lost' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center">
              <div className="text-4xl font-bold text-red-400">Game Over!</div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}