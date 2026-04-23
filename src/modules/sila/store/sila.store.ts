/**
 * صلة — Sila Store
 * Relationship Quality Tracker: monitor connection health with your most important people.
 * Track communication frequency, emotional depth, and reciprocity.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandIdbStorage } from '@/utils/idbStorage';


export type RelationshipType = "family" | "friend" | "partner" | "mentor" | "colleague" | "community";
export type ConnectionQuality = 1 | 2 | 3 | 4 | 5; // 1=disconnected, 5=deeply connected

export interface Person {
  id: string;
  name: string;
  type: RelationshipType;
  quality: ConnectionQuality;
  lastContact: string; // ISO date
  contactCount: number;
  notes: string;
  createdAt: number;
}

export interface ContactLog {
  id: string;
  personId: string;
  quality: ConnectionQuality;
  method: "face" | "call" | "message" | "thought";
  note: string;
  date: string;
  createdAt: number;
}

export interface SilaState {
  people: Person[];
  logs: ContactLog[];
  addPerson: (name: string, type: RelationshipType, notes?: string) => void;
  removePerson: (id: string) => void;
  logContact: (personId: string, quality: ConnectionQuality, method: ContactLog["method"], note?: string) => void;
  updateQuality: (personId: string, quality: ConnectionQuality) => void;
  getPerson: (id: string) => Person | undefined;
  getByType: (type: RelationshipType) => Person[];
  getNeglected: (days: number) => Person[];
  getOverallHealth: () => number;
  getPersonLogs: (personId: string) => ContactLog[];
  getTotalPeople: () => number;
}

export const RELATION_META: Record<RelationshipType, { label: string; emoji: string; color: string }> = {
  family:    { label: "عائلة",    emoji: "👨‍👩‍👧‍👦", color: "#ef4444" },
  friend:    { label: "صديق",    emoji: "🤝",        color: "#22c55e" },
  partner:   { label: "شريك",    emoji: "💑",        color: "#ec4899" },
  mentor:    { label: "مرشد",    emoji: "🧙",        color: "#8b5cf6" },
  colleague: { label: "زميل",    emoji: "💼",        color: "#06b6d4" },
  community: { label: "مجتمع",   emoji: "🌍",        color: "#f59e0b" },
};

export const QUALITY_META: Record<ConnectionQuality, { label: string; emoji: string; color: string }> = {
  1: { label: "منقطع",     emoji: "💔", color: "#ef4444" },
  2: { label: "ضعيف",      emoji: "😕", color: "#f97316" },
  3: { label: "مقبول",     emoji: "😐", color: "#f59e0b" },
  4: { label: "جيد",       emoji: "😊", color: "#22c55e" },
  5: { label: "عميق",      emoji: "💖", color: "#10b981" },
};

export const METHOD_META: Record<ContactLog["method"], { label: string; emoji: string }> = {
  face:    { label: "وجهاً لوجه", emoji: "👤" },
  call:    { label: "مكالمة",     emoji: "📞" },
  message: { label: "رسالة",      emoji: "💬" },
  thought: { label: "تفكير/دعاء", emoji: "🤲" },
};

const genId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const todayKey = () => new Date().toISOString().slice(0, 10);

export const useSilaState = create<SilaState>()(
  persist(
    (set, get) => ({
      people: [], logs: [],

      addPerson: (name, type, notes = "") => {
        const person: Person = { id: genId(), name: name.trim(), type, quality: 3, lastContact: todayKey(), contactCount: 0, notes: notes.trim(), createdAt: Date.now() };
        set(s => ({ people: [...s.people, person].slice(0, 50) }));
      },

      removePerson: (id) => set(s => ({ people: s.people.filter(p => p.id !== id), logs: s.logs.filter(l => l.personId !== id) })),

      logContact: (personId, quality, method, note = "") => {
        const log: ContactLog = { id: genId(), personId, quality, method, note: note.trim(), date: todayKey(), createdAt: Date.now() };
        set(s => ({
          logs: [log, ...s.logs].slice(0, 500),
          people: s.people.map(p => p.id === personId ? { ...p, quality, lastContact: todayKey(), contactCount: p.contactCount + 1 } : p),
        }));
      },

      updateQuality: (personId, quality) => set(s => ({
        people: s.people.map(p => p.id === personId ? { ...p, quality } : p),
      })),

      getPerson: (id) => get().people.find(p => p.id === id),
      getByType: (type) => get().people.filter(p => p.type === type),

      getNeglected: (days) => {
        const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
        const cutStr = cutoff.toISOString().slice(0, 10);
        return get().people.filter(p => p.lastContact < cutStr);
      },

      getOverallHealth: () => {
        const p = get().people;
        if (!p.length) return 0;
        return Math.round((p.reduce((a, person) => a + person.quality, 0) / (p.length * 5)) * 100);
      },

      getPersonLogs: (personId) => get().logs.filter(l => l.personId === personId),
      getTotalPeople: () => get().people.length,
    }),
    { name: "alrehla-sila", storage: zustandIdbStorage }
  )
);
