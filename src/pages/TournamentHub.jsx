import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Swords, Users, Bot, TrendingUp, Award, Plus, Crown } from 'lucide-react';
import { toast } from 'sonner';

export default function TournamentHub() {
  const [tournaments, setTournaments] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [user, setUser] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('tournaments');
  const [creating, setCreating] = useState(false);
  const [newTournament, setNewTournament] = useState({
    name: '',
    description: '',
    entry_fee: 100,
    max_participants: 8,
    rounds: 5
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Load tournaments
      const allTournaments = await base44.entities.Tournament.list('-created_date', 20);
      setTournaments(allTournaments);

      // Load user profile stats
      const profiles = await base44.entities.UserProfile.filter({ user_email: currentUser.email });
      if (profiles.length > 0) {
        setUserStats(profiles[0]);
      } else {
        // Create profile if doesn't exist
        const newProfile = await base44.entities.UserProfile.create({
          user_email: currentUser.email,
          tournaments_entered: 0,
          tournaments_won: 0,
          tournament_matches_played: 0,
          tournament_match_wins: 0,
          tournament_match_losses: 0,
          tournament_win_rate: 0,
          tournament_points: 0
        });
        setUserStats(newProfile);
      }

      // Load leaderboard
      const allProfiles = await base44.entities.UserProfile.list('-tournament_points', 50);
      setLeaderboard(allProfiles.filter(p => p.tournaments_entered > 0));

    } catch (error) {
      console.error('[Tournament] Load error:', error);
      toast.error('Failed to load tournament data');
    }
    setLoading(false);
  };

  const handleJoinTournament = async (tournament) => {
    if (!user) {
      toast.error('Please sign in to join');
      return;
    }

    console.log('[Tournament] Joining tournament:', tournament.id);
    setJoining(true);

    try {
      // Check if already joined
      const participants = tournament.participants || [];
      const alreadyJoined = participants.some(p => p.email === user.email);

      if (alreadyJoined) {
        toast.info('You already joined this tournament');
        setJoining(false);
        return;
      }

      // Check if tournament is full
      if (participants.length >= tournament.max_participants) {
        toast.error('Tournament is full');
        setJoining(false);
        return;
      }

      // Check wallet balance
      const wallets = await base44.entities.TokenWallet.filter({ user_email: user.email });
      if (wallets.length === 0 || wallets[0].balance < tournament.entry_fee) {
        toast.error(`Insufficient tokens. Need ${tournament.entry_fee} tokens`);
        setJoining(false);
        return;
      }

      // Deduct entry fee
      const wallet = wallets[0];
      await base44.entities.TokenWallet.update(wallet.id, {
        balance: wallet.balance - tournament.entry_fee,
        lifetime_spent: (wallet.lifetime_spent || 0) + tournament.entry_fee
      });

      // Add user to participants
      const newParticipant = {
        email: user.email,
        name: user.full_name || user.email,
        joined_at: new Date().toISOString(),
        score: 0
      };

      const updatedParticipants = [...participants, newParticipant];

      await base44.entities.Tournament.update(tournament.id, {
        participants: updatedParticipants,
        prize_pool: (tournament.prize_pool || 0) + tournament.entry_fee
      });

      // Update user stats
      if (userStats) {
        await base44.entities.UserProfile.update(userStats.id, {
          tournaments_entered: (userStats.tournaments_entered || 0) + 1
        });
      }

      // Create transaction record
      await base44.entities.TokenTransaction.create({
        from_email: user.email,
        to_email: null,
        amount: tournament.entry_fee,
        transaction_type: 'purchase',
        reference_id: tournament.id,
        description: `Tournament entry: ${tournament.name}`
      });

      toast.success('Successfully joined tournament!');
      console.log('[Tournament] Join success');
      loadData();

    } catch (error) {
      console.error('[Tournament] Join error:', error);
      toast.error('Failed to join tournament');
    }

    setJoining(false);
  };

  const handleCreateTournament = async () => {
    if (!user) {
      toast.error('Please sign in to create a tournament');
      return;
    }

    console.log('[Tournament] Creating tournament:', newTournament);
    setCreating(true);

    try {
      // Validate inputs
      if (!newTournament.name || !newTournament.name.trim()) {
        toast.error('Tournament name is required');
        setCreating(false);
        return;
      }

      if (newTournament.entry_fee < 0) {
        toast.error('Entry fee must be positive');
        setCreating(false);
        return;
      }

      if (newTournament.max_participants < 2) {
        toast.error('Need at least 2 participants');
        setCreating(false);
        return;
      }

      // Create tournament
      const tournament = await base44.entities.Tournament.create({
        name: newTournament.name.trim(),
        description: newTournament.description?.trim() || '',
        entry_fee: newTournament.entry_fee,
        max_participants: newTournament.max_participants,
        rounds: newTournament.rounds,
        prize_pool: 0,
        participants: [],
        status: 'open',
        start_date: new Date().toISOString()
      });

      console.log('[Tournament] Created:', tournament.id);
      toast.success('Tournament created successfully!');
      
      setShowCreateDialog(false);
      setNewTournament({
        name: '',
        description: '',
        entry_fee: 100,
        max_participants: 8,
        rounds: 5
      });

      loadData();

    } catch (error) {
      console.error('[Tournament] Create error:', error);
      toast.error('Failed to create tournament');
    }

    setCreating(false);
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

        {/* User Stats Card */}
        {userStats && (
          <Card className="bg-gradient-to-br from-purple-900/40 to-purple-800/30 border-purple-500/40 p-6 mb-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              Your Tournament Stats
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold text-white">{userStats.tournaments_entered || 0}</div>
                <div className="text-xs text-green-500/60">Entered</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-400">{userStats.tournaments_won || 0}</div>
                <div className="text-xs text-green-500/60">Won</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">{userStats.tournament_match_wins || 0}</div>
                <div className="text-xs text-green-500/60">Match Wins</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">
                  {userStats.tournament_win_rate ? `${userStats.tournament_win_rate.toFixed(1)}%` : '0%'}
                </div>
                <div className="text-xs text-green-500/60">Win Rate</div>
              </div>
            </div>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-black/60 border border-purple-500/30">
            <TabsTrigger value="tournaments" className="data-[state=active]:bg-purple-600">
              Tournaments
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="data-[state=active]:bg-purple-600">
              Leaderboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tournaments" className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Active & Upcoming</h2>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
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
                {tournaments.map((tournament) => {
                  const isJoined = tournament.participants?.some(p => p.email === user?.email);
                  return (
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
                          <div className="font-bold text-yellow-400">{tournament.prize_pool || 0} 🪙</div>
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
                        {tournament.status === 'open' && !isJoined && (
                          <Button 
                            size="sm" 
                            onClick={() => handleJoinTournament(tournament)}
                            disabled={joining}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {joining ? 'Joining...' : 'Join Tournament'}
                          </Button>
                        )}
                        {isJoined && (
                          <Badge className="bg-blue-600">Already Joined</Badge>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            console.log('[Tournament] View bracket:', tournament.id);
                            toast.info('Bracket view coming soon!');
                          }}
                        >
                          View Bracket
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-6">
            <Card className="bg-black/60 border-purple-500/30 p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Crown className="w-6 h-6 text-yellow-400" />
                Tournament Champions
              </h2>

              {leaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 mx-auto mb-4 text-green-500/30" />
                  <p className="text-green-500/60">No tournament results yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((profile, idx) => (
                    <div 
                      key={profile.id}
                      className={`flex items-center gap-4 p-3 rounded-lg ${
                        idx < 3 ? 'bg-gradient-to-r from-yellow-900/20 to-transparent border border-yellow-500/30' : 'bg-black/40'
                      }`}
                    >
                      <div className={`text-2xl font-bold ${
                        idx === 0 ? 'text-yellow-400' :
                        idx === 1 ? 'text-gray-300' :
                        idx === 2 ? 'text-orange-600' :
                        'text-green-500/60'
                      }`}>
                        #{idx + 1}
                      </div>
                      
                      <div className="flex-1">
                        <div className="font-bold text-white">{profile.user_email}</div>
                        <div className="flex gap-3 text-xs text-green-500/60">
                          <span>{profile.tournaments_entered || 0} entered</span>
                          <span>{profile.tournaments_won || 0} won</span>
                          <span>{profile.tournament_match_wins || 0}W / {profile.tournament_match_losses || 0}L</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-bold text-purple-400">
                          {profile.tournament_points || 0}
                        </div>
                        <div className="text-xs text-green-500/60">Points</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Tournament Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="bg-black border-purple-500/30 text-green-400">
            <DialogHeader>
              <DialogTitle className="text-white">Create Tournament</DialogTitle>
              <DialogDescription className="text-green-500/60">
                Set up a new tournament for players to compete
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tournament Name</Label>
                <Input
                  id="name"
                  value={newTournament.name}
                  onChange={(e) => setNewTournament({...newTournament, name: e.target.value})}
                  placeholder="Spring Championship"
                  className="bg-black/60 border-purple-500/30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTournament.description}
                  onChange={(e) => setNewTournament({...newTournament, description: e.target.value})}
                  placeholder="Describe the tournament..."
                  className="bg-black/60 border-purple-500/30"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entry_fee">Entry Fee</Label>
                  <Input
                    id="entry_fee"
                    type="number"
                    value={newTournament.entry_fee}
                    onChange={(e) => setNewTournament({...newTournament, entry_fee: parseInt(e.target.value) || 0})}
                    className="bg-black/60 border-purple-500/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_participants">Max Players</Label>
                  <Input
                    id="max_participants"
                    type="number"
                    value={newTournament.max_participants}
                    onChange={(e) => setNewTournament({...newTournament, max_participants: parseInt(e.target.value) || 2})}
                    className="bg-black/60 border-purple-500/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rounds">Rounds</Label>
                  <Input
                    id="rounds"
                    type="number"
                    value={newTournament.rounds}
                    onChange={(e) => setNewTournament({...newTournament, rounds: parseInt(e.target.value) || 1})}
                    className="bg-black/60 border-purple-500/30"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateDialog(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateTournament}
                disabled={creating}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {creating ? 'Creating...' : 'Create Tournament'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}