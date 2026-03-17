import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { runtimeEnv } from "../../../config/runtimeEnv";
import {
  appendLiveEvents,
  bootstrapLiveSession,
  completeLiveSession,
  createLiveSession,
  createLiveShare,
  runLiveTool,
} from "../api";
import { buildInitialContextMessage, buildDawayirSystemInstruction } from "../prompt";
import { LIVE_TOOL_DECLARATIONS, LOCAL_TOOL_NAMES } from "../tools";
import type {
  CircleNode,
  CognitiveMetrics,
  DawayirLiveConfig,
  GeminiClientContentMessage,
  GeminiRealtimeInputMessage,
  GeminiServerMessage,
  GeminiSetupMessage,
  GeminiToolResponseMessage,
  JourneyStage,
  LiveReplaySnapshot,
  LiveSessionEventRecord,
  ServerContentPart,
  SessionStatus,
  SpawnedOther,
  SpawnedTopic,
  ThoughtNode,
  ToolCallPayload,
  TopicConnection,
  TranscriptEntry,
  LiveSessionSummary,
  TruthContract,
  LoopRecall,
} from "../types";
import { AudioOutputPlayer, MicCapture, parsePcmSampleRate } from "../utils/audioHelpers";

const DEFAULT_CIRCLES: CircleNode[] = [
  { id: 1, label: "وعي", radius: 50, color: "#FFD700", fluidity: 0.5 },
  { id: 2, label: "علم", radius: 50, color: "#14b8a6", fluidity: 0.5 },
  { id: 3, label: "حقيقة", radius: 50, color: "#4169E1", fluidity: 0.5 },
];

const DEFAULT_METRICS: CognitiveMetrics = {
  equilibriumScore: 0.6,
  overloadIndex: 0.2,
  clarityDelta: 0,
};

