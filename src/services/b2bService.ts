/**
 * B2B Service — خدمة الكوتشات والمعالجين
 * ==========================================
 * بوابة B2B تتيح للكوتشات والمعالجين:
 * - متابعة تقدم عملائهم (بموافقتهم)
 * - تقارير مجمّعة بدون هويات
 * - جلسات مشتركة
 */

const B2B_KEY = "dawayir-b2b";

export type B2BRole = "coach" | "therapist" | "counselor";

export interface B2BProfile {
    id: string;
    role: B2BRole;
    name: string;
    specialization: string;
    clientCount: number;
    joinedAt: number;
    isVerified: boolean;
}

export interface ClientLink {
    clientCode: string;    // كود مشاركة العميل
    clientAlias: string;   // اسم مستعار (ليس الاسم الحقيقي)
    linkedAt: number;
    consentGiven: boolean;
    lastActive?: number;
}

export interface B2BData {
    profile?: B2BProfile;
    clients: ClientLink[];
    myShareCode?: string;  // كود المستخدم لمشاركته مع الكوتش
}

function generateB2BCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return "B2B-" + Array.from({ length: 6 }, () =>
        chars[Math.floor(Math.random() * chars.length)]
    ).join("");
}

/* ── Load / Save ── */
export function loadB2BData(): B2BData {
    try {
        const raw = localStorage.getItem(B2B_KEY);
        if (!raw) return { clients: [] };
        return JSON.parse(raw) as B2BData;
    } catch {
        return { clients: [] };
    }
}

export function saveB2BData(data: B2BData): void {
    try {
        localStorage.setItem(B2B_KEY, JSON.stringify(data));
    } catch { /* noop */ }
}

/* ── User: Share with coach ── */
export function getMyShareCode(): string {
    const data = loadB2BData();
    if (!data.myShareCode) {
        data.myShareCode = generateB2BCode();
        saveB2BData(data);
    }
    return data.myShareCode;
}

export function getShareWithCoachText(coachName?: string): string {
    const code = getMyShareCode();
    return `كودي للمتابعة${coachName ? ` مع ${coachName}` : ""}: ${code}\n\nهذا الكود يتيح للكوتش متابعة تقدمي العام فقط — بدون تفاصيل شخصية.`;
}

/* ── Coach: Manage clients ── */
export function registerAsCoach(
    name: string,
    role: B2BRole,
    specialization: string
): B2BProfile {
    const data = loadB2BData();
    const profile: B2BProfile = {
        id: `coach-${Date.now()}`,
        role,
        name,
        specialization,
        clientCount: 0,
        joinedAt: Date.now(),
        isVerified: false,
    };
    data.profile = profile;
    saveB2BData(data);
    return profile;
}

export function addClient(clientCode: string, alias: string): boolean {
    const data = loadB2BData();
    const exists = data.clients.some((c) => c.clientCode === clientCode);
    if (exists) return false;

    data.clients.push({
        clientCode,
        clientAlias: alias,
        linkedAt: Date.now(),
        consentGiven: true,
    });

    if (data.profile) {
        data.profile.clientCount = data.clients.length;
    }

    saveB2BData(data);
    return true;
}

export function getClients(): ClientLink[] {
    return loadB2BData().clients;
}

export function isCoach(): boolean {
    return !!loadB2BData().profile;
}

export const B2B_ROLE_LABELS: Record<B2BRole, string> = {
    coach: "كوتش",
    therapist: "معالج نفسي",
    counselor: "مستشار",
};

export const B2B_FEATURES = [
    "متابعة تقدم العملاء (بموافقتهم)",
    "تقارير مجمّعة بدون هويات",
    "جلسات مشتركة مع جارفيس",
    "لوحة تحكم مخصصة",
    "تصدير تقارير PDF",
    "دعم أولوية 24/7",
];
