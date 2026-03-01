import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function processContextualInsights(userId: string) {
    try {
        // 1. Frequency Check: Max 1 contextual insight every 14 days
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
        const { count: recentInsights } = await supabaseAdmin
            .from('contextual_insights')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('surfaced_at', fourteenDaysAgo);

        if (recentInsights && recentInsights > 0) return;

        // 2. Fetch last 30 days of data
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        // Pulses
        const { data: pulses } = await supabaseAdmin
            .from('daily_pulse_logs')
            .select('day, mood, energy')
            .eq('user_id', userId)
            .gte('day', thirtyDaysAgo)
            .order('day', { ascending: true });

        // Actions
        const { data: actions } = await supabaseAdmin
            .from('micro_actions')
            .select('executed_at, metadata, action_type')
            .eq('user_id', userId)
            .gte('executed_at', thirtyDaysAgo);

        if (!pulses || !actions || pulses.length < 7 || actions.length < 10) return;

        // 3. Analyze Patterns: Circle Dominance vs. Negative States
        // Let's count actions per circle on low mood days (< 3)
        const lowMoodDays = pulses.filter(p => p.mood < 3).map(p => p.day.split('T')[0]);
        const circleCountsOnLowMood = new Map<string, number>();
        const totalCircleCounts = new Map<string, number>();

        for (const action of actions) {
            const circle = action.metadata?.nodeLabel;
            if (!circle) continue;

            const date = action.executed_at.split('T')[0];
            totalCircleCounts.set(circle, (totalCircleCounts.get(circle) || 0) + 1);
            if (lowMoodDays.includes(date)) {
                circleCountsOnLowMood.set(circle, (circleCountsOnLowMood.get(circle) || 0) + 1);
            }
        }

        // Detect Dominance Correlation
        for (const [circle, lowCount] of circleCountsOnLowMood.entries()) {
            const total = totalCircleCounts.get(circle) || 1;
            const ratioInLowMood = lowCount / total; // Percentage of this circle's actions happening on low mood days
            const globalLowMoodRatio = lowMoodDays.length / pulses.length;

            // If ratio is significantly higher than global, we have a correlation (> 0.65 threshold)
            const confidence = ratioInLowMood > (globalLowMoodRatio * 1.5) ? ratioInLowMood : 0;

            if (confidence > 0.65) {
                const title = `نمط متكرر: تضخم "${circle}" واستقرارك`;
                const description = `كل مرة موودك بينزل تحت المستوى المتوازن، بنلاحظ إن نشاطك في دايرة "${circle}" بيزيد بنسبة ${Math.round(ratioInLowMood * 100)}%. ده بيشير لارتباط مباشر بين ضغط الدايرة دي وتراجع استقرارك النفسي.`;

                await supabaseAdmin.from('contextual_insights').insert({
                    user_id: userId,
                    insight_type: 'circle_mood_correlation',
                    title,
                    description,
                    confidence_score: confidence,
                    metadata: { circle, ratioInLowMood, pulsesCount: pulses.length }
                });
                break; // Only one per cycle
            }
        }

    } catch (err) {
        console.error("Context Engine Error:", err);
    }
}
