/**
 * ════════════════════════════════════════════════════════════════════════════
 * 🎨 LAYOUT STATE — نظام التخطيط التكيفي الموحد
 * ════════════════════════════════════════════════════════════════════════════
 *
 * يدير الأوضاع المختلفة لواجهة المستخدم:
 * - Focus Mode: الخريطة فقط (Progressive Disclosure)
 * - Insights Mode: Sidebar مع الإحصائيات
 * - Conversation Mode: Tab الحوار مع Gemini
 * - Adaptive Mode: النظام يختار تلقائياً
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TYPES
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * أوضاع التخطيط المتاحة
 */
export type LayoutMode =
  | "focus"        // الخريطة فقط + FAB
  | "insights"     // Sidebar الإحصائيات
  | "conversation" // Tab الحوار
  | "adaptive";    // ذكي تلقائي

/**
 * أنماط عرض الـ Sidebar
 */
export type SidebarPosition = "right" | "left" | "hidden";

/**
 * Tab الحالي (Behavioral Layer)
 */
export type ActiveTab = "operational" | "analytical" | "narrative" | "settings";

/**
 * حالة الـ FAB (Floating Action Button)
 */
export interface FABState {
  isOpen: boolean;        // القائمة مفتوحة؟
  position: "bottom-left" | "bottom-right";
}

/**
 * قواعد التكيف الذكي
 */
export interface AdaptiveRules {
  /** عدد الدوائر اللي لو المستخدم وصلها → اقترح insights mode */
  minNodesForInsights: number;
  /** TEI score اللي لو اتخطى → اقترح conversation mode */
  teiThresholdForConversation: number;
  /** Shadow score اللي لو اتخطى → اقترح insights mode */
  shadowThresholdForInsights: number;
  /** لو المستخدم مجاوبش daily pulse → اقترح conversation mode */
  suggestConversationIfNoPulse: boolean;
  /** الوقت من اليوم (0-23) اللي يفضّل فيه focus mode */
  focusHours: number[];
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STATE INTERFACE
 * ═══════════════════════════════════════════════════════════════════════════
 */

interface LayoutState {
  // ─── Current State ────────────────────────────────────────────────────────
  mode: LayoutMode;
  activeTab: ActiveTab;
  sidebarPosition: SidebarPosition;
  sidebarExpanded: boolean;
  fabState: FABState;

  // ─── User Preferences ─────────────────────────────────────────────────────
  /** هل المستخدم فضّل وضع معين؟ (override للـ adaptive) */
  userPreferredMode: LayoutMode | null;
  /** هل المستخدم شاف onboarding التخطيط؟ */
  hasSeenLayoutOnboarding: boolean;

  // ─── Adaptive Rules ───────────────────────────────────────────────────────
  adaptiveRules: AdaptiveRules;

  // ─── Actions ──────────────────────────────────────────────────────────────
  setMode: (mode: LayoutMode) => void;
  setActiveTab: (tab: ActiveTab) => void;
  toggleSidebar: () => void;
  setSidebarPosition: (position: SidebarPosition) => void;
  toggleFAB: () => void;
  setFABPosition: (position: "bottom-left" | "bottom-right") => void;

  /** حفظ تفضيل المستخدم */
  setUserPreference: (mode: LayoutMode) => void;
  /** مسح التفضيل (رجوع للـ adaptive) */
  clearUserPreference: () => void;

  /** تحديث قواعد التكيف */
  updateAdaptiveRules: (rules: Partial<AdaptiveRules>) => void;

  /** الحصول على الوضع المقترح (للـ adaptive mode) */
  getSuggestedMode: (context: {
    nodesCount: number;
    teiScore: number;
    shadowScore: number;
    hasAnsweredPulse: boolean;
    currentHour: number;
  }) => LayoutMode;

