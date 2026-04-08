import { logger } from "../services/logger";
/**
 * CONSCIOUSNESS_THEME_ENGINE.ts — محرك الواجهة الواعية
 * =====================================================
 * "الواجهة تتغير بناءً على حالة المستخدم النفسية"
 *
 * المبدأ:
 * - في الأزمة: ألوان هادية، مسافات كبيرة، تركيز على الأساسيات
 * - في التدفق (Flow): ألوان حية، كل الفيتشرز ظاهرة، تفاعل غني
 */

import type { UserEmotionalState } from "./emotionalPricingEngine";

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 Consciousness Theme Types
// ═══════════════════════════════════════════════════════════════════════════

export type ConsciousnessState = "crisis" | "struggling" | "stable" | "thriving" | "flow";

export type AnimationLevel = "minimal" | "normal" | "rich";
export type LayoutMode = "zen" | "balanced" | "information-dense";

export interface ConsciousnessTheme {
  // الحالة
  state: ConsciousnessState;

  // المعاملات البصرية
  colorIntensity: number; // 0-1 (كثافة الألوان)
  borderRadius: number; // px (انحناء الزوايا)
  spacing: number; // multiplier (المسافات)
  contrast: number; // multiplier (التباين)
  blur: number; // px (ضبابية الخلفية)
  saturation: number; // 0-1 (تشبع الألوان)

  // السلوك
  animations: AnimationLevel;
  layout: LayoutMode;

  // الألوان الديناميكية
  colors: {
    primary: string; // hsl format
    background: string;
    text: string;
    accent: string;
  };

  // CSS Variables (للتطبيق المباشر)
  cssVariables: Record<string, string>;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🧠 Consciousness Theme Engine
// ═══════════════════════════════════════════════════════════════════════════

export class ConsciousnessThemeEngine {
  /**
   * ─────────────────────────────────────────────────────────────────
   * توليد Theme بناءً على حالة المستخدم
   * ─────────────────────────────────────────────────────────────────
   */
  generateTheme(params: {
    emotionalState: UserEmotionalState;
    timeOfDay: "morning" | "afternoon" | "evening" | "night";
    sessionDuration: number; // minutes
    preferredMode?: "light" | "dark" | "auto";
  }): ConsciousnessTheme {
    const { emotionalState, timeOfDay, sessionDuration, preferredMode = "auto" } = params;

    // 1. تحديد الحالة الأساسية
    const state = this.mapEmotionalToConsciousnessState(emotionalState.state);

    // 2. حساب المعاملات البصرية
    const colorIntensity = this.calculateColorIntensity(state, emotionalState.tei);
    const borderRadius = this.calculateBorderRadius(state, emotionalState.shadowPulse);
    const spacing = this.calculateSpacing(state, emotionalState.tei);
    const contrast = this.calculateContrast(state, timeOfDay);
    const blur = this.calculateBlur(state, emotionalState.shadowPulse);
    const saturation = this.calculateSaturation(state, emotionalState.tei);

    // 3. تحديد السلوك
    const animations = this.determineAnimationLevel(state, sessionDuration);
    const layout = this.determineLayoutMode(state, emotionalState.engagement);

    // 4. توليد الألوان الديناميكية
    const colors = this.generateColors({
      state,
      colorIntensity,
      saturation,
      timeOfDay,
      preferredMode,
    });

    // 5. توليد CSS Variables
    const cssVariables = this.generateCSSVariables({
      colorIntensity,
      borderRadius,
      spacing,
      contrast,
      blur,
      saturation,
      colors,
      animations,
    });

    return {
      state,
      colorIntensity,
      borderRadius,
      spacing,
      contrast,
      blur,
      saturation,
      animations,
      layout,
      colors,
      cssVariables,
    };
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * تطبيق Theme على الصفحة (مع Smooth Transitions)
   * ─────────────────────────────────────────────────────────────────
   */
  applyTheme(theme: ConsciousnessTheme, options?: { smooth?: boolean }): void {
    const root = document.documentElement;
    const smooth = options?.smooth ?? true;

    // إضافة transition للـ root (فقط للخصائص المتغيرة لتجنب الـ UI Freeze)
    if (smooth) {
      root.style.transition = `
        background-color 2s cubic-bezier(0.4, 0, 0.2, 1),
        color 2s cubic-bezier(0.4, 0, 0.2, 1),
        border-radius 2s cubic-bezier(0.4, 0, 0.2, 1),
        filter 2s cubic-bezier(0.4, 0, 0.2, 1),
        backdrop-filter 2s cubic-bezier(0.4, 0, 0.2, 1)
      `.trim();
    }

    // استخدام requestAnimationFrame للـ Performance
    requestAnimationFrame(() => {
      // تطبيق CSS Variables
      Object.entries(theme.cssVariables).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });

      // تطبيق Data Attributes للـ Layout Mode
      root.setAttribute("data-consciousness-state", theme.state);
      root.setAttribute("data-animation-level", theme.animations);
      root.setAttribute("data-layout-mode", theme.layout);

      console.warn("🎨 Consciousness Theme applied:", theme.state);
    });

