import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { UserPlus, Check, Clock, X } from 'lucide-react';

export default function FriendButton({ targetUserEmail, currentUserEmail }) {
  const [friendStatus, setFriendStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkFriendStatus();
  }, [targetUserEmail, currentUserEmail]);

  const checkFriendStatus = async () => {
    try {
      const sent = await base44.entities.Friend.filter({
        user_email: currentUserEmail,
        friend_email: targetUserEmail
      });

      const received = await base44.entities.Friend.filter({
        user_email: targetUserEmail,
        friend_email: currentUserEmail
      });

      if (sent.length > 0) {
        setFriendStatus(sent[0].status);
      } else if (received.length > 0) {
        setFriendStatus(`received_${received[0].status}`);
      } else {
        setFriendStatus(null);
      }
    } catch (err) {
      console.error('Error checking friend status:', err);
    }
    setIsLoading(false);
  };

  const handleAddFriend = async () => {
    setIsLoading(true);
    try {
      await base44.entities.Friend.create({
        user_email: currentUserEmail,
        friend_email: targetUserEmail,
        requested_at: new Date().toISOString()
      });
      setFriendStatus('pending');
    } catch (err) {
      console.error('Error adding friend:', err);
    }
    setIsLoading(false);
  };

  const handleAccept = async (friendId) => {
    setIsLoading(true);
    try {
      await base44.entities.Friend.update(friendId, {
        status: 'accepted',
        accepted_at: new Date().toISOString()
      });
      setFriendStatus('accepted');
    } catch (err) {
      console.error('Error accepting friend request:', err);
    }
    setIsLoading(false);
  };

  const handleDecline = async (friendId) => {
    setIsLoading(true);
    try {
      await base44.entities.Friend.delete(friendId);
      setFriendStatus(null);
    } catch (err) {
      console.error('Error declining friend request:', err);
    }
    setIsLoading(false);
  };

  if (currentUserEmail === targetUserEmail) return null;
  if (isLoading) return null;

  if (!friendStatus) {
    return (
      <Button
        onClick={handleAddFriend}
        size="sm"
        className="bg-purple-600 hover:bg-purple-700 text-white"
      >
        <UserPlus className="w-4 h-4 mr-1" />
        Add Friend
      </Button>
    );
  }

  if (friendStatus === 'pending') {
    return (
      <Button disabled size="sm" variant="outline" className="border-yellow-500/30 text-yellow-400">
        <Clock className="w-4 h-4 mr-1" />
        Pending
      </Button>
    );
  }

  if (friendStatus === 'accepted') {
    return (
      <Button disabled size="sm" variant="outline" className="border-green-500/30 text-green-400">
        <Check className="w-4 h-4 mr-1" />
        Friends
      </Button>
    );
  }

  if (friendStatus.startsWith('received_')) {
    const status = friendStatus.split('_')[1];
    const friend = base44.entities.Friend.filter({
      user_email: targetUserEmail,
      friend_email: currentUserEmail
    });

    if (status === 'pending') {
      return (
        <div className="flex gap-1">
          <Button
            onClick={() => friend.then(f => f.length > 0 && handleAccept(f[0].id))}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Check className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => friend.then(f => f.length > 0 && handleDecline(f[0].id))}
            size="sm"
            variant="outline"
            className="border-red-500/30 text-red-400"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      );
    }
  }

  return null;
}