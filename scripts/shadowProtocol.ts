/**
 * THE SHADOW VIRAL PROTOCOL 
 * Core Component: The Shadow Profile Generator (The Seed)
 * 
 * Objective: 
 * When a Map is generated and a "DANGER" (draining) node is identified 
 * (representing a real human relationship like "Manager", "Partner"), 
 * this script creates a 'Shadow Profile' and generates a hyper-targeted, 
 * curiosity-inducing invite link.
 */

import { createClient } from '@supabase/supabase-js';
import { AIOrchestrator } from '../src/services/aiOrchestrator';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Interface representing a node in the user's map that triggers a shadow profile
 */
interface TargetNode {
    label: string;
    type: string;
    mass: number;
    ownerId: string;
    contactMethod?: string;
    contactValue?: string;
}

export async function constructShadowProfile(target: TargetNode) {
    console.log(`🌑 [Shadow Protocol] Initiating Ghost Profile for entity: ${target.label}`);

    try {
        // 1. Generate a secure, anonymous UUID for this ghost
        const shadowId = crypto.randomUUID();

        // 2. Wake up the Orchestrator to craft the perfect "Curiosity Trap" (The Bait)
        const modelId = await AIOrchestrator.getRouteForFeature('predictive_oracle'); // We need deep reasoning here
        const model = genAI.getGenerativeModel({ model: modelId, generationConfig: { responseMimeType: "application/json" } });

        const systemPrompt = `
You are the "Architect of Curiosity" for the mapping platform Dawayir.
A user has mapped a relationship that drains them (Mass: ${target.mass}/10, Type: ${target.type}).
This person is labeled as: "${target.label}".

Your task: Write a 2-sentence psychological trigger message to be sent to this person.
The message MUST NOT reveal the user's name.
It must ignite intense curiosity and defensive ego, forcing them to click a link to "defend their energetic signature."
Do not be mean. Be profoundly mysterious and analytical.

Return EXACTLY this JSON:
{
  "hook_headline": "Short, striking headline",
  "trigger_message": "The 2-sentence psychological bait"
}
`;

        console.log(`🧠 [Shadow Protocol] Synthesizing psychological trigger using ${modelId}...`);
        const result = await model.generateContent(systemPrompt);
        const { hook_headline, trigger_message } = JSON.parse(result.response.text());

        // 3. Persist the Shadow Profile to the Database
        const { error: dbError } = await supabase.from('shadow_profiles').insert({
            id: shadowId,
            origin_user_id: target.ownerId,
            entity_label: target.label,
            assigned_weight: target.mass,
            hook_headline,
            trigger_message,
            contact_method: target.contactMethod || null,
            contact_value: target.contactValue || null,
            status: (target.contactMethod && target.contactValue) ? 'TRIGGER_SENT' : 'DORMANT'
        });

        if (dbError) {
            console.error(`💥 [Shadow Protocol] Database Error:`, dbError);
        }

        console.log(`✅ [Shadow Protocol] Ghost Profile established.`);
        console.log(`🔗 Activation Link: https://alrehla.app/resolve/${shadowId}`);

        // 4. Autonomous Notification Dispatch
        if (target.contactMethod && target.contactValue) {
            console.log(`📨 Dispatching payload via [${target.contactMethod.toUpperCase()}] to [${target.contactValue}]...`);
            // In Production, integrate with Resend (Email) or Twilio/MessageBird (WhatsApp).
            console.log(`   [Subject]: ${hook_headline}`);
            console.log(`   [Body]: ${trigger_message}`);
            console.log(`   [Action]: Click to view your energetic footprint and counter the claim.\n`);
        } else {
            console.log(`⚠️ Profile is DORMANT. Awaiting contact info to dispatch trigger.`);
        }

        return shadowId;

    } catch (error) {
        console.error("💥 [Shadow Protocol] Matrix glitch:", error);
        return null;
    }
}

// ==========================================
// MOCK SIMULATION (The Critic's Test)
// ==========================================
if (require.main === module) {
    const mockDangerNode: TargetNode = {
        label: "شريك العمل المتسلط",
        type: "danger",
        mass: 9,
        ownerId: "00000000-0000-0000-0000-000000000000", // valid uuid format for simulation
        contactMethod: "whatsapp",
        contactValue: "+201234567890"
    };

    constructShadowProfile(mockDangerNode);
}
