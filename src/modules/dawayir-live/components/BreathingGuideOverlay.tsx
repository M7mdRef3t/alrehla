"use client";

import { useEffect, useRef, useState } from "react";
import type { LiveLanguage } from "../types";

const PHASES = [
  { key: "inhale", dur: 4, ar: "خد نفس", en: "Inhale" },
  { key: "hold", dur: 4, ar: "ثبّت النفس", en: "Hold" },
  { key: "exhale", dur: 6, ar: "طلّع النفس", en: "Exhale" },
] as const;

const COLORS: Record<(typeof PHASES)[number]["key"], string> = {
  inhale: "#38B2D8",
  hold: "#FFD166",
  exhale: "#2ECC71",
};

interface BreathingGuideOverlayProps {
  active: boolean;
  language: LiveLanguage;
  onComplete?: () => void;
}

export default function BreathingGuideOverlay({
  active,
  language,
  onComplete,
}: BreathingGuideOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const phaseRef = useRef(0);
  const startRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    setVisible(true);
    setPhaseIndex(0);
    setProgress(0);
    phaseRef.current = 0;
    startRef.current = 0;
  }, [active]);

  useEffect(() => {
    if (!visible) return undefined;

    const animate = (now: number) => {
      if (!startRef.current) startRef.current = now;
      const phase = PHASES[phaseRef.current];
      const elapsed = (now - startRef.current) / 1000;
      const nextProgress = Math.min(elapsed / phase.dur, 1);
      setProgress(nextProgress);

      if (nextProgress >= 1) {
        if (phaseRef.current < PHASES.length - 1) {
          phaseRef.current += 1;
          setPhaseIndex(phaseRef.current);
          setProgress(0);
          startRef.current = now;
        } else {
          setVisible(false);
          onComplete?.();
          return;
        }
      }

      rafRef.current = window.requestAnimationFrame(animate);
    };

    rafRef.current = window.requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [onComplete, visible]);

  if (!visible) return null;

  const phase = PHASES[phaseIndex];
  const color = COLORS[phase.key];
  const circumference = 2 * Math.PI * 44;
  const strokeDash = circumference * progress;

  return (
    <div className="breathing-guide-overlay" aria-live="assertive" role="alert">
      <div className="breathing-guide-card">
        <button
          type="button"
          className="overlay-dismiss-btn"
          onClick={() => {
            setVisible(false);
            onComplete?.();
          }}
          aria-label={language === "ar" ? "إغلاق" : "Close"}
        >
          ×
        </button>

        <p className="breathing-guide-hint">{language === "ar" ? "لحظة نهدى سوا" : "One quiet cycle"}</p>

        <div className="breathing-circle-wrap" aria-hidden="true">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke={color}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${strokeDash} ${circumference}`}
              transform="rotate(-90 50 50)"
              style={{ filter: `drop-shadow(0 0 6px ${color})` }}
            />
            <circle
              cx="50"
              cy="50"
              r="8"
              fill={color}
              opacity="0.7"
              style={{
                transform: `scale(${0.82 + progress * 0.48})`,
                transformOrigin: "50px 50px",
              }}
            />
          </svg>
        </div>

        <p className="breathing-phase-label" style={{ color }}>
          {language === "ar" ? phase.ar : phase.en}
        </p>
        <p className="breathing-phase-seconds">
          {phase.dur}
          {language === "ar" ? " ث" : "s"}
        </p>
      </div>
    </div>
  );
}
