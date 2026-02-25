import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

Deno.serve(async (req) => {
    const startTime = Date.now();
    console.log("🚀 [AwarenessWorker] Received trigger notification.");

    try {
        const payload = await req.json();
        const { record } = payload; // Supabase Webhook payload format

        if (!record || record.status !== "pending") {
            return new Response(JSON.stringify({ message: "No pending record found" }), {
                headers: { "Content-Type": "application/json" },
                status: 200,
            });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const lockDurationSeconds = 60;
        const now = new Date();
        const lockExpiresAt = new Date(now.getTime() + lockDurationSeconds * 1000).toISOString();

        // 1. SELF-HEALING DISTRIBUTED LOCK (TTL Based)
        const { data: lockData, error: lockError } = await supabase
            .from('command_center_stats')
            .update({ trajectory_lock_until: lockExpiresAt })
            .eq('user_id', record.user_id)
            .or(`trajectory_lock_until.is.null,trajectory_lock_until.lt.${now.toISOString()}`)
            .select();

        if (lockError || !lockData || lockData.length === 0) {
            console.warn(`⚠️ [AwarenessWorker] Lock held by another instance (Active TTL). Skipping user ${record.user_id}`);
            // 1.1 Concurrency Telemetry (Log rejection)
            await supabase
                .from("awareness_events_queue")
                .update({
                    status: "cancelled",
                    last_error: "Concurrency lock active (TTL Check)"
                })
                .eq("id", record.id);

            return new Response(JSON.stringify({ message: "Locked" }), {
                headers: { "Content-Type": "application/json" },
                status: 200,
            });
        }

        try {
            // 1.2 FETCH INITIAL AWARENESS STATE (Baseline for Delta)
            const { data: snapshots } = await supabase
                .from('shadow_snapshots')
                .select('timestamp, entropy_score')
                .eq('user_id', record.user_id)
                .order('timestamp', { ascending: false })
                .limit(1);

            let initialVector = { rs: 0, av: 0, bi: 1, se: 0, cb: 1 };
            if (snapshots && snapshots.length > 0) {
                const se = Math.min(Math.max(snapshots[0].entropy_score / 100, 0), 1);
                initialVector = { rs: 0, av: 0, bi: 0.5, se: se, cb: 1 - se };
            }

            // 1.3 FETCH RECOVERY STATS & PREVIOUS DDA
            const { data: stats } = await supabase
                .from('command_center_stats')
                .select('recovery_triggers_this_journey')
                .eq('user_id', record.user_id)
                .single();

            const recoveryCount = stats?.recovery_triggers_this_journey || 0;

            const { data: lastTrajectory } = await supabase
                .from('user_trajectories')
                .select('data, final_vector')
                .eq('user_id', record.user_id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            const prevDDA = lastTrajectory?.data?.dda_level_applied || 1;
            const prevBI = lastTrajectory?.final_vector?.bi || 0.5;

            // 1.4 CALCULATE NEW DDA (Incorporating Alchemical Catalyst Penalty & Global Events)
            let nextDDA = prevDDA;

            // Check for Active Resonance Event (Global Override)
            const { data: activeEvent } = await supabase
                .from('active_resonance_event')
                .select('dda_override')
                .single();

            if (activeEvent && activeEvent.dda_override) {
                // 1.4.1 Check for Global Resilience (Failure Analysis)
                const { count: globalInsulatedCount } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .filter('awareness_vector->is_insulated', 'eq', true);

                // Check if user is Insulated (Resilience Buffer)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('awareness_vector')
                    .eq('id', record.user_id)
                    .single();

                const isInsulated = profile?.awareness_vector?.is_insulated === true;

                // 🛑 FAIL-SAFE: Double Entropy Penalty
                // If the event is high_pressure and NO ONE in the swarm is insulated, apply massive penalty
                const isImpactTime = new Date().getHours() >= 22; // 10 PM and after
                if (activeEvent.event_type === 'high_pressure' && (globalInsulatedCount || 0) === 0 && isImpactTime) {
                    console.error(`🚨 [AwarenessWorker] SWARM FAILURE DETECTED: Applying Double Entropy Penalty to User ${record.user_id}`);
                    nextDDA = 5;
                    const penaltyBoost = 0.25;
                    const currentSE = initialVector.se || 0;
                    initialVector.se = Math.min(currentSE + penaltyBoost, 1.0);
                    initialVector.cb = Math.max(1 - initialVector.se, 0);

                    // Store penalty metadata for the Resurrection Protocol
                    const updatedVector = {
                        ...(profile?.awareness_vector || {}),
                        last_penalty_at: new Date().toISOString(),
                        penalty_se_boost: penaltyBoost
                    };

                    await supabase
                        .from('profiles')
                        .update({ awareness_vector: updatedVector })
                        .eq('id', record.user_id);

                    // Log Swarm Failure Telemetry
                    await supabase.from("system_telemetry_logs").insert({
                        service_name: "resonance-engine",
                        action: "swarm_failure_penalty",
                        status: "failure",
                        user_id: record.user_id,
                        payload: { reason: "Zero insulated pioneers at T-Zero", dda_forced: 5, entropy_boost: penaltyBoost }
                    });
                } else {
                    // 🕊️ RESURRECTION PROTOCOL: Decay logic
                    const lastPenaltyAt = profile?.awareness_vector?.last_penalty_at;
                    const penaltyBoost = profile?.awareness_vector?.penalty_se_boost || 0;

                    if (lastPenaltyAt && penaltyBoost > 0 && prevBI > 0.6) {
                        const hoursSincePenalty = (new Date().getTime() - new Date(lastPenaltyAt).getTime()) / (1000 * 60 * 60);
                        const decayFactor = Math.pow(0.5, hoursSincePenalty / 6); // 6-hour half-life
                        const decayedBoost = penaltyBoost * decayFactor;

                        console.log(`🕊️ [AwarenessWorker] Resurrection Protocol: Decaying penalty from ${penaltyBoost.toFixed(3)} to ${decayedBoost.toFixed(3)} (${hoursSincePenalty.toFixed(1)}h elapsed)`);

                        // Apply the decay to the SE derivation
                        initialVector.se = Math.max(initialVector.se - (penaltyBoost - decayedBoost), 0);
                        initialVector.cb = Math.min(initialVector.cb + (penaltyBoost - decayedBoost), 1);

                        // If decay is significant, update the stored boost
                        if (penaltyBoost - decayedBoost > 0.01) {
                            await supabase
                                .from('profiles')
                                .update({
                                    awareness_vector: {
                                        ...(profile.awareness_vector),
                                        penalty_se_boost: decayedBoost
                                    }
                                })
                                .eq('id', record.user_id);
                        }
                    }

                    if (isInsulated && activeEvent.dda_override >= 5) {
                        nextDDA = 4; // Buffer: Drop to Level 4 for insulated users during the peak
                        console.log(`🌀 [AwarenessWorker] INSULATED USER DETECTED: Reducing Wave Pressure to LVL ${nextDDA}`);
                    } else {
                        nextDDA = activeEvent.dda_override;
                        console.log(`🌀 [AwarenessWorker] GLOBAL EVENT DETECTED: Overriding DDA to ${nextDDA}`);
                    }
                }
            } else if (recoveryCount > 2) {
                nextDDA = Math.max(prevDDA - 1, 1);
                console.log(`📉 [AwarenessWorker] High Recovery usage (${recoveryCount}). Downshifting DDA to ${nextDDA}`);
            } else {
                // Simplified momentum logic (High BI = +1, Low BI = -1)
                if (prevBI > 0.8) nextDDA = Math.min(prevDDA + 1, 5);
                else if (prevBI < 0.4) nextDDA = Math.max(prevDDA - 1, 1);
            }

            // 1.5 FETCH HIVE INTELLIGENCE (Evasion Patterns & Proven Paths)
            const { data: hiveEvasions } = await supabase
                .from('hive_evasion_patterns')
                .select('pattern')
                .order('frequency', { ascending: false })
                .limit(10);

            const collectiveEvasions = (hiveEvasions || []).map(e => e.pattern).join(', ');

            // Attempt to find a "Proven Path" (Simple match for now)
            const { data: provenPaths } = await supabase
                .from('hive_wisdom_vault')
                .select('title, mission_data')
                .limit(1); // Future: Vector similarity search

            const hiveInsight = provenPaths && provenPaths.length > 0
                ? `HIVE_INSIGHT: Successful Sovereigns often follow this pattern: ${provenPaths[0].title}`
                : "";

            // 2. Mark queue item as processing
            await supabase
                .from("awareness_events_queue")
                .update({ status: "processing" })
                .eq("id", record.id);

            console.log(`⚙️ [AwarenessWorker] Generating journey for event: ${record.action_type}`);

            // 3. ACTUAL AI MISSION GENERATION (Consciousness Hacker)
            const model = "gemini-1.5-flash";
            const consciousnessHackerPrompt = `
[SYSTEM_INSTRUCTION: VERIFICATION CRITERIA GENERATION]
You are the 'Consciousness Hacker' core of the Alrehla OS. Your task is to generate strict behavioral verification criteria for each daily mission. 

The user just triggered an event: ${record.action_type}.
Payload context: ${JSON.stringify(record.payload)}

The user will attempt to deceive the system (and themselves) using psychological defense mechanisms. You MUST predict their evasion tactics in **Egyptian Arabic slang**.

DDA LEVEL: ${nextDDA}
(Level 1: Safe/Solo, Level 5: High-friction/Social)

COLLECTIVE EVASION PATTERNS (DO NOT ALLOW THESE):
${collectiveEvasions}

${hiveInsight}

Output strictly as JSON matching this interface:
interface GeneratedMission {
  trajectory_title: string;
  duration_days: number;
  dda_level_applied: number;
  daily_missions: Array<{
    day: number;
    actionable_task: string;
    estimated_minutes: number;
    verification_criteria: {
      success_intent: string; 
      failure_patterns: string[]; 
      target_tool: "dawayir" | "chat";
    };
  }>;
}
            `;

            const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: consciousnessHackerPrompt }] }],
                    generationConfig: { responseMimeType: "application/json" }
                })
            });

            const aiData = await aiResponse.json();
            const missionText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!missionText) throw new Error("AI failed to generate mission");

            const generatedMission = JSON.parse(missionText);

            // 4. Insert into user_trajectories with initial vector
            const { error: trajError } = await supabase
                .from("user_trajectories")
                .insert({
                    user_id: record.user_id,
                    title: generatedMission.trajectory_title,
                    status: "active",
                    data: generatedMission,
                    cognitive_bandwidth: initialVector.cb,
                    initial_vector: initialVector
                });

            if (trajError) throw trajError;

            // 5. Mark queue item as completed
            await supabase
                .from("awareness_events_queue")
                .update({
                    status: "completed",
                    processed_at: new Date().toISOString()
                })
                .eq("id", record.id);

            console.log(`✅ [AwarenessWorker] Journey generation successful for ${record.user_id}`);

            console.log(`✅ [AwarenessWorker] Journey generation successful for ${record.user_id}`);

            // 7. Log Telemetry
            const latency = Date.now() - startTime;
            await supabase.from("system_telemetry_logs").insert({
                service_name: "awareness-worker",
                action: record.action_type,
                latency_ms: latency,
                status: "success",
                user_id: record.user_id
            });

        } finally {
            // 6. RELEASE LOCK & RESET RECOVERY STATS
            await supabase
                .from('command_center_stats')
                .update({
                    trajectory_lock_until: null,
                    recovery_triggers_this_journey: 0,
                    consecutive_shadow_turns: 0
                })
                .eq('user_id', record.user_id);
            console.log(`🔓 [AwarenessWorker] Lock released & Stats reset for User ${record.user_id}`);
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: any) {
        console.error("❌ [AwarenessWorker] Error:", error.message);

        // Update record with error
        const payload = await req.json().catch(() => ({}));
        const recordId = payload?.record?.id;

        if (recordId) {
            const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
            await supabase
                .from("awareness_events_queue")
                .update({
                    status: "failed",
                    last_error: error.message
                })
                .eq("id", recordId);
        }

        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 500,
        });
    }
});