  /** تعليم الـ onboarding كمشاهد */
  markLayoutOnboardingAsSeen: () => void;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DEFAULT VALUES
 * ═══════════════════════════════════════════════════════════════════════════
 */

const DEFAULT_ADAPTIVE_RULES: AdaptiveRules = {
  minNodesForInsights: 3,              // لو عنده 3 دوائر أو أكتر
  teiThresholdForConversation: 60,     // لو TEI فوق 60
  shadowThresholdForInsights: 35,      // لو Shadow Score فوق 35
  suggestConversationIfNoPulse: true,  // لو مجاوبش سؤال اليوم
  focusHours: [8, 9, 10, 18, 19, 20]  // الصبح والمساء → focus mode
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ZUSTAND STORE
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const useLayoutState = create<LayoutState>()(
  persist(
    (set, get) => ({
      // ─── Initial State ────────────────────────────────────────────────────
      mode: "adaptive",
      activeTab: "operational",
      sidebarPosition: "right",
      sidebarExpanded: false,
      fabState: {
        isOpen: false,
        position: "bottom-left"
      },
      userPreferredMode: null,
      hasSeenLayoutOnboarding: false,
      adaptiveRules: DEFAULT_ADAPTIVE_RULES,

      // ─── Actions ──────────────────────────────────────────────────────────
      setMode: (mode) => {
        set({ mode });

        // لو اختار conversation mode → فتح tab الحوار
        if (mode === "focus") {
          set({ sidebarExpanded: false, activeTab: "operational" });
        }
      },

      setActiveTab: (tab) => {
        set({ activeTab: tab });

        // لو فتح tab التحليل → فتح الـ sidebar لتجربة أغنى
        if (tab === "analytical") {
          set({ sidebarExpanded: true });
        }
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarExpanded: !state.sidebarExpanded }));
      },

      setSidebarPosition: (position) => {
        set({ sidebarPosition: position });
      },

      toggleFAB: () => {
        set((state) => ({
          fabState: { ...state.fabState, isOpen: !state.fabState.isOpen }
        }));
      },

      setFABPosition: (position) => {
        set((state) => ({
          fabState: { ...state.fabState, position }
        }));
      },

      setUserPreference: (mode) => {
        set({ userPreferredMode: mode, mode });
      },

      clearUserPreference: () => {
        set({ userPreferredMode: null });
      },

      updateAdaptiveRules: (rules) => {
        set((state) => ({
          adaptiveRules: { ...state.adaptiveRules, ...rules }
        }));
      },

      getSuggestedMode: (context) => {
        const { adaptiveRules, userPreferredMode } = get();

        // لو المستخدم اختار وضع معين → نحترمه
        if (userPreferredMode && userPreferredMode !== "adaptive") {
          return userPreferredMode;
        }

        // ─── Adaptive Logic ───────────────────────────────────────────────

        // 1. لو في ساعات الـ focus → focus mode
        if (adaptiveRules.focusHours.includes(context.currentHour)) {
          return "focus";
        }

        // 2. لو TEI عالي جداً → conversation mode (محتاج يتكلم)
        if (context.teiScore >= adaptiveRules.teiThresholdForConversation) {
          return "conversation";
        }

        // 3. لو Shadow Score عالي → insights mode (محتاج يشوف التحليل)
        if (context.shadowScore >= adaptiveRules.shadowThresholdForInsights) {
          return "insights";
        }

        // 4. لو مجاوبش سؤال اليوم → conversation mode
        if (
          !context.hasAnsweredPulse &&
          adaptiveRules.suggestConversationIfNoPulse
        ) {
          return "conversation";
        }

        // 5. لو عنده دوائر كتير → insights mode (عشان يحلل)
        if (context.nodesCount >= adaptiveRules.minNodesForInsights) {
          return "insights";
        }

        // 6. Default: focus mode (للمبتدئين)
        return "focus";
      },

      markLayoutOnboardingAsSeen: () => {
        set({ hasSeenLayoutOnboarding: true });
      }
    }),
    {
      name: "dawayir-layout-state",
      // حفظ التفضيلات فقط (مش الحالة المؤقتة)
      partialize: (state) => ({
        userPreferredMode: state.userPreferredMode,
        hasSeenLayoutOnboarding: state.hasSeenLayoutOnboarding,
        sidebarPosition: state.sidebarPosition,
        fabState: state.fabState,
        adaptiveRules: state.adaptiveRules
      })
    }
  )
);

// 🧠 Synapse Receptor (Neural Link)
import { SynapseBus } from "@/core/synapse/SynapseBus";

SynapseBus.subscribe((event) => {
  if (event.intensity >= 0.7) {
    if (event.type === "VAMPIRE_DETECTED" || event.type === "NODE_SHIFTED_OUTWARD") {
      // User might need insights when major changes or drain happen
      useLayoutState.getState().setMode("insights");
      useLayoutState.getState().setActiveTab("analytical");
    } else if (event.type === "STRESS_SPIKED" || event.type === "LOCKDOWN_INITIATED") {
      // User needs to talk to the AI
      useLayoutState.getState().setMode("conversation");
      useLayoutState.getState().setActiveTab("narrative");
    }
  }
});
