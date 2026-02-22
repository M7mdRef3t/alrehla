/**
 * ════════════════════════════════════════════════════════════════════════════
 * 🎙️ LIVE CONVERSATION WIDGET — مهندس الوعي الحي
 * ════════════════════════════════════════════════════════════════════════════
 *
 * واجهة المحادثة الصوتية مع Gemini Live API
 * تظهر كـ floating widget في الزاوية السفلية من الشاشة
 */

import type { FC } from "react";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Phone, PhoneOff, MessageSquare, Minimize2, Maximize2 } from "lucide-react";
import { useGeminiLive } from "../hooks/useGeminiLive";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TYPES
 * ═══════════════════════════════════════════════════════════════════════════
 */

interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
}

interface LiveConversationWidgetProps {
  apiKey: string;
  /** إظهار الـ widget مباشرة أو إخفاءه */
  initiallyVisible?: boolean;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const LiveConversationWidget: FC<LiveConversationWidgetProps> = ({
  apiKey,
  initiallyVisible = false
}) => {
  // ─── State ────────────────────────────────────────────────────────────────
  const [isVisible, setIsVisible] = useState(initiallyVisible);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ─── Gemini Live Hook ─────────────────────────────────────────────────────
  const {
    isConnected,
    isListening,
    connect,
    disconnect,
    startListening,
    stopListening
  } = useGeminiLive({
    apiKey,
    onResponse: useCallback((text: string) => {
      // إضافة رد الـ AI للمحادثة
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: "assistant",
          text,
          timestamp: Date.now()
        }
      ]);
    }, []),
    onError: useCallback((err: Error) => {
      setError(err.message);
      console.error("Live API Error:", err);
    }, []),
    autoSendContext: true // إرسال حالة الخريطة تلقائياً
  });

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleToggleConnection = useCallback(() => {
    if (isConnected) {
      disconnect();
      setMessages([]);
      setError(null);
    } else {
      connect();
    }
  }, [isConnected, connect, disconnect]);

  const handleToggleListening = useCallback(() => {
    if (isListening) {
      void stopListening();
    } else {
      void startListening();
    }
  }, [isListening, startListening, stopListening]);

  // ─── Render ───────────────────────────────────────────────────────────────
  if (!isVisible) {
    // زر عائم لفتح الـ widget
    return (
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        onClick={() => setIsVisible(true)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full cta-primary flex items-center justify-center shadow-lg"
        style={{
          boxShadow: "0 4px 20px rgba(45, 212, 191, 0.3)"
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title="فتح مهندس الوعي"
      >
        <MessageSquare className="w-6 h-6" />
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-6 z-50"
        style={{
          width: isExpanded ? "400px" : "320px",
          maxHeight: isExpanded ? "600px" : "auto"
        }}
      >
        <div
          className="glass-card overflow-hidden"
          style={{
            background: "rgba(15, 23, 42, 0.95)",
            backdropFilter: "blur(16px)",
            border: isConnected
              ? "1px solid rgba(45, 212, 191, 0.3)"
              : "1px solid rgba(255, 255, 255, 0.1)"
          }}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: isConnected
                    ? "var(--ring-safe)"
                    : "var(--text-muted)",
                  boxShadow: isConnected
                    ? "0 0 8px var(--ring-safe-glow)"
                    : "none"
                }}
              />
              <h3
                className="text-sm font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                مهندس الوعي
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsExpanded((v) => !v)}
                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                style={{ color: "var(--text-secondary)" }}
                title={isExpanded ? "تصغير" : "توسيع"}
              >
                {isExpanded ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsVisible(false)}
                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                style={{ color: "var(--text-secondary)" }}
                title="إخفاء"
              >
                ✕
              </button>
            </div>
          </div>

          {/* ── Error Display ── */}
          {error && (
            <div
              className="px-4 py-3 text-xs border-b border-white/10"
              style={{
                background: "rgba(248, 113, 113, 0.1)",
                color: "var(--ring-danger)"
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* ── Messages (إذا موسّع) ── */}
          {isExpanded && (
            <div
              className="p-4 space-y-3 overflow-y-auto"
              style={{ maxHeight: "400px" }}
            >
              {messages.length === 0 ? (
                <p
                  className="text-xs text-center py-8"
                  style={{ color: "var(--text-muted)" }}
                >
                  {isConnected
                    ? "ابدأ الحديث وأنا هسمعك..."
                    : "اضغط على زر الاتصال للبدء"}
                </p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className="max-w-[80%] px-3 py-2 rounded-lg text-xs"
                      style={{
                        background:
                          msg.role === "user"
                            ? "rgba(45, 212, 191, 0.2)"
                            : "rgba(255, 255, 255, 0.05)",
                        color: "var(--text-primary)"
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Controls ── */}
          <div className="p-4 space-y-3">
            {/* زر الاتصال/قطع الاتصال */}
            <button
              type="button"
              onClick={handleToggleConnection}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                isConnected ? "cta-danger" : "cta-primary"
              }`}
              disabled={!apiKey}
            >
              {isConnected ? (
                <span className="flex items-center justify-center gap-2">
                  <PhoneOff className="w-4 h-4" />
                  إنهاء المحادثة
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" />
                  بدء المحادثة
                </span>
              )}
            </button>

            {/* زر الاستماع (يظهر فقط عند الاتصال) */}
            {isConnected && (
              <button
                type="button"
                onClick={handleToggleListening}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                  isListening
                    ? "bg-red-500/20 border border-red-500/30 text-red-400"
                    : "glass-button"
                }`}
                style={
                  isListening
                    ? {
                        animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                      }
                    : undefined
                }
              >
                {isListening ? (
                  <span className="flex items-center justify-center gap-2">
                    <MicOff className="w-4 h-4" />
                    إيقاف الاستماع
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Mic className="w-4 h-4" />
                    ابدأ الكلام
                  </span>
                )}
              </button>
            )}

            {/* حالة الـ connection */}
            <p
              className="text-[10px] text-center"
              style={{ color: "var(--text-muted)" }}
            >
              {isConnected
                ? isListening
                  ? "🎤 أنا بسمعك دلوقتي..."
                  : "✅ متصل - اضغط للكلام"
                : "⚪ غير متصل"}
            </p>
          </div>
        </div>

        {/* CSS للـ pulse animation */}
        <style>{`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.7;
            }
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
};
