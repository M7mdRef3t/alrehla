import React, { FC, memo, useMemo, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  DndContext, 
  TouchSensor, 
  MouseSensor, 
  useSensor, 
  useSensors, 
  useDraggable, 
  type DragEndEvent,
  DragOverlay,
  defaultDropAnimationSideEffects
} from "@dnd-kit/core";
import { useMapState } from '@/modules/map/dawayirIndex';
import { Ring, MapNode as MapNodeType } from "../map/mapTypes";
import { GripVertical, Plus, Minus, Hand, Target, AlertCircle, Info, X, Scissors } from "lucide-react";
import { useMasafatyAnalysis, EntropyLevel } from "./hooks/useMasafatyAnalysis";
import { Button } from '@/modules/meta/UI/Button';
import { SafeMotionCircle, toSafeSvgRadius, toSafeSvgCoordinate } from "@/components/ui/SafeSvg";

// Native SVG X Icon for better performance and consistency in SVG coordinate system
const NativeX: FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => (
  <g transform={`translate(${x}, ${y})`}>
    <line x1={-size/2} y1={-size/2} x2={size/2} y2={size/2} stroke="currentColor" strokeWidth={size/3} strokeLinecap="round" />
    <line x1={size/2} y1={-size/2} x2={-size/2} y2={size/2} stroke="currentColor" strokeWidth={size/3} strokeLinecap="round" />
  </g>
);

const toSafeSvgNumber = (value: unknown, fallback: number): number => {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
};

/* ─── Types ────────────────────────────────────────────────────────────────── */

interface DawayirCanvasProps {
  nodes?: MapNodeType[];
  onNodeClick: (node: MapNodeType) => void;
  onAddNode: () => void;
  goalId?: string;
  selectedNodeId?: string | null;
  onSelectNode?: (id: string | null) => void;
  onMoveNode?: (id: string, ring: Ring) => void;
  isSelectionMode?: boolean;
  isHandToolActive?: boolean;
}

/* ── Cinematic Constants ── */
const STAR_COUNT = 45;
const STAR_DATA = Array.from({ length: STAR_COUNT }, (_, i) => ({
  id: i,
  cx: (i * 13 + 7) % 100,
  cy: (i * 23 + 3) % 100,
  r: i % 7 === 0 ? 0.3 : i % 3 === 0 ? 0.2 : 0.1,
  opacity: 0.1 + (i % 5) * 0.05,
  animDelay: (i * 0.4) % 5,
  animDuration: 3 + (i % 6),
}));

/* ─── Components ───────────────────────────────────────────────────────────── */

const CinematicBackground: FC = memo(() => (
  <g className="pointer-events-none">
    <defs>
      <radialGradient id="nebula-grad-1" cx="20%" cy="30%" r="70%">
        <stop offset="0%" stopColor="var(--ring-safe)" stopOpacity="0.08" />
        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="nebula-grad-2" cx="80%" cy="70%" r="70%">
        <stop offset="0%" stopColor="var(--ring-danger)" stopOpacity="0.05" />
        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
      </radialGradient>
      <filter id="starGlow">
        <feGaussianBlur stdDeviation="0.2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    {/* Nebula Clouds */}
    <rect width="100" height="100" fill="url(#nebula-grad-1)" />
    <rect width="100" height="100" fill="url(#nebula-grad-2)" />
    <circle cx="50" cy="50" r="34" fill="none" stroke="rgba(94, 234, 212, 0.08)" strokeWidth="0.18" />
    <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(201, 168, 76, 0.06)" strokeWidth="0.12" />
    {[18, 30, 42, 54, 66, 78].map((x) => (
      <line
        key={`axis-${x}`}
        x1={x}
        y1="6"
        x2={50 + (x - 50) * 0.25}
        y2="94"
        stroke="rgba(94, 234, 212, 0.035)"
        strokeWidth="0.12"
      />
    ))}
  </g>
));

