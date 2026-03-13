import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, ArrowLeft, Users, Calendar, Coins } from 'lucide-react';
import { toast } from 'sonner';

export default function TournamentBracket() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const tournamentData = await base44.entities.Tournament.get(id);
      setTournament(tournamentData);

      console.log('[Bracket] Loaded tournament:', tournamentData);
    } catch (error) {
      console.error('[Bracket] Load error:', error);
      toast.error('Failed to load tournament');
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

  if (!tournament) {
    return (
      <div className="min-h-screen bg-black text-green-400 p-4 pb-32 overflow-y-auto">
        <div className="max-w-4xl mx-auto text-center py-12">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-green-500/30" />
          <h2 className="text-2xl font-bold text-white mb-2">Tournament Not Found</h2>
          <Button onClick={() => navigate('/TournamentHub')} className="mt-4">
            Back to Tournaments
          </Button>
        </div>
      </div>
    );
  }

  const participants = tournament.participants || [];
  const isJoined = participants.some(p => p.email === user?.email);

  return (
    <div className="min-h-screen bg-black text-green-400 p-4 pb-32 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <Button
          onClick={() => navigate('/TournamentHub')}
          variant="outline"
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tournaments
        </Button>

        {/* Tournament Header */}
        <Card className="bg-black/60 border-purple-500/30 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-black text-white mb-2">{tournament.name}</h1>
              <p className="text-green-500/60">{tournament.description}</p>
            </div>
            <Badge className={statusColors[tournament.status]}>
              {tournament.status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-xs text-green-500/60">Entry Fee</div>
                <div className="font-bold text-white">{tournament.entry_fee} 🪙</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <div>
                <div className="text-xs text-green-500/60">Prize Pool</div>
                <div className="font-bold text-yellow-400">{tournament.prize_pool || 0} 🪙</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              <div>
                <div className="text-xs text-green-500/60">Players</div>
                <div className="font-bold text-white">
                  {participants.length}/{tournament.max_participants}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-400" />
              <div>
                <div className="text-xs text-green-500/60">Rounds</div>
                <div className="font-bold text-white">{tournament.rounds}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Participants List */}
        <Card className="bg-black/60 border-purple-500/30 p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Participants ({participants.length})
          </h2>

          {participants.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-4 text-green-500/30" />
              <p className="text-green-500/60">No participants yet</p>
              <p className="text-green-500/40 text-sm mt-2">
                Be the first to join this tournament!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {participants.map((participant, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    participant.email === user?.email
                      ? 'bg-purple-900/30 border border-purple-500/30'
                      : 'bg-black/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-xl font-bold text-green-500/60">#{idx + 1}</div>
                    <div>
                      <div className="font-bold text-white">{participant.name}</div>
                      <div className="text-xs text-green-500/60">
                        Joined {new Date(participant.joined_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-400">
                      {participant.score || 0}
                    </div>
                    <div className="text-xs text-green-500/60">Score</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Tournament Winners (if completed) */}
        {tournament.status === 'completed' && tournament.winners?.length > 0 && (
          <Card className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 border-yellow-500/30 p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Winners
            </h2>
            <div className="space-y-3">
              {tournament.winners.map((winner, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-black/40 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className={`text-3xl font-bold ${
                      idx === 0 ? 'text-yellow-400' :
                      idx === 1 ? 'text-gray-300' :
                      'text-orange-600'
                    }`}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                    </div>
                    <div>
                      <div className="font-bold text-white">{winner.name}</div>
                      <div className="text-sm text-green-500/60">Score: {winner.score}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-400">{winner.prize} 🪙</div>
                    <div className="text-xs text-green-500/60">Prize</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}