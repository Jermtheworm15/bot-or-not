import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, MessageCircle, X } from 'lucide-react';
import { toast } from 'sonner';

export default function ArcadeChat({ gameId = null }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadUser();
    loadMessages();

    // Real-time subscription
    const unsubscribe = base44.entities.ArcadeChat.subscribe((event) => {
      if (event.type === 'create') {
        setMessages(prev => [...prev, event.data]);
        scrollToBottom();
      }
    });

    return () => unsubscribe();
  }, [gameId]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error('[Chat] Auth error:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const filter = gameId ? { game_id: gameId } : {};
      const chatMessages = await base44.entities.ArcadeChat.filter(filter, '-created_date', 50);
      setMessages(chatMessages.reverse());
      scrollToBottom();
    } catch (error) {
      console.error('[Chat] Load error:', error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      const username = user.username || user.email.split('@')[0];
      
      await base44.entities.ArcadeChat.create({
        user_email: user.email,
        username,
        message: newMessage.trim(),
        game_id: gameId
      });

      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('[Chat] Send error:', error);
      toast.error('Failed to send message');
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-40 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <Card className="fixed bottom-24 right-4 z-40 w-80 h-96 bg-black/95 border-purple-500/50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-purple-500/30">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-purple-400" />
          <h3 className="font-bold text-white">Arcade Chat</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-green-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={msg.id || idx}
            className={`${
              msg.user_email === user?.email
                ? 'bg-purple-900/30 ml-8'
                : 'bg-black/60 mr-8'
            } rounded p-3`}
          >
            <div className="text-xs text-green-400 mb-1">{msg.username}</div>
            <div className="text-sm text-white">{msg.message}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-purple-500/30">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="bg-black/60 border-purple-500/30 text-white placeholder:text-green-500/40"
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="bg-purple-600 hover:bg-purple-700 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}