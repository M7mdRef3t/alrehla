/**
 * ADAPTIVE_LAYOUT_ENGINE.ts — محرك الترتيب الذكي
 * =====================================================
 * "الواجهة تُعيد ترتيب نفسها بناءً على أولوية المستخدم"
 *
 * المبدأ:
 * - في الأزمة (Crisis): Status Card → Map → Widgets مطوية
 * - في التدفق (Flow): Daily Pulse → TEI → Map → Challenge
 * - في الاستقرار (Stable): الترتيب الافتراضي
 */

import type { MapNode } from "../modules/map/mapTypes";

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 Layout Types
// ═══════════════════════════════════════════════════════════════════════════

export type LayoutSectionId =
  | "tei-widget"
  | "daily-pulse"
  | "status-card"
  | "map-canvas"
  | "controls-bar"
  | "ring-legend"
  | "dashboard-details";

export type LayoutMode = "crisis" | "struggling" | "stable" | "thriving" | "flow";

export interface LayoutSection {
  id: LayoutSectionId;
  priority: number; // 0-100 (الأعلى أولاً)
  collapsed?: boolean; // لو true، القسم يظهر مطوي
  sticky?: boolean; // لو true، القسم يبقى ثابت عند الـ scroll
  size?: "compact" | "normal" | "expanded"; // حجم العرض
}

