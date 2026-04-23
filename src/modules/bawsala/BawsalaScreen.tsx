/**
 * بوصلة — Bawsala: بوصلة القرارات
 *
 * أداة فريدة لاتخاذ القرارات العاطفية الصعبة:
 * - Decision Matrix — حلّل كل خيار
 * - Values Alignment — هل يتوافق مع قيمك؟
 * - Gut Check — إحساسك الداخلي
 * - Decision Log — سجل قراراتك
 * - Reflection — ارجع وقيّم
 */

import type { FC } from "react";
import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass, Plus, ChevronDown, ChevronRight, Scale, Heart,
  Brain, Star, Trash2, Check, ArrowRight, Clock, Eye,
  Zap as Sparkles, ThumbsUp, ThumbsDown, PenLine, X, AlertCircle,
} from "lucide-react";
import { useBawsalaState, type Decision, type DecisionOption } from "./store/bawsala.store";

/* ═══════════════════════════════════════════ */
/*               CONSTANTS                    */
/* ═══════════════════════════════════════════ */

type TabId = "compass" | "log" | "values";

const TABS: { id: TabId; label: string; icon: typeof Compass }[] = [
  { id: "compass", label: "البوصلة", icon: Compass },
  { id: "log", label: "سجل القرارات", icon: Clock },
  { id: "values", label: "قيمي", icon: Heart },
];

const GUT_LABELS = ["❌", "😰", "😟", "🤔", "😐", "🙂", "😊", "😄", "🤩", "💚", "🔥"];

/* ═══════════════════════════════════════════ */
/*             SUB COMPONENTS                 */
/* ═══════════════════════════════════════════ */

/* ── Broadcast Overlay ── */
const BroadcastOverlay: FC<{ active?: boolean }> = ({ active }) => (
  <AnimatePresence>
    {active && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      >
        {/* Pulsing ring */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.15)_0%,transparent_70%)]"
        />
        {/* Scan line */}
        <motion.div
          animate={{ y: ["-100%", "200%"] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent opacity-20"
        />
      </motion.div>
    )}
  </AnimatePresence>
);

/* ── New Decision Creator ── */
const NewDecisionForm: FC<{ onClose: () => void }> = ({ onClose }) => {
  const [question, setQuestion] = useState("");
  const [context, setContext] = useState("");
  const addDecision = useBawsalaState((s) => s.addDecision);

  const handleSubmit = () => {
    if (!question.trim()) return;
    addDecision(question.trim(), context.trim());
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
      className="mx-5 mb-5 p-5 rounded-2xl space-y-4"
      style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.12)" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-black text-cyan-400">قرار جديد</p>
        <button onClick={onClose} className="p-1"><X className="w-4 h-4 text-slate-500" /></button>
      </div>
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder='مثلاً: "هل أسامح ولّا أمشي؟"'
        className="w-full p-3 rounded-xl text-sm text-white placeholder:text-slate-600 outline-none"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
      />
      <textarea
        value={context}
        onChange={(e) => setContext(e.target.value)}
        placeholder="السياق — إيه اللي وصلك لهنا؟ (اختياري)"
        rows={2}
        className="w-full p-3 rounded-xl text-xs text-white placeholder:text-slate-600 outline-none resize-none"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
      />
      <button onClick={handleSubmit} disabled={!question.trim()}
        className="w-full py-3 rounded-xl text-xs font-bold transition-all active:scale-98 disabled:opacity-30"
        style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.2)", color: "#06b6d4" }}
      >
        ابدأ التحليل
      </button>
    </motion.div>
  );
};

