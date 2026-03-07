import { NextResponse } from 'next/server';
import { supabase } from '../../../../services/supabaseClient';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

type DriftEdge = { source: string; target: string; drift: number };
type HotspotNode = { label: string; volatility_score: number };

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabase!.auth.getUser(token);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // 1. DATA AGGREGATION & MINIMIZATION (The Policy)

        // A. Latest Weekly Report
        const { data: report } = await supabaseAdmin
            .from('weekly_reports')
            .select('report_result, summary_data, start_date')
            .eq('user_id', user.id)
            .order('start_date', { ascending: false })
            .limit(1)
            .maybeSingle();

        // B. Top 3 Improving Edges (from Drift Engine / latest snapshot)
        const { data: influence } = await supabaseAdmin
            .from('influence_maps')
            .select('*')
            .eq('user_id', user.id)
            .order('snapshot_date', { ascending: false })
            .limit(2);

        let driftEdges: DriftEdge[] = [];
        if (influence && influence.length >= 2) {
            const { calculateDrift } = await import('../../../../services/driftEngine');
            const drift = calculateDrift(influence[0], influence[1]);
            driftEdges = drift.edges
                .filter((e: DriftEdge) => e.drift > 0)
                .sort((a: DriftEdge, b: DriftEdge) => b.drift - a.drift)
                .slice(0, 3)
                .map((e: DriftEdge) => ({ source: e.source, target: e.target, drift: e.drift }));
        }

        // C. Hotspots (from Stability Heatmap)
        const { data: stability } = await supabaseAdmin
            .from('stability_snapshots')
            .select('node_stability')
            .eq('user_id', user.id)
            .order('computed_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        const hotspots = (stability?.node_stability || [])
            .filter((n: HotspotNode) => n.volatility_score > 0.5)
            .slice(0, 3)
            .map((n: HotspotNode) => ({ label: n.label, volatility: n.volatility_score }));

        // D. Milestones
        const { data: milestones } = await supabaseAdmin
            .from('evolution_milestones')
            .select('milestone_label, milestone_type')
            .eq('user_id', user.id)
            .order('unlocked_at', { ascending: false })
            .limit(3);

        // 2. CONSTRUCT PAYLOAD (Filtering identities)
        const strongestDrift = driftEdges[0];
        const strongestTransformation = strongestDrift
            ? `انخفاض التأثير السلبي لـ ${strongestDrift.source} على ${strongestDrift.target} بنسبة ${Math.round(strongestDrift.drift * 100)}%`
            : "استقرار هيكلي في كافة الدوائر المرصودة";

        const payload = {
            story: report?.report_result ? {
                wave_pattern: report.report_result.wave_pattern,
                pattern_insight: report.report_result.pattern_insight,
                final_word: report.report_result.final_word
            } : null,
            evidence: {
                drift: driftEdges,
                hotspots: hotspots,
                trajectory: report?.summary_data?.trajectory?.status || 'stable'
            },
            milestones: milestones || [],
            owner_initials: user.user_metadata?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U',
            strongest_transformation: strongestTransformation,
            created_at: new Date().toISOString()
        };

        // 3. SECURE INSERT
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 7);

        const { data: artifact, error } = await supabaseAdmin
            .from('shared_artifacts')
            .insert({
                owner_user_id: user.id,
                artifact_type: 'evolution_report',
                payload,
                expires_at: expiry.toISOString()
            })
            .select('id')
            .single();

        if (error) throw error;

        return NextResponse.json({
            share_id: artifact.id,
            expires_at: expiry.toISOString(),
            url: `${new URL(req.url).origin}/s/${artifact.id}`
        });

    } catch (err: unknown) {
        console.error("Share creation failed:", err);
        return NextResponse.json({ error: 'Failed to create share' }, { status: 500 });
    }
}