export interface AdaptiveLayoutConfig {
  mode: LayoutMode;
  sections: LayoutSection[];
  focusElement?: LayoutSectionId; // العنصر الأهم (يحصل على visual emphasis)
  transitions: {
    duration: number; // ms
    easing: string;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 🧠 Adaptive Layout Engine
// ═══════════════════════════════════════════════════════════════════════════

export class AdaptiveLayoutEngine {
  /**
   * ─────────────────────────────────────────────────────────────────
   * حساب الترتيب الأمثل بناءً على حالة المستخدم
   * ─────────────────────────────────────────────────────────────────
   */
  calculateLayout(params: {
    nodes: MapNode[];
    tei: number; // 0-100
    shadowScore: number; // 0-100
    pulseMode: "low" | "angry" | "high" | "normal";
    hasAnsweredToday: boolean;
    sessionDuration: number; // minutes
    journeyMode?: boolean;
  }): AdaptiveLayoutConfig {
    const { nodes, tei, shadowScore, pulseMode, hasAnsweredToday, sessionDuration, journeyMode } = params;

    // 1. تحديد الوضع (Mode)
    const mode = this.determineLayoutMode({ tei, shadowScore, pulseMode });

    // 2. حساب الأولويات
    const sections = this.calculateSectionPriorities({
      mode,
      nodes,
      tei,
      shadowScore,
      pulseMode,
      hasAnsweredToday,
      sessionDuration,
      journeyMode,
    });

    // 3. تحديد العنصر المحوري
    const focusElement = this.determineFocusElement({ mode, pulseMode, tei, shadowScore });

    // 4. تحديد سرعة الانتقال (أبطأ في الأزمة)
    const transitions = {
      duration: mode === "crisis" ? 2500 : mode === "flow" ? 1500 : 2000,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    };

    return {
      mode,
      sections: sections.sort((a, b) => b.priority - a.priority),
      focusElement,
      transitions,
    };
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * تحديد الوضع بناءً على TEI + Shadow Score + Pulse
   * ─────────────────────────────────────────────────────────────────
   */
  private determineLayoutMode(params: {
    tei: number;
    shadowScore: number;
    pulseMode: string;
  }): LayoutMode {
    const { tei, shadowScore, pulseMode } = params;

    // أزمة نشطة (Pulse منخفض أو غاضب)
    if (pulseMode === "low" || pulseMode === "angry") {
      return "crisis";
    }

    // TEI مرتفع جداً + Shadow Score عالي = struggling
    if (tei > 60 && shadowScore > 50) {
      return "struggling";
    }

    // TEI منخفض جداً + Pulse عالي = flow
    if (tei < 20 && pulseMode === "high") {
      return "flow";
    }

    // TEI منخفض + Shadow Score منخفض = thriving
    if (tei < 35 && shadowScore < 30) {
      return "thriving";
    }

    // الافتراضي: stable
    return "stable";
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * حساب الأولوية لكل Section
   * ─────────────────────────────────────────────────────────────────
   */
  private calculateSectionPriorities(params: {
    mode: LayoutMode;
    nodes: MapNode[];
    tei: number;
    shadowScore: number;
    pulseMode: string;
    hasAnsweredToday: boolean;
    sessionDuration: number;
    journeyMode?: boolean;
  }): LayoutSection[] {
    const { mode, pulseMode, hasAnsweredToday } = params;

    // ═══════════════════════════════════════════════════════════════
    // 🔴 Crisis Mode — الأولوية للتدخل الفوري
    // ═══════════════════════════════════════════════════════════════
    if (mode === "crisis") {
      return [
        {
          id: "status-card",
          priority: 100,
          size: "expanded",
        },
        {
          id: "map-canvas",
          priority: 90,
          size: "normal",
        },
        {
          id: "controls-bar",
          priority: 80,
          size: "compact",
        },
        {
          id: "tei-widget",
          priority: 40,
          collapsed: true,
          sticky: true, // يبقى ظاهر في الزاوية
          size: "compact",
        },
        {
          id: "daily-pulse",
          priority: 30,
          collapsed: true,
        },
        {
          id: "dashboard-details",
          priority: 20,
          collapsed: true,
        },
        {
          id: "ring-legend",
          priority: 10,
          size: "compact",
        },
      ];
    }

    // ═══════════════════════════════════════════════════════════════
    // 🟡 Struggling Mode — الأولوية للوضوح
    // ═══════════════════════════════════════════════════════════════
    if (mode === "struggling") {
      return [
        {
          id: "tei-widget",
          priority: 100,
          size: "expanded",
        },
        {
          id: "status-card",
          priority: 90,
          size: pulseMode === "low" || pulseMode === "angry" ? "normal" : "compact",
        },
        {
          id: "map-canvas",
          priority: 80,
          size: "normal",
        },
        {
          id: "controls-bar",
          priority: 70,
          size: "normal",
        },
        {
          id: "daily-pulse",
          priority: 60,
          size: hasAnsweredToday ? "compact" : "normal",
        },
        {
          id: "dashboard-details",
          priority: 40,
          collapsed: true,
        },
        {
          id: "ring-legend",
          priority: 30,
          size: "compact",
        },
      ];
    }

    // ═══════════════════════════════════════════════════════════════
    // 🟢 Thriving Mode — الأولوية للنمو
    // ═══════════════════════════════════════════════════════════════
    if (mode === "thriving") {
      return [
        {
          id: "daily-pulse",
          priority: 100,
          size: hasAnsweredToday ? "normal" : "expanded",
        },
        {
          id: "tei-widget",
          priority: 90,
          size: "normal",
        },
        {
          id: "status-card",
          priority: 85,
          size: pulseMode === "high" ? "normal" : "compact",
        },
        {
          id: "map-canvas",
          priority: 80,
          size: "normal",
        },
        {
          id: "controls-bar",
          priority: 70,
          size: "normal",
        },
        {
          id: "dashboard-details",
          priority: 50,
          collapsed: false,
        },
        {
          id: "ring-legend",
          priority: 40,
          size: "normal",
        },
      ];
    }

    // ═══════════════════════════════════════════════════════════════
    // 💎 Flow Mode — الأولوية للتأمل والتحدي
    // ═══════════════════════════════════════════════════════════════
    if (mode === "flow") {
      return [
        {
          id: "daily-pulse",
          priority: 100,
          size: "expanded",
        },
        {
          id: "tei-widget",
          priority: 95,
          size: "normal",
          sticky: true, // يبقى ظاهر في الزاوية
        },
        {
          id: "status-card",
          priority: 90,
          size: "normal", // مناورة اليوم
        },
        {
          id: "map-canvas",
          priority: 80,
          size: "normal",
        },
        {
          id: "controls-bar",
          priority: 75,
          size: "expanded", // كل الأدوات متاحة
        },
        {
          id: "dashboard-details",
          priority: 60,
          collapsed: false,
        },
        {
          id: "ring-legend",
          priority: 50,
          size: "normal",
        },
      ];
    }

    // ═══════════════════════════════════════════════════════════════
    // ⚪ Stable Mode — الترتيب الافتراضي
    // ═══════════════════════════════════════════════════════════════
    return [
      {
        id: "tei-widget",
        priority: 100,
        size: "normal",
      },
      {
        id: "daily-pulse",
        priority: 90,
        size: hasAnsweredToday ? "compact" : "normal",
      },
      {
        id: "dashboard-details",
        priority: 70,
        collapsed: true,
      },
      {
        id: "status-card",
        priority: 65,
        size: pulseMode !== "normal" ? "normal" : "compact",
      },
      {
        id: "controls-bar",
        priority: 60,
        size: "normal",
      },
      {
        id: "map-canvas",
        priority: 80,
        size: "normal",
      },
      {
        id: "ring-legend",
        priority: 40,
        size: "normal",
      },
    ];
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * تحديد العنصر المحوري (Focus Element)
   * ─────────────────────────────────────────────────────────────────
   */
  private determineFocusElement(params: {
    mode: LayoutMode;
    pulseMode: string;
    tei: number;
    shadowScore: number;
  }): LayoutSectionId {
    const { mode, pulseMode, tei } = params;

    // في الأزمة: Status Card هو الأهم
    if (mode === "crisis" || pulseMode === "low" || pulseMode === "angry") {
      return "status-card";
    }

    // TEI مرتفع جداً: TEI Widget هو الأهم
    if (tei > 70) {
      return "tei-widget";
    }

    // في التدفق: Daily Pulse هو الأهم
    if (mode === "flow" || pulseMode === "high") {
      return "daily-pulse";
    }

    // الافتراضي: Map Canvas
    return "map-canvas";
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * تحويل الأولوية لـ CSS Order
   * ─────────────────────────────────────────────────────────────────
   */
  getSectionOrder(sections: LayoutSection[]): Record<LayoutSectionId, number> {
    const order: Record<string, number> = {};
    sections.forEach((section, index) => {
      order[section.id] = index;
    });
    return order as Record<LayoutSectionId, number>;
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * حفظ واسترجاع Layout
   * ─────────────────────────────────────────────────────────────────
   */
  saveLayout(layout: AdaptiveLayoutConfig): void {
    try {
      localStorage.setItem("dawayir-adaptive-layout", JSON.stringify(layout));
    } catch {
      // ignore
    }
  }

  loadLayout(): AdaptiveLayoutConfig | null {
    try {
      const stored = localStorage.getItem("dawayir-adaptive-layout");
      return stored ? (JSON.parse(stored) as AdaptiveLayoutConfig) : null;
    } catch {
      return null;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 🧪 Singleton Instance
// ═══════════════════════════════════════════════════════════════════════════

export const adaptiveLayoutEngine = new AdaptiveLayoutEngine();

/**
 * Hook للاستخدام في React Components
 */
export function useAdaptiveLayout(params: {
  nodes: MapNode[];
  tei: number;
  shadowScore: number;
  pulseMode: "low" | "angry" | "high" | "normal";
  hasAnsweredToday: boolean;
  sessionDuration: number;
  journeyMode?: boolean;
}): AdaptiveLayoutConfig {
  return adaptiveLayoutEngine.calculateLayout(params);
}
