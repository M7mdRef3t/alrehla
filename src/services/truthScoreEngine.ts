/**
 * ⚔️ Truth Score Engine — نقطة الصفر
 * ===================================
 * مقياس واحد 0-100 يقيس "صدق المستخدم مع نفسه".
 * لا يقيس الإنجاز أو السعادة — يقيس الشجاعة والأمانة الذاتية.
 *
 * المعادلة:
 * ───────────
 * +10  عند مواجهة تناقض
 * +5   عند تسجيل reciprocity بصدق
 * -10  عند تجاهل ٣ تناقضات متتالية
 * -5   عند تغيير تقييم علاقة ٣ مرات في أسبوع (تردد)
 * +15  عند اتخاذ قرار صعب (أرشفة/فك ارتباط)
 * +3   عند تسجيل Pulse بانتظام (اتساق)
 * -3   عند عدم تسجيل Pulse لـ ٣ أيام متتالية
 */

import { useMapState } from "@/modules/map/dawayirIndex";
import { usePulseState } from "@/domains/consciousness/store/pulse.store";

export interface TruthScoreState {
    score: number;
    level: TruthLevel;
    trend: "improving" | "stable" | "declining";
    lastUpdated: number;
    /** سجل التغييرات */
    history: TruthScoreEvent[];
}

export type TruthLevel =
    | "deluded"      // 0-20: ضال
    | "foggy"        // 21-40: ضبابي
    | "awakening"    // 41-60: يصحى
    | "seeing"       // 61-80: بيشوف
    | "truthful";    // 81-100: صادق

export interface TruthScoreEvent {
    type: TruthEventType;
    points: number;
    description: string;
    timestamp: number;
}

export type TruthEventType =
    | "confronted_truth"       // واجه تناقض
    | "ignored_truth"          // تجاهل تناقض
    | "reciprocity_recorded"   // سجل مقابل
    | "hard_decision"          // قرار صعب (أرشفة/فك ارتباط)
    | "ring_instability"       // تغيير مداري متكرر
    | "pulse_consistency"      // اتساق النبض
    | "pulse_gap"              // فجوة نبض
    | "bias_acknowledged";     // اعتراف بانحياز

const TRUTH_STORE_KEY = "dawayir-truth-score";

