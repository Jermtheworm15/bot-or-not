import React, { useState, useEffect, useRef } from 'react';

export default function BreakoutGame({ onGameEnd }) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('ready');
  const animationRef = useRef();
  const gameRef = useRef({
    paddle: { x: 250, y: 470, width: 100, height: 15 },
    ball: { x: 300, y: 450, dx: 3, dy: -3, radius: 8 },
    bricks: [],
    lives: 3
  });

  useEffect(() => {
    initBricks();
  }, []);

  const initBricks = () => {
    const bricks = [];
    const rows = 5;
    const cols = 8;
    const brickWidth = 70;
    const brickHeight = 25;
    const padding = 5;
    const offsetX = 20;
    const offsetY = 40;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        bricks.push({
          x: offsetX + col * (brickWidth + padding),
          y: offsetY + row * (brickHeight + padding),
          width: brickWidth,
          height: brickHeight,
          color: `hsl(${row * 50}, 70%, 60%)`,
          active: true
        });
      }
    }
    gameRef.current.bricks = bricks;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const game = gameRef.current;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      game.paddle.x = Math.max(0, Math.min(x - game.paddle.width / 2, 600 - game.paddle.width));
    };

    const handleTouchMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      game.paddle.x = Math.max(0, Math.min(x - game.paddle.width / 2, 600 - game.paddle.width));
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove);

    const gameLoop = () => {
      if (gameState !== 'playing') return;

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 600, 500);

      // Draw bricks
      game.bricks.forEach(brick => {
        if (brick.active) {
          ctx.fillStyle = brick.color;
          ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
          ctx.strokeStyle = '#000';
          ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
        }
      });

      // Draw paddle
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(game.paddle.x, game.paddle.y, game.paddle.width, game.paddle.height);

      // Draw ball
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(game.ball.x, game.ball.y, game.ball.radius, 0, Math.PI * 2);
      ctx.fill();

      // Move ball
      game.ball.x += game.ball.dx;
      game.ball.y += game.ball.dy;

      // Wall collision
      if (game.ball.x + game.ball.radius > 600 || game.ball.x - game.ball.radius < 0) {
        game.ball.dx = -game.ball.dx;
      }
      if (game.ball.y - game.ball.radius < 0) {
        game.ball.dy = -game.ball.dy;
      }

      // Paddle collision
      if (
        game.ball.y + game.ball.radius > game.paddle.y &&
        game.ball.x > game.paddle.x &&
        game.ball.x < game.paddle.x + game.paddle.width
      ) {
        game.ball.dy = -Math.abs(game.ball.dy);
        const hitPos = (game.ball.x - game.paddle.x) / game.paddle.width;
        game.ball.dx = (hitPos - 0.5) * 8;
      }

      // Brick collision
      game.bricks.forEach(brick => {
        if (brick.active) {
          if (
            game.ball.x > brick.x &&
            game.ball.x < brick.x + brick.width &&
            game.ball.y > brick.y &&
            game.ball.y < brick.y + brick.height
          ) {
            game.ball.dy = -game.ball.dy;
            brick.active = false;
            setScore(s => s + 10);
          }
        }
      });

      // Check win
      if (game.bricks.every(b => !b.active)) {
        setGameState('won');
        onGameEnd(score + 100);
        return;
      }

      // Bottom collision (lose life)
      if (game.ball.y + game.ball.radius > 500) {
        game.lives--;
        if (game.lives <= 0) {
          setGameState('over');
          onGameEnd(score);
        } else {
          game.ball.x = 300;
          game.ball.y = 450;
          game.ball.dx = 3;
          game.ball.dy = -3;
        }
      }

      // Draw lives
      ctx.fillStyle = '#22c55e';
      ctx.font = '16px Orbitron';
      ctx.fillText(`Lives: ${game.lives}`, 10, 20);
      ctx.fillText(`Score: ${score}`, 500, 20);

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    if (gameState === 'playing') {
      animationRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(animationRef.current);
    };
  }, [gameState, score]);

  const startGame = () => {
    initBricks();
    setScore(0);
    gameRef.current.lives = 3;
    gameRef.current.ball = { x: 300, y: 450, dx: 3, dy: -3, radius: 8 };
    setGameState('playing');
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={600}
        height={500}
        className="border-4 border-purple-500/50 rounded-lg bg-black mx-auto"
      />

      {gameState === 'ready' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
          <div className="text-center">
            <div className="text-4xl font-black text-white mb-4">🧱 Brick Breaker</div>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg cursor-pointer"
            >
              Start Game
            </button>
          </div>
        </div>
      )}

      {(gameState === 'over' || gameState === 'won') && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg">
          <div className="text-center">
            <div className="text-3xl font-black text-white mb-2">
              {gameState === 'won' ? '🎉 You Won!' : 'Game Over'}
            </div>
            <div className="text-xl text-yellow-400 mb-6">Score: {score}</div>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg cursor-pointer"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      <div className="text-center mt-4 text-sm text-green-500/80">
        Move mouse or touch to control paddle • Break all bricks
      </div>
    </div>
  );
}