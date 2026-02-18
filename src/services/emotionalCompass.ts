/**
 * Emotional Compass Service — البوصلة الانفعالية
 * ================================================
 * سؤال واحد عند الدخول يحدد:
 * - سرعة الـ UI
 * - نبرة جارفيس
 * - الـ copy المناسب
 * - المسار المقترح (سريع / كامل)
 */

const getFromLocalStorage = (key: string): string | null => {
    try { return localStorage.getItem(key); } catch { return null; }
};
const setInLocalStorage = (key: string, value: string): void => {
    try { localStorage.setItem(key, value); } catch { /* noop */ }
};

const COMPASS_KEY = "dawayir-emotional-compass";
const COMPASS_TTL_MS = 4 * 60 * 60 * 1000; // 4 ساعات

export type EmotionalState =
    | "drained"     // مستنزف
    | "anxious"     // قلق
    | "angry"       // غاضب
    | "curious"     // فضولي
    | "calm"        // هادئ
    | "motivated";  // متحمس

export interface CompassReading {
    state: EmotionalState;
    intensity: 1 | 2 | 3; // 1=خفيف, 2=متوسط, 3=شديد
    timestamp: number;
}

export interface CompassConfig {
    /** نبرة جارفيس */
    toneMode: "warm" | "sharp" | "calm" | "energetic";
    /** سرعة الـ UI */
    paceMode: "slow" | "normal" | "fast";
    /** المسار المقترح */
    suggestedPath: "quick" | "full" | "emergency";
    /** رسالة الترحيب المخصصة */
    welcomeMessage: string;
    /** لون الـ accent */
    accentColor: string;
}

/* ── State → Config mapping ── */
const STATE_CONFIG: Record<EmotionalState, CompassConfig> = {
    drained: {
        toneMode: "warm",
        paceMode: "slow",
        suggestedPath: "quick",
        welcomeMessage: "أنا شايف إنك تعبان شوية. خليني أساعدك بخطوة واحدة بس.",
        accentColor: "#7c3aed", // بنفسجي هادئ
    },
    anxious: {
        toneMode: "calm",
        paceMode: "slow",
        suggestedPath: "quick",
        welcomeMessage: "خد نفس. أنا هنا. نشوف الموقف مع بعض بهدوء.",
        accentColor: "#0891b2", // أزرق مهدئ
    },
    angry: {
        toneMode: "calm",
        paceMode: "normal",
        suggestedPath: "quick",
        welcomeMessage: "الغضب طاقة. خليني نحوّله لخطوة تكتيكية.",
        accentColor: "#dc2626", // أحمر
    },
    curious: {
        toneMode: "sharp",
        paceMode: "normal",
        suggestedPath: "full",
        welcomeMessage: "كويس إنك هنا. في حاجة مهمة تستاهل نشوفها مع بعض.",
        accentColor: "#0d9488", // تيل
    },
    calm: {
        toneMode: "sharp",
        paceMode: "fast",
        suggestedPath: "full",
        welcomeMessage: "ممتاز. طاقتك كويسة — ده وقت مثالي للاستطلاع.",
        accentColor: "#059669", // أخضر
    },
    motivated: {
        toneMode: "energetic",
        paceMode: "fast",
        suggestedPath: "full",
        welcomeMessage: "القائد جاهز! يلا نفتح الخريطة ونحدد الجبهة.",
        accentColor: "#d97706", // ذهبي
    },
};

/* ── Compass options shown to user ── */
export const COMPASS_OPTIONS: Array<{
    state: EmotionalState;
    emoji: string;
    label: string;
    sublabel: string;
}> = [
        { state: "drained", emoji: "😮‍💨", label: "مستنزف", sublabel: "طاقتي واطية" },
        { state: "anxious", emoji: "😰", label: "قلقان", sublabel: "في حاجة بتضغط عليّ" },
        { state: "angry", emoji: "😤", label: "متضايق", sublabel: "في موقف وقف في حلقي" },
        { state: "curious", emoji: "🤔", label: "فضولي", sublabel: "عايز أفهم أكتر" },
        { state: "calm", emoji: "😌", label: "هادئ", sublabel: "كل حاجة تمام" },
        { state: "motivated", emoji: "💪", label: "متحمس", sublabel: "جاهز أتحرك" },
    ];

/* ── Save & retrieve ── */
export function saveCompassReading(state: EmotionalState, intensity: 1 | 2 | 3 = 2): CompassReading {
    const reading: CompassReading = { state, intensity, timestamp: Date.now() };
    setInLocalStorage(COMPASS_KEY, JSON.stringify(reading));
    return reading;
}

export function getCompassReading(): CompassReading | null {
    const raw = getFromLocalStorage(COMPASS_KEY);
    if (!raw) return null;

    try {
        const reading: CompassReading = JSON.parse(raw);
        // Expire after TTL
        if (Date.now() - reading.timestamp > COMPASS_TTL_MS) return null;
        return reading;
    } catch {
        return null;
    }
}

export function getCompassConfig(state: EmotionalState): CompassConfig {
    return STATE_CONFIG[state];
}

export function getCurrentConfig(): CompassConfig | null {
    const reading = getCompassReading();
    if (!reading) return null;
    return getCompassConfig(reading.state);
}

/** هل يجب عرض البوصلة؟ (مرة كل 4 ساعات) */
export function shouldShowCompass(): boolean {
    return getCompassReading() === null;
}
