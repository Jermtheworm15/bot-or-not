import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Swords, Users, Bot, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function TournamentHub() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const allTournaments = await base44.entities.Tournament.list('-created_date', 20);
      setTournaments(allTournaments);
    } catch (error) {
      console.error('Load tournaments error:', error);
      toast.error('Failed to load tournaments');
    }
    setLoading(false);
  };

  const statusColors = {
    open: 'bg-green-600',
    in_progress: 'bg-yellow-600',
    completed: 'bg-blue-600',
    cancelled: 'bg-red-600'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 p-4 pb-32 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-black mb-2 flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-400" />
            Tournament Hub
          </h1>
          <p className="text-green-500/60">Compete with your collectibles</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border-purple-500/30 p-6">
            <Users className="w-8 h-8 mb-2 text-purple-400" />
            <div className="text-2xl font-bold text-white mb-1">VS Players</div>
            <p className="text-sm text-green-500/60">Compete against other users</p>
          </Card>
          <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-blue-500/30 p-6">
            <Bot className="w-8 h-8 mb-2 text-blue-400" />
            <div className="text-2xl font-bold text-white mb-1">VS AI</div>
            <p className="text-sm text-green-500/60">Challenge AI opponents</p>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 border-yellow-500/30 p-6">
            <Swords className="w-8 h-8 mb-2 text-yellow-400" />
            <div className="text-2xl font-bold text-white mb-1">Battle</div>
            <p className="text-sm text-green-500/60">Image stats determine winners</p>
          </Card>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Active & Upcoming Tournaments</h2>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Trophy className="w-4 h-4 mr-2" />
            Create Tournament
          </Button>
        </div>

        {tournaments.length === 0 ? (
          <Card className="bg-black/60 border-purple-500/30 p-8 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-green-500/30" />
            <p className="text-green-500/60">No tournaments yet</p>
            <p className="text-green-500/40 text-sm mt-2">
              Be the first to create a tournament!
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {tournaments.map((tournament) => (
              <Card key={tournament.id} className="bg-black/60 border-purple-500/30 p-4 hover:border-purple-500/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{tournament.name}</h3>
                    <p className="text-sm text-green-500/60">{tournament.description}</p>
                  </div>
                  <Badge className={statusColors[tournament.status]}>
                    {tournament.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div className="text-xs">
                    <div className="text-green-500/60">Entry Fee</div>
                    <div className="font-bold text-purple-400">{tournament.entry_fee} 🪙</div>
                  </div>
                  <div className="text-xs">
                    <div className="text-green-500/60">Prize Pool</div>
                    <div className="font-bold text-yellow-400">{tournament.prize_pool} 🪙</div>
                  </div>
                  <div className="text-xs">
                    <div className="text-green-500/60">Players</div>
                    <div className="font-bold text-white">
                      {tournament.participants?.length || 0}/{tournament.max_participants}
                    </div>
                  </div>
                  <div className="text-xs">
                    <div className="text-green-500/60">Rounds</div>
                    <div className="font-bold text-white">{tournament.rounds}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {tournament.status === 'open' && (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      Join Tournament
                    </Button>
                  )}
                  <Link to={`/TournamentDetail/${tournament.id}`}>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}