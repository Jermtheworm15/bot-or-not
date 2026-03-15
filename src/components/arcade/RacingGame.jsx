import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';

export default function RacingGame({ onComplete }) {
  const [playerX, setPlayerX] = useState(50);
  const [cars, setCars] = useState([]);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(5);
  const [crashed, setCrashed] = useState(false);

  const keysPressed = useRef({});
  const animationRef = useRef();

  useEffect(() => {
    const handleKeyDown = (e) => { keysPressed.current[e.key] = true; };
    const handleKeyUp = (e) => { keysPressed.current[e.key] = false; };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!crashed) {
      animationRef.current = requestAnimationFrame(gameLoop);
      return () => cancelAnimationFrame(animationRef.current);
    }
  }, [playerX, cars, speed, crashed]);

  const gameLoop = () => {
    if (keysPressed.current['ArrowLeft']) setPlayerX(prev => Math.max(30, prev - 4));
    if (keysPressed.current['ArrowRight']) setPlayerX(prev => Math.min(70, prev + 4));

    setDistance(prev => prev + speed);
    setSpeed(prev => Math.min(12, prev + 0.01));

    setCars(prev => {
      let updated = prev
        .map(car => ({ ...car, y: car.y + speed }))
        .filter(car => car.y < 100);

      if (updated.length < 3 && Math.random() < 0.05) {
        updated.push({
          x: 30 + Math.random() * 40,
          y: -10,
          id: Date.now(),
        });
      }

      const collision = updated.find(car =>
        Math.abs(car.x - playerX) < 8 && car.y > 70 && car.y < 90
      );

      if (collision) {
        setCrashed(true);
        setTimeout(() => {
          onComplete(Math.round(distance), { distance, speed: speed.toFixed(1) });
        }, 1500);
      }

      return updated;
    });

    if (!crashed) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  };

  return (
    <Card className="bg-black/80 border-purple-500/30 p-8 max-w-2xl w-full">
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold text-white mb-2">Retro Racer</h3>
        <div className="flex justify-between items-center">
          <div className="text-blue-400">Speed: {speed.toFixed(1)}</div>
          <div className="text-yellow-400 text-2xl font-bold">{Math.round(distance)}</div>
        </div>
        <div className="text-sm text-green-500/60 mt-1">Arrow Keys to Steer</div>
      </div>

      <div className="relative w-full h-96 bg-zinc-800 rounded-lg overflow-hidden">
        <div className="absolute left-[28%] top-0 bottom-0 w-1 bg-white/20" />
        <div className="absolute left-[48%] top-0 bottom-0 w-1 bg-white/20" />
        <div className="absolute left-[68%] top-0 bottom-0 w-1 bg-white/20" />

        <div
          className="absolute bg-red-600 rounded"
          style={{
            left: `${playerX - 4}%`,
            bottom: '10%',
            width: '8%',
            height: '12%',
          }}
        />

        {cars.map(car => (
          <div
            key={car.id}
            className="absolute bg-blue-600 rounded"
            style={{
              left: `${car.x - 4}%`,
              top: `${car.y}%`,
              width: '8%',
              height: '12%',
            }}
          />
        ))}

        {crashed && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center">
              <div className="text-4xl font-bold text-red-400 mb-2">Crashed!</div>
              <div className="text-2xl text-yellow-400">Distance: {Math.round(distance)}</div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}