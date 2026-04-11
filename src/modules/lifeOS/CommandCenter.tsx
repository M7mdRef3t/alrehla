"use client";

import { useEffect, useMemo, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Plus, ChevronLeft, Layers, ListChecks,
  AlertTriangle, Brain, Check, Clock, Target, ArrowLeft,
  Sparkles, MessageCircle, ClipboardCheck
} from "lucide-react";
import { LIFE_DOMAINS, getDomainConfig, type LifeDomainId, type LifeEntryType } from "@/types/lifeDomains";
import { useLifeState } from "@/domains/dawayir/store/life.store";
import { useAuthState } from "@/domains/auth/store/auth.store";
import { LifeScoreRing } from "./LifeScoreRing";
import { DomainRadar } from "./DomainRadar";
import { MorningBrief } from "./MorningBrief";
import { QuickCapture } from "./QuickCapture";
import { DecisionTheater } from "./DecisionTheater";
import { ProblemTracker } from "./ProblemTracker";
import { SelfPortrait } from "./SelfPortrait";
import { LifeTimeline } from "./LifeTimeline";
import { DomainAssessmentModal } from "./DomainAssessmentModal";
import { LifeAdvisorChat } from "./LifeAdvisorChat";
import { TodayView } from "./TodayView";
import { EveningReview } from "./EveningReview";
import { buildLifeContext, generateMorningBrief, detectLifePatterns } from "@/services/lifeAdvisor";
import { syncLifeStateWithDB } from "@/services/lifeStateSync";

interface CommandCenterProps {
  onBack?: () => void;
  onOpenLibrary?: () => void;
}

