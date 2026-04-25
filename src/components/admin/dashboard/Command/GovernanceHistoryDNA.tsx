import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  ShieldCheck, 
  AlertTriangle, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Fingerprint
} from "lucide-react";
import { type AIDecision } from "@/ai/decision-framework";

interface GovernanceHistoryDNAProps {
  decisions: AIDecision[];
}

export const GovernanceHistoryDNA: React.FC<GovernanceHistoryDNAProps> = ({ decisions }) => {
  const sortedDecisions = useMemo(() => 
    [...decisions].sort((a, b) => b.timestamp - a.timestamp), 
    [decisions]
  );

  return (
    <div className="relative py-12 px-4" dir="rtl">
      {/* ── Central DNA Backbone ─────────────────────────────────────────── */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-teal-500/20 to-transparent -translate-x-1/2 hidden md:block" />
      
      <div className="space-y-12 relative z-10">
        <AnimatePresence mode="popLayout">
          {sortedDecisions.map((decision, index) => (
            <DNANode 
              key={decision.id || index} 
              decision={decision} 
              isEven={index % 2 === 0} 
            />
          ))}
        </AnimatePresence>
      </div>

      {sortedDecisions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Fingerprint className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-sm font-bold tracking-widest uppercase italic">سجل القيادة فارغ حالياً</p>
        </div>
      )}
    </div>
  );
};

interface DNANodeProps {
  decision: AIDecision;
  isEven: boolean;
}

const DNANode: React.FC<DNANodeProps> = ({ decision, isEven }) => {
  const getStatusConfig = () => {
    switch (decision.outcome) {
      case "executed":
        return { color: "text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/30", icon: <CheckCircle2 className="w-4 h-4" /> };
      case "pending_approval":
        return { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: <Clock className="w-4 h-4 animate-pulse" /> };
      case "rejected":
        return { color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30", icon: <XCircle className="w-4 h-4" /> };
      default:
        return { color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/30", icon: <ShieldCheck className="w-4 h-4" /> };
    }
  };

  const config = getStatusConfig();
  const dateStr = new Date(decision.timestamp).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' });
  const payloadText = decision.payload ? JSON.stringify(decision.payload) : "";

  return (
    <motion.div
      initial={{ opacity: 0, x: isEven ? 50 : -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`flex items-center gap-8 ${isEven ? "md:flex-row" : "md:flex-row-reverse"}`}
    >
      {/* ── Content Card ────────────────────────────────────────────────── */}
      <div className={`flex-1 ${isEven ? "text-left md:text-left" : "text-left md:text-right"}`}>
        <div className={`
          inline-block p-6 rounded-[2rem] border backdrop-blur-xl transition-all duration-500
          ${config.bg} ${config.border} hover:border-teal-500/50 group
        `}>
          <div className={`flex items-center gap-3 mb-2 ${isEven ? "justify-start" : "justify-start md:justify-end"}`}>
             <span className={`text-[10px] font-black uppercase tracking-widest ${config.color}`}>
               {decision.outcome?.replace("_", " ")}
             </span>
             <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${config.bg} ${config.border}`}>
               {config.icon}
             </div>
          </div>

          <h4 className="text-sm font-black text-white mb-2 leading-tight">
            {decision.reasoning}
          </h4>
          
          <div className="flex items-center gap-4 text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">
            <span>{decision.type.replace("_", " ")}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {dateStr}
            </span>
          </div>

          {payloadText && (
            <div className="mt-4 p-3 rounded-xl bg-black/40 border border-white/5 text-[10px] font-mono text-teal-500/70 overflow-hidden whitespace-nowrap overflow-ellipsis">
              {payloadText}
            </div>
          )}
        </div>
      </div>

      {/* ── Central Node Point ─────────────────────────────────────────── */}
      <div className="relative z-10 hidden md:block">
        <div className={`w-4 h-4 rounded-full border-2 bg-slate-950 ${config.border.replace("30", "100")} shadow-[0_0_15px_rgba(20,184,166,0.3)]`}>
           <motion.div 
             animate={{ scale: [1, 1.5, 1] }}
             transition={{ duration: 2, repeat: Infinity }}
             className={`w-full h-full rounded-full ${config.color.replace("text-", "bg-")} opacity-40`}
           />
        </div>
        {/* Connecting Line to Spine */}
        <div className={`absolute top-1/2 w-8 h-px bg-gradient-to-r from-transparent to-teal-500/40 -translate-y-1/2 ${isEven ? "-left-8" : "-right-8 rotate-180"}`} />
      </div>

      {/* ── Visual Spacer for desktop ───────────────────────────────────── */}
      <div className="flex-1 hidden md:block" />
    </motion.div>
  );
};
