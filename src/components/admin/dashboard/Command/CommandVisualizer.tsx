import React, { FC, useMemo } from "react";
import { motion } from "framer-motion";
import { SafeMotionCircle } from "@/components/ui/SafeSvg";

interface CommandVisualizerProps {
  score: number; // 0 to 100
  status?: 'optimal' | 'stable' | 'distorted' | 'critical';
}

export const CommandVisualizer: FC<CommandVisualizerProps> = ({ score, status = 'stable' }) => {
  // Map score to color and pulse speed
  const { color, glow, duration } = useMemo(() => {
    if (score > 85) return { color: "#2dd4bf", glow: "rgba(45, 212, 191, 0.4)", duration: 1.5 };
    if (score > 60) return { color: "#00f0ff", glow: "rgba(0, 240, 255, 0.3)", duration: 2.5 };
    if (score > 30) return { color: "#f5a623", glow: "rgba(245, 166, 35, 0.3)", duration: 3.5 };
    return { color: "#ff0055", glow: "rgba(255, 0, 85, 0.3)", duration: 0.8 };
  }, [score]);

  const rings = [60, 85, 110];

  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none select-none">
      <svg viewBox="0 0 300 300" className="w-full h-full overflow-visible">
        <defs>
          <radialGradient id="coreGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
          
          <filter id="hologramBlur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
          </filter>
        </defs>

        {/* HUD Tactical Frames */}
        <path 
          d="M 40 150 L 20 150 M 260 150 L 280 150 M 150 40 L 150 20 M 150 260 L 150 280" 
          stroke={color} strokeWidth="1" opacity="0.3" 
        />
        
        {/* Decorative Hexagon points */}
        {[0, 60, 120, 180, 240, 300].map(deg => (
          <motion.rect
            key={deg}
            x={150 + Math.cos(deg * Math.PI / 180) * 135 - 2}
            y={150 + Math.sin(deg * Math.PI / 180) * 135 - 2}
            width={4} height={4}
            fill={color}
            opacity={0.4}
            animate={{ opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 2, repeat: Infinity, delay: deg/60 * 0.2 }}
          />
        ))}

        {/* Outer Orbit Rings */}
        {rings.map((r, i) => (
          <SafeMotionCircle
            key={r}
            cx={150} cy={150} r={r}
            stroke={color}
            strokeWidth={0.5}
            fill="none"
            opacity={0.15 - i * 0.04}
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: i % 2 === 0 ? 360 : -360 
            }}
            transition={{ 
              duration: duration * (i + 2), 
              repeat: Infinity, 
              ease: "linear" 
            }}
          />
        ))}

        {/* Data Pulses */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <SafeMotionCircle
            key={angle}
            r={1.5}
            fill={color}
            cx={150}
            cy={150}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
              cx: [150 + Math.cos(angle * Math.PI / 180) * 60, 150 + Math.cos(angle * Math.PI / 180) * 140],
              cy: [150 + Math.sin(angle * Math.PI / 180) * 60, 150 + Math.sin(angle * Math.PI / 180) * 140],
            }}
            transition={{ 
              duration: duration * 1.5, 
              repeat: Infinity, 
              delay: i * 0.2,
              ease: "easeOut"
            }}
          />
        ))}

        {/* Reactive Core */}
        <SafeMotionCircle
          cx={150} cy={150} r={45}
          fill="url(#coreGradient)"
          animate={{ 
            r: [45, 52, 45],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: duration, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.g
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: duration * 0.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <circle cx={150} cy={150} r={28} fill="rgba(8, 12, 22, 0.8)" stroke={color} strokeWidth={2} />
          <circle cx={150} cy={150} r={8} fill={color} />
          {/* HUD Crosshairs */}
          <line x1={150} y1={130} x2={150} y2={140} stroke={color} strokeWidth={1} />
          <line x1={150} y1={160} x2={150} y2={170} stroke={color} strokeWidth={1} />
          <line x1={130} y1={150} x2={140} y2={150} stroke={color} strokeWidth={1} />
          <line x1={160} y1={150} x2={170} y2={150} stroke={color} strokeWidth={1} />
        </motion.g>

        {/* Scanning Wave */}
        <SafeMotionCircle
          cx={150} cy={150} r={140}
          stroke={color}
          strokeWidth={1}
          fill="none"
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{ scale: 1, opacity: [0, 0.4, 0] }}
          transition={{ duration: duration * 2, repeat: Infinity, ease: "easeOut" }}
        />
      </svg>
      
      {/* Percentage Center Text (Optional overlay) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[11px] font-black tracking-[0.4em] text-white/70 uppercase mt-44 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
          الحالة: {
            status === 'optimal' ? 'مثالي' :
            status === 'stable' ? 'مستقر' :
            status === 'distorted' ? 'مشوش' :
            status === 'critical' ? 'خطر' : status
          }
        </span>
      </div>
    </div>
  );
};
