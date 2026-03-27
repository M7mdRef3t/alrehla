import { NextResponse } from 'next/server';
import { supabase } from '../../../../services/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

type WeeklySummary = {
    avgMood: string;
    avgEnergy: string;
    topStress: string;
    daysLogged: number;
    insightCount: number | null;
    trajectory?: {
        status: 'up' | 'down' | 'stable';
        moodDelta: string;
        energyDelta: string;
    };
};

const WEEKLY_SYSTEM_PROMPT = `أنت "محلل الأنماط" في منصة "رحلتي" (Dawayir). 
مهمتك تحويل البيانات الرقمية الأسبوعية للمستخدم إلى "سرد تطوري" (Narrative Report) حكيم وصادق بالمصري.

يجب أن يحتوي التقرير على:
1. "النمط العام للموجة": وصف لحالته النفسية والطاقة هذا الأسبوع.
2. "رؤية الأنماط": هل فيه ضغط معين تكرر؟ هل فيه تحسن؟ 
3. "المناورة القادمة": خطوة واحدة محددة للأسبوع الجاي.
4. "كلمة حاسمة": جملة واحدة تنهي بها التقرير.

اللغة: العامية المصرية. الأسلوب: First Principles، عميق، غير مجامل، ومحفز للوعي.
الإخراج JSON فقط:
{
  "wave_pattern": "...",
  "pattern_insight": "...",
  "next_maneuver": "...",
  "final_word": "..."
}`;

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabase!.auth.getUser(token);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const now = new Date();
        const year = now.getFullYear();

        // ISO Week logic
        const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

        // Previous Week Info
        const prevWeekNo = weekNo === 1 ? 52 : weekNo - 1;
        const prevYear = weekNo === 1 ? year - 1 : year;

        // Check cache (Admin)
        const { data: existing } = await supabaseAdmin
            .from('weekly_reports')
            .select('*')
            .eq('user_id', user.id)
            .eq('year', year)
            .eq('week_number', weekNo)
            .maybeSingle();

        // Fetch previous report for trajectory calculation
        const { data: prevReport } = await supabaseAdmin
            .from('weekly_reports')
            .select('summary_data')
            .eq('user_id', user.id)
            .eq('year', prevYear)
            .eq('week_number', prevWeekNo)
            .maybeSingle();

        if (existing) {
            // Append trajectory if found even in cached result
            if (prevReport && !existing.summary_data.trajectory) {
                existing.summary_data.trajectory = calculateTrajectory(existing.summary_data, prevReport.summary_data);
            }
            return NextResponse.json(existing);
        }

        // Aggregate current week
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - (now.getDay() || 7) + 1);
        const startStr = startOfWeek.toISOString().split('T')[0];

        const { data: pulses } = await supabaseAdmin
            .from('daily_pulse_logs')
            .select('mood, energy, stress_tag')
            .eq('user_id', user.id)
            .gte('day', startStr);

        const { count: insightCount } = await supabaseAdmin
            .from('map_insights')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', startOfWeek.toISOString());

        if (!pulses || pulses.length < 3) {
            return NextResponse.json({
                error: 'INSUFFICIENT_DATA',
                message: 'محتاج تسجل نبضك على الأقل 3 أيام عشان نطلع لك تقرير المحطة.'
            }, { status: 400 });
        }

        const avgMood = pulses.reduce((acc, p) => acc + (p.mood || 0), 0) / pulses.length;
        const avgEnergy = pulses.reduce((acc, p) => acc + (p.energy || 0), 0) / pulses.length;
        const stressCounts: Record<string, number> = {};
        pulses.forEach(p => { if (p.stress_tag) stressCounts[p.stress_tag] = (stressCounts[p.stress_tag] || 0) + 1; });
        const topStress = Object.entries(stressCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'نفسي';

        const summaryData: WeeklySummary = {
            avgMood: avgMood.toFixed(1),
            avgEnergy: avgEnergy.toFixed(1),
            topStress,
            daysLogged: pulses.length,
            insightCount
        };

        if (prevReport) {
            summaryData.trajectory = calculateTrajectory(summaryData, prevReport.summary_data);
        }

        // Gemini Insight
        const apiKey = process.env.GEMINI_API_KEY;
        const genAI = new GoogleGenerativeAI(apiKey || "");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { responseMimeType: "application/json" } });

        const userContext = `بيانات الأسبوع الحالي: ${JSON.stringify(summaryData)}\n${prevReport ? `بيانات الأسبوع السابق: ${JSON.stringify(prevReport.summary_data)}` : 'لا توجد بيانات سابقة.'}`;

        const startTime = Date.now();
        const result = await model.generateContent([{ text: WEEKLY_SYSTEM_PROMPT }, { text: userContext }]);
        const parsed = JSON.parse(result.response.text());
        const latency = Date.now() - startTime;

        const { data: saved } = await supabaseAdmin.from('weekly_reports').insert({
            user_id: user.id,
            year,
            week_number: weekNo,
            start_date: startStr,
            end_date: now.toISOString().split('T')[0],
            summary_data: summaryData,
            report_result: parsed,
            latency_ms: latency
        }).select().single();

        return NextResponse.json(saved || { report_result: parsed, summary_data: summaryData });

    } catch (err: unknown) {
        console.error('Weekly Report Error:', err);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

function calculateTrajectory(curr: Pick<WeeklySummary, 'avgMood' | 'avgEnergy'>, prev: Pick<WeeklySummary, 'avgMood' | 'avgEnergy'>) {
    const moodDiff = parseFloat(curr.avgMood) - parseFloat(prev.avgMood);
    const energyDiff = parseFloat(curr.avgEnergy) - parseFloat(prev.avgEnergy);

    // Status: 'up', 'down', 'stable'
    let status: 'up' | 'down' | 'stable' = 'stable';
    if (moodDiff > 0.2 || energyDiff > 0.2) status = 'up';
    else if (moodDiff < -0.2 || energyDiff < -0.2) status = 'down';

    return {
        status,
        moodDelta: moodDiff.toFixed(1),
        energyDelta: energyDiff.toFixed(1)
    };
}
