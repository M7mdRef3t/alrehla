import type { FC } from "react";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useSpring } from "framer-motion";
import { ArrowLeft, Zap, Shield, Heart } from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────────────── */
interface HeroSectionProps {
  onStartJourney: () => void;
  mirrorName: string;
  setMirrorName: (name: string) => void;
  pulseCount: number;
  trustPoints: string[];
  ctaJourney: string;
  secondaryCta: string;
}

/* ─── Constants ──────────────────────────────────────────────────────────────── */
const ROTATING_WORDS = [
  "حدودك مُستباحة",
  "شايل شيلة مش شيلتك",
  "تايه في دواير غيرك",
  "نبضك مربوط بغيرك",
  "سايب بابك موارب",
  "بتدور في ساقية مش بتاعتك",
  "مراية لزعل اللي حواليك",
  "خايف تقول لأ"
];

/* ─── Styles ─────────────────────────────────────────────────────────────────── */
const HERO_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800;900&display=swap');

  .hero-root {
    --void: var(--ds-color-space-void);
    --teal: var(--ds-color-primary);
    --teal-bright: var(--ds-color-brand-teal-400);
    --gold: var(--ds-color-brand-amber-500);
    --crimson: #ef4444; /* Standard alert color */
    --text-hero: var(--ds-theme-text-primary);
    --text-sub: var(--ds-theme-text-secondary);
    --glass: var(--ds-color-glass-default);
    --glass-border: var(--ds-color-border-default);
  }

  /* ── Ambient Canvas ── */
  .hero-canvas {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .ambient-orb {
    position: absolute;
    border-radius: 50%;
    will-change: transform;
  }

  .ambient-orb-1 {
    width: 700px; height: 700px;
    background: radial-gradient(circle, rgba(20,184,166,0.11) 0%, transparent 70%);
    top: -15%; right: -8%;
    animation: orb-drift1 38s infinite ease-in-out alternate;
  }

  .ambient-orb-2 {
    width: 580px; height: 580px;
    background: radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 70%);
    bottom: -20%; left: -10%;
    animation: orb-drift2 52s infinite ease-in-out alternate;
  }

  .ambient-orb-3 {
    width: 420px; height: 420px;
    background: radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%);
    top: 35%; left: 30%;
    animation: orb-drift3 44s infinite ease-in-out alternate;
  }

  @keyframes orb-drift1 {
    0%   { transform: translate(0%,   0%)   scale(1);    }
    50%  { transform: translate(-6%,  8%)   scale(1.12); }
    100% { transform: translate(4%,  -5%)   scale(0.92); }
  }
  @keyframes orb-drift2 {
    0%   { transform: translate(0%,   0%)   scale(1);    }
    50%  { transform: translate(8%,  -10%)  scale(1.08); }
    100% { transform: translate(-5%,  6%)   scale(0.95); }
  }
  @keyframes orb-drift3 {
    0%   { transform: translate(0%,  0%)   scale(1);    }
    100% { transform: translate(5%, -8%)   scale(1.15); }
  }

  /* ── Grid ── */
  .hero-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px);
    background-size: 64px 64px;
    mask-image: radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 100%);
  }

  /* ── Noise grain ── */
  .hero-grain {
    position: absolute;
    inset: 0;
    opacity: 0.032;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)'/%3E%3C/svg%3E");
    pointer-events: none;
  }

  /* ── Badge eyebrow ── */
  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 7px 18px;
    border-radius: 100px;
    border: 1px solid var(--ds-color-border-default);
    background: var(--ds-color-glass-default);
    backdrop-filter: blur(12px);
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.3em;
    color: var(--ds-theme-text-muted);
    text-transform: uppercase;
  }

  /* ── Headline ── */
  .headline-static {
    font-family: 'Tajawal', sans-serif;
    font-weight: 900;
    line-height: 1.1;
    letter-spacing: -0.02em;
    color: var(--text-hero);
    text-shadow: 0 0 80px rgba(45, 212, 191, 0.08);
    text-align: right;
  }

  .headline-accent {
    background: linear-gradient(135deg, #2dd4bf 0%, #14b8a6 40%, #5eead4 75%, #a7f3d0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 0 24px rgba(45,212,191,0.28));
    display: block;
    width: 100%;
  }

  /* ── Rotating word ── */
  .rotating-word-wrapper {
    position: relative;
    display: block;
    width: 100%;
    min-height: 1.2em;
    padding: 0.25em 0;
    overflow: visible;
    text-align: right;
  }

  /* ── Body copy ── */
  .hero-body {
    font-size: 1rem;
    line-height: 1.9;
    color: var(--text-sub);
    max-width: 46ch;
  }

  /* ── Primary CTA ── */
  .cta-primary {
    position: relative;
    overflow: hidden;
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 18px 32px;
    border-radius: 20px;
    background: rgba(255,255,255,0.03);
    backdrop-filter: blur(12px);
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 900;
    color: #fff;
    cursor: pointer;
    border: 1px solid rgba(20,184,166,0.3);
    box-shadow: 0 10px 40px rgba(0,0,0,0.5), inset 0 1px rgba(255,255,255,0.1);
    transition: all 0.4s ease;
    white-space: nowrap;
  }
  .cta-primary:hover {
    box-shadow: 0 18px 50px rgba(20,184,166,0.15), inset 0 1px rgba(255,255,255,0.2);
    border-color: rgba(20,184,166,0.6);
    background: rgba(255,255,255,0.06);
    transform: translateY(-3px) scale(1.02);
  }

  /* ── Secondary CTA ── */
  .cta-secondary {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 16px 26px;
    border-radius: 18px;
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.1);
    font-size: 0.9rem;
    font-weight: 700;
    color: #a8bfcc;
    cursor: pointer;
    transition: background 0.3s, border-color 0.3s, color 0.3s;
    white-space: nowrap;
  }
  .cta-secondary:hover {
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.2);
    color: #e8f0f5;
  }

  /* ── Trust pills ── */
  .trust-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border-radius: 100px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    backdrop-filter: blur(12px);
    font-size: 11px;
    font-weight: 700;
    color: #8faab8;
  }

  /* ── Right panel: The Sovereign Map ── */
  .sovereign-map {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    max-width: 520px;
  }

  /* ── Pulse ring ── */
  @keyframes pulse-ring {
    0%   { transform: scale(1);    opacity: 0.6; }
    100% { transform: scale(1.65); opacity: 0;   }
  }

  /* ── Metric Card ── */
  .metric-card {
    position: absolute;
    backdrop-filter: blur(20px) saturate(160%);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 18px;
    padding: 16px 20px;
    background: rgba(8, 12, 22, 0.7);
    box-shadow: 0 20px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07);
    min-width: 130px;
    animation: card-float 6s ease-in-out infinite alternate;
  }
  @keyframes card-float {
    0%   { transform: translateY(0px);  }
    100% { transform: translateY(-8px); }
  }

  /* ── Warp transition ── */
  .warp-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: #020408;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* ── Starfield dots ── */
  .starfield-dot {
    position: absolute;
    border-radius: 50%;
    background: white;
    pointer-events: none;
  }

  /* ── Scan line ── */
  @keyframes scan {
    0%   { top: -4%; }
    100% { top: 104%; }
  }
  .hero-scan-line {
    position: absolute;
    left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(45,212,191,0.35), transparent);
    animation: scan 8s linear infinite;
    pointer-events: none;
  }

  /* ── Layout ── */
  .hero-content-wrapper {
    position: relative;
    z-index: 2;
    width: 100%;
    max-width: 1380px;
    margin: 0 auto;
    padding: 7rem 2rem 6rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4rem;
  }

  .map-area {
    flex: 0 0 auto;
    width: min(46vw, 520px);
    position: relative;
    padding-bottom: 56px;
  }

  /* ── Mobile Layout ── */
  @media (max-width: 1023px) {
    .hero-content-wrapper {
      flex-direction: column;
      gap: 3rem;
      padding: 6rem 1.5rem 4rem;
    }
    
    .map-area {
      width: min(90vw, 400px);
      margin: 0 auto;
      padding-bottom: 24px;
    }
  }
