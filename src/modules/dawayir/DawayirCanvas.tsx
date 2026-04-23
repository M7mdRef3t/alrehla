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
import { User, Clock, Zap, Coins, Maximize, GripVertical, Plus, AlertCircle, Info, X, Scissors } from "lucide-react";
import { useMasafatyAnalysis, EntropyLevel } from "./hooks/useMasafatyAnalysis";
import { Button } from '@/modules/meta/UI/Button';

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

type SafeMotionCircleProps = React.ComponentProps<typeof motion.circle> & {
  cx?: number;
  cy?: number;
  r?: number;
};

const SafeMotionCircle: FC<SafeMotionCircleProps> = ({ cx = 50, cy = 50, r = 1, ...props }) => (
  <motion.circle
    cx={toSafeSvgNumber(cx, 50)}
    cy={toSafeSvgNumber(cy, 50)}
    r={Math.max(toSafeSvgNumber(r, 1), 0)}
    {...props}
  />
);

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
}

/* ─── Components ───────────────────────────────────────────────────────────── */

const OrbitalRing: FC<{ radius: number; label: string; ring: Ring }> = memo(({ radius, label, ring }) => {
  const colors = {
    green: "var(--ring-safe)",
    yellow: "var(--ring-caution)",
    red: "var(--ring-danger)",
  };

  const safeRadius = Number.isFinite(radius) && radius > 0 ? radius : 1;

  return (
    <g>
      <circle 
        cx={50} cy={50} r={safeRadius} 
        fill="none" 
        stroke="var(--app-border)" 
        strokeWidth={0.5} 
      />
      <circle
        cx={50} cy={50} r={safeRadius}
        fill="none"
        stroke={colors[ring]}
        strokeOpacity="0.15"
        strokeWidth={0.2}
        strokeDasharray="1 2"
        style={{
          transformOrigin: '50% 50%',
          animation: 'rotate-ring 60s linear infinite'
        }}
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
  const feelingResults = useMapState((s) => s.feelingResults);
  
  // Memoize assets mapping to avoid recalculations every render
  const indicators = useMemo(() => {
    const assets = [
      { id: "body", icon: User, color: "text-blue-400" },
      { id: "time", icon: Clock, color: "text-purple-400" },
      { id: "energy", icon: Zap, color: "text-yellow-400" },
      { id: "money", icon: Coins, color: "text-emerald-400" },
      { id: "space", icon: Maximize, color: "text-rose-400" },
    ];

    return assets.map((asset, i) => {
      const angle = (i * (360 / assets.length) * Math.PI) / 180;
      const x = Math.cos(angle) * 10;
      const y = Math.sin(angle) * 10;
      const val = feelingResults?.[asset.id as keyof typeof feelingResults] || 50;
      const opacity = 0.2 + (val / 100) * 0.8;

      return { ...asset, x, y, val, opacity };
    });
  }, [feelingResults]);

  return (
    <g transform="translate(50, 50)">
      {/* Halo Effect */}
      <SafeMotionCircle
        r={8}
        fill="rgba(45, 212, 191, 0.05)"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Core "Me" */}
      <SafeMotionCircle 
        r={6} 
        fill="var(--space-950)" 
        stroke="var(--ring-safe)" 
        strokeOpacity="0.6"
        strokeWidth={0.8} 
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Drop-shadow Text Effect */}
      <text 
        textAnchor="middle" 
        dy="1.2" 
        fontSize="2.8" 
        fontWeight="black" 
        fill="white"
        className="pointer-events-none drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]"
      >
        أنا
      </text>

      {/* Asset Indicators around the Me Node */}
      {indicators.map((asset) => (
        <g key={asset.id} transform={`translate(${asset.x}, ${asset.y})`}>
          <circle r={2} fill="rgba(15, 23, 42, 0.8)" stroke="rgba(255,255,255,0.1)" strokeWidth={0.2} />
          <SafeMotionCircle 
            r={2} 
            fill="none" 
            stroke="currentColor" 
            strokeWidth={0.3}
            strokeDasharray="12.56" // 2 * PI * 2
            strokeDashoffset={12.56 * (1 - asset.val / 100)}
            className={asset.color}
            initial={{ opacity: 0 }}
            animate={{ opacity: asset.opacity }}
          />
        </g>
      ))}
    </g>
  );
});

