import { create } from "zustand";

const ME_STORAGE_KEY = "dawayir-me";

export type BatteryState = "drained" | "okay" | "charged";

interface MeStored {
  battery: BatteryState;
  journalNote: string;
  shieldMode: boolean;
}

function loadMe(): MeStored {
  if (typeof window === "undefined")
    return { battery: "okay", journalNote: "", shieldMode: false };
  try {
    const raw = window.localStorage.getItem(ME_STORAGE_KEY);
    if (!raw) return { battery: "okay", journalNote: "", shieldMode: false };
    const parsed = JSON.parse(raw) as Partial<MeStored>;
    return {
      battery: parsed.battery ?? "okay",
      journalNote: parsed.journalNote ?? "",
      shieldMode: parsed.shieldMode ?? false
    };
  } catch {
    return { battery: "okay", journalNote: "", shieldMode: false };
  }
}

function saveMe(data: MeStored) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ME_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage might be full or disabled
  }
}

interface MeState extends MeStored {
  setBattery: (battery: BatteryState) => void;
  setJournalNote: (note: string) => void;
  setShieldMode: (on: boolean) => void;
}

export const useMeState = create<MeState>((set) => {
  const stored = loadMe();
  return {
    ...stored,
    setBattery: (battery) =>
      set((s) => {
        const next = { ...s, battery };
        saveMe(next);
        return next;
      }),
    setJournalNote: (journalNote) =>
      set((s) => {
        const next = { ...s, journalNote };
        saveMe(next);
        return next;
      }),
    setShieldMode: (shieldMode) =>
      set((s) => {
        const next = { ...s, shieldMode };
        saveMe(next);
        return next;
      })
  };
});
