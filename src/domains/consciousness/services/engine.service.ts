/**
 * Domain: Consciousness — Theme Engine Service
 *
 * ينقل منطق ConsciousnessThemeEngine من src/ai/consciousnessThemeEngine.ts
 * بدون تغيير الـ logic — فقط إعادة تنظيم ضمن الـ domain.
 */

import type {
  ConsciousnessState,
  ConsciousnessTheme,
  AnimationLevel,
  LayoutMode,
  TimeOfDay,
  ThemePreference,
  ThemeEngineParams,
} from "../types";

// ─── الثوابت ───────────────────────────────────────────

const HUE_MAP: Record<ConsciousnessState, number> = {
  crisis: 220,
  struggling: 200,
  stable: 180,
  thriving: 160,
  flow: 280,
};

const BASE_INTENSITY: Record<ConsciousnessState, number> = {
  crisis: 0.2,
  struggling: 0.4,
  stable: 0.7,
  thriving: 0.9,
  flow: 1.0,
};

const BASE_RADIUS: Record<ConsciousnessState, number> = {
  crisis: 24,
  struggling: 20,
  stable: 16,
  thriving: 12,
  flow: 8,
};

const BASE_SPACING: Record<ConsciousnessState, number> = {
  crisis: 1.8,
  struggling: 1.4,
  stable: 1.0,
  thriving: 0.9,
  flow: 0.8,
};

const BASE_CONTRAST: Record<ConsciousnessState, number> = {
  crisis: 1.1,
  struggling: 1.2,
  stable: 1.3,
  thriving: 1.4,
  flow: 1.5,
};

const BASE_BLUR: Record<ConsciousnessState, number> = {
  crisis: 12,
  struggling: 8,
  stable: 4,
  thriving: 0,
  flow: 0,
};

const BASE_SATURATION: Record<ConsciousnessState, number> = {
  crisis: 0.3,
  struggling: 0.5,
  stable: 0.7,
  thriving: 0.9,
  flow: 1.0,
};

// ─── Engine Class ─────────────────────────────────────

export class ConsciousnessEngine {
  generate(params: ThemeEngineParams): ConsciousnessTheme {
    const { emotionalState, timeOfDay, sessionDuration, preferredMode = "auto" } = params;
    const state = this.mapToState(emotionalState.state);

    const colorIntensity = this.colorIntensity(state, emotionalState.tei);
    const borderRadius = this.borderRadius(state, emotionalState.shadowPulse);
    const spacing = this.spacing(state, emotionalState.tei);
    const contrast = this.contrast(state, timeOfDay);
    const blur = this.blur(state, emotionalState.shadowPulse);
    const saturation = this.saturation(state, emotionalState.tei);
    const animations = this.animations(state, sessionDuration);
    const layout = this.layout(state, emotionalState.engagement);
    const { colors, isDark } = this.colors(state, colorIntensity, saturation, timeOfDay, preferredMode);

    const cssVariables = this.css({
      colorIntensity, borderRadius, spacing, contrast,
      blur, saturation, colors, animations,
      vignette: borderRadius > 16 ? 0.3 : 0.1,
      grain: blur > 4 ? 0.15 : 0.05,
      aberration: state === "crisis" ? 0.05 : 0,
    });

    return {
      state, colorIntensity, borderRadius, spacing, contrast,
      blur, saturation, animations, layout, colors, cssVariables, isDark,
    };
  }

  apply(theme: ConsciousnessTheme, smooth = true): void {
    if (typeof window === "undefined") return;
    const root = document.documentElement;

    if (smooth) {
      root.style.transition = `
        background-color 2s cubic-bezier(0.4, 0, 0.2, 1),
        color 2s cubic-bezier(0.4, 0, 0.2, 1),
        border-radius 2s cubic-bezier(0.4, 0, 0.2, 1)
      `.trim();
      setTimeout(() => { root.style.transition = ""; }, 2000);
    }

    requestAnimationFrame(() => {
      Object.entries(theme.cssVariables).forEach(([k, v]) => root.style.setProperty(k, v));
      root.style.setProperty("--teal-400", theme.colors.primary);
      root.style.setProperty("--amber-500", theme.colors.accent);
      root.style.setProperty("--space-void", theme.colors.background);
      root.setAttribute("data-consciousness-state", theme.state);
      root.setAttribute("data-animation-level", theme.animations);
      root.setAttribute("data-layout-mode", theme.layout);
      window.dispatchEvent(new CustomEvent("consciousness-theme-changed", { detail: { isDark: theme.isDark } }));
    });
  }

  save(theme: ConsciousnessTheme): void {
    try { localStorage.setItem("dawayir-consciousness-theme", JSON.stringify(theme)); } catch { /* noop */ }
  }

  load(): ConsciousnessTheme | null {
    try {
      const stored = localStorage.getItem("dawayir-consciousness-theme");
      return stored ? (JSON.parse(stored) as ConsciousnessTheme) : null;
    } catch { return null; }
  }

