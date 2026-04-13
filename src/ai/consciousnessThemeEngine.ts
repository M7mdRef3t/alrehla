/**
 * @deprecated
 * Bridge file — يعيد التصدير من domain الجديد / SDK الخارجي.
 * استخدم بدلاً منه:
 *   import { Atmosfera } from '@alrehla/atmosfera'
 */

import { Atmosfera } from "@alrehla/atmosfera";
import { logger } from "@/infrastructure/monitoring";

export const consciousnessEngine = Atmosfera;
export const consciousnessTheme = Atmosfera;

export type {
  EmotionalState as ConsciousnessState,
  AtmosferaTheme as ConsciousnessTheme,
  AnimationLevel,
  LayoutMode,
  AtmosferaParams as ThemeEngineParams,
} from "@alrehla/atmosfera";

export function startConsciousnessTheme(): void {
  logger.log("🎨 Consciousness Theme Engine started (Powered by Atmosfera SDK)");

  const UPDATE_INTERVAL = 10 * 60 * 1000;

  const updateTheme = async () => {
    try {
      const nodes = JSON.parse(localStorage.getItem("dawayir-nodes") || "[]");
      const journalEntries = JSON.parse(localStorage.getItem("dawayir-journal-entries") || "[]");
      const teiHistory = JSON.parse(localStorage.getItem("dawayir-tei-history") || "[]");
      const shadowPulseHistory = JSON.parse(localStorage.getItem("dawayir-shadow-history") || "[]");

      const { emotionalPricingEngine } = await import("./emotionalPricingEngine");
      const emotionalState = emotionalPricingEngine.analyzeUserState({
        userId: "current-user",
        nodes, journalEntries, teiHistory, shadowPulseHistory,
      });

      const hour = new Date().getHours();
      const timeOfDay =
        hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 21 ? "evening" : "night";

      const sessionStart = parseInt(sessionStorage.getItem("dawayir-session-start") || String(Date.now()));
      const sessionDuration = Math.floor((Date.now() - sessionStart) / 60000);

      const theme = Atmosfera.generate({ 
        emotion: {
           state: emotionalState.state as any,
           tension: emotionalState.tei,
           shadow: emotionalState.shadowPulse,
           engagement: emotionalState.engagement
        },
        timeOfDay, 
        sessionMinutes: sessionDuration, 
        mode: "auto" 
      });
      
      Atmosfera.apply(theme);
      try {
         localStorage.setItem("dawayir-consciousness-theme", JSON.stringify(theme));
      } catch { /* noop */}
    } catch (error) {
      logger.error("Failed to update consciousness theme:", error);
    }
  };

  void updateTheme();
  setInterval(() => void updateTheme(), UPDATE_INTERVAL);

  if (!sessionStorage.getItem("dawayir-session-start")) {
    sessionStorage.setItem("dawayir-session-start", String(Date.now()));
  }
}

// Legacy singleton alias
export const ConsciousnessThemeEngine = { instance: Atmosfera };

// Method aliases on the singleton for backwards compat
Object.assign(Atmosfera, {
  generateTheme: (params: Parameters<typeof Atmosfera.generate>[0]) =>
    Atmosfera.generate(params),
  applyTheme: (theme: Parameters<typeof Atmosfera.apply>[0], opts?: { smooth?: boolean }) =>
    Atmosfera.apply(theme, opts),
  handleSensoryInput: (type: 'motion' | 'scroll', value: number) => {
     // Atmosfera doesn't natively have handleSensoryInput yet, stub it to avoid breaking 
  },
  save: (theme: any) => {
     localStorage.setItem("dawayir-consciousness-theme", JSON.stringify(theme));
  }
});
