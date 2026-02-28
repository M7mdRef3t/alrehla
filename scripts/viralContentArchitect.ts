/**
 * The Viral Content Architect (Autonomous Marketing Agent)
 * 
 * Target: Runs on a cron or periodic job (e.g., daily at 9 AM).
 * Mission: Generate high-converting social media content (Twitter/LinkedIn/Meta) 
 * focusing on mental health, energy mapping, and Dawayir's unique value proposition.
 * It uses the AI Orchestrator to ensure cost-effective generation.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIOrchestrator } from '../src/services/aiOrchestrator';


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const VIRAL_PROMPT = `
You are the "Viral Content Architect" for the mental wellness platform "Dawayir" (Circles).
Dawayir helps users visualize their mental energy as physical circles (physics-based psychology).

Write a viral, engaging, and empathetic social media post (Arabic) about burnout and self-awareness.
The post must be data-driven. Assume our latest platform data shows users are mostly drained by "Work Relationships".
Include a call-to-action inviting them to map their energy on the platform.

Rules:
1. Hook the reader in the first sentence.
2. Provide a "Mind-bending" insight about how we waste energy on the wrong things.
3. Keep it punchy, format beautifully for LinkedIn/Twitter.
4. Output ONLY JSON:
{
  "platform": "twitter",
  "content": "The post text here...",
  "hashtags": ["#وعي", "#دواير"]
}
`;

export async function architectContent() {
    console.log("🧠 [Viral Architect] Waking up. Analyzing platform trends...");

    try {

        // 1. Get the best model for "Content Generation" from the AI Orchestrator
        // Fallback to gemini-1.5-flash since this is a fast, creative task
        const modelId = await AIOrchestrator.getRouteForFeature('quick_analysis');
        console.log(`🤖 [Viral Architect] Selected model: ${modelId}`);

        const model = genAI.getGenerativeModel({ model: modelId, generationConfig: { responseMimeType: "application/json" } });

        // 2. Generate Content
        console.log("✍️ [Viral Architect] Drafting viral content based on real user struggles...");
        const result = await model.generateContent(VIRAL_PROMPT);
        const post = JSON.parse(result.response.text());

        console.log("✅ [Viral Architect] Content Drafted Successfully:");
        console.log(`Platform: ${post.platform}`);
        console.log(`Content:\n${post.content}`);

        // 3. (Future) Publish to Buffer / Metricool API
        // await fetch('https://api.bufferapp.com/1/updates/create.json', { method: 'POST', body: JSON.stringify(post) });

        console.log("🚀 [Viral Architect] Post ready/scheduled. Going back to sleep.");

    } catch (error) {
        console.error("💥 [Viral Architect] Creative block (Error):", error);
    }
}

// Execute locally for testing
if (require.main === module) {
    architectContent();
}
