"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Goal, AREA_META } from "../store/sullam.store";

export function PassageRelicGenerator({
  goal,
  onSubmit,
  onClose
}: {
  goal: Goal;
  onSubmit: (reflection: string) => void;
  onClose: () => void;
}) {
  const [reflection, setReflection] = useState("");
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    if (timer > 0) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [timer]);

  const meta = AREA_META[goal.area];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -30, opacity: 0, scale: 0.95 }}
          onClick={e => e.stopPropagation()}
          className="bg-neutral-900 border border-white/5 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden"
        >
          {/* Glassmorphic Ambient Glow */}
          <div 
            className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/2 opacity-20 pointer-events-none" 
            style={{ backgroundColor: meta.color }} 
          />

          <div className="text-center mb-6 relative z-10">
            <span className="text-6xl mb-4 block drop-shadow-2xl">{goal.emoji}</span>
            <h3 className="text-xl font-bold text-white mb-2">استراحة المحارب</h3>
            <p className="text-xs text-white/50 leading-relaxed dir-rtl max-w-[250px] mx-auto">
              توقّف قليلاً. لا تندفع نحو الهدف الموالي. 
              <br/><br/>
              ما هي التضحية التي بذلتها هنا؟ وما الحكمة التي تخرج بها من هذا السُّلّم؟
            </p>
          </div>

          <div className="relative z-10 mb-6">
            <div className="relative">
              <textarea
                value={reflection}
                onChange={e => setReflection(e.target.value)}
                placeholder="حِكمتك من هذا العبور..."
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white placeholder-white/20 dir-rtl outline-none focus:border-white/20 transition-colors resize-none min-h-[140px] text-sm leading-relaxed"
              />
              <div className="absolute left-3 bottom-3 text-[10px] text-white/30 font-mono">
                {reflection.length}/300
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 relative z-10">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSubmit(reflection)}
              disabled={!reflection.trim() || timer > 0}
              className="py-3 px-4 rounded-xl font-bold text-neutral-900 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ background: meta.color, opacity: (!reflection.trim() || timer > 0) ? 0.3 : 1 }}
            >
              {timer > 0 ? `تروّى وتيمّم.. (${timer}ث)` : "اِصنع صك العبور 📜"}
            </motion.button>
            
            <button
              onClick={onClose}
              className="py-3 px-4 rounded-xl text-[10px] font-bold text-white/40 hover:text-white/70 transition-colors"
            >
              العودة للسلم
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
