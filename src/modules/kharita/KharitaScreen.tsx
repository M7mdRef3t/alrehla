/**
 * خريطة — Kharita Screen (Living Trail)
 * First Principles Redesign: A living footprint map with Fog of War.
 */

import React, { useMemo, useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Lock, Map, Compass, Shield, Sparkles, MapPin, CheckCircle2 } from "lucide-react";
import type { AppScreen } from "@/navigation/navigationMachine";

/* ═══════════════════════════════════════════ */
/*              ECOSYSTEM DATA                */
/* ═══════════════════════════════════════════ */

interface EcoTool {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
  screen: string;
  unlockedLevel: number; // 0 to 100 representing journey progress required
}

// Ordered sequentially to form a journey
const ECOSYSTEM: EcoTool[] = [
  { id: "bawsala",   name: "بوصلة",   emoji: "🧭", color: "#14b8a6", description: "البداية وتحديد الوجهة", screen: "bawsala", unlockedLevel: 0 },
  { id: "markaz",    name: "المركز",   emoji: "🏢", color: "#6366f1", description: "مركز القيادة",        screen: "markaz",  unlockedLevel: 5 },
  { id: "niyya",     name: "نية",      emoji: "🎯", color: "#10b981", description: "إخلاص النية",        screen: "niyya",   unlockedLevel: 10 },
  { id: "masarat",   name: "مسارات",   emoji: "🗺️", color: "#6366f1", description: "خرائط التحول",       screen: "masarat", unlockedLevel: 15 },
  { id: "jathr",     name: "جذر",      emoji: "🧬", color: "#22c55e", description: "القيم الجذرية",      screen: "jathr",   unlockedLevel: 20 },
  { id: "tazkiya",   name: "تزكية",    emoji: "🌿", color: "#10b981", description: "تطهير النفس",        screen: "tazkiya", unlockedLevel: 25 },
  { id: "samt",      name: "صمت",      emoji: "🤫", color: "#06b6d4", description: "التنفس الواعي",      screen: "samt",    unlockedLevel: 30 },
  { id: "qalb",      name: "قلب",      emoji: "❤️", color: "#ef4444", description: "صحة القلب",          screen: "qalb",    unlockedLevel: 35 },
  { id: "bathra",    name: "بذرة",     emoji: "🌱", color: "#10b981", description: "بذور العادات",       screen: "bathra",  unlockedLevel: 40 },
  { id: "wird",      name: "ورد",      emoji: "📿", color: "#8b5cf6", description: "الأذكار اليومية",     screen: "wird",    unlockedLevel: 45 },
  { id: "sanctuary", name: "ملاذ",     emoji: "🏔️", color: "#475569", description: "الملاذ الآمن",        screen: "sanctuary",unlockedLevel: 50 },
  { id: "sada",      name: "الصدى",    emoji: "🔔", color: "#06b6d4", description: "الإشارات المتكررة",    screen: "sada",    unlockedLevel: 55 },
  { id: "maraya",    name: "مرايا",    emoji: "🪞", color: "#a78bfa", description: "الأنماط الخفية",     screen: "maraya",  unlockedLevel: 60 },
  { id: "dawayir",   name: "دوائر",    emoji: "⭕", color: "#8b5cf6", description: "خريطة العلاقات",     screen: "dawayir", unlockedLevel: 65 },
  { id: "jisr",      name: "جسر",      emoji: "🌉", color: "#ec4899", description: "الجسور العلائقية",   screen: "jisr",    unlockedLevel: 70 },
  { id: "rifaq",     name: "رفاق",     emoji: "👥", color: "#22c55e", description: "رفاق الطريق",        screen: "rifaq",   unlockedLevel: 75 },
  { id: "kanz",      name: "كنز",      emoji: "🪙", color: "#f59e0b", description: "بنك الحكمة",         screen: "kanz",    unlockedLevel: 80 },
  { id: "athar",     name: "أثر",      emoji: "📜", color: "#f59e0b", description: "سجل الحياة",        screen: "athar",   unlockedLevel: 85 },
  { id: "mizan",     name: "ميزان",    emoji: "⚖️", color: "#64748b", description: "ميزان الحياة",      screen: "mizan",   unlockedLevel: 90 },
  { id: "risala",    name: "رسالة",    emoji: "✉️", color: "#f59e0b", description: "رسائل المعنى",      screen: "risala",  unlockedLevel: 95 },
  { id: "shahada",   name: "شهادة",    emoji: "📄", color: "#14b8a6", description: "إثبات التحول",      screen: "shahada", unlockedLevel: 100 },
];

