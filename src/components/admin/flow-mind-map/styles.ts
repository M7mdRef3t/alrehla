import type { FlowNode } from "./types";

/* ═══════════════════════════════════════════════════
   Variant styling — Miro-inspired clean cards
   ═══════════════════════════════════════════════════ */
export interface CardStyle {
  bg: string;
  border: string;
  borderHover: string;
  labelColor: string;
  titleColor: string;
  actionColor: string;
  countColor: string;
  glow: string;
  stripe: string;
}

export const variantConfig: Record<string, CardStyle> = {
  root: {
    bg: "#1e293b",
    border: "#334155",
    borderHover: "#475569",
    labelColor: "#94a3b8",
    titleColor: "#f8fafc",
    actionColor: "#94a3b8",
    countColor: "#5eead4",
    glow: "rgba(30,41,59,0.25)",
    stripe: "#3b82f6"
  },
  branch: {
    bg: "#ffffff",
    border: "#e2e8f0",
    borderHover: "#cbd5e1",
    labelColor: "#64748b",
    titleColor: "#1e293b",
    actionColor: "#64748b",
    countColor: "#0d9488",
    glow: "rgba(148,163,184,0.15)",
    stripe: "#64748b"
  },
  "branch-amber": {
    bg: "#fffbeb",
    border: "#fcd34d",
    borderHover: "#f59e0b",
    labelColor: "#b45309",
    titleColor: "#78350f",
    actionColor: "#b45309",
    countColor: "#d97706",
    glow: "rgba(251,191,36,0.15)",
    stripe: "#f59e0b"
  },
  "sub-rose": {
    bg: "#fff1f2",
    border: "#fda4af",
    borderHover: "#fb7185",
    labelColor: "#e11d48",
    titleColor: "#881337",
    actionColor: "#e11d48",
    countColor: "#e11d48",
    glow: "rgba(251,113,133,0.15)",
    stripe: "#f43f5e"
  },
  "sub-teal": {
    bg: "#f0fdfa",
    border: "#5eead4",
    borderHover: "#2dd4bf",
    labelColor: "#0f766e",
    titleColor: "#134e4a",
    actionColor: "#0f766e",
    countColor: "#0d9488",
    glow: "rgba(94,234,212,0.15)",
    stripe: "#14b8a6"
  },
  "sub-slate": {
    bg: "#f8fafc",
    border: "#cbd5e1",
    borderHover: "#94a3b8",
    labelColor: "#64748b",
    titleColor: "#475569",
    actionColor: "#64748b",
    countColor: "#64748b",
    glow: "rgba(148,163,184,0.12)",
    stripe: "#94a3b8"
  }
};

export function getVariantKey(node: FlowNode): string {
  if (node.variant === "root") return "root";
  if (node.variant === "branch" && node.accent === "amber") return "branch-amber";
  if (node.variant === "branch") return "branch";
  if (node.accent === "rose") return "sub-rose";
  if (node.accent === "teal") return "sub-teal";
  if (node.accent === "slate") return "sub-slate";
  return "branch";
}

export function getStyle(node: FlowNode): CardStyle {
  return variantConfig[getVariantKey(node)] || variantConfig.branch;
}

export function getDecisionOutcome(node: FlowNode): "success" | "failure" | "neutral" {
  if (node.accent === "teal") return "success";
  if (node.accent === "rose") return "failure";
  return "neutral";
}

export const PHASE_LANE_META: Record<string, { fill: string; border: string; text: string }> = {
  "phase-pre-auth-v2": {
    fill: "rgba(245, 158, 11, 0.08)",
    border: "rgba(245, 158, 11, 0.38)",
    text: "#b45309"
  },
  "phase-auth-v2": {
    fill: "rgba(20, 184, 166, 0.07)",
    border: "rgba(20, 184, 166, 0.34)",
    text: "#0f766e"
  },
  "phase-core-v2": {
    fill: "rgba(59, 130, 246, 0.07)",
    border: "rgba(59, 130, 246, 0.32)",
    text: "#1d4ed8"
  }
};
