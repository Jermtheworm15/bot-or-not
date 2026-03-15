import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Play } from 'lucide-react';

export default function RunnerGame({ onComplete }) {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [playerY, setPlayerY] = useState(50);
  const [obstacles, setObstacles] = useState([]);
  const [velocity, setVelocity] = useState(0);
  const [speed, setSpeed] = useState(5);
  const [obstaclesPassed, setObstaclesPassed] = useState(0);
  
  const animationRef = useRef();
  const startTimeRef = useRef();

  const GRAVITY = 0.8;
  const JUMP_FORCE = -15;
  const PLAYER_SIZE = 40;
  const OBSTACLE_WIDTH = 30;

  useEffect(() => {
    if (gameStarted && !gameOver) {
      animationRef.current = requestAnimationFrame(gameLoop);
      return () => cancelAnimationFrame(animationRef.current);
    }
  }, [gameStarted, gameOver, playerY, velocity, obstacles]);

  const gameLoop = () => {
    // Update player position
    const newVelocity = velocity + GRAVITY;
    const newY = Math.max(0, Math.min(100 - (PLAYER_SIZE / 4), playerY + newVelocity));
    setVelocity(newY === playerY ? 0 : newVelocity);
    setPlayerY(newY);

    // Progressive difficulty
    const currentSpeed = 5 + Math.floor(obstaclesPassed / 5) * 0.5;
    setSpeed(currentSpeed);

    // Update obstacles
    const updatedObstacles = obstacles
      .map(obs => ({ ...obs, x: obs.x - currentSpeed }))
      .filter(obs => {
        if (obs.x < -OBSTACLE_WIDTH && !obs.passed) {
          setObstaclesPassed(prev => prev + 1);
          return false;
        }
        return obs.x > -OBSTACLE_WIDTH;
      });

    // Add new obstacles with varying gaps
    const minGap = Math.max(40, 60 - Math.floor(obstaclesPassed / 10) * 5);
    if (updatedObstacles.length === 0 || updatedObstacles[updatedObstacles.length - 1].x < minGap) {
      updatedObstacles.push({
        x: 100,
        height: 35 + Math.random() * 40,
        passed: false
      });
    }

    setObstacles(updatedObstacles);

    // Check collisions
    const playerLeft = 10;
    const playerRight = playerLeft + PLAYER_SIZE / 4;
    const playerTop = playerY;
    const playerBottom = playerY + PLAYER_SIZE / 4;

    for (const obs of updatedObstacles) {
      const obsLeft = obs.x;
      const obsRight = obs.x + OBSTACLE_WIDTH / 4;
      const obsTop = 100 - obs.height;
      const obsBottom = 100;

      if (
        playerRight > obsLeft &&
        playerLeft < obsRight &&
        playerBottom > obsTop &&
        playerTop < obsBottom
      ) {
        handleGameOver();
        return;
      }
    }

    // Update score
    const duration = (Date.now() - startTimeRef.current) / 1000;
    const distanceScore = Math.round(duration * 10);
    const obstacleBonus = obstaclesPassed * 50;
    setScore(distanceScore + obstacleBonus);

    animationRef.current = requestAnimationFrame(gameLoop);
  };

  const handleJump = () => {
    if (!gameStarted) {
      setGameStarted(true);
      startTimeRef.current = Date.now();
    }
    if (!gameOver && playerY > 0) {
      setVelocity(JUMP_FORCE);
    }
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
        <Play className="w-12 h-12 mx-auto mb-2 text-green-400" />
        <h3 className="text-2xl font-bold text-white">Pixel Runner</h3>
        <div className="text-3xl font-bold text-yellow-400">{score}</div>
        {gameStarted && <div className="text-sm text-green-500/60">Passed: {obstaclesPassed} • Speed: {speed.toFixed(1)}x</div>}
        {!gameStarted && (
          <div className="text-green-400 text-sm mt-2">Tap anywhere to jump!</div>
        )}
      </div>

      <div
        onClick={handleJump}
        onTouchStart={handleJump}
        className="relative w-full h-64 bg-zinc-900 rounded-lg overflow-hidden cursor-pointer"
      >
        {/* Player */}
        <div
          className="absolute bg-green-500 rounded transition-all duration-75"
          style={{
            left: '10%',
            top: `${playerY}%`,
            width: `${PLAYER_SIZE / 4}%`,
            height: `${PLAYER_SIZE / 4}%`,
          }}
        />

        {/* Obstacles */}
        {obstacles.map((obs, index) => (
          <div
            key={index}
            className="absolute bg-red-500 rounded"
            style={{
              left: `${obs.x}%`,
              bottom: 0,
              width: `${OBSTACLE_WIDTH / 4}%`,
              height: `${obs.height}%`,
            }}
          />
        ))}

        {/* Ground */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-500/30" />

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