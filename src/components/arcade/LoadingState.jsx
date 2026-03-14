import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="min-h-screen bg-black text-green-400 flex flex-col items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin mb-4 text-purple-400" />
      <p className="text-white text-lg">{message}</p>
    </div>
  );
}