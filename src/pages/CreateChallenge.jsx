import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gamepad2, Users, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function CreateChallenge() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [rounds, setRounds] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
    loadUsers();
  }, []);

  const loadUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
    } catch (err) {
      console.log('Auth error:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const profiles = await base44.entities.UserProfile.list('-points', 100);
      setUsers(profiles);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    if (!selectedOpponent || !currentUser) return;

    setIsSubmitting(true);
    try {
      const challenge = await base44.entities.UserChallenge.create({
        challenger_email: currentUser.email,
        challenger_name: currentUser.full_name || currentUser.email,
        opponent_email: selectedOpponent.user_email,
        opponent_name: selectedOpponent.user_email,
        rounds: parseInt(rounds),
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      });

      // Create notification for opponent
      await base44.entities.Notification.create({
        recipient_email: selectedOpponent.user_email,
        sender_email: currentUser.email,
        sender_name: currentUser.full_name || currentUser.email,
        type: 'challenge',
        content: `challenged you to a ${rounds}-round blitz!`,
        link: '/challenges',
        metadata: { challenge_id: challenge.id }
      });

      // Create activity
      await base44.entities.Activity.create({
        user_email: currentUser.email,
        username: currentUser.full_name || currentUser.email,
        action_type: 'challenge_complete',
        description: `challenged ${selectedOpponent.user_email} to a blitz`,
        metadata: { challenge_id: challenge.id }
      });

      toast.success('Challenge sent!');
      navigate('/challenges');
    } catch (err) {
      console.error('Error creating challenge:', err);
      toast.error('Failed to create challenge');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.user_email !== currentUser?.email &&
    u.user_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-8">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />
      
      <div className="relative z-10 max-w-2xl mx-auto px-4">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <Gamepad2 className="w-10 h-10 text-purple-500" />
            <h1 className="text-4xl font-black">Create Challenge</h1>
          </div>
          <p className="text-zinc-400">Challenge another player to a voting blitz</p>
        </motion.div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-500" />
              Challenge Setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateChallenge} className="space-y-6">
              {/* Opponent Selection */}
              <div className="space-y-2">
                <Label className="text-zinc-300">Select Opponent</Label>
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="bg-zinc-800 border-zinc-700 text-white mb-2"
                />
                <div className="bg-zinc-800 rounded-lg max-h-64 overflow-y-auto border border-zinc-700">
                  {filteredUsers.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>No users found</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-700">
                      {filteredUsers.map(user => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => setSelectedOpponent(user)}
                          className={`w-full p-3 text-left hover:bg-zinc-700 transition-colors ${
                            selectedOpponent?.id === user.id ? 'bg-purple-900/30 border-l-2 border-purple-500' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-white">{user.user_email}</p>
                              <p className="text-sm text-zinc-400">
                                Level {user.level} • {user.points} points
                              </p>
                            </div>
                            {selectedOpponent?.id === user.id && (
                              <Trophy className="w-5 h-5 text-purple-500" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Rounds Selection */}
              <div className="space-y-2">
                <Label className="text-zinc-300">Number of Rounds</Label>
                <Select value={rounds.toString()} onValueChange={(v) => setRounds(parseInt(v))}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="5">5 Rounds (Quick)</SelectItem>
                    <SelectItem value="10">10 Rounds (Standard)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Challenge Preview */}
              {selectedOpponent && (
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                  <p className="text-sm text-white">
                    <span className="font-semibold text-green-400">You</span>
                    {' vs '}
                    <span className="font-semibold text-purple-400">{selectedOpponent.user_email}</span>
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {rounds} rounds • Winner takes glory
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!selectedOpponent || isSubmitting}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold text-lg"
              >
                {isSubmitting ? 'Sending Challenge...' : 'Send Challenge'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}