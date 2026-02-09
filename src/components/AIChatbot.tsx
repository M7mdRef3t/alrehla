import React, { type FC, useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles, Loader2, Mic, MicOff } from "lucide-react";
import { geminiClient } from "../services/geminiClient";
import { getAgentToolDeclarations, executeToolCall } from "../agent";
import type { AgentContext, AgentActions } from "../agent";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { AgentCard, CustomExerciseCard } from "./agentCards";
import type { CardId, CustomExerciseSpec } from "./agentCards";
import { buildToneSystemBlock, resolveVoiceMode } from "../copy/toneGuide";
import { useAppContentString } from "../hooks/useAppContentString";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  /** بطاقات مرفقة برد المساعد (من showCard) */
  cardIds?: CardId[];
  /** تمرين مخصص (من generateCustomExercise) */
  customExerciseSpec?: CustomExerciseSpec;
}

interface AIChatbotProps {
  personLabel?: string;
  context?: string;
  agentContext?: AgentContext;
  agentActions?: AgentActions;
  systemPromptOverride?: string;
  /** لفتح تمرين التنفس من داخل البطاقات (مثلاً BreathingCard) */
  onOpenBreathing?: () => void;
  /** للانتقال لشاشة الخريطة (وضع Mod) */
  onNavigateToMap?: () => void;
}

