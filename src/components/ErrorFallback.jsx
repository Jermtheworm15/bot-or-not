import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <Card className="bg-black/80 border-red-500/30 p-8 max-w-lg text-center">
        <AlertTriangle className="w-20 h-20 mx-auto mb-4 text-red-400" />
        <h2 className="text-3xl font-bold text-white mb-3">Oops! Something went wrong</h2>
        <p className="text-red-400 mb-6 text-sm font-mono bg-red-950/30 p-3 rounded">
          {error?.message || 'An unexpected error occurred'}
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={resetErrorBoundary}
            variant="outline"
            className="border-red-500/30 text-red-400 hover:bg-red-900/30 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={() => window.location.href = '/Home'}
            className="bg-gradient-to-r from-purple-600 to-pink-600 cursor-pointer"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
      </Card>
    </div>
  );
}