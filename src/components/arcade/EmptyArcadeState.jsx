import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gamepad2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function EmptyArcadeState({ onSeeded }) {
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('seedExpandedArcade', {});
      
      if (result.data?.success) {
        toast.success(`🎮 Seeded ${result.data.total_games || 56} games!`);
        if (onSeeded) onSeeded();
      } else {
        throw new Error('Seed failed');
      }
    } catch (error) {
      console.error('[Arcade] Seed error:', error);
      toast.error('Failed to seed arcade');
    }
    setLoading(false);
  };

  return (
    <Card className="bg-black/60 border-purple-500/30 p-12 text-center">
      <Gamepad2 className="w-24 h-24 mx-auto mb-6 text-purple-400/30" />
      <h3 className="text-2xl font-bold text-white mb-4">Welcome to the Arcade!</h3>
      <p className="text-green-500/60 mb-6 max-w-md mx-auto">
        Initialize the arcade to unlock 56+ retro games, earn tokens, and compete on leaderboards!
      </p>
      <Button
        onClick={handleSeed}
        disabled={loading}
        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 cursor-pointer text-lg px-8 py-6"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Seeding Arcade...
          </>
        ) : (
          <>
            <Gamepad2 className="w-5 h-5 mr-2" />
            Initialize Arcade (56 Games)
          </>
        )}
      </Button>
    </Card>
  );
}