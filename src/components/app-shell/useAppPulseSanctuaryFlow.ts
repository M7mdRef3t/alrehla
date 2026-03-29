import { useCallback, useEffect, useRef, useState } from "react";
import type { AppShellScreen } from "../../state/appShellNavigationState";
import type { PulseCheckContext } from "../../hooks/usePulseCheckLogic";
import {
  AUTO_COCOON_LAST_SHOWN_DATE_KEY,
  evaluateCocoonOpen
} from "../../app/orchestration/modalOrchestrator";
import { getFromLocalStorage, setInLocalStorage } from "../../services/browserStorage";
import { getWindowOrNull } from "../../services/clientRuntime";
import { AnalyticsEvents, trackEvent } from "../../services/analytics";
import { recordFlowEvent } from "../../services/journeyTracking";
import type { PulseEnergyConfidence, PulseEntry, PulseFocus, PulseMood } from "../../state/pulseState";
import { usePulseState } from "../../state/pulseState";

type ThemePreference = "light" | "dark" | "system";
type PulseCloseReason = "backdrop" | "close_button" | "programmatic" | "browser_close";

type PulseSubmitPayload = {
  energy: number | null;
  mood: PulseMood | null;
  focus: PulseFocus | null;
  auto?: boolean;
  notes?: string;
  phone?: string;
  energyReasons?: string[];
  energyConfidence?: PulseEnergyConfidence;
};

type ConcretePulseSubmitPayload = {
  energy: number;
  mood: PulseMood;
  focus: PulseFocus;
  auto?: boolean;
  notes?: string;
  phone?: string;
  energyReasons?: string[];
  energyConfidence?: PulseEnergyConfidence;
};

interface UseAppPulseSanctuaryFlowParams {
  goalId: string;
  isLandingScreen: boolean;
  showPulseCheck: boolean;
  setShowPulseCheck: (show: boolean) => void;
  pulseCheckContext: PulseCheckContext;
  setPulseCheckContext: (context: PulseCheckContext) => void;
  previewedFeature: string | null;
  forcePulsePreviewOpen: boolean;
  clearPulseCheckPreview: () => void;
  showBreathing: boolean;
  setShowBreathing: (show: boolean) => void;
  setShowCocoon: (show: boolean) => void;
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  authUserId: string | null | undefined;
  shouldPromptAuthAfterPulse: boolean;
  logPulse: (entry: Omit<PulseEntry, "timestamp">) => void;
  capturePulseReflection: (payload: PulseSubmitPayload, userId: string | null) => void;
  snoozeNotifications: (minutes: number) => void;
  openOverlay: (overlay: "noiseSilencingPulse") => void;
  closeOverlay: (overlay: "noiseSilencingPulse") => void;
  navigateToScreen: (screen: AppShellScreen) => boolean;
  openDefaultGoalMap: () => void;
  openDawayirSetup: () => void;
  goToGoals: () => void;
  setStartRecoveryIntent: (payload: ConcretePulseSubmitPayload) => void;
  setLoginIntent: () => void;
  setShowAuthModal: (show: boolean) => void;
  clearPostAuthState: () => void;
  showNoiseSessionToast: () => void;
  showBreathingSessionToast: () => void;
  skipNextPulseCheck: () => void;
}

function isDefaultPulseSubmit(payload: PulseSubmitPayload) {
  const notes = payload.notes?.trim() ?? "";
  return payload.energy == null && payload.mood == null && payload.focus == null && notes.length === 0;
}

function hasConcretePulseSelection(payload: PulseSubmitPayload): payload is ConcretePulseSubmitPayload {
  return payload.energy != null && payload.mood != null && payload.focus != null;
}

function buildAutoPulsePayload(): PulseSubmitPayload {
  return {
    energy: null,
    mood: null,
    focus: null,
    auto: true
  };
}

