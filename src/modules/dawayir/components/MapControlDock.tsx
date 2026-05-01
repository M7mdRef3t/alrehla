import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ClipboardList, Settings, Loader2, Hand, Mic } from 'lucide-react';

interface MapControlDockProps {
  onAnalyze: () => void;
  onPlan: () => void;
  onSave: () => void;
  onLive: () => void;
  isAnalyzing?: boolean;
  isSaving?: boolean;
  canSave?: boolean;
  isHandToolActive?: boolean;
  onToggleHandTool?: () => void;
}

export function MapControlDock({ 
  onAnalyze, 
  onPlan, 
  onSave,
  onLive,
  isAnalyzing,
  isSaving,
  canSave = true,
  isHandToolActive = false,
  onToggleHandTool
}: MapControlDockProps) {
  return (
    <div className="fixed bottom-28 md:bottom-8 left-1/2 -translate-x-1/2 z-40 px-4 w-full max-w-lg pointer-events-none" dir="rtl">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-2 flex items-center justify-between gap-1 shadow-2xl pointer-events-auto"
      >
        {/* Analysis Button */}
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing}
          title="تحليل الطاقة"
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-2xl hover:bg-white/5 transition-all group disabled:opacity-50"
        >
          {isAnalyzing ? (
            <Loader2 className="w-5 h-5 animate-spin text-teal-400" />
          ) : (
            <Sparkles className="w-5 h-5 text-teal-400 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(45,212,191,0.5)] transition-all" />
          )}
          <span className="text-[10px] font-black text-slate-300">التحليل</span>
        </button>

        <div className="w-px h-8 bg-white/5" />

        {/* Hand Tool (Pan Mode) */}
        <button
          onClick={onToggleHandTool}
          title={isHandToolActive ? "وضع تحريك الخريطة (مفعل)" : "تفعيل تحريك الخريطة"}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-2xl transition-all group ${
            isHandToolActive 
              ? "bg-amber-500/20 border-t border-amber-500/50 shadow-[inset_0_4px_20px_rgba(245,158,11,0.2)]" 
              : "hover:bg-white/5"
          }`}
        >
          <Hand className={`w-5 h-5 transition-transform ${isHandToolActive ? "text-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "text-slate-400 group-hover:scale-110"}`} />
          <span className={`text-[10px] font-black ${isHandToolActive ? "text-amber-300" : "text-slate-300"}`}>تحريك</span>
        </button>

        <div className="w-px h-8 bg-white/5" />

        {/* ✨ Live AI Button — Central CTA */}
        <button
          onClick={() => {
            console.log('[MapControlDock] onLive clicked!');
            onLive();
          }}
          title="جلسة الوعي المباشرة"
          className="relative flex-shrink-0 w-14 h-14 rounded-full flex flex-col items-center justify-center gap-0.5 transition-all group
            bg-gradient-to-br from-teal-500/30 to-indigo-500/30
            border border-teal-400/40
            shadow-[0_0_20px_rgba(45,212,191,0.25)]
            hover:shadow-[0_0_30px_rgba(45,212,191,0.45)]
            hover:scale-110 active:scale-95"
        >
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-6 h-6 flex items-center justify-center"
          >
            <Mic className="w-5 h-5 text-teal-300 drop-shadow-[0_0_6px_rgba(45,212,191,0.8)]" />
          </motion.div>
          <span className="text-[8px] font-black text-teal-300 tracking-wider">LIVE</span>
        </button>

        <div className="w-px h-8 bg-white/5" />

        {/* Plan Button */}
        <button
          onClick={onPlan}
          title="خطة العمل"
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-2xl hover:bg-white/5 transition-all group"
        >
          <ClipboardList className="w-5 h-5 text-purple-400 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.5)] transition-all" />
          <span className="text-[10px] font-black text-slate-300">الخطة</span>
        </button>


      </motion.div>
    </div>
  );
}