  // ─── Backwards-compat aliases ───────────────────────
  /** @deprecated use generate() */
  generateTheme(params: ThemeEngineParams): ConsciousnessTheme { return this.generate(params); }
  /** @deprecated use apply() */
  applyTheme(theme: ConsciousnessTheme, opts?: { smooth?: boolean }): void { this.apply(theme, opts?.smooth); }
  /** @deprecated use soundscape.handleSensoryInput() */
  handleSensoryInput(type: "motion" | "scroll", value: number): void {
    // dynamically delegate to avoid circular import
    import("@/domains/consciousness/services/soundscape.service").then(({ soundscape }) => {
      soundscape.handleSensoryInput(type, value);
    }).catch(() => {});
  }

  // ─── Private Calculators ───────────────────────────

  private mapToState(state: "crisis" | "struggling" | "stable" | "thriving"): ConsciousnessState {
    return state as ConsciousnessState;
  }

  private colorIntensity(state: ConsciousnessState, tei: number): number {
    return Math.max(0.1, Math.min(1.0, BASE_INTENSITY[state] * ((100 - tei) / 100)));
  }

  private borderRadius(state: ConsciousnessState, shadowPulse: number): number {
    return Math.round(BASE_RADIUS[state] + (shadowPulse / 100) * 8);
  }

  private spacing(state: ConsciousnessState, tei: number): number {
    return BASE_SPACING[state] + (tei / 100) * 0.5;
  }

  private contrast(state: ConsciousnessState, timeOfDay: TimeOfDay): number {
    return BASE_CONTRAST[state] * (timeOfDay === "night" ? 0.9 : 1.0);
  }

  private blur(state: ConsciousnessState, shadowPulse: number): number {
    return Math.round(BASE_BLUR[state] + (shadowPulse / 100) * 6);
  }

  private saturation(state: ConsciousnessState, tei: number): number {
    return Math.max(0.2, Math.min(1.0, BASE_SATURATION[state] * ((100 - tei) / 100)));
  }

  private animations(state: ConsciousnessState, sessionDuration: number): AnimationLevel {
    if (state === "crisis" || sessionDuration > 60) return "minimal";
    if (state === "flow" && sessionDuration < 30) return "rich";
    return "normal";
  }

  private layout(state: ConsciousnessState, engagement: number): LayoutMode {
    if (state === "crisis") return "zen";
    if (state === "flow" && engagement > 80) return "information-dense";
    return "balanced";
  }

  private colors(
    state: ConsciousnessState,
    colorIntensity: number,
    saturation: number,
    timeOfDay: TimeOfDay,
    preferredMode: ThemePreference,
  ): { colors: ConsciousnessTheme["colors"]; isDark: boolean } {
    const isDark =
      preferredMode === "dark" ||
      (preferredMode === "auto" && (timeOfDay === "evening" || timeOfDay === "night"));

    const hue = HUE_MAP[state];
    const sat = Math.round(saturation * 100);
    const lightness = isDark ? 20 : 95;
    const textLightness = isDark ? 95 : 20;

    return {
      colors: {
        primary: `hsl(${hue}, ${sat}%, ${50 + colorIntensity * 20}%)`,
        background: `hsl(${hue}, ${sat * 0.2}%, ${lightness}%)`,
        text: `hsl(${hue}, ${sat * 0.3}%, ${textLightness}%)`,
        accent: `hsl(${(hue + 30) % 360}, ${sat}%, 60%)`,
      },
      isDark,
    };
  }

  private css(params: {
    colorIntensity: number; borderRadius: number; spacing: number;
    contrast: number; blur: number; saturation: number;
    colors: ConsciousnessTheme["colors"]; animations: AnimationLevel;
    vignette?: number; grain?: number; aberration?: number;
  }): Record<string, string> {
    const { borderRadius, spacing, contrast, blur, colors, animations } = params;
    const durationMap: Record<AnimationLevel, string> = {
      minimal: "600ms", normal: "300ms", rich: "180ms",
    };

    return {
      "--consciousness-primary": colors.primary,
      "--consciousness-background": colors.background,
      "--consciousness-text": colors.text,
      "--consciousness-accent": colors.accent,
      "--consciousness-border-radius": `${borderRadius}px`,
      "--consciousness-spacing": `${spacing}rem`,
      "--consciousness-blur": `${blur}px`,
      "--consciousness-contrast": contrast.toString(),
      "--consciousness-animation-duration": durationMap[animations],
      "--consciousness-layout-transition": "2s cubic-bezier(0.4, 0, 0.2, 1)",
      "--atmosphere-vignette": (params.vignette ?? 0.2).toString(),
      "--atmosphere-grain": (params.grain ?? 0.1).toString(),
      "--atmosphere-aberration": (params.aberration ?? 0).toString(),
    };
  }
}

export const consciousnessEngine = new ConsciousnessEngine();