export function useAppPulseSanctuaryFlow({
  goalId,
  isLandingScreen,
  showPulseCheck,
  setShowPulseCheck,
  pulseCheckContext,
  setPulseCheckContext,
  previewedFeature,
  forcePulsePreviewOpen,
  clearPulseCheckPreview,
  showBreathing,
  setShowBreathing,
  setShowCocoon,
  theme,
  setTheme,
  authUserId,
  shouldPromptAuthAfterPulse,
  logPulse,
  capturePulseReflection,
  snoozeNotifications,
  openOverlay,
  closeOverlay,
  navigateToScreen,
  openDefaultGoalMap,
  openDawayirSetup,
  goToGoals,
  setStartRecoveryIntent,
  setLoginIntent,
  setShowAuthModal,
  clearPostAuthState,
  showNoiseSessionToast,
  showBreathingSessionToast,
  skipNextPulseCheck
}: UseAppPulseSanctuaryFlowParams) {
  const [returnToGoalOnBreathingClose, setReturnToGoalOnBreathingClose] = useState(false);
  const [suppressLowPulseCocoonUntil, setSuppressLowPulseCocoonUntil] = useState(0);
  const [suppressCocoonReopen, setSuppressCocoonReopen] = useState(false);
  const [themeBeforePulse, setThemeBeforePulse] = useState<ThemePreference | null>(null);
  const breathingFromCocoonRef = useRef(false);
  const cocoonSuppressTimerRef = useRef<number | null>(null);
  const cocoonSuppressedUntilRef = useRef(0);
  const lastAutoCocoonOpenAtRef = useRef(0);
  const pulseOpenedAtRef = useRef<number | null>(null);
  const lastPulse = usePulseState((state) => state.lastPulse);

  const openCocoonModal = useCallback((source: "auto" | "manual" = "manual") => {
    const now = Date.now();
    const decision = evaluateCocoonOpen({
      source,
      isLandingScreen,
      now,
      suppressedUntil: cocoonSuppressedUntilRef.current,
      suppressReopen: suppressCocoonReopen,
      showBreathing,
      lastAutoOpenAt: lastAutoCocoonOpenAtRef.current,
      lastShownDate: getFromLocalStorage(AUTO_COCOON_LAST_SHOWN_DATE_KEY)
    });
    if (!decision.shouldOpen) return;

    if (decision.nextLastAutoOpenAt != null) {
      lastAutoCocoonOpenAtRef.current = decision.nextLastAutoOpenAt;
    }
    if (decision.nextLastShownDate != null) {
      setInLocalStorage(AUTO_COCOON_LAST_SHOWN_DATE_KEY, decision.nextLastShownDate);
    }

    setShowCocoon(true);
  }, [isLandingScreen, setShowCocoon, showBreathing, suppressCocoonReopen]);

  const suppressCocoonFor = useCallback((ms = 2000) => {
    cocoonSuppressedUntilRef.current = Date.now() + ms;
    setSuppressCocoonReopen(true);
    if (cocoonSuppressTimerRef.current != null) {
      clearTimeout(cocoonSuppressTimerRef.current);
    }

    const windowRef = getWindowOrNull();
    if (!windowRef) return;

    cocoonSuppressTimerRef.current = windowRef.setTimeout(() => {
      setSuppressCocoonReopen(false);
      cocoonSuppressedUntilRef.current = 0;
      cocoonSuppressTimerRef.current = null;
    }, ms);
  }, []);

  useEffect(() => {
    return () => {
      if (cocoonSuppressTimerRef.current != null) {
        clearTimeout(cocoonSuppressTimerRef.current);
      }
      cocoonSuppressedUntilRef.current = 0;
    };
  }, []);

  useEffect(() => {
    if (showPulseCheck) {
      pulseOpenedAtRef.current = Date.now();
      recordFlowEvent("pulse_opened");
    }
  }, [showPulseCheck]);

  const closePulseCheck = useCallback((completed = false, closeReason?: PulseCloseReason) => {
    if (!completed && pulseOpenedAtRef.current != null) {
      recordFlowEvent("pulse_abandoned", { closeReason });
    }

    pulseOpenedAtRef.current = null;
    // IMPORTANT: Must set isOpen=false AND context="regular" in ONE call.
    // Previously two separate calls caused a stale-closure bug:
    // setShowPulseCheck(false) → isOpen=false ✓
    // setPulseCheckContext("regular") → re-read stale isOpen=true → isOpen=true again ✗
    setShowPulseCheck(false);
  }, [setShowPulseCheck]);

  useEffect(() => {
    const onPageHide = () => {
      if (!showPulseCheck) return;
      closePulseCheck(false, "browser_close");
    };

    const windowRef = getWindowOrNull();
    if (!windowRef) return;

    windowRef.addEventListener("pagehide", onPageHide);
    return () => windowRef.removeEventListener("pagehide", onPageHide);
  }, [closePulseCheck, showPulseCheck]);

  const handlePulseGateSubmit = useCallback((payload: PulseSubmitPayload) => {
    recordFlowEvent("pulse_completed");
    if (isDefaultPulseSubmit(payload)) recordFlowEvent("pulse_completed_without_choices");
    else recordFlowEvent("pulse_completed_with_choices");

    trackEvent(AnalyticsEvents.MICRO_COMPASS_COMPLETED, {
      gate: "pulse",
      pulse_energy: payload.energy ?? "none",
      pulse_mood: payload.mood ?? "none",
      pulse_focus: payload.focus ?? "none",
      pulse_auto: payload.auto ?? false
    });

    closePulseCheck(true, "programmatic");

    if (shouldPromptAuthAfterPulse) {
      recordFlowEvent("auth_gate_opened", {
        meta: {
          mode: hasConcretePulseSelection(payload) ? "start_recovery" : "login"
        }
      });

      if (hasConcretePulseSelection(payload)) {
        setStartRecoveryIntent(payload);
      } else {
        setLoginIntent();
      }
      setShowAuthModal(true);
      return;
    }

    if (hasConcretePulseSelection(payload)) {
      logPulse(payload);
    }

    const isLow = payload.energy != null && payload.energy <= 3;
    const isAngry = payload.mood === "angry";

    if (isLow) {
      if (themeBeforePulse == null) {
        setThemeBeforePulse(theme);
      }
      setTheme("dark");
      snoozeNotifications(240);
    }

    openDawayirSetup();

    if (isAngry) {
      openOverlay("noiseSilencingPulse");
      return;
    }

    if (isLow) {
      openCocoonModal("auto");
    }
  }, [
    closePulseCheck,
    logPulse,
    openCocoonModal,
    openDawayirSetup,
    openOverlay,
    setLoginIntent,
    setShowAuthModal,
    setStartRecoveryIntent,
    setTheme,
    shouldPromptAuthAfterPulse,
    snoozeNotifications,
    theme,
    themeBeforePulse
  ]);

  const handlePulseSubmit = useCallback((payload: PulseSubmitPayload) => {
    recordFlowEvent("pulse_completed");
    if (isDefaultPulseSubmit(payload)) recordFlowEvent("pulse_completed_without_choices");
    else recordFlowEvent("pulse_completed_with_choices");

    if (hasConcretePulseSelection(payload)) {
      logPulse(payload);
      capturePulseReflection(payload, authUserId ?? null);
    }

    closePulseCheck(true, "programmatic");

    // Note: CRM phone sync now happens instantly in handleTacticalAnalysis (PulseCheckModal)
    // at the moment the user confirms their phone number — no need to sync again here.

    const isLow = payload.energy != null && payload.energy <= 3;
    const isAngry = payload.mood === "angry";

    if (isLow) {
      if (themeBeforePulse == null) {
        setThemeBeforePulse(theme);
      }
      setTheme("dark");
      snoozeNotifications(240);
    } else if (themeBeforePulse != null) {
      setTheme(themeBeforePulse);
      setThemeBeforePulse(null);
    }

    if (isAngry) {
      openOverlay("noiseSilencingPulse");
      return;
    }

    if (isLow) {
      openCocoonModal("auto");
    }
  }, [
    authUserId,
    capturePulseReflection,
    closePulseCheck,
    logPulse,
    openCocoonModal,
    openOverlay,
    setTheme,
    snoozeNotifications,
    theme,
    themeBeforePulse
  ]);

  const openRegularPulseCheck = useCallback(() => {
    setPulseCheckContext("regular");
    setShowPulseCheck(true);
  }, [setPulseCheckContext, setShowPulseCheck]);

  const handlePulseOverlaySubmit = useCallback((payload: PulseSubmitPayload) => {
    if (pulseCheckContext === "start_recovery") {
      handlePulseGateSubmit(payload);
      return;
    }

    handlePulseSubmit(payload);
  }, [handlePulseGateSubmit, handlePulseSubmit, pulseCheckContext]);

  const handlePulseOverlayClose = useCallback((reason?: PulseCloseReason) => {
    if (reason === "close_button") {
      const autoPayload = buildAutoPulsePayload();
      if (pulseCheckContext === "start_recovery") {
        if (hasConcretePulseSelection(autoPayload)) {
          logPulse(autoPayload);
        }
        clearPulseCheckPreview();
        closePulseCheck(true, "programmatic");
        openDawayirSetup();
        return;
      }

      clearPulseCheckPreview();
      closePulseCheck(false, "close_button");
      return;
    }

    clearPulseCheckPreview();
    closePulseCheck(false, reason);
  }, [clearPulseCheckPreview, closePulseCheck, logPulse, openDawayirSetup, pulseCheckContext]);

  const handleCocoonStart = useCallback(() => {
    breathingFromCocoonRef.current = true;
    setShowCocoon(false);
    suppressCocoonFor(90000);
    setReturnToGoalOnBreathingClose(true);
    skipNextPulseCheck();

    if (goalId === "unknown") {
      openDefaultGoalMap();
    } else {
      void navigateToScreen("map");
    }

    trackEvent(AnalyticsEvents.BREATHING_OPENED, { source: "cocoon" });
    setShowBreathing(true);
  }, [
    goalId,
    navigateToScreen,
    openDefaultGoalMap,
    setShowBreathing,
    setShowCocoon,
    skipNextPulseCheck,
    suppressCocoonFor
  ]);

  const handleCocoonSkip = useCallback(() => {
    breathingFromCocoonRef.current = false;
    setShowCocoon(false);
    suppressCocoonFor(4000);
    goToGoals();
  }, [goToGoals, setShowCocoon, suppressCocoonFor]);

  const handleCocoonClose = useCallback(() => {
    breathingFromCocoonRef.current = false;
    setShowCocoon(false);
  }, [setShowCocoon]);

  const handleNoiseSessionComplete = useCallback(() => {
    closeOverlay("noiseSilencingPulse");
    showNoiseSessionToast();
  }, [closeOverlay, showNoiseSessionToast]);

  const handleBreathingOverlayClose = useCallback(() => {
    const fromCocoon = breathingFromCocoonRef.current;
    const lowPulseRecently = Boolean(
      lastPulse &&
      (Date.now() - (lastPulse.timestamp ?? 0) < 24 * 60 * 60 * 1000) &&
      lastPulse.energy <= 3
    );
    const shouldForceMapAfterBreathing = fromCocoon || returnToGoalOnBreathingClose || lowPulseRecently;

    breathingFromCocoonRef.current = false;
    setShowBreathing(false);
    setShowCocoon(false);
    suppressCocoonFor(shouldForceMapAfterBreathing ? 90_000 : 8_000);

    if (shouldForceMapAfterBreathing) {
      setSuppressLowPulseCocoonUntil(Date.now() + 20 * 60 * 1000);
      setReturnToGoalOnBreathingClose(false);
      skipNextPulseCheck();
      if (goalId === "unknown") {
        openDefaultGoalMap();
      } else {
        void navigateToScreen("map");
      }
      showBreathingSessionToast();
    }
  }, [
    goalId,
    lastPulse,
    navigateToScreen,
    openDefaultGoalMap,
    returnToGoalOnBreathingClose,
    setShowBreathing,
    setShowCocoon,
    showBreathingSessionToast,
    skipNextPulseCheck,
    suppressCocoonFor
  ]);

  const handleAuthModalNotNow = useCallback((pulseToSave?: PulseSubmitPayload) => {
    setShowAuthModal(false);
    clearPostAuthState();
    skipNextPulseCheck();
    if (pulseToSave && hasConcretePulseSelection(pulseToSave)) {
      logPulse(pulseToSave);
    }
    openDawayirSetup();
  }, [clearPostAuthState, logPulse, openDawayirSetup, setShowAuthModal, skipNextPulseCheck]);

  return {
    openCocoonModal,
    openRegularPulseCheck,
    isLowPulseCocoonSuppressed: Date.now() < suppressLowPulseCocoonUntil,
    isPulseOverlayOpen: showPulseCheck || previewedFeature === "pulse_check" || forcePulsePreviewOpen,
    handlePulseOverlaySubmit,
    handlePulseOverlayClose,
    handleCocoonStart,
    handleCocoonSkip,
    handleCocoonClose,
    handleNoiseSessionComplete,
    handleBreathingOverlayClose,
    handleAuthModalNotNow
  };
}
