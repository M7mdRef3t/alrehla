import type { FC } from "react";
import { Suspense, lazy, useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  ArrowLeft,
  ClipboardList,
  PanelRightOpen,
  X,
  Bell,
  Share2,
  BookOpen,
  Wind,
  AlertCircle,
  Settings,
  Palette,
  Trophy,
  BarChart3,
  MessageCircle,
  Globe,
  Sparkles,
  Layers,
  Move,
  Compass,
  Star,
  ShieldCheck,
  BrainCircuit,
  Radar,
  Scale,
  Crosshair,
  ScrollText,
  Smartphone,
  User,
  Network,
  Heart,
  History,
  Store,
  HeartPulse,
  Activity,
  LineChart,
  HeartHandshake,
  CalendarDays,
  Library
} from "lucide-react";
import { useJourneyState } from "../state/journeyState";
import { useNotificationState } from "../state/notificationState";
import { useAppOverlayState } from "../state/appOverlayState";
import { useEmergencyState } from "../state/emergencyState";
import { BreathingOverlay } from "./BreathingOverlay";
import { useAchievementState } from "../state/achievementState";
import { useMapState } from "../state/mapState";
import type { RecoveryPlanOpenWith } from "../state/mapState";
import { trackEvent, AnalyticsEvents } from "../services/analytics";
import { recordFlowEvent } from "../services/journeyTracking";
import { HealthBar } from "./HealthBar";
import { TodayTaskStrip } from "./TodayTaskStrip";
import { RecoveryProgressBar } from "./RecoveryProgressBar";
import { guardianCopy } from "../copy/guardianCopy";
import { mapCopy } from "../copy/map";
import { getMissionProgressSummary } from "../utils/missionProgress";
import { getGoalLabel, getLastGoalMeta } from "../utils/goalLabel";
import { getGoalMeta } from "../data/goalMeta";
import { useAdminState } from "../state/adminState";
import { getEffectiveRoleFromState, useAuthState } from "../state/authState";
import { getEffectiveFeatureAccess, isPrivilegedRole } from "../utils/featureFlags";
import type { FeatureFlagKey } from "../config/features";
import { usePWAInstall } from "../contexts/PWAInstallContext";
import { isUserMode, isRevenueMode } from "../config/appEnv";
import { runtimeEnv } from "../config/runtimeEnv";
import { AwarenessSkeleton } from "./AwarenessSkeleton";
import { assignUrl, getHref, pushUrl } from "../services/navigation";
import { openInNewTab } from "../services/clientDom";

const NotificationSettings = lazy(() =>
  import("./NotificationSettings").then((m) => ({ default: m.NotificationSettings }))
);
const DataManagement = lazy(() =>
  import("./DataManagement").then((m) => ({ default: m.DataManagement }))
);
const ShareStats = lazy(() =>
  import("./ShareStats").then((m) => ({ default: m.ShareStats }))
);
const EducationalLibrary = lazy(() =>
  import("./EducationalLibrary").then((m) => ({ default: m.EducationalLibrary }))
);
const ThemeSettings = lazy(() =>
  import("./ThemeSettings").then((m) => ({ default: m.ThemeSettings }))
);
const Achievements = lazy(() =>
  import("./Achievements").then((m) => ({ default: m.Achievements }))
);
const SymptomsOverviewModal = lazy(() =>
  import("./SymptomsOverviewModal").then((m) => ({ default: m.SymptomsOverviewModal }))
);
const RecoveryPlanModal = lazy(() =>
  import("./RecoveryPlanModal").then((m) => ({ default: m.RecoveryPlanModal }))
);
const TrackingDashboard = lazy(() =>
  import("./TrackingDashboard").then((m) => ({ default: m.TrackingDashboard }))
);
const MuteProtocol = lazy(() =>
  import("./MuteProtocol").then((m) => ({ default: m.NoiseSilencingModal }))
);
const ShieldSelector = lazy(() =>
  import("./ShieldSelector").then((m) => ({ default: m.ShieldSelector }))
);
const RadarShield = lazy(() =>
  import("./RadarShield").then((m) => ({ default: m.RadarShield }))
);
const ThoughtSniper = lazy(() =>
  import("./ThoughtSniper").then((m) => ({ default: m.ThoughtSniper }))
);
const FastingCapsule = lazy(() =>
  import("./FastingCapsule").then((m) => ({ default: m.FastingCapsule }))
);
const InnerCourt = lazy(() =>
  import("./InnerCourt").then((m) => ({ default: m.InnerCourt }))
);
import { soundManager } from "../services/soundManager";
const AtlasDashboard = lazy(() =>
  import("./AtlasDashboard").then((m) => ({ default: m.AtlasDashboard }))
);
const InsightsLibrary = lazy(() =>
  import("./InsightsLibrary").then((m) => ({ default: m.InsightsLibrary }))
);
const Goals2025Dashboard = lazy(() =>
  import("./Goals2025Dashboard").then((m) => ({ default: m.Goals2025Dashboard }))
);
const PersonalProgressDashboard = lazy(() =>
  import("./PersonalProgressDashboard").then((m) => ({ default: m.PersonalProgressDashboard }))
);
const WeeklyActionPlanModal = lazy(() =>
  import("./WeeklyActionPlanModal").then((m) => ({ default: m.WeeklyActionPlanModal }))
);
const MonthlyReadingPlanModal = lazy(() =>
  import("./MonthlyReadingPlanModal").then((m) => ({ default: m.MonthlyReadingPlanModal }))
);
const AwarenessGrowthDashboard = lazy(() =>
  import("./AwarenessGrowthDashboard").then((m) => ({ default: m.AwarenessGrowthDashboard }))
);
const CommunityImpactDashboard = lazy(() =>
  import("./CommunityImpactDashboard").then((m) => ({ default: m.CommunityImpactDashboard }))
);
const RelationshipAnalysisModal = lazy(() =>
  import("./RelationshipAnalysisModal").then((m) => ({ default: m.RelationshipAnalysisModal }))
);
const CircleGrowthDashboard = lazy(() =>
  import("./CircleGrowthDashboard").then((m) => ({ default: m.CircleGrowthDashboard }))
);
const AdvancedToolsModal = lazy(() =>
  import("./AdvancedToolsModal").then((m) => ({ default: m.AdvancedToolsModal }))
);
const ClassicRecoveryModal = lazy(() =>
  import("./ClassicRecoveryModal").then((m) => ({ default: m.ClassicRecoveryModal }))
);
const ManualPlacementModal = lazy(() =>
  import("./ManualPlacementModal").then((m) => ({ default: m.ManualPlacementModal }))
);
const FeedbackModal = lazy(() =>
  import("./FeedbackModal").then((m) => ({ default: m.FeedbackModal }))
);

const DEFAULT_WHATSAPP_CONTACT = "0201023050092";

function normalizeArabicDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 1776));
}

function normalizeWhatsAppPhone(rawPhone: string): string {
  let digits = normalizeArabicDigits(rawPhone).replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("020")) digits = digits.slice(1); // مثال: 0201... -> 201...
  if (digits.startsWith("0") && digits.length === 11) digits = `20${digits.slice(1)}`; // 01x... -> 201x...
  if (digits.startsWith("2") && digits.length === 12) return digits;
  if (digits.startsWith("20")) return digits;
  return digits;
}

interface AppSidebarProps {
  onOpenGym: () => void;
  onStartJourney: () => void;
  onOpenBaseline: () => void;
  onOpenGuidedJourney: () => void;
  onOpenJourneyTools?: () => void;
  onOpenJourneyTimeline?: () => void;
  onOpenDawayir?: () => void;
  onFeatureLocked?: (feature: FeatureFlagKey) => void;
  onOpenMission?: (nodeId: string) => void;
  /** عند فتح نافذة شخص: نعرض بار المراحل واسمه فوق المحتوى */
  viewingNodeId?: string | null;
  /** يُستدعى عند إتمام جلسة تشويش الإشارة — لعرض رسالة "حمد لله على السلامة" */
  onNoiseSessionComplete?: () => void;
}

