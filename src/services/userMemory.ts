/**
 * User Memory Service — ذاكرة جارفيس
 * =====================================
 * طبقة ذاكرة مستمرة تجعل جارفيس يتذكر المستخدم عبر الجلسات.
 * يُحقن سياقها في كل استدعاء Gemini.
 */

const MEMORY_KEY = "dawayir-jarvis-memory";
const MAX_CONVERSATION_SUMMARIES = 10;

export interface ConversationSummary {
    summary: string;
    timestamp: number;
    keyInsight?: string; // أهم ما تعلمه جارفيس من هذه المحادثة
}

export interface UserMemory {
    /** الاسم المفضل */
    preferredName?: string;
    /** الأهداف المتكررة التي يذكرها المستخدم */
    recurringGoals: string[];
    /** الأشخاص المذكورون بكثرة (بدون أسماء — أدوار فقط) */
    frequentRelationships: string[];
    /** أنماط الحدود الشائعة */
    boundaryPatterns: string[];
    /** النبرة المفضلة */
    preferredTone: "warm" | "direct" | "analytical" | "motivational";
    /** اللغة المفضلة */
    preferredLanguage: "arabic" | "english" | "mixed";
    /** ملخصات المحادثات السابقة */
    conversationSummaries: ConversationSummary[];
    /** آخر تحديث */
    lastUpdated: number;
    /** عدد الجلسات الكلي */
    totalSessions: number;
}

const DEFAULT_MEMORY: UserMemory = {
    recurringGoals: [],
    frequentRelationships: [],
    boundaryPatterns: [],
    preferredTone: "warm",
    preferredLanguage: "arabic",
    conversationSummaries: [],
    lastUpdated: Date.now(),
    totalSessions: 0,
};

/* ── Load / Save ── */
export function loadUserMemory(): UserMemory {
    try {
        const raw = localStorage.getItem(MEMORY_KEY);
        if (!raw) return { ...DEFAULT_MEMORY };
        return { ...DEFAULT_MEMORY, ...JSON.parse(raw) } as UserMemory;
    } catch {
        return { ...DEFAULT_MEMORY };
    }
}

export function saveUserMemory(memory: UserMemory): void {
    try {
        localStorage.setItem(MEMORY_KEY, JSON.stringify({
            ...memory,
            lastUpdated: Date.now(),
        }));
    } catch { /* noop */ }
}

/* ── Update helpers ── */
export function addConversationSummary(summary: string, keyInsight?: string): void {
    const memory = loadUserMemory();
    const entry: ConversationSummary = {
        summary,
        timestamp: Date.now(),
        keyInsight,
    };
    memory.conversationSummaries = [entry, ...memory.conversationSummaries]
        .slice(0, MAX_CONVERSATION_SUMMARIES);
    memory.totalSessions += 1;
    saveUserMemory(memory);
}

export function updatePreferredName(name: string): void {
    const memory = loadUserMemory();
    memory.preferredName = name;
    saveUserMemory(memory);
}

export function addRecurringGoal(goal: string): void {
    const memory = loadUserMemory();
    if (!memory.recurringGoals.includes(goal)) {
        memory.recurringGoals = [goal, ...memory.recurringGoals].slice(0, 5);
        saveUserMemory(memory);
    }
}

export function addBoundaryPattern(pattern: string): void {
    const memory = loadUserMemory();
    if (!memory.boundaryPatterns.includes(pattern)) {
        memory.boundaryPatterns = [pattern, ...memory.boundaryPatterns].slice(0, 5);
        saveUserMemory(memory);
    }
}

/* ── System Prompt Injection ── */
/**
 * يُنتج سياق الذاكرة لحقنه في System Instruction لجارفيس.
 * هذا ما يجعل جارفيس "يتذكر" المستخدم.
 */
export function buildMemoryContext(): string {
    const memory = loadUserMemory();

    const parts: string[] = [];

    if (memory.preferredName) {
        parts.push(`اسم المستخدم المفضل: ${memory.preferredName}`);
    }

    if (memory.totalSessions > 0) {
        parts.push(`عدد الجلسات السابقة: ${memory.totalSessions}`);
    }

    if (memory.recurringGoals.length > 0) {
        parts.push(`أهداف متكررة: ${memory.recurringGoals.join("، ")}`);
    }

    if (memory.boundaryPatterns.length > 0) {
        parts.push(`أنماط حدود شائعة: ${memory.boundaryPatterns.join("، ")}`);
    }

    if (memory.conversationSummaries.length > 0) {
        const recentSummaries = memory.conversationSummaries
            .slice(0, 3)
            .map((s, i) => `[${i + 1}] ${s.summary}${s.keyInsight ? ` (أهم ما تعلمته: ${s.keyInsight})` : ""}`)
            .join("\n");
        parts.push(`ملخص آخر ${Math.min(3, memory.conversationSummaries.length)} محادثات:\n${recentSummaries}`);
    }

    if (parts.length === 0) {
        return "هذه أول جلسة للمستخدم. ابدأ بالتعرف عليه بلطف.";
    }

    return `--- ذاكرة جارفيس ---\n${parts.join("\n")}\n--- نهاية الذاكرة ---`;
}

/** هل المستخدم عائد (له جلسات سابقة)؟ */
export function isReturningUser(): boolean {
    return loadUserMemory().totalSessions > 0;
}

/** رسالة ترحيب مخصصة بناءً على الذاكرة */
export function buildPersonalizedWelcome(personLabel?: string): string {
    const memory = loadUserMemory();
    const name = memory.preferredName;
    const isReturning = memory.totalSessions > 0;

    if (!isReturning) {
        return personLabel
            ? `أنا جارفيس، مستشارك التكتيكي. جاهزين نراجع جبهة ${personLabel} ونكسب المعركة؟`
            : "أنا جارفيس، مستشارك التكتيكي. غرفة العمليات جاهزة — إيه الجبهة اللي شاغلة تفكيرك دلوقتي؟";
    }

    const greeting = name ? `يا ${name}` : "يا قائد";

    if (memory.recurringGoals.length > 0) {
        return `${greeting}، عدت! آخر مرة كنا نشتغل على "${memory.recurringGoals[0]}". نكمل من حيث وقفنا؟`;
    }

    return `${greeting}، أهلاً بعودتك. الميدان جاهز — إيه الجبهة النهارده؟`;
}
