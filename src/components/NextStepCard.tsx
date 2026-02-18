import type { FC } from "react";
import { motion } from "framer-motion";
import type { NextStepDecisionV1 } from "../modules/recommendation/types";

interface NextStepCardProps {
  decision: NextStepDecisionV1;
  onTakeAction: (decision: NextStepDecisionV1) => void;
  onRefresh: () => void;
}

const riskColors: Record<NextStepDecisionV1["riskBand"], string> = {
  high: "rgba(248, 113, 113, 0.16)",
  medium: "rgba(251, 191, 36, 0.16)",
  low: "rgba(45, 212, 191, 0.16)"
};

export const NextStepCard: FC<NextStepCardProps> = ({ decision, onTakeAction, onRefresh }) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 mx-auto max-w-md rounded-2xl border px-4 py-4 text-right"
      style={{
        background: riskColors[decision.riskBand],
        borderColor: "rgba(255,255,255,0.18)",
        backdropFilter: "blur(10px)"
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
          الخطوة التالية الآن
        </p>
        <span className="text-[10px] rounded-full px-2 py-0.5 bg-slate-900/50 text-slate-200">
          {decision.source === "cloud_ranker" ? "AI" : "Template"}
        </span>
      </div>

      <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
        {decision.action.title}
      </p>
      <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {decision.action.message}
      </p>

      <div className="mt-3 rounded-xl border border-dashed border-white/20 px-3 py-2">
        <p className="text-[11px] font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
          لماذا الآن؟
        </p>
        <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
          {decision.why.headline}
        </p>
        <ul className="mt-1 flex flex-wrap gap-1">
          {decision.why.reasons.map((reason) => (
            <li
              key={`${reason.code}-${reason.value ?? ""}`}
              className="text-[10px] rounded-full px-2 py-0.5 bg-slate-900/35 text-slate-100"
            >
              {reason.label}
              {reason.value ? ` (${reason.value})` : ""}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onTakeAction(decision)}
          className="w-full rounded-xl px-3 py-2 text-sm font-semibold cta-primary"
        >
          {decision.action.cta}
        </button>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-xl px-3 py-2 text-xs font-semibold border border-white/20 text-slate-200 hover:bg-white/10"
        >
          تحديث
        </button>
      </div>
    </motion.section>
  );
};
