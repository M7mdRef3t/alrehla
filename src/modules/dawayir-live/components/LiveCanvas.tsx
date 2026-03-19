"use client";

import type { CSSProperties } from "react";
import { useMemo } from "react";
import { motion } from "framer-motion";
import type {
  CircleNode,
  JourneyStage,
  LiveLanguage,
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
  journeyStage: JourneyStage;
  language: LiveLanguage;
}

const CIRCLE_LAYOUT = [
  { x: 56, y: 37, scale: 1.12 },
  { x: 33, y: 67, scale: 0.96 },
  { x: 74, y: 66, scale: 1.02 },
];

const TOPIC_LAYOUT = [
  { x: 18, y: 24 },
  { x: 22, y: 42 },
  { x: 18, y: 60 },
  { x: 24, y: 78 },
  { x: 80, y: 22 },
  { x: 84, y: 44 },
];

const OTHER_LAYOUT = [
  { x: 84, y: 60 },
  { x: 82, y: 75 },
  { x: 14, y: 76 },
  { x: 12, y: 56 },
];

const JOURNEY_LABELS = {
  ar: {
    Overwhelmed: "حالة التشوش",
    Focus: "حالة التركيز",
    Clarity: "حالة الوضوح",
    mirror: "المراية شغالة الآن",
    fieldHint: "المشهد بيتشكل لحظة بلحظة من الدوائر والروابط والإشارات التي تظهر أثناء الكلام.",
  },
  en: {
    Overwhelmed: "Overwhelmed",
    Focus: "Focus",
    Clarity: "Clarity",
    mirror: "Mirror is live now",
    fieldHint: "The field is reshaping itself from circles, links, and cues as the conversation unfolds.",
  },
} as const;

function clampCircleSize(radius: number, scale: number) {
  const safeRadius = Number.isFinite(radius) ? radius : 50;
  return Math.round((Math.max(24, safeRadius) * 2 + 44) * scale);
}

export default function LiveCanvas({
  circles,
  spawnedOthers,
  spawnedTopics,
  topicConnections,
  thoughtMap,
  whyNowLine,
  isAgentSpeaking,
  journeyStage,
  language,
}: LiveCanvasProps) {
  const copy = JOURNEY_LABELS[language];
  const visibleCircles = useMemo(() => circles.slice(0, CIRCLE_LAYOUT.length), [circles]);

  const dominant = useMemo(
    () =>
      [...visibleCircles].sort((left, right) => right.radius - left.radius)[0] ?? {
        id: 0,
        label: language === "ar" ? "وعي" : "Awareness",
        radius: 50,
        color: "#14b8a6",
        fluidity: 0.5,
      },
    [language, visibleCircles],
  );

  const mappedTopics = useMemo(
    () =>
      spawnedTopics.slice(0, TOPIC_LAYOUT.length).map((topic, index) => ({
        ...topic,
        ...TOPIC_LAYOUT[index],
      })),
    [spawnedTopics],
  );

  const mappedOthers = useMemo(
    () =>
      spawnedOthers.slice(0, OTHER_LAYOUT.length).map((other, index) => ({
        ...other,
        ...OTHER_LAYOUT[index],
      })),
    [spawnedOthers],
  );

  const topicPositionMap = useMemo(
    () => new Map(mappedTopics.map((topic) => [topic.topic, topic])),
    [mappedTopics],
  );

  return (
    <div className={`live-canvas stage-${journeyStage.toLowerCase()}`}>
      <div className="live-cosmos-grid" />
      <div className="live-vignette" />
      <div className="live-nebula live-nebula-primary" />
      <div className="live-nebula live-nebula-secondary" />
      <div className="live-nebula live-nebula-tertiary" />

      <main id="main-canvas-content" className="live-session-stage">
        <motion.div
          className="live-stage-header"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="live-stage-chip">{copy.mirror}</span>
          <div className="live-stage-kicker">{copy[journeyStage]}</div>
          <h2>{dominant.label}</h2>
          <p>{whyNowLine || dominant.reason || dominant.topic || copy.fieldHint}</p>
        </motion.div>

        {thoughtMap.length > 0 && (
          <div className="live-thought-cloud" aria-label={language === "ar" ? "الخريطة الفكرية" : "Thought map"}>
            {thoughtMap.slice(-4).map((thought) => (
              <span key={thought.topic} className="live-thought-chip">
                <span>{thought.emoji}</span>
                <span>{thought.topic}</span>
              </span>
            ))}
          </div>
        )}

        <svg className="live-connection-layer" viewBox="0 0 100 100" aria-hidden="true">
          {topicConnections.map((connection, index) => {
            const from = topicPositionMap.get(connection.from);
            const to = topicPositionMap.get(connection.to);
            if (!from || !to) return null;
            return (
              <line
                key={connection.id || `${connection.from}-${connection.to}-${index}`}
                className="live-connection-line"
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                strokeWidth={Math.max(0.4, connection.weight * 1.2)}
              />
            );
          })}
        </svg>

        {mappedTopics.map((topic) => (
          <motion.div
            key={topic.id}
            className="live-topic-chip"
            style={
              {
                left: `${topic.x}%`,
                top: `${topic.y}%`,
                borderColor: `${topic.color}66`,
                backgroundColor: `${topic.color}1f`,
              } as CSSProperties
            }
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {topic.topic}
          </motion.div>
        ))}

        {mappedOthers.map((other) => (
          <motion.div
            key={other.id}
            className="live-other-node"
            style={
              {
                left: `${other.x}%`,
                top: `${other.y}%`,
                borderColor: `${other.color}5c`,
                backgroundColor: `${other.color}1a`,
              } as CSSProperties
            }
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <span className="live-other-name">{other.name}</span>
            <span className="live-other-tension">{Math.round(other.tension * 100)}%</span>
          </motion.div>
        ))}

        {visibleCircles.map((circle, index) => {
          const layout = CIRCLE_LAYOUT[index];
          const size = clampCircleSize(circle.radius, layout.scale);
          const highlighted = (circle.highlightUntil ?? 0) > Date.now();
          const isDominant = dominant.id === circle.id;
          return (
            <motion.div
              key={circle.id}
              className={`live-circle-node ${isDominant ? "dominant" : ""} ${highlighted ? "highlighted" : ""}`}
              style={
                {
                  left: `${layout.x}%`,
                  top: `${layout.y}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  ["--circle-color" as string]: circle.color,
                } as CSSProperties
              }
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{
                opacity: 1,
                scale: highlighted ? 1.04 : 1,
                y: isAgentSpeaking && isDominant ? [0, -4, 0] : [0, -2, 0],
              }}
              transition={{
                opacity: { duration: 0.35 },
                scale: { duration: 0.35 },
                y: { duration: isAgentSpeaking && isDominant ? 1.5 : 4.4, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              <div className="live-circle-glow" />
              <div className="live-circle-shell">
                <div className="live-circle-ripple" />
                <div className="live-circle-core">
                  <span className="live-circle-label">{circle.label}</span>
                  {(circle.topic || circle.reason) && (
                    <span className="live-circle-caption">{circle.topic || circle.reason}</span>
                  )}
                </div>
              </div>
              {isDominant && (
                <div className="live-circle-footnote">
                  {circle.reason || whyNowLine || copy.fieldHint}
                </div>
              )}
            </motion.div>
          );
        })}
      </main>
    </div>
  );
}
