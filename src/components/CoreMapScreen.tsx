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
import { MapOnboardingOverlay, hasSeenOnboarding } from "./MapOnboardingOverlay";
import { UserPlus, Map, TreeDeciduous } from "lucide-react";
import { mapCopy } from "../copy/map";
import { useMapState } from "../state/mapState";
import type { AdviceCategory } from "../data/adviceScripts";

interface CoreMapScreenProps {
  category: AdviceCategory;
  goalId: string;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  /** عند توفره يُستدعى لفتح تمرين التنفس (مثلاً من الـ Agent) */
  onOpenBreathing?: () => void;
  /** في وضع الرحلة: يظهر زر "كمل الرحلة" عند اكتمال خطوة علاقة واحدة */
  journeyMode?: boolean;
  onJourneyComplete?: () => void;
}

export const CoreMapScreen: FC<CoreMapScreenProps> = ({
  category,
  goalId,
  selectedNodeId,
  onSelectNode,
  onOpenBreathing,
  journeyMode = false,
  onJourneyComplete
}) => {
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showMeCard, setShowMeCard] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [legendTooltip, setLegendTooltip] = useState<"green" | "yellow" | "red" | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "tree">("map");
  const [galaxyMode, setGalaxyMode] = useState(false);
  const [galaxySubView, setGalaxySubView] = useState<"map" | "forest">("map");
  const [selectedContexts, setSelectedContexts] = useState<string[]>(["family", "work", "love", "general"]);
  const nodes = useMapState((s) => s.nodes);
  const isFamily = goalId === "family";

  const toggleContext = (ctx: string) => {
    setSelectedContexts((prev) =>
      prev.includes(ctx) ? prev.filter((c) => c !== ctx) : [...prev, ctx]
    );
  };
  const showPlacementTooltip = useMapState((s) => s.showPlacementTooltip);
  const dismissPlacementTooltip = useMapState((s) => s.dismissPlacementTooltip);
  const [showOnboarding, setShowOnboarding] = useState(() => nodes.length === 0 && !hasSeenOnboarding());

  useEffect(() => {
    if (!showPlacementTooltip) return;
    const t = setTimeout(dismissPlacementTooltip, 5000);
    return () => clearTimeout(t);
  }, [showPlacementTooltip, dismissPlacementTooltip]);

  useEffect(() => {
    if (nodes.length > 0 && showOnboarding) setShowOnboarding(false);
  }, [nodes.length, showOnboarding]);

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

  const pageTitle = galaxyMode
    ? galaxySubView === "forest"
      ? mapCopy.forestTitle
      : mapCopy.galaxyTitle
    : isFamily && viewMode === "tree"
      ? mapCopy.familyTreeTitle
      : mapCopy.titles[goalId as keyof typeof mapCopy.titles] || mapCopy.titles.general;

  const subtitle = galaxyMode
    ? galaxySubView === "forest"
      ? mapCopy.forestHint
      : mapCopy.galaxyHint
    : mapCopy.subtitle;

  return (
    <main
      className="w-full max-w-2xl py-10 md:py-14 text-center"
      aria-labelledby="core-map-title"
    >
      <header>
        <h1
          id="core-map-title"
          className="text-3xl md:text-4xl font-bold text-slate-900 mb-4"
        >
          {pageTitle}
        </h1>
        <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-md mx-auto">
          {subtitle}
        </p>
      </header>

      <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
        <button
          type="button"
          onClick={() => setGalaxyMode((v) => !v)}
          className={`rounded-full px-4 py-2.5 text-sm font-semibold border-2 transition-all ${
            galaxyMode ? "bg-slate-700 text-white border-slate-700" : "bg-white text-slate-700 border-slate-300 hover:border-teal-400"
          }`}
          title={galaxyMode ? "رجوع لسياق واحد" : "عرض كل العلاقات"}
        >
          {galaxyMode ? mapCopy.viewSingleCta : mapCopy.viewAllCta}
        </button>
        {galaxyMode && (
          <div className="flex rounded-full bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setGalaxySubView("map")}
              className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                galaxySubView === "map" ? "bg-teal-600 text-white shadow" : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              {mapCopy.galaxyTitle}
            </button>
            <button
              type="button"
              onClick={() => setGalaxySubView("forest")}
              className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                galaxySubView === "forest" ? "bg-teal-600 text-white shadow" : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              {mapCopy.forestTitle}
            </button>
          </div>
        )}
        {galaxyMode && galaxySubView === "map" && (
          <div className="flex flex-wrap justify-center gap-2">
            {(["family", "work", "love", "general"] as const).map((ctx) => {
              const label = ctx === "family" ? mapCopy.contextFamily : ctx === "work" ? mapCopy.contextWork : ctx === "love" ? mapCopy.contextLove : mapCopy.contextGeneral;
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
                  {label}
                </button>
              );
            })}
          </div>
        )}
        {!galaxyMode && isFamily && (
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
              الخريطة
            </button>
            <button
              type="button"
              onClick={() => setViewMode("tree")}
              className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                viewMode === "tree" ? "bg-teal-600 text-white shadow" : "text-slate-600 hover:bg-slate-200"
              }`}
              title="شجرة العيلة"
            >
              <TreeDeciduous className="w-4 h-4" />
              شجرة العيلة
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
          + {mapCopy.addPersonLabel}
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {galaxyMode && galaxySubView === "forest" ? (
          <motion.div
            key="forest"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <ForestView onNodeClick={(id) => onSelectNode(id)} />
          </motion.div>
        ) : galaxyMode && galaxySubView === "map" ? (
          <motion.div
            key="galaxy-map"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <MapCanvas
              onNodeClick={(id) => onSelectNode(id)}
              onMeClick={() => setShowMeCard(true)}
              galaxyGoalIds={selectedContexts.length > 0 ? selectedContexts : ["family", "work", "love", "general"]}
            />
          </motion.div>
        ) : viewMode === "map" ? (
          <motion.div
            key="single-map"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <MapCanvas
              onNodeClick={(id) => onSelectNode(id)}
              onMeClick={() => setShowMeCard(true)}
              goalIdFilter={goalId}
            />
          </motion.div>
        ) : isFamily ? (
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

      {nodes.length === 0 && !showOnboarding && (
        <motion.div
          className="mt-6 mx-auto max-w-sm p-5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 border-dashed text-center"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          role="status"
          aria-live="polite"
        >
          <UserPlus className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-500 mb-3" aria-hidden />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {mapCopy.emptyMapTitle}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {mapCopy.emptyMapHint}
          </p>
        </motion.div>
      )}

      {showOnboarding && nodes.length === 0 && (
        <MapOnboardingOverlay onClose={() => setShowOnboarding(false)} />
      )}

      {showPlacementTooltip && (
        <div
          className="mt-4 mx-auto max-w-sm flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-slate-100/90 text-slate-700 text-sm shadow-sm border border-slate-200"
          role="status"
          aria-live="polite"
        >
          <span>{mapCopy.firstPlacementTooltip}</span>
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
            green: { label: mapCopy.legendGreen, dot: "bg-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.4)]", pill: "bg-teal-400/10 text-teal-700" },
            yellow: { label: mapCopy.legendYellow, dot: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]", pill: "bg-amber-400/10 text-amber-700" },
            red: { label: mapCopy.legendRed, dot: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.4)]", pill: "bg-rose-400/10 text-rose-700" }
          }[key];
          return (
            <div key={key} className="relative">
              {isActive && (
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-medium whitespace-nowrap shadow-lg z-10"
                  role="tooltip"
                >
                  {config.label}
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
                {config.label}
              </button>
            </div>
          );
        })}
      </div>
      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400" title={mapCopy.threatLevelHint}>
        {mapCopy.threatLevelHint}
      </p>

      {showAddPerson && (
        <AddPersonModal
          goalId={goalId}
          category={category}
          onClose={(openNodeId) => {
            setShowAddPerson(false);
            if (openNodeId) onSelectNode(openNodeId);
            else onSelectNode(null);
          }}
        />
      )}

      {selectedNodeId && (
        <ViewPersonModal
          nodeId={selectedNodeId}
          category={category}
          goalId={goalId}
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
              اضغط على الجبهة، وشوف النتيجة وبروتوكول الدفاع أو خلّص التدريب، بعدين اضغط "كمل الرحلة"
            </p>
          )}
        </div>
      )}
    </main>
  );
};
