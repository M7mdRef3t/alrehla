import type { FC } from "react";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";

interface InsightCardsProps {
  result: {
    understanding_title: string;
    understanding_body: string;
    explanation_title: string;
    explanation_body: string;
    suggested_zone_title: string;
    suggested_zone_label: string;
    suggested_zone_body: string;
  };
  displayName: string;
  onShowScripts: () => void;
}

export const InsightCards: FC<InsightCardsProps> = ({
  result,
  displayName,
  onShowScripts
}) => {
  return (
    <div className="grid grid-cols-1 gap-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
        className="px-8 py-8 rounded-[3rem] bg-[var(--page-surface-2)] border border-blue-500/10 text-right shadow-2xl backdrop-blur-md"
      >
        <h3 className="text-sm font-black text-blue-400 mb-4 flex items-center gap-2">
          <span className="text-xl">🔍</span> {result.understanding_title}
        </h3>
        <p className="text-base text-slate-300 leading-relaxed font-medium">{result.understanding_body}</p>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.2 }}
        className="px-8 py-8 rounded-[3rem] bg-[var(--page-surface-2)] border border-violet-500/10 text-right shadow-2xl backdrop-blur-md"
      >
        <h3 className="text-sm font-black text-violet-400 mb-4 flex items-center gap-2">
          <span className="text-xl">✨</span> {result.explanation_title}
        </h3>
        <p className="text-base text-[var(--consciousness-text-muted)] font-medium leading-relaxed">{result.explanation_body}</p>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.4 }}
        className="px-8 py-8 rounded-[3rem] bg-[var(--page-surface-2)] border border-indigo-500/20 text-right shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-[50px]" />
        <h3 className="text-sm font-black text-indigo-400 mb-2 flex items-center gap-2">
          <span className="text-xl">🎯</span> {result.suggested_zone_title}
        </h3>
        <p className="text-2xl font-black text-[var(--consciousness-text)] mb-3">{result.suggested_zone_label}</p>
        <p className="text-base text-[var(--consciousness-text-muted)] font-medium leading-relaxed mb-8">{result.suggested_zone_body}</p>
        <button 
           onClick={onShowScripts} 
           className="w-full py-5 bg-[var(--page-surface-2)] hover:bg-[var(--page-bg-alt)] border border-[var(--page-border)] text-[var(--consciousness-text)] rounded-2xl text-sm font-black flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg"
        >
          <BookOpen className="w-5 h-5 text-indigo-400" />
          الموسوعة: جمل جاهزة للرد على {displayName}
        </button>
      </motion.div>
    </div>
  );
};
