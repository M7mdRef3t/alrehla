/**
 * ⚔️ Weekly Truth Report — تقرير الحقيقة الأسبوعي
 * =================================================
 * يجمع كل الاكتشافات من المحركات المختلفة في تقرير واحد
 * صادق بلا مجاملة — يُظهر الحقيقة الأسبوعية بالأرقام.
 *
 * المصادر:
 * - mirrorLogic → التناقضات المكتشفة
 * - cognitiveBiasEngine → الانحيازات المكتشفة
 * - reciprocityEngine → العلاقات غير المتوازنة
 * - truthVault → الحقائق المواجهة والمتجاهلة
 * - pulseState → متوسط الطاقة والمزاج
 */

import { useMapState } from "@/modules/map/dawayirIndex";
import { usePulseState } from "@/domains/consciousness/store/pulse.store";
import { detectAllContradictions } from "./mirrorLogic";
import { detectCognitiveBiases } from "./cognitiveBiasEngine";
import { calculateReciprocityIndex } from "./reciprocityEngine";

export interface WeeklyTruthReport {
    /** بداية الأسبوع */
    weekStart: string;
    /** نهاية الأسبوع */
    weekEnd: string;
    /** تاريخ التوليد */
    generatedAt: number;

    // ─── أقسام التقرير ────────────────

    /** ملخص الحالة العامة */
    overview: {
        avgEnergy: number;
        dominantMood: string;
        totalNodes: number;
        redNodes: number;
        greenNodes: number;
    };

    /** التناقضات المكتشفة */
    contradictions: {
        total: number;
        confronted: number;
        ignored: number;
        details: Array<{ title: string; severity: string }>;
    };

    /** الانحيازات المكتشفة */
    biases: {
        total: number;
        types: string[];
        mostCritical: string | null;
    };

    /** العلاقات غير المتوازنة */
    imbalancedRelations: Array<{
        name: string;
        index: number;
        label: string;
        givenCount: number;
        receivedCount: number;
    }>;

    /** مقياس الصدق (Truth Score الخام) */
    rawTruthIndicators: {
        confrontedTruths: number;
        ignoredTruths: number;
        reciprocityTracked: boolean;
        pulseConsistency: number; // 0-100
    };

    /** الرسالة الختامية */
    closingMessage: string;
}

/**
 * توليد تقرير الحقيقة الأسبوعي
 */
