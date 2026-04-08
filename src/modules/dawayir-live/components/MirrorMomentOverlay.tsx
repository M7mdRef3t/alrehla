'use client';

import { useEffect } from "react";
import type { LiveLanguage, MirrorMomentState } from '../types';

interface MirrorMomentOverlayProps {
  moment: MirrorMomentState | null;
  language: LiveLanguage;
  onDismiss: () => void;
}

const CIRCLE_COPY = {
  1: { ar: "الوعي", en: "Awareness", color: "#38B2D8" },
  2: { ar: "المعرفة", en: "Knowledge", color: "#8B5CF6" },
  3: { ar: "الحقيقة", en: "Truth", color: "#00FF94" },
} as const;

export default function MirrorMomentOverlay({ moment, language, onDismiss }: MirrorMomentOverlayProps) {
  useEffect(() => {
    if (!moment?.visible) return undefined;
    const timer = window.setTimeout(onDismiss, 2500);
    return () => window.clearTimeout(timer);
  }, [moment?.visible, onDismiss]);

  if (!moment?.visible) return null;

  const circle = CIRCLE_COPY[moment.nodeId as 1 | 2 | 3] || CIRCLE_COPY[1];

  return (
    <div
      className="mirror-moment-overlay"
      aria-live="assertive"
      aria-atomic="true"
      style={{ ["--mm-color" as string]: circle.color }}
    >
      <div className="mirror-moment-card">
        <div className="mirror-moment-orb" aria-hidden="true" />
        <div className="mirror-moment-eyebrow">{language === "ar" ? "لحظة المرآة" : "Mirror Moment"}</div>
        <div className="mirror-moment-circle-dot" aria-hidden="true" />
        <h2 className="mirror-moment-heading">
          {language === "ar"
            ? `لأول مرة - تحوّلت دائرة ${circle.ar}`
            : `First shift - ${circle.en} circle just moved`}
        </h2>
        {moment.whyNowText && <p className="mirror-moment-why">{moment.whyNowText}</p>}
        <div className="mirror-moment-hint" aria-hidden="true">
          {language === "ar" ? "ستختفي تلقائيا..." : "Fading in a moment..."}
        </div>
      </div>
    </div>
  );
}
