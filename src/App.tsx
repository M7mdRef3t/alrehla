import { useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, MessageCircle } from "lucide-react";
import { Landing } from "./components/Landing";
import { LegalPage } from "./components/LegalPage";
import { useNotificationState } from "./state/notificationState";
import { useEmergencyState } from "./state/emergencyState";
import { useMapState } from "./state/mapState";
import { useJourneyState } from "./state/journeyState";
import { useAchievementState, getLibraryOpenedAt, getBreathingUsedAt } from "./state/achievementState";
import { useThemeState } from "./state/themeState";
import { initThemePalette } from "./services/themePalette";
import { usePulseState } from "./state/pulseState";
import type { PulseEnergyConfidence, PulseFocus, PulseMood } from "./state/pulseState";
import { trackPageView, trackEvent, AnalyticsEvents } from "./services/analytics";
import { recordFlowEvent } from "./services/journeyTracking";
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
import { clearPostAuthIntent, getPostAuthIntent, type PostAuthIntent } from "./utils/postAuthIntent";
import { geminiClient } from "./services/geminiClient";
import { isSupabaseReady } from "./services/supabaseClient";
import { fetchAdminConfig, fetchOwnerAlerts } from "./services/adminApi";
import { usePulseCheckLogic } from "./hooks/usePulseCheckLogic";
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
import { runtimeEnv } from "./config/runtimeEnv";

type Screen = "landing" | "goal" | "map" | "guided" | "mission" | "tools";
type PulseSubmitPayload = {
  energy: number | null;
  mood: PulseMood | null;
  focus: PulseFocus | null;
  auto?: boolean;
  notes?: string;
  energyReasons?: string[];
  energyConfidence?: PulseEnergyConfidence;
};
type OwnerActionKey =
  | "admin_dashboard"
  | "consciousness_archive"
  | "journey_guide_chat"
  | "journey_tools"
  | "journey_timeline"
  | "open_dawayir"
  | "quick_experience"
  | "start_journey"
  | "guided_journey"
  | "baseline_check"
  | "notifications"
  | "tracking_dashboard"
  | "atlas_dashboard"
  | "data_tools"
  | "share_stats"
  | "library"
  | "symptoms"
  | "recovery_plan"
  | "theme_settings"
  | "achievements"
  | "advanced_tools"
  | "classic_recovery"
  | "manual_placement"
  | "feedback_modal"
  | "install_app"
  | "noise_silencing"
  | "breathing_session";

function normalizePreviewFeature(value: string | null): FeatureFlagKey | null {
  if (!value) return null;
  const key = value.trim().toLowerCase();
  if (
    key === "dawayir_map" ||
    key === "journey_tools" ||
    key === "basic_diagnosis" ||
    key === "mirror_tool" ||
    key === "family_tree" ||
    key === "internal_boundaries" ||
    key === "generative_ui_mode" ||
    key === "global_atlas" ||
    key === "ai_field" ||
    key === "pulse_check"
  ) {
    return key as FeatureFlagKey;
  }
  return null;
}

function normalizeOwnerAction(value: string | null): OwnerActionKey | null {
  if (!value) return null;
  const key = value.trim().toLowerCase();
  if (
    key === "admin_dashboard" ||
    key === "consciousness_archive" ||
    key === "journey_guide_chat" ||
    key === "journey_tools" ||
    key === "journey_timeline" ||
    key === "open_dawayir" ||
    key === "quick_experience" ||
    key === "start_journey" ||
    key === "guided_journey" ||
    key === "baseline_check" ||
    key === "notifications" ||
    key === "tracking_dashboard" ||
    key === "atlas_dashboard" ||
    key === "data_tools" ||
    key === "share_stats" ||
    key === "library" ||
    key === "symptoms" ||
    key === "recovery_plan" ||
    key === "theme_settings" ||
    key === "achievements" ||
    key === "advanced_tools" ||
    key === "classic_recovery" ||
    key === "manual_placement" ||
    key === "feedback_modal" ||
    key === "install_app" ||
    key === "noise_silencing" ||
    key === "breathing_session"
  ) {
    return key as OwnerActionKey;
  }
  return null;
}

/** Ù…Ø³Ø§ÙØ© Ù„Ù„Ù…ÙŠÙ†ÙŠÙˆ â€” ØªØ§Ø¨ ØµØºÙŠØ± Ø¸Ø§Ù‡Ø± (Ø§Ù„Ø´Ø±ÙŠØ· ÙŠØ¸Ù‡Ø± Ø¹Ù†Ø¯ Ø§Ù„ØªØ­Ø±ÙŠÙƒ) */

