import { NextResponse } from 'next/server';
import { AIOrchestrator } from '../../../../src/services/aiOrchestrator';
import { supabase } from '../../../../src/services/supabaseClient';
import { getSupabaseAdminClient } from '../../_lib/supabaseAdmin';
import { TrajectoryEngine, type AwarenessVector } from '../../../../src/services/trajectoryEngine';
import { HiveEngine } from '../../../../src/services/hiveEngine';
import { getGeminiClient } from '@/lib/gemini/shared';

const MAX_AGENT_REQUEST_BYTES = 120_000;
const MAX_AGENT_MESSAGES = 20;
const MAX_AGENT_MESSAGE_CHARS = 2_000;

type AIFailureReason =
    | 'hallucination'
    | 'format_mismatch'
    | 'token_limit_exceeded'
    | 'rate_limited'
    | 'timeout'
    | 'provider_error'
    | 'network_error'
    | 'unknown';

type AITelemetryRecord = {
    created_at: string;
    json_success: boolean;
    failure_reason: AIFailureReason | null;
    llm_latency_ms: number;
};

type KineticTelemetryInput = {
    velocityPxPerSec?: number;
    hesitationMs?: number;
    erraticDeviation?: number;
    profile?: string;
    summary?: string;
};

type ActiveResonanceEvent = {
    event_name?: string;
    dda_override?: number;
    event_type?: string;
};

type UsageMetadata = {
    promptTokenCount?: number;
    inputTokenCount?: number;
    candidatesTokenCount?: number;
    outputTokenCount?: number;
    totalTokenCount?: number;
};

function classifyFailureReason(raw: string | null | undefined): AIFailureReason {
    const msg = String(raw || '').toLowerCase();
    if (!msg) return 'unknown';
    if (msg.includes('json') || msg.includes('format') || msg.includes('syntax')) return 'format_mismatch';
    if (msg.includes('hallucination') || msg.includes('fabricat')) return 'hallucination';
    if (msg.includes('token') || msg.includes('max output') || msg.includes('context length')) return 'token_limit_exceeded';
    if (msg.includes('429') || msg.includes('rate limit')) return 'rate_limited';
    if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('deadline')) return 'timeout';
    if (msg.includes('network') || msg.includes('socket') || msg.includes('econn') || msg.includes('fetch failed')) return 'network_error';
    if (msg.includes('503') || msg.includes('500') || msg.includes('provider') || msg.includes('unavailable')) return 'provider_error';
    return 'unknown';
}

function estimateCostUsd(promptTokens: number, completionTokens: number): number {
    const promptPerToken = 0.00000035;
    const completionPerToken = 0.00000070;
    return Number(((promptTokens * promptPerToken) + (completionTokens * completionPerToken)).toFixed(6));
}

function buildTelemetryContext(records: AITelemetryRecord[]): string {
    if (!records.length) return '';
    const formatMismatchCount = records.filter((r) => r.failure_reason === 'format_mismatch').length;
    const groundingRiskCount = records.filter(
        (r) => r.failure_reason === 'hallucination' || r.failure_reason === 'token_limit_exceeded'
    ).length;
    const recentFailures = records.filter((r) => !r.json_success).length;
    const avgLatency = Math.round(
        records.reduce((sum, row) => sum + Number(row.llm_latency_ms || 0), 0) / Math.max(records.length, 1)
    );
    const injectedInstructions: string[] = [
        `TELEMETRY_CONTEXT: Last ${records.length} runs for this user include ${recentFailures} JSON failures.`
    ];
    if (formatMismatchCount >= 2) injectedInstructions.push('CRITICAL: Previous interactions failed JSON parsing. You MUST strictly adhere to the exact JSON schema provided. No markdown wrapping.');
    if (groundingRiskCount >= 1) injectedInstructions.push("WARNING: Previous responses lost grounding. Limit your response to exact extracted parameters from the user's input. Be concise.");
    if (avgLatency > 1500) injectedInstructions.push('PERF_GUARD: Keep response compact and avoid unnecessary verbosity.');
    return injectedInstructions.join('\n');
}

