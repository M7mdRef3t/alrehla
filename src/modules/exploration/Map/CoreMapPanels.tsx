import { AnimatePresence, motion } from "framer-motion";
import { Activity, ChevronDown, Orbit, ShieldCheck, Zap as Sparkles, Zap, Volume2, VolumeX, Headset, Mic, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { mapCopy } from "@/copy/map";
import { TEIWidget } from "../TEIWidget";
import { MapInsightPanel } from "../MapInsightPanel";
import { InfluenceNetwork } from '@/modules/meta/InfluenceNetwork';
import { StabilityHeatmap } from "../StabilityHeatmap";
import { ContextAtlasCard } from "../ContextAtlasCard";
import { RelationshipWeatherCard } from "../RelationshipWeatherCard";
import { RelationshipPulse } from "../RelationshipPulse";
import type { ContextAtlasKey, ContextAtlasSnapshot } from "@/utils/contextAtlas";
import type { RelationshipWeatherSnapshot } from "@/utils/relationshipWeather";

import { useMapState } from "@/modules/map/dawayirIndex";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

type AnalyticalView = "network" | "stability" | "metrics" | "live";

interface MapOperationalStripProps {
  activeNodesCount: number;
  greenNodesCount: number;
  archivedNodesCount: number;
  onOpenSupport: () => void;
  isSovereign?: boolean;
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
  { id: "metrics", label: "المؤشرات", caption: "قياسات أعمق للخريطة" },
  { id: "live", label: "الجلسات", caption: "تفكيك عقد العلاقات" }
];

/* ── STAT CELL (Sovereign Telemetry) ── */
function StatCell({ label, value, color = "#6b8fa8" }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 border-r border-white/5 last:border-r-0">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50" style={{ color }}>{label}</span>
      <span className="text-lg font-black text-white">{value}</span>
    </div>
  );
}