const CoreMapScreen = lazy(() => import("./components/CoreMapScreen").then((m) => ({ default: m.CoreMapScreen })));
const GoalPicker = lazy(() => import("./components/GoalPicker").then((m) => ({ default: m.GoalPicker })));
const RelationshipGym = lazy(() => import("./components/RelationshipGym").then((m) => ({ default: m.RelationshipGym })));
const BaselineAssessment = lazy(() => import("./components/BaselineAssessment").then((m) => ({ default: m.BaselineAssessment })));
const PulseCheckModal = lazy(() => import("./components/PulseCheckModal").then((m) => ({ default: m.PulseCheckModal })));
const CocoonModeModal = lazy(() => import("./components/CocoonModeModal").then((m) => ({ default: m.CocoonModeModal })));
const NoiseSilencingModal = lazy(() =>
  import("./components/NoiseSilencingModal").then((m) => ({ default: m.NoiseSilencingModal }))
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
  import("./components/admin/AdminDashboard").then((m) => ({ default: m.OverviewPanel }))
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
  if (value === "landing" || value === "goal" || value === "map" || value === "guided" || value === "tools") {
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
  const prefix = firstName ? `Ø£Ù‡Ù„Ø§Ù‹ ÙŠØ§ ${firstName}` : "Ø£Ù‡Ù„Ø§Ù‹";
  if (toneGender === "female") return `${prefix}ØŒ Ù‡Ù„ Ø£Ù†ØªÙ Ù…Ø³ØªØ¹Ø¯Ø© Ù„Ø¨Ø¯Ø¡ Ø§Ù„Ø±Ø­Ù„Ø©ØŸ`;
  if (toneGender === "male") return `${prefix}ØŒ Ù‡Ù„ Ø£Ù†Øª Ù…Ø³ØªØ¹Ø¯ Ù„Ø¨Ø¯Ø¡ Ø§Ù„Ø±Ø­Ù„Ø©ØŸ`;
  return `${prefix}ØŒ Ù‡Ù„ Ø£Ù†Øª Ù…Ø³ØªØ¹Ø¯ Ù„Ø¨Ø¯Ø¡ Ø§Ù„Ø±Ø­Ù„Ø©ØŸ`;
}

function buildWelcomePrompt(firstName: string | null, toneGender: UserToneGender): string {
  const toneLabel = toneGender === "female" ? "Ù…Ø¤Ù†Ø« Ø¯Ø§ÙØ¦" : toneGender === "male" ? "Ù…Ø°ÙƒØ± Ø¯Ø§ÙØ¦" : "Ù…Ø­Ø§ÙŠØ¯ ÙˆØ¯ÙˆØ¯";
  const namePart = firstName ? ` Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø§Ø³Ù…Ù‡ "${firstName}"` : "";
  const tonePart = toneGender === "neutral" ? "Ø¨Ø¯ÙˆÙ† ØªØ°ÙƒÙŠØ±/ØªØ£Ù†ÙŠØ« Ù…Ø¨Ø§Ø´Ø±" : `Ø¨ØµÙŠØºØ© Ù…Ø®Ø§Ø·Ø¨Ø© ${toneLabel}`;
  return `Ø§ÙƒØªØ¨ ØªØ±Ø­ÙŠØ¨ Ù‚ØµÙŠØ± ÙˆØ¯ÙˆØ¯ Ø¨Ø§Ù„Ù„Ù‡Ø¬Ø© Ø§Ù„Ù…ØµØ±ÙŠØ©${namePart}. Ø¬Ù…Ù„Ø© ÙˆØ§Ø­Ø¯Ø© Ø¨Ø´ÙƒÙ„ Ø·Ø¨ÙŠØ¹ÙŠ (Ø¨Ø¯ÙˆÙ† Ø³Ø¤Ø§Ù„ Ù…Ù†ÙØµÙ„). Ø¨Ø¯ÙˆÙ† Ø¥ÙŠÙ…ÙˆØ¬ÙŠ. Ø¨Ø¯ÙˆÙ† Ø¹Ù„Ø§Ù…Ø§Øª Ø§Ù‚ØªØ¨Ø§Ø³. Ø£Ù‚Ù„ Ù…Ù† 15 ÙƒÙ„Ù…Ø©. ${tonePart}. Ù„Ø§ ØªÙƒØ±Ø± Ø§Ù„Ø§Ø³Ù… ÙƒØ«ÙŠØ±Ø§Ù‹.`;
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
  const [screen, setScreen] = useState<Screen>("landing");
  const [category, setCategory] = useState<AdviceCategory>("general");
  const [goalId, setGoalId] = useState<string>("unknown");
  const [showGym, setShowGym] = useState(false);
  const [showBaseline, setShowBaseline] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [missionNodeId, setMissionNodeId] = useState<string | null>(null);
  const [toolsBackScreen, setToolsBackScreen] = useState<Screen>("landing");
  const [showCocoon, setShowCocoon] = useState(false);
  /** Ø¹Ù†Ø¯ Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„ØªÙ†ÙØ³: Ù„Ùˆ ÙÙØªØ­ Ù…Ù† Ù…Ø³Ø§Ø± Ø¯Ù‚ÙŠÙ‚Ø© Ø´Ø­Ù† Ù†Ø±Ø¬Ø¹ Ù„Ø´Ø§Ø´Ø© Ø§Ù„Ø®Ø±ÙŠØ·Ø© */
  const [returnToGoalOnBreathingClose, setReturnToGoalOnBreathingClose] = useState(false);
  const breathingFromCocoonRef = useRef(false);
  const [suppressLowPulseCocoonUntil, setSuppressLowPulseCocoonUntil] = useState(0);
  const [suppressCocoonReopen, setSuppressCocoonReopen] = useState(false);
  const cocoonSuppressTimerRef = useRef<number | null>(null);
  const cocoonSuppressedUntilRef = useRef<number>(0);
  const lastAutoCocoonOpenAtRef = useRef<number>(0);
  const [showNoiseSilencingPulse, setShowNoiseSilencingPulse] = useState(false);
  const [pendingCocoonAfterNoise, setPendingCocoonAfterNoise] = useState(false);
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
  /** Ø±Ø¨Ø· Ø§Ù„Ø±Ø¬ÙˆØ¹ Ø¨Ø§Ù„ØªØ§ØªØ´/Ø²Ø± Ø§Ù„Ø±Ø¬ÙˆØ¹ Ø¨Ø§Ù„Ø´Ø§Ø´Ø© Ø§Ù„Ø³Ø§Ø¨Ù‚Ø© Ø¨Ø¯Ù„ Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„ØªØ·Ø¨ÙŠÙ‚ */
  const fromPopStateRef = useRef(false);
  const hasHistorySyncedRef = useRef(false);
  const restoredLastScreenForUserRef = useRef<string | null>(null);
  const hasHydratedUiStateRef = useRef(false);
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [showOwnerDataTools, setShowOwnerDataTools] = useState(false);
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
  const showTopToolsButton = isPrivilegedUser && !isLockedPhaseOne;
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

  const openCocoonModal = useCallback((source: "auto" | "manual" = "manual") => {
    if (Date.now() < cocoonSuppressedUntilRef.current) return;
    // Guard against re-opening cocoon while breathing is already active.
    if (suppressCocoonReopen || showBreathing) return;
    if (source === "auto") {
      const now = Date.now();
      // Deduplicate repeated auto-open calls from the same pulse flow.
      if (now - lastAutoCocoonOpenAtRef.current < 30_000) return;
      lastAutoCocoonOpenAtRef.current = now;
    }
    setShowCocoon(true);
  }, [showBreathing, suppressCocoonReopen]);

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

  /** Ø±Ø¨Ø· History API Ø¨Ø§Ù„Ø´Ø§Ø´Ø§Øª â€” Ø§Ù„Ø±Ø¬ÙˆØ¹ Ø¨Ø§Ù„ØªØ§ØªØ´/Ø²Ø± Ø§Ù„Ø±Ø¬ÙˆØ¹ ÙŠØ±Ø¬Ø¹ Ù„Ù„Ø´Ø§Ø´Ø© Ø§Ù„Ø³Ø§Ø¨Ù‚Ø© Ø¨Ø¯Ù„ Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„ØªØ·Ø¨ÙŠÙ‚ */
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
      fromPopStateRef.current = true;
      setScreen(next);
    };
    return subscribePopstate(handler);
  }, []);

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
            console.warn("[Stress Test] ØªÙ…: ", result.nodeCount, "Ø¹ÙÙ‚Ø¯Ø©ØŒ", result.eventCount, "Ø­Ø¯Ø«. Ø¥Ø¹Ø§Ø¯Ø© ØªØ­Ù…ÙŠÙ„...");
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
      landing: "Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©",
      goal: "Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„Ù‡Ø¯Ù",
      map: "Ø®Ø±ÙŠØ·Ø© Ø§Ù„Ø¹Ù„Ø§Ù‚Ø§Øª",
      guided: "Ø§Ù„Ø±Ø­Ù„Ø© Ø§Ù„Ù…ÙˆØ¬Ù‡Ø©",
      mission: "Ø´Ø§Ø´Ø© Ø§Ù„Ù…Ù‡Ù…Ø©",
      tools: "Ø£Ø¯ÙˆØ§Øª Ø§Ù„Ø±Ø­Ù„Ø©"
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
          "Ø²Ø§Ø¦Ø± Ø¬Ø¯ÙŠØ¯ Ø¯Ø®Ù„ Ø§Ù„Ù…Ù†ØµØ©",
          `Session: ${sessionId.slice(0, 14)}â€¦`,
          `owner-visitor-${sessionId}`
        );
      }

      for (const sessionId of alerts.logins.sessionIds) {
        await sendOwnerNotification(
          "Ø²Ø§Ø¦Ø± Ø£ÙƒÙ…Ù„ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„",
          `Session: ${sessionId.slice(0, 14)}â€¦`,
          `owner-login-${sessionId}`
        );
      }

      for (const sessionId of alerts.installs.sessionIds) {
        await sendOwnerNotification(
          "Ø²Ø§Ø¦Ø± Ø«Ø¨Øª Ø§Ù„ØªØ·Ø¨ÙŠÙ‚",
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
          "ØªØ­Ù‚Ù‚ Ø§Ù„Ù‡Ø¯Ù: 10 ØªØ³Ø¬ÙŠÙ„Ø§Øª",
          `ØªÙ… Ø§Ù„ÙˆØµÙˆÙ„ Ø¥Ù„Ù‰ ${alerts.phaseOne.registeredUsers} Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ† Ù…Ø³Ø¬Ù„ÙŠÙ†.`,
          "owner-goal-registered"
        );
      }
      if (!prevMilestones.installedReached && nextMilestones.installedReached) {
        await sendOwnerNotification(
          "ØªØ­Ù‚Ù‚ Ø§Ù„Ù‡Ø¯Ù: 10 ØªØ«Ø¨ÙŠØªØ§Øª",
          `ØªÙ… Ø§Ù„ÙˆØµÙˆÙ„ Ø¥Ù„Ù‰ ${alerts.phaseOne.installedUsers} Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ† Ø«Ø¨ØªÙˆØ§ Ø§Ù„ØªØ·Ø¨ÙŠÙ‚.`,
          "owner-goal-installed"
        );
      }
      if (!prevMilestones.addedReached && nextMilestones.addedReached) {
        await sendOwnerNotification(
          "ØªØ­Ù‚Ù‚ Ø§Ù„Ù‡Ø¯Ù: 10 Ø£Ø´Ø®Ø§Øµ Ù…Ø¶Ø§ÙÙŠÙ†",
          `ØªÙ… Ø§Ù„ÙˆØµÙˆÙ„ Ø¥Ù„Ù‰ ${alerts.phaseOne.addedPeople} Ø£Ø´Ø®Ø§Øµ Ù…Ø¶Ø§ÙÙŠÙ† Ø¹Ù„Ù‰ Ø§Ù„Ø®Ø±Ø§Ø¦Ø·.`,
          "owner-goal-added"
        );
      }
      if (!prevMilestones.fullyCompleted && nextMilestones.fullyCompleted) {
        await sendOwnerNotification(
          "Ø§ÙƒØªÙ…Ù„ Ù‡Ø¯Ù Ø§Ù„Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ø£ÙˆÙ„Ù‰",
          "10 ØªØ³Ø¬ÙŠÙ„Ø§Øª + 10 ØªØ«Ø¨ÙŠØªØ§Øª + 10 Ø£Ø´Ø®Ø§Øµ Ù…Ø¶Ø§ÙÙŠÙ† ØªØ­Ù‚Ù‚ÙˆØ§ Ø¨Ø§Ù„ÙƒØ§Ù…Ù„.",
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
      setScreen("map");
    } else {
      setScreen("goal");
    }

    let cancelled = false;
    void (async () => {
      // ØªØ­Ù„ÙŠÙ„ Ø§Ù„ÙˆØ¹ÙŠ Ø§Ù„Ø£ÙˆÙ„ÙŠ Ø¹Ù†Ø¯ Ø§Ù„Ø¯Ø®ÙˆÙ„
      const insight = await consciousnessService.analyzeConsciousness(`Ø¨Ø¯Ø£ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… ${authFirstName || ""} Ø±Ø­Ù„Ø© Ø¬Ø¯ÙŠØ¯Ø©`);
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
  }, [authStatus, authUser, authFirstName, authToneGender, logPulse, setPulseCheckContext, setShowPulseCheck]);

  const openDefaultGoalMap = useCallback(() => {
    const defaultGoalId = "family";
    setGoalId(defaultGoalId);
    setCategory(resolveAdviceCategory(defaultGoalId));
    setSelectedNodeId(null);
    setScreen("map");
  }, [setCategory, setGoalId, setScreen, setSelectedNodeId]);

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
    setScreen("goal");
  }, [canUseMap, openDefaultGoalMap, setLockedFeature, setScreen, skipNextPulseCheck]);

  const startRecovery = () => {
    if (canUsePulseCheck) {
      trackEvent(AnalyticsEvents.MICRO_COMPASS_OPENED, { source: "landing", gate: "pulse" });
      setWelcome(null);
      setPostAuthIntentState(null);
      setShowAuthModal(false);
      setPulseCheckContext("start_recovery");
      setShowPulseCheck(true);
      return;
    }
    if (shouldGateStartWithAuth) {
      setWelcome(null);
      setPostAuthIntentState({ kind: "login", createdAt: Date.now() });
      setShowAuthModal(true);
      return;
    }
    goToGoals();
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
      setScreen("landing");
    }
  }, [canUseMap, isUserMode, screen]);

  useEffect(() => {
    if (canUseJourneyTools) return;
    if (screen === "tools") setScreen("landing");
  }, [canUseJourneyTools, screen]);

  useEffect(() => {
    if (!isLockedPhaseOne) return;
    if (screen === "guided" || screen === "mission" || screen === "tools") {
      setScreen("map");
    }
  }, [isLockedPhaseOne, screen]);

  useEffect(() => {
    if (!isLockedPhaseOne) return;
    if (goalId !== "family") setGoalId("family");
  }, [goalId, isLockedPhaseOne]);

  const openMissionScreen = (nodeId: string) => {
    if (isLockedPhaseOne) return;
    setMissionNodeId(nodeId);
    setScreen("mission");
  };
  const openJourneyTools = useCallback(() => {
    if (isLockedPhaseOne) return;
    if (!canUseJourneyTools) {
      setLockedFeature("journey_tools");
      return;
    }
    recordFlowEvent("tools_opened");
    setToolsBackScreen(screen === "tools" ? "landing" : screen);
    setScreen("tools");
  }, [canUseJourneyTools, isLockedPhaseOne, screen, setLockedFeature, setScreen, setToolsBackScreen]);
  const openDawayirTool = useCallback(() => {
    if (!canUseMap) {
      setLockedFeature("dawayir_map");
      return;
    }
    const lastGoalMeta = getLastGoalMeta(lastGoalById, storedGoalId, storedCategory);
    if (lastGoalMeta) {
      setGoalId(lastGoalMeta.goalId);
      setCategory(lastGoalMeta.category as AdviceCategory);
      setScreen("map");
      setSelectedNodeId(null);
      return;
    }
    if (isPhaseOneUserFlow) {
      openDefaultGoalMap();
      return;
    }
    setScreen("goal");
  }, [
    canUseMap,
    lastGoalById,
    openDefaultGoalMap,
    setCategory,
    setGoalId,
    setLockedFeature,
    setScreen,
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
    setScreen("goal");
  };

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
      setScreen("landing");
      setPulseCheckContext("regular");
      setShowPulseCheck(true);
      clearPreviewParam();
      return;
    }

    if (previewFeature === "ai_field") {
      skipNextPulseCheck();
      setScreen("landing");
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
    setScreen("map");
    clearPreviewParam();
  }, [isAdminRoute, isOwnerWatcher, openJourneyTools, setPulseCheckContext, setShowPulseCheck, skipNextPulseCheck]);

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

    switch (ownerAction) {
      case "admin_dashboard": {
        const next = createCurrentUrl();
        if (!next) return;
        next.pathname = "/admin";
        next.search = "";
        next.searchParams.set("tab", "overview");
        pushUrl(next);
        break;
      }
      case "consciousness_archive":
        setShowConsciousnessArchive(true);
        break;
      case "journey_guide_chat":
        if (!canShowAIChatbot) {
          setLockedFeature("ai_field");
        } else {
          setShowJourneyGuideChat(true);
        }
        break;
      case "journey_tools":
        openJourneyTools();
        break;
      case "journey_timeline":
        setScreen("map");
        setShowJourneyTimeline(true);
        break;
      case "open_dawayir":
        openDawayirTool();
        break;
      case "quick_experience":
        setShowGym(true);
        break;
      case "start_journey":
        goToGoals();
        break;
      case "guided_journey":
        setScreen("guided");
        break;
      case "baseline_check":
        setShowBaseline(true);
        break;
      case "notifications":
        if (notificationSupported) setShowNotificationSettings(true);
        break;
      case "tracking_dashboard":
        setShowTrackingDashboard(true);
        break;
      case "atlas_dashboard":
        if (!availableFeatures.global_atlas) {
          setLockedFeature("global_atlas");
        } else {
          setShowAtlasDashboard(true);
        }
        break;
      case "data_tools":
        setShowOwnerDataTools(true);
        break;
      case "share_stats":
        setShowShareStats(true);
        break;
      case "library":
        setShowLibrary(true);
        break;
      case "symptoms":
        setShowSymptomsOverview(true);
        break;
      case "recovery_plan":
        setShowRecoveryPlan(true);
        break;
      case "theme_settings":
        setShowThemeSettings(true);
        break;
      case "achievements":
        setShowAchievements(true);
        break;
      case "advanced_tools":
        if (!availableFeatures.internal_boundaries) {
          setLockedFeature("internal_boundaries");
        } else {
          setShowAdvancedTools(true);
        }
        break;
      case "classic_recovery":
        if (!availableFeatures.internal_boundaries) {
          setLockedFeature("internal_boundaries");
        } else {
          setShowClassicRecovery(true);
        }
        break;
      case "manual_placement":
        if (!availableFeatures.internal_boundaries) {
          setLockedFeature("internal_boundaries");
        } else {
          setShowManualPlacement(true);
        }
        break;
      case "feedback_modal":
        recordFlowEvent("feedback_opened");
        setShowFeedback(true);
        break;
      case "install_app":
        setScreen("landing");
        setOwnerInstallRequestNonce((prev) => prev + 1);
        break;
      case "noise_silencing":
        setShowNoiseSilencingPulse(true);
        break;
      case "breathing_session":
        setShowBreathing(true);
        break;
      default:
        break;
    }

    clearOwnerActionParam();
  }, [
    availableFeatures.global_atlas,
    availableFeatures.internal_boundaries,
    canShowAIChatbot,
    goToGoals,
    isAdminRoute,
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

    // ØªÙˆØµÙŠÙ„ Ø§Ù„Ø¨ÙˆØµÙ„Ø© Ø¨Ù…Ø±Ø¢Ø© Ø§Ù„ÙˆØ¹ÙŠ (ØºÙŠØ± Ù…Ø¹Ø·Ù‘ÙÙ„ Ù„Ù„ØªØ¬Ø±Ø¨Ø©)
    const numericPart = `Ø·Ø§Ù‚Ø© ${payload.energy}/10ØŒ Ù…Ø²Ø§Ø¬ ${payload.mood}, ØªØ±ÙƒÙŠØ² ${payload.focus}`;
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
      screen,
      selectedNodeId,
      goalId,
      category,
      pulse: lastPulse
    }),
    [nodes, availableFeatures, screen, selectedNodeId, goalId, category, lastPulse]
  );

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
        onNavigateMap: () => setScreen("map"),
        onNavigateBaseline: () => setShowBaseline(true),
        onNavigateEmergency: () => useEmergencyState.getState().open(),
        availableFeatures,
        onNavigatePerson: (nodeId) => {
          setScreen("map");
          setSelectedNodeId(nodeId);
        }
      });
    },
    [agentModule, nodes, availableFeatures]
  );

  const pulseInsight = useMemo(
    () => getWeeklyPulseInsight(pulseLogs, weekdayLabels),
    [pulseLogs, weekdayLabels]
  );

  const pulseMode = useMemo(() => {
    if (!lastPulse) return "normal";
    const ageMs = Date.now() - (lastPulse.timestamp ?? 0);
    if (ageMs > 24 * 60 * 60 * 1000) return "normal"; // Ø¢Ø®Ø± Ù†Ø¨Ø¶ Ø®Ù„Ø§Ù„ Ù¢Ù¤ Ø³Ø§Ø¹Ø© ÙÙ‚Ø·
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
    ? `Ù…Ø¹ ${challengeTarget.label} â€” ${challengeTarget.missionLabel} (Ø®Ø·ÙˆØ© ${challengeTarget.stepIndex + 1}/${challengeTarget.total})`
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
              title: "Ù…Ù‡Ù…ØªÙƒ Ù…Ø³ØªÙ†ÙŠØ§Ùƒ ðŸŽ¯",
              body: `Ù…Ø¹ ${reminderTarget.node.label} â€” Ø®Ø·ÙˆØ© ${reminderTarget.next.stepIndex + 1}/${reminderTarget.next.total}: ${reminderTarget.next.step}`,
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
  useEffect(() => {
    const documentRef = getDocumentOrNull();
    if (!documentRef) return;
    const shouldLockScroll =
      isUserMode &&
      screen === "landing" &&
      !isAdminRoute &&
      !isAnalyticsRoute &&
      pathname !== "/privacy" &&
      pathname !== "/terms";
    if (!shouldLockScroll) return;

    const prevHtmlOverflow = documentRef.documentElement.style.overflow;
    const prevBodyOverflow = documentRef.body.style.overflow;
    documentRef.documentElement.style.overflow = "hidden";
    documentRef.body.style.overflow = "hidden";

    return () => {
      documentRef.documentElement.style.overflow = prevHtmlOverflow;
      documentRef.body.style.overflow = prevBodyOverflow;
    };
  }, [screen, isAdminRoute, isAnalyticsRoute, pathname]);

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
            title={previewedFeature ? `Ø§Ù„Ø±Ø¬ÙˆØ¹ Ù…Ù† Ù…Ø¹Ø§ÙŠÙ†Ø©: ${previewedFeature}` : "Ø§Ù„Ø±Ø¬ÙˆØ¹ Ø¥Ù„Ù‰ Feature Flags"}
          >
            Ø§Ù„Ø±Ø¬ÙˆØ¹ Ø¥Ù„Ù‰ Feature Flags
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
    <div className="min-h-screen flex transition-colors relative overflow-hidden isolate" dir="rtl"
      style={{ background: "var(--space-void)" }}
    >
      {isFeaturePreviewSession && (
        <button
          type="button"
          onClick={goBackToFeatureFlags}
          className="fixed z-50 top-4 left-4 rounded-full border border-indigo-300 bg-white/95 px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
          title={previewedFeature ? `Ø§Ù„Ø±Ø¬ÙˆØ¹ Ù…Ù† Ù…Ø¹Ø§ÙŠÙ†Ø©: ${previewedFeature}` : "Ø§Ù„Ø±Ø¬ÙˆØ¹ Ø¥Ù„Ù‰ Feature Flags"}
        >
          Ø§Ù„Ø±Ø¬ÙˆØ¹ Ø¥Ù„Ù‰ Feature Flags
        </button>
      )}
      {/* ðŸŒŒ Nebula Background â€” Deep Cosmic Blue Canvas */}
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
                    Ø±Ø³Ø§Ù„Ø© Ù…Ù† Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø±Ø­Ù„Ø©
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
                  aria-label="Ø¥Ø®ÙØ§Ø¡ Ø§Ù„Ø±Ø³Ø§Ù„Ø©"
                >
                  Ø¥Ø®ÙØ§Ø¡
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
                Ø­Ù…Ø¯ Ù„Ù„Ù‡ Ø¹Ù„Ù‰ Ø§Ù„Ø³Ù„Ø§Ù…Ø© ðŸŒ¿
              </p>
              <p className="text-sm mt-1 opacity-90" style={{ color: "var(--text-secondary)" }}>
                ÙŠÙˆÙ…Ùƒ Ø¨Ù‚Ù‰ Ø£Ø®Ù Ø¯Ù„ÙˆÙ‚ØªÙŠ
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
                <h3 className="text-sm font-bold mb-3" style={{ color: "var(--warm-amber)" }}>
                  ÙˆÙ…Ø¶Ø© Ù…Ù† Ø§Ù„Ø°Ø§ÙƒØ±Ø©
                </h3>
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
                        Ø´Ø¹ÙˆØ±Ùƒ Ø¯Ù„ÙˆÙ‚ØªÙŠ Ø¨ÙŠØ´Ø¨Ù‡ Ù…ÙˆÙ‚Ù{" "}
                        {insight.created_at && (
                          <span className="font-bold" style={{ color: "var(--text-primary)" }}>
                            Ø­ØµÙ„ ÙŠÙˆÙ…{" "}
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
              ØªÙ… Â· Ø¥Ø®ÙØ§Ø¡ Ø§Ù„ÙˆÙ…Ø¶Ø©
            </button>
          </div>
        </div>
      )}
      {/* Legacy pattern removed â€” nebula-bg handles the cosmic background */}
      {!isAdminRoute && !showAuthModal && !showPulseCheck && (
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
      {whatsAppLink && !isAdminRoute && !showAuthModal && !showPulseCheck && (
        <button
          type="button"
          onClick={() => {
            trackEvent("whatsapp_contact_clicked", { placement: "app_floating" });
            openInNewTab(whatsAppLink);
          }}
          className="fixed z-40 right-4 md:right-6 bottom-[calc(env(safe-area-inset-bottom)+1rem)] md:bottom-6 inline-flex items-center justify-center rounded-full bg-emerald-600 text-white w-12 h-12 shadow-lg hover:bg-emerald-500 active:scale-95 transition-all"
          title="ØªÙˆØ§ØµÙ„ ÙˆØ§ØªØ³Ø§Ø¨"
          aria-label="ØªÙˆØ§ØµÙ„ ÙˆØ§ØªØ³Ø§Ø¨"
        >
          <MessageCircle className="w-5 h-5 shrink-0" />
        </button>
      )}
      <main
        className={`flex-1 min-w-0 flex ${showPulseCheck ? "opacity-0 pointer-events-none select-none" : ""}`}
        aria-hidden={showPulseCheck}
      >
        {screen === "map" && (
          <JourneyTimeline
            isOpen={showJourneyTimeline}
            onClose={() => setShowJourneyTimeline(false)}
            onCardClick={(nodeId) => setSelectedNodeId(nodeId)}
          />
        )}
        <Suspense fallback={<div className="text-sm" style={{ color: "var(--text-muted)" }}>...Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ù…ÙŠÙ„</div>}>
          <div key={screen} className={`flex-1 min-w-0 flex items-center justify-center transition-all duration-300 ease-in-out ${screen === "landing" ? "" : "app-panel-main"}`}>
            {screen === "landing" && (
              <Landing
                onStartJourney={startRecovery}
                onOpenTools={openJourneyTools}
                showTopToolsButton={showTopToolsButton}
                showPostStartContent={!isLockedPhaseOne && isPrivilegedUser}
                showToolsSection={!isLockedPhaseOne}
                onFeatureLocked={setLockedFeature}
                availableFeatures={availableFeatures}
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
                  onBack={() => setScreen("landing")}
                  onContinue={(nextCategory, nextGoalId) => {
                    setWelcome(null);
                    setCategory(nextCategory);
                    setGoalId(nextGoalId);
                    useJourneyState.getState().setLastGoal(nextGoalId, nextCategory);
                    skipNextPulseCheck();
                    setScreen("map");
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
              />
            )}

            {screen === "tools" && (
              <JourneyToolsScreen
                onBack={() => setScreen(toolsBackScreen)}
                onOpenDawayir={openDawayirTool}
                onOpenDawayirSetup={openDawayirSetup}
                onFeatureLocked={setLockedFeature}
                availableFeatures={availableFeatures}
                onOpenGoal={(goalId, category) => {
                  setGoalId(goalId);
                  setCategory(category as AdviceCategory);
                  setScreen("map");
                }}
              />
            )}

            {screen === "guided" && (
              <GuidedJourneyFlow
                onBackToLanding={() => setScreen("landing")}
                onFinishJourney={() => setScreen("map")}
              />
            )}

            {screen === "mission" && missionNodeId && (
              <MissionScreen
                nodeId={missionNodeId}
                onBack={() => setScreen("map")}
              />
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="relative bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto">
              <button
                type="button"
                onClick={() => setShowBaseline(false)}
                className="absolute top-4 left-4 w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors z-10"
                aria-label="Ø¥ØºÙ„Ø§Ù‚"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-2 text-center">
                  Ø§Ù„Ù‚ÙŠØ§Ø³ Ø§Ù„Ø£ÙˆÙ„ÙŠ
                </h2>
                <p className="text-sm text-slate-600 mb-6 text-center">
                  Ø¥Ø¬Ø§Ø¨Ø§Øª Ø³Ø±ÙŠØ¹Ø© Ø¹Ø´Ø§Ù† Ù†Ø¹Ø±Ù Ù†Ù‚Ø·Ø© Ø§Ù„Ø¨Ø¯Ø§ÙŠØ©
                </p>
                <BaselineAssessment
                  onComplete={() => setShowBaseline(false)}
                />
              </div>
              <div className="p-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowBaseline(false)}
                  className="w-full py-2 text-sm text-slate-500 hover:text-slate-700"
                >
                  Ø¥ØºÙ„Ø§Ù‚
                </button>
              </div>
            </div>
          </div>
        )}

        {showJourneyGuideChat && canShowAIChatbot && (
          <AIChatbot
            agentContext={agentContext}
            agentActions={agentActions}
            systemPromptOverride={agentSystemPrompt}
            onOpenBreathing={() => setShowBreathing(true)}
            onNavigateToMap={() => setScreen("map")}
            showLauncher={false}
            defaultOpen
            onRequestClose={() => setShowJourneyGuideChat(false)}
          />
        )}

        {/* Ø²Ø± Ø¥Ø¶Ø§ÙÙŠ Ù„ÙØªØ­ Ø£Ø±Ø´ÙŠÙ Ø§Ù„ÙˆØ¹ÙŠ Ù…Ù† Ø´Ø§Ø´Ø© Ø§Ù„Ù‡Ø¨ÙˆØ· â€” ÙˆØ¶Ø¹ Ø§Ù„ØªØ·ÙˆÙŠØ± ÙÙ‚Ø· */}
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
                setScreen("map");
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
          <NoiseSilencingModal
            isOpen={showNoiseSilencingPulse}
            onClose={() => {
              setShowNoiseSilencingPulse(false);
              if (pendingCocoonAfterNoise) {
                setPendingCocoonAfterNoise(false);
                openCocoonModal("auto");
              }
            }}
            onSessionComplete={() => {
              setShowNoiseSilencingPulse(false);
              if (pendingCocoonAfterNoise) {
                setPendingCocoonAfterNoise(false);
                openCocoonModal("auto");
              }
              setPostNoiseSessionMessage(true);
              setTimeout(() => setPostNoiseSessionMessage(false), 4500);
            }}
          />
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
                  setScreen("map");
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
              <h3 className="text-sm font-bold mb-3" style={{ color: "var(--soft-teal)" }}>
                Ø¨ØµÙŠØ±Ø© Ø§Ù„ÙˆØ¹ÙŠ
              </h3>
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
                  Ù†Ù…Ø·: {consciousnessInsight.underlyingPattern}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </PWAInstallProvider>
  );
}
