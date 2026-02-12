import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Target, Brain } from 'lucide-react';

export default function DifficultySelector({ selectedDifficulty, onSelect, playerStats }) {
  const difficulties = [
    {
      level: 1,
      name: 'Easy',
      description: 'AI will get 50-60% correct',
      icon: Zap,
      color: 'from-green-500 to-emerald-600',
      recommended: playerStats?.accuracy < 50
    },
    {
      level: 2,
      name: 'Medium',
      description: 'AI will get 65-75% correct',
      icon: Target,
      color: 'from-yellow-500 to-orange-600',
      recommended: playerStats?.accuracy >= 50 && playerStats?.accuracy < 75
    },
    {
      level: 3,
      name: 'Hard',
      description: 'AI will get 80-90% correct',
      icon: Brain,
      color: 'from-red-500 to-pink-600',
      recommended: playerStats?.accuracy >= 75
    }
  ];

  return (
    <div className="space-y-3">
      <p className="text-zinc-400 text-sm">Select AI difficulty:</p>
      <div className="grid grid-cols-3 gap-3">
        {difficulties.map((diff) => {
          const Icon = diff.icon;
          const isSelected = selectedDifficulty === diff.level;

          return (
            <motion.button
              key={diff.level}
              onClick={() => onSelect(diff.level)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative overflow-hidden rounded-lg transition-all ${
                isSelected
                  ? `bg-gradient-to-br ${diff.color} shadow-lg`
                  : 'bg-zinc-800 hover:bg-zinc-700 border border-zinc-700'
              }`}
            >
              <Card className={`border-0 ${isSelected ? 'bg-transparent' : ''}`}>
                <CardContent className="p-3 text-center space-y-2">
                  <Icon className={`w-5 h-5 mx-auto ${isSelected ? 'text-white' : 'text-zinc-400'}`} />
                  <div>
                    <p className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-zinc-100'}`}>
                      {diff.name}
                    </p>
                    <p className={`text-xs ${isSelected ? 'text-white/80' : 'text-zinc-500'}`}>
                      {diff.description}
                    </p>
                  </div>
                  {diff.recommended && (
                    <p className="text-xs font-bold text-yellow-300">Recommended</p>
                  )}
                </CardContent>
              </Card>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}