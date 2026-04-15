import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const adminSecret = process.env.SOVEREIGN_ADMIN_SECRET || '';

const supabase =
    supabaseUrl && supabaseServiceKey
        ? createClient(supabaseUrl, supabaseServiceKey, {
              auth: { autoRefreshToken: false, persistSession: false }
          })
        : null;

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        if (!supabase || !adminSecret) {
            return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
        }

        const url = new URL(req.url);
        const code = url.searchParams.get("code") || req.headers.get("Authorization")?.replace("Bearer ", "");

        if (code !== adminSecret) {
             return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: sessions, error } = await supabase
            .from('gate_sessions')
            .select('created_at, lead_submitted_at, qualified_at, map_started_at, utm_source, source_area')
            .order('created_at', { ascending: false })
            .limit(1000);

        if (error) throw error;

        // Query Granular Drop-offs from Telemetry (Last 7 days to keep it fast)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: eventCounts } = await supabase
            .from('routing_events')
            .select('event_type, payload')
            .gte('occurred_at', sevenDaysAgo.toISOString())
            .or('event_type.like.Gate_%,event_type.like.payment_%,event_type.like.whatsapp_%,event_type.like.diagnosis_%,event_type.like.mizan_%,event_type.like.wird_%,event_type.like.conversion_%');

        const tStats: Record<string, number> = {};
        const diagSteps: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        
        eventCounts?.forEach(e => {
            tStats[e.event_type] = (tStats[e.event_type] || 0) + 1;
            
            // Granular diagnosis step tracking
            if (e.event_type === 'diagnosis_step_complete') {
                const step = (e.payload as any)?.step_number;
                if (typeof step === 'number' && step >= 1 && step <= 5) {
                    diagSteps[step]++;
                }
            }
        });

        const stats = {
            total: sessions.length,
            leads: sessions.filter(s => s.lead_submitted_at).length,
            qualified: sessions.filter(s => s.qualified_at).length,
            activated: sessions.filter(s => s.map_started_at).length,
            sourceBreakdown: {} as Record<string, any>
        };

        // Source breakdown logic
        sessions.forEach(s => {
            const source = s.utm_source || s.source_area || 'unknown';
            if (!stats.sourceBreakdown[source]) {
                stats.sourceBreakdown[source] = { total: 0, leads: 0, qualified: 0, activated: 0 };
            }
            stats.sourceBreakdown[source].total++;
            if (s.lead_submitted_at) stats.sourceBreakdown[source].leads++;
            if (s.qualified_at) stats.sourceBreakdown[source].qualified++;
            if (s.map_started_at) stats.sourceBreakdown[source].activated++;
        });

        return NextResponse.json({
            summary: {
                total_impressions: stats.total,
                lead_count: stats.leads,
                qualified_count: stats.qualified,
                activation_count: stats.activated,
                rates: {
                    impression_to_lead: stats.total ? (stats.leads / stats.total) * 100 : 0,
                    lead_to_qualified: stats.leads ? (stats.qualified / stats.leads) * 100 : 0,
                    qualified_to_activated: stats.qualified ? (stats.activated / stats.qualified) * 100 : 0,
                    overall_conversion: stats.total ? (stats.activated / stats.total) * 100 : 0
                }
            },
            question_telemetry_last_7d: {
                q1_view: tStats['Gate_Q1_Viewed'] || 0,
                q1_answer: tStats['Gate_Q1_Answered'] || 0,
                q2_view: tStats['Gate_Q2_Viewed'] || 0,
                q2_answer: tStats['Gate_Q2_Answered'] || 0,
                q3_view: tStats['Gate_Q3_Viewed'] || 0,
                q3_answer: tStats['Gate_Q3_Answered'] || 0,
            },
            payment_telemetry_last_7d: {
                checkout_init: tStats['gate_checkout_init'] || 0,
                method_selected: tStats['payment_method_selected'] || 0,
                number_copied: tStats['payment_number_copied'] || 0,
                support_clicked: tStats['whatsapp_support_clicked'] || 0
            },
            // NEW: Diagnosis Funnel
            diagnosis_funnel_last_7d: {
                view: tStats['diagnosis_view'] || 0,
                step1: diagSteps[1],
                step2: diagSteps[2],
                step3: diagSteps[3],
                step4: diagSteps[4],
                step5: diagSteps[5],
                result_view: tStats['diagnosis_result_view'] || 0
            },
            // NEW: Engagement Loop
            engagement_telemetry_last_7d: {
                mizan_view: tStats['mizan_view'] || 0,
                wird_view: tStats['wird_view'] || 0,
                ritual_complete: tStats['wird_ritual_complete'] || 0,
                offer_view: tStats['conversion_offer_view'] || 0,
                offer_click: tStats['conversion_offer_clicked'] || 0
            },
            sources: stats.sourceBreakdown,
            timestamp: new Date().toISOString()
        });

    } catch(err) {
        console.error("[Gate-Dropout API] Error:", err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
