import { useCallback, useEffect, useRef, useState } from "react";
import type { Nudge } from "../../services/nudgeEngine";
import { getNextNudge, dismissNudge } from "../../services/nudgeEngine";
import { detectContradictions, dismissMirrorInsight, type MirrorInsight } from "../../services/mirrorLogic";
import { calculateEntropy } from "../../services/predictiveEngine";
import { runtimeEnv } from "../../config/runtimeEnv";
import { useMapState } from "../../state/mapState";
import { usePulseState } from "../../state/pulseState";

interface UseAppMindSignalsParams {
  storedGoalId: string | null | undefined;
  goalId: string;
  showBreathing: boolean;
  showCocoon: boolean;
  openOverlay: (overlay: "nudgeToast" | "mirrorOverlay") => void;
  closeOverlay: (overlay: "nudgeToast" | "mirrorOverlay") => void;
  openCocoonModal: (source?: "auto" | "manual") => void;
}

export function useAppMindSignals({
  storedGoalId,
  goalId,
  showBreathing,
  showCocoon,
  openOverlay,
  closeOverlay,
  openCocoonModal
}: UseAppMindSignalsParams) {
  const nodes = useMapState((s) => s.nodes);
  const lastPulse = usePulseState((s) => s.lastPulse);
  const [activeNudge, setActiveNudge] = useState<Nudge | null>(null);
  const [activeMirrorInsight, setActiveMirrorInsight] = useState<MirrorInsight | null>(null);
  const sessionStartRef = useRef(Date.now());

  useEffect(() => {
    const timer = setTimeout(() => {
      if (runtimeEnv.isDemoMode) return;
      const nudge = getNextNudge();
      if (nudge) {
        setActiveNudge(nudge);
        openOverlay("nudgeToast");
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, [openOverlay]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const timer = setTimeout(() => {
      // Don't fire mirror insights within the first 2 minutes of the session
      // to avoid hijacking the just-completed onboarding navigation
      if (Date.now() - sessionStartRef.current < 2 * 60 * 1000) return;
      if (runtimeEnv.isDemoMode) return;
      const insight = detectContradictions();
      if (insight) {
        setActiveMirrorInsight(insight);
        openOverlay("mirrorOverlay");
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [nodes, openOverlay, storedGoalId]);

  useEffect(() => {
    const insight = calculateEntropy();
    if (insight.state === "CHAOS" && !showBreathing && !showCocoon) {
      setActiveNudge({
        id: `chaos-containment-${Date.now()}`,
        type: "streak_risk",
        title: "محتاج تاخد نَفَس 🍃",
        message: "حاسين إنك مضغوط شوية دلوقتي.. خد دقيقة لنفسك.",
        cta: "افصل شوية",
        priority: 1,
        icon: "🍃"
      });
      openOverlay("nudgeToast");
    }
  }, [goalId, lastPulse, nodes, openOverlay, showBreathing, showCocoon]);

  const handleNudgeDismiss = useCallback(() => {
    if (activeNudge) {
      dismissNudge(activeNudge.id);
    }
    closeOverlay("nudgeToast");
  }, [activeNudge, closeOverlay]);

  const handleNudgeToastClose = useCallback(() => {
    if (activeNudge?.title === "محتاج تاخد نَفَس 🍃") {
      openCocoonModal("manual");
    }
    handleNudgeDismiss();
  }, [activeNudge, handleNudgeDismiss, openCocoonModal]);

  const handleMirrorResolve = useCallback((insight: MirrorInsight) => {
    dismissMirrorInsight(insight.id);
    setActiveMirrorInsight(null);
    closeOverlay("mirrorOverlay");
  }, [closeOverlay]);

  const presentMirrorInsight = useCallback((insight: MirrorInsight) => {
    setActiveMirrorInsight(insight);
    openOverlay("mirrorOverlay");
  }, [openOverlay]);

  return {
    activeNudge,
    activeMirrorInsight,
    handleNudgeToastClose,
    handleMirrorResolve,
    presentMirrorInsight
  };
}
