import type { FC } from "react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Sparkles, Loader2, Minimize2, Maximize2 } from "lucide-react";
import { useAdminState } from "@/state/adminState";
import { callAdminApi } from "@/services/adminApi";

export const AdminCopilotModal: FC = () => {
  const isCopilotOpen = useAdminState((s) => s.isCopilotOpen);
  const setCopilotOpen = useAdminState((s) => s.setCopilotOpen);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "bot"; text: string }>>([
    { role: "bot", text: "أهلاً بك يا ريس في مركز السيادة. أنا مساعدك الذكي الخاص. اقدر ألخصلك الأرقام الحيوية، أقيّم لك شكاوي الزوار، أو أساعدك تحلل الأرواح المكتسبة مؤخراً. اؤمرني!" }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!query.trim() || loading) return;
    
    const userMessage = query.trim();
    const updatedMessages = [...messages, { role: "user" as const, text: userMessage }];
    setMessages(updatedMessages);
    setQuery("");
    setLoading(true);

    try {
      const state = useAdminState.getState();
      const contextData = {
        liveStats: state.liveStatsCache?.data,
        marketingOps: state.opsStatsCache?.data,
        alerts: state.hasSovereignAlert
      };

      const res = await callAdminApi<{ reply: string }>("copilot", {
        method: "POST",
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.text })),
          contextData
        })
      });

      if (res?.reply) {
        setMessages(prev => [...prev, { role: "bot", text: res.reply }]);
      } else {
        setMessages(prev => [...prev, { role: "bot", text: "عذراً يا ريس، في مشكلة في النواة ومقدرتش أوصل لنتيجة حالياً." }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: "bot", text: "حدث خطأ غير متوقع في الاتصال بالمساعد." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isCopilotOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-6 left-6 z-[100] w-80 md:w-96 flex flex-col bg-[#0B0F19] border border-slate-700/80 rounded-2xl shadow-[0_0_80px_rgba(20,184,166,0.15)] overflow-hidden"
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-white/5 bg-slate-900/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-teal-500/20 rounded-md">
                <Bot className="w-4 h-4 text-teal-400" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-200">المساعد الإداري</h3>
                <p className="text-[10px] text-teal-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> متصل بقلب الملاذ
                </p>
              </div>
            </div>
            <button
              onClick={() => setCopilotOpen(false)}
              className="p-1 text-slate-500 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[300px] min-h-[300px] bg-[#080B14]">
             {messages.map((m, idx) => (
                <div key={idx} className={`flex w-full ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`p-3 rounded-2xl max-w-[85%] text-sm ${
                    m.role === "user" 
                     ? "bg-slate-700 text-white rounded-tl-none" 
                     : "bg-teal-900/30 text-teal-100 border border-teal-500/20 rounded-tr-none"
                  }`}>
                    {m.text}
                  </div>
                </div>
             ))}
             {loading && (
               <div className="flex w-full justify-start">
                  <div className="p-3 rounded-2xl bg-teal-900/30 text-teal-400 border border-teal-500/20 rounded-tr-none flex items-center gap-2 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" /> جاري تحليل البيانات اللحظية...
                  </div>
               </div>
             )}
             <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-slate-900/50 border-t border-white/5 flex gap-2">
             <input 
               value={query}
               onChange={(e) => setQuery(e.target.value)}
               onKeyDown={(e) => e.key === "Enter" && handleSend()}
               placeholder="اسأل المساعد..."
               className="flex-1 bg-black/40 border border-slate-700 rounded-xl px-3 text-sm text-white focus:border-teal-500 outline-none"
             />
             <button 
               onClick={handleSend}
               disabled={!query.trim() || loading}
               className="p-2 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 text-white rounded-xl transition-colors"
             >
               <Send className="w-4 h-4" />
             </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
