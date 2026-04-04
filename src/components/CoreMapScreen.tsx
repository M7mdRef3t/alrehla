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
import { FloatingActionMenu } from "./FloatingActionMenu";
import { InsightsSidebar } from "./InsightsSidebar";
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
import { ContextNotePanel } from "./ContextNotePanel";
import { MapAnalyticalPanel, MapOperationalStrip, MapSupportPanel } from "./Map/CoreMapPanels";
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
  useGraphSync(); // ØªÙØ¹ÙŠÙ„ Ù…ÙŠØ²Ø© Ø¥ØªØ§Ø­Ø© Ø§Ù„Ø¬Ø±Ø§Ù
  useAdaptiveLayout(); // ØªÙØ¹ÙŠÙ„ Ù†Ø¸Ø§Ù… Ø§Ù„ØªØ®Ø·ÙŠØ· Ø§Ù„ØªÙƒÙŠÙ‘ÙÙŠ

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

  // â”€â”€ 10-Second Mirror Integration â”€â”€
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
      className="flex-1 w-full h-full relative flex flex-col pb-0 atmospheric-void overflow-hidden"
      aria-labelledby="core-map-title"
      onDrop={handleMainDrop}
      initial="hidden"
      animate="visible"
    >
      {/* ── Cinematic ambient background ── */}
      <div aria-hidden className="fixed inset-0 pointer-events-none bg-[#030712] overflow-hidden" style={{ zIndex: -1 }}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/15 via-[#030712] to-[#030712]" />
        
        <div style={{
          position: "absolute", width: "150vw", height: "150vh", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(13, 148, 136, 0.06) 0%, transparent 60%)",
          top: "-50%", right: "-20%",
          animation: "av-orb-drift 60s ease-in-out infinite alternate"
        }} />
        <div style={{
          position: "absolute", width: "120vw", height: "120vh", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(234, 179, 8, 0.03) 0%, transparent 60%)",
          bottom: "-30%", left: "-30%",
          animation: "av-orb-drift 75s ease-in-out infinite alternate-reverse"
        }} />
        <div style={{
          position: "absolute", width: "100vw", height: "100vh", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(225, 29, 72, 0.03) 0%, transparent 60%)",
          top: "20%", left: "10%",
          animation: "av-orb-drift 50s ease-in-out infinite alternate"
        }} />
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
          WebkitMaskImage: "radial-gradient(ellipse 100% 100% at 50% 50%, black 10%, transparent 80%)",
          maskImage: "radial-gradient(ellipse 100% 100% at 50% 50%, black 10%, transparent 80%)",
          opacity: 0.25
        }} />
      </div>
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
      <motion.header 
        variants={staggerContainer}
        className="relative z-20 text-center px-4 sm:px-6 pt-4 pb-1 flex flex-col items-center gap-2 pointer-events-none"
      >
        <AnimatePresence>
          {/* HIDDEN */ isLegacyUiEnabled() && !isSacredIsolation && (
            <motion.div
              variants={cosmicFade}
              className="flex flex-col items-center"
            >
              <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] mb-4" style={{ borderColor: "rgba(20,184,166,0.3)", background: "rgba(20,184,166,0.08)", color: "#5eead4" }}>
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse shadow-[0_0_12px_rgba(45,212,191,0.8)]" />
                 Sovereign Radar
              </div>

              <h1
                id="core-map-title"
                className="font-black text-2xl sm:text-3xl lg:text-4xl tracking-widest uppercase mb-1 select-none"
                style={{ color: "var(--text-primary)" }}
              >
                <div className="pointer-events-auto">
                    <EditableText id={pageTitleKey} defaultText={pageTitle} page="map" />
                </div>
              </h1>

              <p
                className="text-[11px] md:text-xs tracking-widest max-w-[45ch] mx-auto font-medium select-none pointer-events-auto uppercase" style={{ color: "#8faab8" }}
              >
                <EditableText id={subtitleKey} defaultText={subtitle} page="map" multiline showEditIcon={false} />
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* 
          Ø§Ù„Ù…Ù†Ø·Ù‚Ø© Ø§Ù„Ø£ÙˆÙ„Ù‰ â€” Ù…Ø¤Ø´Ø±Ø§Øª Ø§Ù„ÙˆØ¶Ø¹ + Ø³Ø¤Ø§Ù„ Ø§Ù„ÙŠÙˆÙ…
          ØªØ¸Ù‡Ø± Ø¯Ø§Ø¦Ù…Ù‹Ø§ (60% Ù…Ù† Ø§Ù„Ø§Ù‡ØªÙ…Ø§Ù… Ø§Ù„Ø¨ØµØ±ÙŠ)
           */}
      {/* HIDDEN: full HUD area */ isLegacyUiEnabled() && !journeyMode && activeNodes.length > 0 && (
        <div className="relative w-full z-30">
          <div className="max-w-[34rem] mx-auto px-4 pt-2 pb-3 flex flex-col items-center">

            {/* 1? HUD: OPERATIONAL (Sanctuary Mode) */}
            {/* HIDDEN */ isLegacyUiEnabled() && activeTab === "operational" && (
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

            {/* 2? HUD: ANALYTICAL (Observatory Mode) */}
            {activeTab === "analytical" && (
              <MapAnalyticalPanel
                segmentedView={segmentedView}
                onSegmentChange={setSegmentedView}
              />
            )}
            {/* 3ï¸ HUD: NARRATIVE (Chronicle Mode) */}
            {activeTab === "narrative" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full pointer-events-auto space-y-6 pt-6 max-h-[80vh] overflow-y-auto no-scrollbar pb-32"
              >
                <div className="border-r-2 border-indigo-500/30 pr-4">
                  <h2 className="text-xl font-black text-white mb-1">Ø§Ù„Ù…Ø³Ø§Ø±</h2>
                  <p className="text-xs text-white/40">Ø³Ø¬Ù„ ØªØ·ÙˆÙ‘Ø±Ùƒ Ø¹Ø¨Ø± Ø§Ù„Ø²Ù…Ù†</p>
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

      {/* â”€â”€ Sacred Isolation & Soul Geometry Toolbar â”€â”€ */}
      <div className="fixed top-[calc(env(safe-area-inset-top)+6.5rem)] md:top-[calc(env(safe-area-inset-top)+7rem)] right-4 z-[70] flex gap-2" style={{ display: 'none' }}>
        <button
          onClick={() => setIsSacredIsolation(!isSacredIsolation)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isSacredIsolation ? 'bg-teal-500 text-white shadow-[0_0_15px_rgba(45,212,191,0.5)]' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
          title={isSacredIsolation ? "Ø¥ÙŠÙ‚Ø§Ù Ø§Ù„Ø¹Ø²Ù„Ø© Ø§Ù„Ù…Ù‚Ø¯Ø³Ø©" : "ØªÙØ¹ÙŠÙ„ Ø§Ù„Ø¹Ø²Ù„Ø© Ø§Ù„Ù…Ù‚Ø¯Ø³Ø©"}
        >
          <Mic className={`w-5 h-5 ${isSacredIsolation ? 'animate-pulse' : ''}`} />
        </button>
        <button
          onClick={() => setShowSoulGeometry(true)}
          className="w-10 h-10 rounded-full bg-white/5 text-white/40 flex items-center justify-center hover:bg-white/10 transition-all"
          title="ØªÙˆÙ„ÙŠØ¯ Ø¨ØµÙ…Ø© Ø§Ù„Ø±ÙˆØ­"
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
          Ø§Ù„Ù†Ø¨Ø¶Ø© Ø§Ù„ØªÙƒØªÙŠÙƒÙŠØ©: ØªØ·ÙÙˆ Ø£Ø³ÙÙ„ Ø§Ù„Ø®Ø±ÙŠØ·Ø© Ù„Ø³Ù‡ÙˆÙ„Ø© Ø§Ù„ÙˆØµÙˆÙ„
      */}
      {/* HIDDEN */ isLegacyUiEnabled() && !isSacredIsolation && !journeyMode && (
        <div className="relative w-full z-30 flex justify-center my-2 md:fixed md:left-1/2 md:bottom-[8.5rem] md:-translate-x-1/2 md:my-0 md:z-40">
          <DailyPulseWidget />
        </div>
      )}

      {/* 
          Ø§Ù„Ù…Ù†Ø·Ù‚Ø© Ø§Ù„Ø¯Ø§Ø¹Ù…Ø© â€” ØªÙØ§ØµÙŠÙ„ Ø§Ù„Ø®Ø±ÙŠØ·Ø© ÙˆÙ…ÙÙ„Ø®Ù‘Øµ Ø§Ù„Ù…Ø­Ø·Ø§Øª (30%)
           */}
      {/* HIDDEN */ isLegacyUiEnabled() && !journeyMode && (
        <motion.div
          variants={cosmicFade}
          style={{
            order: sectionOrder["dashboard-details"],
            transition: `order ${adaptiveLayout.transitions.duration}ms ${adaptiveLayout.transitions.easing}`,
          }}
        >
          <MapSupportPanel
            show={showDashboard}
            onToggle={() => setShowDashboard((v) => !v)}
            activeNodesCount={activeNodes.length}
            greenNodesCount={greenNodes.length}
            archivedNodesCount={archivedNodes.length}
            contextAtlas={contextAtlas}
            relationshipWeather={relationshipWeather}
            isUnifiedMode={galaxyMode}
            selectedContexts={selectedContexts}
            onToggleUnifiedContexts={handleToggleUnifiedContexts}
            onToggleContext={toggleContext}
            onFocusContext={handleFocusContext}
            onSelectNode={handleNodeClick}
          />
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
                Ø±Ø¨Ø· Ø£ÙŠØ§Ù… Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ Ø¨Ù†Ø´Ø§Ø· Ø£Ùˆ Ø´Ø®Øµ
              </h2>
              <button
                type="button"
                onClick={() => setShowWeekdayLabelsModal(false)}
                className="p-1.5 rounded-full transition-colors"
                style={{ color: "var(--text-muted)" }}
                aria-label="Ø¥ØºÙ„Ø§Ù‚"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
              Ø¹Ù†Ø¯ Ù…Ù„Ø§Ø­Ø¸Ø© Ù†Ø¨Ø¶Ø§Øª ÙÙŠ Ø§Ù†Ø®ÙØ§Ø¶ØŒ Ø§Ù„Ø±Ø¨Ø· Ø¨Ù†Ø´Ø§Ø· Ø£Ùˆ Ø´Ø®Øµ ÙŠÙØ³Ù‘Ø± Ø§Ù„ØªÙƒØ±Ø§Ø± Ø¯Ù‡ Ø£ÙƒØ«Ø±.
            </p>
            <div className="space-y-2">
              {PULSE_DAY_NAMES.map((dayName, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{dayName}</span>
                  <input
                    type="text"
                    value={weekdayLabels[i] ?? ""}
                    onChange={(e) => setWeekdayLabel(i, e.target.value || null)}
                    placeholder="Ù…Ø«Ø§Ù„: Ø§Ø¬ØªÙ…Ø§Ø¹ Ù…Ø¹ Ø§Ù„Ù…Ø¯ÙŠØ±"
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
              ØªÙ…Ù‘
            </button>
          </motion.div>
        </div>
      )}

      <GoogleAuthModal
        isOpen={isCloudAuthOpen}
        onClose={() => setIsCloudAuthOpen(false)}
        onGuestMode={() => setIsCloudAuthOpen(false)}
        onNotNow={() => setIsCloudAuthOpen(false)}
        intent={{ kind: "ai_focus", createdAt: Date.now() }}
      />

      {/*  Status Cards (Pulse Modes)  */}
      {
        isLegacyUiEnabled() && pulseMode === "low" && (
          <motion.div
            className="mt-5 mx-auto max-w-[38rem] card-unified status-card-low px-4 py-4 text-right"
            variants={cosmicFade}
            style={{
              order: sectionOrder["status-card"],
              transition: `order ${adaptiveLayout.transitions.duration}ms ${adaptiveLayout.transitions.easing}`,
            }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Ø§Ù„Ø·Ø§Ù‚Ø© Ù…Ù†Ø®ÙØ¶Ø©.. Ø£Ù†Øª ÙÙŠ Ù…Ù†Ø·Ù‚Ø© Ø¶ØºØ·
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
              Ù†ÙÙ‘Ø° Ø®Ø·ÙˆØ© ØµØºÙŠØ±Ø© ÙˆØ§Ø­Ø¯Ø© Ø¨Ø³ â€” Ù…Ù† ØºÙŠØ± Ø£ÙŠ Ø§Ø´ØªØ¨Ø§Ùƒ.
            </p>
            {suppressLowPulseCocoon ? (
              <p className="mt-3 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                ØªÙ…Ù‘ ØªÙ†ÙÙŠØ° Ø¬ÙˆÙ„Ø© Ø§Ù„Ø´Ø­Ù†. Ø®ÙØ¯ Ø¨Ø¯Ø§ÙŠØ© Ù‡Ø§Ø¯ÙŠØ© Ù…Ø¹ Ø®Ø·ÙˆØ© Ø¨Ø³ÙŠØ·Ø© Ø¹Ù„Ù‰ Ø§Ù„Ø®Ø±ÙŠØ·Ø©.
              </p>
            ) : (
              <button
                type="button"
                onClick={onOpenCocoon}
                className="mt-3 w-full cta-muted py-2.5 text-sm font-semibold transition-all hover:bg-white/10"
                style={{ borderColor: "rgba(148, 163, 184, 0.3)" }}
              >
                Ø¬ÙˆÙ„Ø© Ø´Ø­Ù†
              </button>
            )}
          </motion.div>
        )
      }

      {
        isLegacyUiEnabled() && (pulseMode === "low" ? null : (
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
                  Ø§Ù„Ø±Ø§Ø¯Ø§Ø± ÙŠØ±ØµØ¯ Ø¶Ø¬ÙŠØ¬ Ø¹Ø§Ù„ÙŠ.. Ø«Ø¨Ù‘Øª Ø­Ø§Ù„Ùƒ Ø§Ù„Ø£ÙˆÙ„
                </p>
                <p className="text-xs mt-1" style={{ color: "#fda4af" }}>
                  Ù‚Ø¨Ù„ Ø£ÙŠ Ù‚Ø±Ø§Ø±ØŒ Ø§ÙØµÙ„ Ø§Ù„Ù…Ø´Ø§Ø¹Ø± Ø§Ù„Ù…Ø´ØªØ¹Ù„Ø© ÙˆØ§Ø±Ø¬Ø¹ ØªØ­Øª Ø§Ù„Ø³ÙŠØ·Ø±Ø©.
                </p>
                <button
                  type="button"
                  onClick={onOpenNoise}
                  className="mt-3 w-full cta-danger py-2.5 text-sm font-semibold"
                >
                  Ø¥Ø³ÙƒØ§Øª Ø§Ù„Ø¶Ø¬ÙŠØ¬
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
                  Ø§Ù„Ø·Ø§Ù‚Ø© Ù…Ù…ØªØ§Ø²Ø©.. ÙˆÙ‚Øª ØªØ­Ø¯Ù‘ÙŠ Ø§Ù„Ù…Ø³Ø§Ø±
                </p>
                <p className="text-xs mt-1" style={{ color: "#5eead4" }}>
                  {challengeLabel ?? "Ø¬Ø§Ù‡Ø² Ù„Ù„Ø®Ø·ÙˆØ© Ø§Ù„ÙˆØ§Ø±Ø¯Ø©"}
                </p>
                <button
                  type="button"
                  onClick={onOpenChallenge}
                  className="mt-3 w-full cta-primary py-2.5 text-sm font-semibold disabled:opacity-40"
                  disabled={!onOpenChallenge}
                >
                  Ø§Ø¨Ø¯Ø£ Ø§Ù„ØªØ­Ø¯ÙŠ
                </button>
              </motion.div>
            )}

            {/*  Controls Bar (HUD Right)  */}
            <motion.div
              className="fixed z-20 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-4 right-4 flex flex-col items-stretch gap-3 pointer-events-auto md:left-auto md:right-4 md:max-w-sm md:items-end"
              variants={cosmicFade}
              style={{
                display: 'none', order: sectionOrder["controls-bar"],
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
                title={galaxyMode ? "Ø§Ø±Ø¬Ø¹ Ù„Ù„Ù…Ø³Ø§Ø± Ø§Ù„ÙˆØ§Ø­Ø¯" : "Ø¹Ø±Ø¶ ÙƒÙ„ Ø§Ù„Ø¯ÙˆØ§Ø¦Ø±"}
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
                    title="Ø¹Ø±Ø¶ Ø§Ù„Ø®Ø±ÙŠØ·Ø©"
                  >
                    <Map className="w-4 h-4" />
                    <EditableText id="map_view_mode_map" defaultText="Ø§Ù„Ø®Ø±ÙŠØ·Ø©" page="map" editOnClick={false} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!canUseFamilyTree) { onFeatureLocked?.("family_tree"); return; }
                      setViewMode("tree");
                    }}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${viewMode === "tree" ? "cta-primary" : ""}`}
                    style={viewMode !== "tree" ? { color: canUseFamilyTree ? "var(--text-secondary)" : "var(--text-muted)" } : {}}
                    title="Ø´Ø¬Ø±Ø© Ø§Ù„Ø¹Ø§Ø¦Ù„Ø©"
                  >
                    <TreeDeciduous className="w-4 h-4" />
                    {canUseFamilyTree
                      ? <EditableText id="map_view_mode_tree" defaultText="Ø´Ø¬Ø±Ø© Ø§Ù„Ø¹Ø§Ø¦Ù„Ø©" page="map" editOnClick={false} />
                      : <EditableText id="map_view_mode_tree_locked" defaultText="Ø´Ø¬Ø±Ø© Ø§Ù„Ø¹Ø§Ø¦Ù„Ø© ðŸ”’" page="map" editOnClick={false} />
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
                title="ØªÙØ±ÙŠØº ØµÙˆØªÙŠ"
                aria-label="ØªÙØ±ÙŠØº ØµÙˆØªÙŠ"
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
        ))
      }

      {/*  Pulse Insight (HUD Top Left)  */}
      {
        isLegacyUiEnabled() ? null : pulseInsight ? (
          <motion.div className="absolute z-20 top-[calc(env(safe-area-inset-top)+6.5rem)] md:top-[calc(env(safe-area-inset-top)+7rem)] left-4 w-64 glass-card bg-slate-950/70 border border-indigo-500/20 shadow-2xl backdrop-blur-md px-3 py-3 text-right pointer-events-auto rounded-lg" variants={cosmicFade}>
            <p className="text-xs font-semibold" style={{ color: "rgba(167, 139, 250, 0.9)" }}>{pulseInsight?.title}</p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: "rgba(167, 139, 250, 0.6)" }}>{pulseInsight?.body}</p>
            <button
              type="button"
              onClick={() => setShowWeekdayLabelsModal(true)}
              className="mt-2 text-xs font-medium hover:underline"
              style={{ color: "rgba(167, 139, 250, 0.7)" }}
            >
               Ø±Ø¨Ø· Ø¨Ù†Ø´Ø§Ø· Ø£Ùˆ Ø´Ø®Øµ
            </button>
          </motion.div>
        ) : null
      }

      {/*  Next Step Decision (HUD Bottom Left)  */}
      {
        isLegacyUiEnabled() ? null : (nextStepDecision && onTakeNextStep && onRefreshNextStep) ? (
          <div className="absolute z-20 bottom-[12vh] left-4 w-72 origin-bottom-left scale-95 pointer-events-auto">
            <NextStepCard
              decision={nextStepDecision}
              onTakeAction={onTakeNextStep}
              onRefresh={onRefreshNextStep}
            />
          </div>
        ) : null
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
                  className="absolute inset-0 w-full h-full z-0 flex flex-col items-center justify-center"
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
                  className="absolute inset-0 w-full h-full z-0 flex flex-col items-center justify-center"
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
                    {/* HIDDEN */ isLegacyUiEnabled() && mapType === "masafaty" && (
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

            {/*  Empty State — Mothership Waiting  */}
            {nodes.length === 0 && !showOnboarding && !journeyMode && (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                role="status"
                aria-live="polite"
              >
                {/* Animated radar pulsar */}
                <div className="relative mb-6 pointer-events-none select-none">
                  <svg width="80" height="80" viewBox="0 0 80 80">
                    {/* Pulsing rings */}
                    {[0, 0.6, 1.2].map((delay, i) => (
                      <motion.circle
                        key={i}
                        cx="40" cy="40" r="20"
                        fill="none"
                        stroke="rgba(45,212,191,0.6)"
                        strokeWidth="1"
                        animate={{ r: [20, 38], opacity: [0.7, 0] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay }}
                      />
                    ))}
                    {/* Center orb */}
                    <motion.circle
                      cx="40" cy="40" r="10"
                      fill="url(#emptyStateGrad)"
                      animate={{ scale: [1, 1.12, 1], opacity: [0.85, 1, 0.85] }}
                      style={{ transformOrigin: "40px 40px" }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <circle cx="40" cy="40" r="4" fill="white" opacity={0.9} style={{ filter: "blur(1px)" }} />
                    <circle cx="38" cy="38" r="1.5" fill="white" opacity={0.7} />
                    {/* Radar sweep */}
                    <motion.line
                      x1="40" y1="40" x2="40" y2="10"
                      stroke="rgba(45,212,191,0.8)"
                      strokeWidth="1"
                      strokeLinecap="round"
                      animate={{ rotate: [0, 360] }}
                      style={{ transformOrigin: "40px 40px" }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                    <defs>
                      <radialGradient id="emptyStateGrad" cx="50%" cy="40%" r="60%">
                        <stop offset="0%" stopColor="#5eead4" />
                        <stop offset="100%" stopColor="#0d9488" />
                      </radialGradient>
                    </defs>
                  </svg>
                </div>

                {/* Text content */}
                <div className="text-center px-6 pointer-events-auto">
                  <motion.h3
                    className="text-xl font-black mb-2"
                    style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}
                    animate={{ opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <EditableText id="map_empty_title" defaultText={mapCopy.emptyMapTitle} page="map" />
                  </motion.h3>
                  <p className="text-sm mb-4 max-w-[220px] mx-auto leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    <EditableText id="map_empty_hint" defaultText={mapCopy.emptyMapHint} page="map" multiline showEditIcon={false} />
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    <EditableText id="map_empty_reassurance" defaultText={mapCopy.emptyMapReassurance} page="map" showEditIcon={false} />
                  </p>
                </div>
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
                  ØªÙ… Ø¥Ø¶Ø§ÙØ© <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{lastAddedNode.label}</span>{" "}
                  ÙÙŠ{" "}
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
                    ? ". Ø§Ø¶ØºØ· Ø¹Ù„ÙŠÙ‡ Ù„Ù„ØªÙ Ø§ØµÙŠÙ„ Ø£Ùˆ Ø§Ø³Ø­Ø¨Ù‡ Ù„Ùˆ Ø¹Ø§ÙŠØ² ØªØºÙŠÙ‘Ø± Ù…ÙƒØ§Ù†Ù‡."
                    : ". Ø§Ù„ØªÙ Ø§ØµÙŠÙ„ Ù…Ù‚Ù Ù„Ø© Ø­Ø§Ù„ÙŠØ§Ù‹ â€” Ù Ø¹Ù‘Ù„ Feature Flags."}
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
                  title="Ø§Ù ØªØ­ Ø§Ù„Ø´Ø®Øµ"
                  aria-label="Ø§Ù ØªØ­ Ø§Ù„Ø´Ø®Øµ"
                >
                  Ø§Ù ØªØ­
                </button>
              )}
              <button type="button" onClick={dismissPlacementTooltip} className="rounded-full p-1.5 transition-colors" style={{ color: "var(--text-muted)" }} title="Ø¥ØºÙ„Ø§Ù‚" aria-label="Ø¥ØºÙ„Ø§Ù‚">

              </button>
            </div>
          </motion.div>
        )
      }

      {/*  Ring Legend — Premium Floating HUD  */}
      {!journeyMode && activeNodes.length > 0 && (
        <motion.div
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-30 pointer-events-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] }}
          aria-label="علامات دوائر المسافة"
        >
          <div
            className="flex items-center gap-1 px-3 py-2 rounded-2xl"
            style={{
              background: "rgba(3,7,18,0.7)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            {(["green", "yellow", "red"] as const).map((key, idx) => {
              const isActive = legendTooltip === key;
              const config = legendConfig[key];
              return (
                <div key={key} className="relative flex items-center">
                  {isActive && (
                    <motion.div
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap z-10"
                      style={{
                        background: "rgba(3,7,18,0.95)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        backdropFilter: "blur(12px)",
                        color: config.dotColor,
                        boxShadow: `0 4px 20px ${config.dotGlow}`,
                      }}
                      initial={{ opacity: 0, y: 4, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      role="tooltip"
                    >
                      <EditableText id={config.labelKey} defaultText={config.label} page="map" showEditIcon={false} />
                      <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent" style={{ borderTopColor: "rgba(3,7,18,0.95)" }} />
                    </motion.div>
                  )}
                  <button
                    type="button"
                    onClick={() => setLegendTooltip((prev) => (prev === key ? null : key))}
                    className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all"
                    style={{
                      background: isActive ? `${config.dotGlow}` : "transparent",
                      border: isActive ? `1px solid ${config.dotColor}30` : "1px solid transparent",
                    }}
                    aria-label={config.label}
                    aria-expanded={isActive}
                  >
                    <motion.span
                      className="block rounded-full"
                      style={{
                        width: 8, height: 8,
                        background: config.dotColor,
                        boxShadow: `0 0 ${isActive ? 12 : 6}px ${config.dotGlow}`,
                      }}
                      animate={{ boxShadow: [`0 0 6px ${config.dotGlow}`, `0 0 14px ${config.dotGlow}`, `0 0 6px ${config.dotGlow}`] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <span
                      className="text-[10px] font-semibold tracking-wide hidden sm:block"
                      style={{ color: isActive ? config.dotColor : "rgba(255,255,255,0.45)" }}
                    >
                      <EditableText id={config.labelKey} defaultText={config.label} page="map" editOnClick={false} />
                    </span>
                  </button>
                  {idx < 2 && <span className="w-px h-4 mx-1" style={{ background: "rgba(255,255,255,0.08)" }} />}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
      <p className="sr-only" title={mapCopy.threatLevelHint}>
        <EditableText id="map_threat_level_hint" defaultText={mapCopy.threatLevelHint} page="map" multiline showEditIcon={false} />
      </p>

      {/* ── Premium FAB — Add Person ── */}
      {!journeyMode && (
        <motion.button
          type="button"
          id="map-fab-add-person"
          className="fixed z-40 pointer-events-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50"
          style={{
            bottom: `calc(5.5rem + env(safe-area-inset-bottom))`,
            right: "1.25rem",
            width: 56,
            height: 56,
            borderRadius: "20px",
            background: "linear-gradient(135deg, #2DD4BF 0%, #0D9488 50%, #0f766e 100%)",
            boxShadow: "0 4px 24px rgba(45,212,191,0.45), 0 0 0 1px rgba(45,212,191,0.2), inset 0 1px 0 rgba(255,255,255,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
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
          aria-label={mapCopy.addPersonTitle}
          whileHover={{
            scale: 1.1,
            boxShadow: "0 8px 40px rgba(45,212,191,0.65), 0 0 0 2px rgba(45,212,191,0.35), inset 0 1px 0 rgba(255,255,255,0.3)",
          }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {activeNodes.length > 0 && (
            <motion.span
              className="absolute -top-2 -right-2 min-w-[20px] h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white"
              style={{
                background: "linear-gradient(135deg, #1e293b, #0f172a)",
                border: "1.5px solid rgba(45,212,191,0.5)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                padding: "0 4px",
              }}
              key={activeNodes.length}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500 }}
            >
              {activeNodes.length}
            </motion.span>
          )}
        </motion.button>
      )}

      {/* â”€â”€ Context Note Panel â”€â”€ shows when a node is selected */}
      <AnimatePresence>
        {selectedNodeId && (
          <div
            className="fixed bottom-24 md:bottom-8 right-4 left-4 md:right-auto md:left-auto md:w-80 z-[60]"
            style={{ fontFamily: "inherit" }}
          >
            <ContextNotePanel
              nodeId={selectedNodeId}
              nodeLabel={nodes.find((n) => n.id === selectedNodeId)?.label ?? selectedNodeId}
              onClose={() => onSelectNode(null)}
            />
          </div>
        )}
      </AnimatePresence>

      {/*  Journey complete  */}
      {
        journeyMode && onJourneyComplete && (
          <div className="mt-8 flex flex-col items-center gap-2">
            <button type="button" onClick={onJourneyComplete} disabled={!canCompleteJourneyStep} className="cta-primary px-6 py-3 font-semibold disabled:opacity-40 disabled:cursor-not-allowed">
              Ø£ÙƒÙ…Ù„ Ø§Ù„Ù…Ø±Ø­Ù„Ø©
            </button>
            {!canCompleteJourneyStep && nodes.length > 0 && (
              <p className="text-sm max-w-xs text-center" style={{ color: "var(--text-muted)" }}>
                Ø§ÙØªØ­ Ø§Ù„Ø¯Ø§Ø¦Ø±Ø© ÙˆØ±Ø§Ø¬Ø¹ Ø§Ù„ØªÙˆØ¬Ù‘Ù‡ ÙˆÙ…Ø³Ø§Ø± Ø§Ù„Ø­Ø§Ù„Ø© Ø£Ùˆ ÙƒÙ…Ù‘Ù„ Ø§Ù„ØªØ¯Ø±ÙŠØ¨ØŒ Ø¨Ø¹Ø¯Ù‡Ø§ Ø§Ø¶ØºØ· "Ø£ÙƒÙ…Ù„ Ø§Ù„Ù…Ø±Ø­Ù„Ø©"
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

      {/*  Ø£Ø±Ø´ÙŠÙ Ø³Ø¤Ø§Ù„ Ø§Ù„ÙŠÙˆÙ…  */}
      <DailyJournalArchive
        isOpen={showJournalArchive}
        onClose={() => setShowJournalArchive(false)}
      />

      {/*  Ù†Ø¨Ø¶Ø© Ø§Ù„Ø¸Ù„ â€” Shadow Pulse Alert  */}
      {
        isLegacyUiEnabled() && !journeyMode && (
          <ShadowPulseAlert onSelectNode={handleNodeClick} />
        )
      }

      {/*  Floating Action Menu â€” Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø¹Ø§Ø¦Ù…Ø©  */}
      {
        isLegacyUiEnabled() && !journeyMode && mode === "focus" && (
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

      {/*  Insights Sidebar â€” Ø§Ù„Ø´Ø±ÙŠØ· Ø§Ù„Ø¬Ø§Ù†Ø¨ÙŠ Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª  */}
      {
        isLegacyUiEnabled() && !journeyMode && (mode === "insights" || mode === "adaptive") && (
          <InsightsSidebar onOpenArchive={() => setShowJournalArchive(true)} />
        )
      }

      {/*  Tab Navigation â€” Ø§Ù„ØªØ¨ÙˆÙŠØ¨Ø§Øª (Desktop Only â€” Mobile uses AppChromeShell nav)  */}
      {
        isLegacyUiEnabled() && !journeyMode && (
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

      {/*  Layout Mode Switcher â€” Ù…ÙØ¨Ø¯Ù‘Ù„ Ø§Ù„Ø£ÙˆØ¶Ø§Ø¹  */}
      {
        isLegacyUiEnabled() && !journeyMode && !hideBottomDock && (
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