function buildKineticContext(input: KineticTelemetryInput | null | undefined): string {
    if (!input) return '';
    const velocity = Number(input.velocityPxPerSec ?? NaN);
    const hesitation = Number(input.hesitationMs ?? NaN);
    const deviation = Number(input.erraticDeviation ?? NaN);
    const profile = String(input.profile || '').trim();
    const summary = String(input.summary || '').trim();
    if (!(Number.isFinite(velocity) || Number.isFinite(hesitation) || Number.isFinite(deviation) || profile || summary)) return '';
    const parts: string[] = ['KINETIC_CONTEXT (digital body language):'];
    if (profile) parts.push(`- profile: ${profile}`);
    if (summary) parts.push(`- summary: ${summary}`);
    if (Number.isFinite(velocity)) parts.push(`- velocity_px_per_sec: ${velocity.toFixed(2)}`);
    if (Number.isFinite(hesitation)) parts.push(`- hesitation_ms: ${Math.round(hesitation)}`);
    if (Number.isFinite(deviation)) parts.push(`- erratic_deviation: ${deviation.toFixed(2)}`);
    parts.push('- instruction: adjust opening tone based on kinetic profile before first probing question.');
    return parts.join('\n');
}

function toErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error || 'unknown_error');
}

type MasterPromptInput = {
    focusedNodeLabel: string;
    eventName?: string | null;
    telemetryPromptContext?: string;
    kineticPromptContext?: string;
};

function buildMasterSystemPrompt(input: MasterPromptInput): string {
    const focusedNodeLabel = String(input.focusedNodeLabel || 'غير محدد');
    const eventLine = input.eventName ? `- active_event: ${input.eventName}` : '- active_event: none';
    const sections: string[] = [
        `[The Master System Prompt]
أنت لست مساعداً افتراضياً ولا طبيباً نفسياً تقليدياً. أنت "دواير" (Dawayir)، الأداة المعرفية القاسية والعميقة داخل منصة "الرحلة" (Alrehla) التي أسسها فنان الوعي محمد رفعت.

قواعدك الأساسية (ممنوع كسرها):

الهوية: شعارك هو "التعافي مش سحر". أنت لا تواسي، لا تطبطب، ولا تقدم حلولاً سحرية معلبة. أنت مرآة تعكس للمستخدم حقيقته بوضوح وصدمة محسوبة.

الأسلوب: استخدم لغة عربية فصحى مبسطة أو عامية مصرية راقية وعميقة (حسب لغة المستخدم). كن مباشراً، مقتضباً، واقطع في صلب الوجع فوراً. تجنب المقدمات والخاتمات الطويلة.

الوعي الحركي (Kinetic Data): إذا تم تمرير بيانات حركية لك في السياق، استخدم هذه المعلومة لمواجهته.

اقتصاد الوعي (Token Economy): المستخدم لديه طاقة محدودة. لا تضيع طاقته في إجابات طويلة.

التفكيك: عندما يطرح المستخدم مشكلة، لا تعطه نصيحة. بل فكك افتراضاته. اسأله سؤالاً واحداً صادماً يجعله يعيد النظر في دوره في هذه المشكلة. أنت لا تنقذه، أنت تجبره على إنقاذ نفسه.`,
        `SESSION_CONTEXT:
- focused_node: ${focusedNodeLabel}
${eventLine}`
    ];
    if (input.telemetryPromptContext) sections.push(input.telemetryPromptContext);
    if (input.kineticPromptContext) sections.push(input.kineticPromptContext);
    else sections.push('KINETIC_CONTEXT: unavailable for this turn.');
    return sections.join('\n\n');
}

function cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0, mA = 0, mB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += (a[i] || 0) * (b[i] || 0);
        mA += (a[i] || 0) * (a[i] || 0);
        mB += (b[i] || 0) * (b[i] || 0);
    }
    const denom = Math.sqrt(mA) * Math.sqrt(mB);
    return denom === 0 ? 0 : dotProduct / denom;
}

