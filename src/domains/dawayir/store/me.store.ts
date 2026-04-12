import { create } from "zustand";
import { getJSON, setJSON } from "@/services/secureStore";

const ME_STORAGE_KEY = "dawayir-me";

export type BatteryState = "drained" | "okay" | "charged";

interface MeStored {
  battery: BatteryState;
  journalNote: string;
  shieldMode: boolean;
}

const defaultState: MeStored = {
  battery: "okay",
  journalNote: "",
  shieldMode: false
};

async function loadMe(): Promise<MeStored> {
  if (typeof window === "undefined") return defaultState;
  try {
    const parsed = await getJSON<Partial<MeStored>>(ME_STORAGE_KEY);
    return {
      battery: parsed?.battery ?? "okay",
      journalNote: parsed?.journalNote ?? "",
      shieldMode: parsed?.shieldMode ?? false
    };
  } catch {
    return defaultState;
  }
}

function saveMe(data: MeStored) {
  if (typeof window === "undefined") return;
  void setJSON(ME_STORAGE_KEY, data);
}

interface MeState extends MeStored {
  setBattery: (battery: BatteryState) => void;
  setJournalNote: (note: string) => void;
  setShieldMode: (on: boolean) => void;
}

export const useMeState = create<MeState>((set) => ({
  ...defaultState,
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
}));

async function hydrateMeState() {
  const stored = await loadMe();
  useMeState.setState(stored);
  saveMe(stored);
}

if (typeof window !== "undefined") {
  void hydrateMeState();
}

