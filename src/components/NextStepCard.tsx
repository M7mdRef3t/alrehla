import type { FC } from "react";
import { motion } from "framer-motion";
import type { NextStepDecisionV1 } from "../modules/recommendation/types";
import { Sparkles, BrainCircuit, Compass, RefreshCw, ChevronLeft } from "lucide-react";

interface NextStepCardProps {
  decision: NextStepDecisionV1;
  onTakeAction: (decision: NextStepDecisionV1) => void;
  onRefresh: () => void;
}

const riskStyles: Record<NextStepDecisionV1["riskBand"], { wrapper: string, badge: string, icon: string, text: string }> = {
  high: {
    wrapper: "bg-red-950/20 border-red-500/30 shadow-[0_0_20px_-5px_rgba(239,68,68,0.2)] shadow-inner",
    badge: "bg-red-500/20 text-red-300 border-red-500/30",
    icon: "text-red-400",
    text: "text-red-50"
  },
  medium: {
    wrapper: "bg-amber-950/20 border-amber-500/30 shadow-[0_0_20px_-5px_rgba(245,158,11,0.15)] shadow-inner",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    icon: "text-amber-400",
    text: "text-amber-50"
  },
  low: {
    wrapper: "bg-emerald-950/20 border-emerald-500/30 shadow-[0_0_20px_-5px_rgba(16,185,129,0.15)] shadow-inner",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    icon: "text-emerald-400",
    text: "text-emerald-50"
  }
};

export const NextStepCard: FC<NextStepCardProps> = ({ decision, onTakeAction, onRefresh }) => {
  const isAI = decision.source.includes("cloud_ranker");
  const style = riskStyles[decision.riskBand];

  return (
    <motion.section
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`mx-auto w-full rounded-[1.5rem] border backdrop-blur-xl p-5 text-right relative overflow-hidden transition-all duration-300 ${style.wrapper}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none" />
      
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4 relative z-10 border-b border-white/5 pb-3">
        <h3 className="text-xs font-black flex items-center gap-2 text-white/50 tracking-wide uppercase">
          <Sparkles className={`w-3.5 h-3.5 ${style.icon}`} />
          خطوتك التالية
        </h3>
        <span className={`text-[10px] font-bold rounded-full px-2.5 py-1 flex items-center gap-1.5 border ${style.badge}`}>
          {isAI ? <BrainCircuit className="w-3 h-3" /> : <Compass className="w-3 h-3" />}
          {isAI ? "تحليل ذكي" : "مسار مقترح"}
        </span>
      </div>

      {/* Main Content */}
      <div className="relative z-10 mb-5">
        <p className={`text-xl font-bold mb-2 leading-snug ${style.text}`}>
          {decision.action.title}
        </p>
        <p className="text-sm leading-relaxed text-white/60">
          {decision.action.message}
        </p>
      </div>

      {/* Why Section */}
      {!decision.action.id.includes("add_first_person") && (
        <div className="mb-6 rounded-xl border border-white/5 bg-black/20 p-4 relative z-10">
          <p className="text-[11px] font-bold mb-2 uppercase tracking-wide text-white/30">
            لماذا الآن؟
          </p>
          <p className="text-sm font-medium text-white/80 mb-3">
            {decision.why.headline}
          </p>
          <ul className="flex flex-wrap gap-2">
            {decision.why.reasons.map((reason) => (
              <li
                key={`${reason.code}-${reason.value ?? ""}`}
                className="text-[10px] rounded-md px-2.5 py-1.5 bg-white/5 text-white/60 border border-white/5 font-medium flex items-center"
              >
                {reason.label}
                {reason.value && <span className="mr-1.5 opacity-40 font-bold bg-white/10 px-1 rounded">({reason.value})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 relative z-10">
        <button
          type="button"
          onClick={() => onTakeAction(decision)}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-extrabold bg-white text-slate-900 hover:bg-slate-200 transition-colors shadow-lg hover:shadow-xl"
        >
          {decision.action.cta}
          <ChevronLeft className="w-4 h-4" />
        </button>
        {!decision.action.id.includes("add_first_person") && (
          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center justify-center rounded-xl p-3.5 border border-white/10 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
            title="تحديث الاقتراح"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        )}
      </div>
    </motion.section>
  );
};
