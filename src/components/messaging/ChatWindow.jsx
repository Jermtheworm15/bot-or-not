import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Send, X } from 'lucide-react';

export default function ChatWindow({ friendEmail, friendName, currentUserEmail, currentUserName, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();
    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (
        (event.data?.sender_email === friendEmail && event.data?.recipient_email === currentUserEmail) ||
        (event.data?.sender_email === currentUserEmail && event.data?.recipient_email === friendEmail)
      ) {
        loadMessages();
      }
    });
    return unsubscribe;
  }, [friendEmail, currentUserEmail]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const received = await base44.entities.Message.filter({
        sender_email: friendEmail,
        recipient_email: currentUserEmail
      });
      const sent = await base44.entities.Message.filter({
        sender_email: currentUserEmail,
        recipient_email: friendEmail
      });

      const all = [...received, ...sent].sort(
        (a, b) => new Date(a.created_date) - new Date(b.created_date)
      );

      setMessages(all);

      // Mark received messages as read
      for (const msg of received) {
        if (!msg.is_read) {
          await base44.entities.Message.update(msg.id, { is_read: true });
        }
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    }
    setIsLoading(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      await base44.entities.Message.create({
        sender_email: currentUserEmail,
        sender_name: currentUserName,
        recipient_email: friendEmail,
        content: newMessage,
        conversation_id: `${currentUserEmail}_${friendEmail}`
      });

      setNewMessage('');
      await loadMessages();
    } catch (err) {
      console.error('Error sending message:', err);
    }
    setIsSending(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed bottom-32 right-4 z-50 w-96"
    >
      <Card className="bg-zinc-900 border-purple-500/50 h-96 flex flex-col">
        <CardHeader className="flex justify-between items-center pb-3 border-b border-zinc-800">
          <CardTitle className="text-sm">{friendName}</CardTitle>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-3 space-y-3">
          {isLoading ? (
            <p className="text-zinc-500 text-xs">Loading...</p>
          ) : messages.length === 0 ? (
            <p className="text-zinc-500 text-xs">No messages yet. Say hello!</p>
          ) : (
            messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.sender_email === currentUserEmail ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-xs ${
                    msg.sender_email === currentUserEmail
                      ? 'bg-purple-600 text-white'
                      : 'bg-zinc-800 text-zinc-100'
                  }`}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        <div className="border-t border-zinc-800 p-3 flex gap-2">
          <input
            type="text"
            placeholder="Type message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isSending || !newMessage.trim()}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Send className="w-3 h-3" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}