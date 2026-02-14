import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { User, UserPlus, MessageCircle, Trophy } from 'lucide-react';
import FriendButton from './FriendButton';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

export default function ClickableUsername({ 
  username, 
  userEmail, 
  className = '' 
}) {
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (err) {
        console.error('Error loading user:', err);
      }
    };
    loadUser();
  }, []);

  const handleViewProfile = () => {
    navigate(`${createPageUrl('Profile')}?user=${userEmail}`);
  };

  const handleMessage = () => {
    navigate(`${createPageUrl('Messages')}?user=${userEmail}`);
  };

  // Don't make clickable if it's the current user
  if (currentUser?.email === userEmail) {
    return <span className={className}>{username}</span>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={`hover:underline hover:text-purple-400 transition-colors ${className}`}>
          {username}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 bg-zinc-900 border-purple-500/30 p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
            <User className="w-5 h-5 text-purple-400" />
            <p className="font-semibold text-white">{username}</p>
          </div>
          
          <div className="space-y-2">
            <Button
              onClick={handleViewProfile}
              variant="outline"
              className="w-full justify-start border-purple-500/30 hover:bg-purple-900/30"
            >
              <Trophy className="w-4 h-4 mr-2" />
              View Profile
            </Button>
            
            <Button
              onClick={handleMessage}
              variant="outline"
              className="w-full justify-start border-purple-500/30 hover:bg-purple-900/30"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Send Message
            </Button>
            
            {currentUser && (
              <FriendButton 
                targetUserEmail={userEmail}
                currentUserEmail={currentUser.email}
              />
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}