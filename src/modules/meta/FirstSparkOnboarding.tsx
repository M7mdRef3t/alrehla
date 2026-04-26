import { memo, useCallback, useTransition, type FC } from "react";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Zap, ArrowRight } from "lucide-react";

/* ════════════════════════════════════════════════
   FIRST SPARK — The Cinematic Launch
   CSS animations replace Framer Motion repeat:Infinity
   to avoid blocking the main thread on mount.
   ════════════════════════════════════════════════ */

const styles = `
@keyframes fso-float {
  0%, 100% { transform: translate(var(--dx0), var(--dy0)); opacity: 0.3; }
  50% { transform: translate(var(--dx1), var(--dy1)); opacity: 0.7; }
}
@keyframes fso-pulse-ring {
  0% { transform: scale(0.8); opacity: 0; }
  50% { opacity: 0.5; }
  100% { transform: scale(1.2); opacity: 0; }
}
@keyframes fso-pulse-dot {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}
@keyframes fso-orbit-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}
@keyframes fso-node-pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 10px var(--glow); }
  50% { transform: scale(1.1); box-shadow: 0 0 18px var(--glow); }
}
.fso-btn-tap:active { transform: scale(0.95); }
.fso-btn-hover:hover { transform: scale(1.05); }
`;

function seededUnit(index: number, salt: number) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function round(value: number, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

interface FirstSparkProps {
  onComplete: () => void;
  gateContext?: {
    message: string;
    painPoint?: string | null;
    intent?: string | null;
  } | null;
}

export const FirstSparkOnboarding: FC<FirstSparkProps> = memo(({ onComplete, gateContext = null }) => {
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  const [, startTransition] = useTransition();

  const nextStage = useCallback(() => {
    startTransition(() => {
      setStage((prev) => {
        if (prev === 0) return 1;
        if (prev === 1) return 2;
        return prev;
      });
    });
  }, []);

  const handleComplete = useCallback(() => {
    startTransition(() => {
      onComplete();
    });
  }, [onComplete]);

  return (
    <div className="relative w-full min-h-[500px] flex flex-col items-center justify-between py-6">
      <style>{styles}</style>
      {/* Background Ambience - static, no animation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/5 blur-[100px] rounded-full mix-blend-screen" />
      </div>

      {gateContext && stage === 0 && (
        <div className="relative z-10 mx-4 mb-2 w-full max-w-sm rounded-3xl border border-teal-400/20 bg-teal-500/8 px-4 py-3 text-right shadow-[0_0_25px_rgba(45,212,191,0.08)]">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-teal-300">Gate Signal</div>
          <p className="text-sm leading-relaxed text-slate-200">{gateContext.message}</p>
        </div>
      )}

      {stage === 0 && <StageChaos key="chaos" onNext={nextStage} gateContext={gateContext} />}
      {stage === 1 && <StageOrder key="order" onNext={nextStage} />}
      {stage === 2 && <StageValue key="value" onNext={handleComplete} />}

      {/* Progress Indicators */}
      <div className="flex gap-2 z-10 mt-6 pb-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-1 rounded-full transition-all duration-300"
            style={{
              width: i === stage ? 24 : 6,
              backgroundColor: i === stage ? "rgba(45, 212, 191, 1)" : "rgba(45, 212, 191, 0.15)"
            }}
          />
        ))}
      </div>
    </div>
  );
});
FirstSparkOnboarding.displayName = "FirstSparkOnboarding";

/* ── Stage 1: Chaos (The Reality Check) ── */
const StageChaos: FC<{ onNext: () => void; gateContext?: FirstSparkProps["gateContext"] }> = memo(({ onNext }) => {
  const dots = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: round((seededUnit(i, 1) - 0.5) * 280),
    y: round((seededUnit(i, 2) - 0.5) * 280),
    driftX: round((seededUnit(i, 5) - 0.5) * 40),
    driftY: round((seededUnit(i, 6) - 0.5) * 40),
    duration: round(2 + seededUnit(i, 7) * 2, 2),
    delay: round(seededUnit(i, 4) * 2, 2),
  })), []);

  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full relative">
      {/* Visual: Chaos */}
      <div className="relative w-64 h-64 flex items-center justify-center mb-6">
        {/* The User (Center) - CSS animation instead of Framer Motion repeat:Infinity */}
        <div
          className="w-4 h-4 rounded-full z-10"
          style={{
            animation: "fso-pulse-dot 2s ease-in-out infinite",
            background: "var(--text-primary)",
            boxShadow: "0 0 20px var(--soft-teal)"
          }}
        />

        {/* Chaotic Dots - pure CSS animations, zero JS overhead */}
        {dots.map((d) => (
          <div
            key={d.id}
            className="absolute w-2 h-2 rounded-full bg-slate-500/40"
            style={{
              "--dx0": `${d.x}px`,
              "--dy0": `${d.y}px`,
              "--dx1": `${d.x + d.driftX}px`,
              "--dy1": `${d.y + d.driftY}px`,
              animation: `fso-float ${d.duration}s ease-in-out infinite ${d.delay}s`,
              transform: `translate(${d.x}px, ${d.y}px)`,
            } as React.CSSProperties}
          />
        ))}

        {/* Pulse Waves - CSS animation */}
        <div
          className="absolute inset-0 border border-red-500/20 rounded-full"
          style={{ animation: "fso-pulse-ring 2s ease-in-out infinite" }}
        />
      </div>

      {/* Copy */}
      <div className="text-center px-6 max-w-sm z-10 pb-6">
        <h2 className="text-xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
          حاسس إنك ماشي في ضباب؟
        </h2>
        <p className="text-sm mb-10 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          حولك أوهام متنكرة في شكل حقائق.. المشكلة مش فيك — المشكلة إنك ما شفتش <span className="text-teal-400 font-bold">&quot;الحقيقة&quot;</span> لسه.
        </p>

        <button
          type="button"
          onClick={onNext}
          className="bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold py-3 px-8 rounded-full shadow-[0_0_20px_rgba(45,212,191,0.3)] fso-btn-tap fso-btn-hover transition-all"
        >
          ورّيني إزاي
        </button>
      </div>
    </div>
  );
});
StageChaos.displayName = "StageChaos";

