import type { FC, ComponentProps } from "react";
import { motion } from "framer-motion";

export const isInvalidSvgToken = (value: string): boolean => {
  const token = value.trim().toLowerCase();
  return (
    token === "" ||
    token === "undefined" ||
    token === "nan" ||
    token === "null" ||
    token === "infinity" ||
    token === "-infinity"
  );
};

export const toSafeSvgCoordinate = (value: unknown, fallback: number): number | string => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && !isInvalidSvgToken(value)) return value;
  return fallback;
};

export const toSafeSvgRadius = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(value, 0);
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.max(parsed, 0);
  }
  return Math.max(fallback, 0);
};

export const toSafeSvgNumber = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};


// Color properties that framer-motion cannot animate reliably (CSS vars, oklab, etc.)
// These should NEVER appear in animate/initial/exit states — pass them as static props only.
const UNSAFE_MOTION_COLOR_PROPS = new Set([
  "fill", "stroke", "stopColor", "strokeOpacity", "fillOpacity"
]);

export const sanitizeCircleMotionState = <T,>(state: T): T => {
  if (!state || typeof state !== "object" || Array.isArray(state)) return state;
  const record = state as Record<string, unknown>;
  
  const result = { ...record };
  
  // Strip color props to prevent oklab/CSS-variable interpolation errors
  for (const key of UNSAFE_MOTION_COLOR_PROPS) {
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      delete result[key];
    }
  }

  if (Object.prototype.hasOwnProperty.call(record, "r")) {
    const rawR = record.r;
    result.r = Array.isArray(rawR) 
      ? rawR.map(v => toSafeSvgRadius(v, 0))
      : toSafeSvgRadius(rawR, 0);
  }

  if (Object.prototype.hasOwnProperty.call(record, "cx")) {
    const rawCX = record.cx;
    result.cx = Array.isArray(rawCX)
      ? rawCX.map(v => toSafeSvgCoordinate(v, 150))
      : toSafeSvgCoordinate(rawCX, 150);
  }

  if (Object.prototype.hasOwnProperty.call(record, "cy")) {
    const rawCY = record.cy;
    result.cy = Array.isArray(rawCY)
      ? rawCY.map(v => toSafeSvgCoordinate(v, 150))
      : toSafeSvgCoordinate(rawCY, 150);
  }

  return result as T;
};

export type SafeMotionCircleProps = ComponentProps<typeof motion.circle> & {
  cx?: number | string;
  cy?: number | string;
  r?: number | string;
};

/**
 * 🛡️ SafeMotionCircle — يحمي الدوائر من أخطاء الـ NaN والـ undefined
 * ويمنع framer-motion من محاولة animate ألوان CSS variables (oklab)
 */
export const SafeMotionCircle: FC<SafeMotionCircleProps> = ({ cx = 0, cy = 0, r = 0, ...props }) => {
  const { initial, animate, exit, whileHover, whileTap, whileFocus, ...rest } = props;
  return (
    <motion.circle
      cx={toSafeSvgCoordinate(cx, 0)}
      cy={toSafeSvgCoordinate(cy, 0)}
      r={toSafeSvgRadius(r, 0)}
      initial={sanitizeCircleMotionState(initial)}
      animate={sanitizeCircleMotionState(animate)}
      exit={sanitizeCircleMotionState(exit)}
      whileHover={sanitizeCircleMotionState(whileHover)}
      whileTap={sanitizeCircleMotionState(whileTap)}
      whileFocus={sanitizeCircleMotionState(whileFocus)}
      {...rest}
    />
  );
};


export type SafeCircleProps = ComponentProps<"circle"> & {
  cx?: number | string;
  cy?: number | string;
  r?: number | string;
};

/**
 * 🛡️ SafeCircle — نسخة ثابتة (Non-Motion) للحماية
 */
export const SafeCircle: FC<SafeCircleProps> = ({ cx = 0, cy = 0, r = 0, ...props }) => {
  return (
    <circle
      cx={toSafeSvgCoordinate(cx, 0)}
      cy={toSafeSvgCoordinate(cy, 0)}
      r={toSafeSvgRadius(r, 0)}
      {...props}
    />
  );
};
