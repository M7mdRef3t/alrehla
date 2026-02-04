import { create } from "zustand";
import type { BaselineAnswers } from "../data/baselineQuestions";
import type { PostStepAnswers } from "../data/postStepQuestions";
import { getJSON, setJSON } from "../services/secureStore";

export type JourneyStepId =
  | "baseline"
  | "goal"
  | "map"
  | "measurement"
  | "celebration";

const JOURNEY_STEPS: JourneyStepId[] = [
  "baseline",
  "goal",
  "map",
  "measurement",
  "celebration"
];

const JOURNEY_STORAGE_KEY = "dawayir-journey";

interface StoredJourney {
  currentStepId: JourneyStepId;
  completedStepIds: JourneyStepId[];
  baselineAnswers: BaselineAnswers | null;
  baselineScore: number | null;
  baselineCompletedAt: number | null;
  goalId: string | null;
  category: string | null;
  postStepAnswers: PostStepAnswers | null;
  postStepScore: number | null;
  journeyStartedAt: number | null;
}

async function loadJourney(): Promise<Partial<StoredJourney>> {
  if (typeof window === "undefined") return {};
  try {
    const parsed = await getJSON<StoredJourney>(JOURNEY_STORAGE_KEY);
    return parsed ?? {};
  } catch {
    return {};
  }
}

function saveJourney(data: StoredJourney) {
  if (typeof window === "undefined") return;
  void setJSON(JOURNEY_STORAGE_KEY, data);
}

interface JourneyState extends StoredJourney {
  getCurrentStepIndex: () => number;
  getStepIds: () => JourneyStepId[];
  canGoNext: () => boolean;
  canGoBack: () => boolean;
  goToStep: (stepId: JourneyStepId) => void;
  completeBaseline: (answers: BaselineAnswers, score: number) => void;
  completeGoal: (goalId: string, category: string) => void;
  completePostStep: (answers: PostStepAnswers, score: number) => void;
  goNext: () => void;
  goBack: () => void;
  resetJourney: () => void;
}

const defaultState: StoredJourney = {
  currentStepId: "baseline",
  completedStepIds: [],
  baselineAnswers: null,
  baselineScore: null,
  baselineCompletedAt: null,
  goalId: null,
  category: null,
  postStepAnswers: null,
  postStepScore: null,
  journeyStartedAt: null
};

export const useJourneyState = create<JourneyState>((set, get) => ({
  ...defaultState,
  journeyStartedAt: Date.now(),
  getCurrentStepIndex() {
    const id = get().currentStepId;
    const idx = JOURNEY_STEPS.indexOf(id);
    return idx === -1 ? 0 : idx;
  },
  getStepIds() {
    return JOURNEY_STEPS;
  },
  canGoNext() {
    const i = get().getCurrentStepIndex();
    return i < JOURNEY_STEPS.length - 1;
  },
  canGoBack() {
    return get().getCurrentStepIndex() > 0;
  },
  goToStep(stepId: JourneyStepId) {
    set((s) => {
      const next = { ...s, currentStepId: stepId };
      const completed = s.completedStepIds.includes(stepId)
        ? s.completedStepIds
        : [...s.completedStepIds, stepId];
      next.completedStepIds = [...new Set(completed)];
      saveJourney(next);
      return next;
    });
  },
  completeBaseline(answers: BaselineAnswers, score: number) {
    set((s) => {
      const next: StoredJourney = {
        ...s,
        baselineAnswers: answers,
        baselineScore: score,
        baselineCompletedAt: Date.now(),
        completedStepIds: [...new Set([...s.completedStepIds, "baseline"])],
        currentStepId: "goal"
      };
      saveJourney(next);
      return next;
    });
  },
  completeGoal(goalId: string, category: string) {
    set((s) => {
      const next: StoredJourney = {
        ...s,
        goalId,
        category,
        completedStepIds: [...new Set([...s.completedStepIds, "goal"])],
        currentStepId: "map"
      };
      saveJourney(next);
      return next;
    });
  },
  completePostStep(answers: PostStepAnswers, score: number) {
    set((s) => {
      const next: StoredJourney = {
        ...s,
        postStepAnswers: answers,
        postStepScore: score,
        completedStepIds: [...new Set([...s.completedStepIds, "map", "measurement"])],
        currentStepId: "celebration"
      };
      saveJourney(next);
      return next;
    });
  },
  goNext() {
    const i = get().getCurrentStepIndex();
    if (i >= JOURNEY_STEPS.length - 1) return;
    get().goToStep(JOURNEY_STEPS[i + 1]);
  },
  goBack() {
    const i = get().getCurrentStepIndex();
    if (i <= 0) return;
    get().goToStep(JOURNEY_STEPS[i - 1]);
  },
  resetJourney() {
    const s = get();
    const next: StoredJourney = {
      ...defaultState,
      baselineAnswers: s.baselineAnswers,
      baselineScore: s.baselineScore,
      baselineCompletedAt: s.baselineCompletedAt,
      completedStepIds: ["baseline"],
      currentStepId: "goal",
      goalId: null,
      category: null,
      postStepAnswers: null,
      postStepScore: null,
      journeyStartedAt: s.journeyStartedAt ?? Date.now()
    };
    set(next);
    saveJourney(next);
  }
}));

async function hydrateJourneyState() {
  const stored = await loadJourney();
  let currentStepId = stored.currentStepId ?? defaultState.currentStepId;
  if (stored.baselineCompletedAt != null && currentStepId === "baseline") {
    currentStepId = "goal";
  }
  const next: StoredJourney = {
    ...defaultState,
    ...stored,
    currentStepId,
    journeyStartedAt: stored.journeyStartedAt ?? Date.now()
  };
  useJourneyState.setState(next);
  saveJourney(next);
}

if (typeof window !== "undefined") {
  void hydrateJourneyState();
}

