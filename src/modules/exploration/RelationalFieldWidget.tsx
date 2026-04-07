import type { FC } from "react";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Activity, Waves, Zap } from "lucide-react";
import { getDawayirSignalHistory } from "../recommendation/recommendationBus";
import { calculateEntropy } from "@/services/predictiveEngine";
import { buildRelationalFieldSnapshot } from "@/services/relationalFieldEngine";
import { getRecentJourneyEvents } from "@/services/journeyTracking";
import { useMapState } from "@/state/mapState";
import { usePulseState } from "@/state/pulseState";
import { useShadowPulseState } from "@/state/shadowPulseState";

const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function toneForPain(pain: number): {
  accent: string;
  background: string;
  border: string;
  label: string;
} {
  if (pain >= 70) {
    return {
      accent: "#f87171",
      background: "rgba(248,113,113,0.08)",
      border: "rgba(248,113,113,0.22)",
      label: "ضغط عالي"
    };
  }
  if (pain >= 45) {
    return {
      accent: "#fbbf24",
      background: "rgba(251,191,36,0.08)",
      border: "rgba(251,191,36,0.22)",
      label: "ضغط متوسط"
    };
  }
  return {
    accent: "#34d399",
    background: "rgba(52,211,153,0.08)",
    border: "rgba(52,211,153,0.22)",
    label: "استقرار جيد"
  };
}

function signed(value: number): string {
  if (value > 0) return `+${value}`;
  return `${value}`;
}

export const RelationalFieldWidget: FC = () => {
  const nodes = useMapState((state) => state.nodes);
  const pulses = usePulseState((state) => state.logs);
  const shadowScores = useShadowPulseState((state) => state.scores);

  const snapshot = useMemo(() => {
    const entropy = calculateEntropy();
    return buildRelationalFieldSnapshot({
      nodes,
      pulses,
      signals: getDawayirSignalHistory(WINDOW_MS),
      journeyEvents: getRecentJourneyEvents(1200),
      shadowScores,
      entropyScore: entropy.entropyScore
    });
  }, [nodes, pulses, shadowScores]);
  const activeNodes = nodes.filter((node) => !node.isNodeArchived);
  if (activeNodes.length === 0) return null;

  const tone = toneForPain(snapshot.pain.painFieldIntensity);
  const recommended = snapshot.twin.recommended;

  return (
    <motion.div
      className="rounded-2xl p-4 text-right w-full"
      style={{
        background: tone.background,
        border: `1px solid ${tone.border}`
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[11px] font-bold px-2 py-0.5 rounded-full"
          style={{ color: tone.accent, background: `${tone.accent}18` }}
        >
          {tone.label}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold" style={{ color: "rgba(148,163,184,0.68)" }}>
            Relational Field
          </span>
          <Waves className="w-3.5 h-3.5" style={{ color: tone.accent }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div
          className="rounded-xl px-2.5 py-2 text-center"
          style={{ background: "rgba(15,23,42,0.45)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-[10px]" style={{ color: "rgba(148,163,184,0.8)" }}>PFI</p>
          <p className="text-sm font-bold" style={{ color: tone.accent }}>
            {snapshot.pain.painFieldIntensity}
          </p>
        </div>
        <div
          className="rounded-xl px-2.5 py-2 text-center"
          style={{ background: "rgba(15,23,42,0.45)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-[10px]" style={{ color: "rgba(148,163,184,0.8)" }}>RM</p>
          <p
            className="text-sm font-bold"
            style={{ color: snapshot.pain.recoveryMomentum >= 0 ? "#2dd4bf" : "#f97316" }}
          >
            {signed(snapshot.pain.recoveryMomentum)}
          </p>
        </div>
        <div
          className="rounded-xl px-2.5 py-2 text-center"
          style={{ background: "rgba(15,23,42,0.45)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-[10px]" style={{ color: "rgba(148,163,184,0.8)" }}>PD</p>
          <p className="text-sm font-bold" style={{ color: "#a78bfa" }}>
            {snapshot.pain.painDividend}
          </p>
        </div>
      </div>

      <div className="mb-3 rounded-xl px-3 py-2" style={{ background: "rgba(15,23,42,0.4)" }}>
        <p className="text-[11px] mb-1" style={{ color: "rgba(203,213,225,0.86)" }}>
          تدفق العلاقة: الداخل {Math.round(snapshot.flow.inflow * 100)}% | الخارج {Math.round(snapshot.flow.outflow * 100)}%
        </p>
        <p className="text-[11px]" style={{ color: "rgba(148,163,184,0.76)" }}>
          التذبذب: {Math.round(snapshot.flow.oscillationIndex * 100)}%
          {snapshot.flow.dominantFrequencyHours != null ? ` | تردد مهيمن كل ${snapshot.flow.dominantFrequencyHours} ساعة` : ""}
        </p>
      </div>

      <div className="mb-3 rounded-xl px-3 py-2.5" style={{ background: "rgba(15,23,42,0.4)" }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-semibold" style={{ color: "rgba(203,213,225,0.86)" }}>
            Hidden Pattern
          </span>
          <Activity className="w-3.5 h-3.5" style={{ color: tone.accent }} />
        </div>
        {snapshot.hiddenPattern ? (
          <>
            <p className="text-[12px]" style={{ color: "rgba(226,232,240,0.9)" }}>
              {snapshot.hiddenPattern.label}
            </p>
            <p className="text-[11px]" style={{ color: "rgba(148,163,184,0.74)" }}>
              ثقة {Math.round(snapshot.hiddenPattern.confidence * 100)}%
            </p>
          </>
        ) : (
          <p className="text-[11px]" style={{ color: "rgba(148,163,184,0.74)" }}>
            لا يوجد نمط متكرر واضح خلال آخر 7 أيام.
          </p>
        )}
      </div>

      <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(15,23,42,0.5)" }}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Zap className="w-3.5 h-3.5" style={{ color: "#22d3ee" }} />
          <p className="text-[11px] font-semibold" style={{ color: "rgba(203,213,225,0.88)" }}>
            Digital Twin Suggestion
          </p>
        </div>
        <p className="text-[12px] leading-relaxed" style={{ color: "rgba(226,232,240,0.92)" }}>
          {recommended.label}
        </p>
        <p className="text-[11px]" style={{ color: "rgba(148,163,184,0.74)" }}>
          التغير المتوقع في الألم: {signed(recommended.expectedPainDelta)} | الثقة {Math.round(recommended.confidence * 100)}%
        </p>
      </div>
    </motion.div>
  );
};
