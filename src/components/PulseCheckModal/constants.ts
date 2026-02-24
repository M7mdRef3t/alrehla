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
