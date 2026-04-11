import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Network, Zap, Shield, Activity, Fingerprint } from "lucide-react";
import { useAppOverlayState } from "@/domains/consciousness/store/overlay.store";

export function VanguardCollective() {
  const closeOverlay = useAppOverlayState((s) => s.closeOverlay);
  const [isPinging, setIsPinging] = useState(false);

  const handlePing = () => {
    setIsPinging(true);
    setTimeout(() => setIsPinging(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6"
      style={{ background: "rgba(10, 5, 15, 0.85)" }}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-5xl h-[85vh] flex flex-col rounded-3xl overflow-hidden border border-purple-900/40 bg-slate-900/90 shadow-[0_30px_60px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)]"
      >
        {/* Ambient Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Header Section */}
        <div className="relative z-10 px-8 pt-8 pb-6 border-b border-purple-900/30 shrink-0 flex items-start justify-between">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.15)] relative group">
              <div className="absolute -inset-1 bg-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <Network className="w-8 h-8 text-purple-400 relative z-10" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white mb-1 tracking-tight flex items-center gap-3">
                مجتمع الثنائي - الطليعة
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> متزامن
                </span>
              </h1>
              <p className="text-purple-200/60 text-sm font-medium">الارتباط الروحي والمعرفي بين الثنائي لتحصين المسار المشترك.</p>
            </div>
          </div>
          
          <button
            onClick={() => closeOverlay("vanguardCollective")}
            className="p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-purple-900/50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Area */}
        <div className="relative z-10 flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Sync Visualizer */}
            <div className="col-span-1 md:col-span-3 h-64 rounded-3xl bg-slate-900/50 border border-purple-500/20 relative overflow-hidden flex items-center justify-center">
              
              {/* Dynamic Connection Line */}
              <div className="absolute inset-0 flex items-center justify-center opacity-30">
                <svg width="100%" height="100%" className="absolute inset-0">
                  <path 
                    d="M 100 128 Q 400 128 800 128" 
                    fill="none" 
                    stroke="rgba(168,85,247,0.3)" 
                    strokeWidth="2" 
                    strokeDasharray="4 4"
                    className="animate-[dash_20s_linear_infinite]" 
                  />
                  {isPinging && (
                     <motion.path 
                       d="M 100 128 Q 400 128 800 128" 
                       fill="none" 
                       stroke="rgba(168,85,247,0.8)" 
                       strokeWidth="4"
                       initial={{ pathLength: 0, opacity: 1 }}
                       animate={{ pathLength: 1, opacity: 0 }}
                       transition={{ duration: 1.5, ease: "circOut" }}
                     />
                  )}
                </svg>
              </div>

              {/* Nodes */}
              <div className="relative z-10 flex items-center justify-between w-full max-w-2xl px-12">
                {/* Current User */}
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.3)] flex items-center justify-center relative">
                    <Fingerprint className="w-8 h-8 text-purple-300" />
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                      <Shield className="w-3 h-3 text-slate-900" />
                    </div>
                  </div>
                  <span className="mt-4 font-bold text-white tracking-wide">أنت</span>
                </div>

                {/* Ping Button / Central Core */}
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePing}
                  className="w-16 h-16 flex items-center justify-center rounded-full bg-purple-600 shadow-[0_0_40px_rgba(168,85,247,0.6)] cursor-pointer hover:bg-purple-500 transition-colors z-20"
                >
                  <Zap className={`w-6 h-6 text-white ${isPinging ? 'animate-bounce' : ''}`} />
                </motion.button>

                {/* Duo Partner */}
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-600 shadow-xl flex items-center justify-center relative opacity-80">
                    <Fingerprint className="w-8 h-8 text-slate-400" />
                    <div className="absolute -bottom-2 -left-2 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900" />
                  </div>
                  <span className="mt-4 font-bold text-slate-300 tracking-wide">الحليف</span>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/60 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-300">قوة التزامن</h3>
              </div>
              <div className="text-4xl font-extrabold text-white mb-2">92%</div>
              <p className="text-xs text-slate-500">حالة ممتازة بناءً على نشاط الأسبوع الماضي.</p>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/60 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-semibold text-slate-300">أيام الصمود المشتركة</h3>
              </div>
              <div className="text-4xl font-extrabold text-white mb-2">14 <span className="text-sm text-slate-500 font-normal">يوم</span></div>
              <p className="text-xs text-slate-500">أطول فترة استقرار دون إنذارات ارتكاس.</p>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/60 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-semibold text-slate-300">استجابة الطوارئ</h3>
              </div>
              <div className="text-4xl font-extrabold text-white mb-2">3 <span className="text-sm text-slate-500 font-normal">د</span></div>
              <p className="text-xs text-slate-500">متوسط سرعة استجابة حليفك لنداءات الخطر.</p>
            </div>

          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
