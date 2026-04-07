import { useMemo, type ComponentProps } from "react";
import { AppTransientChromeHost } from "./AppTransientChromeHost";

type TransientChromeProps = ComponentProps<typeof AppTransientChromeHost>;

interface UseAppSurfaceOverlayPropsParams {
  activeBroadcast: TransientChromeProps["activeBroadcast"];
  onDismissBroadcast: TransientChromeProps["onDismissBroadcast"];
  postBreathingMessage: TransientChromeProps["postBreathingMessage"];
  activeIntervention: TransientChromeProps["activeIntervention"];
  onStartInterventionBreathing: TransientChromeProps["onStartInterventionBreathing"];
  onContinueIntervention: TransientChromeProps["onContinueIntervention"];
  postNoiseSessionMessage: TransientChromeProps["postNoiseSessionMessage"];
  pulseDeltaToast: TransientChromeProps["pulseDeltaToast"];
  lastPulseInsights: TransientChromeProps["lastPulseInsights"];
  onClearPulseInsights: TransientChromeProps["onClearPulseInsights"];
}

export function useAppSurfaceOverlayProps({
  activeBroadcast,
  onDismissBroadcast,
  postBreathingMessage,
  activeIntervention,
  onStartInterventionBreathing,
  onContinueIntervention,
  postNoiseSessionMessage,
  pulseDeltaToast,
  lastPulseInsights,
  onClearPulseInsights
}: UseAppSurfaceOverlayPropsParams) {
  const transientChromeProps = useMemo<TransientChromeProps>(
    () => ({
      activeBroadcast,
      onDismissBroadcast,
      postBreathingMessage,
      activeIntervention,
      onStartInterventionBreathing,
      onContinueIntervention,
      postNoiseSessionMessage,
      pulseDeltaToast,
      lastPulseInsights,
      onClearPulseInsights
    }),
    [
      activeBroadcast,
      onDismissBroadcast,
      postBreathingMessage,
      activeIntervention,
      onStartInterventionBreathing,
      onContinueIntervention,
      postNoiseSessionMessage,
      pulseDeltaToast,
      lastPulseInsights,
      onClearPulseInsights
    ]
  );

  return { transientChromeProps };
}
