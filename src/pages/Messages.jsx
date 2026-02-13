import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Search, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadConversations();
      const interval = setInterval(loadConversations, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
      const interval = setInterval(() => loadMessages(selectedConversation), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  const loadUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
    } catch (err) {
      console.log('Auth error:', err);
    }
  };

  const loadConversations = async () => {
    try {
      const sent = await base44.entities.Message.filter(
        { sender_email: currentUser.email },
        '-created_date',
        100
      );
      const received = await base44.entities.Message.filter(
        { recipient_email: currentUser.email },
        '-created_date',
        100
      );

      const allMessages = [...sent, ...received];
      const convMap = new Map();

      allMessages.forEach(msg => {
        const otherUser = msg.sender_email === currentUser.email 
          ? msg.recipient_email 
          : msg.sender_email;
        
        if (!convMap.has(otherUser) || new Date(msg.created_date) > new Date(convMap.get(otherUser).lastMessage)) {
          convMap.set(otherUser, {
            email: otherUser,
            name: msg.sender_email === currentUser.email ? msg.recipient_email : msg.sender_name,
            lastMessage: msg.created_date,
            lastContent: msg.content,
            unread: !msg.is_read && msg.recipient_email === currentUser.email
          });
        }
      });

      const convList = Array.from(convMap.values()).sort((a, b) => 
        new Date(b.lastMessage) - new Date(a.lastMessage)
      );

      setConversations(convList);
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (otherUserEmail) => {
    try {
      const sent = await base44.entities.Message.filter(
        { sender_email: currentUser.email, recipient_email: otherUserEmail },
        '-created_date',
        50
      );
      const received = await base44.entities.Message.filter(
        { sender_email: otherUserEmail, recipient_email: currentUser.email },
        '-created_date',
        50
      );

      const allMsgs = [...sent, ...received].sort((a, b) => 
        new Date(a.created_date) - new Date(b.created_date)
      );

      setMessages(allMsgs);

      // Mark received messages as read
      const unread = received.filter(m => !m.is_read);
      await Promise.all(
        unread.map(m => base44.entities.Message.update(m.id, { is_read: true }))
      );
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const message = await base44.entities.Message.create({
        sender_email: currentUser.email,
        sender_name: currentUser.full_name || currentUser.email,
        recipient_email: selectedConversation,
        content: newMessage.trim()
      });

      setMessages(prev => [...prev, message]);
      setNewMessage('');

      // Create notification for recipient
      await base44.entities.Notification.create({
        recipient_email: selectedConversation,
        sender_email: currentUser.email,
        sender_name: currentUser.full_name || currentUser.email,
        type: 'message',
        content: 'sent you a message',
        link: '/messages'
      });

      toast.success('Message sent!');
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-8">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />
      
      <div className="relative z-10 max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <MessageCircle className="w-10 h-10 text-purple-500" />
            <h1 className="text-4xl font-black">Messages</h1>
          </div>
          <p className="text-zinc-400">Connect with the community</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
          {/* Conversations List */}
          <Card className="bg-zinc-900 border-zinc-800 md:col-span-1">
            <CardHeader>
              <CardTitle className="text-white text-lg">Conversations</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="pl-10 bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[450px]">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No conversations yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800">
                    {filteredConversations.map(conv => (
                      <button
                        key={conv.email}
                        onClick={() => setSelectedConversation(conv.email)}
                        className={`w-full p-4 text-left hover:bg-zinc-800 transition-colors ${
                          selectedConversation === conv.email ? 'bg-zinc-800' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate">{conv.name}</p>
                            <p className="text-sm text-zinc-400 truncate">{conv.lastContent}</p>
                          </div>
                          <div className="flex flex-col items-end ml-2">
                            <span className="text-xs text-zinc-500">{getTimeAgo(conv.lastMessage)}</span>
                            {conv.unread && (
                              <div className="w-2 h-2 bg-purple-500 rounded-full mt-1" />
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Messages Area */}
          <Card className="bg-zinc-900 border-zinc-800 md:col-span-2">
            {selectedConversation ? (
              <>
                <CardHeader className="border-b border-zinc-800">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedConversation(null)}
                      className="md:hidden"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <CardTitle className="text-white">
                      {conversations.find(c => c.email === selectedConversation)?.name}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex flex-col h-[500px]">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                      {messages.map(msg => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender_email === currentUser.email ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs rounded-lg p-3 ${
                              msg.sender_email === currentUser.email
                                ? 'bg-purple-600 text-white'
                                : 'bg-zinc-800 text-white'
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {getTimeAgo(msg.created_date)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-800">
                    <div className="flex gap-2">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="bg-zinc-800 border-zinc-700 text-white resize-none"
                        rows={2}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                      />
                      <Button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}