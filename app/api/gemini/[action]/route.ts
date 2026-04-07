import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../_lib/supabaseAdmin';

function toErrorMessage(error: unknown): string {
    console.error(error);
    return 'An internal server error occurred.';
}

export async function POST(req: Request) {
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'This route is strictly for local calibration.' }, { status: 403 });
    }

    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Supabase admin is not configured.' }, { status: 503 });
    }

    try {
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId for mock injection' }, { status: 400 });
        }

        const mockMaps = [];
        const baseDate = new Date();
        baseDate.setDate(baseDate.getDate() - 15);

        for (let i = 0; i < 5; i++) {
            const mapDate = new Date(baseDate);
            mapDate.setDate(mapDate.getDate() + (i * 3));

            mockMaps.push({
                user_id: userId,
                title: `Calibration log - day ${15 - (i * 3)}`,
                created_at: mapDate.toISOString(),
                insight_message: `This calibration signal tests the alert threshold - phase ${i + 1}`,
                shared_with_coach: true,
                nodes: [
                    { id: 'core', label: 'Self', color: 'core', size: 'medium', mass: 50 },
                    { id: 'work', label: 'Work pressure', color: 'danger', size: i >= 3 ? 'large' : 'medium', mass: 20 + (i * 20) },
                    { id: 'care', label: 'Self-care', color: 'neutral', size: i >= 3 ? 'small' : 'medium', mass: Math.max(10, 80 - (i * 15)) }
                ],
                edges: [
                    { source: 'work', target: 'core', type: 'draining', animated: true },
                    { source: 'care', target: 'core', type: 'stable', animated: false }
                ]
            });
        }

        const { error } = await supabaseAdmin.from('dawayir_maps').insert(mockMaps);
        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: 'Inserted 5 historical calibration maps successfully. The alerting engine is ready for local testing.'
        });
    } catch (err: unknown) {
        console.error('Mock injection error:', err);
        return NextResponse.json({ error: toErrorMessage(err) }, { status: 500 });
    }
}
