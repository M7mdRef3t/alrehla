import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAchievementState } from "../state/achievementState";

interface BreathingOverlayProps {
  onClose: () => void;
  autoCloseAfterCycles?: number;
}

// Scientific 4-2-6 breathing pattern
const INHALE_MS = 4000;
const HOLD_MS   = 2000;
const EXHALE_MS = 6000;
const DEFAULT_CYCLES = 4;

type Phase = "inhale" | "hold" | "exhale";

const CYCLE_PHRASES = [
  "جسمك بيشكرك دلوقتي",
  "الهواء ده بتاعك وحدك",
  "خلّي الضغط يمشي مع الزفير",
  "أنت بتشتغل صح",
];

const PHASE_COLORS: Record<Phase, string> = {
  inhale: "#2dd4bf",   // teal
  hold:   "#818cf8",   // indigo
  exhale: "#f5a623",   // amber
};

const PHASE_LABELS: Record<Phase, string> = {
  inhale: "شهيق",
  hold:   "ثبّت",
  exhale: "زفير",
};

export const BreathingOverlay: FC<BreathingOverlayProps> = ({
  onClose,
  autoCloseAfterCycles = DEFAULT_CYCLES,
}) => {
  const [phase, setPhase]             = useState<Phase>("inhale");
  const [cycleCount, setCycleCount]   = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0); 
  const [isIdle, setIsIdle]               = useState(false);
  const markBreathingUsed = useAchievementState((s) => s.markBreathingUsed);

  useEffect(() => { markBreathingUsed(); }, [markBreathingUsed]);

  // Idle tracking for Invisible UI
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const handleActivity = () => {
      setIsIdle(false);
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsIdle(true), 3500); // 3.5s of no mouse movement -> hide UI
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('keydown', handleActivity);

    timeout = setTimeout(() => setIsIdle(true), 4000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      clearTimeout(timeout);
    };
  }, []);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const oscLRef = useRef<OscillatorNode | null>(null);
  const oscRRef = useRef<OscillatorNode | null>(null);

  // Phase sequencer & Audio Engine
  useEffect(() => {
    let startedAt = Date.now();
    let currentPhase: Phase = "inhale";
    let currentCycles = 0;

    // --- Audio Init (Binaural Beats: 174Hz base, 5Hz difference for Theta state) ---
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const mg = ctx.createGain();
      mg.gain.value = 0;
      mg.connect(ctx.destination);
      masterGainRef.current = mg;

      const oscL = ctx.createOscillator();
      oscL.type = "sine";
      oscL.frequency.value = 170; // Start low

      const oscR = ctx.createOscillator();
      oscR.type = "sine";
      oscR.frequency.value = 175;

      if (ctx.createStereoPanner) {
        const panL = ctx.createStereoPanner();
        panL.pan.value = -1;
        oscL.connect(panL);
        panL.connect(mg);

        const panR = ctx.createStereoPanner();
        panR.pan.value = 1;
        oscR.connect(panR);
        panR.connect(mg);
      } else {
        oscL.connect(mg);
        oscR.connect(mg);
      }

      oscL.start();
      oscR.start();
      oscLRef.current = oscL;
      oscRRef.current = oscR;

      // First Inhale Audio Ramp
      mg.gain.setValueAtTime(0, ctx.currentTime);
      mg.gain.linearRampToValueAtTime(0.08, ctx.currentTime + (INHALE_MS / 1000));
      oscL.frequency.linearRampToValueAtTime(174, ctx.currentTime + (INHALE_MS / 1000));
      oscR.frequency.linearRampToValueAtTime(179, ctx.currentTime + (INHALE_MS / 1000));
    }

    // Initial haptic feedback
    if (typeof window !== "undefined" && navigator && navigator.vibrate) {
      navigator.vibrate([15, 40, 20]);
    }

    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const phaseDuration =
        currentPhase === "inhale" ? INHALE_MS :
        currentPhase === "hold"   ? HOLD_MS :
                                    EXHALE_MS;

      const progress = Math.min(elapsed / phaseDuration, 1);
      setPhaseProgress(progress);

      if (elapsed >= phaseDuration) {
        startedAt = Date.now();
        const ctx = audioCtxRef.current;
        const mg = masterGainRef.current;
        const oL = oscLRef.current;
        const oR = oscRRef.current;

        if (currentPhase === "inhale") {
          currentPhase = "hold";
          if (typeof window !== "undefined" && navigator && navigator.vibrate) navigator.vibrate(15);
          
          if (ctx && mg) {
             mg.gain.cancelScheduledValues(ctx.currentTime);
             mg.gain.setValueAtTime(mg.gain.value, ctx.currentTime);
             mg.gain.linearRampToValueAtTime(0.08, ctx.currentTime + (HOLD_MS / 1000));
          }
        } else if (currentPhase === "hold") {
          currentPhase = "exhale";
          if (typeof window !== "undefined" && navigator && navigator.vibrate) navigator.vibrate([20, 30, 15]);
          
          if (ctx && mg && oL && oR) {
             mg.gain.cancelScheduledValues(ctx.currentTime);
             mg.gain.setValueAtTime(mg.gain.value, ctx.currentTime);
             mg.gain.linearRampToValueAtTime(0.02, ctx.currentTime + (EXHALE_MS / 1000));
             
             oL.frequency.cancelScheduledValues(ctx.currentTime);
             oR.frequency.cancelScheduledValues(ctx.currentTime);
             oL.frequency.setValueAtTime(oL.frequency.value, ctx.currentTime);
             oR.frequency.setValueAtTime(oR.frequency.value, ctx.currentTime);
             oL.frequency.linearRampToValueAtTime(170, ctx.currentTime + (EXHALE_MS / 1000));
             oR.frequency.linearRampToValueAtTime(175, ctx.currentTime + (EXHALE_MS / 1000));
          }
        } else {
          currentPhase = "inhale";
          currentCycles += 1;
          setCycleCount(currentCycles);
          
          if (autoCloseAfterCycles > 0 && currentCycles >= autoCloseAfterCycles) {
            onClose();
            return;
          }
          
          if (typeof window !== "undefined" && navigator && navigator.vibrate) navigator.vibrate([15, 40, 20]);
          
          if (ctx && mg && oL && oR) {
             mg.gain.cancelScheduledValues(ctx.currentTime);
             mg.gain.setValueAtTime(mg.gain.value, ctx.currentTime);
             mg.gain.linearRampToValueAtTime(0.08, ctx.currentTime + (INHALE_MS / 1000));
             
             oL.frequency.cancelScheduledValues(ctx.currentTime);
             oR.frequency.cancelScheduledValues(ctx.currentTime);
             oL.frequency.setValueAtTime(oL.frequency.value, ctx.currentTime);
             oR.frequency.setValueAtTime(oR.frequency.value, ctx.currentTime);
             oL.frequency.linearRampToValueAtTime(174, ctx.currentTime + (INHALE_MS / 1000));
             oR.frequency.linearRampToValueAtTime(179, ctx.currentTime + (INHALE_MS / 1000));
          }
        }
        setPhase(currentPhase);
        setPhaseProgress(0);
      }
    };

    const interval = setInterval(tick, 50);
    
    return () => {
      clearInterval(interval);
      if (audioCtxRef.current && masterGainRef.current) {
        const ctx = audioCtxRef.current;
        masterGainRef.current.gain.cancelScheduledValues(ctx.currentTime);
        masterGainRef.current.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
        setTimeout(() => {
          if (ctx.state !== "closed") {
            ctx.close().catch(console.error);
          }
        }, 1100);
      }
    };
  }, [autoCloseAfterCycles, onClose]);

  const accentColor = PHASE_COLORS[phase];

  // Scale for the inner orb (Fluid Geometry)
  // Inhale expands greatly, Hold holds it, Exhale shrinks it smoothly.
  const orbScale =
    phase === "inhale" ? 0.8 + phaseProgress * 0.8 :  // 0.8 → 1.6
    phase === "hold"   ? 1.6 :
                        1.6 - phaseProgress * 0.8;      // 1.6 → 0.8

  const phraseIndex = Math.min(cycleCount, CYCLE_PHRASES.length - 1);
  const showUI = !isIdle || cycleCount === 0;

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col items-center justify-between"
      style={{ background: "#010207", colorScheme: "dark" }}
      role="dialog"
      aria-modal="true"
      aria-label="الملاذ الآمن"
      dir="rtl"
    >
      {/* Deep ambient orb - matches accent color */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          width: "120vw",
          height: "120vh",
          background: `radial-gradient(circle at 50% 50%, ${accentColor}0a 0%, transparent 60%)`,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          transition: "background 3s ease-in-out",
          pointerEvents: "none",
          zIndex: 0
        }}
      />

      {/* Top bar */}
      <motion.div 
        className="w-full flex items-center justify-between px-6 pt-8 pb-4 relative z-10"
        animate={{ opacity: showUI ? 1 : 0 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      >
        <div
          className="text-[10px] font-black uppercase tracking-[0.3em]"
          style={{ color: "rgba(148,163,184,0.3)" }}
        >
          الملاذ
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all hover:bg-white/5"
          style={{
            border: "1px solid rgba(255,255,255,0.04)",
            color: "rgba(148,163,184,0.4)"
          }}
          aria-label="إغلاق"
        >
          <X className="w-3.5 h-3.5" />
          <span className="text-[10px] font-black tracking-widest uppercase">الخروج</span>
        </button>
      </motion.div>

      {/* Central breathing engine */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 w-full max-w-sm">

        {/* Phase label */}
        <AnimatePresence mode="popLayout">
          {showUI && (
            <motion.div
              key="phase-labels"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10, transition: { duration: 1 } }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center absolute top-20 left-0 right-0"
            >
              <AnimatePresence mode="wait">
                <motion.p
                  key={phase}
                  initial={{ opacity: 0, filter: "blur(4px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(4px)" }}
                  transition={{ duration: 0.6 }}
                  className="text-4xl font-black tracking-tight mb-1"
                  style={{ color: accentColor, textShadow: `0 0 30px ${accentColor}50` }}
                >
                  {PHASE_LABELS[phase]}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fluid Geometry Orb */}
        <div className="relative flex items-center justify-center w-[280px] h-[280px]">
          {/* Base Glow */}
          <motion.div
            animate={{ scale: orbScale * 0.9 }}
            transition={{ duration: 0.05, ease: "linear" }}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${accentColor}15 0%, transparent 70%)`,
              filter: "blur(30px)",
              transition: "background 2s ease"
            }}
          />
          
          {/* Core Shape */}
          <motion.div
            animate={{ scale: orbScale }}
            transition={{ duration: 0.05, ease: "linear" }}
            style={{
              width: "50%",
              height: "50%",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${accentColor}30 0%, ${accentColor}00 80%)`,
              border: `1px solid ${accentColor}20`,
              boxShadow: `0 0 60px ${accentColor}30, inset 0 0 40px ${accentColor}20`,
              transition: "background 2s ease, border-color 2s ease, box-shadow 2s ease"
            }}
          />

          {/* Innermost intense core */}
          <motion.div
            animate={{ scale: orbScale * 0.6, opacity: phase === "inhale" ? 0.8 : 0.4 }}
            transition={{ duration: 0.05, ease: "linear" }}
            style={{
              position: "absolute",
              width: "30%",
              height: "30%",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${accentColor}50 0%, transparent 60%)`,
              filter: "blur(10px)",
              transition: "background 2s ease"
            }}
          />
        </div>

        {/* Cycle phrase - completely fades when idle */}
        <AnimatePresence mode="popLayout">
          {showUI && cycleCount > 0 && (
            <motion.p
              key={phraseIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 1 } }}
              transition={{ duration: 1.2 }}
              className="text-sm font-medium text-center absolute bottom-24 left-0 right-0"
              style={{ color: "rgba(148,163,184,0.4)" }}
            >
              {CYCLE_PHRASES[phraseIndex]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom: cycle dots */}
      <motion.div 
        className="w-full flex flex-col items-center px-6 pb-12 relative z-10"
        animate={{ opacity: showUI ? 1 : 0 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      >
        {/* Cycle counter dots - intentionally subtle */}
        <div className="flex items-center gap-4">
          {Array.from({ length: autoCloseAfterCycles }).map((_, i) => (
            <motion.div
              key={i}
              animate={{
                background: i < cycleCount
                  ? `${accentColor}80`  // completed
                  : i === cycleCount
                    ? `${accentColor}40` // current
                    : "rgba(255,255,255,0.06)", // pending
                scale: i === cycleCount ? 1.4 : 1
              }}
              transition={{ duration: 0.8 }}
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                boxShadow: i < cycleCount ? `0 0 10px ${accentColor}40` : "none"
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};
