/**
 * مدارات الرحلة — Ecosystem Constellation
 *
 * A sentient, orbital interface replacing the generic dashboard.
 * Active tools orbit close to the core, while inactive tools form a background nebula.
 */

import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap as Sparkles, ArrowUpRight } from "lucide-react";

// Import stores to aggregate data
import { useMapState } from "@/modules/map/dawayirIndex";
import { useAuthState } from "@/domains/auth/store/auth.store";
import { PRODUCT_TO_SATELLITE } from "@/components/EcosystemNavigator";
import { useMithaqState } from "@/modules/mithaq/store/mithaq.store";
import { useSullamState } from "@/modules/sullam/store/sullam.store";
import { useBathraState } from "@/modules/bathra/store/bathra.store";
import { useWasiyyaState } from "@/modules/wasiyya/store/wasiyya.store";
import { useKhalwaState } from "@/modules/khalwa/store/khalwa.store";

/* ═══════════════════════════════════════════ */
/*               TYPES                        */
/* ═══════════════════════════════════════════ */

interface ProductPulse {
  id: string;
  name: string;
  emoji: string;
  color: string;
  stat: number;
  statLabel: string;
  hasActivity: boolean;
  screen: string;
}

/* ═══════════════════════════════════════════ */
/*           NAVIGATION HANDLER               */
/* ═══════════════════════════════════════════ */

interface EcosystemHubProps {
  onNavigate?: (screen: string) => void;
}

/* ═══════════════════════════════════════════ */
/*           MAIN COMPONENT                   */
/* ═══════════════════════════════════════════ */

