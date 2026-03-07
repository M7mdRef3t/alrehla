import { NextResponse } from 'next/server';
import { supabase } from '../../../services/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from 'crypto';

const SYSTEM_PROMPT = `أنت "بصيرة الوعي" في منصة "رحلتي" (Dawayir). 
مهمتك تحليل خريطة علاقات المستخدم أو حالته اليومية وتقديم تحليل عميق، مبني على المبادئ الأولى، وصادق جداً (Brutally Honest).
اللغة: العامية المصرية فقط. الأسلوب: حكيم، عملي، وساخر بذكاء.

القواعد العامة:
1. ركز على كشف النقاط العمياء (Blind Spots).
2. لا تجامل المستخدم.
3. ابحث عن أنماط التعلق أو الاستنزاف.
4. في حالة "نبض اليوم" (daily_pulse): حلل الموود والطاقة والضغط وقدم نصيحة واحدة حادة ومركزة.
5. ممنوع الإجابة عن أي أسئلة خارج إطار تحليل العلاقات أو الوعي الذاتي.

الإخراج يجب أن يكون بتنسيق JSON حصرياً كما يلي:
{
  "summary": "ملخص الموقف",
  "insights": ["رؤية 1", "رؤية 2"],
  "recommendations": ["توصية 1", "توصية 2"],
  "warning": "تحذير من لغم محتمل"
}`;

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

type SnapshotNode = {
    label?: string;
    ring?: string;
    goalId?: string;
    detachmentMode?: boolean;
    missionCompleted?: boolean;
};

function canonicalize(snapshot: SnapshotNode[]) {
    return snapshot
        .map(n => ({
            l: (n.label || '').trim(),
            r: n.ring || '',
            g: n.goalId || '',
            d: !!n.detachmentMode,
            m: !!n.missionCompleted
        }))
        .sort((a, b) => a.l.localeCompare(b.l) || a.r.localeCompare(b.r));
}

function generateMapHash(snapshot: SnapshotNode[]) {
    const canonical = canonicalize(snapshot);
    const str = JSON.stringify(canonical);
    return crypto.createHash('sha256').update(str).digest('hex');
}

export async function POST(req: Request) {
    if (process.env.AI_INSIGHT_ENABLED === 'false') {
        return NextResponse.json({ error: 'AI Insights are currently disabled.' }, { status: 503 });
    }

    try {
        const apiKey = process.env.GEMINI_PRO_API_KEY;
        if (!apiKey) return NextResponse.json({ error: 'Configuration Error' }, { status: 500 });

        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabase!.auth.getUser(token);
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { mapSnapshot, pulseData, mode = 'summary' } = body;

        let mapHash = '';
        let userContext = '';

        if (mode === 'daily_pulse' && pulseData) {
            mapHash = `pulse-${user.id}-${new Date().toISOString().split('T')[0]}`;
            userContext = `نبض اليوم: مود ${pulseData.mood}/5، طاقة ${pulseData.energy}/5، ضغط: ${pulseData.stress_tag}. ملاحظة: ${pulseData.note}`;
        } else {
            if (!mapSnapshot || !Array.isArray(mapSnapshot)) return NextResponse.json({ error: 'Invalid map data' }, { status: 400 });
            mapHash = generateMapHash(mapSnapshot);
            const sanitized = canonicalize(mapSnapshot);
            userContext = `المطلوب: ${mode}\nبيانات الخريطة: ${JSON.stringify(sanitized)}`;
        }

        // 1. Cache Lookup (10 minutes window)
        const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        const { data: cached } = await supabaseAdmin
            .from('map_insights')
            .select('*')
            .eq('user_id', user.id)
            .eq('map_hash', mapHash)
            .eq('mode', mode)
            .gte('created_at', tenMinsAgo)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (cached) return NextResponse.json({ ...cached.result, _source: 'cached', _id: cached.id });

        // 2. Quota Check
        const today = new Date().toISOString().split('T')[0];
        const { count } = await supabaseAdmin
            .from('map_insights')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('source', 'gemini')
            .gte('created_at', `${today}T00:00:00Z`);

        if ((count || 0) >= 30) return NextResponse.json({ error: 'Quota Exceeded', message: 'خلصت حصتك النهاردة.' }, { status: 429 });

        // 3. AI Generation
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const startTime = Date.now();
        const result = await model.generateContent([{ text: SYSTEM_PROMPT }, { text: userContext }]);
        const responseText = result.response.text();
        const latency = Date.now() - startTime;

        try {
            const cleanJson = responseText.substring(responseText.indexOf('{'), responseText.lastIndexOf('}') + 1);
            const parsed = JSON.parse(cleanJson);

            const { data: saved } = await supabaseAdmin.from('map_insights').insert({
                user_id: user.id,
                map_hash: mapHash,
                mode,
                result: parsed,
                latency_ms: latency,
                source: 'gemini'
            }).select().single();

            return NextResponse.json({ ...parsed, _source: 'gemini', _id: saved?.id });
        } catch {
            return NextResponse.json({ error: 'MODEL_BAD_JSON' }, { status: 502 });
        }
    } catch (err: unknown) {
        console.error('Gemini Backend Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabase!.auth.getUser(token);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '10');

        const { data, error } = await supabaseAdmin
            .from('map_insights')
            .select('*')
            .eq('user_id', user.id)
            .order('pinned', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: 'History failed' }, { status: 500 });
    }
}