function buildSocketUrl(apiKey: string) {
  return `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
}

function nextId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function computeMetrics(circles: CircleNode[]): CognitiveMetrics {
  const radii = circles.map((circle) => circle.radius);
  const avg = radii.reduce((sum, radius) => sum + radius, 0) / radii.length;
  const variance = radii.reduce((sum, radius) => sum + (radius - avg) ** 2, 0) / radii.length;
  const maxRadius = Math.max(...radii);
  return {
    equilibriumScore: Math.max(0, 1 - Math.sqrt(variance) / 40),
    overloadIndex: Math.min(1, maxRadius / 100),
    clarityDelta: circles[2] ? (circles[2].radius - 50) / 50 : 0,
  };
}

function safeInlineAudio(part: ServerContentPart) {
  return part.inlineData && part.inlineData.mimeType.startsWith("audio/pcm") ? part.inlineData : null;
}

export interface UseDawayirLiveReturn {
  status: SessionStatus;
  sessionId: string | null;
  circles: CircleNode[];
  metrics: CognitiveMetrics;
  transcript: TranscriptEntry[];
  spawnedOthers: SpawnedOther[];
  spawnedTopics: SpawnedTopic[];
  topicConnections: TopicConnection[];
  thoughtMap: ThoughtNode[];
  journeyStage: JourneyStage;
  isMicActive: boolean;
  isAgentSpeaking: boolean;
  whyNowLine: string | null;
  errorMessage: string | null;
  latestSummary: LiveSessionSummary | null;
  latestTruthContract: TruthContract | null;
  latestLoopRecall: LoopRecall | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  toggleMic: () => Promise<void>;
  sendTextMessage: (text: string) => void;
  completeSession: () => Promise<string | null>;
  createShareLink: () => Promise<string | null>;
}

export function useDawayirLiveSession(config: DawayirLiveConfig): UseDawayirLiveReturn {
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [circles, setCircles] = useState<CircleNode[]>(DEFAULT_CIRCLES);
  const [metrics, setMetrics] = useState<CognitiveMetrics>(DEFAULT_METRICS);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [spawnedOthers, setSpawnedOthers] = useState<SpawnedOther[]>([]);
  const [spawnedTopics, setSpawnedTopics] = useState<SpawnedTopic[]>([]);
  const [topicConnections, setTopicConnections] = useState<TopicConnection[]>([]);
  const [thoughtMap, setThoughtMap] = useState<ThoughtNode[]>([]);
  const [journeyStage, setJourneyStage] = useState<JourneyStage>("Overwhelmed");
  const [isMicActive, setIsMicActive] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [whyNowLine, setWhyNowLine] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [latestSummary, setLatestSummary] = useState<LiveSessionSummary | null>(null);
  const [latestTruthContract, setLatestTruthContract] = useState<TruthContract | null>(null);
  const [latestLoopRecall, setLatestLoopRecall] = useState<LoopRecall | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const micRef = useRef<MicCapture | null>(null);
  const playerRef = useRef<AudioOutputPlayer | null>(null);
  const manualCloseRef = useRef(false);
  const hadErrorRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const eventSeqRef = useRef(1);
  const frameSeqRef = useRef(1);
  const pendingEventsRef = useRef<LiveSessionEventRecord[]>([]);
  const pendingFramesRef = useRef<Array<{ seq: number; frame: LiveReplaySnapshot }>>([]);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const whyNowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastInputTranscriptRef = useRef("");
  const lastOutputTranscriptRef = useRef("");

  const snapshot = useMemo<LiveReplaySnapshot>(
    () => ({
      circles,
      metrics,
      spawnedOthers,
      spawnedTopics,
      topicConnections,
      thoughtMap,
      journeyStage,
      whyNowLine,
    }),
    [circles, metrics, spawnedOthers, spawnedTopics, topicConnections, thoughtMap, journeyStage, whyNowLine],
  );
  const snapshotRef = useRef<LiveReplaySnapshot>(snapshot);

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  const addTranscript = useCallback((entry: Omit<TranscriptEntry, "timestamp">) => {
    const nextEntry = { ...entry, timestamp: Date.now() };
    setTranscript((previous) => [...previous, nextEntry]);
    pendingEventsRef.current.push({
      session_id: sessionIdRef.current || "pending",
      seq: eventSeqRef.current++,
      event_type: "transcript",
      actor: entry.role,
      payload: entry as unknown as Record<string, unknown>,
    });
  }, []);

  const queueFrame = useCallback(() => {
    pendingFramesRef.current.push({
      seq: frameSeqRef.current++,
      frame: snapshotRef.current,
    });
  }, []);

  const scheduleFlush = useCallback(() => {
    if (flushTimerRef.current) return;
    flushTimerRef.current = setTimeout(() => {
      flushTimerRef.current = null;
      void (async () => {
        const activeSessionId = sessionIdRef.current;
        if (!activeSessionId) return;
        const events = pendingEventsRef.current.splice(0, pendingEventsRef.current.length);
        const replayFrames = pendingFramesRef.current.splice(0, pendingFramesRef.current.length).map((frame) => ({
          session_id: activeSessionId,
          seq: frame.seq,
          frame: frame.frame,
        }));
        if (!events.length && !replayFrames.length) return;
        await appendLiveEvents(activeSessionId, {
          events: events.map((event) => ({ ...event, session_id: activeSessionId })),
          replayFrames,
          metrics,
        }).catch(() => {
          pendingEventsRef.current.unshift(...events);
          pendingFramesRef.current.unshift(
            ...replayFrames.map((frame) => ({
              seq: frame.seq,
              frame: frame.frame,
            })),
          );
        });
      })();
    }, 900);
  }, [metrics]);

  const pushWhyNow = useCallback((text: string, durationMs = 4200) => {
    setWhyNowLine(text);
    if (whyNowTimerRef.current) clearTimeout(whyNowTimerRef.current);
    whyNowTimerRef.current = setTimeout(() => setWhyNowLine(null), durationMs);
  }, []);

  const enqueueStateEvent = useCallback((payload: Record<string, unknown>) => {
    pendingEventsRef.current.push({
      session_id: sessionIdRef.current || "pending",
      seq: eventSeqRef.current++,
      event_type: "state",
      actor: "system",
      payload,
    });
    scheduleFlush();
  }, [scheduleFlush]);

  const handleLocalToolCall = useCallback((call: ToolCallPayload) => {
    switch (call.name) {
      case "update_node": {
        const nodeId = Number(call.args.id);
        setCircles((previous) => {
          const next = previous.map((circle) =>
            circle.id === nodeId
              ? {
                  ...circle,
                  radius: typeof call.args.radius === "number" ? call.args.radius : circle.radius,
                  color: typeof call.args.color === "string" ? call.args.color : circle.color,
                  fluidity: typeof call.args.fluidity === "number" ? call.args.fluidity : circle.fluidity,
                  topic: typeof call.args.topic === "string" ? call.args.topic : circle.topic,
                  reason: typeof call.args.reason === "string" ? call.args.reason : circle.reason,
                }
              : circle,
          );
          setMetrics(computeMetrics(next));
          return next;
        });
        if (typeof call.args.reason === "string") {
          pushWhyNow(call.args.reason);
        }
        queueFrame();
        return { ok: true, updated: call.args.id };
      }
      case "highlight_node": {
        const nodeId = Number(call.args.id);
        setCircles((previous) =>
          previous.map((circle) =>
            circle.id === nodeId
              ? { ...circle, highlightUntil: Date.now() + 2500 }
              : circle,
          ),
        );
        queueFrame();
        return { ok: true, highlighted: call.args.id };
      }
      case "spawn_other": {
        setSpawnedOthers((previous) => [
          ...previous,
          {
            id: nextId("other"),
            name: String(call.args.name ?? "عنصر جديد"),
            tension: Number(call.args.tension ?? 0.5),
            color: String(call.args.color ?? "#94a3b8"),
          },
        ]);
        queueFrame();
        return { ok: true };
      }
      case "spawn_topic": {
        setSpawnedTopics((previous) => [
          ...previous,
          {
            id: nextId("topic"),
            topic: String(call.args.topic ?? "موضوع"),
            weight: Number(call.args.weight ?? 0.5),
            color: String(call.args.color ?? "#f59e0b"),
          },
        ]);
        queueFrame();
        return { ok: true };
      }
      case "connect_topics": {
        setTopicConnections((previous) => [
          ...previous,
          {
            id: nextId("connection"),
            from: String(call.args.from ?? ""),
            to: String(call.args.to ?? ""),
            weight: Number(call.args.weight ?? 0.5),
            reason: typeof call.args.reason === "string" ? call.args.reason : undefined,
          },
        ]);
        queueFrame();
        return { ok: true };
      }
      case "map_thought": {
        setThoughtMap((previous) => [
          ...previous.filter((thought) => thought.topic !== call.args.topic),
          {
            topic: String(call.args.topic ?? "فكرة"),
            emoji: String(call.args.emoji ?? "•"),
            weight: Number(call.args.weight ?? 0.5),
            connects_to:
              typeof call.args.connects_to === "string"
                ? String(call.args.connects_to)
                    .split(",")
                    .map((entry) => entry.trim())
                    .filter(Boolean)
                : undefined,
            is_root: Boolean(call.args.is_root),
          },
        ]);
        queueFrame();
        return { ok: true };
      }
      case "update_journey": {
        const nextStage = String(call.args.stage ?? "Overwhelmed") as JourneyStage;
        setJourneyStage(nextStage);
        queueFrame();
        return { ok: true, stage: nextStage };
      }
      default:
        return { ok: false, ignored: true };
    }
  }, [pushWhyNow, queueFrame]);

  const send = useCallback((payload: GeminiSetupMessage | GeminiClientContentMessage | GeminiRealtimeInputMessage | GeminiToolResponseMessage) => {
    const socket = wsRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }
    socket.send(JSON.stringify(payload));
  }, []);

  const sendClientText = useCallback((text: string) => {
    const message: GeminiClientContentMessage = {
      clientContent: {
        turns: [{ role: "user", parts: [{ text }] }],
        turnComplete: true,
      },
    };
    send(message);
  }, [send]);

  const resolveToolCalls = useCallback(async (calls: ToolCallPayload[]) => {
    const activeSessionId = sessionIdRef.current;
    if (!activeSessionId) return;

    const responses = [];
    for (const call of calls) {
      pendingEventsRef.current.push({
        session_id: activeSessionId,
        seq: eventSeqRef.current++,
        event_type: "tool_call",
        actor: "agent",
        payload: { name: call.name, args: call.args, id: call.id },
      });

      if (LOCAL_TOOL_NAMES.has(call.name)) {
        const result = handleLocalToolCall(call);
        responses.push({
          id: call.id,
          name: call.name,
          response: { result },
        });
        pendingEventsRef.current.push({
          session_id: activeSessionId,
          seq: eventSeqRef.current++,
          event_type: "tool_result",
          actor: "system",
          payload: result,
        });
      } else {
        const result = await runLiveTool(activeSessionId, call.name, call.args).catch((error) => ({
          result: { ok: false, error: error instanceof Error ? error.message : "tool_failed" },
          summary: null,
          truthContract: null,
          loopRecall: null,
        }));
        if (result.summary) setLatestSummary(result.summary);
        if (result.truthContract) setLatestTruthContract(result.truthContract);
        if (result.loopRecall) setLatestLoopRecall(result.loopRecall);
        if (call.name === "save_mental_map") {
          addTranscript({ role: "system", text: "تم حفظ الخريطة الذهنية." });
        }
        responses.push({
          id: call.id,
          name: call.name,
          response: { result: result.result },
        });
        pendingEventsRef.current.push({
          session_id: activeSessionId,
          seq: eventSeqRef.current++,
          event_type: "tool_result",
          actor: "system",
          payload: result.result,
        });
      }
    }

    scheduleFlush();
    send({
      toolResponse: {
        functionResponses: responses,
      },
    });
  }, [addTranscript, handleLocalToolCall, scheduleFlush, send]);

  const handleServerMessage = useCallback((message: GeminiServerMessage) => {
    if (message.setupComplete) {
      setStatus("connected");
      enqueueStateEvent({ phase: "setup_complete" });
      sendClientText(buildInitialContextMessage(config));
      return;
    }

    if (message.error?.message) {
      hadErrorRef.current = true;
      setStatus("error");
      setErrorMessage(message.error.message);
      pendingEventsRef.current.push({
        session_id: sessionIdRef.current || "pending",
        seq: eventSeqRef.current++,
        event_type: "error",
        actor: "system",
        payload: { message: message.error.message, code: message.error.code },
      });
      scheduleFlush();
      return;
    }

    if (message.toolCall?.functionCalls?.length) {
      void resolveToolCalls(message.toolCall.functionCalls);
    }

    const inputText = message.serverContent?.inputTranscription?.text?.trim();
    if (inputText && inputText !== lastInputTranscriptRef.current) {
      lastInputTranscriptRef.current = inputText;
      addTranscript({ role: "user", text: inputText });
      scheduleFlush();
    }

    const outputText = message.serverContent?.outputTranscription?.text?.trim();
    if (outputText && outputText !== lastOutputTranscriptRef.current) {
      lastOutputTranscriptRef.current = outputText;
      addTranscript({ role: "agent", text: outputText });
      scheduleFlush();
    }

    for (const part of message.serverContent?.modelTurn?.parts ?? []) {
      if (part.text && part.text.trim() && part.text.trim() !== lastOutputTranscriptRef.current) {
        lastOutputTranscriptRef.current = part.text.trim();
        addTranscript({ role: "agent", text: part.text.trim() });
      }
      const audio = safeInlineAudio(part);
      if (audio?.data) {
        setStatus("speaking");
        void playerRef.current?.enqueueBase64Pcm(audio.data, parsePcmSampleRate(audio.mimeType));
      }
    }

    if (message.serverContent?.turnComplete && status === "speaking") {
      setStatus("connected");
    }
  }, [addTranscript, config, enqueueStateEvent, resolveToolCalls, scheduleFlush, sendClientText, status]);

  const stopMic = useCallback(() => {
    micRef.current?.stop();
    micRef.current = null;
    setIsMicActive(false);
  }, []);

  const connect = useCallback(async () => {
    if (status === "connecting" || status === "setup" || status === "connected" || status === "speaking") {
      return;
    }

    setErrorMessage(null);
    setStatus("bootstrapping");
    hadErrorRef.current = false;
    manualCloseRef.current = false;

    const bootstrap = await bootstrapLiveSession().catch((error) => {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "bootstrap_failed");
      return null;
    });
    if (!bootstrap) return;
    if (bootstrap.requiresAuth) {
      setStatus("auth-required");
      setErrorMessage("يجب تسجيل الدخول قبل بدء جلسة Dawayir Live.");
      return;
    }
    if (!bootstrap.enabled) {
      setStatus("error");
      setErrorMessage("Dawayir Live غير مفعّل حالياً.");
      return;
    }

    const apiKey = config.apiKey || runtimeEnv.dawayirLiveApiKey || "";
    if (!apiKey) {
      setStatus("error");
      setErrorMessage("مفتاح Dawayir Live غير مضبوط في البيئة.");
      return;
    }

    const created = await createLiveSession({
      title: config.initialContext?.nodeLabel ? `جلسة ${config.initialContext.nodeLabel}` : "جلسة Dawayir Live",
      mode: config.mode,
      language: config.language,
      entrySurface: config.entrySurface,
      goalContext: config.initialContext ?? {},
    }).catch((error) => {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "session_create_failed");
      return null;
    });
    if (!created) return;

    sessionIdRef.current = created.session.id;
    setSessionId(created.session.id);

    if (!playerRef.current) {
      playerRef.current = new AudioOutputPlayer();
      playerRef.current.onPlaybackStateChange = (playing) => {
        setIsAgentSpeaking(playing);
        setStatus((current) => {
          if (current === "saving" || current === "completed" || current === "error") return current;
          return playing ? "speaking" : "connected";
        });
      };
    }

    setStatus("connecting");
    try {
      const socket = new WebSocket(buildSocketUrl(apiKey));
      wsRef.current = socket;

      socket.onopen = () => {
        setStatus("setup");
        const setup: GeminiSetupMessage = {
          setup: {
            model: `models/${config.model || runtimeEnv.dawayirLiveModel || bootstrap.model}`,
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: config.voice || runtimeEnv.dawayirLiveVoice || bootstrap.voice,
                  },
                },
              },
            },
            systemInstruction: {
              parts: [{ text: buildDawayirSystemInstruction(config) }],
            },
            tools: LIVE_TOOL_DECLARATIONS as never,
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
        };
        send(setup);
      };

      socket.onmessage = (event) => {
        try {
          handleServerMessage(JSON.parse(String(event.data)) as GeminiServerMessage);
        } catch {
          // Ignore malformed packets.
        }
      };

      socket.onerror = () => {
        hadErrorRef.current = true;
        setStatus("error");
        setErrorMessage("فشل الاتصال المباشر بـ Gemini Live.");
      };

      socket.onclose = () => {
        stopMic();
        if (!manualCloseRef.current && !hadErrorRef.current) {
          setStatus("disconnected");
        }
      };
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "socket_failed");
    }
  }, [config, handleServerMessage, send, status, stopMic]);

  const disconnect = useCallback(async () => {
    manualCloseRef.current = true;
    stopMic();
    playerRef.current?.stop();
    wsRef.current?.close();
    wsRef.current = null;

    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }

    const activeSessionId = sessionIdRef.current;
    if (activeSessionId) {
      const events = pendingEventsRef.current.splice(0, pendingEventsRef.current.length);
      const replayFrames = pendingFramesRef.current.splice(0, pendingFramesRef.current.length).map((frame) => ({
        session_id: activeSessionId,
        seq: frame.seq,
        frame: frame.frame,
      }));
      if (events.length || replayFrames.length) {
        await appendLiveEvents(activeSessionId, {
          events: events.map((event) => ({ ...event, session_id: activeSessionId })),
          replayFrames,
          metrics,
        }).catch(() => undefined);
      }
    }

    setStatus("disconnected");
  }, [metrics, stopMic]);

  const toggleMic = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    if (isMicActive) {
      stopMic();
      enqueueStateEvent({ mic: "off" });
      return;
    }

    const mic = new MicCapture();
    mic.onAudioChunk = (base64) => {
      send({
        realtimeInput: {
          audio: {
            data: base64,
            mimeType: "audio/pcm;rate=16000",
          },
        },
      });
    };
    await mic.start();
    micRef.current = mic;
    setIsMicActive(true);
    enqueueStateEvent({ mic: "on" });
  }, [enqueueStateEvent, isMicActive, send, stopMic]);

  const sendTextMessage = useCallback((text: string) => {
    const clean = text.trim();
    if (!clean) return;
    addTranscript({ role: "user", text: clean });
    sendClientText(clean);
    scheduleFlush();
  }, [addTranscript, scheduleFlush, sendClientText]);

  const completeSessionFlow = useCallback(async () => {
    const activeSessionId = sessionIdRef.current;
    if (!activeSessionId) return null;

    setStatus("saving");
    await disconnect();

    const completed = await completeLiveSession(activeSessionId, {
      metrics,
      snapshot: snapshotRef.current as unknown as Record<string, unknown>,
      requestedSummary: latestSummary,
    }).catch((error) => {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "complete_failed");
      return null;
    });

    if (!completed) return null;

    setLatestSummary(completed.summary);
    setLatestTruthContract(completed.truthContract);
    setLatestLoopRecall(completed.loopRecall);
    setStatus("completed");
    return completed.session.id;
  }, [disconnect, latestSummary, metrics]);

  const createShareLink = useCallback(async () => {
    const activeSessionId = sessionIdRef.current;
    if (!activeSessionId) return null;
    const result = await createLiveShare(activeSessionId).catch(() => null);
    return result?.url ?? null;
  }, []);

  useEffect(() => {
    return () => {
      void disconnect();
      if (whyNowTimerRef.current) clearTimeout(whyNowTimerRef.current);
      playerRef.current?.dispose();
      playerRef.current = null;
    };
  }, [disconnect]);

  return {
    status,
    sessionId,
    circles,
    metrics,
    transcript,
    spawnedOthers,
    spawnedTopics,
    topicConnections,
    thoughtMap,
    journeyStage,
    isMicActive,
    isAgentSpeaking,
    whyNowLine,
    errorMessage,
    latestSummary,
    latestTruthContract,
    latestLoopRecall,
    connect,
    disconnect,
    toggleMic,
    sendTextMessage,
    completeSession: completeSessionFlow,
    createShareLink,
  };
}
