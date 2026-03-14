import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Keyboard } from 'lucide-react';

const WORDS = [
  'speed', 'quick', 'flash', 'rapid', 'swift', 'hasty', 'brisk', 'nimble',
  'react', 'focus', 'think', 'boost', 'power', 'surge', 'force', 'energy',
  'pixel', 'retro', 'arcade', 'game', 'score', 'level', 'combo', 'bonus',
  'cyber', 'neon', 'glow', 'bright', 'shine', 'spark', 'blaze', 'flame'
];

export default function TypingGame({ onComplete }) {
  const [score, setScore] = useState(0);
  const [currentWord, setCurrentWord] = useState('');
  const [userInput, setUserInput] = useState('');
  const [wordsTyped, setWordsTyped] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameStarted, setGameStarted] = useState(false);
  
  const inputRef = useRef();
  const startTimeRef = useRef();

  useEffect(() => {
    if (gameStarted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      const wpm = Math.round((wordsTyped / 60) * 60);
      onComplete(score, { wordsTyped, wpm });
    }
  }, [gameStarted, timeLeft]);

  useEffect(() => {
    if (gameStarted && !currentWord) {
      generateNewWord();
    }
  }, [gameStarted, currentWord]);

  const generateNewWord = () => {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    setCurrentWord(word);
    setUserInput('');
  };

  const handleStart = () => {
    setGameStarted(true);
    startTimeRef.current = Date.now();
    generateNewWord();
    inputRef.current?.focus();
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setUserInput(value);

    if (value === currentWord) {
      const points = currentWord.length * 10;
      setScore(prev => prev + points);
      setWordsTyped(prev => prev + 1);
      generateNewWord();
    }
  };

  return (
    <Card className="bg-black/80 border-purple-500/30 p-8 max-w-2xl w-full">
      <div className="text-center mb-6">
        <Keyboard className="w-12 h-12 mx-auto mb-4 text-blue-400" />
        <h3 className="text-2xl font-bold text-white mb-2">Type Racer</h3>
        {gameStarted && (
          <div className="flex justify-between items-center mb-4">
            <div className="text-2xl font-bold text-yellow-400">{score}</div>
            <div className="text-xl text-green-400">{wordsTyped} words</div>
            <div className="text-2xl font-bold text-orange-400">{timeLeft}s</div>
          </div>
        )}
      </div>

      {!gameStarted ? (
        <div 
          onClick={handleStart}
          className="w-full h-64 bg-zinc-900 rounded-lg flex items-center justify-center cursor-pointer hover:bg-zinc-800"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-2">Click to Start!</div>
            <div className="text-green-400">Type the words as fast as you can</div>
          </div>
        </div>
      ) : (
        <div>
          <div className="bg-zinc-900 rounded-lg p-8 mb-4 text-center">
            <div className="text-5xl font-black text-green-400 tracking-wider mb-4">
              {currentWord}
            </div>
            <Input
              ref={inputRef}
              value={userInput}
              onChange={handleInputChange}
              className="text-2xl text-center bg-black/60 border-purple-500/50 text-white"
              placeholder="Type here..."
              autoFocus
              disabled={timeLeft === 0}
            />
          </div>

          {timeLeft === 0 && (
            <div className="bg-black/80 rounded-lg p-6 text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">Time's Up!</div>
              <div className="text-2xl text-yellow-400">Score: {score}</div>
              <div className="text-lg text-green-400">Words: {wordsTyped}</div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}