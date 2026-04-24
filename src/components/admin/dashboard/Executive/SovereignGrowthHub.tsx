import type { FC, ReactNode } from "react";
import { useState, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  Trophy,
  BarChart3,
  Mail,
  Target,
  Zap,
  TrendingUp,
  Globe,
  ChevronRight,
} from "lucide-react";
import { AwarenessSkeleton } from "@/modules/meta/AwarenessSkeleton";

// ─── Lazy-loaded growth modules ──────────────────────────────────────────────
const SovereignExpansionHub = lazy(() => import("./SovereignExpansionHub").then(m => ({ default: m.SovereignExpansionHub })));
const StoriesPanel          = lazy(() => import("../Marketing/StoriesPanel").then(m => ({ default: m.StoriesPanel })));
const MarketingOpsPanel     = lazy(() => import("../MarketingOps/MarketingOpsPanel").then(m => ({ default: m.MarketingOpsPanel })));
const SovereignFunnel       = lazy(() => import("../Analytics/SovereignFunnel").then(m => ({ default: m.SovereignFunnel })));

// ─── Tab definition ───────────────────────────────────────────────────────────
type GrowthTab = "strategy" | "stories" | "marketing" | "funnel";

interface TabConfig {
  id: GrowthTab;
  label: string;
  arabicLabel: string;
  icon: ReactNode;
  accent: string;
  glow: string;
  description: string;
}

const TABS: TabConfig[] = [
  {
    id: "strategy",
    label: "Strategy",
    arabicLabel: "رادار التوسع",
    icon: <Globe className="w-4 h-4" />,
    accent: "rose",
    glow: "rgba(244,63,94,0.15)",
    description: "إستراتيجية الانتشار العالمي ورنين الأسواق",
  },
  {
    id: "stories",
    label: "Victory Stories",
    arabicLabel: "حكايات الانتصار",
    icon: <Trophy className="h-4 w-4" />,
    accent: "teal",
    glow: "rgba(20,184,166,0.15)",
    description: "إدارة الدليل الاجتماعي وقصص النجاح الملهمة",
  },
  {
    id: "marketing",
    label: "Marketing Ops",
    arabicLabel: "رحلة الانتشار",
    icon: <Mail className="w-4 h-4" />,
    accent: "indigo",
    glow: "rgba(99,102,241,0.15)",
    description: "الحملات، البريد، وصناعة المحتوى الإعلاني",
  },
  {
    id: "funnel",
    label: "Sovereign Funnel",
    arabicLabel: "مسار التحويل",
    icon: <BarChart3 className="w-4 h-4" />,
    accent: "emerald",
    glow: "rgba(16,185,129,0.15)",
    description: "تحليل السقوط والنجاح داخل قمع المنصة المتقدم",
  },
];

const ACCENT_CLASSES: Record<string, { border: string; text: string; bg: string; ring: string }> = {
  rose:    { border: "border-rose-500/30",    text: "text-rose-400",    bg: "bg-rose-500/10",    ring: "ring-rose-500/40" },
  teal:    { border: "border-teal-500/30",    text: "text-teal-400",    bg: "bg-teal-500/10",    ring: "ring-teal-500/40" },
  indigo:  { border: "border-indigo-500/30",  text: "text-indigo-400",  bg: "bg-indigo-500/10",  ring: "ring-indigo-500/40" },
  emerald: { border: "border-emerald-500/30", text: "text-emerald-400", bg: "bg-emerald-500/10", ring: "ring-emerald-500/40" },
};

// ─── Sovereign Growth Hub ─────────────────────────────────────────────────────
export const SovereignGrowthHub: FC = () => {
  const [activeTab, setActiveTab] = useState<GrowthTab>("strategy");
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
                <Rocket className={`w-5 h-5 ${accent.text}`} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  محرك التوسع والنمو السيادي
                </h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  Sovereign Growth Engine · Expansion Hub
                </p>
              </div>
            </div>
          </div>

          {/* Live status strip */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <TrendingUp className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">نمو متسارع</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-white/5">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                إصابة الهدف
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-white/5">
              <Zap className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Virality: High
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
                  layoutId="growth-tab-indicator"
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
            {activeTab === "strategy"  && <SovereignExpansionHub />}
            {activeTab === "stories"   && <StoriesPanel />}
            {activeTab === "marketing" && <MarketingOpsPanel />}
            {activeTab === "funnel"    && <SovereignFunnel />}
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
