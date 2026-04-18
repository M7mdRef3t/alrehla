/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_FEATURE_FLAGS,
  type FeatureFlagKey,
  type FeatureFlagMode
} from "@/config/features";
import type { BroadcastAudience } from "@/utils/broadcastAudience";
import { getAuthRole } from "@/domains/auth/store/auth.store";
import { getEffectiveFeatureAccess } from "@/utils/featureFlags";
import { isUserMode } from "@/config/appEnv";
import { runtimeEnv } from "@/config/runtimeEnv";

export interface ScoringWeights {
  often: number;
  sometimes: number;
  rarely: number;
  never: number;
}

export interface ScoringThresholds {
  lowMax: number;
  mediumMax: number;
}

export interface AiLogEntry {
  id: string;
  createdAt: number;
  prompt: string;
  response: string;
  source: "playground" | "system";
  rating?: "up" | "down";
}

export interface AdminMission {
  id: string;
  title: string;
  track: string;
  difficulty: "سهل" | "متوسط" | "صعب";
  createdAt: number;
}

export interface AdminBroadcast {
  id: string;
  title: string;
  body: string;
  audience: BroadcastAudience;
  createdAt: number;
}

export interface SovereignInsight {
    id: string;
    type: 'truth' | 'warning' | 'opportunity';
    message: string;
    timestamp: string;
}

export interface SovereignStats {
    activeNow: number;
    breakthroughs24h: number;
    events24h: number;
    behavioralFriction: Array<{
        scenario: string;
        avgTimeSec: number;
        sampleSize: number;
    }>;
}

export type PulseCopyOverrideValue = "auto" | "a" | "b";
export interface PulseCopyOverrides {
  energy: PulseCopyOverrideValue;
  mood: PulseCopyOverrideValue;
  focus: PulseCopyOverrideValue;
}

export type CacheEntry<T> = { data: T; timestamp: number };

export type JourneyPathStepKind =
  | "entry"
  | "check"
  | "decision"
  | "intervention"
  | "screen"
  | "telemetry-chaos"
  | "telemetry-idle"
  | "outcome";

export interface JourneyPathStep {
  id: string;
  title: string;
  kind: JourneyPathStepKind;
  screen: string;
  description: string;
  note?: string;
  enabled: boolean;
}

export interface JourneyPath {
  id: string;
  title: string;
  slug: string;
  description: string;
  ownerNote: string;
  entryScreen: string;
  targetScreen: string;
  autoTriggerMaxEnergy: number;
  primaryActionLabel: string;
  primaryActionScreen: string;
  secondaryActionLabel: string;
  secondaryActionScreen: string;
  tertiaryActionLabel: string;
  tertiaryActionScreen: string;
  isActive: boolean;
  steps: JourneyPathStep[];
}

