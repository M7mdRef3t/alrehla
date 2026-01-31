import type { FC } from "react";
import { useState, useEffect } from "react";
import { MapCanvas } from "../modules/map/MapCanvas";
import { AddPersonModal } from "./AddPersonModal";
import { ViewPersonModal } from "./ViewPersonModal";
import { mapCopy } from "../copy/map";
import { useMapState } from "../state/mapState";
import type { AdviceCategory } from "../data/adviceScripts";

interface CoreMapScreenProps {
  category: AdviceCategory;
  goalId: string;
  /** في وضع الرحلة: يظهر زر "كمل الرحلة" عند اكتمال خطوة علاقة واحدة */
  journeyMode?: boolean;
  onJourneyComplete?: () => void;
}

export const CoreMapScreen: FC<CoreMapScreenProps> = ({
  category,
  goalId,
  journeyMode = false,
  onJourneyComplete
}) => {
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [legendTooltip, setLegendTooltip] = useState<"green" | "yellow" | "red" | null>(null);
  const nodes = useMapState((s) => s.nodes);
  const showPlacementTooltip = useMapState((s) => s.showPlacementTooltip);
  const dismissPlacementTooltip = useMapState((s) => s.dismissPlacementTooltip);

  useEffect(() => {
    if (!showPlacementTooltip) return;
    const t = setTimeout(dismissPlacementTooltip, 5000);
    return () => clearTimeout(t);
  }, [showPlacementTooltip, dismissPlacementTooltip]);

  const canCompleteJourneyStep =
    journeyMode &&
    onJourneyComplete &&
    nodes.some(
      (n) =>
        n.lastViewedStep === "recoveryPlan" ||
        n.hasCompletedTraining === true
    );

  // Dynamic title based on goalId
  const pageTitle = mapCopy.titles[goalId as keyof typeof mapCopy.titles] || mapCopy.titles.general;

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
          {mapCopy.subtitle}
        </p>
      </header>

      <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
        <button
          type="button"
          className="rounded-full bg-teal-600 text-white px-6 py-3 text-sm font-semibold shadow-lg hover:bg-teal-700 active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
          onClick={() => setShowAddPerson(true)}
          title={mapCopy.addPersonTitle}
        >
          + {mapCopy.addPersonLabel}
        </button>
      </div>

      <MapCanvas onNodeClick={(id) => setSelectedNodeId(id)} />

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

      {showAddPerson && (
        <AddPersonModal 
          goalId={goalId} 
          category={category} 
          onClose={() => setShowAddPerson(false)} 
        />
      )}

      {selectedNodeId && (
        <ViewPersonModal
          nodeId={selectedNodeId}
          category={category}
          goalId={goalId}
          onClose={() => setSelectedNodeId(null)}
        />
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
              اضغط على العلاقة، وشوف النتيجة وخطة التعافي أو خلّص التدريب، بعدين اضغط "كمل الرحلة"
            </p>
          )}
        </div>
      )}
    </main>
  );
};
