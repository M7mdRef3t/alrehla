import type { FC } from "react";
import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapCanvas } from "../modules/map/MapCanvas";
import { FamilyTreeView } from "./FamilyTreeView";
import { ForestView } from "./ForestView";
import { AddPersonModal } from "./AddPersonModal";
import { ViewPersonModal } from "./ViewPersonModal";
import { MeNodeDetails } from "./MeNodeDetails";
import { BreathingOverlay } from "./BreathingOverlay";
import { MapOnboardingOverlay } from "./MapOnboardingOverlay";
import { hasSeenOnboarding } from "../utils/mapOnboarding";
import { Map, TreeDeciduous, X, Mic, Sparkles } from "lucide-react";
import { DailyPulseWidget } from "./DailyPulseWidget";
import { GoogleAuthModal } from "./GoogleAuthModal";
import { DailyJournalArchive } from "./DailyJournalArchive";
import { UpgradeScreen } from "./UpgradeScreen";
import { ShadowPulseAlert } from "./ShadowPulseAlert";
import { TEIWidget } from "./TEIWidget";
import { FloatingActionMenu } from "./FloatingActionMenu";
import { InsightsSidebar } from "./InsightsSidebar";
import { MapInsightPanel } from "./MapInsightPanel";
import { InfluenceNetwork } from "./InfluenceNetwork";
import { StabilityHeatmap } from "./StabilityHeatmap";
import { ShareDialog } from "./ShareDialog";
import { WeeklyReportWidget } from "./WeeklyReportWidget";
import { ConsciousnessThread } from "./ConsciousnessThread";
import { ShadowInsightPanel } from "./ShadowInsightPanel";
import { VoicePresence } from "./VoicePresence";
import { VoicePulseModal } from "./VoicePulseModal";
import { TabNavigation } from "./TabNavigation";
import { LayoutModeSwitcher } from "./LayoutModeSwitcher";
import { useGraphSync } from "../hooks/useGraphSync";
import { useAdaptiveLayout } from "../hooks/useAdaptiveLayout";
import { useLayoutState } from "../state/layoutState";
import { mapCopy } from "../copy/map";
import { EditableText } from "./EditableText";
import { useMapState } from "../state/mapState";
import { usePulseState } from "../state/pulseState";
import { useJourneyState } from "../state/journeyState";
import { PULSE_DAY_NAMES } from "../utils/pulseInsights";
import { NextStepCard } from "./NextStepCard";
import { RelationshipWeatherCard } from "./RelationshipWeatherCard";
import { RelationshipPulse } from "./RelationshipPulse";
import { ContextAtlasCard } from "./ContextAtlasCard";
import type { AdviceCategory } from "../data/adviceScripts";
import { useAdminState } from "../state/adminState";
import { getEffectiveFeatureAccess } from "../utils/featureFlags";
import { getEffectiveRoleFromState, useAuthState } from "../state/authState";
import type { FeatureFlagKey } from "../config/features";
import type { NextStepDecisionV1 } from "../modules/recommendation/types";
import { isUserMode } from "../config/appEnv";
import { runtimeEnv } from "../config/runtimeEnv";
import { adaptiveLayoutEngine } from "../ai/adaptiveLayoutEngine";
import { loadSubscription, canSendAIMessage } from "../services/subscriptionManager";
import { computeTEI } from "../utils/traumaEntropyIndex";
import { useDailyQuestion } from "../hooks/useDailyQuestion";
import { getShadowScore } from "../state/shadowPulseState";
import { deriveRelationshipWeather } from "../utils/relationshipWeather";
import { deriveContextAtlas, type ContextAtlasKey } from "../utils/contextAtlas";
import { assignUrl } from "../services/navigation";
import { SoulGeometryOverlay } from "./SoulGeometryOverlay";
const DawayirCanvas = lazy(() => import("../modules/dawayir/DawayirCanvas").then(m => ({ default: m.DawayirCanvas })));
const FeelingCheckModal = lazy(() => import("../modules/dawayir/FeelingCheckModal").then(m => ({ default: m.FeelingCheckModal })));
const EmergencyButton = lazy(() => import("../modules/dawayir/EmergencyButton").then(m => ({ default: m.EmergencyButton })));
const ActionToolkit = lazy(() => import("../modules/dawayir/ActionToolkit").then(m => ({ default: m.ActionToolkit })));

import { trackEvent, AnalyticsEvents } from "../services/analytics";
import { getGlobalHarmony } from "../services/globalPulse";
import { supabase, isSupabaseReady } from "../services/supabaseClient";

/* 
    CORE MAP SCREEN  Digital Sanctuary
    */