const DEFAULT_JOURNEY_PATHS: JourneyPath[] = [
  {
    id: "path-sanctuary",
    title: "مسار الملاذ",
    slug: "sanctuary",
    description: "المسار الهادئ الذي يبدأ من لحظة طلب النجاة ويقود المستخدم حتى الاستقرار داخل الملاذ ثم العودة الواعية.",
    ownerNote: "هذا هو المسار المرجعي الأول لإدارة تجربة الملاذ من البداية للنهاية.",
    entryScreen: "landing",
    targetScreen: "sanctuary",
    autoTriggerMaxEnergy: 3,
    primaryActionLabel: "خريطة العلاقات",
    primaryActionScreen: "map",
    secondaryActionLabel: "الترسانة والصد",
    secondaryActionScreen: "armory",
    tertiaryActionLabel: "رادار التقدم",
    tertiaryActionScreen: "insights",
    isActive: true,
    steps: [
      {
        id: "sanctuary-step-1",
        title: "بداية الطلب",
        kind: "entry",
        screen: "landing",
        description: "المستخدم يطلب البدء أو يصل لنقطة احتياج واضحة للتهدئة.",
        note: "مدخل المسار من الصفحة الرئيسية أو من نداء استعادة التوازن.",
        enabled: true
      },
      {
        id: "sanctuary-step-2",
        title: "فحص النبض",
        kind: "check",
        screen: "pulseCheck",
        description: "يتم التقاط حالة الطاقة/المزاج/التركيز لتحديد إن كان الملاذ مناسباً الآن.",
        note: "الخطوة الحاسمة قبل أي تدخل لاحق.",
        enabled: true
      },
      {
        id: "sanctuary-step-3",
        title: "قرار التوجيه",
        kind: "decision",
        screen: "cocoon",
        description: "إذا كانت الطاقة منخفضة يتم عرض دعوة الدخول إلى مساحتك الخاصة.",
        note: "مربوطة حالياً بـ Cocoon mode.",
        enabled: true
      },
      {
        id: "sanctuary-step-4",
        title: "تنظيم النفس",
        kind: "intervention",
        screen: "breathing",
        description: "تمرين تنفس/تهدئة لتصفير الضوضاء قبل الدخول الكامل.",
        note: "مرحلة انتقالية قبل الاستقرار.",
        enabled: true
      },
      {
        id: "sanctuary-step-5",
        title: "الدخول إلى شاشة الملاذ",
        kind: "screen",
        screen: "sanctuary",
        description: "الوصول إلى Sanctuary Dashboard كوضع أمان واستقبال.",
        note: "الشاشة الأساسية التي أصلحنا ربطها هذا التيرن.",
        enabled: true
      },
      {
        id: "sanctuary-step-6",
        title: "العودة الواعية للمسار",
        kind: "outcome",
        screen: "map",
        description: "بعد الاستقرار يعود المستخدم إلى الخريطة أو أدوات الرحلة بخطوة واعية.",
        note: "النهاية الحالية للمسار قبل التوسع لاحقاً.",
        enabled: true
      }
    ]
  },
  {
    id: "path-relationship-weather",
    title: "مسار طقس العلاقات",
    slug: "relationship-weather",
    description: "المسار التشخيصي الذي يبدأ من أداة طقس العلاقات، يلتقط نمط الاستنزاف، ثم يمرر المستخدم إلى دواير مع نية واضحة وخريطة أولية قابلة للبناء.",
    ownerNote: "هذا هو المسار المرجعي لطقس العلاقات من صفحة /weather وحتى الوصول إلى الخريطة أو السطح المستهدف داخل دواير.",
    entryScreen: "/weather",
    targetScreen: "map",
    autoTriggerMaxEnergy: 5,
    primaryActionLabel: "ابدأ دواير وارسم خريطتك",
    primaryActionScreen: "map",
    secondaryActionLabel: "أعد التشخيص",
    secondaryActionScreen: "/weather",
    tertiaryActionLabel: "ارجع للرئيسية",
    tertiaryActionScreen: "/",
    isActive: true,
    steps: [
      {
        id: "weather-step-1",
        title: "دخول أداة الطقس",
        kind: "entry",
        screen: "/weather",
        description: "المستخدم يصل إلى أداة طقس العلاقات من الصفحة الرئيسية أو من مدخل تمهيدي مجاني.",
        note: "هذا هو المدخل التسويقي/التشخيصي الأساسي للمسار.",
        enabled: true
      },
      {
        id: "weather-step-2",
        title: "أسئلة التشخيص",
        kind: "check",
        screen: "weather-questions",
        description: "الإجابة على أسئلة الطقس لاستخراج الدائرة المستنزفة والنمط السلوكي.",
        note: "مرحلة جمع الإشارات قبل التحليل.",
        enabled: true
      },
      {
        id: "weather-step-3",
        title: "تحليل النمط",
        kind: "decision",
        screen: "weather-analyzing",
        description: "تحويل الإجابات إلى مستوى طقس ونمط وسياق قابل للربط داخل دواير.",
        note: "اللحظة التي يتحدد فيها شكل التقرير والمعبر التالي.",
        enabled: true
      },
      {
        id: "weather-step-4",
        title: "تقرير طقس العلاقات",
        kind: "screen",
        screen: "weather-result",
        description: "عرض التقرير النهائي مع الثمن الخفي والخطوات السريعة والـ CTA الرئيسي.",
        note: "الشاشة التي يجب أن تكون قابلة للتحكم من لوحة المسارات.",
        enabled: true
      },
      {
        id: "weather-step-5",
        title: "الدخول إلى دواير بالنية التشخيصية",
        kind: "outcome",
        screen: "map",
        description: "تمرير الـ weather context إلى دواير وفتح الوجهة الفعلية المحددة للمسار.",
        note: "النهاية الحالية الافتراضية هي الخريطة مع bridge context.",
        enabled: true
      }
    ]
  },
  {
    id: "path-dawayir-live",
    title: "مسار دواير لايف",
    slug: "dawayir-live",
    description: "المسار الحي الذي يبدأ من الخريطة أو سطح الإطلاق، يدخل إلى التهيئة والجلسة، ثم يخرج بملخص وعودة جاهزة للوجهة المستهدفة.",
    ownerNote: "هذا هو المسار المرجعي لإطلاق Dawayir Live من الخريطة أو الفاب وحتى شاشة الإكمال ثم العودة الواعية.",
    entryScreen: "map",
    targetScreen: "map",
    autoTriggerMaxEnergy: 5,
    primaryActionLabel: "ابدأ جلسة دواير لايف",
    primaryActionScreen: "/dawayir-live",
    secondaryActionLabel: "افتح بنك الذاكرة",
    secondaryActionScreen: "/dawayir-live/history",
    tertiaryActionLabel: "ارجع للخريطة",
    tertiaryActionScreen: "map",
    isActive: true,
    steps: [
      {
        id: "live-step-1",
        title: "إطلاق من الخريطة",
        kind: "entry",
        screen: "map",
        description: "المستخدم يدخل من الفاب أو إسقاط عقدة على Dawayir Live.",
        note: "مدخل اللايف النشط داخل تجربة دواير.",
        enabled: true
      },
      {
        id: "live-step-2",
        title: "تهيئة الجلسة",
        kind: "check",
        screen: "/dawayir-live",
        description: "الوصول إلى شاشة الترحيب/الإعداد وتحديد المدخل واللغة والنمط.",
        note: "أول surface فعلي قبل بدء الاتصال.",
        enabled: true
      },
      {
        id: "live-step-3",
        title: "الجلسة الحية",
        kind: "intervention",
        screen: "live-session",
        description: "الدخول إلى المحادثة الحية والخريطة الصوتية/المعرفية وبناء المخرجات.",
        note: "المرحلة الأساسية في المسار.",
        enabled: true
      },
      {
        id: "live-step-4",
        title: "شاشة إكمال الجلسة",
        kind: "screen",
        screen: "/dawayir-live/complete",
        description: "عرض ملخص الجلسة والبصيرة والتروث والملفات الناتجة.",
        note: "شاشة الإغلاق والتثبيت.",
        enabled: true
      },
      {
        id: "live-step-5",
        title: "العودة إلى الوجهة",
        kind: "outcome",
        screen: "map",
        description: "الخروج النهائي من Dawayir Live إلى الوجهة المستهدفة المعرفة للمسار.",
        note: "النهاية الافتراضية الحالية هي الخريطة.",
        enabled: true
      }
    ]
  },
  {
    id: "path-maraya-story",
    title: "مسار مرايا ستوري",
    slug: "maraya-story",
    description: "المسار السردي التأملي الذي يبدأ من أداة المرآية، يدخل المستخدم إلى عالم مرايا، يمر على لحظة اختيار/رؤية، ثم يخرج بأثر واضح إلى الوجهة التالية داخل الرحلة.",
    ownerNote: "هذا هو المسار المرجعي لتجربة Maraya من شاشة الدخول وحتى لحظة ما بعد الخاتمة.",
    entryScreen: "/maraya",
    targetScreen: "tools",
    autoTriggerMaxEnergy: 5,
    primaryActionLabel: "احمل الأثر إلى الأدوات",
    primaryActionScreen: "tools",
    secondaryActionLabel: "ابدأ مرايا جديدة",
    secondaryActionScreen: "/maraya",
    tertiaryActionLabel: "ارجع للرئيسية",
    tertiaryActionScreen: "/",
    isActive: true,
    steps: [
      {
        id: "maraya-step-1",
        title: "الدخول إلى مرايا",
        kind: "entry",
        screen: "/maraya",
        description: "المستخدم يفتح تجربة مرايا من الأدوات أو من مدخل مباشر داخل الرحلة.",
        note: "المدخل الحالي الفعلي هو route /maraya.",
        enabled: true
      },
      {
        id: "maraya-step-2",
        title: "تحديد النبرة والبداية",
        kind: "check",
        screen: "maraya-landing",
        description: "اختيار الشعور أو قراءة الفضاء وتهيئة العالم السردي قبل أن تبدأ القصة نفسها.",
        note: "تقابل Landing/Emotion Picker داخل Maraya.",
        enabled: true
      },
      {
        id: "maraya-step-3",
        title: "الغوص داخل القصة",
        kind: "intervention",
        screen: "maraya-story",
        description: "المشهد السردي الحي واتخاذ الاختيارات وبناء التحول النفسي والبصري.",
        note: "يمثل Story state داخل Maraya.",
        enabled: true
      },
      {
        id: "maraya-step-4",
        title: "الخاتمة والتحول",
        kind: "screen",
        screen: "maraya-ending",
        description: "عرض أثر الرحلة والتحول النهائي وخيارات ما بعد القصة.",
        note: "يمثل Ending state داخل Maraya.",
        enabled: true
      },
      {
        id: "maraya-step-5",
        title: "العودة بما خرجت به",
        kind: "outcome",
        screen: "tools",
        description: "الخروج من مرايا إلى الوجهة التالية المحددة في المسار مع حمل أثر التجربة.",
        note: "الوجهة الافتراضية الحالية هي أدوات الرحلة.",
        enabled: true
      }
    ]
  }
];

