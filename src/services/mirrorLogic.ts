/**
 * Mirror Logic Engine — محرك منطق المرآة 🪞
 * ==========================================
 * يكشف التناقضات بين "النوايا المعلنة" (Goals) و"السلوك الفعلي" (Map Behavior).
 * يولد أسئلة وجودية (Socratic Questions) للمواجهة.
 * 
 * === الأنماط السبعة ===
 * 1. إنكار عاطفي (Emotional Denial) — أصلي
 * 2. انفصال واقعي (Reality Detachment) — أصلي
 * 3. قلق التموضع (Placement Anxiety) — أصلي
 * 4. الدعم الوهمي (False Support) — جديد ⚔️
 * 5. الحب المستنزف (Love Drain) — جديد ⚔️
 * 6. الحدود الورقية (Paper Boundaries) — جديد ⚔️
 * 7. التعافي المزيف (False Recovery) — جديد ⚔️
 */

import { useMapState } from '@/modules/map/dawayirIndex';
import { useJourneyState } from "@/domains/journey/store/journey.store";
import { usePulseState } from "@/domains/consciousness/store/pulse.store";
import { useTruthTestState } from "@/services/truthTest.store";
import { analyzeTruthTests } from "@/services/truthTestEngine";

export interface MirrorInsight {
    id: string;
    type: "emotional_denial" | "reality_detachment" | "placement_anxiety"
        | "false_support" | "love_drain" | "paper_boundaries" | "false_recovery"
        | "connection_bias";
    title: string;
    message: string;
    question: string;
    relatedNodeId?: string;
    severity: "gentle" | "firm" | "shock";
    /** الدليل من بيانات المستخدم نفسه */
    evidence?: string;
}

const MIRROR_SHOWN_KEY = "dawayir-mirror-shown";

function getShownInsights(): Set<string> {
    try {
        const raw = localStorage.getItem(MIRROR_SHOWN_KEY);
        return new Set(raw ? JSON.parse(raw) : []);
    } catch {
        return new Set();
    }
}

function markInsightShown(id: string): void {
    const shown = getShownInsights();
    shown.add(id);
    const arr = Array.from(shown).slice(-50); // Keep last 50
    try {
        localStorage.setItem(MIRROR_SHOWN_KEY, JSON.stringify(arr));
    } catch { /* noop */ }
}

/**
 * تحليل التناقضات بناءً على حالة الخريطة والرحلة
 */
