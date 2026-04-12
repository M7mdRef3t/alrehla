import { useEffect } from "react";
import type { MapNode } from "@/modules/map/mapTypes";
import { useMapState } from "@/domains/dawayir/store/map.store";
import {
  NOTIFICATION_TYPES,
  sendNotification,
  sendPresetNotification,
  type NotificationSettings
} from "@/services/notifications";
import { getFromLocalStorage, setInLocalStorage } from "@/services/browserStorage";
import { getIncompleteMissionSteps } from "@/utils/missionProgress";

interface UseAppMissionReminderNotificationsParams {
  notificationSupported: boolean;
  notificationPermission: NotificationPermission | null;
  notificationSettings: NotificationSettings;
  hasActiveMission: boolean;
  snoozedUntil: number | null;
}

interface MissionReminderTarget {
  node: MapNode;
  next: {
    step: string;
    stepIndex: number;
    total: number;
    missionLabel: string;
    missionGoal: string;
  };
  cycleStorage: {
    key: string;
    index: number;
  } | null;
}

function pickMissionReminderTarget(
  nodes: MapNode[],
  strategy: NotificationSettings["missionReminderStrategy"],
  todayKey: string
): MissionReminderTarget | null {
  const activeNodes = nodes
    .filter((node) => node.missionProgress?.startedAt && !node.missionProgress?.isCompleted)
    .sort((a, b) => (b.missionProgress?.startedAt ?? 0) - (a.missionProgress?.startedAt ?? 0));

  for (const node of activeNodes) {
    const incomplete = getIncompleteMissionSteps(node);
    if (!incomplete || incomplete.allSteps.length === 0) continue;

    let selectedStep: { step: string; index: number } | null = null;
    let cycleStorage: MissionReminderTarget["cycleStorage"] = null;

    if (strategy === "last") {
      selectedStep = incomplete.steps[incomplete.steps.length - 1] ?? null;
    } else if (strategy === "cycle") {
      const totalSteps = incomplete.allSteps;
      if (totalSteps.length === 0) continue;

      const cycleKey = `dawayir-mission-cycle-${node.id}`;
      let lastIndex = -1;
      let lastDate: string | null = null;

      if (typeof window !== "undefined") {
        try {
          const stored = getFromLocalStorage(cycleKey);
          if (stored) {
            const parsed = JSON.parse(stored) as { lastIndex?: number; lastDate?: string };
            if (typeof parsed.lastIndex === "number") lastIndex = parsed.lastIndex;
            if (typeof parsed.lastDate === "string") lastDate = parsed.lastDate;
          }
        } catch {
          // Ignore malformed local storage values.
        }
      }

      const startIndex =
        lastDate === todayKey
          ? (lastIndex + totalSteps.length) % totalSteps.length
          : (lastIndex + 1 + totalSteps.length) % totalSteps.length;

      for (let offset = 0; offset < totalSteps.length; offset += 1) {
        const index = (startIndex + offset) % totalSteps.length;
        const candidate = totalSteps[index];
        if (!candidate.completed) {
          selectedStep = {
            step: candidate.step,
            index: candidate.index
          };
          cycleStorage = {
            key: cycleKey,
            index: candidate.index
          };
          break;
        }
      }
    } else if (strategy === "random") {
      if (incomplete.steps.length <= 1) {
        selectedStep = incomplete.steps[0] ?? null;
      } else {
        const pool = incomplete.steps.slice(1);
        selectedStep = pool[Math.floor(Math.random() * pool.length)] ?? null;
      }
    } else {
      selectedStep = incomplete.steps[0] ?? null;
    }

    if (!selectedStep) continue;

    return {
      node,
      next: {
        step: selectedStep.step,
        stepIndex: selectedStep.index,
        total: incomplete.total,
        missionLabel: incomplete.missionLabel,
        missionGoal: incomplete.missionGoal
      },
      cycleStorage
    };
  }

  return null;
}

export function useAppMissionReminderNotifications({
  notificationSupported,
  notificationPermission,
  notificationSettings,
  hasActiveMission,
  snoozedUntil
}: UseAppMissionReminderNotificationsParams) {
  const nodes = useMapState((s) => s.nodes);
  const {
    enabled,
    missionReminder,
    dailyReminderTime,
    missionReminderStrategy
  } = notificationSettings;

  useEffect(() => {
    if (!notificationSupported || notificationPermission !== "granted") return;
    if (!enabled || !missionReminder) return;

    const [hourPart, minutePart] = dailyReminderTime.split(":");
    const targetHour = Number(hourPart);
    const targetMinute = Number(minutePart);
    if (Number.isNaN(targetHour) || Number.isNaN(targetMinute)) return;

    const storageKey = "dawayir-mission-reminder-last";

    const checkAndSend = () => {
      if (snoozedUntil && Date.now() < snoozedUntil) return;
      if (!hasActiveMission) return;

      const now = new Date();
      if (now.getHours() !== targetHour || now.getMinutes() !== targetMinute) return;

      const todayKey = now.toISOString().slice(0, 10);
      if (typeof window === "undefined") return;

      const lastSent = getFromLocalStorage(storageKey);
      if (lastSent === todayKey) return;

      const reminderTarget = pickMissionReminderTarget(nodes, missionReminderStrategy, todayKey);
      const send = reminderTarget
        ? sendNotification({
          title: "مهمتك مستنياك 🎯",
          body: `مع ${reminderTarget.node.label} — خطوة ${reminderTarget.next.stepIndex + 1}/${reminderTarget.next.total}: ${reminderTarget.next.step}`,
          tag: "mission-reminder"
        })
        : sendPresetNotification(NOTIFICATION_TYPES.MISSION_REMINDER);

      void send.then(() => {
        setInLocalStorage(storageKey, todayKey);

        if (reminderTarget?.cycleStorage) {
          setInLocalStorage(
            reminderTarget.cycleStorage.key,
            JSON.stringify({
              lastDate: todayKey,
              lastIndex: reminderTarget.cycleStorage.index
            })
          );
        }
      });
    };

    checkAndSend();
    const intervalId = setInterval(checkAndSend, 60 * 1000);
    return () => clearInterval(intervalId);
  }, [
    dailyReminderTime,
    enabled,
    hasActiveMission,
    missionReminder,
    missionReminderStrategy,
    nodes,
    notificationPermission,
    notificationSupported,
    snoozedUntil
  ]);
}