interface AdminState {
  adminAccess: boolean;
  isContentEditingEnabled: boolean;
  featureFlags: Record<FeatureFlagKey, FeatureFlagMode>;
  betaAccess: boolean;
  systemPrompt: string;
  scoringWeights: ScoringWeights;
  scoringThresholds: ScoringThresholds;
  aiLogs: AiLogEntry[];
  missions: AdminMission[];
  broadcasts: AdminBroadcast[];
  pulseCopyOverrides: PulseCopyOverrides;
  hasSovereignAlert: boolean;
  sovereignInsights: SovereignInsight[];
  sovereignStats: SovereignStats | null;
  insightResolutions: Record<string, { status: 'pending' | 'working' | 'fixed'; comment?: string; isSent?: boolean; updatedAt: number }>;
  journeyPaths: JourneyPath[];
  
  // Smart Caching Layer
  opsStatsCache: CacheEntry<any> | null;
  liveStatsCache: CacheEntry<any> | null;
  
  // Co-pilot
  isCopilotOpen: boolean;

  // Sovereign Intelligence Live State
  resonanceScore: number;
  latestFriction: string | null;
  aiInterventions: import("@/services/sovereignOrchestrator").SovereignIntervention[];
  agentActivity: import("@/services/LocalSovereignAgent").AgentActivityStep[];

