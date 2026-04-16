/**
 * ميثاق Store — Mithaq: Self-Contract
 *
 * Manages personal pledges, daily check-ins, completion badges,
 * and break acknowledgments.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PledgeStatus = "active" | "completed" | "broken" | "expired";
export type PledgeCategory = "habit" | "mindset" | "relationship" | "health" | "skill" | "spiritual";

export interface CheckIn {
  id: string;
  date: string; // YYYY-MM-DD
  kept: boolean;
  note: string;
  timestamp: number;
}

export interface Pledge {
  id: string;
  title: string;
  description: string;
  category: PledgeCategory;
  emoji: string;
  successCriteria: string;
  durationDays: number;
  startDate: number;
  endDate: number;
  status: PledgeStatus;
  checkIns: CheckIn[];
  completedAt: number | null;
  brokenAt: number | null;
  breakReason: string;
  reflection: string;
}

interface MithaqState {
  pledges: Pledge[];
  
  addPledge: (data: {
    title: string;
    description: string;
    category: PledgeCategory;
    emoji: string;
    successCriteria: string;
    durationDays: number;
  }) => string;
  
  checkIn: (pledgeId: string, kept: boolean, note: string) => void;
  completePledge: (pledgeId: string, reflection: string) => void;
  breakPledge: (pledgeId: string, reason: string) => void;
  removePledge: (id: string) => void;
  
  getActivePledges: () => Pledge[];
  getCompletedPledges: () => Pledge[];
  getStreakForPledge: (id: string) => number;
  getCompletionRate: (id: string) => number;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const useMithaqState = create<MithaqState>()(
  persist(
    (set, get) => ({
      pledges: [],

      addPledge: (data) => {
        const id = `pl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const now = Date.now();
        const endDate = now + data.durationDays * 24 * 3600000;
        set((s) => ({
          pledges: [
            {
              id,
              ...data,
              startDate: now,
              endDate,
              status: "active",
              checkIns: [],
              completedAt: null,
              brokenAt: null,
              breakReason: "",
              reflection: "",
            },
            ...s.pledges,
          ],
        }));
        return id;
      },

      checkIn: (pledgeId, kept, note) => {
        const key = todayKey();
        set((s) => ({
          pledges: s.pledges.map((p) => {
            if (p.id !== pledgeId) return p;
            // Prevent duplicate check-in for today
            if (p.checkIns.some((c) => c.date === key)) return p;
            return {
              ...p,
              checkIns: [
                ...p.checkIns,
                { id: `ci_${Date.now()}`, date: key, kept, note, timestamp: Date.now() },
              ],
            };
          }),
        }));
      },

      completePledge: (pledgeId, reflection) => {
        set((s) => ({
          pledges: s.pledges.map((p) =>
            p.id === pledgeId
              ? { ...p, status: "completed" as PledgeStatus, completedAt: Date.now(), reflection }
              : p
          ),
        }));
      },

      breakPledge: (pledgeId, reason) => {
        set((s) => ({
          pledges: s.pledges.map((p) =>
            p.id === pledgeId
              ? { ...p, status: "broken" as PledgeStatus, brokenAt: Date.now(), breakReason: reason }
              : p
          ),
        }));
      },

      removePledge: (id) => {
        set((s) => ({ pledges: s.pledges.filter((p) => p.id !== id) }));
      },

      getActivePledges: () => get().pledges.filter((p) => p.status === "active"),
      getCompletedPledges: () => get().pledges.filter((p) => p.status === "completed"),

      getStreakForPledge: (id) => {
        const pledge = get().pledges.find((p) => p.id === id);
        if (!pledge) return 0;
        const sorted = [...pledge.checkIns].filter((c) => c.kept).sort((a, b) => b.timestamp - a.timestamp);
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 365; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          if (sorted.some((c) => c.date === key)) {
            streak++;
          } else if (i > 0) {
            break;
          }
        }
        return streak;
      },

      getCompletionRate: (id) => {
        const pledge = get().pledges.find((p) => p.id === id);
        if (!pledge || pledge.checkIns.length === 0) return 0;
        const kept = pledge.checkIns.filter((c) => c.kept).length;
        return Math.round((kept / pledge.checkIns.length) * 100);
      },
    }),
    { name: "alrehla-mithaq" }
  )
);
