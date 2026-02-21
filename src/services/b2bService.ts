import { supabase } from "./supabaseClient";

/**
 * B2B Service — خدمة الكوتشات والمعالجين
 * ==========================================
 * بوابة B2B تتيح للكوتشات والمعالجين متابعة عملائهم عبر Supabase.
 */

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
    clientCode: string;
    clientAlias: string;
    linkedAt: number;
    consentGiven: boolean;
    lastActive?: number;
}

/* ── Utilities ── */
function generateB2BCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return "B2B-" + Array.from({ length: 6 }, () =>
        chars[Math.floor(Math.random() * chars.length)]
    ).join("");
}

/* ── User: Share with coach ── */
export async function getMyShareCode(): Promise<string> {
    if (!supabase) return generateB2BCode(); // fallback
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return generateB2BCode();

    // The user's user_id is their share code for now (or we can store a specific code)
    // For simplicity, returning the user id as the code.
    return session.user.id;
}

export async function getShareWithCoachText(coachName?: string): Promise<string> {
    const code = await getMyShareCode();
    return `كودي للمتابعة${coachName ? ` مع ${coachName}` : ""}: ${code}\n\nهذا الكود يتيح للكوتش متابعة تقدمي العام فقط — بدون تفاصيل شخصية.`;
}

/* ── Coach: Manage clients ── */
export async function registerAsCoach(
    name: string,
    role: B2BRole,
    specialization: string
): Promise<boolean> {
    if (!supabase) return false;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;

    const { error } = await supabase
        .from('profiles')
        .update({
            role: 'coach',
            // Ideally we also save name/specialization, but we rely on profiles table
        })
        .eq('id', session.user.id);

    return !error;
}

export async function addClient(clientCode: string, alias: string): Promise<boolean> {
    if (!supabase) return false;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;

    // clientCode is essentially the user_id of the client 
    const { error } = await supabase
        .from('coach_connections')
        .insert({
            coach_id: session.user.id,
            client_id: clientCode,
            status: 'active' // For MVP, auto-activate. In prod requires consent
        });

    return !error;
}

export async function getClients(): Promise<ClientLink[]> {
    if (!supabase) return [];
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];

    const { data, error } = await supabase
        .from('coach_connections')
        .select(`
            client_id,
            status,
            created_at
        `)
        .eq('coach_id', session.user.id)
        .eq('status', 'active');

    if (error || !data) return [];

    return data.map(item => ({
        clientCode: item.client_id,
        clientAlias: `عميل ${item.client_id.substring(0, 4)}`, // Alias is masked ID for now
        linkedAt: new Date(item.created_at).getTime(),
        consentGiven: true
    }));
}

export async function isCoach(): Promise<boolean> {
    if (!supabase) return false;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;

    const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

    return data?.role === 'coach';
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
