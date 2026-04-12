/**
 * @deprecated
 * Bridge file — يعيد التصدير من domain الجديد.
 * استخدم بدلاً منه:
 *   import { consciousnessEngine } from '@/domains/consciousness'
 */

export {
  consciousnessEngine as consciousnessTheme,
  consciousnessEngine,
} from "@/domains/consciousness";

export type {
  ConsciousnessState,
  ConsciousnessTheme,
  AnimationLevel,
  LayoutMode,
  ThemeEngineParams,
} from "@/domains/consciousness";

// startConsciousnessTheme — facade for backwards compat
import { consciousnessEngine } from "@/domains/consciousness";
import { soundscape } from "@/domains/consciousness";
import { logger } from "@/infrastructure/monitoring";

export function startConsciousnessTheme(): void {
  logger.log("🎨 Consciousness Theme Engine started");

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

      const theme = consciousnessEngine.generate({ emotionalState, timeOfDay, sessionDuration, preferredMode: "auto" });
      consciousnessEngine.apply(theme);
      consciousnessEngine.save(theme);
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
export const ConsciousnessThemeEngine = { instance: consciousnessEngine };

// Method aliases on the singleton for backwards compat
// SovereignReceiver uses: consciousnessTheme.generateTheme() / consciousnessTheme.applyTheme()
// AppRuntimeControllers uses: consciousnessTheme.handleSensoryInput()
Object.assign(consciousnessEngine, {
  generateTheme: (params: Parameters<typeof consciousnessEngine.generate>[0]) =>
    consciousnessEngine.generate(params),
  applyTheme: (theme: Parameters<typeof consciousnessEngine.apply>[0], opts?: { smooth?: boolean }) =>
    consciousnessEngine.apply(theme, opts?.smooth),
  handleSensoryInput: (type: 'motion' | 'scroll', value: number) => {
    soundscape.handleSensoryInput(type, value);
  },
});
