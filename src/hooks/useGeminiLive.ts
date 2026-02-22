/**
 * ════════════════════════════════════════════════════════════════════════════
 * 🧠 useGeminiLive Hook — Live Consciousness Architect
 * ════════════════════════════════════════════════════════════════════════════
 *
 * يربط بين:
 * - Audio Pipeline (المايكروفون والسماعات)
 * - Gemini Live API (WebSocket)
 * - Zustand State (mapState + TEI)
 *
 * الاستخدام:
 * ```tsx
 * const {
 *   isConnected,
 *   isListening,
 *   connect,
 *   disconnect,
 *   startListening,
 *   stopListening
 * } = useGeminiLive({
 *   apiKey: 'YOUR_API_KEY',
 *   onResponse: (text) => console.log(text)
 * });
 * ```
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { GeminiLiveClient } from "../services/geminiLiveClient";
import { AudioStreamer } from "../services/audio/AudioStreamer";
import { AudioPlayer } from "../utils/audioUtils";
import { useMapState } from "../state/mapState";
import { computeTEI } from "../utils/traumaEntropyIndex";
import { GraphRecommendationEngine, RecommendationResult } from "../services/graphRecommendationEngine";
import { supabase } from "../services/supabaseClient";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TYPES
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface UseGeminiLiveOptions {
  apiKey: string;
  systemInstruction?: string;
  onResponse?: (text: string) => void;
  onError?: (error: Error) => void;
  autoSendContext?: boolean; // إرسال حالة الخريطة تلقائياً عند التغيير
}

export interface UseGeminiLiveReturn {
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  connect: () => void;
  disconnect: () => void;
  startListening: () => void;
  stopListening: () => void;
  sendContext: (context: string) => void;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYSTEM INSTRUCTIONS (Default Socratic Prompt)
 * ═══════════════════════════════════════════════════════════════════════════
 */

const DEFAULT_SYSTEM_INSTRUCTION = `أنت "مهندس وعي" — معالج نفسي متخصص في تحليل العلاقات وفهم الديناميكيات العاطفية.

دورك:
- تدير حواراً سقراطياً هادئاً ومباشراً مع المستخدم
- تساعده على فهم علاقاته من خلال "خريطة الدوائر" (دواير)
- تلاحظ التغييرات في:
  * نبرة صوته (توتر، حزن، غضب، راحة)
  * حركة الدوائر على الخريطة (تقريب أو إبعاد الأشخاص)
  * مؤشر الوضوح العاطفي (TEI - Trauma Entropy Index)

قواعد الحوار:
1. **استمع أولاً**: لا تتسرع في التشخيص
2. **اسأل عن التناقضات**: إذا لاحظت أن المستخدم يقول شيئاً لكن صوته أو حركة الدوائر تقول شيئاً آخر، اسأله بلطف
3. **كن مباشراً**: لا تستخدم عبارات مواساة فارغة، ركز على الفهم
4. **احترم الصمت**: إذا توقف المستخدم عن الكلام، انتظر قليلاً قبل أن تسأل

مثال على سؤال جيد:
"لاحظت إنك أبعدت دائرة [الاسم] للمنطقة الحمراء، وصوتك فيه توتر واضح. هل الإبعاد ده قرار نهائي، ولا محاولة لحماية نفسك مؤقتاً؟"

البيانات اللي هتستقبلها:
- **TEI Score**: رقم من 0-100 (100 = فوضى كاملة، 0 = وضوح تام)
- **Map State**: JSON يحتوي على الأشخاص في الخريطة، مواقعهم، ومستوى الخطر (green/yellow/red)

تذكر: أنت لست chatbot، أنت مرآة ذكية تساعد المستخدم على رؤية نفسه بوضوح.`;

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HOOK IMPLEMENTATION
 * ═══════════════════════════════════════════════════════════════════════════
 */

