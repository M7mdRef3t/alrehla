"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lantern, lanternsService } from "../../../services/lanterns.service";
import { GrowthArea, AREA_META } from "../store/sullam.store";

export function LanternGlow({ area, onLightUp }: { area: GrowthArea, onLightUp: () => void }) {
  const [lantern, setLantern] = useState<Lantern | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lit, setLit] = useState(false);

  useEffect(() => {
    // Only fetch if they open to save DB hits ? Or pre-fetch to know if there IS a lantern?
    // In MVP, we fetch on mount to know if we should show the glow at all.
    let mounted = true;
    lanternsService.fetchLanternForArea(area).then(l => {
      if (mounted && l) setLantern(l);
    });
    return () => { mounted = false };
  }, [area]);

  if (!lantern) return null;

  const handleLight = async () => {
    if (lit) return;
    setLit(true);
    await lanternsService.lightLantern(lantern.id);
    onLightUp();
  };

  const areaColor = AREA_META[area].color;

  return (
    <>
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        onClick={() => setIsOpen(true)}
        className="relative flex items-center justify-center w-8 h-8 rounded-full z-10"
      >
        <div className="absolute inset-0 bg-white/20 rounded-full blur-md animate-pulse" />
        <div className="absolute inset-0 bg-amber-500/40 rounded-full blur-xl animate-pulse" style={{ animationDuration: "3s" }} />
        <span className="text-xl drop-shadow-md z-10">🏮</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-neutral-900 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
              
              <div className="text-center mb-6 relative z-10">
                <span className="text-4xl mb-2 block filter drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">🏮</span>
                <p className="text-xs uppercase tracking-widest text-white/40 mb-1">قنديل عابر</p>
                <h3 className="text-lg font-bold text-white/90">تزامن هذا الأثر مع تعثرك الحالي</h3>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6 relative z-10">
                <p className="text-white/80 leading-relaxed text-right dir-rtl font-medium">
                  "{lantern.content_payload}"
                </p>
              </div>

              <div className="flex flex-col gap-3 relative z-10">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLight}
                  disabled={lit}
                  className={`py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
                    lit ? "bg-amber-500/20 text-amber-500" : "bg-amber-500 text-neutral-900"
                  }`}
                >
                  <span>{lit ? "✨ أضاءت طريقي" : "أضاء طريقي"}</span>
                  {lit && <span className="text-xs opacity-80">({lantern.resonance_count + 1})</span>}
                </motion.button>
                
                <button
                  onClick={() => setIsOpen(false)}
                  className="py-3 px-4 rounded-xl font-bold text-white/50 hover:text-white/80 transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
