import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppOverlayState } from "@/state/appOverlayState";
import { DissonanceEngine, DissonanceReport } from "@/services/dissonanceEngine";
import { useJourneyState } from "@/state/journeyState";

export default function RuthlessMirrorModal() {
  const { flags, closeOverlay } = useAppOverlayState();
  const isOpen = flags.ruthlessMirror;
  const [report, setReport] = useState<DissonanceReport | null>(null);

  useEffect(() => {
    if (isOpen) {
      const evaluation = DissonanceEngine.evaluate();
      setReport(evaluation);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => closeOverlay("ruthlessMirror");

  const handleAcceptTruth = () => {
    // Freeze the stated goal
    if (report?.triggeringGoalId) {
      useJourneyState.getState().setLastGoal(report.triggeringGoalId, "مُجمّد للاستشفاء");
    }
    closeOverlay("ruthlessMirror");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-3xl overflow-hidden p-6" dir="rtl">
        {/* Background Gradients */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="w-full max-w-4xl aspect-square bg-red-600/20 rounded-full blur-[120px]"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-lg bg-black border border-white/10 rounded-[32px] p-8 md:p-12 shadow-2xl overflow-hidden"
        >
          {/* Glass Overlay inside */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

          {/* Icon/Visualizer */}
          <div className="relative mb-10 flex justify-center">
             <div className="relative w-24 h-32 border-2 border-white/20 rounded-t-full rounded-b-md overflow-hidden flex items-center justify-center">
                {/* Mirror reflection effect */}
                <motion.div 
                   animate={{ x: ["-100%", "100%"] }} 
                   transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                   className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-[200%]" 
                />
                <span className="text-4xl">👁️</span>
             </div>
             {report?.hasDissonance && (
               <motion.div 
                 initial={{ opacity: 0, scale: 0 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ delay: 0.5, type: "spring" }}
                 className="absolute -bottom-2 -right-2 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white border-4 border-black font-bold shadow-lg shadow-red-500/50"
               >
                 !
               </motion.div>
             )}
          </div>

          <div className="space-y-6 text-center">
            <h2 className="text-3xl font-bold text-white tracking-tight">
               {report?.hasDissonance ? "مرآة التناقض" : "مرآة الصدق"}
            </h2>

            {report && report.hasDissonance ? (
              <div className="space-y-6">
                <p className="text-xl text-white/90 leading-relaxed font-light mt-4">
                  {report.message}
                </p>
                <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-4 mt-6">
                    <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-white/60">مؤشر الانفصال (Dissonance Score)</span>
                        <span className="text-red-400 font-mono font-bold">{Math.round(report.score)}%</span>
                    </div>
                    <div className="w-full h-2 bg-black rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${report.score}%` }}
                          transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-red-600 to-red-400"
                        />
                    </div>
                </div>
              </div>
            ) : (
              <p className="text-xl text-white/70 leading-relaxed max-w-[280px] mx-auto mt-4">
                تطابق تام بين النوايا والسلوك. الملاذ يشهد على توازنك. مسارك آمن للتقدم.
              </p>
            )}
          </div>

          <div className="mt-12 space-y-4">
            {report?.hasDissonance ? (
              <>
                <button
                  onClick={handleAcceptTruth}
                  className="w-full py-4 rounded-2xl bg-white text-black font-semibold text-lg hover:bg-white/90 transform hover:scale-[1.02] active:scale-95 transition-all"
                >
                  الاعتراف وايقاف الهدف
                </button>
                <button
                  onClick={handleClose}
                  className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white/50 text-base hover:text-white hover:bg-white/10 transition-all font-medium"
                >
                  الهروب مجدداً (لا أنصحك)
                </button>
              </>
            ) : (
              <button
                onClick={handleClose}
                className="w-full py-4 rounded-2xl bg-white text-black font-semibold text-lg hover:bg-white/90 transform hover:scale-[1.02] active:scale-95 transition-all"
              >
                متابعة المسير
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
