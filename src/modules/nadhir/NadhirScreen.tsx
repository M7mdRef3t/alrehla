/**
 * نذير — Nadhir: نظام الإنذار المبكر
 *
 * الدرع الأخير — حماية المستخدم قبل الأزمة:
 * - Crisis Radar — مسح تلقائي من مصادر البيانات
 * - Emergency Kit — تنفس 4-7-8 + تأريض 5-4-3-2-1
 * - Safe Circle — جهات اتصال آمنة
 * - Safety Plan — خطة أمان شخصية
 * - Cooldown Timer — مهلة قبل القرارات
 * - Crisis History — سجل الأزمات + ما ساعدك
 */

import type { FC } from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, AlertTriangle, Phone, Heart, Wind, Timer,
  Plus, Trash2, Check, X, ChevronDown, Clock,
  Eye, Sparkles, Activity, UserCheck, ListChecks, History,
} from "lucide-react";
import { useNadhirState } from "./store/nadhir.store";
import { usePulseState } from "@/domains/consciousness/store/pulse.store";

/* ═══════════════════════════════════════════ */
/*               CONSTANTS                    */
/* ═══════════════════════════════════════════ */

type TabId = "radar" | "kit" | "plan" | "contacts" | "history";

const TABS: { id: TabId; label: string; icon: typeof Shield }[] = [
  { id: "radar", label: "الرادار", icon: Activity },
  { id: "kit", label: "الطوارئ", icon: Wind },
  { id: "plan", label: "خطة أمان", icon: ListChecks },
  { id: "contacts", label: "الأمان", icon: Phone },
  { id: "history", label: "السجل", icon: History },
];

/* ═══════════════════════════════════════════ */
/*           BREATHING EXERCISE               */
/* ═══════════════════════════════════════════ */

const BreathingExercise: FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [count, setCount] = useState(0);
  const [cycles, setCycles] = useState(0);

  useEffect(() => {
    if (!isActive) return;
    const durations = { inhale: 4000, hold: 7000, exhale: 8000 };
    const countMax = { inhale: 4, hold: 7, exhale: 8 };

    setCount(countMax[phase]);
    const countInterval = setInterval(() => {
      setCount((c) => Math.max(0, c - 1));
    }, 1000);

    const timeout = setTimeout(() => {
      if (phase === "inhale") setPhase("hold");
      else if (phase === "hold") setPhase("exhale");
      else { setPhase("inhale"); setCycles((c) => c + 1); }
    }, durations[phase]);

    return () => { clearInterval(countInterval); clearTimeout(timeout); };
  }, [isActive, phase]);

  const phaseConfig = {
    inhale: { label: "اشهق", color: "#06b6d4", scale: 1.3 },
    hold: { label: "أمسك", color: "#a855f7", scale: 1.3 },
    exhale: { label: "ازفر", color: "#10b981", scale: 0.8 },
  };

  const config = phaseConfig[phase];

  return (
    <div className="p-5 rounded-2xl text-center space-y-4"
      style={{ background: "rgba(6,182,212,0.04)", border: "1px solid rgba(6,182,212,0.1)" }}
    >
      <p className="text-xs font-black text-cyan-400/80">تنفس 4-7-8</p>

      {/* Breathing Circle */}
      <div className="flex justify-center py-4">
        <motion.div
          animate={{ scale: isActive ? config.scale : 1 }}
          transition={{ duration: phase === "inhale" ? 4 : phase === "hold" ? 0.3 : 8, ease: "easeInOut" }}
          className="w-28 h-28 rounded-full flex items-center justify-center relative"
          style={{
            background: `${config.color}15`,
            border: `2px solid ${config.color}30`,
            boxShadow: isActive ? `0 0 30px ${config.color}20` : "none",
          }}
        >
          {isActive ? (
            <div className="text-center">
              <p className="text-2xl font-black" style={{ color: config.color }}>{count}</p>
              <p className="text-[10px] font-bold mt-0.5" style={{ color: `${config.color}80` }}>{config.label}</p>
            </div>
          ) : (
            <Wind className="w-8 h-8 text-cyan-400/30" />
          )}

          {/* Pulse ring */}
          {isActive && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: `1px solid ${config.color}20` }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.div>
      </div>

      {cycles > 0 && <p className="text-[9px] text-slate-500">{cycles} دورة مكتملة</p>}

      <button onClick={() => { setIsActive(!isActive); if (!isActive) { setPhase("inhale"); setCycles(0); } }}
        className="w-full py-3 rounded-xl text-xs font-bold transition-all active:scale-95"
        style={{
          background: isActive ? "rgba(239,68,68,0.1)" : "rgba(6,182,212,0.1)",
          border: `1px solid ${isActive ? "rgba(239,68,68,0.2)" : "rgba(6,182,212,0.2)"}`,
          color: isActive ? "#ef4444" : "#06b6d4",
        }}
      >
        {isActive ? "إيقاف" : "ابدأ التنفس"}
      </button>
    </div>
  );
};