function loadState(): TruthScoreState {
    try {
        const raw = localStorage.getItem(TRUTH_STORE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* noop */ }

    return {
        score: 50,
        level: "awakening",
        trend: "stable",
        lastUpdated: Date.now(),
        history: []
    };
}

function saveState(state: TruthScoreState): void {
    try {
        localStorage.setItem(TRUTH_STORE_KEY, JSON.stringify(state));
    } catch { /* noop */ }
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

function getLevel(score: number): TruthLevel {
    if (score <= 20) return "deluded";
    if (score <= 40) return "foggy";
    if (score <= 60) return "awakening";
    if (score <= 80) return "seeing";
    return "truthful";
}

function calculateTrend(history: TruthScoreEvent[]): "improving" | "stable" | "declining" {
    const recent = history.slice(0, 10);
    if (recent.length < 3) return "stable";

    const totalPoints = recent.reduce((sum, e) => sum + e.points, 0);
    if (totalPoints > 5) return "improving";
    if (totalPoints < -5) return "declining";
    return "stable";
}

// ─── Milestone Listeners ────────────────

type TruthMilestoneListener = (type: TruthEventType, state: TruthScoreState) => void;
const milestoneListeners: Set<TruthMilestoneListener> = new Set();

/**
 * Subscribe to truth milestone events (positive events only).
 * Returns an unsubscribe function.
 */
export function onTruthMilestone(listener: TruthMilestoneListener): () => void {
    milestoneListeners.add(listener);
    return () => { milestoneListeners.delete(listener); };
}

const POSITIVE_EVENTS: TruthEventType[] = [
    "confronted_truth", "hard_decision", "reciprocity_recorded",
    "bias_acknowledged", "pulse_consistency"
];

// ─── Public API ────────────────

/**
 * Get current Truth Score
 */
export function getTruthScore(): TruthScoreState {
    const state = loadState();
    // Recalculate level and trend
    state.level = getLevel(state.score);
    state.trend = calculateTrend(state.history);
    return state;
}

/**
 * Record a truth event that modifies the score
 */
export function recordTruthEvent(type: TruthEventType, description?: string): TruthScoreState {
    const state = loadState();
    const now = Date.now();

    const EVENT_POINTS: Record<TruthEventType, number> = {
        confronted_truth: 10,
        ignored_truth: -5,
        reciprocity_recorded: 5,
        hard_decision: 15,
        ring_instability: -5,
        pulse_consistency: 3,
        pulse_gap: -3,
        bias_acknowledged: 8
    };

    const EVENT_DESCRIPTIONS: Record<TruthEventType, string> = {
        confronted_truth: "واجهت حقيقة مؤلمة",
        ignored_truth: "تجاهلت تنبيه المرآة",
        reciprocity_recorded: "سجلت تفاعل بصدق",
        hard_decision: "اتخذت قرار صعب",
        ring_instability: "تردد في تقييم علاقة",
        pulse_consistency: "نبض منتظم",
        pulse_gap: "فجوة في تسجيل النبض",
        bias_acknowledged: "اعترفت بانحياز"
    };

    const points = EVENT_POINTS[type];
    const event: TruthScoreEvent = {
        type,
        points,
        description: description ?? EVENT_DESCRIPTIONS[type],
        timestamp: now
    };

    state.score = clamp(state.score + points, 0, 100);
    state.level = getLevel(state.score);
    state.history.unshift(event);
    state.history = state.history.slice(0, 50); // Keep last 50 events
    state.trend = calculateTrend(state.history);
    state.lastUpdated = now;

    saveState(state);

    // Notify milestone listeners for positive events
    if (POSITIVE_EVENTS.includes(type)) {
        for (const listener of milestoneListeners) {
            try { listener(type, state); } catch { /* noop */ }
        }
    }

    return state;
}

/**
 * Get the label for the current truth level in Arabic
 */
export function getTruthLevelLabel(level: TruthLevel): string {
    const labels: Record<TruthLevel, string> = {
        deluded: "ضال عن الحقيقة",
        foggy: "في الضباب",
        awakening: "بيصحى",
        seeing: "بيشوف",
        truthful: "صادق مع نفسه"
    };
    return labels[level];
}

/**
 * Get color for truth level
 */
export function getTruthLevelColor(level: TruthLevel): string {
    const colors: Record<TruthLevel, string> = {
        deluded: "#ef4444",    // Red
        foggy: "#f59e0b",      // Amber
        awakening: "#eab308",  // Yellow
        seeing: "#22d3ee",     // Cyan
        truthful: "#10b981"    // Emerald
    };
    return colors[level];
}

/**
 * Auto-detect pulse consistency/gap and record event
 */
export function checkPulseConsistency(): void {
    const { logs } = usePulseState.getState();
    const DAY_MS = 24 * 60 * 60 * 1000;
    const now = Date.now();

    if (logs.length === 0) return;

    const latestPulseTime = typeof logs[0].timestamp === "number"
        ? logs[0].timestamp
        : new Date(logs[0].timestamp).getTime();

    const daysSinceLastPulse = (now - latestPulseTime) / DAY_MS;

    if (daysSinceLastPulse >= 3) {
        // Gap detected
        const state = loadState();
        const recentGap = state.history.find(
            e => e.type === "pulse_gap" && (now - e.timestamp) < DAY_MS
        );
        if (!recentGap) {
            recordTruthEvent("pulse_gap", `${Math.floor(daysSinceLastPulse)} أيام بدون نبض`);
        }
    } else if (logs.length >= 3) {
        // Check for consistency (3+ entries in last 7 days)
        const recentLogs = logs.filter(l => {
            const t = typeof l.timestamp === "number" ? l.timestamp : new Date(l.timestamp).getTime();
            return (now - t) < 7 * DAY_MS;
        });
        if (recentLogs.length >= 5) {
            const state = loadState();
            const recentConsistency = state.history.find(
                e => e.type === "pulse_consistency" && (now - e.timestamp) < 3 * DAY_MS
            );
            if (!recentConsistency) {
                recordTruthEvent("pulse_consistency", "نبض منتظم لمدة أسبوع");
            }
        }
    }
}

/**
 * Auto-detect ring instability (changing ring 3+ times in a week)
 */
export function checkRingInstability(): void {
    const { nodes } = useMapState.getState();
    const DAY_MS = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const weekAgo = now - 7 * DAY_MS;

    for (const node of nodes) {
        if (node.isNodeArchived) continue;
        const history = node.orbitHistory ?? [];
        const weekChanges = history.filter(
            h => h.type === "ring_changed" && h.timestamp >= weekAgo
        ).length;

        if (weekChanges >= 3) {
            const state = loadState();
            const alreadyRecorded = state.history.find(
                e => e.type === "ring_instability" &&
                     e.description.includes(node.label) &&
                     (now - e.timestamp) < 7 * DAY_MS
            );
            if (!alreadyRecorded) {
                recordTruthEvent(
                    "ring_instability",
                    `تردد مع "${node.label}" — ${weekChanges} تغييرات في أسبوع`
                );
            }
        }
    }
}
