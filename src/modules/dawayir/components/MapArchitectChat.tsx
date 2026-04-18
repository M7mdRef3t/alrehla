import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { getAuthUserId } from "@/domains/auth/store/auth.store";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface MapArchitectChatProps {
  onClose: () => void;
  onMapSaved: () => void;
}

export const MapArchitectChat: React.FC<MapArchitectChatProps> = ({ onClose, onMapSaved }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "أهلًا بك يا قائد. أنا مهندس الخرائط. احكيلي عن الأشخاص الموجودين في مداراتك دلوقتي عشان أرسم خريطتك السيادية. مين أقرب حد؟ ومين بيستنزف طاقتك؟",
    }
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = { id: `user-${Date.now()}`, role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);

    try {
      const userId = getAuthUserId();
      const res = await fetch("/api/chat/map-architect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage], userId })
      });

      const data = await res.json();

      if (data.reply) {
        setMessages(prev => [...prev, { id: `ast-${Date.now()}`, role: "assistant", content: data.reply }]);
      }

      if (data.saved_map) {
        setTimeout(() => {
          onMapSaved();
          onClose();
        }, 3000);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: "assistant", content: "حصل خطأ في الإرسال، حاول تاني." }]);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[32rem] border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="p-4 bg-linear-to-r from-teal-600 to-emerald-600 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            <span className="font-bold">مهندس الخرائط السيادي</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`px-4 py-2 max-w-[80%] rounded-2xl text-sm ${msg.role === "user" ? "bg-teal-600 text-white" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isStreaming && (
            <div className="flex justify-start">
              <div className="px-4 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex gap-2 items-end">
            <textarea
              className="flex-1 resize-none bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-teal-500 max-h-24 dark:text-white"
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="اكتب رسالتك للمهندس..."
              disabled={isStreaming}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="w-10 h-10 shrink-0 bg-teal-600 text-white rounded-xl flex items-center justify-center hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
