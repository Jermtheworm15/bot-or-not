import React from 'react';
import { Button } from '@/components/ui/button';
import { SkipForward, RefreshCw, Info } from 'lucide-react';

export default function MobileActionButtons({ onSkip, onRefresh, onInfo, disabled }) {
  return (
    <div className="w-full max-w-2xl mx-auto mt-4 mb-6">
      <div className="flex gap-3 justify-center px-4">
        <Button
          onClick={onSkip}
          disabled={disabled}
          className="flex-1 bg-black/80 backdrop-blur-md border-2 border-purple-500/30 text-green-400 hover:bg-purple-900/30 hover:text-white flex items-center justify-center gap-2 font-medium shadow-lg transition-all"
        >
          <SkipForward className="w-4 h-4" />
          Skip
        </Button>
        <Button
          onClick={onRefresh}
          disabled={disabled}
          className="flex-1 bg-black/80 backdrop-blur-md border-2 border-purple-500/30 text-green-400 hover:bg-purple-900/30 hover:text-white flex items-center justify-center gap-2 font-medium shadow-lg transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
        <Button
          onClick={onInfo}
          disabled={disabled}
          className="flex-1 bg-black/80 backdrop-blur-md border-2 border-purple-500/30 text-green-400 hover:bg-purple-900/30 hover:text-white flex items-center justify-center gap-2 font-medium shadow-lg transition-all"
        >
          <Info className="w-4 h-4" />
          Info
        </Button>
      </div>
    </div>
  );
}