  setAdminAccess: (value: boolean) => void;
  toggleContentEditing: (value: boolean) => void;
  setFeatureFlags: (flags: Record<FeatureFlagKey, FeatureFlagMode>) => void;
  updateFeatureFlag: (key: FeatureFlagKey, mode: FeatureFlagMode) => void;
  setBetaAccess: (value: boolean) => void;
  setSystemPrompt: (prompt: string) => void;
  setScoringWeights: (weights: ScoringWeights) => void;
  setScoringThresholds: (thresholds: ScoringThresholds) => void;
  addAiLog: (entry: AiLogEntry) => void;
  setAiLogs: (logs: AiLogEntry[]) => void;
  rateAiLog: (id: string, rating: "up" | "down") => void;
  clearAiLogs: () => void;
  addMission: (mission: AdminMission) => void;
  setMissions: (missions: AdminMission[]) => void;
  removeMission: (id: string) => void;
  addBroadcast: (broadcast: AdminBroadcast) => void;
  setBroadcasts: (broadcasts: AdminBroadcast[]) => void;
  removeBroadcast: (id: string) => void;
  setPulseCopyOverrides: (overrides: PulseCopyOverrides) => void;
  setHasSovereignAlert: (value: boolean) => void;
  setSovereignInsights: (insights: SovereignInsight[]) => void;
  updateInsightResolution: (id: string, resolution: { status: 'pending' | 'working' | 'fixed'; comment?: string; isSent?: boolean }) => void;
  setSovereignStats: (stats: SovereignStats) => void;
  setJourneyPaths: (paths: JourneyPath[]) => void;
  
