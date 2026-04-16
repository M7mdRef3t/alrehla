import { logger } from "@/services/logger";
/**
 * Referral Engine — محرك الإحالة
 * ==================================
 * "ادعُ قائد → اكسب ميدالية + أسبوع بريميوم"
 * نظام إحالة يحقق K-Factor > 1
 */

import { supabase, isSupabaseReady } from "./supabaseClient";

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

/** 
 * نسخة متقدمة متزامنة مع Supabase 
 * تضمن بقاء كود الإحالة ثابتاً عبر المتصفحات لنفس المستخدم (بالإيميل)
 */
export async function syncReferralToSupabase(email: string): Promise<ReferralData> {
    const local = loadReferralData();
    if (!isSupabaseReady || !supabase || !email) return local;

    try {
        // 1. Check if we already have this lead/user
        const { data: lead } = await supabase
            .from("marketing_leads")
            .select("metadata")
            .eq("email", email)
            .maybeSingle();

        if (lead?.metadata?.referral_code) {
            // Already has a code in DB, use it
            const remoteData: ReferralData = {
                myCode: lead.metadata.referral_code,
                referredBy: lead.metadata.referred_by,
                referralCount: lead.metadata.referral_count || 0,
                earnedWeeks: lead.metadata.earned_weeks || 0,
                referredUsers: lead.metadata.referred_users || [],
            };
            saveReferralData(remoteData);
            return remoteData;
        }

        // 2. No code in DB, push local one
        await supabase
            .from("marketing_leads")
            .update({
                metadata: {
                    ...(lead?.metadata || {}),
                    referral_code: local.myCode,
                    referral_count: local.referralCount,
                    earned_weeks: local.earnedWeeks,
                    referred_users: local.referredUsers
                }
            })
            .eq("email", email);

    } catch (e) {
        logger.error("Referral Sync Error:", e);
    }

    return local;
}

export function saveReferralData(data: ReferralData): void {
    try {
        localStorage.setItem(REFERRAL_KEY, JSON.stringify(data));
    } catch { /* noop */ }
}

/* ── Actions ── */
export function getMyReferralLink(): string {
    const data = loadReferralData();
    return `https://alrehla.app/go?ref=${data.myCode}&utm_source=referral&utm_medium=share&utm_campaign=viral`;
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

    return true;
}

/** نسخة الأكشن الفعلي مع Supabase */
export async function applyReferralCodeAsync(code: string, myEmail: string): Promise<boolean> {
    const ok = applyReferralCode(code);
    if (!ok || !isSupabaseReady || !supabase || !myEmail) return ok;

    try {
        // 1. Mark in my lead metadata
        const { data: me } = await supabase.from("marketing_leads").select("metadata").eq("email", myEmail).maybeSingle();
        await supabase.from("marketing_leads").update({
            metadata: { ...(me?.metadata || {}), referred_by: code }
        }).eq("email", myEmail);

        // 2. Increment referrer's count if we can find them
        const { data: referrer } = await supabase.from("marketing_leads").select("email, metadata").filter("metadata->>referral_code", "eq", code).maybeSingle();
        
        if (referrer) {
            const rMeta = referrer.metadata || {};
            const rUsers = rMeta.referred_users || [];
            if (!rUsers.includes(myEmail)) {
                rUsers.push(myEmail);
                await supabase.from("marketing_leads").update({
                    metadata: { 
                        ...rMeta, 
                        referred_users: rUsers,
                        referral_count: (rMeta.referral_count || 0) + 1,
                        earned_weeks: (rMeta.earned_weeks || 0) + 1
                    }
                }).eq("email", referrer.email);
            }
        }
    } catch (e) {
        logger.error("Apply Referral Error:", e);
    }

    return true;
}

/** 
 * إشعار الشخص اللي عمل الـ Invite لما حد يسجل بسببه
 * Recovered from M7mdRef3t's manual fix in PR #111
 */
export async function notifyReferrer(referrerId: string, newUserEmail: string) {
    if (!isSupabaseReady || !supabase) return null;
    
    const { data, error } = await supabase.functions.invoke('notify-referrer', {
        body: { referrerId, newUserEmail },
    });
    
    if (error) {
        logger.error("Notify Referrer Error:", error);
        throw error;
    }
    return data;
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

/** رسالة المشاركة الجاهزة - بنكهة مصرية أصيلة */
export function getReferralShareText(): string {
    const code = getMyReferralCode();
    const link = getMyReferralLink();
    
    const variants = [
        `🗺️ يابني اكتشفت تطبيق حكاية بيعرفني مين في حياتي "جدع" ومين "هجاص".. جربه وهتفهم قصدي.

استخدم كودي: ${code}
أو الرابط: ${link}`,
        
        `🧿 لو عايز تروق بالك وتفهم حدودك مع الناس من غير ما تحس بذنب.. "الرحلة" هتظبطلك الدنيا.

كودي الشخصي: ${code}
الرابط: ${link}`,
        
        `🤝 يا زميلي السكة طويلة ومحتاجة ناس "أصيلة".. دخل الكود ده في رحلتك وخلينا نكبر الدايرة.

كود الدعوة: ${code}
ابدأ من هنا: ${link}`
    ];

    // Randomize for authentic feel
    return variants[Math.floor(Math.random() * variants.length)];
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
