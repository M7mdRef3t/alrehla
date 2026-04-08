import { logger } from "../services/logger";
import React, { type FC, useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles, Loader2, Mic, MicOff, History } from "lucide-react";
import { geminiClient } from "@/services/geminiClient";
import {
  getAgentToolDeclarations,
  executeToolCall,
  evaluateCodingPromptConstraints,
  buildPromptCoachingMessage,
  buildCodingSystemConstraintBlock
} from "@/agent";
import type { AgentContext, AgentActions } from "@/agent";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { AgentCard, CustomExerciseCard } from "./agentCards";
import type { CardId, CustomExerciseSpec } from "./agentCards";
import { buildToneSystemBlock, resolveVoiceMode } from "@/copy/toneGuide";
import { useAppContentString } from "@/hooks/useAppContentString";
import { consciousnessService, type MemoryMatch } from "@/services/consciousnessService";
import { ConsciousnessArchiveModal } from "./ConsciousnessArchiveModal";
import { canSendAIMessage, recordAIMessage, getRemainingAIMessages } from "@/services/subscriptionManager";
import { PaywallGate } from "@/modules/meta/PaywallGate";
import { AnimatePresence } from "framer-motion";
import { runtimeEnv } from "@/config/runtimeEnv";
import { useGamificationState } from "@/services/gamificationEngine";
import { scanForVampires } from "@/services/propheticEngine";
import { useEventHistoryStore } from "@/state/eventHistoryStore";
import { SwarmPersonaSelector } from "@/modules/exploration/SwarmPersonaSelector";
import { MemoryStore } from "@/services/memoryStore";
import { semanticCompressor } from "@/services/semanticCompressor";
import { dynamicContextRouter } from "@/services/dynamicContextRouter";
import { getAuthUserId } from "@/state/authState";
import { getFromLocalStorage, setInLocalStorage } from "@/services/browserStorage";

const GUEST_MEMORY_ACTOR_KEY = "dawayir_guest_memory_actor_id";

