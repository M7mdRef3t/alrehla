import React from 'react';
import { motion } from 'framer-motion';

interface HorusEyeProps {
  score: number; // 0 to 100
  size?: number;
  className?: string;
}

export const HorusEye: React.FC<HorusEyeProps> = ({ score, size = 100, className = "" }) => {
  const isHealthy = score >= 80;
  const isWarning = score < 80 && score >= 40;
  const isCritical = score < 40;

  const color = isHealthy ? "#C9A84C" : isWarning ? "#D4B896" : "#ef4444";
  const glowColor = isHealthy ? "rgba(201, 168, 76, 0.4)" : isWarning ? "rgba(212, 184, 150, 0.3)" : "rgba(239, 68, 68, 0.3)";

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {/* Background Glow */}
      <motion.div
        className="absolute inset-0 rounded-full blur-2xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ backgroundColor: glowColor }}
      />

      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_0_8px_rgba(201,168,76,0.5)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Progress Ring */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="2"
        />
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="283"
          initial={{ strokeDashoffset: 283 }}
          animate={{ strokeDashoffset: 283 - (283 * score) / 100 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />

        {/* Eye of Horus Icon (Simplified for SVG) */}
        <motion.path
          d="M30 50C30 50 40 35 50 35C60 35 70 50 70 50C70 50 60 65 50 65C40 65 30 50 30 50Z"
          stroke={color}
          strokeWidth="3"
          strokeLinejoin="round"
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.circle
          cx="50"
          cy="50"
          r="8"
          fill={color}
          animate={{ scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        {/* The "Tear" of Horus (Protection) */}
        <path
          d="M50 65V80C50 80 45 85 40 80"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M60 65C60 65 65 75 75 70"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      
      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
        <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-[-4px]">Vision</span>
        <span className="text-xl font-black text-white" style={{ color: color }}>
          {score}%
        </span>
      </div>
    </div>
  );
};
