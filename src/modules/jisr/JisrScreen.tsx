/**
 * جسر — Jisr Screen
 * Relationship Repair: حدّد → عبّر → افعل
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useJisrState,
  FRACTURE_META,
  RELATION_META,
  type FractureType,
  type RelationKind,
  type RepairPhase,
} from "./store/jisr.store";
import {
  Heart,
  ChevronLeft,
  Check,
  Plus,
  History,
  Calendar,
  Target,
  MessageCircle,
  Handshake,
} from "lucide-react";

/* ═══════════════════════════════════════════ */
/*            HELPERS                         */
/* ═══════════════════════════════════════════ */

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString("ar-EG", { month: "short", day: "numeric" });
}

/* ═══════════════════════════════════════════ */
/*        PHASE PROGRESS BAR                  */
/* ═══════════════════════════════════════════ */

function PhaseProgress({ current }: { current: RepairPhase }) {
  const phases: { id: RepairPhase; label: string; emoji: string; color: string }[] = [
    { id: "identify", label: "حدّد", emoji: "🔍", color: "#ef4444" },
    { id: "express", label: "عبّر", emoji: "💬", color: "#8b5cf6" },
    { id: "act", label: "افعل", emoji: "🌉", color: "#10b981" },
  ];
  const idx = phases.findIndex((p) => p.id === current);

  return (
    <div className="flex items-center gap-2 px-5 mb-6">
      {phases.map((p, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <React.Fragment key={p.id}>
            <div className="flex items-center gap-1.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  background: done ? `${p.color}20` : active ? `${p.color}15` : "rgba(30,41,59,0.4)",
                  border: `2px solid ${done || active ? p.color : "rgba(51,65,85,0.3)"}`,
                  color: done || active ? p.color : "#64748b",
                }}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : p.emoji}
              </div>
              <span className="text-[10px] font-bold hidden sm:block" style={{ color: active ? p.color : "#64748b" }}>
                {p.label}
              </span>
            </div>
            {i < phases.length - 1 && (
              <div className="flex-1 h-0.5 rounded-full" style={{ background: done ? p.color : "rgba(51,65,85,0.3)" }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/*        PHASE 1: IDENTIFY                   */
/* ═══════════════════════════════════════════ */

function IdentifyPhase() {
  const { setIdentify } = useJisrState();
  const [name, setName] = useState("");
  const [relation, setRelation] = useState<RelationKind>("friend");
  const [fracture, setFracture] = useState<FractureType>("distance");
  const [whatHappened, setWhatHappened] = useState("");
  const [myRole, setMyRole] = useState("");

  const handleNext = () => {
    if (!name.trim() || !whatHappened.trim()) return;
    setIdentify({ personName: name.trim(), relationKind: relation, fractureType: fracture, whatHappened: whatHappened.trim(), myRole: myRole.trim() });
  };

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="px-5 space-y-4">
      <div className="text-center mb-2">
        <span className="text-3xl block mb-2">🔍</span>
        <h2 className="text-lg font-black text-white">حدّد الكسر</h2>
        <p className="text-[10px] text-slate-500 mt-1">مع مَن؟ وماذا حدث؟</p>
      </div>

      {/* Person name */}
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="اسم الشخص..."
        className="w-full bg-slate-800/40 border border-slate-700/40 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-red-500/50"
        dir="rtl"
      />

      {/* Relation kind */}
      <div>
        <label className="text-[10px] text-slate-500 font-bold mb-2 block">نوع العلاقة</label>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(RELATION_META) as RelationKind[]).map((r) => {
            const m = RELATION_META[r];
            const active = relation === r;
            return (
              <button key={r} onClick={() => setRelation(r)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-all"
                style={{
                  background: active ? `${m.color}20` : "rgba(30,41,59,0.4)",
                  border: `1px solid ${active ? m.color : "rgba(51,65,85,0.3)"}`,
                  color: active ? m.color : "#94a3b8",
                }}>
                <span>{m.emoji}</span><span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fracture type */}
      <div>
        <label className="text-[10px] text-slate-500 font-bold mb-2 block">نوع الكسر</label>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(FRACTURE_META) as FractureType[]).map((f) => {
            const m = FRACTURE_META[f];
            const active = fracture === f;
            return (
              <button key={f} onClick={() => setFracture(f)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-all"
                style={{
                  background: active ? `${m.color}20` : "rgba(30,41,59,0.4)",
                  border: `1px solid ${active ? m.color : "rgba(51,65,85,0.3)"}`,
                  color: active ? m.color : "#94a3b8",
                }}>
                <span>{m.emoji}</span><span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* What happened */}
      <textarea
        value={whatHappened}
        onChange={(e) => setWhatHappened(e.target.value)}
        placeholder="ماذا حدث بالضبط؟"
        rows={3}
        className="w-full bg-slate-800/40 border border-slate-700/40 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-red-500/50 resize-none"
        dir="rtl"
      />

      {/* My role */}
      <textarea
        value={myRole}
        onChange={(e) => setMyRole(e.target.value)}
        placeholder="ما دوري في هذا؟ (اختياري — لكن الصدق يبني الجسر)"
        rows={2}
        className="w-full bg-slate-800/40 border border-slate-700/40 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-slate-600/50 resize-none"
        dir="rtl"
      />

      <motion.button whileTap={{ scale: 0.97 }} onClick={handleNext}
        disabled={!name.trim() || !whatHappened.trim()}
        className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-30 transition-all"
        style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(220,38,38,0.05))", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
        حدّدت الكسر — التالي <ChevronLeft className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*        PHASE 2: EXPRESS                    */
/* ═══════════════════════════════════════════ */

function ExpressPhase() {
  const { activeBridge, setExpress } = useJisrState();
  const [say, setSay] = useState("");
  const [need, setNeed] = useState("");

  const handleNext = () => {
    if (!say.trim()) return;
    setExpress(say.trim(), need.trim());
  };

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="px-5 space-y-4">
      <div className="text-center mb-2">
        <span className="text-3xl block mb-2">💬</span>
        <h2 className="text-lg font-black text-white">عبّر</h2>
        <p className="text-[10px] text-slate-500 mt-1">
          لو {activeBridge?.personName || "هذا الشخص"} أمامك الآن — ماذا ستقول؟
        </p>
      </div>

      <textarea
        value={say}
        onChange={(e) => setSay(e.target.value)}
        placeholder="أريد أن أقول لك..."
        rows={5}
        className="w-full bg-slate-800/40 border border-slate-700/40 rounded-2xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-violet-500/50 resize-none leading-relaxed"
        dir="rtl"
      />

      <textarea
        value={need}
        onChange={(e) => setNeed(e.target.value)}
        placeholder="ما الذي أحتاجه من هذه العلاقة؟ (اختياري)"
        rows={2}
        className="w-full bg-slate-800/40 border border-slate-700/40 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-violet-500/30 resize-none"
        dir="rtl"
      />

      <motion.button whileTap={{ scale: 0.97 }} onClick={handleNext}
        disabled={!say.trim()}
        className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-30 transition-all"
        style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(99,102,241,0.05))", border: "1px solid rgba(139,92,246,0.25)", color: "#a78bfa" }}>
        عبّرت — التالي <ChevronLeft className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*        PHASE 3: ACT                        */
/* ═══════════════════════════════════════════ */

function ActPhase({ onComplete }: { onComplete: () => void }) {
  const { activeBridge, setAct, completeBridge } = useJisrState();
  const [action, setAction] = useState("");
  const [deadline, setDeadline] = useState("");
  const [building, setBuilding] = useState(false);

  const handleBuild = () => {
    if (!action.trim()) return;
    setAct(action.trim(), deadline);
    setBuilding(true);

    setTimeout(() => {
      completeBridge();
      onComplete();
    }, 2500);
  };

  if (building) {
    return (
      <motion.div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-8">
        {/* Bridge building animation */}
        <div className="relative w-48 h-2">
          <div className="absolute inset-0 rounded-full bg-slate-800" />
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: "linear-gradient(90deg, #10b981, #06b6d4)" }}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
          <Handshake className="w-14 h-14 text-emerald-400" />
        </motion.div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          className="text-emerald-300 font-black text-lg text-center">
          الجسر يُبنى 🌉
        </motion.p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
          className="text-slate-500 text-xs text-center">
          خطوة واحدة واعية تكفي لبدء الإصلاح
        </motion.p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="px-5 space-y-4">
      <div className="text-center mb-2">
        <span className="text-3xl block mb-2">🌉</span>
        <h2 className="text-lg font-black text-white">افعل</h2>
        <p className="text-[10px] text-slate-500 mt-1">خطوة واحدة ملموسة لبناء الجسر مع {activeBridge?.personName}</p>
      </div>

      <textarea
        value={action}
        onChange={(e) => setAction(e.target.value)}
        placeholder="الخطوة الأولى: مثلاً 'أرسل رسالة اعتذار' أو 'أتصل وأسأل عن حاله'"
        rows={3}
        className="w-full bg-slate-800/40 border border-slate-700/40 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 resize-none"
        dir="rtl"
      />

      <div>
        <label className="text-[10px] text-slate-500 font-bold mb-2 block">
          <Calendar className="w-3 h-3 inline ml-1" />
          متى ستفعلها؟ (اختياري)
        </label>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="w-full bg-slate-800/40 border border-slate-700/40 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50"
        />
      </div>

      <motion.button whileTap={{ scale: 0.97 }} onClick={handleBuild}
        disabled={!action.trim()}
        className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-30 transition-all"
        style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(6,182,212,0.06))", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981" }}>
        <Handshake className="w-4 h-4" />
        ابنِ الجسر
      </motion.button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*         BRIDGE CARD                        */
/* ═══════════════════════════════════════════ */

function BridgeCard({ bridge, onMarkDone }: {
  bridge: ReturnType<typeof useJisrState.getState>["bridges"][0];
  onMarkDone?: () => void;
}) {
  const fractureMeta = FRACTURE_META[bridge.fractureType];
  const relationMeta = RELATION_META[bridge.relationKind];

  return (
    <div
      className="rounded-xl p-3.5 space-y-2"
      style={{
        background: bridge.isComplete ? "rgba(16,185,129,0.05)" : "rgba(15,23,42,0.6)",
        border: `1px solid ${bridge.isComplete ? "rgba(16,185,129,0.2)" : "rgba(51,65,85,0.3)"}`,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">{relationMeta.emoji}</span>
          <span className="text-xs font-bold text-white">{bridge.personName}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${fractureMeta.color}15`, color: fractureMeta.color }}>
            {fractureMeta.emoji} {fractureMeta.label}
          </span>
        </div>
        <span className="text-[9px] text-slate-500">{fmtDate(bridge.createdAt)}</span>
      </div>

      <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">{bridge.whatHappened}</p>

      <div className="flex items-center gap-2 pt-1">
        <Target className="w-3 h-3 text-emerald-500/60" />
        <span className="text-[10px] text-slate-300 flex-1 truncate">{bridge.actionStep}</span>
        {!bridge.isComplete && onMarkDone && (
          <button
            onClick={onMarkDone}
            className="text-[9px] font-bold px-2 py-1 rounded-lg bg-emerald-900/20 border border-emerald-800/30 text-emerald-400"
          >
            <Check className="w-3 h-3 inline" /> أنجزت
          </button>
        )}
        {bridge.isComplete && (
          <span className="text-[9px] text-emerald-400 font-bold">✅ مكتمل</span>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/*           MAIN SCREEN                      */
/* ═══════════════════════════════════════════ */

export default function JisrScreen() {
  const {
    activeBridge,
    currentPhase,
    bridges,
    startBridge,
    cancelBridge,
    markDone,
    getActiveBridges,
    getCompletedBridges,
    getTotalCount,
    getCompletedCount,
  } = useJisrState();

  const [tab, setTab] = useState<"active" | "done">("active");
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markNote, setMarkNote] = useState("");

  const activeBridges = useMemo(() => getActiveBridges(), [bridges]);
  const completedBridges = useMemo(() => getCompletedBridges(), [bridges]);
  const total = useMemo(() => getTotalCount(), [bridges]);
  const doneCount = useMemo(() => getCompletedCount(), [bridges]);

  const isInPhase = !!activeBridge;

  const handleMarkDone = (id: string) => {
    markDone(id, markNote.trim());
    setMarkingId(null);
    setMarkNote("");
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans pb-32" dir="rtl">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[400px] h-[400px] rounded-full top-[-10%] left-[-5%]"
          style={{ background: "radial-gradient(circle, rgba(16,185,129,0.05), transparent 65%)" }} />
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 px-5 pt-14 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-900/15 border border-emerald-500/20">
              <Handshake className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">جسر</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">حدّد · عبّر · افعل</p>
            </div>
          </div>
          {!isInPhase && (
            <motion.button whileTap={{ scale: 0.9 }} onClick={startBridge}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-900/20 border border-emerald-500/30 text-emerald-400">
              <Plus className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="relative z-10 px-5 mb-5">
        <div className="flex gap-3">
          {[
            { label: "جسور", value: total, color: "#10b981" },
            { label: "مكتملة", value: doneCount, color: "#06b6d4" },
            { label: "نشطة", value: activeBridges.length, color: "#f59e0b" },
          ].map((s) => (
            <div key={s.label} className="flex-1 rounded-xl p-3 text-center"
              style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
              <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9px] text-slate-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isInPhase ? (
          <motion.div key="phases" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10">
            <PhaseProgress current={currentPhase} />
            <AnimatePresence mode="wait">
              {currentPhase === "identify" && <IdentifyPhase key="p1" />}
              {currentPhase === "express" && <ExpressPhase key="p2" />}
              {currentPhase === "act" && <ActPhase key="p3" onComplete={() => {}} />}
            </AnimatePresence>
            <button onClick={cancelBridge} className="mx-5 mt-4 text-[10px] text-slate-600 font-medium text-center block w-full">
              إلغاء
            </button>
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10">
            {/* Tabs */}
            <div className="px-5 mb-4">
              <div className="flex gap-1.5 p-1 rounded-xl bg-slate-900/60 border border-slate-800/50">
                {[
                  { id: "active" as const, label: "نشطة", count: activeBridges.length },
                  { id: "done" as const, label: "مكتملة", count: completedBridges.length },
                ].map((t) => (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className="flex-1 py-2 rounded-lg text-[11px] font-bold text-center transition-all"
                    style={{
                      background: tab === t.id ? "rgba(16,185,129,0.1)" : "transparent",
                      color: tab === t.id ? "#10b981" : "#64748b",
                      border: tab === t.id ? "1px solid rgba(16,185,129,0.2)" : "1px solid transparent",
                    }}>
                    {t.label} {t.count > 0 && <span className="mr-1 text-[9px]">({t.count})</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Bridge list */}
            <div className="px-5 space-y-3">
              {(tab === "active" ? activeBridges : completedBridges).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <Handshake className="w-12 h-12 text-slate-700" />
                  <p className="text-sm text-slate-600">{tab === "active" ? "لا توجد جسور نشطة" : "لا توجد جسور مكتملة"}</p>
                  {tab === "active" && (
                    <button onClick={startBridge} className="text-xs text-emerald-400 font-bold">🌉 ابنِ أول جسر</button>
                  )}
                </div>
              ) : (
                (tab === "active" ? activeBridges : completedBridges).map((b) => (
                  <BridgeCard key={b.id} bridge={b}
                    onMarkDone={!b.isComplete ? () => handleMarkDone(b.id) : undefined} />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="relative z-10 mx-5 mt-8 p-4 rounded-2xl text-center"
        style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(51,65,85,0.2)" }}>
        <p className="text-[10px] text-slate-600 leading-relaxed">
          🌉 الجسر يُبنى بخطوة واحدة واعية — حدّد الكسر، عبّر بصدق، وافعل شيئاً
        </p>
      </motion.div>
    </div>
  );
}
