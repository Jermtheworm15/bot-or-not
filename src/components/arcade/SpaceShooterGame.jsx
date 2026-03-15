import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';

export default function SpaceShooterGame({ onComplete }) {
  const [playerX, setPlayerX] = useState(50);
  const [bullets, setBullets] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(3);
  const [wave, setWave] = useState(1);

  const keysPressed = useRef({});
  const animationRef = useRef();

  useEffect(() => {
    spawnWave(wave);

    const handleKeyDown = (e) => {
      keysPressed.current[e.key] = true;
      if (e.key === ' ') {
        setBullets(prev => [...prev, { x: playerX, y: 85, id: Date.now() }]);
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
  }, [wave]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationRef.current);
  }, [playerX, bullets, enemies, health]);

  const spawnWave = (w) => {
    const count = 3 + w * 2;
    const newEnemies = Array.from({ length: count }, (_, i) => ({
      x: (i * 15) % 90 + 5,
      y: -10 - (Math.floor(i / 6) * 15),
      id: Date.now() + i,
      speed: 1 + w * 0.3,
    }));
    setEnemies(newEnemies);
  };

  const gameLoop = () => {
    if (keysPressed.current['ArrowLeft']) setPlayerX(prev => Math.max(5, prev - 3));
    if (keysPressed.current['ArrowRight']) setPlayerX(prev => Math.min(95, prev + 3));

    setBullets(prev => prev
      .map(b => ({ ...b, y: b.y - 5 }))
      .filter(b => b.y > 0)
    );

    setEnemies(prev => {
      let updatedEnemies = prev.map(e => ({ ...e, y: e.y + e.speed }));

      bullets.forEach(bullet => {
        const hitIndex = updatedEnemies.findIndex(e =>
          Math.abs(e.x - bullet.x) < 5 && Math.abs(e.y - bullet.y) < 5
        );
        if (hitIndex !== -1) {
          updatedEnemies = updatedEnemies.filter((_, i) => i !== hitIndex);
          setBullets(b => b.filter(bu => bu.id !== bullet.id));
          setScore(s => s + 100);
        }
      });

      const hitPlayer = updatedEnemies.find(e => e.y > 80 && Math.abs(e.x - playerX) < 5);
      if (hitPlayer) {
        setHealth(h => h - 1);
        updatedEnemies = updatedEnemies.filter(e => e.id !== hitPlayer.id);
      }

      return updatedEnemies.filter(e => e.y < 100);
    });

    if (health <= 0) {
      onComplete(score, { wave, enemiesDestroyed: score / 100 });
      return;
    }

    if (enemies.length === 0 && bullets.length === 0) {
      setWave(w => w + 1);
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  };

  return (
    <Card className="bg-black/80 border-purple-500/30 p-8 max-w-2xl w-full">
      <div className="text-center mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="text-red-400">❤️ {health}</div>
          <div className="text-yellow-400 text-2xl font-bold">{score}</div>
          <div className="text-purple-400">Wave {wave}</div>
        </div>
        <div className="text-sm text-green-500/60">Arrow Keys • Space to Shoot</div>
      </div>

      <div className="relative w-full h-96 bg-gradient-to-b from-indigo-950 to-black rounded-lg overflow-hidden">
        <div
          className="absolute bg-blue-400 rounded-t-lg"
          style={{
            left: `${playerX - 2.5}%`,
            bottom: '5%',
            width: '5%',
            height: '8%',
          }}
        />

        {bullets.map(bullet => (
          <div
            key={bullet.id}
            className="absolute bg-yellow-300 rounded-full"
            style={{
              left: `${bullet.x}%`,
              top: `${bullet.y}%`,
              width: '1%',
              height: '2%',
            }}
          />
        ))}

        {enemies.map(enemy => (
          <div
            key={enemy.id}
            className="absolute bg-red-500 rounded"
            style={{
              left: `${enemy.x}%`,
              top: `${enemy.y}%`,
              width: '5%',
              height: '5%',
            }}
          />
        ))}

        {health <= 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center">
              <div className="text-4xl font-bold text-red-400 mb-2">Game Over!</div>
              <div className="text-2xl text-yellow-400">Wave {wave} • Score: {score}</div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}