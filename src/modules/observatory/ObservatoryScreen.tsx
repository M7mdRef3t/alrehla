import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useObservatoryState } from "./store/observatory.store";
import { useSullamState, GrowthArea, AREA_META } from "../sullam/store/sullam.store";
import { OracleMessage } from "./components/OracleMessage";

const NODE_POSITIONS: Record<GrowthArea, { x: number; y: number }> = {
  spiritual: { x: 50, y: 15 },
  creative: { x: 80, y: 35 },
  social: { x: 80, y: 65 },
  health: { x: 50, y: 85 },
  career: { x: 20, y: 65 },
  personal: { x: 20, y: 35 },
};

export function ObservatoryScreen() {
  const { getStuckAreas } = useSullamState();
  const { discoveredInsights, generateInsights, clearInsights } = useObservatoryState();

  useEffect(() => {
    // Small delay to allow the "entering" animation of the screen before dropping the bombshell
    const timer = setTimeout(() => {
      const stuckAreas = getStuckAreas();
      generateInsights(stuckAreas);
    }, 1500);

    return () => {
      clearTimeout(timer);
      clearInsights(); // cleanup when leaving the screen
    };
  }, [getStuckAreas, generateInsights, clearInsights]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 font-sans" dir="rtl">
      {/* Deep Space Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-black"></div>
      
      {/* Background Particles as distant stars */}
      {[...Array(40)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-slate-300"
          style={{
            width: Math.random() * 2 + 1 + "px",
            height: Math.random() * 2 + 1 + "px",
            top: Math.random() * 100 + "%",
            left: Math.random() * 100 + "%",
          }}
          animate={{
            opacity: [0.1, 0.8, 0.1],
          }}
          transition={{
            duration: Math.random() * 4 + 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-8 left-0 right-0 z-20 px-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-indigo-900/20 border border-indigo-500/20">
            <span className="text-2xl">🕸️</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">المرصد</h1>
            <p className="text-xs text-indigo-300">عقد الخيوط والخريطة السلوكية ــ ابحث عن أنماطك</p>
          </div>
        </div>
      </motion.div>

      {/* The Constellation Canvas */}
      <div className="absolute inset-0 top-24 bottom-12 z-10 flex items-center justify-center">
        <div className="relative w-full max-w-lg aspect-square">
          {/* Threads (SVG lines) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {discoveredInsights.map((insight, idx) => {
              const posA = NODE_POSITIONS[insight.areaA];
              const posB = NODE_POSITIONS[insight.areaB];
              return (
                <motion.line
                  key={insight.id}
                  x1={`${posA.x}%`}
                  y1={`${posA.y}%`}
                  x2={`${posB.x}%`}
                  y2={`${posB.y}%`}
                  stroke="url(#goldGradient)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.8 }}
                  transition={{ duration: 2, delay: idx * 1.5 + 0.5, ease: "easeOut" }}
                />
              );
            })}
            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.2" />
              </linearGradient>
            </defs>
          </svg>

          {/* Nodes (Stars) */}
          {(Object.keys(AREA_META) as GrowthArea[]).map((area) => {
            const meta = AREA_META[area];
            const pos = NODE_POSITIONS[area];
            
            // Check if this node is part of a discovered insight
            const isActive = discoveredInsights.some(i => i.areaA === area || i.areaB === area);
            
            return (
              <motion.div
                key={area}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, type: "spring" }}
              >
                {/* Node Orb */}
                <motion.div
                  className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center backdrop-blur-sm relative"
                  style={{
                    background: isActive ? `${meta.color}30` : `rgba(30,41,59,0.5)`,
                    border: `1px solid ${isActive ? meta.color : `rgba(71,85,105,0.4)`}`,
                    boxShadow: isActive ? `0 0 30px ${meta.color}40` : "none"
                  }}
                  animate={{
                    y: [0, -5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: Math.random() * 2
                  }}
                >
                  {isActive && (
                    <motion.div 
                      className="absolute inset-0 rounded-full"
                      style={{ background: meta.color }}
                      animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  <span className="text-xl md:text-2xl relative z-10 filter drop-shadow-md">{meta.emoji}</span>
                </motion.div>
                
                {/* Node Label */}
                <motion.span
                  className="mt-2 text-xs md:text-sm font-medium px-2 py-1 rounded bg-slate-900/80 border border-slate-700/50"
                  style={{ color: isActive ? meta.color : "#94a3b8" }}
                >
                  {meta.label}
                </motion.span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Only showing the top insight for now to avoid overlapping modals */}
      <OracleMessage 
        insight={discoveredInsights[0] || null} 
        onClose={() => {
          // If there are multiple insights, we could pop them one by one.
          // For now, we clear them all.
          clearInsights();
        }} 
      />
    </div>
  );
}
