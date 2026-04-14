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
  Library,
  Map
} from "lucide-react";
import { useJourneyProgress } from "@/domains/journey";
import { useJourneyState as useJourneyStore } from "@/domains/journey/store/journey.store";
import { useNotificationState } from "@/domains/notifications/store/notification.store";
import { useAppOverlayState } from "@/domains/consciousness/store/overlay.store";
import { useEmergencyState } from "@/domains/admin/store/emergency.store";
import { BreathingOverlay } from '@/modules/exploration/BreathingOverlay';
import { useAchievementState } from "@/domains/gamification/store/achievement.store";
import { useMapState } from '@/modules/map/dawayirIndex';
import type { RecoveryPlanOpenWith } from '@/modules/map/dawayirIndex';
import { analyticsService, AnalyticsEvents } from "@/domains/analytics";
import { trackingService } from "@/domains/journey";
import { HealthBar } from "./HealthBar";
import { TodayTaskStrip } from "@/modules/action/TodayTaskStrip";
import { RecoveryProgressBar } from '@/modules/action/RecoveryProgressBar';
import { guardianCopy } from "@/copy/guardianCopy";
import { mapCopy } from "@/copy/map";
import { getMissionProgressSummary } from "@/utils/missionProgress";
import { getGoalLabel, getLastGoalMeta } from "@/utils/goalLabel";
import { getGoalMeta } from "@/data/goalMeta";
import { useAdminState } from "@/domains/admin/store/admin.store";
import { getEffectiveRoleFromState, useAuthState } from "@/domains/auth/store/auth.store";
import { getEffectiveFeatureAccess, isPrivilegedRole } from "@/utils/featureFlags";
import type { FeatureFlagKey } from "@/config/features";
import { usePWAInstall } from "@/contexts/PWAInstallContext";
import { isUserMode, isRevenueMode } from "@/config/appEnv";
import { runtimeEnv } from "@/config/runtimeEnv";
import { AwarenessSkeleton } from '@/modules/meta/AwarenessSkeleton';
import { assignUrl, getHref, pushUrl } from "@/services/navigation";
import { openInNewTab } from "@/services/clientDom";
import { SovereignActionBar } from '@/modules/action/SovereignActionBar';
import { getJourneyPathBySlug } from "@/utils/journeyPaths";
import { PROTOCOLS } from "./ProtocolEngine";


const NotificationSettings = lazy(() =>
  import("./NotificationSettings").then((m) => ({ default: m.NotificationSettings }))
);
const DataManagement = lazy(() =>
  import("./DataManagement").then((m) => ({ default: m.DataManagement }))
);
const ShareStats = lazy(() =>
  import('@/modules/growth/ShareStats').then((m) => ({ default: m.ShareStats }))
);
const EducationalLibrary = lazy(() =>
  import("@/modules/growth/EducationalLibrary").then((m) => ({ default: m.EducationalLibrary }))
);
const ThemeSettings = lazy(() =>
  import("./ThemeSettings").then((m) => ({ default: m.ThemeSettings }))
);
const Achievements = lazy(() =>
  import("@/modules/growth/Achievements").then((m) => ({ default: m.Achievements }))
);
const SymptomsOverviewModal = lazy(() =>
  import('@/modules/action/SymptomsOverviewModal').then((m) => ({ default: m.SymptomsOverviewModal }))
);
const RecoveryPlanModal = lazy(() =>
  import("@/modules/action/RecoveryPlanModal").then((m) => ({ default: m.RecoveryPlanModal }))
);
const TrackingDashboard = lazy(() =>
  import('@/modules/meta/TrackingDashboard').then((m) => ({ default: m.TrackingDashboard }))
);
const MuteProtocol = lazy(() =>
  import("@/modules/action/MuteProtocol").then((m) => ({ default: m.MuteProtocol }))
);
const ShieldSelector = lazy(() =>
  import("@/modules/action/ShieldSelector").then((m) => ({ default: m.ShieldSelector }))
);
const RadarShield = lazy(() =>
  import("@/modules/exploration/RadarShield").then((m) => ({ default: m.RadarShield }))
);
const ThoughtSniper = lazy(() =>
  import("@/modules/action/ThoughtSniper").then((m) => ({ default: m.ThoughtSniper }))
);
const FastingCapsule = lazy(() =>
  import("@/modules/action/FastingCapsule").then((m) => ({ default: m.FastingCapsule }))
);
const InnerCourt = lazy(() =>
  import('@/modules/meta/InnerCourt').then((m) => ({ default: m.InnerCourt }))
);