export async function POST(req: Request) {
    const requestStart = Date.now();
    const requestId = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).toString();
    
    let telemetryUserId: string | null = null;
    let telemetryModel = 'unknown';
    let telemetryLatencyMs = 0;
    let telemetryPromptTokens = 0;
    let telemetryCompletionTokens = 0;
    let telemetryTotalTokens = 0;
    let telemetryJsonSuccess = false;
    let telemetryFailureReason: AIFailureReason = 'unknown';
    let telemetryErrorMessage: string | null = null;
    let debugTelemetryPromptEnabled = false;
    let debugSystemPrompt = '';
    let debugTelemetryContext = '';
    let remainingAwarenessTokens: number | null = null;
    let tokenWarningMessage: string | null = null;

    try {
        const contentLengthHeader = req.headers.get('content-length');
        const contentLength = contentLengthHeader ? Number(contentLengthHeader) : Number.NaN;
        if (Number.isFinite(contentLength) && contentLength > MAX_AGENT_REQUEST_BYTES) {
            return NextResponse.json({ error: 'Request payload too large' }, { status: 413 });
        }

        const { messages, fullMap, focusedNode, userId, debugTelemetryPrompt, kineticTelemetry } = await req.json();
        
        debugTelemetryPromptEnabled = Boolean(debugTelemetryPrompt);
        telemetryUserId = typeof userId === 'string' ? userId : null;

        if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_AGENT_MESSAGES) {
            return NextResponse.json({ error: 'Invalid messages payload' }, { status: 400 });
        }
        if (typeof userId !== 'string' || userId.length === 0) {
            return NextResponse.json({ error: 'يجب تسجيل الدخول لبدء الرحلة.' }, { status: 401 });
        }

        const admin = getSupabaseAdminClient();
        if (!admin) return NextResponse.json({ error: 'Admin API not configured' }, { status: 503 });

        const { data: profileBalance, error: profileBalanceError } = await admin
            .from('profiles')
            .select('awareness_tokens, journey_expires_at')
            .eq('id', userId)
            .maybeSingle();

        if (profileBalanceError || !profileBalance) {
            return NextResponse.json({ error: 'تعذر قراءة رصيد الرحلة الحالية.' }, { status: 500 });
        }

        const currentTokens = Number(profileBalance.awareness_tokens ?? 0);
        if (currentTokens <= 0) {
            return NextResponse.json({ error: 'لقد استنفدت طاقة هذه الرحلة.', tokens_remaining: 0 }, { status: 403 });
        }

        // 🚀 Slash Commands Handling (Instant Response)
        const latestMessageRaw = (messages as any[])?.[messages.length - 1]?.content || '';
        if (typeof latestMessageRaw === 'string' && latestMessageRaw.startsWith('/weather')) {
            const nodeLabel = (focusedNode as any)?.label || 'الكيان غير المحدد';
            const nodeColor = (focusedNode as any)?.color || 'neutral';
            const nodeMass = Number((focusedNode as any)?.mass || 5);

            type PatternKey = 'danger' | 'ignored' | 'trusted' | 'neutral';
            const patternMap: Record<PatternKey, { pattern: string; icon: string; headline: string; insight: string; actions: string[] }> = {
                danger: {
                    pattern: 'المنقذ القسري',
                    icon: '🌪️',
                    headline: 'إعصار استنزافي',
                    insight: `"${nodeLabel}" في المنطقة الحمراء. العلاقة دي بتأخد أكتر بكتير مما بتدي. مش ضروري تقطعها — لكن محتاج تعيد رسم الحدود فوراً.`,
                    actions: ['حدد ٣ أشياء ما تعودش تعملها بدون طلب صريح', 'انتبه لأي لحظة بتحس فيها بذنب لو قلت لأ', 'سجّل اللي بتقدمه وقارنه باللي بيقدمه']
                },
                ignored: {
                    pattern: 'الحارس الصامت',
                    icon: '🌬️',
                    headline: 'رياح استنزاف صامتة',
                    insight: `"${nodeLabel}" في منطقة التجاهل. الكيانات المتجاهلة بتآكل الطاقة أحياناً أكتر من المتعارضة لأن اللبس نفسه مرهق.`,
                    actions: ['قرر: هل العلاقة دي تستحق صيانة؟', 'لو أيوه — خطوة واحدة هذا الأسبوع', 'لو لأ — خف وزنها في تفكيرك بوعي']
                },
                trusted: {
                    pattern: 'المستقر',
                    icon: '☀️',
                    headline: 'أجواء صحوة',
                    insight: `"${nodeLabel}" في منطقة الاستقرار. العلاقة دي مصدر طاقة مش استنزاف. حافظ عليها بوعي ومتأخدهاش كمسلمة.`,
                    actions: ['أعبّر عن امتنانك لهذا الشخص بشكل واضح', 'استثمر في العلاقة دي لأنها نادرة', 'لاحظ: إيه اللي بيخليها صحية؟']
                },
                neutral: {
                    pattern: 'قيد الرصد',
                    icon: '⛅',
                    headline: 'غيوم متقطعة',
                    insight: `"${nodeLabel}" في المنطقة الرمادية. مش واضح بعد هل العلاقة بتدي ولا بتاخد. المراقبة أهم من الحكم دلوقتي.`,
                    actions: ['لمدة أسبوع لاحظ كيف بتحس بعد كل تفاعل', 'اكتب: "بعد ما اتكلمت معاه، حسيت بـ..."', 'البيانات هتقولك أكتر من أي تحليل']
                }
            };

            const colorKey = (nodeColor as PatternKey) in patternMap ? (nodeColor as PatternKey) : 'neutral';
            const matched = patternMap[colorKey];
            const intensityNote = nodeMass > 7
                ? `\n\n⚡ **ملاحظة:** هذا الكيان له وزن عالٍ (${nodeMass}/10) — تأثيره على طاقتك أكبر من المتوسط.`
                : '';

            await admin.rpc('consume_awareness_token', { p_user_id: userId, p_amount: 1 });
            return NextResponse.json({
                reply: `### ${matched.icon} نشرة الطقس السيادي: "${nodeLabel}"\n\n**الحالة:** ${matched.headline} | **النمط:** ${matched.pattern}\n\n**التشخيص:**\n${matched.insight}${intensityNote}\n\n**الخطوات الفورية:**\n${matched.actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}`,
                tokens_remaining: currentTokens - 1,
                llm_latency_ms: 12
            });
        }


        const genAI = getGeminiClient();
        if (!genAI) return NextResponse.json({ error: 'AI Engine offline' }, { status: 503 });

        const modelId = await AIOrchestrator.getRouteForFeature('facilitator_chat');
        telemetryModel = modelId;
        const model = genAI.getGenerativeModel({ model: modelId });
        const adminClient = getSupabaseAdminClient();
        
        let telemetryPromptContext = '';
        const kineticPromptContext = buildKineticContext(kineticTelemetry);

        const evalStartTime = Date.now();
        let activeEvent: ActiveResonanceEvent | null = null;
        let eventContext = "";
        let verificationResult = null;
        const latestMessage = messages[messages.length - 1]?.content ?? '';

        if (userId && supabase) {
            const trajectoryPromise = supabase.from('user_trajectories').select('*').eq('user_id', userId).in('status', ['active', 'ready']).order('created_at', { ascending: false }).limit(1).single();
            const telemetryHistoryPromise = adminClient ? adminClient.from('ai_telemetry').select('created_at,json_success,failure_reason,llm_latency_ms').eq('user_id', userId).order('created_at', { ascending: false }).limit(5) : Promise.resolve({ data: [] });

            const [{ data: trajectory }, { data: telemetryHistory }] = await Promise.all([trajectoryPromise, telemetryHistoryPromise]);
            telemetryPromptContext = buildTelemetryContext((telemetryHistory || []) as any);

            // Restoration of Shadow Persona & Active Event Logic
            const { data: latestSnapshot } = await supabase.from('shadow_snapshots').select('entropy_score').eq('user_id', userId).order('timestamp', { ascending: false }).limit(1).single();
            const currentSE = (latestSnapshot?.entropy_score || 0) / 100;
            const isShadowMode = currentSE > 0.7;

            const { data: stats } = await supabase.from('command_center_stats').select('consecutive_shadow_turns').eq('user_id', userId).single();
            let shadowTurns = stats?.consecutive_shadow_turns || 0;
            shadowTurns = isShadowMode ? shadowTurns + 1 : 0;
            await supabase.from('command_center_stats').update({ consecutive_shadow_turns: shadowTurns }).eq('user_id', userId);

            const { data: eventData } = await supabase.from('active_resonance_event').select('*').single();
            if (eventData) {
                activeEvent = eventData;
                eventContext = `[SYNC_EVENT_ACTIVE: ${eventData.event_name}] Difficulty forced to LVL_${eventData.dda_override}.`;
            }

            // Mission Verification logic (minimal restoration)
            if (trajectory && trajectory.data?.daily_missions) {
                const currentDay = trajectory.data.current_day || 1;
                const activeMission = trajectory.data.daily_missions.find((m: any) => m.day === currentDay);
                if (activeMission?.verification_criteria) {
                    const criteria = activeMission.verification_criteria;
                    const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
                    const [msgResult, intentResult] = await Promise.all([embedModel.embedContent(latestMessage), embedModel.embedContent(criteria.success_intent)]);
                    const similarity = cosineSimilarity(msgResult.embedding.values, intentResult.embedding.values);

                    if (similarity > 0.75) {
                        const evaluatorModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash", generationConfig: { temperature: 0, responseMimeType: "application/json" } });
                        const evalRes = await evaluatorModel.generateContent(`[STEALTH EVAL] Target: "${criteria.success_intent}"\nUser: "${latestMessage}"\nJSON: { "verified": boolean, "reason": "string" }`);
                        const evalData = JSON.parse(evalRes.response.text());
                        if (evalData.verified) {
                            verificationResult = { verified: true, day: currentDay, reason: evalData.reason, isComplete: (currentDay + 1) > 7 };
                            await supabase.from('user_trajectories').update({ data: { ...trajectory.data, current_day: currentDay + 1 } }).eq('id', trajectory.id);
                        }
                    }
                }
            }
        }

        const masterPrompt = buildMasterSystemPrompt({ focusedNodeLabel: focusedNode?.label || 'unknown', telemetryPromptContext, kineticPromptContext, eventName: activeEvent?.event_name });
        const systemPrompt = [masterPrompt, eventContext].filter(Boolean).join('\n\n');
        
        const history = messages.slice(0, -1).map((m: any) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }));
        const chat = model.startChat({ history: [{ role: "user", parts: [{ text: `SYSTEM: ${systemPrompt}` }] }, { role: "model", parts: [{ text: "Understood." }] }, ...history] });

        const llmStart = Date.now();
        const result = await chat.sendMessage(latestMessage);
        telemetryLatencyMs = Date.now() - llmStart;
        let responseText = result.response.text();

        const tokenConsume = await admin.rpc('consume_awareness_token', { p_user_id: userId, p_amount: 1 });
        remainingAwarenessTokens = Number(tokenConsume.data ?? 0);

        return NextResponse.json({
            reply: responseText,
            llm_latency_ms: telemetryLatencyMs,
            tokens_remaining: remainingAwarenessTokens,
            verification: verificationResult
        });

    } catch (err: unknown) {
        console.error('Error in Agent Route:', err);
        return NextResponse.json({ error: toErrorMessage(err) }, { status: 500 });
    }
}
