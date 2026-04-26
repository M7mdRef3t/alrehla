/**
 * ⚔️ Cognitive Bias Engine — محرك كشف الانحياز المعرفي
 * =====================================================
 * يكشف ٧ انحيازات معرفية من بيانات المستخدم الفعلية — ليس نظرياً.
 * كل انحياز يُكشف فقط عندما يتوفر دليل حقيقي من سلوك المستخدم.
 *
 * الانحيازات:
 * 1. مغالطة التكلفة الغارقة (Sunk Cost)
 * 2. تحيز التأكيد (Confirmation Bias)
 * 3. تأثير الألفة (Familiarity Effect)
 * 4. وهم السيطرة (Illusion of Control)
 * 5. تحيز التفاؤل (Optimism Bias)
 * 6. تحيز الوضع الراهن (Status Quo Bias)
 * 7. تحيز النقطة العمياء (Blind Spot Bias)
 */

import { useMapState } from "@/modules/map/dawayirIndex";
import { usePulseState } from "@/domains/consciousness/store/pulse.store";

export interface CognitiveBiasAlert {
    id: string;
    biasType: BiasType;
    /** الاسم بالعربي */
    titleAr: string;
    /** الاسم الإنجليزي */
    titleEn: string;
    /** شرح مبسط */
    explanation: string;
    /** الدليل من بيانات المستخدم */
    evidence: string;
    /** سؤال المواجهة */
    confrontQuestion: string;
    /** اقتراح عملي */
    suggestion: string;
    /** شدة الانحياز */
    severity: "low" | "medium" | "high";
    /** العقدة المرتبطة */
    relatedNodeId?: string;
    /** اسم الشخص */
    relatedNodeLabel?: string;
}

export type BiasType =
    | "sunk_cost"
    | "confirmation"
    | "familiarity"
    | "illusion_of_control"
    | "optimism"
    | "status_quo"
    | "blind_spot";

const BIAS_SHOWN_KEY = "dawayir-bias-shown";

function getShownBiases(): Set<string> {
    try {
        const raw = localStorage.getItem(BIAS_SHOWN_KEY);
        return new Set(raw ? JSON.parse(raw) : []);
    } catch {
        return new Set();
    }
}

export function dismissBiasAlert(id: string): void {
    const shown = getShownBiases();
    shown.add(id);
    const arr = Array.from(shown).slice(-30);
    try {
        localStorage.setItem(BIAS_SHOWN_KEY, JSON.stringify(arr));
    } catch { /* noop */ }
}

/**
 * كشف الانحيازات المعرفية من البيانات الفعلية
 */
