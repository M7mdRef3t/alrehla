import { create } from "zustand";
import { getFromLocalStorage, setInLocalStorage } from "../services/browserStorage";

const STORAGE_KEY = "dawayir-shadow-pulse";

/** سجل تفاعل واحد مع دائرة شخص */
export interface NodeInteraction {
  nodeId: string;
  openedAt: number;      // timestamp فتح النافذة
  closedAt?: number;     // timestamp إغلاق النافذة
  hadEdit: boolean;      // هل كتب المستخدم شيئاً ثم مسحه؟
  cancelledEdit: boolean; // هل بدأ بتعديل ثم ألغاه؟
  isLateNight: boolean;  // هل كان بعد منتصف الليل؟
}

/** ملخص Shadow Score لشخص معين */
export interface ShadowScore {
  nodeId: string;
  score: number;          // 0–100
  visitCount: number;
  totalTimeMs: number;
  cancelledEdits: number;
  lateNightVisits: number;
  lastVisitAt: number;
}

interface ShadowPulseState {
  interactions: NodeInteraction[];
  scores: Record<string, ShadowScore>;
  /** سجّل بداية فتح نافذة شخص */
  recordOpen: (nodeId: string) => string; // يرجع sessionKey
  /** سجّل إغلاق نافذة شخص + هل كان فيه تعديل ملغى؟ */
  recordClose: (nodeId: string, openedAt: number, cancelledEdit?: boolean) => void;
  /** احسب score لكل الأشخاص */
  recalcScores: (allNodeIds: string[]) => void;
  /** الأشخاص الذين تجاوز score لهم threshold */
  getHighShadowNodes: (threshold?: number) => ShadowScore[];
  hydrate: () => void;
}

function isLateNight(): boolean {
  const h = new Date().getHours();
  return h >= 22 || h < 5;
}

function loadState(): { interactions: NodeInteraction[]; scores: Record<string, ShadowScore> } {
  try {
    const raw = getFromLocalStorage(STORAGE_KEY);
    if (!raw) return { interactions: [], scores: {} };
    return JSON.parse(raw);
  } catch {
    return { interactions: [], scores: {} };
  }
}

function persist(state: { interactions: NodeInteraction[]; scores: Record<string, ShadowScore> }) {
  try {
    // نحتفظ بآخر 200 تفاعل بس عشان ما تكبرش
    const trimmed = { ...state, interactions: state.interactions.slice(-200) };
    setInLocalStorage(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore
  }
}

/**
 * حساب Shadow Score لشخص معين من التفاعلات
 * Score = (visitCount×0.4 + timeScore×0.3 + cancelledEdits×0.2 + lateNightVisits×0.1) × 100
 * المقياس: 0 = لا يفكر فيه، 100 = علاقة "في المنطقة الرمادية"
 */
function computeScore(interactions: NodeInteraction[]): ShadowScore | null {
  if (interactions.length === 0) return null;

  const nodeId = interactions[0].nodeId;
  const visitCount = interactions.length;
  const totalTimeMs = interactions.reduce((sum, i) => {
    if (!i.closedAt) return sum;
    return sum + (i.closedAt - i.openedAt);
  }, 0);
  const cancelledEdits = interactions.filter((i) => i.cancelledEdit).length;
  const lateNightVisits = interactions.filter((i) => i.isLateNight).length;
  const lastVisitAt = Math.max(...interactions.map((i) => i.openedAt));

  // تطبيع الأوزان (max values للتطبيع: visits=20, time=5min, cancelled=5, lateNight=10)
  const vNorm = Math.min(visitCount / 20, 1);
  const tNorm = Math.min(totalTimeMs / (5 * 60 * 1000), 1);
  const cNorm = Math.min(cancelledEdits / 5, 1);
  const lNorm = Math.min(lateNightVisits / 10, 1);

  const score = Math.round((vNorm * 0.4 + tNorm * 0.3 + cNorm * 0.2 + lNorm * 0.1) * 100);

  return { nodeId, score, visitCount, totalTimeMs, cancelledEdits, lateNightVisits, lastVisitAt };
}

export const useShadowPulseState = create<ShadowPulseState>((set, get) => ({
  interactions: [],
  scores: {},

  hydrate: () => {
    const data = loadState();
    set(data);
  },

  recordOpen: (nodeId) => {
    // نسجل فتح جديد — يرجع timestamp كـ session key
    const openedAt = Date.now();
    const newInteraction: NodeInteraction = {
      nodeId,
      openedAt,
      hadEdit: false,
      cancelledEdit: false,
      isLateNight: isLateNight(),
    };
    const updated = [...get().interactions, newInteraction];
    const next = { ...get(), interactions: updated };
    persist(next);
    set({ interactions: updated });
    return String(openedAt);
  },

  recordClose: (nodeId, openedAt, cancelledEdit = false) => {
    const interactions = get().interactions.map((i) =>
      i.nodeId === nodeId && i.openedAt === openedAt
        ? { ...i, closedAt: Date.now(), cancelledEdit }
        : i
    );
    const next = { ...get(), interactions };
    persist(next);
    set({ interactions });
    // إعادة حساب score للشخص ده
    get().recalcScores([nodeId]);
  },

  recalcScores: (allNodeIds) => {
    const { interactions, scores } = get();
    const updated = { ...scores };
    for (const nodeId of allNodeIds) {
      const nodeInteractions = interactions.filter((i) => i.nodeId === nodeId);
      const score = computeScore(nodeInteractions);
      if (score) {
        updated[nodeId] = score;
      }
    }
    const next = { interactions, scores: updated };
    persist(next);
    set({ scores: updated });
  },

  getHighShadowNodes: (threshold = 30) => {
    return Object.values(get().scores)
      .filter((s) => s.score >= threshold)
      .sort((a, b) => b.score - a.score);
  },
}));