/* ── Option Detail Card ── */
const OptionCard: FC<{
  option: DecisionOption;
  decisionId: string;
  isChosen: boolean;
  isDecided: boolean;
  onChoose: () => void;
}> = ({ option, decisionId, isChosen, isDecided, onChoose }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newPro, setNewPro] = useState("");
  const [newCon, setNewCon] = useState("");
  const updateOption = useBawsalaState((s) => s.updateOption);

  const addPro = () => {
    if (!newPro.trim()) return;
    updateOption(decisionId, option.id, { pros: [...option.pros, newPro.trim()] });
    setNewPro("");
  };

  const addCon = () => {
    if (!newCon.trim()) return;
    updateOption(decisionId, option.id, { cons: [...option.cons, newCon.trim()] });
    setNewCon("");
  };

  const score = Math.round((option.gutFeeling * 10 + option.valuesAlignment) / 2);

  return (
    <motion.div layout className="rounded-2xl overflow-hidden"
      style={{
        background: isChosen ? "rgba(16,185,129,0.06)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${isChosen ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)"}`,
      }}
    >
      <button onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center gap-3 text-right"
      >
        {/* Score Circle */}
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: score >= 70 ? "rgba(16,185,129,0.1)" : score >= 40 ? "rgba(251,191,36,0.1)" : "rgba(239,68,68,0.1)",
            border: `1px solid ${score >= 70 ? "rgba(16,185,129,0.2)" : score >= 40 ? "rgba(251,191,36,0.2)" : "rgba(239,68,68,0.2)"}`,
          }}
        >
          <span className="text-sm font-black" style={{ color: score >= 70 ? "#10b981" : score >= 40 ? "#fbbf24" : "#ef4444" }}>{score}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{option.label}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[9px] text-slate-500">
              {GUT_LABELS[option.gutFeeling]} إحساس
            </span>
            <span className="text-[9px] text-slate-500">
              💎 توافق {option.valuesAlignment}%
            </span>
          </div>
        </div>

        {isChosen && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
        <ChevronDown className={`w-3.5 h-3.5 text-slate-600 transition-transform shrink-0 ${isExpanded ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-3">
              {/* Gut Feeling Slider */}
              <div>
                <p className="text-[10px] text-slate-500 font-bold mb-2 flex items-center gap-1">
                  <Brain className="w-3 h-3" /> إحساسك الداخلي
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{GUT_LABELS[option.gutFeeling]}</span>
                  <input type="range" min={0} max={10} value={option.gutFeeling}
                    onChange={(e) => updateOption(decisionId, option.id, { gutFeeling: +e.target.value })}
                    className="flex-1 accent-cyan-500 h-1.5"
                  />
                  <span className="text-xs font-bold text-cyan-400 w-5 text-center">{option.gutFeeling}</span>
                </div>
              </div>

              {/* Values Alignment */}
              <div>
                <p className="text-[10px] text-slate-500 font-bold mb-2 flex items-center gap-1">
                  <Heart className="w-3 h-3" /> توافق مع قيمك
                </p>
                <div className="flex items-center gap-2">
                  <input type="range" min={0} max={100} value={option.valuesAlignment}
                    onChange={(e) => updateOption(decisionId, option.id, { valuesAlignment: +e.target.value })}
                    className="flex-1 accent-pink-500 h-1.5"
                  />
                  <span className="text-xs font-bold text-pink-400 w-8 text-center">{option.valuesAlignment}%</span>
                </div>
              </div>

              {/* Pros */}
              <div>
                <p className="text-[10px] text-emerald-400/60 font-bold mb-1.5 flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3" /> مع ({option.pros.length})
                </p>
                <div className="space-y-1 mb-2">
                  {option.pros.map((pro, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                      <div className="w-1 h-1 rounded-full bg-emerald-400/40 shrink-0" />
                      {pro}
                    </div>
                  ))}
                </div>
                <div className="flex gap-1">
                  <input value={newPro} onChange={(e) => setNewPro(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addPro()}
                    placeholder="أضف ميزة..."
                    className="flex-1 px-2 py-1.5 rounded-lg text-[10px] text-white placeholder:text-slate-600 outline-none"
                    style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.1)" }}
                  />
                  <button onClick={addPro} className="p-1.5 rounded-lg" style={{ background: "rgba(16,185,129,0.1)" }}>
                    <Plus className="w-3 h-3 text-emerald-400" />
                  </button>
                </div>
              </div>

              {/* Cons */}
              <div>
                <p className="text-[10px] text-red-400/60 font-bold mb-1.5 flex items-center gap-1">
                  <ThumbsDown className="w-3 h-3" /> ضد ({option.cons.length})
                </p>
                <div className="space-y-1 mb-2">
                  {option.cons.map((con, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                      <div className="w-1 h-1 rounded-full bg-red-400/40 shrink-0" />
                      {con}
                    </div>
                  ))}
                </div>
                <div className="flex gap-1">
                  <input value={newCon} onChange={(e) => setNewCon(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCon()}
                    placeholder="أضف عيب..."
                    className="flex-1 px-2 py-1.5 rounded-lg text-[10px] text-white placeholder:text-slate-600 outline-none"
                    style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.1)" }}
                  />
                  <button onClick={addCon} className="p-1.5 rounded-lg" style={{ background: "rgba(239,68,68,0.1)" }}>
                    <Plus className="w-3 h-3 text-red-400" />
                  </button>
                </div>
              </div>

              {/* Choose Button */}
              {!isDecided && (
                <button onClick={onChoose}
                  className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", color: "#06b6d4" }}
                >
                  <Check className="w-3.5 h-3.5" /> اختار ده
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ── Active Decision Panel ── */
const ActiveDecision: FC<{ decision: Decision; values: any[] }> = ({ decision, values }) => {
  const [newOptionLabel, setNewOptionLabel] = useState("");
  const [reflectionText, setReflectionText] = useState("");
  const { addOption, chooseOption, removeDecision, addReflection } = useBawsalaState();

  const handleAddOption = () => {
    if (!newOptionLabel.trim()) return;
    addOption(decision.id, newOptionLabel.trim());
    setNewOptionLabel("");
  };

  const bestOption = useMemo(() => {
    if (decision.options.length === 0) return null;
    return [...decision.options].sort((a, b) => {
      const scoreA = (a.gutFeeling * 10 + a.valuesAlignment) / 2;
      const scoreB = (b.gutFeeling * 10 + b.valuesAlignment) / 2;
      return scoreB - scoreA;
    })[0];
  }, [decision.options]);

  const oracleInsight = useMemo(() => {
    if (!bestOption || decision.options.length < 2) return null;
    if (bestOption.gutFeeling >= 7 && bestOption.valuesAlignment <= 40) {
      return {
        type: "warning",
        text: `بصيرة البوصلة: إحساسك يميل بقوة نحو «${bestOption.label}»، لكنه يتعارض بشدة مع مبادئك. هل تشتري الراحة المؤقتة بثمن مبادئك؟`,
      };
    }
    if (bestOption.gutFeeling <= 4 && bestOption.valuesAlignment >= 75) {
      return {
        type: "insight",
        text: `بصيرة البوصلة: «${bestOption.label}» يطابق قيمك الأساسية، ولكن إحساسك يقاومه بضيق. ربما لأن الصواب أحياناً يكون الأثقل على النفس؟`,
      };
    }
    const score = (bestOption.gutFeeling * 10 + bestOption.valuesAlignment) / 2;
    if (score >= 80) {
      return {
        type: "alignment",
        text: `تناغم كامل: «${bestOption.label}» يتوافق مع قلبك ومبادئك. توكل على الله.`,
      };
    }
    return null;
  }, [bestOption, decision.options.length]);

  return (
    <div className="mx-5 mb-5 space-y-3">
      {/* Header */}
      <div className="p-4 rounded-2xl"
        style={{
          background: decision.status === "decided" ? "rgba(16,185,129,0.04)" : "rgba(6,182,212,0.04)",
          border: `1px solid ${decision.status === "decided" ? "rgba(16,185,129,0.1)" : "rgba(6,182,212,0.1)"}`,
        }}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <p className="text-sm font-black text-white leading-snug">{decision.question}</p>
            {decision.context && (
              <p className="text-[10px] text-slate-500 mt-1">{decision.context}</p>
            )}
          </div>
          <button onClick={() => removeDecision(decision.id)} className="p-1 opacity-30 hover:opacity-60">
            <Trash2 className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[8px] font-black px-2 py-0.5 rounded"
            style={{
              background: decision.status === "decided" ? "rgba(16,185,129,0.1)" : decision.status === "reflected" ? "rgba(168,85,247,0.1)" : "rgba(6,182,212,0.1)",
              color: decision.status === "decided" ? "#10b981" : decision.status === "reflected" ? "#a855f7" : "#06b6d4",
            }}
          >
            {decision.status === "active" ? "قيد التفكير" : decision.status === "decided" ? "تم القرار" : "تم التأمل"}
          </span>
          <span className="text-[8px] text-slate-600">{decision.options.length} خيارات</span>
        </div>

        {/* AI Suggestion / Oracle */}
        {decision.status === "active" && oracleInsight && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 rounded-xl flex items-start gap-2.5"
            style={{
              background: oracleInsight.type === "warning" ? "rgba(239,68,68,0.08)" : oracleInsight.type === "insight" ? "rgba(139,92,246,0.08)" : "rgba(16,185,129,0.08)",
              border: `1px solid ${oracleInsight.type === "warning" ? "rgba(239,68,68,0.15)" : oracleInsight.type === "insight" ? "rgba(139,92,246,0.15)" : "rgba(16,185,129,0.15)"}`
            }}
          >
            {oracleInsight.type === "warning" ? <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" /> : <Sparkles className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />}
            <p className="text-[11px] font-bold leading-relaxed"
              style={{ color: oracleInsight.type === "warning" ? "#fca5a5" : oracleInsight.type === "insight" ? "#c4b5fd" : "#6ee7b7" }}
            >
              {oracleInsight.text}
            </p>
          </motion.div>
        )}
      </div>

      {/* Options */}
      {decision.options.map((opt) => (
        <OptionCard
          key={opt.id}
          option={opt}
          decisionId={decision.id}
          isChosen={decision.chosenOptionId === opt.id}
          isDecided={decision.status !== "active"}
          onChoose={() => chooseOption(decision.id, opt.id)}
        />
      ))}

      {/* Add Option */}
      {decision.status === "active" && (
        <div className="flex gap-2 mt-4">
          <input value={newOptionLabel} onChange={(e) => setNewOptionLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddOption()}
            placeholder='أضف خيار — مثلاً: "أسامح وأكمل"'
            className="flex-1 px-3 py-2.5 rounded-xl text-xs text-white placeholder:text-slate-600 outline-none"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          />
          <button onClick={handleAddOption} disabled={!newOptionLabel.trim()}
            className="px-4 rounded-xl transition-all active:scale-95 disabled:opacity-30"
            style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.15)" }}
          >
            <Plus className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      )}

      {/* Reflection Panel */}
      {decision.status === "decided" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 rounded-2xl"
          style={{ background: "rgba(168,85,247,0.04)", border: "1px solid rgba(168,85,247,0.15)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4 text-violet-400" />
            <p className="text-xs font-black text-violet-300">كبسولة الزمن: تأمل قرارك</p>
          </div>
          <p className="text-[10px] text-violet-200/60 mb-3 leading-relaxed">
            لقد اتخذت قرارك. بعد مرور الوقت، هل كان هذا القرار هو الصواب؟ ماذا تعلمت؟ اكتب لنسختك المستقبلية.
          </p>
          <textarea
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            placeholder="اكتب تأملك الصادق هنا..."
            rows={3}
            className="w-full p-3 rounded-xl text-xs text-white placeholder:text-violet-400/30 outline-none resize-none mb-3"
            style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.1)" }}
          />
          <button
            onClick={() => {
              if (reflectionText.trim()) addReflection(decision.id, reflectionText.trim());
            }}
            disabled={!reflectionText.trim()}
            className="w-full py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-30"
            style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.25)", color: "#c4b5fd" }}
          >
            حفظ التأمل
          </button>
        </motion.div>
      )}

      {/* Show reflection if already reflected */}
      {decision.status === "reflected" && decision.reflectionNote && (
        <motion.div className="mt-4 p-4 rounded-2xl"
          style={{ background: "rgba(168,85,247,0.08)", border: "1px dashed rgba(168,85,247,0.3)" }}
        >
          <p className="text-[10px] text-violet-400 font-bold mb-2">تأملك الزمني:</p>
          <p className="text-xs text-violet-100 leading-relaxed italic border-r-2 border-violet-500/50 pr-3">
            {decision.reflectionNote}
          </p>
        </motion.div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════ */
/*              MAIN COMPONENT                */
/* ═══════════════════════════════════════════ */

export const BawsalaScreen: FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("compass");
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);

  const { decisions, values, addValue, removeValue } = useBawsalaState();
  const [newValueLabel, setNewValueLabel] = useState("");
  const [newValueEmoji, setNewValueEmoji] = useState("⭐");

  const activeDecisions = useMemo(() => decisions.filter((d) => d.status === "active"), [decisions]);
  const pastDecisions = useMemo(() => decisions.filter((d) => d.status !== "active"), [decisions]);

  const selectedDecision = useMemo(
    () => decisions.find((d) => d.id === selectedDecisionId) ?? null,
    [decisions, selectedDecisionId]
  );

  const handleAddValue = useCallback(() => {
    if (!newValueLabel.trim()) return;
    addValue({ label: newValueLabel.trim(), emoji: newValueEmoji, weight: 3 });
    setNewValueLabel("");
    setNewValueEmoji("⭐");
  }, [newValueLabel, newValueEmoji, addValue]);

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="min-h-screen pb-32 select-none relative overflow-hidden" dir="rtl"
      style={{ background: "#020617" }}
    >
      {/* Sovereign Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-900/10 blur-[120px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] rounded-full bg-indigo-900/10 blur-[100px]" />
      </div>

      <BroadcastOverlay active={activeTab === "compass"} />
      {/* ═══ Header ═══ */}
      <motion.div initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-12 pb-6 flex flex-col items-center">
        <div className="flex flex-col items-center gap-4 mb-6">
          <motion.div 
            whileHover={{ rotate: 360 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="w-16 h-16 rounded-[2rem] flex items-center justify-center relative"
            style={{ 
              background: "rgba(6,182,212,0.12)", 
              border: "1px solid rgba(6,182,212,0.25)",
              boxShadow: "0 0 40px rgba(6,182,212,0.15)"
            }}
          >
            <Compass className="w-8 h-8 text-cyan-400" />
            <motion.div 
              className="absolute inset-0 bg-cyan-400/20 blur-2xl rounded-full -z-10"
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </motion.div>
          <div className="text-center">
            <h1 className="text-3xl font-black text-white tracking-tighter leading-tight">بوصلة القرارات</h1>
            <p className="text-xs text-cyan-400/60 font-bold uppercase tracking-[0.2em] mt-2">The Sovereign Compass</p>
          </div>
        </div>

        <button onClick={() => { setShowNewForm(true); setSelectedDecisionId(null); setActiveTab("compass"); }}
          className="group relative flex items-center gap-2 px-8 py-3 rounded-2xl bg-cyan-600/10 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all text-cyan-400 font-black overflow-hidden"
        >
          <div className="absolute inset-0 bg-cyan-400/5 translate-y-full group-hover:translate-y-0 transition-transform" />
          <Plus className="w-4 h-4 relative z-10" />
          <span className="text-sm relative z-10">تحليل قرار جديد</span>
        </button>
      </motion.div>

      {/* Tabs */}
      <div className="px-5 mb-8">
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSelectedDecisionId(null); }}
              className="flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              style={{
                background: activeTab === tab.id ? "rgba(6,182,212,0.12)" : "transparent",
                color: activeTab === tab.id ? "#06b6d4" : "rgba(148,163,184,0.4)",
                border: activeTab === tab.id ? "1px solid rgba(6,182,212,0.2)" : "1px solid transparent",
              }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ New Decision Form ═══ */}
      <AnimatePresence>
        {showNewForm && activeTab === "compass" && (
          <NewDecisionForm onClose={() => setShowNewForm(false)} />
        )}
      </AnimatePresence>

      {/* ═══ TAB: Compass ═══ */}
      {activeTab === "compass" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {selectedDecision ? (
            <>
              <button onClick={() => setSelectedDecisionId(null)}
                className="mx-5 mb-3 text-[10px] text-cyan-400/60 font-bold flex items-center gap-1"
              >
                <ChevronRight className="w-3 h-3 rotate-180" /> كل القرارات
              </button>
              <ActiveDecision decision={selectedDecision} values={values} />
            </>
          ) : (
            <div className="px-5 space-y-3">
              {activeDecisions.length === 0 && !showNewForm ? (
                <motion.div variants={itemVariants} initial="hidden" animate="visible"
                  className="py-16 text-center space-y-3"
                >
                  <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
                    style={{ background: "rgba(6,182,212,0.06)" }}
                  >
                    <Compass className="w-8 h-8 text-cyan-400/20" />
                  </div>
                  <p className="text-xs text-slate-500 font-bold">البوصلة جاهزة</p>
                  <p className="text-[10px] text-slate-600 max-w-xs mx-auto">
                    عندك قرار صعب؟ أضفه هنا — البوصلة هتساعدك تحلّله من كل الزوايا
                  </p>
                  <button onClick={() => setShowNewForm(true)}
                    className="mt-2 px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all active:scale-95"
                    style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", color: "#06b6d4" }}
                  >
                    <Plus className="w-3.5 h-3.5" /> قرار جديد
                  </button>
                </motion.div>
              ) : (
                activeDecisions.map((d) => (
                  <motion.button key={d.id} variants={itemVariants} initial="hidden" animate="visible"
                    onClick={() => setSelectedDecisionId(d.id)}
                    className="w-full p-4 rounded-2xl text-right flex items-center gap-3 transition-all active:scale-98"
                    style={{ background: "rgba(6,182,212,0.04)", border: "1px solid rgba(6,182,212,0.08)" }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "rgba(6,182,212,0.08)" }}
                    >
                      <Scale className="w-5 h-5 text-cyan-400/60" />
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-sm font-bold text-white truncate">{d.question}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{d.options.length} خيارات · قيد التفكير</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 rotate-180 shrink-0" />
                  </motion.button>
                ))
              )}
            </div>
          )}
          
          {/* Shadow Glow for Selected Decision */}
          {selectedDecision && (
            <div className="absolute inset-0 pointer-events-none z-[-1]">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/5 blur-[80px] rounded-full" />
            </div>
          )}
        </motion.div>
      )}

      {/* ═══ TAB: Decision Log ═══ */}
      {activeTab === "log" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-3">
          {pastDecisions.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Clock className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-500 font-bold">لسه ما اتخذت قرارات</p>
              <p className="text-[10px] text-slate-600">لمّا تاخد قرار — هيظهر هنا مع تقييمك</p>
            </div>
          ) : (
            pastDecisions.map((d) => (
              <motion.button key={d.id} variants={itemVariants} initial="hidden" animate="visible"
                onClick={() => { setSelectedDecisionId(d.id); setActiveTab("compass"); }}
                className="w-full p-4 rounded-2xl text-right flex items-center gap-3"
                style={{
                  background: d.status === "reflected" ? "rgba(168,85,247,0.04)" : "rgba(16,185,129,0.04)",
                  border: `1px solid ${d.status === "reflected" ? "rgba(168,85,247,0.08)" : "rgba(16,185,129,0.08)"}`,
                }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: d.status === "reflected" ? "rgba(168,85,247,0.08)" : "rgba(16,185,129,0.08)" }}
                >
                  {d.status === "reflected" ? <Eye className="w-5 h-5 text-violet-400/60" /> : <Check className="w-5 h-5 text-emerald-400/60" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{d.question}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    اختار: {d.options.find((o) => o.id === d.chosenOptionId)?.label ?? "—"}
                    {d.decidedAt && ` · ${new Date(d.decidedAt).toLocaleDateString("ar-EG")}`}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 rotate-180 shrink-0" />
              </motion.button>
            ))
          )}
        </motion.div>
      )}

      {/* ═══ TAB: My Values ═══ */}
      {activeTab === "values" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-4">
          <p className="text-[10px] text-slate-500 font-bold">
            قيمك هي البوصلة الداخلية — كل قرار بيتقاس على أساسها
          </p>

          {/* Values List */}
          <div className="space-y-2">
            {values.map((v) => (
              <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "rgba(236,72,153,0.04)", border: "1px solid rgba(236,72,153,0.08)" }}
              >
                <span className="text-lg">{v.emoji}</span>
                <p className="text-sm font-bold text-white flex-1">{v.label}</p>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < v.weight ? "text-amber-400 fill-amber-400" : "text-slate-700"}`} />
                  ))}
                </div>
                <button onClick={() => removeValue(v.id)} className="p-1 opacity-30 hover:opacity-60">
                  <Trash2 className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Value */}
          <div className="p-4 rounded-2xl space-y-3"
            style={{ background: "rgba(236,72,153,0.03)", border: "1px solid rgba(236,72,153,0.08)" }}
          >
            <p className="text-[10px] text-pink-400/60 font-bold">أضف قيمة جديدة</p>
            <div className="flex gap-2">
              <select value={newValueEmoji} onChange={(e) => setNewValueEmoji(e.target.value)}
                className="w-12 text-center py-2 rounded-lg text-lg bg-transparent outline-none"
                style={{ border: "1px solid rgba(255,255,255,0.06)" }}
              >
                {["⭐", "💎", "🕊️", "🦅", "💚", "🔥", "🌱", "🎯", "👑", "🏔️", "🛡️", "🤝"].map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
              <input value={newValueLabel} onChange={(e) => setNewValueLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddValue()}
                placeholder="مثلاً: الحرية"
                className="flex-1 px-3 py-2 rounded-lg text-xs text-white placeholder:text-slate-600 outline-none"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              />
              <button onClick={handleAddValue} disabled={!newValueLabel.trim()}
                className="px-3 rounded-lg transition-all active:scale-95 disabled:opacity-30"
                style={{ background: "rgba(236,72,153,0.1)", border: "1px solid rgba(236,72,153,0.15)" }}
              >
                <Plus className="w-4 h-4 text-pink-400" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ Footer ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="mx-5 mt-8 p-4 rounded-2xl text-center"
        style={{ background: "rgba(6,182,212,0.03)", border: "1px solid rgba(6,182,212,0.06)" }}
      >
        <Compass className="w-5 h-5 text-cyan-400/20 mx-auto mb-2" />
        <p className="text-[10px] text-slate-600 leading-relaxed max-w-xs mx-auto">
          البوصلة مش بتقرر عنك — بتساعدك تشوف كل الزوايا بوضوح.
          <br />
          القرار في الآخر — دايماً بتاعك.
        </p>
      </motion.div>
    </div>
  );
};

export default BawsalaScreen;
