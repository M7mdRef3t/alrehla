/**
 * Domain: Consciousness — useConsciousnessTheme hook
 *
 * Client-side hook يجمع الـ engine مع الـ theme state
 * بدون تلويث الـ domain باستيراد مباشر من خارجه.
 */

"use client";
import { useCallback } from "react";
import { useThemeState } from "@/domains/consciousness/store/theme.store";
import { consciousnessEngine } from "../services/engine.service";
import { soundscape } from "../services/soundscape.service";
import type { ThemeEngineParams, ConsciousnessTheme } from "../types";

export function useConsciousnessTheme() {
  const { liteMode, customTokens, updateTokens, resetTokens } = useThemeState();

  const applyState = useCallback(
    (params: ThemeEngineParams): ConsciousnessTheme => {
      // Check for custom Design Lab overrides per state
      const stateOverride = customTokens.states?.[params.emotionalState.state];

      const theme = consciousnessEngine.generate(params);

      // Merge Design Lab overrides into domain theme
      if (stateOverride) {
        if (stateOverride.primaryColor) theme.colors.primary = stateOverride.primaryColor;
        if (stateOverride.accentColor) theme.colors.accent = stateOverride.accentColor;
        if (stateOverride.spaceVoid) theme.colors.background = stateOverride.spaceVoid;
        if (stateOverride.borderRadius) theme.borderRadius = parseInt(stateOverride.borderRadius);
        if (stateOverride.blur) theme.blur = parseInt(stateOverride.blur);
      }

      consciousnessEngine.apply(theme);
      consciousnessEngine.save(theme);

      soundscape.sync(theme.state, customTokens.ambientVolume ?? 0.5, !liteMode);

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
