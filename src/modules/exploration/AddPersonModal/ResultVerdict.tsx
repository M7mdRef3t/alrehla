import type { FC } from "react";
import { motion } from "framer-motion";

interface ResultVerdictProps {
  commandScore: number;
  activeRing: "green" | "yellow" | "red";
  title: string;
  stateLabel: string;
  goalLabel: string;
  isEmotionalPrisoner: boolean;
}

export const ResultVerdict: FC<ResultVerdictProps> = ({
  commandScore,
  activeRing,
  title,
  stateLabel,
  goalLabel,
  isEmotionalPrisoner
}) => {
  return (
    <div className="text-center relative">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 flex flex-col items-center"
      >
        {/* Sovereignty Gauge - High Fidelity */}
        <div className="relative w-72 h-36 mb-8 flex items-center justify-center">
           {/* Ambient Glow */}
           <motion.div 
             className="absolute inset-0 rounded-full blur-[60px] opacity-20 pointer-events-none"
             animate={{ 
               backgroundColor: activeRing === "red" ? "#f43f5e" : activeRing === "yellow" ? "#fbbf24" : "#2dd4bf",
               scale: [1, 1.2, 1]
             }}
             transition={{ duration: 4, repeat: Infinity }}
           />

           <svg className="absolute inset-0 w-full h-full transform" viewBox="0 0 100 50">
             {/* Background Arc */}
             <path 
               d="M 15 45 A 35 35 0 0 1 85 45" 
               fill="none" 
               stroke="rgba(255,255,255,0.03)" 
               strokeWidth="6" 
               strokeLinecap="round"
             />
             {/* Notches */}
             {Array.from({ length: 11 }).map((_, i) => {
               const angle = 180 + (i * 18);
               const rad = (angle * Math.PI) / 180;
               const x1 = 50 + 38 * Math.cos(rad);
               const y1 = 45 + 38 * Math.sin(rad);
               const x2 = 50 + 42 * Math.cos(rad);
               const y2 = 45 + 42 * Math.sin(rad);
               return (
                 <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
               );
             })}
             {/* Filled Arc */}
             <motion.path 
               initial={{ pathLength: 0 }}
               animate={{ pathLength: commandScore / 100 }}
               transition={{ duration: 2.5, ease: "circOut" }}
               d="M 15 45 A 35 35 0 0 1 85 45" 
               fill="none" 
               stroke={activeRing === "red" ? "#f43f5e" : activeRing === "yellow" ? "#fbbf24" : "#2dd4bf"}
               strokeWidth="6" 
               strokeDasharray="100 100"
               strokeLinecap="round"
               style={{ filter: `drop-shadow(0 0 15px ${activeRing === "red" ? "rgba(244,63,94,0.6)" : "rgba(45,212,191,0.6)"})` }}
             />
           </svg>

           <div className="absolute bottom-4 inset-x-0 flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="relative"
              >
                <motion.span 
                  animate={{ 
                    textShadow: [
                      "0 0 10px rgba(45,212,191,0.5)",
                      "2px 0 2px rgba(244,63,94,0.5), -2px 0 2px rgba(45,212,191,0.5)",
                      "0 0 10px rgba(45,212,191,0.5)"
                    ]
                  }}
                  transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3 }}
                  className="text-6xl font-black text-white"
                >
                  {commandScore}
                </motion.span>
                <span className="text-xl text-teal-400 font-bold ml-1">%</span>
              </motion.div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-teal-500/50 mt-2">Personal Sovereignty</span>
           </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className="space-y-4"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-[10px] font-black text-teal-400 tracking-[0.3em] uppercase">
            الخلاصة الاستراتيجية
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-[var(--consciousness-text)] leading-tight tracking-tight px-4 blur-none">
            {isEmotionalPrisoner ? stateLabel : title}
          </h2>
          <p className="text-xl text-[var(--consciousness-text-muted)] font-medium max-w-lg mx-auto leading-relaxed">
            {goalLabel}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};