export default function EcosystemHub({ onNavigate }: EcosystemHubProps) {
  // Pull data from all stores
  const mapNodes = useMapState((s) => s.nodes);
  const pledges = useMithaqState((s) => s.pledges);
  const goals = useSullamState((s) => s.goals);
  const seeds = useBathraState((s) => s.seeds);
  const letters = useWasiyyaState((s) => s.letters);
  const khalwaSessions = useKhalwaState((s) => s.sessions);
  const khalwaMinutes = useKhalwaState((s) => s.getTotalMinutes());

  const wirdStreak = 0;

  const ecosystemData = useAuthState((s) => s.ecosystemData);
  const activeSatellites = ecosystemData?.active_satellites ?? ["alrehla"];

  // Build product pulses
  const products: ProductPulse[] = useMemo(() => [
    { id: "dawayir", name: "دوائر", emoji: "🔵", color: "#6366f1", stat: mapNodes?.length ?? 0, statLabel: "عقدة", hasActivity: (mapNodes?.length ?? 0) > 0, screen: "dawayir" },
    { id: "maraya", name: "مرايا", emoji: "🪞", color: "#a78bfa", stat: 0, statLabel: "انعكاس", hasActivity: false, screen: "maraya" },
    { id: "atmosfera", name: "أتموسفيرا", emoji: "🌤️", color: "#f472b6", stat: 0, statLabel: "حالة", hasActivity: false, screen: "atmosfera" },
    { id: "masarat", name: "مسارات", emoji: "🛤️", color: "#f59e0b", stat: 0, statLabel: "مسار", hasActivity: false, screen: "masarat" },
    { id: "baseera", name: "بصيرة", emoji: "👁️", color: "#14b8a6", stat: 0, statLabel: "رؤية", hasActivity: false, screen: "baseera" },
    { id: "watheeqa", name: "وثيقة", emoji: "📜", color: "#e879f9", stat: 0, statLabel: "وثيقة", hasActivity: false, screen: "watheeqa" },
    { id: "kharita", name: "خريطة", emoji: "🗺️", color: "#06b6d4", stat: 0, statLabel: "أداة", hasActivity: false, screen: "kharita" },
    { id: "mizan", name: "ميزان", emoji: "⚖️", color: "#f97316", stat: 0, statLabel: "تقييم", hasActivity: false, screen: "mizan" },
    { id: "rifaq", name: "رفاق", emoji: "👥", color: "#22c55e", stat: 0, statLabel: "رفيق", hasActivity: false, screen: "rifaq" },
    { id: "murshid", name: "مرشد", emoji: "🧠", color: "#8b5cf6", stat: 0, statLabel: "توجيه", hasActivity: false, screen: "murshid" },
    { id: "jisr", name: "جسر", emoji: "🌉", color: "#ec4899", stat: 0, statLabel: "جسر", hasActivity: false, screen: "jisr" },
    { id: "rafiq", name: "رفيق", emoji: "🧭", color: "#6366f1", stat: 0, statLabel: "رفيق", hasActivity: false, screen: "rafiq" },
    { id: "taqrir", name: "تقرير", emoji: "📊", color: "#06b6d4", stat: 0, statLabel: "تقرير", hasActivity: false, screen: "taqrir" },
    { id: "bawsala", name: "بوصلة", emoji: "🧭", color: "#06b6d4", stat: 0, statLabel: "قرار", hasActivity: false, screen: "bawsala" },
    { id: "riwaya", name: "رواية", emoji: "📖", color: "#fb923c", stat: 0, statLabel: "فصل", hasActivity: false, screen: "riwaya" },
    { id: "nadhir", name: "نذير", emoji: "🛡️", color: "#ef4444", stat: 0, statLabel: "تنبيه", hasActivity: false, screen: "nadhir" },
    { id: "wird", name: "وِرد", emoji: "🔥", color: "#fbbf24", stat: wirdStreak, statLabel: "يوم", hasActivity: wirdStreak > 0, screen: "wird" },
    { id: "warsha", name: "ورشة", emoji: "⚡", color: "#f97316", stat: 0, statLabel: "تحدي", hasActivity: false, screen: "warsha" },
    { id: "mithaq", name: "ميثاق", emoji: "🤝", color: "#fbbf24", stat: pledges?.length ?? 0, statLabel: "عقد", hasActivity: (pledges?.length ?? 0) > 0, screen: "mithaq" },
    { id: "sullam", name: "سُلّم", emoji: "📈", color: "#84cc16", stat: goals?.length ?? 0, statLabel: "هدف", hasActivity: (goals?.length ?? 0) > 0, screen: "sullam" },
    { id: "bathra", name: "بذرة", emoji: "🌱", color: "#10b981", stat: seeds?.length ?? 0, statLabel: "بذرة", hasActivity: (seeds?.length ?? 0) > 0, screen: "bathra" },
    { id: "session-intake", name: "جلسات", emoji: "📅", color: "#3b82f6", stat: 0, statLabel: "طلب", hasActivity: false, screen: "session-intake" },
    { id: "session-console", name: "كونسول", emoji: "🧩", color: "#3b82f6", stat: 0, statLabel: "جلسة", hasActivity: false, screen: "session-console" },
    { id: "samt", name: "صمت", emoji: "🤫", color: "#14b8a6", stat: 0, statLabel: "نَفَس", hasActivity: false, screen: "samt" },
    { id: "qalb", name: "قلب", emoji: "❤️", color: "#ef4444", stat: 0, statLabel: "نبض", hasActivity: false, screen: "qalb" },
    { id: "niyya", name: "نية", emoji: "🎯", color: "#10b981", stat: 0, statLabel: "نية", hasActivity: false, screen: "niyya" },
    { id: "jathr", name: "جذر", emoji: "🧬", color: "#22c55e", stat: 0, statLabel: "قيمة", hasActivity: false, screen: "jathr" },
    { id: "ruya", name: "رؤيا", emoji: "🔮", color: "#8b5cf6", stat: 0, statLabel: "حلم", hasActivity: false, screen: "ruya" },
    { id: "kanz", name: "كنز", emoji: "🪙", color: "#f59e0b", stat: 0, statLabel: "حكمة", hasActivity: false, screen: "kanz" },
    { id: "tazkiya", name: "تزكية", emoji: "🌿", color: "#a78bfa", stat: 0, statLabel: "تطهير", hasActivity: false, screen: "tazkiya" },
    { id: "protocol", name: "بروتوكول", emoji: "⚡", color: "#f59e0b", stat: 0, statLabel: "خطة", hasActivity: false, screen: "protocol" },
    { id: "markaz", name: "مركز", emoji: "🏢", color: "#6366f1", stat: 0, statLabel: "أمر", hasActivity: false, screen: "markaz" },
    { id: "sada", name: "صدى", emoji: "🔔", color: "#06b6d4", stat: 0, statLabel: "تنبيه", hasActivity: false, screen: "sada" },
    { id: "hafiz", name: "حافظ", emoji: "💎", color: "#a855f7", stat: 0, statLabel: "ذكرى", hasActivity: false, screen: "hafiz" },
    { id: "mirah", name: "مرآة", emoji: "🔮", color: "#c084fc", stat: 0, statLabel: "رؤية", hasActivity: false, screen: "mirah" },
    { id: "sijil", name: "سِجل", emoji: "📋", color: "#10b981", stat: 0, statLabel: "حدث", hasActivity: false, screen: "sijil" },
    { id: "naba", name: "نبع", emoji: "💧", color: "#06b6d4", stat: 0, statLabel: "رشفة", hasActivity: false, screen: "naba" },
    { id: "athar", name: "أثر", emoji: "📜", color: "#f59e0b", stat: 0, statLabel: "أثر", hasActivity: false, screen: "athar" },
    { id: "risala", name: "رسالة", emoji: "✉️", color: "#f59e0b", stat: 0, statLabel: "رسالة", hasActivity: false, screen: "risala" },
    { id: "shahada", name: "شهادة", emoji: "📄", color: "#14b8a6", stat: 0, statLabel: "شهادة", hasActivity: false, screen: "shahada" },
    { id: "observatory", name: "المرصد", emoji: "🕸️", color: "#818cf8", stat: 0, statLabel: "نمط", hasActivity: false, screen: "observatory" },
    { id: "wasiyya", name: "وصية", emoji: "✉️", color: "#fbbf24", stat: letters?.length ?? 0, statLabel: "رسالة", hasActivity: (letters?.length ?? 0) > 0, screen: "wasiyya" },
    { id: "khalwa", name: "خلوة", emoji: "🧘", color: "#8b5cf6", stat: khalwaSessions?.length ?? 0, statLabel: "جلسة", hasActivity: (khalwaSessions?.length ?? 0) > 0, screen: "khalwa" },
  ], [mapNodes, pledges, goals, seeds, letters, khalwaSessions, wirdStreak]);

  const constellationProducts = useMemo(() => {
    return products.map(p => {
      const satellite = PRODUCT_TO_SATELLITE[p.id as keyof typeof PRODUCT_TO_SATELLITE];
      const isLocked = satellite ? !(activeSatellites as string[]).includes(satellite as string) : false;
      return { ...p, isLocked };
    });
  }, [products, activeSatellites]);

  const activeProducts = useMemo(() => constellationProducts.filter((p) => p.hasActivity && !p.isLocked), [constellationProducts]);
  const inactiveProducts = useMemo(() => constellationProducts.filter((p) => !p.hasActivity || p.isLocked), [constellationProducts]);
  
  const totalActive = activeProducts.length;
  const healthPct = Math.round((totalActive / products.length) * 100);

  const [isMounted, setIsMounted] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  useEffect(() => { setIsMounted(true); }, []);

  // Layout Constants (Safe for SSR)
  const INNER_RADIUS = isMounted && typeof window !== 'undefined' && window.innerWidth < 768 ? 110 : 160;
  const OUTER_RADIUS = isMounted && typeof window !== 'undefined' && window.innerWidth < 768 ? 200 : 340;

  // Calculate coordinates for nodes
  const calculateOrbit = (nodes: ProductPulse[], radius: number, isInner: boolean) => {
    return nodes.map((node, i) => {
      // Use deterministic "randomness" based on index to avoid hydration mismatch
      const jitterX = isInner ? 0 : (Math.sin(i * 123.45) * 20);
      const jitterY = isInner ? 0 : (Math.cos(i * 678.90) * 20);
      const angle = (i / nodes.length) * 2 * Math.PI;
      
      return {
        ...node,
        x: Math.cos(angle) * radius + jitterX,
        y: Math.sin(angle) * radius + jitterY,
      };
    });
  };

  const innerNodes = useMemo(() => calculateOrbit(activeProducts, INNER_RADIUS, true), [activeProducts]);
  const outerNodes = useMemo(() => calculateOrbit(inactiveProducts, OUTER_RADIUS, false), [inactiveProducts]);

  return (
    <div className="relative w-full min-h-screen bg-[#030712] overflow-hidden flex items-center justify-center font-sans" dir="rtl">
      
      {/* 1. Deep Space Nebula Background */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            rotate: [0, 90, 0]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute w-[800px] h-[800px] rounded-full top-[-20%] right-[-10%] blur-[120px]"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)" }} 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.4, 0.2],
            rotate: [0, -90, 0]
          }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute w-[600px] h-[600px] rounded-full bottom-[-10%] left-[-10%] blur-[100px]"
          style={{ background: "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)" }} 
        />
      </div>

      {/* Header Overlay */}
      <div className="absolute top-[80px] left-0 right-0 p-6 z-50 pointer-events-none flex justify-between items-start">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="pointer-events-auto">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-l from-white to-white/60 tracking-tight">
            سماء الرحلة
          </h1>
          <p className="text-sm text-slate-400 font-medium mt-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            تتناغم مع إيقاعك
          </p>
        </motion.div>
      </div>

      {/* The Constellation Container */}
      <div className="relative flex items-center justify-center w-full h-[800px] max-w-[1000px] mx-auto scale-75 md:scale-100">
        
        {/* Orbit Rings (Visual Only) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="absolute rounded-full border border-slate-500 border-dashed" style={{ width: INNER_RADIUS * 2, height: INNER_RADIUS * 2 }} />
          <div className="absolute rounded-full border border-slate-700/50" style={{ width: OUTER_RADIUS * 2, height: OUTER_RADIUS * 2 }} />
        </div>

        {/* 2. The Singularity (Core Pulse) */}
        <div className="absolute z-10 flex flex-col items-center justify-center pointer-events-none">
          <motion.div
            animate={{ 
              boxShadow: [
                `0 0 40px rgba(20, 184, 166, 0.2)`,
                `0 0 80px rgba(20, 184, 166, 0.6)`,
                `0 0 40px rgba(20, 184, 166, 0.2)`
              ]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-32 h-32 md:w-40 md:h-40 rounded-full border border-teal-500/30 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center pointer-events-auto cursor-pointer"
            onClick={() => onNavigate?.("home")}
          >
            <span className="text-3xl font-black text-white mb-1">{healthPct}%</span>
            <span className="text-[10px] text-teal-400 font-bold tracking-widest uppercase">رنين النظام</span>
          </motion.div>
        </div>

        {/* 3. Global Rotation Container */}
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 180, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {/* Inner Orbit (Active Products) */}
          {innerNodes.map((node) => (
            <OrbitNode 
              key={node.id} 
              node={node} 
              isInner={true} 
              isHovered={hoveredNode === node.id}
              onHover={setHoveredNode}
              onClick={() => onNavigate?.(node.screen)}
            />
          ))}

          {/* Outer Orbit (Inactive Nebula) */}
          {outerNodes.map((node) => (
            <OrbitNode 
              key={node.id} 
              node={node} 
              isInner={false} 
              isHovered={hoveredNode === node.id}
              onHover={setHoveredNode}
              onClick={() => onNavigate?.(node.screen)}
            />
          ))}
        </motion.div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/*           ORBIT NODE COMPONENT             */
/* ═══════════════════════════════════════════ */

interface OrbitNodeProps {
  node: ProductPulse & { x: number; y: number };
  isInner: boolean;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onClick: () => void;
}

function OrbitNode({ node, isInner, isHovered, onHover, onClick }: OrbitNodeProps & { node: { isLocked?: boolean } }) {
  const isLocked = node.isLocked;

  return (
    <motion.div
      className="absolute"
      style={{ left: `calc(50% + ${node.x}px)`, top: `calc(50% + ${node.y}px)` }}
      // Counter-rotate so items stay upright
      animate={{ rotate: -360 }}
      transition={{ duration: 180, repeat: Infinity, ease: "linear" }}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
    >
      <motion.button
        onClick={isLocked ? undefined : onClick}
        whileHover={isLocked ? {} : { scale: 1.2, zIndex: 50 }}
        whileTap={isLocked ? {} : { scale: 0.9 }}
        className={`relative flex flex-col items-center justify-center group -translate-x-1/2 -translate-y-1/2 ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {/* Glow behind the node */}
        <AnimatePresence>
          {(isInner || isHovered) && !isLocked && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute inset-0 rounded-full blur-xl"
              style={{ background: node.color, opacity: isHovered ? 0.6 : 0.3 }}
            />
          )}
        </AnimatePresence>

        {/* The Node Bubble */}
        <div 
          className={`relative z-10 flex items-center justify-center rounded-full border backdrop-blur-md transition-all duration-300
            ${isInner 
              ? 'w-14 h-14 md:w-16 md:h-16 border-white/20 shadow-lg' 
              : 'w-10 h-10 border-white/5 opacity-50 group-hover:opacity-100 group-hover:w-14 group-hover:h-14'
            }
            ${isLocked ? 'grayscale opacity-30 bg-slate-950/80' : ''}
          `}
          style={{ 
            background: !isLocked && (isInner || isHovered) ? `${node.color}20` : isLocked ? 'rgba(2,6,23,0.9)' : 'rgba(15,23,42,0.8)',
            borderColor: !isLocked && (isInner || isHovered) ? `${node.color}50` : isLocked ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.05)'
          }}
        >
          <span className={`${(isInner || isHovered) && !isLocked ? 'text-2xl' : 'text-lg grayscale group-hover:grayscale-0'} transition-all`}>
            {isLocked ? "🔒" : node.emoji}
          </span>

          {/* Activity Dot */}
          {isInner && (
            <div className="absolute top-0 right-0 w-3 h-3 rounded-full border border-slate-900" style={{ background: node.color }} />
          )}
        </div>

        {/* Floating Label */}
        <AnimatePresence>
          {(isInner || isHovered) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute top-full mt-2 flex flex-col items-center pointer-events-none whitespace-nowrap"
            >
              <span className="text-xs font-bold text-white drop-shadow-md">{node.name}</span>
              {node.hasActivity && !isLocked && (
                <span className="text-[10px] font-black" style={{ color: node.color }}>
                  {node.stat} {node.statLabel}
                </span>
              )}
              {isLocked && (
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-0.5">
                  تطلب: {PRODUCT_TO_SATELLITE[node.id] || 'alrehla'}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </motion.button>
    </motion.div>
  );
}