export const AIChatbot: FC<AIChatbotProps> = ({
  personLabel,
  context,
  agentContext,
  agentActions,
  systemPromptOverride,
  onOpenBreathing,
  onNavigateToMap
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const cardsForThisTurnRef = useRef<string[]>([]);
  const customExerciseSpecRef = useRef<CustomExerciseSpec | null>(null);
  const { isSupported: speechSupported, isListening, error: speechError, start: startSpeech, stop: stopSpeech } = useSpeechRecognition({ lang: "ar-EG" });

  const questionPlaceholder = useAppContentString(
    "ai_chat_input_placeholder",
    "اكتب سؤالك هنا...",
    { page: "ai_chat" }
  );

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
    if (isOpen && messages.length === 0) {
      const welcomeMsg: Message = {
        id: "welcome",
        role: "assistant",
        content: personLabel
          ? `أنا مرشد الرحلة من غرفة العمليات. جاهزين نراجع جبهة ${personLabel} ونحدد أول مناورة؟`
          : "أنا مرشد الرحلة من غرفة العمليات. احكيلي الجبهة اللي بتسحب طاقتك ونبدأ بخطوة واضحة.",
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

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);

    const assistantId = `assistant-${Date.now()}`;
    const useTools = agentActions != null && systemPromptOverride != null;

    try {
      if (!aiAvailable) {
        const fallback = getFallbackReply(userMessage.content);
        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: "assistant",
            content: fallback,
            timestamp: Date.now()
          }
        ]);
      } else if (useTools) {
        cardsForThisTurnRef.current = [];
        const contents = messages.map((m) => ({
          role: m.role === "user" ? ("user" as const) : ("model" as const),
          parts: [{ text: m.content }]
        }));
        contents.push({ role: "user" as const, parts: [{ text: userMessage.content }] });

        const executeToolExecutor = async (name: string, args: object) => {
          if (name === "showCard") {
            const cardId = (args as { cardId?: string }).cardId;
            if (cardId === "breathing" || cardId === "guilt_detox") {
              cardsForThisTurnRef.current.push(cardId);
            }
            return { result: { ok: true } };
          }
          if (name === "generateCustomExercise") {
            const a = args as { goal?: string; type?: string; title?: string; durationSeconds?: number };
            const type = (a.type === "countdown" || a.type === "stopwatch") ? a.type : "countdown";
            const title = String(a.title ?? a.goal ?? "تمرين مخصص").trim() || "تمرين مخصص";
            const durationSeconds = typeof a.durationSeconds === "number" ? Math.max(0, a.durationSeconds) : 60;
            customExerciseSpecRef.current = { type, title, durationSeconds };
            return { result: { spec: { type, title, durationSeconds } } };
          }
          const out = await executeToolCall(name, args as Record<string, unknown>, agentActions);
          return { result: out.result, error: out.error };
        };

        const finalText = await geminiClient.generateWithTools(
          {
            contents,
            tools: [getAgentToolDeclarations()],
            systemInstruction: systemPromptOverride
          },
          executeToolExecutor
        );

        const cardIds = [...cardsForThisTurnRef.current] as CardId[];
        const customSpec = customExerciseSpecRef.current;
        customExerciseSpecRef.current = null;
        setMessages((prev) => {
          const withoutLast = prev.filter((m) => m.id !== assistantId);
          return [
            ...withoutLast,
            {
              id: assistantId,
              role: "assistant",
              content: finalText ?? "عذراً، ما قدرتش أكمّل. جرّب تاني.",
              timestamp: Date.now(),
              cardIds: cardIds.length > 0 ? cardIds : undefined,
              customExerciseSpec: customSpec ?? undefined
            }
          ];
        });
      } else {
        const conversationHistory = messages
          .map((m) => `${m.role === "user" ? "المستخدم" : "المساعد"}: ${m.content}`)
          .join("\n\n");
        const pulseInfo = (() => {
          const pulse = agentContext?.pulse;
          if (!pulse) return "";
          const moodMap: Record<string, string> = {
            bright: "رايق",
            calm: "هادئ",
            anxious: "قلقان",
            angry: "غضبان",
            sad: "حزين"
          };
          const focusMap: Record<string, string> = {
            event: "موقف حصل",
            thought: "فكرة مش بتروح",
            body: "جسدي تعبان",
            none: "ولا حاجة"
          };
          const moodLabel = moodMap[pulse.mood] ?? pulse.mood;
          const focusLabel = focusMap[pulse.focus] ?? pulse.focus;
          const line = `**النبض اللحظي:** طاقة ${pulse.energy}/10، مزاج: ${moodLabel}، تركيز: ${focusLabel}.`;
          const directive =
            pulse.mood === "angry"
              ? "تعليمات: المستخدم متوتر/غضبان. ركّز على التهدئة أولاً ولا تقترح مواجهات."
              : pulse.energy <= 3
                ? "تعليمات: طاقة منخفضة. قدّم خطوات خفيفة ودعم قصير فقط."
                : pulse.energy >= 8
                  ? "تعليمات: طاقة عالية. يمكن اقتراح خطوة جريئة واحدة."
                  : "";
          return `${line}\n${directive ? `${directive}\n` : ""}`;
        })();
        const toneContext = buildToneSystemBlock(agentContext?.pulse);

        const systemContext = `أنت مرشد الرحلة في منصة "الرحلة". دورك توجيه المستخدم بين أدوات الرحلة، وخصوصًا أداة "دواير" لتنظيم العلاقات وبناء الحدود الصحية.

${personLabel ? `**السياق:** المستخدم بيتعامل مع شخص اسمه "${personLabel}"` : ""}
${context ? `**المرحلة الحالية:** ${context}` : ""}
${pulseInfo}
${toneContext}

**أسلوب التنفيذ:**
- استخدم العامية المصرية الذكية.
- قدّم خطوة عملية واحدة واضحة.
- اسأل سؤال توضيحي فقط لما يكون لازم.
- لا تعطي نصائح طبية أو علاجية.

${conversationHistory ? `**المحادثة السابقة:**\n${conversationHistory}\n` : ""}

**سؤال المستخدم:**
${userMessage.content}`;

        let assistantContent = "";
        for await (const chunk of geminiClient.generateStream(systemContext)) {
          assistantContent += chunk;
          setMessages((prev) => {
            const withoutLast = prev.filter((m) => m.id !== assistantId);
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
      }
    } catch (error) {
      if (typeof import.meta !== "undefined" && (import.meta as { env?: { DEV?: boolean } }).env?.DEV) {
        console.error("Error in chatbot:", error);
      }
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: "عذراً، حصل خطأ. ممكن تحاول تاني؟",
          timestamp: Date.now()
        }
      ]);
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

  const handleMicClick = () => {
    if (isListening) {
      stopSpeech();
      return;
    }
    startSpeech((transcript) => {
      if (transcript) {
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        inputRef.current?.focus();
      }
    });
  };

  const aiAvailable = geminiClient.isAvailable();

  const getFallbackReply = (text: string) => {
    const trimmed = text.trim();
    const mode = resolveVoiceMode(agentContext?.pulse?.energy ?? null);
    const modePrefix =
      mode === "field_medic"
        ? "أولوية دلوقتي: وقف النزيف."
        : mode === "general_motivator"
          ? "طاقتك تسمح بخطوة حاسمة."
          : "خلّينا نفكك الموقف بهدوء.";
    if (!trimmed) return `${modePrefix} احكيلي الجبهة اللي محتاجة تدخل دلوقتي.`;
    if (trimmed.includes("مش عارف") || trimmed.includes("مش قادر")) {
      return `${modePrefix} اختار موقف واحد حصل قريب، واحنا نقفله خطوة خطوة.`;
    }
    if (trimmed.includes("خوف") || trimmed.includes("قلق")) {
      return `${modePrefix} خُد نفس عميق 4 مرات وثبّت موقعك، وبعدها قولي إيه مصدر الضجيج بالظبط.`;
    }
    if (trimmed.includes("حدود") || trimmed.includes("لا")) {
      return `${modePrefix} ممتاز. نفعّل الدرع بجملة واحدة جاهزة للموقف الجاي؟`;
    }
    return `${modePrefix} احكيلي موقف محدد: حصل إمتى، واتقال فيه إيه، وسحب منك طاقة قد إيه؟`;
  };

  return (
    <>
      {/* Floating Button — يظهر دائماً */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-linear-to-br from-purple-600 to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group z-50"
          aria-label="فتح مرشد الرحلة"
          title="مرشد الرحلة"
        >
          <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
          {aiAvailable && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" aria-hidden />
          )}
        </button>
      )}

      {/* Chat Window — يعمل مع/بدون AI */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border-2 border-purple-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-t-2xl">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-bold">مرشد الرحلة</h3>
              {aiAvailable ? (
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              ) : (
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">وضع بسيط</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {agentContext?.screen !== "map" && onNavigateToMap != null && (
                <button
                  type="button"
                  onClick={onNavigateToMap}
                  className="text-xs font-medium px-2 py-1 rounded-lg hover:bg-white/20 transition-colors"
                  aria-label="اعرض الخريطة"
                >
                  اعرض الخريطة
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 rounded-full p-1 transition-colors"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
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
                {msg.role === "assistant" && msg.cardIds?.length ? (
                  <div className="flex flex-col gap-1 mt-1 w-[85%] max-w-[85%]">
                    {msg.cardIds.map((cardId) => (
                      <AgentCard
                        key={cardId}
                        cardId={cardId}
                        onStartBreathing={onOpenBreathing}
                      />
                    ))}
                  </div>
                ) : null}
                {msg.role === "assistant" && msg.customExerciseSpec ? (
                  <div className="mt-1 w-[85%] max-w-[85%]">
                    <CustomExerciseCard spec={msg.customExerciseSpec} />
                  </div>
                ) : null}
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
            {speechError != null && (
              <p className="text-xs text-amber-600 mb-2 text-center">{speechError}</p>
            )}
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={questionPlaceholder}
                rows={2}
                disabled={isStreaming}
                className="flex-1 resize-none border-2 border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {speechSupported && (
                <button
                  type="button"
                  onClick={handleMicClick}
                  disabled={isStreaming}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isListening
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  aria-label={isListening ? "إيقاف الاستماع" : "تسجيل صوت"}
                  title={isListening ? "إيقاف الاستماع" : "تسجيل صوت"}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              )}
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className="w-10 h-10 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center shrink-0"
                aria-label="إرسال"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {speechSupported ? "ميكروفون • " : ""}
              Enter للإرسال • Shift+Enter سطر جديد
            </p>
          </div>
        </div>
      )}
    </>
  );
};
