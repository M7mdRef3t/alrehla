import type { FC } from "react";
import { useMemo, useRef, useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { useMapState } from "../state/mapState";
import { mapCopy } from "../copy/map";
import { landingCopy } from "../copy/landing";

/* ════════════════════════════════════════════════
   DASHBOARD SCREEN — المساحة الخاصة
   ════════════════════════════════════════════════ */

interface DashboardScreenProps {
  firstName: string | null;
  onNavigateToMap: () => void;
  onOpenAchievements: () => void;
}

/* ── Mini node for the live map card ── */
interface MiniNode {
  id: string;
  label: string;
  ring: "green" | "yellow" | "red" | "grey";
  x: number;
  y: number;
  isNodeArchived?: boolean;
}

const RING_COLOR: Record<string, string> = {
  green: "rgba(52,211,153,0.85)",
  yellow: "rgba(251,191,36,0.85)",
  red: "rgba(248,113,113,0.85)",
  grey: "rgba(148,163,184,0.5)",
};

/* ── Floating node in mini-map ── */
const FloatingNode: FC<{
  node: MiniNode;
  index: number;
  mouseX: { get: () => number };
  mouseY: { get: () => number };
}> = ({ node, index, mouseX, mouseY }) => {
  const depth = 0.04 + (index % 3) * 0.015;
  const px = useSpring(useMotionValue(node.x), { stiffness: 60, damping: 20 });
  const py = useSpring(useMotionValue(node.y), { stiffness: 60, damping: 20 });

  useEffect(() => {
    const unsub1 = mouseX.get !== undefined
      ? (() => {
          // We'll animate via RAF
          return () => {};
        })()
      : () => {};
    return unsub1;
  }, [mouseX, mouseY, depth, px, py, node.x, node.y]);

  const size = node.ring === "green" ? 9 : node.ring === "yellow" ? 8 : 7;

  return (
    <motion.div
      className="absolute flex items-center justify-center"
      style={{
        left: `${node.x}%`,
        top: `${node.y}%`,
        transform: "translate(-50%,-50%)",
      }}
      animate={{
        y: [0, -4, 0, 3, 0],
        x: [0, 2, 0, -2, 0],
      }}
      transition={{
        duration: 4 + index * 0.7,
        repeat: Infinity,
        ease: "easeInOut",
        delay: index * 0.3,
      }}
    >
      {/* Glow ring */}
      <div
        className="absolute rounded-full"
        style={{
          width: size * 2.8,
          height: size * 2.8,
          background: RING_COLOR[node.ring],
          opacity: 0.15,
          filter: "blur(4px)",
        }}
      />
      {/* Node dot */}
      <div
        className="rounded-full shrink-0"
        style={{
          width: size,
          height: size,
          background: RING_COLOR[node.ring],
          boxShadow: `0 0 ${size * 1.5}px ${RING_COLOR[node.ring]}`,
        }}
      />
      {/* Label */}
      <span
        className="absolute top-full mt-1 text-[8px] font-semibold whitespace-nowrap"
        style={{ color: "rgba(255,255,255,0.55)" }}
      >
        {node.label}
      </span>
    </motion.div>
  );
};

/* ── Main Dashboard ── */
export const DashboardScreen: FC<DashboardScreenProps> = ({
  firstName,
  onNavigateToMap,
  onOpenAchievements,
}) => {
  const nodes = useMapState((s) => s.nodes);
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseXRaw = useMotionValue(0);
  const mouseYRaw = useMotionValue(0);

  const activeNodes = useMemo(() => nodes.filter((n) => !n.isNodeArchived), [nodes]);
  const archivedNodes = useMemo(() => nodes.filter((n) => n.isNodeArchived), [nodes]);
  const greenCount = activeNodes.filter((n) => n.ring === "green").length;
  const yellowCount = activeNodes.filter((n) => n.ring === "yellow").length;
  const redCount = activeNodes.filter((n) => n.ring === "red").length;

  /* Spread nodes across a virtual 100×100 grid */
  const miniNodes: MiniNode[] = useMemo(() => {
    const positions = [
      [50, 38], [28, 55], [72, 52], [38, 72], [64, 70],
      [20, 35], [78, 38], [55, 80], [30, 80], [80, 68],
    ];
    return activeNodes.slice(0, 10).map((n, i) => ({
      id: n.id,
      label: n.label,
      ring: n.ring as "green" | "yellow" | "red" | "grey",
      x: positions[i]?.[0] ?? 50 + (i * 13) % 40,
      y: positions[i]?.[1] ?? 50 + (i * 7) % 35,
      isNodeArchived: n.isNodeArchived,
    }));
  }, [activeNodes]);

  /* Parallax on pointer move */
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    mouseXRaw.set((e.clientX - cx) / rect.width);
    mouseYRaw.set((e.clientY - cy) / rect.height);
  };

  /* Daily question */
  const [dailyQ] = useState(() => {
    const qs = mapCopy.dashboardDailyQuestions;
    return qs[new Date().getDay() % qs.length];
  });

  /* Summary sentence */
  const summaryText = useMemo(() => {
    const supporters = greenCount;
    const needsWork = yellowCount + redCount;
    const parts: string[] = [];
    if (supporters > 0) parts.push(`${supporters} ${supporters === 1 ? "شخص بيسندك" : "أشخاص بيسندوك"}`);
    if (needsWork > 0) parts.push(`${needsWork} ${needsWork === 1 ? "محطة محتاجة مجهود" : "محطات محتاجة مجهود"}`);
    if (parts.length === 0) return "دوايرك في انتظارك.";
    return `دوايرك فيها ${parts.join("، ")}.`;
  }, [greenCount, yellowCount, redCount]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const timeGreet = hour < 12 ? "صباح النور" : hour < 17 ? "مرحباً" : "مساء الخير";
    return firstName ? `${timeGreet} يا ${firstName}` : timeGreet;
  }, [firstName]);

  return (
    <motion.div
      className="w-full min-h-[100dvh] flex flex-col px-4 py-6 gap-5 overflow-y-auto"
      style={{ maxWidth: 480, margin: "0 auto" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      dir="rtl"
    >
      {/* ── Greeting header ── */}
      <motion.div
        className="flex items-center justify-between pt-2"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <div>
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            {new Date().toLocaleDateString("ar-EG", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-lg font-bold leading-snug" style={{ color: "var(--text-primary)" }}>
            {greeting}، إنت النهاردة في محطة هادية..
          </h1>
          <p className="text-sm" style={{ color: "rgba(45,212,191,0.75)" }}>خذ نَفَس.</p>
        </div>
        {/* Avatar circle */}
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-base font-bold"
          style={{
            background: "linear-gradient(135deg, rgba(45,212,191,0.2), rgba(139,92,246,0.2))",
            border: "1.5px solid rgba(45,212,191,0.35)",
            color: "var(--soft-teal)",
          }}
        >
          {firstName?.[0]?.toUpperCase() ?? "؟"}
        </div>
      </motion.div>

      {/* ── Live Map Card ── */}
      <motion.div
        ref={cardRef}
        className="relative rounded-2xl overflow-hidden cursor-pointer"
        style={{
          background: "linear-gradient(145deg, rgba(15,23,42,0.9), rgba(20,30,55,0.95))",
          border: "1px solid rgba(45,212,191,0.2)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)",
          minHeight: 200,
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.55 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { mouseXRaw.set(0); mouseYRaw.set(0); }}
        onClick={onNavigateToMap}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Mini-map area */}
        <div className="relative w-full" style={{ height: 180 }}>
          {/* Center "me" dot */}
          <div
            className="absolute"
            style={{ left: "50%", top: "42%", transform: "translate(-50%,-50%)" }}
          >
            <motion.div
              className="rounded-full"
              style={{
                width: 14, height: 14,
                background: "rgba(45,212,191,0.9)",
                boxShadow: "0 0 18px rgba(45,212,191,0.6)",
              }}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          {/* Concentric rings (decorative) */}
          {[40, 70, 100].map((r, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: r * 2,
                height: r * 2,
                left: "50%",
                top: "42%",
                transform: "translate(-50%, -50%)",
                border: `1px solid rgba(45,212,191,${0.08 - i * 0.02})`,
              }}
            />
          ))}

          {/* Floating nodes */}
          {miniNodes.map((node, i) => (
            <FloatingNode
              key={node.id}
              node={node}
              index={i}
              mouseX={{ get: () => mouseXRaw.get() }}
              mouseY={{ get: () => mouseYRaw.get() }}
            />
          ))}

          {activeNodes.length === 0 && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}
            >
              ابدأ بأول شخص في دوايرك
            </div>
          )}
        </div>

        {/* Card footer */}
        <div
          className="px-4 pb-4 pt-3 flex items-end justify-between"
          style={{ borderTop: "1px solid rgba(45,212,191,0.1)" }}
        >
          <div>
            <p className="text-xs font-medium mb-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
              {mapCopy.title}
            </p>
            <p className="text-sm font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.85)" }}>
              {summaryText}
            </p>
          </div>

          {/* Launch button */}
          <motion.div
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold shrink-0"
            style={{
              background: "rgba(45,212,191,0.15)",
              border: "1px solid rgba(45,212,191,0.35)",
              color: "var(--soft-teal)",
            }}
            whileHover={{ background: "rgba(45,212,191,0.25)" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            أنطلق للدواير
          </motion.div>
        </div>
      </motion.div>

      {/* ── Stats row ── */}
      {activeNodes.length > 0 && (
        <motion.div
          className="flex gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          {[
            { count: greenCount, label: "قريب", color: "#34d399", bg: "rgba(52,211,153,0.1)" },
            { count: yellowCount, label: "متذبذب", color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
            { count: redCount, label: "بعيد", color: "#f87171", bg: "rgba(248,113,113,0.1)" },
          ].map(({ count, label, color, bg }) => (
            <div
              key={label}
              className="flex-1 rounded-xl p-3 text-center"
              style={{ background: bg, border: `1px solid ${color}30` }}
            >
              <p className="text-xl font-bold" style={{ color }}>{count}</p>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{label}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* ── Archived timeline — "مساحة حررتها مؤخراً" ── */}
      <AnimatePresence>
        {archivedNodes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div
              className="rounded-2xl p-4"
              style={{
                background: "rgba(248,250,252,0.04)",
                border: "1px solid rgba(148,163,184,0.12)",
              }}
            >
              <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-muted)" }}>
                مساحة حررتها مؤخراً
              </p>
              <div className="flex gap-3">
                {archivedNodes.slice(0, 3).map((n, i) => (
                  <motion.div
                    key={n.id}
                    className="flex flex-col items-center gap-1"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        background: "rgba(148,163,184,0.1)",
                        border: "1px solid rgba(148,163,184,0.2)",
                        color: "rgba(148,163,184,0.6)",
                        filter: "grayscale(80%)",
                      }}
                    >
                      {n.label[0]}
                    </div>
                    <span className="text-[9px] font-medium" style={{ color: "rgba(148,163,184,0.5)" }}>
                      {n.label}
                    </span>
                  </motion.div>
                ))}
                {archivedNodes.length > 3 && (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ color: "rgba(148,163,184,0.4)", border: "1px dashed rgba(148,163,184,0.2)" }}
                  >
                    +{archivedNodes.length - 3}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Daily question card ── */}
      <motion.div
        className="rounded-2xl p-4"
        style={{
          background: "linear-gradient(135deg, rgba(45,212,191,0.05), rgba(139,92,246,0.05))",
          border: "1px solid rgba(45,212,191,0.15)",
        }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.45 }}
      >
        <p className="text-[10px] font-semibold mb-2" style={{ color: "rgba(45,212,191,0.6)" }}>
          سؤال اليوم
        </p>
        <p className="text-sm font-medium leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {dailyQ}
        </p>
      </motion.div>

      {/* ── Journey CTA ── */}
      <motion.button
        type="button"
        onClick={onOpenAchievements}
        className="w-full rounded-2xl py-3 text-sm font-semibold text-center"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "var(--text-muted)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        whileHover={{ background: "rgba(255,255,255,0.07)" }}
        whileTap={{ scale: 0.98 }}
      >
        شوف ملخص رحلتك
      </motion.button>

      {/* ── Footer slogan ── */}
      <motion.p
        className="text-center text-xs italic leading-relaxed pb-4"
        style={{ color: "rgba(45,212,191,0.4)", fontFamily: "'Amiri', 'Scheherazade New', serif" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65 }}
      >
        {landingCopy.slogan}
      </motion.p>
    </motion.div>
  );
};
