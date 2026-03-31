import { AnimatePresence, motion } from "framer-motion";
import { Activity, ChevronDown, Orbit, ShieldCheck, Sparkles } from "lucide-react";
import { mapCopy } from "../../copy/map";
import { TEIWidget } from "../TEIWidget";
import { MapInsightPanel } from "../MapInsightPanel";
import { InfluenceNetwork } from "../InfluenceNetwork";
import { StabilityHeatmap } from "../StabilityHeatmap";
import { ContextAtlasCard } from "../ContextAtlasCard";
import { RelationshipWeatherCard } from "../RelationshipWeatherCard";
import { RelationshipPulse } from "../RelationshipPulse";
import type { ContextAtlasKey, ContextAtlasSnapshot } from "../../utils/contextAtlas";
import type { RelationshipWeatherSnapshot } from "../../utils/relationshipWeather";

type AnalyticalView = "network" | "stability" | "metrics";

interface MapOperationalStripProps {
  activeNodesCount: number;
  greenNodesCount: number;
  archivedNodesCount: number;
  onOpenSupport: () => void;
}

interface MapAnalyticalPanelProps {
  segmentedView: AnalyticalView;
  onSegmentChange: (view: AnalyticalView) => void;
}

interface MapSupportPanelProps {
  show: boolean;
  onToggle: () => void;
  activeNodesCount: number;
  greenNodesCount: number;
  archivedNodesCount: number;
  contextAtlas: ContextAtlasSnapshot | null;
  relationshipWeather: RelationshipWeatherSnapshot | null;
  isUnifiedMode: boolean;
  selectedContexts: ContextAtlasKey[];
  onToggleUnifiedContexts: () => void;
  onToggleContext: (context: ContextAtlasKey) => void;
  onFocusContext: (context: ContextAtlasKey) => void;
  onSelectNode: (nodeId: string) => void;
}

const analyticalTabs: Array<{ id: AnalyticalView; label: string; caption: string }> = [
  { id: "network", label: "الشبكة", caption: "مين بيسند ومين بيستنزف" },
  { id: "stability", label: "الاستقرار", caption: "رصد الذبذبة والاحتكاك" },
  { id: "metrics", label: "المؤشرات", caption: "قياسات أعمق للخريطة" }
];

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[1.35rem] px-3 py-3 text-right" style={{
      border: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(255,255,255,0.04)"
    }}>
      <p className="text-[10px] font-bold tracking-[0.18em]" style={{ color: "#6b8fa8" }}>{label}</p>
      <p className="mt-1 text-lg font-black" style={{ color: "#f1f5f9" }}>{value}</p>
    </div>
  );
}

export function MapOperationalStrip({
  activeNodesCount,
  greenNodesCount,
  archivedNodesCount,
  onOpenSupport
}: MapOperationalStripProps) {
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="w-full pointer-events-auto">
      <div className="grid gap-3 rounded-[2rem] border border-white/10 bg-black/20 p-3 backdrop-blur-2xl md:grid-cols-[1.4fr_0.8fr]">
        <div className="grid grid-cols-3 gap-2">
          <StatCell label="نشط" value={String(activeNodesCount)} />
          <StatCell label="آمن" value={String(greenNodesCount)} />
          <StatCell label="مؤرشف" value={String(archivedNodesCount)} />
        </div>
        <button
          type="button"
          onClick={onOpenSupport}
          className="flex min-h-[90px] flex-col justify-between rounded-[1.6rem] border border-teal-400/15 bg-[linear-gradient(135deg,rgba(13,148,136,0.16),rgba(15,23,42,0.2))] px-4 py-3 text-right transition hover:border-teal-300/30 hover:bg-[linear-gradient(135deg,rgba(20,184,166,0.2),rgba(15,23,42,0.28))]"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="rounded-2xl border border-teal-300/20 bg-teal-300/10 p-2 text-teal-200">
              <Orbit className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-black tracking-[0.22em] text-teal-100/80">لوحة الخريطة</span>
          </div>
          <p className="text-xs leading-6 text-white/78">
            {mapCopy.dashboardMapSummary(activeNodesCount, greenNodesCount, archivedNodesCount)}
          </p>
        </button>
      </div>
    </motion.div>
  );
}

