import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Target, Trophy, Users, Swords, Clock, CheckCircle, XCircle, ChevronLeft, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import UserSearch from '@/components/community/UserSearch';
import InviteFriends from '@/components/social/InviteFriends';

export default function ArcadeChallenges() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [games, setGames] = useState([]);
  const [receivedChallenges, setReceivedChallenges] = useState([]);
  const [sentChallenges, setSentChallenges] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [gamesData, received, sent] = await Promise.all([
        base44.entities.ArcadeGame.filter({ is_active: true }),
        base44.entities.ArcadeChallenge.filter({ 
          challenged_email: currentUser.email,
          status: 'pending'
        }),
        base44.entities.ArcadeChallenge.filter({ 
          challenger_email: currentUser.email
        }, '-created_date', 20)
      ]);

      setGames(gamesData);
      setReceivedChallenges(received);
      setSentChallenges(sent);

    } catch (error) {
      console.error('[Challenges] Load error:', error);
      toast.error('Failed to load challenges');
    }
    setLoading(false);
  };

  const handleCreateChallenge = async () => {
    if (!selectedGame || !selectedUser) {
      toast.error('Select a game and opponent');
      return;
    }

    try {
      // Get player's best score
      const myStats = await base44.entities.ArcadeStats.filter({
        user_email: user.email,
        game_id: selectedGame.game_id
      });

      const myScore = myStats.length > 0 ? myStats[0].best_score : 0;

      // Create challenge
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await base44.entities.ArcadeChallenge.create({
        challenger_email: user.email,
        challenged_email: selectedUser,
        game_id: selectedGame.game_id,
        challenger_score: myScore,
        status: 'pending',
        expires_at: expiresAt.toISOString()
      });

      // Create notification
      await base44.entities.Notification.create({
        user_email: selectedUser,
        type: 'arcade_challenge',
        title: 'New Arcade Challenge!',
        message: `${user.email.split('@')[0]} challenged you to ${selectedGame.name}`,
        metadata: { game_id: selectedGame.game_id }
      });

      toast.success('Challenge sent!');
      setShowCreateDialog(false);
      setSelectedGame(null);
      setSelectedUser(null);
      loadData();

    } catch (error) {
      console.error('[Challenge] Create error:', error);
      toast.error('Failed to send challenge');
    }
  };

  const handleAcceptChallenge = async (challenge) => {
    try {
      await base44.entities.ArcadeChallenge.update(challenge.id, {
        status: 'accepted'
      });

      toast.success('Challenge accepted! Play the game to complete it.');
      navigate(`/ArcadeGame/${challenge.game_id}?challengeId=${challenge.id}`);

    } catch (error) {
      console.error('[Challenge] Accept error:', error);
      toast.error('Failed to accept challenge');
    }
  };

  const handleDeclineChallenge = async (challenge) => {
    try {
      await base44.entities.ArcadeChallenge.update(challenge.id, {
        status: 'expired'
      });

      toast.success('Challenge declined');
      loadData();

    } catch (error) {
      console.error('[Challenge] Decline error:', error);
      toast.error('Failed to decline challenge');
    }
  };

  const getGameName = (gameId) => {
    const game = games.find(g => g.game_id === gameId);
    return game ? game.name : gameId;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center pb-32">
        <div className="animate-spin w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 p-4 pb-32">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />
      
      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate('/ArcadeHub')}
              className="text-green-400 hover:text-white mb-4"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back to Arcade
            </Button>
            <div className="flex items-center gap-3">
              <Swords className="w-10 h-10 text-orange-400" />
              <h1 className="text-4xl font-black text-white">Challenges</h1>
            </div>
          </div>

          <div className="flex gap-3">
            <InviteFriends />
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500">
                  <Target className="w-5 h-5 mr-2" />
                  New Challenge
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-black border-purple-500/30">
                <DialogHeader>
                  <DialogTitle className="text-white">Create Challenge</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-green-400 mb-2 block">Select Game</label>
                    <div className="grid gap-2">
                      {games.map(game => (
                        <Card
                          key={game.id}
                          onClick={() => setSelectedGame(game)}
                          className={`p-3 cursor-pointer transition-all ${
                            selectedGame?.id === game.id
                              ? 'bg-purple-900/30 border-purple-500'
                              : 'bg-black/60 border-purple-500/30 hover:border-purple-500/60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{game.icon}</div>
                            <div className="text-white font-bold">{game.name}</div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-green-400 mb-2 block">Select Opponent</label>
                    <UserSearch
                      onUserSelect={(email) => setSelectedUser(email)}
                      selectedUser={selectedUser}
                    />
                  </div>

                  <Button
                    onClick={handleCreateChallenge}
                    disabled={!selectedGame || !selectedUser}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    Send Challenge
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="received" className="space-y-6">
          <TabsList className="bg-black/60 border border-purple-500/30">
            <TabsTrigger value="received">
              <Target className="w-4 h-4 mr-2" />
              Received ({receivedChallenges.length})
            </TabsTrigger>
            <TabsTrigger value="sent">
              <Swords className="w-4 h-4 mr-2" />
              Sent ({sentChallenges.length})
            </TabsTrigger>
          </TabsList>

          {/* Received Challenges */}
          <TabsContent value="received">
            {receivedChallenges.length === 0 ? (
              <Card className="bg-black/60 border-purple-500/30 p-12 text-center">
                <Target className="w-16 h-16 mx-auto mb-4 text-purple-400/30" />
                <p className="text-green-500/60">No pending challenges</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {receivedChallenges.map(challenge => (
                  <Card key={challenge.id} className="bg-black/60 border-orange-500/30 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Swords className="w-8 h-8 text-orange-400" />
                        <div>
                          <div className="font-bold text-white mb-1">
                            {challenge.challenger_email.split('@')[0]} challenges you!
                          </div>
                          <div className="text-sm text-green-500/80 mb-2">
                            {getGameName(challenge.game_id)}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-green-500/60">
                            <div className="flex items-center gap-1">
                              <Trophy className="w-3 h-3" />
                              Their Score: {challenge.challenger_score}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Expires: {new Date(challenge.expires_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAcceptChallenge(challenge)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Accept
                        </Button>
                        <Button
                          onClick={() => handleDeclineChallenge(challenge)}
                          variant="outline"
                          className="border-red-500/30 text-red-400 hover:bg-red-900/30"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Sent Challenges */}
          <TabsContent value="sent">
            {sentChallenges.length === 0 ? (
              <Card className="bg-black/60 border-purple-500/30 p-12 text-center">
                <Swords className="w-16 h-16 mx-auto mb-4 text-purple-400/30" />
                <p className="text-green-500/60">No challenges sent yet</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {sentChallenges.map(challenge => (
                  <Card key={challenge.id} className="bg-black/60 border-purple-500/30 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Target className="w-8 h-8 text-purple-400" />
                        <div>
                          <div className="font-bold text-white mb-1">
                            Challenge to {challenge.challenged_email.split('@')[0]}
                          </div>
                          <div className="text-sm text-green-500/80 mb-2">
                            {getGameName(challenge.game_id)}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-green-500/60">
                            <div className="flex items-center gap-1">
                              <Trophy className="w-3 h-3" />
                              Your Score: {challenge.challenger_score}
                            </div>
                            {challenge.challenged_score && (
                              <div className="flex items-center gap-1">
                                <Trophy className="w-3 h-3" />
                                Their Score: {challenge.challenged_score}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <Badge className={
                        challenge.status === 'completed' 
                          ? challenge.winner_email === user.email 
                            ? 'bg-green-600' 
                            : 'bg-red-600'
                          : challenge.status === 'pending'
                          ? 'bg-yellow-600'
                          : 'bg-gray-600'
                      }>
                        {challenge.status === 'completed' && challenge.winner_email === user.email && '🏆 Won'}
                        {challenge.status === 'completed' && challenge.winner_email !== user.email && '😔 Lost'}
                        {challenge.status === 'pending' && '⏳ Pending'}
                        {challenge.status === 'accepted' && '✅ Accepted'}
                        {challenge.status === 'expired' && '❌ Expired'}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}