const cosmicFade = {
  hidden: { opacity: 0, y: 10, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
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
          className="fixed top-8 left-1/2 -translate-x-1/2 z-[300] w-full max-w-sm px-4 pointer-events-none"
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
  useGraphSync(); // تفعيل ميزة إتاحة الجراف
  useAdaptiveLayout(); // تفعيل نظام التخطيط التكيّفي

  const mode = useLayoutState((s) => s.mode);
  const activeTab = useLayoutState((s) => s.activeTab);

  const [showAddPerson, setShowAddPerson] = useState(false);
  const [segmentedView, setSegmentedView] = useState<"network" | "stability" | "metrics">("network");
  const [isCloudAuthOpen, setIsCloudAuthOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const user = useAuthState(s => s.user);
  const role = useAuthState(s => getEffectiveRoleFromState(s));
  const isSovereign = (user?.email === "mohamedsamy@alrehla.app" || role === "owner" || role === "superadmin");

  const isConnected = false;
  const isListening = false;
  const isSpeaking = false;

  const nodes = useMapState((s) => s.nodes); // Moved up for handleNodeDropOnAI
  const mapType = useMapState((s) => s.mapType);
  const feelingResults = useMapState((s) => s.feelingResults);
  const [isExitingWarp, setIsExitingWarp] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsExitingWarp(false), 1500);
    return () => clearTimeout(timer);
  }, []);


  useEffect(() => {
    trackEvent(AnalyticsEvents.SANCTUARY_LOADED);
  }, []);

  const handleNodeDropOnAI = useCallback((nodeId: string) => {
    if (!user) {
      trackEvent(AnalyticsEvents.AI_ATTEMPT_GUEST);
      setIsCloudAuthOpen(true);
      return;
    }
    if (!canSendAIMessage()) {
      setIsUpgradeOpen(true);
      return;
    }
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    assignUrl(`/dawayir-live?surface=map-drop&nodeId=${encodeURIComponent(node.id)}&nodeLabel=${encodeURIComponent(node.label)}&goalId=${encodeURIComponent(goalId)}`);
  }, [goalId, nodes, user]);

  const handleMainDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleMainDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const openLiveRoute = useCallback(() => {
    if (!user) {
      setIsCloudAuthOpen(true);
      return;
    }
    if (!canSendAIMessage()) {
      setIsUpgradeOpen(true);
      return;
    }
    assignUrl(`/dawayir-live?surface=map-fab&goalId=${encodeURIComponent(goalId)}`);
  }, [goalId, user]);
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
  
  useEffect(() => {
    const timer = setInterval(() => setHarmony(getGlobalHarmony()), 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isSupabaseReady || !supabase) return;

    // Listen for Sovereign Broadcasts
    const channel = supabase
      .channel("sovereign_broadcasts")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "system_settings", filter: "key=eq.sovereign_broadcast" },
        (payload) => {
          if (payload.new && payload.new.value && typeof payload.new.value === "object") {
            const data = payload.new.value as { message: string; id: string };
            setSovereignMessage(data);
            // Hide after 8 seconds
            setTimeout(() => setSovereignMessage(null), 8000);
          }
        }
      )
      .subscribe();

    return () => {
      if (supabase) void supabase.removeChannel(channel);
    };
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
  const [showOnboarding, setShowOnboarding] = useState(() => nodes.length === 0 && !hasSeenOnboarding() && !journeyMode);
  const lastAddedNode = lastAddedNodeId ? nodes.find((node) => node.id === lastAddedNodeId) ?? null : null;

  /*  Dashboard Widget  */
  const [showDashboard, setShowDashboard] = useState(false);
  const [voiceTrigger, setVoiceTrigger] = useState<{
    event: "shadow_insight" | "milestone_unlocked" | "high_impact_action";
    context: Record<string, unknown>;
  } | undefined>();
  const [showJournalArchive, setShowJournalArchive] = useState(false);
  const activeNodes = useMemo(() => nodes.filter((n) => !n.isNodeArchived), [nodes]);
  const archivedNodes = useMemo(() => nodes.filter((n) => n.isNodeArchived), [nodes]);
  const greenNodes = useMemo(() => activeNodes.filter((n) => n.ring === "green" && !n.isDetached), [activeNodes]);
  const relationshipWeather = useMemo(
    () => deriveRelationshipWeather(nodes, lastPulse?.energy ?? null),
    [lastPulse?.energy, nodes]
  );
  const contextAtlas = useMemo(() => deriveContextAtlas(nodes), [nodes]);

  /*  Adaptive Layout Engine  */
  const { hasAnsweredToday } = useDailyQuestion();
  const tei = useMemo(() => computeTEI(nodes).score, [nodes]);
  const shadowScore = useMemo(() => getShadowScore(), []);
  const sessionDuration = useMemo(() => {
    const sessionStart = parseInt(
      sessionStorage.getItem("dawayir-session-start") || String(Date.now())
    );
    return Math.floor((Date.now() - sessionStart) / (60 * 1000));
  }, []);

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
    if (nodes.length > 0 && showOnboarding) setShowOnboarding(false);
  }, [nodes.length, showOnboarding]);

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

  // ── 10-Second Mirror Integration ──
  useEffect(() => {
    const mirrorName = useJourneyState.getState().mirrorName;
    if (mirrorName && activeNodes.length === 0 && !showOnboarding) {
      const nodeId = useMapState.getState().addNode(
        mirrorName, 
        "yellow", 
        undefined, 
        goalId, 
        undefined, 
        undefined, 
        undefined, 
        undefined, 
        undefined, 
        undefined, 
        false, 
        true
      );
      useJourneyState.getState().consumeMirrorName();
      onSelectNode(nodeId);
      
      // Trigger Deluxe Reward
      import("../state/achievementState").then(m => {
        m.useAchievementState.getState().unlock("mirror_discovery");
      });

      void trackEvent(AnalyticsEvents.NODE_ADDED, { label: mirrorName, source: "mirror_hook" });
    }
  }, [goalId, activeNodes.length, onSelectNode, showOnboarding]);

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
      className="flex-1 w-full h-full relative flex flex-col pb-24 md:pb-8"
      style={{
        background: [
          "radial-gradient(ellipse 60% 50% at 15% 10%, rgba(124,58,237,0.08) 0%, transparent 60%)",
          "radial-gradient(ellipse 50% 40% at 85% 90%, rgba(20,184,166,0.05) 0%, transparent 50%)",
          "radial-gradient(ellipse 40% 40% at 50% 50%, rgba(20,184,166,0.03) 0%, transparent 60%)",
          "#0A0A1A"
        ].join(", ")
      }}
      aria-labelledby="core-map-title"
      onDrop={handleMainDrop}
      initial="hidden"
      animate="visible"
    >
      <SovereignBroadcastOverlay message={sovereignMessage} />

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

      {/* Breath of the Sanctuary: Subliminal Zen Sync (Synchronized with Global Pulse) */}
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
      {/*  Header  */}
      <motion.header variants={cosmicFade} className="text-center px-4 sm:px-6 pt-6">
        <AnimatePresence>
          {!isSacredIsolation && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex flex-col items-center gap-2 mb-4">
                <h1
                  id="core-map-title"
                  className="text-[clamp(1.5rem,3.5vw,2.5rem)] font-bold leading-[1.12]"
                  style={{ color: "var(--text-primary)", letterSpacing: "var(--tracking-wider)" }}
                >
                  <EditableText id={pageTitleKey} defaultText={pageTitle} page="map" />
                </h1>
              </div>
              <p
                className="text-sm md:text-base leading-[1.72] max-w-[42ch] mx-auto"
                style={{ color: "var(--text-muted)", letterSpacing: "var(--tracking-wide)" }}
              >
                <EditableText id={subtitleKey} defaultText={subtitle} page="map" multiline showEditIcon={false} />
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* 
          المنطقة الأولى — مؤشرات الوضع + سؤال اليوم
          تظهر دائمًا (60% من الاهتمام البصري)
           */}
      {!journeyMode && activeNodes.length > 0 && (
        <div className="relative w-full z-30">
          <div className="max-w-[42rem] mx-auto px-4 py-6 flex flex-col items-center">

            {/* 1️ HUD: OPERATIONAL (Sanctuary Mode) */}
            {activeTab === "operational" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{
                  opacity: isSpeaking ? 0.6 : 1,
                  scale: isSpeaking ? 0.98 : 1,
                  y: 0
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full pointer-events-auto flex flex-col items-center gap-10 pt-10"
              >
                {/*  Pulse Capsule moved out to float at the bottom */}


              </motion.div>
            )}

            {/* 2️ HUD: ANALYTICAL (Observatory Mode) */}
            {activeTab === "analytical" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full pointer-events-auto space-y-4 pt-12"
              >
                {/*  Segmented Control: Choose your Lens */}
                <div className="flex items-center justify-center gap-2 p-1 rounded-full bg-white/[0.03] border border-white/5 mx-auto w-fit mb-8">
                  {[
                    { id: "network", label: "الشبكة" },
                    { id: "stability", label: "الاستقرار" },
                    { id: "metrics", label: "المؤشرات" }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSegmentedView(tab.id as "network" | "stability" | "metrics")}
                      className={`px-6 py-2 rounded-full text-xs font-black transition-all ${segmentedView === tab.id
                        ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                        : "text-white/30 hover:text-white/60"
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar pb-32">
                  {segmentedView === "metrics" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 text-right font-black">
                        <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3">مؤشر حِدّة الصدمة (Trauma Entropy)</h3>
                        <TEIWidget />
                      </div>
                      <MapInsightPanel />
                    </motion.div>
                  )}

                  {segmentedView === "network" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <InfluenceNetwork />
                    </motion.div>
                  )}

                  {segmentedView === "stability" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <StabilityHeatmap />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* 3️ HUD: NARRATIVE (Chronicle Mode) */}
            {activeTab === "narrative" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full pointer-events-auto space-y-6 pt-12 max-h-[80vh] overflow-y-auto no-scrollbar pb-32"
              >
                <div className="border-r-2 border-indigo-500/30 pr-4">
                  <h2 className="text-xl font-black text-white mb-1">المسار</h2>
                  <p className="text-xs text-white/40">سجل تطوّرك عبر الزمن</p>
                </div>

                <WeeklyReportWidget />

                {/* Shadow Insights as a "Special Event" in Narrative */}
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

      {/* ── Sacred Isolation & Soul Geometry Toolbar ── */}
      <div className="fixed top-6 right-20 z-[70] flex gap-2">
        <button
          onClick={() => setIsSacredIsolation(!isSacredIsolation)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isSacredIsolation ? 'bg-teal-500 text-white shadow-[0_0_15px_rgba(45,212,191,0.5)]' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
          title={isSacredIsolation ? "إيقاف العزلة المقدسة" : "تفعيل العزلة المقدسة"}
        >
          <Mic className={`w-5 h-5 ${isSacredIsolation ? 'animate-pulse' : ''}`} />
        </button>
        <button
          onClick={() => setShowSoulGeometry(true)}
          className="w-10 h-10 rounded-full bg-white/5 text-white/40 flex items-center justify-center hover:bg-white/10 transition-all"
          title="توليد بصمة الروح"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      </div>

      <AnimatePresence>
        {showSoulGeometry && (
          <SoulGeometryOverlay onClose={() => setShowSoulGeometry(false)} />
        )}
      </AnimatePresence>

      {/* Global Presence Overlay (The Witness) */}
      <VoicePresence trigger={voiceTrigger} />

      {/* 
          النبضة التكتيكية: تطفو أسفل الخريطة لسهولة الوصول
      */}
      {!isSacredIsolation && !journeyMode && (
        <div className="relative w-full z-40 flex justify-center my-4">
          <DailyPulseWidget />
        </div>
      )}

      {/* 
          المنطقة الداعمة — تفاصيل الخريطة ومُلخّص المحطات (30%)
           */}
      {!journeyMode && (
        <motion.div
          variants={cosmicFade}
          className="w-full max-w-[38rem] mx-auto mb-4"
          style={{
            order: sectionOrder["dashboard-details"],
            transition: `order ${adaptiveLayout.transitions.duration}ms ${adaptiveLayout.transitions.easing}`,
          }}
        >
          <button
            type="button"
            onClick={() => setShowDashboard((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2 rounded-xl text-sm transition-all"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "var(--text-muted)"
            }}
          >
            <span className="text-[11px]" style={{ color: "rgba(148,163,184,0.45)" }}>
              {showDashboard ? "إخفاء التفاصيل" : "تفاصيل الدوائر"}
            </span>
            <span className="text-[11px]">
              {mapCopy.dashboardMapSummary(activeNodes.length, greenNodes.length, archivedNodes.length)}
            </span>
          </button>

          <AnimatePresence>
            {showDashboard && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div
                  className="mt-2 rounded-xl p-4 space-y-4 text-right"
                  style={{
                    background: "rgba(15,23,42,0.5)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    backdropFilter: "blur(12px)"
                  }}
                >
                  {/* توازن الدوائر — Mini Gauge */}
                  {activeNodes.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold mb-2" style={{ color: "var(--text-muted)" }}>
                        توازن الدوائر
                      </p>
                      <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden">
                        {["green", "yellow", "red"].map((ring) => {
                          const count = activeNodes.filter((n) => n.ring === ring).length;
                          if (!count) return null;
                          const colors = { green: "#34d399", yellow: "#fbbf24", red: "#f87171" };
                          return (
                            <div
                              key={ring}
                              className="transition-all duration-700"
                              style={{
                                width: `${(count / activeNodes.length) * 100}%`,
                                background: colors[ring as keyof typeof colors]
                              }}
                            />
                          );
                        })}
                      </div>
                      {/* أعداد تفصيلية */}
                      <div className="flex justify-between mt-1.5">
                        {["green", "yellow", "red"].map((ring) => {
                          const count = activeNodes.filter((n) => n.ring === ring).length;
                          if (!count) return null;
                          const colors = { green: "#34d399", yellow: "#fbbf24", red: "#f87171" };
                          const labels = { green: "آمن", yellow: "متعب", red: "ضاغط" };
                          return (
                            <span key={ring} className="text-[10px]" style={{ color: colors[ring as keyof typeof colors] }}>
                              {count} {labels[ring as keyof typeof labels]}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Slogan — منطقة التنفّس (10%) */}
                  {contextAtlas && (
                    <ContextAtlasCard
                      snapshot={contextAtlas}
                      isUnifiedMode={galaxyMode}
                      selectedContexts={selectedContexts}
                      onToggleMode={handleToggleUnifiedContexts}
                      onToggleContext={toggleContext}
                      onFocusContext={handleFocusContext}
                      onSelectNode={handleNodeClick}
                    />
                  )}
                  {relationshipWeather && (
                    <RelationshipWeatherCard
                      snapshot={relationshipWeather}
                      onSelectNode={handleNodeClick}
                    />
                  )}
                  <RelationshipPulse />
                  <p className="text-[11px] text-center pt-1" style={{ color: "rgba(45,212,191,0.35)" }}>
                    {mapCopy.dashboardSlogan}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/*  Weekday Labels Modal  */}
      {showWeekdayLabelsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(10, 10, 26, 0.8)", backdropFilter: "blur(8px)" }}
          role="dialog"
          aria-labelledby="weekday-labels-title"
        >
          <motion.div
            className="w-full max-w-sm glass-card p-5 text-right"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 id="weekday-labels-title" className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                ربط أيام الأسبوع بنشاط أو شخص
              </h2>
              <button
                type="button"
                onClick={() => setShowWeekdayLabelsModal(false)}
                className="p-1.5 rounded-full transition-colors"
                style={{ color: "var(--text-muted)" }}
                aria-label="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
              عند ملاحظة نبضات في انخفاض، الربط بنشاط أو شخص يفسّر التكرار ده أكثر.
            </p>
            <div className="space-y-2">
              {PULSE_DAY_NAMES.map((dayName, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{dayName}</span>
                  <input
                    type="text"
                    value={weekdayLabels[i] ?? ""}
                    onChange={(e) => setWeekdayLabel(i, e.target.value || null)}
                    placeholder="مثال: اجتماع مع المدير"
                    className="flex-1 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300/30"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      color: "var(--text-primary)"
                    }}
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowWeekdayLabelsModal(false)}
              className="mt-4 w-full cta-primary py-2.5 text-sm font-semibold"
            >
              تمّ
            </button>
          </motion.div>
        </div>
      )}

      <GoogleAuthModal
        isOpen={isCloudAuthOpen}
        onClose={() => setIsCloudAuthOpen(false)}
        onNotNow={() => setIsCloudAuthOpen(false)}
        intent={{ kind: "ai_focus", createdAt: Date.now() }}
      />

      {/*  Status Cards (Pulse Modes)  */}
      {
        pulseMode === "low" && (
          <motion.div
            className="mt-5 mx-auto max-w-[38rem] card-unified status-card-low px-4 py-4 text-right"
            variants={cosmicFade}
            style={{
              order: sectionOrder["status-card"],
              transition: `order ${adaptiveLayout.transitions.duration}ms ${adaptiveLayout.transitions.easing}`,
            }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              الطاقة منخفضة.. أنت في منطقة ضغط
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
              نفّذ خطوة صغيرة واحدة بس — من غير أي اشتباك.
            </p>
            {suppressLowPulseCocoon ? (
              <p className="mt-3 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                تمّ تنفيذ جولة الشحن. خُد بداية هادية مع خطوة بسيطة على الخريطة.
              </p>
            ) : (
              <button
                type="button"
                onClick={onOpenCocoon}
                className="mt-3 w-full cta-muted py-2.5 text-sm font-semibold transition-all hover:bg-white/10"
                style={{ borderColor: "rgba(148, 163, 184, 0.3)" }}
              >
                جولة شحن
              </button>
            )}
          </motion.div>
        )
      }

      {
        pulseMode === "low" ? null : (
          <>
            {pulseMode === "angry" && (
              <motion.div
                className="mt-5 mx-auto max-w-[38rem] card-unified status-card-angry px-4 py-4 text-right"
                variants={cosmicFade}
                style={{
                  order: sectionOrder["status-card"],
                  transition: `order ${adaptiveLayout.transitions.duration}ms ${adaptiveLayout.transitions.easing}`,
                }}
              >
                <p className="text-sm font-semibold" style={{ color: "var(--ring-danger)" }}>
                  الرادار يرصد ضجيج عالي.. ثبّت حالك الأول
                </p>
                <p className="text-xs mt-1" style={{ color: "rgba(248, 113, 113, 0.7)" }}>
                  قبل أي قرار، افصل المشاعر المشتعلة وارجع تحت السيطرة.
                </p>
                <button
                  type="button"
                  onClick={onOpenNoise}
                  className="mt-3 w-full cta-danger py-2.5 text-sm font-semibold"
                >
                  إسكات الضجيج
                </button>
              </motion.div>
            )}

            {pulseMode === "high" && (
              <motion.div
                className="mt-5 mx-auto max-w-[38rem] card-unified status-card-high px-4 py-4 text-right"
                variants={cosmicFade}
                style={{
                  order: sectionOrder["status-card"],
                  transition: `order ${adaptiveLayout.transitions.duration}ms ${adaptiveLayout.transitions.easing}`,
                }}
              >
                <p className="text-sm font-semibold" style={{ color: "var(--ring-safe)" }}>
                  الطاقة ممتازة.. وقت تحدّي المسار
                </p>
                <p className="text-xs mt-1" style={{ color: "rgba(45, 212, 191, 0.7)" }}>
                  {challengeLabel ?? "جاهز للخطوة الواردة"}
                </p>
                <button
                  type="button"
                  onClick={onOpenChallenge}
                  className="mt-3 w-full cta-primary py-2.5 text-sm font-semibold disabled:opacity-40"
                  disabled={!onOpenChallenge}
                >
                  ابدأ التحدي
                </button>
              </motion.div>
            )}

            {/*  Controls Bar  */}
            <motion.div
              className="mt-8 flex items-center justify-center gap-3 flex-wrap"
              variants={cosmicFade}
              style={{
                order: sectionOrder["controls-bar"],
                transition: `order ${adaptiveLayout.transitions.duration}ms ${adaptiveLayout.transitions.easing}`,
              }}
            >
              <button
                type="button"
                hidden={!canUseGalaxyView}
                aria-hidden={!canUseGalaxyView}
                onClick={() => setGalaxyMode((v) => !v)}
                className={`glass-button px-4 py-2.5 text-sm font-semibold ${galaxyMode ? "glass-button-active" : ""
                  }`}
                title={galaxyMode ? "ارجع للمسار الواحد" : "عرض كل الدوائر"}
              >
                {galaxyMode ? (
                  <EditableText id="map_view_single_cta" defaultText={mapCopy.viewSingleCta} page="map" editOnClick={false} />
                ) : (
                  <EditableText id="map_view_all_cta" defaultText={mapCopy.viewAllCta} page="map" editOnClick={false} />
                )}
              </button>
              {canUseGalaxyView && galaxyMode && (
                <div className="flex rounded-full p-1" style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  <button
                    type="button"
                    onClick={() => setGalaxySubView("map")}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${galaxySubView === "map" ? "cta-primary" : ""}`}
                    style={galaxySubView !== "map" ? { color: "var(--text-secondary)" } : {}}
                  >
                    <EditableText id="map_galaxy_title" defaultText={mapCopy.galaxyTitle} page="map" editOnClick={false} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setGalaxySubView("forest")}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${galaxySubView === "forest" ? "cta-primary" : ""}`}
                    style={galaxySubView !== "forest" ? { color: "var(--text-secondary)" } : {}}
                  >
                    <EditableText id="map_forest_title" defaultText={mapCopy.forestTitle} page="map" editOnClick={false} />
                  </button>
                </div>
              )}
              {canUseGalaxyView && galaxyMode && galaxySubView === "map" && (
                <div className="flex flex-wrap justify-center gap-2">
                  {(["family", "work", "love", "general"] as const).map((ctx) => {
                    const label = ctx === "family" ? mapCopy.contextFamily : ctx === "work" ? mapCopy.contextWork : ctx === "love" ? mapCopy.contextLove : mapCopy.contextGeneral;
                    const labelKey = ctx === "family" ? "map_context_family" : ctx === "work" ? "map_context_work" : ctx === "love" ? "map_context_love" : "map_context_general";
                    const on = selectedContexts.includes(ctx);
                    return (
                      <button
                        key={ctx}
                        type="button"
                        onClick={() => toggleContext(ctx)}
                        className={`glass-button px-3 py-1.5 text-xs font-semibold ${on ? "glass-button-active" : ""}`}
                      >
                        <EditableText id={labelKey} defaultText={label} page="map" editOnClick={false} />
                      </button>
                    );
                  })}
                </div>
              )}
              {!galaxyMode && isFamily && canUseFamilyTreeView && (
                <div className="flex rounded-full p-1" style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  <button
                    type="button"
                    onClick={() => setViewMode("map")}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${viewMode === "map" ? "cta-primary" : ""}`}
                    style={viewMode !== "map" ? { color: "var(--text-secondary)" } : {}}
                    title="عرض الخريطة"
                  >
                    <Map className="w-4 h-4" />
                    <EditableText id="map_view_mode_map" defaultText="الخريطة" page="map" editOnClick={false} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!canUseFamilyTree) { onFeatureLocked?.("family_tree"); return; }
                      setViewMode("tree");
                    }}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${viewMode === "tree" ? "cta-primary" : ""}`}
                    style={viewMode !== "tree" ? { color: canUseFamilyTree ? "var(--text-secondary)" : "var(--text-muted)" } : {}}
                    title="شجرة العائلة"
                  >
                    <TreeDeciduous className="w-4 h-4" />
                    {canUseFamilyTree
                      ? <EditableText id="map_view_mode_tree" defaultText="شجرة العائلة" page="map" editOnClick={false} />
                      : <EditableText id="map_view_mode_tree_locked" defaultText="شجرة العائلة 🔒" page="map" editOnClick={false} />
                    }
                  </button>
                </div>
              )}

              <motion.button
                type="button"
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all cosmic-shimmer"
                style={{
                  background: "linear-gradient(135deg, rgba(45,212,191,0.2) 0%, rgba(20,184,166,0.05) 100%)",
                  border: "1px solid rgba(45,212,191,0.3)",
                  color: "var(--soft-teal)"
                }}
                onClick={() => setShowVoicePulse(true)}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                title="تفريغ صوتي"
                aria-label="تفريغ صوتي"
              >
                <Mic size={20} />
              </motion.button>

              <motion.button
                type="button"
                className="cta-primary px-6 py-3 text-sm font-semibold cosmic-shimmer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/40 focus-visible:ring-offset-0"
                onClick={() => {
                  onSelectNode(null);
                  const sub = loadSubscription();
                  if (sub.tier === "basic" && nodes.length >= 3) {
                    setIsUpgradeOpen(true);
                  } else {
                    setShowAddPerson(true);
                  }
                }}
                title={mapCopy.addPersonTitle}
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <EditableText id="map_add_person_label" defaultText={mapCopy.addPersonLabel} page="map" editOnClick={false} />
              </motion.button>
            </motion.div>
          </>
        )
      }

      {/*  Pulse Insight  */}
      {
        pulseInsight && (
          <motion.div className="mt-4 mx-auto max-w-[38rem] card-unified status-card-insight px-4 py-4 text-right" variants={cosmicFade}>
            <p className="text-xs font-semibold" style={{ color: "rgba(167, 139, 250, 0.9)" }}>{pulseInsight.title}</p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: "rgba(167, 139, 250, 0.6)" }}>{pulseInsight.body}</p>
            <button
              type="button"
              onClick={() => setShowWeekdayLabelsModal(true)}
              className="mt-2 text-xs font-medium hover:underline"
              style={{ color: "rgba(167, 139, 250, 0.7)" }}
            >
               ربط بنشاط أو شخص
            </button>
          </motion.div>
        )
      }

      {/*  Map Canvas Views  */}
      {
        nextStepDecision && onTakeNextStep && onRefreshNextStep && (
          <NextStepCard
            decision={nextStepDecision}
            onTakeAction={onTakeNextStep}
            onRefresh={onRefreshNextStep}
          />
        )
      }

      {/*  Operational Visuals  */}
      {
        activeTab === "operational" && (
          <>
            <AnimatePresence mode="wait">
              {galaxyMode && canUseGalaxyView && galaxySubView === "forest" ? (
                <motion.div
                  key="forest"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="min-h-[50vh]"
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
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="min-h-[50vh]"
                  style={{
                    order: sectionOrder["map-canvas"],
                    transition: `order ${adaptiveLayout.transitions.duration}ms ${adaptiveLayout.transitions.easing}`,
                  }}
                >
                  <MapCanvas
                    onNodeClick={handleNodeClick}
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
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="min-h-[50vh]"
                  style={{
                    order: sectionOrder["map-canvas"],
                    transition: `order ${adaptiveLayout.transitions.duration}ms ${adaptiveLayout.transitions.easing}`,
                  }}
                >
                  <Suspense fallback={null}>
                    {mapType === "masafaty" ? (
                      <DawayirCanvas 
                        onNodeClick={(node) => onSelectNode(node.id)}
                        onAddNode={() => setShowAddPerson(true)}
                      />
                    ) : (
                      <MapCanvas
                        onNodeClick={handleNodeClick}
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
                    {mapType === "masafaty" && (
                      <>
                        <EmergencyButton />
                        <ActionToolkit />
                      </>
                    )}
                  </Suspense>
                </motion.div>
              ) : canUseFamilyTreeView && isFamily ? (
                <motion.div
                  key="family-tree"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  style={{
                    order: sectionOrder["map-canvas"],
                    transition: `order ${adaptiveLayout.transitions.duration}ms ${adaptiveLayout.transitions.easing}`,
                  }}
                >
                  <FamilyTreeView onNodeClick={handleNodeClick} />
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/*  Empty state  */}
            {nodes.length === 0 && !showOnboarding && !journeyMode && (
              <motion.div
                className="mt-6 mx-auto max-w-sm p-4 card-unified text-center"
                style={{ borderStyle: "dashed", borderColor: "rgba(255, 255, 255, 0.1)" }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                role="status"
                aria-live="polite"
              >
                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                  <EditableText id="map_empty_title" defaultText={mapCopy.emptyMapTitle} page="map" />
                </h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  <EditableText id="map_empty_hint" defaultText={mapCopy.emptyMapHint} page="map" multiline showEditIcon={false} />
                </p>
                <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                  <EditableText id="map_empty_reassurance" defaultText={mapCopy.emptyMapReassurance} page="map" showEditIcon={false} />
                </p>
              </motion.div>
            )}
          </>
        )
      }

      {
        showOnboarding && nodes.length === 0 && !journeyMode && (
          <MapOnboardingOverlay onClose={() => setShowOnboarding(false)} />
        )
      }

      {/*  Placement tooltip  */}
      {
        showPlacementTooltip && (
          <motion.div
            className="mt-4 mx-auto max-w-sm flex items-center justify-between gap-3 px-4 py-3 glass-card text-sm"
            style={{ color: "var(--text-secondary)" }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            role="status"
            aria-live="polite"
          >
            <span>
              {lastAddedNode ? (
                <>
                  تم إضافة <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{lastAddedNode.label}</span>{" "}
                  في{" "}
                  <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    <span
                      style={{
                        color:
                          lastAddedNode.ring === "green"
                            ? "var(--ring-safe)"
                            : lastAddedNode.ring === "yellow"
                              ? "var(--ring-caution)"
                              : "var(--ring-danger)"
                      }}
                    >
                      {lastAddedNode.ring === "green"
                        ? mapCopy.legendGreen
                        : lastAddedNode.ring === "yellow"
                          ? mapCopy.legendYellow
                          : mapCopy.legendRed}
                    </span>
                  </span>
                  {canUseBasicDiagnosis
                    ? ". اضغط عليه للتفاصيل أو اسحبه لو عايز تغيّر مكانه."
                    : ". التفاصيل مقفلة حالياً — فعّل Feature Flags."}
                </>
              ) : (
                <EditableText id="map_first_placement_tooltip" defaultText={mapCopy.firstPlacementTooltip} page="map" showEditIcon={false} />
              )}
            </span>
            <div className="shrink-0 flex items-center gap-1">
              {lastAddedNode && (
                <button
                  type="button"
                  onClick={() => {
                    if (!canUseBasicDiagnosis) {
                      onFeatureLocked?.("basic_diagnosis");
                      return;
                    }
                    onSelectNode(lastAddedNode.id);
                    dismissPlacementTooltip();
                  }}
                  className="rounded-full px-2.5 py-1 text-xs font-semibold border border-white/15 hover:bg-white/5 transition-colors"
                  style={{ color: "var(--text-primary)" }}
                  title="افتح الشخص"
                  aria-label="افتح الشخص"
                >
                  افتح
                </button>
              )}
              <button type="button" onClick={dismissPlacementTooltip} className="rounded-full p-1.5 transition-colors" style={{ color: "var(--text-muted)" }} title="إغلاق" aria-label="إغلاق">

              </button>
            </div>
          </motion.div>
        )
      }

      {/*  Ring Legend  */}
      <motion.div
        className="mt-6 flex flex-wrap justify-center gap-3 text-sm"
        aria-label="علامات دوائر المسافة"
        variants={cosmicFade}
        style={{
          order: sectionOrder["ring-legend"],
          transition: `order ${adaptiveLayout.transitions.duration}ms ${adaptiveLayout.transitions.easing}`,
        }}
      >
        {(["green", "yellow", "red"] as const).map((key) => {
          const isActive = legendTooltip === key;
          const config = legendConfig[key];
          return (
            <div key={key} className="relative">
              {isActive && (
                <motion.div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 glass-card text-xs font-medium whitespace-nowrap z-10"
                  style={{ color: "var(--text-primary)" }}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="tooltip"
                >
                  <EditableText id={config.labelKey} defaultText={config.label} page="map" showEditIcon={false} />
                  <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent" style={{ borderTopColor: "rgba(15, 20, 50, 0.8)" }} />
                </motion.div>
              )}
              <button
                type="button"
                onClick={() => setLegendTooltip((prev) => (prev === key ? null : key))}
                className={`${config.pillClass} inline-flex items-center gap-2 font-medium active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-amber-300/30`}
                aria-label={config.label}
                aria-expanded={isActive}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: config.dotColor, boxShadow: `0 0 8px ${config.dotGlow}` }} />
                <EditableText id={config.labelKey} defaultText={config.label} page="map" editOnClick={false} />
              </button>
            </div>
          );
        })}
      </motion.div>
      <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }} title={mapCopy.threatLevelHint}>
        <EditableText id="map_threat_level_hint" defaultText={mapCopy.threatLevelHint} page="map" multiline showEditIcon={false} />
      </p>

      {/*  Journey complete  */}
      {
        journeyMode && onJourneyComplete && (
          <div className="mt-8 flex flex-col items-center gap-2">
            <button type="button" onClick={onJourneyComplete} disabled={!canCompleteJourneyStep} className="cta-primary px-6 py-3 font-semibold disabled:opacity-40 disabled:cursor-not-allowed">
              أكمل المرحلة
            </button>
            {!canCompleteJourneyStep && nodes.length > 0 && (
              <p className="text-sm max-w-xs text-center" style={{ color: "var(--text-muted)" }}>
                افتح الدائرة وراجع التوجّه ومسار الحالة أو كمّل التدريب، بعدها اضغط "أكمل المرحلة"
              </p>
            )}
          </div>
        )
      }

      {/*  Modals  */}
      {
        showAddPerson && (
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
        )
      }
      {
        showVoicePulse && (
          <VoicePulseModal onClose={() => setShowVoicePulse(false)} />
        )
      }
      {
        selectedNodeId && canUseBasicDiagnosis && (
          <ViewPersonModal nodeId={selectedNodeId} category={category} goalId={goalId} onOpenMission={onOpenMission} onClose={() => onSelectNode(null)} />
        )
      }
      <UpgradeScreen isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
      {
        showMeCard && (
          <MeNodeDetails onClose={() => setShowMeCard(false)} onStartBreathing={() => { setShowMeCard(false); if (onOpenBreathing) onOpenBreathing(); else setShowBreathing(true); }} />
        )
      }
      {
        showBreathing && !onOpenBreathing && (
          <BreathingOverlay onClose={() => setShowBreathing(false)} />
        )
      }

      {/*  أرشيف سؤال اليوم  */}
      <DailyJournalArchive
        isOpen={showJournalArchive}
        onClose={() => setShowJournalArchive(false)}
      />

      {/*  نبضة الظل — Shadow Pulse Alert  */}
      {
        !journeyMode && (
          <ShadowPulseAlert onSelectNode={handleNodeClick} />
        )
      }

      {/*  Floating Action Menu — القائمة العائمة  */}
      {
        !journeyMode && mode === "focus" && (
          <FloatingActionMenu
            onAddPerson={() => {
              onSelectNode(null);
              setShowAddPerson(true);
            }}
            onOpenInsights={() => setShowDashboard((v) => !v)}
            onOpenSettings={() => undefined}
            onToggleAI={openLiveRoute}
            isAIConnected={isConnected}
            showAIOption={true}
          />
        )
      }

      {/*  Insights Sidebar — الشريط الجانبي إحصائيات  */}
      {
        !journeyMode && (mode === "insights" || mode === "adaptive") && (
          <InsightsSidebar onOpenArchive={() => setShowJournalArchive(true)} />
        )
      }

      {/*  Tab Navigation — التبويبات (Desktop Only — Mobile uses AppChromeShell nav)  */}
      {
        !journeyMode && (
          <div className="hidden md:block fixed bottom-0 left-0 right-0 z-50">
            <TabNavigation
              hidden={hideBottomDock}
              onPulse={onOpenPulse}
              onLibrary={onOpenLibrary}
              onProfile={onOpenProfile}
            />
          </div>
        )
      }

      {/*  Layout Mode Switcher — مُبدّل الأوضاع  */}
      {
        !journeyMode && !hideBottomDock && (
          <LayoutModeSwitcher />
        )
      }
    
       {/* Feeling Check Modal (Masafaty) */}
      <Suspense fallback={null}>
        <AnimatePresence>
          {showFeelingCheck && (
            <FeelingCheckModal onClose={() => setShowFeelingCheck(false)} />
          )}
        </AnimatePresence>
      </Suspense>

      {/* Exit Warp Flash: Subconscious Arrival */}
      <AnimatePresence>
        {isExitingWarp && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="fixed inset-0 z-[200] pointer-events-none"
            style={{ 
              background: "radial-gradient(circle at center, white 0%, transparent 80%)",
              backgroundColor: "white" 
            }}
          />
        )}
      </AnimatePresence>
      </motion.main >
  );
};
