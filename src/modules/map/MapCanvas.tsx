import type { FC } from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { Ring, MapNode as MapNodeType } from "./mapTypes";
import { useMapState } from "../../state/mapState";

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
  onClick?: (id: string) => void;
}

// Helper function to calculate position based on ring, index, and total nodes in ring
const getRingPosition = (ring: Ring, nodeIndex: number, totalInRing: number): { x: number; y: number } => {
  // Distribute nodes evenly around the ring
  const angleStep = (2 * Math.PI) / Math.max(totalInRing, 1);
  const angle = nodeIndex * angleStep - Math.PI / 2; // Start from top (-90 degrees)
  
  let radius: number;
  if (ring === "green") {
    radius = 15; // Inner ring radius (percentage of container)
  } else if (ring === "yellow") {
    radius = 27; // Middle ring radius
  } else {
    radius = 38; // Outer ring radius
  }
  
  // Calculate position on the ring
  const x = 50 + radius * Math.cos(angle);
  const y = 50 + radius * Math.sin(angle);
  
  return { x, y };
};

const MapNodeView: FC<NodeProps> = ({ node, nodeIndex, totalInRing, onClick }) => {
  const [showDelete, setShowDelete] = useState(false);
  const deleteNode = useMapState((s) => s.deleteNode);

  // Check for mismatch between current position and recommended position
  const hasMismatch = node.analysis?.recommendedRing && node.ring !== node.analysis.recommendedRing;

  // Calculate position based on ring, index, and total nodes in ring
  const ringPos = getRingPosition(node.ring, nodeIndex, totalInRing);

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
    if (onClick) {
      onClick(node.id);
    }
  };

  return (
    <div
      style={style}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      className="relative z-20"
    >
      <motion.button
        type="button"
        className={`rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer select-none ${
          hasMismatch
            ? "bg-amber-50 border-2 border-amber-500 text-amber-900"
            : "bg-white border border-gray-200 text-slate-900"
        }`}
        onClick={handleClick}
        title={
          hasMismatch
            ? `⚠️ تعارض: موجود حالياً في دائرة مختلفة عن التوصية - اضغط للتفاصيل`
            : `اضغط لرؤية تفاصيل ${node.label}`
        }
        whileHover={{
          scale: 1.05,
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

      {/* Warning indicator for mismatch */}
      {hasMismatch && (
        <motion.div
          className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shadow-md z-30"
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

      {/* Delete Button - Shows on hover */}
      {showDelete && (
        <motion.button
          type="button"
          onClick={handleDelete}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg hover:bg-rose-600 active:scale-95 transition-all duration-150 z-30"
          title="احذف الشخص من الخريطة"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <X className="w-4 h-4" strokeWidth={2.5} />
        </motion.button>
      )}
    </div>
  );
};

interface MapCanvasProps {
  onNodeClick?: (id: string) => void;
}

export const MapCanvas: FC<MapCanvasProps> = ({ onNodeClick }) => {
  const nodes = useMapState((s) => s.nodes);

  // Group nodes by ring to calculate positions
  const nodesByRing = {
    green: nodes.filter(n => n.ring === "green"),
    yellow: nodes.filter(n => n.ring === "yellow"),
    red: nodes.filter(n => n.ring === "red")
  };

  return (
    <div className="relative w-full max-w-md mx-auto aspect-square mt-8">
        <div className="absolute inset-0 overflow-hidden">
          {/* SVG Rings Container */}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            style={{ filter: "drop-shadow(0 2px 8px rgba(0, 0, 0, 0.04))" }}
          >
            {/* Outer Ring - Red (Danger) - Largest, at back */}
            <RingView
              ring="red"
              label="دائرة الخطر والاستنزاف"
              radius={42}
              strokeWidth={16}
              color="#FB7185"
            />

            {/* Middle Ring - Yellow (Caution) */}
            <RingView
              ring="yellow"
              label="دائرة القرب المشروط"
              radius={30}
              strokeWidth={16}
              color="#FBBF24"
            />

            {/* Inner Ring - Teal (Safe) - Smallest, at front */}
            <RingView
              ring="green"
              label="دائرة القرب الصحي"
              radius={18}
              strokeWidth={16}
              color="#14B8A6"
            />

            {/* Center "Me" Circle with soft breathing animation */}
            <motion.g>
              <motion.circle
                cx="50"
                cy="50"
                r="6"
                fill="#0F172A"
                className="z-50"
                style={{
                  filter: "drop-shadow(0 2px 8px rgba(15, 23, 42, 0.15))"
                }}
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.9, 1, 0.9]
                }}
                transition={{
                  duration: 3,
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
          </svg>

          {/* Nodes Layer */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="relative w-full h-full pointer-events-auto">
              {nodes.map((node) => {
                // Find the index of this node within its ring
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
                  />
                );
              })}
            </div>
          </div>
        </div>
    </div>
  );
};
