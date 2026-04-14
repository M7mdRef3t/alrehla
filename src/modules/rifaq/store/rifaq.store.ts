/**
 * رفاق Store — Rifaq: Social Buddy System
 * 
 * Manages buddy connections, invitations, and team challenges.
 * Frontend-first with local persistence; ready for Supabase real-time later.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type BuddyStatus = "invited" | "active" | "paused";

export interface Buddy {
  id: string;
  name: string;
  avatarEmoji: string;
  /** Goal they're working on (from Masarat) */
  goal: string;
  /** When the connection was made */
  connectedAt: number;
  status: BuddyStatus;
  /** Privacy-safe progress score 0-100 */
  progressScore: number;
  /** Current streak (days) */
  streak: number;
  /** Last active timestamp */
  lastActiveAt: number;
  /** Shared encouragement messages */
  messages: BuddyMessage[];
}

export interface BuddyMessage {
  id: string;
  from: "me" | "buddy";
  text: string;
  timestamp: number;
  type: "encouragement" | "milestone" | "challenge";
}

export interface TeamChallenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  /** Days to complete */
  duration: number;
  startedAt: number;
  /** My progress (0-100) */
  myProgress: number;
  /** Buddy progress (0-100) */
  buddyProgress: number;
  buddyId: string;
  status: "active" | "completed" | "expired";
}

interface RifaqState {
  buddies: Buddy[];
  challenges: TeamChallenge[];
  inviteCode: string | null;
  totalConnections: number;

  // Actions
  addBuddy: (buddy: Omit<Buddy, "messages" | "connectedAt">) => void;
  removeBuddy: (id: string) => void;
  sendMessage: (buddyId: string, text: string, type: BuddyMessage["type"]) => void;
  startChallenge: (challenge: Omit<TeamChallenge, "myProgress" | "buddyProgress" | "startedAt" | "status">) => void;
  updateChallengeProgress: (challengeId: string, progress: number) => void;
  generateInviteCode: () => string;
}

const STORAGE_KEY = "rifaq-social";

const generateId = () => Math.random().toString(36).slice(2, 10);

export const useRifaqState = create<RifaqState>()(
  persist(
    (set, get) => ({
      buddies: [],
      challenges: [],
      inviteCode: null,
      totalConnections: 0,

      addBuddy: (buddy) => {
        const entry: Buddy = {
          ...buddy,
          connectedAt: Date.now(),
          messages: [],
        };
        set((s) => ({
          buddies: [...s.buddies, entry],
          totalConnections: s.totalConnections + 1,
        }));
      },

      removeBuddy: (id) => {
        set((s) => ({
          buddies: s.buddies.filter((b) => b.id !== id),
        }));
      },

      sendMessage: (buddyId, text, type) => {
        const msg: BuddyMessage = {
          id: generateId(),
          from: "me",
          text,
          timestamp: Date.now(),
          type,
        };
        set((s) => ({
          buddies: s.buddies.map((b) =>
            b.id === buddyId
              ? { ...b, messages: [...b.messages, msg].slice(-50) }
              : b
          ),
        }));
      },

      startChallenge: (challenge) => {
        const entry: TeamChallenge = {
          ...challenge,
          myProgress: 0,
          buddyProgress: 0,
          startedAt: Date.now(),
          status: "active",
        };
        set((s) => ({ challenges: [...s.challenges, entry] }));
      },

      updateChallengeProgress: (challengeId, progress) => {
        set((s) => ({
          challenges: s.challenges.map((c) =>
            c.id === challengeId
              ? {
                  ...c,
                  myProgress: Math.min(100, progress),
                  status: progress >= 100 ? "completed" : c.status,
                }
              : c
          ),
        }));
      },

      generateInviteCode: () => {
        const code = `RIFAQ-${generateId().toUpperCase()}`;
        set({ inviteCode: code });
        return code;
      },
    }),
    { name: STORAGE_KEY }
  )
);
