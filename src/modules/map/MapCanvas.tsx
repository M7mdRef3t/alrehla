import type { FC } from "react";
import { useState, useRef, useCallback, useEffect, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, GripVertical } from "lucide-react";
import { DndContext, TouchSensor, MouseSensor, useSensor, useSensors, useDraggable, useDroppable, type DragEndEvent } from "@dnd-kit/core";
import type { Ring, MapNode as MapNodeType } from "./mapTypes";
import { useMapState } from "../../state/mapState";
import { useMeState } from "../../state/meState";
import { mapCopy } from "../../copy/map";
import { getMissionProgressSummary } from "../../utils/missionProgress";

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
  return (
    <g aria-label={label}>
      {/* Ambient glow layer */}
      <motion.circle
        cx="50"
        cy="50"
        r={radius}
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
        r={radius}
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

/* ── Map Node View (Glass Orb) ── */

interface NodeProps {
  node: MapNodeType;
  nodeIndex: number;
  totalInRing: number;
  position?: { x: number; y: number };
  onClick?: (id: string) => void;
  justDraggedId?: string | null;
  justAdded?: boolean;
  isHighlighted?: boolean;
}

const MapNodeView: FC<NodeProps> = memo(({ node, nodeIndex, totalInRing, position, onClick, justDraggedId, justAdded, isHighlighted }) => {
  const [showDelete, setShowDelete] = useState(false);
  const [pulseDone, setPulseDone] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const deleteNode = useMapState((s) => s.deleteNode);

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

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: node.id });

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
    transform: "translate(-50%, -50%)"
  };

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = typeof window === "undefined" ? true : window.confirm(`هل تريد حذف "${node.label}" من الخريطة؟`);
    if (!ok) return;
    deleteNode(node.id);
  }, [deleteNode, node.id, node.label]);

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
      transition={justAdded ? { type: "spring", stiffness: 280, damping: 22, mass: 0.6 } : undefined}
    >
      {/* Breathing aura ring — نبضة أقوى عند التحديد من السجل */}
      <motion.div
        className="absolute -inset-2 rounded-full pointer-events-none"
        style={{
          zIndex: 0,
          border: `1.5px solid ${auraBorderColor}`,
          boxShadow: `0 0 20px ${auraColor}`
        }}
        animate={isHighlighted && !pulseDone
          ? { opacity: [0.6, 1, 0.6], scale: [1, 1.25, 1] }
          : { opacity: [0.4, 0.8, 0.4], scale: [1, 1.08, 1] }
        }
        transition={{
          duration: isHighlighted && !pulseDone ? 1.2 : 3,
          repeat: isHighlighted && !pulseDone ? 2 : Infinity,
          ease: isHighlighted && !pulseDone ? "easeOut" : "easeInOut"
        }}
      />

      {/* Main node body — Glass Orb */}
      <div
        ref={setNodeRef}
        className={`relative z-10 node-glass ${glowClass} select-none flex items-center gap-0.5 pr-1 ${
          isDragging ? "opacity-90 scale-105" : ""
        } ${
          isDetached ? "saturate-50 opacity-60" : ""
        } ${
          hasMismatch ? "border-amber-500/50!" : ""
        }`}
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
              ? `⚠️ تعارض — اضغط للتفاصيل`
              : `اضغط لرؤية تفاصيل ${node.label}`
          }
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
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
      </div>

      {/* Mismatch warning */}
      {hasMismatch && (
        <motion.div
          className="absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center z-30"
          style={{
            background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
            boxShadow: "0 0 12px rgba(251, 191, 36, 0.4)"
          }}
          animate={{
            scale: [1, 1.15, 1],
            boxShadow: [
              "0 0 8px rgba(251, 191, 36, 0.3)",
              "0 0 20px rgba(251, 191, 36, 0.5)",
              "0 0 8px rgba(251, 191, 36, 0.3)"
            ]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
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
              background: "linear-gradient(135deg, #f87171, #dc2626)",
              boxShadow: "0 0 12px rgba(248, 113, 113, 0.3)"
            }}
            title="احذف الشخص من الخريطة"
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
        opacity: isOver ? 0.15 : 0,
        backgroundColor: colorMap[id] ?? colorMap.grey,
        boxShadow: isOver ? `0 0 40px ${colorMap[id]}40` : "none"
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
  goalIdFilter?: string;
  galaxyGoalIds?: string[];
  /** عند الضغط من السجل — العقدة تعمل نبضة بلون مدارها */
  highlightNodeId?: string | null;
}

export const MapCanvas: FC<MapCanvasProps> = ({ onNodeClick, onMeClick, goalIdFilter, galaxyGoalIds, highlightNodeId }) => {
  const allNodes = useMapState((s) => s.nodes);
  const lastAddedNodeId = useMapState((s) => s.lastAddedNodeId);
  const nodes = useMemo(
    () => filterNodesByContext(allNodes, goalIdFilter, galaxyGoalIds),
    [allNodes, goalIdFilter, galaxyGoalIds]
  );
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
        setDetached(activeId, true);
        setJustDraggedId(node.id);
        if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
        dragTimeoutRef.current = setTimeout(() => setJustDraggedId(null), 400);
        return;
      }

      if (overId === "green" || overId === "yellow" || overId === "red") {
        const toRing = overId as Ring;
        if (node.isDetached) {
          setDetached(activeId, false);
          moveNodeToRing(activeId, toRing);
        } else if (node.ring !== toRing) {
          moveNodeToRing(activeId, toRing);
        }
        setJustDraggedId(node.id);
        if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
        dragTimeoutRef.current = setTimeout(() => setJustDraggedId(null), 400);
        return;
      }
    },
    [nodes, setDetached, moveNodeToRing]
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

  return (
    <div className="w-full mx-auto mt-6 flex flex-col gap-3">
      <div
        className="relative w-full min-h-[280px] sm:min-h-[340px] md:min-h-[400px]"
        id="map-canvas"
      >
      <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
      <div className="absolute inset-0">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
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

          {/* ── Orbital Rings (Breathing) ── */}
          <OrbitalRing
            ring="red"
            label="دائرة الخطر والاستنزاف"
            radius={40}
            color={RING_COLORS.danger.stroke}
            glowColor={RING_COLORS.danger.glow}
            breatheDuration={5}
          />
          <OrbitalRing
            ring="yellow"
            label="دائرة القرب المشروط"
            radius={29}
            color={RING_COLORS.caution.stroke}
            glowColor={RING_COLORS.caution.glow}
            breatheDuration={4.5}
          />
          <OrbitalRing
            ring="green"
            label="دائرة القرب الصحي"
            radius={18}
            color={RING_COLORS.safe.stroke}
            glowColor={RING_COLORS.safe.glow}
            breatheDuration={4}
          />

          {/* ── Detachment Zone (Dashed Orbit) ── */}
          <motion.circle
            cx="50"
            cy="50"
            r={GREY_ZONE_STROKE_RADIUS}
            fill="none"
            stroke="rgba(148, 163, 184, 0.25)"
            strokeWidth={1}
            strokeDasharray="2 2.5"
            className="pointer-events-none"
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* ── Center "Me" — Cosmic Orb ── */}
          <g filter="url(#cosmicGlow)">
            {/* Outer aura */}
            <motion.circle
              cx="50"
              cy="50"
              r="9"
              fill="none"
              stroke={battery === "drained" ? "rgba(148, 163, 184, 0.1)" : "rgba(45, 212, 191, 0.12)"}
              strokeWidth="0.5"
              animate={{
                r: [8, 11, 8],
                opacity: [0.3, 0.15, 0.3]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Main orb */}
            <motion.circle
              cx="50"
              cy="50"
              r="6"
              fill={meStyle.fill}
              animate={{
                scale: meStyle.pulseScale,
                opacity: battery === "drained" ? [0.6, 0.8, 0.6] : [0.85, 1, 0.85]
              }}
              transition={{
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
        </svg>

        {/* ── Node Overlays ── */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="relative w-full h-full pointer-events-auto">
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
                  justDraggedId={justDraggedId}
                  justAdded={lastAddedNodeId === node.id}
                  isHighlighted={highlightNodeId === node.id}
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
                justDraggedId={justDraggedId}
                justAdded={lastAddedNodeId === node.id}
                isHighlighted={highlightNodeId === node.id}
              />
            ))}
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
    </div>
  );
};
