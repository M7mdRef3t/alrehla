/**
 * ⚔️ Prediction Journal — سجل التوقعات
 * ======================================
 * "اللي قلته vs اللي حصل"
 * 
 * يسجل توقعات المستخدم عن أشخاص/قرارات/أحداث
 * ثم يطلب منه تقييم ما حصل فعلاً — ويكشف الفجوة بين الوهم والواقع.
 */

export interface Prediction {
    id: string;
    /** السؤال أو السياق */
    question: string;
    /** توقع المستخدم */
    prediction: string;
    /** العقدة المرتبطة (اختياري) */
    relatedNodeId?: string;
    relatedNodeLabel?: string;
    /** وقت التوقع */
    createdAt: number;
    /** متى يجب التقييم (default: بعد أسبوع) */
    evaluateAt: number;
    /** حالة التوقع */
    status: "pending" | "resolved" | "expired";
    /** النتيجة الفعلية (يملأها المستخدم لاحقاً) */
    actualOutcome?: string;
    /** هل التوقع كان صحيح */
    wasAccurate?: boolean;
    /** وقت الحل */
    resolvedAt?: number;
}

export interface PredictionStats {
    totalPredictions: number;
    resolvedPredictions: number;
    accurateCount: number;
    inaccurateCount: number;
    /** نسبة الدقة 0-100 */
    accuracyScore: number;
    /** نسبة التفاؤل الزائد */
    optimismRate: number;
    /** نسبة التشاؤم الزائد */
    pessimismRate: number;
    /** أهم بصيرة */
    insight: string;
}

const PREDICTIONS_KEY = "dawayir-predictions";
const DAY_MS = 24 * 60 * 60 * 1000;

function loadPredictions(): Prediction[] {
    try {
        const raw = localStorage.getItem(PREDICTIONS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function savePredictions(predictions: Prediction[]): void {
    try {
        localStorage.setItem(PREDICTIONS_KEY, JSON.stringify(predictions));
    } catch { /* noop */ }
}

/**
 * إنشاء توقع جديد
 */
export function createPrediction(params: {
    question: string;
    prediction: string;
    relatedNodeId?: string;
    relatedNodeLabel?: string;
    evaluateAfterDays?: number;
}): Prediction {
    const now = Date.now();
    const prediction: Prediction = {
        id: `pred-${now}-${Math.random().toString(36).slice(2, 8)}`,
        question: params.question,
        prediction: params.prediction,
        relatedNodeId: params.relatedNodeId,
        relatedNodeLabel: params.relatedNodeLabel,
        createdAt: now,
        evaluateAt: now + (params.evaluateAfterDays ?? 7) * DAY_MS,
        status: "pending"
    };

    const predictions = loadPredictions();
    predictions.unshift(prediction);
    savePredictions(predictions.slice(0, 100)); // Keep max 100

    return prediction;
}

/**
 * حل توقع — تسجيل ما حصل فعلاً
 */
export function resolvePrediction(
    id: string,
    actualOutcome: string,
    wasAccurate: boolean
): Prediction | null {
    const predictions = loadPredictions();
    const idx = predictions.findIndex(p => p.id === id);

    if (idx === -1) return null;

    predictions[idx] = {
        ...predictions[idx],
        actualOutcome,
        wasAccurate,
        status: "resolved",
        resolvedAt: Date.now()
    };

    savePredictions(predictions);
    return predictions[idx];
}

/**
 * جلب التوقعات المعلقة التي حان وقت تقييمها
 */
export function getPendingEvaluations(): Prediction[] {
    const predictions = loadPredictions();
    const now = Date.now();

    return predictions.filter(
        p => p.status === "pending" && now >= p.evaluateAt
    );
}

/**
 * جلب كل التوقعات
 */
export function getAllPredictions(): Prediction[] {
    return loadPredictions();
}

/**
 * جلب إحصائيات الدقة
 */
export function getPredictionStats(): PredictionStats {
    const predictions = loadPredictions();
    const resolved = predictions.filter(p => p.status === "resolved");
    const accurate = resolved.filter(p => p.wasAccurate === true);
    const inaccurate = resolved.filter(p => p.wasAccurate === false);

    const totalPredictions = predictions.length;
    const resolvedPredictions = resolved.length;
    const accurateCount = accurate.length;
    const inaccurateCount = inaccurate.length;
    const accuracyScore = resolvedPredictions > 0
        ? Math.round((accurateCount / resolvedPredictions) * 100)
        : 0;

    // Optimism vs pessimism analysis
    // If predictions about negative outcomes were accurate = realistic
    // If predictions about positive outcomes were inaccurate = overly optimistic
    const optimismRate = resolvedPredictions > 0
        ? Math.round((inaccurateCount / resolvedPredictions) * 100)
        : 0;
    const pessimismRate = 0; // Simplified for now

    // Generate insight
    let insight: string;
    if (resolvedPredictions < 3) {
        insight = "محتاج ٣ توقعات محلولة على الأقل عشان أقدر أعطيك بصيرة حقيقية.";
    } else if (accuracyScore > 70) {
        insight = "نظرتك للواقع دقيقة — بتشوف الحقيقة زي ما هي. ده أساس صلب.";
    } else if (accuracyScore > 40) {
        insight = "توقعاتك متوسطة الدقة — فيه حقائق بتشوفها وحقائق بتختار تتجاهلها.";
    } else {
        insight = "فيه فجوة كبيرة بين اللي بتتوقعه واللي بيحصل فعلاً. ده مش سوء حظ — ده سوء رؤية.";
    }

    return {
        totalPredictions,
        resolvedPredictions,
        accurateCount,
        inaccurateCount,
        accuracyScore,
        optimismRate,
        pessimismRate,
        insight
    };
}

/**
 * Mark expired predictions (> 30 days without resolution)
 */
export function markExpiredPredictions(): number {
    const predictions = loadPredictions();
    const now = Date.now();
    let expiredCount = 0;

    predictions.forEach(p => {
        if (p.status === "pending" && (now - p.evaluateAt) > 30 * DAY_MS) {
            p.status = "expired";
            expiredCount++;
        }
    });

    if (expiredCount > 0) savePredictions(predictions);
    return expiredCount;
}
