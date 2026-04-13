/**
 * Domain: Consciousness — useConsciousnessTheme hook
 *
 * Client-side hook يجمع الـ engine مع الـ theme state
 * بدون تلويث الـ domain باستيراد مباشر من خارجه.
 */

"use client";
import { useCallback } from "react";
import { useThemeState } from "@/domains/consciousness/store/theme.store";
import { Atmosfera } from "@alrehla/atmosfera";
import type { AtmosferaTheme } from "@alrehla/atmosfera";
import type { ThemeEngineParams } from "../types";

export function useConsciousnessTheme() {
  const { liteMode, customTokens, updateTokens, resetTokens } = useThemeState();

  const applyState = useCallback(
    (params: ThemeEngineParams): AtmosferaTheme => {
      // Check for custom Design Lab overrides per state
      const stateOverride = customTokens.states?.[params.emotionalState.state];

      const theme = Atmosfera.generate({
        emotion: {
           state: params.emotionalState.state,
           tension: params.emotionalState.tei,
           shadow: params.emotionalState.shadowPulse,
           engagement: params.emotionalState.engagement
        },
        timeOfDay: params.timeOfDay,
        sessionMinutes: params.sessionDuration,
        mode: params.preferredMode
      });

      // Merge Design Lab overrides into domain theme
      if (stateOverride) {
        if (stateOverride.primaryColor) theme.colors.primary = stateOverride.primaryColor;
        if (stateOverride.accentColor) theme.colors.accent = stateOverride.accentColor;
        if (stateOverride.spaceVoid) theme.colors.background = stateOverride.spaceVoid;
        if (stateOverride.borderRadius) theme.borderRadius = parseInt(stateOverride.borderRadius);
        if (stateOverride.blur) theme.blur = parseInt(stateOverride.blur);
      }

      Atmosfera.apply(theme);
      
      try {
         localStorage.setItem("dawayir-consciousness-theme", JSON.stringify(theme));
      } catch { /* noop */ }

      Atmosfera.soundscape.sync(theme.state, customTokens.ambientVolume ?? 0.5, !liteMode);

      return theme;
    },
    [customTokens, liteMode]
  );

  return {
    applyState,
    updateTokens,
    resetTokens,
    liteMode,
    customTokens,
  };
}
