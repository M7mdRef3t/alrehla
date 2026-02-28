import { supabase } from './supabaseClient';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export class ResonanceMonitor {
    /**
     * Ghosting Prevention: Scans for inactive pioneers and dispatches nudges.
     */
    static async scanForInactivity() {
        if (!supabase) return;

        // 1. Fetch pioneers inactive for > 24h
        const { data: pioneers, error } = await supabase
            .from('profiles')
            .select('id, full_name, last_active_at')
            .lt('last_active_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        if (error || !pioneers) return;

        for (const pioneer of pioneers) {
            await ResonanceMonitor.dispatchNudge(pioneer.id);
        }
    }

    /**
     * Sentiment-Aware Nudge Dispatcher
     */
    static async dispatchNudge(userId: string) {
        if (!supabase) return;

        // 1. Fetch last chat context for sentiment analysis
        const { data: lastChat } = await supabase
            .from('chat_history')
            .select('content, role')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false })
            .limit(5);

        const chatContext = lastChat?.map(c => `${c.role}: ${c.content}`).join('\n') || '';

        // 2. Analyze Sentiment (Oracle vs Shadow determination)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const analysisPrompt = `
Analyze the following user chat history and determine if they are in a state of:
1. STABILITY/GROWTH: Confident, defensive, or exploring.
2. CRISIS/COLLAPSE: Vulnerable, suffering, or overwhelmed.

Context:
${chatContext}

Output strictly as JSON:
{ "state": "STABILITY" | "CRISIS", "reason": "string" }
        `;

        const analysisResult = await model.generateContent(analysisPrompt);
        const analysis = JSON.parse(analysisResult.response.text());

        // 3. Generate Tone-Specific Nudge
        const tone = analysis.state === 'STABILITY' ? 'SHADOW' : 'ORACLE';
        const nudgePrompt = tone === 'SHADOW'
            ? `Write a sharp, satirical nudge in Egyptian Slang to a user who has ghosted the system for 24h. Mock their avoidance as a childish defense mechanism.`
            : `Write a compassionate, grounding nudge in Egyptian Slang to a user who has been quiet. Acknowledge the weight of the work and offer a "Safe Harbor" reminder.`;

        const nudgeResult = await model.generateContent(nudgePrompt);
        const nudgeText = nudgeResult.response.text();

        // 4. Log & Dispatch (Log to DB, real-world dispatch simulated)
        await supabase.from('resonance_nudge_logs').insert({
            user_id: userId,
            nudge_type: tone.toLowerCase(),
            context_sentiment: analysis.state,
            nudge_content: nudgeText
        });

        console.log(`🚀 [ResonanceMonitor] Sent ${tone} nudge to User ${userId}`);
    }

    /**
     * T-Minus 45m Riddle Dispatcher (Pre-Ionization)
     */
    static async dispatchPreIonizationRiddle() {
        if (!supabase) return;

        const { data: pioneers } = await supabase.from('profiles').select('id');
        if (!pioneers) return;

        const riddle = `
[تأيين الوعي - ت-٤٥ دقيقة]
"فيه خرم إبرة واحد للنجاة من اللي هيحصل الساعة ١٠.. الثغرة دي موجودة في كلامك اللي فات بس أنت خايف تشوفها. لو معرفتش تطلعها من لسانك قبل ما المجال ينحرف، الصدمة هتكون تقيلة. جاهز تكسر الـ Ego بتاعك ولا هتغرق مع الباقيين؟"
        `;

        for (const p of pioneers) {
            await supabase.from('resonance_nudge_logs').insert({
                user_id: p.id,
                nudge_type: 'pre_ionization',
                context_sentiment: 'STABILITY',
                nudge_content: riddle
            });
            console.log(`🌀 [ResonanceMonitor] Pre-Ionization Riddle sent to ${p.id}`);
        }
    }

    /**
     * 🔗 Synchronicity Pairing Dispatcher (Post-Event)
     * Pairs pioneers with complementary weakness vectors for shared micro-missions.
     * Uses Ephemeral Entanglement (TTL: 24h) to prevent codependency.
     */
    static async dispatchSynchronicityPairings() {
        if (!supabase) return;

        console.log("🔗 [ResonanceMonitor] Initiating Synchronicity Pairing...");

        // 1. Expire any stale entanglements first
        const { data: expired } = await supabase
            .from('resonance_pairs')
            .update({ status: 'expired' })
            .eq('status', 'active')
            .lt('expires_at', new Date().toISOString())
            .select('id');

        if (expired && expired.length > 0) {
            console.log(`🕊️ [ResonanceMonitor] Expired ${expired.length} stale Resonance Pairs.`);
        }

        // 2. Fetch unpaired pioneers
        const { data: pioneers } = await supabase
            .from('profiles')
            .select('id, awareness_vector')
            .not('id', 'in', `(SELECT user_a_id FROM resonance_pairs WHERE status = 'active' UNION SELECT user_b_id FROM resonance_pairs WHERE status = 'active')`);

        if (!pioneers || pioneers.length < 2) {
            console.log("⚠️ [ResonanceMonitor] Not enough unpaired pioneers for Synchronicity.");
            return;
        }

        // 3. For each unpaired pioneer, find their complement
        let pairsCreated = 0;
        const paired = new Set<string>();
        const newPairs = [];

        for (const pioneer of pioneers) {
            if (paired.has(pioneer.id)) continue;

            let bestPartnerId = null;
            let bestScore = -1;
            let bestAxis = '';

            const p_se = pioneer.awareness_vector?.se ?? 0.5;
            const p_av = pioneer.awareness_vector?.av ?? 0.5;
            const p_bi = pioneer.awareness_vector?.bi ?? 0.5;
            const p_rs = pioneer.awareness_vector?.rs ?? 0.5;

            for (const candidate of pioneers) {
                if (candidate.id === pioneer.id || paired.has(candidate.id)) continue;

                const c_se = candidate.awareness_vector?.se ?? 0.5;
                const c_av = candidate.awareness_vector?.av ?? 0.5;
                const c_bi = candidate.awareness_vector?.bi ?? 0.5;
                const c_rs = candidate.awareness_vector?.rs ?? 0.5;

                const diff_se = Math.abs(p_se - c_se);
                const diff_av = Math.abs(p_av - c_av);
                const diff_bi = Math.abs(p_bi - c_bi);
                const diff_rs = Math.abs(p_rs - c_rs);

                const score = diff_se + diff_av + diff_bi + diff_rs;

                if (score > bestScore) {
                    bestScore = score;
                    bestPartnerId = candidate.id;

                    const maxDiff = Math.max(diff_se, diff_av, diff_bi, diff_rs);
                    if (maxDiff === diff_se) bestAxis = 'SE';
                    else if (maxDiff === diff_av) bestAxis = 'AV';
                    else if (maxDiff === diff_bi) bestAxis = 'BI';
                    else bestAxis = 'RS';
                }
            }

            if (!bestPartnerId) continue;

            // 4. Create the Ephemeral Entanglement (TTL: 24h)
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

            newPairs.push({
                user_a_id: pioneer.id,
                user_b_id: bestPartnerId,
                complementary_axis: bestAxis,
                similarity_score: bestScore,
                expires_at: expiresAt,
                mission_context: {
                    axis: bestAxis,
                    type: 'synchronicity_mission'
                }
            });

            paired.add(pioneer.id);
            paired.add(bestPartnerId);
            pairsCreated++;

            console.log(`✨ [ResonanceMonitor] Paired ${pioneer.id} ↔ ${bestPartnerId} (Axis: ${bestAxis})`);
        }

        if (newPairs.length > 0) {
            const { error } = await supabase.from('resonance_pairs').insert(newPairs);
            if (error) {
                console.error("⚠️ [ResonanceMonitor] Error bulk inserting pairs:", error);
            }
        }

        console.log(`🔗 [ResonanceMonitor] Synchronicity complete: ${pairsCreated} pairs created.`);
    }
}

