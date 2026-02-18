/**
 * Referral Engine — محرك الإحالة
 * ==================================
 * "ادعُ قائد → اكسب ميدالية + أسبوع بريميوم"
 * نظام إحالة يحقق K-Factor > 1
 */

const REFERRAL_KEY = "dawayir-referral";
const REFERRAL_CODE_LENGTH = 8;

export interface ReferralData {
    myCode: string;
    referredBy?: string;
    referralCount: number;
    earnedWeeks: number; // أسابيع بريميوم مكتسبة
    referredUsers: string[]; // codes of users I referred
}

function generateCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: REFERRAL_CODE_LENGTH }, () =>
        chars[Math.floor(Math.random() * chars.length)]
    ).join("");
}

/* ── Load / Save ── */
export function loadReferralData(): ReferralData {
    try {
        const raw = localStorage.getItem(REFERRAL_KEY);
        if (!raw) {
            const data: ReferralData = {
                myCode: generateCode(),
                referralCount: 0,
                earnedWeeks: 0,
                referredUsers: [],
            };
            saveReferralData(data);
            return data;
        }
        return JSON.parse(raw) as ReferralData;
    } catch {
        const data: ReferralData = {
            myCode: generateCode(),
            referralCount: 0,
            earnedWeeks: 0,
            referredUsers: [],
        };
        return data;
    }
}

export function saveReferralData(data: ReferralData): void {
    try {
        localStorage.setItem(REFERRAL_KEY, JSON.stringify(data));
    } catch { /* noop */ }
}

/* ── Actions ── */
export function getMyReferralLink(): string {
    const data = loadReferralData();
    return `https://dawayir.app?ref=${data.myCode}`;
}

export function getMyReferralCode(): string {
    return loadReferralData().myCode;
}

/** يُستدعى عند تسجيل مستخدم جديد باستخدام كود الإحالة */
export function applyReferralCode(code: string): boolean {
    const data = loadReferralData();

    // Can't refer yourself
    if (code === data.myCode) return false;
    // Already referred
    if (data.referredBy) return false;

    data.referredBy = code;
    saveReferralData(data);

    // TODO: Notify referrer via Supabase edge function
    return true;
}

/** يُستدعى عندما يكمل المُحال إليه أول خريطة */
export function recordSuccessfulReferral(referredCode: string): void {
    const data = loadReferralData();
    if (!data.referredUsers.includes(referredCode)) {
        data.referredUsers.push(referredCode);
        data.referralCount += 1;
        data.earnedWeeks += 1; // أسبوع بريميوم مجاني لكل إحالة ناجحة
        saveReferralData(data);
    }
}

/** رسالة المشاركة الجاهزة */
export function getReferralShareText(): string {
    const code = getMyReferralCode();
    return `🗺️ اكتشفت تطبيق بيساعدني أفهم علاقاتي وأضع حدود صحية بدون ما أحس بالذنب.

استخدم كودي: ${code}
أو الرابط: ${getMyReferralLink()}

#الرحلة #دواير`;
}

/** هل المستخدم مؤهل لمكافأة الإحالة؟ */
export function getReferralRewardStatus(): {
    count: number;
    nextRewardAt: number;
    earnedWeeks: number;
} {
    const data = loadReferralData();
    return {
        count: data.referralCount,
        nextRewardAt: Math.ceil((data.referralCount + 1) / 1) * 1, // كل إحالة = مكافأة
        earnedWeeks: data.earnedWeeks,
    };
}
