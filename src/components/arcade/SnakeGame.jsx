import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gamepad2 } from 'lucide-react';

const GRID_SIZE = 20;
const CELL_SIZE = 100 / GRID_SIZE;

export default function SnakeGame({ onComplete }) {
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 15, y: 15 });
  const [direction, setDirection] = useState({ x: 1, y: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  
  const directionRef = useRef(direction);
  const gameLoopRef = useRef();

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      gameLoopRef.current = setInterval(moveSnake, 150);
      return () => clearInterval(gameLoopRef.current);
    }
  }, [gameStarted, gameOver, snake]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!gameStarted || gameOver) return;
      
      const dir = directionRef.current;
      switch (e.key) {
        case 'ArrowUp':
          if (dir.y === 0) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
          if (dir.y === 0) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
          if (dir.x === 0) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
          if (dir.x === 0) setDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted, gameOver]);

  const moveSnake = () => {
    setSnake(prev => {
      const head = prev[0];
      const newHead = {
        x: head.x + directionRef.current.x,
        y: head.y + directionRef.current.y
      };

      // Check wall collision
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        handleGameOver();
        return prev;
      }

      // Check self collision
      if (prev.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        handleGameOver();
        return prev;
      }

      const newSnake = [newHead, ...prev];

      // Check food collision
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        generateFood(newSnake);
        return newSnake;
      }

      newSnake.pop();
      return newSnake;
    });
  };

  const generateFood = (currentSnake) => {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
    } while (currentSnake.some(s => s.x === newFood.x && s.y === newFood.y));
    
    setFood(newFood);
  };

  const handleGameOver = () => {
    setGameOver(true);
    clearInterval(gameLoopRef.current);
    setTimeout(() => {
      onComplete(score, { length: snake.length });
    }, 1000);
  };

  const handleStart = () => {
    setGameStarted(true);
    setSnake([{ x: 10, y: 10 }]);
    setDirection({ x: 1, y: 0 });
    setScore(0);
    setGameOver(false);
    generateFood([{ x: 10, y: 10 }]);
  };

  const handleDirectionClick = (newDir) => {
    const dir = directionRef.current;
    if (newDir.x !== 0 && dir.x === 0) setDirection(newDir);
    if (newDir.y !== 0 && dir.y === 0) setDirection(newDir);
  };

  return (
    <Card className="bg-black/80 border-purple-500/30 p-8 max-w-2xl w-full">
      <div className="text-center mb-4">
        <Gamepad2 className="w-12 h-12 mx-auto mb-2 text-green-400" />
        <h3 className="text-2xl font-bold text-white">Pixel Snake</h3>
        <div className="text-3xl font-bold text-yellow-400">{score}</div>
      </div>

      {!gameStarted ? (
        <div 
          onClick={handleStart}
          className="w-full aspect-square bg-zinc-900 rounded-lg flex items-center justify-center cursor-pointer hover:bg-zinc-800"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-2">Click to Start!</div>
            <div className="text-green-400">Use arrow keys or buttons</div>
          </div>
        </div>
      ) : (
        <>
          <div className="relative w-full aspect-square bg-zinc-900 rounded-lg overflow-hidden mb-4">
            {/* Snake */}
            {snake.map((segment, index) => (
              <div
                key={index}
                className="absolute bg-green-500 rounded-sm"
                style={{
                  left: `${segment.x * CELL_SIZE}%`,
                  top: `${segment.y * CELL_SIZE}%`,
                  width: `${CELL_SIZE}%`,
                  height: `${CELL_SIZE}%`
                }}
              />
            ))}

            {/* Food */}
            <div
              className="absolute bg-red-500 rounded-full"
              style={{
                left: `${food.x * CELL_SIZE}%`,
                top: `${food.y * CELL_SIZE}%`,
                width: `${CELL_SIZE}%`,
                height: `${CELL_SIZE}%`
              }}
            />

            {gameOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center">
                  <div className="text-4xl font-bold text-red-400 mb-2">Game Over!</div>
                  <div className="text-2xl text-yellow-400">Score: {score}</div>
                </div>
              </div>
            )}
          </div>

          {/* Touch Controls */}
          <div className="grid grid-cols-3 gap-2">
            <div></div>
            <Button
              onClick={() => handleDirectionClick({ x: 0, y: -1 })}
              className="bg-purple-600 hover:bg-purple-700 cursor-pointer"
            >
              ↑
            </Button>
            <div></div>
            <Button
              onClick={() => handleDirectionClick({ x: -1, y: 0 })}
              className="bg-purple-600 hover:bg-purple-700 cursor-pointer"
            >
              ←
            </Button>
            <div></div>
            <Button
              onClick={() => handleDirectionClick({ x: 1, y: 0 })}
              className="bg-purple-600 hover:bg-purple-700 cursor-pointer"
            >
              →
            </Button>
            <div></div>
            <Button
              onClick={() => handleDirectionClick({ x: 0, y: 1 })}
              className="bg-purple-600 hover:bg-purple-700 cursor-pointer"
            >
              ↓
            </Button>
            <div></div>
          </div>
        </>
      )}
    </Card>
  );
}