`;

/* ─── Helpers ────────────────────────────────────────────────────────────────── */
const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 32, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

/* ─── Rotating Headline Word ─────────────────────────────────────────────────── */
const RotatingWord: FC = () => {
  const [index, setIndex] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setShow(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % ROTATING_WORDS.length);
        setShow(true);
      }, 450);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="rotating-word-wrapper">
      <span className="invisible select-none block" aria-hidden>
        {ROTATING_WORDS[5]}
      </span>
      <AnimatePresence mode="wait">
        {show && (
          <motion.span
            key={index}
            initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -16, filter: "blur(6px)" }}
            transition={{ duration: 0.45, ease }}
            className="absolute inset-0 flex items-center headline-accent"
          >
            {ROTATING_WORDS[index]}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
};

/* ─── Sovereign Map (Right Panel) ───────────────────────────────────────────── */
const SovereignMap: FC<{ reduceMotion: boolean | null }> = ({ reduceMotion }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 40, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 40, damping: 20 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (reduceMotion) return;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    mouseX.set((e.clientX - cx) / 90);
    mouseY.set((e.clientY - cy) / 90);
  }, [reduceMotion, mouseX, mouseY]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  const rings = [
    { r: 68,  stroke: "rgba(45,212,191,0.3)",  dash: "none", dur: 22 },
    { r: 110, stroke: "rgba(245,158,11,0.2)",  dash: "4 14", dur: 38 },
    { r: 152, stroke: "rgba(239,68,68,0.15)",  dash: "2 22", dur: 60 },
    { r: 194, stroke: "rgba(99,102,241,0.1)",  dash: "1 30", dur: 90 },
  ];

  const nodes = [
    { cx: 190, cy: 190 - 68,  r: 13, color: "#2dd4bf", label: "علاقة بميزانها",  w: 1.2 },
    { cx: 190 + 62, cy: 190 - 34, r: 11, color: "#14b8a6", label: "دعم سيادي",    w: 0.8 },
    { cx: 190 + 110, cy: 190 + 55, r: 14, color: "#f59e0b", label: "نبض متذبذب",  w: 1.5 },
    { cx: 190 - 60, cy: 190 + 104, r: 10, color: "#f59e0b", label: "تشويش روح",   w: 0.9 },
    { cx: 190 - 130, cy: 190 - 65, r: 16, color: "#2dd4bf", label: "احتواء حقيقي",w: 1.1 },
    { cx: 190 - 28, cy: 190 - 148, r: 12, color: "#ef4444", label: "نزيف طاقة",   w: 2.0 },
    { cx: 190 + 118, cy: 190 - 100, r: 11, color: "#ef4444", label: "حدود مهدورة", w: 1.7 },
  ];

  const [hovered, setHovered] = useState<number | null>(null);
  const toSafeRadius = (value: unknown, fallback: number) =>
    typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;

  return (
    <motion.div
      className="sovereign-map"
      style={{ rotateX: springY, rotateY: springX, perspective: 1000 }}
    >
      {/* Atmospheric glow */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: "-18%",
          background: "radial-gradient(circle, rgba(20,184,166,0.14) 0%, rgba(99,102,241,0.06) 40%, transparent 75%)",
          filter: "blur(50px)",
        }}
      />

      {/* Scan line */}
      <div className="hero-scan-line" aria-hidden />

      {/* SVG orbit */}
      <svg
        viewBox="0 0 380 380"
        fill="none"
        style={{ width: "100%", height: "100%", overflow: "visible" }}
      >
        {/* Connection lines from center */}
        {nodes.map((n, i) => (
          <motion.line
            key={`line-${i}`}
            x1="190" y1="190" x2={n.cx} y2={n.cy}
            stroke={n.color}
            strokeWidth="0.5"
            opacity={hovered === i ? 0.5 : 0.12}
            style={{ transition: "opacity 0.3s" }}
          />
        ))}

        {/* Rings */}
        {rings.map((ring, i) => (
          (() => {
            const safeRingRadius = toSafeRadius(ring.r, 1);
            return (
          <motion.circle
            key={i}
            cx="190" cy="190" r={safeRingRadius}
            stroke={ring.stroke}
            strokeWidth="1"
            fill="none"
            strokeDasharray={ring.dash === "none" ? undefined : ring.dash}
            animate={reduceMotion ? {} : { rotate: i % 2 === 0 ? 360 : -360 }}
            transition={{ duration: ring.dur, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "190px 190px" }}
          />
            );
          })()
        ))}

        {/* Nodes */}
        {nodes.map((node, i) => (
          (() => {
            const safeNodeRadius = toSafeRadius(node.r, 1);
            return (
          <motion.g
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            animate={reduceMotion ? {} : {
              x: springX.get() * node.w,
              y: springY.get() * node.w,
              opacity: hovered === i ? 1 : [0.7, 1, 0.7],
            }}
            transition={{
              opacity: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 },
            }}
            style={{ transformOrigin: `${node.cx}px ${node.cy}px`, cursor: "pointer" }}
          >
            {/* Pulse ring */}
            {hovered === i && (
              <circle
                cx={node.cx} cy={node.cy} r={safeNodeRadius + 6}
                fill="none" stroke={node.color} strokeWidth="1.5"
                opacity={0.4}
                style={{
                  animation: "pulse-ring 1.4s ease-out infinite",
                  transformOrigin: `${node.cx}px ${node.cy}px`
                }}
              />
            )}
            {/* Halo */}
            <circle cx={node.cx} cy={node.cy} r={safeNodeRadius + 8} fill={node.color} opacity={0.07} />
            {/* Core */}
            <circle
              cx={node.cx} cy={node.cy} r={safeNodeRadius}
              fill={node.color}
              style={{ filter: `drop-shadow(0 0 ${hovered === i ? 28 : 10}px ${node.color}bb)` }}
            />
            {/* Inner dot */}
            <circle cx={node.cx} cy={node.cy} r={safeNodeRadius * 0.35} fill="rgba(0,0,0,0.55)" />

            {/* Tooltip */}
            <AnimatePresence>
              {hovered === i && (
                <motion.foreignObject
                  x={node.cx > 190 ? node.cx - 160 : node.cx + 18}
                  y={node.cy - 16}
                  width="150" height="36"
                  initial={{ opacity: 0, filter: "blur(4px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(4px)" }}
                  transition={{ duration: 0.25 }}
                >
                  <div style={{
                    background: "rgba(4,8,18,0.9)",
                    border: `1px solid ${node.color}44`,
                    borderRadius: 12,
                    padding: "7px 14px",
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#fff",
                    whiteSpace: "nowrap",
                    backdropFilter: "blur(12px)",
                    boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 20px ${node.color}22`,
                    fontFamily: "Tajawal",
                  }}>
                    {node.label}
                  </div>
                </motion.foreignObject>
              )}
            </AnimatePresence>
          </motion.g>
            );
          })()
        ))}

        {/* Center core */}
        <motion.g
          animate={reduceMotion ? {} : { scale: [1, 1.18, 1], opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "190px 190px" }}
        >
          <circle cx="190" cy="190" r="22" fill="rgba(45,212,191,0.12)" />
          <circle cx="190" cy="190" r="14" fill="#14b8a6" style={{ filter: "drop-shadow(0 0 32px #14b8a6)" }} />
          <circle cx="190" cy="190" r="6" fill="#fff" opacity={0.85} />
        </motion.g>
      </svg>

      {/* Floating metric cards */}
      <div
        className="metric-card"
        style={{ top: "8%", right: "-8%", animationDelay: "0s" }}
      >
        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.2em", color: "#2dd4bf", marginBottom: 4, textTransform: "uppercase" }}>
          صحتك الداخلية
        </p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: 26, fontWeight: 900, color: "#fff", fontFamily: "Tajawal" }}>٧٨</span>
          <span style={{ fontSize: 11, color: "#6b8a9e", fontWeight: 700 }}>/ ١٠٠</span>
        </div>
        <div style={{
          marginTop: 8, height: 3, borderRadius: 2,
          background: "rgba(255,255,255,0.08)"
        }}>
          <motion.div
            style={{ height: "100%", borderRadius: 2, background: "linear-gradient(90deg, #14b8a6, #2dd4bf)" }}
            initial={{ width: "0%" }}
            animate={{ width: "78%" }}
            transition={{ duration: 1.2, ease, delay: 0.6 }}
          />
        </div>
      </div>

      <div
        className="metric-card"
        style={{ bottom: "12%", left: "-10%", animationDelay: "2s" }}
      >
        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.2em", color: "#f87171", marginBottom: 4, textTransform: "uppercase" }}>
          نزيف طاقة
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: "#fff", fontFamily: "Tajawal" }}>٣</span>
          <span style={{ fontSize: 11, color: "#6b8a9e", fontWeight: 700 }}>مصادر الاستنزاف</span>
        </div>
        <div style={{ marginTop: 8, display: "flex", gap: 4 }}>
          {[1, 2, 3].map(dot => (
            <motion.div
              key={dot}
              style={{ width: 8, height: 8, borderRadius: 2, background: "#ef4444" }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, delay: dot * 0.3 }}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        position: "absolute",
        bottom: "-40px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: 20,
      }}>
        {[
          { color: "#14b8a6", label: "توازن ذاتي" },
          { color: "#f59e0b", label: "تشتت" },
          { color: "#ef4444", label: "استنزاف" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}` }} />
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", color: "#7a95a8", textTransform: "uppercase", fontFamily: "Tajawal" }}>{label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

/* ─── Live Pulse Counter ─────────────────────────────────────────────────────── */
const PulseBadge: FC<{ count: number }> = ({ count }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.85 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 1.4, duration: 0.6, ease }}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 16px",
      borderRadius: 100,
      border: "1px solid rgba(239,68,68,0.2)",
      background: "rgba(239,68,68,0.06)",
      backdropFilter: "blur(12px)",
    }}
  >
    <motion.span
      style={{
        width: 7, height: 7, borderRadius: "50%",
        background: "#ef4444",
        boxShadow: "0 0 12px #ef4444",
        display: "inline-block",
      }}
      animate={{ opacity: [1, 0.3, 1] }}
      transition={{ duration: 1.6, repeat: Infinity }}
    />
    <span style={{ fontSize: 11, fontWeight: 800, color: "#a8bfcc", letterSpacing: "0.18em", textTransform: "uppercase" }}>
      {count.toLocaleString("ar-EG")} يستعيدون نبضهم الآن
    </span>
  </motion.div>
);

/* ─── Main Hero Component ────────────────────────────────────────────────────── */
export const HeroSection: FC<HeroSectionProps> = ({
  onStartJourney,
  mirrorName,
  setMirrorName,
  pulseCount,
  trustPoints,
  ctaJourney,
  secondaryCta,
}) => {
  const reduceMotion = useReducedMotion();
  const [isWarping, setIsWarping] = useState(false);

  const handleStart = useCallback(() => {
    setIsWarping(true);
    setTimeout(onStartJourney, 900);
  }, [onStartJourney]);

  return (
    <>
      <style>{HERO_STYLES}</style>

      {/* ── Section wrapper ── */}
      <section
        className="hero-root"
        dir="rtl"
        style={{
          position: "relative",
          minHeight: "100svh",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          background: "var(--void)",
        }}
      >
        {/* ── Ambient canvas ── */}
        <div className="hero-canvas" aria-hidden>
          <div className="ambient-orb ambient-orb-1" />
          <div className="ambient-orb ambient-orb-2" />
          <div className="ambient-orb ambient-orb-3" />
          <div className="hero-grid" />
          <div className="hero-grain" />
          {/* Radial vignette */}
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse 90% 80% at 50% 50%, transparent 40%, rgba(2,4,8,0.7) 100%)",
          }} />
        </div>

        {/* ── Content container ── */}
        <div className="hero-content-wrapper">

          {/* ════ LEFT COLUMN: TEXT CONTENT ════ */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            style={{ flex: "1 1 0", maxWidth: 600, display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
            {/* Eyebrow badges row */}
            <motion.div variants={fadeUp} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <span className="hero-badge">
                <span style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: "var(--ds-color-primary)",
                  boxShadow: "0 0 14px var(--ds-color-primary-glow)",
                  flexShrink: 0,
                }} />
                DAWAYIR — الرحلة
              </span>
              <PulseBadge count={pulseCount} />
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="headline-static"
              style={{
                fontSize: "clamp(2.4rem, 5.5vw, 4.4rem)",
                display: "block",
                textAlign: "right",
              }}
            >
              <span style={{ display: "block", marginBottom: "0.1em" }}>أنت لست مرهقاً</span>
              <span style={{ display: "block", color: "#8faab8", fontSize: "0.78em", fontWeight: 600, marginBottom: "0.1em" }}>
                أنت فقط
              </span>
              <RotatingWord />
            </motion.h1>

            {/* Divider line */}
            <motion.div
              variants={fadeUp}
              style={{
                height: 1,
                background: "linear-gradient(90deg, rgba(20,184,166,0.5), rgba(245,158,11,0.3), transparent)",
                borderRadius: 1,
              }}
            />

            {/* Body text */}
            <motion.p variants={fadeUp} className="hero-body" style={{ textAlign: "right" }}>
              بدون جدار تسجيل مُرهق ولا استبيانات معقدة.
              مساحتك الخاصة للوضوح الفوري.. نترجم فوضى أفكارك
              لإحداثيات بصرية تساعدك على رصد استنزافك وتحديد خطوتك القادمة.
            </motion.p>

            {/* Name input (optional personalization) */}
            <motion.div variants={fadeUp} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.03)",
                backdropFilter: "blur(12px)",
                overflow: "hidden",
                maxWidth: 380,
              }}>
                <input
                  type="text"
                  id="mirror-name"
                  name="mirrorName"
                  placeholder="اسمك (اختياري)"
                  value={mirrorName}
                  onChange={e => setMirrorName(e.target.value)}
                  maxLength={24}
                  dir="rtl"
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    padding: "13px 16px",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#d0e4f0",
                    fontFamily: "Tajawal",
                    textAlign: "right",
                  }}
                />
                {mirrorName && (
                  <span style={{
                    padding: "0 14px",
                    fontSize: 12,
                    color: "#14b8a6",
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                  }}>
                    أهلاً {mirrorName} ✦
                  </span>
                )}
              </div>
              {!mirrorName && (
                <p style={{ fontSize: 10.5, color: "#627a8e", fontWeight: 600, paddingRight: 4 }}>
                  اضف اسمك عشان تجربتك تبقى شخصية
                </p>
              )}
            </motion.div>

            {/* CTAs */}
            <motion.div variants={fadeUp} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <motion.button
                type="button"
                className="cta-primary"
                onClick={handleStart}
                whileHover={{ scale: 1.04, y: -3 }}
                whileTap={{ scale: 0.97 }}
                id="hero-cta-start"
              >
                <Zap style={{ width: 18, height: 18, fill: "white" }} />
                <span>{ctaJourney}</span>
                <ArrowLeft style={{ width: 17, height: 17 }} />
              </motion.button>

              <motion.button
                type="button"
                className="cta-secondary"
                onClick={() => document.getElementById("simulation")?.scrollIntoView({ behavior: "smooth" })}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                id="hero-cta-explore"
              >
                {secondaryCta}
              </motion.button>
            </motion.div>

            {/* Trust pills */}
            <motion.div variants={fadeUp} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[
                { icon: <Zap style={{ width: 13, height: 13, color: "#14b8a6" }} />, label: trustPoints[0] },
                { icon: <Heart style={{ width: 13, height: 13, color: "#14b8a6" }} />, label: trustPoints[1] },
                { icon: <Shield style={{ width: 13, height: 13, color: "#14b8a6" }} />, label: trustPoints[2] },
              ].map(({ icon, label }) => (
                <span key={label} className="trust-pill">
                  {icon}
                  <span>{label}</span>
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* ════ RIGHT COLUMN: SOVEREIGN MAP ════ */}
          <motion.div
            className="map-area"
            initial={{ opacity: 0, scale: 0.88, filter: "blur(12px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.1, ease, delay: 0.35 }}
          >
            <SovereignMap reduceMotion={reduceMotion} />
          </motion.div>
        </div>

        {/* ── Bottom fade ── */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: 160,
          background: "linear-gradient(to bottom, transparent, var(--void))",
          pointerEvents: "none", zIndex: 3,
        }} />
      </section>

      {/* ── Warp transition overlay ── */}
      <AnimatePresence>
        {isWarping && (
          <motion.div
            className="warp-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {[...Array(40)].map((_, i) => (
              <motion.div
                key={i}
                style={{
                  position: "absolute",
                  height: 1,
                  background: "linear-gradient(90deg, transparent, rgba(45,212,191,0.7), transparent)",
                  top: `${(i / 40) * 110 - 5}%`,
                  left: "-150%",
                  width: `${15 + Math.random() * 45}%`,
                  opacity: 0.15 + Math.random() * 0.55,
                }}
                animate={{ left: ["−150%", "300%"] }}
                transition={{
                  duration: 0.25 + Math.random() * 0.3,
                  repeat: Infinity,
                  ease: "linear",
                  delay: Math.random() * 0.4,
                }}
              />
            ))}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: "center" }}
            >
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "linear-gradient(135deg, #14b8a6, #2dd4bf)",
                boxShadow: "0 0 60px rgba(20,184,166,0.6)",
                margin: "0 auto 16px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Zap style={{ width: 24, height: 24, fill: "white", color: "white" }} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.7)", fontFamily: "Tajawal", letterSpacing: "0.2em" }}>
                جاري تحليل وعيك...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
