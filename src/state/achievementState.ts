import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MapNode } from "../modules/map/mapTypes";
import { ACHIEVEMENTS } from "../data/achievements";
import { getFromLocalStorage, setInLocalStorage } from "../services/browserStorage";

const STORAGE_KEY = "dawayir-achievements";

function countSituations(nodes: MapNode[]): number {
  let total = 0;
  for (const node of nodes) {
    const inputs = node.firstStepProgress?.stepInputs;
    if (!inputs) continue;
    for (const arr of Object.values(inputs)) {
      total += (arr || []).filter((s) => s?.trim()).length;
    }
  }
  return total;
}

function hasCompletedTraining(nodes: MapNode[]): boolean {
  return nodes.some((n) => n.hasCompletedTraining === true);
}

function hasCompletedMission(nodes: MapNode[]): boolean {
  return nodes.some((n) => n.missionProgress?.isCompleted === true);
}

export interface AchievementState {
  unlockedIds: string[];
  totalPoints: number;
  actionCounts: Record<string, number>;
  lastNewAchievementId: string | null;
  /** فتح إنجاز (يُستدعى من الواجهة أو من فحص تلقائي). يفعّل عرض التهاني إن كان أول فتح. */
  unlock: (id: string) => void;
  /** فتح بدون عرض تهاني (للاستخدام عند فتح عدة إنجازات في نفس الفحص) */
  unlockSilent: (id: string) => void;
  /** مسح آخر إنجاز جديد (بعد عرض التهاني) */
  clearLastNew: () => void;
  /** تسجيل أن المستخدم فتح المكتبة */
  markLibraryOpened: () => void;
  /** تسجيل أن المستخدم استخدم التنفس */
  markBreathingUsed: () => void;
  /** إضافة نقاط مقابل إجراء محدد */
  addActionPoints: (actionKey: string, amount?: number) => number;
  /** فحص الشروط من بيانات التطبيق وتحديث الإنجازات المفتوحة */
  checkAndUnlock: (options: {
    nodes: MapNode[];
    baselineCompletedAt: number | null;
    libraryOpenedAt: number | null;
    breathingUsedAt: number | null;
  }) => string | null;
}

const DEFAULT_ACTION_POINTS = 1;

const ACTION_POINTS: Record<string, number> = {
  // Flow steps
  flow_landing_viewed: 1,
  flow_landing_clicked_start: 3,
  flow_auth_login_success: 6,
  flow_install_clicked: 8,
  flow_profile_clicked: 1,
  flow_pulse_opened: 2,
  flow_pulse_notes_used: 3,
  flow_pulse_completed: 4,
  flow_pulse_completed_with_choices: 6,
  flow_pulse_completed_without_choices: 2,
  flow_add_person_opened: 3,
  flow_add_person_done_show_on_map: 7,
  flow_feedback_submitted: 5,
  flow_tools_opened: 2,

  // Journey events
  journey_path_started: 5,
  journey_task_started: 2,
  journey_task_completed: 8,
  journey_path_regenerated: 4,
  journey_node_added: 10,
  journey_mood_logged: 3,
  journey_flow_event: 1,

  // Direct actions not always covered by journey events
  action_library_opened: 4,
  action_breathing_used: 4
};

const ACTION_ACHIEVEMENTS: Record<string, string> = {
  flow_landing_clicked_start: "starter_click",
  flow_auth_login_success: "login_success",
  flow_install_clicked: "installer_click",
  flow_pulse_notes_used: "pulse_explainer",
  flow_pulse_completed: "pulse_saver",
  flow_add_person_done_show_on_map: "person_located_on_map"
};