export function useGeminiLive({
  apiKey,
  systemInstruction = DEFAULT_SYSTEM_INSTRUCTION,
  onResponse,
  onError,
  autoSendContext = true
}: UseGeminiLiveOptions): UseGeminiLiveReturn {
  // ─── State ────────────────────────────────────────────────────────────────
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // ─── Refs (للحفاظ على المراجع بدون re-render) ──────────────────────────
  const clientRef = useRef<GeminiLiveClient | null>(null);
  const audioProcessorRef = useRef<AudioStreamer | null>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);

  // ─── Zustand State ────────────────────────────────────────────────────────
  const nodes = useMapState((s) => s.nodes);

  // ─── Context Builder ──────────────────────────────────────────────────────
  const buildContext = useCallback(async () => {
    const tei = computeTEI(nodes);

    // محاولة جلب توصيات لأحدث عقدة تم تحديثها (لو موجودة)
    let recommendations: RecommendationResult[] = [];
    const { data: user } = await supabase!.auth.getUser();
    if (user?.user && nodes.length > 0) {
      // نأخذ آخر عقدة تم التفاعل معها (تبسيطاً)
      recommendations = await GraphRecommendationEngine.getRecommendationsForNode(user.user.id, nodes[0].id);
    }

    const context = {
      tei_score: tei.score,
      tei_factors: tei.factors,
      map_state: nodes.map((node) => ({
        id: node.id,
        label: node.label,
        ring: node.ring,
        is_detached: node.isDetached ?? false,
        goal_id: node.goalId,
        analysis_score: node.analysis?.score
      })),
      suggested_insights: recommendations.map(r => ({
        title: r.title,
        type: r.type,
        hint_for_ai: `يمكنك الإشارة لهذا المحتوى: ${r.description}`
      })),
      timestamp: new Date().toISOString()
    };

    return JSON.stringify(context, null, 2);
  }, [nodes]);

  // ─── Connect ──────────────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (clientRef.current?.isConnected()) {
      console.warn('Already connected');
      return;
    }

    // إنشاء Audio Player
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new AudioPlayer();
      audioPlayerRef.current.onPlaybackStateChange = (playing) => {
        setIsSpeaking(playing);
      };
    }

    // إنشاء Gemini Client
    clientRef.current = new GeminiLiveClient(
      apiKey,
      systemInstruction,
      {
        onConnected: () => {
          console.log('🟢 Connected to Gemini Live');
        },
        onSetupComplete: () => {
          console.log('✅ Setup complete - ready to talk');
          setIsConnected(true);

          // إرسال السياق الأولي
          if (autoSendContext && clientRef.current) {
            void (async () => {
              const context = await buildContext();
              clientRef.current?.sendContext(context);
            })();
          }
        },
        onAudioResponse: (base64Audio) => {
          // تشغيل الصوت المستلم
          void audioPlayerRef.current?.enqueueAudio(base64Audio);
        },
        onTextResponse: (text) => {
          console.log('💬 AI Response:', text);
          onResponse?.(text);
        },
        onError: (error) => {
          console.error('❌ Error:', error);
          onError?.(error);
        },
        onDisconnected: () => {
          console.log('🔌 Disconnected');
          setIsConnected(false);
          setIsListening(false);
        }
      }
    );

    clientRef.current.connect();
  }, [apiKey, systemInstruction, onResponse, onError, autoSendContext, buildContext]);

  // ─── Disconnect ───────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    // إيقاف الاستماع
    if (isListening) {
      stopListening();
    }

    // قطع الاتصال
    clientRef.current?.disconnect();
    clientRef.current = null;

    // تنظيف Audio Player
    audioPlayerRef.current?.dispose();
    audioPlayerRef.current = null;

    setIsConnected(false);
  }, [isListening]);

  // ─── Start Listening ──────────────────────────────────────────────────────
  const startListening = useCallback(async () => {
    if (!clientRef.current?.isConnected()) {
      console.error('Cannot start listening - not connected');
      return;
    }

    if (isListening) {
      console.warn('Already listening');
      return;
    }

    try {
      // إنشاء Audio Processor
      audioProcessorRef.current = new AudioStreamer((base64Audio: string) => {
        // إرسال كل chunk للـ API
        clientRef.current?.sendAudio(base64Audio);
      });

      await audioProcessorRef.current.start();
      setIsListening(true);
      console.log('🎤 Listening started');
    } catch (error) {
      console.error('Failed to start listening:', error);
      onError?.(error as Error);
    }
  }, [isListening, onError]);

  // ─── Stop Listening ───────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    if (!isListening) return;

    audioProcessorRef.current?.stop();
    audioProcessorRef.current = null;
    setIsListening(false);
    console.log('🛑 Listening stopped');
  }, [isListening]);

  // ─── Send Context Manually ────────────────────────────────────────────────
  const sendContext = useCallback((context: string) => {
    if (!clientRef.current?.isConnected()) {
      console.error('Cannot send context - not connected');
      return;
    }

    clientRef.current.sendContext(context);
  }, []);

  // ─── Auto-send Context on Map Changes ────────────────────────────────────
  useEffect(() => {
    if (!autoSendContext || !isConnected || !clientRef.current) return;

    // إرسال السياق المحدث عند تغيير الخريطة
    void (async () => {
      const context = await buildContext();
      clientRef.current?.sendContext(context);
    })();
  }, [nodes, autoSendContext, isConnected, buildContext]);

  // ─── Cleanup on Unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // ─── Return API ───────────────────────────────────────────────────────────
  return {
    isConnected,
    isListening,
    isSpeaking,
    connect,
    disconnect,
    startListening,
    stopListening,
    sendContext
  };
}
