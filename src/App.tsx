import { useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, MessageCircle } from "lucide-react";
import { Landing } from "./components/Landing";
import { LegalPage } from "./components/LegalPage";
import { useNotificationState } from "./state/notificationState";
import { useEmergencyState } from "./state/emergencyState";
import { useMapState } from "./state/mapState";
import { startBiometricStream, analyzeStressLevels, type BiometricPulse } from "./services/biometricsBridge";
import { useJourneyState } from "./state/journeyState";
import { useAchievementState, getLibraryOpenedAt, getBreathingUsedAt } from "./state/achievementState";
import { useThemeState } from "./state/themeState";
import { initThemePalette } from "./services/themePalette";
import { usePulseState } from "./state/pulseState";
import type { PulseEnergyConfidence, PulseFocus, PulseMood } from "./state/pulseState";
import { trackPageView, trackEvent, AnalyticsEvents } from "./services/analytics";
import { getTrackingSessionId, recordFlowEvent } from "./services/journeyTracking";
import { sendNotification, sendPresetNotification, NOTIFICATION_TYPES } from "./services/notifications";
import {
  fetchPublicBroadcasts,
  doesBroadcastMatchAudience,
  isAppInstalledMode,
  type PublicBroadcast
} from "./services/broadcasts";
import { resolveAdviceCategory, type AdviceCategory } from "./data/adviceScripts";
import type { AgentActions, AgentContext } from "./agent/types";
import { getIncompleteMissionSteps } from "./utils/missionProgress";
import { getLastGoalMeta } from "./utils/goalLabel";
import { getWeeklyPulseInsight } from "./utils/pulseInsights";
import { useAdminState } from "./state/adminState";
import { getEffectiveFeatureAccess, isPrivilegedRole } from "./utils/featureFlags";
import type { FeatureFlagKey } from "./config/features";
import { getEffectiveRoleFromState, useAuthState, type UserToneGender } from "./state/authState";
import { consciousnessService, type ConsciousnessInsight, type MemoryMatch } from "./services/consciousnessService";
import { initAppContentRealtime } from "./state/appContentState";
import { PWAInstallProvider } from "./contexts/PWAInstallContext";
import { GoogleAuthModal } from "./components/GoogleAuthModal";
import { OnboardingWelcomeBubble, type WelcomeSource } from "./components/OnboardingWelcomeBubble";
import { OnboardingFlow, hasCompletedJourneyOnboarding, resetJourneyOnboarding } from "./components/OnboardingFlow";
import { JourneyToast } from "./components/JourneyToast";
import { AnalyticsConsentBanner } from "./components/AnalyticsConsentBanner";
import { ActiveInterventionPrompt } from "./components/ActiveInterventionPrompt";
import { FaqScreen } from "./components/FaqScreen";
import { clearPostAuthIntent, getPostAuthIntent, type PostAuthIntent } from "./utils/postAuthIntent";
import { geminiClient } from "./services/geminiClient";
import { isSupabaseReady } from "./services/supabaseClient";
import { fetchAdminConfig, fetchOwnerAlerts } from "./services/adminApi";
import { usePulseCheckLogic } from "./hooks/usePulseCheckLogic";
import { useIdleAwareTelemetry, type IdleAwareTelemetrySnapshot } from "./hooks/useIdleAwareTelemetry";
import { isPhaseOneUserFlow, isUserMode } from "./config/appEnv";
import {
  createCurrentUrl,
  getHash,
  getOrigin,
  getPathname,
  getSearch,
  isAdminPath,
  isAnalyticsPath,
  pushUrl,
  reloadPage,
  replaceUrl,
  subscribePopstate
} from "./services/navigation";
import { getFromLocalStorage, setInLocalStorage } from "./services/browserStorage";
import { openInNewTab } from "./services/clientDom";
import { getDocumentOrNull, getWindowOrNull } from "./services/clientRuntime";
import { initLanguage } from "./services/i18n";
import { runtimeEnv } from "./config/runtimeEnv";
import { getNextNudge, dismissNudge } from "./services/nudgeEngine";
import { detectContradictions, dismissMirrorInsight, type MirrorInsight } from "./services/mirrorLogic";
import { calculateEntropy, type UserState } from "./services/predictiveEngine";
import {
  computeNextStepDecision,
  reportDecisionOutcome,
  subscribeToDawayirSignals,
  type NextStepDecisionV1,
  type RecentTelemetrySignalV1
} from "./modules/recommendation";
import { MirrorOverlay } from "./components/MirrorOverlay";
import { StartupSequence } from "./components/StartupSequence";
import { GraphEventToast } from "./components/GraphEventToast";
import { useSwarmState } from "./state/swarmState";
import { determineAutoPersona } from "./agent/swarmLogic";
import { resolveNavigation, type AppScreen } from "./navigation/navigationMachine";
import { normalizeOwnerAction, normalizePreviewFeature } from "./navigation/actionRoutingMachine";
import { executeOwnerAction } from "./navigation/ownerActionExecutor";
import { resolveLandingChromeVisibility } from "./app/orchestration/chromeVisibility";
import { AUTO_COCOON_LAST_SHOWN_DATE_KEY, evaluateCocoonOpen } from "./app/orchestration/modalOrchestrator";
import { startAutonomousStartupJobs } from "./app/orchestration/startupJobs";

// Initialize language on app start
initLanguage();

type Screen = AppScreen;
type PulseSubmitPayload = {
  energy: number | null;
  mood: PulseMood | null;
  focus: PulseFocus | null;
  auto?: boolean;
  notes?: string;
  energyReasons?: string[];
  energyConfidence?: PulseEnergyConfidence;
};

type ActiveInterventionState = {
  decisionId: string;
  hesitationSec: number;
  cognitiveLoadRequired: number;
};

function inferCognitiveLoadFromDecision(decision: NextStepDecisionV1): number {
  const payload = decision.action.actionPayload ?? {};
  const fromPayload = Number((payload as Record<string, unknown>).cognitiveLoadRequired);
  if (Number.isFinite(fromPayload)) return Math.max(1, Math.min(5, Math.round(fromPayload)));
  if (decision.action.actionType === "open_mission") return 4;
  if (decision.action.actionType === "journal_reflection") return 3;
  if (decision.action.actionType === "open_breathing") return 1;
  return 3;
}
/** مسافة للمينيو - تاب صغير ظاهر (الشريط يظهر عند التحريك) */

const CoreMapScreen = lazy(() => import("./components/CoreMapScreen").then((m) => ({ default: m.CoreMapScreen })));
const GoalPicker = lazy(() => import("./components/GoalPicker").then((m) => ({ default: m.GoalPicker })));
const RelationshipGym = lazy(() => import("./components/RelationshipGym").then((m) => ({ default: m.RelationshipGym })));
const BaselineAssessment = lazy(() => import("./components/BaselineAssessment").then((m) => ({ default: m.BaselineAssessment })));
const PulseCheckModal = lazy(() => import("./components/PulseCheckModal").then((m) => ({ default: m.PulseCheckModal })));
const CocoonModeModal = lazy(() => import("./components/CocoonModeModal").then((m) => ({ default: m.CocoonModeModal })));
const MuteProtocol = lazy(() =>
  import("./components/MuteProtocol").then((m) => ({ default: m.NoiseSilencingModal }))
);
const BreathingOverlay = lazy(() => import("./components/BreathingOverlay").then((m) => ({ default: m.BreathingOverlay })));
const FeatureLockedModal = lazy(() =>
  import("./components/FeatureLockedModal").then((m) => ({ default: m.FeatureLockedModal }))
);
const AchievementToast = lazy(() =>
  import("./components/AchievementToast").then((m) => ({ default: m.AchievementToast }))
);
const AIChatbot = lazy(() => import("./components/AIChatbot").then((m) => ({ default: m.AIChatbot })));
const ConsciousnessArchiveModal = lazy(
  () => import("./components/ConsciousnessArchiveModal").then((m) => ({ default: m.ConsciousnessArchiveModal }))
);
const EmergencyOverlay = lazy(() => import("./components/EmergencyOverlay").then((m) => ({ default: m.EmergencyOverlay })));
const GuidedJourneyFlow = lazy(() => import("./components/GuidedJourneyFlow").then((m) => ({ default: m.GuidedJourneyFlow })));
const MissionScreen = lazy(() => import("./components/MissionScreen").then((m) => ({ default: m.MissionScreen })));
const JourneyToolsScreen = lazy(() => import("./components/JourneyToolsScreen").then((m) => ({ default: m.JourneyToolsScreen })));
const AdminDashboard = lazy(() => import("./components/admin/AdminDashboard").then((m) => ({ default: m.AdminDashboard })));
const AdminOverviewPanel = lazy(() =>
  import("./components/admin/dashboard/Overview/OverviewPanel").then((m) => ({ default: m.OverviewPanel }))
);
const DataManagement = lazy(() => import("./components/DataManagement").then((m) => ({ default: m.DataManagement })));
const NotificationSettings = lazy(() =>
  import("./components/NotificationSettings").then((m) => ({ default: m.NotificationSettings }))
);
const TrackingDashboard = lazy(() =>
  import("./components/TrackingDashboard").then((m) => ({ default: m.TrackingDashboard }))
);
const AtlasDashboard = lazy(() => import("./components/AtlasDashboard").then((m) => ({ default: m.AtlasDashboard })));
const ShareStats = lazy(() => import("./components/ShareStats").then((m) => ({ default: m.ShareStats })));
const EducationalLibrary = lazy(() =>
  import("./components/EducationalLibrary").then((m) => ({ default: m.EducationalLibrary }))
);
const SymptomsOverviewModal = lazy(() =>
  import("./components/SymptomsOverviewModal").then((m) => ({ default: m.SymptomsOverviewModal }))
);
const ThemeSettings = lazy(() => import("./components/ThemeSettings").then((m) => ({ default: m.ThemeSettings })));
const Achievements = lazy(() => import("./components/Achievements").then((m) => ({ default: m.Achievements })));
const RecoveryPlanModal = lazy(() =>
  import("./components/RecoveryPlanModal").then((m) => ({ default: m.RecoveryPlanModal }))
);
const AdvancedToolsModal = lazy(() =>
  import("./components/AdvancedToolsModal").then((m) => ({ default: m.AdvancedToolsModal }))
);
const ClassicRecoveryModal = lazy(() =>
  import("./components/ClassicRecoveryModal").then((m) => ({ default: m.ClassicRecoveryModal }))
);
const ManualPlacementModal = lazy(() =>
  import("./components/ManualPlacementModal").then((m) => ({ default: m.ManualPlacementModal }))
);
const FeedbackModal = lazy(() => import("./components/FeedbackModal").then((m) => ({ default: m.FeedbackModal })));
const EnterprisePortal = lazy(() => import("./components/enterprise/EnterprisePortal").then((m) => ({ default: m.EnterprisePortal })));
const GuiltCourt = lazy(() => import("./components/GuiltCourt").then((m) => ({ default: m.GuiltCourt })));
const DiplomaticCables = lazy(() => import("./components/DiplomaticCables").then((m) => ({ default: m.DiplomaticCables })));

// Phase 30: Holographic Legacy
const AmbientRealityMode = lazy(() => import("./components/AmbientRealityMode").then((m) => ({ default: m.AmbientRealityMode })));
const TimeCapsuleVault = lazy(() => import("./components/TimeCapsuleVault").then((m) => ({ default: m.TimeCapsuleVault })));

const preloadCoreMap = () => import("./components/CoreMapScreen");
const preloadChatbot = () => import("./components/AIChatbot");
const preloadGym = () => import("./components/RelationshipGym");
const hasSupabaseEnv = Boolean(runtimeEnv.supabaseUrl && runtimeEnv.supabaseAnonKey);
type AgentModule = typeof import("./agent");
const LAST_SEEN_BROADCAST_KEY = "dawayir-last-seen-broadcast-id";
const DEFAULT_WHATSAPP_CONTACT = "0201023050092";
const OWNER_ALERTS_LAST_CHECK_KEY = "dawayir-owner-alerts-last-check";
const OWNER_ALERTS_MILESTONES_KEY = "dawayir-owner-alerts-milestones";
const LAST_UI_STATE_STORAGE_KEY_PREFIX = "dawayir-last-ui-state";
const LAST_SCREEN_STORAGE_KEY_PREFIX = "dawayir-last-screen";

type PersistedModalState = {
  showJourneyGuideChat: boolean;
  showOwnerDataTools: boolean;
  showNotificationSettings: boolean;
  showTrackingDashboard: boolean;
  showAtlasDashboard: boolean;
  showShareStats: boolean;
  showLibrary: boolean;
  showSymptomsOverview: boolean;
  showRecoveryPlan: boolean;
  showThemeSettings: boolean;
  showAchievements: boolean;
  showAdvancedTools: boolean;
  showClassicRecovery: boolean;
  showManualPlacement: boolean;
  showFeedback: boolean;
};

type PersistedUiState = {
  version: 1;
  screen: Screen;
  modals: PersistedModalState;
};

type PulseDeltaToastTone = "up" | "down" | "same" | "neutral";
type PulseDeltaToast = { title: string; body: string; tone: PulseDeltaToastTone };

function getUserLastScreenStorageKey(userId: string): string {
  return `${LAST_SCREEN_STORAGE_KEY_PREFIX}:${userId}`;
}
function getUserLastUiStateStorageKey(userId: string): string {
  return `${LAST_UI_STATE_STORAGE_KEY_PREFIX}:${userId}`;
}

function normalizeRestorableScreen(value: string | null): Screen | null {
  if (value === "landing" || value === "goal" || value === "map" || value === "guided" || value === "tools" || value === "enterprise") {
    return value;
  }
  return null;
}

function toBoolean(value: unknown): boolean {
  return value === true;
}

function normalizePersistedModals(input: unknown): PersistedModalState {
  const value = (input ?? {}) as Partial<PersistedModalState>;
  return {
    showJourneyGuideChat: toBoolean(value.showJourneyGuideChat),
    showOwnerDataTools: toBoolean(value.showOwnerDataTools),
    showNotificationSettings: toBoolean(value.showNotificationSettings),
    showTrackingDashboard: toBoolean(value.showTrackingDashboard),
    showAtlasDashboard: toBoolean(value.showAtlasDashboard),
    showShareStats: toBoolean(value.showShareStats),
    showLibrary: toBoolean(value.showLibrary),
    showSymptomsOverview: toBoolean(value.showSymptomsOverview),
    showRecoveryPlan: toBoolean(value.showRecoveryPlan),
    showThemeSettings: toBoolean(value.showThemeSettings),
    showAchievements: toBoolean(value.showAchievements),
    showAdvancedTools: toBoolean(value.showAdvancedTools),
    showClassicRecovery: toBoolean(value.showClassicRecovery),
    showManualPlacement: toBoolean(value.showManualPlacement),
    showFeedback: toBoolean(value.showFeedback)
  };
}