  setOpsStatsCache: (data: any) => void;
  setLiveStatsCache: (data: any) => void;
  setCopilotOpen: (value: boolean) => void;
  setResonanceScore: (score: number) => void;
  setLatestFriction: (friction: string | null) => void;
  addAgentActivity: (activity: import("@/services/LocalSovereignAgent").AgentActivityStep) => void;
  clearAgentActivity: () => void;
}

const DEFAULT_PROMPT =
  "أنت مرشد الرحلة في فضاء الرحلة. لهجتك مصرية ذكية ومحترمة. استخدم قاموس دافئ (مدار/مساحة/ضجيج/طاقة)، وركّز على التمكين بخطوات عملية قصيرة بدون لغة طبية.";

const DEFAULT_WEIGHTS: ScoringWeights = {
  often: 3,
  sometimes: 2,
  rarely: 1,
  never: 0
};

const DEFAULT_THRESHOLDS: ScoringThresholds = {
  lowMax: 2,
  mediumMax: 5
};

function mergeJourneyPathsWithDefaults(
  persistedPaths: JourneyPath[] | undefined,
  defaultPaths: JourneyPath[]
): JourneyPath[] {
  if (!Array.isArray(persistedPaths) || persistedPaths.length === 0) {
    return defaultPaths;
  }

  const persistedBySlug = new Map(
    persistedPaths
      .filter((path) => path?.slug)
      .map((path) => [path.slug, path])
  );

  const mergedDefaults = defaultPaths.map((defaultPath) => {
    const persistedPath = persistedBySlug.get(defaultPath.slug);
    return persistedPath ? { ...defaultPath, ...persistedPath } : defaultPath;
  });

  const extraPersisted = persistedPaths.filter(
    (path) => path?.slug && !defaultPaths.some((defaultPath) => defaultPath.slug === path.slug)
  );

  return [...mergedDefaults, ...extraPersisted];
}

