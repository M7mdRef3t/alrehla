import type { FC } from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { X, GripVertical } from "lucide-react";
import { DndContext, TouchSensor, MouseSensor, useSensor, useSensors, useDraggable, useDroppable, type DragEndEvent } from "@dnd-kit/core";
import type { Ring, MapNode as MapNodeType } from "./mapTypes";
import { useMapState } from "../../state/mapState";
import { useMeState } from "../../state/meState";
import { mapCopy } from "../../copy/map";

interface RingProps {
  ring: Ring;
  label: string;
  radius: number;
  strokeWidth: number;
  color: string;
}

const RingView: FC<RingProps> = ({ label, radius, strokeWidth, color }) => {
  return (
    <g aria-label={label}>
      {/* Background Track - Faint ring to show structure */}
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-slate-100 opacity-40"
      />
      
      {/* Active Ring */}
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        opacity={0.9}
        className="transition-all duration-200"
      />
    </g>
  );
};

interface NodeProps {
  node: MapNodeType;
  nodeIndex: number;
  totalInRing: number;
  /** عند العرض في المنطقة الرمادية */
  position?: { x: number; y: number };
  onClick?: (id: string) => void;
  justDraggedId?: string | null;
}

// Helper function to calculate position based on ring, index, and total nodes in ring
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

/** المنطقة الرمادية: خارج الدائرة الحمراء — نفس وحدات getRingPosition */
const GREY_ZONE_RADIUS = 52;
const getGreyZonePosition = (nodeIndex: number, totalInGrey: number): { x: number; y: number } => {
  const angleStep = (2 * Math.PI) / Math.max(totalInGrey, 1);
  const angle = nodeIndex * angleStep - Math.PI / 2;
  const x = 50 + GREY_ZONE_RADIUS * Math.cos(angle);
  const y = 50 + GREY_ZONE_RADIUS * Math.sin(angle);
  return { x, y };
};

/** لون حلقة التهديد حسب الدائرة: أحمر عالي، أصفر متوسط، أخضر منخفض، رمادي للمنفصل */
const THREAT_RING_CLASS: Record<Ring, string> = {
  red: "border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]",
  yellow: "border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]",
  green: "border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.35)]"
};

const MapNodeView: FC<NodeProps> = ({ node, nodeIndex, totalInRing, position, onClick, justDraggedId }) => {
  const [showDelete, setShowDelete] = useState(false);
  const deleteNode = useMapState((s) => s.deleteNode);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: node.id });

  const hasMismatch = node.analysis?.recommendedRing && node.ring !== node.analysis.recommendedRing;
  const ringPos = position ?? getRingPosition(node.ring, nodeIndex, totalInRing);
  const isDetached = !!node.isDetached;
  const threatRingClass = isDetached
    ? "border-slate-400 shadow-[0_0_6px_rgba(148,163,184,0.25)]"
    : THREAT_RING_CLASS[node.ring];

  const style: React.CSSProperties = {
    position: "absolute",
    top: `${ringPos.y}%`,
    left: `${ringPos.x}%`,
    transform: "translate(-50%, -50%)"
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(node.id);
  };

  const handleClick = () => {
    if (node.id === justDraggedId) return;
    if (onClick) onClick(node.id);
  };

  return (
    <div
      style={style}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      className="relative z-20"
    >
      {/* حلقة مستوى التهديد النابضة */}
      <motion.div
        className={`absolute -inset-1.5 rounded-full border-2 pointer-events-none ${threatRingClass}`}
        style={{ zIndex: 0 }}
        animate={{
          opacity: [0.5, 1, 0.5],
          scale: [1, 1.06, 1]
        }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <div
        ref={setNodeRef}
        className={`relative z-10 rounded-full shadow-sm hover:shadow-lg transition-all duration-200 select-none flex items-center gap-0.5 pr-1 ${
          isDragging ? "opacity-90 scale-105" : ""
        } ${
          isDetached
            ? "bg-slate-200 border border-slate-400 text-slate-600 saturate-0"
            : hasMismatch
              ? "bg-amber-50 border-2 border-amber-500 text-amber-900"
              : "bg-white border border-gray-200 text-slate-900"
        }`}
      >
        <motion.button
          type="button"
          onClick={handleClick}
          className="rounded-l-full pl-5 pr-2 py-2.5 text-sm font-semibold cursor-pointer flex-1 text-right min-w-0"
          title={
            hasMismatch
              ? `⚠️ تعارض — اضغط للتفاصيل`
              : `اضغط لرؤية تفاصيل ${node.label}`
          }
          whileHover={{
            scale: 1.02,
            boxShadow: hasMismatch
              ? "0 10px 25px -5px rgba(245, 158, 11, 0.3), 0 4px 6px -2px rgba(245, 158, 11, 0.15)"
              : "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
          }}
          whileTap={{
            scale: 0.98,
            boxShadow: hasMismatch
              ? "0 20px 40px -10px rgba(245, 158, 11, 0.4), 0 8px 12px -4px rgba(245, 158, 11, 0.2)"
              : "0 20px 40px -10px rgba(0, 0, 0, 0.15), 0 8px 12px -4px rgba(0, 0, 0, 0.08)"
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <span className="text-xs md:text-sm font-semibold">{node.label}</span>
        </motion.button>
        <span
          {...listeners}
          {...attributes}
          className={`shrink-0 p-1.5 rounded-r-full cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 touch-none`}
          title="اسحب لتحريك الدائرة"
          aria-label="اسحب لتحريك"
        >
          <GripVertical className="w-4 h-4" strokeWidth={2} />
        </span>
      </div>

      {/* Warning indicator for mismatch */}
      {hasMismatch && (
        <motion.div
          className="absolute -top-1 -left-1 w-6 h-6 sm:w-5 sm:h-5 rounded-full bg-amber-500 flex items-center justify-center shadow-md z-30"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: 1
          }}
          transition={{ 
            scale: {
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            },
            opacity: { duration: 0.2 }
          }}
        >
          <span className="text-white text-xs font-bold">!</span>
        </motion.div>
      )}

      {/* Delete Button - Shows on hover or always on mobile */}
      {showDelete && (
        <motion.button
          type="button"
          onClick={handleDelete}
          className="absolute -top-2 -right-2 w-9 h-9 sm:w-6 sm:h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg hover:bg-rose-600 active:scale-95 transition-all duration-150 z-30"
          title="احذف الشخص من الخريطة"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <X className="w-5 h-5 sm:w-4 sm:h-4" strokeWidth={2.5} />
        </motion.button>
      )}
    </div>
  );
};

