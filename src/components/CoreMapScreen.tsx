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
import { UserPlus, Map, TreeDeciduous, X } from "lucide-react";
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

interface CoreMapScreenProps {
  category: AdviceCategory;
  goalId: string;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onOpenMission?: (nodeId: string) => void;
  /** عند توفره يُستدعى لفتح تمرين التنفس (مثلاً من الـ Agent) */
  onOpenBreathing?: () => void;
  /** في وضع الرحلة: يظهر زر "كمل الرحلة" عند اكتمال خطوة علاقة واحدة */
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
    if (!canUseGalaxyView && galaxyMode) {
      setGalaxyMode(false);
    }
  }, [canUseGalaxyView, galaxyMode]);

  useEffect(() => {
    if (!canUseFamilyTreeView && viewMode === "tree") {
      setViewMode("map");
    }
  }, [canUseFamilyTreeView, viewMode]);

  useEffect(() => {
    if (!selectedNodeId || canUseBasicDiagnosis) return;
    onFeatureLocked?.("basic_diagnosis");
    onSelectNode(null);
  }, [selectedNodeId, canUseBasicDiagnosis, onFeatureLocked, onSelectNode]);

  useEffect(() => {
    if (!canUseMirror && showMeCard) {
      setShowMeCard(false);
    }
  }, [canUseMirror, showMeCard]);

  // لو الشخص المحدد اتحذف (مثلاً بعد حذف وإضافة تاني)، نغلق نافذة التفاصيل
  useEffect(() => {
    if (selectedNodeId && !nodes.some((n) => n.id === selectedNodeId)) {
      onSelectNode(null);
    }
  }, [selectedNodeId, nodes, onSelectNode]);

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

  return (
    <main
      className="w-full max-w-2xl py-10 md:py-14 text-center"
      aria-labelledby="core-map-title"
    >
      <header>
        <div className="flex flex-col items-center gap-2 mb-4">
          <h1
            id="core-map-title"
            className="text-3xl md:text-4xl font-bold text-slate-900"
          >
            <EditableText id={pageTitleKey} defaultText={pageTitle} page="map" />
          </h1>
        </div>
        <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-md mx-auto">
          <EditableText id={subtitleKey} defaultText={subtitle} page="map" multiline showEditIcon={false} />
        </p>
      </header>

      {showWeekdayLabelsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-labelledby="weekday-labels-title"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-600 p-4 text-right">
            <div className="flex items-center justify-between mb-3">
              <h2 id="weekday-labels-title" className="text-sm font-bold text-slate-800 dark:text-slate-200">
                ربط أيام الأسبوع بنشاط أو شخص
              </h2>
              <button
                type="button"
                onClick={() => setShowWeekdayLabelsModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              لو يوم معيّن دايماً طاقتك فيه منخفضة، اربطه بنشاط أو شخص عشان التقرير يذكّرك.
            </p>
            <div className="space-y-2">
              {PULSE_DAY_NAMES.map((dayName, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-xs font-medium text-slate-600 dark:text-slate-300">{dayName}</span>
                  <input
                    type="text"
                    value={weekdayLabels[i] ?? ""}
                    onChange={(e) => setWeekdayLabel(i, e.target.value || null)}
                    placeholder="مثلاً: اجتماع مع المدير"
                    className="flex-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowWeekdayLabelsModal(false)}
              className="mt-4 w-full rounded-full bg-indigo-600 text-white py-2 text-sm font-semibold hover:bg-indigo-700"
            >
              تم
            </button>
          </div>
        </div>
      )}

      {pulseMode === "low" && (
        <div className="mt-4 mx-auto max-w-md rounded-2xl border border-slate-200 bg-slate-50 dark:bg-slate-800/60 dark:border-slate-600 px-4 py-4 text-right">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">الطاقة منخفضة.. أولويتنا وقف النزيف</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            نفّذ خطوة صيانة واحدة وبس، من غير أي اشتباك.
          </p>
          <button
            type="button"
            onClick={onOpenCocoon}
            className="mt-3 w-full rounded-full bg-slate-900 text-white py-2.5 text-sm font-semibold hover:bg-slate-800 transition-all"
          >
            وضع الشرنقة
          </button>
        </div>
      )}

      {/* عند طاقة منخفضة: نظهر كارد الشرنقة فقط، ولا نعرض الخريطة ولا المهام ولا أزرار الإضافة */}
      {pulseMode === "low" ? null : (
        <>
      {pulseMode === "angry" && (
        <div className="mt-4 mx-auto max-w-md rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-right">
          <p className="text-sm font-semibold text-rose-700">الرادار بيقول ضجيج عالي.. ثبّت موقعك الأول</p>
          <p className="text-xs text-rose-600 mt-1">
            قبل أي قرار، افصل الشوشرة وارجع للتحكم.
          </p>
          <button
            type="button"
            onClick={onOpenNoise}
            className="mt-3 w-full rounded-full bg-rose-600 text-white py-2.5 text-sm font-semibold hover:bg-rose-700 transition-all"
          >
            إسكات الضجيج
          </button>
        </div>
      )}

      {pulseMode === "high" && (
        <div className="mt-4 mx-auto max-w-md rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-right">
          <p className="text-sm font-semibold text-emerald-700">طاقتك جاهزة.. وقت حسم جبهة</p>
          <p className="text-xs text-emerald-600 mt-1">
            {challengeLabel ?? "جاهز لمناورة النهاردة؟"}
          </p>
          <button
            type="button"
            onClick={onOpenChallenge}
            className="mt-3 w-full rounded-full bg-emerald-600 text-white py-2.5 text-sm font-semibold hover:bg-emerald-700 transition-all disabled:opacity-60"
            disabled={!onOpenChallenge}
          >
            مناورة اليوم
          </button>
        </div>
      )}

      <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
        <button
          type="button"
          hidden={!canUseGalaxyView}
          aria-hidden={!canUseGalaxyView}
          onClick={() => setGalaxyMode((v) => !v)}
          className={`rounded-full px-4 py-2.5 text-sm font-semibold border-2 transition-all ${
            galaxyMode ? "bg-slate-700 text-white border-slate-700" : "bg-white text-slate-700 border-slate-300 hover:border-teal-400"
          }`}
          title={galaxyMode ? "رجوع لسياق واحد" : "عرض كل الجبهات"}
        >
          {galaxyMode ? (
            <EditableText id="map_view_single_cta" defaultText={mapCopy.viewSingleCta} page="map" editOnClick={false} />
          ) : (
            <EditableText id="map_view_all_cta" defaultText={mapCopy.viewAllCta} page="map" editOnClick={false} />
          )}
        </button>
        {canUseGalaxyView && galaxyMode && (
          <div className="flex rounded-full bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setGalaxySubView("map")}
              className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                galaxySubView === "map" ? "bg-teal-600 text-white shadow" : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              <EditableText id="map_galaxy_title" defaultText={mapCopy.galaxyTitle} page="map" editOnClick={false} />
            </button>
            <button
              type="button"
              onClick={() => setGalaxySubView("forest")}
              className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                galaxySubView === "forest" ? "bg-teal-600 text-white shadow" : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              <EditableText id="map_forest_title" defaultText={mapCopy.forestTitle} page="map" editOnClick={false} />
            </button>
          </div>
        )}
        {canUseGalaxyView && galaxyMode && galaxySubView === "map" && (
          <div className="flex flex-wrap justify-center gap-2">
            {(["family", "work", "love", "general"] as const).map((ctx) => {
              const label = ctx === "family" ? mapCopy.contextFamily : ctx === "work" ? mapCopy.contextWork : ctx === "love" ? mapCopy.contextLove : mapCopy.contextGeneral;
              const labelKey =
                ctx === "family"
                  ? "map_context_family"
                  : ctx === "work"
                    ? "map_context_work"
                    : ctx === "love"
                      ? "map_context_love"
                      : "map_context_general";
              const on = selectedContexts.includes(ctx);
              return (
                <button
                  key={ctx}
                  type="button"
                  onClick={() => toggleContext(ctx)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                    on ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  <EditableText id={labelKey} defaultText={label} page="map" editOnClick={false} />
                </button>
              );
            })}
          </div>
        )}
        {!galaxyMode && isFamily && canUseFamilyTreeView && (
          <div className="flex rounded-full bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                viewMode === "map" ? "bg-teal-600 text-white shadow" : "text-slate-600 hover:bg-slate-200"
              }`}
              title="عرض الخريطة"
            >
              <Map className="w-4 h-4" />
              <EditableText id="map_view_mode_map" defaultText="الخريطة" page="map" editOnClick={false} />
            </button>
            <button
              type="button"
              onClick={() => {
                if (!canUseFamilyTree) {
                  onFeatureLocked?.("family_tree");
                  return;
                }
                setViewMode("tree");
              }}
              className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                viewMode === "tree"
                  ? "bg-teal-600 text-white shadow"
                  : canUseFamilyTree
                    ? "text-slate-600 hover:bg-slate-200"
                    : "text-slate-400"
              }`}
              title="شجرة العيلة"
            >
              <TreeDeciduous className="w-4 h-4" />
              {canUseFamilyTree ? (
                <EditableText id="map_view_mode_tree" defaultText="شجرة العيلة" page="map" editOnClick={false} />
              ) : (
                <EditableText id="map_view_mode_tree_locked" defaultText="شجرة العيلة 🔒" page="map" editOnClick={false} />
              )}
            </button>
          </div>
        )}
        <motion.button
          type="button"
          className="rounded-full bg-teal-600 text-white px-6 py-3 text-sm font-semibold shadow-lg hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
          onClick={() => {
            onSelectNode(null);
            setShowAddPerson(true);
          }}
          title={mapCopy.addPersonTitle}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          + <EditableText id="map_add_person_label" defaultText={mapCopy.addPersonLabel} page="map" editOnClick={false} />
        </motion.button>
      </div>

      {pulseInsight && (
        <div className="mt-4 mx-auto max-w-md rounded-2xl border border-indigo-200 bg-indigo-50 dark:bg-indigo-950/40 dark:border-indigo-800 px-4 py-3 text-right">
          <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">{pulseInsight.title}</p>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 leading-relaxed">{pulseInsight.body}</p>
          <button
            type="button"
            onClick={() => setShowWeekdayLabelsModal(true)}
            className="mt-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            ربط يوم بنشاط أو شخص
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {canUseGalaxyView && galaxyMode && galaxySubView === "forest" ? (
          <motion.div
            key="forest"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <ForestView onNodeClick={(id) => onSelectNode(id)} />
          </motion.div>
        ) : canUseGalaxyView && galaxyMode && galaxySubView === "map" ? (
          <motion.div
            key="galaxy-map"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <MapCanvas
              onNodeClick={(id) => onSelectNode(id)}
              onMeClick={() => {
                if (!canUseMirror) {
                  onFeatureLocked?.("mirror_tool");
                  return;
                }
                setShowMeCard(true);
              }}
              galaxyGoalIds={selectedContexts.length > 0 ? selectedContexts : ["family", "work", "love", "general"]}
            />
          </motion.div>
        ) : !canUseFamilyTreeView || viewMode === "map" ? (
          <motion.div
            key="single-map"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <MapCanvas
              onNodeClick={(id) => onSelectNode(id)}
              onMeClick={() => {
                if (!canUseMirror) {
                  onFeatureLocked?.("mirror_tool");
                  return;
                }
                setShowMeCard(true);
              }}
              goalIdFilter={goalId}
            />
          </motion.div>
        ) : canUseFamilyTreeView && isFamily ? (
          <motion.div
            key="family-tree"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <FamilyTreeView onNodeClick={(id) => onSelectNode(id)} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {nodes.length === 0 && !showOnboarding && !journeyMode && (
        <motion.div
          className="mt-6 mx-auto max-w-sm p-5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 border-dashed text-center"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          role="status"
          aria-live="polite"
        >
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            <EditableText id="map_empty_title" defaultText={mapCopy.emptyMapTitle} page="map" />
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            <EditableText id="map_empty_hint" defaultText={mapCopy.emptyMapHint} page="map" multiline showEditIcon={false} />
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            <EditableText id="map_empty_reassurance" defaultText={mapCopy.emptyMapReassurance} page="map" showEditIcon={false} />
          </p>
        </motion.div>
      )}

      {showOnboarding && nodes.length === 0 && !journeyMode && (
        <MapOnboardingOverlay onClose={() => setShowOnboarding(false)} />
      )}

      {showPlacementTooltip && (
        <div
          className="mt-4 mx-auto max-w-sm flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-slate-100/90 text-slate-700 text-sm shadow-sm border border-slate-200"
          role="status"
          aria-live="polite"
        >
          <span>
            <EditableText id="map_first_placement_tooltip" defaultText={mapCopy.firstPlacementTooltip} page="map" showEditIcon={false} />
          </span>
          <button
            type="button"
            onClick={dismissPlacementTooltip}
            className="shrink-0 rounded-full p-1.5 hover:bg-slate-200/80 transition-colors"
            title="إغلاق"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>
      )}

      {/* Ring Labels - clickable with tooltip */}
      <div
        className="mt-6 flex flex-wrap justify-center gap-3 text-sm"
        aria-label="معاني دوائر المسافة"
      >
        {(["green", "yellow", "red"] as const).map((key) => {
          const isActive = legendTooltip === key;
          const config = {
            green: { label: mapCopy.legendGreen, labelKey: "map_legend_green", dot: "bg-teal-600 shadow-[0_0_8px_rgba(15,118,110,0.35)]", pill: "bg-teal-100 text-teal-800" },
            yellow: { label: mapCopy.legendYellow, labelKey: "map_legend_yellow", dot: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]", pill: "bg-amber-100 text-amber-800" },
            red: { label: mapCopy.legendRed, labelKey: "map_legend_red", dot: "bg-rose-600 shadow-[0_0_8px_rgba(190,24,93,0.32)]", pill: "bg-rose-100 text-rose-800" }
          }[key];
          return (
            <div key={key} className="relative">
              {isActive && (
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-medium whitespace-nowrap shadow-lg z-10"
                  role="tooltip"
                >
                  <EditableText id={config.labelKey} defaultText={config.label} page="map" showEditIcon={false} />
                  <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                </div>
              )}
              <button
                type="button"
                onClick={() => setLegendTooltip((prev) => (prev === key ? null : key))}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-medium cursor-pointer transition-opacity hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500 ${config.pill}`}
                aria-label={config.label}
                aria-expanded={isActive}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
                <EditableText id={config.labelKey} defaultText={config.label} page="map" editOnClick={false} />
              </button>
            </div>
          );
        })}
      </div>
      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400" title={mapCopy.threatLevelHint}>
        <EditableText
          id="map_threat_level_hint"
          defaultText={mapCopy.threatLevelHint}
          page="map"
          multiline
          showEditIcon={false}
        />
      </p>

      {journeyMode && onJourneyComplete && (
        <div className="mt-8 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={onJourneyComplete}
            disabled={!canCompleteJourneyStep}
            className="px-6 py-3 rounded-full font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-teal-600 text-white hover:bg-teal-700 disabled:bg-slate-300 disabled:text-slate-500"
          >
            كمل الرحلة
          </button>
          {!canCompleteJourneyStep && nodes.length > 0 && (
            <p className="text-sm text-slate-500 max-w-xs text-center">
              افتح الجبهة، راجع النتيجة وبروتوكول الدفاع أو كمّل التدريب، وبعدها اضغط "كمل الرحلة"
            </p>
          )}
        </div>
      )}
        </>
      )}

      {showAddPerson && (
        <AddPersonModal
          goalId={goalId}
          onClose={(openNodeId) => {
            setShowAddPerson(false);
            if (openNodeId) onSelectNode(openNodeId);
            else onSelectNode(null);
          }}
          onOpenMission={onOpenMission}
        />
      )}

      {selectedNodeId && canUseBasicDiagnosis && (
        <ViewPersonModal
          nodeId={selectedNodeId}
          category={category}
          goalId={goalId}
          onOpenMission={onOpenMission}
          onClose={() => onSelectNode(null)}
        />
      )}

      {showMeCard && (
        <MeNodeDetails
          onClose={() => setShowMeCard(false)}
          onStartBreathing={() => {
            setShowMeCard(false);
            if (onOpenBreathing) onOpenBreathing();
            else setShowBreathing(true);
          }}
        />
      )}

      {showBreathing && !onOpenBreathing && (
        <BreathingOverlay onClose={() => setShowBreathing(false)} />
      )}
    </main>
  );
};