    // إزالة transition بعد انتهاء التحول
    if (smooth) {
      setTimeout(() => {
        root.style.transition = "";
      }, 2000);
    }
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * Helpers
   * ─────────────────────────────────────────────────────────────────
   */
  private mapEmotionalToConsciousnessState(
    emotionalState: UserEmotionalState["state"]
  ): ConsciousnessState {
    // تحويل من Emotional State لـ Consciousness State
    const mapping: Record<UserEmotionalState["state"], ConsciousnessState> = {
      crisis: "crisis",
      struggling: "struggling",
      stable: "stable",
      thriving: "thriving",
    };

    return mapping[emotionalState] || "stable";
  }

  private calculateColorIntensity(state: ConsciousnessState, tei: number): number {
    // كلما زاد TEI (الفوضى)، قلّت كثافة الألوان
    const baseIntensity = {
      crisis: 0.2, // ألوان باهتة جداً
      struggling: 0.4,
      stable: 0.7,
      thriving: 0.9,
      flow: 1.0, // ألوان حية
    }[state];

    // تعديل بناءً على TEI
    const adjustment = (100 - tei) / 100; // عكسي: TEI عالي = intensity منخفض
    return Math.max(0.1, Math.min(1.0, baseIntensity * adjustment));
  }

  private calculateBorderRadius(state: ConsciousnessState, shadowPulse: number): number {
    // كلما زاد الضغط النفسي، زادت نعومة الزوايا
    const baseRadius = {
      crisis: 24, // زوايا ناعمة جداً (مريحة)
      struggling: 20,
      stable: 16,
      thriving: 12,
      flow: 8, // زوايا حادة (نشطة)
    }[state];

    // تعديل بناءً على Shadow Pulse
    const adjustment = shadowPulse / 100;
    return Math.round(baseRadius + adjustment * 8);
  }

  private calculateSpacing(state: ConsciousnessState, tei: number): number {
    // كلما زادت الفوضى، زادت المسافات (تنفس)
    const baseSpacing = {
      crisis: 1.8, // مسافات كبيرة
      struggling: 1.4,
      stable: 1.0,
      thriving: 0.9,
      flow: 0.8, // مسافات ضيقة (كثافة معلومات)
    }[state];

    // تعديل بناءً على TEI
    const adjustment = tei / 100;
    return baseSpacing + adjustment * 0.5;
  }

  private calculateContrast(
    state: ConsciousnessState,
    timeOfDay: "morning" | "afternoon" | "evening" | "night"
  ): number {
    const baseContrast = {
      crisis: 1.1, // تباين خفيف
      struggling: 1.2,
      stable: 1.3,
      thriving: 1.4,
      flow: 1.5, // تباين عالي
    }[state];

    // تعديل بناءً على الوقت (ليلاً: تباين أقل)
    const timeAdjustment = timeOfDay === "night" ? 0.9 : 1.0;

    return baseContrast * timeAdjustment;
  }

  private calculateBlur(state: ConsciousnessState, shadowPulse: number): number {
    // كلما زاد الضغط، زادت الضبابية (تقليل التشتت البصري)
    const baseBlur = {
      crisis: 12, // ضبابية عالية
      struggling: 8,
      stable: 4,
      thriving: 0,
      flow: 0,
    }[state];

    const adjustment = shadowPulse / 100;
    return Math.round(baseBlur + adjustment * 6);
  }

  private calculateSaturation(state: ConsciousnessState, tei: number): number {
    // كلما زادت الفوضى، قلّ التشبع (ألوان رمادية)
    const baseSaturation = {
      crisis: 0.3, // ألوان باهتة
      struggling: 0.5,
      stable: 0.7,
      thriving: 0.9,
      flow: 1.0, // ألوان مشبعة
    }[state];

    const adjustment = (100 - tei) / 100;
    return Math.max(0.2, Math.min(1.0, baseSaturation * adjustment));
  }

