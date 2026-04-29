import { supabaseAdmin } from "./supabaseClient";
import { getRankedActions } from "./actionAdaptation";

function getSupabaseAdmin() {
    return supabaseAdmin;
}

export type InterventionType = 'low_mood_streak' | 'stress_overload' | 'energy_crash' | 'negative_trajectory';

const MOOD_MAP: Record<string, number> = {
    'angry': 1,
    'overwhelmed': 2,
    'anxious': 3,
    'calm': 4,
    'hopeful': 5,
    'bright': 6
};

export async function processInterventions(userId: string) {
    const findings: { type: InterventionType; message: string; severity: string; metadata: any }[] = [];
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) return [];

    // 1. Fetch recent pulse data (last 7 days)
    const { data: pulses } = await supabaseAdmin
        .from('daily_pulse_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(7);

    if (!pulses || pulses.length === 0) return [];

    const rawMood = pulses[0].mood;
    const currentMoodScore = typeof rawMood === 'number' ? rawMood : (MOOD_MAP[rawMood as string] || 3);
    
    // Fetch adaptation rankings with current mood context
    const rankings = await getRankedActions(userId, currentMoodScore);
    
    const rankActions = (actions: { id: string; label: string; icon: string }[]) => {
        return actions
            .map(a => {
                const stats = rankings[a.id];
                let badge = '';
                const priority = stats?.final_score ?? 0.5;

                if (stats) {
                    if (stats.is_blacklisted) return null;

                    if (stats.effectiveness_score > 0.7 && stats.count > 3) {
                        badge = 'الأكثر فاعلية ليك';
                    } else if (stats.exploration_score > 0.8) {
                        badge = 'تجربة جديدة جريئة';
                    } else if (stats.count > 5 && stats.effectiveness_score < 0.3) {
                        badge = 'جينوم الوعي: جرب كسر النمط';
                    } else if (stats.success_rate > 0.6) {
                        badge = 'جاب نتيجة قبل كده';
                    } else {
                        badge = 'تطور إضافي';
                    }
                } else {
                    badge = 'تجربة جديدة استكشافية';
                }

                return { ...a, badge, priority };
            })
            .filter(Boolean)
            .sort((a, b) => (b?.priority || 0) - (a?.priority || 0));
    };

    // Rule A: Low Mood Streak (3 days <= 3)
    const moodStreak = pulses.slice(0, 3).map(p => typeof p.mood === 'number' ? p.mood : (MOOD_MAP[p.mood] || 3));
    if (moodStreak.length === 3 && moodStreak.every(score => score <= 3)) {
        findings.push({
            type: 'low_mood_streak',
            message: 'ملاحظ بقالك ٣ أيام موودك مش في أحسن حالاته. فيه حاجة شاغلة بالك في الدواير الحمراء؟',
            severity: 'high',
            metadata: {
                moodHistory: moodStreak,
                suggestedActions: rankActions([
                    { id: 'red_orbit_analysis', label: 'تحليل المدار الأحمر', icon: 'zap' },
                    { id: 'quick_journal', label: 'تفريغ مشاعر سريع', icon: 'book' }
                ])
            }
        });
    }

    // Rule B: Stress Overload (Energy reasons analysis)
    const energyReasons: string[] = [];
    pulses.forEach(p => { 
        if (Array.isArray(p.energy_reasons)) energyReasons.push(...p.energy_reasons);
    });
    
    const reasonCounts: Record<string, number> = {};
    energyReasons.forEach(r => reasonCounts[r] = (reasonCounts[r] || 0) + 1);
    const overloadReason = Object.entries(reasonCounts).find(([_, count]) => count >= 3);

    if (overloadReason) {
        findings.push({
            type: 'stress_overload',
            message: `كلمة "${overloadReason[0]}" اتكررت كتير في طاقتك الأسبوع ده. محتاجين نفكك الدائرة دي؟`,
            severity: 'medium',
            metadata: {
                reason: overloadReason[0],
                count: overloadReason[1],
                suggestedActions: rankActions([
                    { id: 'rebalance_circles', label: 'إعادة توزيع الدائرة', icon: 'refresh' },
                    { id: 'map_focus', label: 'تركيز على الخريطة', icon: 'target' }
                ])
            }
        });
    }

    // Rule C: Energy Crash (Drop of 2+ points in 2 records)
    if (pulses.length >= 2) {
        const drop = pulses[1].energy - pulses[0].energy;
        if (drop >= 2) {
            findings.push({
                type: 'energy_crash',
                message: 'طاقتك نزلت الأرض النهاردة فجأة. خد نفس وبلاش تقسى على نفسك.',
                severity: 'medium',
                metadata: {
                    prev: pulses[1].energy,
                    curr: pulses[0].energy,
                    suggestedActions: rankActions([
                        { id: 'quick_journal', label: 'تفريغ مشاعر', icon: 'book' },
                        { id: 'map_focus', label: 'تأمل الخريطة', icon: 'target' }
                    ])
                }
            });
        }
    }

    // Save New Interventions
    if (findings.length > 0) {
        const findingTypes = findings.map(f => f.type);
        const { data: existingInterventions } = await supabaseAdmin
            .from('pending_interventions')
            .select('type')
            .eq('user_id', userId)
            .in('type', findingTypes)
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        const existingTypes = new Set((existingInterventions || []).map(i => i.type));
        const newFindings = findings.filter(f => !existingTypes.has(f.type));

        if (newFindings.length > 0) {
            const insertPayload = newFindings.map(f => ({
                user_id: userId,
                trigger_reason: f.type,
                ai_message: f.message,
                status: 'unread',
                metadata: f.metadata
            }));
            await supabaseAdmin.from('pending_interventions').insert(insertPayload);
        }
    }

    return findings;
}

