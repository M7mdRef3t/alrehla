"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Goal, AREA_META } from "../store/sullam.store";

export function PassageRelic({
  goal,
  onClose
}: {
  goal: Goal;
  onClose: () => void;
}) {
  const meta = AREA_META[goal.area];
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; delay: number; duration: number }[]>([]);

  useEffect(() => {
    // Generate floating particles
    const newParticles = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 4
    }));
    setParticles(newParticles);
  }, []);

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const daysTaken = goal.completedAt 
    ? Math.max(1, Math.ceil((goal.completedAt - goal.createdAt) / (1000 * 60 * 60 * 24)))
    : 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center bg-[#030504]/95 p-4 overflow-hidden"
      >
        {/* Ambient background particles */}
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute w-1 h-1 rounded-full pointer-events-none"
            style={{ backgroundColor: meta.color, left: `${p.x}%`, top: `${p.y}%`, opacity: 0.1 }}
            animate={{ 
              y: [0, -100], 
              opacity: [0, 0.4, 0] 
            }}
            transition={{ 
              duration: p.duration, 
              repeat: Infinity, 
              delay: p.delay,
              ease: "linear" 
            }}
          />
        ))}

        <motion.div
          initial={{ y: 50, opacity: 0, rotateX: 20 }}
          animate={{ y: 0, opacity: 1, rotateX: 0 }}
          transition={{ type: "spring", damping: 20, delay: 0.2 }}
          className="relative max-w-sm w-full perspective-1000"
        >
          {/* Glassmorphic Relic Body */}
          <div 
            className="relative p-1 rounded-3xl overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${meta.color}30 0%, transparent 100%)`,
              boxShadow: `0 0 40px ${meta.color}20`
            }}
          >
            <div className="bg-black/60 backdrop-blur-2xl rounded-[22px] p-8 relative border border-white/10" style={{ borderTopColor: `${meta.color}50` }}>
              
              <div className="text-center space-y-6 dir-rtl">
                {/* Header Icon */}
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ type: "spring", bounce: 0.5, delay: 0.5 }}
                  className="w-20 h-20 mx-auto rounded-full flex items-center justify-center relative"
                >
                  <div className="absolute inset-0 rounded-full blur-xl opacity-50" style={{ backgroundColor: meta.color }} />
                  <span className="text-4xl relative z-10 drop-shadow-md">{goal.emoji}</span>
                </motion.div>

                {/* Title & Metadata */}
                <div>
                  <p className="text-[10px] uppercase font-mono tracking-widest text-white/40 mb-1">صكّ عبور</p>
                  <h2 className="text-2xl font-black text-white/90 drop-shadow-sm">{goal.title}</h2>
                </div>

                <div className="flex justify-center gap-4 text-xs">
                  <div className="flex flex-col items-center">
                    <span className="text-white/40 font-bold text-[9px] mb-0.5">البداية</span>
                    <span className="text-white/80 font-mono">{formatDate(goal.createdAt)}</span>
                  </div>
                  <div className="w-[1px] h-6 bg-white/10" />
                  <div className="flex flex-col items-center">
                    <span className="text-white/40 font-bold text-[9px] mb-0.5">الرحلة</span>
                    <span className="text-white/80 font-mono">{daysTaken} يوماً</span>
                  </div>
                </div>

                {/* Wisdom Text */}
                <div className="relative pt-6 pb-2">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[1px]" style={{ backgroundColor: meta.color }} />
                  <p className="text-sm font-medium text-white/90 leading-relaxed italic px-2">
                    "{goal.reflection}"
                  </p>
                </div>
              </div>

            </div>
          </div>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            onClick={onClose}
            className="mt-8 w-full py-4 text-xs font-bold text-white/50 hover:text-white transition-colors"
          >
            حفظ في الأرشيف والعودة للواقع
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
