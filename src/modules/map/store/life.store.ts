/**
 * 🧬 Life State — المتجر المركزي لنظام تشغيل الحياة
 * =====================================================
 * يدير كل بيانات الحياة: تقييمات المجالات، المدخلات اليومية،
 * المشاكل، القرارات، وحساب الـ Life Score.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  LifeDomainId,
  DomainAssessment,
  LifeEntry,
  LifeEntryType,
  LifeScore,
  LifeProblem,
  LifeDecision,
  ProblemImpact,
  DecisionUrgency,
  DecisionOption,
  MorningBriefData,
  MorningPriority
} from "@/types/lifeDomains";
import { calculateLifeScore, calculateTrend } from "@/services/lifeScoreEngine";
import { zustandIdbStorage } from '@/utils/idbStorage';


const STORAGE_KEY = "alrehla-life-os";

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── State Interface ─────────────────────────────────────────────
interface LifeState {
  // Data
  assessments: DomainAssessment[];
  entries: LifeEntry[];
  lifeScore: LifeScore | null;
  scoreHistory: number[];         // Last 30 overall scores
  morningBrief: MorningBriefData | null;
  lastAssessmentDate: string | null; // "YYYY-MM-DD"

  // UI State
  activeDomain: LifeDomainId | null;
  isQuickCaptureOpen: boolean;

  // Actions — Assessment
  submitAssessment: (domainId: LifeDomainId, score: number, answers: number[], note?: string) => void;
  
  // Actions — Life Entries
  addEntry: (type: LifeEntryType, content: string, domainId: LifeDomainId, priority?: number) => string;
  updateEntry: (id: string, updates: Partial<LifeEntry>) => void;
  resolveEntry: (id: string) => void;
  archiveEntry: (id: string) => void;
  deleteEntry: (id: string) => void;

  // Actions — Problems
  addProblem: (content: string, domainId: LifeDomainId, impact: ProblemImpact, affectedDomains?: LifeDomainId[]) => string;
  
  // Actions — Decisions
  addDecision: (content: string, domainId: LifeDomainId, urgency: DecisionUrgency, options?: DecisionOption[]) => string;
  decideOption: (decisionId: string, optionId: string) => void;
  addDecisionRetrospective: (decisionId: string, text: string) => void;

  // Actions — Score
  recalculateLifeScore: () => void;

  // Actions — Morning Brief
  setMorningBrief: (brief: MorningBriefData) => void;

  // Actions — UI
  setActiveDomain: (domainId: LifeDomainId | null) => void;
  setQuickCaptureOpen: (open: boolean) => void;

  // Getters
  getActiveProblems: () => LifeEntry[];
  getPendingDecisions: () => LifeEntry[];
  getEntriesByDomain: (domainId: LifeDomainId) => LifeEntry[];
  getLatestAssessment: (domainId: LifeDomainId) => DomainAssessment | null;
  hasAssessedToday: () => boolean;
}

// ─── Store ───────────────────────────────────────────────────────
export const useLifeState = create<LifeState>()(
  persist(
    (set, get) => ({
      // Initial data
      assessments: [],
      entries: [],
      lifeScore: null,
      scoreHistory: [],
      morningBrief: null,
      lastAssessmentDate: null,
      activeDomain: null,
      isQuickCaptureOpen: false,

      // ── Assessment ──
      submitAssessment: (domainId, score, answers, note) => {
        const assessment: DomainAssessment = {
          domainId,
          score,
          answers,
          note,
          timestamp: Date.now()
        };
        set(s => {
          const assessments = [assessment, ...s.assessments].slice(0, 500);
          return {
            assessments,
            lastAssessmentDate: new Date().toISOString().split("T")[0]
          };
        });
        // Auto-recalculate score after assessment
        get().recalculateLifeScore();
      },

      // ── Life Entries ──
      addEntry: (type, content, domainId, priority = 3) => {
        const id = uid();
        const entry: LifeEntry = {
          id,
          type,
          content,
          domainId,
          priority,
          status: "active",
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        set(s => ({
          entries: [entry, ...s.entries].slice(0, 1000)
        }));
        return id;
      },

      updateEntry: (id, updates) => {
        set(s => ({
          entries: s.entries.map(e =>
            e.id === id ? { ...e, ...updates, updatedAt: Date.now() } : e
          )
        }));
      },

      resolveEntry: (id) => {
        set(s => ({
          entries: s.entries.map(e =>
            e.id === id
              ? { ...e, status: "resolved" as const, resolvedAt: Date.now(), updatedAt: Date.now() }
              : e
          )
        }));
        get().recalculateLifeScore();
      },

      archiveEntry: (id) => {
        set(s => ({
          entries: s.entries.map(e =>
            e.id === id
              ? { ...e, status: "archived" as const, updatedAt: Date.now() }
              : e
          )
        }));
      },

      deleteEntry: (id) => {
        set(s => ({
          entries: s.entries.filter(e => e.id !== id)
        }));
      },

      // ── Problems ──
      addProblem: (content, domainId, impact, affectedDomains) => {
        const id = uid();
        const problem: LifeProblem = {
          id,
          type: "problem",
          content,
          domainId,
          impact,
          affectedDomains: affectedDomains ?? [domainId],
          priority: impact === "critical" ? 5 : impact === "high" ? 4 : impact === "medium" ? 3 : 2,
          status: "active",
          isRecurring: false,
          occurrenceCount: 1,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        set(s => ({
          entries: [problem as LifeEntry, ...s.entries]
        }));
        get().recalculateLifeScore();
        return id;
      },

      // ── Decisions ──
      addDecision: (content, domainId, urgency, options) => {
        const id = uid();
        const decision: LifeDecision = {
          id,
          type: "decision",
          content,
          domainId,
          urgency,
          outcome: "pending",
          options: options ?? [],
          priority: urgency === "now" ? 5 : urgency === "today" ? 4 : urgency === "this_week" ? 3 : 2,
          status: "active",
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        set(s => ({
          entries: [decision as LifeEntry, ...s.entries]
        }));
        return id;
      },

      decideOption: (decisionId, optionId) => {
        set(s => ({
          entries: s.entries.map(e => {
            if (e.id !== decisionId || e.type !== "decision") return e;
            return {
              ...e,
              chosenOptionId: optionId,
              outcome: "decided",
              status: "resolved" as const,
              resolvedAt: Date.now(),
              updatedAt: Date.now()
            } as LifeEntry;
          })
        }));
      },

      addDecisionRetrospective: (decisionId, text) => {
        set(s => ({
          entries: s.entries.map(e => {
            if (e.id !== decisionId || e.type !== "decision") return e;
            return {
              ...e,
              retrospective: text,
              outcome: "reviewed",
              updatedAt: Date.now()
            } as LifeEntry;
          })
        }));
      },

      // ── Score ──
      recalculateLifeScore: () => {
        const { assessments, entries, scoreHistory } = get();
        const lifeScore = calculateLifeScore(assessments, entries);

        // Update trend
        lifeScore.trend = calculateTrend(lifeScore.overall, scoreHistory);

        const newHistory = [lifeScore.overall, ...scoreHistory].slice(0, 30);

        set({
          lifeScore,
          scoreHistory: newHistory
        });
      },

      // ── Morning Brief ──
      setMorningBrief: (brief) => set({ morningBrief: brief }),

      // ── UI ──
      setActiveDomain: (domainId) => set({ activeDomain: domainId }),
      setQuickCaptureOpen: (open) => set({ isQuickCaptureOpen: open }),

      // ── Getters ──
      getActiveProblems: () => {
        return get().entries.filter(
          e => e.type === "problem" && e.status === "active"
        );
      },

      getPendingDecisions: () => {
        return get().entries.filter(
          e => e.type === "decision" && e.status === "active"
        );
      },

      getEntriesByDomain: (domainId) => {
        return get().entries.filter(e => e.domainId === domainId);
      },

      getLatestAssessment: (domainId) => {
        const relevant = get().assessments
          .filter(a => a.domainId === domainId)
          .sort((a, b) => b.timestamp - a.timestamp);
        return relevant[0] ?? null;
      },

      hasAssessedToday: () => {
        const today = new Date().toISOString().split("T")[0];
        return get().lastAssessmentDate === today;
      }
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({
        assessments: s.assessments,
        entries: s.entries,
        lifeScore: s.lifeScore,
        scoreHistory: s.scoreHistory,
        lastAssessmentDate: s.lastAssessmentDate
      })
    }
  )
);
