export function energyColorHex(energy: number): string {
  const level = Math.max(0, Math.min(10, Math.round(energy)));
  const palette: Record<number, string> = {
    0: "#ef4444",  // red-500
    1: "#f87171",  // red-400
    2: "#fb923c",  // orange-400
    3: "#f97316",  // orange-500
    4: "#fbbf24",  // amber-400
    5: "#f59e0b",  // amber-500
    6: "#84cc16",  // lime-400
    7: "#2dd4bf",  // teal-400
    8: "#14b8a6",  // teal-500
    9: "#06b6d4",  // cyan-500
    10: "#22d3ee"  // cyan-400
  };
  return palette[level] ?? "#14b8a6";
}

export function energyPct(energy: number, options?: { min?: number; max?: number }): number {
  const min = options?.min ?? 1;
  const max = options?.max ?? 10;
  const denom = max - min;
  if (denom <= 0) return 0;
  const raw = ((energy - min) / denom) * 100;
  return Math.max(0, Math.min(100, raw));
}