const ENTRY_TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  thought: { label: "فكرة", color: "#8b5cf6", icon: <Brain className="w-3.5 h-3.5" /> },
  problem: { label: "مشكلة", color: "#ef4444", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  decision: { label: "قرار", color: "#f59e0b", icon: <Brain className="w-3.5 h-3.5" /> },
  goal: { label: "هدف", color: "#06b6d4", icon: <Target className="w-3.5 h-3.5" /> },
  win: { label: "إنجاز", color: "#10b981", icon: <Check className="w-3.5 h-3.5" /> },
  lesson: { label: "درس", color: "#ec4899", icon: <Layers className="w-3.5 h-3.5" /> },
  note: { label: "ملاحظة", color: "#64748b", icon: <ListChecks className="w-3.5 h-3.5" /> }
};

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `${minutes} د`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} س`;
  const days = Math.floor(hours / 24);
  return `${days} ي`;
}

export default function CommandCenter({ onBack, onOpenLibrary }: CommandCenterProps) {
  const [activeView, setActiveView] = useState<"today" | "overview" | "domain-detail" | "decisions" | "problems" | "portrait">("today");
  const [activeDomainId, setActiveDomainId] = useState<LifeDomainId | null>(null);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  const [assessmentDomainId, setAssessmentDomainId] = useState<LifeDomainId | null>(null);
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [isEveningReviewOpen, setIsEveningReviewOpen] = useState(false);
  const [entryFilter, setEntryFilter] = useState<LifeEntryType | "all">("all");

  const lifeScore = useLifeState((s) => s.lifeScore);
  const entries = useLifeState((s) => s.entries);
  const assessments = useLifeState((s) => s.assessments);
  const recalculateLifeScore = useLifeState((s) => s.recalculateLifeScore);
  const resolveEntry = useLifeState((s) => s.resolveEntry);
  const authUser = useAuthState((s) => s.user);

  // Recalculate on mount + sync with Supabase if logged in
  useEffect(() => {
    recalculateLifeScore();
    if (authUser?.id) {
      syncLifeStateWithDB(authUser.id).catch(console.error);
    }
  }, [recalculateLifeScore, authUser?.id]);

  const domainScores = useMemo(() => {
    if (!lifeScore) {
      const defaultScores: Record<LifeDomainId, number> = {
        self: 50, body: 50, relations: 50, work: 50,
        finance: 50, dreams: 50, spirit: 50, knowledge: 50
      };
      return defaultScores;
    }
    return lifeScore.domains;
  }, [lifeScore]);

  const handleDomainClick = useCallback((domainId: LifeDomainId) => {
    setActiveDomainId(domainId);
    setActiveView("domain-detail");
  }, []);

  const filteredEntries = useMemo(() => {
    let result = entries.filter(e => e.status === "active");
    if (entryFilter !== "all") {
      result = result.filter(e => e.type === entryFilter);
    }
    if (activeDomainId && activeView === "domain-detail") {
      result = result.filter(e => e.domainId === activeDomainId);
    }
    return result.sort((a, b) => b.createdAt - a.createdAt).slice(0, 20);
  }, [entries, entryFilter, activeDomainId, activeView]);

  const activeProblems = useMemo(() =>
    entries.filter(e => e.type === "problem" && e.status === "active"),
    [entries]
  );

  const pendingDecisions = useMemo(() =>
    entries.filter(e => e.type === "decision" && e.status === "active"),
    [entries]
  );

  const activeDomainConfig = activeDomainId ? getDomainConfig(activeDomainId) : null;

  return (
    <div
      className="h-full w-full overflow-y-auto overflow-x-hidden"
      style={{ background: "#050510", scrollbarWidth: "thin" }}
      dir="rtl"
    >
      {/* Background ambient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute w-[600px] h-[600px] rounded-full top-[-20%] right-[-10%]"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 65%)" }} />
        <div className="absolute w-[500px] h-[500px] rounded-full bottom-[-15%] left-[-8%]"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 65%)" }} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 space-y-6 pb-28">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {(activeView === "domain-detail" || onBack) && (
              <button
                onClick={() => {
                  if (activeView === "domain-detail") {
                    setActiveView("overview");
                    setActiveDomainId(null);
                  } else {
                    onBack?.();
                  }
                }}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-white/40 rotate-180" />
              </button>
            )}
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">
                {activeView === "today" ? "يومك" :
                 activeView === "domain-detail" && activeDomainConfig
                  ? `${activeDomainConfig.icon} ${activeDomainConfig.label}`
                  : "مركز القيادة"}
              </h1>
              <p className="text-[10px] text-white/25 font-bold uppercase tracking-[0.12em]">
                {activeView === "today" ? "YOUR DAY" :
                 activeView === "domain-detail" ? activeDomainConfig?.description : "LIFE COMMAND CENTER"}
              </p>
            </div>
          </div>

          {/* Action buttons row */}
          <div className="flex items-center gap-2">
            {/* Library (if available) */}
            {onOpenLibrary && (
              <motion.button
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: "rgba(6,182,212,0.08)",
                  border: "1px solid rgba(6,182,212,0.2)"
                }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={onOpenLibrary}
                title="المكتبة"
              >
                <Layers className="w-4 h-4 text-cyan-400" style={{ width: 17, height: 17 }} />
              </motion.button>
            )}

            {/* Jarvis AI Advisor */}
            <motion.button
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(139,92,246,0.12)",
                border: "1px solid rgba(139,92,246,0.25)"
              }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAdvisorOpen(true)}
              title="تحدث مع جارفيس"
            >
              <Brain className="w-4.5 h-4.5 text-violet-400" style={{ width: 18, height: 18 }} />
            </motion.button>

            {/* Assessment */}
            <motion.button
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.2)"
              }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setAssessmentDomainId(null); setIsAssessmentOpen(true); }}
              title="تقييم مجال"
            >
              <ClipboardCheck className="w-4.5 h-4.5 text-emerald-400" style={{ width: 18, height: 18 }} />
            </motion.button>

            {/* Quick Capture FAB */}
            <motion.button
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
                boxShadow: "0 4px 20px rgba(139, 92, 246, 0.3)"
              }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsQuickCaptureOpen(true)}
            >
              <Plus className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeView === "today" ? (
            <motion.div
              key="today"
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <TodayView
                onOpenCapture={() => setIsQuickCaptureOpen(true)}
                onOpenDecisions={() => setActiveView("decisions")}
                onOpenAssessment={() => { setAssessmentDomainId(null); setIsAssessmentOpen(true); }}
                onOpenEveningReview={() => setIsEveningReviewOpen(true)}
              />
            </motion.div>
          ) : activeView === "overview" ? (
            <motion.div
              key="overview"
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Morning Brief with generated data */}
              <MorningBrief
                lifeScore={lifeScore}
                priorities={(() => {
                  try {
                    const ctx = buildLifeContext();
                    const brief = generateMorningBrief(ctx);
                    return brief.topPriorities;
                  } catch { return []; }
                })()}
                patternInsight={(() => {
                  try {
                    const ctx = buildLifeContext();
                    const patterns = detectLifePatterns(ctx);
                    return patterns[0]?.description;
                  } catch { return undefined; }
                })()}
              />

              {/* Module Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {[
                  { id: "today" as const, icon: "☀️", label: "يومك" },
                  { id: "overview" as const, icon: "🎯", label: "نظرة عامة" },
                  { id: "problems" as const, icon: "⚠️", label: `مشاكل${activeProblems.length > 0 ? ` (${activeProblems.length})` : ""}` },
                  { id: "decisions" as const, icon: "🧠", label: `قرارات${pendingDecisions.length > 0 ? ` (${pendingDecisions.length})` : ""}` },
                  { id: "portrait" as const, icon: "🔮", label: "صورة الذات" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveView(tab.id); setActiveDomainId(null); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all shrink-0"
                    style={{
                      background: activeView === tab.id ? "rgba(139,92,246,0.12)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${activeView === tab.id ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.05)"}`,
                      color: activeView === tab.id ? "#a78bfa" : "rgba(255,255,255,0.35)"
                    }}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Score + Radar Row */}
              <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
                <LifeScoreRing
                  score={lifeScore?.overall ?? 50}
                  trend={lifeScore?.trend ?? "stable"}
                  size={160}
                />
                <DomainRadar
                  scores={domainScores}
                  size={280}
                  onDomainClick={handleDomainClick}
                />
              </div>

              {/* Domain Cards Grid */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-black text-white/25 uppercase tracking-[0.15em]">مجالات حياتك</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {LIFE_DOMAINS.map((domain, i) => {
                    const score = domainScores[domain.id] ?? 50;
                    const isWeak = lifeScore?.weakestDomain === domain.id;
                    return (
                      <motion.button
                        key={domain.id}
                        className="rounded-2xl p-3.5 text-right transition-all group relative overflow-hidden"
                        style={{
                          background: isWeak ? `${domain.color}10` : "rgba(255,255,255,0.02)",
                          border: `1px solid ${isWeak ? `${domain.color}30` : "rgba(255,255,255,0.05)"}`
                        }}
                        onClick={() => handleDomainClick(domain.id)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
                        whileHover={{ scale: 1.02, borderColor: `${domain.color}50` }}
                      >
                        {isWeak && (
                          <div className="absolute top-2 left-2">
                            <AlertTriangle className="w-3 h-3 text-amber-400 animate-pulse" />
                          </div>
                        )}
                        <span className="text-xl block mb-1">{domain.icon}</span>
                        <span className="text-[11px] font-bold text-white/60 block">{domain.label}</span>
                        <span
                          className="text-lg font-black font-mono block mt-0.5"
                          style={{ color: domain.color }}
                        >
                          {score}
                        </span>
                        {/* Mini progress bar */}
                        <div className="w-full h-1 rounded-full bg-white/5 mt-2 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: domain.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${score}%` }}
                            transition={{ duration: 1, delay: 0.4 + i * 0.06 }}
                          />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Active Items Feed */}
              {(activeProblems.length > 0 || pendingDecisions.length > 0 || entries.length > 0) && (
                <div className="space-y-3">
                  {/* Filter bar */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-white/25 uppercase tracking-[0.15em]">السجل</h3>
                    <div className="flex gap-1.5">
                      {[
                        { id: "all" as const, label: "الكل" },
                        { id: "problem" as const, label: "مشاكل" },
                        { id: "decision" as const, label: "قرارات" },
                        { id: "goal" as const, label: "أهداف" }
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setEntryFilter(f.id)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                          style={{
                            background: entryFilter === f.id ? "rgba(139,92,246,0.15)" : "transparent",
                            border: `1px solid ${entryFilter === f.id ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.05)"}`,
                            color: entryFilter === f.id ? "#a78bfa" : "rgba(255,255,255,0.3)"
                          }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Entry cards */}
                  <div className="space-y-2">
                    {filteredEntries.map((entry, i) => {
                      const config = ENTRY_TYPE_CONFIG[entry.type] ?? ENTRY_TYPE_CONFIG.note;
                      const domainConfig = getDomainConfig(entry.domainId);
                      return (
                        <motion.div
                          key={entry.id}
                          className="rounded-xl p-3.5 flex items-start gap-3 group"
                          style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.05)"
                          }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                        >
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                            style={{
                              background: `${config.color}12`,
                              border: `1px solid ${config.color}25`,
                              color: config.color
                            }}
                          >
                            {config.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white/70 line-clamp-2 leading-relaxed">
                              {entry.content}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                                style={{ background: `${config.color}12`, color: config.color }}>
                                {config.label}
                              </span>
                              <span className="text-[9px] text-white/20 font-mono">{domainConfig.icon} {domainConfig.label}</span>
                              <span className="text-[9px] text-white/15 font-mono flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {timeAgo(entry.createdAt)}
                              </span>
                            </div>
                          </div>
                          {entry.status === "active" && (entry.type === "problem" || entry.type === "decision") && (
                            <button
                              onClick={() => resolveEntry(entry.id)}
                              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-emerald-500/15 border border-white/5 hover:border-emerald-500/30 flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Check className="w-3.5 h-3.5 text-white/30 group-hover:text-emerald-400" />
                            </button>
                          )}
                        </motion.div>
                      );
                    })}
                    {filteredEntries.length === 0 && (
                      <div className="text-center py-10 space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-white/3 border border-white/5 flex items-center justify-center mx-auto">
                          <Layers className="w-6 h-6 text-white/15" />
                        </div>
                        <p className="text-xs text-white/20 font-medium">مفيش حاجة هنا لسه</p>
                        <button
                          onClick={() => setIsQuickCaptureOpen(true)}
                          className="text-[11px] font-bold text-violet-400 hover:text-violet-300 transition-colors"
                        >
                          + سجّل أول فكرة
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ) : activeView === "decisions" ? (
            <motion.div
              key="decisions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DecisionTheater onBack={() => setActiveView("overview")} />
            </motion.div>
          ) : activeView === "problems" ? (
            <motion.div
              key="problems"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ProblemTracker onBack={() => setActiveView("overview")} />
            </motion.div>
          ) : activeView === "portrait" ? (
            <motion.div
              key="portrait"
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Self Portrait Visualization */}
              <div className="flex justify-center">
                <SelfPortrait
                  lifeScore={lifeScore}
                  size={340}
                  onDomainClick={handleDomainClick}
                />
              </div>

              {/* Life Timeline */}
              <LifeTimeline maxDays={14} />
            </motion.div>
          ) : (
            /* Domain Detail View */
            <motion.div
              key="domain-detail"
              className="space-y-5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {activeDomainConfig && (
                <>
                  {/* Domain Score Hero */}
                  <div
                    className="rounded-3xl p-6 relative overflow-hidden"
                    style={{
                      background: `${activeDomainConfig.color}08`,
                      border: `1px solid ${activeDomainConfig.color}20`
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-4xl">{activeDomainConfig.icon}</span>
                        <h2 className="text-2xl font-black text-white">{activeDomainConfig.label}</h2>
                        <p className="text-xs text-white/30 font-medium">{activeDomainConfig.description}</p>
                      </div>
                      <LifeScoreRing
                        score={domainScores[activeDomainId!] ?? 50}
                        size={100}
                        strokeWidth={6}
                        label=""
                      />
                    </div>
                  </div>

                  {/* Domain-specific entries */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-black text-white/25 uppercase tracking-[0.15em]">
                        سجلات {activeDomainConfig.label}
                      </h3>
                      <button
                        className="text-[11px] font-bold flex items-center gap-1 transition-colors"
                        style={{ color: activeDomainConfig.color }}
                        onClick={() => setIsQuickCaptureOpen(true)}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        إضافة
                      </button>
                    </div>
                    {filteredEntries.map((entry, i) => {
                      const config = ENTRY_TYPE_CONFIG[entry.type] ?? ENTRY_TYPE_CONFIG.note;
                      return (
                        <motion.div
                          key={entry.id}
                          className="rounded-xl p-3.5 flex items-start gap-3"
                          style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.05)"
                          }}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              background: `${config.color}12`,
                              border: `1px solid ${config.color}25`,
                              color: config.color
                            }}
                          >
                            {config.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white/70">{entry.content}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                                style={{ background: `${config.color}12`, color: config.color }}>
                                {config.label}
                              </span>
                              <span className="text-[9px] text-white/15 font-mono">
                                {timeAgo(entry.createdAt)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                    {filteredEntries.length === 0 && (
                      <div className="text-center py-8 space-y-2">
                        <p className="text-xs text-white/20">مفيش سجلات في {activeDomainConfig.label} لسه</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Capture Modal */}
      <QuickCapture
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
      />

      {/* Domain Assessment Modal */}
      <DomainAssessmentModal
        isOpen={isAssessmentOpen}
        onClose={() => { setIsAssessmentOpen(false); setAssessmentDomainId(null); }}
        initialDomainId={assessmentDomainId}
      />

      {/* Life Advisor Chat */}
      <LifeAdvisorChat
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
      />

      {/* Evening Review */}
      <AnimatePresence>
        {isEveningReviewOpen && (
          <EveningReview
            isOpen={isEveningReviewOpen}
            onClose={() => setIsEveningReviewOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
