import { logger } from "@/services/logger";
import type { ComponentProps, FC } from "react";
import { useState, useRef, useCallback, useEffect, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, GripVertical, Plus } from "lucide-react";
import { DndContext, TouchSensor, MouseSensor, useSensor, useSensors, useDraggable, useDroppable, type DragEndEvent } from "@dnd-kit/core";
import type { Ring, MapNode as MapNodeType } from "./mapTypes";
import { useMapState } from '@/modules/map/dawayirIndex';
import { filterNodesByContext } from "./mapUtils";
import { useMeState } from '@/modules/map/dawayirIndex';
import { mapCopy } from "@/copy/map";
import { hasSeenOnboarding } from "@/utils/mapOnboarding";
import { getMissionProgressSummary } from "@/utils/missionProgress";
import { JourneyToast } from '@/modules/action/JourneyToast';
import { FutureSimulator } from '@/modules/action/FutureSimulator';
import { Telescope } from "lucide-react";
import { analyzeMapInterference } from "@/services/socialSync";
import { AINode } from "./AINode";
import { useCognitiveDebounce } from "@/hooks/useCognitiveDebounce";
import { useAuthState } from "@/domains/auth/store/auth.store";
import { useAdminState } from "@/domains/admin/store/admin.store";
import { useOptimisticPhoenixSync } from "@/hooks/useOptimisticPhoenixSync";
import { useKineticSensors } from "@/hooks/useKineticSensors";
import { useDailyPulse } from "@/hooks/useDailyPulse";
import { useDailyQuestion } from "@/hooks/useDailyQuestion";
import { soundManager } from "@/services/soundManager";
import { BatteryStateModal } from '@/modules/action/BatteryStateModal';
import { useLongPress } from "@/hooks/useLongPress";
import { usePulseState } from "@/domains/consciousness/store/pulse.store";
import { useGamification } from "@/domains/gamification";
import { Zap, Flame } from "lucide-react";
import { useSynthesisState } from "@/domains/consciousness/store/synthesis.store";
import { Typewriter } from "@/modules/meta/UI/Typewriter";
import { SafeMotionCircle, toSafeSvgRadius, toSafeSvgCoordinate } from "@/components/ui/SafeSvg";

function isLegacyMapUiEnabled(): boolean {
  return false;
}

const toSafeSvgNumber = (value: unknown, fallback: number): number => {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
};

/* ── Star Field Generator ── */
const STAR_COUNT = 55;
const STAR_DATA = Array.from({ length: STAR_COUNT }, (_, i) => ({
  id: i,
  cx: (i * 17 + 3) % 100,
  cy: (i * 31 + 7) % 100,
  r: i % 5 === 0 ? 0.35 : i % 3 === 0 ? 0.25 : 0.15,
  opacity: 0.08 + (i % 7) * 0.04,
  animDelay: (i * 0.3) % 4,
  animDuration: 3 + (i % 4),
}));

/*  Orbital Ring (Breathing)  */

interface RingProps {
  ring: Ring;
  label: string;
  radius: number;
  color: string;
  glowColor: string;
  breatheDuration: number;
}

