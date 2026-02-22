import type { FC } from "react";
import { useState, useRef, useCallback, useEffect, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, GripVertical } from "lucide-react";
import { DndContext, TouchSensor, MouseSensor, useSensor, useSensors, useDraggable, useDroppable, type DragEndEvent } from "@dnd-kit/core";
import type { Ring, MapNode as MapNodeType } from "./mapTypes";
import { useMapState } from "../../state/mapState";
import { useMeState } from "../../state/meState";
import { mapCopy } from "../../copy/map";
import { hasSeenOnboarding } from "../../utils/mapOnboarding";
import { getMissionProgressSummary } from "../../utils/missionProgress";
import { JourneyToast } from "../../components/JourneyToast";
import { FutureSimulator } from "../../components/FutureSimulator";
import { Telescope } from "lucide-react";
import { analyzeMapInterference } from "../../services/socialSync";
import { AINode } from "./AINode";

/* ════════════════════════════════════════════════
   🌌 COSMIC MAP CANVAS — Digital Sanctuary
   ════════════════════════════════════════════════ */

/* ── Orbital Ring (Breathing) ── */

interface RingProps {
  ring: Ring;
  label: string;
  radius: number;
  color: string;
  glowColor: string;
  breatheDuration: number;
}

const OrbitalRing: FC<RingProps> = memo(({ label, radius, color, glowColor, breatheDuration }) => {
  const safeRadius = Number.isFinite(radius) ? radius : 0;
  return (
    <g aria-label={label}>
      {/* Ambient glow layer */}
      <motion.circle
        cx="50"
        cy="50"
        r={safeRadius}
        fill="none"
        stroke={glowColor}
        strokeWidth={4}
        opacity={0.15}
        animate={{
          strokeWidth: [3, 5, 3],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{
          duration: breatheDuration,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      {/* Main breathing ring */}
      <motion.circle
        cx="50"
        cy="50"
        r={safeRadius}
        fill="none"
        stroke={color}
        className="orbital-ring"
        animate={{
          strokeWidth: [1.0, 1.6, 1.0],
          opacity: [0.45, 0.8, 0.45]
        }}
        transition={{
          duration: breatheDuration,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          filter: "none"
        }}
      />
    </g>
  );
});

/* ── Node Position Calculations ── */

const getRingPosition = (ring: Ring, nodeIndex: number, totalInRing: number): { x: number; y: number } => {
  const angleStep = (2 * Math.PI) / Math.max(totalInRing, 1);
  const angle = nodeIndex * angleStep - Math.PI / 2;
  let radius: number;
  if (ring === "green") radius = 15;
  else if (ring === "yellow") radius = 27;
  else radius = 38;
  const x = 50 + radius * Math.cos(angle);
  const y = 50 + radius * Math.sin(angle);
  return { x, y };
};

const GREY_ZONE_RADIUS = 46;
const GREY_ZONE_STROKE_RADIUS = 48;
const getGreyZonePosition = (nodeIndex: number, totalInGrey: number): { x: number; y: number } => {
  const angleStep = (2 * Math.PI) / Math.max(totalInGrey, 1);
  const angle = nodeIndex * angleStep - Math.PI / 2;
  const x = 50 + GREY_ZONE_RADIUS * Math.cos(angle);
  const y = 50 + GREY_ZONE_RADIUS * Math.sin(angle);
  return { x, y };
};

/* ── Node Colors (Cosmic) ── */

const RING_COLORS = {
  safe: { stroke: "#2dd4bf", glow: "rgba(45, 212, 191, 0.5)" },
  caution: { stroke: "#fbbf24", glow: "rgba(251, 191, 36, 0.45)" },
  danger: { stroke: "#f87171", glow: "rgba(248, 113, 113, 0.5)" },
  detached: { stroke: "#94A3B8", glow: "rgba(148, 163, 184, 0.2)" }
} as const;

const NODE_GLOW_CLASS: Record<Ring, string> = {
  red: "node-threat-danger",
  yellow: "node-threat-caution",
  green: "node-threat-safe"
};

const MAX_NODES_FOR_FULL_CONNECTIONS = 140;
const MAX_NODES_FOR_INTERFERENCE_SCAN = 220;
const MAX_NODES_FOR_FULL_MOTION = 120;

/* ── Map Node View (Glass Orb) ── */

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
}

const MapNodeView: FC<NodeProps> = memo(({ node, nodeIndex, totalInRing, position, onClick, canOpenDetails = true, justDraggedId, justAdded, isHighlighted, isTouchDevice = false, reduceMotion = false }) => {
  const [showDelete, setShowDelete] = useState(false);
  const [pulseDone, setPulseDone] = useState(false);
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
    touchAction: "none"
  };

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = typeof window === "undefined" ? true : window.confirm(`تأكيد: خرّج "${node.label}" من دوايرك؟\nهيتحفظ في "أشخاص مشيوا" — تقدر ترجعه لو احتجت.`);
    if (!ok) return;
    archiveNode(node.id);
  }, [archiveNode, node.id, node.label]);

  const blockDeletePointer = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleClick = useCallback(() => {
    if (node.id === justDraggedId) return;
    if (onClick) onClick(node.id);
  }, [node.id, justDraggedId, onClick]);

  /* ── Ring color for the breathing aura ── */
  const auraColor = isDetached
    ? "rgba(148, 163, 184, 0.15)"
    : node.ring === "red"
      ? "rgba(248, 113, 113, 0.25)"
      : node.ring === "yellow"
        ? "rgba(251, 191, 36, 0.2)"
        : "rgba(45, 212, 191, 0.2)";

  const auraBorderColor = isDetached
    ? "rgba(148, 163, 184, 0.25)"
    : node.ring === "red"
      ? "rgba(248, 113, 113, 0.4)"
      : node.ring === "yellow"
        ? "rgba(251, 191, 36, 0.35)"
        : "rgba(45, 212, 191, 0.35)";

  return (
    <motion.div
      style={style}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      className="relative z-20"
      initial={justAdded ? { scale: 0, opacity: 0 } : false}
      animate={justAdded ? { scale: 1, opacity: 1 } : undefined}
      exit={{ scale: 0.6, opacity: 0, y: -12, filter: "blur(4px)" }}
      transition={justAdded ? { type: "spring", stiffness: 160, damping: 28, mass: 0.8 } : { duration: 0.35, ease: "easeOut" }}
    >
      {/* Breathing aura ring — نبضة أقوى عند التحديد من السجل */}
      <motion.div
        className="absolute -inset-2 rounded-full pointer-events-none"
        style={{
          zIndex: 0,
          border: `1.5px solid ${auraBorderColor}`,
          boxShadow: `0 0 20px ${auraColor}`
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
            : {
              opacity: [0.4, 0.8, 0.4],
              scale: [1, 1.08, 1],
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

      {/* Main node body — Glass Orb */}
      <motion.div
        ref={setNodeRef}
        className={`relative z-10 node-glass ${glowClass} select-none flex items-center gap-0.5 pr-1 ${isDragging ? "opacity-90 scale-105" : ""
          } ${isDetached ? "saturate-50 opacity-60" : ""
          } ${hasMismatch ? "border-amber-500/50!" : ""
          }`}
        animate={!isDragging && !reduceMotion ? {
          y: [0, -4, 2, -1, 0],
          x: [0, 2, -3, 1, 0],
          rotate: [0, 1, -1, 0.5, 0]
        } : {}}
        transition={reduceMotion ? undefined : {
          duration: 9 + (nodeIndex % 4),
          repeat: Infinity,
          ease: "easeInOut",
          delay: (nodeIndex % 7) * 0.6
        }}
      >
        {/* Avatar — cosmic circle */}
        <span className="shrink-0 w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold"
          style={{
            background: isDetached
              ? "rgba(100, 116, 139, 0.3)"
              : "linear-gradient(135deg, rgba(45, 212, 191, 0.15), rgba(139, 92, 246, 0.1))",
            color: "var(--text-primary)",
            border: "1px solid rgba(255, 255, 255, 0.1)"
          }}
        >
          {node.avatarUrl ? (
            <img src={node.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span aria-hidden className="text-xs">{node.label.trim() ? node.label.trim()[0] : "؟"}</span>
          )}
        </span>

        {/* Clickable label */}
        <motion.button
          type="button"
          onClick={handleClick}
          className="rounded-l-full pl-3 pr-2 py-2.5 text-sm font-medium cursor-pointer flex-1 text-right min-w-0"
          style={{ color: "var(--text-primary)", letterSpacing: "0.03em" }}
          title={
            hasMismatch
              ? canOpenDetails
                ? "⚠️ تعارض — اضغط للتفاصيل"
                : "⚠️ تعارض — التفاصيل مقفولة حالياً"
              : canOpenDetails
                ? `اضغط لرؤية تفاصيل ${node.label}`
                : "التفاصيل مقفولة حالياً"
          }
          whileHover={reduceMotion ? undefined : { scale: 1.02 }}
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          transition={{ type: "spring", stiffness: 200, damping: 30 }}
        >
          <span className="flex flex-col items-start">
            <span className="text-xs md:text-sm font-semibold">{node.label}</span>
            {missionBadge ? (
              <span
                className="mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{
                  background: missionBadge.tone === "done"
                    ? "rgba(45, 212, 191, 0.15)"
                    : "rgba(251, 191, 36, 0.15)",
                  color: missionBadge.tone === "done"
                    ? "var(--ring-safe)"
                    : "var(--ring-caution)",
                  border: `1px solid ${missionBadge.tone === "done" ? "rgba(45, 212, 191, 0.3)" : "rgba(251, 191, 36, 0.3)"}`
                }}
              >
                {missionBadge.label}
              </span>
            ) : null}
          </span>
        </motion.button>

        {/* Drag handle */}
        <span
          {...listeners}
          {...attributes}
          className="shrink-0 p-1.5 rounded-r-full cursor-grab active:cursor-grabbing touch-none"
          style={{ color: "var(--text-muted)" }}
          title="اسحب لتحريك الدائرة"
          aria-label="اسحب لتحريك"
        >
          <GripVertical className="w-4 h-4" strokeWidth={2} />
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

      {/* Delete button */}
      <AnimatePresence>
        {(showDelete || isTouchDevice) && (
          <motion.button
            type="button"
            onClick={handleDelete}
            onPointerDown={blockDeletePointer}
            className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center z-30"
            style={{
              background: "linear-gradient(135deg, #94a3b8, #64748b)",
              boxShadow: "0 0 10px rgba(100, 116, 139, 0.25)"
            }}
            title="خرّجه من دوايرك دلوقتي"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <X className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </motion.button>
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
    prev.nodeIndex === next.nodeIndex &&
    prev.totalInRing === next.totalInRing &&
    prev.justDraggedId === next.justDraggedId &&
    prev.justAdded === next.justAdded &&
    prev.isHighlighted === next.isHighlighted &&
    prev.isTouchDevice === next.isTouchDevice &&
    prev.reduceMotion === next.reduceMotion &&
    (prev.position?.x ?? null) === (next.position?.x ?? null) &&
    (prev.position?.y ?? null) === (next.position?.y ?? null) &&
    prev.onClick === next.onClick
  );
});

/* ── Ring Labels ── */

const RING_LABELS: Record<Ring, string> = {
  green: mapCopy.legendGreen,
  yellow: mapCopy.legendYellow,
  red: mapCopy.legendRed
};

/* ── Droppable Ring Zone ── */

const DroppableRing: FC<{ id: Ring | "grey"; sizePct: number; zIndex: number }> = memo(({ id, sizePct, zIndex }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const colorMap: Record<string, string> = {
    grey: RING_COLORS.detached.stroke,
    green: RING_COLORS.safe.stroke,
    yellow: RING_COLORS.caution.stroke,
    red: RING_COLORS.danger.stroke
  };
  return (
    <div
      ref={setNodeRef}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-auto transition-all duration-300"
      style={{
        width: `${sizePct}%`,
        height: `${sizePct}%`,
        zIndex,
        opacity: isOver ? 0.35 : 0,
        backgroundColor: colorMap[id] ?? colorMap.grey,
        boxShadow: isOver ? `0 0 60px ${colorMap[id]}60` : "none"
      }}
      aria-hidden
    />
  );
});

/* ── Me Center Colors (Cosmic Orb) ── */

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

/* ── Filter Context Nodes ── */

function filterNodesByContext(
  nodes: MapNodeType[],
  goalIdFilter?: string,
  galaxyGoalIds?: string[]
): MapNodeType[] {
  if (galaxyGoalIds != null && galaxyGoalIds.length > 0) {
    return nodes.filter((n) => galaxyGoalIds.includes(n.goalId ?? "general"));
  }
  if (goalIdFilter != null && goalIdFilter !== "") {
    if (goalIdFilter === "family") {
      return nodes.filter(
        (n) =>
          n.goalId === "family" ||
          n.goalId == null ||
          n.treeRelation?.type === "family"
      );
    }
    return nodes.filter((n) => (n.goalId ?? "general") === goalIdFilter);
  }
  return nodes;
}

/* ════════════════════════════════════════════════
   🌌 MAIN CANVAS COMPONENT
   ════════════════════════════════════════════════ */

interface MapCanvasProps {
  onNodeClick?: (id: string) => void;
  onMeClick?: () => void;
  canOpenDetails?: boolean;
  goalIdFilter?: string;
  galaxyGoalIds?: string[];
  /** عند الضغط من السجل — العقدة تعمل نبضة بلون مدارها */
  highlightNodeId?: string | null;
  /** حالة بؤرة الوعي */
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
  onMeClick,
  canOpenDetails = true,
  goalIdFilter,
  galaxyGoalIds,
  highlightNodeId,
  aiState
}) => {
  const allNodes = useMapState((s) => s.nodes);
  const [isSimulation, setIsSimulation] = useState(false);
  const [simulatedNodes, setSimulatedNodes] = useState<MapNodeType[]>([]);

  const lastAddedNodeId = useMapState((s) => s.lastAddedNodeId);
  const activeNodes = isSimulation ? simulatedNodes : allNodes;

  const nodes = useMemo(
    () => filterNodesByContext(activeNodes, goalIdFilter, galaxyGoalIds).filter((n) => !n.isNodeArchived),
    [activeNodes, goalIdFilter, galaxyGoalIds]
  );

  const [showArchiveToast, setShowArchiveToast] = useState(false);
  const [lastArchivedName, setLastArchivedName] = useState<string | undefined>(undefined);
  const archivedCount = useMemo(() => allNodes.filter((n) => n.isNodeArchived).length, [allNodes]);
  const prevArchivedCountRef = useRef(archivedCount);
  useEffect(() => {
    if (archivedCount > prevArchivedCountRef.current) {
      // Find the node that was just archived (most recently archivedAt)
      const justArchived = allNodes
        .filter((n) => n.isNodeArchived && n.archivedAt)
        .sort((a, b) => (b.archivedAt ?? 0) - (a.archivedAt ?? 0))[0];
      setLastArchivedName(justArchived?.label);
      setShowArchiveToast(true);
      const t = setTimeout(() => setShowArchiveToast(false), 4500);
      prevArchivedCountRef.current = archivedCount;
      return () => clearTimeout(t);
    }
    prevArchivedCountRef.current = archivedCount;
  }, [archivedCount, allNodes]);

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

  const moveNodeToRing = useMapState((s) => s.moveNodeToRing);
  const setDetached = useMapState((s) => s.setDetached);
  const battery = useMeState((s) => s.battery);
  const meStyle = ME_CENTER_STYLES[battery] ?? ME_CENTER_STYLES.okay;

  const [pendingMove, setPendingMove] = useState<{ nodeId: string; nodeLabel: string; fromRing: Ring; toRing: Ring } | null>(null);
  const [justDraggedId, setJustDraggedId] = useState<string | null>(null);
  const dragTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current); }, []);

  const mouseSensor = useSensor(MouseSensor);
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } });
  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const activeId = String(event.active.id);
      const overId = event.over?.id;
      const node = nodes.find((n) => n.id === activeId);
      if (!node || typeof overId !== "string") return;

      if (overId === "grey") {
        if (isSimulation) {
          setSimulatedNodes(prev => prev.map(n => n.id === activeId ? { ...n, isDetached: true } : n));
        } else {
          setDetached(activeId, true);
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
        if (isSimulation) {
          setSimulatedNodes(prev => prev.map(n => n.id === activeId ? { ...n, ring: toRing, isDetached: false } : n));
        } else {
          if (node.isDetached) {
            setDetached(activeId, false);
            moveNodeToRing(activeId, toRing);
          } else if (node.ring !== toRing) {
            moveNodeToRing(activeId, toRing);
          }
        }
        setJustDraggedId(node.id);
        if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
        dragTimeoutRef.current = setTimeout(() => setJustDraggedId(null), 400);
        return;
      }
    },
    [nodes, setDetached, moveNodeToRing, isSimulation, aiState]
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
    detachedNodes.forEach((node, idx) => {
      posMap[node.id] = getGreyZonePosition(idx, detachedNodes.length);
    });
    Object.entries(nodesByRing).forEach(([ring, ringNodes]) => {
      ringNodes.forEach((node, idx) => {
        posMap[node.id] = getRingPosition(ring as Ring, idx, ringNodes.length);
      });
    });
    return posMap;
  }, [detachedNodes, nodesByRing]);

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
          if (p1 && p2) {
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
      if (p1 && p2) {
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
    if (!pos) return { viewBox: "0 0 100 100" };

    const zoomSize = 42;
    const vx = Math.max(0, Math.min(100 - zoomSize, pos.x - zoomSize / 2));
    const vy = Math.max(0, Math.min(100 - zoomSize, pos.y - zoomSize / 2));
    return { viewBox: `${vx} ${vy} ${zoomSize} ${zoomSize}` };
  }, [highlightNodeId, nodes, nodePositions]);

  return (
    <div className="w-full mx-auto mt-6 flex flex-col gap-3">
      <div
        className={`relative w-full min-h-[280px] sm:min-h-[340px] md:min-h-[400px] transition-all duration-700 ${isSimulation ? "scale-[0.85] saturate-[0.8] brightness-125" : ""}`}
        id="map-canvas"
      >
        {/* Simulation Controls (Phase 22) */}
        {!isSimulation ? (
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
        )}
        <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
          <div className="absolute inset-0">
            {shouldUseLightweightRendering && (
              <div className="absolute top-2 right-2 z-[70] rounded-xl bg-slate-900/80 border border-slate-700 px-2.5 py-1.5 text-[10px] text-slate-300">
                تم تفعيل وضع الأداء العالي لعرض خفيف
              </div>
            )}
            <motion.svg
              viewBox={viewBox}
              className="w-full h-full"
              animate={shouldReduceMotion ? undefined : { viewBox }}
              transition={shouldReduceMotion ? undefined : { duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* SVG Gradients for cosmic orb */}
              <defs>
                <radialGradient id="meDrained" cx="50%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#475569" />
                </radialGradient>
                <radialGradient id="meOkay" cx="50%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#2dd4bf" />
                  <stop offset="100%" stopColor="#0d9488" />
                </radialGradient>
                <radialGradient id="meCharged" cx="50%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#5eead4" />
                  <stop offset="50%" stopColor="#2dd4bf" />
                  <stop offset="100%" stopColor="#0f766e" />
                </radialGradient>
                {/* Cosmic glow filter */}
                <filter id="cosmicGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* ── Connection Threads ── */}
              {connectionThreads.map((line) => (
                <motion.line
                  key={line.id}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke={line.color}
                  strokeWidth={0.4}
                  strokeDasharray="1 2"
                  initial={shouldReduceMotion ? false : { pathLength: 0, opacity: 0 }}
                  animate={shouldReduceMotion ? { opacity: 0.9 } : { pathLength: 1, opacity: 1 }}
                  transition={shouldReduceMotion ? { duration: 0.2 } : { duration: 1.5, ease: "easeInOut" }}
                />
              ))}

              {/* 🛰️ Sync Circles / Interference Waves */}
              {!shouldReduceMotion && interferenceLines.map((line) => (
                <motion.line
                  key={line.id}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="rgba(244, 63, 94, 0.6)"
                  strokeWidth={0.8}
                  initial={{ opacity: 0.3, strokeDasharray: "2 4" }}
                  animate={{
                    opacity: [0.3, 0.8, 0.3],
                    strokeDashoffset: [0, -12]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
              ))}

              {/* ── Orbital Rings (Breathing) ── */}
              {!shouldReduceMotion && <OrbitalRing
                ring="red"
                label="دائرة الخطر والاستنزاف"
                radius={40}
                color={RING_COLORS.danger.stroke}
                glowColor={RING_COLORS.danger.glow}
                breatheDuration={5}
              />}
              {!shouldReduceMotion && <OrbitalRing
                ring="yellow"
                label="دائرة القرب المشروط"
                radius={29}
                color={RING_COLORS.caution.stroke}
                glowColor={RING_COLORS.caution.glow}
                breatheDuration={4.5}
              />}
              {!shouldReduceMotion && <OrbitalRing
                ring="green"
                label="دائرة القرب الصحي"
                radius={18}
                color={RING_COLORS.safe.stroke}
                glowColor={RING_COLORS.safe.glow}
                breatheDuration={4}
              />}

              {/* ── Detachment Zone (Dashed Orbit) ── */}
              <motion.circle
                cx="50"
                cy="50"
                r={Number.isFinite(GREY_ZONE_STROKE_RADIUS) ? GREY_ZONE_STROKE_RADIUS : 0}
                fill="none"
                stroke="rgba(148, 163, 184, 0.25)"
                strokeWidth={1}
                strokeDasharray="2 2.5"
                className="pointer-events-none"
                animate={shouldReduceMotion ? { opacity: 0.28 } : { opacity: [0.2, 0.4, 0.2] }}
                transition={shouldReduceMotion ? { duration: 0.2 } : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* ── Center "Me" — Cosmic Orb ── */}
              <g filter="url(#cosmicGlow)">
                {/* Outer aura */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r={9}
                  fill="none"
                  stroke={battery === "drained" ? "rgba(148, 163, 184, 0.1)" : "rgba(45, 212, 191, 0.12)"}
                  strokeWidth="0.5"
                  animate={shouldReduceMotion ? { opacity: 0.35 } : {
                    opacity: [0.3, 0.15, 0.3]
                  }}
                  transition={shouldReduceMotion ? { duration: 0.2 } : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                {/* Main orb */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r={6}
                  fill={meStyle.fill}
                  animate={shouldReduceMotion ? undefined : {
                    scale: meStyle.pulseScale,
                    opacity: battery === "drained" ? [0.6, 0.8, 0.6] : [0.85, 1, 0.85]
                  }}
                  transition={shouldReduceMotion ? undefined : {
                    duration: battery === "charged" ? 2.5 : 3.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    filter: "none"
                  }}
                />
                {/* "أنت" label */}
                <text
                  x="50"
                  y="50"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="select-none pointer-events-none"
                  style={{
                    fontSize: "3px",
                    fontWeight: 700,
                    fill: "white",
                    letterSpacing: "0.08em"
                  }}
                >
                  أنت
                </text>
              </g>

              {/* ── Drag Assist Hint ── */}
              <AnimatePresence>
                {!shouldReduceMotion && showDragHint && (
                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="pointer-events-none"
                  >
                    {/* Ghost node */}
                    <motion.circle
                      r={2.5}
                      fill="rgba(45, 212, 191, 0.4)"
                      animate={{
                        cx: [92, 68, 68, 92],
                        cy: [50, 50, 50, 50],
                        opacity: [0, 0.8, 0.8, 0],
                        scale: [0.8, 1.1, 1.1, 0.8]
                      }}
                      transition={{
                        duration: 4.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        times: [0, 0.4, 0.8, 1]
                      }}
                    />
                    {/* Pulsing target */}
                    <motion.circle
                      cx={68}
                      cy={50}
                      r={4}
                      fill="none"
                      stroke="rgba(45, 212, 191, 0.4)"
                      strokeWidth={0.5}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.g>
                )}
              </AnimatePresence>
            </motion.svg>

            {/* ── Node Overlays ── */}
            <div className="absolute inset-0 pointer-events-none">
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
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* ── Droppable Zones ── */}
            <DroppableRing id="grey" sizePct={92} zIndex={9} />
            <DroppableRing id="red" sizePct={80} zIndex={10} />
            <DroppableRing id="yellow" sizePct={58} zIndex={11} />
            <DroppableRing id="green" sizePct={36} zIndex={12} />

            {/* ── Me click zone ── */}
            {onMeClick && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMeClick();
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[20%] min-w-[56px] h-[20%] min-h-[56px] rounded-full z-30 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50 focus-visible:ring-offset-0"
                title="بطاقتك — حالتك اليوم"
                aria-label="افتح بطاقة أنا"
              />
            )}

            {/* ── AINode (Organic Agent) ── */}
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

        {/* ── Pending Move Confirmation (Glass) ── */}
        {pendingMove && (
          <motion.div
            className="relative z-50 glass-card flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 px-5 py-4 text-right"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <p className="text-sm font-semibold flex-1" style={{ color: "var(--text-primary)" }}>
              نقل "{pendingMove.nodeLabel}" إلى {RING_LABELS[pendingMove.toRing]}؟
            </p>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setPendingMove(null)}
                className="cta-muted px-4 py-2 text-sm font-medium"
              >
                إلغاء
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

      {/* ── Archive Toast ── */}
      <JourneyToast
        variant="archive"
        personName={lastArchivedName}
        visible={showArchiveToast}
        onClose={() => setShowArchiveToast(false)}
      />
    </div>
  );
};