  private determineAnimationLevel(
    state: ConsciousnessState,
    sessionDuration: number
  ): AnimationLevel {
    // في الأزمة: حركة قليلة
    // في التدفق: حركة غنية
    // بعد جلسة طويلة: تقليل الحركة (تجنب الإرهاق)

    if (state === "crisis" || sessionDuration > 60) {
      return "minimal";
    }

    if (state === "flow" && sessionDuration < 30) {
      return "rich";
    }

    return "normal";
  }

  private determineLayoutMode(state: ConsciousnessState, engagement: number): LayoutMode {
    // في الأزمة: Zen Mode (المحتوى الأساسي فقط)
    // في التدفق + Engagement عالي: Information-Dense

    if (state === "crisis") {
      return "zen";
    }

    if (state === "flow" && engagement > 80) {
      return "information-dense";
    }

    return "balanced";
  }

  private generateColors(params: {
    state: ConsciousnessState;
    colorIntensity: number;
    saturation: number;
    timeOfDay: "morning" | "afternoon" | "evening" | "night";
    preferredMode: "light" | "dark" | "auto";
  }): ConsciousnessTheme["colors"] {
    const { state, colorIntensity, saturation, timeOfDay, preferredMode } = params;

    // تحديد الوضع (Light/Dark)
    const isDark =
      preferredMode === "dark" ||
      (preferredMode === "auto" && (timeOfDay === "evening" || timeOfDay === "night"));

    // الألوان الأساسية بناءً على الحالة
    const hueMap: Record<ConsciousnessState, number> = {
      crisis: 220, // أزرق (هدوء)
      struggling: 200, // أزرق-سماوي
      stable: 180, // سماوي
      thriving: 160, // أخضر-سماوي
      flow: 280, // بنفسجي (إبداع)
    };

    const hue = hueMap[state];
    const sat = Math.round(saturation * 100);
    const lightness = isDark ? 20 : 95;
    const textLightness = isDark ? 95 : 20;

    return {
      primary: `hsl(${hue}, ${sat}%, ${50 + colorIntensity * 20}%)`,
      background: `hsl(${hue}, ${sat * 0.2}%, ${lightness}%)`,
      text: `hsl(${hue}, ${sat * 0.3}%, ${textLightness}%)`,
      accent: `hsl(${(hue + 30) % 360}, ${sat}%, ${60}%)`,
    };
  }