export const useAdminState = create<AdminState>()(
  persist(
    (set) => ({
      adminAccess: false,
      isContentEditingEnabled: false,
      featureFlags: DEFAULT_FEATURE_FLAGS,
      betaAccess: false,
      systemPrompt: DEFAULT_PROMPT,
      scoringWeights: DEFAULT_WEIGHTS,
      scoringThresholds: DEFAULT_THRESHOLDS,
      aiLogs: [],
      missions: [],
      broadcasts: [],
      pulseCopyOverrides: { energy: "auto", mood: "auto", focus: "auto" },
      hasSovereignAlert: false,
      sovereignInsights: [],
      sovereignStats: null,
      insightResolutions: {},
      journeyPaths: DEFAULT_JOURNEY_PATHS,
      opsStatsCache: null,
      liveStatsCache: null,
      isCopilotOpen: false,
      resonanceScore: 100,
      latestFriction: null,
      aiInterventions: [],
      agentActivity: [],

      setAdminAccess: (value) => set({ adminAccess: value }),
      toggleContentEditing: (value) => set({ isContentEditingEnabled: value }),
      setFeatureFlags: (flags) =>
        set({
          featureFlags: {
            ...DEFAULT_FEATURE_FLAGS,
            ...flags
          }
        }),
      updateFeatureFlag: (key, mode) =>
        set((state) => ({
          featureFlags: { ...state.featureFlags, [key]: mode }
        })),
      setBetaAccess: (value) => set({ betaAccess: value }),
      setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),
      setScoringWeights: (weights) => set({ scoringWeights: weights }),
      setScoringThresholds: (thresholds) => set({ scoringThresholds: thresholds }),
      addAiLog: (entry) =>
        set((state) => ({
          aiLogs: [entry, ...state.aiLogs].slice(0, 50)
        })),
      setAiLogs: (logs) => set({ aiLogs: logs }),
      rateAiLog: (id, rating) =>
        set((state) => ({
          aiLogs: state.aiLogs.map((log) => (log.id === id ? { ...log, rating } : log))
        })),
      clearAiLogs: () => set({ aiLogs: [] }),
      addMission: (mission) =>
        set((state) => ({ missions: [mission, ...state.missions] })),
      setMissions: (missions) => set({ missions }),
      removeMission: (id) =>
        set((state) => ({ missions: state.missions.filter((m) => m.id !== id) })),
      addBroadcast: (broadcast) =>
        set((state) => ({ broadcasts: [broadcast, ...state.broadcasts] })),
      setBroadcasts: (broadcasts) => set({ broadcasts }),
      removeBroadcast: (id) =>
        set((state) => ({ broadcasts: state.broadcasts.filter((b) => b.id !== id) })),
      setPulseCopyOverrides: (overrides) => set({ pulseCopyOverrides: overrides }),
      setHasSovereignAlert: (value) => set({ hasSovereignAlert: value }),
      setSovereignInsights: (insights) => set({ sovereignInsights: insights }),
      updateInsightResolution: (id, res) => set((state) => ({
        insightResolutions: {
          ...state.insightResolutions,
          [id]: { ...res, updatedAt: Date.now() }
        }
      })),
      setSovereignStats: (stats) => set({ sovereignStats: stats }),
      setJourneyPaths: (journeyPaths) => set({ journeyPaths }),
      setOpsStatsCache: (data) => 
        set({ opsStatsCache: data ? { data, timestamp: Date.now() } : null }),
      setLiveStatsCache: (data) => 
        set({ liveStatsCache: data ? { data, timestamp: Date.now() } : null }),
      setCopilotOpen: (value) => set({ isCopilotOpen: value }),
      setResonanceScore: (score) => set({ resonanceScore: score }),
      setLatestFriction: (friction) => set({ latestFriction: friction }),
      addAgentActivity: (activity) =>
        set((state) => ({
          agentActivity: [activity, ...state.agentActivity].slice(0, 100)
        })),
      clearAgentActivity: () => set({ agentActivity: [] })
    }),
    {
      name: "dawayir-admin-state",
      merge: (persistedState, currentState) => {
        const typedPersistedState = persistedState as Partial<AdminState> | undefined;
        if (!typedPersistedState) return currentState;

        return {
          ...currentState,
          ...typedPersistedState,
          journeyPaths: mergeJourneyPathsWithDefaults(
            typedPersistedState.journeyPaths,
            currentState.journeyPaths
          )
        };
      }
    }
  )
);

export function isFeatureAllowed(key: FeatureFlagKey): boolean {
  const state = useAdminState.getState();
  const access = getEffectiveFeatureAccess({
    featureFlags: state.featureFlags,
    betaAccess: state.betaAccess,
    role: getAuthRole(),
    adminAccess: state.adminAccess,
    isDev: !isUserMode && runtimeEnv.isDev
  });
  return access[key];
}

export function getScoringWeights(): ScoringWeights {
  return useAdminState.getState().scoringWeights ?? DEFAULT_WEIGHTS;
}

export function getScoringThresholds(): ScoringThresholds {
  return useAdminState.getState().scoringThresholds ?? DEFAULT_THRESHOLDS;
}