export function detectCognitiveBiases(): CognitiveBiasAlert[] {
    const { nodes } = useMapState.getState();
    const { logs: pulseLogs } = usePulseState.getState();
    const shown = getShownBiases();
    const alerts: CognitiveBiasAlert[] = [];

    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;
    const activeNodes = nodes.filter(n => !n.isNodeArchived);

    // ══════════════════════════════════════════════
    // 1. مغالطة التكلفة الغارقة (Sunk Cost Fallacy)
    // الشرط: علاقة حمراء + عمرها > 60 يوم + طاقة سلبية
    // المعنى: "أنا استثمرت كتير عشان أسيبه دلوقتي"
    // ══════════════════════════════════════════════
    for (const node of activeNodes) {
        if (node.ring !== "red" || node.detachmentMode || node.isDetached) continue;
        const createdAt = node.journeyStartDate || 0;
        const daysSince = (now - createdAt) / DAY_MS;
        const netEnergy = node.energyBalance?.netEnergy ?? 0;

        if (daysSince > 60 && netEnergy < -3) {
            const id = `sunk-cost-${node.id}-${Math.floor(now / (DAY_MS * 14))}`;
            if (!shown.has(id)) {
                alerts.push({
                    id,
                    biasType: "sunk_cost",
                    titleAr: "مغالطة التكلفة الغارقة",
                    titleEn: "Sunk Cost Fallacy",
                    explanation: "بتحس إنك لازم تكمل لأنك \"استثمرت كتير\" — لكن الاستثمار السابق مش مبرر لاستثمار أكتر في حاجة مش شغالة.",
                    evidence: `"${node.label}" في الأحمر من ${Math.floor(daysSince)} يوم. صافي الطاقة: ${netEnergy}. لكنك لسه محتفظ بيه.`,
                    confrontQuestion: "لو كنت بتعرفه النهاردة لأول مرة — بنفس السلوك ده — كنت هتقربه ليك؟",
                    suggestion: "اسأل نفسك: أنا باقي عشان بحبه — ولا عشان خسرت كتير لو مشيت؟",
                    severity: "high",
                    relatedNodeId: node.id,
                    relatedNodeLabel: node.label
                });
            }
        }
    }

    // ══════════════════════════════════════════════
    // 2. تحيز التأكيد (Confirmation Bias)
    // الشرط: تغيير تقييم أكثر من مرة + النبض يتناقض مع التقييم
    // المعنى: "بتدور على أدلة تثبت إنه كويس"
    // ══════════════════════════════════════════════
    if (pulseLogs.length >= 3) {
        const recentPulses = pulseLogs.slice(0, 7);
        const avgEnergy = recentPulses.reduce((s, p) => s + (Number(p.energy) || 0), 0) / recentPulses.length;

        for (const node of activeNodes) {
            if (node.ring !== "green") continue;
            const history = node.orbitHistory ?? [];
            const ringChanges = history.filter(h => h.type === "ring_changed").length;

            // Multiple ring changes (indecision) + low energy despite green = confirmation bias
            if (ringChanges >= 2 && avgEnergy < 4.5) {
                const id = `confirmation-${node.id}-${Math.floor(now / (DAY_MS * 14))}`;
                if (!shown.has(id)) {
                    alerts.push({
                        id,
                        biasType: "confirmation",
                        titleAr: "تحيز التأكيد",
                        titleEn: "Confirmation Bias",
                        explanation: "بتدور على أي سبب يخليك تصدق إن العلاقة كويسة — وبتتجاهل الإشارات اللي بتقول العكس.",
                        evidence: `غيرت تقييم "${node.label}" ${ringChanges} مرات وصنفته أخضر — لكن طاقتك ${avgEnergy.toFixed(1)}/10.`,
                        confrontQuestion: "لو حد تاني حكالك نفس القصة دي — كنت هتقوله إيه؟",
                        suggestion: "اكتب ٣ أسباب ليه العلاقة كويسة و٣ أسباب ليه مش كويسة — وشوف مين أقوى.",
                        severity: "medium",
                        relatedNodeId: node.id,
                        relatedNodeLabel: node.label
                    });
                }
            }
        }
    }

    // ══════════════════════════════════════════════
    // 3. تأثير الألفة (Familiarity Effect)
    // الشرط: علاقة عمرها > 90 يوم + صفر تفاعل حديث + مش مؤرشفة
    // المعنى: "متعود عليه مش محتاجه"
    // ══════════════════════════════════════════════
    for (const node of activeNodes) {
        const createdAt = node.journeyStartDate || 0;
        const daysSince = (now - createdAt) / DAY_MS;
        const lastLog = node.recoveryProgress?.situationLogs?.[node.recoveryProgress.situationLogs.length - 1];
        const daysSinceLastLog = lastLog ? (now - lastLog.date) / DAY_MS : daysSince;

        if (daysSince > 90 && daysSinceLastLog > 30) {
            const id = `familiarity-${node.id}-${Math.floor(now / (DAY_MS * 30))}`;
            if (!shown.has(id)) {
                alerts.push({
                    id,
                    biasType: "familiarity",
                    titleAr: "تأثير الألفة",
                    titleEn: "Familiarity Effect",
                    explanation: "الشخص ده موجود في حياتك لأنك \"متعود عليه\" — مش لأنك محتاجه.",
                    evidence: `"${node.label}" معاك من ${Math.floor(daysSince)} يوم. آخر تفاعل حقيقي من ${Math.floor(daysSinceLastLog)} يوم.`,
                    confrontQuestion: "لو الشخص ده اختفى بكره — هتفتقده فعلاً ولا هتفتقد العادة؟",
                    suggestion: "جرب أسبوع بدون تواصل — لو ما حسيتش بفراق، الإجابة واضحة.",
                    severity: "low",
                    relatedNodeId: node.id,
                    relatedNodeLabel: node.label
                });
            }
        }
    }

    // ══════════════════════════════════════════════
    // 4. وهم السيطرة (Illusion of Control)
    // الشرط: محاولات متعددة لتحريك شخص + الشخص لسه أحمر
    // المعنى: "فاكر تقدر تغيره"
    // ══════════════════════════════════════════════
    for (const node of activeNodes) {
        if (node.ring !== "red") continue;
        const history = node.orbitHistory ?? [];
        const ringChanges = history.filter(h => h.type === "ring_changed").length;

        // Multiple ring changes but still ended up red = trying to control
        if (ringChanges >= 3) {
            const id = `control-${node.id}-${Math.floor(now / (DAY_MS * 21))}`;
            if (!shown.has(id)) {
                alerts.push({
                    id,
                    biasType: "illusion_of_control",
                    titleAr: "وهم السيطرة",
                    titleEn: "Illusion of Control",
                    explanation: "بتحاول تغير الشخص أو العلاقة — لكن النتيجة واحدة كل مرة.",
                    evidence: `حركت "${node.label}" ${ringChanges} مرات — لكنه رجع للأحمر في كل مرة.`,
                    confrontQuestion: "كم مرة لازم تجرب نفس الحاجة عشان تعترف إنها مش هتتغير؟",
                    suggestion: "القبول أقوى من المحاولة. اقبل الشخص زي ما هو — وقرر: تكمل مع الحقيقة دي ولا لأ.",
                    severity: "high",
                    relatedNodeId: node.id,
                    relatedNodeLabel: node.label
                });
            }
        }
    }

    // ══════════════════════════════════════════════
    // 5. تحيز التفاؤل (Optimism Bias)
    // الشرط: شخص أحمر + في مدار قريب (مش detached) + طاقة سلبية
    // المعنى: "هيتغير"
    // ══════════════════════════════════════════════
    for (const node of activeNodes) {
        if (node.ring !== "red" || node.detachmentMode || node.isDetached) continue;
        const netEnergy = node.energyBalance?.netEnergy ?? 0;
        const createdAt = node.journeyStartDate || 0;
        const daysSince = (now - createdAt) / DAY_MS;

        if (netEnergy < 0 && daysSince > 14 && daysSince <= 60) {
            const id = `optimism-${node.id}-${Math.floor(now / (DAY_MS * 14))}`;
            if (!shown.has(id)) {
                alerts.push({
                    id,
                    biasType: "optimism",
                    titleAr: "تحيز التفاؤل",
                    titleEn: "Optimism Bias",
                    explanation: "بتقول لنفسك \"هيتغير\" أو \"الوضع هيتحسن\" — لكن الأرقام بتقول حاجة تانية.",
                    evidence: `"${node.label}" أحمر من ${Math.floor(daysSince)} يوم. الطاقة: ${netEnergy}. لسه مش معزول.`,
                    confrontQuestion: "لو واحد صاحبك قالك نفس الكلام ده — كنت هتصدقه ولا هتقوله بيكدب على نفسه؟",
                    suggestion: "اكتب: \"إيه اللي محتاج يحصل عشان الوضع يتحسن فعلاً؟\" — لو الإجابة مش في إيدك، الأمل مش خطة.",
                    severity: "medium",
                    relatedNodeId: node.id,
                    relatedNodeLabel: node.label
                });
            }
        }
    }

    // ══════════════════════════════════════════════
    // 6. تحيز الوضع الراهن (Status Quo Bias)
    // الشرط: علاقات صفراء > 3 + ثابتة من > 30 يوم بدون تحريك
    // المعنى: "أحسن من اللاشيء"
    // ══════════════════════════════════════════════
    const yellowNodes = activeNodes.filter(n => n.ring === "yellow");
    const staleYellow = yellowNodes.filter(n => {
        const history = n.orbitHistory ?? [];
        const lastChange = history.filter(h => h.type === "ring_changed").sort((a, b) => b.timestamp - a.timestamp)[0];
        const daysSinceChange = lastChange ? (now - lastChange.timestamp) / DAY_MS : 999;
        return daysSinceChange > 30;
    });

    if (staleYellow.length >= 3) {
        const id = `status-quo-${Math.floor(now / (DAY_MS * 21))}`;
        if (!shown.has(id)) {
            alerts.push({
                id,
                biasType: "status_quo",
                titleAr: "تحيز الوضع الراهن",
                titleEn: "Status Quo Bias",
                explanation: "عندك ${count} علاقات في المنطقة الصفراء من أكتر من شهر — مش بتتحسن ومش بتسوء. ده مش استقرار — ده ركود."
                    .replace("${count}", String(staleYellow.length)),
                evidence: `${staleYellow.length} علاقات صفراء ثابتة: ${staleYellow.slice(0, 3).map(n => n.label).join("، ")}`,
                confrontQuestion: "هل \"أحسن من اللاشيء\" فعلاً أحسن — ولا هو بس أسهل من اتخاذ قرار؟",
                suggestion: "اختار علاقة واحدة من الـ ${count} — وقرر: تقربها ولا تبعدها. المنتصف مش مكان."
                    .replace("${count}", String(staleYellow.length)),
                severity: "medium"
            });
        }
    }

    // ══════════════════════════════════════════════
    // 7. تحيز النقطة العمياء (Blind Spot Bias)
    // الشرط: تم تجاهل ≥ 3 تنبيهات (من mirrorLogic أو bias alerts)
    // المعنى: "أنا موضوعي — المشكلة في الناس مش فيّ"
    // ══════════════════════════════════════════════
    const dismissedCount = shown.size;
    if (dismissedCount >= 5) {
        const id = `blind-spot-${Math.floor(now / (DAY_MS * 30))}`;
        if (!shown.has(id)) {
            alerts.push({
                id,
                biasType: "blind_spot",
                titleAr: "تحيز النقطة العمياء",
                titleEn: "Blind Spot Bias",
                explanation: "تجاهلت ${count} تنبيهات من المنصة. ممكن تكون عارف الإجابة — بس مش عايز تسمعها."
                    .replace("${count}", String(dismissedCount)),
                evidence: `${dismissedCount} تنبيهات تم تجاهلها`,
                confrontQuestion: "هل فعلاً كل التنبيهات دي كانت غلط — ولا فيه واحد على الأقل كان صح وإنت عارف؟",
                suggestion: "ارجع لآخر ٣ تنبيهات تجاهلتهم — واقرأهم تاني. مش لازم تعمل حاجة — بس اقرأ.",
                severity: "high"
            });
        }
    }

    return alerts;
}