export function detectContradictions(): MirrorInsight | null {
    const { nodes } = useMapState.getState();
    const { goalId } = useJourneyState.getState();
    const { lastPulse, logs: pulseLogs } = usePulseState.getState();
    const shown = getShownInsights();

    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;

    // Guard: don't evaluate contradictions if goalId is not yet set (e.g. right after onboarding)
    // An empty goalId would cause false positives since !goalId treated as isSelfFocus
    if (!goalId) return null;

    const activeNodes = nodes.filter(n => !n.isNodeArchived);

    // ══════════════════════════════════════════════════════
    // نمط ٤: "الدعم الوهمي" (False Support) ⚔️ جديد
    // السيناريو: علاقة مصنفة خضراء/صفراء + الطاقة بتنزل بعد التفاعل
    // ══════════════════════════════════════════════════════
    if (pulseLogs.length >= 3) {
        const recentPulses = pulseLogs.slice(0, 7);
        const avgEnergy = recentPulses.reduce((sum, p) => sum + (Number(p.energy) || 0), 0) / recentPulses.length;

        for (const node of activeNodes) {
            if (node.ring !== "green") continue;
            // Check if user energy is consistently low despite "supportive" relationships
            const netEnergy = node.energyBalance?.netEnergy ?? 0;
            if (avgEnergy < 4 && netEnergy <= 0) {
                const id = `false-support-${node.id}-${new Date().toISOString().split("T")[0]}`;
                if (!shown.has(id)) {
                    return {
                        id,
                        type: "false_support",
                        title: "دعم وهمي",
                        message: `"${node.label}" في الدائرة الخضراء — لكن طاقتك ${avgEnergy.toFixed(1)}/10 وحساب الطاقة معاه ${netEnergy}.`,
                        question: "لو شلت الاسم وبصيت للأرقام بس — هل فعلاً ده شخص بيشحنك؟",
                        relatedNodeId: node.id,
                        severity: "firm",
                        evidence: `متوسط طاقتك: ${avgEnergy.toFixed(1)}/10 | صافي الطاقة مع ${node.label}: ${netEnergy}`
                    };
                }
            }
        }
    }

    // ══════════════════════════════════════════════════════
    // نمط ٥: "الحب المستنزف" (Love Drain) ⚔️ جديد
    // السيناريو: شخص في المدار الأحمر + طاقة سلبية + لسه مش أرشيف
    // يعني: بتحبه لكنه بيقتلك
    // ══════════════════════════════════════════════════════
    for (const node of activeNodes) {
        if (node.ring !== "red" || node.detachmentMode || node.isDetached) continue;
        const netEnergy = node.energyBalance?.netEnergy ?? 0;
        const createdAt = node.journeyStartDate || 0;
        const daysSinceAdded = (now - createdAt) / DAY_MS;

        // Red ring + negative energy + been around for > 30 days = emotional attachment despite toxicity
        if (netEnergy < -5 && daysSinceAdded > 30) {
            const id = `love-drain-${node.id}-${Math.floor(now / (DAY_MS * 7))}`;
            if (!shown.has(id)) {
                return {
                    id,
                    type: "love_drain",
                    title: "حب مستنزف",
                    message: `"${node.label}" في المنطقة الحمراء من ${Math.floor(daysSinceAdded)} يوم. الطاقة معاه ${netEnergy}. لكنك لسه محتفظ بيه.`,
                    question: "هل إنت متمسك بيه عشان بتحبه — ولا عشان خايف من الحقيقة لو اعترفت إن العلاقة خلصت؟",
                    relatedNodeId: node.id,
                    severity: "shock",
                    evidence: `${Math.floor(daysSinceAdded)} يوم في الأحمر | صافي الطاقة: ${netEnergy}`
                };
            }
        }
    }

    // ══════════════════════════════════════════════════════
    // نمط ٦: "الحدود الورقية" (Paper Boundaries) ⚔️ جديد
    // السيناريو: شخص تم أرشفته ثم استعادته أكثر من مرة
    // ══════════════════════════════════════════════════════
    for (const node of activeNodes) {
        const history = node.orbitHistory ?? [];
        const archiveRestoreCycles = history.filter(h => h.type === "restored").length;

        if (archiveRestoreCycles >= 2) {
            const id = `paper-bounds-${node.id}-${Math.floor(now / (DAY_MS * 14))}`;
            if (!shown.has(id)) {
                return {
                    id,
                    type: "paper_boundaries",
                    title: "حدود ورقية",
                    message: `أرشفت "${node.label}" ${archiveRestoreCycles} مرات ورجعته في كل مرة. الحد اللي بتحطه مش حقيقي.`,
                    question: "هل فعلاً بتحط حدود — ولا بتكتب حدود على ورق وبتمسحها؟",
                    relatedNodeId: node.id,
                    severity: "shock",
                    evidence: `${archiveRestoreCycles} دورات أرشفة/استعادة`
                };
            }
        }
    }

    // ══════════════════════════════════════════════════════
    // نمط ٧: "التعافي المزيف" (False Recovery) ⚔️ جديد
    // السيناريو: نقل شخص للأخضر لكن النبض لم يتحسن
    // ══════════════════════════════════════════════════════
    if (pulseLogs.length >= 5) {
        const recentEnergies = pulseLogs.slice(0, 5).map(p => Number(p.energy) || 0);
        const avgRecentEnergy = recentEnergies.reduce((a, b) => a + b, 0) / recentEnergies.length;

        // Find nodes recently moved to green
        for (const node of activeNodes) {
            if (node.ring !== "green") continue;
            const history = node.orbitHistory ?? [];
            const lastRingChange = history.filter(h => h.type === "ring_changed" && h.ring === "green")
                .sort((a, b) => b.timestamp - a.timestamp)[0];

            if (lastRingChange) {
                const daysSinceGreen = (now - lastRingChange.timestamp) / DAY_MS;
                // Moved to green recently (< 14 days) but energy is still low
                if (daysSinceGreen < 14 && daysSinceGreen > 3 && avgRecentEnergy < 4.5) {
                    const id = `false-recovery-${node.id}-${Math.floor(now / (DAY_MS * 7))}`;
                    if (!shown.has(id)) {
                        return {
                            id,
                            type: "false_recovery",
                            title: "تعافي مزيف",
                            message: `نقلت "${node.label}" للأخضر من ${Math.floor(daysSinceGreen)} يوم — لكن طاقتك لسه ${avgRecentEnergy.toFixed(1)}/10. التعافي مش بالتصنيف — بالنتيجة.`,
                            question: "هل نقلته للأخضر عشان الوضع فعلاً اتحسن — ولا عشان تعبت من مواجهة الحقيقة؟",
                            relatedNodeId: node.id,
                            severity: "firm",
                            evidence: `نُقل للأخضر من ${Math.floor(daysSinceGreen)} يوم | متوسط طاقتك: ${avgRecentEnergy.toFixed(1)}/10`
                        };
                    }
                }
            }
        }
    }

    // ══════════════════════════════════════════════════════
    // نمط ١: "التعافي الزائف" (False Letting Go) — أصلي
    // ══════════════════════════════════════════════════════
    const isSelfFocus = goalId === "self" || goalId === "health";

    if (isSelfFocus) {
        const clingingNodes = activeNodes.filter(n => n.ring === "red" || n.ring === "yellow");

        for (const node of clingingNodes) {
            if (node.ring === "red") {
                const id = `denial-${node.id}-${new Date().toISOString().split("T")[0]}`;
                if (!shown.has(id)) {
                    return {
                        id,
                        type: "emotional_denial",
                        title: "إنكار عاطفي",
                        message: `العنوان بيقول "تركيز على الذات".. بس "${node.label}" لسه واخد مساحة في دايرتك الحمراء.`,
                        question: "هل إحنا بنحتفظ بيهم عشان بنحبهم، ولا عشان خايفين من الفراغ؟",
                        relatedNodeId: node.id,
                        severity: "firm"
                    };
                }
            }
        }
    }

    // ══════════════════════════════════════════════════════
    // نمط ٢: "المهم المهمل" (The Neglected VIP) — أصلي
    // ══════════════════════════════════════════════════════
    const neglectedNodes = activeNodes.filter(n => n.ring === "red");
    for (const node of neglectedNodes) {
        const createdAt = node.journeyStartDate || 0;
        const lastLog = node.recoveryProgress?.situationLogs?.[node.recoveryProgress.situationLogs.length - 1];
        const lastInteraction = lastLog ? lastLog.date : createdAt;

        const diffDays = (now - lastInteraction) / DAY_MS;

        if (diffDays > 10) {
            const id = `neglected-${node.id}-${Math.floor(now / (DAY_MS * 5))}`;
            if (!shown.has(id)) {
                return {
                    id,
                    type: "reality_detachment",
                    title: "انفصال واقعي",
                    message: `الدوائر القريبة استثمار مش بس مكان. بقالك ${Math.floor(diffDays)} يوم ما زورتش دايرة "${node.label}".`,
                    question: "إمتى آخر مرة كان وجودهم حقيقي، مش مجرد اسم في دايرة؟",
                    relatedNodeId: node.id,
                    severity: "gentle"
                };
            }
        }
    }

    // ══════════════════════════════════════════════════════
    // نمط ٣: "قلق التموضع" (Placement Anxiety) — أصلي
    // ══════════════════════════════════════════════════════
    if (lastPulse && (lastPulse.mood === "anxious" || lastPulse.mood === "overwhelmed")) {
        const grayNodes = nodes.filter(n => n.detachmentMode);
        if (grayNodes.length >= 3) {
            const id = `anxiety-${new Date().toISOString().split("T")[0]}`;
            if (!shown.has(id)) {
                return {
                    id,
                    type: "placement_anxiety",
                    title: "زحمة أفكار",
                    message: "طاقتك بتقول إنك قلقان، وفيه علاقات كتير متعلقة في النص.",
                    question: "لو اخترت قرار واحد بس النهاردة وتجاهلت الباقي.. إيه اللي هيحصل؟",
                    severity: "shock"
                };
            }
        }
    }

    // ══════════════════════════════════════════════════════
    // نمط ٨: "وهم الاتصال" (Connection Bias) 🔬 جديد
    // السيناريو: بيانات مختبر المصداقية بتقول إن نسبة الإصابة أقل من الصدفة
    // ══════════════════════════════════════════════════════
    try {
        const ttTests = useTruthTestState.getState().tests;
        if (ttTests.length >= 10) {
            const dashboard = analyzeTruthTests(ttTests, activeNodes.length);
            const weakOrBelow = dashboard.byType.filter(
                (t) => t.significance === "below_chance" || t.significance === "weak"
            );

            if (weakOrBelow.length >= 2) {
                const totalDecided = ttTests.filter(
                    (t) => t.outcome === "confirmed" || t.outcome === "denied"
                ).length;
                const totalConfirmed = ttTests.filter((t) => t.outcome === "confirmed").length;
                const hitRate = totalDecided > 0 ? Math.round((totalConfirmed / totalDecided) * 100) : 0;

                const id = `connection-bias-${Math.floor(now / (DAY_MS * 14))}`;
                if (!shown.has(id)) {
                    return {
                        id,
                        type: "connection_bias" as const,
                        title: "وهم الاتصال",
                        message: `${ttTests.length} اختبار — نسبة الإصابة ${hitRate}%. ده قريب من الصدفة أو أقل. عقلك بيتذكر المرات اللي صح وبينسى اللي غلط.`,
                        question: "لو شلت الإحساس وبصيت للأرقام بس — هل فعلاً فيه اتصال؟",
                        severity: "firm" as const,
                        evidence: `${ttTests.length} اختبار | إصابة: ${hitRate}% | الحكم: ضوضاء/أقل من الصدفة`
                    };
                }
            }
        }
    } catch { /* truth test store may not be ready */ }

    return null;
}

/** Detect ALL active contradictions (not just the first one) */
export function detectAllContradictions(): MirrorInsight[] {
    const results: MirrorInsight[] = [];
    const shown = getShownInsights();
    // Run detection multiple times, marking each found to get the next
    // For simplicity, just return the first one for now
    const first = detectContradictions();
    if (first) results.push(first);
    return results;
}

export function dismissMirrorInsight(id: string): void {
    markInsightShown(id);
}
