import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MapNode } from "../modules/map/mapTypes";
import { ACHIEVEMENTS } from "../data/achievements";

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
  /** فحص الشروط من بيانات التطبيق وتحديث الإنجازات المفتوحة */
  checkAndUnlock: (options: {
    nodes: MapNode[];
    baselineCompletedAt: number | null;
    libraryOpenedAt: number | null;
    breathingUsedAt: number | null;
  }) => string | null;
}

export const useAchievementState = create<AchievementState>()(
  persist(
    (set, get) => ({
      unlockedIds: [],
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
        if (typeof window !== "undefined" && !window.localStorage.getItem(key)) {
          window.localStorage.setItem(key, String(Date.now()));
        }
        get().unlock("reader");
      },

      markBreathingUsed: () => {
        const key = `${STORAGE_KEY}-breathing-used`;
        if (typeof window !== "undefined" && !window.localStorage.getItem(key)) {
          window.localStorage.setItem(key, String(Date.now()));
        }
        get().unlock("breather");
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
    { name: STORAGE_KEY, partialize: (s) => ({ unlockedIds: s.unlockedIds }) }
  )
);

/** قراءة وقت آخر فتح للمكتبة من localStorage */
export function getLibraryOpenedAt(): number | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(`${STORAGE_KEY}-library-opened`);
  return v ? Number(v) : null;
}

/** قراءة وقت آخر استخدام للتنفس */
export function getBreathingUsedAt(): number | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(`${STORAGE_KEY}-breathing-used`);
  return v ? Number(v) : null;
}
