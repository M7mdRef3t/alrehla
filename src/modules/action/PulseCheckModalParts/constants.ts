/**
 * Constants for PulseCheckModal component
 * ثوابت مكون شاشة ضبط البوصلة
 */

// Needle Gauge Constants
export const NEEDLE_MIN_ANGLE = -90;
export const NEEDLE_MAX_ANGLE = 90;
export const NEEDLE_SPRING_STIFFNESS = 400;
export const NEEDLE_SPRING_DAMPING = 30;
export const NEEDLE_ANIMATION_DURATION = 0.05;

// Energy Gauge Constants
export const ENERGY_MIN = 0;
export const ENERGY_MAX = 10;
export const ENERGY_STEP = 0.01;
export const ENERGY_TICK_COUNT = 11;
export const ENERGY_ANGLE_MULTIPLIER = 18;
export const ENERGY_ANGLE_OFFSET = -90;

// Arc Constants
export const ARC_STROKE_DASHARRAY = 283;
export const ARC_RADIUS = 90;
export const ARC_CENTER_X = 100;
export const ARC_CENTER_Y = 100;

// Animation Constants
export const TRANSITION_SPRING = {
  type: "spring" as const,
  stiffness: NEEDLE_SPRING_STIFFNESS,
  damping: NEEDLE_SPRING_DAMPING
};

export const TRANSITION_TWEEN = {
  type: "tween" as const,
  ease: "linear" as const,
  duration: NEEDLE_ANIMATION_DURATION
};

// Colors
export const COLORS = {
  needle: {
    primary: "#fbbf24",
    glow: "rgba(251, 191, 36, 0.3)"
  },
  arc: {
    background: "rgba(255, 255, 255, 0.03)",
    active: "url(#needleGrad)"
  },
  pivot: {
    glow: "rgba(251, 191, 36, 0.3)"
  }
} as const;

// Types from pulseState to avoid circular deps if needed
import type { PulseMood, PulseFocus } from "@/state/pulseState";

export const TOPIC_OPTIONS = [
  { id: "work", label: "الشغل" },
  { id: "family", label: "الأهل والبيت" },
  { id: "relationships", label: "العلاقات" },
  { id: "health", label: "صحتي" },
  { id: "finance", label: "الفلوس" },
  { id: "future", label: "اللي جاي" }
];

export const MOODS: Array<{ id: PulseMood; label: string; emoji: string }> = [
  { id: "bright", label: "رايق", emoji: "☀️" },
  { id: "calm", label: "هادي", emoji: "🌤️" },
  { id: "tense", label: "متوتر", emoji: "🌪️" },
  { id: "hopeful", label: "متفائل", emoji: "🌈" },
  { id: "anxious", label: "قلقان", emoji: "☁️" },
  { id: "angry", label: "متضايق", emoji: "⛈️" },
  { id: "sad", label: "زعلان", emoji: "🌧️" },
  { id: "overwhelmed", label: "فصلت", emoji: "🌫️" }
];

export const FOCUS_OPTIONS: Array<{ id: PulseFocus; labelKey: "event" | "thought" | "body" | "none_new" | "none_returning" }> = [
  { id: "event", labelKey: "event" },
  { id: "thought", labelKey: "thought" },
  { id: "body", labelKey: "body" },
  { id: "none", labelKey: "none_new" }
];

export const FOCUS_LABELS: Record<string, string> = {
  event: "حاجة حصلتلي",
  thought: "فكرة شاغلة بالي",
  body: "جسمي تعبان",
  none_returning: "ماشي في طريقي",
  none_new: "لسه بشوف حالي"
};

export const MOOD_COSMIC: Record<PulseMood, { bg: string; border: string; glow: string; text: string; nebula: string }> = {
  bright: { bg: "rgba(250, 204, 21, 0.1)", border: "rgba(250, 204, 21, 0.5)", glow: "0 0 25px rgba(250, 204, 21, 0.3)", text: "#facc15", nebula: "radial-gradient(circle at 50% 0%, rgba(250, 204, 21, 0.5) 0%, transparent 70%)" },
  calm: { bg: "rgba(45, 212, 191, 0.1)", border: "rgba(45, 212, 191, 0.5)", glow: "0 0 25px rgba(45, 212, 191, 0.3)", text: "#2dd4bf", nebula: "radial-gradient(circle at 50% 0%, rgba(45, 212, 191, 0.5) 0%, transparent 70%)" },
  anxious: { bg: "rgba(251, 191, 36, 0.1)", border: "rgba(251, 191, 36, 0.5)", glow: "0 0 25px rgba(251, 191, 36, 0.3)", text: "#fbbf24", nebula: "radial-gradient(circle at 50% 0%, rgba(251, 191, 36, 0.5) 0%, transparent 70%)" },
  angry: { bg: "rgba(248, 113, 113, 0.1)", border: "rgba(248, 113, 113, 0.5)", glow: "0 0 25px rgba(248, 113, 113, 0.3)", text: "#f87171", nebula: "radial-gradient(circle at 50% 0%, rgba(248, 113, 113, 0.5) 0%, transparent 70%)" },
  sad: { bg: "rgba(96, 165, 250, 0.1)", border: "rgba(96, 165, 250, 0.5)", glow: "0 0 25px rgba(96, 165, 250, 0.3)", text: "#60a5fa", nebula: "radial-gradient(circle at 50% 0%, rgba(96, 165, 250, 0.5) 0%, transparent 70%)" },
  tense: { bg: "rgba(245, 158, 11, 0.1)", border: "rgba(245, 158, 11, 0.5)", glow: "0 0 25px rgba(245, 158, 11, 0.3)", text: "#f59e0b", nebula: "radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.5) 0%, transparent 70%)" },
  hopeful: { bg: "rgba(34, 197, 94, 0.1)", border: "rgba(34, 197, 94, 0.5)", glow: "0 0 25px rgba(34, 197, 94, 0.3)", text: "#22c55e", nebula: "radial-gradient(circle at 50% 0%, rgba(34, 197, 94, 0.5) 0%, transparent 70%)" },
  overwhelmed: { bg: "rgba(139, 92, 246, 0.1)", border: "rgba(139, 92, 246, 0.5)", glow: "0 0 25px rgba(139, 92, 246, 0.3)", text: "#8b5cf6", nebula: "radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.5) 0%, transparent 70%)" }
};

export const FOCUS_COSMIC: Record<PulseFocus, { bg: string; border: string; text: string }> = {
  event: { bg: "rgba(45, 212, 191, 0.12)", border: "rgba(45, 212, 191, 0.3)", text: "#2dd4bf" },
  thought: { bg: "rgba(167, 139, 250, 0.12)", border: "rgba(167, 139, 250, 0.3)", text: "#a78bfa" },
  body: { bg: "rgba(248, 113, 113, 0.12)", border: "rgba(248, 113, 113, 0.3)", text: "#f87171" },
  none: { bg: "rgba(45, 212, 191, 0.08)", border: "rgba(45, 212, 191, 0.2)", text: "#2dd4bf" }
};

export const ENERGY_FEEDBACK_POINTS = new Set([0, 2, 5, 8, 10]);
