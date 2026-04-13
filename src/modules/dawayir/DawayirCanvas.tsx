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
import { User, Clock, Zap, Coins, Maximize, GripVertical, Plus, AlertCircle, Info, X } from "lucide-react";
import { useMasafatyAnalysis, EntropyLevel } from "./hooks/useMasafatyAnalysis";
import { Button } from '@/modules/meta/UI/Button';

/* ─── Types ────────────────────────────────────────────────────────────────── */

interface DawayirCanvasProps {
  onNodeClick: (node: MapNodeType) => void;
  onAddNode: () => void;
  goalIdFilter?: string;
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
        cx="50" cy="50" r={safeRadius} 
        fill="none" 
        stroke="var(--app-border)" 
        strokeWidth="0.5" 
      />
      <motion.circle
        cx="50" cy="50" r={safeRadius}
        fill="none"
        stroke={colors[ring]}
        strokeOpacity="0.15"
        strokeWidth="0.2"
        strokeDasharray="1 2"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
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
    <motion.circle
      cx={x} cy={y} r="6"
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
  
  // Calculate "health" of assets for visual cues
  const assets = [
    { id: "body", icon: User, color: "text-blue-400" },
    { id: "time", icon: Clock, color: "text-purple-400" },
    { id: "energy", icon: Zap, color: "text-yellow-400" },
    { id: "money", icon: Coins, color: "text-emerald-400" },
    { id: "space", icon: Maximize, color: "text-rose-400" },
  ];

  return (
    <g transform="translate(50, 50)">
      {/* Halo Effect */}
      <motion.circle
        r="8"
        fill="rgba(45, 212, 191, 0.05)"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Core "Me" */}
      <motion.circle 
        r="6" 
        fill="var(--space-950)" 
        stroke="var(--ring-safe)" 
        strokeOpacity="0.6"
        strokeWidth="0.8" 
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
      {assets.map((asset, i) => {
        const angle = (i * (360 / assets.length) * Math.PI) / 180;
        const x = Math.cos(angle) * 10;
        const y = Math.sin(angle) * 10;
        const val = feelingResults?.[asset.id as keyof typeof feelingResults] || 50;
        const opacity = 0.2 + (val / 100) * 0.8;

        return (
          <g key={asset.id} transform={`translate(${x}, ${y})`}>
            <circle r="2" fill="rgba(15, 23, 42, 0.8)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.2" />
            <motion.circle 
              r="2" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="0.3"
              strokeDasharray="12.56" // 2 * PI * 2
              strokeDashoffset={12.56 * (1 - val / 100)}
              className={asset.color}
              initial={{ opacity: 0 }}
              animate={{ opacity }}
            />
          </g>
        );
      })}
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
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  const baseX = 50 + radius * Math.cos(angle);
  const baseY = 50 + radius * Math.sin(angle);

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
      style={{ ...style, outline: "none", WebkitTapHighlightColor: "transparent", zIndex: isDragging ? 50 : "auto" } as any}
      {...attributes} 
      {...listeners}
      tabIndex={-1}
      className={`cursor-grab ${isDragging ? "cursor-grabbing" : ""}`}
      whileHover={{ scale: 1.15, transition: { type: "spring", stiffness: 400, damping: 10 } }}
      whileTap={{ scale: 0.95 }}
      animate={isDragging ? { scale: 1.3, filter: "drop-shadow(0 0 15px rgba(45,212,191,0.6))" } : { scale: 1, filter: "drop-shadow(0 0 0px rgba(45,212,191,0))" }}
      onTap={() => {
        if (!isDragging && !deleteClickedRef.current && !showConfirmDelete) onClick(node);
      }}
    >
      {node.isMirrorNode && (
        <motion.circle
          cx={baseX} cy={baseY} r="7"
          fill="none" stroke="rgba(251,191,36,0.6)" strokeWidth="0.5"
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
          <circle r="1.8" fill="#eab308" />
          <text textAnchor="middle" dy="0.6" fontSize="1.8" fill="#1e293b" fontWeight="black" className="pointer-events-none drop-shadow-[0_0_5px_rgba(234,179,8,0.8)]">⚡</text>
        </motion.g>
      )}

      <EntropyGlow x={baseX} y={baseY} level={entropyLevel} />
      
      {/* Analyzing Glow */}
      {node.isAnalyzing && (
        <motion.circle
          cx={baseX} cy={baseY} r="6"
          fill="none"
          stroke="rgba(20, 184, 166, 0.5)"
          strokeWidth="0.5"
          strokeDasharray="2 2"
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      )}

      <circle 
        cx={baseX} cy={baseY} r="4" 
        fill="var(--space-950)" 
        stroke={node.isAnalyzing ? "var(--soft-teal)" : ringColors[node.ring]} 
        strokeOpacity={node.isAnalyzing ? 0.4 : 1}
        strokeWidth="0.8" 
        className="transition-colors duration-300"
      />

      {node.avatarUrl ? (
        <>
          <defs>
            <clipPath id={`clip-${node.id}`}>
              <circle cx={baseX} cy={baseY} r="3.5" />
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
          <User 
            x={baseX - 2} y={baseY - 2} 
            width={4} height={4} 
            className={node.isAnalyzing ? "text-teal-500/50 animate-pulse" : "text-white"} 
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
          <circle r="1.5" fill="#f43f5e" />
          <text textAnchor="middle" dy="0.5" fontSize="1.2" fill="white" fontWeight="bold">!</text>
        </g>
      )}

      {/* Delete Button */}
      <motion.g
        onTap={handleDeleteClick}
        className="cursor-pointer"
        initial={{ opacity: 0, scale: 0 }}
        whileHover={{ scale: 1.2 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <circle cx={baseX - 4} cy={baseY - 4} r="2" fill="#64748b" stroke="white" strokeWidth="0.2" />
        <X x={baseX - 5} y={baseY - 5} width={2} height={2} className="text-white" />
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
            خرّج "{node.label}" من المدار؟
          </p>
          <p style={{ fontSize: "0.75rem", marginBottom: "1.25rem", color: "#94a3b8" }}>
            هيتحفظ في "أشخاص مشافين" وتقدر تعيده لو احتجت.
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

export const DawayirCanvas: FC<DawayirCanvasProps> = ({ onNodeClick, onAddNode, goalIdFilter }) => {
  const allNodes = useMapState((s) => s.nodes);
  
  const nodes = useMemo(() => {
    if (!goalIdFilter) return allNodes;
    if (goalIdFilter === "family") {
      return allNodes.filter(
        (n) =>
          n.goalId === "family" || n.goalId == null || n.treeRelation?.type === "family"
      );
    }
    return allNodes.filter((n) => (n.goalId ?? "general") === goalIdFilter);
  }, [allNodes, goalIdFilter]);

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
    return {
      green: nodes.filter(n => n.ring === "green" && !n.isNodeArchived),
      yellow: nodes.filter(n => n.ring === "yellow" && !n.isNodeArchived),
      red: nodes.filter(n => n.ring === "red" && !n.isNodeArchived),
    };
  }, [nodes]);

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
