import type { FC, ReactNode } from "react";
import { useState, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Flame,
  Cpu,
  Rocket,
  GitBranch,
  Terminal,
  Zap,
  Activity,
  Radio,
  Eye,
  ChevronRight,
} from "lucide-react";
import { AwarenessSkeleton } from "@/modules/meta/AwarenessSkeleton";

// ─── Lazy-loaded sovereign AI modules ────────────────────────────────────────
const AIStudioPanel    = lazy(() => import("./AIStudioPanel").then(m => ({ default: m.AIStudioPanel })));
const AISimulatorPanel = lazy(() => import("./AISimulatorPanel").then(m => ({ default: m.AISimulatorPanel })));
const TheCrucible      = lazy(() => import("./TheCrucible").then(m => ({ default: m.TheCrucible })));
const DreamsMatrixPanel = lazy(() => import("./DreamsMatrixPanel").then(m => ({ default: m.DreamsMatrixPanel })));
const RepoIntelPanel   = lazy(() => import("./RepoIntelPanel"));
const FleetCommander   = lazy(() => import("../Fleet/FleetCommander").then(m => ({ default: m.FleetCommander })));
const AIDecisionLog    = lazy(() => import("../../AIDecisionLog").then(m => ({ default: m.AIDecisionLog })));

// ─── Tab definition ───────────────────────────────────────────────────────────
type HubTab = "orchestrator" | "crucible" | "dreams" | "simulator" | "fleet" | "repo" | "decisions";

interface TabConfig {
  id: HubTab;
  label: string;
  arabicLabel: string;
  icon: ReactNode;
  accent: string;
  glow: string;
  description: string;
}

const TABS: TabConfig[] = [
  {
    id: "orchestrator",
    label: "Orchestrator",
    arabicLabel: "المنسق السيادي",
    icon: <Brain className="w-4 h-4" />,
    accent: "teal",
    glow: "rgba(20,184,166,0.15)",
    description: "محرك الذكاء التوليفي — يجمع الإشارات ويُصدر الأوامر",
  },
  {
    id: "crucible",
    label: "The Crucible",
    arabicLabel: "المِحك",
    icon: <Flame className="w-4 h-4" />,
    accent: "rose",
    glow: "rgba(244,63,94,0.15)",
    description: "بيئة الاختبار الميداني — طحن البيانات والمشاريع",
  },
  {
    id: "dreams",
    label: "Dreams Matrix",
    arabicLabel: "مصفوفة الأحلام",
    icon: <Eye className="w-4 h-4" />,
    accent: "indigo",
    glow: "rgba(99,102,241,0.15)",
    description: "القشرة الجبهية للنظام — رؤية وتوافق الأهداف",
  },
  {
    id: "simulator",
    label: "Simulator",
    arabicLabel: "المحاكي",
    icon: <Cpu className="w-4 h-4" />,
    accent: "amber",
    glow: "rgba(245,158,11,0.15)",
    description: "اختبار سيناريوهات الأزمات والتناقضات",
  },
  {
    id: "fleet",
    label: "Fleet Commander",
    arabicLabel: "قائد الأسطول",
    icon: <Rocket className="w-4 h-4" />,
    accent: "violet",
    glow: "rgba(139,92,246,0.15)",
    description: "توجيه حالتك الذهنية نحو المركبة الأنسب",
  },
  {
    id: "repo",
    label: "Repo Intel",
    arabicLabel: "استخبارات المستودع",
    icon: <GitBranch className="w-4 h-4" />,
    accent: "emerald",
    glow: "rgba(16,185,129,0.15)",
    description: "قراءة عميقة لحالة الكود والذاكرة التقنية",
  },
  {
    id: "decisions",
    label: "Decision Log",
    arabicLabel: "سجل القرارات",
    icon: <Terminal className="w-4 h-4" />,
    accent: "slate",
    glow: "rgba(100,116,139,0.1)",
    description: "تتبع كل قرار اتخذه المحرك السيادي",
  },
];

