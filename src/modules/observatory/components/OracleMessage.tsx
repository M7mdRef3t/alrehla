import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { InsightThread } from "../store/observatory.store";
import { AREA_META } from "../../sullam/store/sullam.store";

export function OracleMessage({ insight, onClose }: { insight: InsightThread | null, onClose: () => void }) {
  return (
    <AnimatePresence>
      {insight && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute bottom-12 left-6 right-6 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-full md:max-w-2xl z-50 font-sans"
        >
          <div className="relative overflow-hidden rounded-3xl p-[1px] bg-gradient-to-b from-blue-400/30 to-blue-900/10 shadow-[0_0_40px_-10px_rgba(30,58,138,0.5)]">
            {/* The glass card */}
            <div className="bg-slate-950/80 backdrop-blur-xl rounded-[23px] p-6 lg:p-8 flex flex-col items-center">
              {/* Shimmer effect */}
              <motion.div
                animate={{
                  x: ["0%", "200%"],
                  opacity: [0, 0.2, 0]
                }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
                className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-blue-200 to-transparent skew-x-12"
              />
              
              <div className="w-12 h-12 rounded-full border border-blue-400/20 bg-blue-900/20 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(96,165,250,0.3)]">
                <span className="text-xl">👁️</span>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <span className="text-sm font-bold px-3 py-1 bg-slate-900 border border-slate-700/50 rounded-full" style={{ color: AREA_META[insight.areaA].color }}>
                  {AREA_META[insight.areaA].emoji} {AREA_META[insight.areaA].label}
                </span>
                <div className="w-8 h-[1px] bg-gradient-to-r from-slate-700 via-blue-400 to-slate-700"></div>
                <span className="text-sm font-bold px-3 py-1 bg-slate-900 border border-slate-700/50 rounded-full" style={{ color: AREA_META[insight.areaB].color }}>
                  {AREA_META[insight.areaB].emoji} {AREA_META[insight.areaB].label}
                </span>
              </div>

              <h3 className="text-lg md:text-xl font-medium text-slate-200 text-center leading-relaxed">
                {insight.message}
              </h3>

              <button
                onClick={onClose}
                className="mt-8 px-6 py-2.5 rounded-full text-xs font-semibold tracking-wider text-blue-300 hover:text-white bg-blue-900/20 hover:bg-blue-900/40 border border-blue-500/20 transition-all"
              >
                استوعبت البصيرة
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
