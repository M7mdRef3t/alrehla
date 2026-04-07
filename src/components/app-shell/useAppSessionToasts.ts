import { logger } from "../../services/logger";
import { useCallback, useEffect, useRef, useState } from "react";
import { consciousnessService, type MemoryMatch } from "../../services/consciousnessService";
import { getWindowOrNull } from "../../services/clientRuntime";
import type { PulseEnergyConfidence, PulseFocus, PulseMood } from "../../state/pulseState";
import { usePulseState } from "../../state/pulseState";

type PulseDeltaToastTone = "up" | "down" | "same" | "neutral";

export type PulseDeltaToast = {
  title: string;
  body: string;
  tone: PulseDeltaToastTone;
};

interface PulseFeedbackPayload {
  energy: number | null;
  mood: PulseMood | null;
  focus: PulseFocus | null;
  auto?: boolean;
  notes?: string;
  energyReasons?: string[];
  energyConfidence?: PulseEnergyConfidence;
}

function getYesterdayPulseEnergy(logs: Array<{ energy: number; timestamp: number }>, now = Date.now()): number | null {
  const current = new Date(now);
  const yesterdayStart = new Date(current.getFullYear(), current.getMonth(), current.getDate() - 1).getTime();
  const todayStart = new Date(current.getFullYear(), current.getMonth(), current.getDate()).getTime();
  const yesterdayLog = logs.find((entry) => entry.timestamp >= yesterdayStart && entry.timestamp < todayStart);
  return yesterdayLog?.energy ?? null;
}

function buildPulseDeltaToast(currentEnergy: number, yesterdayEnergy: number | null): PulseDeltaToast {
  if (yesterdayEnergy == null) {
    return {
      title: "تم حفظ مؤشر الطاقة",
      body: "مافيش قياس أمبارح للمقارنة.",
      tone: "neutral"
    };
  }

  const delta = currentEnergy - yesterdayEnergy;
  if (delta > 0) {
    return {
      title: `طاقتك النهارده أعلى من أمبارح ↗ (+${delta})`,
      body: `اليوم ${currentEnergy}/10 مقابل ${yesterdayEnergy}/10 أمبارح.`,
      tone: "up"
    };
  }

  if (delta < 0) {
    return {
      title: `طاقتك النهارده أقل من أمبارح ↘ (${delta})`,
      body: `اليوم ${currentEnergy}/10 مقابل ${yesterdayEnergy}/10 أمبارح.`,
      tone: "down"
    };
  }

  return {
    title: "طاقتك زي أمبارح →",
    body: `ثبات جيد: ${currentEnergy}/10 زي القراية اللي قبليها.`,
    tone: "same"
  };
}

export function useAppSessionToasts() {
  const pulseLogs = usePulseState((s) => s.logs);
  const [postNoiseSessionMessage, setPostNoiseSessionMessage] = useState(false);
  const [postBreathingMessage, setPostBreathingMessage] = useState(false);
  const [pulseDeltaToast, setPulseDeltaToast] = useState<PulseDeltaToast | null>(null);
  const [lastPulseInsights, setLastPulseInsights] = useState<MemoryMatch[]>([]);
  const pulseDeltaTimerRef = useRef<number | null>(null);
  const postNoiseTimerRef = useRef<number | null>(null);
  const postBreathingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (pulseDeltaTimerRef.current != null) {
        clearTimeout(pulseDeltaTimerRef.current);
      }
      if (postNoiseTimerRef.current != null) {
        clearTimeout(postNoiseTimerRef.current);
      }
      if (postBreathingTimerRef.current != null) {
        clearTimeout(postBreathingTimerRef.current);
      }
    };
  }, []);

  const showNoiseSessionToast = useCallback(() => {
    setPostNoiseSessionMessage(true);
    if (postNoiseTimerRef.current != null) {
      clearTimeout(postNoiseTimerRef.current);
    }
    const windowRef = getWindowOrNull();
    if (!windowRef) return;
    postNoiseTimerRef.current = windowRef.setTimeout(() => {
      setPostNoiseSessionMessage(false);
      postNoiseTimerRef.current = null;
    }, 4500);
  }, []);

  const showBreathingSessionToast = useCallback(() => {
    setPostBreathingMessage(true);
    if (postBreathingTimerRef.current != null) {
      clearTimeout(postBreathingTimerRef.current);
    }
    const windowRef = getWindowOrNull();
    if (!windowRef) return;
    postBreathingTimerRef.current = windowRef.setTimeout(() => {
      setPostBreathingMessage(false);
      postBreathingTimerRef.current = null;
    }, 4000);
  }, []);

  const capturePulseReflection = useCallback((payload: PulseFeedbackPayload, userId: string | null) => {
    if (payload.energy == null || payload.mood == null || payload.focus == null) return;

    const yesterdayEnergy = getYesterdayPulseEnergy(pulseLogs);
    const nextToast = buildPulseDeltaToast(payload.energy, yesterdayEnergy);
    setPulseDeltaToast(nextToast);

    if (pulseDeltaTimerRef.current != null) {
      clearTimeout(pulseDeltaTimerRef.current);
    }

    const windowRef = getWindowOrNull();
    if (windowRef) {
      pulseDeltaTimerRef.current = windowRef.setTimeout(() => {
        setPulseDeltaToast(null);
        pulseDeltaTimerRef.current = null;
      }, 4600);
    }

    const numericPart = `طاقة ${payload.energy}/10، مزاج ${payload.mood}، تركيز ${payload.focus}`;
    const feelingText = payload.notes ? `${payload.notes.trim()}\n\n(${numericPart})` : numericPart;

    void (async () => {
      try {
        await consciousnessService.saveMoment(userId, feelingText);
        const matches = await consciousnessService.recallSimilarMoments(feelingText, {
          threshold: 0.7,
          limit: 3,
          sources: ["pulse"]
        });
        if (matches && matches.length > 0) {
          setLastPulseInsights(matches.slice(0, 3));
        }
      } catch (err) {
        logger.error("Pulse consciousness wiring error:", err);
      }
    })();
  }, [pulseLogs]);

  const clearPulseInsights = useCallback(() => {
    setLastPulseInsights([]);
  }, []);

  return {
    postNoiseSessionMessage,
    postBreathingMessage,
    pulseDeltaToast,
    lastPulseInsights,
    showNoiseSessionToast,
    showBreathingSessionToast,
    capturePulseReflection,
    clearPulseInsights
  };
}
