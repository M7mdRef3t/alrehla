/**
 * ميثاق — Mithaq: عقد مع النفس
 *
 * التزم بوعد — وراقب نفسك:
 * - Create pledges with duration & success criteria
 * - Daily check-in (kept / broken)
 * - Progress ring + streak counter
 * - Completion badge & reflection
 * - Break acknowledgment with honesty
 * - Archive of all contracts
 */

import type { FC } from "react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScrollText, Plus, Check, X, Flame, Trophy,
  Heart, Clock, Target, ChevronDown,
} from "lucide-react";
import {
  useMithaqState,
  type PledgeCategory,
  type PledgeStatus,
  type Pledge,
} from "./store/mithaq.store";

/* ═══════════════════════════════════════════ */
/*               CONSTANTS                    */
/* ═══════════════════════════════════════════ */

type ViewMode = "active" | "archive" | "create";

const CATEGORY_META: Record<PledgeCategory, { label: string; emoji: string; color: string }> = {
  habit: { label: "عادة", emoji: "🔄", color: "#10b981" },
  mindset: { label: "عقلية", emoji: "🧠", color: "#8b5cf6" },
  relationship: { label: "علاقة", emoji: "💚", color: "#ec4899" },
  health: { label: "صحة", emoji: "💪", color: "#ef4444" },
  skill: { label: "مهارة", emoji: "⚡", color: "#f59e0b" },
  spiritual: { label: "روحاني", emoji: "🕊️", color: "#06b6d4" },
};

const STATUS_META: Record<PledgeStatus, { label: string; emoji: string; color: string }> = {
  active: { label: "نشط", emoji: "🔥", color: "#10b981" },
  completed: { label: "مُنجز", emoji: "🏆", color: "#fbbf24" },
  broken: { label: "مكسور", emoji: "💔", color: "#ef4444" },
  expired: { label: "انتهى", emoji: "⏰", color: "#64748b" },
};

const DURATION_OPTIONS = [
  { days: 7, label: "أسبوع" },
  { days: 14, label: "أسبوعين" },
  { days: 21, label: "21 يوم" },
  { days: 30, label: "شهر" },
  { days: 60, label: "شهرين" },
  { days: 90, label: "3 أشهر" },
];

/* ═══════════════════════════════════════════ */
/*           CREATE FORM                      */
/* ═══════════════════════════════════════════ */

