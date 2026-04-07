"use client";

import { useEffect, useState } from "react";
import type { LiveLanguage } from '../types';

interface ParityOnboardingModalProps {
  language: LiveLanguage;
  step: number;
  steps: Array<{ title: string; body: string }>;
  onSkip: () => void;
  onNext: () => void;
}

export default function ParityOnboardingModal({
  language,
  step,
  steps,
  onSkip,
  onNext,
}: ParityOnboardingModalProps) {
  const isLast = step >= steps.length - 1;
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    setAnimKey((value) => value + 1);
  }, [step]);

  return (
    <div className="onboarding-screen" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="onboarding-cosmos" aria-hidden="true">
        <div className="onboarding-nebula onboarding-nebula-1" />
        <div className="onboarding-nebula onboarding-nebula-2" />
      </div>

      <div className="onboarding-particles" aria-hidden="true">
        {Array.from({ length: 15 }).map((_, index) => (
          <div
            key={index}
            className="onboarding-particle"
            style={{
              left: `${5 + ((index * 6.3) % 88)}%`,
              top: `${8 + ((index * 7.1) % 82)}%`,
              animationDelay: `${(index * 0.4).toFixed(2)}s`,
              animationDuration: `${3 + (index % 3) * 0.7}s`,
              width: `${1.5 + (index % 3)}px`,
              height: `${1.5 + (index % 3)}px`,
            }}
          />
        ))}
      </div>

      <div className="onboarding-progress" aria-hidden="true">
        {steps.map((_, index) => (
          <div
            key={index}
            className={`onboarding-dot ${index === step ? "active" : ""} ${index < step ? "completed" : ""}`}
          />
        ))}
      </div>

      <div className="onboarding-content" key={animKey}>
        <div className="onboarding-hero">
          <div className="ob-hero-circle ob-hero-awareness" />
          <div className="ob-hero-circle ob-hero-knowledge" />
          <div className="ob-hero-circle ob-hero-truth" />
        </div>

        <div className="onboarding-card">
          <span className="onboarding-step-badge">
            {step + 1}/{steps.length}
          </span>
          <h2 className="onboarding-title">{steps[step].title}</h2>
          <p className="onboarding-body">{steps[step].body}</p>
          <div className="onboarding-nav">
            <button className="onboarding-btn-primary" onClick={onNext} type="button">
              {isLast ? (language === "ar" ? "يلا نبدأ" : "Let's Go") : language === "ar" ? "التالي" : "Next"}
            </button>
            <button className="onboarding-btn-skip" onClick={onSkip} type="button">
        {language === "ar" ? "ادخل الملاذ الآمن" : "Enter Sanctuary"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
