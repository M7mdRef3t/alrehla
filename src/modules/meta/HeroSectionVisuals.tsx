import React, { type FC, Fragment, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const techEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: techEase }
  }
};

const ROTATING_WORDS = [
  "وقتك مش ليك",
  "طاقتك لغيرك",
  "حدودك مستباحة",
  "صوتك مخنوق",
  "همهم عليك",
  "مكانك مش واضح",
  "حياتك لغيرك",
  "نفسك آخر همك"
];

export const RotatingWord: FC<{ isMobile: boolean }> = React.memo(({ isMobile }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % ROTATING_WORDS.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  if (isMobile) {
    return (
      <span className="rotating-word-mobile headline-accent font-extrabold font-['Noto_Kufi_Arabic']">
        {ROTATING_WORDS[index]}
      </span>
    );
  }

  return (
    <span className="rotating-word-wrapper">
      <span className="invisible select-none block whitespace-nowrap font-extrabold" aria-hidden>
        {ROTATING_WORDS.reduce((a, b) => (a.length > b.length ? a : b))}
      </span>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.45, ease: techEase }}
          className="absolute top-0 flex items-center headline-accent h-fit whitespace-nowrap leading-[1.2] overflow-visible box-content px-2 mt-0 mb-0 align-middle font-extrabold font-['Noto_Kufi_Arabic']"
        >
          {ROTATING_WORDS[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
});

export const SovereignMap: FC<{ reduceMotion: boolean | null; isMobile: boolean }> = React.memo(({ reduceMotion, isMobile }) => {
  const rings = [
    { r: 68, stroke: "rgba(0, 240, 255, 0.35)", dur: 22 },
    { r: 110, stroke: "rgba(245, 166, 35, 0.25)", dur: 38 },
    { r: 152, stroke: "rgba(239, 68, 68, 0.2)", dur: 60 },
    { r: 194, stroke: "rgba(0, 240, 255, 0.15)", dur: 90 }
  ];

  const nodes = [
    { cx: 190, cy: 122, r: 13, color: "#00f0ff", label: "علاقة بميزانها" },
    { cx: 252, cy: 156, r: 11, color: "#00eeff", label: "دعم خاص" },
    { cx: 300, cy: 245, r: 14, color: "#f5a623", label: "نبض متذبذب" },
    { cx: 130, cy: 294, r: 10, color: "#fbbf24", label: "تشويش روح" },
    { cx: 60, cy: 125, r: 16, color: "#00d0ff", label: "احتواء حقيقي" },
    { cx: 162, cy: 42, r: 12, color: "#ff0055", label: "نزيف طاقة" },
    { cx: 308, cy: 90, r: 11, color: "#ff0044", label: "حدود مهدورة" }
  ];

  const [hovered, setHovered] = useState<number | null>(null);
  const toSafeRadius = (value: unknown, fallback: number) =>
    typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;

  return (
    <motion.div className="sovereign-map">
      <div className="sovereign-map__atmosphere" aria-hidden />
      <svg viewBox="0 0 380 380" fill="none" className="sovereign-map__svg">
        {nodes.map((n, i) => (
          <Fragment key={`nexus-${i}`}>
            <motion.line
              x1="190"
              y1="190"
              x2={n.cx}
              y2={n.cy}
              stroke={n.color}
              strokeWidth="0.5"
              opacity={hovered === i ? 0.6 : 0.15}
              className="orbit-line"
            />
          </Fragment>
        ))}

        {rings.map((ring, i) => {
          const safeRingRadius = toSafeRadius(ring.r, 1);
          return (
            <g key={i}>
              <motion.circle
                cx="190"
                cy="190"
                r={safeRingRadius}
                stroke={ring.stroke}
                strokeWidth="1"
                fill="none"
                style={{ transform: "translateZ(0)" }}
                animate={reduceMotion || isMobile ? {} : { rotate: i % 2 === 0 ? 360 : -360 }}
                transition={{ duration: ring.dur, repeat: Infinity, ease: "linear" }}
                transformOrigin="190px 190px"
              />
            </g>
          );
        })}

        {nodes.map((node, i) => {
          const safeNodeRadius = toSafeRadius(node.r, 1);
          return (
            <motion.g
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              cursor="pointer"
            >
              <circle cx={node.cx} cy={node.cy} r={safeNodeRadius + 4} fill={node.color} opacity={0.1} />
              <circle cx={node.cx} cy={node.cy} r={safeNodeRadius} fill={node.color} />
              <AnimatePresence>
                {hovered === i && (
                  <motion.foreignObject
                    x={node.cx - 75}
                    y={node.cy - 16}
                    width="150"
                    height="36"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="node-tooltip-body">{node.label}</div>
                  </motion.foreignObject>
                )}
              </AnimatePresence>
            </motion.g>
          );
        })}

        <motion.g className="center-core" transformOrigin="190px 190px">
          <circle cx="190" cy="190" r="14" fill="var(--cyan)" className="center-core__glow" />
          <circle cx="190" cy="190" r="6" fill="#fff" />
        </motion.g>
      </svg>

      <div className="metric-card metric-card--health">
        <p className="metric-card-label">صحتك الداخلية</p>
        <div className="metric-card-values">
          <span className="metric-card-value">٧٨</span>
          <span className="metric-card-text">/ ١٠٠</span>
        </div>
        <div className="metric-card-bar">
          {isMobile ? (
            <div className="metric-card-bar__fill" style={{ width: "78%" }} />
          ) : (
            <motion.div
              className="metric-card-bar__fill"
              initial={{ width: "0%" }}
              animate={{ width: "78%" }}
              transition={{ duration: 1.2, delay: 0.6 }}
            />
          )}
        </div>
      </div>

      <div className="legend">
        {[
          { label: "توازن", color: "var(--cyan)" },
          { label: "تشتت", color: "var(--gold)" },
          { label: "استنزاف", color: "var(--crimson)" }
        ].map(({ label, color }) => (
          <div key={label} className="legend-item">
            <span className="legend-dot" style={{ color }} />
            <span className="legend-label" style={{ color }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
});
