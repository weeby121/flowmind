"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StudyPanel({ data }: { data: any }) {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;
    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: userMessage })
      });
      const resData = await response.json();
      setMessages(prev => [...prev, { role: 'ai', text: resData.answer }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: "Error connecting to backend." }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!data) return null;

  return (
    <div className="flex flex-col h-full bg-transparent text-slate-200 font-sans">
      
      {/* Soft Header */}
      <div className="px-6 py-5 border-b border-white/5 flex items-center gap-2">
        <Sparkles size={16} className="text-violet-400" />
        <h2 className="text-sm font-semibold text-slate-300 tracking-wide">
          {data.type === 'node' ? 'Concept Detail' : 'Document Overview'}
        </h2>
      </div>

      <div className="flex-grow overflow-y-auto scrollbar-hide flex flex-col">
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div key={data.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 mb-8">
              <h1 className="text-2xl font-bold text-white tracking-tight">{data.title}</h1>
              
              {data.summary && data.type === 'node' && (
                <div className="p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/10">
                  <p className="text-indigo-200 text-sm font-medium leading-relaxed">{data.summary}</p>
                </div>
              )}
              <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed">
                <p>{data.content}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          {messages.length > 0 && <div className="h-px w-full bg-white/5 my-6"></div>}

          {/* Bouncy Chat Bubbles */}
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", bounce: 0.4 }}
                key={idx} 
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className={`px-5 py-3.5 rounded-3xl max-w-[85%] text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white rounded-br-sm' 
                    : 'bg-[#1A1C23] border border-white/5 text-slate-200 rounded-tl-sm'
                }`}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <div className="px-5 py-3.5 rounded-3xl rounded-tl-sm bg-[#1A1C23] border border-white/5 max-w-fit flex items-center gap-1.5 shadow-sm">
                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce delay-200"></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Pill-shaped Floating Chat Input */}
      <div className="p-4 pb-6">
        <div className="relative flex items-center bg-[#1A1C23] border border-white/10 rounded-full shadow-lg focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask about these notes..."
            className="w-full bg-transparent pl-6 pr-12 py-3.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
          />
          <button 
            onClick={handleSendMessage}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 p-2 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white disabled:opacity-50 disabled:hover:bg-indigo-500 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}