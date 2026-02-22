/**
 * Streak System — نظام الـ Streak اليومي
 * =========================================
 * يتتبع الأيام المتتالية التي يدخل فيها المستخدم للمنصة.
 * مثل Duolingo — يبني عادة يومية ويحفز الاستمرار.
 */

const getFromLocalStorage = (key: string): string | null => {
    try { return localStorage.getItem(key); } catch { return null; }
};
const setInLocalStorage = (key: string, value: string): void => {
    try { localStorage.setItem(key, value); } catch { /* noop */ }
};

const STREAK_KEY = "dawayir-streak";

export interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string; // YYYY-MM-DD
    totalActiveDays: number;
    streakStartDate: string; // YYYY-MM-DD
    frozenUntil?: string;   // للـ Streak Freeze (ميزة مستقبلية)
}

function getTodayStr(): string {
    return new Date().toISOString().split("T")[0];
}

function getYesterdayStr(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
}

const DEFAULT_STREAK: StreakData = {
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: "",
    totalActiveDays: 0,
    streakStartDate: getTodayStr(),
};

export function loadStreak(): StreakData {
    const raw = getFromLocalStorage(STREAK_KEY);
    if (!raw) return { ...DEFAULT_STREAK };
    try {
        return JSON.parse(raw) as StreakData;
    } catch {
        return { ...DEFAULT_STREAK };
    }
}

function saveStreak(data: StreakData): void {
    setInLocalStorage(STREAK_KEY, JSON.stringify(data));
}

/**
 * يُستدعى عند كل دخول للمنصة.
 * يحدّث الـ Streak ويعيد البيانات المحدّثة.
 */
export function recordDailyVisit(): StreakData {
    const today = getTodayStr();
    const yesterday = getYesterdayStr();
    const data = loadStreak();

    // Already recorded today
    if (data.lastActiveDate === today) return data;

    let newStreak: number;
    let newStreakStart: string;

    if (data.lastActiveDate === yesterday) {
        // Consecutive day — extend streak
        newStreak = data.currentStreak + 1;
        newStreakStart = data.streakStartDate || today;
    } else if (data.lastActiveDate === "") {
        // First ever visit
        newStreak = 1;
        newStreakStart = today;
    } else {
        // Streak broken
        newStreak = 1;
        newStreakStart = today;
    }

    const updated: StreakData = {
        currentStreak: newStreak,
        longestStreak: Math.max(data.longestStreak, newStreak),
        lastActiveDate: today,
        totalActiveDays: data.totalActiveDays + 1,
        streakStartDate: newStreakStart,
    };

    saveStreak(updated);
    return updated;
}

/** هل الـ Streak في خطر؟ (لم يُسجَّل اليوم بعد) */
export function isStreakAtRisk(): boolean {
    const data = loadStreak();
    const today = getTodayStr();
    return data.lastActiveDate !== today && data.currentStreak > 0;
}

/** هل الـ Streak انكسر؟ */
export function isStreakBroken(): boolean {
    const data = loadStreak();
    if (!data.lastActiveDate) return false;
    const today = getTodayStr();
    const yesterday = getYesterdayStr();
    return data.lastActiveDate !== today && data.lastActiveDate !== yesterday;
}

/** رسائل تحفيزية حسب طول الـ Streak */
export function getStreakMessage(streak: number): string {
    if (streak === 0) return "ابدأ رحلتك اليوم 🌱";
    if (streak === 1) return "أول يوم في الميدان! 🎯";
    if (streak < 3) return `${streak} أيام متتالية — استمر! 🔥`;
    if (streak < 7) return `${streak} أيام — أنت في الإيقاع! ⚡`;
    if (streak < 14) return `${streak} يوم — قائد منضبط! 🏆`;
    if (streak < 30) return `${streak} يوم — أسطورة الميدان! 🦁`;
    return `${streak} يوم — لا يُهزم! 👑`;
}

/** أيقونة الـ Streak */
export function getStreakEmoji(streak: number): string {
    if (streak === 0) return "🌱";
    if (streak < 3) return "🔥";
    if (streak < 7) return "⚡";
    if (streak < 14) return "🏆";
    if (streak < 30) return "🦁";
    return "👑";
}