const OrbitalRing: FC<{ radius: number; label: string; ring: Ring }> = memo(({ radius, label, ring }) => {
  const colors = {
    green: "#34d399", // soft emerald
    yellow: "#fbbf24", // soft amber
    red: "#fb7185", // soft rose
  };

  const safeRadius = Number.isFinite(radius) && radius > 0 ? radius : 1;

  return (
    <g className={`dawayir-orbit dawayir-orbit--${ring}`}>
      <circle
        cx={50} cy={50} r={Math.max(safeRadius - 0.6, 1)}
        fill="none"
        stroke={colors[ring]}
        strokeOpacity="0.055"
        strokeWidth={1.8}
      />
      <circle 
        cx={50} cy={50} r={safeRadius} 
        fill="none" 
        stroke="rgba(255,255,255,0.08)" 
        strokeWidth={0.35} 
      />
      <circle
        cx={50} cy={50} r={safeRadius}
        fill="none"
        stroke={colors[ring]}
        strokeOpacity="0.34"
        strokeWidth={0.34}
      />
      
      {/* Animated Energy Trail */}
      <SafeMotionCircle
        cx={50} cy={50} r={safeRadius}
        fill="none"
        stroke={colors[ring]}
        strokeWidth={0.55}
        strokeOpacity={0.55}
        strokeDasharray={`${safeRadius * 0.5} ${safeRadius * 1.5}`}
        style={{
          filter: `drop-shadow(0 0 1.8px ${colors[ring]})`,
          transformOrigin: "50px 50px",
          willChange: "transform, filter",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: ring === 'green' ? 20 : ring === 'yellow' ? 30 : 40, repeat: Infinity, ease: "linear" }}
      />
    </g>
  );
});

const EntropyGlow: FC<{ x: number; y: number; level: EntropyLevel }> = memo(({ x, y, level }) => {
  if (level === 0) return null;
  
  const colors = {
    1: "var(--ring-caution)",
    2: "var(--ring-danger)",
    3: "var(--ring-danger)",
  };

  return (
    <SafeMotionCircle
      cx={Number.isFinite(x) ? x : 50} 
      cy={Number.isFinite(y) ? y : 50} 
      r={6}
      fill={colors[level as 1|2|3]}
      fillOpacity={level === 3 ? 0.6 : 0.4}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ 
        scale: [1, 1.3, 1],
        opacity: [0.3, 0.6, 0.3]
      }}
      transition={{ 
        duration: level === 3 ? 1.5 : 3, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
    />
  );
});