export const AppSidebar: FC<AppSidebarProps> = ({
  onOpenGym,
  onStartJourney,
  onOpenBaseline,
  onOpenGuidedJourney,
  onOpenJourneyTools,
  onOpenJourneyTimeline,
  onOpenDawayir,
  onFeatureLocked,
  onOpenMission,
  viewingNodeId = null,
  onNoiseSessionComplete
}) => {
  // ... legacy states
  const setOverlay = useAppOverlayState((state) => state.setOverlay);
  const [isOpen, setIsOpen] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [showShareStats, setShowShareStats] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showInsightsLibrary, setShowInsightsLibrary] = useState(false);
  const [showGoals2025, setShowGoals2025] = useState(false);
  const [showPersonalProgress, setShowPersonalProgress] = useState(false);
  const [showWeeklyActionPlan, setShowWeeklyActionPlan] = useState(false);
  const [showReadingPlan, setShowReadingPlan] = useState(false);
  const [showAwarenessGrowth, setShowAwarenessGrowth] = useState(false);
  const [showCommunityImpact, setShowCommunityImpact] = useState(false);
  const [showRelationshipAnalysis, setShowRelationshipAnalysis] = useState(false);
  const [showCircleGrowth, setShowCircleGrowth] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showSymptomsOverview, setShowSymptomsOverview] = useState(false);
  const [showRecoveryPlan, setShowRecoveryPlan] = useState(false);
  const [showTrackingDashboard, setShowTrackingDashboard] = useState(false);
  const [showNoiseSilencing, setShowNoiseSilencing] = useState(false);
  const [showShieldSelector, setShowShieldSelector] = useState(false);
  const [showRadarShield, setShowRadarShield] = useState(false);
  const [showThoughtSniper, setShowThoughtSniper] = useState(false);
  const [showFastingCapsule, setShowFastingCapsule] = useState(false);
  const [showInnerCourt, setShowInnerCourt] = useState(false);
  const [, setShowGlobalMissions] = useState(false);
  const [showAtlasDashboard, setShowAtlasDashboard] = useState(false);
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);
  const [showClassicRecovery, setShowClassicRecovery] = useState(false);
  const [showManualPlacement, setShowManualPlacement] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [initialRecoveryOptions, setInitialRecoveryOptions] = useState<RecoveryPlanOpenWith | null>(null);
  const whatsAppNumber = runtimeEnv.whatsappContactNumber || DEFAULT_WHATSAPP_CONTACT;
  const whatsAppLink = useMemo(() => {
    const normalized = normalizeWhatsAppPhone(whatsAppNumber);
    if (!normalized) return null;
    return `https://wa.me/${normalized}`;
  }, [whatsAppNumber]);
  const recoveryPlanOpenWith = useMapState((s) => s.recoveryPlanOpenWith);
  const setRecoveryPlanOpenWith = useMapState((s) => s.setRecoveryPlanOpenWith);

  useEffect(() => {
    if (recoveryPlanOpenWith) {
      setInitialRecoveryOptions(recoveryPlanOpenWith);
      setRecoveryPlanOpenWith(null);
      setShowRecoveryPlan(true);
    }
  }, [recoveryPlanOpenWith, setRecoveryPlanOpenWith]);

  const nodes = useMapState((s) => s.nodes);
  const archiveMission = useMapState((s) => s.archiveMission);
  const unarchiveMission = useMapState((s) => s.unarchiveMission);
  const unarchiveNode = useMapState((s) => s.unarchiveNode);
  const archivedNodes = useMemo(() =>
    nodes
      .filter((n) => n.isNodeArchived)
      .sort((a, b) => (b.archivedAt ?? 0) - (a.archivedAt ?? 0)),
    [nodes]
  );
  const activeMissions = useMemo(() => {
    return nodes
      .filter((node) => node.missionProgress?.startedAt && !node.missionProgress?.isCompleted)
      .map((node) => {
        const summary = getMissionProgressSummary(node);
        return summary ? { node, summary } : null;
      })
      .filter((item): item is { node: typeof nodes[number]; summary: NonNullable<ReturnType<typeof getMissionProgressSummary>> } => item != null)
      .sort((a, b) => (b.node.missionProgress?.startedAt ?? 0) - (a.node.missionProgress?.startedAt ?? 0));
  }, [nodes]);
  const completedMissions = useMemo(() => {
    return nodes
      .filter((node) => node.missionProgress?.isCompleted && !node.missionProgress?.isArchived)
      .map((node) => {
        const summary = getMissionProgressSummary(node);
        return summary ? { node, summary } : null;
      })
      .filter((item): item is { node: typeof nodes[number]; summary: NonNullable<ReturnType<typeof getMissionProgressSummary>> } => item != null)
      .sort((a, b) => (b.node.missionProgress?.completedAt ?? 0) - (a.node.missionProgress?.completedAt ?? 0));
  }, [nodes]);
  const archivedMissions = useMemo(() => {
    return nodes
      .filter((node) => node.missionProgress?.isArchived)
      .map((node) => {
        const summary = getMissionProgressSummary(node, { includeArchived: true });
        return summary ? { node, summary } : null;
      })
      .filter((item): item is { node: typeof nodes[number]; summary: NonNullable<ReturnType<typeof getMissionProgressSummary>> } => item != null)
      .sort((a, b) => (b.node.missionProgress?.archivedAt ?? 0) - (a.node.missionProgress?.archivedAt ?? 0));
  }, [nodes]);
  const viewingNode = viewingNodeId ? nodes.find((n) => n.id === viewingNodeId) : null;
  const lastGoalId = useJourneyState((s) => s.goalId);
  const lastGoalCategory = useJourneyState((s) => s.category);
  const lastGoalById = useJourneyState((s) => s.lastGoalById);
  const lastGoalRecord = getLastGoalMeta(lastGoalById, lastGoalId, lastGoalCategory);
  const lastGoalLabel = getGoalLabel(lastGoalRecord?.goalId);
  const lastGoalMeta = getGoalMeta(lastGoalRecord?.goalId);
  const [badgePulse, setBadgePulse] = useState(false);
  const lastGoalRef = useRef<string | null>(lastGoalLabel ?? null);
  const isFirstTime = useJourneyState((s) => s.baselineCompletedAt == null);
  const unlockedCount = useAchievementState((s) => s.unlockedIds.length);
  const { isSupported: notificationsSupported, settings: notificationSettings } = useNotificationState();
  const openEmergency = useEmergencyState((s) => s.open);
  const featureFlags = useAdminState((s) => s.featureFlags);
  const betaAccess = useAdminState((s) => s.betaAccess);
  const adminAccess = useAdminState((s) => s.adminAccess);
  const role = useAuthState(getEffectiveRoleFromState);
  const rawRole = useAuthState((s) => s.role);
  // Use rawRole for privilege checks so admin UI remains visible even when owner is viewing as user
  const isOwner = isPrivilegedRole(rawRole) || isPrivilegedRole(role);
  const canShowJourneyToolsEntry = Boolean(onOpenJourneyTools) && isOwner;
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

  const handleClose = () => setIsOpen(false);
  const openWhatsAppChat = (placement: "desktop_sidebar" | "mobile_sidebar" | "floating_fab") => {
    if (!whatsAppLink) return;
    trackEvent("whatsapp_contact_clicked", { placement });
    openInNewTab(whatsAppLink);
  };
  const handleOpen = () => setIsOpen(true);

  const openAdminDashboard = () => {
    try {
      const next = new URL(getHref());
      next.pathname = "/admin";
      next.search = "";
      pushUrl(next);
    } catch {
      assignUrl("/admin");
    }
  };

  const openCoachDashboard = () => {
    try {
      const next = new URL(getHref());
      next.pathname = "/coach";
      next.search = "";
      pushUrl(next);
    } catch {
      assignUrl("/coach");
    }
  };

  useEffect(() => {
    if (!lastGoalLabel) return;
    if (lastGoalRef.current && lastGoalRef.current !== lastGoalLabel) {
      setBadgePulse(true);
      const t = setTimeout(() => setBadgePulse(false), 700);
      lastGoalRef.current = lastGoalLabel;
      return () => clearTimeout(t);
    }
    lastGoalRef.current = lastGoalLabel;
  }, [lastGoalLabel]);

  const pwaInstall = usePWAInstall();
  const canShowInstallButton = Boolean(pwaInstall?.canShowInstallButton);
  const badgePulseClass = badgePulse ? "animate-bounce" : "";
  const fallbackBadgeClasses =
    "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-200";
  const openWithFeatureGate = (feature: FeatureFlagKey, onAllowed: () => void) => {
    if (!availableFeatures[feature]) {
      onFeatureLocked?.(feature);
      return;
    }
    onAllowed();
  };
  const triggerPwaInstall = () => {
    if (!pwaInstall || !canShowInstallButton) return;
    recordFlowEvent("install_clicked");
    void pwaInstall.triggerInstall();
  };

  return (
    <>
      <div
        className="fixed top-0 right-0 z-40 h-full hidden md:flex flex-row-reverse group/sidebar"
        aria-label="القائمة الرئيسية"
      >
        {/* المحتوى — يظهر بشكل دائم مؤقتاً للتأكد من رؤية المستخدم للزراير */}
        <div className="h-full w-56 shrink-0 overflow-hidden transition-[width] duration-200 ease-out">
          <aside
            className="h-full w-56 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col gap-3 py-6 px-4 min-w-0 visible"
          >
            {viewingNode?.analysis && (
              <div className="shrink-0 space-y-1 mb-1">
                <RecoveryProgressBar node={viewingNode} />
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 text-center truncate px-1" title={viewingNode.label}>
                  {viewingNode.label}
                </p>
              </div>
            )}
            <HealthBar />
            <TodayTaskStrip onOpenRecoveryPlan={(nodeId) => setRecoveryPlanOpenWith({ preselectedNodeId: nodeId })} />
            {canShowJourneyToolsEntry && (
              <button
                type="button"
                onClick={() => onOpenJourneyTools?.()}
                className="w-full flex items-center gap-3 rounded-xl bg-teal-50/80 dark:bg-teal-900/30 text-teal-700 dark:text-teal-200 border border-teal-200 dark:border-teal-700 px-4 py-3 text-sm font-semibold hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-100/70 dark:hover:bg-teal-900/40 transition-all text-right shrink-0 whitespace-nowrap"
                title="الترسانة — معداتك"
              >
                <Compass className="w-5 h-5 shrink-0" />
                الترسانة
              </button>
            )}
            {onOpenJourneyTimeline && !isRevenueMode && (
              <button
                type="button"
                onClick={() => onOpenJourneyTimeline()}
                className="w-full flex items-center gap-3 rounded-xl bg-amber-50/80 dark:bg-amber-900/20 text-amber-700 dark:text-amber-200 border border-amber-200 dark:border-amber-700 px-4 py-3 text-sm font-semibold hover:border-amber-400 dark:hover:border-amber-600 hover:bg-amber-100/70 dark:hover:bg-amber-900/30 transition-all text-right shrink-0 whitespace-nowrap"
                title="سجل العمليات"
              >
                <ScrollText className="w-5 h-5 shrink-0" />
                سجل العمليات
              </button>
            )}
            
            {isOwner && (
              <>
                <div className="w-full h-px bg-slate-200 dark:bg-slate-700 my-2" />
                <p className="text-[10px] uppercase font-bold tracking-widest text-[#f43f5e] mb-1 px-2">معاينة شاشات النتائج</p>
                <button
                  type="button"
                  onClick={() => setShowRelationshipAnalysis(true)}
                  className="w-full flex items-center gap-3 rounded-xl bg-rose-50/80 dark:bg-rose-900/30 text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-600 px-4 py-3 text-sm font-semibold hover:border-rose-400 dark:hover:border-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all text-right shrink-0 whitespace-nowrap"
                  title="Relationship Analysis Modal"
                >
                  <Activity className="w-5 h-5 shrink-0 text-[#f43f5e]" />
                  شاشة Relationship
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdvancedTools(true)}
                  className="w-full flex items-center gap-3 rounded-xl bg-rose-50/80 dark:bg-rose-900/30 text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-600 px-4 py-3 text-sm font-semibold hover:border-rose-400 dark:hover:border-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all text-right shrink-0 whitespace-nowrap"
                  title="Comprehensive Analysis (in Quizzes Hub)"
                >
                  <Scale className="w-5 h-5 shrink-0 text-[#f43f5e]" />
                  شاشة Comprehensive
                </button>
                <button
                  type="button"
                  onClick={() => assignUrl('/weather')}
                  className="w-full flex items-center gap-3 rounded-xl bg-rose-50/80 dark:bg-rose-900/30 text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-600 px-4 py-3 text-sm font-semibold hover:border-rose-400 dark:hover:border-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all text-right shrink-0 whitespace-nowrap"
                  title="Weather Forecast Client"
                >
                  <Wind className="w-5 h-5 shrink-0 text-[#f43f5e]" />
                  شاشة Weather
                </button>
                <div className="w-full h-px bg-slate-200 dark:bg-slate-700 my-2" />

                <button
                  type="button"
                  onClick={openAdminDashboard}
                  className="w-full flex items-center gap-3 rounded-xl bg-slate-50/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-teal-400 dark:hover:border-teal-50 dark:hover:bg-teal-900/30 hover:text-teal-700 dark:hover:text-teal-300 transition-all text-right shrink-0 whitespace-nowrap"
                  title="لوحة التحكم"
                >
                  <ShieldCheck className="w-5 h-5 shrink-0 text-teal-600" />
                  لوحة التحكم
                </button>
                <button
                  type="button"
                  onClick={openCoachDashboard}
                  className="w-full flex items-center gap-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 px-4 py-3 text-sm font-semibold hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all text-right shrink-0 whitespace-nowrap"
                  title="بوابة المعالجين B2B"
                >
                  <BrainCircuit className="w-5 h-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                  بوابة المعالجين
                </button>
              </>
            )}

            {!isRevenueMode && (
              <button
                onClick={() => {
                  setShowGlobalMissions(true);
                }}
                className="flex items-center w-full gap-3 px-4 py-3 text-sm font-bold text-amber-300 transition-colors rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 mb-2 relative group"
              >
                <div className="absolute -inset-0 bg-amber-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Globe className="w-5 h-5 relative z-10" />
                <span className="relative z-10">تحديات الوعي الجماعي</span>
                <span className="relative z-10 mr-auto flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] text-slate-900 font-black">!</span>
              </button>
            )}

            {/* Sovereign Sanctuary Options */}
            <div className="w-full h-px bg-slate-200 dark:bg-slate-700 my-2" />
            <button
              type="button"
              onClick={() => setOverlay("wisdomMatrix", true)}
              className="w-full flex items-center gap-3 rounded-xl bg-slate-50/80 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all text-right shrink-0 whitespace-nowrap"
              title="مصفوفة الحكمة"
            >
              <Library className="w-5 h-5 shrink-0 text-blue-500" />
              مصفوفة الحكمة
            </button>
            <button
              type="button"
              onClick={() => setOverlay("immersionPath", true)}
              className="w-full flex items-center gap-3 rounded-xl bg-slate-50/80 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-all text-right shrink-0 whitespace-nowrap"
              title="مسار الغوص التفصيلي"
            >
              <Layers className="w-5 h-5 shrink-0 text-amber-500" />
              مسار الديتوكس
            </button>
            <button
              type="button"
              onClick={() => setOverlay("vanguardCollective", true)}
              className="w-full flex items-center gap-3 rounded-xl bg-slate-50/80 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all text-right shrink-0 whitespace-nowrap"
              title="الطليعة - المزامنة الثنائية"
            >
              <Network className="w-5 h-5 shrink-0 text-purple-500" />
              مجتمع الثنائي
            </button>
            <div className="w-full h-px bg-slate-200 dark:bg-slate-700 my-2" />

            <button
              type="button"
              onClick={() => onOpenDawayir?.()}
              className="w-full flex items-center gap-3 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-semibold hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-all text-right shrink-0 whitespace-nowrap"
              title="مركز القيادة"
            >
              <Compass className="w-5 h-5 shrink-0 text-teal-600" />
              <span className="flex flex-col items-start leading-tight">
                <span>مركز القيادة</span>
                {lastGoalLabel && (
                  <span
                    className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${lastGoalMeta?.badgeClasses ?? fallbackBadgeClasses} ${badgePulseClass}`}
                  >
                    {lastGoalMeta ? <lastGoalMeta.icon className="w-3 h-3" /> : <Star className="w-3 h-3" />}
                    آخر هدف: {lastGoalLabel}
                  </span>
                )}
              </span>
            </button>

            {availableFeatures.dawayir_map && (
              <button
                type="button"
                onClick={() => setShowRadarShield(true)}
                className="w-full flex items-center gap-3 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-semibold hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-all text-right shrink-0 whitespace-nowrap"
                title="رادار المسافة"
              >
                <Radar className="w-5 h-5 shrink-0" />
                <span className="flex flex-col items-start leading-tight">
                  <span>رادار المسافة</span>
                  <span className="text-[10px] opacity-60 font-normal">تحليل القرب والبعد</span>
                </span>
              </button>
            )}
            {activeMissions.length > 0 && (
              <div className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-3 text-right">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  <span>المدارات النشطة</span>
                  <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5">
                    {activeMissions.length}
                  </span>
                </div>
                <div className="space-y-2 max-h-44 overflow-auto pr-1">
                  {activeMissions.map(({ node, summary }) => (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => onOpenMission?.(node.id)}
                      disabled={!onOpenMission}
                      className="w-full flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50/60 dark:hover:bg-teal-900/30 transition-all disabled:opacity-50"
                    >
                      <div className="flex flex-col items-start text-right min-w-0">
                        <span className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[9rem]">{node.label}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[9rem]">
                          {summary.missionLabel} — {summary.missionGoal}
                        </span>
                      </div>
                      <span className="rounded-full bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200 border border-amber-200 dark:border-amber-800 px-2 py-0.5">
                        {summary.completed}/{summary.total}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {completedMissions.length > 0 && (
              <div className="w-full rounded-xl border border-emerald-200 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-900/20 px-3 py-3 text-right">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-200 mb-2">
                  <span>الملفات المحسومة</span>
                  <span className="rounded-full bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5">
                    {completedMissions.length}
                  </span>
                </div>
                <div className="space-y-2 max-h-40 overflow-auto pr-1">
                  {completedMissions.map(({ node, summary }) => (
                    <div
                      key={node.id}
                      className="w-full flex items-center justify-between gap-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white/70 dark:bg-emerald-900/30 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-200"
                    >
                      <button
                        type="button"
                        onClick={() => onOpenMission?.(node.id)}
                        disabled={!onOpenMission}
                        className="flex flex-col items-start text-right min-w-0 disabled:opacity-50"
                      >
                        <span className="font-semibold truncate max-w-[8rem]">{node.label}</span>
                        <span className="text-[10px] text-emerald-700/80 dark:text-emerald-200/70 truncate max-w-[8rem]">
                          {summary.missionLabel} — {summary.missionGoal}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => archiveMission(node.id)}
                        className="rounded-full border border-emerald-300 dark:border-emerald-700 px-2 py-1 text-[10px] font-semibold hover:bg-emerald-100/70 dark:hover:bg-emerald-800/40"
                      >
                        أرشفة
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {archivedMissions.length > 0 && (
              <div className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 px-3 py-3 text-right">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                  <span>الأرشيف</span>
                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5">
                    {archivedMissions.length}
                  </span>
                </div>
                <div className="space-y-2 max-h-36 overflow-auto pr-1">
                  {archivedMissions.map(({ node, summary }) => (
                    <div
                      key={node.id}
                      className="w-full flex items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/40 px-3 py-2 text-xs text-slate-700 dark:text-slate-200"
                    >
                      <button
                        type="button"
                        onClick={() => onOpenMission?.(node.id)}
                        disabled={!onOpenMission}
                        className="flex flex-col items-start text-right min-w-0 disabled:opacity-50"
                      >
                        <span className="font-semibold truncate max-w-[8rem]">{node.label}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[8rem]">
                          {summary.missionLabel} — {summary.missionGoal}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => unarchiveMission(node.id)}
                        className="rounded-full border border-slate-300 dark:border-slate-600 px-2 py-1 text-[10px] font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/50"
                      >
                        استرجاع
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── محطات عدت — Archived Nodes ── */}
            {archivedNodes.length > 0 && (
              <div className="w-full rounded-xl border border-slate-200/60 dark:border-slate-700/40 bg-slate-50/50 dark:bg-slate-900/20 px-3 py-3 text-right">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                    {mapCopy.archivedSubtitle}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {mapCopy.archivedTitle}
                    </span>
                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                      {archivedNodes.length}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 max-h-40 overflow-auto pr-1">
                  {archivedNodes.map((node) => {
                    const months = node.archivedAt
                      ? Math.floor((Date.now() - (node.archivedAt ?? Date.now())) / (1000 * 60 * 60 * 24 * 30))
                      : 0;
                    return (
                      <div
                        key={node.id}
                        className="w-full flex items-center justify-between gap-2 rounded-lg border border-slate-200/50 dark:border-slate-700/30 bg-white/50 dark:bg-slate-900/30 px-3 py-2 text-xs"
                        style={{ filter: "grayscale(60%) opacity(0.8)", transition: "filter 0.4s ease" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.filter = "grayscale(0%) opacity(1)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.filter = "grayscale(60%) opacity(0.8)"; }}
                      >
                        <div className="flex flex-col items-start text-right min-w-0">
                          <span className="font-semibold truncate max-w-[8rem] text-slate-600 dark:text-slate-300">
                            {node.label}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[8rem]">
                            {mapCopy.archivedDuration(months)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => unarchiveNode(node.id)}
                          className="rounded-full border border-slate-300/60 dark:border-slate-600/40 px-2 py-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-300 dark:hover:border-teal-600 transition-colors"
                        >
                          {mapCopy.archivedRestoreCta}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {isFirstTime && (
              <button
                type="button"
                onClick={onOpenGym}
                className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/40 hover:text-teal-700 dark:hover:text-teal-300 transition-all text-right shrink-0 whitespace-nowrap"
                title="تدرب على سيناريوهات حقيقية قبل ما تبدأ"
              >
                <Target className="w-5 h-5 shrink-0" />
                تجربة سريعة
              </button>
            )}
            <button
              type="button"
              onClick={onStartJourney}
              className="w-full flex items-center gap-3 rounded-xl bg-teal-600 text-white px-4 py-3 text-sm font-semibold hover:bg-teal-700 transition-all text-right shrink-0 whitespace-nowrap"
              title="مهام الميدان"
            >
              <ArrowLeft className="w-5 h-5 shrink-0" />
              انطلاق للمهمة
            </button>
            {!isRevenueMode && (
              <button
                type="button"
                onClick={onOpenGuidedJourney}
                className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/40 hover:text-teal-700 dark:hover:text-teal-300 transition-all text-right shrink-0 whitespace-nowrap"
                title="الرحلة الموجهة خطوة بخطوة"
              >
                <Layers className="w-5 h-5 shrink-0" />
                الرحلة الموجهة
              </button>
            )}
            <button
              type="button"
              onClick={onOpenBaseline}
              className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/40 hover:text-teal-700 dark:hover:text-teal-300 transition-all text-right shrink-0 whitespace-nowrap"
              title="رصد الحالة اللحظية"
            >
              <ClipboardList className="w-5 h-5 shrink-0" />
              رصد الحالة
            </button>
            {notificationsSupported && (
              <button
                type="button"
                onClick={() => setShowNotificationSettings(true)}
                className="w-full flex items-center gap-3 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 px-4 py-3 text-sm font-semibold hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700 transition-all text-right shrink-0 whitespace-nowrap"
                title="إعدادات الإشعارات"
              >
                <Bell className={`w-5 h-5 shrink-0 ${notificationSettings.enabled ? 'text-teal-600' : ''}`} />
                الإشعارات
              </button>
            )}
            {!isRevenueMode && (
              <>
                <button
                  type="button"
                  onClick={() => setShowTrackingDashboard(true)}
                  className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-teal-700 dark:hover:text-teal-300 transition-all text-right shrink-0 whitespace-nowrap"
                  title="رادار المتابعة — مؤشرات التقدم"
                >
                  <BarChart3 className="w-5 h-5 shrink-0" />
                  رادار المتابعة
                </button>
                <button
                  type="button"
                  onClick={() => setShowDataManagement(true)}
                  className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-all text-right shrink-0 whitespace-nowrap"
                  title="الملف الشخصي والبيانات"
                >
                  <User className="w-5 h-5 shrink-0" />
                  الملف الشخصي
                </button>
                <button
                  type="button"
                  onClick={() => setShowThemeSettings(true)}
                  className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-700 dark:hover:text-amber-300 transition-all text-right shrink-0 whitespace-nowrap"
                  title="تخصيص الواجهة"
                >
                  <Settings className="w-5 h-5 shrink-0" />
                  الإعدادات
                </button>
                <button
                  type="button"
                  onClick={() => setShowShareStats(true)}
                  className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-300 transition-all text-right shrink-0 whitespace-nowrap"
                  title="شارك إحصائياتك"
                >
                  <Share2 className="w-5 h-5 shrink-0" />
                  شارك
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => openWithFeatureGate("global_atlas", () => setShowAtlasDashboard(true))}
              className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-700 dark:hover:text-amber-300 transition-all text-right shrink-0 whitespace-nowrap"
              title="لوحة تحكم الأطلس — خريطة الألم، تشريح الأعراض، مختبر الاستعادة"
            >
              <Globe className="w-5 h-5 shrink-0" />
              لوحة الأطلس
            </button>
            <button
              type="button"
              className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-300 transition-all text-right shrink-0 whitespace-nowrap"
              title="شارك إحصائياتك"
            >
              <Share2 className="w-5 h-5 shrink-0" />
              شارك
            </button>
            <button
              type="button"
              onClick={() => {
                trackEvent(AnalyticsEvents.LIBRARY_OPENED);
                setShowLibrary(true);
              }}
              className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-[var(--soft-teal)] dark:hover:border-[var(--soft-teal)] hover:bg-[var(--soft-teal)]/10 dark:hover:bg-[var(--soft-teal)]/30 hover:text-[var(--soft-teal)] dark:hover:text-[var(--soft-teal)] transition-all text-right shrink-0 whitespace-nowrap"
              title="مكتبة المحتوى التعليمي"
            >
              <BookOpen className="w-5 h-5 shrink-0" />
              المكتبة
            </button>
            <button
              type="button"
              onClick={() => {
                setShowInsightsLibrary(true);
              }}
              className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all text-right shrink-0 whitespace-nowrap"
              title="مكتبة الاستبصارات الخاصة بك"
            >
              <ScrollText className="w-5 h-5 shrink-0" />
              مكتبة الاستبصارات
            </button>
            {!isRevenueMode && (
              <button
                type="button"
                onClick={() => {
                  setShowSymptomsOverview(true);
                }}
                className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all text-right shrink-0 whitespace-nowrap"
                title="لوحة تتبع نمو الوعي (نموذج محوسب)"
              >
                <Activity className="w-5 h-5 shrink-0" />
                تحليل الأعراض
              </button>
            )}

            {/* Analytics & Insights Category */}
            <div className="mb-6 border-t border-slate-200 dark:border-slate-800 pt-6">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
                <LineChart className="w-4 h-4" /> التحليلات والإحصائيات
              </h3>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowAwarenessGrowth(true);
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all text-right shrink-0 whitespace-nowrap"
                  title="خريطة الوعي الذاتي التراكمية"
                >
                  <BrainCircuit className="w-5 h-5 shrink-0" />
                  نمو الوعي
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCommunityImpact(true);
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-orange-400 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:text-orange-700 dark:hover:text-orange-300 transition-all text-right shrink-0 whitespace-nowrap"
                  title="إحصائيات التأثير المجتمعي الشاملة"
                >
                  <Globe className="w-5 h-5 shrink-0" />
                  التأثير المجتمعي
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRelationshipAnalysis(true);
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-rose-400 dark:hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-700 dark:hover:text-rose-300 transition-all text-right shrink-0 whitespace-nowrap"
                  title="نتائج وإحصائيات تحليل العلاقات الشامل"
                >
                  <HeartHandshake className="w-5 h-5 shrink-0" />
                  تحليل العلاقات
                </button>
              </div>
            </div>

            {/* Social & Circles */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-3 mb-2">
                <Network className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  التفاعل والمجتمع
                </h3>
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCircleGrowth(true);
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-teal-700 dark:hover:text-teal-300 transition-all text-right shrink-0 whitespace-nowrap"
                  title="تحديات الدائرة الخاصة / نمو الدائرة"
                >
                  <Network className="w-5 h-5 shrink-0" />
                  نمو الدائرة
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOverlay("recoveryPathways", true);
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all text-right shrink-0 whitespace-nowrap"
                  title="مسار التغيير السلوكي"
                >
                  <Compass className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  مسارات التعافي
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOverlay("duoCommunity", true);
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-rose-400 dark:hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-700 dark:hover:text-rose-300 transition-all text-right shrink-0 whitespace-nowrap"
                  title="مجتمع الثنائي / الغرفة النقاشية"
                >
                  <Heart className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
                  مجتمع الثنائي
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOverlay("pastSessionsLog", true);
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all text-right shrink-0 whitespace-nowrap"
                  title="سجل الجلسات السابقة والمراجعات"
                >
                  <History className="w-5 h-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                  سجل الجلسات
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOverlay("rewardStore", true);
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-700 dark:hover:text-amber-300 transition-all text-right shrink-0 whitespace-nowrap"
                  title="متجر المكافآت"
                >
                  <Store className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
                  متجر المكافآت
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOverlay("nudgeToast", true);
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-sky-400 dark:hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/30 hover:text-sky-700 dark:hover:text-sky-300 transition-all text-right shrink-0 whitespace-nowrap"
                  title="تنبيهات التقدم والتشجيع"
                >
                  <HeartPulse className="w-5 h-5 shrink-0 text-sky-600 dark:text-sky-400" />
                  تنبيه تشجيعي
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowGoals2025(true);
              }}
              className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-all text-right shrink-0 whitespace-nowrap"
              title="لوحة الأهداف عام 2025"
            >
              <Target className="w-5 h-5 shrink-0" />
              أهداف 2025
            </button>
            <button
              type="button"
              onClick={() => {
                setShowPersonalProgress(true);
              }}
              className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all text-right shrink-0 whitespace-nowrap"
              title="تتبع التقدم الشهري والسنوي"
            >
              <LineChart className="w-5 h-5 shrink-0" />
              نظرة التقدم
            </button>
            <button
              type="button"
              onClick={() => {
                setShowWeeklyActionPlan(true);
              }}
              className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:text-violet-700 dark:hover:text-violet-300 transition-all text-right shrink-0 whitespace-nowrap"
              title="خطة العمل الأسبوعية والتحدي"
            >
              <CalendarDays className="w-5 h-5 shrink-0" />
              الخطة الأسبوعية
            </button>
            <button
              type="button"
              onClick={() => {
                setShowReadingPlan(true);
              }}
              className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-sky-400 dark:hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/30 hover:text-sky-700 dark:hover:text-sky-300 transition-all text-right shrink-0 whitespace-nowrap"
              title="خطة القراءة الشهرية"
            >
              <Library className="w-5 h-5 shrink-0" />
              خطة القراءة
            </button>
            <button
              type="button"
              onClick={() => { setInitialRecoveryOptions(null); setShowRecoveryPlan(true); }}
              className="w-full flex items-center gap-3 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 px-4 py-3 text-sm font-semibold hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700 transition-all text-right shrink-0 whitespace-nowrap"
              title="خطوات الرحلة — مسار الحماية"
            >
              <Target className="w-5 h-5 shrink-0" />
              خطوات الرحلة
            </button>
            {!isRevenueMode && (
              <button
                type="button"
                onClick={() => setShowThemeSettings(true)}
                className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-700 dark:hover:text-amber-300 transition-all text-right shrink-0 whitespace-nowrap"
                title="تغيير المظهر"
              >
                <Palette className="w-5 h-5 shrink-0" />
                المظهر
              </button>
            )}
            {canShowInstallButton && (
              <button
                type="button"
                onClick={triggerPwaInstall}
                className="w-full flex items-center gap-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 px-4 py-3 text-sm font-semibold hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all text-right shrink-0 whitespace-nowrap"
                title="إضافة التطبيق للشاشة الرئيسية"
              >
                <Smartphone className="w-5 h-5 shrink-0" />
                إضافة للشاشة الرئيسية
              </button>
            )}
            <button
              type="button"
              onClick={() => openWithFeatureGate("internal_boundaries", () => setShowAdvancedTools(true))}
              className="w-full flex items-center gap-3 rounded-xl bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700 px-4 py-3 text-sm font-semibold hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-all text-right shrink-0 whitespace-nowrap"
              title="أدوات متقدمة — أول خطوات + ملاحظات + تدريب"
            >
              <Sparkles className="w-5 h-5 shrink-0" />
              أدوات متقدمة
            </button>
            <button
              type="button"
              onClick={() => openWithFeatureGate("internal_boundaries", () => setShowClassicRecovery(true))}
              className="w-full flex items-center gap-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 px-4 py-3 text-sm font-semibold hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all text-right shrink-0 whitespace-nowrap"
              title="الخطة الكلاسيكية — عرض بديل"
            >
              <ClipboardList className="w-5 h-5 shrink-0" />
              الخطة الكلاسيكية
            </button>
            <button
              type="button"
              onClick={() => openWithFeatureGate("internal_boundaries", () => setShowManualPlacement(true))}
              className="w-full flex items-center gap-3 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 px-4 py-3 text-sm font-semibold hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all text-right shrink-0 whitespace-nowrap"
              title="تحريك الشخص يدويًا بين الدوائر"
            >
              <Move className="w-5 h-5 shrink-0" />
              تحديد الدائرة يدويًا
            </button>
            {!isRevenueMode && (
              <>
                <button
                  type="button"
                  onClick={() => setShowAchievements(true)}
                  className="w-full flex items-center gap-3 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700 px-4 py-3 text-sm font-semibold hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all text-right shrink-0 whitespace-nowrap"
                  title="إنجازاتك"
                >
                  <Trophy className="w-5 h-5 shrink-0" />
                  إنجازاتك
                  {unlockedCount > 0 && (
                    <span className="mr-auto text-xs font-bold bg-amber-200 dark:bg-amber-700 text-amber-900 dark:text-amber-100 rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1.5">
                      {unlockedCount}
                    </span>
                  )}
                </button>
              </>
            )}

            {/* فاصل */}
            <div className="border-t border-slate-200 dark:border-slate-700 my-2" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1 pt-0.5 pb-0.5 text-right" title="أدوات سريعة — تشويش الإشارة، تنفس، مسار الحماية">
              {guardianCopy.inventory}
            </p>
            {/* أزرار الدعم والطوارئ */}
            <button
              type="button"
              onClick={() => {
                recordFlowEvent("feedback_opened");
                setShowFeedback(true);
              }}
              className="w-full flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 px-4 py-3 text-sm font-semibold hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all text-right shrink-0 whitespace-nowrap"
              title="شاركنا رأيك"
            >
              <MessageCircle className="w-5 h-5 shrink-0" />
              شاركنا رأيك
            </button>
            {whatsAppLink && (
              <button
                type="button"
                onClick={() => openWhatsAppChat("desktop_sidebar")}
                className="w-full flex items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 px-4 py-3 text-sm font-semibold hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all"
                title="تواصل واتساب"
              >
                <MessageCircle className="w-5 h-5 shrink-0" />
                <span className="sr-only">تواصل واتساب</span>
              </button>
            )}
            {!isRevenueMode && (
              <>
                <button
                  type="button"
                  onClick={() => setShowNoiseSilencing(true)}
                  className="w-full flex items-center gap-3 rounded-xl bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700 px-4 py-3 text-sm font-semibold hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-all text-right shrink-0 whitespace-nowrap"
                  title="الرادار — كشف المسافة"
                >
                  <Radar className="w-5 h-5 shrink-0" />
                  تفعيل الرادار
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    setShowThoughtSniper(true);
                  }}
                  onMouseEnter={() => soundManager.playHover()}
                  className="w-full flex items-center gap-3 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700 px-4 py-3 text-sm font-semibold hover:border-red-400 dark:hover:border-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all text-right shrink-0 whitespace-nowrap"
                  title="قناص الأفكار — اصطياد الأفكار"
                >
                  <Crosshair className="w-5 h-5 shrink-0" />
                  قناص الأفكار
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    setShowFastingCapsule(true);
                  }}
                  onMouseEnter={() => soundManager.playHover()}
                  className="w-full flex items-center gap-3 rounded-xl bg-slate-100 text-slate-600 border border-slate-300 px-4 py-3 text-sm font-semibold hover:border-teal-500 hover:text-teal-600 hover:bg-white transition-all text-right shrink-0 whitespace-nowrap group"
                  title="كبسولة الصيام"
                >
                  <Layers className="w-5 h-5 shrink-0 group-hover:text-teal-500 transition-colors" />
                  <span className="flex flex-col items-start leading-tight">
                    <span>كبسولة الصيام (Detox)</span>
                    <span className="text-[10px] opacity-60 font-normal">وضع العزل والضوضاء</span>
                  </span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                setShowInnerCourt(true);
              }}
              onMouseEnter={() => soundManager.playHover()}
              className="w-full flex items-center gap-3 rounded-xl bg-slate-800 text-amber-500 border border-slate-700 px-4 py-3 text-sm font-semibold hover:border-amber-500 hover:bg-slate-900 transition-all text-right shrink-0 whitespace-nowrap group"
              title="محكمة الضمير"
            >
              <Scale className="w-5 h-5 shrink-0 group-hover:text-amber-500 transition-colors" />
              <span className="flex flex-col items-start leading-tight">
                <span>محكمة الضمير</span>
                <span className="text-[10px] opacity-60 font-normal">الحكم والفصل</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowShieldSelector(true)}
              className="w-full flex items-center gap-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 px-4 py-3 text-sm font-semibold hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all text-right shrink-0 whitespace-nowrap"
              title="تفعيل الدروع — صد الهجوم"
            >
              <ShieldCheck className="w-5 h-5 shrink-0" />
              تفعيل الدروع
            </button>
            <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mt-4 mb-2">
              الجبهة الداخلية (Stealth)
            </div>

            <button
              type="button"
              title="محكمة الضمير"
            >
              <Scale className="w-5 h-5 shrink-0 group-hover:text-amber-500 transition-colors" />
              <span className="flex flex-col items-start leading-tight">
                <span>محكمة الضمير</span>
                <span className="text-[10px] opacity-60 font-normal">الحكم والفصل</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                trackEvent(AnalyticsEvents.NOISE_SILENCING_OPENED);
                setShowNoiseSilencing(true);
              }}
              className="w-full flex items-center gap-3 rounded-xl bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700 px-4 py-3 text-sm font-semibold hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-all text-right shrink-0 whitespace-nowrap"
              title="تشويش الإشارة — إسكات الضجيج"
            >
              <MessageCircle className="w-5 h-5 shrink-0" />
              تشويش الإشارة
            </button>
            <button
              type="button"
              onClick={() => {
                trackEvent(AnalyticsEvents.BREATHING_USED);
                setShowBreathing(true);
              }}
              className="w-full flex items-center gap-3 rounded-xl bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-700 px-4 py-3 text-sm font-semibold hover:border-sky-400 dark:hover:border-sky-500 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-all text-right shrink-0 whitespace-nowrap"
              title="تمرين تنفس للهدوء"
            >
              <Wind className="w-5 h-5 shrink-0" />
              بروتوكول الهدوء
            </button>
            <button
              type="button"
              onClick={() => {
                trackEvent(AnalyticsEvents.EMERGENCY_USED);
                openEmergency();
              }}
              className="w-full flex items-center gap-3 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-4 py-3 text-sm font-semibold hover:border-rose-400 dark:hover:border-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all text-right shrink-0 whitespace-nowrap"
              title="لحظة ضغط؟ اضغط هنا"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              طوارئ
            </button>
          </aside>
        </div>
        {/* تاب صغير ظاهر دايماً — تحريك الماوس عليه يفتح الشريط */}
        <div
          className="h-full w-10 shrink-0 flex flex-col justify-center items-center bg-teal-600 text-white border-l border-teal-700 cursor-default py-4"
          title="افتح محطة الانطلاق"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <PanelRightOpen className="w-5 h-5" />
          </motion.div>
        </div>
      </div>

      {whatsAppLink && (
        <button
          type="button"
          onClick={() => openWhatsAppChat("floating_fab")}
          className="fixed z-30 right-4 md:right-6 bottom-[calc(env(safe-area-inset-bottom)+1rem)] md:bottom-6 inline-flex items-center justify-center rounded-full bg-emerald-600 text-white w-12 h-12 shadow-lg hover:bg-emerald-500 active:scale-95 transition-all"
          title="تواصل واتساب"
          aria-label="تواصل واتساب"
        >
          <MessageCircle className="w-5 h-5 shrink-0" />
        </button>
      )}

      {/* Mobile Menu Button (Subtle Glassmorphic) */}
      <button
        type="button"
        onClick={handleOpen}
        className="fixed top-[max(env(safe-area-inset-top),1rem)] right-4 z-40 md:hidden w-11 h-11 flex items-center justify-center rounded-full active:scale-95 transition-all duration-300 bg-slate-900/40 backdrop-blur-md border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
        title="افتح محطة الانطلاق"
      >
        <PanelRightOpen className="w-5 h-5 pointer-events-none" />
      </button>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
            />

            {/* Sidebar Content */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-[min(86vw,24rem)] bg-white dark:bg-slate-800 z-50 md:hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">محطة الانطلاق</h2>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all"
                  title="إغلاق"
                >
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
              </div>

              {/* Menu Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isFirstTime && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenGym();
                      handleClose();
                    }}
                    className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/40 hover:text-teal-700 dark:hover:text-teal-300 transition-all text-right"
                  >
                    <Target className="w-6 h-6 shrink-0" />
                    <span>تجربة سريعة</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onStartJourney();
                    handleClose();
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-teal-600 text-white px-4 py-3 text-sm font-semibold active:scale-95 hover:bg-teal-700 dark:hover:bg-teal-600 transition-all text-right"
                >
                  <ArrowLeft className="w-6 h-6 shrink-0" />
                  <span>ابدأ رحلتك</span>
                </button>
                {!isRevenueMode && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenGuidedJourney();
                      handleClose();
                    }}
                    className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/40 hover:text-teal-700 dark:hover:text-teal-300 transition-all text-right"
                  >
                    <Layers className="w-6 h-6 shrink-0" />
                    <span>الرحلة الموجهة</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onOpenBaseline();
                    handleClose();
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/40 hover:text-teal-700 dark:hover:text-teal-300 transition-all text-right"
                >
                  <ClipboardList className="w-6 h-6 shrink-0" />
                  <span>رصد الحالة</span>
                </button>
                {canShowJourneyToolsEntry && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenJourneyTools?.();
                      handleClose();
                    }}
                    className="w-full flex items-center gap-3 rounded-xl bg-teal-50/80 dark:bg-teal-900/30 text-teal-700 dark:text-teal-200 border border-teal-200 dark:border-teal-700 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-100/70 dark:hover:bg-teal-900/40 transition-all text-right"
                  >
                    <Compass className="w-6 h-6 shrink-0" />
                    <span>أدوات الرحلة</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    openAdminDashboard();
                    handleClose();
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-slate-50/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-teal-700 dark:hover:text-teal-300 transition-all text-right"
                  title="لوحة التحكم"
                >
                  <ShieldCheck className="w-6 h-6 shrink-0 text-teal-600" />
                  <span>لوحة التحكم</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    openCoachDashboard();
                    handleClose();
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all text-right"
                  title="بوابة المعالجين B2B"
                >
                  <BrainCircuit className="w-6 h-6 shrink-0 text-indigo-600 dark:text-indigo-400" />
                  <span>بوابة المعالجين</span>
                </button>
                {!isRevenueMode && (
                  <button
                    onClick={() => {
                      setShowGlobalMissions(true);
                      handleClose();
                    }}
                    className="flex items-center w-full gap-3 px-4 py-3 text-sm font-bold text-amber-300 transition-colors rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 mb-2 relative group"
                  >
                    <div className="absolute -inset-0 bg-amber-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Globe className="w-6 h-6 relative z-10" />
                    <span className="relative z-10">تحديات الوعي الجماعي</span>
                    <span className="relative z-10 mr-auto flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] text-slate-900 font-black">!</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onOpenDawayir?.();
                    handleClose();
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-all text-right"
                >
                  <Compass className="w-6 h-6 shrink-0 text-teal-600" />
                  <span className="flex flex-col items-start">
                    افتح غرفة دواير
                    {lastGoalLabel && (
                      <span
                        className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${lastGoalMeta?.badgeClasses ?? fallbackBadgeClasses} ${badgePulseClass}`}
                      >
                        {lastGoalMeta ? <lastGoalMeta.icon className="w-3 h-3" /> : <Star className="w-3 h-3" />}
                        آخر هدف: {lastGoalLabel}
                      </span>
                    )}
                  </span>
                </button>
                {!isRevenueMode && availableFeatures.dawayir_map && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowRadarShield(true);
                      handleClose();
                    }}
                    className="w-full flex items-center gap-3 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-all text-right"
                    title="رادار المسافة"
                  >
                    <Radar className="w-6 h-6 shrink-0" />
                    <span className="flex flex-col items-start leading-tight">
                      <span>رادار المسافة</span>
                      <span className="text-[10px] opacity-60 font-normal">تحليل القرب والبعد</span>
                    </span>
                  </button>
                )}
                {activeMissions.length > 0 && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
                      <span>المدارات النشطة</span>
                      <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5">
                        {activeMissions.length}
                      </span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-auto pr-1">
                      {activeMissions.map(({ node, summary }) => (
                        <button
                          key={node.id}
                          type="button"
                          onClick={() => {
                            onOpenMission?.(node.id);
                            handleClose();
                          }}
                          disabled={!onOpenMission}
                          className="w-full flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50/60 dark:hover:bg-teal-900/30 transition-all disabled:opacity-50"
                        >
                          <div className="flex flex-col items-start text-right min-w-0">
                            <span className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[9rem]">{node.label}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[9rem]">
                              {summary.missionLabel} — {summary.missionGoal}
                            </span>
                          </div>
                          <span className="rounded-full bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200 border border-amber-200 dark:border-amber-800 px-2 py-0.5">
                            {summary.completed}/{summary.total}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {completedMissions.length > 0 && (
                  <div className="rounded-xl border border-emerald-200 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-900/20 p-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-200 mb-2">
                      <span>الملفات المحسومة</span>
                      <span className="rounded-full bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5">
                        {completedMissions.length}
                      </span>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-auto pr-1">
                      {completedMissions.map(({ node, summary }) => (
                        <div
                          key={node.id}
                          className="w-full flex items-center justify-between gap-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white/70 dark:bg-emerald-900/30 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-200"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onOpenMission?.(node.id);
                              handleClose();
                            }}
                            disabled={!onOpenMission}
                            className="flex flex-col items-start text-right min-w-0 disabled:opacity-50"
                          >
                            <span className="font-semibold truncate max-w-[8rem]">{node.label}</span>
                            <span className="text-[10px] text-emerald-700/80 dark:text-emerald-200/70 truncate max-w-[8rem]">
                              {summary.missionLabel} — {summary.missionGoal}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => archiveMission(node.id)}
                            className="rounded-full border border-emerald-300 dark:border-emerald-700 px-2 py-1 text-[10px] font-semibold hover:bg-emerald-100/70 dark:hover:bg-emerald-800/40"
                          >
                            أرشفة
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {archivedMissions.length > 0 && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 p-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                      <span>الأرشيف</span>
                      <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5">
                        {archivedMissions.length}
                      </span>
                    </div>
                    <div className="space-y-2 max-h-36 overflow-auto pr-1">
                      {archivedMissions.map(({ node, summary }) => (
                        <div
                          key={node.id}
                          className="w-full flex items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/40 px-3 py-2 text-xs text-slate-700 dark:text-slate-200"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onOpenMission?.(node.id);
                              handleClose();
                            }}
                            disabled={!onOpenMission}
                            className="flex flex-col items-start text-right min-w-0 disabled:opacity-50"
                          >
                            <span className="font-semibold truncate max-w-[8rem]">{node.label}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[8rem]">
                              {summary.missionLabel} — {summary.missionGoal}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => unarchiveMission(node.id)}
                            className="rounded-full border border-slate-300 dark:border-slate-600 px-2 py-1 text-[10px] font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/50"
                          >
                            استرجاع
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── محطات عدت Mobile ── */}
                {archivedNodes.length > 0 && (
                  <div className="rounded-xl border border-slate-200/60 dark:border-slate-700/40 bg-slate-50/50 dark:bg-slate-900/20 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {mapCopy.archivedSubtitle}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {mapCopy.archivedTitle}
                        </span>
                        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                          {archivedNodes.length}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-auto pr-1">
                      {archivedNodes.map((node) => {
                        const months = node.archivedAt
                          ? Math.floor((Date.now() - (node.archivedAt ?? Date.now())) / (1000 * 60 * 60 * 24 * 30))
                          : 0;
                        return (
                          <div
                            key={node.id}
                            className="w-full flex items-center justify-between gap-2 rounded-lg border border-slate-200/50 dark:border-slate-700/30 bg-white/50 dark:bg-slate-900/30 px-3 py-2 text-xs"
                            style={{ filter: "grayscale(60%) opacity(0.8)", transition: "filter 0.4s ease" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.filter = "grayscale(0%) opacity(1)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.filter = "grayscale(60%) opacity(0.8)"; }}
                          >
                            <div className="flex flex-col items-start text-right min-w-0">
                              <span className="font-semibold truncate max-w-[8rem] text-slate-600 dark:text-slate-300">
                                {node.label}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[8rem]">
                                {mapCopy.archivedDuration(months)}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => { unarchiveNode(node.id); handleClose(); }}
                              className="rounded-full border border-slate-300/60 dark:border-slate-600/40 px-2 py-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-300 dark:hover:border-teal-600 transition-colors"
                            >
                              {mapCopy.archivedRestoreCta}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {notificationsSupported && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotificationSettings(true);
                      handleClose();
                    }}
                    className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/40 hover:text-teal-700 dark:hover:text-teal-300 transition-all text-right"
                  >
                    <Bell className={`w-6 h-6 shrink-0 ${notificationSettings.enabled ? 'text-teal-600 dark:text-teal-400' : ''}`} />
                    <span>الإشعارات</span>
                  </button>
                )}
                {!isRevenueMode && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDataManagement(true);
                        handleClose();
                      }}
                      className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-all text-right"
                    >
                      <User className="w-6 h-6 shrink-0" />
                      <span>الملف الشخصي</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowThemeSettings(true);
                        handleClose();
                      }}
                      className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-700 dark:hover:text-amber-300 transition-all text-right"
                    >
                      <Settings className="w-6 h-6 shrink-0" />
                      <span>الإعدادات</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowShareStats(true);
                        handleClose();
                      }}
                      className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-300 transition-all text-right"
                    >
                      <Share2 className="w-6 h-6 shrink-0" />
                      <span>شارك</span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    trackEvent(AnalyticsEvents.LIBRARY_OPENED);
                    setShowLibrary(true);
                    handleClose();
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-[var(--soft-teal)] dark:hover:border-[var(--soft-teal)] hover:bg-[var(--soft-teal)]/10 dark:hover:bg-[var(--soft-teal)]/30 hover:text-[var(--soft-teal)] dark:hover:text-[var(--soft-teal)] transition-all text-right"
                >
                  <BookOpen className="w-6 h-6 shrink-0" />
                  <span>المكتبة</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowInsightsLibrary(true);
                    handleClose();
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all text-right"
                >
                  <ScrollText className="w-6 h-6 shrink-0" />
                  <span>مكتبة الاستبصارات</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowGoals2025(true);
                    handleClose();
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-all text-right"
                >
                  <Target className="w-6 h-6 shrink-0" />
                  <span>أهداف 2025</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPersonalProgress(true);
                    handleClose();
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all text-right"
                >
                  <LineChart className="w-6 h-6 shrink-0" />
                  <span>نظرة التقدم</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowWeeklyActionPlan(true);
                    handleClose();
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:text-violet-700 dark:hover:text-violet-300 transition-all text-right"
                >
                  <CalendarDays className="w-6 h-6 shrink-0" />
                  <span>الخطة الأسبوعية</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReadingPlan(true);
                    handleClose();
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-sky-400 dark:hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/30 hover:text-sky-700 dark:hover:text-sky-300 transition-all text-right"
                >
                  <Library className="w-6 h-6 shrink-0" />
                  <span>خطة القراءة</span>
                </button>
                {!isRevenueMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowSymptomsOverview(true);
                      handleClose();
                    }}
                    className="w-full flex items-center gap-3 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-purple-400 hover:bg-purple-50 hover:text-purple-700 transition-all text-right"
                  >
                    <ClipboardList className="w-6 h-6 shrink-0" />
                    <span>الأعراض</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setInitialRecoveryOptions(null);
                    setShowRecoveryPlan(true);
                    handleClose();
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/40 hover:text-teal-700 dark:hover:text-teal-300 transition-all text-right"
                >
                  <Target className="w-6 h-6 shrink-0" />
                  <span>خطوات الرحلة</span>
                </button>
                {!isRevenueMode && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        openWithFeatureGate("internal_boundaries", () => setShowAdvancedTools(true));
                        handleClose();
                      }}
                      className="w-full flex items-center gap-3 rounded-xl bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-all text-right"
                    >
                      <Sparkles className="w-6 h-6 shrink-0" />
                      <span>أدوات متقدمة</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        openWithFeatureGate("internal_boundaries", () => setShowClassicRecovery(true));
                        handleClose();
                      }}
                      className="w-full flex items-center gap-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all text-right"
                    >
                      <ClipboardList className="w-6 h-6 shrink-0" />
                      <span>الخطة الكلاسيكية</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        openWithFeatureGate("internal_boundaries", () => setShowManualPlacement(true));
                        handleClose();
                      }}
                      className="w-full flex items-center gap-3 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all text-right"
                    >
                      <Move className="w-6 h-6 shrink-0" />
                      <span>تحديد يدوي</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAchievements(true);
                        handleClose();
                      }}
                      className="w-full flex items-center gap-3 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all text-right"
                    >
                      <Trophy className="w-6 h-6 shrink-0" />
                      <span>إنجازاتك</span>
                      {unlockedCount > 0 && (
                        <span className="mr-auto text-xs font-bold bg-amber-200 dark:bg-amber-700 text-amber-900 dark:text-amber-100 rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1.5">
                          {unlockedCount}
                        </span>
                      )}
                    </button>
                  </>
                )}
                {!isRevenueMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowThemeSettings(true);
                      handleClose();
                    }}
                    className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-700 dark:hover:text-amber-300 transition-all text-right"
                  >
                    <Palette className="w-6 h-6 shrink-0" />
                    <span>المظهر</span>
                  </button>
                )}
                {canShowInstallButton && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerPwaInstall();
                      handleClose();
                    }}
                    className="w-full flex items-center gap-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all text-right"
                    title="إضافة التطبيق للشاشة الرئيسية"
                  >
                    <Smartphone className="w-6 h-6 shrink-0" />
                    <span>إضافة للشاشة الرئيسية</span>
                  </button>
                )}
                {!isRevenueMode && (
                  <button
                    type="button"
                    onClick={() => {
                      openWithFeatureGate("global_atlas", () => setShowAtlasDashboard(true));
                      handleClose();
                    }}
                    className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-700 dark:hover:text-amber-300 transition-all text-right"
                  >
                    <Globe className="w-6 h-6 shrink-0" />
                    <span>لوحة الأطلس</span>
                  </button>
                )}

                {/* فاصل */}
                <div className="border-t border-slate-200 dark:border-slate-700 my-2" />

                {/* أزرار الدعم والطوارئ */}
                <button
                  type="button"
                  onClick={() => {
                    recordFlowEvent("feedback_opened");
                    setShowFeedback(true);
                    handleClose();
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all text-right"
                >
                  <MessageCircle className="w-6 h-6 shrink-0" />
                  <span>شاركنا رأيك</span>
                </button>
                {whatsAppLink && (
                  <button
                    type="button"
                    onClick={() => {
                      openWhatsAppChat("mobile_sidebar");
                      handleClose();
                    }}
                    className="w-full flex items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all"
                  >
                    <MessageCircle className="w-6 h-6 shrink-0" />
                    <span className="sr-only">تواصل واتساب</span>
                  </button>
                )}
                {!isRevenueMode && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setShowShieldSelector(true);
                        handleClose();
                      }}
                      className="w-full flex items-center gap-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all text-right"
                    >
                      <ShieldCheck className="w-6 h-6 shrink-0" />
                      <span>تفعيل الدروع</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        trackEvent(AnalyticsEvents.BREATHING_USED);
                        setShowBreathing(true);
                        handleClose();
                      }}
                      className="w-full flex items-center gap-3 rounded-xl bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-700 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-sky-400 dark:hover:border-sky-500 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-all text-right"
                    >
                      <Wind className="w-6 h-6 shrink-0" />
                      <span>بروتوكول الهدوء</span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    trackEvent(AnalyticsEvents.EMERGENCY_USED);
                    openEmergency();
                    handleClose();
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-rose-400 dark:hover:border-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all text-right"
                >
                  <AlertCircle className="w-6 h-6 shrink-0" />
                  <span>طوارئ</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Notification Settings Modal */}
      {showNotificationSettings && (
        <Suspense fallback={<AwarenessSkeleton />}>
          <NotificationSettings
            isOpen={showNotificationSettings}
            onClose={() => setShowNotificationSettings(false)}
          />
        </Suspense>
      )}

      {/* Data Management Modal */}
      {showDataManagement && (
        <Suspense fallback={<AwarenessSkeleton />}>
          <DataManagement
            isOpen={showDataManagement}
            onClose={() => setShowDataManagement(false)}
          />
        </Suspense>
      )}

      {/* Share Stats Modal */}
      {showShareStats && (
        <Suspense fallback={<AwarenessSkeleton />}>
          <ShareStats
            isOpen={showShareStats}
            onClose={() => setShowShareStats(false)}
          />
        </Suspense>
      )}

      {/* Educational Library Modal */}
      {showLibrary && (
        <Suspense fallback={<AwarenessSkeleton />}>
          <EducationalLibrary
            isOpen={showLibrary}
            onClose={() => setShowLibrary(false)}
          />
        </Suspense>
      )}

      {/* Insights Library Modal */}
      {showInsightsLibrary && (
        <Suspense fallback={<AwarenessSkeleton />}>
          <InsightsLibrary
            isOpen={showInsightsLibrary}
            onClose={() => setShowInsightsLibrary(false)}
          />
        </Suspense>
      )}

      {/* Goals 2025 Dashboard Modal */}
      {showGoals2025 && (
        <Suspense fallback={<AwarenessSkeleton />}>
          <Goals2025Dashboard
            isOpen={showGoals2025}
            onClose={() => setShowGoals2025(false)}
          />
        </Suspense>
      )}

      {/* Personal Progress Dashboard Modal */}
      {showPersonalProgress && (
        <Suspense fallback={<AwarenessSkeleton />}>
          <PersonalProgressDashboard
            isOpen={showPersonalProgress}
            onClose={() => setShowPersonalProgress(false)}
          />
        </Suspense>
      )}

      {/* Weekly Action Plan Modal */}
      {showWeeklyActionPlan && (
        <Suspense fallback={<AwarenessSkeleton />}>
          <WeeklyActionPlanModal
            isOpen={showWeeklyActionPlan}
            onClose={() => setShowWeeklyActionPlan(false)}
          />
        </Suspense>
      )}

      {/* Monthly Reading Plan Modal */}
      {showReadingPlan && (
        <Suspense fallback={<AwarenessSkeleton />}>
          <MonthlyReadingPlanModal
            isOpen={showReadingPlan}
            onClose={() => setShowReadingPlan(false)}
          />
        </Suspense>
      )}

      {/* Awareness Growth Dashboard Modal */}
      {showAwarenessGrowth && (
        <Suspense fallback={<AwarenessSkeleton />}>
          <AwarenessGrowthDashboard
            isOpen={showAwarenessGrowth}
            onClose={() => setShowAwarenessGrowth(false)}
          />
        </Suspense>
      )}

      {/* Community Impact Dashboard Modal */}
      {showCommunityImpact && (
        <Suspense fallback={<AwarenessSkeleton />}>
          <CommunityImpactDashboard
            isOpen={showCommunityImpact}
            onClose={() => setShowCommunityImpact(false)}
          />
        </Suspense>
      )}

      {/* Relationship Analysis Modal */}
      {showRelationshipAnalysis && (
        <Suspense fallback={<AwarenessSkeleton />}>
          <RelationshipAnalysisModal
            isOpen={showRelationshipAnalysis}
            onClose={() => setShowRelationshipAnalysis(false)}
          />
        </Suspense>
      )}

      {/* Circle Growth Dashboard */}
      {showCircleGrowth && (
        <Suspense fallback={<AwarenessSkeleton />}>
          <CircleGrowthDashboard
            isOpen={showCircleGrowth}
            onClose={() => setShowCircleGrowth(false)}
          />
        </Suspense>
      )}

      {/* Breathing Overlay */}
      {showBreathing && (
        <BreathingOverlay onClose={() => setShowBreathing(false)} />
      )}

      {/* Theme Settings Modal */}
      {showThemeSettings && (
        <Suspense fallback={<AwarenessSkeleton />}>
          <ThemeSettings
            isOpen={showThemeSettings}
            onClose={() => setShowThemeSettings(false)}
          />
        </Suspense>
      )}

      {/* Achievements Modal */}
      {showAchievements && (
        <Suspense fallback={<AwarenessSkeleton />}>
          <Achievements onClose={() => setShowAchievements(false)} />
        </Suspense>
      )}

      {/* Symptoms Overview Modal */}
      {showSymptomsOverview && (
        <Suspense fallback={<AwarenessSkeleton />}>
          <SymptomsOverviewModal
            isOpen={showSymptomsOverview}
            onClose={() => setShowSymptomsOverview(false)}
          />
        </Suspense>
      )}

      {/* Recovery Plan Modal */}
      {showRecoveryPlan && (
        <Suspense fallback={<AwarenessSkeleton />}>
          <RecoveryPlanModal
            isOpen={showRecoveryPlan}
            onClose={() => { setShowRecoveryPlan(false); setInitialRecoveryOptions(null); }}
            initialPreselectedNodeId={initialRecoveryOptions?.preselectedNodeId}
            focusTraumaInheritance={initialRecoveryOptions?.focusTraumaInheritance}
          />
        </Suspense>
      )}

      {showTrackingDashboard && (
        <Suspense fallback={<AwarenessSkeleton />}>
          <TrackingDashboard isOpen={showTrackingDashboard} onClose={() => setShowTrackingDashboard(false)} />
        </Suspense>
      )}

      {showNoiseSilencing && (
        <Suspense fallback={<AwarenessSkeleton />}>
          <MuteProtocol
            isOpen={showNoiseSilencing}
            onClose={() => setShowNoiseSilencing(false)}
            onSessionComplete={onNoiseSessionComplete}
          />
        </Suspense>
      )}

      {showShieldSelector && (
        <Suspense fallback={<AwarenessSkeleton />}>
          <ShieldSelector
            isOpen={showShieldSelector}
            onClose={() => setShowShieldSelector(false)}
          />
        </Suspense>
      )}

      {showRadarShield && (
        <Suspense fallback={<AwarenessSkeleton />}>
          <RadarShield
            isOpen={showRadarShield}
            onClose={() => setShowRadarShield(false)}
          />
        </Suspense>
      )}

      {showThoughtSniper && (
        <Suspense fallback={<AwarenessSkeleton />}>
          <ThoughtSniper
            isOpen={showThoughtSniper}
            onClose={() => setShowThoughtSniper(false)}
          />
        </Suspense>
      )}

      {showFastingCapsule && (
        <Suspense fallback={<AwarenessSkeleton />}>
          <FastingCapsule
            isOpen={showFastingCapsule}
            onClose={() => setShowFastingCapsule(false)}
          />
        </Suspense>
      )}

      {showInnerCourt && (
        <Suspense fallback={<AwarenessSkeleton />}>
          <InnerCourt
            isOpen={showInnerCourt}
            onClose={() => setShowInnerCourt(false)}
          />
        </Suspense>
      )}

      {showAtlasDashboard && (
        <Suspense fallback={<AwarenessSkeleton />}>
          <AtlasDashboard
            isOpen={showAtlasDashboard}
            onClose={() => setShowAtlasDashboard(false)}
          />
        </Suspense>
      )}

      {showAdvancedTools && (
        <Suspense fallback={<AwarenessSkeleton />}>
          <AdvancedToolsModal
            isOpen={showAdvancedTools}
            onClose={() => setShowAdvancedTools(false)}
          />
        </Suspense>
      )}

      {showClassicRecovery && (
        <Suspense fallback={<AwarenessSkeleton />}>
          <ClassicRecoveryModal
            isOpen={showClassicRecovery}
            onClose={() => setShowClassicRecovery(false)}
          />
        </Suspense>
      )}

      {showManualPlacement && (
        <Suspense fallback={<AwarenessSkeleton />}>
          <ManualPlacementModal
            isOpen={showManualPlacement}
            onClose={() => setShowManualPlacement(false)}
          />
        </Suspense>
      )}

      {showFeedback && (
        <Suspense fallback={<AwarenessSkeleton />}>
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
    </>
  );
};



