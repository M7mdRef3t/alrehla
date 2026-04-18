/**
 * Enterprise Analytics — تحليلات المؤسسات
 * ==========================================
 * Wave 4: لوحة تحليلات للمدارس والشركات.
 * تجمع بيانات مجمّعة (مجهولة الهوية) لقياس الصحة النفسية.
 */

const ENTERPRISE_KEY = "dawayir-enterprise";

export type EnterpriseType = "school" | "company" | "clinic" | "ngo";

export interface EnterpriseProfile {
    id: string;
    name: string;
    type: EnterpriseType;
    size: "small" | "medium" | "large"; // <50, 50-500, 500+
    adminEmail: string;
    joinedAt: number;
    memberCount: number;
}

export interface AggregateMetrics {
    /** متوسط مستوى الطاقة (1-10) */
    avgEnergyLevel: number;
    /** نسبة المستخدمين النشطين هذا الأسبوع */
    weeklyActiveRate: number;
    /** أكثر أنماط الحدود شيوعاً */
    topBoundaryPatterns: string[];
    /** مستوى الضغط العام (1-10) */
    stressIndex: number;
    /** توصية للمؤسسة */
    recommendation: string;
}

export interface EnterpriseData {
    profile?: EnterpriseProfile;
    memberCodes: string[];
    metrics?: AggregateMetrics;
    lastUpdated?: number;
}

function generateEnterpriseId(): string {
    return "ENT-" + Date.now().toString(36).toUpperCase();
}

/* ── Load / Save ── */
export function loadEnterpriseData(): EnterpriseData {
    try {
        const raw = localStorage.getItem(ENTERPRISE_KEY);
        if (!raw) return { memberCodes: [] };
        return JSON.parse(raw) as EnterpriseData;
    } catch {
        return { memberCodes: [] };
    }
}

export function saveEnterpriseData(data: EnterpriseData): void {
    try {
        localStorage.setItem(ENTERPRISE_KEY, JSON.stringify(data));
    } catch { /* noop */ }
}

/* ── Actions ── */
export function registerEnterprise(
    name: string,
    type: EnterpriseType,
    size: EnterpriseProfile["size"],
    adminEmail: string
): EnterpriseProfile {
    const profile: EnterpriseProfile = {
        id: generateEnterpriseId(),
        name,
        type,
        size,
        adminEmail,
        joinedAt: Date.now(),
        memberCount: 0,
    };
    const data = loadEnterpriseData();
    data.profile = profile;
    saveEnterpriseData(data);
    return profile;
}

export function addMemberCode(code: string): void {
    const data = loadEnterpriseData();
    if (!data.memberCodes.includes(code)) {
        data.memberCodes.push(code);
        if (data.profile) data.profile.memberCount = data.memberCodes.length;
        saveEnterpriseData(data);
    }
}

export function isEnterprise(): boolean {
    return !!loadEnterpriseData().profile;
}

export const ENTERPRISE_TYPE_LABELS: Record<EnterpriseType, string> = {
    school: "مدرسة / جامعة",
    company: "شركة",
    clinic: "عيادة / مركز صحي",
    ngo: "منظمة غير ربحية",
};

export const ENTERPRISE_FEATURES = [
    "لوحة تحليلات مجمّعة (مجهولة الهوية)",
    "تقارير الصحة النفسية الشهرية",
    "تنبيهات مبكرة للأزمات",
    "جلسات جماعية مع جارفيس",
    "تكامل مع HR/LMS",
    "دعم مخصص 24/7",
];

/** يُنتج تقرير صحة مجمّع (Truth-Only version) */
export function generateMockMetrics(_memberCount: number): AggregateMetrics {
    return {
        avgEnergyLevel: 0,
        weeklyActiveRate: 0,
        topBoundaryPatterns: [],
        stressIndex: 0,
        recommendation: "بانتظار تدفق بيانات حقيقية من الأعضاء لبناء التوصية الاستراتيجية.",
    };
}