const MeNodeCenter: FC = memo(() => {
  return (
    <g transform="translate(50, 50)">
      {/* Ambient background grid / pattern */}
      <defs>
        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(45, 212, 191, 0.03)" strokeWidth="0.1"/>
        </pattern>
        <radialGradient id="meGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.3" />
          <stop offset="70%" stopColor="#0f172a" stopOpacity="0.05" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="meCoreGrad" x1="22%" y1="12%" x2="72%" y2="88%">
          <stop offset="0%" stopColor="#a7f3d0" />
          <stop offset="45%" stopColor="#34d399" />
          <stop offset="78%" stopColor="#059669" />
          <stop offset="100%" stopColor="#064e3b" />
        </linearGradient>
      </defs>
      
      {/* Cinematic Aura Layers */}
      <SafeMotionCircle 
        cx={0} cy={0} r={20} 
        fill="url(#meGradient)" 
        animate={{ 
          scale: [1, 1.4, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <SafeMotionCircle 
        cx={0} cy={0} r={25} 
        fill="none"
        stroke="#5eead4"
        strokeWidth={0.05}
        strokeOpacity={0.2}
        animate={{ scale: [0.8, 1.2, 0.8], opacity: [0, 0.4, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      />
      
      <SafeMotionCircle 
        r={8.4} 
        fill="url(#meCoreGrad)"
        stroke="rgba(234, 255, 251, 0.45)" 
        strokeWidth={0.36} 
        style={{ filter: "drop-shadow(0 0 14px rgba(94, 234, 212, 0.9)) drop-shadow(0 0 28px rgba(201, 168, 76, 0.18))" }}
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      <g className="pointer-events-none" style={{ filter: "drop-shadow(0 0 3px rgba(255,255,255,0.8))" }}>
        <text 
          y={0} 
          textAnchor="middle" 
          dominantBaseline="middle"
          direction="rtl"
          fontSize="4.35" 
          fontWeight="900" 
          fill="#ffffff"
          style={{ 
            letterSpacing: "0.15em",
            filter: "drop-shadow(0 0 7px rgba(255, 255, 255, 0.75))" 
          }}
        >
          أنت
        </text>
      </g>
      
      {/* No text label here — label is rendered as HTML overlay in DawayirCanvas */}

    </g>
  );
});

interface DraggableNodeProps {
  node: MapNodeType;
  onClick: (node: MapNodeType) => void;
  index: number;
  total: number;
  entropyLevel: EntropyLevel;
  isHandToolActive?: boolean;
}

const RelationshipNode: FC<DraggableNodeProps> = memo(({ node, onClick, index, total, entropyLevel, isHandToolActive = false }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: node.id,
    disabled: isHandToolActive
  });

  const archiveNode = useMapState((s) => s.archiveNode);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const deleteClickedRef = React.useRef(false);

  const handleDeleteClick = useCallback((e?: any) => {
    if (e?.preventDefault) e.preventDefault();
    if (e?.stopPropagation) e.stopPropagation();
    deleteClickedRef.current = true;
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setShowConfirmDelete(true);
    // Reset flag after a tick so normal clicks work again
    setTimeout(() => { deleteClickedRef.current = false; }, 100);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    setShowConfirmDelete(false);
    archiveNode(node.id);
  }, [archiveNode, node.id]);

  // Calculate base position if no drag is happening
  const radius = node.ring === "green" ? 20 : node.ring === "yellow" ? 35 : 50;
  const angle = (index / Math.max(total, 1)) * 2 * Math.PI - Math.PI / 2;
  const rawX = 50 + radius * Math.cos(angle);
  const rawY = 50 + radius * Math.sin(angle);
  const baseX = Number.isFinite(rawX) ? rawX : 50;
  const baseY = Number.isFinite(rawY) ? rawY : 50;

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const ringColors = {
    green: "#34d399",
    yellow: "#fbbf24",
    red: "#fb7185",
  };

  const ringGlows = {
    green: "rgba(52, 211, 153, 0.4)",
    yellow: "rgba(251, 191, 36, 0.4)",
    red: "rgba(251, 113, 133, 0.4)",
  };

  return (
    <>
    <motion.g 
      ref={setNodeRef as any} 
      className={`cursor-grab ${isDragging ? "cursor-grabbing" : ""}`}
      style={{ 
        ...style, 
        outline: "none", 
        WebkitTapHighlightColor: "transparent", 
        zIndex: isDragging ? 50 : "auto",
        willChange: "transform",
        transform: style?.transform ? `${style.transform} translateZ(0)` : "translateZ(0)",
        transformOrigin: "center"
      } as any}
      whileHover={{ scale: 1.15, transition: { type: "spring", stiffness: 400, damping: 10 } }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={isDragging ? 
        { scale: 1.3, opacity: 1 } : 
        { scale: 1, opacity: 1 }
      }
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 15,
        opacity: { duration: 0.3 },
        scale: { type: "spring", stiffness: 400, damping: 10, delay: index * 0.05 }
      }}
      onTap={() => {
        if (!isDragging && !deleteClickedRef.current && !showConfirmDelete) onClick(node);
      }}
      {...attributes} 
      {...listeners}
    >
      {/* Orbit Line from Center to Node */}
      <line 
        x1={50 - baseX} y1={50 - baseY} 
        x2={0} y2={0} 
        stroke={ringColors[node.ring as keyof typeof ringColors] || ringColors.green}
        strokeWidth={0.1}
        opacity={0.15}
        className="pointer-events-none"
      />
      {/* "Birth" Animation - A pulsing ring that appears only once on mount */}
      <SafeMotionCircle
        cx={baseX} cy={baseY} r={4}
        fill="none"
        stroke="var(--soft-teal)"
        strokeWidth={1}
        initial={{ scale: 1, opacity: 0.8 }}
        animate={{ scale: 2.5, opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      {node.isMirrorNode && (
        <SafeMotionCircle
          cx={baseX} cy={baseY} r={7}
          fill="none" stroke="rgba(251,191,36,0.6)" strokeWidth={0.5}
          strokeDasharray="2 2"
          animate={{ rotate: 360, scale: [1, 1.15, 1], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      )}

      {node.isPowerBank && (
        <motion.g 
          transform={`translate(${baseX - 4}, ${baseY + 4})`}
          animate={{ y: [0, -1, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <circle r={1.8} fill="#eab308" />
          <text textAnchor="middle" dy="0.6" fontSize="1.8" fill="#1e293b" fontWeight="black" className="pointer-events-none drop-shadow-[0_0_5px_rgba(234,179,8,0.8)]">⚡</text>
        </motion.g>
      )}

      <EntropyGlow x={baseX} y={baseY} level={entropyLevel} />
      
      {/* Analyzing Glow */}
      {node.isAnalyzing && (
        <SafeMotionCircle
          cx={baseX} cy={baseY} r={6}
          fill="none"
          stroke="rgba(20, 184, 166, 0.5)"
          strokeWidth={0.5}
          strokeDasharray="2 2"
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      )}

      {entropyLevel === 3 ? (
        <g>
          <SafeMotionCircle
            cx={baseX} cy={baseY} r={5.5}
            fill="none"
            stroke="url(#blackhole-grad)"
            strokeWidth={1.5}
            strokeDasharray="3 5"
            animate={{ rotate: -360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: `${baseX}px ${baseY}px` }}
          />
          <SafeMotionCircle
            cx={baseX} cy={baseY} r={7}
            fill="none"
            stroke="rgba(244,63,94,0.3)"
            strokeWidth={0.5}
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <circle 
            cx={baseX} cy={baseY} r={4} 
            fill="#020617" 
            stroke="#f43f5e" 
            strokeOpacity={0.8}
            strokeWidth={1.2} 
            style={{ filter: "drop-shadow(0 0 5px rgba(244,63,94,0.7))", willChange: "filter" }}
          />
        </g>
      ) : (
        <g>
          <circle 
            cx={baseX} cy={baseY} r={4.2} 
            fill={ringColors[node.ring]}
            stroke="rgba(255,255,255,0.2)" 
            strokeWidth={0.2} 
            style={{ filter: `drop-shadow(0 0 8px ${ringGlows[node.ring]})`, willChange: "filter" }}
          />
          {/* Glossy Overlay */}
          <circle 
            cx={baseX - 1} cy={baseY - 1} r={1.5} 
            fill="rgba(255,255,255,0.3)" 
            style={{ filter: "blur(1px)" }}
          />
        </g>
      )}

      {node.avatarUrl ? (
        <>
          <defs>
            <clipPath id={`clip-${node.id}`}>
              <circle cx={baseX} cy={baseY} r={3.5} />
            </clipPath>
          </defs>
          <image 
            href={node.avatarUrl} 
            x={baseX - 3.5} y={baseY - 3.5} 
            width="7" height="7" 
            clipPath={`url(#clip-${node.id})`} 
            className={node.isAnalyzing ? "opacity-50 grayscale animate-pulse" : ""}
          />
        </>
      ) : (
        <g className="pointer-events-none">
          <path 
            d={`M ${baseX - 2.2} ${baseY + 1.8} Q ${baseX} ${baseY - 0.2} ${baseX + 2.2} ${baseY + 1.8}`} 
            fill="none" 
            stroke="#ffffff" 
            strokeWidth={0.8} 
            strokeLinecap="round"
          />
        </g>
      )}
      
      {/* Label under the node */}
      <text 
        x={baseX} y={baseY + 7.5} 
        textAnchor="middle" 
        fontSize="2.2" 
        fontWeight="800"
        fill="rgba(255,255,255,0.85)"
        className="pointer-events-none tracking-wider"
        style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}
      >
        {node.label}
      </text>

      {/* Entropy indicator icon */}
      {entropyLevel > 0 && (
        <g transform={`translate(${baseX + 3}, ${baseY - 3})`}>
          <circle r={1.5} fill="#f43f5e" />
          <text textAnchor="middle" dy="0.5" fontSize="1.2" fill="white" fontWeight="bold">!</text>
        </g>
      )}

      <motion.g
        onTap={handleDeleteClick}
        style={{ transformOrigin: `${baseX - 4.5}px ${baseY - 4.5}px` }}
        initial={{ opacity: 0, scale: 0 }}
        whileHover={{ scale: 1.2 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <circle cx={baseX - 4.5} cy={baseY - 4.5} r={2.2} fill="rgba(15, 23, 42, 0.9)" stroke="rgba(244, 63, 94, 0.5)" strokeWidth={0.3} />
        <foreignObject x={baseX - 6.5} y={baseY - 6.5} width="4" height="4">
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Scissors size={10} color="#f43f5e" />
          </div>
        </foreignObject>
      </motion.g>
    </motion.g>

    {/* Custom Delete Confirmation Modal — Portal to body */}
    {showConfirmDelete && createPortal(
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(5,8,20,0.75)",
          backdropFilter: "blur(8px)",
        }}
        onClick={() => setShowConfirmDelete(false)}
      >
        <div
          style={{
            margin: "0 1rem",
            width: "100%",
            maxWidth: "20rem",
            borderRadius: "1rem",
            padding: "1.25rem",
            textAlign: "right",
            background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.95))",
            border: "1px solid rgba(244,63,94,0.25)",
            boxShadow: "0 0 40px rgba(244,63,94,0.15), 0 20px 60px rgba(0,0,0,0.6)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.75rem" }}>
            <div
              style={{
                width: "3rem",
                height: "3rem",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(244,63,94,0.12)",
                border: "1.5px solid rgba(244,63,94,0.3)",
              }}
            >
              <X style={{ width: "1.25rem", height: "1.25rem", color: "#f43f5e" }} />
            </div>
          </div>
          <p style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.25rem", color: "#e2e8f0" }}>
            اقطع الحبل الطاقي مع "{node.label}"؟
          </p>
          <p style={{ fontSize: "0.75rem", marginBottom: "1.25rem", color: "#94a3b8" }}>
            هذه خطوة نحو استعادة قيادتك. سيتم حفظ العلاقة في أرشيف الحكمة للاستفادة من دروسها متى شئت.
          </p>
          <div style={{ display: "flex", gap: "0.5rem", flexDirection: "row-reverse" }}>
            <button
              type="button"
              onClick={handleConfirmDelete}
              style={{
                flex: 1,
                padding: "0.625rem",
                borderRadius: "0.75rem",
                fontSize: "0.875rem",
                fontWeight: 700,
                background: "linear-gradient(135deg, #f43f5e, #e11d48)",
                color: "#fff",
                border: "none",
                outline: "none",
                cursor: "pointer",
                boxShadow: "0 0 16px rgba(244,63,94,0.3)",
              }}
            >
              موافق
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmDelete(false)}
              style={{
                flex: 1,
                padding: "0.625rem",
                borderRadius: "0.75rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                background: "rgba(255,255,255,0.06)",
                color: "#94a3b8",
                border: "1px solid rgba(255,255,255,0.1)",
                outline: "none",
                cursor: "pointer",
              }}
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
});

export const DawayirCanvas: FC<DawayirCanvasProps> = ({ 
  nodes: passedNodes, 
  onNodeClick, 
  onAddNode, 
  goalId = "all",
  isHandToolActive = false
}) => {
  const storeNodes = useMapState((s) => s.nodes);
  const allNodes = passedNodes || storeNodes;
  
  const nodes = useMemo(() => {
    // If nodes were passed from parent (CoreMapScreen), they are ALREADY filtered
    // by goalId — we only need to remove archived ones
    if (passedNodes) {
      return allNodes.filter((node) => !node.isNodeArchived);
    }

    // Fallback: using store nodes directly — apply goalId filter
    return allNodes.filter((node) => {
      if (node.isNodeArchived) return false;

      // Always include legacy nodes with no goalId assigned
      if (!node.goalId) return true;

      // Handle 'all', 'general', or unspecified as "show everything"
      if (!goalId || goalId === "all" || goalId === "general") {
        return true;
      }

      // Handle 'unknown' specifically for nodes with no goalId
      if (goalId === "unknown") {
        return !node.goalId;
      }

      // Special case for family
      if (goalId === "family") {
        return node.goalId === "family" || node.treeRelation?.type === "family";
      }

      // Exact match for everything else
      return node.goalId === goalId;
    });
  }, [allNodes, goalId, passedNodes]);

  const moveNodeToRing = useMapState((s) => s.moveNodeToRing);
  const archiveNode = useMapState((s) => s.archiveNode);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 15 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 8 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;

    const nodeId = active.id as string;
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Find the node's original SVG position (calculate inline without groupedNodes)
    const nodesInSameRing = nodes.filter(n => n.ring === node.ring && !n.isNodeArchived);
    const nodeIndex = nodesInSameRing.indexOf(node);
    const totalInRing = nodesInSameRing.length || 1;
    const baseRadius = node.ring === "green" ? 20 : node.ring === "yellow" ? 35 : 50;
    const angle = (nodeIndex / Math.max(totalInRing, 1)) * 2 * Math.PI - Math.PI / 2;
    const baseX = 50 + baseRadius * Math.cos(angle);
    const baseY = 50 + baseRadius * Math.sin(angle);

    // Convert pixel delta to approximate SVG units (canvas ~400px = 100 SVG units)
    const svgDeltaX = delta.x * 0.25;
    const svgDeltaY = delta.y * 0.25;

    // New position and distance from center (50, 50)
    const newX = baseX + svgDeltaX;
    const newY = baseY + svgDeltaY;
    const distFromCenter = Math.sqrt(Math.pow(newX - 50, 2) + Math.pow(newY - 50, 2));

    let newRing: Ring = node.ring;
    if (distFromCenter <= 27) {
      newRing = 'green';
    } else if (distFromCenter <= 42) {
      newRing = 'yellow';
    } else {
      newRing = 'red';
    }

    if (newRing !== node.ring) {
      moveNodeToRing(nodeId, newRing);
    }

    // Haptic feedback
    if (window.navigator.vibrate) window.navigator.vibrate(10);
  };


  const groupedNodes = useMemo(() => {
    const groups = {
      green: nodes.filter(n => n.ring === "green" || !n.ring),
      yellow: nodes.filter(n => n.ring === "yellow"),
      red: nodes.filter(n => n.ring === "red"),
    };
    return groups;
  }, [nodes]);

  const activeNodesCount = useMemo(() => {
    return Object.values(groupedNodes).reduce((acc, curr) => acc + curr.length, 0);
  }, [groupedNodes]);

  const ghostNodePosition = useMemo(() => {
    // Positioning at bottom-right (45 deg) to avoid overlap with "You" label
    const angle = Math.PI / 4; 
    
    if (activeNodesCount === 0) {
      const radius = 22;
      return {
        x: 50 + radius * Math.cos(angle),
        y: 50 + radius * Math.sin(angle)
      };
    }

    // Find a radius based on rings
    const radius = activeNodesCount < 8 ? 28 : 38;
    return {
      x: 50 + radius * Math.cos(angle),
      y: 50 + radius * Math.sin(angle)
    };
  }, [activeNodesCount]);

  const { entropyMap, isLoading: aiLoading } = useMasafatyAnalysis();
  const [selectedEntropyNode, setSelectedEntropyNode] = useState<string | null>(null);

  // --- Zoom & Pan State ---
  const [viewBoxX, setViewBoxX] = useState(0);
  const [viewBoxY, setViewBoxY] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);
  const [isPanMode, setIsPanMode] = useState(isHandToolActive); // Toggle Hand tool
  const [isDraggingBg, setIsDraggingBg] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsPanMode(isHandToolActive);
  }, [isHandToolActive]);

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    // Only initiate pan if we click directly on the SVG or if Pan Mode is forced
    if (e.target === e.currentTarget || isPanMode) {
      setIsDraggingBg(true);
      setLastPos({ x: e.clientX, y: e.clientY });
      (e.target as Element).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isDraggingBg) {
      const dx = e.clientX - lastPos.x;
      const dy = e.clientY - lastPos.y;
      const svgRect = e.currentTarget.getBoundingClientRect();
      const ratioX = (100 / zoomScale) / svgRect.width;
      const ratioY = (100 / zoomScale) / svgRect.height;
      setViewBoxX(x => x - dx * ratioX);
      setViewBoxY(y => y - dy * ratioY);
      setLastPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isDraggingBg) {
      setIsDraggingBg(false);
      (e.target as Element).releasePointerCapture(e.pointerId);
    }
  };

  const performZoom = (zoomMultiplier: number, relX: number = 0.5, relY: number = 0.5) => {
    setZoomScale(currentZoom => {
      let newZoom = currentZoom * zoomMultiplier;
      newZoom = Math.max(0.3, Math.min(newZoom, 5));
      if (newZoom === currentZoom) return currentZoom;
      
      const currentW = 100 / currentZoom;
      const newW = 100 / newZoom;
      
      setViewBoxX(x => x + (currentW - newW) * relX);
      setViewBoxY(y => y + (currentW - newW) * relY);
      
      return newZoom;
    });
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    const zoomMultiplier = e.deltaY > 0 ? 0.9 : 1.1;
    const svgRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;
    
    const relX = mouseX / svgRect.width;
    const relY = mouseY / svgRect.height;
    
    performZoom(zoomMultiplier, relX, relY);
  };

  const zoomIn = () => performZoom(1.3);
  const zoomOut = () => performZoom(0.7);
  const centerView = () => {
    setZoomScale(1);
    setViewBoxX(0);
    setViewBoxY(0);
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-transparent">
      {/* 🧭 Map Navigation Controls (Merged Premium Panel) */}
      <div className="absolute top-48 left-6 z-50 flex flex-col gap-2">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-1 p-2 rounded-2xl shadow-2xl pointer-events-auto"
          style={{
            background: "linear-gradient(145deg, rgba(15,23,42,0.85), rgba(30,41,59,0.95))",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.15)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.05)"
          }}
        >
          {/* Separator */}
          <div className="h-px bg-white/10 my-1 mx-2" />

          {/* Zoom Actions */}
          <button
            onClick={zoomIn}
            className="p-3 rounded-xl hover:bg-white/10 transition-all duration-200 text-slate-300 hover:text-teal-400 group"
            title="تكبير (Zoom In)"
          >
            <Plus size={20} strokeWidth={2.5} className="group-active:scale-90 transition-transform" />
          </button>
          
          <button
            onClick={zoomOut}
            className="p-3 rounded-xl hover:bg-white/10 transition-all duration-200 text-slate-300 hover:text-teal-400 group"
            title="تصغير (Zoom Out)"
          >
            <Minus size={20} strokeWidth={2.5} className="group-active:scale-90 transition-transform" />
          </button>

          <button
            onClick={centerView}
            className="p-3 rounded-xl hover:bg-white/10 transition-all duration-200 text-slate-300 hover:text-teal-400 group"
            title="توسيط الخريطة (Reset View)"
          >
            <Target size={20} strokeWidth={2.5} className="group-active:scale-90 transition-transform" />
          </button>
        </motion.div>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <svg 
          viewBox={`${viewBoxX} ${viewBoxY} ${100 / zoomScale} ${100 / zoomScale}`} 
          className={`dawayir-map-svg w-full h-full touch-none ${isPanMode ? 'cursor-grab' : ''}`}
          style={{ touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onWheel={handleWheel}
        >
          {/* Background Grid - subtle */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.1"/>
            </pattern>
            <radialGradient id="blackhole-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="1" />
              <stop offset="100%" stopColor="#4c0519" stopOpacity="0" />
            </radialGradient>

            {/* Premium Node Gradients */}
            <radialGradient id="grad-green" cx="35%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#2dd4bf" />
              <stop offset="100%" stopColor="#0f766e" />
            </radialGradient>
            <radialGradient id="grad-yellow" cx="35%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#fcd34d" />
              <stop offset="100%" stopColor="#b45309" />
            </radialGradient>
            <radialGradient id="grad-red" cx="35%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#9f1239" />
            </radialGradient>
          </defs>
          <OrbitalRing radius={50} label="Danger" ring="red" />
          <OrbitalRing radius={35} label="Caution" ring="yellow" />
          <OrbitalRing radius={20} label="Safe" ring="green" />

          {/* Cinematic Background Layer */}
          <CinematicBackground />

          {/* Center Me */}
          <MeNodeCenter />

          {/* Nodes */}
          {groupedNodes.red.map((node, i) => (
            <RelationshipNode key={node.id} node={node} index={i} total={groupedNodes.red.length} onClick={onNodeClick} entropyLevel={entropyMap[node.id] || 0} isHandToolActive={isPanMode} />
          ))}
          {groupedNodes.yellow.map((node, i) => (
            <RelationshipNode key={node.id} node={node} index={i} total={groupedNodes.yellow.length} onClick={onNodeClick} entropyLevel={entropyMap[node.id] || 0} isHandToolActive={isPanMode} />
          ))}
          {groupedNodes.green.map((node, i) => (
            <RelationshipNode key={node.id} node={node} index={i} total={groupedNodes.green.length} onClick={onNodeClick} entropyLevel={entropyMap[node.id] || 0} isHandToolActive={isPanMode} />
          ))}

          {onAddNode && ghostNodePosition && (
            <motion.g
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onTap={onAddNode}
              style={{ pointerEvents: "all", cursor: "pointer", transformOrigin: `${ghostNodePosition.x}px ${ghostNodePosition.y}px` }}
            >
              {/* Pulsing Aura */}
              <SafeMotionCircle
                cx={ghostNodePosition.x}
                cy={ghostNodePosition.y}
                r={8.5}
                fill="none"
                stroke="var(--soft-teal)"
                strokeWidth={0.22}
                strokeDasharray="1.6 2.4"
                animate={{ 
                   rotate: 360,
                   opacity: [0.2, 0.6, 0.2]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              />
              
              {/* Interaction Area (Invisible but large enough) */}
              <circle
                cx={ghostNodePosition.x}
                cy={ghostNodePosition.y}
                r={12}
                fill="transparent"
              />

              {/* Potential Node Shell */}
              <circle
                cx={ghostNodePosition.x}
                cy={ghostNodePosition.y}
                r={5.4}
                fill="rgba(45, 212, 191, 0.12)"
                stroke="var(--soft-teal)"
                strokeOpacity={0.72}
                strokeWidth={0.38}
                strokeDasharray="1 1.2"
                className="animate-spin-slow"
                style={{
                  transformOrigin: `${ghostNodePosition.x}px ${ghostNodePosition.y}px`,
                  filter: "drop-shadow(0 0 3px rgba(45, 212, 191, 0.65))",
                }}
              />
              <circle
                cx={ghostNodePosition.x}
                cy={ghostNodePosition.y}
                r={3.1}
                fill="rgba(2, 12, 20, 0.88)"
                stroke="rgba(234, 255, 251, 0.28)"
                strokeWidth={0.16}
              />
              
              {/* Plus Icon inside - Premium Style */}
              <g transform={`translate(${ghostNodePosition.x}, ${ghostNodePosition.y})`}>
                <circle r={2.2} fill="rgba(45, 212, 191, 0.16)" />
                <line x1="-1.45" y1="0" x2="1.45" y2="0" stroke="#7ff7e8" strokeWidth="0.72" strokeLinecap="round" />
                <line x1="0" y1="-1.45" x2="0" y2="1.45" stroke="#7ff7e8" strokeWidth="0.72" strokeLinecap="round" />
              </g>

              {/* Label */}
              <text
                x={ghostNodePosition.x}
                y={ghostNodePosition.y + 10.5}
                textAnchor="middle"
                fontSize="2.75"
                fill="#7ff7e8"
                style={{ 
                  fontWeight: "900", 
                  opacity: 0.92, 
                  pointerEvents: "none",
                  letterSpacing: "0.05em",
                  filter: "drop-shadow(0 0 2.5px rgba(45, 212, 191, 0.72))"
                }}
              >
                إضافة شخص
              </text>
            </motion.g>
          )}
        </svg>


        {/* See and Decide Overlay */}
        <AnimatePresence>
          {nodes.some(n => (entropyMap[n.id] || 0) > 0) && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-48 left-6 right-6 p-6 ds-card rounded-[2rem] flex items-center gap-5 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center flex-shrink-0 border border-amber-500/30">
                <AlertCircle className="w-7 h-7 text-amber-400" />
              </div>
              <div className="flex-1 text-right">
                <p className="text-sm text-slate-100 font-bold tracking-tight">نظام "دواير" لقط حاجة مريبة...</p>
                <p className="text-xs text-slate-400 font-medium">العلاقات اللي بتنور أحمر محتاجة قرار استراتيجي دلوقتي.</p>
              </div>
              <Button 
                variant="primary" 
                size="md"
                className="px-6"
                onClick={() => {}} // Could open Action Toolkit
              >
                شوف المناورات
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

      </DndContext>
    </div>
  );
};
