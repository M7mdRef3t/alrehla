import React, { type FC, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SafeMotionCircle } from "@/components/ui/SafeSvg";
import { useHafizState, getVerticalResonanceState } from "@/modules/hafiz/store/hafiz.store";

interface DivineConnectionProps {
  /** Strength of the connection (0 to 1) */
  strength?: number;
  /** Whether to show labels */
  showLabel?: boolean;
  /** Callback when the Source orb is clicked */
  onSourceClick?: () => void;
}

/**
 * ◈ العلاقة الرأسية (The Vertical Axis) ◈
 * Represents the connection between the "Sovereign Core" (You) and "The Source" (The Creator/Truth).
 * Now interactive — click on the Source to see your spiritual dashboard.
 */
export const DivineConnection: FC<DivineConnectionProps> = ({ 
  strength = 0.7, 
  showLabel = true,
  onSourceClick
}) => {
  const [showDashboard, setShowDashboard] = useState(false);
  const memories = useHafizState(s => s.memories);
  const resonance = getVerticalResonanceState(memories);

  const handleSourceClick = () => {
    if (onSourceClick) {
      onSourceClick();
    } else {
      setShowDashboard(prev => !prev);
    }
  };

  // Color based on resonance level
  const levelColor = {
    disconnected: 'rgba(239, 68, 68, 0.6)',   // red
    flickering: 'rgba(251, 191, 36, 0.6)',    // yellow  
    steady: 'rgba(59, 130, 246, 0.6)',        // blue
    radiant: 'rgba(255, 255, 255, 0.9)',      // white
  }[resonance.level];

  return (
    <g className="select-none">
      {/* ─── The Source (المصدر) — Interactive ─── */}
      <g 
        transform="translate(50, 5)" 
        className="cursor-pointer pointer-events-auto"
        onClick={handleSourceClick}
      >
        {/* Hit area — invisible larger circle for easier clicking */}
        <circle cx={0} cy={0} r={8} fill="transparent" />

        {/* Outer Glows */}
        <SafeMotionCircle
          cx={0} cy={0} r={6}
          fill="rgba(255, 255, 255, 0.05)"
          animate={{ scale: [1, 1.5, 1], opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <SafeMotionCircle
          cx={0} cy={0} r={3}
          fill="rgba(255, 255, 255, 0.1)"
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Core Star — removed per user request (small dot above orb) */}
        {/* Label */}
        {showLabel && (
          <text
            y={5}
            textAnchor="middle"
            fill="rgba(255,255,255,0.4)"
            style={{ 
              fontSize: '1.2px', 
              fontWeight: 900, 
              letterSpacing: '0.2em',
              fontFamily: 'inherit'
            }}
          >
            المصدر
          </text>
        )}
      </g>

      {/* ─── Mini Dashboard (foreignObject) ─── */}
      {showDashboard && (
        <foreignObject x={20} y={-5} width={60} height={30}>
          <div
            dir="rtl"
            style={{
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '6px 8px',
              color: 'white',
              fontSize: '2px',
              lineHeight: '1.5',
              fontFamily: 'inherit',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
              <span style={{ fontWeight: 700, fontSize: '2.5px' }}>◈ اتصالك بالمصدر</span>
              <span 
                style={{ 
                  fontSize: '2px', 
                  padding: '0.5px 2px',
                  borderRadius: '4px',
                  background: levelColor,
                  color: resonance.level === 'radiant' ? '#0f172a' : 'white',
                }}
              >
                {resonance.label}
              </span>
            </div>

            {/* Strength Bar */}
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '2px', height: '1.5px', marginBottom: '2px' }}>
              <div style={{ 
                background: `linear-gradient(90deg, ${levelColor}, white)`, 
                height: '100%', 
                width: `${resonance.strength * 100}%`,
                borderRadius: '2px',
                transition: 'width 0.5s ease'
              }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.7 }}>
              <span>🔥 {resonance.daysActive} يوم streak</span>
              <span>📿 {resonance.todayCount} النهاردة</span>
            </div>

            {resonance.level === 'disconnected' && (
              <div style={{ marginTop: '2px', opacity: 0.5, fontSize: '1.8px' }}>
                💡 ابدأ بذكر بسيط — حتى لو تسبيحة واحدة
              </div>
            )}
          </div>
        </foreignObject>
      )}

      {/* ─── The Vertical Beam (The Link) ─── */}
      <defs>
        <linearGradient id="divineBeamGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={levelColor} stopOpacity={0.6 * strength} />
          <stop offset="100%" stopColor={levelColor} stopOpacity={0} />
        </linearGradient>
        
        <filter id="divineGlow">
          <feGaussianBlur stdDeviation="0.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Core Beam */}
      <motion.line
        x1={50} y1={6}
        x2={50} y2={50}
        stroke="url(#divineBeamGradient)"
        strokeWidth={0.15}
        strokeDasharray="2, 4"
        animate={{ 
          strokeDashoffset: [0, -20],
          opacity: [0.1, 0.3 * strength, 0.1]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />

      {/* Subtle Energy Pulses Moving Upwards (removed per user request to clean UI) */}
      {/* {[0, 1, 2].map((i) => (
        <motion.circle
          key={i}
          cx={50}
          cy={50}
          r={0.2}
          fill={levelColor}
          animate={{ 
            cy: [50, 6],
            opacity: [0, 0.6 * strength, 0],
            scale: [1, 0.5, 0.2]
          }}
          transition={{ 
            duration: 4 + i, 
            repeat: Infinity, 
            delay: i * 1.5,
            ease: "easeOut"
          }}
        />
      ))} */}

      {/* Connection Anchor to "You" Orb (removed per user request to clean UI) */}
      {/* <SafeMotionCircle
        cx={50} cy={50} r={2}
        fill="none"
        stroke={levelColor}
        strokeWidth={0.1}
        animate={{ scale: [1, 1.2, 1], opacity: [0, 0.2 * strength, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      /> */}
    </g>
  );
};
