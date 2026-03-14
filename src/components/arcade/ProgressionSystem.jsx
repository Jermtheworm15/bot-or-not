import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp } from 'lucide-react';

export default function ProgressionSystem({ currentLevel, stats, onLevelSelect }) {
  const calculateDifficultyMultiplier = (level) => {
    // Smooth scaling from 1.0x to 5.0x over 100 levels
    return 1 + (level - 1) * 0.04;
  };

  const getLevelColor = (level) => {
    if (level <= 20) return 'bg-green-600';
    if (level <= 40) return 'bg-blue-600';
    if (level <= 60) return 'bg-purple-600';
    if (level <= 80) return 'bg-orange-600';
    return 'bg-red-600';
  };

  const getLevelTier = (level) => {
    if (level <= 20) return 'Beginner';
    if (level <= 40) return 'Intermediate';
    if (level <= 60) return 'Advanced';
    if (level <= 80) return 'Expert';
    return 'Master';
  };

  return (
    <Card className="bg-black/80 border-purple-500/30 p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Level Progression
          </h3>
          <Badge className={getLevelColor(currentLevel)}>
            {getLevelTier(currentLevel)} - Level {currentLevel}
          </Badge>
        </div>
        <p className="text-sm text-green-500/60">
          Difficulty: {calculateDifficultyMultiplier(currentLevel).toFixed(2)}x
        </p>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-green-400">Your Progress</span>
          <span className="text-white font-bold">
            Level {stats?.current_level || 1} / 100
          </span>
        </div>
        <Progress value={(stats?.current_level || 1)} max={100} className="h-3" />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-black/60 rounded p-3 text-center">
          <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-400" />
          <div className="text-lg font-bold text-white">{stats?.highest_level_reached || 1}</div>
          <div className="text-xs text-green-500/60">Highest Level</div>
        </div>
        <div className="bg-black/60 rounded p-3 text-center">
          <Trophy className="w-5 h-5 mx-auto mb-1 text-yellow-400" />
          <div className="text-lg font-bold text-white">{stats?.wins || 0}</div>
          <div className="text-xs text-green-500/60">Level Wins</div>
        </div>
      </div>

      <div className="text-xs text-green-500/60 text-center">
        Complete levels to unlock higher difficulties and earn more rewards!
      </div>
    </Card>
  );
}