const CreatePledgeForm: FC<{ onDone: () => void }> = ({ onDone }) => {
  const { addPledge } = useMithaqState();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<PledgeCategory>("habit");
  const [emoji, setEmoji] = useState("📜");
  const [criteria, setCriteria] = useState("");
  const [days, setDays] = useState(21);

  const handleSubmit = () => {
    if (!title.trim()) return;
    addPledge({
      title: title.trim(),
      description: description.trim(),
      category,
      emoji,
      successCriteria: criteria.trim() || "الالتزام اليومي",
      durationDays: days,
    });
    onDone();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-5 space-y-4">
      {/* Title */}
      <div>
        <label className="text-[9px] text-amber-400/50 font-bold block mb-1">عنوان الميثاق *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="مثال: أمشي 30 دقيقة كل يوم"
          className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 bg-white/[0.03] border border-white/[0.05] focus:border-amber-400/20 focus:outline-none"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-[9px] text-amber-400/50 font-bold block mb-1">لماذا هذا الميثاق؟</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="السبب العميق وراء هذا الالتزام..."
          rows={2}
          className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 bg-white/[0.03] border border-white/[0.05] focus:border-amber-400/20 focus:outline-none resize-none"
        />
      </div>

      {/* Category */}
      <div>
        <label className="text-[9px] text-amber-400/50 font-bold block mb-1.5">الفئة</label>
        <div className="flex gap-1.5 flex-wrap">
          {(Object.keys(CATEGORY_META) as PledgeCategory[]).map((cat) => {
            const meta = CATEGORY_META[cat];
            return (
              <button key={cat} onClick={() => { setCategory(cat); setEmoji(meta.emoji); }}
                className="px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all"
                style={{
                  background: category === cat ? `${meta.color}15` : "rgba(255,255,255,0.02)",
                  color: category === cat ? meta.color : "#475569",
                  border: `1px solid ${category === cat ? `${meta.color}25` : "rgba(255,255,255,0.03)"}`,
                }}
              >
                {meta.emoji} {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="text-[9px] text-amber-400/50 font-bold block mb-1.5">المدة</label>
        <div className="flex gap-1.5 flex-wrap">
          {DURATION_OPTIONS.map((opt) => (
            <button key={opt.days} onClick={() => setDays(opt.days)}
              className="px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all"
              style={{
                background: days === opt.days ? "rgba(251,191,36,0.12)" : "rgba(255,255,255,0.02)",
                color: days === opt.days ? "#fbbf24" : "#475569",
                border: `1px solid ${days === opt.days ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.03)"}`,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Success Criteria */}
      <div>
        <label className="text-[9px] text-amber-400/50 font-bold block mb-1">شروط النجاح</label>
        <input value={criteria} onChange={(e) => setCriteria(e.target.value)}
          placeholder="مثال: أسجل check-in كل يوم"
          className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 bg-white/[0.03] border border-white/[0.05] focus:border-amber-400/20 focus:outline-none"
        />
      </div>

      {/* Submit */}
      <button onClick={handleSubmit} disabled={!title.trim()}
        className="w-full py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-30"
        style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)" }}
      >
        📜 أُبرم الميثاق
      </button>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════ */
/*           PLEDGE CARD                      */
/* ═══════════════════════════════════════════ */

const PledgeCard: FC<{ pledge: Pledge; idx: number }> = ({ pledge, idx }) => {
  const { checkIn, completePledge, breakPledge, getStreakForPledge, getCompletionRate } = useMithaqState();
  const [expanded, setExpanded] = useState(false);
  const [checkInNote, setCheckInNote] = useState("");
  const [breakReason, setBreakReason] = useState("");
  const [reflection, setReflection] = useState("");
  const [showBreak, setShowBreak] = useState(false);
  const [showComplete, setShowComplete] = useState(false);

  const catMeta = CATEGORY_META[pledge.category];
  const streak = getStreakForPledge(pledge.id);
  const rate = getCompletionRate(pledge.id);
  const todayDone = pledge.checkIns.some((c) => {
    const d = new Date();
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return c.date === key;
  });

  // Days remaining
  const daysLeft = Math.max(0, Math.ceil((pledge.endDate - Date.now()) / 86400000));
  const totalDays = pledge.durationDays;
  const progressPct = Math.min(100, Math.round(((totalDays - daysLeft) / totalDays) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: `${catMeta.color}03`, border: `1px solid ${catMeta.color}08` }}
    >
      {/* Header */}
      <button onClick={() => setExpanded(!expanded)} className="w-full p-4 flex items-center gap-3 text-right">
        <span className="text-xl">{pledge.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-white">{pledge.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[8px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${catMeta.color}10`, color: catMeta.color }}
            >
              {catMeta.emoji} {catMeta.label}
            </span>
            {pledge.status === "active" && (
              <span className="text-[8px] text-slate-500">{daysLeft} يوم متبقي</span>
            )}
            {pledge.status !== "active" && (
              <span className="text-[8px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${STATUS_META[pledge.status].color}10`, color: STATUS_META[pledge.status].color }}
              >
                {STATUS_META[pledge.status].emoji} {STATUS_META[pledge.status].label}
              </span>
            )}
          </div>
        </div>

        {/* Progress Ring */}
        <div className="w-11 h-11 relative shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx={50} cy={50} r={38} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={5} />
            <motion.circle cx={50} cy={50} r={38} fill="none" stroke={catMeta.color}
              strokeWidth={5} strokeLinecap="round"
              strokeDasharray={`${(progressPct / 100) * 239} 239`}
              initial={{ strokeDasharray: "0 239" }}
              animate={{ strokeDasharray: `${(progressPct / 100) * 239} 239` }}
              transition={{ duration: 0.8 }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[9px] font-black" style={{ color: catMeta.color }}>{progressPct}%</span>
          </div>
        </div>

        <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "streak", value: streak, emoji: "🔥", color: "#fbbf24" },
                  { label: "نسبة الالتزام", value: `${rate}%`, emoji: "📊", color: catMeta.color },
                  { label: "check-ins", value: pledge.checkIns.length, emoji: "✅", color: "#10b981" },
                ].map((s) => (
                  <div key={s.label} className="p-2 rounded-lg text-center"
                    style={{ background: `${s.color}04`, border: `1px solid ${s.color}08` }}
                  >
                    <span className="text-xs">{s.emoji}</span>
                    <p className="text-sm font-black text-white">{s.value}</p>
                    <p className="text-[7px] text-slate-500 font-bold">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Description */}
              {pledge.description && (
                <p className="text-[10px] text-slate-500 leading-relaxed p-3 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                >
                  {pledge.description}
                </p>
              )}

              {/* Success Criteria */}
              <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                <Target className="w-3 h-3 text-amber-400/40" />
                <p className="text-[9px] text-slate-500"><span className="text-amber-400/60">شرط النجاح:</span> {pledge.successCriteria}</p>
              </div>

              {/* Active: Check-in / Complete / Break */}
              {pledge.status === "active" && (
                <>
                  {/* Daily Check-in */}
                  {!todayDone ? (
                    <div className="space-y-2">
                      <input value={checkInNote} onChange={(e) => setCheckInNote(e.target.value)}
                        placeholder="ملاحظة اليوم (اختياري)..."
                        className="w-full px-3 py-2 rounded-lg text-[10px] text-white placeholder-slate-600 bg-white/[0.03] border border-white/[0.04] focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => { checkIn(pledge.id, true, checkInNote); setCheckInNote(""); }}
                          className="flex-1 py-2.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"
                          style={{ background: "rgba(16,185,129,0.1)", color: "#34d399", border: "1px solid rgba(16,185,129,0.15)" }}
                        >
                          <Check className="w-3.5 h-3.5" /> التزمت اليوم ✅
                        </button>
                        <button onClick={() => { checkIn(pledge.id, false, checkInNote); setCheckInNote(""); }}
                          className="flex-1 py-2.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"
                          style={{ background: "rgba(239,68,68,0.06)", color: "#f87171", border: "1px solid rgba(239,68,68,0.1)" }}
                        >
                          <X className="w-3.5 h-3.5" /> لم ألتزم
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 text-center text-[10px] text-emerald-400/60 font-bold">
                      ✅ تم تسجيل check-in اليوم
                    </div>
                  )}

                  {/* Complete / Break buttons */}
                  <div className="flex gap-2">
                    <button onClick={() => setShowComplete(!showComplete)}
                      className="flex-1 py-2 rounded-lg text-[9px] font-bold"
                      style={{ background: "rgba(251,191,36,0.06)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.1)" }}
                    >🏆 أكملت الميثاق</button>
                    <button onClick={() => setShowBreak(!showBreak)}
                      className="flex-1 py-2 rounded-lg text-[9px] font-bold"
                      style={{ background: "rgba(239,68,68,0.04)", color: "#f87171", border: "1px solid rgba(239,68,68,0.06)" }}
                    >💔 أكسر الميثاق</button>
                  </div>

                  {showComplete && (
                    <div className="space-y-2">
                      <textarea value={reflection} onChange={(e) => setReflection(e.target.value)}
                        placeholder="تأمل ختامي — ماذا تعلمت من هذا الميثاق؟"
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg text-[10px] text-white placeholder-slate-600 bg-white/[0.03] border border-white/[0.04] resize-none focus:outline-none"
                      />
                      <button onClick={() => { completePledge(pledge.id, reflection); setShowComplete(false); }}
                        className="w-full py-2 rounded-lg text-[10px] font-bold"
                        style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24" }}
                      >🏆 تأكيد الإنجاز</button>
                    </div>
                  )}

                  {showBreak && (
                    <div className="space-y-2">
                      <textarea value={breakReason} onChange={(e) => setBreakReason(e.target.value)}
                        placeholder="ما الذي حصل؟ كن صادقاً مع نفسك..."
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg text-[10px] text-white placeholder-slate-600 bg-white/[0.03] border border-white/[0.04] resize-none focus:outline-none"
                      />
                      <button onClick={() => { breakPledge(pledge.id, breakReason); setShowBreak(false); }}
                        className="w-full py-2 rounded-lg text-[10px] font-bold"
                        style={{ background: "rgba(239,68,68,0.08)", color: "#f87171" }}
                      >💔 تأكيد الكسر — بصدق</button>
                    </div>
                  )}
                </>
              )}

              {/* Completed: Show reflection */}
              {pledge.status === "completed" && pledge.reflection && (
                <div className="p-3 rounded-lg" style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.08)" }}>
                  <p className="text-[9px] text-amber-400/50 font-bold mb-1">🏆 تأمل الإنجاز</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{pledge.reflection}</p>
                </div>
              )}

              {/* Broken: Show reason */}
              {pledge.status === "broken" && pledge.breakReason && (
                <div className="p-3 rounded-lg" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.08)" }}>
                  <p className="text-[9px] text-red-400/50 font-bold mb-1">💔 سبب الكسر</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{pledge.breakReason}</p>
                </div>
              )}

              {/* Recent Check-ins */}
              {pledge.checkIns.length > 0 && (
                <div>
                  <p className="text-[8px] text-slate-600 font-bold mb-1.5">آخر check-ins</p>
                  <div className="flex flex-wrap gap-1">
                    {pledge.checkIns.slice(-14).map((ci) => (
                      <div key={ci.id} className="w-5 h-5 rounded flex items-center justify-center text-[8px]"
                        style={{
                          background: ci.kept ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.1)",
                          color: ci.kept ? "#34d399" : "#f87171",
                        }}
                        title={`${ci.date}: ${ci.kept ? "✅" : "❌"} ${ci.note}`}
                      >
                        {ci.kept ? "✓" : "✗"}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════ */
/*              MAIN COMPONENT                */
/* ═══════════════════════════════════════════ */

export const MithaqScreen: FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("active");
  const { pledges, getActivePledges, getCompletedPledges } = useMithaqState();

  const activePledges = useMemo(() => getActivePledges(), [pledges]);
  const completedPledges = useMemo(() => getCompletedPledges(), [pledges]);
  const brokenPledges = useMemo(() => pledges.filter((p) => p.status === "broken"), [pledges]);

  // Stats
  const totalKept = pledges.reduce((sum, p) => sum + p.checkIns.filter((c) => c.kept).length, 0);
  const totalCheckIns = pledges.reduce((sum, p) => sum + p.checkIns.length, 0);
  const overallRate = totalCheckIns > 0 ? Math.round((totalKept / totalCheckIns) * 100) : 0;

  return (
    <div className="min-h-screen pb-32 select-none" dir="rtl"
      style={{ background: "linear-gradient(180deg, #0c0810 0%, #140e1c 40%, #0c0812 100%)" }}
    >
      {/* ═══ Header ═══ */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)" }}
            >
              <ScrollText className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">ميثاق</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">عقد مع النفس</p>
            </div>
          </div>

          {/* Overall Rate */}
          <div className="w-14 h-14 relative">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx={50} cy={50} r={40} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={5} />
              <motion.circle cx={50} cy={50} r={40} fill="none" stroke="#fbbf24"
                strokeWidth={5} strokeLinecap="round"
                strokeDasharray={`${(overallRate / 100) * 251} 251`}
                initial={{ strokeDasharray: "0 251" }}
                animate={{ strokeDasharray: `${(overallRate / 100) * 251} 251` }}
                transition={{ duration: 1.2 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-black text-amber-400">{overallRate}%</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-2 mb-4">
          {[
            { label: "نشط", value: activePledges.length, emoji: "🔥", color: "#10b981" },
            { label: "مُنجز", value: completedPledges.length, emoji: "🏆", color: "#fbbf24" },
            { label: "مكسور", value: brokenPledges.length, emoji: "💔", color: "#ef4444" },
            { label: "التزام", value: `${overallRate}%`, emoji: "📊", color: "#8b5cf6" },
          ].map((s) => (
            <div key={s.label} className="flex-1 p-2 rounded-xl text-center"
              style={{ background: `${s.color}06`, border: `1px solid ${s.color}10` }}
            >
              <span className="text-xs">{s.emoji}</span>
              <p className="text-sm font-black text-white mt-0.5">{s.value}</p>
              <p className="text-[7px] text-slate-500 font-bold">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5">
          {([
            { key: "active", label: "النشطة", icon: "🔥" },
            { key: "archive", label: "الأرشيف", icon: "📚" },
            { key: "create", label: "ميثاق جديد", icon: "✍️" },
          ] as const).map((tab) => (
            <button key={tab.key} onClick={() => setViewMode(tab.key)}
              className="flex-1 py-2 rounded-lg text-[10px] font-bold transition-all"
              style={{
                background: viewMode === tab.key ? "rgba(251,191,36,0.1)" : "rgba(255,255,255,0.02)",
                color: viewMode === tab.key ? "#fbbf24" : "#475569",
                border: `1px solid ${viewMode === tab.key ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.03)"}`,
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ═══ Active View ═══ */}
      {viewMode === "active" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-3">
          {activePledges.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <ScrollText className="w-10 h-10 text-amber-400/10 mx-auto" />
              <p className="text-sm text-slate-500 font-bold">لا يوجد مواثيق نشطة</p>
              <p className="text-xs text-slate-600">ابدأ بميثاق جديد — عقد بينك وبين نفسك.</p>
              <button onClick={() => setViewMode("create")}
                className="px-5 py-2 rounded-xl text-[10px] font-bold mx-auto"
                style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.15)" }}
              >
                <Plus className="w-3 h-3 inline mr-1" /> أبرم ميثاقاً
              </button>
            </div>
          ) : (
            activePledges.map((p, idx) => <PledgeCard key={p.id} pledge={p} idx={idx} />)
          )}
        </motion.div>
      )}

      {/* ═══ Archive View ═══ */}
      {viewMode === "archive" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-3">
          {[...completedPledges, ...brokenPledges].length === 0 ? (
            <div className="py-16 text-center">
              <Trophy className="w-8 h-8 text-amber-400/10 mx-auto mb-2" />
              <p className="text-xs text-slate-600">الأرشيف فارغ — أكمل أول ميثاق ليظهر هنا</p>
            </div>
          ) : (
            [...completedPledges, ...brokenPledges].map((p, idx) => (
              <PledgeCard key={p.id} pledge={p} idx={idx} />
            ))
          )}
        </motion.div>
      )}

      {/* ═══ Create View ═══ */}
      {viewMode === "create" && (
        <CreatePledgeForm onDone={() => setViewMode("active")} />
      )}

      {/* ═══ Footer ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="mx-5 mt-8 p-4 rounded-2xl text-center"
        style={{ background: "rgba(251,191,36,0.03)", border: "1px solid rgba(251,191,36,0.06)" }}
      >
        <ScrollText className="w-5 h-5 text-amber-400/20 mx-auto mb-2" />
        <p className="text-[10px] text-slate-600 leading-relaxed max-w-xs mx-auto">
          الميثاق عقد بينك وبين نفسك.
          <br />
          لا رقيب إلا ضميرك — ولا جائزة أعظم من الوفاء.
        </p>
      </motion.div>
    </div>
  );
};

export default MithaqScreen;
