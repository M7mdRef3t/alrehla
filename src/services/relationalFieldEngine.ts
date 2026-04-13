import { getDawayirSignalHistory } from "@/modules/recommendation/recommendationBus";
import { useMapState } from '@/modules/map/dawayirIndex';
import { usePulseState } from "@/domains/consciousness/store/pulse.store";
import { useShadowPulseState } from "@/domains/consciousness/store/shadowPulse.store";
import { calculateEntropy } from "./predictiveEngine";
import { getRecentJourneyEvents } from "./journeyTracking";

import {
  buildRelationalFieldSnapshot as sdkBuildRelationalFieldSnapshot,
  WINDOW_MS
} from "@alrehla/dawayir";

export * from "@alrehla/dawayir";

export function computeRelationalFieldSnapshot(now = Date.now()) {
  const entropy = calculateEntropy();
  return sdkBuildRelationalFieldSnapshot({
    now,
    nodes: useMapState.getState().nodes as any,
    pulses: usePulseState.getState().logs as any,
    signals: getDawayirSignalHistory(WINDOW_MS) as any,
    journeyEvents: getRecentJourneyEvents(1200) as any,
    shadowScores: useShadowPulseState.getState().scores,
    entropyScore: entropy.entropyScore
  });
}