  private generateCSSVariables(params: {
    colorIntensity: number;
    borderRadius: number;
    spacing: number;
    contrast: number;
    blur: number;
    saturation: number;
    colors: ConsciousnessTheme["colors"];
    animations: AnimationLevel;
  }): Record<string, string> {
    const { borderRadius, spacing, contrast, blur, colors, animations } = params;

    const animationDuration = {
      minimal: "600ms",
      normal: "300ms",
      rich: "180ms",
    }[animations];

    return {
      // Colors
      "--consciousness-primary": colors.primary,
      "--consciousness-background": colors.background,
      "--consciousness-text": colors.text,
      "--consciousness-accent": colors.accent,

      // Layout
      "--consciousness-border-radius": `${borderRadius}px`,
      "--consciousness-spacing": `${spacing}rem`,
      "--consciousness-blur": `${blur}px`,

      // Typography
      "--consciousness-contrast": contrast.toString(),

      // Animations
      "--consciousness-animation-duration": animationDuration,

      // Layout Transitions (Always 2s للنعومة)
      "--consciousness-layout-transition": "2s cubic-bezier(0.4, 0, 0.2, 1)",
    };
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * حفظ واسترجاع Theme
   * ─────────────────────────────────────────────────────────────────
   */
  saveTheme(theme: ConsciousnessTheme): void {
    try {
      localStorage.setItem("dawayir-consciousness-theme", JSON.stringify(theme));
    } catch {
      // ignore
    }
  }

  loadTheme(): ConsciousnessTheme | null {
    try {
      const stored = localStorage.getItem("dawayir-consciousness-theme");
      return stored ? (JSON.parse(stored) as ConsciousnessTheme) : null;
    } catch {
      return null;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 🧪 Singleton Instance
// ═══════════════════════════════════════════════════════════════════════════

export const consciousnessTheme = new ConsciousnessThemeEngine();

/**
 * تشغيل المحرك تلقائياً مع Auto-Update
 */
export function startConsciousnessTheme(): void {
  console.warn("🎨 Consciousness Theme Engine started");

  // تحديث تلقائي كل 10 دقائق
  const UPDATE_INTERVAL = 10 * 60 * 1000; // 10 minutes

  const updateTheme = async () => {
    try {
      // جلب الحالة العاطفية من localStorage (مؤقتاً)
      const nodes = JSON.parse(localStorage.getItem("dawayir-nodes") || "[]");
      const journalEntries = JSON.parse(
        localStorage.getItem("dawayir-journal-entries") || "[]"
      );
      const teiHistory = JSON.parse(localStorage.getItem("dawayir-tei-history") || "[]");
      const shadowPulseHistory = JSON.parse(
        localStorage.getItem("dawayir-shadow-history") || "[]"
      );

      // تحليل الحالة
      const { emotionalPricingEngine } = await import("./emotionalPricingEngine");
      const emotionalState = emotionalPricingEngine.analyzeUserState({
        userId: "current-user",
        nodes,
        journalEntries,
        teiHistory,
        shadowPulseHistory,
      });

      // تحديد الوقت
      const hour = new Date().getHours();
      const timeOfDay: "morning" | "afternoon" | "evening" | "night" =
        hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 21 ? "evening" : "night";

      // حساب مدة الجلسة (من sessionStorage)
      const sessionStart = parseInt(
        sessionStorage.getItem("dawayir-session-start") || String(Date.now())
      );
      const sessionDuration = Math.floor((Date.now() - sessionStart) / (60 * 1000));

      // توليد Theme
      const theme = consciousnessTheme.generateTheme({
        emotionalState,
        timeOfDay,
        sessionDuration,
        preferredMode: "auto",
      });

      // تطبيق Theme (مع Smooth Transition)
      consciousnessTheme.applyTheme(theme, { smooth: true });

      // حفظ Theme
      consciousnessTheme.saveTheme(theme);

      // إرسال تقرير لـ Telegram (اختياري)
      await sendVisualReportToTelegram(theme, emotionalState);
    } catch (error) {
      logger.error("❌ Failed to update consciousness theme:", error);
    }
  };

  // تشغيل فوراً
  void updateTheme();

  // تحديث كل 10 دقائق
  setInterval(() => {
    void updateTheme();
  }, UPDATE_INTERVAL);

  // حفظ وقت بدء الجلسة
  if (!sessionStorage.getItem("dawayir-session-start")) {
    sessionStorage.setItem("dawayir-session-start", String(Date.now()));
  }

  console.warn("✅ Auto-update scheduled (every 10 minutes)");
}

/**
 * إرسال تقرير بصري لـ Telegram (نواة)
 */
async function sendVisualReportToTelegram(
  theme: ConsciousnessTheme,
  emotionalState: UserEmotionalState
): Promise<void> {
  try {
    const { telegramBot } = await import("@/services/telegramBot");

    // حساب النسبة المئوية لكل حالة (في المستقبل: من كل المستخدمين)
    const statePercentages = {
      crisis: emotionalState.state === "crisis" ? 100 : 0,
      struggling: emotionalState.state === "struggling" ? 100 : 0,
      stable: emotionalState.state === "stable" ? 100 : 0,
      thriving: emotionalState.state === "thriving" ? 100 : 0,
    };

    const dominantState = Object.entries(statePercentages).find(([_, pct]) => pct === 100)?.[0] || "stable";

    const visualDescription = {
      crisis: "ألوان هادية، مسافات كبيرة، تركيز على الأساسيات",
      struggling: "ألوان معتدلة، تخطيط متوازن",
      stable: "ألوان واضحة، التخطيط القياسي",
      thriving: "ألوان حية، تفاعل غني",
    }[dominantState as keyof typeof statePercentages] || "متوازن";

    const text = `
🎨 **تقرير الحالة البصرية للمنصة**

📊 **الحالة السائدة:** ${dominantState}
${statePercentages.crisis > 0 ? `• Crisis: ${statePercentages.crisis}%` : ""}
${statePercentages.struggling > 0 ? `• Struggling: ${statePercentages.struggling}%` : ""}
${statePercentages.stable > 0 ? `• Stable: ${statePercentages.stable}%` : ""}
${statePercentages.thriving > 0 ? `• Thriving: ${statePercentages.thriving}%` : ""}

🖼️ **المظهر الحالي:**
${visualDescription}

🎨 **التفاصيل التقنية:**
• كثافة الألوان: ${Math.round(theme.colorIntensity * 100)}%
• انحناء الزوايا: ${theme.borderRadius}px
• المسافات: ${theme.spacing}×
• الضبابية: ${theme.blur}px

📅 ${new Date().toLocaleString("ar-EG")}
    `.trim();

    await telegramBot.sendMessage({
      type: "daily_health_report",
      text,
      parseMode: "Markdown",
    });
  } catch {
    // تجاهل الخطأ إذا كان Telegram غير مفعّل
    console.warn("ℹ️ Visual report not sent (Telegram not configured)");
  }
}