/* ═══════════════════════════════════════════ */
/*           GROUNDING EXERCISE               */
/* ═══════════════════════════════════════════ */

const GroundingExercise: FC = () => {
  const steps = [
    { count: 5, sense: "أشياء تشوفها 👁️", color: "#3b82f6", examples: "الحائط، يدك، كوب..." },
    { count: 4, sense: "أشياء تلمسها ✋", color: "#10b981", examples: "الكرسي، ملابسك..." },
    { count: 3, sense: "أشياء تسمعها 👂", color: "#f59e0b", examples: "صوت مكيف، طيور..." },
    { count: 2, sense: "أشياء تشمّها 👃", color: "#ef4444", examples: "القهوة، الهواء..." },
    { count: 1, sense: "شيء تتذوقه 👅", color: "#a855f7", examples: "ماء، نعنع..." },
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<boolean[]>(steps.map(() => false));

  const markDone = (idx: number) => {
    const newCompleted = [...completed];
    newCompleted[idx] = true;
    setCompleted(newCompleted);
    if (idx < steps.length - 1) setCurrentStep(idx + 1);
  };

  const allDone = completed.every(Boolean);

  return (
    <div className="p-5 rounded-2xl space-y-3"
      style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.1)" }}
    >
      <p className="text-xs font-black text-emerald-400/80">تأريض 5-4-3-2-1</p>
      <p className="text-[10px] text-slate-500 leading-relaxed">ركّز على حواسك — عدّ كل حاسة بالترتيب</p>

      <div className="space-y-2">
        {steps.map((step, idx) => (
          <motion.button key={idx}
            onClick={() => !completed[idx] && markDone(idx)}
            className="w-full p-3 rounded-xl flex items-center gap-3 text-right transition-all"
            style={{
              background: completed[idx] ? `${step.color}10` : currentStep === idx ? `${step.color}08` : "rgba(255,255,255,0.02)",
              border: `1px solid ${completed[idx] ? `${step.color}20` : currentStep === idx ? `${step.color}10` : "rgba(255,255,255,0.04)"}`,
              opacity: idx > currentStep && !completed[idx] ? 0.3 : 1,
            }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${step.color}15` }}
            >
              {completed[idx] ? (
                <Check className="w-4 h-4" style={{ color: step.color }} />
              ) : (
                <span className="text-sm font-black" style={{ color: step.color }}>{step.count}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-white">{step.sense}</p>
              <p className="text-[9px] text-slate-500 mt-0.5">{step.examples}</p>
            </div>
          </motion.button>
        ))}
      </div>

      {allDone && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl text-center"
          style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}
        >
          <p className="text-xs font-bold text-emerald-400">أنت هنا. أنت آمن. أنت حاضر. 🌿</p>
        </motion.div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════ */
/*            COOLDOWN TIMER                  */
/* ═══════════════════════════════════════════ */

const CooldownTimer: FC = () => {
  const { cooldownEndTime, startCooldown, clearCooldown } = useNadhirState();
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!cooldownEndTime) { setRemaining(0); return; }
    const tick = () => {
      const diff = cooldownEndTime - Date.now();
      if (diff <= 0) { clearCooldown(); setRemaining(0); }
      else setRemaining(Math.ceil(diff / 1000));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [cooldownEndTime, clearCooldown]);

  const isActive = remaining > 0;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = cooldownEndTime ? Math.max(0, 1 - (cooldownEndTime - Date.now()) / (10 * 60000)) : 0;

  return (
    <div className="p-5 rounded-2xl space-y-4"
      style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.1)" }}
    >
      <p className="text-xs font-black text-amber-400/80 flex items-center gap-1.5">
        <Timer className="w-3.5 h-3.5" /> مهلة التروّي
      </p>
      <p className="text-[10px] text-slate-500 leading-relaxed">
        "استنى قبل ما تاخد أي قرار صعب — 10 دقايق ممكن تغير كل حاجة"
      </p>

      {isActive ? (
        <div className="text-center space-y-3">
          <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center relative"
            style={{ background: "rgba(251,191,36,0.08)", border: "2px solid rgba(251,191,36,0.2)" }}
          >
            <p className="text-xl font-black text-amber-400">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </p>
            {/* Progress ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(251,191,36,0.1)" strokeWidth="2" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="#fbbf24" strokeWidth="2"
                strokeDasharray={`${progress * 283} 283`} strokeLinecap="round" />
            </svg>
          </div>
          <button onClick={clearCooldown}
            className="text-[10px] text-slate-500 underline"
          >إلغاء المهلة</button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {[5, 10, 15].map((min) => (
            <button key={min} onClick={() => startCooldown(min)}
              className="py-3 rounded-xl text-xs font-bold transition-all active:scale-95"
              style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.12)", color: "#fbbf24" }}
            >
              {min} دقيقة
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════ */
/*              MAIN COMPONENT                */
/* ═══════════════════════════════════════════ */

export const NadhirScreen: FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("radar");
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactRelation, setNewContactRelation] = useState("");

  const {
    safeContacts, safetyPlan, crisisHistory,
    addSafeContact, removeSafeContact,
    updateSafetyStep, addSafetyStep, removeSafetyStep,
    logCrisis, resolveCrisis,
  } = useNadhirState();

  const rawLogs = usePulseState((s) => s.logs);
  const logs = useMemo(() => rawLogs ?? [], [rawLogs]);

  // ── Crisis Level Calculation ──
  const crisisLevel = useMemo(() => {
    if (logs.length === 0) return { level: 0, label: "لا توجد بيانات", color: "#64748b", emoji: "⚪" };

    const recent = logs.filter((l) => Date.now() - l.timestamp < 48 * 3600000);
    if (recent.length === 0) return { level: 0, label: "لا توجد بيانات حديثة", color: "#64748b", emoji: "⚪" };

    const avgEnergy = recent.reduce((s, l) => s + l.energy, 0) / recent.length;
    const negativeMoods = ["angry", "overwhelmed", "sad", "tense", "anxious"];
    const negativeRatio = recent.filter((l) => negativeMoods.includes(l.mood)).length / recent.length;
    const entropyScore = negativeRatio * 100;
    const energyPenalty = Math.max(0, (5 - avgEnergy) * 15);
    const rawLevel = Math.min(100, entropyScore + energyPenalty);

    if (rawLevel >= 75) return { level: rawLevel, label: "🚨 مستوى حرج — استخدم أدوات الطوارئ", color: "#ef4444", emoji: "🔴" };
    if (rawLevel >= 50) return { level: rawLevel, label: "⚠️ مرتفع — خذ استراحة واتنفس", color: "#f97316", emoji: "🟠" };
    if (rawLevel >= 25) return { level: rawLevel, label: "💛 متوسط — راقب نفسك", color: "#fbbf24", emoji: "🟡" };
    return { level: rawLevel, label: "💚 مستقر — أنت بخير", color: "#10b981", emoji: "🟢" };
  }, [logs]);

  // ── Add Safe Contact ──
  const handleAddContact = useCallback(() => {
    if (!newContactName.trim()) return;
    addSafeContact({
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
      relation: newContactRelation.trim() || "شخص آمن",
      emoji: "💚",
    });
    setNewContactName(""); setNewContactPhone(""); setNewContactRelation("");
    setShowAddContact(false);
  }, [newContactName, newContactPhone, newContactRelation, addSafeContact]);

  // ── New Safety Step ──
  const [newStepText, setNewStepText] = useState("");
  const handleAddStep = () => {
    if (!newStepText.trim()) return;
    addSafetyStep(newStepText.trim());
    setNewStepText("");
  };

  return (
    <div className="min-h-screen pb-32 select-none" dir="rtl"
      style={{ background: "linear-gradient(180deg, #0a0508 0%, #120a10 40%, #080510 100%)" }}
    >
      {/* ═══ Header ═══ */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}
            >
              <Shield className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">نذير</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">الدرع الأخير — أنت محمي</p>
            </div>
          </div>
          {/* Crisis Level Badge */}
          <div className="px-3 py-1.5 rounded-xl flex items-center gap-1.5"
            style={{ background: `${crisisLevel.color}10`, border: `1px solid ${crisisLevel.color}20` }}
          >
            <span className="text-sm">{crisisLevel.emoji}</span>
            <span className="text-[10px] font-black" style={{ color: crisisLevel.color }}>
              {Math.round(crisisLevel.level)}%
            </span>
          </div>
        </div>

        {/* Tabs — scrollable */}
        <div className="flex gap-1 p-1 rounded-2xl overflow-x-auto no-scrollbar"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
        >
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all whitespace-nowrap px-2"
              style={{
                background: activeTab === tab.id ? "rgba(239,68,68,0.12)" : "transparent",
                color: activeTab === tab.id ? "#ef4444" : "rgba(148,163,184,0.4)",
                border: activeTab === tab.id ? "1px solid rgba(239,68,68,0.2)" : "1px solid transparent",
              }}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ═══ TAB: Radar ═══ */}
      {activeTab === "radar" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-4">
          {/* Crisis Gauge */}
          <div className="p-6 rounded-2xl text-center relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${crisisLevel.color}06 0%, ${crisisLevel.color}03 100%)`,
              border: `1px solid ${crisisLevel.color}15`,
            }}
          >
            <div className="absolute top-0 left-0 w-32 h-32 rounded-full blur-3xl"
              style={{ background: `${crisisLevel.color}08` }}
            />

            {/* Gauge Circle */}
            <div className="w-32 h-32 mx-auto relative mb-4">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
                <motion.circle cx="50" cy="50" r="42" fill="none"
                  stroke={crisisLevel.color} strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${(crisisLevel.level / 100) * 264} 264`}
                  initial={{ strokeDasharray: "0 264" }}
                  animate={{ strokeDasharray: `${(crisisLevel.level / 100) * 264} 264` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl">{crisisLevel.emoji}</span>
                <span className="text-lg font-black text-white mt-0.5">{Math.round(crisisLevel.level)}%</span>
              </div>
            </div>

            <p className="text-xs font-bold text-white">{crisisLevel.label}</p>
            <p className="text-[9px] text-slate-500 mt-1">
              {logs.length > 0 ? `آخر 48 ساعة · ${logs.filter((l) => Date.now() - l.timestamp < 48 * 3600000).length} نبضة` : "سجّل نبضة لتفعيل الرادار"}
            </p>
          </div>

          {/* Quick Actions */}
          {crisisLevel.level >= 50 && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <p className="text-[10px] text-red-400/60 font-bold">⚡ إجراءات فورية</p>
              <button onClick={() => setActiveTab("kit")}
                className="w-full p-3 rounded-xl flex items-center gap-3 text-right transition-all active:scale-98"
                style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.1)" }}
              >
                <Wind className="w-5 h-5 text-cyan-400" />
                <span className="text-xs font-bold text-white">تنفس وتأريض</span>
              </button>
              {safeContacts.length > 0 && (
                <button onClick={() => setActiveTab("contacts")}
                  className="w-full p-3 rounded-xl flex items-center gap-3 text-right transition-all active:scale-98"
                  style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.1)" }}
                >
                  <Phone className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold text-white">اتصل بشخص آمن</span>
                </button>
              )}
            </motion.div>
          )}

          {/* Pattern Alert */}
          {crisisHistory.length > 0 && (
            <div className="p-4 rounded-2xl"
              style={{ background: "rgba(168,85,247,0.04)", border: "1px solid rgba(168,85,247,0.08)" }}
            >
              <p className="text-[10px] text-violet-400/60 font-bold flex items-center gap-1 mb-2">
                <Sparkles className="w-3 h-3" /> نمط مكتشف
              </p>
              <p className="text-xs text-slate-300">
                آخر مرة مررت بأزمة — اللي ساعدك:
              </p>
              <p className="text-xs text-violet-300 font-bold mt-1">
                "{crisisHistory.find((c) => c.whatHelped)?.whatHelped || "لم تسجل بعد — سجّل ما يساعدك"}"
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* ═══ TAB: Emergency Kit ═══ */}
      {activeTab === "kit" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-4">
          <BreathingExercise />
          <GroundingExercise />
          <CooldownTimer />
        </motion.div>
      )}

      {/* ═══ TAB: Safety Plan ═══ */}
      {activeTab === "plan" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-3">
          <p className="text-[10px] text-slate-500 font-bold">
            خطة الأمان الشخصية — خطوات تتبعها وقت الأزمة
          </p>

          {safetyPlan.map((step) => (
            <div key={step.id} className="flex items-center gap-3 p-3 rounded-xl"
              style={{
                background: step.done ? "rgba(16,185,129,0.04)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${step.done ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)"}`,
              }}
            >
              <button onClick={() => updateSafetyStep(step.id, { done: !step.done })}
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: step.done ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${step.done ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)"}`,
                }}
              >
                {step.done ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <span className="text-[10px] font-bold text-slate-500">{step.order}</span>}
              </button>
              <p className={`flex-1 text-xs ${step.done ? "text-emerald-400/60 line-through" : "text-white"}`}>{step.text}</p>
              <button onClick={() => removeSafetyStep(step.id)} className="p-1 opacity-20 hover:opacity-50">
                <Trash2 className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          ))}

          <div className="flex gap-2 mt-2">
            <input value={newStepText} onChange={(e) => setNewStepText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddStep()}
              placeholder="أضف خطوة جديدة..."
              className="flex-1 px-3 py-2.5 rounded-xl text-xs text-white placeholder:text-slate-600 outline-none"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            />
            <button onClick={handleAddStep} disabled={!newStepText.trim()}
              className="px-3 rounded-xl transition-all active:scale-95 disabled:opacity-30"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.15)" }}
            >
              <Plus className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </motion.div>
      )}

      {/* ═══ TAB: Safe Contacts ═══ */}
      {activeTab === "contacts" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-3">
          <p className="text-[10px] text-slate-500 font-bold">
            الحلقة الآمنة — الأشخاص اللي تتواصل معاهم وقت الحاجة
          </p>

          {safeContacts.length === 0 && !showAddContact && (
            <div className="py-12 text-center space-y-3">
              <Phone className="w-8 h-8 text-emerald-400/15 mx-auto" />
              <p className="text-xs text-slate-500 font-bold">لا توجد جهات اتصال آمنة</p>
              <p className="text-[10px] text-slate-600">أضف شخص واحد على الأقل — هيفرق وقت الأزمة</p>
            </div>
          )}

          {/* Contact Cards */}
          {safeContacts.map((contact) => (
            <div key={contact.id} className="p-4 rounded-xl flex items-center gap-3"
              style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.08)" }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "rgba(16,185,129,0.1)" }}
              >
                <span className="text-lg">{contact.emoji}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{contact.name}</p>
                <p className="text-[10px] text-slate-500">{contact.relation} · {contact.phone || "بدون رقم"}</p>
              </div>
              {contact.phone && (
                <a href={`tel:${contact.phone}`}
                  className="p-2.5 rounded-xl"
                  style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.15)" }}
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                </a>
              )}
              <button onClick={() => removeSafeContact(contact.id)} className="p-1 opacity-20 hover:opacity-50">
                <Trash2 className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          ))}

          {/* Add Contact Form */}
          <AnimatePresence>
            {showAddContact && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                className="p-4 rounded-2xl space-y-3"
                style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.1)" }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-emerald-400">شخص آمن جديد</p>
                  <button onClick={() => setShowAddContact(false)}><X className="w-3.5 h-3.5 text-slate-500" /></button>
                </div>
                <input value={newContactName} onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="الاسم"
                  className="w-full px-3 py-2 rounded-lg text-xs text-white placeholder:text-slate-600 outline-none"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                />
                <input value={newContactPhone} onChange={(e) => setNewContactPhone(e.target.value)}
                  placeholder="رقم الهاتف (اختياري)"
                  className="w-full px-3 py-2 rounded-lg text-xs text-white placeholder:text-slate-600 outline-none"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                />
                <input value={newContactRelation} onChange={(e) => setNewContactRelation(e.target.value)}
                  placeholder='العلاقة — مثلاً: "صديق مقرّب"'
                  className="w-full px-3 py-2 rounded-lg text-xs text-white placeholder:text-slate-600 outline-none"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                />
                <button onClick={handleAddContact} disabled={!newContactName.trim()}
                  className="w-full py-2.5 rounded-xl text-xs font-bold disabled:opacity-30 transition-all active:scale-95"
                  style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981" }}
                >أضف</button>
              </motion.div>
            )}
          </AnimatePresence>

          {!showAddContact && (
            <button onClick={() => setShowAddContact(true)}
              className="w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
              style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.1)", color: "#10b981" }}
            >
              <Plus className="w-3.5 h-3.5" /> أضف شخص آمن
            </button>
          )}
        </motion.div>
      )}

      {/* ═══ TAB: Crisis History ═══ */}
      {activeTab === "history" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-3">
          {crisisHistory.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <History className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-500 font-bold">لا يوجد سجل أزمات</p>
              <p className="text-[10px] text-slate-600">وهذا شيء جيد 💚</p>
            </div>
          ) : (
            crisisHistory.map((crisis) => (
              <div key={crisis.id} className="p-4 rounded-xl"
                style={{
                  background: crisis.resolved ? "rgba(16,185,129,0.03)" : "rgba(239,68,68,0.03)",
                  border: `1px solid ${crisis.resolved ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)"}`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">{crisis.resolved ? "✅" : "🔴"}</span>
                  <p className="text-xs font-bold text-white flex-1">مستوى {crisis.level}/10</p>
                  <span className="text-[8px] text-slate-500">
                    {new Date(crisis.timestamp).toLocaleDateString("ar-EG")}
                  </span>
                </div>
                {crisis.trigger && <p className="text-[10px] text-slate-400 mb-1">المحفّز: {crisis.trigger}</p>}
                {crisis.whatHelped && <p className="text-[10px] text-emerald-400/80">اللي ساعد: {crisis.whatHelped}</p>}
              </div>
            ))
          )}
        </motion.div>
      )}

      {/* ═══ Footer ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="mx-5 mt-8 p-4 rounded-2xl text-center"
        style={{ background: "rgba(239,68,68,0.03)", border: "1px solid rgba(239,68,68,0.06)" }}
      >
        <Shield className="w-5 h-5 text-red-400/20 mx-auto mb-2" />
        <p className="text-[10px] text-slate-600 leading-relaxed max-w-xs mx-auto">
          نذير مش بديل عن المساعدة المتخصصة.
          <br />
          لو محتاج مساعدة فورية — تواصل مع متخصص.
        </p>
        <p className="text-[9px] text-red-400/40 font-bold mt-2">
          خط نجدة الصحة النفسية: 920033360
        </p>
      </motion.div>
    </div>
  );
};

export default NadhirScreen;
