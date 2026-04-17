/**
 * ورشة — Warsha Screen
 * 7-Day Micro-Challenges: browse, start, check in, earn badges
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useWarshaState,
  CATEGORY_META,
  CHALLENGE_TEMPLATES,
  type ChallengeTemplate,
  type ActiveChallenge,
} from "./store/warsha.store";
import {
  Flame,
  Check,
  Trophy,
  ChevronLeft,
  Play,
  X,
} from "lucide-react";

/* ═══════════════════════════════════════════ */
/*       CHALLENGE BROWSE CARD                */
/* ═══════════════════════════════════════════ */

function BrowseCard({ tpl, isStarted, progress, onStart, onOpen }: {
  tpl: ChallengeTemplate;
  isStarted: boolean;
  progress: number;
  onStart: () => void;
  onOpen: () => void;
}) {
  const catMeta = CATEGORY_META[tpl.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 relative overflow-hidden"
      style={{ background: `${tpl.color}08`, border: `1px solid ${tpl.color}20` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{tpl.emoji}</span>
          <div>
            <h3 className="text-sm font-black text-white">{tpl.title}</h3>
            <p className="text-[10px] text-slate-500">{tpl.subtitle}</p>
          </div>
        </div>
        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
          style={{ background: `${catMeta.color}15`, color: catMeta.color }}>
          {catMeta.emoji} {catMeta.label}
        </span>
      </div>

      {isStarted ? (
        <div>
          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full bg-slate-800 mb-2 overflow-hidden">
            <motion.div className="h-full rounded-full" style={{ background: tpl.color }}
              initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-slate-500">{progress}% مكتمل</span>
            <button onClick={onOpen} className="text-[10px] font-bold px-3 py-1.5 rounded-lg"
              style={{ background: `${tpl.color}15`, color: tpl.color, border: `1px solid ${tpl.color}25` }}>
              أكمل التحدي
            </button>
          </div>
        </div>
      ) : (
        <motion.button whileTap={{ scale: 0.97 }} onClick={onStart}
          className="w-full py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5"
          style={{ background: `${tpl.color}12`, border: `1px solid ${tpl.color}25`, color: tpl.color }}>
          <Play className="w-3.5 h-3.5" /> ابدأ التحدي
        </motion.button>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*       ACTIVE CHALLENGE VIEW                */
/* ═══════════════════════════════════════════ */

function ActiveChallengeView({ tpl, challenge, onBack }: {
  tpl: ChallengeTemplate;
  challenge: ActiveChallenge;
  onBack: () => void;
}) {
  const { checkInDay, abandonChallenge } = useWarshaState();
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [justChecked, setJustChecked] = useState(false);

  const handleCheckIn = (day: number) => {
    checkInDay(tpl.id, day, note.trim() || undefined);
    setNote("");
    setJustChecked(true);
    setTimeout(() => { setJustChecked(false); setActiveDay(null); }, 1500);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800/40 border border-slate-700/30 text-slate-400">
          <ChevronLeft className="w-4 h-4 rotate-180" />
        </button>
        <div className="text-center flex-1">
          <span className="text-2xl">{tpl.emoji}</span>
          <h2 className="text-sm font-black text-white">{tpl.title}</h2>
        </div>
        <button onClick={() => { abandonChallenge(tpl.id); onBack(); }}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-900/10 border border-red-800/20 text-red-400/50">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
          <motion.div className="h-full rounded-full" style={{ background: tpl.color }}
            animate={{ width: `${(challenge.completedDays.length / 7) * 100}%` }} />
        </div>
        <span className="text-[10px] font-bold" style={{ color: tpl.color }}>{challenge.completedDays.length}/7</span>
      </div>

      {/* Days */}
      <div className="space-y-2">
        {tpl.days.map((d) => {
          const isDone = challenge.completedDays.includes(d.day);
          const isActive = activeDay === d.day;
          const dayNote = challenge.notes[d.day];

          return (
            <div key={d.day}>
              <button
                onClick={() => !isDone && setActiveDay(isActive ? null : d.day)}
                className="w-full rounded-xl p-3 text-right flex items-center gap-3 transition-all"
                style={{
                  background: isDone ? `${tpl.color}08` : isActive ? "rgba(30,41,59,0.6)" : "rgba(15,23,42,0.5)",
                  border: `1px solid ${isDone ? `${tpl.color}25` : isActive ? `${tpl.color}20` : "rgba(51,65,85,0.25)"}`,
                }}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black"
                  style={{
                    background: isDone ? `${tpl.color}20` : "rgba(30,41,59,0.5)",
                    border: `2px solid ${isDone ? tpl.color : "rgba(51,65,85,0.3)"}`,
                    color: isDone ? tpl.color : "#64748b",
                  }}>
                  {isDone ? <Check className="w-3.5 h-3.5" /> : d.day}
                </div>
                <div className="flex-1">
                  <span className="text-xs font-bold block" style={{ color: isDone ? tpl.color : "#fff" }}>
                    يوم {d.day}: {d.title}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">{d.task}</span>
                  {dayNote && (
                    <span className="text-[9px] text-slate-600 italic block mt-1">«{dayNote}»</span>
                  )}
                </div>
              </button>

              {/* Check-in form */}
              <AnimatePresence>
                {isActive && !isDone && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="pt-2 pr-11 space-y-2">
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="ملاحظتك عن اليوم (اختياري)..."
                        rows={2}
                        className="w-full bg-slate-800/40 border border-slate-700/30 rounded-lg px-3 py-2 text-white text-[11px] placeholder-slate-600 focus:outline-none resize-none"
                        dir="rtl"
                      />
                      <motion.button whileTap={{ scale: 0.97 }}
                        onClick={() => handleCheckIn(d.day)}
                        className="w-full py-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1"
                        style={{ background: `${tpl.color}15`, border: `1px solid ${tpl.color}25`, color: tpl.color }}>
                        <Check className="w-3 h-3" /> أنجزت يوم {d.day}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Just checked animation */}
      <AnimatePresence>
        {justChecked && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.6)" }}>
            <div className="text-center">
              <motion.span className="text-5xl block" animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.5 }}>✅</motion.span>
              <p className="text-white font-black mt-2">أحسنت!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*           MAIN SCREEN                      */
/* ═══════════════════════════════════════════ */

export default function WarshaScreen() {
  const {
    activeChallenges,
    completedChallenges,
    startChallenge,
    isStarted,
    getProgress,
    getTotalCompleted,
  } = useWarshaState();

  const [viewing, setViewing] = useState<string | null>(null);
  const totalBadges = useMemo(() => getTotalCompleted(), [completedChallenges]);

  const viewingTpl = viewing ? CHALLENGE_TEMPLATES.find((t) => t.id === viewing) : null;
  const viewingChallenge = viewing ? activeChallenges.find((c) => c.templateId === viewing) : null;

  if (viewingTpl && viewingChallenge) {
    return (
      <div className="min-h-screen bg-slate-950 font-sans pb-32 pt-14" dir="rtl">
        <ActiveChallengeView tpl={viewingTpl} challenge={viewingChallenge} onBack={() => setViewing(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans pb-32" dir="rtl">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[400px] h-[400px] rounded-full top-[-10%] left-[-5%]"
          style={{ background: "radial-gradient(circle, rgba(239,68,68,0.05), transparent 65%)" }} />
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 px-5 pt-14 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-orange-900/15 border border-orange-500/20">
            <Flame className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">ورشة</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">تحديات 7 أيام لبناء مهارة</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="relative z-10 px-5 mb-5">
        <div className="flex gap-3">
          {[
            { label: "نشطة", value: activeChallenges.length, color: "#f59e0b" },
            { label: "مكتملة", value: totalBadges, color: "#10b981" },
            { label: "بادجات", value: `🏅 ${totalBadges}`, color: "#fbbf24" },
          ].map((s) => (
            <div key={s.label} className="flex-1 rounded-xl p-3 text-center"
              style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
              <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9px] text-slate-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Completed badges */}
      {completedChallenges.length > 0 && (
        <div className="relative z-10 px-5 mb-5">
          <h3 className="text-[10px] text-slate-500 font-bold mb-2 uppercase tracking-wider flex items-center gap-1.5">
            <Trophy className="w-3 h-3 text-amber-400" /> بادجاتك
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {completedChallenges.map((c) => {
              const tpl = CHALLENGE_TEMPLATES.find((t) => t.id === c.templateId);
              if (!tpl) return null;
              return (
                <div key={c.templateId} className="flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center gap-1"
                  style={{ background: `${tpl.color}10`, border: `1px solid ${tpl.color}25` }}>
                  <span className="text-xl">{tpl.emoji}</span>
                  <span className="text-[7px] font-bold" style={{ color: tpl.color }}>✅</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Challenge catalog */}
      <div className="relative z-10 px-5 space-y-3">
        <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">التحديات المتاحة</h3>
        {CHALLENGE_TEMPLATES.map((tpl, i) => (
          <motion.div key={tpl.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}>
            <BrowseCard
              tpl={tpl}
              isStarted={isStarted(tpl.id)}
              progress={getProgress(tpl.id)}
              onStart={() => startChallenge(tpl.id)}
              onOpen={() => setViewing(tpl.id)}
            />
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="relative z-10 mx-5 mt-8 p-4 rounded-2xl text-center"
        style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(51,65,85,0.2)" }}>
        <p className="text-[10px] text-slate-600 leading-relaxed">
          🏋️ ورشة — تحديات مصغرة تبني مهارات حقيقية في 7 أيام
        </p>
      </motion.div>
    </div>
  );
}
