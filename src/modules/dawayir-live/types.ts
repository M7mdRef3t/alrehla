export type LiveMode = "standard" | "demo" | "hybrid" | "couple";
export type LiveLanguage = "ar" | "en";
export type JourneyStage = "Overwhelmed" | "Focus" | "Clarity";
export type LiveAccessRole = "owner" | "partner" | "coach";
export type SessionStatus =
  | "idle"
  | "auth-required"
  | "bootstrapping"
  | "connecting"
  | "setup"
  | "connected"
  | "speaking"
  | "saving"
  | "completed"
  | "error"
  | "disconnected";

export type LiveEventType =
  | "state"
  | "transcript"
  | "tool_call"
  | "tool_result"
  | "metric"
  | "frame"
  | "error";

export type LiveArtifactType =
  | "mental_map"
  | "session_report"
  | "truth_contract"
  | "loop_recall"
  | "judge_card"
  | "camera_capture"
  | "tts_audio"
  | "session_summary"
  | "share_link";

export type ToolName =
  | "update_node"
  | "highlight_node"
  | "get_expert_insight"
  | "save_mental_map"
  | "generate_session_report"
  | "create_truth_contract"
  | "update_journey"
  | "spawn_other"
  | "spawn_topic"
  | "connect_topics"
  | "map_thought";

export interface CircleNode {
  id: number;
  label: string;
  radius: number;
  color: string;
  fluidity: number;
  topic?: string;
  reason?: string;
  highlightUntil?: number | null;
}

export interface CognitiveMetrics {
  equilibriumScore: number;
  overloadIndex: number;
  clarityDelta: number;
}

export interface SpawnedOther {
  id: string;
  name: string;
  tension: number;
  color: string;
}

export interface SpawnedTopic {
  id: string;
  topic: string;
  weight: number;
  color: string;
}

export interface TopicConnection {
  id: string;
  from: string;
  to: string;
  weight: number;
  reason?: string;
}

export interface ThoughtNode {
  topic: string;
  emoji: string;
  weight: number;
  connects_to?: string[];
  is_root?: boolean;
}

export interface TranscriptEntry {
  role: "user" | "agent" | "system";
  text: string;
  timestamp: number;
  color?: string;
}

export interface LiveSessionSummary {
  title: string;
  headline: string;
  breakthroughs: string[];
  tensions: string[];
  nextMoves: string[];
  generatedAt: string;
}

export interface TruthContract {
  promises: string[];
  avoidPatterns: string[];
  reminder: string;
}

export interface LoopRecall {
  title: string;
  trigger: string;
  interruption: string;
  reward: string;
}

export interface DawayirLiveConfig {
  apiKey?: string;
  model?: string;
  voice?: string;
  mode: LiveMode;
  language: LiveLanguage;
  entrySurface: string;
  initialContext?: {
    nodeId?: string | null;
    nodeLabel?: string | null;
    goalId?: string | null;
    note?: string | null;
  };
}

export interface LiveSessionRecord {
  id: string;
  owner_user_id: string;
  title: string | null;
  mode: LiveMode;
  language: LiveLanguage;
  entry_surface: string | null;
  goal_context: Record<string, unknown> | null;
  status: string;
  summary: LiveSessionSummary | null;
  metrics: CognitiveMetrics | null;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LiveSessionEventRecord {
  id?: number;
  session_id: string;
  seq: number;
  event_type: LiveEventType;
  actor: "user" | "agent" | "system";
  payload: Record<string, unknown>;
  created_at?: string;
}

export interface LiveSessionArtifactRecord {
  id: string;
  session_id: string;
  artifact_type: LiveArtifactType;
  title: string | null;
  content: Record<string, unknown> | null;
  storage_path: string | null;
  metadata: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
}

export interface LiveReplaySnapshot {
  circles: CircleNode[];
  metrics: CognitiveMetrics;
  spawnedOthers: SpawnedOther[];
  spawnedTopics: SpawnedTopic[];
  topicConnections: TopicConnection[];
  thoughtMap: ThoughtNode[];
  journeyStage: JourneyStage;
  whyNowLine: string | null;
}

export interface LiveReplayFrameRecord {
  id?: number;
  session_id: string;
  seq: number;
  frame: LiveReplaySnapshot;
  created_at?: string;
}

export interface LiveSessionAccessRecord {
  id: string;
  session_id: string;
  user_id: string;
  access_role: LiveAccessRole;
  invited_by: string | null;
  created_at: string;
}

export interface LiveSessionDetail {
  session: LiveSessionRecord;
  events: LiveSessionEventRecord[];
  artifacts: LiveSessionArtifactRecord[];
  replayFrames: LiveReplayFrameRecord[];
  access: LiveSessionAccessRecord[];
}

export interface BootstrapResponse {
  enabled: boolean;
  requiresAuth: boolean;
  apiConfigured: boolean;
  model: string;
  voice: string;
  featureFlags: {
    live: boolean;
    couple: boolean;
    coach: boolean;
    camera: boolean;
  };
  userId: string | null;
}

export interface LiveAdminAnalytics {
  totalSessions: number;
  completedSessions: number;
  activeSessions: number;
  sharedSessions: number;
  byMode: Array<{ mode: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
  recentSessions: LiveSessionRecord[];
}

export interface ToolCallPayload {
  id: string;
  name: ToolName;
  args: Record<string, unknown>;
}

export interface ToolResponsePayload {
  id: string;
  name: ToolName;
  response: {
    result: Record<string, unknown>;
  };
}

export interface ServerContentPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
  functionCall?: ToolCallPayload;
}

export interface GeminiSetupMessage {
  setup: {
    model: string;
    generationConfig?: {
      responseModalities?: string[];
      speechConfig?: {
        voiceConfig?: {
          prebuiltVoiceConfig?: {
            voiceName?: string;
          };
        };
      };
    };
    systemInstruction?: {
      parts: Array<{ text: string }>;
    };
    tools?: Array<{
      functionDeclarations: Array<{
        name: string;
        description: string;
        parameters: Record<string, unknown>;
      }>;
    }>;
    inputAudioTranscription?: Record<string, never>;
    outputAudioTranscription?: Record<string, never>;
  };
}

export interface GeminiClientContentMessage {
  clientContent: {
    turns: Array<{
      role: "user";
      parts: Array<{ text?: string }>;
    }>;
    turnComplete: boolean;
  };
}

export interface GeminiRealtimeInputMessage {
  realtimeInput: {
    audio: {
      data: string;
      mimeType: string;
    };
  };
}

export interface GeminiToolResponseMessage {
  toolResponse: {
    functionResponses: ToolResponsePayload[];
  };
}

export interface GeminiServerMessage {
  setupComplete?: Record<string, never>;
  serverContent?: {
    modelTurn?: { parts?: ServerContentPart[] };
    inputTranscription?: { text?: string };
    outputTranscription?: { text?: string };
    interrupted?: boolean;
    turnComplete?: boolean;
  };
  toolCall?: {
    functionCalls: ToolCallPayload[];
  };
  goAway?: {
    timeLeft?: string;
  };
  sessionResumptionUpdate?: Record<string, unknown>;
  error?: {
    code?: number;
    message?: string;
  };
}

export interface DawayirLiveSessionState {
  status: SessionStatus;
  sessionId: string | null;
  bootstrap: BootstrapResponse | null;
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
}