function getYesterdayPulseEnergy(logs: Array<{ energy: number; timestamp: number }>, now = Date.now()): number | null {
  const current = new Date(now);
  const yesterdayStart = new Date(current.getFullYear(), current.getMonth(), current.getDate() - 1).getTime();
  const todayStart = new Date(current.getFullYear(), current.getMonth(), current.getDate()).getTime();
  const yesterdayLog = logs.find((entry) => entry.timestamp >= yesterdayStart && entry.timestamp < todayStart);
  return yesterdayLog?.energy ?? null;
}

function buildPulseDeltaToast(currentEnergy: number, yesterdayEnergy: number | null): PulseDeltaToast {
  if (yesterdayEnergy == null) {
    return {
      title: "\u062a\u0645 \u062d\u0641\u0638 \u0645\u0624\u0634\u0631 \u0627\u0644\u0637\u0627\u0642\u0629",
      body: "\u0645\u0627\u0641\u064a\u0634 \u0642\u064a\u0627\u0633 \u0623\u0645\u0628\u0627\u0631\u062d \u0644\u0644\u0645\u0642\u0627\u0631\u0646\u0629.",
      tone: "neutral"
    };
  }
  const delta = currentEnergy - yesterdayEnergy;
  if (delta > 0) {
    return {
      title: `\u0637\u0627\u0642\u062a\u0643 \u0627\u0644\u0646\u0647\u0627\u0631\u062f\u0647 \u0623\u0639\u0644\u0649 \u0645\u0646 \u0623\u0645\u0628\u0627\u0631\u062d \u2197 (+${delta})`,
      body: `\u0627\u0644\u064a\u0648\u0645 ${currentEnergy}/10 \u0645\u0642\u0627\u0628\u0644 ${yesterdayEnergy}/10 \u0623\u0645\u0628\u0627\u0631\u062d.`,
      tone: "up"
    };
  }
  if (delta < 0) {
    return {
      title: `\u0637\u0627\u0642\u062a\u0643 \u0627\u0644\u0646\u0647\u0627\u0631\u062f\u0647 \u0623\u0642\u0644 \u0645\u0646 \u0623\u0645\u0628\u0627\u0631\u062d \u2198 (${delta})`,
      body: `\u0627\u0644\u064a\u0648\u0645 ${currentEnergy}/10 \u0645\u0642\u0627\u0628\u0644 ${yesterdayEnergy}/10 \u0623\u0645\u0628\u0627\u0631\u062d.`,
      tone: "down"
    };
  }
  return {
    title: "\u0637\u0627\u0642\u062a\u0643 \u0632\u064a \u0623\u0645\u0628\u0627\u0631\u062d \u2192",
    body: `\u062b\u0628\u0627\u062a \u062c\u064a\u062f: ${currentEnergy}/10 \u0632\u064a \u0627\u0644\u0642\u0631\u0627\u064a\u0629 \u0627\u0644\u0644\u064a \u0642\u0628\u0644\u064a\u0647\u0627.`,
    tone: "same"
  };
}

function buildStartRecoveryWelcome(firstName: string | null, toneGender: UserToneGender): string {
  const prefix = firstName ? `أهلاً يا ${firstName}` : "أهلاً";
  if (toneGender === "female") return `${prefix}، هل أنتِ مستعدة لبدء الرحلة؟ التعافي مش سحر، هو رحلة بتبدأها بخطواتك.`;
  if (toneGender === "male") return `${prefix}، هل أنت مستعد لبدء الرحلة؟ التعافي مش سحر، هو رحلة بتبدأها بخطواتك.`;
  return `${prefix}، هل أنت مستعد لبدء الرحلة؟ التعافي مش سحر، هو رحلة بتبدأها بخطواتك.`;
}

function buildWelcomePrompt(firstName: string | null, toneGender: UserToneGender): string {
  const toneLabel = toneGender === "female" ? "مؤنث دافئ" : toneGender === "male" ? "مذكر دافئ" : "محايد ودود";
  const namePart = firstName ? ` لمستخدم اسمه "${firstName}"` : "";
  const tonePart = toneGender === "neutral" ? "بدون تذكير/تأنيث مباشر" : `بصيغة مخاطبة ${toneLabel}`;
  return `اكتب ترحيب قصير وودود باللهجة المصرية${namePart}. جملة واحدة بشكل طبيعي (بدون سؤال منفصل). بدون إيموجي. بدون علامات اقتباس. أقل من 15 كلمة. ${tonePart}. لا تكرر الاسم كثيرًا.`;
}

function cleanSingleLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function cleanWelcomeMessage(text: string | null): string | null {
  if (!text) return null;
  const oneLine = cleanSingleLine(text);
  if (!oneLine) return null;
  const unquoted = oneLine.replace(/^["â€œ]+|["â€]+$/g, "").trim();
  if (!unquoted) return null;
  return unquoted.length > 140 ? `${unquoted.slice(0, 140).trim()}...` : unquoted;
}

function hasOAuthCallbackParams(): boolean {
  const search = new URLSearchParams(getSearch());
  if (search.has("code") || search.has("state") || search.has("error") || search.has("error_description")) {
    return true;
  }

  const rawHash = getHash();
  const hash = rawHash.startsWith("#") ? rawHash.slice(1) : rawHash;
  const hashParams = new URLSearchParams(hash);
  return (
    hashParams.has("access_token") ||
    hashParams.has("refresh_token") ||
    hashParams.has("expires_in") ||
    hashParams.has("token_type") ||
    hashParams.has("type") ||
    hashParams.has("error") ||
    hashParams.has("error_description")
  );
}

function normalizeArabicDigits(value: string): string {
  return value
    .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 1632))
    .replace(/[\u06F0-\u06F9]/g, (digit) => String(digit.charCodeAt(0) - 1776));
}

function normalizeWhatsAppPhone(rawPhone: string): string {
  let digits = normalizeArabicDigits(rawPhone).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("020")) digits = digits.slice(1);
  if (digits.startsWith("0") && digits.length === 11) digits = `20${digits.slice(1)}`;
  if (digits.startsWith("2") && digits.length === 12) return digits;
  if (digits.startsWith("20")) return digits;
  return digits;
}

type OwnerMilestonesState = {
  registeredReached: boolean;
  installedReached: boolean;
  addedReached: boolean;
  fullyCompleted: boolean;
};

function loadOwnerMilestonesState(): OwnerMilestonesState {
  if (typeof window === "undefined") {
    return { registeredReached: false, installedReached: false, addedReached: false, fullyCompleted: false };
  }
  try {
    const raw = getFromLocalStorage(OWNER_ALERTS_MILESTONES_KEY);
    if (!raw) return { registeredReached: false, installedReached: false, addedReached: false, fullyCompleted: false };
    const parsed = JSON.parse(raw) as Partial<OwnerMilestonesState>;
    return {
      registeredReached: Boolean(parsed.registeredReached),
      installedReached: Boolean(parsed.installedReached),
      addedReached: Boolean(parsed.addedReached),
      fullyCompleted: Boolean(parsed.fullyCompleted)
    };
  } catch {
    return { registeredReached: false, installedReached: false, addedReached: false, fullyCompleted: false };
  }
}

function saveOwnerMilestonesState(value: OwnerMilestonesState): void {
  if (typeof window === "undefined") return;
  setInLocalStorage(OWNER_ALERTS_MILESTONES_KEY, JSON.stringify(value));
}

import { JourneyTimeline } from "./components/JourneyTimeline";

