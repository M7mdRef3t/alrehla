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

export { Atmosfera as consciousnessEngine, soundscape } from "@alrehla/atmosfera";
export { useConsciousnessTheme } from "./hooks/useConsciousnessTheme";
