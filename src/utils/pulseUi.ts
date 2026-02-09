export function energyColorHex(energy: number): string {
  if (energy <= 3) return "#f43f5e"; // rose-500
  if (energy <= 6) return "#f59e0b"; // amber-500
  return "#14b8a6"; // teal-500
}

export function energyPct(energy: number, options?: { min?: number; max?: number }): number {
  const min = options?.min ?? 1;
  const max = options?.max ?? 10;
  const denom = max - min;
  if (denom <= 0) return 0;
  const raw = ((energy - min) / denom) * 100;
  return Math.max(0, Math.min(100, raw));
}

