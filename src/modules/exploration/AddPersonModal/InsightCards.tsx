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
        className="group relative px-10 py-10 rounded-[2.5rem] bg-gradient-to-br from-blue-500/[0.03] to-transparent border border-white/5 text-right shadow-2xl backdrop-blur-3xl overflow-hidden"
      >
        {/* HUD Corners */}
        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-blue-500/20 rounded-tr-xl group-hover:w-6 group-hover:h-6 transition-all" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-blue-500/20 rounded-bl-xl group-hover:w-6 group-hover:h-6 transition-all" />

        <h3 className="text-[10px] font-black text-blue-400/60 mb-6 flex items-center gap-3 uppercase tracking-[0.3em]">
          <span className="w-2 h-2 rounded-full bg-blue-500/40" /> {result.understanding_title}
        </h3>
        <p className="text-xl/relaxed text-white font-medium tracking-tight">{result.understanding_body}</p>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.2 }}
        className="group relative px-10 py-10 rounded-[2.5rem] bg-gradient-to-br from-violet-500/[0.03] to-transparent border border-white/5 text-right shadow-2xl backdrop-blur-3xl overflow-hidden"
      >
        {/* HUD Corners */}
        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-violet-500/20 rounded-tr-xl group-hover:w-6 group-hover:h-6 transition-all" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-violet-500/20 rounded-bl-xl group-hover:w-6 group-hover:h-6 transition-all" />

        <h3 className="text-[10px] font-black text-violet-400/60 mb-6 flex items-center gap-3 uppercase tracking-[0.3em]">
          <span className="w-2 h-2 rounded-full bg-violet-500/40" /> {result.explanation_title}
        </h3>
        <p className="text-xl/relaxed text-slate-200 font-medium tracking-tight">{result.explanation_body}</p>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.4 }}
        className="group relative px-10 py-10 rounded-[3rem] bg-slate-900/40 border border-indigo-500/20 text-right shadow-2xl overflow-hidden backdrop-blur-3xl"
      >
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
        
        <h3 className="text-[10px] font-black text-indigo-400 mb-4 flex items-center gap-3 uppercase tracking-[0.3em]">
          <span className="w-2 h-2 rounded-full bg-indigo-500" /> {result.suggested_zone_title}
        </h3>
        <p className="text-4xl font-black text-white mb-4 tracking-tighter">{result.suggested_zone_label}</p>
        <p className="text-lg text-slate-300 font-medium leading-relaxed mb-10 tracking-tight">{result.suggested_zone_body}</p>
        
        <button 
           onClick={onShowScripts} 
           className="group/btn relative w-full py-6 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-white rounded-[2rem] text-sm font-black flex items-center justify-center gap-4 transition-all active:scale-95 shadow-[0_0_20px_rgba(99,102,241,0.1)] hover:shadow-[0_0_40px_rgba(99,102,241,0.2)]"
        >
          <BookOpen className="w-5 h-5 text-indigo-400 group-hover/btn:scale-110 transition-transform" />
          <span className="tracking-widest uppercase">الموسوعة: جمل جاهزة للرد على {displayName}</span>
          
          {/* Animated border segment */}
          <div className="absolute inset-0 border border-indigo-400/50 rounded-[2rem] opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none" />
        </button>
      </motion.div>
    </div>
  );
};
