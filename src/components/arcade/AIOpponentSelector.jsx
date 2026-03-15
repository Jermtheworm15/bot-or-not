import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, User, Swords } from 'lucide-react';

export default function AIOpponentSelector({ onSelect }) {
  const [selectedMode, setSelectedMode] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');

  const handleStart = () => {
    if (selectedMode === 'solo') {
      onSelect({ mode: 'solo' });
    } else if (selectedMode === 'ai') {
      onSelect({ mode: 'ai', difficulty: selectedDifficulty });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">Choose Game Mode</h3>
        <p className="text-green-500/80">Play alone or challenge an AI opponent</p>
      </div>

      {/* Mode Selection */}
      <div className="grid grid-cols-2 gap-4">
        <Card
          className={`cursor-pointer transition-all ${
            selectedMode === 'solo'
              ? 'bg-gradient-to-br from-purple-900/40 to-purple-800/40 border-purple-500'
              : 'bg-black/60 border-purple-500/30 hover:border-purple-500/50'
          } p-6`}
          onClick={() => setSelectedMode('solo')}
        >
          <div className="text-center">
            <User className="w-12 h-12 mx-auto mb-3 text-green-400" />
            <h4 className="text-lg font-bold text-white mb-2">Solo Play</h4>
            <p className="text-sm text-green-500/60">Play for high scores and progression</p>
          </div>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            selectedMode === 'ai'
              ? 'bg-gradient-to-br from-orange-900/40 to-red-900/40 border-orange-500'
              : 'bg-black/60 border-purple-500/30 hover:border-purple-500/50'
          } p-6`}
          onClick={() => setSelectedMode('ai')}
        >
          <div className="text-center">
            <Bot className="w-12 h-12 mx-auto mb-3 text-orange-400" />
            <h4 className="text-lg font-bold text-white mb-2">VS AI</h4>
            <p className="text-sm text-green-500/60">Compete against an AI opponent</p>
          </div>
        </Card>
      </div>

      {/* AI Difficulty Selection */}
      {selectedMode === 'ai' && (
        <Card className="bg-black/60 border-orange-500/30 p-6">
          <h4 className="text-lg font-bold text-white mb-4 text-center">Select AI Difficulty</h4>
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant={selectedDifficulty === 'easy' ? 'default' : 'outline'}
              className={selectedDifficulty === 'easy' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'border-green-500/30 text-green-400 hover:bg-green-900/30'}
              onClick={() => setSelectedDifficulty('easy')}
            >
              Easy
            </Button>
            <Button
              variant={selectedDifficulty === 'medium' ? 'default' : 'outline'}
              className={selectedDifficulty === 'medium' 
                ? 'bg-yellow-600 hover:bg-yellow-700' 
                : 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-900/30'}
              onClick={() => setSelectedDifficulty('medium')}
            >
              Medium
            </Button>
            <Button
              variant={selectedDifficulty === 'hard' ? 'default' : 'outline'}
              className={selectedDifficulty === 'hard' 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'border-red-500/30 text-red-400 hover:bg-red-900/30'}
              onClick={() => setSelectedDifficulty('hard')}
            >
              Hard
            </Button>
          </div>
          <div className="mt-4 text-center text-sm text-green-500/60">
            {selectedDifficulty === 'easy' && '50% of average player performance'}
            {selectedDifficulty === 'medium' && '75% of average player performance'}
            {selectedDifficulty === 'hard' && '95% of top player performance'}
          </div>
        </Card>
      )}

      {/* Start Button */}
      {selectedMode && (
        <Button
          onClick={handleStart}
          className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
        >
          <Swords className="w-5 h-5 mr-2" />
          {selectedMode === 'solo' ? 'Start Game' : `Battle AI (${selectedDifficulty})`}
        </Button>
      )}
    </div>
  );
}