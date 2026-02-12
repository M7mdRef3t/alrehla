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
  Database,
  Share2,
  BookOpen,
  Wind,
  AlertCircle,
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
  ScrollText,
  Smartphone
} from "lucide-react";
import { useJourneyState } from "../state/journeyState";
import { useNotificationState } from "../state/notificationState";
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
import { getMissionProgressSummary } from "../utils/missionProgress";
import { getGoalLabel, getLastGoalMeta } from "../utils/goalLabel";
import { getGoalMeta } from "../data/goalMeta";
import { useAdminState } from "../state/adminState";
import { getEffectiveRoleFromState, useAuthState } from "../state/authState";
import { getEffectiveFeatureAccess, isPrivilegedRole } from "../utils/featureFlags";
import type { FeatureFlagKey } from "../config/features";
import { usePWAInstall } from "../contexts/PWAInstallContext";

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
const NoiseSilencingModal = lazy(() =>
  import("./NoiseSilencingModal").then((m) => ({ default: m.NoiseSilencingModal }))
);
const AtlasDashboard = lazy(() =>
  import("./AtlasDashboard").then((m) => ({ default: m.AtlasDashboard }))
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
  const [isOpen, setIsOpen] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [showShareStats, setShowShareStats] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showSymptomsOverview, setShowSymptomsOverview] = useState(false);
  const [showRecoveryPlan, setShowRecoveryPlan] = useState(false);
  const [showTrackingDashboard, setShowTrackingDashboard] = useState(false);
  const [showNoiseSilencing, setShowNoiseSilencing] = useState(false);
  const [showAtlasDashboard, setShowAtlasDashboard] = useState(false);
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);
  const [showClassicRecovery, setShowClassicRecovery] = useState(false);
  const [showManualPlacement, setShowManualPlacement] = useState(false);
  const [initialRecoveryOptions, setInitialRecoveryOptions] = useState<RecoveryPlanOpenWith | null>(null);
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
  const canShowJourneyToolsEntry = Boolean(onOpenJourneyTools) && isPrivilegedRole(role);
  const availableFeatures = useMemo(
    () =>
      getEffectiveFeatureAccess({
        featureFlags,
        betaAccess,
        role,
        adminAccess,
        isDev: import.meta.env.DEV
      }),
    [featureFlags, betaAccess, role, adminAccess]
  );

  const handleClose = () => setIsOpen(false);
  const handleOpen = () => setIsOpen(true);

  const openAdminDashboard = () => {
    if (typeof window === "undefined") return;
    try {
      const next = new URL(window.location.href);
      next.pathname = "/admin";
      next.search = "";
      window.history.pushState({}, "", next.toString());
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch {
      window.location.assign("/admin");
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

  return (
    <>
      <div
        className="fixed top-0 right-0 z-40 h-full hidden md:flex flex-row-reverse group/sidebar"
        aria-label="القائمة الرئيسية"
      >
        {/* المحتوى — يظهر عند تحريك الماوس على التاب أو الشريط؛ wrapper يمنع ظهور أي جزء عند الإغلاق */}
        <div className="h-full w-0 group-hover/sidebar:w-52 shrink-0 overflow-hidden transition-[width] duration-200 ease-out">
          <aside
            className="h-full w-52 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col gap-2 py-6 px-3 min-w-0 invisible group-hover/sidebar:visible"
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
               title="أدوات الرحلة"
             >
               <Compass className="w-5 h-5 shrink-0" />
               أدوات الرحلة
             </button>
           )}
           {onOpenJourneyTimeline && (
             <button
               type="button"
               onClick={() => onOpenJourneyTimeline()}
               className="w-full flex items-center gap-3 rounded-xl bg-amber-50/80 dark:bg-amber-900/20 text-amber-700 dark:text-amber-200 border border-amber-200 dark:border-amber-700 px-4 py-3 text-sm font-semibold hover:border-amber-400 dark:hover:border-amber-600 hover:bg-amber-100/70 dark:hover:bg-amber-900/30 transition-all text-right shrink-0 whitespace-nowrap"
               title="سجل الرحلة"
             >
               <ScrollText className="w-5 h-5 shrink-0" />
               سجل الرحلة
             </button>
           )}
           <button
             type="button"
             onClick={openAdminDashboard}
             className="w-full flex items-center gap-3 rounded-xl bg-slate-50/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-teal-700 dark:hover:text-teal-300 transition-all text-right shrink-0 whitespace-nowrap"
             title="لوحة التحكم"
           >
             <ShieldCheck className="w-5 h-5 shrink-0 text-teal-600" />
             لوحة التحكم
           </button>
           <button
             type="button"
             onClick={() => onOpenDawayir?.()}
             className="w-full flex items-center gap-3 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-semibold hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-all text-right shrink-0 whitespace-nowrap"
             title="افتح أداة دواير"
          >
            <Compass className="w-5 h-5 shrink-0 text-teal-600" />
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
            title="قائمة الأهداف"
          >
            <ArrowLeft className="w-5 h-5 shrink-0" />
            ابدأ رحلتك
          </button>
          <button
            type="button"
            onClick={onOpenGuidedJourney}
            className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/40 hover:text-teal-700 dark:hover:text-teal-300 transition-all text-right shrink-0 whitespace-nowrap"
            title="الرحلة الموجهة خطوة بخطوة"
          >
            <Layers className="w-5 h-5 shrink-0" />
            الرحلة الموجهة
          </button>
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
            onClick={() => openWithFeatureGate("global_atlas", () => setShowAtlasDashboard(true))}
            className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-700 dark:hover:text-amber-300 transition-all text-right shrink-0 whitespace-nowrap"
            title="لوحة تحكم الأطلس — خريطة الألم، تشريح الأعراض، مختبر الاستعادة"
          >
            <Globe className="w-5 h-5 shrink-0" />
            لوحة الأطلس
          </button>
          <button
            type="button"
            onClick={() => setShowDataManagement(true)}
            className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-all text-right shrink-0 whitespace-nowrap"
            title="تصدير/استيراد البيانات"
          >
            <Database className="w-5 h-5 shrink-0" />
            البيانات
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
          <button
            type="button"
            onClick={() => {
              trackEvent(AnalyticsEvents.LIBRARY_OPENED);
              setShowLibrary(true);
            }}
            className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all text-right shrink-0 whitespace-nowrap"
            title="مكتبة المحتوى التعليمي"
          >
            <BookOpen className="w-5 h-5 shrink-0" />
            المكتبة
          </button>
          <button
            type="button"
            onClick={() => setShowSymptomsOverview(true)}
            className="w-full flex items-center gap-3 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 px-4 py-3 text-sm font-semibold hover:border-purple-400 hover:bg-purple-50 hover:text-purple-700 transition-all text-right shrink-0 whitespace-nowrap"
            title="شوف الأعراض لكل علاقة"
          >
            <ClipboardList className="w-5 h-5 shrink-0" />
            الأعراض
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
          <button
            type="button"
            onClick={() => setShowThemeSettings(true)}
            className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-700 dark:hover:text-amber-300 transition-all text-right shrink-0 whitespace-nowrap"
            title="تغيير المظهر"
          >
            <Palette className="w-5 h-5 shrink-0" />
            المظهر
          </button>
          {pwaInstall?.canShowInstallButton && (
            <button
              type="button"
              onClick={() => {
                recordFlowEvent("install_clicked");
                if (pwaInstall.hasInstallPrompt) void pwaInstall.triggerInstall();
                else pwaInstall.showInstallHint();
              }}
              className="w-full flex items-center gap-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 px-4 py-3 text-sm font-semibold hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all text-right shrink-0 whitespace-nowrap"
              title="تثبيت التطبيق على الجهاز"
            >
              <Smartphone className="w-5 h-5 shrink-0" />
              تثبيت التطبيق
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
          
          {/* فاصل */}
          <div className="border-t border-slate-200 dark:border-slate-700 my-2" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1 pt-0.5 pb-0.5 text-right" title="أدوات سريعة — تشويش الإشارة، تنفس، مسار الحماية">
            {guardianCopy.inventory}
          </p>
          {/* أزرار الدعم والطوارئ */}
          <button
            type="button"
            onClick={() => setShowNoiseSilencing(true)}
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
              useAchievementState.getState().markBreathingUsed();
              setShowBreathing(true);
            }}
            className="w-full flex items-center gap-3 rounded-xl bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-700 px-4 py-3 text-sm font-semibold hover:border-sky-400 dark:hover:border-sky-500 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-all text-right shrink-0 whitespace-nowrap"
            title="تمرين تنفس للهدوء"
          >
            <Wind className="w-5 h-5 shrink-0" />
            ثبّت مكانك
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
          <PanelRightOpen className="w-5 h-5" />
        </div>
      </div>

      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={handleOpen}
        className="fixed top-4 right-4 z-40 md:hidden w-12 h-12 flex items-center justify-center bg-teal-600 text-white rounded-full active:scale-95 transition-transform"
        title="افتح محطة الانطلاق"
      >
        <PanelRightOpen className="w-6 h-6" />
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
              className="fixed top-0 right-0 h-full w-72 bg-white dark:bg-slate-800 z-50 md:hidden flex flex-col"
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
                <button
                  type="button"
                  onClick={() => {
                    setShowDataManagement(true);
                    handleClose();
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-all text-right"
                >
                  <Database className="w-6 h-6 shrink-0" />
                  <span>البيانات</span>
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
                <button
                  type="button"
                  onClick={() => {
                    trackEvent(AnalyticsEvents.LIBRARY_OPENED);
                    setShowLibrary(true);
                    handleClose();
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all text-right"
                >
                  <BookOpen className="w-6 h-6 shrink-0" />
                  <span>المكتبة</span>
                </button>
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
                <button
                  type="button"
                  onClick={() => {
                    setInitialRecoveryOptions(null);
                    setShowRecoveryPlan(true);
                    handleClose();
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700 transition-all text-right"
                >
                  <Target className="w-6 h-6 shrink-0" />
                  <span>خطوات الرحلة</span>
                </button>
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
                {pwaInstall?.canShowInstallButton && (
                  <button
                    type="button"
                    onClick={() => {
                      recordFlowEvent("install_clicked");
                      if (pwaInstall.hasInstallPrompt) void pwaInstall.triggerInstall();
                      else pwaInstall.showInstallHint();
                      handleClose();
                    }}
                    className="w-full flex items-center gap-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all text-right"
                    title="تثبيت التطبيق"
                  >
                    <Smartphone className="w-6 h-6 shrink-0" />
                    <span>تثبيت التطبيق</span>
                  </button>
                )}
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
                  <span>تحديد الدائرة يدويًا</span>
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
                
                {/* فاصل */}
                <div className="border-t border-slate-200 dark:border-slate-700 my-2" />
                
                {/* أزرار الدعم والطوارئ */}
                <button
                  type="button"
                  onClick={() => {
                    setShowNoiseSilencing(true);
                    handleClose();
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-all text-right"
                >
                  <MessageCircle className="w-6 h-6 shrink-0" />
                  <span>تشويش الإشارة</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    trackEvent(AnalyticsEvents.BREATHING_USED);
                    useAchievementState.getState().markBreathingUsed();
                    setShowBreathing(true);
                    handleClose();
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-700 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-sky-400 dark:hover:border-sky-500 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-all text-right"
                >
                  <Wind className="w-6 h-6 shrink-0" />
                  <span>ثبّت مكانك</span>
                </button>
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
        <Suspense fallback={null}>
          <NotificationSettings
            isOpen={showNotificationSettings}
            onClose={() => setShowNotificationSettings(false)}
          />
        </Suspense>
      )}

      {/* Data Management Modal */}
      {showDataManagement && (
        <Suspense fallback={null}>
          <DataManagement
            isOpen={showDataManagement}
            onClose={() => setShowDataManagement(false)}
          />
        </Suspense>
      )}

      {/* Share Stats Modal */}
      {showShareStats && (
        <Suspense fallback={null}>
          <ShareStats
            isOpen={showShareStats}
            onClose={() => setShowShareStats(false)}
          />
        </Suspense>
      )}

      {/* Educational Library Modal */}
      {showLibrary && (
        <Suspense fallback={null}>
          <EducationalLibrary
            isOpen={showLibrary}
            onClose={() => setShowLibrary(false)}
          />
        </Suspense>
      )}

      {/* Breathing Overlay */}
      {showBreathing && (
        <BreathingOverlay onClose={() => setShowBreathing(false)} />
      )}

      {/* Theme Settings Modal */}
      {showThemeSettings && (
        <Suspense fallback={null}>
          <ThemeSettings
            isOpen={showThemeSettings}
            onClose={() => setShowThemeSettings(false)}
          />
        </Suspense>
      )}

      {/* Achievements Modal */}
      {showAchievements && (
        <Suspense fallback={null}>
          <Achievements onClose={() => setShowAchievements(false)} />
        </Suspense>
      )}

      {/* Symptoms Overview Modal */}
      {showSymptomsOverview && (
        <Suspense fallback={null}>
          <SymptomsOverviewModal
            isOpen={showSymptomsOverview}
            onClose={() => setShowSymptomsOverview(false)}
          />
        </Suspense>
      )}

      {/* Recovery Plan Modal */}
      {showRecoveryPlan && (
        <Suspense fallback={null}>
          <RecoveryPlanModal
            isOpen={showRecoveryPlan}
            onClose={() => { setShowRecoveryPlan(false); setInitialRecoveryOptions(null); }}
            initialPreselectedNodeId={initialRecoveryOptions?.preselectedNodeId}
            focusTraumaInheritance={initialRecoveryOptions?.focusTraumaInheritance}
          />
        </Suspense>
      )}

      {showTrackingDashboard && (
        <Suspense fallback={null}>
          <TrackingDashboard isOpen={showTrackingDashboard} onClose={() => setShowTrackingDashboard(false)} />
        </Suspense>
      )}

      {showNoiseSilencing && (
        <Suspense fallback={null}>
          <NoiseSilencingModal
            isOpen={showNoiseSilencing}
            onClose={() => setShowNoiseSilencing(false)}
            onSessionComplete={() => {
              setShowNoiseSilencing(false);
              onNoiseSessionComplete?.();
            }}
          />
        </Suspense>
      )}

      {showAtlasDashboard && (
        <Suspense fallback={null}>
          <AtlasDashboard
            isOpen={showAtlasDashboard}
            onClose={() => setShowAtlasDashboard(false)}
          />
        </Suspense>
      )}

      {showAdvancedTools && (
        <Suspense fallback={null}>
          <AdvancedToolsModal
            isOpen={showAdvancedTools}
            onClose={() => setShowAdvancedTools(false)}
          />
        </Suspense>
      )}

      {showClassicRecovery && (
        <Suspense fallback={null}>
          <ClassicRecoveryModal
            isOpen={showClassicRecovery}
            onClose={() => setShowClassicRecovery(false)}
          />
        </Suspense>
      )}

      {showManualPlacement && (
        <Suspense fallback={null}>
          <ManualPlacementModal
            isOpen={showManualPlacement}
            onClose={() => setShowManualPlacement(false)}
          />
        </Suspense>
      )}
    </>
  );
};
