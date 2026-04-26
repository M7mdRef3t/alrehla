import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import type { Nudge } from "@/services/nudgeEngine";
import { getNextNudge, dismissNudge } from "@/services/nudgeEngine";
import { detectContradictions, dismissMirrorInsight, type MirrorInsight } from "@/services/mirrorLogic";
import { calculateEntropy } from "@/services/predictiveEngine";
import { runtimeEnv } from "@/config/runtimeEnv";
import { useMapState } from '@/modules/map/dawayirIndex';
import { usePulseState } from "@/domains/consciousness/store/pulse.store";
import { useGamificationState } from "@/domains/gamification/store/gamification.store";
import { useNotifications } from "@/hooks/useNotifications";

interface UseAppMindSignalsParams {
  storedGoalId: string | null | undefined;
  goalId: string;
  showBreathing: boolean;
  showCocoon: boolean;
  /** لو true، لا تُطلق أي nudge أو mirrorOverlay — المستخدم في flow نشط */
  activeFlows?: boolean;
  openOverlay: (overlay: "nudgeToast" | "mirrorOverlay" | "journeyGuideChat" | "evolutionHub") => void;
  closeOverlay: (overlay: "nudgeToast" | "mirrorOverlay") => void;
  openCocoonModal: (source?: "auto" | "manual") => void;
  /** يفتح pulse check بالطريقة الصحيحة (setPulseCheck) لا عبر setOverlay */
  openPulseCheck?: () => void;
  /** يفتح ShareStats overlay للمشاركة */
  openShareStats?: () => void;
  /** يفتح سجل القيادة */
  openChronicle?: () => void;
}

const noop = () => {};

export function useAppMindSignals({
  storedGoalId,
  goalId,
  showBreathing,
  showCocoon,
  activeFlows = false,
  openOverlay,
  closeOverlay,
  openCocoonModal,
  openPulseCheck = noop,
  openShareStats = noop,
  openChronicle = noop
}: UseAppMindSignalsParams) {
  const nodes = useMapState((s) => s.nodes);
  const lastPulse = usePulseState((s) => s.lastPulse);
  const lastNewChronicle = useGamificationState((s) => s.lastNewChronicle);
  const [activeNudge, setActiveNudge] = useState<Nudge | null>(null);
  const [activeMirrorInsight, setActiveMirrorInsight] = useState<MirrorInsight | null>(null);
  const sessionStartRef = useRef(Date.now());
  const { sendNotification } = useNotifications();

  // Sovereign Chronicles Trigger
  // We track the last-seen chronicle ID so the overlay only fires once
  // per NEW chronicle, not on every boot (lastNewChronicle is persisted).
  const lastSeenChronicleId = useRef<string | null>(null);
  useEffect(() => {
    if (!lastNewChronicle || activeFlows) return;
    if (lastNewChronicle.id === lastSeenChronicleId.current) return;
    lastSeenChronicleId.current = lastNewChronicle.id;
    openChronicle();
  }, [lastNewChronicle, activeFlows, openChronicle]);

  useEffect(() => {
    const timer = setTimeout(() => {
      // لا تُطلق أي nudge لو المستخدم في flow نشط (onboarding، إلخ)
      if (runtimeEnv.isDemoMode || activeFlows) return;
      const nudge = getNextNudge();
      if (nudge) {
        setActiveNudge(nudge);
        openOverlay("nudgeToast");
        if (typeof document !== 'undefined' && document.hidden) {
          sendNotification(nudge.title, { body: nudge.message, data: nudge.ctaAction });
        }
      }
    }, 8000);
  
    return () => clearTimeout(timer);
  }, [openOverlay, activeFlows, lastPulse, sendNotification]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const timer = setTimeout(() => {
      // لا تُطلق mirrorOverlay لو المستخدم في flow نشط
      if (activeFlows) return;
      // Don't fire mirror insights within the first 2 minutes of the session
      if (Date.now() - sessionStartRef.current < 2 * 60 * 1000) return;
      if (runtimeEnv.isDemoMode) return;
      const insight = detectContradictions();
      if (insight) {
        setActiveMirrorInsight(insight);
        openOverlay("mirrorOverlay");
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [nodes, openOverlay, storedGoalId, activeFlows]);

  useEffect(() => {
    // لا تُطلق حتى chaos nudge لو في flow نشط أو فيه nudge طالع فعلاً
    if (activeFlows || activeNudge) return;

    const timer = setTimeout(() => {
      const insight = calculateEntropy();
      if (insight.state === "CHAOS" && !showBreathing && !showCocoon) {
        const nudge = {
          id: `chaos-containment-${Date.now()}`,
          type: "streak_risk" as const,
          title: "محتاج تاخد نَفَس 🍃",
          message: "حاسين إنك مضغوط شوية دلوقتي.. خد دقيقة لنفسك.",
          cta: "افصل شوية",
          ctaAction: "dismiss_only" as const,
          priority: 1 as const,
          icon: "🍃"
        };
        setActiveNudge(nudge);
        openOverlay("nudgeToast");
        if (typeof document !== 'undefined' && document.hidden) {
          sendNotification(nudge.title, { body: nudge.message });
        }
      }
    }, 5000); // Wait 5 seconds before checking for chaos to avoid noise

    return () => clearTimeout(timer);
  }, [goalId, lastPulse, nodes, openOverlay, showBreathing, showCocoon, activeFlows, sendNotification, activeNudge]);

  const handleNudgeDismiss = useCallback(() => {
    if (activeNudge) {
      dismissNudge(activeNudge.id);
    }
    closeOverlay("nudgeToast");
  }, [activeNudge, closeOverlay]);

  /**
   * يُطلَق عند الضغط على زر الـ CTA في الـ nudge toast.
   * لا يعمل أي navigation — فقط overlays آمنة أو dismiss.
   */
  const handleNudgeCtaAction = useCallback(() => {
    const action = activeNudge?.ctaAction;
    if (action === "pulse_check") {
      openPulseCheck();
    } else if (action === "open_assistant") {
      openOverlay("journeyGuideChat");
    } else if (action === "share_stats") {
      // يفتح ShareStats overlay — آمن ولا يغيّر الشاشة
      openShareStats();
    } else if (action === "open_store") {
      openOverlay("evolutionHub");
    }
    handleNudgeDismiss();
  }, [activeNudge, openOverlay, openPulseCheck, openShareStats, handleNudgeDismiss]);

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

  return useMemo(() => ({
    activeNudge,
    activeMirrorInsight,
    handleNudgeToastClose,
    handleNudgeCtaAction,
    handleMirrorResolve,
    presentMirrorInsight
  }), [
    activeNudge,
    activeMirrorInsight,
    handleNudgeToastClose,
    handleNudgeCtaAction,
    handleMirrorResolve,
    presentMirrorInsight
  ]);
}
