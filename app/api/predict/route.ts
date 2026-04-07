import { NextResponse } from 'next/server';
import { AIOrchestrator } from '../../../src/services/aiOrchestrator';
import { getSupabaseAdminClient } from '../_lib/supabaseAdmin';
import { getGeminiClient } from '@/lib/gemini/shared';

export async function POST(req: Request) {
    try {
        const supabaseAdmin = getSupabaseAdminClient();
        if (!supabaseAdmin) {
            return NextResponse.json(
                { error: 'Prediction source unavailable', source: 'not_configured', is_live: false },
                { status: 503 }
            );
        }

        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        const genAI = getGeminiClient();
        if (!genAI) {
            return NextResponse.json(
                { error: 'AI prediction unavailable', source: 'not_configured', is_live: false },
                { status: 503 }
            );
        }

        // 1. Fetch Historical Maps
        // We fetch the last 10, but we will filter them in memory to ensure temporal gaps
        const { data: maps, error } = await supabaseAdmin
            .from('dawayir_maps')
            .select('id, created_at, nodes, edges')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error || !maps || maps.length < 2) {
            return NextResponse.json({
                error: 'Not enough historical data to generate a prediction. At least 2 maps are required.',
                needsMoreData: true,
                source: 'supabase',
                is_live: true
            }, { status: 200 });
        }

        // 2. Filter for Temporal Gaps (The System Architect's specific requirement)
        // Ensure at least 24 hours between maps considered for the trend to avoid noise.
        const validTrendMaps = [];
        let lastDateAdded = new Date();

        for (const map of maps) {
            const mapDate = new Date(map.created_at);
            if (validTrendMaps.length === 0) {
                validTrendMaps.push(map);
                lastDateAdded = mapDate;
            } else {
                const diffTime = Math.abs(lastDateAdded.getTime() - mapDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // Only include if it's at least 1 day older than the previously added map
                // In a real prod environment, this might be 3-7 days based on UX goals.
                if (diffDays >= 1) {
                    validTrendMaps.push(map);
                    lastDateAdded = mapDate;
                }
            }
            if (validTrendMaps.length >= 5) break; // Cap at 5 points for the trajectory
        }

        // Reverse to chronological order (oldest to newest) for the AI
        validTrendMaps.reverse();

        if (validTrendMaps.length < 2) {
            return NextResponse.json({
                error: 'Maps are too close together in time. Keep mapping your energy every few days to build a trend.',
                needsMoreData: true,
                source: 'supabase',
                is_live: true
            }, { status: 200 });
        }

        // 3. Prepare AI Prompt
        const baseSystemPrompt = `
أنت "الأوراكل السيادي" (Sovereign Oracle)، محرك تنبؤي فائق لتحليل المسار الزمني للبشر بناءً على هيكلية "دواير" الطاقية.
مهمتك هي تحليل تتابع خرائط الوعي التي رسمها المستخدم للكشف عن المسارات (Trajectories): هل يتجه المستخدم نحو الانهيار (Burnout) أم التعافي والسيادة؟

قواعد التحليل المستند للفيزياء النفسية:
1. 'mass': كتلة الدائرة. إذا كانت دائرة "danger" (الحمراء) تتضخم بمرور الوقت، فإن الفوضى (Entropy) في ارتفاع.
2. 'color':
   - 'core': النواة/الذات. انكماشها يعني فقدان الهوية.
   - 'danger': عوامل الاستنزاف النشطة.
   - 'ignored': المناطق المظلمة المهملة.
   - 'neutral': نقاط الشحن والاستقرار.
3. السياق الزمني: ميز بين "يوم سيء عابر" وبين "اتجاه نزولي مستمر".

البيانات المقدمة: مصفوفة من الخرائط، مرتبة من الأقدم إلى الأحدث.

اللغة: استخدم لغة تقنية حازمة، مزيج بين العربية الفصحى التكتيكية والعامية المصرية (Sovereign/Command Center Tone).

يجب أن يكون الرد JSON فقط بهذا الهيكل:
{
  "burnout_probability": <رقم من 0 لـ 100 يمثل خطر الانهيار الوشيك>,
  "trajectory_summary": "<تحليل عميق وتكتيكي للمسار الزمني في جملتين>",
  "preventative_action": "<نصيحة تكتيكية واحدة محددة لقطع خط الاستنزاف المتصاعد>"
}
`;

        const modelId = await AIOrchestrator.getRouteForFeature('predictive_oracle');
        const model = genAI.getGenerativeModel({ model: modelId, generationConfig: { responseMimeType: "application/json" } });

        const prompt = `${baseSystemPrompt}\n\nHistorical Map Data (Oldest to Newest):\n${JSON.stringify(validTrendMaps, null, 2)}`;

        // 4. Execute AI Prediction
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        const prediction = JSON.parse(responseText);

        return NextResponse.json({ ...prediction, source: 'gemini', is_live: true });

    } catch (err: unknown) {
        console.error('Error generating prediction:', err);
        return NextResponse.json(
            { error: 'Prediction generation failed', source: 'generation_failed', is_live: false },
            { status: 502 }
        );
    }
}
