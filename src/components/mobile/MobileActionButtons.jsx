import React from 'react';
import { Button } from '@/components/ui/button';
import { SkipForward, RefreshCw, Info } from 'lucide-react';

export default function MobileActionButtons({ onSkip, onRefresh, onInfo, disabled }) {
  return (
    <div className="w-full max-w-2xl mx-auto mt-4 mb-6">
      <div className="flex gap-3 justify-center">
        <Button
          onClick={onSkip}
          disabled={disabled}
          variant="outline"
          className="flex-1 bg-zinc-800/90 border-zinc-700 text-white hover:bg-zinc-700 flex items-center justify-center gap-2"
        >
          <SkipForward className="w-4 h-4" />
          Skip
        </Button>
        <Button
          onClick={onRefresh}
          disabled={disabled}
          variant="outline"
          className="flex-1 bg-zinc-800/90 border-zinc-700 text-white hover:bg-zinc-700 flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
        <Button
          onClick={onInfo}
          disabled={disabled}
          variant="outline"
          className="flex-1 bg-zinc-800/90 border-zinc-700 text-white hover:bg-zinc-700 flex items-center justify-center gap-2"
        >
          <Info className="w-4 h-4" />
          Info
        </Button>
      </div>
    </div>
  );
}