import { soundManager } from "@/services/soundManager";
const AtlasDashboard = lazy(() =>
  import('@/modules/meta/AtlasDashboard').then((m) => ({ default: m.AtlasDashboard }))
);
const InsightsLibrary = lazy(() =>
  import("@/modules/growth/InsightsLibrary").then((m) => ({ default: m.InsightsLibrary }))
);
const Goals2025Dashboard = lazy(() =>
  import("@/modules/growth/Goals2025Dashboard").then((m) => ({ default: m.Goals2025Dashboard }))
);
const PersonalProgressDashboard = lazy(() =>
  import("@/modules/exploration/PersonalProgressDashboard").then((m) => ({ default: m.PersonalProgressDashboard }))
);
const WeeklyActionPlanModal = lazy(() =>
  import("@/modules/action/WeeklyActionPlanModal").then((m) => ({ default: m.WeeklyActionPlanModal }))
);
const MonthlyReadingPlanModal = lazy(() =>
  import("@/modules/action/MonthlyReadingPlanModal").then((m) => ({ default: m.MonthlyReadingPlanModal }))
);
const AwarenessGrowthDashboard = lazy(() =>
  import('@/modules/meta/AwarenessGrowthDashboard').then((m) => ({ default: m.AwarenessGrowthDashboard }))
);
const CommunityImpactDashboard = lazy(() =>
  import("@/modules/growth/CommunityImpactDashboard").then((m) => ({ default: m.CommunityImpactDashboard }))
);
const RelationshipAnalysisModal = lazy(() =>
  import("@/modules/exploration/RelationshipAnalysisModal").then((m) => ({ default: m.RelationshipAnalysisModal }))
);
const CircleGrowthDashboard = lazy(() =>
  import('@/modules/meta/CircleGrowthDashboard').then((m) => ({ default: m.CircleGrowthDashboard }))
);
const AdvancedToolsModal = lazy(() =>
  import("@/modules/action/AdvancedToolsModal").then((m) => ({ default: m.AdvancedToolsModal }))
);
const ClassicRecoveryModal = lazy(() =>
  import('@/modules/action/ClassicRecoveryModal').then((m) => ({ default: m.ClassicRecoveryModal }))
);
const ManualPlacementModal = lazy(() =>
  import('@/modules/action/ManualPlacementModal').then((m) => ({ default: m.ManualPlacementModal }))
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
  if (digits.startsWith("020")) digits = digits.slice(1);
  if (digits.startsWith("0") && digits.length === 11) digits = `20${digits.slice(1)}`;
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
  viewingNodeId?: string | null;
  onNoiseSessionComplete?: () => void;
  onOpenProtocol?: () => void;
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
  onNoiseSessionComplete,
  onOpenProtocol
}) => {
  /**
   * Sidebar Sector UI Component
   */
   const SidebarSector: FC<{ title: string; children: React.ReactNode; icon: React.ReactNode; color: string }> = ({ title, children, icon: _icon, color = "teal" }) => (
    <div className="space-y-1 my-5">
      <div className="flex items-center gap-2 px-3 mb-1.5 group/header">
        <div className={`w-1 h-1 rounded-full bg-${color}-500/40 group-hover/header:bg-${color}-400 transition-colors`} />
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500/60 dark:text-white/10 group-hover/header:text-slate-400 dark:group-hover/header:text-white/30 transition-colors">
          {title}
        </span>
      </div>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );

  const SidebarItem: FC<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    active?: boolean;
    color?: string;
    badge?: string | number;
  }> = ({ label, icon, onClick, active, color, badge }) => (
    <button
      type="button"
      onClick={onClick}
      className="ds-sidebar-item"
      data-active={active}
      style={{ "--ds-item-glow-color": color } as any}
    >
      <div className="ds-icon-box">
        {icon}
      </div>
      <span className="truncate flex-1">{label}</span>
      {badge && (
        <span className="ds-badge !text-[10px] !px-1.5 !h-4 opacity-60">
          {badge}
        </span>
      )}
      {active && (
        <motion.div 
          layoutId="sidebar-active-indicator"
          className="absolute left-0 w-1 h-5 rounded-r-full"
          style={{ background: color || "var(--ds-color-primary)" }}
        />
      )}
    </button>
  );

  const setOverlay = useAppOverlayState((state) => state.setOverlay);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
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
  const activeProtocolId = useJourneyStore((s) => s.activeProtocol);
  const activeProtocol = activeProtocolId ? PROTOCOLS[activeProtocolId as keyof typeof PROTOCOLS] : null;

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
  const lastGoalId = useJourneyProgress().goalId;
  const lastGoalCategory = useJourneyProgress().category;
  const lastGoalById = useJourneyProgress().lastGoalById;
  const lastGoalRecord = getLastGoalMeta(lastGoalById, lastGoalId, lastGoalCategory);
  const lastGoalLabel = getGoalLabel(lastGoalRecord?.goalId);
  const [badgePulse, setBadgePulse] = useState(false);
  const lastGoalRef = useRef<string | null>(lastGoalLabel ?? null);
  const isFirstTime = useJourneyProgress().baselineCompletedAt == null;
  const unlockedCount = useAchievementState((s) => s.unlockedIds.length);
  const { isSupported: notificationsSupported, settings: notificationSettings } = useNotificationState();
  const openEmergency = useEmergencyState((s) => s.open);
  const featureFlags = useAdminState((s) => s.featureFlags);
  const betaAccess = useAdminState((s) => s.betaAccess);
  const adminAccess = useAdminState((s) => s.adminAccess);
  const journeyPaths = useAdminState((s) => s.journeyPaths);
  const role = useAuthState(getEffectiveRoleFromState);
  const rawRole = useAuthState((s) => s.role);
  const isOwner = isPrivilegedRole(rawRole) || isPrivilegedRole(role);
  const canShowJourneyToolsEntry = Boolean(onOpenJourneyTools) && isOwner;
  const sanctuaryPath = getJourneyPathBySlug(journeyPaths, "sanctuary");
  const sanctuaryPathTarget = sanctuaryPath?.isActive ? sanctuaryPath.targetScreen : "sanctuary";
  const sanctuaryPathUrl = sanctuaryPathTarget === "sanctuary" ? "/#sanctuary" : "/";

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

  const goalColor = useMemo(() => {
    if (!lastGoalRecord?.goalId) return "var(--ds-color-brand-teal-400)";
    const map: Record<string, string> = {
      love: "#fb7185", 
      family: "#10b981", 
      friends: "#a78bfa", 
      work: "#60a5fa", 
      money: "#f5a623", 
      self: "#14b8a6", 
      unknown: "#94a3b8" 
    };
    return map[lastGoalRecord.goalId] || "var(--ds-color-brand-teal-400)";
  }, [lastGoalRecord]);

  const handleClose = () => setIsMobileSidebarOpen(false);
  const handleOpen = () => setIsMobileSidebarOpen(true);

  const openWhatsAppChat = (placement: "desktop_sidebar" | "mobile_sidebar" | "floating_fab") => {
    if (!whatsAppLink) return;
    analyticsService.track("whatsapp_contact_clicked", { placement });
    openInNewTab(whatsAppLink);
  };

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

  const openWithFeatureGate = (feature: FeatureFlagKey, onAllowed: () => void) => {
    if (!availableFeatures[feature]) {
      onFeatureLocked?.(feature);
      return;
    }
    onAllowed();
  };

  const triggerPwaInstall = () => {
    if (!pwaInstall || !canShowInstallButton) return;
    trackingService.recordFlow("install_clicked");
    void pwaInstall.triggerInstall();
  };

  return (
    <>
      {/* ───── FLOATING P&L / ACTION BAR (MOBILE) ───── */}
      <SovereignActionBar 
        isFloatingMobile 
        viewingNodeId={viewingNode?.id}
        onOpenRecoveryPlan={(nId) => setRecoveryPlanOpenWith({ preselectedNodeId: nId })}
      />

      {/* ───── DESKTOP SIDEBAR ───── */}
      <div
        className="fixed top-0 right-0 z-40 h-full hidden md:flex flex-row-reverse group/sidebar"
        aria-label="القائمة الرئيسية"
      >
        <div className={`h-full w-56 shrink-0 overflow-hidden border-l border-white/10 bg-white/70 dark:bg-[#0B0F19]/60 backdrop-blur-3xl transition-transform duration-300 ${isDesktopSidebarOpen ? "translate-x-0" : "translate-x-full"}`}>
          <aside className="h-full w-full flex flex-col gap-3 py-6 px-4">
            {viewingNode?.analysis && (
              <div className="shrink-0 space-y-1 mb-1">
                <RecoveryProgressBar node={viewingNode} />
                <p className="text-xs font-semibold text-slate-900 dark:text-white text-center truncate px-1" title={viewingNode.label}>
                  {viewingNode.label}
                </p>
              </div>
            )}
            
            <SovereignActionBar viewingNodeId={viewingNode?.id} onOpenRecoveryPlan={(nId) => setRecoveryPlanOpenWith({ preselectedNodeId: nId })} className="mb-4" />
            <TodayTaskStrip onOpenRecoveryPlan={(nodeId) => setRecoveryPlanOpenWith({ preselectedNodeId: nodeId })} />
            
            <div className="flex-1 overflow-y-auto no-scrollbar py-2">
              {/* 1. SECTOR: EXPLORATION (الاستكشاف) */}
              <SidebarSector title="الاستكشاف" icon={<Compass className="w-3.5 h-3.5" />} color="teal">
                <SidebarItem
                  label="الخريطة (فهم الذات)"
                  icon={<Map className="w-4 h-4" />}
                  onClick={() => onOpenDawayir?.()}
                  color={goalColor}
                />
                {activeProtocol && (
                  <SidebarItem
                    label={`بروتوكول: ${activeProtocol.title}`}
                    icon={<Activity className="w-4 h-4" />}
                    onClick={() => onOpenProtocol?.()}
                    color="#10b981"
                    badge="جاري"
                  />
                )}
                <SidebarItem
                  label="الملاذ الآمن"
                  icon={<ShieldCheck className="w-4 h-4" />}
                  onClick={() => pushUrl(sanctuaryPathUrl, { screen: sanctuaryPathTarget })}
                  color={goalColor}
                />
                <SidebarItem
                  label="طوارئ"
                  icon={<AlertCircle className="w-4 h-4" />}
                  onClick={openEmergency}
                  color="#f43f5e"
                />
                <SidebarItem
                  label="مرايا (التوأم الرقمي)"
                  icon={<Sparkles className="w-4 h-4" />}
                  onClick={() => pushUrl("/#maraya", { screen: "maraya" })}
                  color="#a78bfa"
                />
                <SidebarItem
                  label="جلسة خاصة"
                  icon={<CalendarDays className="w-4 h-4" />}
                  onClick={() => pushUrl("/#session-intake", { screen: "session-intake" })}
                  color="#60a5fa"
                />
                <SidebarItem
                  label="لوحة الكوتش"
                  icon={<MessageCircle className="w-4 h-4" />}
                  onClick={() => pushUrl("/#session-console", { screen: "session-console" })}
                  color="#14b8a6"
                />
                <SidebarItem
                  label="أجواء الرحلة"
                  icon={<Wind className="w-4 h-4" />}
                  onClick={() => pushUrl("/#atmosfera", { screen: "atmosfera" })}
                  color="#2dd4bf"
                />
                <SidebarItem
                  label="مسارات"
                  icon={<Compass className="w-4 h-4" />}
                  onClick={() => pushUrl("/#masarat", { screen: "masarat" })}
                  color="#f59e0b"
                />
              </SidebarSector>
            </div>
          </aside>
        </div>

        {/* Desktop Handle */}
        <div
          className={`h-full w-10 shrink-0 flex flex-col justify-center items-center bg-teal-600/40 backdrop-blur-xl text-white border-l border-white/10 cursor-pointer py-4 hover:bg-teal-600/60 transition-colors`}
          onClick={() => setIsDesktopSidebarOpen((current) => !current)}
          title={isDesktopSidebarOpen ? "أغلق محطة الانطلاق" : "افتح محطة الانطلاق"}
        >
          <PanelRightOpen className={`w-5 h-5 transition-transform duration-300 ${isDesktopSidebarOpen ? "rotate-180" : "rotate-0 text-teal-400"}`} />
        </div>
      </div>

      {/* ───── FLOATING WHATSAPP ───── */}
      {whatsAppLink && (
        <button
          type="button"
          title="تواصل عبر واتساب"
          onClick={() => openWhatsAppChat("floating_fab")}
          className="fixed z-30 right-4 md:right-6 bottom-[calc(env(safe-area-inset-bottom)+1rem)] md:bottom-6 inline-flex items-center justify-center rounded-full bg-emerald-600 text-white w-12 h-12 shadow-lg hover:bg-emerald-500 active:scale-95 transition-all"
        >
          <MessageCircle className="w-5 h-5 shrink-0" />
        </button>
      )}

      {/* ───── MOBILE MENU TRIGGER ───── */}
      <button
        type="button"
        title="افتح القائمة"
        onClick={handleOpen}
        className="fixed top-4 right-4 z-40 md:hidden w-11 h-11 flex items-center justify-center rounded-full bg-slate-900/40 backdrop-blur-md border border-white/10 text-slate-400"
      >
        <PanelRightOpen className="w-5 h-5" />
      </button>

      {/* ───── MOBILE SIDEBAR ───── */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-[min(86vw,24rem)] bg-[#0B0F19]/80 backdrop-blur-3xl z-50 md:hidden flex flex-col border-l border-white/10 shadow-2xl"
            >
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <h2 className="text-lg font-bold text-white">محطة الانطلاق</h2>
                <button
                  type="button"
                  title="إغلاق"
                  onClick={handleClose}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                <SidebarSector title="الاستكشاف" icon={<Compass className="w-4 h-4" />} color="teal">
                  <SidebarItem
                    label="الخريطة"
                    icon={<Map className="w-5 h-5" />}
                    onClick={() => { onOpenDawayir?.(); handleClose(); }}
                    color={goalColor}
                  />
                  {activeProtocol && (
                    <SidebarItem
                      label={`بروتوكول: ${activeProtocol.title}`}
                      icon={<Activity className="w-5 h-5" />}
                      onClick={() => { onOpenProtocol?.(); handleClose(); }}
                      color="#10b981"
                      badge="جاري"
                    />
                  )}
                  <SidebarItem
                    label="الملاذ الآمن"
                    icon={<ShieldCheck className="w-5 h-5" />}
                    onClick={() => { pushUrl(sanctuaryPathUrl, { screen: sanctuaryPathTarget }); handleClose(); }}
                    color={goalColor}
                  />
                  {availableFeatures.dawayir_map && (
                    <SidebarItem
                      label="فهم المسافات"
                      icon={<Radar className="w-5 h-5" />}
                      onClick={() => { setShowRadarShield(true); handleClose(); }}
                      color={goalColor}
                    />
                  )}
                  <SidebarItem
                    label="مرايا"
                    icon={<Sparkles className="w-5 h-5" />}
                    onClick={() => { pushUrl("/#maraya", { screen: "maraya" }); handleClose(); }}
                    color="#a78bfa"
                  />
                  <SidebarItem
                    label="جلسة خاصة"
                    icon={<CalendarDays className="w-5 h-5" />}
                    onClick={() => { pushUrl("/#session-intake", { screen: "session-intake" }); handleClose(); }}
                    color="#60a5fa"
                  />
                  <SidebarItem
                    label="لوحة الكوتش"
                    icon={<MessageCircle className="w-5 h-5" />}
                    onClick={() => { pushUrl("/#session-console", { screen: "session-console" }); handleClose(); }}
                    color="#14b8a6"
                  />
                  <SidebarItem
                    label="أجواء الرحلة"
                    icon={<Wind className="w-5 h-5" />}
                    onClick={() => { pushUrl("/#atmosfera", { screen: "atmosfera" }); handleClose(); }}
                    color="#2dd4bf"
                  />
                  <SidebarItem
                    label="مسارات"
                    icon={<Compass className="w-5 h-5" />}
                    onClick={() => { pushUrl("/#masarat", { screen: "masarat" }); handleClose(); }}
                    color="#f59e0b"
                  />
                </SidebarSector>

                <SidebarSector title="العمل والممارسة" icon={<Target className="w-4 h-4" />} color="indigo">
                  <SidebarItem
                    label="رصد الحالة"
                    icon={<ClipboardList className="w-5 h-5" />}
                    onClick={() => { onOpenBaseline(); handleClose(); }}
                    color="#f59e0b"
                  />
                  <SidebarItem
                    label="خطوات الرحلة"
                    icon={<Target className="w-5 h-5" />}
                    onClick={() => { setShowRecoveryPlan(true); handleClose(); }}
                    color="#14b8a6"
                  />
                  <SidebarItem
                    label="أدوات متدرفة"
                    icon={<Sparkles className="w-5 h-5" />}
                    onClick={() => { setShowAdvancedTools(true); handleClose(); }}
                    color="#a78bfa"
                  />
                </SidebarSector>

                <SidebarSector title="السيادة" icon={<ShieldCheck className="w-4 h-4" />} color="slate">
                  <SidebarItem
                    label="الإشعار"
                    icon={<Bell className="w-5 h-5" />}
                    onClick={() => { setShowNotificationSettings(true); handleClose(); }}
                    color="#14b8a6"
                  />
                  <SidebarItem
                    label="المظهر"
                    icon={<Palette className="w-5 h-5" />}
                    onClick={() => { setShowThemeSettings(true); handleClose(); }}
                    color="#64748b"
                  />
                </SidebarSector>
                
                <div className="pt-4 space-y-2">
                  <button
                    onClick={() => { onStartJourney(); handleClose(); }}
                    className="w-full py-4 rounded-2xl bg-teal-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-900/20"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    انطلاق للمهمة
                  </button>
                  <button
                    onClick={() => { openEmergency(); handleClose(); }}
                    className="w-full py-4 rounded-2xl bg-rose-600/10 text-rose-500 border border-rose-500/20 font-bold"
                  >
                    طوارئ
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ───── MODALS & OVERLAYS ───── */}
      <AnimatePresence>
        {showNotificationSettings && (
          <Suspense fallback={<AwarenessSkeleton />}>
            <NotificationSettings isOpen={true} onClose={() => setShowNotificationSettings(false)} />
          </Suspense>
        )}
        {showDataManagement && (
          <Suspense fallback={<AwarenessSkeleton />}>
            <DataManagement isOpen={true} onClose={() => setShowDataManagement(false)} />
          </Suspense>
        )}
        {showShareStats && (
          <Suspense fallback={<AwarenessSkeleton />}>
            <ShareStats isOpen={true} onClose={() => setShowShareStats(false)} />
          </Suspense>
        )}
        {showLibrary && (
          <Suspense fallback={<AwarenessSkeleton />}>
            <EducationalLibrary isOpen={true} onClose={() => setShowLibrary(false)} />
          </Suspense>
        )}
        {showInsightsLibrary && (
          <Suspense fallback={<AwarenessSkeleton />}>
            <InsightsLibrary isOpen={true} onClose={() => setShowInsightsLibrary(false)} />
          </Suspense>
        )}
        {showGoals2025 && (
          <Suspense fallback={<AwarenessSkeleton />}>
            <Goals2025Dashboard isOpen={true} onClose={() => setShowGoals2025(false)} />
          </Suspense>
        )}
        {showPersonalProgress && (
          <Suspense fallback={<AwarenessSkeleton />}>
            <PersonalProgressDashboard isOpen={true} onClose={() => setShowPersonalProgress(false)} />
          </Suspense>
        )}
        {showWeeklyActionPlan && (
          <Suspense fallback={<AwarenessSkeleton />}>
            <WeeklyActionPlanModal isOpen={true} onClose={() => setShowWeeklyActionPlan(false)} />
          </Suspense>
        )}
        {showReadingPlan && (
          <Suspense fallback={<AwarenessSkeleton />}>
            <MonthlyReadingPlanModal isOpen={true} onClose={() => setShowReadingPlan(false)} />
          </Suspense>
        )}
        {showAwarenessGrowth && (
          <Suspense fallback={<AwarenessSkeleton />}>
            <AwarenessGrowthDashboard isOpen={true} onClose={() => setShowAwarenessGrowth(false)} />
          </Suspense>
        )}
        {showCommunityImpact && (
          <Suspense fallback={<AwarenessSkeleton />}>
            <CommunityImpactDashboard isOpen={true} onClose={() => setShowCommunityImpact(false)} />
          </Suspense>
        )}
        {showRelationshipAnalysis && (
          <Suspense fallback={<AwarenessSkeleton />}>
            <RelationshipAnalysisModal isOpen={true} onClose={() => setShowRelationshipAnalysis(false)} />
          </Suspense>
        )}
        {showCircleGrowth && (
          <Suspense fallback={<AwarenessSkeleton />}>
            <CircleGrowthDashboard isOpen={true} onClose={() => setShowCircleGrowth(false)} />
          </Suspense>
        )}
        {showBreathing && (
          <BreathingOverlay onClose={() => setShowBreathing(false)} />
        )}
        {showThemeSettings && (
          <Suspense fallback={<AwarenessSkeleton />}>
            <ThemeSettings isOpen={true} onClose={() => setShowThemeSettings(false)} />
          </Suspense>
        )}
        {showAchievements && (
          <Suspense fallback={<AwarenessSkeleton />}>
            <Achievements onClose={() => setShowAchievements(false)} />
          </Suspense>
        )}
        {showSymptomsOverview && (
          <Suspense fallback={<AwarenessSkeleton />}>
            <SymptomsOverviewModal isOpen={true} onClose={() => setShowSymptomsOverview(false)} />
          </Suspense>
        )}
        {showRecoveryPlan && (
          <Suspense fallback={<AwarenessSkeleton />}>
            <RecoveryPlanModal
              isOpen={true}
              onClose={() => { setShowRecoveryPlan(false); setInitialRecoveryOptions(null); }}
              initialPreselectedNodeId={initialRecoveryOptions?.preselectedNodeId}
              focusTraumaInheritance={initialRecoveryOptions?.focusTraumaInheritance}
            />
          </Suspense>
        )}
        {showTrackingDashboard && (
          <Suspense fallback={<AwarenessSkeleton />}>
            <TrackingDashboard isOpen={true} onClose={() => setShowTrackingDashboard(false)} />
          </Suspense>
        )}
        {showNoiseSilencing && (
          <Suspense fallback={<AwarenessSkeleton />}>
            <MuteProtocol
              isOpen={true}
              onClose={() => setShowNoiseSilencing(false)}
              onSessionComplete={onNoiseSessionComplete}
            />
          </Suspense>
        )}
        {showShieldSelector && (
          <Suspense fallback={<AwarenessSkeleton />}>
            <ShieldSelector isOpen={true} onClose={() => setShowShieldSelector(false)} />
          </Suspense>
        )}
        {showRadarShield && (
          <Suspense fallback={<AwarenessSkeleton />}>
            <RadarShield isOpen={true} onClose={() => setShowRadarShield(false)} />
          </Suspense>
        )}
        {showThoughtSniper && (
          <Suspense fallback={<AwarenessSkeleton />}>
            <ThoughtSniper isOpen={true} onClose={() => setShowThoughtSniper(false)} />
          </Suspense>
        )}
        {showFastingCapsule && (
          <Suspense fallback={<AwarenessSkeleton />}>
            <FastingCapsule isOpen={true} onClose={() => setShowFastingCapsule(false)} />
          </Suspense>
        )}
        {showInnerCourt && (
          <Suspense fallback={<AwarenessSkeleton />}>
            <InnerCourt isOpen={true} onClose={() => setShowInnerCourt(false)} />
          </Suspense>
        )}
        {showAtlasDashboard && (
          <Suspense fallback={<AwarenessSkeleton />}>
            <AtlasDashboard isOpen={true} onClose={() => setShowAtlasDashboard(false)} />
          </Suspense>
        )}
        {showAdvancedTools && (
          <Suspense fallback={<AwarenessSkeleton />}>
            <AdvancedToolsModal isOpen={true} onClose={() => setShowAdvancedTools(false)} />
          </Suspense>
        )}
        {showClassicRecovery && (
          <Suspense fallback={<AwarenessSkeleton />}>
            <ClassicRecoveryModal isOpen={true} onClose={() => setShowClassicRecovery(false)} />
          </Suspense>
        )}
        {showManualPlacement && (
          <Suspense fallback={<AwarenessSkeleton />}>
            <ManualPlacementModal isOpen={true} onClose={() => setShowManualPlacement(false)} />
          </Suspense>
        )}
        {showFeedback && (
          <Suspense fallback={<AwarenessSkeleton />}>
            <FeedbackModal
              isOpen={true}
              onClose={() => setShowFeedback(false)}
              onSubmit={async (payload) => {
                trackingService.recordFlow("feedback_submitted", {
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
      </AnimatePresence>
    </>
  );
};
