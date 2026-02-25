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
}
