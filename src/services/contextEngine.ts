import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function processContextualInsights(userId: string) {
    try {
        // 2. Fetch last 30 days of data for both Map and Insights
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const [{ data: pulses }, { data: actions }] = await Promise.all([
            supabaseAdmin.from('daily_pulse_logs').select('day, mood, energy').eq('user_id', userId).gte('day', thirtyDaysAgo).order('day', { ascending: true }),
            supabaseAdmin.from('micro_actions').select('executed_at, metadata, action_type').eq('user_id', userId).gte('executed_at', thirtyDaysAgo)
        ]);

        if (!pulses || !actions || pulses.length < 3 || actions.length < 3) return;

        // 3. GENERATE INFLUENCE NETWORK (Always update on pulse for UI freshness)
        await generateInfluenceSnapshot(userId, pulses, actions);

        // 4. THROTTELED: Contextual Insights (Deep Dive)
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
        const { count: recentInsights } = await supabaseAdmin
            .from('contextual_insights')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('surfaced_at', fourteenDaysAgo);

        if (recentInsights && recentInsights > 0) return;

        // FAST EARLY INSIGHT (Hook) if pulses are between 3 and 7
        const isEarlyCohort = pulses.length <= 7;

        // 5. Analyze Patterns: Circle/Person Dominance on Low Energy
        const lowEnergyDays = pulses.filter(p => p.energy <= 4).map(p => p.day.split('T')[0]);
        const personCountsOnLowEnergy = new Map<string, number>();
        const totalPersonCounts = new Map<string, number>();

        for (const action of actions) {
            const person = action.metadata?.nodeLabel;
            if (!person) continue;

            const date = action.executed_at.split('T')[0];
            totalPersonCounts.set(person, (totalPersonCounts.get(person) || 0) + 1);

            if (lowEnergyDays.includes(date)) {
                personCountsOnLowEnergy.set(person, (personCountsOnLowEnergy.get(person) || 0) + 1);
            }
        }

        for (const [person, lowCount] of personCountsOnLowEnergy.entries()) {
            const total = totalPersonCounts.get(person) || 1;
            const ratioInLowEnergy = lowCount / total;

            // In early cohort, we relax the confidence threshold to ensure the hook is delivered
            const confidenceThreshold = isEarlyCohort ? 0.4 : 0.65;
            const minLowDays = isEarlyCohort ? 1 : 2;

            if (ratioInLowEnergy >= confidenceThreshold && lowCount >= minLowDays) {
                const title = `تحذير راداري: نزيف طاقة مرتبط بـ "${person}"`;
                const dropPercentage = Math.round(ratioInLowEnergy * 100);

                const description = isEarlyCohort
                    ? `في الأيام التي تتقاطع فيها مع "${person}"، تنهار طاقتك بشكل ملحوظ (بنسبة ارتباط ${dropPercentage}%). راجع موقع هذا الشخص في دوائرك فوراً.`
                    : `نمط صامت: كلما زاد تفاعلك مع "${person}"، نلاحظ تراجعاً حاداً في استقرارك الطاقي. هذه العلاقة تسحب من رصيدك الحيوي.`;

                await supabaseAdmin.from('contextual_insights').insert({
                    user_id: userId,
                    insight_type: 'circle_energy_drain',
                    title,
                    description,
                    confidence_score: ratioInLowEnergy,
                    metadata: { person, ratioInLowEnergy, pulsesCount: pulses.length, hook: true }
                });
                break;
            }
        }
    } catch (err) {
        console.error("Context Engine Error:", err);
    }
}

async function generateInfluenceSnapshot(userId: string, pulses: any[], actions: any[]) {
    // Nodes: Circles + Mood + Energy
    const circles = Array.from(new Set(actions.map(a => a.metadata?.nodeLabel).filter(Boolean)));
    const nodes = [
        ...circles.map(c => ({ id: c, label: c, type: 'circle' })),
        { id: 'mood', label: 'الموود', type: 'state' },
        { id: 'energy', label: 'الطاقة', type: 'state' }
    ];

    const edges: any[] = [];

    // Simple Correlation Calculation: 
    // How circle activity changes correlate with state changes
    for (const circle of circles) {
        const circleActions = actions.filter(a => a.metadata?.nodeLabel === circle);

        // Relationship with Mood
        const moodCorr = calculateCorrelation(circleActions, pulses, 'mood');
        if (Math.abs(moodCorr.strength) > 0.3) {
            edges.push({ source: circle, target: 'mood', strength: moodCorr.strength, confidence: moodCorr.confidence });
        }

        // Relationship with Energy
        const energyCorr = calculateCorrelation(circleActions, pulses, 'energy');
        if (Math.abs(energyCorr.strength) > 0.3) {
            edges.push({ source: circle, target: 'energy', strength: energyCorr.strength, confidence: energyCorr.confidence });
        }
    }

    // Save Snapshot
    await supabaseAdmin.from('influence_maps').insert({
        user_id: userId,
        nodes,
        edges,
        metadata: { period: '30d', samples: pulses.length }
    });
}

function calculateCorrelation(circleActions: any[], pulses: any[], stateKey: string) {
    // 1. Group actions by day
    const dailyDensity = new Map<string, number>();
    circleActions.forEach(a => {
        const d = a.executed_at.split('T')[0];
        dailyDensity.set(d, (dailyDensity.get(d) || 0) + 1);
    });

    // 2. Map pulses to density & Calculate Pearson components
    let sumXY = 0, sumX = 0, sumY = 0, sumX2 = 0, sumY2 = 0, n = 0;
    for (const p of pulses) {
        const d = p.day.split('T')[0];
        // Outlier Guard: Clip daily density to reasonable human limits (Z-clipping simulation)
        const rawX = dailyDensity.get(d) || 0;
        const x = Math.min(rawX, 10); // Simple cap: more than 10 actions/day per circle is an outlier for V1

        const y = p[stateKey] || 0;

        n++;
        sumX += x;
        sumY += y;
        sumXY += (x * y);
        sumX2 += (x * x);
        sumY2 += (y * y);
    }

    // Min Sample Size Guard (Scientific honesty)
    if (n < 7) return { strength: 0, confidence: 0, samples: n };

    const numerator = (n * sumXY) - (sumX * sumY);
    const denominator = Math.sqrt(((n * sumX2) - (sumX * sumX)) * ((n * sumY2) - (sumY * sumY)));

    // Variance Guard: If data is flat (zero variance), correlation is undefined/zero
    const strength = (denominator === 0 || isNaN(denominator)) ? 0 : numerator / denominator;

    // Confidence = Weighted Sample Size + Stability Factor
    const confidence = Math.min(n / 30, 0.9);

    return { strength, confidence, samples: n };
}
