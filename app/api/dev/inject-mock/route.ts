import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../_lib/supabaseAdmin';

function toErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error || 'unknown_error');
}

export async function POST(req: Request) {
    // SECURITY: Only allow this route in development mode
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

        // Generate 5 maps spread over the last 15 days to bypass the temporal gap filter
        const mockMaps = [];
        const baseDate = new Date();
        baseDate.setDate(baseDate.getDate() - 15); // Start 15 days ago

        for (let i = 0; i < 5; i++) {
            const mapDate = new Date(baseDate);
            mapDate.setDate(mapDate.getDate() + (i * 3)); // Space them by 3 days

            // The Burnout Curve (Calibration Logic):
            // "Work" (Danger) mass increases exponentially: 20 -> 40 -> 60 -> 80 -> 100
            // "Self-Care" (Neutral) mass drops: 80 -> 60 -> 40 -> 20 -> 10

            mockMaps.push({
                user_id: userId,
                title: `تسجيل معايرة - يوم ${15 - (i * 3)}`,
                created_at: mapDate.toISOString(),
                insight_message: `هذا تسجيل وهمي لاختبار محرك التنبؤ للذكاء الاصطناعي - المرحلة ${i + 1}`,
                shared_with_coach: true,
                nodes: [
                    { id: 'core', label: 'أنا', color: 'core', size: 'medium', mass: 50 },
                    { id: 'work', label: 'الضغط الوظيفي', color: 'danger', size: i >= 3 ? 'large' : 'medium', mass: 20 + (i * 20) },
                    { id: 'care', label: 'العناية بالذات', color: 'neutral', size: i >= 3 ? 'small' : 'medium', mass: Math.max(10, 80 - (i * 15)) }
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
            message: 'تم حقن 5 خرائط تاريخية بمسار "احتراق طاقي" بنجاح. المحرك التنبؤي جاهز للاختبار.'
        });

    } catch (err: unknown) {
        console.error('Mock injection error:', err);
        return NextResponse.json({ error: toErrorMessage(err) }, { status: 500 });
    }
}