/* ── COMMAND STRIP (Tactical HUD) ── */
export function MapOperationalStrip({
  activeNodesCount,
  greenNodesCount,
  archivedNodesCount,
  onOpenSupport,
  isSovereign
}: MapOperationalStripProps) {
  const [isSoundOn, setIsSoundOn] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('dawayir_ambient_sound') === 'true';
    return false;
  });
  
  const [isVoiceOn, setIsVoiceOn] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('dawayir_voice_presence') === 'true';
    return false;
  });

  const toggleSound = () => {
    const next = !isSoundOn;
    setIsSoundOn(next);
    localStorage.setItem('dawayir_ambient_sound', String(next));
    // MajazEngine is reactive, but we can also trigger a global event here if needed
    window.dispatchEvent(new CustomEvent('dawayir_sound_toggle', { detail: next }));
  };

  const toggleVoice = () => {
    const next = !isVoiceOn;
    setIsVoiceOn(next);
    localStorage.setItem('dawayir_voice_presence', String(next));
    window.dispatchEvent(new CustomEvent('dawayir_voice_toggle', { detail: next }));
  };
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="relative w-full max-w-2xl pointer-events-auto"
    >
      <div className="relative overflow-hidden rounded-2xl glass-dark border border-white/10 backdrop-blur-3xl shadow-2xl flex items-center p-1.5 h-16 ring-1 ring-white/5">
        {/* Glow Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-transparent to-rose-500/5 pointer-events-none" />
        
        {/* Stat Cluster */}
        <div className="flex flex-1 h-full items-center mr-4">
           <StatCell label="نشط" value={String(activeNodesCount)} color="#5eead4" />
           <StatCell label="أمان" value={String(greenNodesCount)} color="#2dd4bf" />
           <StatCell label="عزلة" value={String(archivedNodesCount)} color="#94a3b8" />
        </div>

        {/* Sensory Toggles */}
        <div className="flex items-center gap-2 px-4 border-l border-white/5 h-1/2">
           <button 
             onClick={toggleSound}
             className={`p-2 rounded-lg transition-all ${isSoundOn ? 'bg-teal-500/20 text-teal-400' : 'bg-white/5 text-white/20'}`}
             title={isSoundOn ? "كتم الصوت المحيطي" : "تفعيل الصوت المحيطي"}
           >
             {isSoundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
           </button>
           <button 
             onClick={toggleVoice}
             className={`p-2 rounded-lg transition-all ${isVoiceOn ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-white/20'}`}
             title={isVoiceOn ? "متابعة صوتية مفعلة" : "تفعيل المتابعة الصوتية"}
           >
             <Headset size={14} className={isVoiceOn ? "animate-pulse" : ""} />
           </button>
        </div>

        {/* Tactical Toggle */}
        <div className="flex shrink-0 gap-1.5 h-full">
          {isSovereign && (
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.pathname = "/admin";
                url.search = "";
                window.location.assign(url.toString());
              }}
              className="h-full px-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col items-center justify-center hover:bg-amber-500/20 transition-all group relative"
              title="رحلة العبور — مرصد البيانات"
            >
              <ShieldCheck className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[9px] font-black uppercase tracking-tight text-amber-500/80">Owner Hub</span>
              <span className="text-[10px] font-bold text-amber-50 whitespace-nowrap">بوابات العبور</span>
            </button>
          )}

          <button
            onClick={onOpenSupport}
            className="h-full px-6 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center gap-3 hover:bg-teal-500/20 transition-all group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-teal-400/5 translate-y-10 group-hover:translate-y-0 transition-transform duration-500" />
            <div className="relative flex flex-col items-end">
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-teal-400">Tactical Control</span>
              <span className="text-xs font-bold text-teal-50 whitespace-nowrap">لوحة القيادة</span>
            </div>
            <div className="relative p-2 rounded-lg bg-teal-500/20 text-teal-400 group-hover:scale-110 transition-transform">
               <Orbit className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function LiveSessionsView() {
  const nodes = useMapState(s => s.nodes);
  const sessionNodes = nodes.filter(n => n.lastLiveSessionAt).sort((a, b) => 
    new Date(b.lastLiveSessionAt!).getTime() - new Date(a.lastLiveSessionAt!).getTime()
  );

  if (sessionNodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-16 w-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 text-purple-400">
          <Mic size={32} />
        </div>
        <p className="text-white/60 text-sm font-medium">مفيش جلسات حية لسه</p>
        <p className="text-white/30 text-[10px] mt-2 leading-relaxed">افتح أي شخص في الخريطة<br />وابدأ معاه جلسة "مرآة الوعي"</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessionNodes.map(node => (
        <div key={node.id} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition-all hover:bg-white/[0.06]">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                  <Mic size={20} />
                </div>
                <div className="text-right">
                   <h4 className="text-sm font-black text-white">{node.label}</h4>
                   <p className="text-[10px] text-white/40">
                     {node.lastLiveSessionAt ? formatDistanceToNow(new Date(node.lastLiveSessionAt), { addSuffix: true, locale: ar }) : ''}
                   </p>
                </div>
             </div>
          </div>
          {node.lastTruthContract && (
            <div className="mt-3 text-[11px] leading-relaxed text-purple-200/60 border-t border-white/5 pt-3 text-right">
              <span className="font-bold text-purple-300">آخر عقد حقيقة:</span> {node.lastTruthContract.actionPoints?.[0] || node.lastTruthContract.summary}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function MapAnalyticalPanel({ segmentedView, onSegmentChange }: MapAnalyticalPanelProps) {
  const activeTab = analyticalTabs.find((tab) => tab.id === segmentedView) ?? analyticalTabs[0];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full pointer-events-auto space-y-5 pt-8">
      <div className="rounded-[2rem] border border-white/10 glass-dark p-3 backdrop-blur-3xl">
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

      <div className="rounded-[2.2rem] border border-white/10 glass-dark p-5 backdrop-blur-3xl shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-3 text-right">
          <div>
            <p className="text-[10px] font-black tracking-[0.24em] text-teal-200/70">عدسة تحليل</p>
            <h3 className="mt-2 text-xl font-black text-white">{activeTab.label}</h3>
            <p className="mt-1 text-xs leading-6 text-white/55">{activeTab.caption}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-2 text-white/65">
            {segmentedView === "metrics" ? <Sparkles className="h-4 w-4" /> : segmentedView === "network" ? <Orbit className="h-4 w-4" /> : segmentedView === "live" ? <Mic className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
          </div>
        </div>

        <div className="overflow-hidden">
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
            {segmentedView === "live" && <LiveSessionsView />}
        </div>
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
    ? "mx-auto mb-3 w-full max-w-[42rem] md:fixed md:right-8 md:bottom-40 md:mx-0 md:mb-0 md:w-[24rem] md:max-w-[24rem] md:z-[60]"
    : "hidden";

  return (
    <motion.div className={containerClass} initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: show ? 1 : 0, y: show ? 0 : 50, scale: show ? 1 : 0.95 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}>
       <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 glass-dark shadow-[0_32px_80px_rgba(0,0,0,0.8)] backdrop-blur-3xl p-6 ring-1 ring-white/5">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
             <button onClick={onToggle} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 transition-colors">
                <ChevronDown className="w-5 h-5" />
             </button>
             <div className="text-right">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-teal-400/80">Command Center</span>
                <h3 className="text-xl font-black text-white mt-1">مركز التحكم</h3>
             </div>
          </div>

          <div className="space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar pr-1">
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
              <p className="pt-4 text-center text-[10px] uppercase font-black tracking-widest text-teal-200/20">{mapCopy.dashboardSlogan}</p>
          </div>
       </div>
    </motion.div>
  );
}