/* ── Stage 2: Order (The Orbit Strategy) ── */
const StageOrder: FC<{ onNext: () => void }> = memo(({ onNext }) => {
  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full relative">
      {/* Visual: Orbits Clearing */}
      <div className="relative w-64 h-64 flex items-center justify-center mb-6">
        {/* Orbits - CSS pulse instead of Framer Motion repeat */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute rounded-full border"
            style={{
              width: i * 80,
              height: i * 80,
              borderColor: i === 1 ? "rgba(52,211,153,0.3)" : i === 2 ? "rgba(251,191,36,0.3)" : "rgba(248,113,113,0.3)",
              borderWidth: 1.5,
              animation: `fso-orbit-pulse ${2.5 + i * 0.5}s ease-in-out infinite ${i * 0.3}s`,
            }}
          />
        ))}

        {/* User */}
        <div className="w-3 h-3 rounded-full z-10" style={{ background: "var(--text-primary)" }} />

        {/* Dots aligning - enter-only animation (not infinite) */}
        <motion.div
          className="absolute w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]"
          initial={{ x: 80, y: -40, opacity: 0 }}
          animate={{ x: 28, y: -28, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6, type: "spring" }}
        />
        <motion.div
          className="absolute w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]"
          initial={{ x: -90, y: 80, opacity: 0 }}
          animate={{ x: -60, y: 60, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6, type: "spring" }}
        />
        <motion.div
          className="absolute w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_10px_rgba(248,113,113,0.6)]"
          initial={{ x: 120, y: 20, opacity: 0 }}
          animate={{ x: 100, y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6, type: "spring" }}
        />
      </div>

      {/* Copy */}
      <div className="text-center px-6 max-w-sm z-10 pb-6">
        <h2 className="text-xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
          هنكشف لك الحقيقة عن كل علاقة
        </h2>
        <p className="text-sm mb-10 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          كل حد ليه حقيقة.. يا إما <span className="text-emerald-400">نور حقيقي</span>، يا <span className="text-amber-400">ضباب يحتاج كشف</span>، يا <span className="text-rose-400">خداع مستتر</span>.
        </p>

        <button
          type="button"
          onClick={onNext}
          className="bg-transparent border border-teal-500/50 text-teal-400 hover:bg-teal-500/10 font-bold py-3 px-8 rounded-full fso-btn-tap fso-btn-hover transition-all"
        >
          وريني الخريطة
        </button>
      </div>
    </div>
  );
});
StageOrder.displayName = "StageOrder";

/* ── Stage 3: Value (Immediate Action) ── */
const StageValue: FC<{ onNext: () => void }> = memo(({ onNext }) => {
  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full relative">
      {/* Visual: Action & Alert */}
      <div className="relative w-64 h-64 flex items-center justify-center mb-6">
        {/* Red Orbit only */}
        <div className="absolute w-[240px] h-[240px] rounded-full border border-rose-500/30" />

        {/* Hand moving dot simulation - enter-only spring animation */}
        <motion.div
          className="absolute w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_15px_rgba(243,68,68,0.8)]"
          initial={{ x: 0, y: 0, scale: 0 }}
          animate={{ x: 85, y: -85, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
        />

        {/* Jarvis Alert Popup - enter-only, ALWAYS dark regardless of theme */}
        <motion.div
          className="absolute -bottom-4 border border-teal-500/30 p-3 rounded-xl backdrop-blur-md shadow-2xl flex items-center gap-3 w-60"
          style={{ background: "rgba(10, 14, 35, 0.95)" }}
          initial={{ y: 10, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, type: "spring" }}
        >
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-teal-400" />
          </div>
          <div className="text-right flex-1">
            <p className="text-[10px] text-teal-500 font-bold uppercase tracking-wider mb-0.5">نظام التوجيه</p>
            <p className="text-xs font-medium text-slate-200">لاحظنا علاقة مرهقة.. جاهزين نساعدك تتعامل معاها.</p>
          </div>
        </motion.div>
      </div>

      {/* Copy */}
      <div className="text-center px-6 max-w-sm z-10 pb-6">
        <h2 className="text-xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
          مش بس خريطة.. دي نور يكشف كل ظلام
        </h2>
        <p className="text-sm mb-10 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          هنساعدك تشوف حقيقة كل علاقة وتاخد <span className="font-bold" style={{ color: "var(--text-primary)" }}>&quot;قرارات بعلم&quot;</span> مش بوهم.
        </p>

        <button
          type="button"
          onClick={onNext}
          className="bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-900 font-bold py-3 px-8 rounded-full shadow-[0_0_25px_rgba(45,212,191,0.4)] flex items-center mx-auto gap-2 fso-btn-tap fso-btn-hover transition-all"
        >
          يلّا نبدأ <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});
StageValue.displayName = "StageValue";