interface DraggableNodeProps {
  node: MapNodeType;
  onClick: (node: MapNodeType) => void;
  index: number;
  total: number;
  entropyLevel: EntropyLevel;
}

const RelationshipNode: FC<DraggableNodeProps> = memo(({ node, onClick, index, total, entropyLevel }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: node.id,
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
  const radius = node.ring === "green" ? 15 : node.ring === "yellow" ? 27 : 38;
  const angle = (index / Math.max(total, 1)) * 2 * Math.PI - Math.PI / 2;
  const rawX = 50 + radius * Math.cos(angle);
  const rawY = 50 + radius * Math.sin(angle);
  const baseX = Number.isFinite(rawX) ? rawX : 50;
  const baseY = Number.isFinite(rawY) ? rawY : 50;

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const ringColors = {
    green: "var(--ring-safe)",
    yellow: "var(--ring-caution)",
    red: "var(--ring-danger)",
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
      initial={{ scale: 0, opacity: 0, filter: "blur(10px)" }}
      animate={isDragging ? 
        { scale: 1.3, opacity: 1, filter: "drop-shadow(0 0 15px rgba(45,212,191,0.6))" } : 
        { scale: 1, opacity: 1, filter: "blur(0px)" }
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
            style={{ filter: "drop-shadow(0 0 5px rgba(244,63,94,0.7))" }}
          />
        </g>
      ) : (
        <circle 
          cx={baseX} cy={baseY} r={4} 
          fill="var(--space-950)" 
          stroke={node.isAnalyzing ? "var(--soft-teal)" : ringColors[node.ring]} 
          strokeOpacity={node.isAnalyzing ? 0.4 : 1}
          strokeWidth={0.8} 
          className="transition-colors duration-300"
        />
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
          {/* Native SVG Human Icon - High Contrast */}
          <circle cx={baseX} cy={baseY - 1.2} r={1.4} fill="#ffffff" />
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
        x={baseX} y={baseY + 7} 
        textAnchor="middle" 
        fontSize="2" 
        fill="rgba(255,255,255,0.6)"
        className="pointer-events-none font-medium"
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
            هذه خطوة نحو استعادة سيادتك. سيتم حفظ العلاقة في أرشيف الحكمة للاستفادة من دروسها متى شئت.
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
  goalId = "all" 
}) => {
  const storeNodes = useMapState((s) => s.nodes);
  const allNodes = passedNodes || storeNodes;
  
  const nodes = useMemo(() => {
    // We want to show nodes that are NOT archived and match the current goal filter
    return allNodes.filter((node) => {
      if (node.isNodeArchived) return false;

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
  }, [allNodes, goalId]);

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

    // Haptic feedback
    if (window.navigator.vibrate) window.navigator.vibrate(10);
  };

  const groupedNodes = useMemo(() => {
    const groups = {
      green: nodes.filter(n => n.ring === "green" || !n.ring),
      yellow: nodes.filter(n => n.ring === "yellow"),
      red: nodes.filter(n => n.ring === "red"),
    };
    console.log("[DawayirCanvas] groupedNodes:", {
      green: groups.green.length,
      yellow: groups.yellow.length,
      red: groups.red.length,
      totalReceived: nodes.length
    });
    return groups;
  }, [nodes]);

  const activeNodesCount = useMemo(() => {
    return Object.values(groupedNodes).reduce((acc, curr) => acc + curr.length, 0);
  }, [groupedNodes]);

  const ghostNodePosition = useMemo(() => {
    console.log("[DawayirCanvas] Calculating ghost pos. activeCount:", activeNodesCount);
    // If map has no active nodes, put it prominently but safely below center
    if (activeNodesCount === 0) {
      return { x: 50, y: 72 };
    }

    // Default position if something goes wrong
    let pos = { x: 50, y: 80 };

    // Find the first ring that isn't "full"
    const rings: ("green" | "yellow" | "red")[] = ["green", "yellow", "red"];
    for (const r of rings) {
      const ringNodes = groupedNodes[r];
      const maxInRing = r === "green" ? 8 : r === "yellow" ? 12 : 16;
      
      if (ringNodes.length < maxInRing) {
        const radius = r === "green" ? 15 : r === "yellow" ? 27 : 38;
        const index = ringNodes.length;
        const total = ringNodes.length + 1;
        const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
        const rawX = 50 + radius * Math.cos(angle);
        const rawY = 50 + radius * Math.sin(angle);
        pos = {
          x: Number.isFinite(rawX) ? rawX : 50,
          y: Number.isFinite(rawY) ? rawY : 50
        };
        break;
      }
    }
    console.log("[DawayirCanvas] Final Ghost Pos:", pos);
    return pos;
  }, [activeNodesCount, groupedNodes]);

  const { entropyMap, isLoading: aiLoading } = useMasafatyAnalysis();
  const [selectedEntropyNode, setSelectedEntropyNode] = useState<string | null>(null);

  const getEntropyText = (level: EntropyLevel, ring: Ring) => {
    if (level === 3) return "نزيف أصول: الشخص ده في الدائرة الخضراء بس بيستنزف طاقتك/جسمك جداً.";
    if (level === 2) return "اختراق حدود: الشخص ده في الدائرة الحمراء بس لسا واخد وقت/مساحة كبيرة.";
    if (level === 1) return "عبء مادي: الشخص ده في الدائرة الصفراء وفيه ضغط مادي واضح.";
    return null;
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-transparent">
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full touch-none"
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
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />

          {/* Rings */}
          <OrbitalRing radius={38} label="Danger" ring="red" />
          <OrbitalRing radius={27} label="Caution" ring="yellow" />
          <OrbitalRing radius={15} label="Safe" ring="green" />

          {/* Center Me */}
          <MeNodeCenter />

          {/* Nodes */}
          {groupedNodes.red.map((node, i) => (
            <RelationshipNode key={node.id} node={node} index={i} total={groupedNodes.red.length} onClick={onNodeClick} entropyLevel={entropyMap[node.id] || 0} />
          ))}
          {groupedNodes.yellow.map((node, i) => (
            <RelationshipNode key={node.id} node={node} index={i} total={groupedNodes.yellow.length} onClick={onNodeClick} entropyLevel={entropyMap[node.id] || 0} />
          ))}
          {groupedNodes.green.map((node, i) => (
            <RelationshipNode key={node.id} node={node} index={i} total={groupedNodes.green.length} onClick={onNodeClick} entropyLevel={entropyMap[node.id] || 0} />
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
                r={6}
                fill="none"
                stroke="rgba(45, 212, 191, 0.3)"
                strokeWidth={0.2}
                strokeDasharray="1 1"
                animate={{ 
                   scale: [1, 1.3, 1],
                   opacity: [0.2, 0.5, 0.2],
                   rotate: 360
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              />
              
              {/* Interaction Area (Invisible but large enough) */}
              <circle
                cx={ghostNodePosition.x}
                cy={ghostNodePosition.y}
                r={7}
                fill="transparent"
              />

              {/* Empty Person Shell */}
              <circle
                cx={ghostNodePosition.x}
                cy={ghostNodePosition.y}
                r={4.5}
                fill="rgba(45, 212, 191, 0.15)"
                fillOpacity="1"
                stroke="rgba(45, 212, 191, 0.6)"
                strokeOpacity="1"
                strokeWidth={0.4}
              />
              
              {/* Plus Icon inside (Pure Native Paths) - Higher Visibility */}
              <g transform={`translate(${ghostNodePosition.x}, ${ghostNodePosition.y})`}>
                <line x1="-2" y1="0" x2="2" y2="0" stroke="#2dd4bf" strokeWidth="1" strokeLinecap="round" />
                <line x1="0" y1="-2" x2="0" y2="2" stroke="#2dd4bf" strokeWidth="1" strokeLinecap="round" />
              </g>

              {/* Label */}
              <text
                x={ghostNodePosition.x}
                y={ghostNodePosition.y + 8}
                textAnchor="middle"
                fontSize="2.4"
                fill="#2dd4bf"
                style={{ fontWeight: "bold", opacity: 0.9, pointerEvents: "none" }}
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
              className="absolute bottom-24 left-6 right-6 p-6 ds-card rounded-[2rem] flex items-center gap-5 shadow-2xl"
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
