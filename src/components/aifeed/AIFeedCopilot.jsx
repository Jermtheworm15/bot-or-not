import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X, Sparkles, Loader2 } from 'lucide-react';

const SUGGESTIONS = [
  "What should I focus on today?",
  "Why is this trending?",
  "What's my best prediction strategy?",
  "Summarize today's AI news",
  "Which topics am I weakest at?"
];

export default function AIFeedCopilot({ userProfile, feedItems }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi! I'm your AI Copilot 🤖 Ask me anything about today's feed, your stats, or what to focus on next." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (text) => {
    const q = text || input.trim();
    if (!q || loading) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', text: q }]);
    setLoading(true);

    const newsContext = feedItems.slice(0, 5).map(f => `[${f.type}] ${f.title}: ${f.body?.slice(0, 80)}`).join('\n');
    const profileCtx = userProfile
      ? `User accuracy: ${userProfile.bot_accuracy || 0}% bot / ${userProfile.human_accuracy || 0}% human. Level ${userProfile.level || 1}. Points: ${userProfile.points || 0}.`
      : 'New user, no history yet.';

    const reply = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an AI Copilot for a bot-detection game platform. Be concise, insightful, and actionable. Max 3 sentences.

User profile: ${profileCtx}

Today's feed highlights:
${newsContext}

User question: ${q}`,
    });

    setMessages(m => [...m, { role: 'assistant', text: reply }]);
    setLoading(false);
  };

  return (
    <>
      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-24 right-4 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 shadow-lg shadow-violet-900/50 flex items-center justify-center"
      >
        {open ? <X className="w-5 h-5 text-white" /> : <Sparkles className="w-5 h-5 text-white" />}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-40 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-gradient-to-r from-violet-900/40 to-cyan-900/20">
              <Bot className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-black text-white">AI Copilot</span>
              <span className="ml-auto text-[10px] text-zinc-500">Powered by AI</span>
            </div>

            {/* Messages */}
            <div className="h-56 overflow-y-auto p-3 space-y-2 scrollbar-hide">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-violet-700 text-white rounded-br-sm'
                      : 'bg-zinc-800 text-zinc-200 rounded-bl-sm'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-800 px-3 py-2 rounded-xl">
                    <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Quick suggestions */}
            <div className="px-3 pb-2 flex gap-1 overflow-x-auto scrollbar-hide">
              {SUGGESTIONS.slice(0, 3).map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="flex-shrink-0 text-[9px] bg-zinc-800 hover:bg-violet-900/40 border border-zinc-700 hover:border-violet-600 text-zinc-400 hover:text-violet-300 px-2 py-1 rounded-full transition-colors">
                  {s}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex gap-2 p-3 pt-1">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Ask me anything..."
                className="flex-1 bg-zinc-800 border border-zinc-700 focus:border-violet-500 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none"
              />
              <button onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-8 h-8 rounded-xl bg-violet-600 hover:bg-violet-500 flex items-center justify-center disabled:opacity-40 transition-colors">
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}