"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type {
  CircleNode,
  SpawnedOther,
  SpawnedTopic,
  ThoughtNode,
  TopicConnection,
} from "../types";

interface LiveCanvasProps {
  circles: CircleNode[];
  spawnedOthers: SpawnedOther[];
  spawnedTopics: SpawnedTopic[];
  topicConnections: TopicConnection[];
  thoughtMap: ThoughtNode[];
  whyNowLine: string | null;
  isAgentSpeaking: boolean;
}

const CIRCLE_POSITIONS = [
  { cx: 50, cy: 32 },
  { cx: 28, cy: 68 },
  { cx: 72, cy: 68 },
];

function clampRadius(radius: number) {
  const safeRadius = Number.isFinite(radius) ? radius : 50;
  return (Math.max(0, safeRadius) / 100) * 16 + 6;
}

export default function LiveCanvas({
  circles,
  spawnedOthers,
  spawnedTopics,
  topicConnections,
  thoughtMap,
  whyNowLine,
  isAgentSpeaking,
}: LiveCanvasProps) {
  const visibleCircles = useMemo(() => circles.slice(0, CIRCLE_POSITIONS.length), [circles]);
  const dominant = useMemo(
    () =>
      [...visibleCircles].sort((left, right) => right.radius - left.radius)[0] ?? {
        id: 0,
        label: "وعي",
        radius: 50,
        color: "#14b8a6",
        fluidity: 0.5,
      },
    [visibleCircles],
  );

  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.18),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.18),transparent_35%),#020617]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:44px_44px]" />

      <motion.div
        className="absolute inset-x-0 top-10 z-20 mx-auto w-[min(92vw,44rem)] rounded-3xl border border-white/10 bg-slate-950/55 px-5 py-4 text-center shadow-2xl backdrop-blur-xl"
        animate={{
          opacity: isAgentSpeaking ? 1 : 0.88,
          scale: isAgentSpeaking ? 1.01 : 1,
        }}
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-teal-300/80">
          Dominant Circle
        </p>
        <p className="mt-2 text-2xl font-black tracking-tight text-white">{dominant.label}</p>
        <p className="mt-2 text-sm text-slate-300">
          {whyNowLine || dominant.reason || dominant.topic || "الجلسة ترسم مركز الثقل الحالي لحظة بلحظة."}
        </p>
      </motion.div>

      <div className="absolute inset-0">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          {topicConnections.map((connection, index) => {
            const fromIndex = spawnedTopics.findIndex((topic) => topic.topic === connection.from);
            const toIndex = spawnedTopics.findIndex((topic) => topic.topic === connection.to);
            if (fromIndex === -1 || toIndex === -1) return null;
            const start = {
              x: 15 + (fromIndex % 4) * 22,
              y: 14 + Math.floor(fromIndex / 4) * 17,
            };
            const end = {
              x: 15 + (toIndex % 4) * 22,
              y: 14 + Math.floor(toIndex / 4) * 17,
            };
            return (
              <line
                key={connection.id || `${connection.from}-${connection.to}-${index}`}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke="rgba(94,234,212,0.35)"
                strokeWidth={Math.max(0.6, connection.weight * 1.8)}
                strokeDasharray="1.5 1.5"
              />
            );
          })}

          {visibleCircles.map((circle, index) => {
            const position = CIRCLE_POSITIONS[index];
            const radius = clampRadius(circle.radius);
            const highlighted = (circle.highlightUntil ?? 0) > Date.now();
            return (
              <motion.g
                key={circle.id}
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{
                  scale: highlighted ? 1.08 : 1,
                  opacity: 1,
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                style={{ transformOrigin: `${position.cx}% ${position.cy}%` }}
              >
                <circle
                  cx={position.cx}
                  cy={position.cy}
                  r={radius + 5}
                  fill={circle.color}
                  opacity={0.12 + circle.fluidity * 0.18}
                />
                <circle
                  cx={position.cx}
                  cy={position.cy}
                  r={radius}
                  fill={circle.color}
                  opacity={0.2 + circle.fluidity * 0.3}
                  stroke={highlighted ? "#f8fafc" : "rgba(255,255,255,0.35)"}
                  strokeWidth={highlighted ? 1.2 : 0.5}
                />
                <text
                  x={position.cx}
                  y={position.cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize="4.2"
                  fontWeight="700"
                >
                  {circle.label}
                </text>
              </motion.g>
            );
          })}
        </svg>
      </div>

      <div className="absolute bottom-8 left-8 right-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-4 shadow-xl backdrop-blur-xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">Others</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {spawnedOthers.length === 0 && <span className="text-sm text-slate-500">لا توجد ضغوط خارجية مرسومة بعد.</span>}
            {spawnedOthers.map((other) => (
              <span
                key={other.id}
                className="rounded-full border px-3 py-1 text-xs font-semibold text-white"
                style={{ borderColor: `${other.color}66`, backgroundColor: `${other.color}22` }}
              >
                {other.name}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-4 shadow-xl backdrop-blur-xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">Topics</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {spawnedTopics.length === 0 && <span className="text-sm text-slate-500">الموضوعات ستظهر هنا أثناء الجلسة.</span>}
            {spawnedTopics.map((topic) => (
              <span
                key={topic.id}
                className="rounded-full border px-3 py-1 text-xs font-semibold text-white"
                style={{ borderColor: `${topic.color}66`, backgroundColor: `${topic.color}1f` }}
              >
                {topic.topic}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-4 shadow-xl backdrop-blur-xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">Thought Map</p>
          <div className="mt-3 space-y-2">
            {thoughtMap.length === 0 && <span className="text-sm text-slate-500">الخريطة الفكرية ستتكوّن تدريجيًا.</span>}
            {thoughtMap.slice(-4).map((thought) => (
              <div key={thought.topic} className="flex items-center justify-between text-sm text-slate-200">
                <span>{thought.topic}</span>
                <span className="text-slate-400">{thought.emoji}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
