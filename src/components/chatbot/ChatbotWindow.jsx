import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Send, X, MessageCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ChatbotWindow() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    initializeChat();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeChat = async () => {
    try {
      const user = await base44.auth.me();
      if (!user) {
        setIsInitializing(false);
        return;
      }

      const conv = await base44.agents.createConversation({
        agent_name: 'supportAssistant',
        metadata: {
          name: 'Support Chat',
          description: 'Help and gameplay assistance'
        }
      });

      if (conv && conv.id) {
        setConversation(conv);
        setMessages(conv.messages && Array.isArray(conv.messages) ? conv.messages : []);
      }
    } catch (err) {
      console.error('Error initializing chat:', err);
      setConversation(null);
      setMessages([]);
    }
    setIsInitializing(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation) return;

    setIsLoading(true);
    try {
      const updatedConversation = await base44.agents.addMessage(conversation, {
        role: 'user',
        content: newMessage
      });

      if (updatedConversation && updatedConversation.messages) {
        setMessages(updatedConversation.messages);
        setConversation(updatedConversation);
        setNewMessage('');

        // Subscribe to updates for streaming response
        if (updatedConversation.id) {
          const unsubscribe = base44.agents.subscribeToConversation(updatedConversation.id, (data) => {
            if (data && data.messages && Array.isArray(data.messages)) {
              setMessages(data.messages);
            }
          });

          return () => unsubscribe();
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
    setIsLoading(false);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-32 right-4 z-40 w-14 h-14 bg-gradient-to-br from-purple-600 to-orange-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </motion.button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-32 right-4 z-50 w-96"
          >
            <Card className="bg-zinc-900 border-purple-500/50 h-96 flex flex-col shadow-2xl">
              <CardHeader className="flex justify-between items-center pb-3 border-b border-zinc-800">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Support Assistant
                </CardTitle>
                <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {isInitializing ? (
                  <div className="text-zinc-500 text-xs flex items-center justify-center h-full">
                    Initializing chat...
                  </div>
                ) : !messages || messages.length === 0 ? (
                  <div className="text-zinc-400 text-xs space-y-2 h-full flex flex-col justify-center">
                    <p className="font-bold text-purple-400">👋 Welcome!</p>
                    <p>I'm here to help with:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Gameplay tips & strategies</li>
                      <li>How features work</li>
                      <li>AI detection facts</li>
                      <li>Getting started</li>
                    </ul>
                  </div>
                ) : (
                  Array.isArray(messages) && messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg text-xs ${
                          msg.role === 'user'
                            ? 'bg-purple-600 text-white'
                            : 'bg-zinc-800 text-zinc-100 prose prose-invert prose-sm'
                        }`}
                      >
                        {msg.role === 'user' ? (
                          msg.content
                        ) : (
                          <ReactMarkdown className="prose prose-invert [&>*]:my-0 [&_ol]:my-1 [&_ul]:my-1 [&_li]:my-0">
                            {msg.content}
                          </ReactMarkdown>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              <div className="border-t border-zinc-800 p-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Ask anything..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !newMessage.trim()}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 h-8"
                >
                  <Send className="w-3 h-3" />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}