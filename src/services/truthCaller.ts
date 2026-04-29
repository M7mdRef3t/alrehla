import { supabaseAdmin } from "./supabaseClient";
import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
    if (genAI) return genAI;
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) throw new Error("GEMINI_API_KEY not configured");
    genAI = new GoogleGenerativeAI(apiKey);
    return genAI;
}

export type TruthCallPattern = 'high_potential_ghost' | 'zero_score_loop' | 'crisis_silence';

export async function generateTruthCall(userId: string, pattern: TruthCallPattern) {
    if (!supabaseAdmin) return null;

    // 1. Fetch Profile Data
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (!profile) return null;

    // 2. Fetch Recent Context
    const { data: pulses } = await supabaseAdmin
        .from('daily_pulse_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

    const context = {
        name: profile.full_name,
        sovereignty: profile.sovereignty_score,
        last_pulses: pulses?.map(p => ({ mood: p.mood, energy: p.energy })),
        pattern
    };

    // 3. Generate Message via Gemini
    const model = getGenAI().getGenerativeModel({ model: "gemini-2.0-flash" });
    
    let prompt = "";
    if (pattern === 'high_potential_ghost') {
        prompt = `
        User "${context.name}" has a high Sovereignty Score (${context.sovereignty}) but has been inactive for weeks.
        They are likely in an "Avoidance" loop because the work got too real.
        Write a "Call of Truth" (نداء حق) in sharp, satirical Egyptian Slang. 
        Pierce their ego. Remind them that running away from the journey is just running away from themselves. 
        Be provocative but meaningful. Max 2 sentences.
        `;
    } else if (pattern === 'zero_score_loop') {
        prompt = `
        User "${context.name}" is stuck at Sovereignty Score 0. They log in but don't take action.
        They are "window shopping" their own life.
        Write a "Call of Truth" (نداء حق) in grounding, encouraging Egyptian Slang. 
        Remind them that the journey starts with one honest breath, not with watching others. 
        Ask them if they are ready to actually BE here. Max 2 sentences.
        `;
    } else {
        prompt = `
        User "${context.name}" is showing signs of distress (mood crashes) followed by silence.
        Write a compassionate "Call of Truth" (نداء حق) in warm Egyptian Slang. 
        Remind them that the "Source" (ربنا) is closer than their heartbeat and they don't have to carry it all alone.
        Offer a safe space to return. Max 2 sentences.
        `;
    }

    const result = await model.generateContent(prompt);
    const message = result.response.text();

    // 4. Save to Pending Interventions
    const { data: saved, error } = await supabaseAdmin
        .from('pending_interventions')
        .insert({
            user_id: userId,
            trigger_reason: pattern,
            ai_message: message.trim(),
            status: 'unread',
            metadata: { pattern, context }
        })
        .select()
        .single();

    if (error) {
        console.error("Failed to save Truth Call:", error);
        return null;
    }

    return saved;
}