export function MapAnalyticalPanel({ segmentedView, onSegmentChange }: MapAnalyticalPanelProps) {
  const activeTab = analyticalTabs.find((tab) => tab.id === segmentedView) ?? analyticalTabs[0];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full pointer-events-auto space-y-5 pt-8">
      <div className="rounded-[2rem] border border-white/10 bg-black/25 p-3 backdrop-blur-2xl">
        <div className="grid gap-2 md:grid-cols-3">
          {analyticalTabs.map((tab) => {
            const isActive = segmentedView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSegmentChange(tab.id)}
                className={`rounded-[1.35rem] border px-4 py-3 text-right transition ${
                  isActive
                    ? "border-teal-300/25 bg-teal-300/12 text-white shadow-[0_12px_30px_rgba(20,184,166,0.10)]"
                    : "border-white/8 bg-white/[0.025] text-white/55 hover:border-white/15 hover:text-white/78"
                }`}
              >
                <p className="text-sm font-black">{tab.label}</p>
                <p className="mt-1 text-[11px] leading-5 opacity-80">{tab.caption}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.55),rgba(2,6,23,0.35))] p-5 backdrop-blur-2xl">
        <div className="mb-5 flex items-start justify-between gap-3 text-right">
          <div>
            <p className="text-[10px] font-black tracking-[0.24em] text-teal-200/70">عدسة تحليل</p>
            <h3 className="mt-2 text-xl font-black text-white">{activeTab.label}</h3>
            <p className="mt-1 text-xs leading-6 text-white/55">{activeTab.caption}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-2 text-white/65">
            {segmentedView === "metrics" ? <Sparkles className="h-4 w-4" /> : segmentedView === "network" ? <Orbit className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
          </div>
        </div>

        {segmentedView === "metrics" && (
          <div className="space-y-4">
            <div className="rounded-[1.75rem] border border-amber-300/12 bg-black/20 p-5 text-right">
              <p className="text-[10px] font-black tracking-[0.24em] text-amber-200/70">Trauma Entropy</p>
              <div className="mt-4">
                <TEIWidget />
              </div>
            </div>
            <MapInsightPanel />
          </div>
        )}

        {segmentedView === "network" && <InfluenceNetwork />}
        {segmentedView === "stability" && <StabilityHeatmap />}
      </div>
    </motion.div>
  );
}

export function MapSupportPanel({
  show,
  onToggle,
  activeNodesCount,
  greenNodesCount,
  archivedNodesCount,
  contextAtlas,
  relationshipWeather,
  isUnifiedMode,
  selectedContexts,
  onToggleUnifiedContexts,
  onToggleContext,
  onFocusContext,
  onSelectNode
}: MapSupportPanelProps) {
  const compactSummary = `نشط ${activeNodesCount} | آمن ${greenNodesCount} | مؤرشف ${archivedNodesCount}`;
  const containerClass = show
    ? "mx-auto mb-3 w-full max-w-[42rem] md:fixed md:right-4 md:top-[17.25rem] md:mx-0 md:mb-0 md:w-[22rem] md:max-w-[22rem] md:z-40"
    : "mx-auto mb-3 w-full max-w-[14rem] md:fixed md:right-4 md:top-[11rem] md:mx-0 md:mb-0 md:w-[14rem] md:max-w-[14rem] md:z-40";

  return (
    <motion.div className={containerClass} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full rounded-[2rem] border border-white/10 text-right shadow-[0_16px_50px_rgba(0,0,0,0.45)] backdrop-blur-2xl transition hover:border-teal-300/18 ${
          show
            ? "bg-[linear-gradient(135deg,rgba(15,23,42,0.68),rgba(0,0,0,0.58))] px-5 py-4"
            : "bg-[linear-gradient(135deg,rgba(8,18,34,0.82),rgba(0,0,0,0.62))] px-4 py-3"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-2 text-white/60">
              <Activity className="h-4 w-4" />
            </div>
            <div className={`rounded-full border border-white/10 bg-white/[0.035] p-1 text-white/55 transition ${show ? "rotate-180" : ""}`}>
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black tracking-[0.24em] text-amber-200/70">حالة المنظومة</p>
            <h3 className={`mt-2 font-black text-white ${show ? "text-base" : "text-sm"}`}>
              {show ? "ملخص الخريطة اللحظي" : "لوحة المنظومة"}
            </h3>
            <p className={`mt-1 text-xs leading-6 ${show ? "text-white/55" : "text-white/75"}`}>
              {show ? mapCopy.dashboardMapSummary(activeNodesCount, greenNodesCount, archivedNodesCount) : compactSummary}
            </p>
          </div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {show && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -6 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -6 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-4 rounded-[2rem] border border-white/8 bg-[rgba(8,15,28,0.58)] p-4 text-right backdrop-blur-xl">
              {contextAtlas && (
                <ContextAtlasCard
                  snapshot={contextAtlas}
                  isUnifiedMode={isUnifiedMode}
                  selectedContexts={selectedContexts}
                  onToggleMode={onToggleUnifiedContexts}
                  onToggleContext={onToggleContext}
                  onFocusContext={onFocusContext}
                  onSelectNode={onSelectNode}
                />
              )}
              {relationshipWeather && (
                <RelationshipWeatherCard
                  snapshot={relationshipWeather}
                  onSelectNode={onSelectNode}
                />
              )}
              <RelationshipPulse />
              <p className="pt-1 text-center text-[11px] text-teal-200/40">{mapCopy.dashboardSlogan}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
