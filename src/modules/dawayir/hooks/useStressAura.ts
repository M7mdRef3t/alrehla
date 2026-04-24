/**
 * useStressAura — ربط البصيرة الحيوية بالخريطة 🫀
 * ================================================
 * Hook بيحوّل بيانات الـ stress_level الفسيولوجية
 * إلى حالة بصرية ديناميكية تُعرض على الخريطة والـ HUD.
 */

import { useState, useEffect, useCallback } from "react";
import {
  type BiometricPulse,
  startBiometricStream,
  analyzeStressLevels,
} from "@/services/biometricsBridge";

export type StressCategory = "calm" | "moderate" | "high" | "acute";

export interface StressAura {
  /** 0-100 raw stress level */
  stressLevel: number;
  /** Semantic category */
  category: StressCategory;
  /** CSS color for the aura glow */
  auraColor: string;
  /** 0-1 intensity for opacity/glow strength */
  auraIntensity: number;
  /** Pulse animation duration in seconds (faster = more stressed) */
  pulseDuration: number;
  /** Latest heart rate reading */
  heartRate: number;
  /** Latest HRV reading */
  hrv: number;
  /** Whether we have received at least one reading */
  isConnected: boolean;
  /** Whether the system detected a crisis */
  isCrisis: boolean;
  /** Human-readable status label in Arabic */
  statusLabel: string;
  /** Timestamp of the latest reading */
  lastUpdated: number | null;
}

const CATEGORY_CONFIG: Record<
  StressCategory,
  {
    color: string;
    intensity: number;
    pulseDuration: number;
    label: string;
  }
> = {
  calm: {
    color: "rgba(45, 212, 191, 0.4)",    // Teal glow
    intensity: 0.25,
    pulseDuration: 4,
    label: "هادئ",
  },
  moderate: {
    color: "rgba(250, 204, 21, 0.45)",   // Amber glow
    intensity: 0.5,
    pulseDuration: 2.5,
    label: "متأهب",
  },
  high: {
    color: "rgba(251, 146, 60, 0.5)",    // Orange glow
    intensity: 0.7,
    pulseDuration: 1.8,
    label: "مرتفع",
  },
  acute: {
    color: "rgba(244, 63, 94, 0.6)",     // Rose glow
    intensity: 0.9,
    pulseDuration: 1,
    label: "حاد",
  },
};

const DEFAULT_AURA: StressAura = {
  stressLevel: 0,
  category: "calm",
  auraColor: CATEGORY_CONFIG.calm.color,
  auraIntensity: 0,
  pulseDuration: 4,
  heartRate: 0,
  hrv: 0,
  isConnected: false,
  isCrisis: false,
  statusLabel: "غير متصل",
  lastUpdated: null,
};

export function useStressAura(): StressAura {
  const [aura, setAura] = useState<StressAura>(DEFAULT_AURA);

  const processPulse = useCallback((pulse: BiometricPulse) => {
    const analysis = analyzeStressLevels(pulse);
    const config = CATEGORY_CONFIG[analysis.stressCategory];

    setAura({
      stressLevel: pulse.stressLevel,
      category: analysis.stressCategory,
      auraColor: config.color,
      auraIntensity: config.intensity,
      pulseDuration: config.pulseDuration,
      heartRate: pulse.heartRate,
      hrv: pulse.hrv,
      isConnected: true,
      isCrisis: analysis.isCrisis,
      statusLabel: config.label,
      lastUpdated: pulse.timestamp,
    });
  }, []);

  useEffect(() => {
    const cleanup = startBiometricStream(processPulse);
    return cleanup;
  }, [processPulse]);

  return aura;
}
