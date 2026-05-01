import type { ComponentProps, FC } from "react";
import { useState, useEffect, useMemo, useCallback, lazy, Suspense, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import { MapCanvas } from "../map/MapCanvas";
import { FamilyTreeView } from "./FamilyTreeView";
import { ForestView } from "./ForestView";
import { AddPersonModal } from "./AddPersonModal";
import { ViewPersonModal } from "./ViewPersonModal";
import { MeNodeDetails } from "./MeNodeDetails";
import { BreathingOverlay } from "./BreathingOverlay";
import { MapOnboardingOverlay } from "./MapOnboardingOverlay";
import { hasSeenOnboarding } from "@/utils/mapOnboarding";
import { Map, TreeDeciduous, X, Mic, Zap as Sparkles, Eye, EyeOff } from "lucide-react";
import { SafeMotionCircle } from "@/components/ui/SafeSvg";

import { DailyPulseWidget } from "./DailyPulseWidget";
import { GoogleAuthModal } from "./GoogleAuthModal";
import { DailyJournalArchive } from "./DailyJournalArchive";
import { UpgradeScreen } from "./UpgradeScreen";
import { ShadowPulseAlert } from "./ShadowPulseAlert";
import { FloatingActionMenu } from "./FloatingActionMenu";
import { InsightsSidebar } from "./InsightsSidebar";
import { ShareDialog } from "./ShareDialog";
import { WeeklyReportWidget } from "./WeeklyReportWidget";
import { ConsciousnessThread } from "./ConsciousnessThread";
import { ShadowInsightPanel } from "./ShadowInsightPanel";

import { VoicePulseModal } from "./VoicePulseModal";
import { TabNavigation } from "./TabNavigation";
import { LayoutModeSwitcher } from "./LayoutModeSwitcher";
import { useGraphSync } from "@/hooks/useGraphSync";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
import { useLayoutState } from '@/modules/map/dawayirIndex';
import { mapCopy } from "@/copy/map";
import { EditableText } from "./EditableText";
import { useMapState } from '@/modules/map/dawayirIndex';
import { usePulseState } from "@/domains/consciousness/store/pulse.store";
import { useJourneyProgress } from "@/domains/journey";
import { PULSE_DAY_NAMES } from "@/utils/pulseInsights";
import { NextStepCard } from "./NextStepCard";
import type { AdviceCategory } from "@/data/adviceScripts";
import { useAdminState } from "@/domains/admin/store/admin.store";
import { getEffectiveFeatureAccess } from "@/utils/featureFlags";
import { getEffectiveRoleFromState, useAuthState } from "@/domains/auth/store/auth.store";
import type { FeatureFlagKey } from "@/config/features";
import type { NextStepDecisionV1 } from "../recommendation/types";
import { isUserMode } from "@/config/appEnv";
import { runtimeEnv } from "@/config/runtimeEnv";
import { adaptiveLayoutEngine } from "@/ai/adaptiveLayoutEngine";
import { loadSubscription, canSendAIMessage } from "@/services/subscriptionManager";
import { computeTEI } from "@/utils/traumaEntropyIndex";
import { useDailyQuestion } from "@/hooks/useDailyQuestion";
import { getShadowScore } from "@/domains/consciousness/store/shadowPulse.store";
import { deriveRelationshipWeather } from "@/utils/relationshipWeather";
import { deriveContextAtlas, type ContextAtlasKey } from "@/utils/contextAtlas";
import { assignUrl } from "@/services/navigation";
import { getDawayirLiveLaunchHref, getDawayirLivePath } from "@/utils/dawayirLiveJourney";
import { SoulGeometryOverlay } from "./SoulGeometryOverlay";
import { ContextNotePanel } from "./ContextNotePanel";
import { MapAnalyticalPanel, MapOperationalStrip, MapSupportPanel } from "./Map/CoreMapPanels";
import { LanternSwarm } from "./LanternSwarm";
import { LanternInsightModal } from "./LanternInsightModal";
import { subscribeToDawayirSignals } from "@/modules/recommendation/recommendationBus";
import { MapArchitectChat } from "@/modules/dawayir/components/MapArchitectChat";
import { filterNodesByContext } from "@/modules/map/mapUtils";
import { MapHUD } from "./Map/MapHUD";
import { MapTopNav } from "@/modules/dawayir/components/MapTopNav";
import { MapSidebar } from "@/modules/dawayir/components/MapSidebar";
import { MapMetricsBar } from "@/modules/dawayir/components/MapMetricsBar";
import { MapControlDock } from "@/modules/dawayir/components/MapControlDock";
import { Zap as ZapIcon } from "lucide-react";
import { OracleAnalysisModal } from "./OracleAnalysisModal";
import { WeeklyActionPlanModal } from "@/modules/action/WeeklyActionPlanModal";
import { useHafizState, getVerticalResonanceState } from '@/modules/hafiz/store/hafiz.store';

const DawayirCanvas = lazy(() => import("@/modules/dawayir/DawayirCanvas").then(m => ({ default: m.DawayirCanvas })));
const FeelingCheckModal = lazy(() => import("@/modules/dawayir/FeelingCheckModal").then(m => ({ default: m.FeelingCheckModal })));
const EmergencyButton = lazy(() => import("@/modules/dawayir/EmergencyButton").then(m => ({ default: m.EmergencyButton })));
const ActionToolkit = lazy(() => import("@/modules/dawayir/ActionToolkit").then(m => ({ default: m.ActionToolkit })));

import { analyticsService, AnalyticsEvents } from "@/domains/analytics";
import { getGlobalHarmony } from "@/services/globalPulse";
import { supabase, isSupabaseReady } from "@/services/supabaseClient";
import { ViralLoopNudge } from '@/modules/growth/growth/ViralLoopNudge';
import { syncReferralToSupabase } from "@/services/referralEngine";
import { MajazEngine } from "@/services/audio/MajazEngine";

/* 
    CORE MAP SCREEN — Digital Sanctuary
    */

const cosmicFade = {
  hidden: { opacity: 0, scale: 0.96, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { 
      duration: 1.4, 
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      opacity: { duration: 0.8 }
    }
  },
  exit: {
    opacity: 0,
    scale: 1.04,
    filter: "blur(8px)",
    transition: { duration: 0.6, ease: "easeIn" as const }
  }
};



const SovereignBroadcastOverlay: FC<{ message: { message: string; id: string } | null }> = ({ message }) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-[calc(env(safe-area-inset-top)+5.75rem)] md:top-[calc(env(safe-area-inset-top)+6.25rem)] left-1/2 -translate-x-1/2 z-[300] w-full max-w-sm px-4 pointer-events-none"
        >
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-black/60 p-4 shadow-2xl backdrop-blur-2xl ring-1 ring-white/5">
            {/* Ambient Glow */}
            <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-amber-500/20 blur-3xl" />
            
            <div className="relative flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <Sparkles size={22} className="text-amber-500" />
              </div>
              <div className="flex flex-1 flex-col pt-0.5">
                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-500/80">
                  Sovereign Broadcast
                </span>
                <p className="mt-1 text-[13px] font-bold leading-relaxed text-white/90 text-right" dir="rtl">
                  {message.message}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } }
};

