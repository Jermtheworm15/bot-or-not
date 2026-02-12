import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus } from 'lucide-react';

export default function FollowButton({ targetEmail, onFollowChange }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadFollowStatus();
  }, [targetEmail]);

  const loadFollowStatus = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      if (user.email === targetEmail) return;

      const follows = await base44.entities.Follow.filter({
        follower_email: user.email,
        following_email: targetEmail
      });
      
      setIsFollowing(follows.length > 0);
    } catch (err) {
      console.log('Follow status load error:', err);
    }
  };

  const handleToggleFollow = async () => {
    if (!currentUser || currentUser.email === targetEmail) return;

    setIsLoading(true);
    try {
      if (isFollowing) {
        const follows = await base44.entities.Follow.filter({
          follower_email: currentUser.email,
          following_email: targetEmail
        });
        if (follows.length > 0) {
          await base44.entities.Follow.delete(follows[0].id);
        }
      } else {
        await base44.entities.Follow.create({
          follower_email: currentUser.email,
          following_email: targetEmail
        });
      }
      
      setIsFollowing(!isFollowing);
      onFollowChange && onFollowChange(!isFollowing);
    } catch (err) {
      console.error('Follow toggle error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser || currentUser.email === targetEmail) return null;

  return (
    <Button
      onClick={handleToggleFollow}
      disabled={isLoading}
      variant={isFollowing ? "outline" : "default"}
      className={isFollowing ? "border-purple-500/50 text-purple-400" : "bg-purple-600 hover:bg-purple-700"}
    >
      {isFollowing ? (
        <>
          <UserMinus className="w-4 h-4 mr-2" />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-2" />
          Follow
        </>
      )}
    </Button>
  );
}