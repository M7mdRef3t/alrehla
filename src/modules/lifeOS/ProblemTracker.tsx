"use client";

import { memo, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Check, ArrowLeft, Plus, Flame, TrendingDown, Clock } from "lucide-react";
import { getDomainConfig, type LifeDomainId } from "@/types/lifeDomains";
import { useLifeState } from "@/domains/dawayir/store/life.store";

interface ProblemTrackerProps {
  onBack?: () => void;
}

const IMPACT_CONFIG = {
  low: { label: "خفيف", color: "#64748b", icon: "○" },
  medium: { label: "متوسط", color: "#f59e0b", icon: "◐" },
  high: { label: "عالي", color: "#f97316", icon: "●" },
  critical: { label: "حرج", color: "#ef4444", icon: "◉" }
};

export const ProblemTracker = memo(function ProblemTracker({ onBack }: ProblemTrackerProps) {
  const entries = useLifeState((s) => s.entries);
  const lifeScore = useLifeState((s) => s.lifeScore);
  const addProblem = useLifeState((s) => s.addProblem);
  const resolveEntry = useLifeState((s) => s.resolveEntry);

  const [isCreating, setIsCreating] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newDomain, setNewDomain] = useState<LifeDomainId>("self");
  const [newImpact, setNewImpact] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [sortBy, setSortBy] = useState<"recent" | "impact">("impact");

  const activeProblems = useMemo(() => {
    const problems = entries.filter(e => e.type === "problem" && e.status === "active");
    if (sortBy === "impact") {
      return problems.sort((a, b) => b.priority - a.priority);
    }
    return problems.sort((a, b) => b.createdAt - a.createdAt);
  }, [entries, sortBy]);

  const resolvedProblems = useMemo(() =>
    entries.filter(e => e.type === "problem" && e.status === "resolved")
      .sort((a, b) => (b.resolvedAt ?? 0) - (a.resolvedAt ?? 0))
      .slice(0, 5),
    [entries]
  );

  const domainDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of activeProblems) {
      counts[p.domainId] = (counts[p.domainId] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([id, count]) => ({ ...getDomainConfig(id as LifeDomainId), count }));
  }, [activeProblems]);

  const handleCreate = () => {
    if (!newContent.trim()) return;
    addProblem(newContent.trim(), newDomain, newImpact);
    setNewContent("");
    setIsCreating(false);
  };

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 text-white/40 rotate-180" />
            </button>
          )}
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              متتبع المشاكل
            </h2>
            <p className="text-[10px] text-white/25 font-bold uppercase tracking-wider">PROBLEM TRACKER</p>
          </div>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5"
          style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}
        >
          <Plus className="w-3.5 h-3.5" />
          مشكلة جديدة
        </button>
      </div>

      {/* Domain distribution mini-chart */}
      {domainDistribution.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {domainDistribution.map(d => (
            <div
              key={d.id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl shrink-0"
              style={{ background: `${d.color}10`, border: `1px solid ${d.color}20` }}
            >
              <span>{d.icon}</span>
              <span className="text-[11px] font-bold" style={{ color: d.color }}>{d.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Create Problem Form */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            className="rounded-2xl p-5 space-y-4"
            style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)" }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="إيه اللي مضايقك أو واقفك؟"
              className="w-full rounded-xl p-3 text-sm text-white bg-white/5 border border-white/8 placeholder:text-white/15 resize-none focus:outline-none focus:border-red-500/30"
              rows={2}
              autoFocus
            />

            {/* Impact selection */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-white/20 uppercase tracking-wider">مستوى التأثير</span>
              <div className="flex gap-1.5">
                {(Object.entries(IMPACT_CONFIG) as [keyof typeof IMPACT_CONFIG, typeof IMPACT_CONFIG[keyof typeof IMPACT_CONFIG]][]).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setNewImpact(key)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                    style={{
                      background: newImpact === key ? `${cfg.color}18` : "transparent",
                      border: `1px solid ${newImpact === key ? `${cfg.color}35` : "rgba(255,255,255,0.05)"}`,
                      color: newImpact === key ? cfg.color : "rgba(255,255,255,0.25)"
                    }}
                  >
                    {cfg.icon} {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Domain selection */}
            <div className="flex gap-1 flex-wrap">
              {[...Array.from(new Set(["self", "body", "relations", "work", "finance", "dreams", "spirit", "knowledge"] as LifeDomainId[]))].map(id => {
                const d = getDomainConfig(id);
                return (
                  <button
                    key={id}
                    onClick={() => setNewDomain(id)}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold transition-all"
                    style={{
                      background: newDomain === id ? `${d.color}18` : "transparent",
                      border: `1px solid ${newDomain === id ? `${d.color}35` : "rgba(255,255,255,0.05)"}`,
                      color: newDomain === id ? d.color : "rgba(255,255,255,0.25)"
                    }}
                  >
                    {d.icon} {d.label}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!newContent.trim()}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs disabled:opacity-30 flex items-center justify-center gap-1.5 text-white"
                style={{ background: "#ef4444" }}
              >
                <AlertTriangle className="w-3.5 h-3.5" /> تسجيل المشكلة
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white/40 bg-white/5 border border-white/8"
              >
                إلغاء
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sort toggle */}
      {activeProblems.length > 1 && (
        <div className="flex gap-1.5">
          <button
            onClick={() => setSortBy("impact")}
            className="text-[10px] font-bold px-2 py-1 rounded-lg transition-all"
            style={{
              background: sortBy === "impact" ? "rgba(239,68,68,0.12)" : "transparent",
              color: sortBy === "impact" ? "#f87171" : "rgba(255,255,255,0.2)"
            }}
          >
            <TrendingDown className="w-3 h-3 inline mr-1" /> حسب التأثير
          </button>
          <button
            onClick={() => setSortBy("recent")}
            className="text-[10px] font-bold px-2 py-1 rounded-lg transition-all"
            style={{
              background: sortBy === "recent" ? "rgba(239,68,68,0.12)" : "transparent",
              color: sortBy === "recent" ? "#f87171" : "rgba(255,255,255,0.2)"
            }}
          >
            <Clock className="w-3 h-3 inline mr-1" /> الأحدث
          </button>
        </div>
      )}

      {/* Active Problems */}
      <div className="space-y-2">
        {activeProblems.map((entry, i) => {
          const domain = getDomainConfig(entry.domainId);
          const impact = IMPACT_CONFIG[(entry as any).impact as keyof typeof IMPACT_CONFIG] ?? IMPACT_CONFIG.medium;
          const isRecurring = (entry as any).isRecurring;

          return (
            <motion.div
              key={entry.id}
              className="rounded-2xl p-4 flex items-start gap-3 group relative overflow-hidden"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              {/* Priority bar */}
              <div className="absolute right-0 top-0 bottom-0 w-1 rounded-r-full" style={{ background: impact.color }} />

              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: `${impact.color}12`, border: `1px solid ${impact.color}25` }}>
                <AlertTriangle className="w-3.5 h-3.5" style={{ color: impact.color }} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white/70 leading-relaxed">{entry.content}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${impact.color}12`, color: impact.color }}>
                    {impact.icon} {impact.label}
                  </span>
                  <span className="text-[9px]" style={{ color: domain.color }}>{domain.icon} {domain.label}</span>
                  {isRecurring && (
                    <span className="text-[9px] font-bold text-orange-400 flex items-center gap-0.5">
                      <Flame className="w-2.5 h-2.5" /> متكررة
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => resolveEntry(entry.id)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-emerald-500/15 border border-white/5 hover:border-emerald-500/30 flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Check className="w-3.5 h-3.5 text-white/30 group-hover:text-emerald-400" />
              </button>
            </motion.div>
          );
        })}

        {activeProblems.length === 0 && !isCreating && (
          <div className="text-center py-8 space-y-2">
            <Check className="w-8 h-8 text-emerald-500/20 mx-auto" />
            <p className="text-xs text-white/20">مفيش مشاكل مفتوحة — الأمور تمام ✅</p>
          </div>
        )}
      </div>

      {/* Resolved */}
      {resolvedProblems.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[10px] font-black text-white/15 uppercase tracking-wider">تم حلها</h3>
          {resolvedProblems.map(entry => (
            <div key={entry.id} className="rounded-xl p-3 flex items-center gap-3 opacity-40"
              style={{ background: "rgba(255,255,255,0.01)" }}>
              <Check className="w-3.5 h-3.5 text-emerald-400/50 shrink-0" />
              <p className="text-[11px] text-white/25 font-medium line-through flex-1">{entry.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