function isLegacyUiEnabled(): boolean {
  return false;
}

interface CoreMapScreenProps {
  category: AdviceCategory;
  goalId: string;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onOpenMission?: (nodeId: string) => void;
  onOpenMissionFromAddPerson?: (nodeId: string) => void;
  onOpenBreathing?: () => void;
  journeyMode?: boolean;
  onJourneyComplete?: () => void;
  pulseMode?: "low" | "angry" | "high" | "normal";
  pulseInsight?: { title: string; body: string } | null;
  onOpenCocoon?: () => void;
  suppressLowPulseCocoon?: boolean;
  onOpenNoise?: () => void;
  onOpenChallenge?: () => void;
  challengeLabel?: string | null;
  canUseBasicDiagnosis?: boolean;
  onFeatureLocked?: (feature: FeatureFlagKey) => void;
  nextStepDecision?: NextStepDecisionV1 | null;
  onTakeNextStep?: (decision: NextStepDecisionV1) => void;
  onRefreshNextStep?: () => void;
  onOpenPulse?: () => void;
  onOpenLibrary?: () => void;
  onOpenProfile?: () => void;
  hideBottomDock?: boolean;
}

export const CoreMapScreen: FC<CoreMapScreenProps> = ({
  category,
  goalId,
  selectedNodeId,
  onSelectNode,
  onOpenMission,
  onOpenMissionFromAddPerson,
  onOpenBreathing,
  journeyMode = false,
  onJourneyComplete,
  pulseMode = "normal",
  pulseInsight,
  onOpenCocoon,
  suppressLowPulseCocoon = false,
  onOpenNoise,
  onOpenChallenge,
  challengeLabel,
  canUseBasicDiagnosis = true,
  onFeatureLocked,
  nextStepDecision = null,
  onTakeNextStep,
  onRefreshNextStep,
  onOpenPulse,
  onOpenLibrary,
  onOpenProfile,
  hideBottomDock = false
}) => {
  const router = useRouter();
  useGraphSync();
  useAdaptiveLayout();

  const mode = useLayoutState((s) => s.mode);
  const activeTab = useLayoutState((s) => s.activeTab);
  const journey = useJourneyProgress();
  const mirrorName = journey.mirrorName;

  const [showAddPerson, setShowAddPerson] = useState(false);
  const [segmentedView, setSegmentedView] = useState<"network" | "stability" | "metrics" | "live">("network");
  const [isCloudAuthOpen, setIsCloudAuthOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  
  // Premium HUD states
  const [isHandToolActive, setIsHandToolActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showActionPlan, setShowActionPlan] = useState(false);
  const [showOracleModal, setShowOracleModal] = useState(false);
  const [isLayoutSwitching, setIsLayoutSwitching] = useState(false);

  const hafizMemories = useHafizState(s => s.memories);
  const resonance = useMemo(() => getVerticalResonanceState(hafizMemories), [hafizMemories]);

  const user = useAuthState(s => s.user);
  const role = useAuthState(s => getEffectiveRoleFromState(s));
  const isSovereign = (user?.email === "mohamedsamy@alrehla.app" || role === "owner" || role === "superadmin");

  const isConnected = false;
  const isListening = false;
  const isSpeaking = false;

  const nodes = useMapState((s) => s.nodes);
  const mapType = useMapState((s) => s.mapType);

  useEffect(() => {
    analyticsService.track(AnalyticsEvents.SANCTUARY_LOADED);
    
    // Neural Soundscape Lifecycle
    const shouldPlay = localStorage.getItem('dawayir_ambient_sound') === 'true';
    if (shouldPlay) MajazEngine.startLoop();

    const handleToggle = (e: any) => {
      if (e.detail) MajazEngine.startLoop();
      else MajazEngine.stopLoop();
    };

    window.addEventListener('dawayir_sound_toggle', handleToggle);
    return () => {
      MajazEngine.stopLoop();
      window.removeEventListener('dawayir_sound_toggle', handleToggle);
    };
  }, []);

  const journeyPaths = useAdminState((s) => s.journeyPaths);
  const livePath = useMemo(() => getDawayirLivePath(journeyPaths), [journeyPaths]);

  const handleNodeDropOnAI = useCallback((nodeId: string) => {
    if (!user) {
      analyticsService.track(AnalyticsEvents.AI_ATTEMPT_GUEST);
      setIsCloudAuthOpen(true);
      return;
    }
    if (!canSendAIMessage()) {
      setIsUpgradeOpen(true);
      return;
    }

    const node = nodes.find(n => n.id === nodeId);
    if (!node) {
      if (runtimeEnv.isDev) console.warn("[CoreMapScreen] Node not found for drop:", nodeId);
      return;
    }

    router.push(
      getDawayirLiveLaunchHref(livePath, {
        surface: "map-drop",
        nodeId: node.id,
        nodeLabel: node.label,
        goalId
      })
    );
  }, [goalId, livePath, nodes, user, router]);

  const handleMainDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const openLiveRoute = useCallback(() => {
    console.log("[CoreMapScreen] openLiveRoute executing!");
    if (!user) {
      setIsCloudAuthOpen(true);
      return;
    }
    if (!canSendAIMessage()) {
      setIsUpgradeOpen(true);
      return;
    }
    router.push(
      getDawayirLiveLaunchHref(livePath, {
        surface: "map-fab",
        goalId
      })
    );
  }, [goalId, livePath, user, router]);

  const [showMeCard, setShowMeCard] = useState(false);
  const [showFeelingCheck, setShowFeelingCheck] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [showWeekdayLabelsModal, setShowWeekdayLabelsModal] = useState(false);
  const lastPulse = usePulseState((s) => s.lastPulse);
  const weekdayLabels = usePulseState((s) => s.weekdayLabels);
  const setWeekdayLabel = usePulseState((s) => s.setWeekdayLabel);
  const [legendTooltip, setLegendTooltip] = useState<"green" | "yellow" | "red" | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "tree">("map");
  const [galaxyMode, setGalaxyMode] = useState(false);
  const [showVoicePulse, setShowVoicePulse] = useState(false);
  const [galaxySubView, setGalaxySubView] = useState<"map" | "forest">("map");
  const [selectedContexts, setSelectedContexts] = useState<ContextAtlasKey[]>(["family", "work", "love", "general"]);
  const [showSoulGeometry, setShowSoulGeometry] = useState(false);
  const [isSacredIsolation, setIsSacredIsolation] = useState(false);
  const [harmony, setHarmony] = useState(getGlobalHarmony());
  const [sovereignMessage, setSovereignMessage] = useState<{ message: string; id: string } | null>(null);
  
  const [isHudVisible, setIsHudVisible] = useState(true);
  const [isHudPinned, setIsHudPinned] = useState(false);
  
  useEffect(() => {
    const timer = setInterval(() => setHarmony(getGlobalHarmony()), 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isSupabaseReady || !supabase) return;

    const channel = supabase
      .channel("sovereign_broadcasts")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "system_settings", filter: "key=eq.sovereign_broadcast" },
        (payload) => {
          if (payload.new && payload.new.value && typeof payload.new.value === "object") {
            const data = payload.new.value as { message: string; id: string };
            setSovereignMessage(data);
            setTimeout(() => setSovereignMessage(null), 8000);
          }
        }
      )
      .subscribe();

    return () => {
      if (supabase) void supabase.removeChannel(channel);
    };
  }, []);

  const [architectChatContext, setArchitectChatContext] = useState<{message: string} | null>(null);

  useEffect(() => {
    return subscribeToDawayirSignals((event) => {
      if (event.type === "ring_changed" && event.payload) {
        const { fromRing, toRing } = event.payload as any;
        const ringAr = {
          green: "الأخضر (القريب)",
          yellow: "الأصفر (المحايد)",
          red: "الأحمر (الخطر)"
        };
        const fromAr = ringAr[fromRing as keyof typeof ringAr] || fromRing;
        const toAr = ringAr[toRing as keyof typeof ringAr] || toRing;
        const node = useMapState.getState().nodes.find(n => n.id === event.nodeId);
        const nodeName = node?.label || "هذا الشخص";

        setArchitectChatContext({
          message: `لحظت إنك نقلت "${nodeName}" من المدار ${fromAr} إلى المدار ${toAr}.. تحب نتكلم عن إيه اللي اتغير في طاقتك ناحيته؟`
        });
      }
    });
  }, []);

  const isFamily = goalId === "family";
  const featureFlags = useAdminState((s) => s.featureFlags);
  const betaAccess = useAdminState((s) => s.betaAccess);
  const adminAccess = useAdminState((s) => s.adminAccess);
  const featureAccess = getEffectiveFeatureAccess({
    featureFlags,
    betaAccess,
    role,
    adminAccess,
    isDev: !isUserMode && runtimeEnv.isDev
  });
  const canUseFamilyTree = featureAccess.family_tree;
  const canUseMirror = featureAccess.mirror_tool;
  const canUseGalaxyView = featureAccess.global_atlas;
  const canUseFamilyTreeView = canUseFamilyTree;

  const toggleContext = (ctx: ContextAtlasKey) => {
    setSelectedContexts((prev) =>
      prev.includes(ctx) ? prev.filter((c) => c !== ctx) : [...prev, ctx]
    );
  };
  const showPlacementTooltip = useMapState((s) => s.showPlacementTooltip);
  const lastAddedNodeId = useMapState((s) => s.lastAddedNodeId);
  const dismissPlacementTooltip = useMapState((s) => s.dismissPlacementTooltip);
  const activeNodes = useMemo(() => {
    // Standardized filtering using shared utility
    const filtered = filterNodesByContext(nodes, goalId, galaxyMode ? [] : null); // Adjust galaxy goal ids if needed
    const active = filtered.filter((n) => !n.isNodeArchived);
    return active;
  }, [nodes, goalId, galaxyMode]);

  const archivedNodes = useMemo(() => {
    const filtered = filterNodesByContext(nodes, goalId, galaxyMode ? [] : null);
    return filtered.filter((n) => n.isNodeArchived);
  }, [nodes, goalId, galaxyMode]);
  const [showOnboarding, setShowOnboarding] = useState(() => activeNodes.length === 0 && !hasSeenOnboarding() && !journeyMode);
  const lastAddedNode = lastAddedNodeId ? nodes.find((node) => node.id === lastAddedNodeId) ?? null : null;

  useEffect(() => {
    if (user?.email) {
      void syncReferralToSupabase(user.email);
    }
  }, [user?.email]);

  const showViralNudge = useMemo(() => {
    return nodes.length >= 4 && !showOnboarding && !journeyMode && !showAddPerson;
  }, [nodes.length, showOnboarding, journeyMode, showAddPerson]);

  const [showDashboard, setShowDashboard] = useState(false);
  const [voiceTrigger, setVoiceTrigger] = useState<{
    event: "shadow_insight" | "milestone_unlocked" | "high_impact_action";
    context: Record<string, unknown>;
  } | undefined>();
  const [showJournalArchive, setShowJournalArchive] = useState(false);
  const greenNodes = useMemo(() => activeNodes.filter((n) => n.ring === "green" && !n.isDetached), [activeNodes]);
  const relationshipWeather = useMemo(
    () => deriveRelationshipWeather(nodes, lastPulse?.energy ?? null),
    [lastPulse?.energy, nodes]
  );
  const contextAtlas = useMemo(() => deriveContextAtlas(nodes), [nodes]);

  const { hasAnsweredToday } = useDailyQuestion();
  const teiResult = useMemo(() => computeTEI(nodes), [nodes]);
  const tei = teiResult.score;

  useEffect(() => {
    if (isHudPinned) return;
    setIsHudVisible(true);
    const t = setTimeout(() => {
      setIsHudVisible(false);
    }, 8000);
    return () => clearTimeout(t);
  }, [nodes, tei, isHudPinned]);

  const shadowScore = useMemo(() => getShadowScore(), []);

  // ── Real Metrics Computation (replacing hardcoded values) ──
  const mapMetrics = useMemo(() => {
    // 🔋 Energy: from lastPulse (1-10 scale → 0-100)
    const rawEnergy = lastPulse?.energy ?? 5; // default mid if no pulse
    const energy = Math.round(rawEnergy * 10); // 1-10 → 10-100

    // 🛡️ Boundaries: ratio of safe (green) nodes to total active nodes
    const totalActive = activeNodes.length;
    const greenCount = activeNodes.filter(n => n.ring === "green" && !n.isDetached).length;
    const redCount = activeNodes.filter(n => n.ring === "red" && !n.isDetached).length;
    const boundaries = totalActive > 0
      ? Math.round(((greenCount / totalActive) * 0.7 + ((totalActive - redCount) / Math.max(totalActive, 1)) * 0.3) * 100)
      : 50; // default if no nodes

    // 👁️ Clarity: inverted TEI score (TEI = chaos, clarity = peace)
    const clarity = Math.max(0, 100 - teiResult.score);

    return { energy, boundaries, clarity };
  }, [lastPulse?.energy, activeNodes, teiResult.score]);

  // 🪜 Journey Steps: how many nodes have analysis completed
  const journeySteps = useMemo(() => {
    const totalActive = activeNodes.length;
    const analyzedCount = activeNodes.filter(n => n.analysis != null).length;
    // Milestones: 1 for adding nodes, 1 for each analyzed, capped at meaningful number
    const milestones = Math.min(totalActive > 0 ? 5 : 0, 5); // max 5 steps
    const completed = totalActive === 0 ? 0 : Math.min(
      (totalActive >= 1 ? 1 : 0) + // step 1: added at least 1 person
      (totalActive >= 3 ? 1 : 0) + // step 2: added 3+ people
      (analyzedCount >= 1 ? 1 : 0) + // step 3: diagnosed at least 1
      (analyzedCount >= totalActive * 0.5 ? 1 : 0) + // step 4: diagnosed half
      (analyzedCount >= totalActive ? 1 : 0), // step 5: diagnosed all
      milestones
    );
    return { current: completed, total: milestones };
  }, [activeNodes]);
  const sessionDuration = useMemo(() => {
    const sessionStart = parseInt(
      sessionStorage.getItem("dawayir-session-start") || String(Date.now())
    );
    return Math.floor((Date.now() - sessionStart) / (60 * 1000));
  }, []);

  // ─── Data-Driven Cinematic Engine (Parallax & Depth) ───
  const dataWeight = useMemo(() => Math.max(1, nodes.length * 0.12), [nodes.length]);
  
  const globalMouseX = useMotionValue(0);
  const globalMouseY = useMotionValue(0);

  const handleGlobalMouseMove = useCallback((e: React.MouseEvent) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    globalMouseX.set((e.clientX - cx) / (20 * dataWeight));
    globalMouseY.set((e.clientY - cy) / (20 * dataWeight));
  }, [globalMouseX, globalMouseY, dataWeight]);

  const gridX = useSpring(useTransform(globalMouseX, x => -x * 1.5), { stiffness: 45, damping: 20 });
  const gridY = useSpring(useTransform(globalMouseY, y => -y * 1.5), { stiffness: 45, damping: 20 });
  const nebulaX = useSpring(useTransform(globalMouseX, x => -x * 0.3), { stiffness: 10, damping: 40 });
  const nebulaY = useSpring(useTransform(globalMouseY, y => -y * 0.3), { stiffness: 10, damping: 40 });

  const gridRotateX = useMemo(() => {
    const angle = 45 + Math.min((tei / 100) * 35, 35);
    return `${angle}deg`;
  }, [tei]);

  const nebulaPalette = useMemo(() => {
    if (pulseMode === "angry") return { c1: "rgba(225,29,72,0.15)", c2: "rgba(159,18,57,0.1)", c3: "rgba(244,63,94,0.05)" };
    if (pulseMode === "low") return { c1: "rgba(71,85,105,0.15)", c2: "rgba(30,41,59,0.1)", c3: "rgba(148,163,184,0.05)" };
    return { c1: "rgba(20,184,166,0.08)", c2: "rgba(79,70,229,0.05)", c3: "rgba(245,158,11,0.04)" };
  }, [pulseMode]);
  // ────────────────────────────────────────────────────────

  const adaptiveLayout = useMemo(
    () =>
      adaptiveLayoutEngine.calculateLayout({
        nodes,
        tei,
        shadowScore,
        pulseMode,
        hasAnsweredToday,
        sessionDuration,
        journeyMode,
      }),
    [nodes, tei, shadowScore, pulseMode, hasAnsweredToday, sessionDuration, journeyMode]
  );

  const sectionOrder = useMemo(
    () => adaptiveLayoutEngine.getSectionOrder(adaptiveLayout.sections),
    [adaptiveLayout.sections]
  );

  useEffect(() => {
    if (!showPlacementTooltip) return;
    const t = setTimeout(dismissPlacementTooltip, 5000);
    return () => clearTimeout(t);
  }, [showPlacementTooltip, dismissPlacementTooltip]);

  useEffect(() => {
    if (activeNodes.length > 0 && showOnboarding) setShowOnboarding(false);
  }, [activeNodes.length, showOnboarding]);

  useEffect(() => {
    if (!canUseGalaxyView && galaxySubView === "forest") setGalaxySubView("map");
  }, [canUseGalaxyView, galaxySubView]);

  useEffect(() => {
    if (!canUseFamilyTreeView && viewMode === "tree") setViewMode("map");
  }, [canUseFamilyTreeView, viewMode]);

  useEffect(() => {
    if (!selectedNodeId || canUseBasicDiagnosis) return;
    onFeatureLocked?.("basic_diagnosis");
    onSelectNode(null);
  }, [selectedNodeId, canUseBasicDiagnosis, onFeatureLocked, onSelectNode]);

  useEffect(() => {
    if (!canUseMirror && showMeCard) setShowMeCard(false);
  }, [canUseMirror, showMeCard]);

  useEffect(() => {
    if (selectedNodeId && !nodes.some((n) => n.id === selectedNodeId)) onSelectNode(null);
  }, [selectedNodeId, nodes, onSelectNode]);

  useEffect(() => {
    if (selectedNodeId && showPlacementTooltip) dismissPlacementTooltip();
  }, [selectedNodeId, showPlacementTooltip, dismissPlacementTooltip]);

  const firstViewTracked = useRef(false);

  useEffect(() => {
    if (!firstViewTracked.current && activeNodes.length === 0 && !showOnboarding) {
      analyticsService.track(AnalyticsEvents.RELATIONSHIP_MAP_FIRST_VIEWED);
      firstViewTracked.current = true;
    }
  }, [activeNodes.length, showOnboarding]);

  const canCompleteJourneyStep =
    journeyMode &&
    onJourneyComplete &&
    nodes.some(
      (n) =>
        n.lastViewedStep === "recoveryPlan" ||
        n.hasCompletedTraining === true
    );

  const pageTitle = canUseGalaxyView && galaxyMode
    ? galaxySubView === "forest"
      ? mapCopy.forestTitle
      : mapCopy.galaxyTitle
    : canUseFamilyTreeView && isFamily && viewMode === "tree"
      ? mapCopy.familyTreeTitle
      : mapCopy.titles[goalId as keyof typeof mapCopy.titles] || mapCopy.titles.general;

  const subtitle = canUseGalaxyView && galaxyMode
    ? galaxySubView === "forest"
      ? mapCopy.forestHint
      : mapCopy.galaxyHint
    : canUseFamilyTreeView && isFamily && viewMode === "tree"
      ? mapCopy.familyTreeSubtitle
      : mapCopy.subtitle;

  const pageTitleKey =
    canUseGalaxyView && galaxyMode
      ? galaxySubView === "forest"
        ? "map_forest_title"
        : "map_galaxy_title"
      : canUseFamilyTreeView && isFamily && viewMode === "tree"
        ? "map_family_tree_title"
        : `map_title_${goalId}`;

  const subtitleKey =
    canUseGalaxyView && galaxyMode
      ? galaxySubView === "forest"
        ? "map_forest_hint"
        : "map_galaxy_hint"
      : canUseFamilyTreeView && isFamily && viewMode === "tree"
        ? "map_family_tree_subtitle"
        : "map_subtitle";

  const legendConfig = {
    green: {
      label: mapCopy.legendGreen,
      labelKey: "map_legend_green",
      dotColor: "var(--ring-safe)",
      dotGlow: "var(--ring-safe-glow)",
      pillClass: "legend-pill legend-pill-safe"
    },
    yellow: {
      label: mapCopy.legendYellow,
      labelKey: "map_legend_yellow",
      dotColor: "var(--ring-caution)",
      dotGlow: "var(--ring-caution-glow)",
      pillClass: "legend-pill legend-pill-caution"
    },
    red: {
      label: mapCopy.legendRed,
      labelKey: "map_legend_red",
      dotColor: "var(--ring-danger)",
      dotGlow: "var(--ring-danger-glow)",
      pillClass: "legend-pill legend-pill-danger"
    }
  };

  const handleNodeClick = (id: string) => {
    if (!canUseBasicDiagnosis) {
      onFeatureLocked?.("basic_diagnosis");
      return;
    }
    onSelectNode(id);
  };

  const handleAddNodeClick = () => {
    onSelectNode(null);
    const sub = loadSubscription();
    // Allow up to 4 nodes (0, 1, 2, 3 are fine, 4th triggers upgrade)
    // Actually the user said "allow users to reach four nodes" 
    // so activeNodes.length >= 4 is correct.
    if (sub.tier === "basic" && activeNodes.length >= 4) {
      setIsUpgradeOpen(true);
    } else {
      analyticsService.track(AnalyticsEvents.RELATIONSHIP_MAP_ADD_PERSON_CLICKED);
      setShowAddPerson(true);
    }
  };

  const handleToggleUnifiedContexts = () => {
    if (selectedContexts.length === 0) {
      setSelectedContexts(["family", "work", "love", "general"]);
    }
    setGalaxySubView("map");
    setGalaxyMode((value) => !value);
  };

  const handleFocusContext = (context: ContextAtlasKey) => {
    setGalaxySubView("map");
    setSelectedContexts([context]);
    setGalaxyMode(true);
  };

  return (
    <motion.main
      className="flex-1 w-full h-full relative flex flex-col pb-0 atmospheric-void overflow-hidden"
      aria-label="Relationship Radar Map"
      onDrop={handleMainDrop}
      onMouseMove={handleGlobalMouseMove}
      initial="hidden"
      animate="visible"
    >
      {/* ── Cinematic Data-Driven Ambient Background ── */}
      <div aria-hidden className="fixed inset-0 pointer-events-none bg-[#030712] overflow-hidden" style={{ zIndex: -1 }}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/15 via-[#030712] to-[#030712]" />
        
        {/* Dynamic Nebula Layer */}
        <motion.div style={{ x: nebulaX, y: nebulaY, width: "100%", height: "100%", position: "absolute" }}>
          <div 
            className="map-nebula" 
            style={{ 
              "--nebula-color-1": nebulaPalette.c1,
              "--nebula-color-2": nebulaPalette.c2,
              "--nebula-color-3": nebulaPalette.c3,
            } as React.CSSProperties} 
          />
        </motion.div>

        {/* Dynamic 3D Grid Layer */}
        <motion.div style={{ x: gridX, y: gridY, width: "100%", height: "100%", position: "absolute" }}>
          <div className="map-grid-wrapper">
            <div className="map-grid" style={{ transform: `rotateX(${gridRotateX}) scale(1.5)` }} />
          </div>
        </motion.div>

        {/* Ambient Orbs — soft and cheerful */}
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(52, 211, 153, 0.1) 0%, transparent 60%)", animation: "orb-drift1 38s infinite ease-in-out alternate" }} />
        <div className="absolute bottom-[-30%] left-[-15%] w-[900px] h-[900px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(251, 191, 36, 0.08) 0%, transparent 65%)", animation: "orb-drift2 52s infinite ease-in-out alternate" }} />
        <div className="absolute top-[45%] left-[20%] w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(52, 211, 153, 0.04) 0%, transparent 70%)", animation: "orb-drift3 44s infinite ease-in-out alternate" }} />
      </div>
      <SovereignBroadcastOverlay message={sovereignMessage} />
      
      <LanternSwarm />
      <LanternInsightModal />
      
      {showViralNudge && <ViralLoopNudge />}

      {/* Harmony Indicator: Collective resonance line */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] z-[100] pointer-events-none"
        animate={{
          background: `linear-gradient(to right, transparent, ${harmony.color}, transparent)`,
          opacity: [0.3, 0.6, 0.3],
          scaleX: [0.8, 1, 0.8]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Breath of the Sanctuary */}
      <motion.div
        className="fixed inset-0 z-0 pointer-events-none"
        animate={{
          opacity: [0.02, 0.08, 0.08, 0.02]
        }}
        transition={{
          duration: harmony.breathConfig.total,
          times: [0, harmony.breathConfig.inhale / harmony.breathConfig.total, (harmony.breathConfig.inhale + harmony.breathConfig.hold) / harmony.breathConfig.total, 1],
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          background: `radial-gradient(circle at center, transparent 30%, ${harmony.color}26 100%)`
        }}
      />
      <AnimatePresence>
        {showOracleModal && (
          <OracleAnalysisModal
            isOpen={showOracleModal}
            onClose={() => setShowOracleModal(false)}
            nodes={nodes}
            resonance={resonance}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLayoutSwitching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { delay: 0.2 } }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm pointer-events-none flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
              <p className="text-amber-400 font-bold tracking-widest text-sm drop-shadow-md">
                جاري إعادة ترتيب الأبعاد...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header 
        variants={staggerContainer}
        className="relative z-20 text-center px-4 sm:px-6 pt-[110px] md:pt-[130px] pb-1 flex flex-col items-center gap-2 pointer-events-none"
      >
        {!isSacredIsolation && (
          <motion.div
            variants={cosmicFade}
            className="flex flex-col items-center"
          >

            <motion.h1 
              variants={cosmicFade}
              className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight"
            >
              {pageTitle}
            </motion.h1>
            <motion.p 
              variants={cosmicFade}
              className="text-xs text-white mt-4 font-medium tracking-wide"
            >
              {activeNodes.length === 0 ? mapCopy.emptyMapTitle : subtitle}
            </motion.p>

          </motion.div>
        )}
      </motion.header>

      {/* Main Content Area */}
      {!journeyMode && activeNodes.length > 0 && (
        <div className="relative w-full z-30">
          <div className="max-w-[34rem] mx-auto px-4 pt-2 pb-3 flex flex-col items-center">
            
            {/* 1. HUD: OPERATIONAL */}
            {activeTab === "operational" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{
                  opacity: isSpeaking ? 0.6 : 1,
                  scale: isSpeaking ? 0.98 : 1,
                  y: 0
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full pt-2"
              >
                <MapOperationalStrip
                  activeNodesCount={activeNodes.length}
                  greenNodesCount={greenNodes.length}
                  archivedNodesCount={archivedNodes.length}
                  onOpenSupport={() => setShowDashboard(true)}
                />
              </motion.div>
            )}

            {/* 2. HUD: ANALYTICAL */}
            {activeTab === "analytical" && (
              <MapAnalyticalPanel
                segmentedView={segmentedView}
                onSegmentChange={setSegmentedView}
              />
            )}

            {/* 3. HUD: NARRATIVE */}
            {activeTab === "narrative" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full pointer-events-auto space-y-6 pt-6 max-h-[80vh] overflow-y-auto no-scrollbar pb-32"
              >
                <div className="border-r-2 border-indigo-500/30 pr-4">
                  <h2 className="text-xl font-black text-white mb-1">المسار</h2>
                  <p className="text-xs text-white/40" dir="rtl">سجل تطوّرك عبر الزمن</p>
                </div>
                <WeeklyReportWidget />
                <div className="px-2">
                  <ShadowInsightPanel onSurface={(context) => setVoiceTrigger({ event: 'shadow_insight', context })} />
                </div>
                <ConsciousnessThread />
                <div className="pt-4 flex justify-center">
                  <ShareDialog />
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}



      {/* Operational Visuals */}
      {activeTab === "operational" && (
        <>
          <AnimatePresence mode="wait">
            {galaxyMode && canUseGalaxyView && galaxySubView === "forest" ? (
              <motion.div
                key="forest"
                variants={cosmicFade}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="min-h-[50vh] flex-1"
                style={{
                  order: sectionOrder["map-canvas"],
                  transition: `order ${adaptiveLayout.transitions.duration}ms ${adaptiveLayout.transitions.easing}`,
                }}
              >
                <ForestView onNodeClick={handleNodeClick} />
              </motion.div>
            ) : galaxyMode ? (
              <motion.div
                key="galaxy-map"
                variants={cosmicFade}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute inset-0 w-full h-full z-0 flex flex-col items-center justify-center"
                style={{
                  order: sectionOrder["map-canvas"],
                  transition: `order ${adaptiveLayout.transitions.duration}ms ${adaptiveLayout.transitions.easing}`,
                }}
              >
                <MapCanvas
                  isHandToolActive={isHandToolActive}
                  onNodeClick={handleNodeClick}
                  onAddNode={handleAddNodeClick}
                  canOpenDetails={canUseBasicDiagnosis}
                  onMeClick={() => {
                    if (!canUseMirror) { onFeatureLocked?.("mirror_tool"); return; }
                    setShowMeCard(true);
                  }}
                  galaxyGoalIds={selectedContexts.length > 0 ? selectedContexts : ["family", "work", "love", "general"]}
                  highlightNodeId={selectedNodeId}
                  isSovereign={isSovereign}
                  aiState={{
                    isConnected,
                    isListening,
                    isSpeaking,
                    onToggle: openLiveRoute,
                    onNodeDrop: handleNodeDropOnAI
                  }}
                />
              </motion.div>
            ) : !canUseFamilyTreeView || viewMode === "map" ? (
              <motion.div
                key="single-map"
                variants={cosmicFade}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute inset-0 w-full h-full z-0 flex flex-col items-center justify-center"
                style={{
                  order: sectionOrder["map-canvas"],
                  transition: `order ${adaptiveLayout.transitions.duration}ms ${adaptiveLayout.transitions.easing}`,
                }}
              >
                <Suspense fallback={null}>
                  {mapType === "masafaty" ? (
                    <DawayirCanvas 
                      isHandToolActive={isHandToolActive}
                      nodes={activeNodes} // Only pass active filtered nodes
                      onNodeClick={(node) => onSelectNode(node.id)}
                      onAddNode={handleAddNodeClick}
                      goalId={goalId}
                    />
                  ) : (
                    <MapCanvas
                      isHandToolActive={isHandToolActive}
                      onNodeClick={handleNodeClick}
                      onAddNode={handleAddNodeClick}
                      canOpenDetails={canUseBasicDiagnosis}
                      onMeClick={() => {
                        if (!canUseMirror) { onFeatureLocked?.("mirror_tool"); return; }
                        setShowMeCard(true);
                      }}
                      goalIdFilter={goalId}
                      highlightNodeId={selectedNodeId}
                      isSovereign={isSovereign}
                      aiState={{
                        isConnected,
                        isListening,
                        isSpeaking,
                        onToggle: openLiveRoute,
                        onNodeDrop: handleNodeDropOnAI
                      }}
                    />
                  )}
                </Suspense>
                
                {/* 🧭 Integrated Premium Map HUD */}
                <div className="absolute inset-0 pointer-events-none z-50">
                    <MapTopNav 
                        currentStep={journeySteps.current} 
                        totalSteps={journeySteps.total} 
                    />
                    <MapSidebar 
                        onRearrange={() => console.log('Rearrange')} 
                        onSave={() => console.log('Save Map')}
                        onShowOracle={() => setShowOracleModal(true)}
                        onShowPlan={() => setShowActionPlan(true)}
                        isSaving={isSaving}
                        data={{ nodes, links: [] } as any}
                        isHudVisible={isHudVisible}
                        isHudPinned={isHudPinned}
                        onToggleHud={() => {
                          setIsHudPinned(!isHudPinned);
                          setIsHudVisible(!isHudPinned);
                        }}
                    />

                    {/* Floating HUD Toggle (Extreme Left - Premium Large) */}
                    <div className="absolute top-[280px] left-6 pointer-events-auto z-[60]">
                        <button 
                            onClick={() => {
                                setIsHudPinned(!isHudPinned);
                                setIsHudVisible(!isHudPinned);
                            }}
                            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-2xl border-2 ${isHudVisible ? 'bg-slate-800 border-slate-600 text-slate-100 hover:bg-slate-700' : 'bg-teal-500/20 border-teal-500/40 text-teal-400 hover:bg-teal-500/30'} backdrop-blur-xl group`}
                            title={isHudVisible ? "إخفاء التفاصيل" : "عرض التفاصيل"}
                        >
                            {isHudVisible ? <EyeOff size={28} className="group-hover:scale-110 transition-transform" /> : <Eye size={28} className="group-hover:scale-110 transition-transform" />}
                        </button>
                    </div>

                    <AnimatePresence>
                      {isHudVisible && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20, transition: { duration: 0.2 } }}
                        >
                          <MapMetricsBar 
                              energy={mapMetrics.energy} 
                              boundaries={mapMetrics.boundaries} 
                              clarity={mapMetrics.clarity} 
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {/* Instruction Tip */}
                    <div className="absolute bottom-10 left-10 pointer-events-auto px-5 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3 hidden md:flex">
                        <div className="w-6 h-6 rounded-lg bg-teal-500/20 flex items-center justify-center">
                            <ZapIcon size={14} className="text-teal-400" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-300" dir="rtl">اسحب أي شخص لتغيير موقعه في الخريطة</span>
                    </div>

                    <MapControlDock 
                        onAnalyze={() => setShowOracleModal(true)}
                        onPlan={() => setShowActionPlan(true)}
                        onSave={() => console.log('Save')}
                        onLive={openLiveRoute}
                        isSaving={isSaving}
                        isHandToolActive={isHandToolActive}
                        onToggleHandTool={() => setIsHandToolActive(!isHandToolActive)}
                    />
                </div>
              </motion.div>
            ) : canUseFamilyTreeView && isFamily ? (
              <motion.div
                key="family-tree"
                variants={cosmicFade}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex-1"
                style={{
                  order: sectionOrder["map-canvas"],
                  transition: `order ${adaptiveLayout.transitions.duration}ms ${adaptiveLayout.transitions.easing}`,
                }}
              >
                <FamilyTreeView onNodeClick={handleNodeClick} />
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {architectChatContext && (
              <MapArchitectChat 
                initialMessage={architectChatContext.message}
                onClose={() => setArchitectChatContext(null)}
                onMapSaved={() => setArchitectChatContext(null)}
              />
            )}
          </AnimatePresence>

          {/* Empty State: Subtle Pulse Only */}
          {activeNodes.length === 0 && !showOnboarding && !journeyMode && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2 }}
            >
              <div className="relative">
                <svg width={120} height={120} viewBox="0 0 120 120">
                  {[0, 0.8, 1.6].map((delay, i) => (
                    <SafeMotionCircle
                      key={i} cx={60} cy={60} r={30}
                      fill="none" stroke="rgba(45,212,191,0.4)" strokeWidth={1}
                      animate={{ r: [30, 58], opacity: [0.5, 0] }}
                      transition={{ duration: 3.2, repeat: Infinity, ease: "easeOut", delay }}
                    />
                  ))}
                </svg>
              </div>
            </motion.div>
          )}
        </>
      )}

      {showOnboarding && activeNodes.length === 0 && !journeyMode && (
        <MapOnboardingOverlay onClose={() => setShowOnboarding(false)} />
      )}

      {/* Ring Legend (Legacy removed, handled by MapHUD) */}

      {/* Modals & Overlays */}
      <AnimatePresence>
        {selectedNodeId && (
          <div className="fixed bottom-[calc(var(--bottom-nav-height,5rem)+1rem)] right-4 left-4 md:w-80 z-[60]">
            <ContextNotePanel
              nodeId={selectedNodeId}
              nodeLabel={nodes.find((n) => n.id === selectedNodeId)?.label ?? selectedNodeId}
              onClose={() => onSelectNode(null)}
            />
          </div>
        )}
      </AnimatePresence>

      <Suspense fallback={null}>
        <AnimatePresence>
          {showFeelingCheck && <FeelingCheckModal onClose={() => setShowFeelingCheck(false)} />}
        </AnimatePresence>
      </Suspense>

      {showAddPerson && (
        <AddPersonModal
          goalId={goalId}
          canUseFamilyTree={canUseFamilyTree}
          onClose={(openNodeId?: string) => {
            setShowAddPerson(false);
            onSelectNode(openNodeId ?? null);
          }}
          onOpenMission={onOpenMission}
          onOpenMissionFromAddPerson={onOpenMissionFromAddPerson}
        />
      )}
      {showActionPlan && (
        <WeeklyActionPlanModal
          isOpen={showActionPlan}
          onClose={() => setShowActionPlan(false)}
        />
      )}
      {showVoicePulse && <VoicePulseModal onClose={() => setShowVoicePulse(false)} />}
      {selectedNodeId && canUseBasicDiagnosis && (
        <ViewPersonModal nodeId={selectedNodeId} category={category} goalId={goalId} onOpenMission={onOpenMission} onClose={() => onSelectNode(null)} />
      )}
      <UpgradeScreen isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
      {showMeCard && (
        <MeNodeDetails onClose={() => setShowMeCard(false)} onStartBreathing={() => { setShowMeCard(false); if (onOpenBreathing) onOpenBreathing(); else setShowBreathing(true); }} />
      )}
      {showBreathing && !onOpenBreathing && <BreathingOverlay onClose={() => setShowBreathing(false)} />}
      <DailyJournalArchive isOpen={showJournalArchive} onClose={() => setShowJournalArchive(false)} />
      <GoogleAuthModal isOpen={isCloudAuthOpen} onClose={() => setIsCloudAuthOpen(false)} onGuestMode={() => setIsCloudAuthOpen(false)} onNotNow={() => setIsCloudAuthOpen(false)} intent={{ kind: "ai_focus", createdAt: Date.now() }} />

    </motion.main>
  );
};

CoreMapScreen.displayName = "CoreMapScreen";


