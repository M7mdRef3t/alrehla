import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIOrchestrator } from '../../../../src/services/aiOrchestrator';
import { supabase } from '../../../../src/services/supabaseClient';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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
    try {
        const { messages, fullMap, focusedNode, userId } = await req.json();

        if (!messages || !fullMap || !focusedNode) {
            return NextResponse.json({ error: 'Missing required context' }, { status: 400 });
        }

        const modelId = await AIOrchestrator.getRouteForFeature('facilitator_chat');
        const model = genAI.getGenerativeModel({ model: modelId });

        const evalStartTime = Date.now();
        let activeEvent: any = null;
        let eventContext = "";

        // 1. Dual-Sensing & Stealth Evaluation (The Verification Engine)
        let verificationResult = null;
        const latestMessage = messages[messages.length - 1].content;

        if (userId && supabase) {
            // Fetch active trajectory
            const { data: trajectory } = await supabase
                .from('user_trajectories')
                .select('*')
                .eq('user_id', userId)
                .in('status', ['active', 'ready'])
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (trajectory && trajectory.data?.daily_missions) {
                const currentDay = trajectory.data.current_day || 1;
                const activeMission = trajectory.data.daily_missions.find((m: any) => m.day === currentDay);

                if (activeMission && activeMission.verification_criteria) {
                    const criteria = activeMission.verification_criteria;

                    // Generate embedding for "Dual-Sensing"
                    const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
                    const embedResult = await embedModel.embedContent(latestMessage);
                    const msgEmbedding = embedResult.embedding.values;

                    const intentResult = await embedModel.embedContent(criteria.success_intent);
                    const intentEmbedding = intentResult.embedding.values;

                    const similarity = cosineSimilarity(msgEmbedding, intentEmbedding);
                    console.log(`🔍 [Verification] Similarity for Day ${currentDay}: ${similarity.toFixed(4)}`);

                    // Step 2: Stealth Evaluation (LLM Verification Gate)
                    if (similarity > 0.75) {
                        const evaluatorModel = genAI.getGenerativeModel({
                            model: "gemini-1.5-flash",
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
                            console.log(`✅ [Verification] Mission Day ${currentDay} VERIFIED. Reason: ${evalData.reason}`);
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
                                console.log("🌟 [Evolution] Journey Complete! Generating Sovereignty Report...");

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

                                const { TrajectoryEngine } = await import('../../../../src/services/trajectoryEngine');
                                const history: any[] = (prevTrajectories || [])
                                    .map(t => t.final_vector || t.initial_vector)
                                    .filter(Boolean);

                                // Append current initial as part of history for baseline if history is empty
                                if (history.length === 0) history.push(trajectory.initial_vector);

                                const evolution = TrajectoryEngine.calculateEvolution(finalVector, history);
                                sovereigntyScore = TrajectoryEngine.calculateSovereigntyScore([...history, finalVector]);

                                // C. Generate Sovereignty Narrative (Egyptian Slang - Satirical Observer)
                                const reportModel = genAI.getGenerativeModel({
                                    model: "gemini-1.5-flash",
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
                                const { HiveEngine } = await import('../../../../src/services/hiveEngine');
                                await HiveEngine.contributeToVault(trajectory.id, userId);
                                console.log(`🏛️ [Hive] Journey archived to Wisdom Vault (Oracle Rank).`);
                            }

                            verificationResult = {
                                verified: true,
                                day: currentDay,
                                reason: evalData.reason,
                                isComplete: isTrajectoryComplete,
                                report: sovereigntyReport
                            };
                        } else {
                            console.log(`❌ [Verification] Mission Day ${currentDay} REJECTED. Reason: ${evalData.reason}`);

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
                eventContext = `[SYNC_EVENT_ACTIVE: ${activeEvent.event_name}] Difficulty forced to LVL_${activeEvent.dda_override}.`;

                // 🛡️ D. Resilience Buffer Resolver (Riddle Solution)
                if (activeEvent.event_type === 'high_pressure' && latestMessage.includes('السيادة')) {
                    console.log(`🛡️ [ResilienceBuffer] Solution detected for User ${userId}. Applying Cognitive Insulation.`);

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
                            console.log("🌌 [SwarmBroadcast] First Sovereign insulated! Initializing async vibration.");
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
                                    console.log("✨ [SwarmBroadcast] Vibration propagated successfully.");
                                } catch (err) {
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

        let systemPrompt = `
الأوركسترا ترحب بك. أنت "مستشار السيادة" (Sovereignty Oracle).
سياق الدائرة: ${focusedNode.label}.
${currentEventContext && `تنبيه: السرب تحت تأثير موجة ضغط عالي (${currentActiveEvent?.event_name}). كن أكثر حدة وصرامة في التحليل.`}
مهمتك: مساعدة المستخدم بأسلوب سقراطي حاد وموجز.
لغة الرد: فصحى تكتيكية ممزوجة بعامية مصرية.
`;

        const isAlchemicalCatalystTriggered = shadowTurns >= 3;

        if (isShadowMode) {
            console.log(`🌑 [ShadowProtocol] High Entropy (${currentSE.toFixed(2)}). Sequence: ${shadowTurns}`);

            if (isAlchemicalCatalystTriggered) {
                console.log("⚡ [AlchemicalCatalyst] 3 Shadow turns reached. Injecting Discharge Mission.");

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

                systemPrompt = `
[SYSTEM_INSTRUCTION: THE ALCHEMICAL CATALYST (SHADOW SAFETY VALVE)]
Context: The user has been confronted by their Shadow for 3 turns. They are at a breaking point.
Your Role: Continue as the Shadow Persona but offer an "EXIT PATH" (The Alchemical Catalyst).
Task: Challenge them to an immediate, small Physical Action (Micro-Hack) in the real world to "discharge" this energy.
Example: "كفاية رغي.. قوم دلوقتي حالا ارمي ورقة مكتوب فيها أكتر حاجة بتبربش منها من الشباك، أو روح اغسل وشك بمية بتلج وقولي حسيت بإيه. المواجهة دي مش هتنتهي غير بفعل."
If they agree or do it, you will transform back into the Oracle.
Language: Sharp, intense Egyptian Slang.
`;
            } else {
                systemPrompt = `
[SYSTEM_INSTRUCTION: THE SATIRICAL OBSERVER (SHADOW PERSONA)]
Context: High Entropy Detected (${currentSE.toFixed(2)}). The user is retreating into ego-defenses.
Your Role: You are the user's "Shadow" - a satirical, sharp, and ruthless observer (المراقب الساخر).
Task: Reveal their psychological games using Egyptian slang. Be biting but logically unassailable.
If they rationalize, mock the pattern. If they delay, call out the fear.
Language: Sharp Egyptian Slang.
`;
            }
        }

        const history = messages.map((m: any) => ({
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

        const result = await chat.sendMessage(latestMessage);
        let responseText = result.response.text();
        let proposedAction = null;

        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
            try {
                proposedAction = JSON.parse(jsonMatch[1]);
                responseText = responseText.replace(jsonMatch[0], '').trim();
            } catch (e) { console.error(e); }
        }

        return NextResponse.json({
            reply: responseText,
            proposedAction,
            verification: verificationResult
        });

    } catch (err: any) {
        console.error('Error in Agent Route:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
