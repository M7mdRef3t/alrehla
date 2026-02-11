import type { FC } from "react";
import { useState, useEffect } from "react";
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
import { Map, TreeDeciduous, X } from "lucide-react";
import { mapCopy } from "../copy/map";
import { EditableText } from "./EditableText";
import { useMapState } from "../state/mapState";
import { usePulseState } from "../state/pulseState";
import { PULSE_DAY_NAMES } from "../utils/pulseInsights";
import type { AdviceCategory } from "../data/adviceScripts";
import { useAdminState } from "../state/adminState";
import { getEffectiveFeatureAccess } from "../utils/featureFlags";
import { getEffectiveRoleFromState, useAuthState } from "../state/authState";
import type { FeatureFlagKey } from "../config/features";

/* ════════════════════════════════════════════════
   🌌 CORE MAP SCREEN — Digital Sanctuary
   ════════════════════════════════════════════════ */

const cosmicFade = {
  hidden: { opacity: 0, y: 16, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
  }
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
  onOpenBreathing?: () => void;
  journeyMode?: boolean;
  onJourneyComplete?: () => void;
  pulseMode?: "low" | "angry" | "high" | "normal";
  pulseInsight?: { title: string; body: string } | null;
  onOpenCocoon?: () => void;
  onOpenNoise?: () => void;
  onOpenChallenge?: () => void;
  challengeLabel?: string | null;
  canUseBasicDiagnosis?: boolean;
  onFeatureLocked?: (feature: FeatureFlagKey) => void;
}

