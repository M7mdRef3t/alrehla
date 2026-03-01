import { createClient } from "@supabase/supabase-js";
import { getRankedActions } from "./actionAdaptation";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export type InterventionType = 'low_mood_streak' | 'stress_overload' | 'energy_crash' | 'negative_trajectory';

export async function processInterventions(userId: string) {
    const findings: { type: InterventionType; message: string; severity: string; metadata: any }[] = [];

    // 1. Fetch recent pulse data (last 7 days)
    const { data: pulses } = await supabaseAdmin
        .from('daily_pulse_logs')
        .select('*')
        .eq('user_id', userId)
        .order('day', { ascending: false })
        .limit(7);

    if (!pulses || pulses.length === 0) return [];

    const currentMood = pulses[0].mood;
    // Fetch adaptation rankings with current mood context
    const rankings = await getRankedActions(userId, currentMood);

    const rankActions = (actions: { id: string; label: string; icon: string }[]) => {
        return actions
            .map(a => {
                const stats = rankings[a.id];
                let badge = '';
                let priority = stats?.final_score ?? 0.5;

                // Exploration Layer: Identify unique badges
                if (stats) {
                    if (stats.is_blacklisted) return null; // Safety Guard in action

                    if (stats.effectiveness_score > 0.7 && stats.count > 3) {
                        badge = 'الأكثر فاعلية ليك';
                    } else if (stats.exploration_score > 0.8) {
                        badge = 'تجربة جديدة جريئة';
                    } else if (stats.count > 5 && stats.effectiveness_score < 0.3) {
                        badge = 'جينوم الوعي: جرب كسر النمط'; // Low effectiveness but high usage, nudging for change
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

    // Rule A: Low Mood Streak (3 days <= 2)
    const moodStreak = pulses.slice(0, 3);
    if (moodStreak.length === 3 && moodStreak.every(p => p.mood <= 2)) {
        findings.push({
            type: 'low_mood_streak',
            message: 'ملاحظ بقالك ٣ أيام موودك مش في أحسن حالاته. فيه حاجة شاغلة بالك في الدواير الحمراء؟',
            severity: 'high',
            metadata: {
                moodHistory: moodStreak.map(p => p.mood),
                suggestedActions: rankActions([
                    { id: 'red_orbit_analysis', label: 'تحليل المدار الأحمر', icon: 'zap' },
                    { id: 'quick_journal', label: 'تفريغ مشاعر سريع', icon: 'book' }
                ])
            }
        });
    }

    // Rule B: Stress Overload (Same tag 4 times in 7 days)
    const stressCounts: Record<string, number> = {};
    pulses.forEach(p => { if (p.stress_tag) stressCounts[p.stress_tag] = (stressCounts[p.stress_tag] || 0) + 1; });
    const overloadTag = Object.entries(stressCounts).find(([_, count]) => count >= 4);
    if (overloadTag) {
        findings.push({
            type: 'stress_overload',
            message: `دائرة الـ "${overloadTag[0]}" مسببة لك ضغط متكرر الأسبوع ده. محتاجين نفككها؟`,
            severity: 'medium',
            metadata: {
                tag: overloadTag[0],
                count: overloadTag[1],
                suggestedActions: rankActions([
                    { id: 'rebalance_circles', label: 'إعادة توزيع الدائرة', icon: 'refresh' },
                    { id: 'map_focus', label: 'تركيز على الخريطة', icon: 'target' }
                ])
            }
        });
    }

    // Rule C: Energy Crash (Drop of 2+ points in 2 days)
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
    for (const f of findings) {
        const { count } = await supabaseAdmin
            .from('interventions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('type', f.type)
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        if (count === 0) {
            await supabaseAdmin.from('interventions').insert({
                user_id: userId,
                ...f
            });
        }
    }

    return findings;
}