const ACCENT_CLASSES: Record<string, { border: string; text: string; bg: string; ring: string }> = {
  teal:    { border: "border-teal-500/30",    text: "text-teal-400",    bg: "bg-teal-500/10",    ring: "ring-teal-500/40" },
  rose:    { border: "border-rose-500/30",    text: "text-rose-400",    bg: "bg-rose-500/10",    ring: "ring-rose-500/40" },
  indigo:  { border: "border-indigo-500/30",  text: "text-indigo-400",  bg: "bg-indigo-500/10",  ring: "ring-indigo-500/40" },
  amber:   { border: "border-amber-500/30",   text: "text-amber-400",   bg: "bg-amber-500/10",   ring: "ring-amber-500/40" },
  violet:  { border: "border-violet-500/30",  text: "text-violet-400",  bg: "bg-violet-500/10",  ring: "ring-violet-500/40" },
  emerald: { border: "border-emerald-500/30", text: "text-emerald-400", bg: "bg-emerald-500/10", ring: "ring-emerald-500/40" },
  slate:   { border: "border-slate-500/20",   text: "text-slate-400",   bg: "bg-slate-500/10",   ring: "ring-slate-500/30" },
};

// ─── Sovereign AI Hub ─────────────────────────────────────────────────────────
export const CommandAIHub: FC = () => {
  const [activeTab, setActiveTab] = useState<HubTab>("orchestrator");
  const currentTab = TABS.find(t => t.id === activeTab)!;
  const accent = ACCENT_CLASSES[currentTab.accent];

  return (
    <div className="space-y-6" dir="rtl">

      {/* ── Sovereign Header ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 shadow-2xl">
        {/* ambient glow */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[2rem] transition-all duration-700"
          style={{ background: `radial-gradient(ellipse at 80% 50%, ${currentTab.glow}, transparent 70%)` }}
        />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Title */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl ${accent.bg} border ${accent.border} flex items-center justify-center`}>
                <Brain className={`w-5 h-5 ${accent.text}`} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  المركز السيادي للذكاء
                </h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  Sovereign Intelligence Hub · AI Command
                </p>
              </div>
            </div>
          </div>

          {/* Live status strip */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500/10 border border-teal-500/20">
              <Radio className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
              <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">نشط</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-white/5">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {TABS.length} وحدة
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-white/5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Real-time
              </span>
            </div>
          </div>
        </div>

        {/* Active module description */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 mt-6 flex items-center gap-3"
          >
            <ChevronRight className={`w-4 h-4 ${accent.text} shrink-0`} />
            <span className={`text-sm font-bold ${accent.text}`}>{currentTab.arabicLabel}</span>
            <span className="text-slate-500 text-sm">—</span>
            <span className="text-sm text-slate-400">{currentTab.description}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Internal Tab Navigation ───────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(tab => {
          const isActive = tab.id === activeTab;
          const tabAccent = ACCENT_CLASSES[tab.accent];
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[11px] font-black uppercase tracking-widest
                transition-all duration-300 relative overflow-hidden
                ${isActive
                  ? `${tabAccent.bg} ${tabAccent.border} ${tabAccent.text} ring-1 ${tabAccent.ring} shadow-lg`
                  : "bg-slate-900/40 border-white/5 text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 hover:border-white/10"
                }
              `}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.arabicLabel}</span>
              <span className="sm:hidden">{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="hub-tab-indicator"
                  className={`absolute bottom-0 left-0 right-0 h-0.5 ${tabAccent.bg.replace("/10", "")}`}
                  style={{ background: `var(--color-${tab.accent}-400, currentColor)` }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Content Area ─────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={`
            rounded-[1.5rem] border p-6 md:p-8 min-h-[400px]
            bg-gradient-to-br from-slate-950/80 to-slate-900/60 backdrop-blur-xl
            ${accent.border}
          `}
          style={{ boxShadow: `0 0 60px -20px ${currentTab.glow}` }}
        >
          <Suspense fallback={<AwarenessSkeleton />}>
            {activeTab === "orchestrator" && <AIStudioPanel />}
            {activeTab === "crucible"     && <TheCrucible />}
            {activeTab === "dreams"       && <DreamsMatrixPanel />}
            {activeTab === "simulator"    && <AISimulatorPanel />}
            {activeTab === "fleet"        && <FleetCommander />}
            {activeTab === "repo"         && <RepoIntelPanel />}
            {activeTab === "decisions"    && <AIDecisionLog maxDecisions={100} />}
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