export const CoreMapScreen: FC<CoreMapScreenProps> = ({
  category,
  goalId,
  selectedNodeId,
  onSelectNode,
  onOpenMission,
  onOpenBreathing,
  journeyMode = false,
  onJourneyComplete,
  pulseMode = "normal",
  pulseInsight,
  onOpenCocoon,
  onOpenNoise,
  onOpenChallenge,
  challengeLabel,
  canUseBasicDiagnosis = true,
  onFeatureLocked
}) => {
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showMeCard, setShowMeCard] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [showWeekdayLabelsModal, setShowWeekdayLabelsModal] = useState(false);
  const weekdayLabels = usePulseState((s) => s.weekdayLabels);
  const setWeekdayLabel = usePulseState((s) => s.setWeekdayLabel);
  const [legendTooltip, setLegendTooltip] = useState<"green" | "yellow" | "red" | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "tree">("map");
  const [galaxyMode, setGalaxyMode] = useState(false);
  const [galaxySubView, setGalaxySubView] = useState<"map" | "forest">("map");
  const [selectedContexts, setSelectedContexts] = useState<string[]>(["family", "work", "love", "general"]);
  const nodes = useMapState((s) => s.nodes);
  const isFamily = goalId === "family";
  const featureFlags = useAdminState((s) => s.featureFlags);
  const betaAccess = useAdminState((s) => s.betaAccess);
  const adminAccess = useAdminState((s) => s.adminAccess);
  const role = useAuthState(getEffectiveRoleFromState);
  const featureAccess = getEffectiveFeatureAccess({
    featureFlags,
    betaAccess,
    role,
    adminAccess,
    isDev: import.meta.env.DEV
  });
  const canUseFamilyTree = featureAccess.family_tree;
  const canUseMirror = featureAccess.mirror_tool;
  const canUseGalaxyView = featureAccess.global_atlas;
  const canUseFamilyTreeView = canUseFamilyTree;

  const toggleContext = (ctx: string) => {
    setSelectedContexts((prev) =>
      prev.includes(ctx) ? prev.filter((c) => c !== ctx) : [...prev, ctx]
    );
  };
  const showPlacementTooltip = useMapState((s) => s.showPlacementTooltip);
  const dismissPlacementTooltip = useMapState((s) => s.dismissPlacementTooltip);
  const [showOnboarding, setShowOnboarding] = useState(() => nodes.length === 0 && !hasSeenOnboarding() && !journeyMode);

  useEffect(() => {
    if (!showPlacementTooltip) return;
    const t = setTimeout(dismissPlacementTooltip, 5000);
    return () => clearTimeout(t);
  }, [showPlacementTooltip, dismissPlacementTooltip]);

  useEffect(() => {
    if (nodes.length > 0 && showOnboarding) setShowOnboarding(false);
  }, [nodes.length, showOnboarding]);

  useEffect(() => {
    if (!canUseGalaxyView && galaxyMode) setGalaxyMode(false);
  }, [canUseGalaxyView, galaxyMode]);

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

  return (
    <motion.main
      className="w-full max-w-2xl text-center relative"
      aria-labelledby="core-map-title"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* ── Header ── */}
      <motion.header variants={cosmicFade}>
        <div className="flex flex-col items-center gap-2 mb-4">
          <h1
            id="core-map-title"
            className="text-3xl md:text-4xl font-bold"
            style={{ color: "var(--text-primary)", letterSpacing: "var(--tracking-wider)" }}
          >
            <EditableText id={pageTitleKey} defaultText={pageTitle} page="map" />
          </h1>
        </div>
        <p
          className="text-base md:text-lg leading-relaxed max-w-md mx-auto"
          style={{ color: "var(--text-secondary)", letterSpacing: "var(--tracking-wide)" }}
        >
          <EditableText id={subtitleKey} defaultText={subtitle} page="map" multiline showEditIcon={false} />
        </p>
      </motion.header>

      {/* ── Weekday Labels Modal ── */}
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
              لو يوم معيّن دايماً طاقتك فيه منخفضة، اربطه بنشاط أو شخص عشان التقرير يذكّرك.
            </p>
            <div className="space-y-2">
              {PULSE_DAY_NAMES.map((dayName, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{dayName}</span>
                  <input
                    type="text"
                    value={weekdayLabels[i] ?? ""}
                    onChange={(e) => setWeekdayLabel(i, e.target.value || null)}
                    placeholder="مثلاً: اجتماع مع المدير"
                    className="flex-1 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/30"
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
              تم
            </button>
          </motion.div>
        </div>
      )}

      {/* ── Status Cards (Pulse Modes) ── */}
      {pulseMode === "low" && (
        <motion.div
          className="mt-5 mx-auto max-w-md card-unified status-card-low px-4 py-4 text-right"
          variants={cosmicFade}
        >
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            الطاقة منخفضة.. أولويتنا وقف الضغط
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
            نفّذ خطوة صيانة واحدة وبس، من غير أي اشتباك.
          </p>
          <button
            type="button"
            onClick={onOpenCocoon}
            className="mt-3 w-full cta-muted py-2.5 text-sm font-semibold transition-all hover:bg-white/10"
            style={{ borderColor: "rgba(148, 163, 184, 0.3)" }}
          >
            دقيقة شحن
          </button>
        </motion.div>
      )}

      {pulseMode === "low" ? null : (
        <>
      {pulseMode === "angry" && (
        <motion.div
          className="mt-5 mx-auto max-w-md card-unified status-card-angry px-4 py-4 text-right"
          variants={cosmicFade}
        >
          <p className="text-sm font-semibold" style={{ color: "var(--ring-danger)" }}>
            الرادار بيقول ضجيج عالي.. ثبّت مكانك الأول
          </p>
          <p className="text-xs mt-1" style={{ color: "rgba(248, 113, 113, 0.7)" }}>
            قبل أي قرار، افصل الشوشرة وارجع للتحكم.
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
          className="mt-5 mx-auto max-w-md card-unified status-card-high px-4 py-4 text-right"
          variants={cosmicFade}
        >
          <p className="text-sm font-semibold" style={{ color: "var(--ring-safe)" }}>
            طاقتك جاهزة.. وقت حسم مدار
          </p>
          <p className="text-xs mt-1" style={{ color: "rgba(45, 212, 191, 0.7)" }}>
            {challengeLabel ?? "جاهز لمناورة النهاردة؟"}
          </p>
          <button
            type="button"
            onClick={onOpenChallenge}
            className="mt-3 w-full cta-primary py-2.5 text-sm font-semibold disabled:opacity-40"
            disabled={!onOpenChallenge}
          >
            مناورة اليوم
          </button>
        </motion.div>
      )}

      {/* ── Controls Bar ── */}
      <motion.div className="mt-8 flex items-center justify-center gap-3 flex-wrap" variants={cosmicFade}>
        <button
          type="button"
          hidden={!canUseGalaxyView}
          aria-hidden={!canUseGalaxyView}
          onClick={() => setGalaxyMode((v) => !v)}
          className={`glass-button px-4 py-2.5 text-sm font-semibold ${
            galaxyMode ? "glass-button-active" : ""
          }`}
          title={galaxyMode ? "رجوع لسياق واحد" : "عرض كل المدارات"}
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
              title="شجرة العيلة"
            >
              <TreeDeciduous className="w-4 h-4" />
              {canUseFamilyTree
                ? <EditableText id="map_view_mode_tree" defaultText="شجرة العيلة" page="map" editOnClick={false} />
                : <EditableText id="map_view_mode_tree_locked" defaultText="شجرة العيلة 🔒" page="map" editOnClick={false} />
              }
            </button>
          </div>
        )}
        <motion.button
          type="button"
          className="cta-primary px-6 py-3 text-sm font-semibold cosmic-shimmer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/40 focus-visible:ring-offset-0"
          onClick={() => { onSelectNode(null); setShowAddPerson(true); }}
          title={mapCopy.addPersonTitle}
          whileHover={{ scale: 1.04, y: -1 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <EditableText id="map_add_person_label" defaultText={mapCopy.addPersonLabel} page="map" editOnClick={false} />
        </motion.button>
      </motion.div>

      {/* ── Pulse Insight ── */}
      {pulseInsight && (
        <motion.div className="mt-4 mx-auto max-w-md card-unified status-card-insight px-4 py-4 text-right" variants={cosmicFade}>
          <p className="text-xs font-semibold" style={{ color: "rgba(167, 139, 250, 0.9)" }}>{pulseInsight.title}</p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: "rgba(167, 139, 250, 0.6)" }}>{pulseInsight.body}</p>
          <button
            type="button"
            onClick={() => setShowWeekdayLabelsModal(true)}
            className="mt-2 text-xs font-medium hover:underline"
            style={{ color: "rgba(167, 139, 250, 0.7)" }}
          >
            ربط يوم بنشاط أو شخص
          </button>
        </motion.div>
      )}

      {/* ── Map Canvas Views ── */}
      <AnimatePresence mode="wait">
        {canUseGalaxyView && galaxyMode && galaxySubView === "forest" ? (
          <motion.div key="forest" initial={{ opacity: 0, y: 16, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -12, filter: "blur(4px)" }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
            <ForestView onNodeClick={(id) => onSelectNode(id)} />
          </motion.div>
        ) : canUseGalaxyView && galaxyMode && galaxySubView === "map" ? (
          <motion.div key="galaxy-map" initial={{ opacity: 0, y: 16, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -12, filter: "blur(4px)" }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
            <MapCanvas
              onNodeClick={(id) => onSelectNode(id)}
              onMeClick={() => { if (!canUseMirror) { onFeatureLocked?.("mirror_tool"); return; } setShowMeCard(true); }}
              galaxyGoalIds={selectedContexts.length > 0 ? selectedContexts : ["family", "work", "love", "general"]}
              highlightNodeId={selectedNodeId}
            />
          </motion.div>
        ) : !canUseFamilyTreeView || viewMode === "map" ? (
          <motion.div key="single-map" initial={{ opacity: 0, y: 16, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -12, filter: "blur(4px)" }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
            <MapCanvas
              onNodeClick={(id) => onSelectNode(id)}
              onMeClick={() => { if (!canUseMirror) { onFeatureLocked?.("mirror_tool"); return; } setShowMeCard(true); }}
              goalIdFilter={goalId}
              highlightNodeId={selectedNodeId}
            />
          </motion.div>
        ) : canUseFamilyTreeView && isFamily ? (
          <motion.div key="family-tree" initial={{ opacity: 0, y: 16, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -12, filter: "blur(4px)" }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
            <FamilyTreeView onNodeClick={(id) => onSelectNode(id)} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ── Empty state ── */}
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

      {showOnboarding && nodes.length === 0 && !journeyMode && (
        <MapOnboardingOverlay onClose={() => setShowOnboarding(false)} />
      )}

      {/* ── Placement tooltip ── */}
      {showPlacementTooltip && (
        <motion.div
          className="mt-4 mx-auto max-w-sm flex items-center justify-between gap-3 px-4 py-3 glass-card text-sm"
          style={{ color: "var(--text-secondary)" }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          role="status"
          aria-live="polite"
        >
          <span>
            <EditableText id="map_first_placement_tooltip" defaultText={mapCopy.firstPlacementTooltip} page="map" showEditIcon={false} />
          </span>
          <button type="button" onClick={dismissPlacementTooltip} className="shrink-0 rounded-full p-1.5 transition-colors" style={{ color: "var(--text-muted)" }} title="إغلاق" aria-label="إغلاق">
            ✕
          </button>
        </motion.div>
      )}

      {/* ── Ring Legend ── */}
      <motion.div className="mt-6 flex flex-wrap justify-center gap-3 text-sm" aria-label="معاني دوائر المسافة" variants={cosmicFade}>
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
                className={`${config.pillClass} inline-flex items-center gap-2 font-medium active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-teal-400/30`}
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

      {/* ── Journey complete ── */}
      {journeyMode && onJourneyComplete && (
        <div className="mt-8 flex flex-col items-center gap-2">
          <button type="button" onClick={onJourneyComplete} disabled={!canCompleteJourneyStep} className="cta-primary px-6 py-3 font-semibold disabled:opacity-40 disabled:cursor-not-allowed">
            كمل الرحلة
          </button>
          {!canCompleteJourneyStep && nodes.length > 0 && (
            <p className="text-sm max-w-xs text-center" style={{ color: "var(--text-muted)" }}>
              افتح المدار، راجع النتيجة ومسار الحماية أو كمّل التدريب، وبعدها اضغط "كمل الرحلة"
            </p>
          )}
        </div>
      )}
        </>
      )}

      {/* ── Modals ── */}
      {showAddPerson && (
        <AddPersonModal goalId={goalId} onClose={(openNodeId) => { setShowAddPerson(false); if (openNodeId) onSelectNode(openNodeId); else onSelectNode(null); }} onOpenMission={onOpenMission} />
      )}
      {selectedNodeId && canUseBasicDiagnosis && (
        <ViewPersonModal nodeId={selectedNodeId} category={category} goalId={goalId} onOpenMission={onOpenMission} onClose={() => onSelectNode(null)} />
      )}
      {showMeCard && (
        <MeNodeDetails onClose={() => setShowMeCard(false)} onStartBreathing={() => { setShowMeCard(false); if (onOpenBreathing) onOpenBreathing(); else setShowBreathing(true); }} />
      )}
      {showBreathing && !onOpenBreathing && (
        <BreathingOverlay onClose={() => setShowBreathing(false)} />
      )}
    </motion.main>
  );
};