export const useAchievementState = create<AchievementState>()(
  persist(
    (set, get) => ({
      unlockedIds: [],
      totalPoints: 0,
      actionCounts: {},
      lastNewAchievementId: null,

      unlock: (id: string) => {
        const { unlockedIds } = get();
        if (unlockedIds.includes(id)) return;
        const defined = ACHIEVEMENTS.some((a) => a.id === id);
        if (!defined) return;
        set({
          unlockedIds: [...unlockedIds, id],
          lastNewAchievementId: id
        });
      },

      unlockSilent: (id: string) => {
        const { unlockedIds } = get();
        if (unlockedIds.includes(id)) return;
        const defined = ACHIEVEMENTS.some((a) => a.id === id);
        if (!defined) return;
        set({ unlockedIds: [...unlockedIds, id] });
      },

      clearLastNew: () => set({ lastNewAchievementId: null }),

      markLibraryOpened: () => {
        const key = `${STORAGE_KEY}-library-opened`;
        if (!getFromLocalStorage(key)) {
          setInLocalStorage(key, String(Date.now()));
        }
        get().addActionPoints("action_library_opened");
        get().unlock("reader");
      },

      markBreathingUsed: () => {
        const key = `${STORAGE_KEY}-breathing-used`;
        if (!getFromLocalStorage(key)) {
          setInLocalStorage(key, String(Date.now()));
        }
        get().addActionPoints("action_breathing_used");
        get().unlock("breather");
      },

      addActionPoints: (actionKey, amount) => {
        const normalized = String(actionKey ?? "").trim();
        if (!normalized) return get().totalPoints;
        const points = typeof amount === "number" && Number.isFinite(amount)
          ? Math.max(0, Math.floor(amount))
          : ACTION_POINTS[normalized] ?? DEFAULT_ACTION_POINTS;
        if (points <= 0) return get().totalPoints;

        set((state) => ({
          totalPoints: state.totalPoints + points,
          actionCounts: {
            ...state.actionCounts,
            [normalized]: (state.actionCounts[normalized] ?? 0) + 1
          }
        }));
        const achievementId = ACTION_ACHIEVEMENTS[normalized];
        if (achievementId) {
          get().unlock(achievementId);
        }
        return get().totalPoints;
      },

      checkAndUnlock: (options) => {
        const { nodes, baselineCompletedAt, libraryOpenedAt, breathingUsedAt } = options;
        const { unlockedIds, unlock, unlockSilent } = get();
        const situationsCount = countSituations(nodes);
        let newlyUnlocked: string | null = null;

        const toCheck: { id: string; condition: boolean }[] = [
          { id: "first_step", condition: nodes.length >= 1 },
          { id: "writer", condition: situationsCount >= 1 },
          { id: "plan_seeker", condition: situationsCount >= 2 },
          { id: "trained", condition: hasCompletedTraining(nodes) },
          { id: "growing_map", condition: nodes.length >= 3 },
          { id: "boundary_keeper", condition: nodes.length >= 5 },
          { id: "measured", condition: baselineCompletedAt != null },
          { id: "reader", condition: libraryOpenedAt != null },
          { id: "breather", condition: breathingUsedAt != null },
          { id: "mission_complete", condition: hasCompletedMission(nodes) }
        ];

        for (const { id, condition } of toCheck) {
          if (condition && !unlockedIds.includes(id)) {
            if (newlyUnlocked == null) {
              unlock(id);
              newlyUnlocked = id;
            } else {
              unlockSilent(id);
            }
          }
        }
        return newlyUnlocked;
      }
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({
        unlockedIds: s.unlockedIds,
        totalPoints: s.totalPoints,
        actionCounts: s.actionCounts
      })
    }
  )
);

/** قراءة وقت آخر فتح للمكتبة من localStorage */
export function getLibraryOpenedAt(): number | null {
  const v = getFromLocalStorage(`${STORAGE_KEY}-library-opened`);
  return v ? Number(v) : null;
}

/** قراءة وقت آخر استخدام للتنفس */
export function getBreathingUsedAt(): number | null {
  const v = getFromLocalStorage(`${STORAGE_KEY}-breathing-used`);
  return v ? Number(v) : null;
}

export function awardPointsForFlowStep(step: string): void {
  useAchievementState.getState().addActionPoints(`flow_${step}`);
}

export function awardPointsForJourneyType(type: string): void {
  useAchievementState.getState().addActionPoints(`journey_${type}`);
}