const RING_LABELS: Record<Ring, string> = {
  green: mapCopy.legendGreen,
  yellow: mapCopy.legendYellow,
  red: mapCopy.legendRed
};

const DroppableRing: FC<{ id: Ring | "grey"; sizePct: number; zIndex: number }> = ({ id, sizePct, zIndex }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const bg =
    id === "grey" ? "#94a3b8" : id === "green" ? "#14B8A6" : id === "yellow" ? "#FBBF24" : "#FB7185";
  return (
    <div
      ref={setNodeRef}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-auto transition-opacity"
      style={{
        width: `${sizePct}%`,
        height: `${sizePct}%`,
        zIndex,
        opacity: isOver ? 0.25 : 0,
        backgroundColor: bg
      }}
      aria-hidden
    />
  );
};

interface MapCanvasProps {
  onNodeClick?: (id: string) => void;
  onMeClick?: () => void;
  /** عرض سياق واحد: نعرض فقط العقد اللي goalId بتاعها = goalIdFilter (أو general) */
  goalIdFilter?: string;
  /** عرض الكل (Galaxy): نعرض العقد اللي goalId بتاعها في القائمة */
  galaxyGoalIds?: string[];
}

const ME_CENTER_COLORS: Record<string, { fill: string; shadow: string }> = {
  drained: { fill: "#64748b", shadow: "0 2px 8px rgba(100, 116, 139, 0.25)" },
  okay: { fill: "#0F172A", shadow: "0 2px 8px rgba(15, 23, 42, 0.15)" },
  charged: { fill: "#0D9488", shadow: "0 2px 12px rgba(13, 148, 136, 0.5)" }
};

type PendingMove = { nodeId: string; nodeLabel: string; fromRing: Ring; toRing: Ring };

