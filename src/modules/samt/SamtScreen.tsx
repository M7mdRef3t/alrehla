/**
 * صمت — Samt Screen
 * Circular Breathing Timer + Mindful Silence Counter
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useSamtState,
  BREATH_CONFIGS,
  PHASE_LABELS,
  type BreathPattern,
  type SessionPhase,
} from "./store/samt.store";
import { Wind, Play, Square, RotateCcw } from "lucide-react";

/* ═══════════════════════════════════════════ */
/*        BREATHING CIRCLE COMPONENT          */
/* ═══════════════════════════════════════════ */

function BreathingCircle({
  phase,
  progress,
  color,
  isRunning,
}: {
  phase: SessionPhase;
  progress: number; // 0-1 within current phase
  color: string;
  isRunning: boolean;
}) {
  const baseSize = 220;
  const minScale = 0.55;
  const maxScale = 1;

  let scale = minScale;
  if (phase === "inhale") scale = minScale + (maxScale - minScale) * progress;
  else if (phase === "hold") scale = maxScale;
  else if (phase === "exhale") scale = maxScale - (maxScale - minScale) * progress;
  else if (phase === "holdOut") scale = minScale;
  else scale = minScale;

  return (
    <div className="relative flex items-center justify-center" style={{ width: baseSize, height: baseSize }}>
      {/* Outer glow rings */}
      {isRunning && (
        <>
          <div className="absolute rounded-full animate-ping"
            style={{ width: baseSize * 0.9, height: baseSize * 0.9, background: `${color}08`, animationDuration: "3s" }} />
          <div className="absolute rounded-full"
            style={{ width: baseSize, height: baseSize, border: `1px solid ${color}15` }} />
        </>
      )}

      {/* Main breathing circle */}
      <motion.div
        animate={{ scale }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="rounded-full flex items-center justify-center relative"
        style={{
          width: baseSize * 0.75,
          height: baseSize * 0.75,
          background: `radial-gradient(circle, ${color}15, ${color}05)`,
          border: `2px solid ${color}30`,
          boxShadow: isRunning ? `0 0 40px ${color}15, inset 0 0 30px ${color}08` : "none",
        }}
      >
        {/* Inner pulse */}
        {isRunning && (
          <motion.div
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute rounded-full"
            style={{
              width: "60%",
              height: "60%",
              background: `radial-gradient(circle, ${color}20, transparent)`,
            }}
          />
        )}

        {/* Phase label */}
        <div className="text-center z-10">
          <motion.span
            key={phase}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-black block"
            style={{ color }}
          >
            {PHASE_LABELS[phase]}
          </motion.span>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/*           MAIN SCREEN                      */
/* ═══════════════════════════════════════════ */

export default function SamtScreen() {
  const {
    sessions, totalMinutes, logSession,
    getTodayMinutes, getTodaySessions, getStreak, getPatternBreakdown,
  } = useSamtState();

  const [selectedPattern, setSelectedPattern] = useState<BreathPattern>("box");
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<SessionPhase>("idle");
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cycleRef = useRef<{ running: boolean }>({ running: false });

  const config = BREATH_CONFIGS[selectedPattern];
  const todayMinutes = useMemo(() => getTodayMinutes(), [sessions]);
  const todaySessions = useMemo(() => getTodaySessions(), [sessions]);
  const streak = useMemo(() => getStreak(), [sessions]);
  const breakdown = useMemo(() => getPatternBreakdown(), [sessions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
      cycleRef.current.running = false;
    };
  }, []);

  const runPhase = useCallback((phaseName: SessionPhase, duration: number): Promise<void> => {
    return new Promise((resolve) => {
      if (!cycleRef.current.running) { resolve(); return; }
      if (duration === 0) { resolve(); return; }

      setPhase(phaseName);
      setPhaseProgress(0);

      const steps = 20;
      const stepTime = (duration * 1000) / steps;
      let step = 0;

      const progressInterval = setInterval(() => {
        if (!cycleRef.current.running) {
          clearInterval(progressInterval);
          resolve();
          return;
        }
        step++;
        setPhaseProgress(step / steps);
        if (step >= steps) {
          clearInterval(progressInterval);
        }
      }, stepTime);

      phaseTimerRef.current = setTimeout(() => {
        clearInterval(progressInterval);
        if (cycleRef.current.running) {
          setPhaseProgress(1);
        }
        resolve();
      }, duration * 1000);
    });
  }, []);

  const runCycle = useCallback(async () => {
    const [inhale, hold, exhale, holdOut] = config.pattern;
    while (cycleRef.current.running) {
      await runPhase("inhale", inhale);
      if (!cycleRef.current.running) break;
      if (hold > 0) await runPhase("hold", hold);
      if (!cycleRef.current.running) break;
      await runPhase("exhale", exhale);
      if (!cycleRef.current.running) break;
      if (holdOut > 0) await runPhase("holdOut", holdOut);
    }
  }, [config.pattern, runPhase]);

  const handleStart = useCallback(() => {
    setIsRunning(true);
    setElapsed(0);
    cycleRef.current.running = true;

    // Elapsed timer
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    void runCycle();
  }, [runCycle]);

  const handleStop = useCallback(() => {
    cycleRef.current.running = false;
    setIsRunning(false);
    setPhase("idle");
    setPhaseProgress(0);

    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (phaseTimerRef.current) { clearTimeout(phaseTimerRef.current); phaseTimerRef.current = null; }

    // Log if > 10 seconds
    if (elapsed >= 10) {
      logSession(selectedPattern, elapsed);
    }
    setElapsed(0);
  }, [elapsed, selectedPattern, logSession]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans pb-32" dir="rtl">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[600px] h-[600px] rounded-full top-[-20%] left-[50%] -translate-x-1/2"
          style={{ background: `radial-gradient(circle, ${config.color}08, transparent 65%)` }} />
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 px-5 pt-14 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-cyan-900/15 border border-cyan-500/20">
            <Wind className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">صمت</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">تنفس واعي · صمت عميق</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="relative z-10 px-5 mb-5">
        <div className="flex gap-3">
          {[
            { label: "اليوم", value: `${todayMinutes} د`, color: config.color },
            { label: "إجمالي", value: `${totalMinutes} د`, color: "#10b981" },
            { label: "سلسلة", value: `${streak} يوم`, color: "#f59e0b" },
          ].map((s) => (
            <div key={s.label} className="flex-1 rounded-xl p-3 text-center"
              style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
              <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9px] text-slate-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pattern Selector */}
      {!isRunning && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 px-5 mb-6">
          <span className="text-[9px] text-slate-500 font-bold uppercase block mb-2">نمط التنفس</span>
          <div className="flex gap-2">
            {(Object.keys(BREATH_CONFIGS) as BreathPattern[]).map((p) => {
              const cfg = BREATH_CONFIGS[p];
              const active = selectedPattern === p;
              return (
                <button key={p} onClick={() => setSelectedPattern(p)}
                  className="flex-1 py-3 rounded-xl text-center transition-all"
                  style={{
                    background: active ? `${cfg.color}12` : "rgba(30,41,59,0.4)",
                    border: `1px solid ${active ? cfg.color : "rgba(51,65,85,0.3)"}`,
                  }}>
                  <span className="text-lg block">{cfg.emoji}</span>
                  <span className="text-[10px] font-bold block mt-0.5" style={{ color: active ? cfg.color : "#94a3b8" }}>
                    {cfg.label}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-600 text-center mt-2">{config.description}</p>
        </motion.div>
      )}

      {/* Breathing Circle */}
      <div className="relative z-10 flex flex-col items-center px-5 mb-6">
        <BreathingCircle
          phase={phase}
          progress={phaseProgress}
          color={config.color}
          isRunning={isRunning}
        />

        {/* Timer */}
        {isRunning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-center">
            <span className="text-3xl font-black text-white/80 font-mono tracking-widest">
              {formatTime(elapsed)}
            </span>
          </motion.div>
        )}

        {/* Controls */}
        <div className="flex gap-3 mt-6">
          {!isRunning ? (
            <motion.button whileTap={{ scale: 0.9 }} onClick={handleStart}
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${config.color}, ${config.color}cc)`,
                boxShadow: `0 4px 20px ${config.color}30`,
              }}>
              <Play className="w-7 h-7 text-white mr-[-2px]" />
            </motion.button>
          ) : (
            <motion.button whileTap={{ scale: 0.9 }} onClick={handleStop}
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
              style={{
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                boxShadow: "0 4px 20px rgba(239,68,68,0.3)",
              }}>
              <Square className="w-7 h-7 text-white" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Today's Sessions */}
      {todaySessions.length > 0 && !isRunning && (
        <div className="relative z-10 px-5 mb-5">
          <span className="text-[9px] text-slate-500 font-bold uppercase block mb-2">جلسات اليوم</span>
          <div className="space-y-1.5">
            {todaySessions.map((s) => {
              const cfg = BREATH_CONFIGS[s.breathPattern];
              const mins = Math.round(s.durationSeconds / 60 * 10) / 10;
              const time = new Date(s.completedAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
              return (
                <div key={s.id} className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{ background: `${cfg.color}06`, border: `1px solid ${cfg.color}12` }}>
                  <span className="text-sm">{cfg.emoji}</span>
                  <span className="text-[10px] font-bold flex-1" style={{ color: cfg.color }}>{cfg.label}</span>
                  <span className="text-[10px] text-white/60 font-mono">{mins} د</span>
                  <span className="text-[8px] text-slate-600">{time}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pattern Breakdown */}
      {breakdown.length > 0 && !isRunning && (
        <div className="relative z-10 px-5 mb-5">
          <div className="rounded-2xl p-4" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
            <span className="text-[9px] text-slate-500 font-bold uppercase block mb-3">توزيع أنماطك</span>
            <div className="space-y-2">
              {breakdown.map((b) => {
                const cfg = BREATH_CONFIGS[b.pattern];
                const maxMin = Math.max(...breakdown.map((x) => x.minutes));
                const pct = maxMin > 0 ? (b.minutes / maxMin) * 100 : 0;
                return (
                  <div key={b.pattern} className="flex items-center gap-2">
                    <span className="text-sm w-6 text-center">{cfg.emoji}</span>
                    <span className="text-[10px] w-10 font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        className="h-full rounded-full" style={{ background: cfg.color }} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 w-12 text-left">{b.minutes} د</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      {!isRunning && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="relative z-10 mx-5 mt-6 p-4 rounded-2xl text-center"
          style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(51,65,85,0.2)" }}>
          <p className="text-[10px] text-slate-600 leading-relaxed">
            🤫 صمت — في السكون تسمع ما لا تسمعه في الضوضاء
          </p>
        </motion.div>
      )}
    </div>
  );
}
