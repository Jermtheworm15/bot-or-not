import React from 'react';
import { Button } from '@/components/ui/button';
import { SkipForward, RefreshCw, Info } from 'lucide-react';

export default function MobileActionButtons({ onSkip, onRefresh, onInfo, disabled }) {
  return (
    <div className="fixed bottom-20 left-0 right-0 z-40 px-4 pb-2">
      <div className="flex gap-2 justify-center">
        <Button
          onClick={onSkip}
          disabled={disabled}
          variant="outline"
          size="sm"
          className="bg-zinc-900/80 backdrop-blur-md border-purple-500/30 text-white hover:bg-purple-900/50 flex items-center gap-2"
        >
          <SkipForward className="w-4 h-4" />
          Skip
        </Button>
        <Button
          onClick={onRefresh}
          disabled={disabled}
          variant="outline"
          size="sm"
          className="bg-zinc-900/80 backdrop-blur-md border-purple-500/30 text-white hover:bg-purple-900/50 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
        <Button
          onClick={onInfo}
          disabled={disabled}
          variant="outline"
          size="sm"
          className="bg-zinc-900/80 backdrop-blur-md border-purple-500/30 text-white hover:bg-purple-900/50 flex items-center gap-2"
        >
          <Info className="w-4 h-4" />
          Info
        </Button>
      </div>
    </div>
  );
}