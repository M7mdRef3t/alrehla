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

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: events, error } = await supabase
            .from('routing_events')
            .select('event_type, session_id')
            .gte('occurred_at', thirtyDaysAgo.toISOString())
            .in('event_type', ['page_view', 'onboarding_started', 'activation_viewed', 'payment_proof_submitted', 'lead_form_submitted']);

        if (error) {
            console.error("Supabase Error:", error);
            throw error;
        }

        // Aggregate unique sessions per funnel stage
        const funnel = {
            total_sessions: new Set<string>(),
            landing_views: new Set<string>(),
            onboarding_starts: new Set<string>(),
            activation_views: new Set<string>(),
            successful_payments: new Set<string>()
        };

        (events || []).forEach(e => {
            if (!e.session_id) return;
            funnel.total_sessions.add(e.session_id);
            if (e.event_type === 'page_view') funnel.landing_views.add(e.session_id);
            if (e.event_type === 'onboarding_started') funnel.onboarding_starts.add(e.session_id);
            if (e.event_type === 'activation_viewed' || e.event_type === 'lead_form_submitted') funnel.activation_views.add(e.session_id);
            if (e.event_type === 'payment_proof_submitted') funnel.successful_payments.add(e.session_id);
        });

        // Some might go directly to /onboarding without a page_view (e.g. from Ads directly). 
        // Let's normalize it so earlier steps include people who skipped but did later steps.
        // (A true step-by-step funnel would be more complex, but a baseline funnel logic helps right now).
        funnel.successful_payments.forEach(session => {
             funnel.activation_views.add(session);
             funnel.onboarding_starts.add(session);
        });
        
        funnel.activation_views.forEach(session => {
            funnel.onboarding_starts.add(session);
        });

        funnel.onboarding_starts.forEach(session => {
            // we assume if they started onboarding, they were on the platform.
        });


        return NextResponse.json({
            landing_views: funnel.landing_views.size,
            onboarding_starts: funnel.onboarding_starts.size,
            activation_views: funnel.activation_views.size,
            successful_payments: funnel.successful_payments.size,
            total_active_sessions: funnel.total_sessions.size
        });

    } catch(err) {
        console.error("[Funnel API] Error calculating funnel:", err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
