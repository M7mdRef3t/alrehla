import { geminiClient } from "./geminiClient";
import { useConsciousnessHistory } from "../state/consciousnessHistoryState";
import { usePredictiveState } from "../state/predictiveState";
import { useMapState } from "../state/mapState";
import { usePulseState } from "../state/pulseState";
import { GrowthEngine } from "./growthEngine";
import { fetchOverviewStats } from "./adminApi";

export type UserState = "CHAOS" | "ORDER" | "FLOW";

export interface PredictiveInsight {
  state: UserState;
  entropyScore: number;
  primaryFactor: string;
  unstableNodes: number;
  pulseVolatility: number;
  lowEnergyRatio: number;
}

const CHAOS_MOODS = new Set(["anxious", "angry", "sad", "tense", "overwhelmed"]);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function computePulseVolatility(energies: number[]): number {
  if (energies.length < 2) return 0;
  let deltas = 0;
  for (let i = 1; i < energies.length; i += 1) {
    deltas += Math.abs(energies[i] - energies[i - 1]);
  }
  return deltas / (energies.length - 1);
}

function resolvePrimaryFactor(parts: Array<{ label: string; value: number }>): string {
  const sorted = [...parts].sort((a, b) => b.value - a.value);
  return sorted[0]?.label ?? "general_variability";
}

export function calculateEntropy(): PredictiveInsight {
  const nodes = useMapState.getState().nodes ?? [];
  const pulses = (usePulseState.getState().logs ?? []).slice(0, 14);

  const activeNodes = nodes.filter((node) => !node.isNodeArchived);
  const redCount = activeNodes.filter((node) => node.ring === "red").length;
  const yellowCount = activeNodes.filter((node) => node.ring === "yellow").length;
  const detachedCount = activeNodes.filter((node) => node.detachmentMode || node.isDetached).length;
  const unstableNodes = redCount + yellowCount;

  const energies = pulses.map((pulse) => Number(pulse.energy) || 0);
  const avgEnergy = average(energies);
  const pulseVolatility = computePulseVolatility(energies);
  const lowEnergyCount = pulses.filter((pulse) => Number(pulse.energy) <= 4).length;
  const lowEnergyRatio = pulses.length > 0 ? lowEnergyCount / pulses.length : 0;
  const unstableMoodCount = pulses.filter((pulse) => CHAOS_MOODS.has(pulse.mood)).length;
  const unstableMoodRatio = pulses.length > 0 ? unstableMoodCount / pulses.length : 0;

  const nodePressure = clamp(redCount * 18 + yellowCount * 9, 0, 58);
  const energyPressure = clamp((6 - avgEnergy) * 8, 0, 28);
  const volatilityPressure = clamp(pulseVolatility * 6, 0, 22);
  const moodPressure = clamp(unstableMoodRatio * 20, 0, 20);
  const detachmentOffset = clamp(detachedCount * 2, 0, 8);

  const entropyScore = clamp(
    Math.round(nodePressure + energyPressure + volatilityPressure + moodPressure - detachmentOffset),
    0,
    100
  );

  let state: UserState = "ORDER";
  if (entropyScore >= 70) state = "CHAOS";
  else if (entropyScore <= 32 && avgEnergy >= 6.5) state = "FLOW";

  const primaryFactor = resolvePrimaryFactor([
    { label: "relational_pressure", value: nodePressure },
    { label: "energy_drop", value: energyPressure },
    { label: "mood_instability", value: moodPressure },
    { label: "pulse_volatility", value: volatilityPressure }
  ]);

  return {
    state,
    entropyScore,
    primaryFactor,
    unstableNodes,
    pulseVolatility: Number(pulseVolatility.toFixed(2)),
    lowEnergyRatio: Number(lowEnergyRatio.toFixed(2))
  };
}

export async function generatePredictiveInsight(): Promise<string> {
  const entropy = calculateEntropy();

  const fallbackByState: Record<UserState, string> = {
    CHAOS: "الضغط عالي الآن. قلل المواجهات 24 ساعة وخد خطوة تهدئة واحدة واضحة قبل أي قرار كبير.",
    ORDER: "الوضع تحت السيطرة. ركز على قرار واحد مؤجل وثبّت حد واحد عملي اليوم.",
    FLOW: "إيقاعك جيد. استثمر الزخم في خطوة نمو مباشرة بدل فتح جبهات جديدة."
  };

  const fallback = fallbackByState[entropy.state];

  const prompt = `
أنت "رادار الوعي" في منصة الرحلة.
قدّم سطرًا واحدًا قصيرًا (حتى 22 كلمة) باللهجة العربية العملية.
المعطيات:
- الحالة: ${entropy.state}
- درجة الفوضى: ${entropy.entropyScore}/100
- العامل الأبرز: ${entropy.primaryFactor}
- تقلب النبض: ${entropy.pulseVolatility}
- نسبة الطاقة المنخفضة: ${entropy.lowEnergyRatio}

الناتج المطلوب:
جملة واحدة فيها توجيه تكتيكي آمن ومباشر بدون تهويل.
`.trim();

  try {
    const result = await geminiClient.generate(prompt);
    if (!result || !result.trim()) return fallback;
    return result.trim();
  } catch {
    return fallback;
  }
}

/**
 * Predictive Consciousness Engine
 * Runs deeper trajectory analysis and stores it in predictive state.
 */
export class PredictiveEngine {
  public static async analyzeTrajectory(): Promise<void> {
    const history = useConsciousnessHistory.getState().history;
    const stats = await fetchOverviewStats();
    if (!stats) {
      console.error("Failed to fetch stats for Predictive Engine");
      return;
    }

    const setPrediction = usePredictiveState.getState().setPrediction;
    const mood = stats.avgMood ?? 0;

    const recentHistory = history.slice(-20).map((point) => ({
      time: point.timestamp ? new Date(point.timestamp).toLocaleTimeString() : "Unknown",
      state: point.emotionalState,
      intensity: point.intensity,
      pattern: point.pattern
    }));

    const prompt = `
أنت "رادار الوعي" في منصة الرحلة.
المطلوب: تقدير احتمالية الانهيار خلال 48-72 ساعة واقتراح تدخلات استباقية.

تاريخ الوعي الأخير:
${JSON.stringify(recentHistory)}

إحصاءات الأسبوع:
- عدم استقرار الطاقة: ${mood < 4 ? "High" : "Normal"}
- متوسط المزاج: ${mood}

أرجع JSON فقط بالشكل التالي:
{
  "probability": number,
  "forecastSummary": string,
  "recommendations": string[],
  "realityBenderActive": boolean
}
`.trim();

    try {
      const result = await geminiClient.generateJSON<{
        probability: number;
        forecastSummary: string;
        recommendations: string[];
        realityBenderActive?: boolean;
      } | null>(prompt);

      if (!result) return;

      setPrediction(result.probability, result.forecastSummary, result.recommendations);

      // Keep growth automation bounded by recent stress trajectory.
      GrowthEngine.monitorSustainability();

      if (result.probability > 0.85 || result.realityBenderActive) {
        const nodes = useMapState.getState().nodes;
        const setDetached = useMapState.getState().setDetached;
        const toxicNodes = nodes.filter((node) => node.ring === "red" || node.isEmergency);
        toxicNodes.forEach((node) => {
          if (!node.detachmentMode) {
            setDetached(node.id, true);
            console.log(`[Reality Bender] Auto-muted toxic node: ${node.label}`);
          }
        });
      }
    } catch (error) {
      console.error("Predictive Engine failed:", error);
    }
  }
}
