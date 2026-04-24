import type { FC, ReactNode } from "react";
import { useState, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Activity,
  Archive,
  ClipboardList,
  Heart,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { AwarenessSkeleton } from "@/modules/meta/AwarenessSkeleton";

// ─── Lazy-loaded modules ─────────────────────────────────────────────────────
const UsersPanel                = lazy(() => import("../Users/UsersPanel").then(m => ({ default: m.UsersPanel })));
const UserStatePanel            = lazy(() => import("../Data/UserStatePanel").then(m => ({ default: m.UserStatePanel })));
const ConsciousnessArchivePanel = lazy(() => import("../Consciousness/ConsciousnessArchivePanel").then(m => ({ default: m.ConsciousnessArchivePanel })));
const SurveyResultsPanel        = lazy(() => import("../Data/SurveyResultsPanel").then(m => ({ default: m.SurveyResultsPanel })));

// ─── Tab definition ───────────────────────────────────────────────────────────
type PeopleTab = "travelers" | "pulse" | "archive" | "surveys";

interface TabConfig {
  id: PeopleTab;
  label: string;
  arabicLabel: string;
  icon: ReactNode;
  accent: string;
  glow: string;
  description: string;
}

const TABS: TabConfig[] = [
  {
    id: "travelers",
    label: "Travelers",
    arabicLabel: "إدارة المسافرين",
    icon: <Users className="w-4 h-4" />,
    accent: "teal",
    glow: "rgba(20,184,166,0.15)",
    description: "قاعدة بيانات النفوس المسافرة وتفاعلاتهم",
  },
  {
    id: "pulse",
    label: "Pulse",
    arabicLabel: "نبض الوعي",
    icon: <Activity className="h-4 w-4" />,
    accent: "rose",
    glow: "rgba(244,63,94,0.15)",
    description: "تتبع الحالة الشعورية والأنماط السلوكية الحية",
  },
  {
    id: "archive",
    label: "Archive",
    arabicLabel: "سجل الإدراك",
    icon: <Archive className="w-4 h-4" />,
    accent: "amber",
    glow: "rgba(245,158,11,0.15)",
    description: "الأرشيف التاريخي لوعي المنصة وتحولات المستخدمين",
  },
  {
    id: "surveys",
    label: "Surveys",
    arabicLabel: "صدى الصوت",
    icon: <ClipboardList className="w-4 h-4" />,
    accent: "sky",
    glow: "rgba(14,165,233,0.15)",
    description: "نتائج الاستبيانات وردود أفعال المسافرين",
  },
];

const ACCENT_CLASSES: Record<string, { border: string; text: string; bg: string; ring: string }> = {
  teal:    { border: "border-teal-500/30",  text: "text-teal-400",  bg: "bg-teal-500/10",  ring: "ring-teal-500/40" },
  rose:    { border: "border-rose-500/30",  text: "text-rose-400",  bg: "bg-rose-500/10",  ring: "ring-rose-500/40" },
  amber:   { border: "border-amber-500/30", text: "text-amber-400", bg: "bg-amber-500/10", ring: "ring-amber-500/40" },
  sky:     { border: "border-sky-500/30",   text: "text-sky-400",   bg: "bg-sky-500/10",   ring: "ring-sky-500/40" },
};

export const SovereignPeopleHub: FC = () => {
  const [activeTab, setActiveTab] = useState<PeopleTab>("travelers");
  const currentTab = TABS.find(t => t.id === activeTab)!;
  const accent = ACCENT_CLASSES[currentTab.accent];

  return (
    <div className="space-y-6" dir="rtl">
      {/* ── Sovereign Header ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 shadow-2xl">
        <div
          className="pointer-events-none absolute inset-0 rounded-[2rem] transition-all duration-700"
          style={{ background: `radial-gradient(ellipse at 80% 50%, ${currentTab.glow}, transparent 70%)` }}
        />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl ${accent.bg} border ${accent.border} flex items-center justify-center`}>
                <Heart className={`w-5 h-5 ${accent.text}`} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">مركز المسافرين والوعي</h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Traveler Community & Consciousness Hub</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500/10 border border-teal-500/20">
               <Users className="w-3.5 h-3.5 text-teal-400" />
               <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Active Souls: High</span>
             </div>
             <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
               <Activity className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
               <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Collective Resonance: 84%</span>
             </div>
          </div>
        </div>

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
            {activeTab === "travelers" && <UsersPanel />}
            {activeTab === "pulse"     && <UserStatePanel />}
            {activeTab === "archive"   && <ConsciousnessArchivePanel />}
            {activeTab === "surveys"   && <SurveyResultsPanel />}
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