const KHARITA_SCREEN_ROUTES: Record<string, AppScreen> = {
  compass: "bawsala", masarat: "masarat", tazkiya: "tazkiya", protocol: "protocol",
  rafiq: "rafiq", qalb: "qalb", samt: "samt", ruya: "ruya", niyya: "niyya",
  jathr: "jathr", kanz: "kanz", jisr: "jisr", dawayir: "dawayir", rifaq: "rifaq",
  murshid: "murshid", risala: "risala", shahada: "shahada", markaz: "markaz",
  sada: "sada", hafiz: "hafiz", naba: "naba", maraya: "maraya", kharita: "kharita",
  mizan: "mizan", bathra: "bathra", athar: "athar", wird: "wird", sanctuary: "sanctuary",
  muhadatha: "rifaq", dhakira: "hafiz", mawazin: "mizan", muraqaba: "observatory", habits: "bathra",
};

interface KharitaScreenProps {
  onNavigate?: (screen: AppScreen) => void;
}

/* ═══════════════════════════════════════════ */
/*           LIVING MAP CANVAS                */
/* ═══════════════════════════════════════════ */

export default function KharitaScreen({ onNavigate }: KharitaScreenProps) {
  // Simulated progress: user is at level 40 (has unlocked tools up to unlockedLevel 40)
  const currentProgressLevel = 45; 
  
  const handleNavigate = (screen: string, unlocked: boolean) => {
    if (!unlocked) return; // Prevent navigation to locked areas (Fog of War)
    const appScreen = KHARITA_SCREEN_ROUTES[screen] || (screen as AppScreen);
    if (appScreen && onNavigate) {
      onNavigate(appScreen);
    } else {
      window.location.hash = `#${screen}`;
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const pathProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  // Calculate positions for nodes
  const nodes = useMemo(() => {
    const spacingY = 160; // vertical spacing
    return ECOSYSTEM.map((tool, index) => {
      // Create a meandering river effect
      // x alternates left and right, with some randomness to make it organic
      const isRight = index % 2 === 0;
      const xPercent = isRight ? 65 + Math.sin(index) * 15 : 35 + Math.cos(index) * 15;
      
      return {
        ...tool,
        index,
        x: xPercent,
        y: index * spacingY,
        unlocked: tool.unlockedLevel <= currentProgressLevel,
        isCurrent: tool.unlockedLevel === currentProgressLevel,
      };
    });
  }, [currentProgressLevel]);

  const totalHeight = (nodes.length - 1) * 160 + 300;

  // Generate SVG Path
  const svgPath = useMemo(() => {
    if (nodes.length === 0) return "";
    let d = `M 50 0`; // Start at top center
    
    nodes.forEach((node, i) => {
      // Connect to node
      if (i === 0) {
        d += ` L ${node.x} ${node.y}`;
      } else {
        const prev = nodes[i - 1];
        // Control points for a smooth organic curve
        const cp1x = prev.x;
        const cp1y = prev.y + 80;
        const cp2x = node.x;
        const cp2y = node.y - 80;
        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${node.x} ${node.y}`;
      }
    });
    return d;
  }, [nodes]);

  return (
    <div className="min-h-screen bg-[#020617] font-sans pb-32 overflow-hidden relative" dir="rtl">
      {/* Background Nebula */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <motion.div 
          className="absolute w-[800px] h-[800px] rounded-full top-0 left-[50%] -translate-x-1/2"
          style={{ background: "radial-gradient(circle, rgba(16,185,129,0.03), transparent 70%)" }} 
        />
        <motion.div 
          className="absolute w-[600px] h-[600px] rounded-full bottom-0 right-0"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.03), transparent 70%)" }} 
        />
      </div>

      {/* Sticky Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="sticky top-0 z-50 px-5 py-6 bg-gradient-to-b from-[#020617] to-transparent backdrop-blur-sm"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-teal-900/15 border border-teal-500/20 shadow-[0_0_20px_rgba(20,184,166,0.1)]">
              <Map className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-md">خريطة الأثر</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">مسار رحلتك الحي</p>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-[10px] font-bold text-slate-400 flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-amber-400" />
            مستوى الوعي: {currentProgressLevel}
          </div>
        </div>
      </motion.div>

      {/* Living Trail Canvas */}
      <div className="relative w-full max-w-lg mx-auto mt-10" style={{ height: totalHeight }} ref={containerRef}>
        
        {/* SVG Trail */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none" 
          preserveAspectRatio="none"
          viewBox={`0 0 100 ${totalHeight}`}
        >
          {/* Base dimmed path */}
          <path
            d={svgPath}
            fill="none"
            stroke="rgba(51, 65, 85, 0.2)"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          
          {/* Glowing unlocked path */}
          <motion.path
            d={svgPath}
            fill="none"
            stroke="url(#glow-gradient)"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: (currentProgressLevel / 100) }}
            transition={{ duration: 2, ease: "easeOut" }}
            style={{ filter: "drop-shadow(0 0 4px rgba(20, 184, 166, 0.4))" }}
          />

          <defs>
            <linearGradient id="glow-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Nodes */}
        {nodes.map((node) => {
          const isUnlocked = node.unlocked;
          const isCurrent = node.isCurrent;
          
          return (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-10%" }}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 group"
              style={{ left: `${node.x}%`, top: node.y }}
            >
              <button
                onClick={() => handleNavigate(node.screen, isUnlocked)}
                disabled={!isUnlocked}
                className={`
                  relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500
                  ${isUnlocked 
                    ? 'cursor-pointer hover:scale-110 active:scale-95' 
                    : 'cursor-not-allowed grayscale opacity-40 hover:opacity-60'}
                `}
                style={{
                  background: isUnlocked ? `${node.color}15` : "rgba(30, 41, 59, 0.5)",
                  border: `1px solid ${isUnlocked ? `${node.color}40` : "rgba(51, 65, 85, 0.5)"}`,
                  boxShadow: isCurrent 
                    ? `0 0 30px ${node.color}30, inset 0 0 10px ${node.color}20` 
                    : isUnlocked ? `0 0 15px ${node.color}10` : 'none'
                }}
              >
                {/* Current node pulsing effect */}
                {isCurrent && (
                  <motion.div 
                    className="absolute inset-0 rounded-2xl border"
                    style={{ borderColor: node.color }}
                    animate={{ scale: [1, 1.4], opacity: [0.8, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}

                {isUnlocked ? (
                  <span className="text-2xl drop-shadow-md relative z-10">{node.emoji}</span>
                ) : (
                  <Lock className="w-5 h-5 text-slate-500 relative z-10" />
                )}

                {/* Node completion checkmark (for past nodes) */}
                {isUnlocked && !isCurrent && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#020617] rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                )}
              </button>

              {/* Node Label */}
              <div 
                className={`text-center transition-all duration-500 ${
                  isUnlocked ? "opacity-100 translate-y-0" : "opacity-30 translate-y-1"
                }`}
              >
                <span 
                  className="block text-[13px] font-black tracking-tight" 
                  style={{ color: isUnlocked ? "#f8fafc" : "#64748b" }}
                >
                  {node.name}
                </span>
                <span className="block text-[9px] text-slate-500 font-bold max-w-[100px]">
                  {isUnlocked ? node.description : "منطقة ضبابية"}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer Instructions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm"
      >
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 text-center shadow-2xl">
          <p className="text-[10px] text-slate-400 leading-relaxed font-bold">
            هذه خريطة أثرك الحي. كلما تقدمت في رحلتك، انقشع الضباب عن مسارات جديدة.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
