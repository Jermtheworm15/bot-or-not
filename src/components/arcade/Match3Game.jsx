import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const GRID_SIZE = 8;
const COLORS = ['🔴', '🟢', '🔵', '🟡', '🟣', '🟠'];

export default function Match3Game({ onGameEnd }) {
  const [grid, setGrid] = useState([]);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(30);
  const [gameState, setGameState] = useState('ready');

  useEffect(() => {
    initializeGrid();
  }, []);

  const initializeGrid = () => {
    const newGrid = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      const newRow = [];
      for (let col = 0; col < GRID_SIZE; col++) {
        newRow.push(COLORS[Math.floor(Math.random() * COLORS.length)]);
      }
      newGrid.push(newRow);
    }
    setGrid(newGrid);
  };

  const handleCellClick = (row, col) => {
    if (gameState !== 'playing') return;

    if (!selected) {
      setSelected({ row, col });
    } else {
      const isAdjacent = 
        (Math.abs(selected.row - row) === 1 && selected.col === col) ||
        (Math.abs(selected.col - col) === 1 && selected.row === row);

      if (isAdjacent) {
        swapAndCheck(selected.row, selected.col, row, col);
        setMoves(m => m - 1);
      }
      setSelected(null);
    }
  };

  const swapAndCheck = (r1, c1, r2, c2) => {
    const newGrid = grid.map(row => [...row]);
    [newGrid[r1][c1], newGrid[r2][c2]] = [newGrid[r2][c2], newGrid[r1][c1]];
    
    const matches = findMatches(newGrid);
    if (matches.length > 0) {
      setScore(s => s + matches.length * 10);
      removeMatches(newGrid, matches);
    } else {
      // Swap back if no matches
      [newGrid[r1][c1], newGrid[r2][c2]] = [newGrid[r2][c2], newGrid[r1][c1]];
    }
    
    setGrid(newGrid);
  };

  const findMatches = (currentGrid) => {
    const matches = new Set();

    // Check horizontal
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE - 2; col++) {
        if (
          currentGrid[row][col] === currentGrid[row][col + 1] &&
          currentGrid[row][col] === currentGrid[row][col + 2]
        ) {
          matches.add(`${row},${col}`);
          matches.add(`${row},${col + 1}`);
          matches.add(`${row},${col + 2}`);
        }
      }
    }

    // Check vertical
    for (let col = 0; col < GRID_SIZE; col++) {
      for (let row = 0; row < GRID_SIZE - 2; row++) {
        if (
          currentGrid[row][col] === currentGrid[row + 1][col] &&
          currentGrid[row][col] === currentGrid[row + 2][col]
        ) {
          matches.add(`${row},${col}`);
          matches.add(`${row + 1},${col}`);
          matches.add(`${row + 2},${col}`);
        }
      }
    }

    return Array.from(matches).map(m => {
      const [r, c] = m.split(',').map(Number);
      return { row: r, col: c };
    });
  };

  const removeMatches = (currentGrid, matches) => {
    matches.forEach(({ row, col }) => {
      currentGrid[row][col] = null;
    });

    // Drop gems down
    for (let col = 0; col < GRID_SIZE; col++) {
      let emptyRow = GRID_SIZE - 1;
      for (let row = GRID_SIZE - 1; row >= 0; row--) {
        if (currentGrid[row][col] !== null) {
          if (row !== emptyRow) {
            currentGrid[emptyRow][col] = currentGrid[row][col];
            currentGrid[row][col] = null;
          }
          emptyRow--;
        }
      }
    }

    // Fill empty spaces
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (currentGrid[row][col] === null) {
          currentGrid[row][col] = COLORS[Math.floor(Math.random() * COLORS.length)];
        }
      }
    }
  };

  useEffect(() => {
    if (moves <= 0 && gameState === 'playing') {
      setGameState('over');
      onGameEnd(score);
    }
  }, [moves]);

  const startGame = () => {
    initializeGrid();
    setScore(0);
    setMoves(30);
    setSelected(null);
    setGameState('playing');
  };

  return (
    <div className="relative">
      <div className="mb-4 flex justify-between items-center">
        <div className="text-xl font-bold text-white">Score: {score}</div>
        <div className="text-xl font-bold text-yellow-400">Moves: {moves}</div>
      </div>

      <div className="bg-black/60 p-4 rounded-lg border-4 border-purple-500/50">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                className={`aspect-square text-3xl flex items-center justify-center rounded transition-all cursor-pointer ${
                  selected?.row === rowIndex && selected?.col === colIndex
                    ? 'bg-yellow-400 scale-110'
                    : 'bg-purple-900/30 hover:bg-purple-800/50'
                }`}
                disabled={gameState !== 'playing'}
              >
                {cell}
              </button>
            ))
          )}
        </div>
      </div>

      {gameState === 'ready' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
          <div className="text-center">
            <div className="text-4xl font-black text-white mb-4">💎 Gem Matcher</div>
            <Button onClick={startGame} className="bg-green-600 hover:bg-green-700">
              Start Game
            </Button>
          </div>
        </div>
      )}

      {gameState === 'over' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg">
          <div className="text-center">
            <div className="text-3xl font-black text-white mb-2">Game Over!</div>
            <div className="text-xl text-yellow-400 mb-6">Score: {score}</div>
            <Button onClick={startGame} className="bg-green-600 hover:bg-green-700">
              Play Again
            </Button>
          </div>
        </div>
      )}

      <div className="text-center mt-4 text-sm text-green-500/80">
        Match 3 or more gems • Swap adjacent gems
      </div>
    </div>
  );
}