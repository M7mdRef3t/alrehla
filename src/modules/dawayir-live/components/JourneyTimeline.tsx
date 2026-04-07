"use client";

import { BrainCircuit, Compass, Gem } from "lucide-react";
import type { LiveLanguage } from '../types';

const NODE_CONFIG = {
  1: { labelAr: "الوعي", labelEn: "Awareness", color: "#38B2D8", Icon: Compass },
  2: { labelAr: "العلم", labelEn: "Knowledge", color: "#2ECC71", Icon: BrainCircuit },
  3: { labelAr: "الحقيقة", labelEn: "Truth", color: "#9B59B6", Icon: Gem },
} as const;

export default function JourneyTimeline({
  journeyPath,
  transitionCount,
  sessionDurationMs,
  language,
}: {
  journeyPath: number[];
  transitionCount: number;
  sessionDurationMs: number;
  language: LiveLanguage;
}) {
  if (!journeyPath.length) return null;

  const waypoints = journeyPath.reduce<number[]>((acc, nodeId) => {
    if (acc.length === 0 || acc[acc.length - 1] !== nodeId) {
      acc.push(nodeId);
    }
    return acc;
  }, []);

  const segmentDuration =
    sessionDurationMs > 0 && waypoints.length > 1
      ? Math.round(sessionDurationMs / Math.max(1, waypoints.length - 1) / 1000)
      : null;

  return (
    <div className="journey-timeline-wrap">
      <p className="journey-timeline-title">{language === "ar" ? "خريطة رحلتك" : "Your Journey Map"}</p>

      <div className="journey-timeline-track">
        {waypoints.map((nodeId, index) => {
          const config = NODE_CONFIG[nodeId as 1 | 2 | 3] ?? NODE_CONFIG[1];
          const isLast = index === waypoints.length - 1;
          const Icon = config.Icon;

          return (
            <div key={`${nodeId}-${index}`} className="journey-segment">
              <div className="journey-node" style={{ ["--node-color" as string]: config.color }}>
                <div className="journey-node-icon" aria-hidden="true">
                  <Icon size={18} />
                </div>
                <div className="journey-node-label">{language === "ar" ? config.labelAr : config.labelEn}</div>
                <div className="journey-node-time">
                  {index === 0 ? (language === "ar" ? "البداية" : "Start") : isLast ? (language === "ar" ? "النهاية" : "End") : ""}
                </div>
              </div>

              {!isLast && (
                <div className="journey-connector">
                  <div className="journey-connector-line" />
                  {segmentDuration && (
                    <div className="journey-connector-time">
                      ~{segmentDuration}
                      {language === "ar" ? "ث" : "s"}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="journey-timeline-sub">
        {language === "ar"
          ? `${transitionCount} انتقال إدراكي خلال الجلسة`
          : `${transitionCount} cognitive transition${transitionCount === 1 ? "" : "s"} this session`}
      </p>
    </div>
  );
}
