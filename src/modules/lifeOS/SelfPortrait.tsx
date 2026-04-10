"use client";

import { memo, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { LIFE_DOMAINS, getDomainConfig, type LifeDomainId, type LifeScore } from "@/types/lifeDomains";

interface SelfPortraitProps {
  lifeScore: LifeScore | null;
  onDomainClick?: (domainId: LifeDomainId) => void;
  size?: number;
}

/**
 * Visual Self-Portrait — a human-body-inspired visualization
 * where each life domain maps to a "body part" metaphor,
 * rendered as concentric orbital rings around a central "self" core.
 *
 * The visualization shows:
 * - Central core = overall life score (pulsing)
 * - 8 orbital nodes = life domains (sized by score, colored by domain)
 * - Connection lines = domain interdependencies
 * - Ambient particles = active entries creating "life energy"
 */
export const SelfPortrait = memo(function SelfPortrait({
  lifeScore,
  onDomainClick,
  size = 360
}: SelfPortraitProps) {
  const center = size / 2;
  const overall = lifeScore?.overall ?? 50;

  // Map domains to orbital positions (3 concentric rings)
  const orbitalNodes = useMemo(() => {
    // Ring 1 (inner): self, spirit — the core of identity
    // Ring 2 (middle): body, relations, knowledge — the bridge
    // Ring 3 (outer): work, finance, dreams — the worldly
    const rings: { domains: LifeDomainId[]; radius: number }[] = [
      { domains: ["self", "spirit"], radius: size * 0.16 },
      { domains: ["body", "relations", "knowledge"], radius: size * 0.28 },
      { domains: ["work", "finance", "dreams"], radius: size * 0.40 }
    ];

    const nodes: {
      id: LifeDomainId;
      x: number;
      y: number;
      score: number;
      ring: number;
      angle: number;
      config: ReturnType<typeof getDomainConfig>;
    }[] = [];

    for (let ringIdx = 0; ringIdx < rings.length; ringIdx++) {
      const ring = rings[ringIdx];
      const angleStep = (2 * Math.PI) / ring.domains.length;
      const offset = ringIdx * 0.3; // Rotate each ring slightly

      for (let i = 0; i < ring.domains.length; i++) {
        const domainId = ring.domains[i];
        const angle = angleStep * i - Math.PI / 2 + offset;
        const score = lifeScore?.domains[domainId] ?? 50;
        const config = getDomainConfig(domainId);

        nodes.push({
          id: domainId,
          x: center + ring.radius * Math.cos(angle),
          y: center + ring.radius * Math.sin(angle),
          score,
          ring: ringIdx,
          angle,
          config
        });
      }
    }

    return nodes;
  }, [lifeScore, center, size]);

  // Connections between related domains
  const connections = useMemo(() => {
    const pairs: [LifeDomainId, LifeDomainId][] = [
      ["self", "body"],
      ["self", "spirit"],
      ["body", "work"],
      ["relations", "self"],
      ["work", "finance"],
      ["dreams", "knowledge"],
      ["spirit", "knowledge"],
      ["relations", "dreams"]
    ];

    return pairs.map(([from, to]) => {
      const fromNode = orbitalNodes.find(n => n.id === from);
      const toNode = orbitalNodes.find(n => n.id === to);
      if (!fromNode || !toNode) return null;

      const fromScore = fromNode.score;
      const toScore = toNode.score;
      const avgScore = (fromScore + toScore) / 2;
      const opacity = avgScore / 200 + 0.05; // 0.05 to 0.55

      return { from: fromNode, to: toNode, opacity, avgScore };
    }).filter(Boolean) as { from: typeof orbitalNodes[0]; to: typeof orbitalNodes[0]; opacity: number; avgScore: number }[];
  }, [orbitalNodes]);

  // Core pulse animation based on overall score
  const coreRadius = useMemo(() => {
    return 12 + (overall / 100) * 12; // 12 to 24
  }, [overall]);

  const getScoreColor = useCallback((score: number): string => {
    if (score >= 75) return "#10b981";
    if (score >= 50) return "#8b5cf6";
    if (score >= 30) return "#f59e0b";
    return "#ef4444";
  }, []);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background ambient rings */}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
        {/* Orbital ring guides */}
        {[0.16, 0.28, 0.40].map((r, i) => (
          <motion.circle
            key={`ring-${i}`}
            cx={center}
            cy={center}
            r={size * r}
            fill="none"
            stroke="currentColor"
            strokeWidth={0.5}
            strokeDasharray="4 6"
            className="text-white/5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.15 }}
          />
        ))}

        {/* Connection lines */}
        {connections.map((conn, i) => (
          <motion.line
            key={`conn-${i}`}
            x1={conn.from.x}
            y1={conn.from.y}
            x2={conn.to.x}
            y2={conn.to.y}
            stroke={`rgba(139, 92, 246, ${conn.opacity})`}
            strokeWidth={1}
            strokeDasharray={conn.avgScore > 60 ? "none" : "3 4"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 + i * 0.08 }}
          />
        ))}

        {/* Core glow */}
        <defs>
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={getScoreColor(overall)} stopOpacity={0.4} />
            <stop offset="100%" stopColor={getScoreColor(overall)} stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle
          cx={center}
          cy={center}
          r={coreRadius * 2.5}
          fill="url(#coreGlow)"
        />

        {/* Core circle */}
        <motion.circle
          cx={center}
          cy={center}
          r={coreRadius}
          fill={getScoreColor(overall)}
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ scale: { repeat: Infinity, duration: 3, ease: "easeInOut" } }}
          style={{ transformOrigin: `${center}px ${center}px` }}
        />

        {/* Core score text */}
        <text
          x={center}
          y={center + 1}
          textAnchor="middle"
          dominantBaseline="central"
          className="text-[11px] font-black fill-white font-mono"
        >
          {overall}
        </text>
      </svg>

      {/* Domain nodes */}
      {orbitalNodes.map((node, i) => {
        const nodeSize = 16 + (node.score / 100) * 14; // 16 to 30
        const glowSize = nodeSize + 8;

        return (
          <motion.button
            key={node.id}
            className="absolute flex flex-col items-center gap-0.5 cursor-pointer group"
            style={{
              left: node.x,
              top: node.y,
              transform: "translate(-50%, -50%)",
              zIndex: 10
            }}
            onClick={() => onDomainClick?.(node.id)}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1, type: "spring" }}
            whileHover={{ scale: 1.2 }}
          >
            {/* Node glow */}
            <div
              className="absolute rounded-full blur-md"
              style={{
                width: glowSize,
                height: glowSize,
                background: `${node.config.color}25`,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)"
              }}
            />

            {/* Node circle */}
            <div
              className="relative rounded-full flex items-center justify-center transition-all group-hover:shadow-lg"
              style={{
                width: nodeSize,
                height: nodeSize,
                background: `${node.config.color}30`,
                border: `2px solid ${node.config.color}60`,
                boxShadow: `0 0 ${node.score > 60 ? 12 : 4}px ${node.config.color}30`
              }}
            >
              <span className="text-[10px]" style={{ fontSize: nodeSize > 24 ? 13 : 10 }}>
                {node.config.icon}
              </span>
            </div>

            {/* Label */}
            <div className="flex flex-col items-center gap-0 pointer-events-none">
              <span className="text-[8px] font-bold text-white/40 group-hover:text-white/80 transition-colors whitespace-nowrap">
                {node.config.label}
              </span>
              <span className="text-[9px] font-black font-mono" style={{ color: node.config.color }}>
                {node.score}
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
});