const OrbitalRing: FC<RingProps> = memo(({ ring, label, radius, color, glowColor, breatheDuration }) => {
  const { audioIntensity } = useSynthesisState();
  const safeRadius = toSafeSvgRadius(radius, 0);
  const filterId = ring === "red" ? "neonGlowRed" : ring === "yellow" ? "neonGlowWarning" : "neonGlowSafe";
  const fillId = ring === "red" ? "ringFillRed" : ring === "yellow" ? "ringFillYellow" : "ringFillGreen";
  const dotCount = ring === "green" ? 2 : ring === "yellow" ? 3 : 2;
  const dotAngles = Array.from({ length: dotCount }, (_, i) => (360 / dotCount) * i);

  return (
    <g aria-label={label}>
      {/* Glass fill zone */}
      <SafeMotionCircle cx={50} cy={50} r={safeRadius} fill={`url(#${fillId})`} className="pointer-events-none" />

      {/* Outer ambient halo */}
      <SafeMotionCircle
        cx={50} cy={50} r={safeRadius + 1.5}
        fill="none" stroke={color} strokeWidth={2.5} opacity={0.08}
        animate={{ 
          opacity: [0.05, 0.18 + audioIntensity * 0.1, 0.05],
          scale: [1, 1 + audioIntensity * 0.02, 1] 
        }}
        transition={{ duration: breatheDuration * 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Main neon ring — thick, glowing, without SVG filter to prevent gray box artifacts */}
      <SafeMotionCircle
        cx={50} cy={50} r={safeRadius}
        fill="none" stroke={color}
        animate={{ 
          strokeWidth: [3, 5 + audioIntensity * 3, 3], 
          opacity: [0.15, 0.3 + audioIntensity * 0.2, 0.15] 
        }}
        transition={{ duration: breatheDuration * 2, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none"
      />
      <SafeMotionCircle
        cx={50} cy={50} r={safeRadius}
        fill="none" stroke={color}
        animate={{ 
          strokeWidth: [1.4, 2.4 + audioIntensity, 1.4], 
          opacity: [0.65, 1, 0.65] 
        }}
        transition={{ duration: breatheDuration * 2, repeat: Infinity, ease: "easeInOut" }}
        className="orbital-ring"
      />

      {/* Inner dashed shimmer */}
      <SafeMotionCircle
        cx={50} cy={50} r={safeRadius - 0.8}
        fill="none" stroke={color} strokeWidth={0.5} opacity={0.3}
        strokeDasharray="2 5"
        animate={{ strokeDashoffset: [0, -20] }}
        transition={{ duration: breatheDuration * 1.5, repeat: Infinity, ease: "linear" }}
      />

      {/* Chromatic aberration — danger ring only */}
      {ring === "red" && (
        <SafeMotionCircle
          cx={50} cy={50} r={safeRadius + 0.8}
          fill="none" stroke="rgba(244,63,94,0.3)" strokeWidth={4}
          animate={{ opacity: [0, 0.5, 0], scale: [0.97, 1.03, 0.97] }}
          style={{ transformOrigin: "50px 50px" }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Orbiting light dots */}
      {dotAngles.map((startAngle, i) => (
        <motion.g
          key={i}
          style={{ transformOrigin: "50px 50px" }}
          animate={{ rotate: [startAngle, startAngle + 360] }}
          transition={{ duration: breatheDuration * 5 + i * 2, repeat: Infinity, ease: "linear" }}
        >
          <SafeMotionCircle
            cx={50 + safeRadius}
            cy={50}
            r={ring === "red" ? 0.9 : 0.7}
            fill={color}
            style={{ filter: `drop-shadow(0 0 2px ${color})` }}
          />
        </motion.g>
      ))}
      {/* Ring label — subtle text above ring */}
      <text
        x={50}
        y={50 - safeRadius - 1.5}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontSize: "2.2px",
          fill: color,
          opacity: 0.4,
          fontWeight: 700,
          letterSpacing: "0.4em",
          pointerEvents: "none",
        }}
      >
        {label.toUpperCase()}
      </text>
    </g>
  );
});

/*  Node Position Calculations  */

// Golden angle offsets per ring — stagger start positions so nodes
// in different rings don't stack on top of each other visually.
const RING_ANGLE_OFFSETS: Record<Ring, number> = {
  green: Math.PI * 0.15,     // Start at ~1:30 (upper-right)
  yellow: Math.PI * 1.25,    // Start at ~7:30 (lower-left)  
  red: Math.PI * 0.7,        // Start at ~5:00 (lower-right)
};

const getRingPosition = (ring: Ring, nodeIndex: number, totalInRing: number): { x: number; y: number } => {
  const angleStep = (2 * Math.PI) / Math.max(totalInRing, 1);
  const offset = RING_ANGLE_OFFSETS[ring] ?? 0;
  const angle = nodeIndex * angleStep + offset - Math.PI / 2;
  let radius: number;
  if (ring === "green") radius = 15;
  else if (ring === "yellow") radius = 27;
  else radius = 38;
  
  const x = 50 + radius * Math.cos(angle);
  const y = 50 + radius * Math.sin(angle);
  
  return { 
    x: Number.isFinite(x) ? x : 50, 
    y: Number.isFinite(y) ? y : 50 
  };
};

const GREY_ZONE_RADIUS = 46;
const GREY_ZONE_STROKE_RADIUS = 48;
const getGreyZonePosition = (nodeIndex: number, totalInGrey: number): { x: number; y: number } => {
  const angleStep = (2 * Math.PI) / Math.max(totalInGrey, 1);
  const angle = nodeIndex * angleStep - Math.PI / 2;
  const x = 50 + GREY_ZONE_RADIUS * Math.cos(angle);
  const y = 50 + GREY_ZONE_RADIUS * Math.sin(angle);
  return { 
    x: Number.isFinite(x) ? x : 50, 
    y: Number.isFinite(y) ? y : 50 
  };
};

/* ── Illusion Entity View (Dark Asteroids) ── */
const IllusionEntityView: FC<{ scenario: any; index: number; total: number; onDismantle: (key: string) => void }> = memo(({ scenario, index, total, onDismantle }) => {
  const [isDismantling, setIsDismantling] = useState(false);
  const addXP = useGamification().addXP;

  // Orbit in the deep edges of the map (r=55)
  const radius = 55;
  const initialAngle = (index * (2 * Math.PI) / Math.max(total, 1)) - Math.PI / 2;
  const rawX = 50 + radius * Math.cos(initialAngle);
  const rawY = 50 + radius * Math.sin(initialAngle);
  const cx = Number.isFinite(rawX) ? rawX : 50;
  const cy = Number.isFinite(rawY) ? rawY : 50;

  const handleDismantle = useCallback((e: React.MouseEvent | any) => {
    if (e?.stopPropagation) e.stopPropagation();
    setIsDismantling(true);
    soundManager.playSniperShot();
    addXP(15, "تفكيك تأثير جمعي");
    setTimeout(() => onDismantle(scenario.key), 800);
  }, [addXP, onDismantle, scenario.key]);

  if (isDismantling) {
    return (
      <motion.g
        initial={{ opacity: 1 }}
        animate={{ opacity: 0, scale: 2 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="pointer-events-none"
      >
        <SafeMotionCircle cx={cx} cy={cy} r={6} fill="rgba(244,63,94, 0.4)" style={{ filter: "blur(2px)" }} />
        <SafeMotionCircle cx={cx} cy={cy} r={2} fill="#fff" />
      </motion.g>
    );
  }

  return (
    <motion.g
      style={{ transformOrigin: "50px 50px" }}
      animate={{ rotate: 360 }}
      transition={{ duration: 180 + index * 10, repeat: Infinity, ease: "linear" }}
    >
      <motion.g
        onTap={handleDismantle}
        className="cursor-pointer group"
        whileHover={{ scale: 1.15 }}
      >
        {/* Core dark asteroid body */}
        <circle cx={cx} cy={cy} r={2.5} className="fill-slate-900 dark:fill-slate-950" stroke="#4c1d95" strokeWidth={0.6} />
        
        {/* Breathing toxic glow */}
              <SafeMotionCircle
                cx={cx} cy={cy} r={4.5}
          fill="none" stroke="rgba(192,132,252,0.6)" strokeWidth={1}
          animate={{ opacity: [0.1, 0.5, 0.1], scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 4 + (index % 3), repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Scenario Label - keep upright by reversing rotation approximately */}
        <g style={{ transformOrigin: `${cx}px ${cy}px` }}>
          <text
            x={cx}
            y={cy + 5.5}
            textAnchor="middle"
            dominantBaseline="hanging"
            className="pointer-events-none select-none opacity-60 group-hover:opacity-100 transition-opacity"
            style={{
              fontSize: "1.8px",
              fill: "#d8b4fe",
              fontWeight: 600,
              letterSpacing: "0.05em",
              filter: "drop-shadow(0px 1px 2px rgba(0,0,0,0.8))"
            }}
          >
            {scenario.label}
          </text>
        </g>
      </motion.g>
    </motion.g>
  );
});

/*  Node Colors (Cosmic)  */

const RING_COLORS = {
  safe: { stroke: "var(--consciousness-primary)", glow: "var(--ds-color-primary-glow)" },
  caution: { stroke: "var(--consciousness-accent)", glow: "color-mix(in srgb, var(--consciousness-accent) 35%, transparent)" },
  danger: { stroke: "var(--consciousness-critical)", glow: "color-mix(in srgb, var(--consciousness-critical) 45%, transparent)" },
  detached: { stroke: "var(--ds-theme-text-muted)", glow: "rgba(148, 163, 184, 0.15)" }
} as const;

const NODE_GLOW_CLASS: Record<Ring, string> = {
  red: "node-threat-danger",
  yellow: "node-threat-caution",
  green: "node-threat-safe"
};

const MAX_NODES_FOR_FULL_CONNECTIONS = 140;
const MAX_NODES_FOR_INTERFERENCE_SCAN = 220;
const MAX_NODES_FOR_FULL_MOTION = 120;

/*  Map Node View (Glass Orb)  */

interface NodeProps {
  node: MapNodeType;
  nodeIndex: number;
  totalInRing: number;
  position?: { x: number; y: number };
  onClick?: (id: string) => void;
  canOpenDetails?: boolean;
  justDraggedId?: string | null;
  justAdded?: boolean;
  isHighlighted?: boolean;
  isTouchDevice?: boolean;
  reduceMotion?: boolean;
  isSovereign?: boolean;
}

const MapNodeView: FC<NodeProps> = memo(({ node, nodeIndex, totalInRing, position, onClick, canOpenDetails = true, justDraggedId, justAdded, isHighlighted, isTouchDevice = false, reduceMotion = false, isSovereign = false }) => {
  const { audioIntensity } = useSynthesisState();
  const [showDelete, setShowDelete] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [pulseDone, setPulseDone] = useState(false);
  const [isExploding, setIsExploding] = useState(false);
  const archiveNode = useMapState((s) => s.archiveNode);

  useEffect(() => {
    if (isHighlighted) {
      setPulseDone(false);
      const t = setTimeout(() => setPulseDone(true), 2500);
      return () => clearTimeout(t);
    } else {
      setPulseDone(false);
    }
  }, [isHighlighted]);

  useEffect(() => {
    if (justAdded) {
      soundManager.playRadarPing(); // Use a distinct "birth" sound if available, otherwise radar ping
    }
  }, [justAdded]);

  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({ id: node.id });

  const hasMismatch = node.analysis?.recommendedRing && node.ring !== node.analysis.recommendedRing;
  const ringPos = useMemo(
    () => position ?? getRingPosition(node.ring, nodeIndex, totalInRing),
    [position, node.ring, nodeIndex, totalInRing]
  );
  const isDetached = !!node.isDetached;
  const glowClass = isDetached ? "" : NODE_GLOW_CLASS[node.ring];

  const missionBadge = useMemo(() => getMissionProgressSummary(node), [node]);

  const style: React.CSSProperties = {
    position: "absolute",
    top: `${ringPos.y}%`,
    left: `${ringPos.x}%`,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0) translate(-50%, -50%)`
      : "translate(-50%, -50%)",
    zIndex: isDragging ? 999 : 20,
    touchAction: "none",
    transition: transform ? "transform 0.18s cubic-bezier(0.1, 1, 0.2, 1)" : "top 0.7s ease-out, left 0.7s ease-out, transform 0.7s ease-out"
  };

  const handleDeleteClick = useCallback((e?: React.MouseEvent | any) => {
    if (e?.preventDefault) e.preventDefault();
    if (e?.stopPropagation) e.stopPropagation();
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setShowDelete(false);
    setShowConfirmDelete(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    setShowConfirmDelete(false);
    setIsExploding(true);
    if (soundManager.playEffect) {
      soundManager.playEffect("cosmic_pulse");
    } else {
      soundManager.playRadarPing();
    }
    setTimeout(() => {
      archiveNode(node.id);
    }, 700);
  }, [archiveNode, node.id]);

  const blockDeletePointer = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    // We only stop propagation to prevent the node from being dragged.
    // We avoid preventDefault() because it can block click events in some browsers/scenarios.
    e.stopPropagation();
  }, []);

  const handleClick = useCallback(() => {
    if (node.id === justDraggedId) return;
    soundManager.playRadarPing();
    if (onClick) onClick(node.id);
  }, [node.id, justDraggedId, onClick]);

  /*  Ring color for the breathing aura & Black Hole effect */
  const netEnergy = node.energyBalance?.netEnergy ?? 0;
  const isVampire = netEnergy < 0;
  const vampireIntensity = Math.min(Math.abs(netEnergy) / 20, 1); // Max intensity at -20

  // Enhanced ring colors with richer palette
  const ringPalette = isDetached
    ? {
        stroke: "var(--app-border)",
        bg: "var(--glass-bg)",
        glow: "rgba(148,163,184,0.05)",
        accent: "var(--text-secondary)",
        shadow: "rgba(0,0,0,0.05)"
      }
    : isVampire
      ? { stroke: "rgba(153,27,27,0.6)", bg: "linear-gradient(135deg, rgba(153,27,27,0.1), rgba(0,0,0,0.4))", glow: "rgba(185,28,28,0.1)", accent: "var(--consciousness-critical)", shadow: "rgba(185,28,28,0.2)" }
      : node.ring === "red"
        ? { stroke: "rgba(244,63,94,0.55)", bg: "var(--ds-color-glass-default)", glow: "var(--ds-color-primary-glow)", accent: "var(--consciousness-critical)", shadow: "color-mix(in srgb, var(--consciousness-critical) 12%, transparent)" }
        : node.ring === "yellow"
          ? { stroke: "rgba(251,191,36,0.55)", bg: "var(--ds-color-glass-default)", glow: "var(--ds-color-primary-glow)", accent: "var(--consciousness-accent)", shadow: "color-mix(in srgb, var(--consciousness-accent) 12%, transparent)" }
          : { stroke: "rgba(45,212,191,0.55)", bg: "var(--ds-color-glass-default)", glow: "var(--ds-color-primary-glow)", accent: "var(--consciousness-primary)", shadow: "color-mix(in srgb, var(--consciousness-primary) 12%, transparent)" };

  const auraColor = isDetached
    ? "rgba(71,85,105,0.08)"
    : isHighlighted
      ? (node.ring === "red" ? "rgba(244, 63, 94, 0.35)" : node.ring === "yellow" ? "rgba(251, 191, 36, 0.3)" : "rgba(45, 212, 191, 0.3)")
      : isVampire ? `rgba(185, 28, 28, ${0.1 + vampireIntensity * 0.3})` : "rgba(255, 255, 255, 0.02)";

  const auraBorderColor = isDetached
    ? "rgba(71,85,105,0.2)"
    : isHighlighted
      ? (node.ring === "red" ? "rgba(244, 63, 94, 0.6)" : node.ring === "yellow" ? "rgba(251, 191, 36, 0.5)" : "rgba(45, 212, 191, 0.5)")
      : isVampire ? `rgba(153, 27, 27, ${0.3 + vampireIntensity * 0.5})` : "rgba(255, 255, 255, 0.06)";

  const ringBorderColor = ringPalette.stroke;
  const ringBgColor = ringPalette.glow;

  return (
    <motion.div
      layout
      className="outline-none focus:outline-none focus-visible:outline-none"
      style={{
        ...style,
        filter: isExploding ? "brightness(3) contrast(2) blur(8px) url(#vampireDistortion)" : isVampire ? "url(#vampireDistortion)" : undefined,
        pointerEvents: isExploding ? "none" : "auto",
        WebkitTapHighlightColor: "transparent",
      }}
      initial={justAdded ? { scale: 0.2, opacity: 0, rotate: -45, filter: "brightness(2)" } : false}
      animate={isExploding ? { scale: 2, opacity: 0 } : justAdded ? { scale: 1, opacity: 1, rotate: 0, filter: "brightness(1)" } : undefined}
      transition={isExploding ? { duration: 0.6, ease: "easeOut" } : justAdded ? { duration: 0.8, type: "spring", bounce: 0.5 } : undefined}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      {/* ── Mirror & Sovereign Aura: The Soul Connection ── */}
      {node.isMirrorNode && (
        <motion.div
          className="absolute -inset-6 rounded-full pointer-events-none"
          style={{
            zIndex: -1,
            background: isSovereign 
              ? "radial-gradient(circle, rgba(234,179,8,0.2) 0%, rgba(139,92,246,0.1) 40%, transparent 70%)"
              : "radial-gradient(circle, rgba(45,212,191,0.15) 0%, rgba(251,191,36,0.05) 50%, transparent 70%)",
            boxShadow: isSovereign ? "inset 0 0 20px rgba(234,179,8,0.1)" : "inset 0 0 20px rgba(45,212,191,0.1)",
            border: isSovereign ? "1.5px solid rgba(234,179,8,0.3)" : "1.5px solid rgba(45,212,191,0.2)"
          }}
          animate={{
            scale: isSovereign ? [1, 1.25, 1] : [1, 1.15, 1],
            opacity: isSovereign ? [0.6, 0.9, 0.6] : [0.4, 0.7, 0.4],
            rotate: [0, 90, 180, 270, 360]
          }}
          transition={{
            duration: isSovereign ? 6 : 8,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      )}

      {/* Sovereign Crown (Elite Indicator) */}
      {node.isMirrorNode && isSovereign && (
        <motion.div
           className="absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-none"
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 1 }}
        >
           <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_#fbbf24]" />
        </motion.div>
      )}

      {/* Breathing aura ring */}
      <motion.div
        className="absolute -inset-2 rounded-full pointer-events-none"
        style={{
          zIndex: 0,
          border: `1.5px solid ${auraBorderColor}`,
          boxShadow: `0 0 ${20 + audioIntensity * 30}px ${auraColor}`
        }}
        animate={reduceMotion
          ? undefined
          : isHighlighted && !pulseDone
            ? {
              opacity: [0.6, 1, 0.6],
              scale: [1, 1.25, 1],
              x: [0, 2, -1, 1, 0],
              y: [0, -1, 2, -2, 0]
            }
            : isVampire && !isHighlighted
              ? {
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 0.85, 1],
              }
              : {
                opacity: [0.4, 0.8 + audioIntensity * 0.2, 0.4],
                scale: [1, 1.08 + audioIntensity * 0.05, 1],
                x: [0, 1.5, -1, 1, 0],
                y: [0, -1.2, 1.8, -0.8, 0]
              }
        }
        transition={reduceMotion ? undefined : {
          duration: isHighlighted && !pulseDone ? 1.2 : 6 + (nodeIndex % 3),
          repeat: Infinity,
          ease: isHighlighted && !pulseDone ? "easeOut" : "easeInOut",
          delay: (nodeIndex % 5) * 0.4
        }}
      />

      <motion.div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        tabIndex={-1}
        onTap={(e) => {
          // onTap is only triggered if it's not a drag
          handleClick();
        }}
        className={`relative z-10 select-none flex items-center gap-1 pr-1.5 transition-all rounded-full overflow-hidden cursor-pointer outline-none focus:outline-none focus-visible:outline-none ${
          isDragging ? "opacity-90 scale-[1.04] shadow-[0_24px_60px_rgba(0,0,0,0.95)]" : ""
        } ${isDetached ? "opacity-40 grayscale-[70%] saturate-50" : ""} ${hasMismatch ? "!border-amber-400/60" : ""}`}
        style={{
          background: ringPalette.bg,
          border: `1.5px solid ${hasMismatch ? "rgba(251,191,36,0.6)" : ringBorderColor}`,
          boxShadow: isDragging
            ? `0 0 40px ${ringPalette.shadow}, inset 0 0 20px ${ringBgColor}`
            : `0 4px 24px ${ringPalette.shadow}, inset 0 0 12px ${ringBgColor}`,
          backdropFilter: "blur(12px)",
        }}
        animate={!isDragging && !reduceMotion ? {
          y: isDetached ? [0, -3, 2, -1, 0] : [0, -1.5, 0.8, 0],
          x: isDetached ? [0, 2, -1.5, 1, 0] : [0, 0.8, -0.8, 0],
          rotate: isDetached ? [0, 0.5, -0.5, 0.3, 0] : 0,
        } : {}}
        transition={reduceMotion ? undefined : {
          duration: isDetached ? 12 + (nodeIndex % 7) : 8 + (nodeIndex % 5),
          repeat: Infinity,
          ease: "easeInOut",
          delay: (nodeIndex % 7) * 0.5
        }}
        whileHover={reduceMotion ? undefined : {
          boxShadow: `0 0 32px ${ringPalette.shadow}, 0 0 64px ${ringBgColor}, inset 0 0 16px ${ringBgColor}`,
          scale: 1.03,
        }}
      >
        {/* Neon shine streak — top highlight */}
        <div
          className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{ background: `linear-gradient(to right, transparent, ${ringPalette.accent}, transparent)`, opacity: 0.5 }}
        />

        {/* Avatar — cosmic circle with ring-colored glow */}
        <span
          className="shrink-0 w-9 h-9 rounded-full overflow-hidden flex items-center justify-center font-black relative"
          style={{
            background: isVampire
              ? `radial-gradient(circle, #080808 20%, rgba(153,27,27,${0.4 + vampireIntensity * 0.6}) 100%)`
              : isDetached
                ? "rgba(71, 85, 105, 0.4)"
                : `radial-gradient(circle, rgba(255,255,255,0.08) 0%, ${ringBgColor} 100%)`,
            color: isVampire ? "rgba(255,255,255,0.7)" : ringPalette.accent,
            border: `1.5px solid ${ringBorderColor}`,
            boxShadow: isVampire
              ? `inset 0 0 ${6 + vampireIntensity * 12}px #000, 0 0 ${vampireIntensity * 18}px rgba(153,27,27,0.6)`
              : `inset 0 0 8px ${ringBgColor}, 0 0 10px ${ringPalette.shadow}`,
            fontSize: "13px",
          }}
        >
          {node.avatarUrl ? (
            <img src={node.avatarUrl} alt="" className="w-full h-full object-cover pointer-events-none" />
          ) : (
            <span aria-hidden className="pointer-events-none">{node.label.trim() ? node.label.trim()[0].toUpperCase() : ""}</span>
          )}
        </span>

        {/* Clickable label */}
        <motion.div

          style={{ color: "var(--text-primary)", letterSpacing: "0.02em" }}
          title={
            hasMismatch
              ? canOpenDetails
                ? "⚠️ تعارض — اضغط للتفاصيل"
                : "⚠️ تعارض — التفاصيل موقفة حالياً"
              : canOpenDetails
                ? `اضغط لرؤية تفاصيل ${node.label}`
                : "التفاصيل موقفة حالياً"
          }
          whileHover={reduceMotion ? undefined : { x: -1 }}
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <span className="flex flex-col items-start gap-0.5">
            <span
              className="text-xs md:text-sm font-bold leading-tight tracking-wide"
              style={{ color: isHighlighted ? ringPalette.accent : "var(--text-primary)" }}
            >
              {node.label}
            </span>
            {missionBadge ? (
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide"
                style={{
                  background: missionBadge.tone === "done"
                    ? "rgba(45,212,191,0.18)"
                    : "rgba(251,191,36,0.18)",
                  color: missionBadge.tone === "done" ? "#5eead4" : "#fbbf24",
                  border: `1px solid ${missionBadge.tone === "done" ? "rgba(45,212,191,0.35)" : "rgba(251,191,36,0.35)"}`,
                  boxShadow: missionBadge.tone === "done" ? "0 0 6px rgba(45,212,191,0.2)" : "0 0 6px rgba(251,191,36,0.2)",
                }}
              >
                {missionBadge.label}
              </span>
            ) : null}
            {node.quizResult && (
              <span
                title={`نتيجة الاختبار: ${node.quizResult.bandTitle}`}
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold"
                style={{
                  background: `${node.quizResult.bandColor}18`,
                  color: node.quizResult.bandColor,
                  border: `1px solid ${node.quizResult.bandColor}35`,
                  maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}
              >
                🔗 {node.quizResult.bandTitle.replace(/ [\u{1F300}-\u{1FFFF}]/gu, "").trim()}
              </span>
            )}
            {/* ── Energy Bar ── */}
            {!isDetached && (() => {
              const net = node.energyBalance?.netEnergy ?? 0;
              if (net === 0) return null;
              const clamp = Math.min(Math.abs(net), 20);
              const pct = (clamp / 20) * 100;
              const isPos = net > 0;
              return (
                <span className="flex items-center gap-1 w-full mt-0.5" aria-label={`طاقة: ${net}`}>
                  <span
                    className="block h-[3px] rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      maxWidth: "100%",
                      background: isPos
                        ? "linear-gradient(90deg,#2dd4bf,#5eead4)"
                        : "linear-gradient(90deg,#f43f5e,#fb7185)",
                      boxShadow: isPos ? "0 0 4px rgba(45,212,191,0.6)" : "0 0 4px rgba(244,63,94,0.6)",
                    }}
                  />
                  <span
                    className="text-[8px] font-bold shrink-0 tabular-nums"
                    style={{ color: isPos ? "#5eead4" : "#fb7185" }}
                  >
                    {net > 0 ? `+${net}` : net}
                  </span>
                </span>
              );
            })()}
          </span>
        </motion.div>

        {/* Drag handle */}
        <span
          {...listeners}
          {...attributes}
          className="shrink-0 p-1.5 rounded-r-full cursor-grab active:cursor-grabbing touch-none"
          style={{ color: ringBorderColor, opacity: 0.7 }}
          title="اسحب لتحريك الدائرة"
          aria-label="اسحب للتحريك"
        >
          <GripVertical className="w-3.5 h-3.5" strokeWidth={2.5} />
        </span>
      </motion.div>

      {/* Mismatch warning */}
      {hasMismatch && (
        <motion.div
          className="absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center z-30"
          style={{
            background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
            boxShadow: "0 0 12px rgba(251, 191, 36, 0.4)"
          }}
          animate={reduceMotion ? undefined : {
            scale: [1, 1.15, 1],
            boxShadow: [
              "0 0 8px rgba(251, 191, 36, 0.3)",
              "0 0 20px rgba(251, 191, 36, 0.5)",
              "0 0 8px rgba(251, 191, 36, 0.3)"
            ]
          }}
          transition={reduceMotion ? undefined : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-white text-[10px] font-bold">!</span>
        </motion.div>
      )}

      {/* Delete X button — hover only */}
      <AnimatePresence>
        {showDelete && (
          <motion.button
            type="button"
            onPointerDown={blockDeletePointer}
            onClick={handleDeleteClick}
            className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center z-30 pointer-events-auto shadow-xl group/del"
            style={{
              background: "linear-gradient(135deg, #64748b, #475569)",
              boxShadow: "0 2px 10px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1)",
              outline: "none",
              WebkitTapHighlightColor: "transparent",
              border: "1.5px solid rgba(255,255,255,0.15)",
            }}
            whileHover={{ scale: 1.1, background: "linear-gradient(135deg, #475569, #334155)" }}
            whileTap={{ scale: 0.9 }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: "backOut" }}
            tabIndex={-1}
          >
            <X className="w-4 h-4 text-white/90 pointer-events-none transition-transform group-hover/del:rotate-90" strokeWidth={3} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center"
            style={{ background: "rgba(5,8,20,0.75)", backdropFilter: "blur(8px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConfirmDelete(false)}
          >
            <motion.div
              className="relative mx-4 w-full max-w-xs rounded-2xl p-5 text-right"
              style={{
                background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.95))",
                border: "1px solid rgba(244,63,94,0.25)",
                boxShadow: "0 0 40px rgba(244,63,94,0.15), 0 20px 60px rgba(0,0,0,0.6)",
              }}
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon */}
              <div className="flex justify-center mb-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(244,63,94,0.12)", border: "1.5px solid rgba(244,63,94,0.3)" }}
                >
                  <X className="w-5 h-5" style={{ color: "#f43f5e" }} strokeWidth={2.5} />
                </div>
              </div>
              {/* Text */}
              <p className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                خرّج "{node.label}" من المدار؟
              </p>
              <p className="text-xs mb-5" style={{ color: "var(--text-secondary)" }}>
                هيتحفظ في "أشخاص مشافين" وتقدر تعيده لو احتجت.
              </p>
              {/* Buttons */}
              <div className="flex gap-2 flex-row-reverse">
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: "linear-gradient(135deg, #f43f5e, #e11d48)",
                    color: "#fff",
                    boxShadow: "0 0 16px rgba(244,63,94,0.3)",
                    outline: "none",
                    border: "none",
                  }}
                >
                  موافق
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    color: "var(--text-secondary)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    outline: "none",
                  }}
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}, (prev, next) => {
  const a = prev.node;
  const b = next.node;
  return (
    a.id === b.id &&
    a.label === b.label &&
    a.ring === b.ring &&
    a.avatarUrl === b.avatarUrl &&
    a.isDetached === b.isDetached &&
    a.analysis?.recommendedRing === b.analysis?.recommendedRing &&
    a.quizResult?.bandTitle === b.quizResult?.bandTitle &&
    prev.nodeIndex === next.nodeIndex &&
    prev.totalInRing === next.totalInRing &&
    prev.justDraggedId === next.justDraggedId &&
    prev.justAdded === next.justAdded &&
    prev.isHighlighted === next.isHighlighted &&
    prev.isTouchDevice === next.isTouchDevice &&
    prev.reduceMotion === next.reduceMotion &&
    prev.isSovereign === next.isSovereign &&
    (prev.position?.x ?? null) === (next.position?.y ?? null) &&
    (prev.position?.y ?? null) === (next.position?.y ?? null) &&
    prev.onClick === next.onClick
  );
});

