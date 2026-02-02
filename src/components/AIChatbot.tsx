import React, { type FC, useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles, Loader2 } from "lucide-react";
import { geminiClient } from "../services/geminiClient";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface AIChatbotProps {
  personLabel?: string;
  context?: string; // Current situation or recovery stage
}

export const AIChatbot: FC<AIChatbotProps> = ({ personLabel, context }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Welcome message when chat opens for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0 && geminiClient.isAvailable()) {
      const welcomeMsg: Message = {
        id: "welcome",
        role: "assistant",
        content: personLabel
          ? `مرحباً! أنا هنا عشان أساعدك في رحلة التعافي مع ${personLabel}. إزاي أقدر أساعدك النهاردة؟`
          : "مرحباً! أنا هنا عشان أساعدك في رحلة التعافي. إزاي أقدر أساعدك النهاردة؟",
        timestamp: Date.now()
      };
      setMessages([welcomeMsg]);
    }
  }, [isOpen, messages.length, personLabel]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);

    // Build conversation history for context
    const conversationHistory = messages
      .map(m => `${m.role === "user" ? "المستخدم" : "المساعد"}: ${m.content}`)
      .join("\n\n");

    const systemContext = `أنت مساعد نفسي متخصص في التعافي من العلاقات الاستنزافية وبناء الحدود الصحية.

${personLabel ? `**السياق:** المستخدم بيتعامل مع شخص اسمه "${personLabel}"` : ''}
${context ? `**المرحلة الحالية:** ${context}` : ''}

**أسلوبك:**
- استخدم العامية المصرية
- كن متعاطفاً وداعماً
- قدم نصائح عملية محددة
- اسأل أسئلة توضيحية إذا لزم الأمر
- ركز على التمكين، مش الحلول الجاهزة
- لا تعطي نصائح طبية أو علاجية، بس دعم نفسي عام

${conversationHistory ? `**المحادثة السابقة:**\n${conversationHistory}\n` : ''}

**سؤال المستخدم:**
${userMessage.content}`;

    try {
      let assistantContent = "";
      const assistantId = `assistant-${Date.now()}`;

      // Stream the response
      for await (const chunk of geminiClient.generateStream(systemContext)) {
        assistantContent += chunk;
        
        // Update the last message with accumulated content
        setMessages(prev => {
          const withoutLast = prev.filter(m => m.id !== assistantId);
          return [
            ...withoutLast,
            {
              id: assistantId,
              role: "assistant",
              content: assistantContent,
              timestamp: Date.now()
            }
          ];
        });
      }

    } catch (error) {
      console.error('Error in chatbot:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "عذراً، حصل خطأ. ممكن تحاول تاني؟",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const aiAvailable = geminiClient.isAvailable();

  return (
    <>
      {/* Floating Button — يظهر دائماً */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group z-50"
          aria-label="فتح المساعد الذكي"
          title="المساعد الذكي"
        >
          <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
          {aiAvailable && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" aria-hidden />
          )}
        </button>
      )}

      {/* لو مفيش مفتاح Gemini: نافذة صغيرة تشرح التفعيل */}
      {isOpen && !aiAvailable && (
        <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col z-50 border-2 border-purple-200 dark:border-slate-600 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              المساعد الذكي
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full p-1.5 transition-colors"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
            المساعد الذكي يحتاج تفعيل مفتاح Gemini عشان يشتغل. انسخ ملف <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">.env.local.example</code> إلى <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">.env.local</code> وضيف فيه <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">VITE_GEMINI_API_KEY</code> (مفتاحك من Google AI)، بعدين أعد تشغيل التطبيق.
          </p>
          <a
            href="https://makersuite.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline"
          >
            احصل على مفتاح Gemini ←
          </a>
        </div>
      )}

      {/* Chat Window — لما Gemini مفعّل */}
      {isOpen && aiAvailable && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border-2 border-purple-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-2xl">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-bold">المساعد الذكي</h3>
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 rounded-full p-1 transition-colors"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.role === "user"
                      ? "bg-purple-600 text-white"
                      : "bg-white text-gray-900 border border-gray-200"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.role === "user" ? "text-purple-200" : "text-gray-400"
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString("ar-EG", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>
              </div>
            ))}
            {isStreaming && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-900 border border-gray-200 rounded-2xl px-4 py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اكتب سؤالك هنا..."
                rows={2}
                disabled={isStreaming}
                className="flex-1 resize-none border-2 border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className="w-10 h-10 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center flex-shrink-0"
                aria-label="إرسال"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              اضغط Enter للإرسال • Shift+Enter للسطر الجديد
            </p>
          </div>
        </div>
      )}
    </>
  );
};
