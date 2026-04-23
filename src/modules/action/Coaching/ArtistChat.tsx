import React, { useState, useEffect, useRef } from 'react';
import { Zap as Sparkles, Send, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { nexusService } from '@/services/nexusService';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface ArtistChatProps {
  onClose: () => void;
}

export const ArtistChat: React.FC<ArtistChatProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Fetch user insights from Nexus when component mounts
    const fetchInsights = async () => {
      try {
        const myInsights = await nexusService.getMyInsights();
        setInsights(myInsights);
        
        // Push initial greeting from the Artist
        setMessages([
          {
            role: 'model',
            content: myInsights.length > 0 
              ? `أهلاً بيك يا مسافر.. بصيت على بصيرتك الأخيرة في الخزنة.. حابب نتكلم فيها ولا في طريق تاني شاغل بالك؟`
              : `أهلاً بيك في مساحتك الحرة. أنا هنا عشان أسمعك وأكون مراية لوعيك. إيه اللي شاغل تفكيرك النهارده؟`
          }
        ]);
      } catch (err) {
        console.error("Failed to fetch insights:", err);
      }
    };
    fetchInsights();
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputVal.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: inputVal.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputVal('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/artist/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          insights: insights
        })
      });

      if (!response.ok) {
        throw new Error('فشل في الوصول لعقل الفنان.. ممكن تحاول تاني؟');
      }

      const data = await response.json();
      
      setMessages((prev) => [...prev, { role: 'model', content: data.reply }]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-in fade-in duration-500 overflow-hidden" dir="rtl">
      <div className="w-full max-w-3xl h-[85vh] flex flex-col bg-slate-900/60 border border-teal-500/20 rounded-[2rem] shadow-[0_0_60px_rgba(20,184,166,0.1)] relative overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 shadow-[0_0_20px_rgba(20,184,166,0.2)] border border-teal-500/30 flex items-center justify-center relative">
              <Sparkles className="w-6 h-6 text-teal-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">فنان الوعي</h2>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-teal-400"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </span>
                <span className="text-xs text-teal-300/80 font-bold tracking-wider">
                  متصل بـ الخزنة السيادية
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 border border-white/10 hover:bg-rose-500/20 hover:text-rose-400 rounded-full transition-all group">
            <X className="w-5 h-5 opacity-70 group-hover:opacity-100" />
          </button>
        </div>

        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] p-5 rounded-2xl text-sm md:text-base leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-teal-600/20 border border-teal-500/30 text-white rounded-br-sm' 
                    : 'bg-slate-800/60 border border-white/5 text-slate-200 rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="px-5 py-4 bg-slate-800/40 border border-white/5 rounded-2xl rounded-bl-sm text-slate-400 flex items-center gap-2">
                   <Sparkles className="w-4 h-4 animate-spin text-teal-500/50" />
                   <span className="text-xs font-bold animate-pulse">فنان الوعي بيتأمل...</span>
                </div>
              </motion.div>
            )}
            {error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center"
              >
                <div className="px-5 py-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-xs flex items-center gap-2">
                   <AlertCircle className="w-4 h-4" />
                   <span>{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-900 border-t border-white/10">
          <div className="relative max-w-4xl mx-auto flex items-center gap-3">
            <input 
              type="text" 
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب اللي حاسس بيه دلوقتي..."
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm outline-none focus:border-teal-500/50 focus:bg-teal-500/5 transition-all"
              disabled={isLoading}
            />
            <button 
              onClick={handleSend}
              disabled={!inputVal.trim() || isLoading}
              className="p-4 bg-teal-500 text-slate-950 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-400 hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.3)]"
            >
              <Send className="w-5 h-5 rtl:-scale-x-100" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
