import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ClipboardList, Settings, Save, Loader2 } from 'lucide-react';

interface MapControlDockProps {
  onAnalyze: () => void;
  onPlan: () => void;
  onSettings: () => void;
  onSave: () => void;
  isAnalyzing?: boolean;
  isSaving?: boolean;
  canSave?: boolean;
}

export function MapControlDock({ 
  onAnalyze, 
  onPlan, 
  onSettings, 
  onSave,
  isAnalyzing,
  isSaving,
  canSave = true
}: MapControlDockProps) {
  return (
    <div className="fixed bottom-28 md:bottom-8 left-1/2 -translate-x-1/2 z-40 px-4 w-full max-w-lg" dir="rtl">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-2 flex items-center justify-between gap-1 shadow-2xl"
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

        {/* Plan Button */}
        <button
          onClick={onPlan}
          title="خطة العمل"
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-2xl hover:bg-white/5 transition-all group"
        >
          <ClipboardList className="w-5 h-5 text-purple-400 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.5)] transition-all" />
          <span className="text-[10px] font-black text-slate-300">الخطة</span>
        </button>

        <div className="w-px h-8 bg-white/5" />

        {/* Settings Button */}
        <button
          onClick={onSettings}
          title="الإعدادات"
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-2xl hover:bg-white/5 transition-all group"
        >
          <Settings className="w-5 h-5 text-slate-400 group-hover:rotate-45 transition-transform" />
          <span className="text-[10px] font-black text-slate-300">الإعدادات</span>
        </button>

        <div className="w-px h-8 bg-white/5" />

        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={isSaving || !canSave}
          title="حفظ الخريطة"
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-2xl hover:bg-white/5 transition-all group disabled:opacity-30"
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
          ) : (
            <Save className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
          )}
          <span className="text-[10px] font-black text-slate-300">حفظ</span>
        </button>
      </motion.div>
    </div>
  );
}
