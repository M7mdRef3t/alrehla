export type VisualContainerMode = "grid" | "list";
export type VisualDetailMode = "compact" | "comfortable";
export type VisualGroupingMode = "table" | "cards";

export interface VisualGeneDecision {
  densityScore: number;
  container: VisualContainerMode;
  detail: VisualDetailMode;
  grouping: VisualGroupingMode;
}

interface VisualGeneSample {
  itemCount: number;
  fieldCount: number;
  timestamp: number;
}

interface VisualGeneMemory {
  [featureKey: string]: VisualGeneSample[];
}

const MEMORY_KEY = "dawayir-visual-genes-memory";
const MAX_SAMPLES_PER_FEATURE = 40;

function readMemory(): VisualGeneMemory {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as VisualGeneMemory;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeMemory(memory: VisualGeneMemory): void {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
  } catch {
    // noop
  }
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function decideVisualGeneLayout(input: {
  featureKey: string;
  itemCount: number;
  fieldCount: number;
}): VisualGeneDecision {
  const { featureKey, itemCount, fieldCount } = input;
  const memory = readMemory();
  const history = memory[featureKey] ?? [];

  const learnedItems = average(history.map((entry) => entry.itemCount));
  const learnedFields = average(history.map((entry) => entry.fieldCount));

  const itemPressure = itemCount * 4.2;
  const fieldPressure = fieldCount * 7.5;
  const learnedPressure = learnedItems * 1.6 + learnedFields * 2.2;
  const densityScore = clamp(itemPressure + fieldPressure + learnedPressure * 0.35);

  const grouping: VisualGroupingMode =
    (fieldCount >= 6 && itemCount >= 5) || densityScore >= 64 ? "table" : "cards";
  const container: VisualContainerMode = densityScore >= 58 || itemCount >= 10 ? "list" : "grid";
  const detail: VisualDetailMode = densityScore >= 72 ? "compact" : "comfortable";

  const nextHistory = [
    ...history,
    { itemCount, fieldCount, timestamp: Date.now() }
  ].slice(-MAX_SAMPLES_PER_FEATURE);
  memory[featureKey] = nextHistory;
  writeMemory(memory);

  return {
    densityScore,
    container,
    detail,
    grouping
  };
}
