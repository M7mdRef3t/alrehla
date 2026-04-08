import { logger } from "@/services/logger";
import { supabase } from "./supabaseClient";

/**
 * Community Service — دوائر الدعم المجهولة والحكمة المشتركة
 * ==========================================
 * يتيح للمستخدمين الانضمام لدوائر دعم دون أسماء حقيقية
 * ومشاركة قصص التعافي بشكل مجهول.
 */

export type CircleTopic = 'family_boundaries' | 'guilt_recovery' | 'trauma_healing' | 'work_burnout';
type CircleRow = {
    id: string;
    topic: CircleTopic;
    title: string;
    description: string;
    max_members: number;
    circle_members?: { count: number }[];
};

type SharedWisdomRow = {
    id: string;
    topic: string;
    story: string;
    strategy: string;
    helpful_count: number;
    created_at: string;
};

export interface SupportCircle {
    id: string;
    topic: CircleTopic;
    title: string;
    description: string;
    membersCount: number;
    maxMembers: number;
    rules: string[];
}

export interface SharedWisdom {
    id: string;
    topic: string;
    story: string;
    strategy: string;
    helpfulCount: number;
    createdAt: number;
}

export async function getActiveCircles(): Promise<SupportCircle[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('support_circles')
        .select(`
            *,
            circle_members(count)
        `);

    if (error || !data) {
        logger.error("Error fetching circles:", error);
        return [];
    }

    return (data as CircleRow[]).map((item) => ({
        id: item.id,
        topic: item.topic,
        title: item.title,
        description: item.description,
        membersCount: item.circle_members?.[0]?.count || 0,
        maxMembers: item.max_members,
        rules: ["لا أسماء حقيقية", "لا توجيه أحكام", "السرية مقدسة"]
    }));
}

export async function joinCircle(circleId: string): Promise<boolean> {
    if (!supabase) return false;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;

    const { error } = await supabase
        .from('circle_members')
        .insert({
            circle_id: circleId,
            user_id: session.user.id
        });

    return !error;
}

export async function getSharedWisdom(topic?: CircleTopic): Promise<SharedWisdom[]> {
    if (!supabase) return [];

    let query = supabase
        .from('shared_wisdom')
        .select('*')
        .order('helpful_count', { ascending: false });

    if (topic) {
        query = query.eq('topic', topic);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return (data as SharedWisdomRow[]).map((item) => ({
        id: item.id,
        topic: item.topic,
        story: item.story,
        strategy: item.strategy,
        helpfulCount: item.helpful_count,
        createdAt: new Date(item.created_at).getTime()
    }));
}

export async function shareMyWisdom(story: string, strategy: string, topic: string): Promise<boolean> {
    if (!supabase) return false;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;

    const { error } = await supabase
        .from('shared_wisdom')
        .insert({
            story,
            strategy,
            topic,
            author_id: session.user.id
        });

    return !error;
}
