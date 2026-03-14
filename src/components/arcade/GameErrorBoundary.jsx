import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

class GameErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[GameErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
          <Card className="bg-black/80 border-red-500/30 p-8 max-w-md text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-2xl font-bold text-white mb-2">Game Error</h2>
            <p className="text-red-400 mb-6 text-sm">
              {this.state.error?.message || 'Something went wrong'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-900/30"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload
              </Button>
              <Button
                onClick={() => window.location.href = '/ArcadeHub'}
                className="bg-gradient-to-r from-purple-600 to-pink-600"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Arcade
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GameErrorBoundary;