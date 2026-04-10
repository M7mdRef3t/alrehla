"use client";

import { memo, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, AlertTriangle, Check, ChevronDown, ChevronUp,
  Target, Plus, Sparkles, ArrowLeft, Clock, X
} from "lucide-react";
import { LIFE_DOMAINS, getDomainConfig, type LifeDomainId, type DecisionOption } from "@/types/lifeDomains";
import { useLifeState } from "@/state/lifeState";
import {
  scoreDecisionOptions,
  identifyImpactedDomains,
  detectBlindSpots
} from "@/services/decisionOracle";

interface DecisionTheaterProps {
  onBack?: () => void;
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const DecisionTheater = memo(function DecisionTheater({ onBack }: DecisionTheaterProps) {
  const entries = useLifeState((s) => s.entries);
  const lifeScore = useLifeState((s) => s.lifeScore);
  const addDecision = useLifeState((s) => s.addDecision);
  const resolveEntry = useLifeState((s) => s.resolveEntry);
  const decideOption = useLifeState((s) => s.decideOption);

  const [isCreating, setIsCreating] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newDomain, setNewDomain] = useState<LifeDomainId>("self");
  const [newUrgency, setNewUrgency] = useState<"can_wait" | "this_week" | "today" | "now">("this_week");
  const [options, setOptions] = useState<DecisionOption[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const pendingDecisions = useMemo(() =>
    entries.filter(e => e.type === "decision" && e.status === "active")
      .sort((a, b) => b.createdAt - a.createdAt),
    [entries]
  );

  const resolvedDecisions = useMemo(() =>
    entries.filter(e => e.type === "decision" && e.status === "resolved")
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5),
    [entries]
  );

  const addOption = useCallback(() => {
    setOptions(prev => [...prev, {
      id: uid(),
      label: "",
      pros: [],
      cons: []
    }]);
  }, []);

  const updateOption = useCallback((optId: string, field: "label", value: string) => {
    setOptions(prev => prev.map(o => o.id === optId ? { ...o, [field]: value } : o));
  }, []);

  const removeOption = useCallback((optId: string) => {
    setOptions(prev => prev.filter(o => o.id !== optId));
  }, []);

  const handleCreate = useCallback(() => {
    if (!newContent.trim()) return;
    const validOptions = options.filter(o => o.label.trim());
    addDecision(newContent.trim(), newDomain, newUrgency, validOptions);
    setNewContent("");
    setOptions([]);
    setIsCreating(false);
  }, [newContent, newDomain, newUrgency, options, addDecision]);

  const urgencyConfig = {
    can_wait: { label: "يقدر يستنى", color: "#64748b", icon: "⏳" },
    this_week: { label: "الأسبوع ده", color: "#f59e0b", icon: "📅" },
    today: { label: "النهاردة", color: "#f97316", icon: "⚡" },
    now: { label: "دلوقتي", color: "#ef4444", icon: "🔴" }
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
              <Brain className="w-5 h-5 text-amber-400" />
              مسرح القرارات
            </h2>
            <p className="text-[10px] text-white/25 font-bold uppercase tracking-wider">DECISION THEATER</p>
          </div>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5"
          style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", color: "#fbbf24" }}
        >
          <Plus className="w-3.5 h-3.5" />
          قرار جديد
        </button>
      </div>

      {/* Create Decision Form */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            className="rounded-2xl p-5 space-y-4"
            style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="إيه القرار اللي محيرك؟"
              className="w-full rounded-xl p-3 text-sm text-white bg-white/5 border border-white/8 placeholder:text-white/15 resize-none focus:outline-none focus:border-amber-500/30"
              rows={2}
              autoFocus
            />

            {/* Domain + Urgency */}
            <div className="flex gap-3 flex-wrap">
              <div className="flex gap-1 flex-wrap">
                {LIFE_DOMAINS.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setNewDomain(d.id)}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold transition-all"
                    style={{
                      background: newDomain === d.id ? `${d.color}18` : "transparent",
                      border: `1px solid ${newDomain === d.id ? `${d.color}35` : "rgba(255,255,255,0.05)"}`,
                      color: newDomain === d.id ? d.color : "rgba(255,255,255,0.25)"
                    }}
                  >
                    {d.icon} {d.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                {(Object.entries(urgencyConfig) as [keyof typeof urgencyConfig, typeof urgencyConfig[keyof typeof urgencyConfig]][]).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setNewUrgency(key)}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold transition-all"
                    style={{
                      background: newUrgency === key ? `${cfg.color}18` : "transparent",
                      border: `1px solid ${newUrgency === key ? `${cfg.color}35` : "rgba(255,255,255,0.05)"}`,
                      color: newUrgency === key ? cfg.color : "rgba(255,255,255,0.25)"
                    }}
                  >
                    {cfg.icon} {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-white/25 uppercase tracking-wider">الخيارات</span>
                <button onClick={addOption} className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                  <Plus className="w-3 h-3" /> إضافة خيار
                </button>
              </div>
              {options.map((opt, i) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-white/20 w-5">{i + 1}.</span>
                  <input
                    value={opt.label}
                    onChange={(e) => updateOption(opt.id, "label", e.target.value)}
                    placeholder={`الخيار ${i + 1}`}
                    className="flex-1 rounded-lg px-3 py-1.5 text-xs text-white bg-white/5 border border-white/8 placeholder:text-white/15 focus:outline-none focus:border-amber-500/30"
                  />
                  <button onClick={() => removeOption(opt.id)} className="text-white/15 hover:text-red-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!newContent.trim()}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs text-black disabled:opacity-30 flex items-center justify-center gap-1.5"
                style={{ background: "#fbbf24" }}
              >
                <Brain className="w-3.5 h-3.5" /> حفظ القرار
              </button>
              <button
                onClick={() => { setIsCreating(false); setOptions([]); }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white/40 bg-white/5 border border-white/8"
              >
                إلغاء
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blind Spots Alert */}
      {lifeScore && detectBlindSpots({}, lifeScore).length > 0 && (
        <motion.div
          className="rounded-2xl p-4 space-y-2"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h3 className="text-[10px] font-black text-red-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> نقاط عمياء
          </h3>
          {detectBlindSpots({}, lifeScore).map((spot, i) => (
            <p key={i} className="text-[11px] text-white/50 font-medium leading-relaxed">• {spot}</p>
          ))}
        </motion.div>
      )}

      {/* Pending Decisions */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-black text-white/25 uppercase tracking-wider">
          قرارات معلقة ({pendingDecisions.length})
        </h3>
        {pendingDecisions.map((entry, i) => {
          const domain = getDomainConfig(entry.domainId);
          const isExpanded = expandedId === entry.id;
          const urg = urgencyConfig[(entry as any).urgency as keyof typeof urgencyConfig] ?? urgencyConfig.this_week;

          return (
            <motion.div
              key={entry.id}
              className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                className="w-full p-4 flex items-start gap-3 text-right"
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${urg.color}12`, border: `1px solid ${urg.color}25` }}>
                  <Brain className="w-4 h-4" style={{ color: urg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white/70">{entry.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-bold" style={{ color: domain.color }}>{domain.icon} {domain.label}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${urg.color}12`, color: urg.color }}>
                      {urg.icon} {urg.label}
                    </span>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-white/20" /> : <ChevronDown className="w-4 h-4 text-white/20" />}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    className="px-4 pb-4 space-y-3"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="border-t border-white/5 pt-3">
                      <button
                        onClick={() => resolveEntry(entry.id)}
                        className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                      >
                        <Check className="w-3.5 h-3.5" /> حسمت القرار
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {pendingDecisions.length === 0 && !isCreating && (
          <div className="text-center py-8 space-y-2">
            <Brain className="w-8 h-8 text-white/10 mx-auto" />
            <p className="text-xs text-white/20">مفيش قرارات معلقة — عقلك صافي 🧠</p>
          </div>
        )}
      </div>

      {/* Resolved Decisions */}
      {resolvedDecisions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[10px] font-black text-white/15 uppercase tracking-wider">
            قرارات محسومة
          </h3>
          {resolvedDecisions.map(entry => {
            const domain = getDomainConfig(entry.domainId);
            return (
              <div key={entry.id} className="rounded-xl p-3 flex items-center gap-3 opacity-50"
                style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)" }}>
                <Check className="w-4 h-4 text-emerald-400/50 shrink-0" />
                <p className="text-[11px] text-white/30 font-medium line-through flex-1">{entry.content}</p>
                <span className="text-[9px]" style={{ color: domain.color }}>{domain.icon}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
