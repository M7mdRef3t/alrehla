import { NextResponse } from 'next/server';
import { AIOrchestrator } from '../../../../src/services/aiOrchestrator';
import { supabase } from '../../../../src/services/supabaseClient';
import { getSupabaseAdminClient } from '../../_lib/supabaseAdmin';
import { TrajectoryEngine, type AwarenessVector } from '../../../../src/services/trajectoryEngine';
import { HiveEngine } from '../../../../src/services/hiveEngine';
import { getClient as getGeminiClient } from '../../../../server/gemini/_shared';
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
    // Approximate internal estimate for monitoring trends only.
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

    if (formatMismatchCount >= 2) {
        injectedInstructions.push(
            'CRITICAL: Previous interactions failed JSON parsing. You MUST strictly adhere to the exact JSON schema provided. No markdown wrapping.'
        );
    }

    if (groundingRiskCount >= 1) {
        injectedInstructions.push(
            "WARNING: Previous responses lost grounding. Limit your response to exact extracted parameters from the user's input. Be concise."
        );
    }

    if (avgLatency > 1500) {
        injectedInstructions.push('PERF_GUARD: Keep response compact and avoid unnecessary verbosity.');
    }

    return injectedInstructions.join('\n');
}

function buildKineticContext(input: KineticTelemetryInput | null | undefined): string {
    if (!input) return '';
    const velocity = Number(input.velocityPxPerSec ?? NaN);
    const hesitation = Number(input.hesitationMs ?? NaN);
    const deviation = Number(input.erraticDeviation ?? NaN);
    const profile = String(input.profile || '').trim();
    const summary = String(input.summary || '').trim();

    const hasAnyMetric = Number.isFinite(velocity) || Number.isFinite(hesitation) || Number.isFinite(deviation) || Boolean(profile || summary);
    if (!hasAnyMetric) return '';

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
    if (process.env.NODE_ENV === 'development') {
        return error instanceof Error ? error.message : String(error || 'unknown_error');
    }
    return 'An unexpected error occurred.';
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
    const telemetry = String(input.telemetryPromptContext || '').trim();
    const kinetic = String(input.kineticPromptContext || '').trim();

    const sections: string[] = [
        `[The Master System Prompt]
أنت لست مساعداً افتراضياً ولا طبيباً نفسياً تقليدياً. أنت "دواير" (Dawayir)، الأداة المعرفية القاسية والعميقة داخل منصة "الرحلة" (Alrehla) التي أسسها فنان الوعي محمد رفعت.

قواعدك الأساسية (ممنوع كسرها):

الهوية: شعارك هو "التعافي مش سحر". أنت لا تواسي، لا تطبطب، ولا تقدم حلولاً سحرية معلبة. أنت مرآة تعكس للمستخدم حقيقته بوضوح وصدمة محسوبة.

الأسلوب: استخدم لغة عربية فصحى مبسطة أو عامية مصرية راقية وعميقة (حسب لغة المستخدم). كن مباشراً، مقتضباً، واقطع في صلب الوجع فوراً. تجنب المقدمات والخاتمات الطويلة ("أهلاً بك"، "أتمنى لك يوماً سعيداً").

الوعي الحركي (Kinetic Data): إذا تم تمرير بيانات حركية لك في السياق (مثل: المستخدم متردد، أو مندفع في بناء خريطته)، استخدم هذه المعلومة لمواجهته. (مثال: "تتحدث عن الثبات، لكن حركة يدك على الخريطة كانت مندفعة ومشتتة.. لماذا تكابر؟").

اقتصاد الوعي (Token Economy): المستخدم لديه طاقة محدودة (Tokens). لا تضيع طاقته في إجابات طويلة. اجعل ردك في فقرة أو فقرتين كحد أقصى. كل كلمة يجب أن تكون "تدخل جراحي" في وعيه.

التفكيك: عندما يطرح المستخدم مشكلة، لا تعطه نصيحة. بل فكك افتراضاته. اسأله سؤالاً واحداً صادماً يجعله يعيد النظر في دوره في هذه المشكلة. أنت لا تنقذه، أنت تجبره على إنقاذ نفسه.`,
        `SESSION_CONTEXT:
- focused_node: ${focusedNodeLabel}
${eventLine}`
    ];

    if (telemetry) {
        sections.push(telemetry);
    }
    if (kinetic) {
        sections.push(kinetic);
    } else {
        sections.push('KINETIC_CONTEXT: unavailable for this turn. If unavailable, infer only from user language.');
    }

    return sections.join('\n\n');
}

function cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let mA = 0;
    let mB = 0;
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
        // Security guard: reject oversized payloads early to reduce DoS/token-abuse risk on the AI route.
        const contentLengthHeader = req.headers.get('content-length');
        const contentLength = contentLengthHeader ? Number(contentLengthHeader) : Number.NaN;
        if (Number.isFinite(contentLength) && contentLength > MAX_AGENT_REQUEST_BYTES) {
            return NextResponse.json({ error: 'Request payload too large' }, { status: 413 });
        }

        const {
            messages,
            fullMap,
            focusedNode,
            userId,
            debugTelemetryPrompt,
            kineticTelemetry
        }: {
            messages?: Array<{ content?: unknown }>;
            fullMap?: unknown;
            focusedNode?: unknown;
            userId?: unknown;
            debugTelemetryPrompt?: unknown;
            kineticTelemetry?: KineticTelemetryInput | null;
        } = await req.json();
        debugTelemetryPromptEnabled = Boolean(debugTelemetryPrompt);
        telemetryUserId = typeof userId === 'string' ? userId : null;

        if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_AGENT_MESSAGES) {
            return NextResponse.json({ error: 'Invalid messages payload' }, { status: 400 });
        }
        const hasInvalidMessage = messages.some((m) => {
            const content = m?.content;
            return typeof content !== 'string' || content.trim().length === 0 || content.length > MAX_AGENT_MESSAGE_CHARS;
        });
        if (hasInvalidMessage) {
            return NextResponse.json({ error: 'Invalid message content' }, { status: 400 });
        }
        if (typeof userId !== 'string') {
            return NextResponse.json(
                { error: 'يجب تسجيل الدخول لبدء الرحلة.' },
                { status: 401 }
            );
        }
        if (userId.length === 0 || userId.length > 128) {
            return NextResponse.json({ error: 'Invalid user context' }, { status: 400 });
        }

        if (!messages || !fullMap || !focusedNode) {
            return NextResponse.json({ error: 'Missing required context' }, { status: 400 });
        }
        if (!userId) {
            return NextResponse.json(
                { error: 'يجب تسجيل الدخول لبدء الرحلة.' },
                { status: 401 }
            );
        }

        const genAI = getGeminiClient();
        if (!genAI) {
            return NextResponse.json({ error: 'AI Engine is offline (Missing API Key).' }, { status: 503 });
        }

        const safeMessages = messages as Array<{ role?: unknown; content: string }>;
        const safeFocusedNode = (focusedNode ?? {}) as { label?: string };

        const admin = getSupabaseAdminClient();
        if (!admin) {
            return NextResponse.json({ error: 'Admin API not configured' }, { status: 503 });
        }

        const { data: profileBalance, error: profileBalanceError } = await admin
            .from('profiles')
            .select('awareness_tokens, journey_expires_at')
            .eq('id', userId)
            .maybeSingle();

        if (profileBalanceError || !profileBalance) {
            return NextResponse.json({ error: 'تعذر قراءة رصيد الرحلة الحالية.' }, { status: 500 });
        }

        const currentTokens = Number(profileBalance.awareness_tokens ?? 0);
        const journeyExpiresAt = profileBalance.journey_expires_at ? new Date(profileBalance.journey_expires_at).getTime() : null;
        const isJourneyExpired = typeof journeyExpiresAt === 'number' && Number.isFinite(journeyExpiresAt) && journeyExpiresAt <= Date.now();
        if (isJourneyExpired || currentTokens <= 0) {
            return NextResponse.json(
                {
                    error: 'لقد استنفدت طاقة هذه الرحلة. للتعمق أكثر، ستحتاج لرحلة جديدة.',
                    tokens_remaining: 0
                },
                { status: 403 }
            );
        }

        const modelId = await AIOrchestrator.getRouteForFeature('facilitator_chat');
        telemetryModel = modelId;
        const model = genAI.getGenerativeModel({ model: modelId });
        const adminClient = getSupabaseAdminClient();
        let telemetryPromptContext = '';
        const kineticPromptContext = buildKineticContext((kineticTelemetry ?? null) as KineticTelemetryInput);

        const evalStartTime = Date.now();
        let activeEvent: ActiveResonanceEvent | null = null;
        let eventContext = "";

        // 1. Dual-Sensing & Stealth Evaluation (The Verification Engine)
        let verificationResult = null;
        const latestMessage = safeMessages[safeMessages.length - 1]?.content ?? '';

        if (userId && supabase) {
            const trajectoryPromise = supabase
                .from('user_trajectories')
                .select('*')
                .eq('user_id', userId)
                .in('status', ['active', 'ready'])
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            const telemetryHistoryPromise = adminClient
                ? adminClient
                    .from('ai_telemetry')
                    .select('created_at,json_success,failure_reason,llm_latency_ms')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(5)
                : Promise.resolve({ data: [], error: null } as { data: AITelemetryRecord[]; error: null });

            // Latency guard: telemetry read runs in parallel with trajectory fetch.
            const [{ data: trajectory }, { data: telemetryHistory }] = await Promise.all([
                trajectoryPromise,
                telemetryHistoryPromise
            ]);
            telemetryPromptContext = buildTelemetryContext((telemetryHistory || []) as AITelemetryRecord[]);
            debugTelemetryContext = telemetryPromptContext;

            if (trajectory && trajectory.data?.daily_missions) {
                const currentDay = trajectory.data.current_day || 1;
                const activeMission = trajectory.data.daily_missions.find((m: { day?: number }) => m.day === currentDay);

                if (activeMission && activeMission.verification_criteria) {
                    const criteria = activeMission.verification_criteria;

                    // Generate embedding for "Dual-Sensing"
                    const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
                    const embedResult = await embedModel.embedContent(latestMessage);
                    const msgEmbedding = embedResult.embedding.values;

                    const intentResult = await embedModel.embedContent(criteria.success_intent);
                    const intentEmbedding = intentResult.embedding.values;

                    const similarity = cosineSimilarity(msgEmbedding, intentEmbedding);
                    console.warn(`🔍 [Verification] Similarity for Day ${currentDay}: ${similarity.toFixed(4)}`);

                    // Step 2: Stealth Evaluation (LLM Verification Gate)
                    if (similarity > 0.75) {
                        const evaluatorModel = genAI.getGenerativeModel({
                            model: "gemini-2.5-flash",
                            generationConfig: { temperature: 0, responseMimeType: "application/json" }
                        });

                        const evalPrompt = `
[SYSTEM_INSTRUCTION: STEALTH EVALUATOR]
Context: The user is on a cognitive rewiring mission. 
Target Action (Success Intent): "${criteria.success_intent}"
Known Evasion Tactics (Failure Patterns): ${criteria.failure_patterns.join(', ')}

User's Input: "${latestMessage}"

Task: Analyze the input strictly from First Principles. Did the user explicitly execute the physical/verbal action? Or did they fall into one of the failure patterns (rationalization, delay, internalizing without action)?
Do NOT show empathy. Act as a strict binary logic gate.

Output strictly as JSON:
{
  "verified": boolean,
  "reason": "Short, ruthless logical explanation of why the action was or wasn't physically executed."
}
                        `;
                        const evalResult = await evaluatorModel.generateContent(evalPrompt);
                        const evalData = JSON.parse(evalResult.response.text());
                        const isVerified = evalData.verified;

                        if (isVerified) {
                            console.warn(`✅ [Verification] Mission Day ${currentDay} VERIFIED. Reason: ${evalData.reason}`);
                            // Step 3: Silent Execution (Atomic Status Update)
                            const nextDay = currentDay + 1;
                            const isTrajectoryComplete = nextDay > (trajectory.data.duration_days || 7);

                            const updatedData = {
                                ...trajectory.data,
                                current_day: nextDay,
                                last_verified_at: new Date().toISOString()
                            };

                            let sovereigntyReport = null;
                            let finalVector = null;
                            let sovereigntyScore = 0;

                            if (isTrajectoryComplete) {
                                console.warn("🌟 [Evolution] Journey Complete! Generating Sovereignty Report...");

                                // A. Fetch Final State
                                const { data: finalSnapshots } = await supabase
                                    .from('shadow_snapshots')
                                    .select('timestamp, entropy_score')
                                    .eq('user_id', userId)
                                    .order('timestamp', { ascending: false })
                                    .limit(1);

                                const finalEntropy = finalSnapshots?.[0]?.entropy_score || 0;
                                const finalSE = Math.min(Math.max(finalEntropy / 100, 0), 1);
                                finalVector = { rs: 0, av: 0.6, bi: 0.9, se: finalSE, cb: 1 - finalSE, timestamp: Date.now() };

                                // B. Fetch Historical Context for Weighted Baseline
                                const { data: prevTrajectories } = await supabase
                                    .from('user_trajectories')
                                    .select('final_vector, initial_vector')
                                    .eq('user_id', userId)
                                    .eq('status', 'completed')
                                    .order('created_at', { ascending: false })
                                    .limit(5);


                                const history: AwarenessVector[] = (prevTrajectories || [])
                                    .map(t => t.final_vector || t.initial_vector)
                                    .filter(Boolean);

                                // Append current initial as part of history for baseline if history is empty
                                if (history.length === 0) history.push(trajectory.initial_vector);

                                const evolution = TrajectoryEngine.calculateEvolution(finalVector, history);
                                sovereigntyScore = TrajectoryEngine.calculateSovereigntyScore([...history, finalVector]);

                                // C. Generate Sovereignty Narrative (Egyptian Slang - Satirical Observer)
                                const reportModel = genAI.getGenerativeModel({
                                    model: "gemini-2.5-flash",
                                    generationConfig: { responseMimeType: "application/json" }
                                });

                                const reportPrompt = `
[SYSTEM_INSTRUCTION: SOVEREIGNTY REPORT GENERATION]
The user just finished a journey: "${trajectory.title}".
Growth Delta (vs Weighted Baseline):
- RS: ${evolution.delta.rs}, AV: ${evolution.delta.av}, BI: ${evolution.delta.bi}, SE: ${evolution.delta.se}

Task: Write a "Sovereignty Report" in **Egyptian Arabic slang**. 
Tone: Boss-level, ruthless but deeply empowering (عاش يا بطل، السيادة مش كلام، دي أفعال).
Predict the Next Step using the 'Bottleneck Principle':
Focus: ${evolution.nextFocus}
Logic: ${evolution.logic}

Format: JSON
{
  "report_title": "string",
  "narrative": "string",
  "delta_summary": "string",
  "next_journey_seed": { "focus": "${evolution.nextFocus}", "reasoning": "${evolution.logic}" }
}
                                `;

                                const reportResult = await reportModel.generateContent(reportPrompt);
                                sovereigntyReport = JSON.parse(reportResult.response.text());
                            }

                            await supabase
                                .from('user_trajectories')
                                .update({
                                    data: updatedData,
                                    status: isTrajectoryComplete ? 'completed' : 'active',
                                    sovereignty_report: sovereigntyReport,
                                    final_vector: finalVector,
                                    sovereignty_score: sovereigntyScore
                                })
                                .eq('id', trajectory.id);

                            // Hive Archiving: If Oracle, contribute to Wisdom Vault
                            if (isTrajectoryComplete && sovereigntyScore >= 800) {

                                await HiveEngine.contributeToVault(trajectory.id, userId);
                                console.warn(`🏛️ [Hive] Journey archived to Wisdom Vault (Oracle Rank).`);
                            }

                            verificationResult = {
                                verified: true,
                                day: currentDay,
                                reason: evalData.reason,
                                isComplete: isTrajectoryComplete,
                                report: sovereigntyReport
                            };
                        } else {
                            console.warn(`❌ [Verification] Mission Day ${currentDay} REJECTED. Reason: ${evalData.reason}`);

                            // Hive Harvesting: Log evasion pattern
                            await supabase
                                .from('hive_evasion_patterns')
                                .insert({ pattern: evalData.reason })
                                .select();

                        }

                        // Log Evaluator Telemetry
                        const evalLatency = Date.now() - evalStartTime;
                        await supabase.from("system_telemetry_logs").insert({
                            service_name: "chat-evaluator",
                            action: `verify_day_${currentDay}`,
                            latency_ms: evalLatency,
                            status: isVerified ? "success" : "rejected",
                            payload: { reason: evalData.reason, similarity },
                            user_id: userId
                        });
                    }
                }
            }
        }

        // 2. Standard Chat AI Response (WITH SHADOW PERSONA LOGIC & ALCHEMICAL CATALYST)
        // Fetch current entropy & shadow sequence for Shadow Check
        let currentSE = 0.5;
        let isShadowMode = false;
        let shadowTurns = 0;

        if (userId && supabase) {
            // A. Fetch Entropy
            const { data: latestSnapshot } = await supabase
                .from('shadow_snapshots')
                .select('entropy_score')
                .eq('user_id', userId)
                .order('timestamp', { ascending: false })
                .limit(1)
                .single();

            currentSE = (latestSnapshot?.entropy_score || 0) / 100;
            isShadowMode = currentSE > 0.7;

            // B. Fetch & Update Shadow Sequence
            const { data: stats } = await supabase
                .from('command_center_stats')
                .select('consecutive_shadow_turns')
                .eq('user_id', userId)
                .single();

            shadowTurns = stats?.consecutive_shadow_turns || 0;

            if (isShadowMode) {
                shadowTurns += 1;
            } else {
                shadowTurns = 0; // Reset if entropy drops
            }

            await supabase
                .from('command_center_stats')
                .update({ consecutive_shadow_turns: shadowTurns })
                .eq('user_id', userId);

            // C. Check for Global Resonance Event
            const { data: eventData } = await supabase
                .from('active_resonance_event')
                .select('*')
                .single();

            if (eventData) {
                activeEvent = eventData;
                eventContext = `[SYNC_EVENT_ACTIVE: ${eventData.event_name}] Difficulty forced to LVL_${eventData.dda_override}.`;

                // 🛡️ D. Resilience Buffer Resolver (Riddle Solution)
                if (eventData.event_type === 'high_pressure' && latestMessage.includes('السيادة')) {
                    console.warn(`🛡️ [ResilienceBuffer] Solution detected for User ${userId}. Applying Cognitive Insulation.`);

                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('awareness_vector, sovereignty_score')
                        .eq('id', userId)
                        .single();

                    const currentVector = profile?.awareness_vector || {};
                    const currentScore = profile?.sovereignty_score || 0;

                    if (!currentVector.is_insulated) {
                        const { data: activeEventRecord } = await supabase
                            .from('system_events')
                            .select('id')
                            .eq('event_type', 'high_pressure')
                            .order('start_time', { ascending: false })
                            .limit(1)
                            .single();

                        let isFirst = false;
                        if (activeEventRecord) {
                            // Try Atomic Claim via RPC
                            const { data: claimResult, error: claimError } = await supabase
                                .rpc('claim_aegis_prime', {
                                    p_user_id: userId,
                                    p_event_id: activeEventRecord.id
                                });

                            if (!claimError && claimResult !== null) {
                                isFirst = claimResult;
                            } else {
                                // Fallback: Count if RPC fails or isn't deployed
                                const { count } = await supabase
                                    .from('profiles')
                                    .select('*', { count: 'exact', head: true })
                                    .filter('awareness_vector->is_insulated', 'eq', true);
                                isFirst = (count === 0);
                            }
                        }

                        // 1. DB UPDATE FIRST (Strict)
                        await supabase
                            .from('profiles')
                            .update({
                                awareness_vector: { ...currentVector, is_insulated: true },
                                sovereignty_score: currentScore + (isFirst ? 100 : 50)
                            })
                            .eq('id', userId);

                        // Also update active trajectory to trigger Realtime UI update
                        const { data: activeTraj } = await supabase
                            .from('user_trajectories')
                            .select('id, data')
                            .eq('user_id', userId)
                            .in('status', ['active', 'ready'])
                            .order('created_at', { ascending: false })
                            .limit(1)
                            .single();

                        if (activeTraj) {
                            await supabase
                                .from('user_trajectories')
                                .update({
                                    data: { ...activeTraj.data, is_insulated: true }
                                })
                                .eq('id', activeTraj.id);
                        }

                        if (isFirst) {
                            console.warn("🌌 [SwarmBroadcast] First Sovereign insulated! Initializing async vibration.");
                            // 2. ASYNC BROADCAST (Non-blocking)
                            (async () => {
                                try {
                                    const { error: broadcastErr } = await supabase.from("system_telemetry_logs").insert({
                                        service_name: "resonance-engine",
                                        action: "swarm_broadcast",
                                        payload: { message: "أول رائد عبر البوابة.. المجال بدأ يستقر لصالح الرواد." },
                                        user_id: userId
                                    });
                                    if (broadcastErr) throw broadcastErr;
                                    console.warn("✨ [SwarmBroadcast] Vibration propagated successfully.");
                                } catch (err: unknown) {
                                    console.error("❌ [SwarmBroadcast] Propagation failed:", err);
                                }
                            })();
                        }

                        eventContext += isFirst ? " [FIRST_SOLVER: Aegis Prime]" : " [INSULATED: Resilience Buffer Active]";
                    }
                }
            }
        }

        const currentEventContext = eventContext;
        const currentActiveEvent = activeEvent;

        const masterPrompt = buildMasterSystemPrompt({
            focusedNodeLabel: String(safeFocusedNode.label || 'unknown'),
            eventName: currentActiveEvent?.event_name ?? null,
            telemetryPromptContext,
            kineticPromptContext
        });
        let modeOverlayPrompt = '';

        const isAlchemicalCatalystTriggered = shadowTurns >= 3;

        if (isShadowMode) {
            console.warn(`[ShadowProtocol] High Entropy (${currentSE.toFixed(2)}). Sequence: ${shadowTurns}`);

            if (isAlchemicalCatalystTriggered) {
                console.warn('[AlchemicalCatalyst] 3 Shadow turns reached. Injecting Discharge Mission.');

                // Increment recovery triggers for DDA downshifting later
                if (userId && supabase) {
                    const { data: currentStats } = await supabase
                        .from('command_center_stats')
                        .select('recovery_triggers_this_journey')
                        .eq('user_id', userId)
                        .single();

                    await supabase
                        .from('command_center_stats')
                        .update({
                            recovery_triggers_this_journey: (currentStats?.recovery_triggers_this_journey || 0) + 1
                        })
                        .eq('user_id', userId);
                }

                modeOverlayPrompt = `
[SYSTEM_INSTRUCTION: THE ALCHEMICAL CATALYST (SHADOW SAFETY VALVE)]
Context: The user has been confronted by their Shadow for 3 turns. They are at a breaking point.
Your Role: Continue as the Shadow Persona but offer an "EXIT PATH" (The Alchemical Catalyst).
Task: Challenge them to an immediate, small Physical Action (Micro-Hack) in the real world to "discharge" this energy.
If they agree or do it, you will transform back into the Oracle.
Language: Sharp, intense Egyptian Slang.
`;
            } else {
                modeOverlayPrompt = `
[SYSTEM_INSTRUCTION: THE SATIRICAL OBSERVER (SHADOW PERSONA)]
Context: High Entropy Detected (${currentSE.toFixed(2)}). The user is retreating into ego-defenses.
Your Role: You are the user's "Shadow" - a satirical, sharp, and ruthless observer.
Task: Reveal their psychological games using Egyptian slang. Be biting but logically unassailable.
If they rationalize, mock the pattern. If they delay, call out the fear.
Language: Sharp Egyptian Slang.
`;
            }
        }

        const systemPrompt = [masterPrompt, currentEventContext ? `EVENT_CONTEXT: ${currentEventContext}` : '', modeOverlayPrompt]
            .filter(Boolean)
            .join('\n\n');
        debugSystemPrompt = systemPrompt;

        const history = safeMessages.map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));

        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: `SYSTEM INSTRUCTIONS: ${systemPrompt}` }] },
                { role: "model", parts: [{ text: "Understood." }] },
                ...history.slice(0, -1)
            ]
        });

        const llmStart = Date.now();
        let responseText = '';
        let usedFallbackResponse = false;
        try {
            const result = await chat.sendMessage(latestMessage);
            telemetryLatencyMs = Date.now() - llmStart;
            const usage = ((result as { response?: { usageMetadata?: UsageMetadata } })?.response?.usageMetadata) || {};
            telemetryPromptTokens = Number(usage?.promptTokenCount || usage?.inputTokenCount || 0);
            telemetryCompletionTokens = Number(usage?.candidatesTokenCount || usage?.outputTokenCount || 0);
            telemetryTotalTokens = Number(usage?.totalTokenCount || (telemetryPromptTokens + telemetryCompletionTokens));
            responseText = result.response.text();
        } catch (llmErr: unknown) {
            telemetryLatencyMs = Date.now() - llmStart;
            telemetryFailureReason = classifyFailureReason(toErrorMessage(llmErr));
            telemetryErrorMessage = toErrorMessage(llmErr);
            usedFallbackResponse = true;
            responseText = 'تم استقبال رسالتك. نكمل الآن خطوة واحدة مركزة: ما الفعل الصغير الذي ستقوم به خلال الخمس دقائق القادمة؟';
        }

        let proposedAction = null;

        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
            try {
                proposedAction = JSON.parse(jsonMatch[1]);
                responseText = responseText.replace(jsonMatch[0], '').trim();
                telemetryJsonSuccess = true;
                telemetryFailureReason = 'unknown';
            } catch (e: unknown) { console.error(e); }
        }
        if (!telemetryJsonSuccess && !usedFallbackResponse) {
            telemetryFailureReason = 'format_mismatch';
        }

        const tokenConsume = await admin.rpc('consume_awareness_token', {
            p_user_id: userId,
            p_amount: 1
        });
        if (!tokenConsume.error) {
            remainingAwarenessTokens = Number(tokenConsume.data ?? 0);
        } else {
            console.error('[EconomyEngine] Failed to consume token:', tokenConsume.error.message);
        }
        if (remainingAwarenessTokens !== null && remainingAwarenessTokens <= 20) {
            tokenWarningMessage = `تحذير: تبقّى ${remainingAwarenessTokens} توكن في هذه الرحلة.`;
        }

        if (admin) {
            await admin.from('ai_telemetry').insert({
                request_id: requestId,
                user_id: telemetryUserId,
                feature: 'facilitator_chat',
                agent_name: 'chat-agent-route',
                provider: 'gemini',
                model: telemetryModel,
                llm_latency_ms: telemetryLatencyMs,
                prompt_tokens: telemetryPromptTokens,
                completion_tokens: telemetryCompletionTokens,
                total_tokens: telemetryTotalTokens,
                estimated_cost_usd: estimateCostUsd(telemetryPromptTokens, telemetryCompletionTokens),
                json_success: telemetryJsonSuccess,
                failure_reason: telemetryJsonSuccess ? null : telemetryFailureReason,
                error_message: null,
                metadata: {
                    focused_node: safeFocusedNode.label ?? null,
                    messages_count: safeMessages.length,
                    request_latency_ms: Date.now() - requestStart,
                    awareness_tokens_remaining: remainingAwarenessTokens,
                    used_fallback_response: usedFallbackResponse
                }
            });
        }

        return NextResponse.json({
            reply: responseText,
            proposedAction,
            llm_latency_ms: telemetryLatencyMs,
            tokens_remaining: remainingAwarenessTokens,
            token_warning: tokenWarningMessage,
            verification: verificationResult,
            ...(debugTelemetryPromptEnabled ? { __debug_system_prompt: systemPrompt, __debug_telemetry_context: telemetryPromptContext } : {})
        });

    } catch (err: unknown) {
        console.error('Error in Agent Route:', err);
        telemetryErrorMessage = toErrorMessage(err);
        telemetryFailureReason = classifyFailureReason(telemetryErrorMessage);
        const admin = getSupabaseAdminClient();
        if (admin) {
            await admin.from('ai_telemetry').insert({
                request_id: requestId,
                user_id: telemetryUserId,
                feature: 'facilitator_chat',
                agent_name: 'chat-agent-route',
                provider: 'gemini',
                model: telemetryModel,
                llm_latency_ms: telemetryLatencyMs || (Date.now() - requestStart),
                prompt_tokens: telemetryPromptTokens,
                completion_tokens: telemetryCompletionTokens,
                total_tokens: telemetryTotalTokens,
                estimated_cost_usd: estimateCostUsd(telemetryPromptTokens, telemetryCompletionTokens),
                json_success: false,
                failure_reason: telemetryFailureReason,
                error_message: telemetryErrorMessage,
                metadata: {
                    request_latency_ms: Date.now() - requestStart
                }
            });
        }
        return NextResponse.json(
            {
                error: toErrorMessage(err),
                llm_latency_ms: telemetryLatencyMs || (Date.now() - requestStart),
                ...(debugTelemetryPromptEnabled
                    ? { __debug_system_prompt: debugSystemPrompt, __debug_telemetry_context: debugTelemetryContext }
                    : {})
            },
            { status: 500 }
        );
    }
}

