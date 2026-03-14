import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

export default function FlappyGame({ onGameEnd }) {
  const [gameState, setGameState] = useState('ready'); // ready, playing, over
  const [score, setScore] = useState(0);
  const [birdY, setBirdY] = useState(250);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [pipes, setPipes] = useState([]);
  const animationRef = useRef();
  const gameAreaRef = useRef();

  const GRAVITY = 0.5;
  const JUMP_STRENGTH = -10;
  const PIPE_WIDTH = 60;
  const PIPE_GAP = 150;
  const BIRD_SIZE = 30;

  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      // Update bird position
      setBirdVelocity(v => v + GRAVITY);
      setBirdY(y => {
        const newY = y + birdVelocity;
        
        // Check ground/ceiling collision
        if (newY <= 0 || newY >= 500 - BIRD_SIZE) {
          endGame();
          return y;
        }
        
        return newY;
      });

      // Update pipes
      setPipes(prevPipes => {
        const updated = prevPipes.map(pipe => ({
          ...pipe,
          x: pipe.x - 3
        }));

        // Remove off-screen pipes and add score
        const filtered = updated.filter(pipe => {
          if (pipe.x + PIPE_WIDTH < 0) {
            setScore(s => s + 1);
            return false;
          }
          return true;
        });

        // Add new pipe
        if (filtered.length === 0 || filtered[filtered.length - 1].x < 400) {
          const gap = Math.random() * 200 + 100;
          filtered.push({
            x: 600,
            gapY: gap,
            passed: false
          });
        }

        // Check pipe collision
        filtered.forEach(pipe => {
          const birdX = 100;
          if (
            birdX + BIRD_SIZE > pipe.x &&
            birdX < pipe.x + PIPE_WIDTH &&
            (birdY < pipe.gapY || birdY + BIRD_SIZE > pipe.gapY + PIPE_GAP)
          ) {
            endGame();
          }
        });

        return filtered;
      });

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationRef.current);
  }, [gameState, birdVelocity, birdY]);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setBirdY(250);
    setBirdVelocity(0);
    setPipes([{
      x: 600,
      gapY: 200,
      passed: false
    }]);
  };

  const jump = () => {
    if (gameState === 'ready') {
      startGame();
    }
    if (gameState === 'playing') {
      setBirdVelocity(JUMP_STRENGTH);
    }
  };

  const endGame = () => {
    setGameState('over');
    cancelAnimationFrame(animationRef.current);
    onGameEnd(score);
  };

  return (
    <div className="relative">
      <div 
        ref={gameAreaRef}
        className="relative w-full h-[500px] bg-gradient-to-b from-sky-400 to-sky-300 rounded-lg overflow-hidden border-4 border-purple-500/50 cursor-pointer"
        onClick={jump}
        onTouchStart={jump}
      >
        {/* Bird */}
        <div
          className="absolute w-8 h-8 bg-yellow-400 rounded-full transition-transform"
          style={{
            left: '100px',
            top: `${birdY}px`,
            transform: `rotate(${Math.min(birdVelocity * 3, 45)}deg)`
          }}
        >
          <div className="absolute top-1 left-1 w-2 h-2 bg-black rounded-full" />
        </div>

        {/* Pipes */}
        {pipes.map((pipe, i) => (
          <div key={i}>
            {/* Top pipe */}
            <div
              className="absolute bg-green-600 border-4 border-green-700"
              style={{
                left: `${pipe.x}px`,
                top: 0,
                width: `${PIPE_WIDTH}px`,
                height: `${pipe.gapY}px`
              }}
            />
            {/* Bottom pipe */}
            <div
              className="absolute bg-green-600 border-4 border-green-700"
              style={{
                left: `${pipe.x}px`,
                top: `${pipe.gapY + PIPE_GAP}px`,
                width: `${PIPE_WIDTH}px`,
                height: `${500 - pipe.gapY - PIPE_GAP}px`
              }}
            />
          </div>
        ))}

        {/* Score */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-4xl font-black text-white drop-shadow-lg">
          {score}
        </div>

        {/* Start/Game Over Overlays */}
        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-black text-white mb-4">🐦 Flappy Challenge</div>
              <div className="text-xl text-white mb-6">Tap to start!</div>
            </div>
          </div>
        )}

        {gameState === 'over' && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-black text-white mb-2">Game Over!</div>
              <div className="text-xl text-yellow-400 mb-6">Score: {score}</div>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  startGame();
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                Play Again
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="text-center mt-4 text-sm text-green-500/80">
        Tap or click to flap • Navigate through pipes
      </div>
    </div>
  );
}