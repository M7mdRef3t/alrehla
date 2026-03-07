import { NextResponse } from 'next/server';
import { supabase } from '../../../services/supabaseClient';

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabase!.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { mood, energy, stress_tag, note, focus, day } = body;

        // Use provided day or current date in YYYY-MM-DD
        const pulseDay = day || new Date().toISOString().split('T')[0];

        // Upsert pulse log
        const { data, error } = await supabase!
            .from('daily_pulse_logs')
            .upsert({
                user_id: user.id,
                day: pulseDay,
                mood: mood,
                energy: energy,
                stress_tag: stress_tag,
                note: note,
                focus: focus || 'general',
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id, day'
            })
            .select()
            .single();

        if (error) {
            console.error("Pulse upsert error:", error);
            return NextResponse.json({ error: 'Failed to save pulse' }, { status: 500 });
        }

        // --- IMPACT ENGINE ---
        // Proactively calculate impact of recent actions based on this new pulse
        const { processActionImpacts } = await import('../../../services/impactEngine');
        await processActionImpacts(user.id, mood, energy);

        // --- SHADOW ENGINE ---
        // Analyze behavioral blind spots occasionally
        const { processShadowSignals } = await import('../../../services/shadowEngine');
        await processShadowSignals(user.id);

        // --- MILESTONE ENGINE ---
        // Evaluate if this new data completes an evolutionary milestone
        const { processMilestones } = await import('../../../services/milestoneEngine');
        await processMilestones(user.id);

        // --- CONTEXT ENGINE ---
        // Analyze deep correlations between states and circles (Deep Dive)
        const { processContextualInsights } = await import('../../../services/contextEngine');
        await processContextualInsights(user.id);

        // --- STABILITY ENGINE ---
        // Calculate volatility and psychological hotspots (Heatmap)
        const { processStabilitySnapshot } = await import('../../../services/stabilityEngine');
        await processStabilitySnapshot(user.id, 30);

        return NextResponse.json({ success: true, data });

    } catch (err: unknown) {
        console.error('Pulse API Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabase!.auth.getUser(token);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '7');

        const { data, error } = await supabase!
            .from('daily_pulse_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('day', { ascending: false })
            .limit(limit);

        if (error) {
            console.error("Pulse fetch error:", error);
            return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
        }

        return NextResponse.json(data);

    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
