import { create } from "zustand";
import { persist } from "zustand/middleware";
import { pushPulseLog } from "../services/pulseSync";

export type PulseMood = "bright" | "calm" | "anxious" | "angry" | "sad";
export type PulseFocus = "event" | "thought" | "body" | "none";

export interface PulseEntry {
  energy: number; // 1-10
  mood: PulseMood;
  focus: PulseFocus;
  timestamp: number;
  auto?: boolean;
}

export type PulseCheckMode = "daily" | "everyOpen";

/** ربط يوم أسبوع (0=أحد .. 6=سبت) بنشاط أو شخص — لتقرير التقلبات الأعمق */
export type WeekdayLabels = Record<number, string>;

interface PulseState {
  lastPulse: PulseEntry | null;
  logs: PulseEntry[];
  snoozedUntil: number | null;
  checkInMode: PulseCheckMode;
  /** اختياري: "الثلاثاء" → "اجتماع مع المدير" لاستخدامه في تقرير النبض */
  weekdayLabels: WeekdayLabels;
  logPulse: (entry: Omit<PulseEntry, "timestamp">) => void;
  snoozeNotifications: (minutes: number) => void;
  clearSnooze: () => void;
  setCheckInMode: (mode: PulseCheckMode) => void;
  setWeekdayLabel: (day: number, label: string | null) => void;
}

const STORAGE_KEY = "dawayir-pulse";
const MAX_LOGS = 90;

export const usePulseState = create<PulseState>()(
  persist(
    (set, get) => ({
      lastPulse: null,
      logs: [],
      snoozedUntil: null,
      checkInMode: "daily",
      weekdayLabels: {},
      logPulse: (entry) => {
        const next: PulseEntry = { ...entry, timestamp: Date.now() };
        const logs = [next, ...(get().logs ?? [])].slice(0, MAX_LOGS);
        set({ lastPulse: next, logs });
        void pushPulseLog(next);
      },
      snoozeNotifications: (minutes) => {
        const until = Date.now() + minutes * 60 * 1000;
        set({ snoozedUntil: until });
      },
      clearSnooze: () => set({ snoozedUntil: null }),
      setCheckInMode: (mode) => set({ checkInMode: mode }),
      setWeekdayLabel: (day, label) => {
        const d = day >= 0 && day <= 6 ? day : null;
        if (d == null) return;
        set((s) => ({
          weekdayLabels: label
            ? { ...s.weekdayLabels, [d]: label.trim() }
            : (() => {
                const next = { ...s.weekdayLabels };
                delete next[d];
                return next;
              })()
        }));
      }
    }),
    { name: STORAGE_KEY }
  )
);