export default function App() {
  // Phase 19: Startup Sequence — shows once per session
  const [showStartup, setShowStartup] = useState(() => {
    if (typeof window === "undefined") return false;
    const seen = sessionStorage.getItem("dawayir-startup-seen");
    return !seen;
  });
  const [screen, setScreen] = useState<Screen>("landing");
  const isLandingScreen = screen === "landing";

  // Phase 27: Swarm State & Automatic Selection
  const { activePersona, setActivePersona, manualOverride } = useSwarmState();


  const [category, setCategory] = useState<AdviceCategory>("general");
  const [goalId, setGoalId] = useState<string>("unknown");
  const [showGym, setShowGym] = useState(false);
  const [showBaseline, setShowBaseline] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [missionNodeId, setMissionNodeId] = useState<string | null>(null);
  const phaseOneMissionBypassRef = useRef(false);
  const [toolsBackScreen, setToolsBackScreen] = useState<Screen>("landing");
  const [showCocoon, setShowCocoon] = useState(false);
  /** عند إغلاق التنفس: لو فُتح من مسار دقيقة شحن نرجع لشاشة الخريطة */
  const [returnToGoalOnBreathingClose, setReturnToGoalOnBreathingClose] = useState(false);
  const breathingFromCocoonRef = useRef(false);
  const [suppressLowPulseCocoonUntil, setSuppressLowPulseCocoonUntil] = useState(0);
  const [suppressCocoonReopen, setSuppressCocoonReopen] = useState(false);
  const cocoonSuppressTimerRef = useRef<number | null>(null);
  const cocoonSuppressedUntilRef = useRef<number>(0);
  const lastAutoCocoonOpenAtRef = useRef<number>(0);
  const [showNoiseSilencingPulse, setShowNoiseSilencingPulse] = useState(false);
  const [, setPendingCocoonAfterNoise] = useState(false);
  const [postNoiseSessionMessage, setPostNoiseSessionMessage] = useState(false);
  const [postBreathingMessage, setPostBreathingMessage] = useState(false);
  const [pulseDeltaToast, setPulseDeltaToast] = useState<PulseDeltaToast | null>(null);
  const [lastPulseInsights, setLastPulseInsights] = useState<MemoryMatch[]>([]);
  const [showConsciousnessArchive, setShowConsciousnessArchive] = useState(false);
  const [themeBeforePulse, setThemeBeforePulse] = useState<"light" | "dark" | "system" | null>(null);
  const [agentModule, setAgentModule] = useState<AgentModule | null>(null);
  const [lockedFeature, setLockedFeature] = useState<FeatureFlagKey | null>(null);
  const [isAdminRoute, setIsAdminRoute] = useState(() => isAdminPath());
  const [isAnalyticsRoute, setIsAnalyticsRoute] = useState(() => isAnalyticsPath());
  const [postAuthIntent, setPostAuthIntentState] = useState<PostAuthIntent | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  /** ربط الرجوع بالتاتش/زر الرجوع بالشاشة السابقة بدل إغلاق التطبيق */
  const fromPopStateRef = useRef(false);
  const hasHistorySyncedRef = useRef(false);
  const restoredLastScreenForUserRef = useRef<string | null>(null);
  const hasHydratedUiStateRef = useRef(false);
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [showOwnerDataTools, setShowOwnerDataTools] = useState(false);
  // Phase 30: Holographic Legacy
  const [showAmbientReality, setShowAmbientReality] = useState(false);
  const [showTimeCapsuleVault, setShowTimeCapsuleVault] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showTrackingDashboard, setShowTrackingDashboard] = useState(false);
  const [showAtlasDashboard, setShowAtlasDashboard] = useState(false);
  const [showShareStats, setShowShareStats] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showSymptomsOverview, setShowSymptomsOverview] = useState(false);
  const [showRecoveryPlan, setShowRecoveryPlan] = useState(false);
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);
  const [showClassicRecovery, setShowClassicRecovery] = useState(false);
  const [showManualPlacement, setShowManualPlacement] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [activeIntervention, setActiveIntervention] = useState<ActiveInterventionState | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false); // Default to false to show Landing first
  const [nextStepDecision, setNextStepDecision] = useState<NextStepDecisionV1 | null>(null);
  const [nextStepRefreshTick, setNextStepRefreshTick] = useState(0);
  const nextStepRequestSeqRef = useRef(0);
  const nextStepLastRefreshRef = useRef(0);
  const nextStepTelemetry = useIdleAwareTelemetry();
  const recentRoutingTelemetryRef = useRef<RecentTelemetrySignalV1[]>([]);

  const [showWelcomeToast, setShowWelcomeToast] = useState(false);
  const [showFaq, setShowFaq] = useState(false);
  const [ownerInstallRequestNonce, setOwnerInstallRequestNonce] = useState(0);
  const [showJourneyGuideChat, setShowJourneyGuideChat] = useState(false);
  const [welcome, setWelcome] = useState<{ message: string; source: WelcomeSource } | null>(null);
  const [consciousnessInsight, setConsciousnessInsight] = useState<ConsciousnessInsight | null>(null);
  const [showJourneyTimeline, setShowJourneyTimeline] = useState(false);
  const [isFeaturePreviewSession, setIsFeaturePreviewSession] = useState(false);
  const [previewedFeature, setPreviewedFeature] = useState<FeatureFlagKey | null>(null);
  const [activeBroadcast, setActiveBroadcast] = useState<PublicBroadcast | null>(null);
  const pulseDeltaTimerRef = useRef<number | null>(null);
  const whatsAppNumber = runtimeEnv.whatsappContactNumber || DEFAULT_WHATSAPP_CONTACT;
  const whatsAppLink = useMemo(() => {
    const normalized = normalizeWhatsAppPhone(whatsAppNumber);
    return normalized ? `https://wa.me/${normalized}` : null;
  }, [whatsAppNumber]);

  const recordUserActivity = useNotificationState((s) => s.recordUserActivity);
  const notificationSettings = useNotificationState((s) => s.settings);
  const notificationPermission = useNotificationState((s) => s.permission);
  const notificationSupported = useNotificationState((s) => s.isSupported);
  const isEmergencyOpen = useEmergencyState((s) => s.isOpen);
  const nodes = useMapState((s) => s.nodes);
  const baselineCompletedAt = useJourneyState((s) => s.baselineCompletedAt);
  const storedGoalId = useJourneyState((s) => s.goalId);
  const storedCategory = useJourneyState((s) => s.category);
  const lastGoalById = useJourneyState((s) => s.lastGoalById);
  const checkAndUnlock = useAchievementState((s) => s.checkAndUnlock);
  const lastNewAchievementId = useAchievementState((s) => s.lastNewAchievementId);
  const theme = useThemeState((s) => s.theme);
  const setTheme = useThemeState((s) => s.setTheme);
  const lastPulse = usePulseState((s) => s.lastPulse);
  const pulseLogs = usePulseState((s) => s.logs);
  const weekdayLabels = usePulseState((s) => s.weekdayLabels);
  const snoozedUntil = usePulseState((s) => s.snoozedUntil);
  const logPulse = usePulseState((s) => s.logPulse);
  const snoozeNotifications = usePulseState((s) => s.snoozeNotifications);

  // Nudge Engine Logic
  const [activeNudge, setActiveNudge] = useState<import("./services/nudgeEngine").Nudge | null>(null);
  const [showNudgeToast, setShowNudgeToast] = useState(false);

  // Mirror Logic (Phase 12)
  const [activeMirrorInsight, setActiveMirrorInsight] = useState<MirrorInsight | null>(null);
  const [, setShowMirrorOverlay] = useState(false);

  const featureFlags = useAdminState((s) => s.featureFlags);
  const betaAccess = useAdminState((s) => s.betaAccess);
  const adminPrompt = useAdminState((s) => s.systemPrompt);
  const adminAccess = useAdminState((s) => s.adminAccess);
  const setFeatureFlags = useAdminState((s) => s.setFeatureFlags);
  const setSystemPrompt = useAdminState((s) => s.setSystemPrompt);
  const setScoringWeights = useAdminState((s) => s.setScoringWeights);
  const setScoringThresholds = useAdminState((s) => s.setScoringThresholds);
  const setPulseCheckMode = usePulseState((s) => s.setCheckInMode);
  const authStatus = useAuthState((s) => s.status);
  const authUser = useAuthState((s) => s.user);
  const authFirstName = useAuthState((s) => s.firstName);
  const authToneGender = useAuthState((s) => s.toneGender);
  const role = useAuthState(getEffectiveRoleFromState);
  const isPrivilegedUser = isPrivilegedRole(role);
  const normalizedRole = typeof role === "string" ? role.trim().toLowerCase() : "";
  const isOwnerWatcher = normalizedRole === "owner" || normalizedRole === "superadmin" || adminAccess;
  const isLockedPhaseOne = isPhaseOneUserFlow && !isOwnerWatcher;
  const availableFeatures = useMemo(
    () =>
      getEffectiveFeatureAccess({
        featureFlags,
        betaAccess,
        role,
        adminAccess,
        isDev: !isUserMode && runtimeEnv.isDev
      }),
    [featureFlags, betaAccess, role, adminAccess]
  );
  const canUseMap = availableFeatures.dawayir_map;
  const canUseJourneyTools = availableFeatures.journey_tools && !isLockedPhaseOne;
  const canUseAIField = availableFeatures.ai_field && !isLockedPhaseOne;
  const canShowAIChatbot = canUseAIField && isPrivilegedUser;
  const canUsePulseCheck = availableFeatures.pulse_check;
  const shouldPromptAuthAfterPulse = !authUser && !isPrivilegedUser;
  const shouldGateStartWithAuth = isSupabaseReady && !authUser && !isPrivilegedUser;
  const {
    showPulseCheck,
    setShowPulseCheck,
    pulseCheckContext,
    setPulseCheckContext,
    skipNextCheck: skipNextPulseCheck
  } = usePulseCheckLogic(canUsePulseCheck, screen, shouldGateStartWithAuth);
  const chromeVisibility = useMemo(
    () =>
      resolveLandingChromeVisibility({
        isAdminRoute,
        showAuthModal,
        showPulseCheck,
        isLandingScreen,
        hasWhatsAppLink: Boolean(whatsAppLink)
      }),
    [isAdminRoute, isLandingScreen, showAuthModal, showPulseCheck, whatsAppLink]
  );

  const navigateToScreen = useCallback((target: Screen): boolean => {
    const result = resolveNavigation({
      target,
      canUseMap,
      canUseJourneyTools,
      isLockedPhaseOne
    });

    if (result.kind === "blocked") {
      setLockedFeature(result.feature);
      return false;
    }

    setScreen(result.screen);
    return result.kind === "navigate";
  }, [canUseJourneyTools, canUseMap, isLockedPhaseOne]);

  const openCocoonModal = useCallback((source: "auto" | "manual" = "manual") => {
    const now = Date.now();
    const decision = evaluateCocoonOpen({
      source,
      isLandingScreen,
      now,
      suppressedUntil: cocoonSuppressedUntilRef.current,
      suppressReopen: suppressCocoonReopen,
      showBreathing,
      lastAutoOpenAt: lastAutoCocoonOpenAtRef.current,
      lastShownDate: getFromLocalStorage(AUTO_COCOON_LAST_SHOWN_DATE_KEY)
    });
    if (!decision.shouldOpen) return;
    if (decision.nextLastAutoOpenAt != null) {
      lastAutoCocoonOpenAtRef.current = decision.nextLastAutoOpenAt;
    }
    if (decision.nextLastShownDate != null) {
      setInLocalStorage(AUTO_COCOON_LAST_SHOWN_DATE_KEY, decision.nextLastShownDate);
    }
    setShowCocoon(true);
  }, [isLandingScreen, showBreathing, suppressCocoonReopen]);

  const suppressCocoonFor = useCallback((ms = 2000) => {
    cocoonSuppressedUntilRef.current = Date.now() + ms;
    setSuppressCocoonReopen(true);
    if (cocoonSuppressTimerRef.current != null) {
      clearTimeout(cocoonSuppressTimerRef.current);
    }
    const windowRef = getWindowOrNull();
    if (!windowRef) return;
    cocoonSuppressTimerRef.current = windowRef.setTimeout(() => {
      setSuppressCocoonReopen(false);
      cocoonSuppressedUntilRef.current = 0;
      cocoonSuppressTimerRef.current = null;
    }, ms);
  }, []);

  useEffect(() => {
    return () => {
      if (cocoonSuppressTimerRef.current != null) {
        clearTimeout(cocoonSuppressTimerRef.current);
      }
      cocoonSuppressedUntilRef.current = 0;
    };
  }, []);

  useEffect(() => {
    void initThemePalette();
    startAutonomousStartupJobs({ enabled: !isUserMode });
  }, []);

  useEffect(() => {
    if (!canShowAIChatbot) return;
    let cancelled = false;
    import("./agent")
      .then((mod) => {
        if (!cancelled) setAgentModule(mod);
      })
      .catch(() => {
        // keep chatbot available in fallback mode
      });
    return () => {
      cancelled = true;
    };
  }, [canShowAIChatbot]);

  useEffect(() => {
    if (screen !== "map") return;
    checkAndUnlock({
      nodes,
      baselineCompletedAt: baselineCompletedAt ?? null,
      libraryOpenedAt: getLibraryOpenedAt(),
      breathingUsedAt: getBreathingUsedAt()
    });
  }, [screen, nodes, baselineCompletedAt, checkAndUnlock]);

  useEffect(() => {
    if (screen !== "landing") {
      recordUserActivity();
    }
  }, [screen, recordUserActivity]);

  useEffect(() => {
    if (typeof window === "undefined" || isAdminRoute) return;
    let cancelled = false;

    const checkBroadcasts = async () => {
      const list = await fetchPublicBroadcasts();
      if (cancelled || !list || list.length === 0) return;

      const candidate = list.find((item) =>
        doesBroadcastMatchAudience(item.audience, {
          isLoggedIn: Boolean(authUser),
          isInstalled: isAppInstalledMode()
        })
      );
      if (!candidate) return;

      const seenId = getFromLocalStorage(LAST_SEEN_BROADCAST_KEY);
      if (seenId === candidate.id) return;

      setActiveBroadcast(candidate);
      setInLocalStorage(LAST_SEEN_BROADCAST_KEY, candidate.id);

      if (notificationSupported && notificationPermission === "granted" && notificationSettings.enabled) {
        void sendNotification({
          title: candidate.title,
          body: candidate.body,
          tag: `broadcast-${candidate.id}`
        });
      }
    };

    void checkBroadcasts();
    const timer = setInterval(() => {
      void checkBroadcasts();
    }, 60_000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [
    authUser,
    isAdminRoute,
    notificationPermission,
    notificationSettings.enabled,
    notificationSupported
  ]);

  useEffect(() => {
    const handler = () => {
      setIsAdminRoute(isAdminPath());
      setIsAnalyticsRoute(isAnalyticsPath());
    };
    return subscribePopstate(handler);
  }, []);

  /** ربط History API بالشاشات - الرجوع بالتاتش/زر الرجوع يرجع للشاشة السابقة بدل إغلاق التطبيق */
  useEffect(() => {
    if (isAdminPath()) return;
    if (hasOAuthCallbackParams()) return;
    if (fromPopStateRef.current) {
      fromPopStateRef.current = false;
      return;
    }
    const state = { screen };
    const url = getPathname() || "/";
    if (!hasHistorySyncedRef.current) {
      hasHistorySyncedRef.current = true;
      replaceUrl(url, state);
      return;
    }
    pushUrl(url, state);
  }, [screen, authStatus]);

  useEffect(() => {
    if (isAdminPath()) return;
    const handler = (e: PopStateEvent) => {
      const next = (e.state as { screen?: Screen } | null)?.screen ?? "landing";
      const result = resolveNavigation({
        target: next,
        canUseMap,
        canUseJourneyTools,
        isLockedPhaseOne
      });
      fromPopStateRef.current = true;
      if (result.kind === "blocked") {
        setLockedFeature(result.feature);
        setScreen("landing");
        return;
      }
      setScreen(result.screen);
    };
    return subscribePopstate(handler);
  }, [canUseJourneyTools, canUseMap, isLockedPhaseOne]);

  useEffect(() => {
    // Check for nudges after 2 seconds
    const timer = setTimeout(() => {
      const nudge = getNextNudge();
      if (nudge) {
        setActiveNudge(nudge);
        setShowNudgeToast(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Check for Mirror Insights (Contradictions)
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Check after 4 seconds to avoid conflict with Nudge
    const timer = setTimeout(() => {
      const insight = detectContradictions();
      if (insight) {
        setActiveMirrorInsight(insight);
        setShowMirrorOverlay(true);
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [nodes, storedGoalId]); // Re-check when nodes or goal change

  // Phase 24: Biometrics Bridge Integration
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stopStream = startBiometricStream((pulse: BiometricPulse) => {
      const result = analyzeStressLevels(pulse);
      if (result.isCrisis && !showCocoon && !showBreathing) {
        trackEvent("biometric_crisis_triggered", { hr: pulse.heartRate, reason: result.reason || "unknown" });
        openCocoonModal("auto");
      }
    });

    return () => stopStream();
  }, [openCocoonModal, showCocoon, showBreathing]);

  // Predictive Engine (Phase 13) - State Adaptation
  const [, setUserPsychState] = useState<UserState>("ORDER");

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Recalculate entropy when key metrics change
    const insight = calculateEntropy();
    setUserPsychState(insight.state);

    // Containment Mode Response: If Chaos is detected, suggest breathing
    if (insight.state === "CHAOS" && !showBreathing && !showCocoon) {
      // We can use the 'activeNudge' system to show a high-priority calming nudge
      // blocking other nudges if chaos is high.
      setActiveNudge({
        id: 'chaos-containment-' + Date.now(),
        type: 'streak_risk', // reusing type for priority
        title: 'نظام الاحتواء 🛡️',
        message: 'المؤشرات بتقول إن فيه "فوضى" عالية.. خد دقيقة تنفس.',
        cta: 'افصل شوية',
        priority: 1,
        icon: '🍃'
      });
      setShowNudgeToast(true);
    }
  }, [nodes, lastPulse, goalId, showBreathing, showCocoon]);


  const handleNudgeDismiss = () => {
    if (activeNudge) {
      dismissNudge(activeNudge.id);
    }
    setShowNudgeToast(false);
  };


  useEffect(() => {
    if (typeof window === "undefined") return;
    if (authStatus !== "ready") return;
    const userId = authUser?.id ?? null;
    if (!userId) {
      hasHydratedUiStateRef.current = false;
      return;
    }
    if (restoredLastScreenForUserRef.current === userId) return;

    restoredLastScreenForUserRef.current = userId;
    const savedUiState = getFromLocalStorage(getUserLastUiStateStorageKey(userId));
    if (savedUiState) {
      try {
        const parsed = JSON.parse(savedUiState) as Partial<PersistedUiState>;
        const restoredScreen = normalizeRestorableScreen(typeof parsed.screen === "string" ? parsed.screen : null);
        const restoredModals = normalizePersistedModals(parsed.modals);
        if (restoredScreen) setScreen(restoredScreen);
        setShowJourneyGuideChat(restoredModals.showJourneyGuideChat);
        setShowOwnerDataTools(restoredModals.showOwnerDataTools);
        setShowNotificationSettings(restoredModals.showNotificationSettings);
        setShowTrackingDashboard(restoredModals.showTrackingDashboard);
        setShowAtlasDashboard(restoredModals.showAtlasDashboard);
        setShowShareStats(restoredModals.showShareStats);
        setShowLibrary(restoredModals.showLibrary);
        setShowSymptomsOverview(restoredModals.showSymptomsOverview);
        setShowRecoveryPlan(restoredModals.showRecoveryPlan);
        setShowThemeSettings(restoredModals.showThemeSettings);
        setShowAchievements(restoredModals.showAchievements);
        setShowAdvancedTools(restoredModals.showAdvancedTools);
        setShowClassicRecovery(restoredModals.showClassicRecovery);
        setShowManualPlacement(restoredModals.showManualPlacement);
        setShowFeedback(restoredModals.showFeedback);
        hasHydratedUiStateRef.current = true;
        return;
      } catch {
        // fallback to legacy screen-only key below
      }
    }

    const legacySavedScreen = getFromLocalStorage(getUserLastScreenStorageKey(userId));
    const restored = normalizeRestorableScreen(legacySavedScreen);
    if (restored) setScreen(restored);
    hasHydratedUiStateRef.current = true;
  }, [authStatus, authUser?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const userId = authUser?.id ?? null;
    if (!userId) return;
    if (!hasHydratedUiStateRef.current) return;
    const restorable = normalizeRestorableScreen(screen);
    if (!restorable) return;

    const payload: PersistedUiState = {
      version: 1,
      screen: restorable,
      modals: {
        showJourneyGuideChat,
        showOwnerDataTools,
        showNotificationSettings,
        showTrackingDashboard,
        showAtlasDashboard,
        showShareStats,
        showLibrary,
        showSymptomsOverview,
        showRecoveryPlan,
        showThemeSettings,
        showAchievements,
        showAdvancedTools,
        showClassicRecovery,
        showManualPlacement,
        showFeedback
      }
    };

    setInLocalStorage(getUserLastUiStateStorageKey(userId), JSON.stringify(payload));
    setInLocalStorage(getUserLastScreenStorageKey(userId), restorable);
  }, [
    authUser?.id,
    screen,
    showJourneyGuideChat,
    showOwnerDataTools,
    showNotificationSettings,
    showTrackingDashboard,
    showAtlasDashboard,
    showShareStats,
    showLibrary,
    showSymptomsOverview,
    showRecoveryPlan,
    showThemeSettings,
    showAchievements,
    showAdvancedTools,
    showClassicRecovery,
    showManualPlacement,
    showFeedback
  ]);

  useEffect(() => {
    const stop = initAppContentRealtime();
    return () => stop();
  }, []);

  useEffect(() => {
    if (runtimeEnv.isDev) {
      import("./utils/seedStressTestData").then(({ seedStressTestData }) => {
        (window as Window & { __seedStressTest?: () => { nodeCount: number; eventCount: number } }).__seedStressTest =
          () => {
            const result = seedStressTestData();
            console.warn("[Stress Test] تم:", result.nodeCount, "عُقدة،", result.eventCount, "حدث. إعادة تحميل...");
            setTimeout(() => reloadPage(), 500);
            return result;
          };
      });
    }
  }, []);

  useEffect(() => {
    if (!hasSupabaseEnv) return;
    let cancelled = false;
    fetchAdminConfig()
      .then((config) => {
        if (!config || cancelled) return;
        if (config.featureFlags) setFeatureFlags(config.featureFlags);
        if (config.systemPrompt) setSystemPrompt(config.systemPrompt);
        if (config.scoringWeights) setScoringWeights(config.scoringWeights);
        if (config.scoringThresholds) setScoringThresholds(config.scoringThresholds);
        if (config.pulseCheckMode) setPulseCheckMode(config.pulseCheckMode);
      })
      .catch(() => {
        // ignore remote errors, fallback to local
      });
    return () => {
      cancelled = true;
    };
  }, [setFeatureFlags, setSystemPrompt, setScoringWeights, setScoringThresholds, setPulseCheckMode]);

  useEffect(() => {
    const pageNames: Record<Screen, string> = {
      landing: "الرئيسية",
      goal: "اختيار الهدف",
      map: "خريطة العلاقات",
      guided: "الرحلة الموجهة",
      mission: "شاشة المهمة",
      tools: "أدوات الرحلة",
      settings: "الإعدادات",
      enterprise: "بوابة المؤسسات",
      "guilt-court": "محكمة الشعور بالذنب",
      diplomacy: "البرقيات الدبلوماسية"
    };
    trackPageView(pageNames[screen]);
  }, [screen]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const seoByScreen: Record<Screen, { title: string; description: string }> = {
      landing: {
        title: "Alrehla | Relationship Clarity Platform",
        description: "Alrehla helps you understand your relationships and boundaries with clarity through Dawayir."
      },
      goal: {
        title: "Choose Your Goal | Alrehla",
        description: "Choose the relationship goal you want to work on and start your guided journey."
      },
      map: {
        title: "Relationship Map | Alrehla",
        description: "Visualize your relationship circles and set healthier boundaries with confidence."
      },
      guided: {
        title: "Guided Journey | Alrehla",
        description: "Follow a structured journey with practical steps to regain clarity and control."
      },
      mission: {
        title: "Mission Screen | Alrehla",
        description: "Complete your mission steps and track progress in real relationship scenarios."
      },
      tools: {
        title: "Journey Tools | Alrehla",
        description: "Access focused tools that help you regulate, reflect, and take practical action."
      },
      settings: {
        title: "Settings | Alrehla",
        description: "Manage your subscription, language, and B2B portal settings."
      },
      enterprise: {
        title: "Enterprise Portal | Alrehla",
        description: "B2B psychological safety and organizational analytics dashboard."
      },
      "guilt-court": {
        title: "Guilt Court | Alrehla",
        description: "Strategically dismantle irrational guilt through logical analysis."
      },
      diplomacy: {
        title: "Diplomatic Cables | Alrehla",
        description: "Smart message templates for strategic communication and boundary setting."
      }
    };

    const seo = seoByScreen[screen];
    const documentRef = getDocumentOrNull();
    if (!documentRef) return;
    documentRef.title = seo.title;

    const descriptionTag = documentRef.querySelector('meta[name="description"]');
    if (descriptionTag) {
      descriptionTag.setAttribute("content", seo.description);
    }

    const setMeta = (selector: string, value: string) => {
      const tag = documentRef.querySelector(selector);
      if (tag) {
        tag.setAttribute("content", value);
      }
    };

    setMeta('meta[property="og:title"]', seo.title);
    setMeta('meta[property="og:description"]', seo.description);
    setMeta('meta[name="twitter:title"]', seo.title);
    setMeta('meta[name="twitter:description"]', seo.description);

    const canonical = documentRef.querySelector('link[rel="canonical"]');
    if (canonical) {
      const href = `${getOrigin()}${getPathname()}`;
      canonical.setAttribute("href", href);
      setMeta('meta[property="og:url"]', href);
    }

    const robotsTag = documentRef.querySelector('meta[name="robots"]');
    if (robotsTag) {
      const path = getPathname().toLowerCase();
      const isPrivatePath = path.startsWith("/admin") || path.startsWith("/analytics");
      robotsTag.setAttribute(
        "content",
        isPrivatePath
          ? "noindex,nofollow,noarchive"
          : "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
      );
    }
  }, [screen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isOwnerWatcher) return;
    let cancelled = false;

    const sendOwnerNotification = async (title: string, body: string, tag: string) => {
      if (!notificationSupported || notificationPermission !== "granted" || !notificationSettings.enabled) return;
      await sendNotification({ title, body, tag });
    };

    const pollOwnerAlerts = async () => {
      const since = getFromLocalStorage(OWNER_ALERTS_LAST_CHECK_KEY) ?? new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const alerts = await fetchOwnerAlerts({ since, phaseTarget: 10 });
      if (!alerts || cancelled) return;

      for (const sessionId of alerts.newVisitors.sessionIds) {
        await sendOwnerNotification(
          "زائر جديد دخل المنصة",
          `Session: ${sessionId.slice(0, 14)}â€¦`,
          `owner-visitor-${sessionId}`
        );
      }

      for (const sessionId of alerts.logins.sessionIds) {
        await sendOwnerNotification(
          "زائر أكمل تسجيل الدخول",
          `Session: ${sessionId.slice(0, 14)}â€¦`,
          `owner-login-${sessionId}`
        );
      }

      for (const sessionId of alerts.installs.sessionIds) {
        await sendOwnerNotification(
          "زائر ثبّت التطبيق",
          `Session: ${sessionId.slice(0, 14)}â€¦`,
          `owner-install-${sessionId}`
        );
      }

      const prevMilestones = loadOwnerMilestonesState();
      const nextMilestones: OwnerMilestonesState = {
        registeredReached: alerts.phaseOne.registeredReached,
        installedReached: alerts.phaseOne.installedReached,
        addedReached: alerts.phaseOne.addedReached,
        fullyCompleted: alerts.phaseOne.fullyCompleted
      };

      if (!prevMilestones.registeredReached && nextMilestones.registeredReached) {
        await sendOwnerNotification(
          "تحقق الهدف: 10 تسجيلات",
          `تم الوصول إلى ${alerts.phaseOne.registeredUsers} مستخدمين مسجلين.`,
          "owner-goal-registered"
        );
      }
      if (!prevMilestones.installedReached && nextMilestones.installedReached) {
        await sendOwnerNotification(
          "تحقق الهدف: 10 تثبيتات",
          `تم الوصول إلى ${alerts.phaseOne.installedUsers} مستخدمين ثبّتوا التطبيق.`,
          "owner-goal-installed"
        );
      }
      if (!prevMilestones.addedReached && nextMilestones.addedReached) {
        await sendOwnerNotification(
          "تحقق الهدف: 10 أشخاص مضافين",
          `تم الوصول إلى ${alerts.phaseOne.addedPeople} أشخاص مضافين على الخرائط.`,
          "owner-goal-added"
        );
      }
      if (!prevMilestones.fullyCompleted && nextMilestones.fullyCompleted) {
        await sendOwnerNotification(
          "اكتمل هدف المرحلة الأولى",
          "10 تسجيلات + 10 تثبيتات + 10 أشخاص مضافين تحققوا بالكامل.",
          "owner-goal-phase-one-complete"
        );
      }

      saveOwnerMilestonesState(nextMilestones);
      setInLocalStorage(OWNER_ALERTS_LAST_CHECK_KEY, alerts.generatedAt || new Date().toISOString());
    };

    void pollOwnerAlerts();
    const timer = setInterval(() => {
      void pollOwnerAlerts();
    }, 45_000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [
    isOwnerWatcher,
    notificationPermission,
    notificationSettings.enabled,
    notificationSupported
  ]);

  useEffect(() => {
    if (authStatus !== "ready") return;
    if (!authUser) return;
    const intent = getPostAuthIntent();
    if (!intent) return;
    clearPostAuthIntent();
    recordFlowEvent("auth_login_success", { meta: { intent: intent.kind, userId: authUser.id, email: authUser.email ?? null } });
    if (intent.kind === "login") {
      setPulseCheckContext("regular");
      setShowPulseCheck(false);
      setShowAuthModal(false);
      setPostAuthIntentState(null);
      return;
    }
    if (intent.kind !== "start_recovery") return;

    setPulseCheckContext("regular");
    setShowPulseCheck(false);
    setShowAuthModal(false);
    setPostAuthIntentState(null);

    logPulse(intent.pulse);

    setWelcome({ message: buildStartRecoveryWelcome(authFirstName, authToneGender), source: "template" });
    if (isPhaseOneUserFlow) {
      const defaultGoalId = "family";
      setGoalId(defaultGoalId);
      setCategory(resolveAdviceCategory(defaultGoalId));
      setSelectedNodeId(null);
      void navigateToScreen("map");
    } else {
      void navigateToScreen("goal");
    }

    let cancelled = false;
    void (async () => {
      // تحليل الوعي الأولي عند الدخول
      const insight = await consciousnessService.analyzeConsciousness(`بدأ المستخدم ${authFirstName || ""} رحلة جديدة`);
      if (!cancelled) setConsciousnessInsight(insight);

      if (!geminiClient.isAvailable()) return;
      const prompt = buildWelcomePrompt(authFirstName, authToneGender);
      const out = await geminiClient.generate(prompt);
      if (cancelled) return;
      const cleaned = cleanWelcomeMessage(out);
      if (!cleaned) return;
      setWelcome({ message: cleaned, source: "ai" });
    })();

    return () => {
      cancelled = true;
    };
  }, [authStatus, authUser, authFirstName, authToneGender, logPulse, navigateToScreen, setPulseCheckContext, setShowPulseCheck]);

  const openDefaultGoalMap = useCallback(() => {
    const defaultGoalId = "family";
    setGoalId(defaultGoalId);
    setCategory(resolveAdviceCategory(defaultGoalId));
    setSelectedNodeId(null);
    void navigateToScreen("map");
  }, [navigateToScreen, setCategory, setGoalId, setSelectedNodeId]);

  const goToGoals = useCallback(() => {
    if (!canUseMap) {
      if (isUserMode) {
        skipNextPulseCheck();
        openDefaultGoalMap();
        return;
      }
      setLockedFeature("dawayir_map");
      return;
    }
    skipNextPulseCheck();
    if (isPhaseOneUserFlow) {
      openDefaultGoalMap();
      return;
    }
    navigateToScreen("goal");
  }, [canUseMap, navigateToScreen, openDefaultGoalMap, setLockedFeature, skipNextPulseCheck]);

  const startRecovery = () => {
    // Step 1: one-time onboarding gate.
    if (!hasCompletedJourneyOnboarding()) {
      trackEvent("onboarding_started", { source: "landing" });
      setShowOnboarding(true);
      return;
    }

    // Step 2: always open Pulse Check from landing.
    // Next transition (Goal/Map) is handled by handlePulseGateSubmit -> openDawayirSetup.
    trackEvent(AnalyticsEvents.MICRO_COMPASS_OPENED, { source: "landing", gate: "pulse" });
    setWelcome(null);
    setPostAuthIntentState(null);
    setShowAuthModal(false);
    setPulseCheckContext("start_recovery");
    setShowPulseCheck(true);
  };

  const restartJourney = () => {
    // Reset the onboarding flag so the user can pick a new goal
    resetJourneyOnboarding();
    trackEvent("journey_restarted", { source: "landing" });
    setShowOnboarding(true);
  };

  useEffect(() => {
    if (screen === "landing" && canShowAIChatbot) {
      void preloadChatbot();
    }
    if (screen === "goal") {
      void preloadCoreMap();
      void preloadGym();
    }
  }, [screen, canShowAIChatbot]);

  useEffect(() => {
    if (screen !== "map") setSelectedNodeId(null);
  }, [screen]);

  useEffect(() => {
    if (canUseMap || isUserMode) return;
    if (screen === "goal" || screen === "map" || screen === "mission" || screen === "guided") {
      void navigateToScreen("landing");
    }
  }, [canUseMap, navigateToScreen, screen]);

  useEffect(() => {
    if (canUseJourneyTools) return;
    if (screen === "tools") void navigateToScreen("landing");
  }, [canUseJourneyTools, navigateToScreen, screen]);

  useEffect(() => {
    if (!isLockedPhaseOne) return;
    if (screen === "mission" && phaseOneMissionBypassRef.current) {
      phaseOneMissionBypassRef.current = false;
      return;
    }
    if (screen === "guided" || screen === "mission" || screen === "tools") {
      void navigateToScreen("map");
    }
  }, [isLockedPhaseOne, navigateToScreen, screen]);

  useEffect(() => {
    if (!isLockedPhaseOne) return;
    if (goalId !== "family") setGoalId("family");
  }, [goalId, isLockedPhaseOne]);

  const openMissionScreen = useCallback((nodeId: string) => {
    if (isLockedPhaseOne) return;
    setMissionNodeId(nodeId);
    void navigateToScreen("mission");
  }, [isLockedPhaseOne, navigateToScreen]);
  const openMissionFromAddPerson = useCallback((nodeId: string) => {
    const safeId = String(nodeId ?? "").trim();
    if (!safeId) {
      recordFlowEvent("add_person_start_path_blocked_missing_node", {
        meta: { reason: "empty_node_id" }
      });
      return;
    }
    const nodeExists = useMapState.getState().nodes.some((node) => node.id === safeId);
    if (!nodeExists) {
      recordFlowEvent("add_person_start_path_blocked_missing_node", {
        meta: { reason: "node_not_found", nodeId: safeId }
      });
      return;
    }
    setMissionNodeId(safeId);
    setSelectedNodeId(safeId);
    phaseOneMissionBypassRef.current = true;
    setScreen("mission");
  }, []);
  const openJourneyTools = useCallback(() => {
    if (isLockedPhaseOne) {
      setLockedFeature("journey_tools");
      return;
    }
    if (!canUseJourneyTools) {
      setLockedFeature("journey_tools");
      return;
    }
    recordFlowEvent("tools_opened");
    setToolsBackScreen(screen === "tools" ? "landing" : screen);
    void navigateToScreen("tools");
  }, [
    canUseJourneyTools,
    isLockedPhaseOne,
    navigateToScreen,
    screen,
    setLockedFeature,
    setToolsBackScreen
  ]);
  const openDawayirTool = useCallback(() => {
    if (!canUseMap) {
      setLockedFeature("dawayir_map");
      return;
    }
    const lastGoalMeta = getLastGoalMeta(lastGoalById, storedGoalId, storedCategory);
    if (lastGoalMeta) {
      setGoalId(lastGoalMeta.goalId);
      setCategory(lastGoalMeta.category as AdviceCategory);
      void navigateToScreen("map");
      setSelectedNodeId(null);
      return;
    }
    if (isPhaseOneUserFlow) {
      openDefaultGoalMap();
      return;
    }
    void navigateToScreen("goal");
  }, [
    canUseMap,
    lastGoalById,
    openDefaultGoalMap,
    navigateToScreen,
    setCategory,
    setGoalId,
    setLockedFeature,
    setSelectedNodeId,
    storedCategory,
    storedGoalId
  ]);
  const openDawayirSetup = () => {
    if (!canUseMap) {
      setLockedFeature("dawayir_map");
      return;
    }
    skipNextPulseCheck();
    if (isPhaseOneUserFlow) {
      openDefaultGoalMap();
      return;
    }
    void navigateToScreen("goal");
  };

  const handleRefreshNextStep = useCallback(() => {
    setActiveIntervention(null);
    if (nextStepDecision) {
      void reportDecisionOutcome({
        decisionId: nextStepDecision.decisionId,
        acted: false
      });
      nextStepTelemetry.clearSession(nextStepDecision.decisionId);
    }
    recordFlowEvent("next_step_dismissed", {
      meta: { reason: "manual_refresh", surface: screen }
    });
    setNextStepRefreshTick((tick) => tick + 1);
  }, [screen, nextStepDecision, nextStepTelemetry]);

  const handleTakeNextStep = useCallback((decision: NextStepDecisionV1) => {
    setActiveIntervention(null);
    const nodeIdFromPayload =
      typeof decision.action.actionPayload?.nodeId === "string"
        ? decision.action.actionPayload.nodeId
        : null;
    const telemetry = nextStepTelemetry.capture(decision.decisionId);
    const timeToActionSec =
      telemetry?.activeElapsedSec ?? Math.max(0, Math.round((Date.now() - decision.createdAt) / 1000));

    recordFlowEvent("next_step_action_taken", {
      timeToAction: timeToActionSec,
      meta: {
        decisionId: decision.decisionId,
        actionType: decision.action.actionType,
        source: decision.source,
        phase: decision.phase,
        riskBand: decision.riskBand
      }
    });

    void reportDecisionOutcome({
      decisionId: decision.decisionId,
      acted: true,
      completed: undefined,
      completionLatencySec: timeToActionSec,
      timeToActionSec,
      hesitationSec: telemetry?.hesitationSec,
      idleTimeSec: telemetry?.idleElapsedSec,
      rawElapsedSec: telemetry?.rawElapsedSec,
      interactionCount: telemetry?.interactionCount
    });
    const recentPoint: RecentTelemetrySignalV1 = {
      hesitationSec: telemetry?.hesitationSec ?? 0,
      activeElapsedSec: timeToActionSec,
      idleElapsedSec: telemetry?.idleElapsedSec ?? 0,
      interactionCount: telemetry?.interactionCount ?? 0,
      recordedAt: Date.now()
    };
    recentRoutingTelemetryRef.current = [...recentRoutingTelemetryRef.current, recentPoint].slice(-3);
    nextStepTelemetry.clearSession(decision.decisionId);

    switch (decision.action.actionType) {
      case "open_breathing":
        setShowBreathing(true);
        break;
      case "open_map":
        void navigateToScreen("map");
        break;
      case "open_tools":
        openJourneyTools();
        break;
      case "open_mission":
        if (nodeIdFromPayload) openMissionScreen(nodeIdFromPayload);
        else if (selectedNodeId) openMissionScreen(selectedNodeId);
        else void navigateToScreen("map");
        break;
      case "review_red_node":
      case "log_situation":
      case "set_soft_boundary":
        void navigateToScreen("map");
        if (nodeIdFromPayload) setSelectedNodeId(nodeIdFromPayload);
        break;
      case "journal_reflection":
        setShowFeedback(true);
        break;
      default:
        void navigateToScreen("map");
        break;
    }

    setTimeout(() => setNextStepRefreshTick((tick) => tick + 1), 1200);
  }, [navigateToScreen, nextStepTelemetry, openJourneyTools, openMissionScreen, selectedNodeId]);

  const handleActiveIntervention = useCallback((snapshot: IdleAwareTelemetrySnapshot, decision: NextStepDecisionV1) => {
    const cognitiveLoadRequired = inferCognitiveLoadFromDecision(decision);
    setActiveIntervention({
      decisionId: snapshot.decisionId,
      hesitationSec: snapshot.hesitationSec,
      cognitiveLoadRequired
    });
    recordFlowEvent("routing_intervention_triggered", {
      meta: {
        decisionId: snapshot.decisionId,
        hesitationSec: snapshot.hesitationSec,
        cognitiveLoadRequired,
        activeElapsedSec: snapshot.activeElapsedSec
      }
    });
    void fetch("/api/routing/intervention-trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        decisionId: snapshot.decisionId,
        sessionId: getTrackingSessionId(),
        hesitationSec: snapshot.hesitationSec,
        cognitiveLoadRequired,
        actionType: decision.action.actionType,
        surface: screen
      })
    }).catch(() => undefined);
  }, [screen]);

  useEffect(() => {
    const unsubscribe = subscribeToDawayirSignals(() => {
      setNextStepRefreshTick((tick) => tick + 1);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (screen !== "map" && screen !== "tools") {
      nextStepTelemetry.clearSession();
      setNextStepDecision(null);
      return;
    }

    const seq = ++nextStepRequestSeqRef.current;
    const forceRefresh = nextStepRefreshTick !== nextStepLastRefreshRef.current;
    nextStepLastRefreshRef.current = nextStepRefreshTick;
    const surface = screen === "map" ? "map" : "tools";

    void computeNextStepDecision({
      goalId,
      category,
      availableFeatures,
      surface,
      forceRefresh,
      recentTelemetry: recentRoutingTelemetryRef.current
    }).then((decision) => {
      if (seq !== nextStepRequestSeqRef.current) return;
      if (decision) {
        nextStepTelemetry.startSession(decision.decisionId, decision.createdAt, {
          cognitiveLoadRequired: inferCognitiveLoadFromDecision(decision),
          hesitationThresholdSec: 120,
          onIntervention: (snapshot) => handleActiveIntervention(snapshot, decision)
        });
      }
      setNextStepDecision(decision);
    });
  }, [screen, goalId, category, nodes, lastPulse, availableFeatures, nextStepRefreshTick, nextStepTelemetry, handleActiveIntervention]);

  const goBackToFeatureFlags = useCallback(() => {
    const next = createCurrentUrl();
    if (!next) return;
    next.pathname = "/admin";
    next.search = "";
    next.searchParams.set("tab", "feature-flags");
    pushUrl(next);
    setIsFeaturePreviewSession(false);
    setPreviewedFeature(null);
  }, []);

  useEffect(() => {
    if (isAdminRoute) return;
    const currentUrl = createCurrentUrl();
    if (!currentUrl) return;
    const previewFeature = normalizePreviewFeature(currentUrl.searchParams.get("previewFeature"));
    if (!previewFeature) return;
    setIsFeaturePreviewSession(true);
    setPreviewedFeature(previewFeature);

    const clearPreviewParam = () => {
      const next = createCurrentUrl();
      if (!next) return;
      next.searchParams.delete("previewFeature");
      replaceUrl(next);
    };

    if (previewFeature === "journey_tools") {
      skipNextPulseCheck();
      openJourneyTools();
      clearPreviewParam();
      return;
    }

    if (previewFeature === "pulse_check") {
      void navigateToScreen("landing");
      setPulseCheckContext("regular");
      setShowPulseCheck(true);
      clearPreviewParam();
      return;
    }

    if (previewFeature === "language_switcher") {
      void navigateToScreen("landing");
      clearPreviewParam();
      return;
    }

    if (previewFeature === "armory_section") {
      void navigateToScreen("landing");
      clearPreviewParam();
      return;
    }

    if (previewFeature === "ai_field") {
      skipNextPulseCheck();
      void navigateToScreen("landing");
      clearPreviewParam();
      return;
    }

    if (previewFeature === "global_atlas") {
      if (isOwnerWatcher) {
        const next = createCurrentUrl();
        if (!next) return;
        next.pathname = "/analytics";
        next.search = "";
        pushUrl(next);
      }
      clearPreviewParam();
      return;
    }

    skipNextPulseCheck();
    void navigateToScreen("map");
    clearPreviewParam();
  }, [isAdminRoute, isOwnerWatcher, navigateToScreen, openJourneyTools, setPulseCheckContext, setShowPulseCheck, skipNextPulseCheck]);

  useEffect(() => {
    if (isAdminRoute) return;
    const currentUrl = createCurrentUrl();
    if (!currentUrl) return;
    const ownerAction = normalizeOwnerAction(currentUrl.searchParams.get("ownerAction"));
    if (!ownerAction) return;

    const clearOwnerActionParam = () => {
      const next = createCurrentUrl();
      if (!next) return;
      next.searchParams.delete("ownerAction");
      replaceUrl(next);
    };

    skipNextPulseCheck();
    executeOwnerAction(ownerAction, {
      flags: {
        canShowAIChatbot,
        notificationSupported,
        hasGlobalAtlas: availableFeatures.global_atlas,
        hasInternalBoundaries: availableFeatures.internal_boundaries
      },
      callbacks: {
        openAdminDashboard: () => {
          const next = createCurrentUrl();
          if (!next) return;
          next.pathname = "/admin";
          next.search = "";
          next.searchParams.set("tab", "overview");
          pushUrl(next);
        },
        openConsciousnessArchive: () => setShowConsciousnessArchive(true),
        openJourneyGuideChat: () => setShowJourneyGuideChat(true),
        openJourneyTools,
        openJourneyTimeline: () => {
          void navigateToScreen("map");
          setShowJourneyTimeline(true);
        },
        openDawayirTool,
        openQuickExperience: () => setShowGym(true),
        startJourney: goToGoals,
        openGuidedJourney: () => {
          void navigateToScreen("guided");
        },
        openBaselineCheck: () => setShowBaseline(true),
        openNotifications: () => setShowNotificationSettings(true),
        openTrackingDashboard: () => setShowTrackingDashboard(true),
        openAtlasDashboard: () => setShowAtlasDashboard(true),
        openDataTools: () => setShowOwnerDataTools(true),
        openShareStats: () => setShowShareStats(true),
        openLibrary: () => setShowLibrary(true),
        openSymptoms: () => setShowSymptomsOverview(true),
        openRecoveryPlan: () => setShowRecoveryPlan(true),
        openThemeSettings: () => setShowThemeSettings(true),
        openAchievements: () => setShowAchievements(true),
        openAdvancedTools: () => setShowAdvancedTools(true),
        openClassicRecovery: () => setShowClassicRecovery(true),
        openManualPlacement: () => setShowManualPlacement(true),
        openFeedbackModal: () => {
          recordFlowEvent("feedback_opened");
          setShowFeedback(true);
        },
        requestInstallApp: () => {
          void navigateToScreen("landing");
          setOwnerInstallRequestNonce((prev) => prev + 1);
        },
        openNoiseSilencing: () => setShowNoiseSilencingPulse(true),
        openBreathingSession: () => setShowBreathing(true),
        openAmbientReality: () => setShowAmbientReality(true),
        openWisdomVault: () => setShowTimeCapsuleVault(true),
        lockFeature: setLockedFeature
      }
    });

    clearOwnerActionParam();
  }, [
    availableFeatures.global_atlas,
    availableFeatures.internal_boundaries,
    canShowAIChatbot,
    goToGoals,
    isAdminRoute,
    navigateToScreen,
    notificationSupported,
    openDawayirTool,
    openJourneyTools,
    skipNextPulseCheck
  ]);

  const pulseOpenedAtRef = useRef<number | null>(null);
  useEffect(() => {
    if (showPulseCheck) {
      pulseOpenedAtRef.current = Date.now();
      recordFlowEvent("pulse_opened");
    }
  }, [showPulseCheck]);
  const closePulseCheck = useCallback((completed = false, closeReason?: "backdrop" | "close_button" | "programmatic" | "browser_close") => {
    if (!completed && pulseOpenedAtRef.current != null) {
      recordFlowEvent("pulse_abandoned", { closeReason });
    }
    pulseOpenedAtRef.current = null;
    setShowPulseCheck(false);
    setPulseCheckContext("regular");
  }, [setPulseCheckContext, setShowPulseCheck]);

  useEffect(() => {
    return () => {
      if (pulseDeltaTimerRef.current != null) {
        clearTimeout(pulseDeltaTimerRef.current);
      }
    };
  }, []);

  const showPulseDeltaFeedback = useCallback((currentEnergy: number) => {
    const yesterdayEnergy = getYesterdayPulseEnergy(pulseLogs);
    const nextToast = buildPulseDeltaToast(currentEnergy, yesterdayEnergy);
    setPulseDeltaToast(nextToast);
    if (pulseDeltaTimerRef.current != null) {
      clearTimeout(pulseDeltaTimerRef.current);
    }
    const windowRef = getWindowOrNull();
    if (!windowRef) return;
    pulseDeltaTimerRef.current = windowRef.setTimeout(() => {
      setPulseDeltaToast(null);
      pulseDeltaTimerRef.current = null;
    }, 4600);
  }, [pulseLogs]);

  const isDefaultPulseSubmit = (payload: PulseSubmitPayload) => {
    const notes = payload.notes?.trim() ?? "";
    return payload.energy == null && payload.mood == null && payload.focus == null && notes.length === 0;
  };

  const buildAutoPulsePayload = (): PulseSubmitPayload => ({
    energy: null,
    mood: null,
    focus: null,
    auto: true
  });

  const hasConcretePulseSelection = (payload: PulseSubmitPayload): payload is {
    energy: number;
    mood: PulseMood;
    focus: PulseFocus;
    auto?: boolean;
    notes?: string;
    energyReasons?: string[];
    energyConfidence?: PulseEnergyConfidence;
  } => payload.energy != null && payload.mood != null && payload.focus != null;

  useEffect(() => {
    const onPageHide = () => {
      if (!showPulseCheck) return;
      closePulseCheck(false, "browser_close");
    };
    const windowRef = getWindowOrNull();
    if (!windowRef) return;
    windowRef.addEventListener("pagehide", onPageHide);
    return () => windowRef.removeEventListener("pagehide", onPageHide);
  }, [closePulseCheck, showPulseCheck]);

  const handlePulseGateSubmit = (payload: PulseSubmitPayload) => {
    recordFlowEvent("pulse_completed");
    if (isDefaultPulseSubmit(payload)) recordFlowEvent("pulse_completed_without_choices");
    else recordFlowEvent("pulse_completed_with_choices");
    trackEvent(AnalyticsEvents.MICRO_COMPASS_COMPLETED, {
      gate: "pulse",
      pulse_energy: payload.energy ?? "none",
      pulse_mood: payload.mood ?? "none",
      pulse_focus: payload.focus ?? "none",
      pulse_auto: payload.auto ?? false
    });
    closePulseCheck(true, "programmatic");

    if (shouldPromptAuthAfterPulse) {
      const intent: PostAuthIntent = hasConcretePulseSelection(payload)
        ? {
          kind: "start_recovery",
          pulse: payload,
          createdAt: Date.now()
        }
        : {
          kind: "login",
          createdAt: Date.now()
        };
      setPostAuthIntentState(intent);
      setShowAuthModal(true);
      return;
    }

    if (hasConcretePulseSelection(payload)) {
      logPulse(payload);
    }

    const isLow = payload.energy != null && payload.energy <= 3;
    const isAngry = payload.mood === "angry";

    if (isLow) {
      if (themeBeforePulse == null) {
        setThemeBeforePulse(theme);
      }
      setTheme("dark");
      snoozeNotifications(240);
    }

    openDawayirSetup();

    if (isAngry) {
      setShowNoiseSilencingPulse(true);
      if (isLow) setPendingCocoonAfterNoise(true);
      return;
    }

    if (isLow) {
      openCocoonModal("auto");
    }
  };

  const handlePulseSubmit = useCallback((payload: PulseSubmitPayload) => {
    recordFlowEvent("pulse_completed");
    if (isDefaultPulseSubmit(payload)) recordFlowEvent("pulse_completed_without_choices");
    else recordFlowEvent("pulse_completed_with_choices");
    if (hasConcretePulseSelection(payload)) {
      logPulse(payload);
      showPulseDeltaFeedback(payload.energy);
    }
    closePulseCheck(true, "programmatic");

    // توصيل البوصلة بمرآة الوعي (غير معطّل للتجربة)
    const numericPart = `طاقة ${payload.energy}/10، مزاج ${payload.mood}، تركيز ${payload.focus}`;
    const feelingText = payload.notes ? `${payload.notes.trim()}\n\n(${numericPart})` : numericPart;
    if (hasConcretePulseSelection(payload)) {
      const userId = authUser?.id ?? null;
      void (async () => {
        try {
          await consciousnessService.saveMoment(userId, feelingText);
          const matches = await consciousnessService.recallSimilarMoments(feelingText, {
            threshold: 0.7,
            limit: 3,
            sources: ["pulse"]
          });
          if (matches && matches.length > 0) {
            setLastPulseInsights(matches.slice(0, 3));
          }
        } catch (err) {
          console.error("Pulse consciousness wiring error:", err);
        }
      })();
    }

    const isLow = payload.energy != null && payload.energy <= 3;
    const isAngry = payload.mood === "angry";

    if (isLow) {
      if (themeBeforePulse == null) {
        setThemeBeforePulse(theme);
      }
      setTheme("dark");
      snoozeNotifications(240);
    } else if (themeBeforePulse != null) {
      setTheme(themeBeforePulse);
      setThemeBeforePulse(null);
    }

    if (isAngry) {
      setShowNoiseSilencingPulse(true);
      if (isLow) setPendingCocoonAfterNoise(true);
      return;
    }

    if (isLow) {
      openCocoonModal("auto");
    }
  }, [authUser, closePulseCheck, logPulse, openCocoonModal, setTheme, setThemeBeforePulse, showPulseDeltaFeedback, snoozeNotifications, theme, themeBeforePulse]);

  const agentContext = useMemo<AgentContext>(
    () => ({
      nodesSummary: nodes.map((n) => ({ id: n.id, label: n.label, ring: n.ring })),
      availableFeatures,
      screen: screen as Exclude<Screen, "settings">,
      selectedNodeId,
      goalId,
      category,
      pulse: lastPulse,
      activePersona
    }),
    [nodes, availableFeatures, screen, selectedNodeId, goalId, category, lastPulse, activePersona]
  );

  // Phase 27: Automatic Persona Switching
  useEffect(() => {
    if (manualOverride) return;
    const autoPersona = determineAutoPersona(agentContext);
    if (activePersona !== autoPersona) {
      setActivePersona(autoPersona);
    }
  }, [agentContext, manualOverride, activePersona, setActivePersona]);

  const agentSystemPrompt = useMemo<string | undefined>(() => {
    if (!agentModule) return undefined;
    const basePrompt = agentModule.buildAgentSystemPrompt(agentContext);
    const adminTrimmed = adminPrompt?.trim();
    return adminTrimmed ? `${adminTrimmed}\n\n${basePrompt}` : basePrompt;
  }, [agentModule, agentContext, adminPrompt]);

  const agentActions = useMemo<AgentActions | undefined>(
    () => {
      if (!agentModule) return undefined;
      return agentModule.createAgentActions({
        resolvePerson: (labelOrId) => agentModule.resolvePersonFromNodes(labelOrId, nodes),
        onNavigateBreathing: () => setShowBreathing(true),
        onNavigateGym: () => setShowGym(true),
        onNavigateMap: () => { void navigateToScreen("map"); },
        onNavigateBaseline: () => setShowBaseline(true),
        onNavigateEmergency: () => useEmergencyState.getState().open(),
        availableFeatures,
        onNavigatePerson: (nodeId) => {
          void navigateToScreen("map");
          setSelectedNodeId(nodeId);
        }
      });
    },
    [agentModule, nodes, availableFeatures, navigateToScreen]
  );

  const pulseInsight = useMemo(
    () => getWeeklyPulseInsight(pulseLogs, weekdayLabels),
    [pulseLogs, weekdayLabels]
  );

  const pulseMode = useMemo(() => {
    if (!lastPulse) return "normal";
    const ageMs = Date.now() - (lastPulse.timestamp ?? 0);
    if (ageMs > 24 * 60 * 60 * 1000) return "normal"; // آخر نبض خلال 24 ساعة فقط
    if (lastPulse.mood === "angry") return "angry";
    if (lastPulse.energy <= 3) return "low";
    if (lastPulse.energy >= 8) return "high";
    return "normal";
  }, [lastPulse]);
  const isLowPulseCocoonSuppressed = Date.now() < suppressLowPulseCocoonUntil;

  const challengeTarget = useMemo(() => {
    const candidates = nodes
      .map((node) => {
        const incomplete = getIncompleteMissionSteps(node);
        if (!incomplete) return null;
        if (!incomplete.steps.length) return null;
        return { node, incomplete };
      })
      .filter((item): item is { node: (typeof nodes)[number]; incomplete: NonNullable<ReturnType<typeof getIncompleteMissionSteps>> } => Boolean(item));
    if (!candidates.length) return null;
    candidates.sort((a, b) => {
      const remainingDiff = b.incomplete.steps.length - a.incomplete.steps.length;
      if (remainingDiff !== 0) return remainingDiff;
      return (b.incomplete.startedAt ?? 0) - (a.incomplete.startedAt ?? 0);
    });
    const target = candidates[0];
    const nextStep = target.incomplete.steps[0];
    return {
      nodeId: target.node.id,
      label: target.node.label,
      step: nextStep.step,
      stepIndex: nextStep.index,
      total: target.incomplete.total,
      missionLabel: target.incomplete.missionLabel
    };
  }, [nodes]);

  const challengeLabel = challengeTarget
    ? `مع ${challengeTarget.label} — ${challengeTarget.missionLabel} (خطوة ${challengeTarget.stepIndex + 1}/${challengeTarget.total})`
    : null;

  const canSkipCocoonBreathing = useMemo(
    () => nodes.length === 0 && !storedGoalId && goalId === "unknown",
    [goalId, nodes.length, storedGoalId]
  );

  const hasActiveMission = useMemo(
    () => nodes.some((n) => n.missionProgress?.startedAt && !n.missionProgress?.isCompleted),
    [nodes]
  );

  useEffect(() => {
    if (!notificationSupported || notificationPermission !== "granted") return;
    if (!notificationSettings.enabled || !notificationSettings.missionReminder) return;

    const [hourStr, minuteStr] = notificationSettings.dailyReminderTime.split(":");
    const targetHour = Number(hourStr);
    const targetMinute = Number(minuteStr);
    const storageKey = "dawayir-mission-reminder-last";
    const pickMissionReminderTarget = (todayKey: string) => {
      const active = nodes
        .filter((n) => n.missionProgress?.startedAt && !n.missionProgress?.isCompleted)
        .sort((a, b) => (b.missionProgress?.startedAt ?? 0) - (a.missionProgress?.startedAt ?? 0));
      const strategy = notificationSettings.missionReminderStrategy ?? "next";
      for (const node of active) {
        const incomplete = getIncompleteMissionSteps(node);
        if (!incomplete || incomplete.allSteps.length === 0) continue;

        const pickStep = () => {
          if (strategy === "last") return incomplete.steps[incomplete.steps.length - 1];
          if (strategy === "cycle") {
            const totalSteps = incomplete.allSteps;
            if (totalSteps.length === 0) return null;
            const cycleKey = `dawayir-mission-cycle-${node.id}`;
            let lastIndex = -1;
            let lastDate: string | null = null;
            if (typeof window !== "undefined") {
              try {
                const stored = getFromLocalStorage(cycleKey);
                if (stored) {
                  const parsed = JSON.parse(stored) as { lastIndex?: number; lastDate?: string };
                  if (typeof parsed.lastIndex === "number") lastIndex = parsed.lastIndex;
                  if (typeof parsed.lastDate === "string") lastDate = parsed.lastDate;
                }
              } catch {
                // ignore storage errors
              }
            }
            const startIndex =
              lastDate === todayKey
                ? (lastIndex + totalSteps.length) % totalSteps.length
                : (lastIndex + 1 + totalSteps.length) % totalSteps.length;
            for (let offset = 0; offset < totalSteps.length; offset += 1) {
              const idx = (startIndex + offset) % totalSteps.length;
              const candidate = totalSteps[idx];
              if (!candidate.completed) {
                return {
                  step: candidate.step,
                  index: candidate.index,
                  cycleKey
                };
              }
            }
            return null;
          }
          if (strategy === "random") {
            if (incomplete.steps.length <= 1) return incomplete.steps[0];
            const pool = incomplete.steps.slice(1);
            return pool[Math.floor(Math.random() * pool.length)];
          }
          return incomplete.steps[0];
        };

        const selected = pickStep();
        if (!selected) continue;
        return {
          node,
          next: {
            step: selected.step,
            stepIndex: selected.index,
            total: incomplete.total,
            missionLabel: incomplete.missionLabel,
            missionGoal: incomplete.missionGoal
          },
          cycleStorage:
            "cycleKey" in selected
              ? { key: selected.cycleKey, index: selected.index }
              : null
        };
      }
      return null;
    };

    const checkAndSend = () => {
      if (snoozedUntil && Date.now() < snoozedUntil) return;
      if (!hasActiveMission) return;
      const now = new Date();
      if (now.getHours() !== targetHour || now.getMinutes() !== targetMinute) return;
      const todayKey = now.toISOString().slice(0, 10);
      if (typeof window !== "undefined") {
        const lastSent = getFromLocalStorage(storageKey);
        if (lastSent === todayKey) return;
        const reminderTarget = pickMissionReminderTarget(todayKey);
        const send = reminderTarget
          ? sendNotification({
            title: "مهمتك مستنياك 🎯",
            body: `مع ${reminderTarget.node.label} — خطوة ${reminderTarget.next.stepIndex + 1}/${reminderTarget.next.total}: ${reminderTarget.next.step}`,
            tag: "mission-reminder"
          })
          : sendPresetNotification(NOTIFICATION_TYPES.MISSION_REMINDER);
        void send.then(() => {
          setInLocalStorage(storageKey, todayKey);
          if (reminderTarget?.cycleStorage) {
            setInLocalStorage(
              reminderTarget.cycleStorage.key,
              JSON.stringify({ lastDate: todayKey, lastIndex: reminderTarget.cycleStorage.index })
            );
          }
        });
      }
    };

    checkAndSend();
    const id = setInterval(checkAndSend, 60 * 1000);
    return () => clearInterval(id);
  }, [
    notificationSupported,
    notificationPermission,
    notificationSettings.enabled,
    notificationSettings.missionReminder,
    notificationSettings.dailyReminderTime,
    notificationSettings.missionReminderStrategy,
    hasActiveMission,
    nodes,
    snoozedUntil
  ]);

  const pathname = getPathname();

  if (pathname === "/privacy" || pathname === "/terms") {
    return (
      <LegalPage type={pathname === "/privacy" ? "privacy" : "terms"} />
    );
  }

  if (isAnalyticsRoute && isOwnerWatcher) {
    return (
      <div
        className="min-h-screen min-h-[100dvh] w-full overflow-auto isolate relative"
        style={{ background: "var(--space-void)" }}
        dir="rtl"
      >
        {isFeaturePreviewSession && (
          <button
            type="button"
            onClick={goBackToFeatureFlags}
            className="fixed z-50 top-4 left-4 rounded-full border border-indigo-300 bg-white/95 px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
            title={previewedFeature ? `الرجوع من معاينة: ${previewedFeature}` : "الرجوع إلى Feature Flags"}
          >
            الرجوع إلى Feature Flags
          </button>
        )}
        <div className="nebula-bg absolute inset-0 -z-10" aria-hidden="true" />
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "var(--space-void)" }} />}>
          <div className="p-4 sm:p-6 max-w-6xl mx-auto">
            <AdminOverviewPanel />
          </div>
        </Suspense>
      </div>
    );
  }

  if (isAdminRoute) {
    return (
      <Suspense fallback={<div className="min-h-screen" style={{ background: "var(--space-void)" }} />}>
        <AdminDashboard
          onExit={() => {
            pushUrl("/");
            setIsAdminRoute(false);
          }}
        />
      </Suspense>
    );
  }

  return (
    <PWAInstallProvider>
      <div className={`min-h-screen flex flex-col transition-colors relative isolate ${screen !== "landing" ? "overflow-hidden" : ""}`} dir="rtl"
        style={{ background: "var(--space-void)" }}
      >
        {/* Phase 19: Startup Sequence — shows once per session */}
        {showStartup && (
          <StartupSequence
            onComplete={() => {
              sessionStorage.setItem("dawayir-startup-seen", "1");
              setShowStartup(false);
            }}
          />
        )}
        {isFeaturePreviewSession && (
          <button
            type="button"
            onClick={goBackToFeatureFlags}
            className="fixed z-50 top-4 left-4 rounded-full border border-indigo-300 bg-white/95 px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
            title={previewedFeature ? `الرجوع من معاينة: ${previewedFeature}` : "الرجوع إلى Feature Flags"}
          >
            الرجوع إلى Feature Flags
          </button>
        )}
        {/* Nebula Background - Deep Cosmic Blue Canvas */}
        <div className="nebula-bg" aria-hidden="true" />
        <AnimatePresence>
          {activeBroadcast && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="fixed top-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 max-w-lg"
              role="status"
              aria-live="polite"
            >
              <div className="glass-card px-4 py-3 border border-amber-300/40 bg-amber-50/10 backdrop-blur-xl">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-right">
                    <p className="text-xs font-semibold mb-1" style={{ color: "var(--soft-gold, #fbbf24)" }}>
                      رسالة من إدارة الرحلة
                    </p>
                    <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{activeBroadcast.title}</p>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {activeBroadcast.body}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveBroadcast(null)}
                    className="rounded-full px-2.5 py-1 text-xs font-semibold border border-white/15 hover:bg-white/5 transition-colors"
                    style={{ color: "var(--text-primary)" }}
                    aria-label="إخفاء الرسالة"
                  >
                    إخفاء
                  </button>
                </div>
              </div>
            </motion.div>
          )}
          {postBreathingMessage && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.35 }}
              className="fixed bottom-6 left-6 right-6 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-40 max-w-md mx-auto"
              role="status"
              aria-live="polite"
            >
              <div
                className="bento-block text-center py-4 px-6"
                style={{
                  borderColor: "rgba(20, 184, 166, 0.3)",
                  background: "rgba(20, 184, 166, 0.08)"
                }}
              >
                <p className="text-base font-medium" style={{ color: "var(--text-primary)" }}>
                  تم الشحن.. رجعت للخريطة
                </p>
                <p className="text-sm mt-1 opacity-90" style={{ color: "var(--text-secondary)" }}>
                  كمّل خطوة بسيطة وبس
                </p>
              </div>
            </motion.div>
          )}
          {activeIntervention && (
            <ActiveInterventionPrompt
              hesitationSec={activeIntervention.hesitationSec}
              cognitiveLoadRequired={activeIntervention.cognitiveLoadRequired}
              onBreathing={() => {
                setActiveIntervention(null);
                setShowBreathing(true);
              }}
              onContinue={() => setActiveIntervention(null)}
            />
          )}
          {postNoiseSessionMessage && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.35 }}
              className="fixed bottom-6 left-6 right-6 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-40 max-w-md mx-auto"
              role="status"
              aria-live="polite"
            >
              <div
                className="bento-block text-center py-4 px-6"
                style={{
                  borderColor: "rgba(34, 197, 94, 0.25)",
                  background: "rgba(34, 197, 94, 0.06)"
                }}
              >
                <p className="text-base font-medium" style={{ color: "var(--text-primary)" }}>
                  حمد لله على السلامة 🌿
                </p>
                <p className="text-sm mt-1 opacity-90" style={{ color: "var(--text-secondary)" }}>
                  يومك بقى أخف دلوقتي
                </p>
              </div>
            </motion.div>
          )}
          {pulseDeltaToast && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3 }}
              className="fixed left-6 right-6 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-40 max-w-md mx-auto"
              style={{ bottom: postNoiseSessionMessage ? "7.1rem" : (lastPulseInsights.length > 0 ? "8.8rem" : "1.5rem") }}
              role="status"
              aria-live="polite"
            >
              <div
                className="bento-block text-center py-3.5 px-5"
                style={{
                  borderColor:
                    pulseDeltaToast.tone === "up"
                      ? "rgba(45, 212, 191, 0.35)"
                      : pulseDeltaToast.tone === "down"
                        ? "rgba(248, 113, 113, 0.32)"
                        : "rgba(148, 163, 184, 0.3)",
                  background:
                    pulseDeltaToast.tone === "up"
                      ? "rgba(45, 212, 191, 0.1)"
                      : pulseDeltaToast.tone === "down"
                        ? "rgba(248, 113, 113, 0.09)"
                        : "rgba(148, 163, 184, 0.08)"
                }}
              >
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {pulseDeltaToast.title}
                </p>
                <p className="text-xs mt-1 opacity-90" style={{ color: "var(--text-secondary)" }}>
                  {pulseDeltaToast.body}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {lastPulseInsights.length > 0 && (
          <div className="fixed bottom-6 left-6 right-6 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-40 max-w-lg mx-auto">
            <div className="bento-block" style={{ borderColor: "rgba(245, 166, 35, 0.25)", padding: "1.5rem" }}>
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{
                    background: "rgba(245, 166, 35, 0.12)",
                    border: "1px solid rgba(245, 166, 35, 0.25)",
                    color: "var(--warm-amber)"
                  }}
                >
                  âœ¨
                </div>
                <div className="text-right flex-1 min-w-0">
                  <h3 className="text-sm font-bold mb-3" style={{ color: "var(--warm-amber)" }}>ومضة من الذاكرة</h3>
                  <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {lastPulseInsights.map((insight) => (
                      <div
                        key={insight.id}
                        className="min-w-[220px] max-w-[280px] rounded-xl px-4 py-3"
                        style={{
                          background: "rgba(245, 166, 35, 0.08)",
                          border: "1px solid rgba(245, 166, 35, 0.15)"
                        }}
                      >
                        <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                          شعورك دلوقتي بيشبه موقف{" "}
                          {insight.created_at && (
                            <span className="font-bold" style={{ color: "var(--text-primary)" }}>
                              حصل يوم{" "}
                              {new Date(insight.created_at).toLocaleDateString("ar-EG")}
                            </span>
                          )}
                          {": "}
                          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                            {insight.content.slice(0, 90)}
                            {insight.content.length > 90 ? "..." : ""}
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLastPulseInsights([])}
                className="glass-button w-full text-xs font-bold"
                style={{ color: "var(--warm-amber)" }}
              >
                تم · إخفاء الومضة
              </button>
            </div>
          </div>
        )}
        {/* Legacy pattern removed â€” nebula-bg handles the cosmic background */}
        {chromeVisibility.showFloatingProfile && (
          <div className="fixed z-[80] top-[calc(env(safe-area-inset-top)+0.75rem)] left-0 right-auto pl-4" dir="ltr">
            <button
              type="button"
              onClick={() => {
                recordFlowEvent("profile_clicked");
                if (authUser) {
                  setShowDataManagement(true);
                  return;
                }
                setPulseCheckContext("regular");
                setShowPulseCheck(false);
                setWelcome(null);
                const intent: PostAuthIntent = { kind: "login", createdAt: Date.now() };
                setPostAuthIntentState(intent);
                setShowAuthModal(true);
              }}
              className="group w-11 h-11 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/40 focus-visible:ring-offset-0 cursor-pointer relative"
              style={{ color: "var(--text-secondary)" }}
              aria-label={authUser ? "حسابي" : "تسجيل الدخول"}
            >
              <span className="relative inline-flex items-center justify-center">
                <User className="w-5 h-5" />
                {authUser && (
                  <span
                    className="absolute top-0 right-0 w-2 h-2 rounded-full"
                    style={{ background: "var(--soft-teal)", boxShadow: "0 0 0 2px var(--space-void)" }}
                    aria-hidden="true"
                  />
                )}
              </span>
              <span
                className="pointer-events-none absolute top-full mt-1 right-0 max-w-48 rounded-2xl px-3 py-1 text-[11px] font-medium leading-snug opacity-0 translate-y-1 bg-slate-900/90 text-slate-50 border border-white/10 backdrop-blur-md group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150 text-center"
              >
                {authUser ? "افتح حسابك" : "سجّل دخولك واحفظ رحلتك"}            </span>
            </button>
          </div>
        )}
        {chromeVisibility.showFloatingWhatsApp && whatsAppLink && (
          <button
            type="button"
            onClick={() => {
              trackEvent("whatsapp_contact_clicked", { placement: "app_floating" });
              openInNewTab(whatsAppLink);
            }}
            className="fixed z-40 right-4 md:right-6 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] md:bottom-6 inline-flex items-center justify-center rounded-full bg-emerald-600 text-white w-12 h-12 shadow-lg hover:bg-emerald-500 active:scale-95 transition-all"
            title="تواصل واتساب"
            aria-label="تواصل واتساب"
          >
            <MessageCircle className="w-5 h-5 shrink-0" />
          </button>
        )}
        <main
          className={`flex-1 min-w-0 flex flex-col pb-14 md:pb-0 ${showPulseCheck ? "opacity-0 pointer-events-none select-none" : ""} ${isLandingScreen ? "overflow-visible" : "overflow-hidden"}`}
          aria-hidden={showPulseCheck}
        >
          {screen === "map" && (
            <JourneyTimeline
              isOpen={showJourneyTimeline}
              onClose={() => setShowJourneyTimeline(false)}
              onCardClick={(nodeId) => setSelectedNodeId(nodeId)}
            />
          )}
          <Suspense fallback={<div className="text-sm" style={{ color: "var(--text-muted)" }}>...جاري التحميل</div>}>
            <div key={screen} className={`min-w-0 flex transition-all duration-300 ease-in-out ${isLandingScreen ? "flex-col" : "flex-1 items-center justify-center app-panel-main"}`}>
              {screen === "landing" && (
                <Landing
                  onStartJourney={startRecovery}
                  onRestartJourney={restartJourney}
                  ownerInstallRequestNonce={ownerInstallRequestNonce}
                  onOwnerInstallRequestHandled={() => setOwnerInstallRequestNonce(0)}
                />
              )}

              {screen === "goal" && (
                <div className="w-full flex-1 min-h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col px-3 sm:px-4">
                  {welcome && (
                    <OnboardingWelcomeBubble
                      message={welcome.message}
                      source={welcome.source}
                      onClose={() => setWelcome(null)}
                    />
                  )}
                  <GoalPicker
                    onBack={() => { void navigateToScreen("landing"); }}
                    onContinue={(nextCategory, nextGoalId) => {
                      setWelcome(null);
                      setCategory(nextCategory);
                      setGoalId(nextGoalId);
                      useJourneyState.getState().setLastGoal(nextGoalId, nextCategory);
                      skipNextPulseCheck();
                      void navigateToScreen("map");
                    }}
                  />
                </div>
              )}

              {screen === "map" && (
                <CoreMapScreen
                  category={category}
                  goalId={goalId}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={setSelectedNodeId}
                  onOpenBreathing={() => setShowBreathing(true)}
                  onOpenMission={openMissionScreen}
                  onOpenMissionFromAddPerson={openMissionFromAddPerson}
                  pulseMode={pulseMode}
                  pulseInsight={pulseInsight}
                  onOpenCocoon={openCocoonModal}
                  suppressLowPulseCocoon={isLowPulseCocoonSuppressed}
                  onOpenNoise={() => setShowNoiseSilencingPulse(true)}
                  canUseBasicDiagnosis={availableFeatures.basic_diagnosis}
                  onFeatureLocked={setLockedFeature}
                  onOpenChallenge={
                    challengeTarget ? () => openMissionScreen(challengeTarget.nodeId) : undefined
                  }
                  challengeLabel={challengeLabel}
                  nextStepDecision={nextStepDecision}
                  onTakeNextStep={handleTakeNextStep}
                  onRefreshNextStep={handleRefreshNextStep}
                />
              )}

              {screen === "tools" && (
                <JourneyToolsScreen
                  onBack={() => { void navigateToScreen(toolsBackScreen); }}
                  onOpenDawayir={openDawayirTool}
                  onOpenDawayirSetup={openDawayirSetup}
                  onFeatureLocked={setLockedFeature}
                  availableFeatures={availableFeatures}
                  onOpenGoal={(goalId, category) => {
                    setGoalId(goalId);
                    setCategory(category as AdviceCategory);
                    void navigateToScreen("map");
                  }}
                  nextStepDecision={nextStepDecision}
                  onTakeNextStep={handleTakeNextStep}
                  onRefreshNextStep={handleRefreshNextStep}
                />
              )}

              {screen === "guided" && (
                <GuidedJourneyFlow
                  onBackToLanding={() => { void navigateToScreen("landing"); }}
                  onFinishJourney={() => { void navigateToScreen("map"); }}
                />
              )}

              {screen === "mission" && missionNodeId && (
                <MissionScreen
                  nodeId={missionNodeId}
                  onBack={() => { void navigateToScreen("map"); }}
                />
              )}

              {screen === "enterprise" && (
                <EnterprisePortal />
              )}

              {screen === "guilt-court" && (
                <GuiltCourt />
              )}

              {screen === "diplomacy" && (
                <DiplomaticCables />
              )}
            </div>
          </Suspense>
        </main>

        <Suspense fallback={null}>
          {showGym && (
            <RelationshipGym
              onClose={() => setShowGym(false)}
              onStartJourney={() => {
                setShowGym(false);
                goToGoals();
              }}
            />
          )}

          {showBaseline && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-void/60 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative glass-heavy max-w-lg w-full max-h-[90vh] overflow-auto border-teal-500/20"
              >
                <button
                  type="button"
                  onClick={() => setShowBaseline(false)}
                  className="absolute top-4 left-4 w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors z-20"
                  aria-label="إغلاق"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="p-6 md:p-8">
                  <BaselineAssessment
                    onComplete={() => setShowBaseline(false)}
                  />
                </div>
              </motion.div>
            </div>
          )}

          {showJourneyGuideChat && canShowAIChatbot && (
            <AIChatbot
              agentContext={agentContext}
              agentActions={agentActions}
              systemPromptOverride={agentSystemPrompt}
              onOpenBreathing={() => setShowBreathing(true)}
              onNavigateToMap={() => { void navigateToScreen("map"); }}
              showLauncher={false}
              defaultOpen
              onRequestClose={() => setShowJourneyGuideChat(false)}
            />
          )}

          {/* زر إضافي لفتح أرشيف الوعي من شاشة الهبوط - وضع التطوير فقط */}
          <ConsciousnessArchiveModal
            isOpen={showConsciousnessArchive}
            onClose={() => setShowConsciousnessArchive(false)}
          />
          {lastNewAchievementId && <AchievementToast />}

          {showPulseCheck && (
            <PulseCheckModal
              isOpen={showPulseCheck}
              context={pulseCheckContext}
              onSubmit={(payload) => {
                if (pulseCheckContext === "start_recovery") {
                  handlePulseGateSubmit(payload);
                  return;
                }
                handlePulseSubmit(payload);
              }}
              onClose={(reason) => {
                if (reason === "close_button") {
                  const autoPayload = buildAutoPulsePayload();
                  if (pulseCheckContext === "start_recovery") {
                    if (hasConcretePulseSelection(autoPayload)) {
                      logPulse(autoPayload);
                    }
                    closePulseCheck(true, "programmatic");
                    openDawayirSetup();
                    return;
                  }
                  closePulseCheck(false, "close_button");
                  return;
                }
                closePulseCheck(false, reason);
              }}
            />
          )}

          {showCocoon && (
            <CocoonModeModal
              isOpen={showCocoon}
              onStart={() => {
                breathingFromCocoonRef.current = true;
                setShowCocoon(false);
                setPendingCocoonAfterNoise(false);
                suppressCocoonFor(90000);
                setReturnToGoalOnBreathingClose(true);
                skipNextPulseCheck();
                if (goalId === "unknown") {
                  openDefaultGoalMap();
                } else {
                  void navigateToScreen("map");
                }
                setShowBreathing(true);
              }}
              canSkip={canSkipCocoonBreathing}
              onSkip={() => {
                breathingFromCocoonRef.current = false;
                setShowCocoon(false);
                setPendingCocoonAfterNoise(false);
                suppressCocoonFor(4000);
                goToGoals();
              }}
              onClose={() => {
                breathingFromCocoonRef.current = false;
                setShowCocoon(false);
              }}
            />
          )}

          {showNoiseSilencingPulse && (
            <Suspense fallback={null}>
              <MuteProtocol
                isOpen={showNoiseSilencingPulse}
                onClose={() => setShowNoiseSilencingPulse(false)}
                onSessionComplete={() => {
                  setShowNoiseSilencingPulse(false);
                  setTimeout(() => setPostNoiseSessionMessage(false), 4500);
                }}
              />
            </Suspense>
          )}

          {lockedFeature != null && (
            <FeatureLockedModal
              isOpen={lockedFeature != null}
              featureKey={lockedFeature}
              onClose={() => setLockedFeature(null)}
            />
          )}

          {showBreathing && (
            <BreathingOverlay
              onClose={() => {
                const fromCocoon = breathingFromCocoonRef.current;
                const lowPulseRecently = Boolean(
                  lastPulse &&
                  (Date.now() - (lastPulse.timestamp ?? 0) < 24 * 60 * 60 * 1000) &&
                  lastPulse.energy <= 3
                );
                const shouldForceMapAfterBreathing = fromCocoon || returnToGoalOnBreathingClose || lowPulseRecently;
                breathingFromCocoonRef.current = false;
                setShowBreathing(false);
                setShowCocoon(false);
                setPendingCocoonAfterNoise(false);
                suppressCocoonFor(shouldForceMapAfterBreathing ? 90_000 : 8_000);
                if (shouldForceMapAfterBreathing) {
                  setSuppressLowPulseCocoonUntil(Date.now() + 20 * 60 * 1000);
                  setReturnToGoalOnBreathingClose(false);
                  skipNextPulseCheck();
                  if (goalId === "unknown") {
                    openDefaultGoalMap();
                  } else {
                    void navigateToScreen("map");
                  }
                  setPostBreathingMessage(true);
                  setTimeout(() => setPostBreathingMessage(false), 4000);
                }
              }}
            />
          )}

          {isEmergencyOpen && (
            <EmergencyOverlay
              onStartBreathing={() => {
                useEmergencyState.getState().close();
                setShowBreathing(true);
              }}
              onStartScenario={() => {
                useEmergencyState.getState().close();
                setShowGym(true);
              }}
            />
          )}
        </Suspense>

        {postAuthIntent && (
          <GoogleAuthModal
            isOpen={showAuthModal}
            intent={postAuthIntent}
            onClose={() => setShowAuthModal(false)}
            onNotNow={(pulseToSave) => {
              setShowAuthModal(false);
              setPostAuthIntentState(null);
              clearPostAuthIntent();
              setWelcome(null);
              skipNextPulseCheck();
              if (pulseToSave) logPulse(pulseToSave);
              openDawayirSetup();
            }}
          />
        )}

        {showDataManagement && (
          <Suspense fallback={null}>
            <DataManagement isOpen={showDataManagement} onClose={() => setShowDataManagement(false)} accountOnly />
          </Suspense>
        )}
        {showOwnerDataTools && (
          <Suspense fallback={null}>
            <DataManagement isOpen={showOwnerDataTools} onClose={() => setShowOwnerDataTools(false)} accountOnly={false} />
          </Suspense>
        )}
        {showNotificationSettings && (
          <Suspense fallback={null}>
            <NotificationSettings isOpen={showNotificationSettings} onClose={() => setShowNotificationSettings(false)} />
          </Suspense>
        )}
        {showTrackingDashboard && (
          <Suspense fallback={null}>
            <TrackingDashboard isOpen={showTrackingDashboard} onClose={() => setShowTrackingDashboard(false)} />
          </Suspense>
        )}
        {showAtlasDashboard && (
          <Suspense fallback={null}>
            <AtlasDashboard isOpen={showAtlasDashboard} onClose={() => setShowAtlasDashboard(false)} />
          </Suspense>
        )}
        {showShareStats && (
          <Suspense fallback={null}>
            <ShareStats isOpen={showShareStats} onClose={() => setShowShareStats(false)} />
          </Suspense>
        )}
        {showLibrary && (
          <Suspense fallback={null}>
            <EducationalLibrary isOpen={showLibrary} onClose={() => setShowLibrary(false)} />
          </Suspense>
        )}
        {showSymptomsOverview && (
          <Suspense fallback={null}>
            <SymptomsOverviewModal isOpen={showSymptomsOverview} onClose={() => setShowSymptomsOverview(false)} />
          </Suspense>
        )}
        {showRecoveryPlan && (
          <Suspense fallback={null}>
            <RecoveryPlanModal isOpen={showRecoveryPlan} onClose={() => setShowRecoveryPlan(false)} />
          </Suspense>
        )}
        {showThemeSettings && (
          <Suspense fallback={null}>
            <ThemeSettings isOpen={showThemeSettings} onClose={() => setShowThemeSettings(false)} />
          </Suspense>
        )}
        {showAchievements && (
          <Suspense fallback={null}>
            <Achievements onClose={() => setShowAchievements(false)} />
          </Suspense>
        )}
        {showAdvancedTools && (
          <Suspense fallback={null}>
            <AdvancedToolsModal isOpen={showAdvancedTools} onClose={() => setShowAdvancedTools(false)} />
          </Suspense>
        )}
        {showClassicRecovery && (
          <Suspense fallback={null}>
            <ClassicRecoveryModal isOpen={showClassicRecovery} onClose={() => setShowClassicRecovery(false)} />
          </Suspense>
        )}
        {showManualPlacement && (
          <Suspense fallback={null}>
            <ManualPlacementModal isOpen={showManualPlacement} onClose={() => setShowManualPlacement(false)} />
          </Suspense>
        )}
        {showFeedback && (
          <Suspense fallback={null}>
            <FeedbackModal
              isOpen={showFeedback}
              onClose={() => setShowFeedback(false)}
              onSubmit={async (payload) => {
                recordFlowEvent("feedback_submitted", {
                  meta: {
                    category: payload.category,
                    rating: payload.rating,
                    message: payload.message
                  }
                });
              }}
            />
          </Suspense>
        )}

        {/* Phase 30: Holographic Legacy Components */}
        {showAmbientReality && (
          <Suspense fallback={null}>
            <AmbientRealityMode onClose={() => setShowAmbientReality(false)} />
          </Suspense>
        )}
        {showTimeCapsuleVault && (
          <Suspense fallback={null}>
            <TimeCapsuleVault onClose={() => setShowTimeCapsuleVault(false)} />
          </Suspense>
        )}

        {consciousnessInsight && screen !== "landing" && (
          <div className="fixed bottom-28 left-6 right-6 bento-block z-50 max-w-lg mx-auto"
            style={{ borderColor: "rgba(45, 212, 191, 0.25)", padding: "1.5rem" }}
          >
            <div className="flex items-start gap-4 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: "rgba(45, 212, 191, 0.12)",
                  border: "1px solid rgba(45, 212, 191, 0.25)"
                }}
              >
                <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: "var(--soft-teal)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold mb-3" style={{ color: "var(--soft-teal)" }}>بصيرة الوعي</h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
                  {consciousnessInsight.suggestedAction}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1.5 text-xs font-bold rounded-full"
                    style={{ background: "var(--soft-teal-dim)", color: "var(--soft-teal)" }}
                  >
                    {consciousnessInsight.emotionalState}
                  </span>
                  <span className="px-3 py-1.5 text-xs font-bold rounded-full"
                    style={{ background: "rgba(139, 92, 246, 0.12)", color: "rgba(167, 139, 250, 0.9)" }}
                  >
                    نمط: {consciousnessInsight.underlyingPattern}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        {showOnboarding && (
          <OnboardingFlow onComplete={() => { setShowOnboarding(false); setShowWelcomeToast(true); setTimeout(() => setShowWelcomeToast(false), 6000); }} />
        )}
        {showFaq && <FaqScreen onClose={() => setShowFaq(false)} />}
        <JourneyToast variant="onboarding_complete" visible={showWelcomeToast} onClose={() => setShowWelcomeToast(false)} />
        <JourneyToast
          variant="nudge"
          visible={showNudgeToast && chromeVisibility.showNudgeToast}
          nudgeData={activeNudge ?? undefined}
          onClose={() => {
            if (activeNudge?.title === 'نظام الاحتواء 🛡️') {
              openCocoonModal("manual");
            }
            handleNudgeDismiss();
          }}
        />
        <AnalyticsConsentBanner suppressed={!chromeVisibility.showConsentBanner} />
        <MirrorOverlay
          insight={activeMirrorInsight}
          onConfront={(insight) => {
            // For now, just close and maybe log. Future: Open Journal.
            dismissMirrorInsight(insight.id);
            setShowMirrorOverlay(false);
          }}
          onDeny={(insight) => {
            dismissMirrorInsight(insight.id);
            setShowMirrorOverlay(false);
          }}
        />

        {/* Mobile Bottom Navigation - hidden on md+ */}
        {chromeVisibility.showMobileBottomNav && (
          <nav
            className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center"
            style={{
              background: "rgba(15,23,42,0.88)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderTop: "1px solid rgba(45,212,191,0.15)",
              paddingBottom: "env(safe-area-inset-bottom)",
              height: "calc(60px + env(safe-area-inset-bottom))"
            }}
            aria-label="التنقل الرئيسي"
          >
            <button type="button" onClick={() => { void navigateToScreen("landing"); }}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200"
              style={{ color: screen !== "map" ? "var(--soft-teal)" : "rgba(148,163,184,0.55)" }}
              aria-label="مساري">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span className="text-[10px] font-semibold">مساري</span>
            </button>
            <button type="button" onClick={() => { void navigateToScreen("map"); }}
              className="relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200"
              style={{ color: screen === "map" ? "var(--soft-teal)" : "rgba(148,163,184,0.55)" }}
              aria-label="دوايري">
              <span className="relative inline-flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                  style={{ filter: screen === "map" ? "drop-shadow(0 0 8px rgba(45,212,191,0.7))" : "none", transition: "filter 0.3s" }}>
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="5.5" />
                  <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
                </svg>
                {screen !== "map" && nodes.some(n => !n.isNodeArchived) && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse"
                    style={{ background: "var(--soft-teal)", boxShadow: "0 0 0 1.5px rgba(15,23,42,0.95)" }}
                    aria-hidden="true" />
                )}
              </span>
              <span className="text-[10px] font-semibold">دوايري</span>
            </button>
            <button type="button" onClick={() => setShowAchievements(true)}
              className="relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200"
              style={{ color: "rgba(148,163,184,0.55)" }}
              aria-label="محطات">
              <span className="relative inline-flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 21v-4a7 7 0 0 1 14 0v4" />
                  <path d="M5 3v4a7 7 0 0 0 14 0V3" />
                  <line x1="5" y1="3" x2="19" y2="3" />
                  <line x1="5" y1="21" x2="19" y2="21" />
                </svg>
                {nodes.filter(n => n.isNodeArchived).length > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] rounded-full text-[8px] font-bold flex items-center justify-center px-0.5"
                    style={{ background: "rgba(45,212,191,0.9)", color: "#0f172a", lineHeight: "1" }}>
                    {nodes.filter(n => n.isNodeArchived).length}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-semibold">محطات</span>
            </button>
            <button type="button" onClick={() => setShowFaq(true)}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200"
              style={{ color: "rgba(148,163,184,0.55)" }}
              aria-label="وعي">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              <span className="text-[10px] font-semibold">وعي</span>
            </button>
          </nav>
        )}

      </div>
      {/* Phase 20: Automagic Loop Toast — Global Reactive Prescription */}
      <GraphEventToast />
    </PWAInstallProvider>
  );
}


