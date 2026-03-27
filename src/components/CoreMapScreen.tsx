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
import { ContextNotePanel } from "./ContextNotePanel";
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
const CyberGrid: FC<{ harmonyColor: string }> = ({ harmonyColor }) => {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-20">
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, ${harmonyColor}22 1px, transparent 1px),
            linear-gradient(to bottom, ${harmonyColor}22 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(circle at center, black 30%, transparent 80%)"
        }}
        animate={{
          opacity: [0.1, 0.3, 0.1],
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
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
      className="flex-1 w-full h-screen relative flex flex-col overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse 60% 50% at 15% 10%, rgba(124,58,237,0.12) 0%, transparent 60%),
          radial-gradient(ellipse 50% 40% at 85% 90%, ${harmony.color}15 0%, transparent 50%),
          radial-gradient(ellipse 40% 40% at 50% 50%, rgba(20,184,166,0.05) 0%, transparent 70%),
          #050510
        `
      }}
      aria-labelledby="core-map-title"
      onDrop={handleMainDrop}
      initial="hidden"
      animate="visible"
    >
      {/* ── Layer 0: The Hero Background (The Map) ── */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <CyberGrid harmonyColor={harmony.color} />
        
        {/* Harmony Indicator Line */}
        <motion.div
           className="absolute top-0 left-0 right-0 h-[2.5px] z-[110] pointer-events-none"
           animate={{
             background: `linear-gradient(to right, transparent, ${harmony.color}, ${harmony.color}88, transparent)`,
             opacity: [0.4, 0.8, 0.4],
             scaleX: [0.9, 1, 0.9]
           }}
           transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* The Actual Map Content */}
        {!journeyMode && (
           <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              <AnimatePresence mode="wait">
                {galaxyMode && canUseGalaxyView && galaxySubView === "forest" ? (
                  <motion.div key="forest" className="w-full h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ForestView onNodeClick={handleNodeClick} />
                  </motion.div>
                ) : galaxyMode ? (
                  <motion.div key="galaxy" className="w-full h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <MapCanvas
                      onNodeClick={handleNodeClick}
                      canOpenDetails={canUseBasicDiagnosis}
                      onMeClick={() => { if (!canUseMirror) { onFeatureLocked?.("mirror_tool"); return; } setShowMeCard(true); }}
                      galaxyGoalIds={selectedContexts.length > 0 ? selectedContexts : ["family", "work", "love", "general"]}
                      highlightNodeId={selectedNodeId}
                      isSovereign={isSovereign}
                      aiState={{ isConnected, isListening, isSpeaking, onToggle: openLiveRoute, onNodeDrop: handleNodeDropOnAI }}
                    />
                  </motion.div>
                ) : (
                  <motion.div key="single" className="w-full h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <MapCanvas
                      onNodeClick={handleNodeClick}
                      canOpenDetails={canUseBasicDiagnosis}
                      onMeClick={() => { if (!canUseMirror) { onFeatureLocked?.("mirror_tool"); return; } setShowMeCard(true); }}
                      goalIdFilter={goalId}
                      highlightNodeId={selectedNodeId}
                      isSovereign={isSovereign}
                      aiState={{ isConnected, isListening, isSpeaking, onToggle: openLiveRoute, onNodeDrop: handleNodeDropOnAI }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
        )}
      </div>

      <SovereignBroadcastOverlay message={sovereignMessage} />

      {/* ── Layer 1: The Tactical HUD (Floating interface) ── */}
      <div className="relative z-10 flex flex-col h-full pointer-events-none overflow-hidden">
        
        {/* 1.1 Floating Header */}
        <motion.header 
          variants={cosmicFade} 
          className="w-full flex flex-col items-center pt-8 pb-4"
        >
          <AnimatePresence>
            {!isSacredIsolation && (
              <motion.div
                className="pointer-events-auto flex flex-col items-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="flex flex-col items-center gap-1 mb-2">
                   <div className="flex items-center gap-2 opacity-40">
                      <div className="h-px w-4 bg-amber-500/40" />
                      <span className="text-[8px] font-black uppercase tracking-[0.3em] text-amber-500">Cognitive OS</span>
                      <div className="h-px w-4 bg-amber-500/40" />
                   </div>
                   <h1 id="core-map-title" className="text-2xl font-black text-white">
                     <EditableText id={pageTitleKey} defaultText={pageTitle} page="map" />
                   </h1>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>

        {/* 1.2 Sidebar Overlays (Left/Right Widgets) */}
        {!isSacredIsolation && activeTab === "operational" && !journeyMode && (
          <div className="absolute inset-0 pointer-events-none z-20">
            {/* Right Sidebar: Relationship Intelligence */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 pointer-events-auto items-end">
              {contextAtlas && (
                <div className="flex flex-col items-end mb-2">
                  <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Context Atlas</span>
                  <div className="flex gap-1.5">
                    {contextAtlas.contexts.map((ctx) => (
                      <div key={ctx.key} className="w-2 h-2 rounded-full border border-white/10 bg-teal-500/40 shadow-[0_0_8px_rgba(20,184,166,0.3)]" />
                    ))}
                  </div>
                </div>
              )}
              {relationshipWeather && <RelationshipWeatherCard snapshot={relationshipWeather} />}
              {nextStepDecision && (
                <NextStepCard decision={nextStepDecision} onTakeAction={onTakeNextStep ?? (() => {})} onRefresh={onRefreshNextStep ?? (() => {})} />
              )}
            </div>

            {/* Left Sidebar: System Info */}
            <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 pointer-events-auto">
              <div className="glass-card p-3 border border-white/5 shadow-xl">
                 <DailyPulseWidget />
              </div>
              <div className="glass-card p-4 border-l-2 border-amber-500/40 w-48 shadow-2xl">
                <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-tighter mb-2">Stability index</h4>
                <TEIWidget />
              </div>
              <RelationshipPulse />
            </div>
          </div>
        )}

        {/* 1.3 Main HUD Area (Analytical/Narrative panels as full-screen overlays) */}
        <div className="flex-1 relative">
          <AnimatePresence>
            {(activeTab === "analytical" || activeTab === "narrative") && (
              <motion.div
                key="panel-fullscreen"
                initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                animate={{ opacity: 1, backdropFilter: "blur(24px)" }}
                exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                className="absolute inset-0 z-50 bg-black/70 pointer-events-auto overflow-y-auto no-scrollbar pb-32"
              >
                <div className="max-w-[42rem] mx-auto px-6 py-16">
                   {activeTab === "analytical" && (
                     <div className="space-y-10">
                        <div className="flex items-center justify-center gap-2 p-1 rounded-full bg-white/[0.03] border border-white/5 mx-auto w-fit">
                          {[
                            { id: "network", label: "الشبكة" },
                            { id: "stability", label: "الاستقرار" },
                            { id: "metrics", label: "المؤشرات" }
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              onClick={() => setSegmentedView(tab.id as "network" | "stability" | "metrics")}
                              className={`px-8 py-2 rounded-full text-xs font-black transition-all ${segmentedView === tab.id
                                ? "bg-amber-500 text-black shadow-lg shadow-amber-500/30"
                                : "text-white/30 hover:text-white/60"
                                }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        <div className="pt-4">
                          {segmentedView === "metrics" && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                              <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 text-right">
                                <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-4">Trauma Entropy Index</h3>
                                <TEIWidget />
                              </div>
                              <MapInsightPanel />
                            </motion.div>
                          )}
                          {segmentedView === "network" && <InfluenceNetwork />}
                          {segmentedView === "stability" && <StabilityHeatmap />}
                        </div>
                     </div>
                   )}

                   {activeTab === "narrative" && (
                     <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                        <div className="border-r-4 border-indigo-500/50 pr-6 mb-12">
                          <h2 className="text-3xl font-black text-white mb-2">المسار</h2>
                          <p className="text-sm text-white/40">سجل تطوّر الوعي عبر الزمن</p>
                        </div>
                        <WeeklyReportWidget />
                        <ShadowInsightPanel onSurface={(context) => setVoiceTrigger({ event: 'shadow_insight', context })} />
                        <ConsciousnessThread />
                        <div className="pt-8 flex justify-center"><ShareDialog /></div>
                     </motion.div>
                   )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 1.3 Floating Toolbar (Isolation/Geometry) */}
        {!journeyMode && (
          <div className="fixed top-8 right-8 z-[100] flex flex-col gap-3 pointer-events-auto">
            <button
              onClick={() => setIsSacredIsolation(!isSacredIsolation)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isSacredIsolation ? 'bg-teal-500 text-white shadow-[0_0_20px_rgba(45,212,191,0.6)]' : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'}`}
              title="العزلة المقدسة"
            >
              <Mic className={`w-5 h-5 ${isSacredIsolation ? 'animate-pulse' : ''}`} />
            </button>
            <button
              onClick={() => setShowSoulGeometry(true)}
              className="w-12 h-12 rounded-full bg-white/5 text-white/40 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
              title="بصمة الروح"
            >
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* 1.4 The Bottom HUD (Status, Controls, Legend) */}
        <div className="absolute inset-x-0 bottom-6 pointer-events-none z-50 flex flex-col items-center gap-6 px-6 overflow-visible">
            
            {/* Status Cards (Reactive HUD) */}
            <AnimatePresence>
              {activeTab === "operational" && !isSacredIsolation && !journeyMode && (
                <div className="w-full max-w-[36rem] pointer-events-auto">
                  {pulseMode === "low" && (
                    <motion.div className="glass-card p-5 text-right mb-4 border-l-4 border-slate-400/50 shadow-2xl" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                      <p className="text-sm font-black text-white/90">السكون ضروري الآن</p>
                      <p className="text-xs text-white/40 mt-1 mb-4">منطقة ضغط رادي — جولة شحن لتعديل المسار</p>
                      <button type="button" onClick={onOpenCocoon} className="w-full cta-muted py-3 text-xs font-black uppercase tracking-widest">
                        {suppressLowPulseCocoon ? "بدء استقرار تدريجي" : "بدء جولة الشحن"}
                      </button>
                    </motion.div>
                  )}

                  {pulseMode === "angry" && (
                    <motion.div className="glass-card p-5 text-right mb-4 border-l-4 border-red-500/50 shadow-2xl" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                      <p className="text-sm font-black text-red-100">تحذير: ضجيج راداري عالي</p>
                      <p className="text-xs text-white/40 mt-1 mb-4">تم رصد احتراق عاطفي — ثبّت حالك قبل الاشتباك</p>
                      <button type="button" onClick={onOpenNoise} className="w-full cta-danger py-3 text-xs font-black uppercase tracking-widest">إسكات الضجيج</button>
                    </motion.div>
                  )}

                  {pulseMode === "high" && (
                    <motion.div className="glass-card p-5 text-right mb-4 border-l-4 border-emerald-500/50 shadow-2xl" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                      <p className="text-sm font-black text-emerald-100">الطاقة في ذروتها</p>
                      <p className="text-xs text-white/40 mt-1 mb-4">القطاع آمن ومستقر — وقت التوسّع وتحدّي المسار</p>
                      <button type="button" onClick={onOpenChallenge} className="w-full cta-primary py-3 text-xs font-black uppercase tracking-widest">تحميل التحدي</button>
                    </motion.div>
                  )}
                </div>
              )}
            </AnimatePresence>

            {/*  Controls Bar (Operational Buttons)  */}
            {activeTab === "operational" && !journeyMode && (
              <motion.div className="flex items-center justify-center gap-4 flex-wrap pointer-events-auto" variants={cosmicFade}>
                <button
                  type="button"
                  hidden={!canUseGalaxyView}
                  onClick={() => setGalaxyMode((v) => !v)}
                  className={`glass-button px-6 py-2.5 text-[9px] font-black tracking-[0.2em] uppercase ${galaxyMode ? "text-amber-500 border-amber-500/30" : "text-white/40"}`}
                >
                  {galaxyMode ? "Lock Sector" : "Scan Galaxy"}
                </button>

                <motion.button
                  type="button"
                  className="w-12 h-12 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-white/60 hover:text-emerald-400 hover:border-emerald-500/30 transition-all shadow-lg"
                  onClick={() => setShowVoicePulse(true)}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <Mic size={20} />
                </motion.button>

                <motion.button
                  type="button"
                  className="cta-primary px-8 py-3 text-[10px] font-black leading-none tracking-[0.1em] uppercase shadow-[0_0_30px_rgba(251,191,36,0.2)]"
                  onClick={() => { onSelectNode(null); setShowAddPerson(true); }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Reroute / Add Entity
                </motion.button>
              </motion.div>
            )}

            {/*  Legend (Faded Presence)  */}
            {activeTab === "operational" && !journeyMode && (
              <motion.div className="flex justify-center gap-6 text-[8px] font-black uppercase tracking-widest pointer-events-auto opacity-30 hover:opacity-100 transition-opacity mb-24" variants={cosmicFade}>
                {(["green", "yellow", "red"] as const).map((key) => (
                  <div key={key} className="flex items-center gap-2">
                     <span className="w-1 h-1 rounded-full shadow-[0_0_8px_currentColor]" style={{ color: legendConfig[key].dotColor, backgroundColor: "currentColor" }} />
                     <span className="text-white/60">{legendConfig[key].label}</span>
                  </div>
                ))}
              </motion.div>
            )}
        </div>

        {/* 1.5 Global Navigation & Primary Action Hub (Fixed overlays) */}
        <div className="fixed inset-x-0 bottom-0 z-[100] pointer-events-none">
          {/* Tab Navigation (Central Anchor) */}
          <TabNavigation 
            onPulse={onOpenPulse}
            onLibrary={onOpenLibrary}
            onProfile={onOpenProfile}
            hidden={isSacredIsolation}
          />

          {/* Floating Action Menu (Primary Trigger) */}
          <FloatingActionMenu 
            onAddPerson={() => setShowAddPerson(true)}
            onOpenInsights={() => useLayoutState.getState().setActiveTab("analytical")}
            onOpenSettings={() => onOpenProfile?.()}
            onToggleAI={openLiveRoute}
            isAIConnected={isConnected}
          />
        </div>

        {/* 1.6 System Switches */}
        {!journeyMode && <LayoutModeSwitcher />}
      </div>

      {/* ── Layer 2: Global Modals & Overlays ── */}
      <AnimatePresence>
        {showSoulGeometry && <SoulGeometryOverlay onClose={() => setShowSoulGeometry(false)} />}
        {selectedNodeId && (
          <div className="fixed bottom-32 right-8 w-80 z-[110] pointer-events-auto">
             <ContextNotePanel
               nodeId={selectedNodeId}
               nodeLabel={nodes.find((n) => n.id === selectedNodeId)?.label ?? "Entity"}
               onClose={() => onSelectNode(null)}
             />
          </div>
        )}
      </AnimatePresence>

      <VoicePresence trigger={voiceTrigger} />

      {showAddPerson && (
        <AddPersonModal
          goalId={goalId}
          canUseFamilyTree={canUseFamilyTree}
          onClose={(openNodeId?: string) => { setShowAddPerson(false); onSelectNode(openNodeId ?? null); }}
          onOpenMission={onOpenMission}
          onOpenMissionFromAddPerson={onOpenMissionFromAddPerson}
        />
      )}

      {showVoicePulse && <VoicePulseModal onClose={() => setShowVoicePulse(false)} />}
      
      {selectedNodeId && canUseBasicDiagnosis && (
        <ViewPersonModal nodeId={selectedNodeId} category={category} goalId={goalId} onOpenMission={onOpenMission} onClose={() => onSelectNode(null)} />
      )}

      <UpgradeScreen isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
      
      {showMeCard && (
        <MeNodeDetails
          onClose={() => setShowMeCard(false)}
          onStartBreathing={() => { setShowMeCard(false); if (onOpenBreathing) onOpenBreathing(); else setShowBreathing(true); }}
        />
      )}

      {showBreathing && !onOpenBreathing && <BreathingOverlay onClose={() => setShowBreathing(false)} />}
      
      <DailyJournalArchive isOpen={showJournalArchive} onClose={() => setShowJournalArchive(false)} />

      <GoogleAuthModal
        isOpen={isCloudAuthOpen}
        onClose={() => setIsCloudAuthOpen(false)}
        onNotNow={() => setIsCloudAuthOpen(false)}
        intent={{ kind: "ai_focus", createdAt: Date.now() }}
      />

      {/* Exit Warp Flash */}
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
    </motion.main>
  );
};