function createGuestMemoryActorId(): string {
  return `guest_memory_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function resolveMemoryActorId(): string {
  const authUserId = getAuthUserId();
  if (authUserId) return authUserId;

  const storedGuestId = getFromLocalStorage(GUEST_MEMORY_ACTOR_KEY);
  if (storedGuestId) return storedGuestId;

  const nextGuestId = createGuestMemoryActorId();
  setInLocalStorage(GUEST_MEMORY_ACTOR_KEY, nextGuestId);
  return nextGuestId;
}

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
  showLauncher?: boolean;
  defaultOpen?: boolean;
  onRequestClose?: () => void;
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
  showLauncher = true,
  defaultOpen = false,
  onRequestClose,
  onOpenBreathing,
  onNavigateToMap
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [mirrorMatches, setMirrorMatches] = useState<MemoryMatch[]>([]);
  const [mirrorSourceFilter, setMirrorSourceFilter] = useState<"both" | "pulse" | "chat">("both");
  const [showArchive, setShowArchive] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [, setRemainingMessages] = useState(getRemainingAIMessages());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const cardsForThisTurnRef = useRef<string[]>([]);
  const customExerciseSpecRef = useRef<CustomExerciseSpec | null>(null);
  const { isSupported: speechSupported, isListening, error: speechError, start: startSpeech, stop: stopSpeech } = useSpeechRecognition({ lang: "ar-EG" });

  // Neural Context (Phase 19)
  const rank = useGamificationState(s => s.rank);
  const vampires = scanForVampires().length;
  const recentEvents = useEventHistoryStore(s => s.events);

  const questionPlaceholder = useAppContentString(
    "ai_chat_input_placeholder",
    `تحدث مع مساعدك (${rank})...`,
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

  useEffect(() => {
    if (defaultOpen) setIsOpen(true);
  }, [defaultOpen]);

  // Welcome message when chat opens for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Dynamic Greeting based on Rank & Danger
      let greeting = `أهلاً بك أيها الـ **${rank}**. 🛡️`;

      // Proactive event recognition (Phase 22)
      if (recentEvents.length > 0) {
        const last = recentEvents[0];
        const eventDesc = last.type === "MAJOR_DETACHMENT" ? `نقل "${last.nodeLabel}" للمدار الخارجي` : `تحريك "${last.nodeLabel}"`;
        greeting += `\n\nرصدتُ آخر تحرك في الميدان: **${eventDesc}**. `;
      }

      if (vampires > 0) {
        greeting += `\n\n⚠️ أجهزة الاستشعار لا تزال ترصد **${vampires}** مصادر استنزاف. هل نتحرك يا قائد؟`;
      } else {
        greeting += `\n\nالأنظمة مستقرة. المدارات آمنة. جاهز لتلقي أوامر العمليات الاستراتيجية اليوم.`;
      }

      const welcomeMsg: Message = {
        id: "welcome",
        role: "assistant",
        content: greeting, // buildPersonalizedWelcome(personLabel), // Overridden for Phase 19
        timestamp: Date.now()
      };
      setMessages([welcomeMsg]);
    }
  }, [isOpen, messages.length, personLabel, rank, recentEvents, vampires]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    // Check subscription limit
    if (!canSendAIMessage()) {
      setShowPaywall(true);
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: Date.now()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // ─── Semantic Compression Layer (Phase 2) ───
    if (semanticCompressor.shouldCompress(messages.length + 1)) {
      void (async () => {
        const shift = await semanticCompressor.compressMessages([...messages, userMessage]);
        if (shift) {
          await dynamicContextRouter.handleSemanticShift(shift);
        }
      })();
    }

    const codingPromptCheck = evaluateCodingPromptConstraints(userMessage.content);
    if (codingPromptCheck.isCodingRequest && !codingPromptCheck.isReady) {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: buildPromptCoachingMessage(codingPromptCheck.missing),
          timestamp: Date.now()
        }
      ]);
      return;
    }

    setIsStreaming(true);
    recordAIMessage();
    setRemainingMessages(getRemainingAIMessages());

    // تسجيل الرسالة في ذاكرة الوعي (local + Supabase) + استرجاع مرآة الوعي
    consciousnessService.addToMemory(`المستخدم: ${userMessage.content}`);
    void (async () => {
      try {
        await consciousnessService.saveMoment(null, userMessage.content, "chat");
        const sourceList =
          mirrorSourceFilter === "pulse"
            ? (["pulse"] as Array<"pulse" | "chat">)
            : mirrorSourceFilter === "chat"
              ? (["chat"] as Array<"pulse" | "chat">)
              : (["pulse", "chat"] as Array<"pulse" | "chat">);
        const matches = await consciousnessService.recallSimilarMoments(userMessage.content, {
          threshold: 0.7,
          limit: 3,
          sources: sourceList
        });
        setMirrorMatches(matches);
      } catch {
        // نتجاهل أي خطأ عشان ما يبوظش تجربة الشات
      }
    })();

    // استرجاع الذكريات من الذاكرة طويلة المدى (RAG)
    const memoryActorId = resolveMemoryActorId();
    const ragMemories = await MemoryStore.recallMemories(userMessage.content, memoryActorId, 3);
    const ragContextBlock = MemoryStore.formatMemoriesForPrompt(ragMemories);

    // حفظ الرسالة في الذاكرة طويلة المدى
    void MemoryStore.storeMemory(userMessage.content, "conversation", memoryActorId);

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
            systemInstruction: codingPromptCheck.isCodingRequest
              ? `${systemPromptOverride}\n\n${buildCodingSystemConstraintBlock()}`
              : systemPromptOverride
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
            sad: "حزين",
            tense: "متوتر",
            hopeful: "متفائل",
            overwhelmed: "مغ overwhelm"
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
            (pulse.mood === "angry" || pulse.mood === "tense")
              ? "تنبيه ميداني: القائد تحت ضغط عالي. الأولوية لتفعيل بروتوكول التهدئة (Breathing) وتأمين الحالة المزاجية."
              : pulse.energy <= 3
                ? "تنبيه ميداني: مخزون الطاقة منخفض. اقترح وضعية دفاعية (Defensive Posture) وتجنب أي اشتباك."
                : pulse.energy >= 8
                  ? "تنبيه ميداني: الطاقة في مستويات هجومية. يمكن اقتراح مناورة جريئة أو حسم موقف معلق."
                  : "";
          return `${line}\n${directive ? `${directive}\n` : ""}`;
        })();
        const toneContext = buildToneSystemBlock(agentContext?.pulse);

        // دمج أفضل 2–3 Matches من مرآة الوعي (مع الوسوم) في سياق النظام
        const mirrorContextBlock = (() => {
          if (!mirrorMatches?.length) return "";
          const top = mirrorMatches.slice(0, 3);
          const allTags = Array.from(
            new Set(
              top
                .flatMap((m) => (Array.isArray(m.tags) ? m.tags : []))
                .map((t) => t.trim())
                .filter(Boolean)
            )
          );
          const lines = top.map((m, idx) => {
            const dateLabel = m.created_at
              ? new Date(m.created_at).toLocaleString("ar-EG")
              : "تاريخ غير معروف";
            const sourceLabel =
              m.source === "chat" ? "من الشات" : m.source === "pulse" ? "من البوصلة" : "ملاحظة";
            const tagsLabel =
              Array.isArray(m.tags) && m.tags.length > 0
                ? ` | الوسوم: ${m.tags.join(", ")}`
                : "";
            return `- [${idx + 1}] (${sourceLabel} – ${dateLabel}) ${m.content}${tagsLabel}`;
          });
          const tagsBlock = allTags.length
            ? `\n**ملحوظة الموديل عن الوسوم:** اعتبر أن هذه الوسوم تمثل مواضيع متكررة في وعي المستخدم (مثلاً: ${allTags.join(
              ", "
            )}). اربط ردّك بالمواضيع دي لكن بدون تكرار الوسوم حرفياً للمستخدم.\n`
            : "";
          return top.length
            ? `\n**ومضات من أرشيف وعي المستخدم (لا تكررها حرفياً، بل استخدمها كخلفية لفهم النمط):**\n${lines.join(
              "\n"
            )}\n${tagsBlock}`
            : "";
        })();

        const systemContext = `أنت "المستشار التكتيكي"(Tactical Advisor) في غرفة عمليات "الرحلة".
        دورك: تحويل مشاعر المستخدم لخطط عملية، والتعامل مع التحديات كأنها "مهمات ميدانية".
أنت لست معالجاً نفسياً، أنت قائد استراتيجي يساعد المستخدم("القائد") على استعادة السيطرة.

**الدستور والعقيدة (Constitution):**
"الرحلة واحدة.. والقصة قصتك" | "غرفة عمليات الوعي - نظام التشغيل الجديد لعقلك".
المنصة ليست عصا سحرية للعلاج، بل هي "بوصلة" و"رادار" يضع القرار في يد المستخدم.
المستخدم ليس "مريضاً" يبحث عن فضفضة، بل هو "قائد ميداني" (Commander) يدافع عن مملكته النفسية ويسعى لاسترداد سيادته.

        ${personLabel ? `**الهدف المرصود:** التعامل مع "${personLabel}"` : ""}
${context ? `**حالة الميدان:** ${context}` : ""}
${pulseInfo}
${toneContext}
${mirrorContextBlock}
${ragContextBlock}

**سجل الأحداث الميدانية (Recent Map Events):**
${recentEvents.slice(0, 5).map(e => `- تحريك ${e.nodeLabel} من ${e.fromRing} إلى ${e.toRing} (${new Date(e.timestamp).toLocaleTimeString("ar-EG")})`).join("\n")}

** الدستور التكتيكي(The Code):**
        1. ** اللغة:** عامية مصرية ذكية، مباشرة، وتستخدم مصطلحات "غرفة العمليات"(مهمة، دروع، مناورة، استنزاف، تأمين).
2. ** الأسلوب:** لا تعطي "نصائح عامة"، بل أعط "أوامر عمليات"(Actionable Orders). حازم، مباشر، محفز.
3. ** التركيز:** حول الشكوى إلى "هدف". (مثلاً: "أنا مخنوق" -> "محتاجين نفعّل بروتوكول تفريغ الضغط فوراً").
4. ** الممنوعات (Blacklist):** يمنع تماماً استخدام الكلمات التالية: (مريض، علاج، معلش، استحمل، ظروف، اكتئاب، فضفضة، ضحية). لا تستخدم العواطف الزائفة.
5. ** القاموس المعتمد (Whitelist):** استخدم حصراً: (قائد، تكتيك، مناورة، استنزاف، جبهة، استعادة السيطرة، وقائع، تفعيل الدرع، غرفة العمليات).
6. ** الصلاحيات:** مسموح لك استخدام أدوات النظام(دروع، قناص أفكار، كبسولة صيام) كاقتراحات تكتيكية.
7. ** حماية القصر:** يمنع توجيه نصائح تكتيكية (بتر/تجاهل) لمن هم دون 18 عاماً.

** أمثلة للردود:**
        - بدل "حاول تهدأ": "فعّل بروتوكول الهدوء (Breathing) فوراً لاستعادة الثبات الانفعالي."
          - بدل "تجاهله": "شغّل درع 'الصمت' وماتضيعش ذخيرة طاقتك في معركة خسرانة."

        ** بروتوكول الأمان (Safety Protocol):**
        - إذا صرح المستخدم أنه قاصر (تحت 18 سنة) أو تحدث عن إيذاء جسيم، توقف عن اللعب الاستراتيجي فوراً.
        - وجهه لطلب المساعدة من بالغ موثوق أو مختص.
        - لا تقدم نصائح بقطع العلاقات لمن هم في سن الولاية (Minors).

${conversationHistory ? `**سجل العمليات السابق:**\n${conversationHistory}\n` : ""}

** برقية القائد(المستخدم):**
        ${userMessage.content} `;

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
        // تسجيل رد المساعد في ذاكرة الوعي
        consciousnessService.addToMemory(`المساعد: ${assistantContent} `);
      }
    } catch (error) {
      if (runtimeEnv.isDev) {
        logger.error("Error in chatbot:", error);
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
        setInput((prev) => (prev ? `${prev} ${transcript} ` : transcript));
        inputRef.current?.focus();
      }
    });
  };

  const aiAvailable = geminiClient.isAvailable();

  const getFallbackReply = (text: string) => {
    const trimmed = text.trim();
    const mode = resolveVoiceMode(agentContext?.pulse?.energy ?? null);
    const modePrefix =
      mode === "warm_healer"
        ? "أنا معاك. خد نفس الأول."
        : mode === "gentle_companion"
          ? "طاقتك حلوة النهاردة. يلا نخطو خطوة."
          : "خلّينا نفهم الصورة بهدوء.";
    if (!trimmed) return `${modePrefix} احكيلي عن المدار اللي واخد مساحة من طاقتك.`;
    if (trimmed.includes("مش عارف") || trimmed.includes("مش قادر")) {
      return `${modePrefix} اختار موقف واحد حصل قريب، ونفهمه مع بعض خطوة خطوة.`;
    }
    if (trimmed.includes("خوف") || trimmed.includes("قلق")) {
      return `${modePrefix} خد نفس عميق ٤ مرات وثبّت مكانك، وبعدها قولي إيه اللي واخد مساحة من تفكيرك.`;
    }
    if (trimmed.includes("حدود") || trimmed.includes("لا")) {
      return `${modePrefix} حلو.نثبّت المسافة دي بجملة واحدة جاهزة للموقف الجاي؟`;
    }
    return `${modePrefix} احكيلي عن موقف محدد: حصل إمتى، واتقال فيه إيه، وسحب من طاقتك قد إيه؟`;
  };

  const handleClose = () => {
    setIsOpen(false);
    if (!showLauncher) onRequestClose?.();
  };

  return (
    <>
      {/* Floating Button — يظهر دائماً */}
      {showLauncher && !isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-linear-to-br from-purple-600 to-pink-600 text-white rounded-full transition-all duration-200 flex items-center justify-center group z-50"
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
        <div className="fixed bottom-6 right-4 sm:right-6 w-[20rem] sm:w-[24rem] h-[32rem] modal-surface flex flex-col z-50">
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
              <button
                type="button"
                onClick={handleClose}
                className="hidden"
                aria-hidden
              />
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
                type="button"
                onClick={handleClose}
                className="hover:bg-white/20 rounded-full p-1 transition-colors"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setShowArchive(true)}
                className="hover:bg-white/20 rounded-full p-1 transition-colors"
                aria-label="أرشيف الوعي"
                title="أرشيف الوعي"
              >
                <History className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Persona Selector (Phase 27) */}
          <div className="bg-gray-50 px-2 pt-2 border-b border-gray-100">
            <SwarmPersonaSelector />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 ${msg.role === "user"
                    ? "rounded-2xl bg-purple-600 text-white"
                    : "card-unified bg-white text-gray-900 border border-transparent"
                    }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${msg.role === "user" ? "text-purple-200" : "text-gray-400"}`}
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

          {/* Mirror Card + Filters + كروت متعددة */}
          {mirrorMatches.length > 0 && (
            <div className="px-4 pt-3 pb-1 border-t border-gray-200 bg-amber-50/80">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold text-amber-900 flex items-center gap-1">
                    <span>💡</span>
                    <span>مرآة الوعي</span>
                  </p>
                  <div className="flex items-center gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setMirrorSourceFilter("both")}
                      className={`px-2 py-0.5 rounded-full border ${mirrorSourceFilter === "both"
                        ? "bg-amber-600 text-white border-amber-700"
                        : "bg-white/60 text-amber-800 border-amber-200"
                        }`}
                    >
                      الكل
                    </button>
                    <button
                      type="button"
                      onClick={() => setMirrorSourceFilter("pulse")}
                      className={`px-2 py-0.5 rounded-full border ${mirrorSourceFilter === "pulse"
                        ? "bg-amber-600 text-white border-amber-700"
                        : "bg-white/60 text-amber-800 border-amber-200"
                        }`}
                    >
                      من البوصلة
                    </button>
                    <button
                      type="button"
                      onClick={() => setMirrorSourceFilter("chat")}
                      className={`px-2 py-0.5 rounded-full border ${mirrorSourceFilter === "chat"
                        ? "bg-amber-600 text-white border-amber-700"
                        : "bg-white/60 text-amber-800 border-amber-200"
                        }`}
                    >
                      من الشات
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {mirrorMatches.slice(0, 3).map((m) => (
                    <div
                      key={m.id}
                      className="min-w-[180px] max-w-[220px] card-unified bg-white px-2.5 py-2"
                    >
                      <p className="text-[10px] text-slate-500 mb-1">
                        {m.created_at
                          ? new Date(m.created_at).toLocaleDateString("ar-EG")
                          : "تاريخ غير معروف"}
                      </p>
                      <p className="text-[11px] text-slate-900 leading-relaxed">
                        {m.content.slice(0, 110)}
                        {m.content.length > 110 ? "..." : ""}
                      </p>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setMirrorMatches([])}
                  className="mt-1 w-full text-[10px] text-amber-800 font-medium hover:underline text-center"
                >
                  تم · إخفاء المرآة
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
            {speechError != null && (
              <p className="text-xs text-amber-600 mb-2 text-center">{speechError}</p>
            )}
            <div className="flex items-end gap-2">
              <textarea
                id="ai-chatbot-input"
                name="aiChatbotInput"
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
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isListening
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
      <ConsciousnessArchiveModal isOpen={showArchive} onClose={() => setShowArchive(false)} />
      <AnimatePresence>
        {showPaywall && (
          <PaywallGate
            reason="ai_limit"
            onClose={() => setShowPaywall(false)}
            onUpgrade={() => setRemainingMessages(getRemainingAIMessages())}
          />
        )}
      </AnimatePresence>
    </>
  );
};