function filterNodesByContext(
  nodes: MapNodeType[],
  goalIdFilter?: string,
  galaxyGoalIds?: string[]
): MapNodeType[] {
  if (galaxyGoalIds != null && galaxyGoalIds.length > 0) {
    return nodes.filter((n) => galaxyGoalIds.includes(n.goalId ?? "general"));
  }
  if (goalIdFilter != null && goalIdFilter !== "") {
    // عائلة: goalId = family أو null أو اللي مربوطين في شجرة العيلة (treeRelation نوع عيلة)
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

export const MapCanvas: FC<MapCanvasProps> = ({ onNodeClick, onMeClick, goalIdFilter, galaxyGoalIds }) => {
  const allNodes = useMapState((s) => s.nodes);
  const nodes = filterNodesByContext(allNodes, goalIdFilter, galaxyGoalIds);
  const moveNodeToRing = useMapState((s) => s.moveNodeToRing);
  const setDetached = useMapState((s) => s.setDetached);
  const battery = useMeState((s) => s.battery);
  const meStyle = ME_CENTER_COLORS[battery] ?? ME_CENTER_COLORS.okay;

  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
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
          setPendingMove({ nodeId: node.id, nodeLabel: node.label, fromRing: node.ring, toRing });
        } else if (node.ring !== toRing) {
          setPendingMove({ nodeId: node.id, nodeLabel: node.label, fromRing: node.ring, toRing });
        }
        setJustDraggedId(node.id);
        if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
        dragTimeoutRef.current = setTimeout(() => setJustDraggedId(null), 400);
        return;
      }
    },
    [nodes, setDetached]
  );

  const confirmPlacement = () => {
    if (!pendingMove) return;
    moveNodeToRing(pendingMove.nodeId, pendingMove.toRing);
    setPendingMove(null);
  };

  const detachedNodes = nodes.filter((n) => n.isDetached);
  const ringNodes = nodes.filter((n) => !n.isDetached);
  const nodesByRing = {
    green: ringNodes.filter(n => n.ring === "green"),
    yellow: ringNodes.filter(n => n.ring === "yellow"),
    red: ringNodes.filter(n => n.ring === "red")
  };

  return (
    <div className="w-full max-w-md mx-auto mt-8 flex flex-col gap-3">
      <div className="relative w-full aspect-square" id="map-canvas">
      <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
      <div className="absolute inset-0 overflow-hidden">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          style={{ filter: "drop-shadow(0 2px 8px rgba(0, 0, 0, 0.04))" }}
        >
          <RingView ring="red" label="دائرة الخطر والاستنزاف" radius={42} strokeWidth={16} color="#FB7185" />
          <RingView ring="yellow" label="دائرة القرب المشروط" radius={30} strokeWidth={16} color="#FBBF24" />
          <RingView ring="green" label="دائرة القرب الصحي" radius={18} strokeWidth={16} color="#14B8A6" />

          {/* Center "Me" — لون حسب البطارية */}
          <motion.g>
            <motion.circle
              cx="50"
              cy="50"
              r="6"
              fill={meStyle.fill}
              className="transition-colors duration-300"
              style={{ filter: `drop-shadow(${meStyle.shadow})` }}
              animate={{
                scale: battery === "charged" ? [1, 1.08, 1] : [1, 1.05, 1],
                opacity: battery === "drained" ? [0.7, 0.85, 0.7] : [0.9, 1, 0.9]
              }}
              transition={{
                duration: battery === "charged" ? 2.5 : 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <text
              x="50"
              y="50"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[3px] font-bold fill-white select-none pointer-events-none"
            >
              أنت
            </text>
          </motion.g>

          {/* المنطقة الرمادية: خارج الأحمر — عزل تعافي */}
          <g aria-hidden>
            <circle cx="50" cy="50" r={GREY_ZONE_RADIUS} fill="none" stroke="#94a3b8" strokeWidth={8} opacity={0.35} className="pointer-events-none" />
          </g>
        </svg>

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
              />
            ))}
          </div>
        </div>

        {/* مناطق إفلات الدوائر — الرمادي خلف الأحمر عشان الإسقاط على الحافة يعدّ رمادي */}
        <DroppableRing id="grey" sizePct={98} zIndex={9} />
        <DroppableRing id="red" sizePct={84} zIndex={10} />
        <DroppableRing id="yellow" sizePct={64} zIndex={11} />
        <DroppableRing id="green" sizePct={44} zIndex={12} />

        {/* منطقة نقر مركز "أنا" — تفتح بطاقة أنا */}
        {onMeClick && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMeClick();
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[20%] min-w-[56px] h-[20%] min-h-[56px] rounded-full z-30 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2"
            title="بطاقتك — حالتك اليوم"
            aria-label="افتح بطاقة أنا"
          />
        )}
      </div>
      </DndContext>

      {pendingMove && (
        <div className="relative z-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 px-4 py-3 rounded-xl bg-teal-50 border-2 border-teal-200 text-right shadow-lg">
          <p className="text-sm font-semibold text-slate-800 flex-1">
            نقل "{pendingMove.nodeLabel}" إلى {RING_LABELS[pendingMove.toRing]}؟
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setPendingMove(null)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-200 text-slate-700 hover:bg-slate-300"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={confirmPlacement}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700"
            >
              {mapCopy.confirmPlacement}
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};
