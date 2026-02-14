import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gamepad2, Trophy, Clock, CheckCircle, XCircle, Swords } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { playSound } from '@/components/audio/SoundEffects';

export default function Challenges() {
  const [currentUser, setCurrentUser] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const allChallenges = await base44.entities.UserChallenge.list('-created_date', 100);
      const userChallenges = allChallenges.filter(
        c => c.challenger_email === user.email || c.opponent_email === user.email
      );
      setChallenges(userChallenges);
    } catch (err) {
      console.error('Error loading challenges:', err);
    }
    setIsLoading(false);
  };

  const handleAcceptChallenge = async (challenge) => {
    try {
      await base44.entities.UserChallenge.update(challenge.id, { status: 'accepted' });
      
      await base44.entities.Notification.create({
        recipient_email: challenge.challenger_email,
        sender_email: currentUser.email,
        sender_name: currentUser.full_name || currentUser.email,
        type: 'challenge',
        content: 'accepted your challenge!',
        link: '/Challenges',
        metadata: { challenge_id: challenge.id }
      });

      playSound.achievement();
      toast.success('Challenge accepted!');
      loadChallenges();
    } catch (err) {
      console.error('Error accepting challenge:', err);
      toast.error('Failed to accept challenge');
    }
  };

  const handleDeclineChallenge = async (challenge) => {
    try {
      await base44.entities.UserChallenge.update(challenge.id, { status: 'declined' });
      
      await base44.entities.Notification.create({
        recipient_email: challenge.challenger_email,
        sender_email: currentUser.email,
        sender_name: currentUser.full_name || currentUser.email,
        type: 'challenge',
        content: 'declined your challenge',
        link: '/Challenges',
        metadata: { challenge_id: challenge.id }
      });

      playSound.incorrect();
      toast.success('Challenge declined');
      loadChallenges();
    } catch (err) {
      console.error('Error declining challenge:', err);
      toast.error('Failed to decline challenge');
    }
  };

  const handleStartChallenge = (challenge) => {
    playSound.challengeStart();
    navigate(`/BlitzGame?challenge_id=${challenge.id}`);
  };

  const pendingReceived = challenges.filter(
    c => c.status === 'pending' && c.opponent_email === currentUser?.email
  );
  const pendingSent = challenges.filter(
    c => c.status === 'pending' && c.challenger_email === currentUser?.email
  );
  const active = challenges.filter(c => c.status === 'accepted');
  const completed = challenges.filter(c => c.status === 'completed' || c.status === 'declined');

  const ChallengeCard = ({ challenge, type }) => {
    const isChallenger = challenge.challenger_email === currentUser?.email;
    const opponentName = isChallenger ? challenge.opponent_name : challenge.challenger_name;
    const opponentEmail = isChallenger ? challenge.opponent_email : challenge.challenger_email;

    return (
      <Card className="bg-zinc-900 border-purple-500/30 hover:border-purple-500/50 transition-all">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                <Swords className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">{opponentName}</p>
                <p className="text-sm text-zinc-400">{opponentEmail}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-400">{challenge.rounds} rounds</p>
              {challenge.status === 'completed' && challenge.winner_email && (
                <p className={`text-sm font-bold ${
                  challenge.winner_email === currentUser?.email ? 'text-green-400' : 'text-red-400'
                }`}>
                  {challenge.winner_email === currentUser?.email ? 'Won' : 'Lost'}
                </p>
              )}
            </div>
          </div>

          {type === 'pending_received' && (
            <div className="flex gap-2">
              <Button
                onClick={() => handleAcceptChallenge(challenge)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Accept
              </Button>
              <Button
                onClick={() => handleDeclineChallenge(challenge)}
                variant="outline"
                className="flex-1 border-red-500/50 text-red-400 hover:bg-red-900/30"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Decline
              </Button>
            </div>
          )}

          {type === 'pending_sent' && (
            <div className="flex items-center gap-2 text-zinc-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Waiting for response...</span>
            </div>
          )}

          {type === 'active' && (
            <Button
              onClick={() => handleStartChallenge(challenge)}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            >
              <Gamepad2 className="w-4 h-4 mr-2" />
              Start Challenge
            </Button>
          )}

          {type === 'completed' && challenge.status === 'completed' && (
            <div className="grid grid-cols-2 gap-4 mt-4 text-center">
              <div className="bg-zinc-800 rounded p-2">
                <p className="text-xs text-zinc-400">You</p>
                <p className="text-2xl font-bold text-white">
                  {isChallenger ? challenge.challenger_score : challenge.opponent_score}
                </p>
              </div>
              <div className="bg-zinc-800 rounded p-2">
                <p className="text-xs text-zinc-400">Opponent</p>
                <p className="text-2xl font-bold text-white">
                  {isChallenger ? challenge.opponent_score : challenge.challenger_score}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-8">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <Trophy className="w-10 h-10 text-purple-500" />
            <h1 className="text-4xl font-black">Challenges</h1>
          </div>
          <p className="text-zinc-400">Compete against other players</p>
        </motion.div>

        <div className="mb-6">
          <Button
            onClick={() => navigate('/CreateChallenge')}
            className="w-full bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-500 hover:to-green-500"
          >
            <Swords className="w-5 h-5 mr-2" />
            Create New Challenge
          </Button>
        </div>

        <Tabs defaultValue="received" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-zinc-900">
            <TabsTrigger value="received" className="data-[state=active]:bg-purple-600">
              Received ({pendingReceived.length})
            </TabsTrigger>
            <TabsTrigger value="sent" className="data-[state=active]:bg-purple-600">
              Sent ({pendingSent.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="data-[state=active]:bg-purple-600">
              Active ({active.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-purple-600">
              History ({completed.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="space-y-4 mt-6">
            {isLoading ? (
              <p className="text-center text-zinc-400 py-8">Loading...</p>
            ) : pendingReceived.length === 0 ? (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="py-12 text-center">
                  <Clock className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
                  <p className="text-zinc-400">No pending challenges</p>
                </CardContent>
              </Card>
            ) : (
              pendingReceived.map(challenge => (
                <ChallengeCard key={challenge.id} challenge={challenge} type="pending_received" />
              ))
            )}
          </TabsContent>

          <TabsContent value="sent" className="space-y-4 mt-6">
            {isLoading ? (
              <p className="text-center text-zinc-400 py-8">Loading...</p>
            ) : pendingSent.length === 0 ? (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="py-12 text-center">
                  <Swords className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
                  <p className="text-zinc-400">No sent challenges</p>
                </CardContent>
              </Card>
            ) : (
              pendingSent.map(challenge => (
                <ChallengeCard key={challenge.id} challenge={challenge} type="pending_sent" />
              ))
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4 mt-6">
            {isLoading ? (
              <p className="text-center text-zinc-400 py-8">Loading...</p>
            ) : active.length === 0 ? (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="py-12 text-center">
                  <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
                  <p className="text-zinc-400">No active challenges</p>
                </CardContent>
              </Card>
            ) : (
              active.map(challenge => (
                <ChallengeCard key={challenge.id} challenge={challenge} type="active" />
              ))
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-6">
            {isLoading ? (
              <p className="text-center text-zinc-400 py-8">Loading...</p>
            ) : completed.length === 0 ? (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="py-12 text-center">
                  <Trophy className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
                  <p className="text-zinc-400">No challenge history</p>
                </CardContent>
              </Card>
            ) : (
              completed.map(challenge => (
                <ChallengeCard key={challenge.id} challenge={challenge} type="completed" />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}