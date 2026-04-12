/**
 * Domain: Consciousness — Extended Types
 * يوسّع types.ts الأساسية بالأنواع المحددة للـ engine
 */

export type ConsciousnessState = "crisis" | "struggling" | "stable" | "thriving" | "flow";
export type AnimationLevel = "minimal" | "normal" | "rich";
export type LayoutMode = "zen" | "balanced" | "information-dense";
export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";
export type ThemePreference = "light" | "dark" | "auto";

export interface ConsciousnessTheme {
  state: ConsciousnessState;
  colorIntensity: number;
  borderRadius: number;
  spacing: number;
  contrast: number;
  blur: number;
  saturation: number;
  animations: AnimationLevel;
  layout: LayoutMode;
  colors: {
    primary: string;
    background: string;
    text: string;
    accent: string;
  };
  cssVariables: Record<string, string>;
  isDark: boolean;
}

export interface ThemeEngineParams {
  emotionalState: {
    state: "crisis" | "struggling" | "stable" | "thriving";
    tei: number;
    shadowPulse: number;
    engagement: number;
  };
  timeOfDay: TimeOfDay;
  sessionDuration: number;
  preferredMode?: ThemePreference;
}

export interface DesignTokens {
  primaryColor: string;
  accentColor: string;
  spaceVoid: string;
  borderRadius: string;
  blur: string;
  spacing: string;
  pulseDuration: string;
  voiceTone: "calm" | "neon" | "royal" | "default";
  vignetteStrength: number;
  grainOpacity: number;
  chromaticAberration: number;
  ambientVolume: number;
  states?: Record<string, Partial<Omit<DesignTokens, "states">>>;
}

export type ThemeMode = "light" | "dark" | "system";

export interface ThemeStoreState {
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  liteMode: boolean;
  customTokens: DesignTokens;
}
