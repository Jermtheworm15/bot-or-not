import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { MessageCircle, Trash2, Check, X } from 'lucide-react';
import ChatWindow from './ChatWindow';

export default function FriendsList({ userEmail, userName }) {
  const [friends, setFriends] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFriendsData();
  }, [userEmail]);

  const loadFriendsData = async () => {
    try {
      const [accepted1, accepted2, sent, received] = await Promise.all([
        base44.entities.Friend.filter({ user_email: userEmail, status: 'accepted' }),
        base44.entities.Friend.filter({ friend_email: userEmail, status: 'accepted' }),
        base44.entities.Friend.filter({ user_email: userEmail, status: 'pending' }),
        base44.entities.Friend.filter({ friend_email: userEmail, status: 'pending' })
      ]);

      const allFriends = [...accepted1, ...accepted2];
      setFriends(allFriends);
      setSentRequests(sent);
      setReceivedRequests(received);
    } catch (err) {
      console.error('Error loading friends:', err);
    }
    setIsLoading(false);
  };

  const handleAccept = async (friendId) => {
    try {
      await base44.entities.Friend.update(friendId, {
        status: 'accepted',
        accepted_at: new Date().toISOString()
      });
      await loadFriendsData();
    } catch (err) {
      console.error('Error accepting friend request:', err);
    }
  };

  const handleDecline = async (friendId) => {
    try {
      await base44.entities.Friend.delete(friendId);
      await loadFriendsData();
    } catch (err) {
      console.error('Error declining friend request:', err);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    try {
      await base44.entities.Friend.delete(friendId);
      await loadFriendsData();
    } catch (err) {
      console.error('Error removing friend:', err);
    }
  };

  if (isLoading) {
    return <div className="text-zinc-400 text-sm">Loading friends...</div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Pending Requests */}
      {receivedRequests.length > 0 && (
        <Card className="bg-zinc-900 border-yellow-500/30">
          <CardHeader>
            <CardTitle className="text-sm text-yellow-400">Friend Requests ({receivedRequests.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {receivedRequests.map((req) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-between items-center p-2 bg-zinc-800 rounded"
              >
                <span className="text-sm text-white">{req.user_email}</span>
                <div className="flex gap-1">
                  <Button
                    onClick={() => handleAccept(req.id)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 h-7"
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button
                    onClick={() => handleDecline(req.id)}
                    size="sm"
                    variant="outline"
                    className="border-red-500/30 text-red-400 h-7"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Friends */}
      <Card className="bg-zinc-900 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-sm">Friends ({friends.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {friends.length === 0 ? (
            <p className="text-zinc-500 text-xs">No friends yet</p>
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => {
                const friendEmail = friend.user_email === userEmail ? friend.friend_email : friend.user_email;
                return (
                  <motion.div
                    key={friend.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-between items-center p-2 bg-zinc-800 rounded hover:bg-zinc-700 transition-colors"
                  >
                    <span className="text-sm text-white truncate flex-1">{friendEmail}</span>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => setActiveChat({ email: friendEmail, name: friendEmail })}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 h-7"
                      >
                        <MessageCircle className="w-3 h-3" />
                      </Button>
                      <Button
                        onClick={() => handleRemoveFriend(friend.id)}
                        size="sm"
                        variant="outline"
                        className="border-red-500/30 text-red-400 h-7"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat Window */}
      <AnimatePresence>
        {activeChat && (
          <ChatWindow
            friendEmail={activeChat.email}
            friendName={activeChat.name}
            currentUserEmail={userEmail}
            currentUserName={userName}
            onClose={() => setActiveChat(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}