export function generateWeeklyReport(): WeeklyTruthReport {
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;
    const weekStart = new Date(now - 7 * DAY_MS);
    const weekEnd = new Date(now);

    // ─── جمع البيانات ────────────────

    // Pulse
    const { logs: pulseLogs } = usePulseState.getState();
    const weekPulses = pulseLogs.filter(p => {
        const pTime = typeof p.timestamp === "number" ? p.timestamp : new Date(p.timestamp).getTime();
        return pTime >= weekStart.getTime();
    });
    const avgEnergy = weekPulses.length > 0
        ? weekPulses.reduce((s, p) => s + (Number(p.energy) || 0), 0) / weekPulses.length
        : 0;

    // Mood frequency
    const moodCount: Record<string, number> = {};
    weekPulses.forEach(p => {
        moodCount[p.mood] = (moodCount[p.mood] || 0) + 1;
    });
    const dominantMood = Object.entries(moodCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "غير محدد";

    // Map nodes
    const { nodes } = useMapState.getState();
    const activeNodes = nodes.filter(n => !n.isNodeArchived);
    const redNodes = activeNodes.filter(n => n.ring === "red");
    const greenNodes = activeNodes.filter(n => n.ring === "green");

    // Contradictions
    const contradictions = detectAllContradictions();

    // Biases
    const biases = detectCognitiveBiases();

    // Reciprocity — find imbalanced
    const imbalanced = activeNodes
        .filter(n => n.reciprocity && (n.reciprocity.givenCount + n.reciprocity.receivedCount) >= 2)
        .map(n => ({
            node: n,
            score: calculateReciprocityIndex(n)
        }))
        .filter(r => r.score.hasImbalance)
        .sort((a, b) => a.score.index - b.score.index)
        .slice(0, 5);

    // Truth indicators
    const mirrorShownRaw = localStorage.getItem("dawayir-mirror-shown");
    const mirrorShownCount = mirrorShownRaw ? JSON.parse(mirrorShownRaw).length : 0;
    const biasShownRaw = localStorage.getItem("dawayir-bias-shown");
    const biasShownCount = biasShownRaw ? JSON.parse(biasShownRaw).length : 0;

    const confronted = contradictions.length; // Active = confronted this session
    const ignored = mirrorShownCount + biasShownCount;

    // Pulse consistency — how stable is the user's energy
    let pulseConsistency = 50;
    if (weekPulses.length >= 3) {
        const energies = weekPulses.map(p => Number(p.energy) || 0);
        const mean = energies.reduce((a, b) => a + b, 0) / energies.length;
        const variance = energies.reduce((s, e) => s + Math.pow(e - mean, 2), 0) / energies.length;
        const stdDev = Math.sqrt(variance);
        // Low std dev = consistent (higher score), high std dev = erratic (lower score)
        pulseConsistency = Math.max(0, Math.min(100, Math.round(100 - stdDev * 15)));
    }

    const reciprocityTracked = activeNodes.some(n =>
        n.reciprocity && (n.reciprocity.givenCount + n.reciprocity.receivedCount) > 0
    );

    // ─── الرسالة الختامية ────────────────
    let closingMessage: string;
    const honesty = confronted > ignored ? "عالي" : confronted === ignored ? "متوسط" : "ضعيف";

    if (honesty === "عالي") {
        closingMessage = "أسبوع صادق — واجهت الحقيقة أكتر ما هربت منها. كمل.";
    } else if (honesty === "متوسط") {
        closingMessage = "أسبوع عادي — شفت بعض الحقائق وتجاهلت بعضها. الأسبوع الجاي فرصة تكون أصدق.";
    } else {
        closingMessage = "الأسبوع ده هربت من الحقيقة أكتر ما واجهتها. المنصة شافت — والسؤال: إنت شفت؟";
    }

    return {
        weekStart: weekStart.toISOString().split("T")[0],
        weekEnd: weekEnd.toISOString().split("T")[0],
        generatedAt: now,

        overview: {
            avgEnergy: Math.round(avgEnergy * 10) / 10,
            dominantMood,
            totalNodes: activeNodes.length,
            redNodes: redNodes.length,
            greenNodes: greenNodes.length,
        },

        contradictions: {
            total: contradictions.length,
            confronted,
            ignored,
            details: contradictions.map(c => ({ title: c.title, severity: c.severity })),
        },

        biases: {
            total: biases.length,
            types: biases.map(b => b.titleAr),
            mostCritical: biases.find(b => b.severity === "high")?.titleAr ?? null,
        },

        imbalancedRelations: imbalanced.map(r => ({
            name: r.node.label,
            index: r.score.index,
            label: r.score.label,
            givenCount: r.node.reciprocity?.givenCount ?? 0,
            receivedCount: r.node.reciprocity?.receivedCount ?? 0,
        })),

        rawTruthIndicators: {
            confrontedTruths: confronted,
            ignoredTruths: ignored,
            reciprocityTracked,
            pulseConsistency,
        },

        closingMessage,
    };
}

/**
 * حفظ التقرير في localStorage (Supabase integration later)
 */
const REPORTS_KEY = "dawayir-truth-reports";

export function saveReport(report: WeeklyTruthReport): void {
    try {
        const raw = localStorage.getItem(REPORTS_KEY);
        const reports: WeeklyTruthReport[] = raw ? JSON.parse(raw) : [];
        reports.unshift(report);
        // Keep last 12 weeks
        localStorage.setItem(REPORTS_KEY, JSON.stringify(reports.slice(0, 12)));
    } catch { /* noop */ }
}

export function loadReports(): WeeklyTruthReport[] {
    try {
        const raw = localStorage.getItem(REPORTS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}
