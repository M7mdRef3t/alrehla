"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Sparkles, Brain, RefreshCw } from "lucide-react";
import { buildLifeContext } from "@/services/lifeAdvisor";
import { useAuthState } from "@/state/authState";
import { useLifeState } from "@/state/lifeState";

interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  latencyMs?: number;
}

interface LifeAdvisorChatProps {
  isOpen: boolean;
  onClose: () => void;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Life Advisor Chat Modal
 * ========================
 * واجهة محادثة مع جارفيس كمستشار حياة شامل.
 * يرسل life context كامل مع كل رسالة.
 */
export function LifeAdvisorChat({ isOpen, onClose }: LifeAdvisorChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokensLeft, setTokensLeft] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const userId = useAuthState(s => s.user?.id);
  const lifeScore = useLifeState(s => s.lifeScore);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading || !userId) return;

    const userMsg: Message = { id: uid(), role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      // Build fresh life context
      const ctx = buildLifeContext();

      // Format conversation history (exclude the message we just added)
      const history = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch("/api/life-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          context: ctx,
          userId,
          conversationHistory: history
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json();

      const modelMsg: Message = {
        id: uid(),
        role: "model",
        content: data.reply ?? "...",
        latencyMs: data.latencyMs
      };
      setMessages(prev => [...prev, modelMsg]);

      if (typeof data.tokensRemaining === "number") {
        setTokensLeft(data.tokensRemaining);
      }

    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطأ غير متوقع";
      setError(msg);
      // Remove the user message on error
      setMessages(prev => prev.filter(m => m.id !== userMsg.id));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, userId, messages]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  // Starter questions based on life score
  const starterQuestions = [
    "ما أهم حاجة لازم أركز عليها دلوقتي؟",
    "ليه مبقاش بنجز زي الأول؟",
    `مجال "${lifeScore ? Object.entries(lifeScore.domains).sort((a,b)=>a[1]-b[1])[0]?.[0] ?? "الذات" : "الذات"}" ضعيف — إيه أسبابه؟`,
    "ساعدني اتخذ قرار مهم"
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[80] flex flex-col"
          style={{ background: "#030309" }}
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-3 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #8b5cf620, #06b6d420)" }}>
                <Brain className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white">جارفيس</h2>
                <p className="text-[9px] text-white/25 font-bold uppercase tracking-wider">
                  LIFE ADVISOR
                  {tokensLeft !== null && (
                    <span className="text-violet-400 mr-1.5">· {tokensLeft} رصيد</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button onClick={clearChat}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center transition-all">
                  <RefreshCw className="w-3.5 h-3.5 text-white/30" />
                </button>
              )}
              <button onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center transition-all">
                <X className="w-4 h-4 text-white/40" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* Empty state */}
            {messages.length === 0 && (
              <motion.div className="space-y-6 pt-6" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.2 } }}>
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
                    style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}>
                    <Sparkles className="w-8 h-8 text-violet-400" />
                  </div>
                  <h3 className="text-base font-black text-white">مستشارك الاستراتيجي</h3>
                  <p className="text-xs text-white/30 font-medium leading-relaxed max-w-xs mx-auto">
                    جارفيس بيشوف كل مجالات حياتك وبيقدر يساعدك في القرارات والمشاكل والتحديات
                  </p>
                </div>

                {/* Starter questions */}
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-wider">ابدأ بـ:</p>
                  {starterQuestions.map((q, i) => (
                    <motion.button
                      key={i}
                      onClick={() => { setInput(q); setTimeout(() => sendMessage, 50); setInput(q); }}
                      className="w-full text-right px-3.5 py-2.5 rounded-2xl text-xs font-medium text-white/50 hover:text-white/80 transition-all"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.08 }}
                      whileHover={{ scale: 1.01 }}
                    >
                      {q}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Messages list */}
            {messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i === messages.length - 1 ? 0 : 0 }}
              >
                {msg.role === "model" && (
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-1 mr-2"
                    style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)" }}>
                    <Brain className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "rounded-tl-sm"
                    : "rounded-tr-sm"
                }`}
                  style={{
                    background: msg.role === "user"
                      ? "rgba(139,92,246,0.12)"
                      : "rgba(255,255,255,0.04)",
                    border: msg.role === "user"
                      ? "1px solid rgba(139,92,246,0.25)"
                      : "1px solid rgba(255,255,255,0.06)"
                  }}>
                  <p className="text-sm text-white/80 font-medium leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                  {msg.latencyMs && (
                    <span className="text-[8px] text-white/15 font-mono mt-1 block">
                      {msg.latencyMs}ms
                    </span>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <motion.div className="flex justify-start" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-1 mr-2"
                  style={{ background: "rgba(139,92,246,0.12)" }}>
                  <Brain className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tr-sm"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex gap-1 items-center">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400/50"
                        animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Error */}
            {error && (
              <motion.div className="rounded-2xl px-4 py-3 text-center"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-xs text-red-400 font-medium">{error}</p>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 pb-safe pb-4 pt-2 border-t border-white/5">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اسأل جارفيس..."
                className="flex-1 rounded-2xl px-4 py-3 text-sm text-white bg-white/5 border border-white/8 placeholder:text-white/20 resize-none focus:outline-none focus:border-violet-500/30 transition-colors min-h-[44px] max-h-[120px]"
                rows={1}
                style={{ caretColor: "#a78bfa" }}
              />
              <motion.button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 disabled:opacity-30 transition-all"
                style={{
                  background: input.trim() ? "linear-gradient(135deg, #8b5cf6, #06b6d4)" : "rgba(255,255,255,0.05)",
                  boxShadow: input.trim() ? "0 4px 15px rgba(139,92,246,0.3)" : "none"
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isLoading
                  ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                  : <Send className="w-4 h-4 text-white" />
                }
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
