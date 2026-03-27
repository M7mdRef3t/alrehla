/**
 * FirstTimeWelcomeFlow.tsx
 * ─────────────────────────
 * 3-step onboarding modal for first-time users.
 * Shows once per device (keyed by localStorage flag).
 * Steps: ① ما هي الرحلة → ② كيف تعمل الخريطة → ③ أول خطوة
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Map, Zap, Star, ArrowLeft } from "lucide-react";
import { setInLocalStorage } from "../services/browserStorage";

export const WELCOME_SEEN_KEY = "alrehla_welcome_seen_v1";

interface Step {
  emoji: string;
  title: string;
  body: string;
  cta: string;
  icon: typeof Map;
  color: string;
}

const STEPS: Step[] = [
  {
    emoji: "🌿",
    title: "مرحباً في الرحلة",
    body: "الرحلة هي مساحتك الخاصة لفهم علاقاتك وتحسين حياتك النفسية — بخطوات صغيرة ومدروسة كل يوم.",
    cta: "كيف تعمل؟",
    icon: Star,
    color: "#14d2c8",
  },
  {
    emoji: "🗺️",
    title: "خريطة علاقاتك",
    body: "أضف الأشخاص الذين يشغلون تفكيرك على الخريطة. ستحلل المنصة مواطن القوة والضغط في كل علاقة.",
    cta: "وبعدين؟",
    icon: Map,
    color: "#818cf8",
  },
  {
    emoji: "⚡",
    title: "خطوتك الأولى",
    body: "ليس عليك فعل كل شيء اليوم. أضف شخصاً واحداً فقط — وستحصل على أول إنجاز وأول XP في رحلتك.",
    cta: "هيّا نبدأ!",
    icon: Zap,
    color: "#f59e0b",
  },
];

interface FirstTimeWelcomeFlowProps {
  onDone: () => void;
}

export function FirstTimeWelcomeFlow({ onDone }: FirstTimeWelcomeFlowProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function advance() {
    if (isLast) {
      setInLocalStorage(WELCOME_SEEN_KEY, "1");
      onDone();
    } else {
      setStep(s => s + 1);
    }
  }

  function skip() {
    setInLocalStorage(WELCOME_SEEN_KEY, "1");
    onDone();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 99000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
        background: "rgba(5,7,15,0.92)",
        backdropFilter: "blur(24px)",
        fontFamily: "'IBM Plex Sans Arabic', 'Tajawal', sans-serif",
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: -30, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 30, scale: 0.97 }}
          transition={{ type: "spring", damping: 25, stiffness: 260 }}
          style={{
            width: "100%", maxWidth: 400, borderRadius: 28, overflow: "hidden",
            background: "linear-gradient(170deg,#0d1022 0%,#080b18 100%)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: `0 0 60px ${current.color}20, 0 40px 80px rgba(0,0,0,0.8)`,
            padding: "36px 28px 28px",
            textAlign: "center",
            direction: "rtl",
          }}
        >
          {/* Step dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 28 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                height: 4, borderRadius: 99,
                background: i <= step ? current.color : "rgba(255,255,255,0.1)",
                width: i === step ? 24 : 8,
                transition: "all 0.3s",
              }} />
            ))}
          </div>

          {/* Emoji */}
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            margin: "0 auto 20px",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: `${current.color}15`,
            border: `1px solid ${current.color}30`,
            fontSize: 38,
            boxShadow: `0 0 32px ${current.color}20`,
          }}>
            {current.emoji}
          </div>

          <h2 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 900, color: "#f1f5f9" }}>
            {current.title}
          </h2>
          <p style={{ margin: "0 0 32px", fontSize: 14, lineHeight: 1.75, color: "rgba(255,255,255,0.5)", padding: "0 8px" }}>
            {current.body}
          </p>

          {/* CTA */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={advance}
            style={{
              width: "100%", padding: "14px 0", borderRadius: 16, border: "none",
              background: `linear-gradient(135deg, ${current.color}, ${step === 1 ? "#6366f1" : "#0ea5e9"})`,
              color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer",
              boxShadow: `0 0 28px ${current.color}35`,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {current.cta}
            {!isLast && <ArrowLeft size={16} />}
          </motion.button>

          {/* Skip */}
          {!isLast && (
            <button
              onClick={skip}
              style={{
                marginTop: 14, background: "transparent", border: "none",
                color: "rgba(255,255,255,0.3)", fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}
            >
              تخطّ
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
