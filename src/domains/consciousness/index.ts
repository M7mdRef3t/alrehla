/**
 * Domain: Consciousness — Public API
 */

export type {
  ConsciousnessState,
  AnimationLevel,
  LayoutMode,
  TimeOfDay,
  ThemePreference,
  ConsciousnessTheme,
  ThemeEngineParams,
  DesignTokens,
  ThemeMode,
  ThemeStoreState,
} from "./types";

export { consciousnessEngine } from "./services/engine.service";
export { soundscape } from "./services/soundscape.service";
export { useConsciousnessTheme } from "./hooks/useConsciousnessTheme";