/* ── Illusion Embodiment (Shadow Asteroids) ── */

interface IllusionEntityProps {
  id: string;
  label: string;
  type: string;
  orbitAngle: number;
  onDestroyed: (id: string) => void;
}

const IllusionEntity: FC<IllusionEntityProps> = memo(({ id, label, type, orbitAngle, onDestroyed }) => {
  const [isDismantling, setIsDismantling] = useState(false);
  const { addXP } = useGamification();

  // حساب موضع الكويكب في المدار الخارجي (radius = 48)
  const x = 50 + 49 * Math.cos(orbitAngle);
  const y = 50 + 49 * Math.sin(orbitAngle);

  const handleDismantleStart = () => {
    setIsDismantling(true);
    soundManager.playEffect("cosmic_pulse");
  };

  const confirmDismantle = () => {
    soundManager.playEffect("celebration");
    addXP(100, "تفكيك صنم إدراكي");
    onDestroyed(id);
  };

  return (
    <motion.div
      className="absolute z-40 pointer-events-auto"
      style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0, filter: "brightness(2) blur(10px)" }}
    >
      <div className="relative group">
        <motion.button
          type="button"
          onClick={handleDismantleStart}
          className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-indigo-500/50 relative overflow-hidden"
          style={{
            background: "var(--app-surface)",
            boxShadow: "0 0 15px rgba(79, 70, 229, 0.4)",
          }}
          animate={{
            boxShadow: ["0 0 15px rgba(79,70,229,0.4)", "0 0 30px rgba(124,58,237,0.7)", "0 0 15px rgba(79,70,229,0.4)"],
            y: [-2, 2, -2],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay" />
          <Flame className="w-5 h-5 text-indigo-300 opacity-80" />
        </motion.button>
        
        {/* التسمية */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950/80 px-2 py-1 rounded-md border border-indigo-500/30">
            {label} ⚡
          </span>
        </div>

        {/* قائمة التفكيك */}
        <AnimatePresence>
          {isDismantling && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-[220px] bg-slate-900/95 backdrop-blur-xl border border-indigo-500/50 rounded-2xl p-4 shadow-[0_0_40px_rgba(79,70,229,0.3)] z-50 flex flex-col items-center text-center gap-3"
            >
              <h4 className="text-white text-sm font-bold">تفكيك {label}</h4>
              <p className="text-xs text-indigo-200/80 leading-relaxed">
                أنِزل هذا الصنم من عقلك. انحره بقوة الوعي والمواجهة الآن!
              </p>
              <div className="flex gap-2 w-full pt-2">
                <button
                  type="button"
                  onClick={() => setIsDismantling(false)}
                  className="flex-1 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
                >
                  تراجع
                </button>
                <button
                  type="button"
                  onClick={confirmDismantle}
                  className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-rose-500 to-indigo-600 text-white text-xs font-bold hover:shadow-[0_0_15px_rgba(244,63,94,0.5)] transition flex items-center justify-center gap-1"
                >
                  <Zap className="w-3 h-3" />
                  أنا أفككك!
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

/*  Ring Labels  */

const RING_LABELS: Record<Ring, string> = {
  green: mapCopy.legendGreen,
  yellow: mapCopy.legendYellow,
  red: mapCopy.legendRed
};

/*  Droppable Ring Zone  */

const DroppableRing: FC<{ id: Ring | "grey"; sizePct: number; zIndex: number }> = memo(({ id, sizePct, zIndex }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const colorMap: Record<string, string> = {
    grey: RING_COLORS.detached.stroke,
    green: RING_COLORS.safe.stroke,
    yellow: RING_COLORS.caution.stroke,
    red: RING_COLORS.danger.stroke
  };
  const color = colorMap[id] ?? colorMap.grey;
  return (
    <div
      ref={setNodeRef}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
      style={{
        width: `${sizePct}%`,
        height: `${sizePct}%`,
        zIndex,
        transition: "all 0.2s ease",
        opacity: isOver ? 1 : 0,
        backgroundColor: isOver ? `${color}18` : "transparent",
        boxShadow: isOver
          ? `0 0 0 2px ${color}60, 0 0 60px ${color}40, inset 0 0 40px ${color}10`
          : "none",
        transform: isOver
          ? "translate(-50%,-50%) scale(1.04)"
          : "translate(-50%,-50%) scale(1)",
      }}
      aria-hidden
    />
  );
});

/*  Me Center Colors (Cosmic Orb)  */

const ME_CENTER_STYLES: Record<string, { fill: string; glow: string; pulseScale: number[] }> = {
  drained: {
    fill: "url(#meDrained)",
    glow: "rgba(100, 116, 139, 0.3)",
    pulseScale: [1, 1.03, 1]
  },
  okay: {
    fill: "url(#meOkay)",
    glow: "rgba(45, 212, 191, 0.3)",
    pulseScale: [1, 1.06, 1]
  },
  charged: {
    fill: "url(#meCharged)",
    glow: "rgba(45, 212, 191, 0.6)",
    pulseScale: [1, 1.1, 1]
  }
};


/* 
    MAIN CANVAS COMPONENT
    */

interface MapCanvasProps {
  onNodeClick?: (id: string) => void;
  onAddNode?: () => void;
  onMeClick?: () => void;
  canOpenDetails?: boolean;
  goalIdFilter?: string;
  galaxyGoalIds?: string[];
  /** عد اضغط  اسج  اعدة تع بضة ب دارا */
  highlightNodeId?: string | null;
  isSovereign?: boolean;
  /** حاة بؤرة اع */
  aiState?: {
    isConnected: boolean;
    isListening: boolean;
    isSpeaking?: boolean;
    onToggle: () => void;
    onNodeDrop: (nodeId: string) => void;
  };
}


export const MapCanvas: FC<MapCanvasProps> = ({
  onNodeClick,
  onAddNode,
  onMeClick,
  canOpenDetails = true,
  goalIdFilter,
  galaxyGoalIds,
  highlightNodeId,
  isSovereign = false,
  aiState
}) => {
  const allNodes = useMapState((s) => s.nodes);
  const [isSimulation, setIsSimulation] = useState(false);
  const [simulatedNodes, setSimulatedNodes] = useState<MapNodeType[]>([]);

  const lastAddedNodeId = useMapState((s) => s.lastAddedNodeId);
  const activeNodes = isSimulation ? simulatedNodes : allNodes;

  // ── Active Illusion Logic ──
  const topScenarios = useAdminState((s) => s.liveStatsCache?.data?.stats?.topScenarios ?? []);
  const [destroyedIllusions, setDestroyedIllusions] = useState<Set<string>>(new Set());

  // ── Bio-Feedback Engine ──
  const lastPulse = usePulseState((s) => s.lastPulse);
  
  const { speedScale, vignetteGradient } = useMemo(() => {
    if (!lastPulse) return { speedScale: 1, vignetteGradient: "transparent" };
    const { energy, mood } = lastPulse;
    
    // Scale breathing rhythm based on energy (1-10) -> Lower energy = slower rhythm (higher duration x scale)
    const normalizedEnergy = Number.isFinite(energy) ? energy : 5;
    const speedScale = 1 + (5 - normalizedEnergy) * 0.15; 
    
    let vignetteGradient = "transparent";
    if (mood === "anxious" || mood === "tense" || mood === "angry") {
      vignetteGradient = "radial-gradient(circle, transparent 50%, rgba(244,63,94,0.15) 100%)";
    } else if (mood === "sad" || mood === "overwhelmed") {
      vignetteGradient = "radial-gradient(circle, transparent 40%, rgba(99,102,241,0.2) 100%)";
    } else if (mood === "calm" || mood === "bright" || mood === "hopeful") {
      vignetteGradient = "radial-gradient(circle, transparent 60%, rgba(45,212,191,0.08) 100%)";
    }
    
    return { speedScale: Math.max(0.5, Math.min(2, speedScale)), vignetteGradient };
  }, [lastPulse]);

  useEffect(() => {
    if (lastPulse && (lastPulse.mood === "anxious" || lastPulse.mood === "tense")) {
       const interval = setInterval(() => {
          if (Math.random() > 0.8) soundManager.playEffect("tension");
       }, 20000);
       return () => clearInterval(interval);
    }
  }, [lastPulse]);

  const activeIllusions = useMemo(() => {
    let scenarios = topScenarios;
    if (scenarios.length === 0) {
      scenarios = [
        { key: "illusion_anx", label: "وهم السيطرة", percent: 45, count: 120 },
        { key: "illusion_sad", label: "وهم التعلق", percent: 30, count: 80 },
        { key: "illusion_ang", label: "صنم الأنا", percent: 25, count: 40 }
      ] as any;
    }
    return scenarios.filter((s: any) => !destroyedIllusions.has(s.key));
  }, [topScenarios, destroyedIllusions]);

  const handleDestroyIllusion = useCallback((id: string) => {
    setDestroyedIllusions(prev => new Set(prev).add(id));
  }, []);

  const nodes = useMemo(() => {
    const filtered = filterNodesByContext(activeNodes, goalIdFilter, galaxyGoalIds).filter((n) => !n.isNodeArchived);
    console.log("[MapCanvas Debug] allNodes:", allNodes.length, "activeNodes:", activeNodes.length, "filteredNodes:", filtered.length, "goalIdFilter:", goalIdFilter);
    if (allNodes.length > 0 && filtered.length === 0) {
      console.warn("[MapCanvas Debug] Nodes exist in store but none passed the filter!");
      console.log("[MapCanvas Debug] Sample node goalIds:", allNodes.slice(0, 5).map(n => n.goalId));
    }
    return filtered;
  }, [activeNodes, goalIdFilter, galaxyGoalIds, allNodes]);


  const archivedNodes = useMemo(() => {
    return allNodes.filter(n => n.isNodeArchived).map(n => {
      // Deterministic but random-looking position for the nebula stars
      const seed = String(n.id || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const angle = (seed % 360) * (Math.PI / 180);
      const distance = 48 + (seed % 15); // Far background, beyond rings
      const rawX = 50 + distance * Math.cos(angle);
      const rawY = 50 + distance * Math.sin(angle);
      return {
        id: n.id,
        x: Number.isFinite(rawX) ? rawX : 50,
        y: Number.isFinite(rawY) ? rawY : 50,
        opacity: 0.1 + (seed % 10) / 40,
        size: 0.5 + (seed % 10) / 10
      };
    });
  }, [allNodes]);

  const [showArchiveToast, setShowArchiveToast] = useState(false);
  const [lastArchivedName, setLastArchivedName] = useState<string | undefined>(undefined);
  const [showBatteryModal, setShowBatteryModal] = useState(false);
  const { archivedCount, latestArchivedLabel } = useMemo(() => {
    // Perf: single-pass aggregation avoids repeated filter + sort on every nodes update.
    let count = 0;
    let latestArchivedAt = -1;
    let latestLabel: string | undefined;
    for (const node of allNodes) {
      if (!node.isNodeArchived) continue;
      count += 1;
      if (!node.archivedAt) continue;
      if (node.archivedAt > latestArchivedAt) {
        latestArchivedAt = node.archivedAt;
        latestLabel = node.label;
      }
    }
    return { archivedCount: count, latestArchivedLabel: latestLabel };
  }, [allNodes]);
  const prevArchivedCountRef = useRef(archivedCount);
  useEffect(() => {
    if (archivedCount > prevArchivedCountRef.current) {
      setLastArchivedName(latestArchivedLabel);
      setShowArchiveToast(true);
      const t = setTimeout(() => setShowArchiveToast(false), 4500);
      prevArchivedCountRef.current = archivedCount;
      return () => clearTimeout(t);
    }
    prevArchivedCountRef.current = archivedCount;
  }, [archivedCount, latestArchivedLabel]);

  const [showDragHint, setShowDragHint] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => {
    // Only show hint if no nodes yet, or specifically if onboarding not seen
    if (!hasSeenOnboarding() || (nodes.length > 0 && nodes.length < 3)) {
      const t = setTimeout(() => setShowDragHint(true), 3000);
      return () => clearTimeout(t);
    }
  }, [nodes.length]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(hover: none)");
    const sync = () => setIsTouchDevice(media.matches);
    sync();
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", sync);
      return () => media.removeEventListener("change", sync);
    }
    media.addListener(sync);
    return () => media.removeListener(sync);
  }, []);

  const { hasAnsweredToday } = useDailyPulse();
  const isRevealState = nodes.length === 0 && hasAnsweredToday;

  const moveNodeToRing = useMapState((s) => s.moveNodeToRing);
  const setDetached = useMapState((s) => s.setDetached);
  const battery = useMeState((s) => s.battery);
  const meStyle = ME_CENTER_STYLES[battery] ?? ME_CENTER_STYLES.okay;

  // Haptic feedback helper
  const triggerHaptic = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50); // Short, crisp vibration
    }
  }, []);

  // Long press on Me center → Battery State Modal
  const meLongPressHandlers = useLongPress({
    onLongPress: () => {
      soundManager.playEffect('cosmic_pulse');
      setShowBatteryModal(true);
    },
    delay: 600,
  });

  // Set up listener for the custom undo event dispatched from mapState
  const [undoData, setUndoData] = useState<{ nodeId: string; nodeLabel: string; fromRing: Ring; toRing: Ring } | null>(null);
  const [showUndoToast, setShowUndoToast] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleUndoReady = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        triggerHaptic(); // Vibrate when a person is moved
        setUndoData(customEvent.detail);
        setShowUndoToast(true);

        // Auto-hide the undo toast after 5 seconds
        const t = setTimeout(() => {
          setShowUndoToast(false);
        }, 5000);

        // Cleanup the timer if another move happens
        return () => clearTimeout(t);
      }
    };
    window.addEventListener("dawayir-undo-ring", handleUndoReady);
    return () => window.removeEventListener("dawayir-undo-ring", handleUndoReady);
  }, [triggerHaptic]);

  const commitUndo = useCallback(() => {
    if (!undoData) return;
    triggerHaptic();
    moveNodeToRing(undoData.nodeId, undoData.fromRing);
    setShowUndoToast(false);
    setUndoData(null);
  }, [undoData, moveNodeToRing, triggerHaptic]);

  const { user } = useAuthState();
  const [isCommitProcessing, setIsCommitProcessing] = useState(false);
  const {
    displayScore: optimisticPhoenixScore,
    sourceScore: sourcePhoenixScore,
    pendingOps: pendingPhoenixOps,
    isSyncing: isPhoenixSyncing,
    applyOptimistic: applyOptimisticPhoenix
  } = useOptimisticPhoenixSync(user?.id);

  //  Cognitive Debounce Integration 
  const { registerMutation } = useCognitiveDebounce(async (payload) => {
    setIsCommitProcessing(true);
    try {
      const response = await fetch('/api/awareness-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.status === 202) {
        console.log("Cognitive commit accepted.");
      }
    } catch (err) {
      logger.error("Failed to dispatch cognitive commit:", err);
    } finally {
      setTimeout(() => setIsCommitProcessing(false), 2000);
    }
  });

  const [pendingMove, setPendingMove] = useState<{ nodeId: string; nodeLabel: string; fromRing: Ring; toRing: Ring } | null>(null);
  const [justDraggedId, setJustDraggedId] = useState<string | null>(null);
  const dragTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { onDragStart: onKineticDragStart, onDragMove: onKineticDragMove, onDragEnd: onKineticDragEnd } = useKineticSensors();
  useEffect(() => () => { if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current); }, []);

  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 15 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 8 } });
  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      onKineticDragEnd(event);
      const activeId = String(event.active.id);
      const overId = event.over?.id;
      const node = nodes.find((n) => n.id === activeId);
      if (!node || typeof overId !== "string") return;

      if (overId === "grey") {
        soundManager.playEffect('tension');
        if (isSimulation) {
          setSimulatedNodes(prev => prev.map(n => n.id === activeId ? { ...n, isDetached: true } : n));
        } else {
          setDetached(activeId, true);
          //  Cognitive Audit 
          if (user) {
            applyOptimisticPhoenix('MAJOR_DETACHMENT');
            registerMutation({
              userId: user.id,
              actionType: 'MAJOR_DETACHMENT',
              targetId: activeId,
              nodeLabel: node.label,
              timestamp: Date.now()
            });
          }
        }
        setJustDraggedId(node.id);
        if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
        dragTimeoutRef.current = setTimeout(() => setJustDraggedId(null), 400);
        return;
      }

      if (overId === "ai-node") {
        aiState?.onNodeDrop(activeId);
        return;
      }

      if (overId === "green" || overId === "yellow" || overId === "red") {
        const toRing = overId as Ring;
        // Sound feedback based on destination ring
        if (toRing === "green") soundManager.playEffect('harmony');
        else if (toRing === "yellow") soundManager.playRadarPing();
        else soundManager.playEffect('tension');
        if (isSimulation) {
          setSimulatedNodes(prev => prev.map(n => n.id === activeId ? { ...n, ring: toRing, isDetached: false } : n));
        } else {
          const fromRing = node.ring;
          if (node.isDetached) {
            setDetached(activeId, false);
            moveNodeToRing(activeId, toRing);
          } else if (node.ring !== toRing) {
            moveNodeToRing(activeId, toRing);
          }
          //  Cognitive Audit 
          if (user && (fromRing !== toRing || node.isDetached)) {
            applyOptimisticPhoenix('CIRCLE_SHIFT');
            registerMutation({
              userId: user.id,
              actionType: 'CIRCLE_SHIFT',
              targetId: activeId,
              nodeLabel: node.label,
              fromRing,
              toRing,
              timestamp: Date.now()
            });
          }
        }
        setJustDraggedId(node.id);
        if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
        dragTimeoutRef.current = setTimeout(() => setJustDraggedId(null), 400);
        return;
      }
    },
    [
      nodes,
      setDetached,
      moveNodeToRing,
      isSimulation,
      aiState,
      onKineticDragEnd,
      applyOptimisticPhoenix,
      registerMutation,
      user
    ]
  );

  const confirmPlacement = useCallback(() => {
    if (!pendingMove) return;
    moveNodeToRing(pendingMove.nodeId, pendingMove.toRing);
    setPendingMove(null);
  }, [moveNodeToRing, pendingMove]);

  const { detachedNodes, ringNodes, nodesByRing } = useMemo(() => {
    const detached = nodes.filter((n) => n.isDetached);
    const ring = nodes.filter((n) => !n.isDetached);
    return {
      detachedNodes: detached,
      ringNodes: ring,
      nodesByRing: {
        green: ring.filter((n) => n.ring === "green"),
        yellow: ring.filter((n) => n.ring === "yellow"),
        red: ring.filter((n) => n.ring === "red")
      }
    };
  }, [nodes]);

  const shouldUseLightweightRendering = nodes.length > MAX_NODES_FOR_FULL_CONNECTIONS;
  const shouldSkipInterferenceScan = nodes.length > MAX_NODES_FOR_INTERFERENCE_SCAN;
  const shouldReduceMotion = nodes.length > MAX_NODES_FOR_FULL_MOTION;

  const nodePositions = useMemo(() => {
    const posMap: Record<string, { x: number; y: number }> = {};
    const totalDetached = detachedNodes.length;
    
    // 1. Position detached nodes
    detachedNodes.forEach((node, idx) => {
      posMap[node.id] = getGreyZonePosition(idx, Math.max(totalDetached, 1));
    });
    
    // 2. Position ring nodes
    Object.entries(nodesByRing).forEach(([ring, ringNodes]) => {
      ringNodes.forEach((node, idx) => {
        posMap[node.id] = getRingPosition(ring as Ring, idx, ringNodes.length);
      });
    });

    // 3. Position Ghost Node organically
    if (onAddNode) {
      const gCount = nodesByRing.green?.length || 0;
      const yCount = nodesByRing.yellow?.length || 0;
      const rCount = nodesByRing.red?.length || 0;
      
      // If map has no active ring nodes, put it prominently but safely below center
      if (ringNodes.length === 0) {
        posMap['ghost-add-node'] = { x: 50, y: 72 };
      } 
      // Otherwise, place it in the next available logical ring slot
      else if (gCount < 4) {
        posMap['ghost-add-node'] = getRingPosition('green', gCount, gCount + 1);
      } else if (yCount < 8) {
        posMap['ghost-add-node'] = getRingPosition('yellow', yCount, yCount + 1);
      } else if (rCount < 12) {
        posMap['ghost-add-node'] = getRingPosition('red', rCount, rCount + 1);
      } else {
        // Fallback to grey zone but offset to avoid extreme top/bottom
        const angle = (totalDetached * (2 * Math.PI) / (totalDetached + 1)) - Math.PI / 4;
        posMap['ghost-add-node'] = { 
          x: 50 + GREY_ZONE_RADIUS * Math.cos(angle), 
          y: 50 + GREY_ZONE_RADIUS * Math.sin(angle) 
        };
      }
    }
    
    return posMap;
  }, [detachedNodes, nodesByRing, nodes.length, onAddNode]);

  const connectionThreads = useMemo(() => {
    if (shouldUseLightweightRendering) return [];
    const lines: Array<{ id: string; x1: number; y1: number; x2: number; y2: number; color: string }> = [];
    const goalGroups: Record<string, typeof nodes> = {};

    nodes.forEach((node) => {
      // Only connect family, work, love groups for now to avoid clutter
      const gid = node.goalId;
      if (!gid || gid === "general") return;
      if (!goalGroups[gid]) goalGroups[gid] = [];
      goalGroups[gid].push(node);
    });

    Object.entries(goalGroups).forEach(([gid, group]) => {
      if (group.length < 2) return;
      const color =
        gid === "family"
          ? "rgba(45, 212, 191, 0.2)"
          : gid === "work"
            ? "rgba(167, 139, 250, 0.2)"
            : gid === "love"
              ? "rgba(251, 191, 36, 0.15)"
              : "rgba(255, 255, 255, 0.1)";

      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const p1 = nodePositions[group[i].id];
          const p2 = nodePositions[group[j].id];
          if (p1 && p2 && Number.isFinite(p1.x) && Number.isFinite(p1.y) && Number.isFinite(p2.x) && Number.isFinite(p2.y)) {
            lines.push({
              id: `${group[i].id}-${group[j].id}`,
              x1: p1.x,
              y1: p1.y,
              x2: p2.x,
              y2: p2.y,
              color
            });
          }
        }
      }
    });
    return lines;
  }, [nodes, nodePositions, shouldUseLightweightRendering]);

  const interferenceLines = useMemo(() => {
    if (shouldSkipInterferenceScan) return [];
    const findings = analyzeMapInterference(nodes);
    const lines: Array<{ id: string; x1: number; y1: number; x2: number; y2: number }> = [];

    findings.forEach((f, idx) => {
      const p1 = nodePositions[f.affectedNodes[0]];
      const p2 = nodePositions[f.affectedNodes[1]];
      if (p1 && p2 && Number.isFinite(p1.x) && Number.isFinite(p1.y) && Number.isFinite(p2.x) && Number.isFinite(p2.y)) {
        lines.push({
          id: `interference-${idx}`,
          x1: p1.x,
          y1: p1.y,
          x2: p2.x,
          y2: p2.y
        });
      }
    });
    return lines;
  }, [nodes, nodePositions, shouldSkipInterferenceScan]);

  const { viewBox } = useMemo(() => {
    if (!highlightNodeId) return { viewBox: "0 0 100 100" };
    const node = nodes.find((n) => n.id === highlightNodeId);
    if (!node) return { viewBox: "0 0 100 100" };

    const pos = nodePositions[node.id];
    if (!pos || !Number.isFinite(pos.x) || !Number.isFinite(pos.y)) return { viewBox: "0 0 100 100" };

    const zoomSize = 42;
    const vx = Math.max(0, Math.min(100 - zoomSize, pos.x - zoomSize / 2));
    const vy = Math.max(0, Math.min(100 - zoomSize, pos.y - zoomSize / 2));
    return { viewBox: `${vx} ${vy} ${zoomSize} ${zoomSize}` };
  }, [highlightNodeId, nodes, nodePositions]);

  return (
    <div className="absolute inset-0 z-0 pointer-events-auto flex flex-col items-center justify-center overflow-visible">
      <div
        className={`pointer-events-auto relative aspect-square w-[140vmin] h-[140vmin] max-w-none max-h-none transition-all duration-1000 ease-out opacity-90 mix-blend-lighten ${isSimulation ? "scale-[0.85] saturate-[0.8] brightness-125" : ""}`}
        id="map-canvas"
      >
        {/*  Reveal State Banner */}
        <AnimatePresence>
          {isRevealState && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-2 rounded-2xl bg-teal-500/10 border border-teal-500/20 backdrop-blur-xl shadow-2xl"
            >
              <p className="text-xs font-bold text-teal-400 whitespace-nowrap">المركزية جاهزة.. ابدأ بإضافة الدائرة الأولى.</p>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Visual Digest Feedback */}
        <AnimatePresence>
          {(isCommitProcessing || aiState?.isSpeaking) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full bg-slate-900/90 border border-indigo-500/50 text-indigo-300 text-[11px] font-mono backdrop-blur-md shadow-[0_0_20px_rgba(99,102,241,0.2)] flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              [System]: Autonomic UI Mutation.. Reshaping per emotional load.
            </motion.div>
          )}
        </AnimatePresence>
        {/* Phoenix Score — HIDDEN for clean map */}
        {isLegacyMapUiEnabled() && !isSimulation && (
          <div className="absolute top-2 right-2 z-[90] rounded-xl bg-slate-900/80 border border-teal-500/30 px-3 py-2 text-[11px] text-right backdrop-blur-md">
            <div className="font-bold text-teal-200 flex items-center gap-1 justify-end">
              <span>Phoenix Score:</span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={optimisticPhoenixScore.toFixed(3)}
                  initial={{ y: 7, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -7, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="inline-block min-w-[2.8rem] text-left"
                >
                  {optimisticPhoenixScore.toFixed(3)}
                </motion.span>
              </AnimatePresence>
            </div>
            <div className="text-slate-300">
              Source: {sourcePhoenixScore.toFixed(3)}
              {pendingPhoenixOps > 0 ? ` | queued: ${pendingPhoenixOps}` : ""}
              {isPhoenixSyncing ? " | syncing..." : ""}
            </div>
          </div>
        )}
        {/* Simulation Controls — HIDDEN for clean map */}
        {isLegacyMapUiEnabled() && (
          !isSimulation ? (
          <button
            onClick={() => {
              setSimulatedNodes([...allNodes]);
              setIsSimulation(true);
            }}
            className="absolute top-2 left-2 z-[60] flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-200 text-xs font-bold backdrop-blur-md hover:bg-teal-500/20 transition-all shadow-lg"
          >
            <Telescope className="w-4 h-4" />
            وضع المحاكاة (What-If)
          </button>
        ) : (
          <FutureSimulator nodes={simulatedNodes} onExitSimulation={() => setIsSimulation(false)} />
        ))}
        <DndContext onDragStart={onKineticDragStart} onDragMove={onKineticDragMove} onDragEnd={handleDragEnd} sensors={sensors}>
          <div className="absolute inset-0">
            {isLegacyMapUiEnabled() && shouldUseLightweightRendering && (
              <div className="absolute top-2 right-2 z-[70] rounded-xl bg-slate-900/80 border border-slate-700 px-2.5 py-1.5 text-[10px] text-slate-300">
                ت تفع ضع اأداء اعا عرض خفف
              </div>
            )}
            <motion.svg
              viewBox={viewBox}
              className="w-full h-full"
              animate={shouldReduceMotion ? undefined : { viewBox }}
              transition={shouldReduceMotion ? undefined : { duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* ── Nebula of Reclamation: Archived Stars ── */}
              <g className="nebula-reclamation">
                {archivedNodes.map((star) => (
                  <SafeMotionCircle
                    key={star.id}
                    cx={star.x}
                    cy={star.y}
                    r={(() => {
                      if (Number.isFinite(star.size)) return star.size;
                      console.warn(`[MapCanvas] Invalid star size for node ${star.id}:`, star.size);
                      return 0;
                    })()}
                    fill="rgba(255,255,255,1)"
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: [star.opacity, star.opacity * 2, star.opacity],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{
                      duration: 3 + (star.x % 5),
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    style={{ filter: "blur(0.4px)" }}
                  />
                ))}
              </g>

              {/* ── Pulse Echo: Ambient Heartbeat ── */}
              {!shouldReduceMotion && (
                <g opacity={0.3}>
                  {[1, 2, 3].map((i) => (
                    <SafeMotionCircle
                      key={i}
                      cx={50}
                      cy={50}
                      r={10}
                      fill="none"
                      stroke="rgba(45,212,191,0.15)"
                      strokeWidth={0.5}
                      animate={{
                        r: [10, 50],
                        opacity: [0.6, 0],
                        strokeWidth: [1, 0]
                      }}
                      transition={{
                        duration: 8,
                        repeat: Infinity,
                        delay: i * 2.5,
                        ease: "easeOut"
                      }}
                    />
                  ))}
                </g>
              )}
              {/* SVG Gradients for cosmic orb */}
              <defs>
                {/* ── Me Center Gradients ── */}
                <radialGradient id="meDrained" cx="50%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#94a3b8" />
                  <stop offset="70%" stopColor="#475569" />
                  <stop offset="100%" stopColor="#1e293b" />
                </radialGradient>
                <radialGradient id="meOkay" cx="50%" cy="38%" r="65%">
                  <stop offset="0%" stopColor="#5eead4" />
                  <stop offset="50%" stopColor="#2dd4bf" />
                  <stop offset="100%" stopColor="#0d9488" />
                </radialGradient>
                <radialGradient id="meCharged" cx="50%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#99f6e4" />
                  <stop offset="35%" stopColor="#5eead4" />
                  <stop offset="70%" stopColor="#2dd4bf" />
                  <stop offset="100%" stopColor="#0f766e" />
                </radialGradient>
                {/* Deep void space: layered cosmic core */}
                <radialGradient id="soulCore" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.9" />
                  <stop offset="40%" stopColor="#0d9488" stopOpacity="0.6" />
                  <stop offset="70%" stopColor="#042F2E" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </radialGradient>
                {/* Corona outer ring gradient */}
                <radialGradient id="soulCorona" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="transparent" />
                  <stop offset="55%" stopColor="#2dd4bf" stopOpacity="0.08" />
                  <stop offset="75%" stopColor="#2dd4bf" stopOpacity="0.15" />
                  <stop offset="85%" stopColor="#2dd4bf" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
                {/* Ring glass fills — inner glow zones */}
                <radialGradient id="ringFillGreen" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(45,212,191,0.04)" />
                  <stop offset="70%" stopColor="rgba(45,212,191,0.02)" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
                <radialGradient id="ringFillYellow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(251,191,36,0.04)" />
                  <stop offset="70%" stopColor="rgba(251,191,36,0.02)" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
                <radialGradient id="ringFillRed" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(244,63,94,0.04)" />
                  <stop offset="70%" stopColor="rgba(244,63,94,0.02)" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
                {/* Center halo for reveal state */}
                <radialGradient id="centerHaloGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(45,212,191,0.3)" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
                {/* ── Sovereign Fluid Dynamics & Glitch Filters ── */}
                
                {/* Organic Gooey Filter for safe/yellow nodes */}
                <filter id="organicGoo" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                  <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
                  <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                </filter>

                {/* Simplified Clean Distortion Filter */}
                <filter id="vampireDistortion" x="-200%" y="-200%" width="500%" height="500%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feColorMatrix type="matrix" values="1 0 0 0 0  0 0.1 0 0 0  0 0.1 0 0 0  0 0 0 0.8 0" in="blur" result="coloredBlur" />
                  <feComposite in="SourceGraphic" in2="coloredBlur" operator="over" />
                </filter>

                {/* ── Simplified Clean Glows ── */}
                <filter id="neonGlowRed" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="5" result="coloredBlur" />
                  <feFlood floodColor="#E11D48" floodOpacity="0.8" result="glowColor" />
                  <feComposite in="glowColor" in2="coloredBlur" operator="in" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                
                <filter id="neonGlowWarning" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="4.5" result="coloredBlur" />
                  <feFlood floodColor="#F59E0B" floodOpacity="0.75" result="glowColor" />
                  <feComposite in="glowColor" in2="coloredBlur" operator="in" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                
                <filter id="neonGlowSafe" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="coloredBlur" />
                  <feFlood floodColor="#0D9488" floodOpacity="0.8" result="glowColor" />
                  <feComposite in="glowColor" in2="coloredBlur" operator="in" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                
                {/* Center mega glow */}
                <filter id="centerMegaGlow" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feFlood floodColor="#2DD4BF" floodOpacity="0.6" result="glowColor" />
                  <feComposite in="glowColor" in2="blur" operator="in" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                
                {/* Universal soft glow */}
                <filter id="cosmicGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* ── Cosmic Star Field (Dark Mode Only) ── */}
              <g className="pointer-events-none dark-visible hidden dark:block">
                {STAR_DATA.map((s) => (
                  <SafeMotionCircle
                    key={s.id}
                    cx={s.cx} cy={s.cy} r={Number.isFinite(s.r) ? s.r : 0}
                    fill="white"
                    opacity={s.opacity}
                    animate={{ opacity: [s.opacity, s.opacity * 3, s.opacity] }}
                    transition={{
                      duration: s.animDuration,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: s.animDelay,
                    }}
                  />
                ))}
              </g>
              {connectionThreads.map((line) => {
                const isGreen = line.color?.includes("45, 212") || line.color?.includes("2dd4") || line.color?.includes("2DD4");
                const isYellow = line.color?.includes("251, 191") || line.color?.includes("fbbf");
                const threadColor = line.color ?? "var(--soft-teal)";
                const glowColor = isGreen
                  ? "rgba(45,212,191,0.6)"
                  : isYellow
                    ? "rgba(251,191,36,0.6)"
                    : "rgba(244,63,94,0.6)";
                const particleColor = isGreen ? "#14b8a6" : isYellow ? "#f59e0b" : "#f43f5e";

                return (
                  <g key={line.id}>
                    {/* Outer glow halo */}
                    <motion.line
                      x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                      stroke={glowColor}
                      strokeWidth={2}
                      opacity={0}
                      style={{ filter: "blur(2px)" }}
                      animate={{ opacity: [0.04, 0.18, 0.04] }}
                      transition={{ duration: 3 + (line.x1 % 2), repeat: Infinity, ease: "easeInOut" }}
                    />
                    {/* Core laser line */}
                    <motion.line
                      x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                      stroke={threadColor}
                      strokeWidth={0.8}
                      strokeDasharray="3 6"
                      animate={{
                        opacity: [0.25, 0.7, 0.25],
                        strokeDashoffset: [0, -18],
                      }}
                      transition={{
                        duration: 2.5 + (line.y1 % 1.5),
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    {/* Bright traveling particle */}
                    {!shouldReduceMotion && (
                      <SafeMotionCircle
                        r={0.9}
                        fill={particleColor}
                        animate={{
                          offsetDistance: ["0%", "100%"],
                          opacity: [0, 1, 1, 0],
                        }}
                        transition={{
                          duration: 2 + (line.x2 % 1.5),
                          repeat: Infinity,
                          ease: "linear",
                          delay: (line.y2 % 2),
                        }}
                        style={{
                          offsetPath: `path("M ${line.x1} ${line.y1} L ${line.x2} ${line.y2}")`,
                          filter: `drop-shadow(0 0 2px ${particleColor})`,
                        } as React.CSSProperties}
                      />
                    )}
                  </g>
                );
              })}

              {/* Sync Circles / Interference Waves — threat laser */}
              {!shouldReduceMotion && interferenceLines.map((line) => (
                <g key={line.id}>
                  {/* Glow halo */}
                  <line
                    x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                    stroke="rgba(244,63,94,0.3)"
                    strokeWidth={3}
                    style={{ filter: "blur(3px)" }}
                  />
                  {/* Core threat line */}
                  <motion.line
                    x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                    stroke="rgba(244,63,94,0.75)"
                    strokeWidth={0.9}
                    strokeDasharray="1.5 3"
                    animate={{
                      opacity: [0.4, 0.9, 0.4],
                      strokeDashoffset: [0, -10],
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                  {/* Traveling threat particle */}
                  <SafeMotionCircle
                    r={1.1}
                    fill="#fb7185"
                    animate={{ offsetDistance: ["0%", "100%"], opacity: [0, 1, 0] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear",
                      delay: line.x1 % 1,
                    }}
                    style={{
                      offsetPath: `path("M ${line.x1} ${line.y1} L ${line.x2} ${line.y2}")`,
                      filter: "drop-shadow(0 0 3px #f43f5e)",
                    } as React.CSSProperties}
                  />
                </g>
              ))}

              {/*  Orbital Rings (Breathing with Bio-Feedback)  */}
              {!shouldReduceMotion && <OrbitalRing
                ring="red"
                label="دائرة الخطر"
                radius={40}
                color={RING_COLORS.danger.stroke}
                glowColor={RING_COLORS.danger.glow}
                breatheDuration={5 * speedScale}
              />}
              {!shouldReduceMotion && <OrbitalRing
                ring="yellow"
                label="دائرة الحذر"
                radius={29}
                color={RING_COLORS.caution.stroke}
                glowColor={RING_COLORS.caution.glow}
                breatheDuration={4.5 * speedScale}
              />}
              {!shouldReduceMotion && <OrbitalRing
                ring="green"
                label="دائرة الأمان"
                radius={18}
                color={RING_COLORS.safe.stroke}
                glowColor={RING_COLORS.safe.glow}
                breatheDuration={4 * speedScale}
              />}

              {/* Halo around Center during Reveal State */}
              <AnimatePresence>
                {isRevealState && (
                  <motion.g
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.3, 0.15] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    style={{ transformOrigin: "50px 50px" }}
                  >
                    <circle cx="50" cy="50" r="16" fill="url(#centerHaloGradient)" className="pointer-events-none" />
                  </motion.g>
                )}
              </AnimatePresence>

              {/*  Detachment Zone — The Forbidden Frontier  */}
              <g className="pointer-events-none">
                {/* Outer mist field */}
                <SafeMotionCircle
                  cx="50" cy="50"
                  r={Number.isFinite(GREY_ZONE_STROKE_RADIUS) ? GREY_ZONE_STROKE_RADIUS + 2 : 0}
                  fill="none"
                  stroke="rgba(148,163,184,0.08)"
                  strokeWidth={5}
                  style={{ filter: "blur(3px)" }}
                  animate={shouldReduceMotion ? { opacity: 0.15 } : { opacity: [0.08, 0.18, 0.08] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />
                {/* Rotating dashed boundary */}
                <SafeMotionCircle
                  cx="50" cy="50"
                  r={Number.isFinite(GREY_ZONE_STROKE_RADIUS) ? GREY_ZONE_STROKE_RADIUS : 0}
                  fill="none"
                  stroke="rgba(148,163,184,0.25)"
                  strokeWidth={0.7}
                  strokeDasharray="2 4"
                  animate={shouldReduceMotion ? { opacity: 0.2 } : {
                    opacity: [0.15, 0.35, 0.15],
                    strokeDashoffset: [0, -30],
                  }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
                {/* Inner ghost field */}
                <SafeMotionCircle
                  cx="50" cy="50"
                  r={Number.isFinite(GREY_ZONE_STROKE_RADIUS) ? GREY_ZONE_STROKE_RADIUS - 2 : 0}
                  fill="none"
                  stroke="rgba(148,163,184,0.1)"
                  strokeWidth={0.4}
                  strokeDasharray="0.5 3"
                  animate={shouldReduceMotion ? { opacity: 0.1 } : {
                    opacity: [0.05, 0.15, 0.05],
                    strokeDashoffset: [0, 20],
                  }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                />
                {/* "LOST" zone label */}
                {detachedNodes.length > 0 && (
                  <text
                    x="50"
                    y={50 - GREY_ZONE_STROKE_RADIUS - 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fontSize: "2px",
                      fill: "rgba(148,163,184,0.35)",
                      letterSpacing: "0.3em",
                      fontWeight: 700,
                    }}
                  >
                    DETACHED
                  </text>
                )}
              </g>

              {/*  Center "Me" — Cosmic Planet  */}
              <g aria-label="أنت" className="me-node">

                {/* Deep void aura — background cosmic field */}
                {!shouldReduceMotion && (
                  <SafeMotionCircle
                    cx="50" cy="50" r={22}
                    fill="url(#soulCore)"
                    animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.9, 1.1, 0.9] }}
                    style={{ transformOrigin: "50px 50px" }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}

                {/* Corona ring — outermost atmospheric glow */}
                {!shouldReduceMotion && (
                  <SafeMotionCircle
                    cx="50" cy="50" r={13}
                    fill="none"
                    stroke={battery === "drained" ? "rgba(148,163,184,0.3)" : "rgba(45,212,191,0.35)"}
                    strokeWidth={2.5}
                    filter="url(#centerMegaGlow)"
                    animate={{ opacity: [0.4, 0.9, 0.4], strokeWidth: [2, 3.5, 2] }}
                    transition={{ duration: battery === "charged" ? 2 : 3.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}

                {/* 5 expanding heartbeat waves — synchronized pulse */}
                {!shouldReduceMotion && [0, 1.2, 2.4, 3.6, 4.8].map((delay, i) => (
                  <SafeMotionCircle
                    key={`wave-${i}`}
                    cx="50" cy="50" r={8}
                    stroke={battery === "drained" ? "rgba(148,163,184,0.6)" : battery === "charged" ? "rgba(94,234,212,0.7)" : "rgba(45,212,191,0.6)"}
                    strokeWidth={i === 0 ? 0.8 : 0.4}
                    fill="none"
                    animate={{ r: [8, 14 + i * 4], opacity: [0.7 - i * 0.12, 0] }}
                    transition={{ duration: battery === "charged" ? 2.5 : 3.5, repeat: Infinity, ease: "easeOut", delay }}
                  />
                ))}

                {/* Main Orb — the planet itself */}
                <motion.g
                  filter="url(#centerMegaGlow)"
                  animate={shouldReduceMotion ? undefined : {
                    scale: meStyle.pulseScale,
                    opacity: battery === "drained" ? [0.65, 0.85, 0.65] : [0.9, 1, 0.9]
                  }}
                  transition={shouldReduceMotion ? undefined : {
                    duration: battery === "charged" ? 2.2 : 3.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{ transformOrigin: "50px 50px" }}
                >
                  {/* Outer orb body */}
                  <SafeMotionCircle cx="50" cy="50" r={8.5} fill={meStyle.fill} />
                  {/* Inner highlight — the "eye" of the planet */}
                  <SafeMotionCircle cx="50" cy="50" r={3.5} fill="#ffffff" style={{ filter: "blur(1px)", opacity: 0.9 }} />
                  {/* Specular highlight dot */}
                  <SafeMotionCircle cx="48" cy="47.5" r={1.2} fill="#ffffff" opacity={0.7} />
                </motion.g>

                {/* "أنا" label */}
                <text
                  x="50"
                  y="62"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="select-none pointer-events-none"
                  style={{
                    fontSize: "3px",
                    fontWeight: 900,
                    fill: "var(--soft-teal)",
                    opacity: battery === "drained" ? 0.5 : 1,
                    letterSpacing: "0.15em",
                    filter: "drop-shadow(0 0 3px var(--soft-teal-glow))"
                  }}
                >
                  ◈ أنا ◈
                </text>
              </g>

              {/*  Drag Assist Hint  */}
              <AnimatePresence>
                {!shouldReduceMotion && showDragHint && (
                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="pointer-events-none"
                  >
                    {/* Ghost node */}
                    <motion.g
                      animate={{
                        x: [92, 68, 68, 92],
                        y: [50, 50, 50, 50],
                        opacity: [0, 0.8, 0.8, 0],
                        scale: [0.8, 1.1, 1.1, 0.8]
                      }}
                      transition={{
                        duration: 4.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        times: [0, 0.4, 0.8, 1]
                      }}
                    >
                      <SafeMotionCircle r={2.5} fill="rgba(45, 212, 191, 0.4)" />
                    </motion.g>
                    {/* Pulsing target */}
                    <motion.g
                      animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{ transformOrigin: "68px 50px" }}
                    >
                      <SafeMotionCircle cx={68} cy={50} r={4} fill="none" stroke="rgba(45, 212, 191, 0.4)" strokeWidth={0.5} />
                    </motion.g>
                  </motion.g>
                )}
              </AnimatePresence>
            </motion.svg>

            {/*  Node Overlays  */}
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
              <div className="relative w-full h-full pointer-events-auto">
                <AnimatePresence>
                  {ringNodes.map((node) => {
                    const nodesInSameRing = nodesByRing[node.ring];
                    const nodeIndex = nodesInSameRing.findIndex(n => n.id === node.id);
                    const totalInRing = nodesInSameRing.length;
                    return (
                      <MapNodeView
                        key={node.id}
                        node={node}
                        nodeIndex={nodeIndex}
                        totalInRing={totalInRing}
                        onClick={onNodeClick}
                        canOpenDetails={canOpenDetails}
                        justDraggedId={justDraggedId}
                        justAdded={lastAddedNodeId === node.id}
                        isHighlighted={highlightNodeId === node.id}
                        isTouchDevice={isTouchDevice}
                        reduceMotion={shouldReduceMotion}
                        isSovereign={isSovereign}
                      />
                    );
                  })}
                  {detachedNodes.map((node, i) => (
                    <MapNodeView
                      key={node.id}
                      node={node}
                      nodeIndex={i}
                      totalInRing={detachedNodes.length}
                      position={getGreyZonePosition(i, detachedNodes.length)}
                      onClick={onNodeClick}
                      canOpenDetails={canOpenDetails}
                      justDraggedId={justDraggedId}
                      justAdded={lastAddedNodeId === node.id}
                      isHighlighted={highlightNodeId === node.id}
                      isTouchDevice={isTouchDevice}
                      reduceMotion={shouldReduceMotion}
                      isSovereign={isSovereign}
                    />
                  ))}
                  {/* Ghost Add Person Node */}
                  {onAddNode && (
                    <motion.button
                      key="ghost-add-node"
                      layout
                      type="button"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute z-20 w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-dashed border-teal-500/50 bg-slate-800/30 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:border-teal-400 hover:bg-slate-700/50 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(45,212,191,0.3)] pointer-events-auto"
                      style={{
                        left: `${nodePositions['ghost-add-node']?.x ?? 50}%`,
                        top: `${nodePositions['ghost-add-node']?.y ?? 90}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                      onClick={(e) => { e.stopPropagation(); onAddNode(); }}
                      title="إضافة شخص جديد"
                    >
                      <Plus className="w-5 h-5 text-teal-400/70" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/*  Hint Banner for Reveal State  */}
            <AnimatePresence>
              {isRevealState && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                >
                  <div className="px-6 py-2.5 rounded-full glass-card border border-teal-500/30 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                    <div className="flex flex-col gap-1 items-start text-right" dir="rtl">
                      <span className="text-[10px] font-black tracking-widest text-teal-400/60 uppercase">النبض الاستباقي</span>
                      <span className="text-xs font-bold text-teal-100/90 whitespace-nowrap">
                        <Typewriter text="المدار جاهز لاستقبال رحلتك.. ابدأ بوضع أول عُقدة في خريطة وعيك لترسم معالم سيادتك." speed={50} />
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/*  Droppable Zones  */}
            <DroppableRing id="grey" sizePct={92} zIndex={9} />
            <DroppableRing id="red" sizePct={80} zIndex={10} />
            <DroppableRing id="yellow" sizePct={58} zIndex={11} />
            <DroppableRing id="green" sizePct={36} zIndex={12} />

            {/*  Illusion Embodiment (Shadow Asteroids)  */}
            <AnimatePresence>
              {activeIllusions.map((scenario: any, index: number) => (
                <IllusionEntityView
                  key={scenario.key}
                  scenario={scenario}
                  index={index}
                  total={activeIllusions.length}
                  onDismantle={handleDestroyIllusion}
                />
              ))}
            </AnimatePresence>

            {/*  Me click zone — tap = profile, long-press = Battery State  */}
            {onMeClick ? (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onMeClick(); }}
                {...meLongPressHandlers}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[20%] min-w-[56px] h-[20%] min-h-[56px] rounded-full z-30 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50"
                title="اضغط مطولاً لبطارية الطاقة"
                aria-label="افتح بطاقة أنا — ضغطة طويلة للبطارية"
              />
            ) : (
              <button
                type="button"
                {...meLongPressHandlers}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[20%] min-w-[56px] h-[20%] min-h-[56px] rounded-full z-30 cursor-pointer focus:outline-none"
                title="اضغط مطولاً لبطارية الطاقة"
                aria-label="ضغطة طويلة لحالة البطارية"
              />
            )}

            {/*  AINode (Organic Agent)  */}
            {aiState && (
              <AINode
                isConnected={aiState.isConnected}
                isListening={aiState.isListening}
                isSpeaking={aiState.isSpeaking}
                onToggle={aiState.onToggle}
              />
            )}
          </div>
        </DndContext>

        {/* ── Personalized Bio-Feedback Vignette ── */}
        <motion.div 
          className="absolute inset-0 pointer-events-none mix-blend-screen z-20"
          animate={{ background: vignetteGradient }}
          transition={{ duration: 4 }}
        />

        {/* ── Energy Crisis Warning (Glassmorphic) ── */}
        <AnimatePresence>
          {lastPulse && (lastPulse.energy <= 3 || lastPulse.mood === "overwhelmed") && (
            <motion.div
              className="absolute top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-full max-w-sm px-4"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 20 }}
            >
              <div className="glass-card bg-rose-900/30 border border-rose-500/30 p-3 rounded-2xl flex items-center gap-3 backdrop-blur-xl shadow-[0_0_30px_rgba(244,63,94,0.15)]">
                <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center shrink-0">
                  <Flame className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-rose-200">طاقتك منخفضة جداً</h4>
                  <p className="text-xs text-rose-300/80 leading-tight">احترس من اتخاذ قرارات تجاه العلاقات دلوقتي.. الوعي مشوش.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/*  Pending Move Confirmation (Glass)  */}
        {pendingMove && (
          <motion.div
            className="relative z-50 glass-card flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 px-5 py-4 text-right"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <p className="text-sm font-semibold flex-1" style={{ color: "var(--text-primary)" }}>
              "{pendingMove.nodeLabel}" إ {RING_LABELS[pendingMove.toRing]}
            </p>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setPendingMove(null)}
                className="cta-muted px-4 py-2 text-sm font-medium"
              >
                إغاء
              </button>
              <button
                type="button"
                onClick={confirmPlacement}
                className="cta-primary px-4 py-2 text-sm font-semibold"
              >
                {mapCopy.confirmPlacement}
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/*  Archive Toast  */}
      <JourneyToast
        variant="archive"
        personName={lastArchivedName}
        visible={showArchiveToast}
        onClose={() => setShowArchiveToast(false)}
      />

      {/* Undo Toast */}
      <JourneyToast
        variant="undo"
        personName={undoData?.nodeLabel}
        visible={showUndoToast}
        onClose={() => setShowUndoToast(false)}
        onAction={commitUndo}
      />

      {/* Battery State Modal — long press on Me */}
      <BatteryStateModal
        isOpen={showBatteryModal}
        onClose={() => setShowBatteryModal(false)}
      />
    </div>
  );
};
