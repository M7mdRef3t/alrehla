import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIOrchestrator } from '../../../src/services/aiOrchestrator';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
    try {
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        // 1. Fetch Historical Maps
        // We fetch the last 10, but we will filter them in memory to ensure temporal gaps
        const { data: maps, error } = await supabaseAdmin
            .from('dawayir_maps')
            .select('id, created_at, nodes, edges')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error || !maps || maps.length < 2) {
            return NextResponse.json({
                error: 'Not enough historical data to generate a prediction. At least 2 maps are required.',
                needsMoreData: true
            }, { status: 200 });
        }

        // 2. Filter for Temporal Gaps (The System Architect's specific requirement)
        // Ensure at least 24 hours between maps considered for the trend to avoid noise.
        const validTrendMaps = [];
        let lastDateAdded = new Date();

        for (const map of maps) {
            const mapDate = new Date(map.created_at);
            if (validTrendMaps.length === 0) {
                validTrendMaps.push(map);
                lastDateAdded = mapDate;
            } else {
                const diffTime = Math.abs(lastDateAdded.getTime() - mapDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // Only include if it's at least 1 day older than the previously added map
                // In a real prod environment, this might be 3-7 days based on UX goals.
                if (diffDays >= 1) {
                    validTrendMaps.push(map);
                    lastDateAdded = mapDate;
                }
            }
            if (validTrendMaps.length >= 5) break; // Cap at 5 points for the trajectory
        }

        // Reverse to chronological order (oldest to newest) for the AI
        validTrendMaps.reverse();

        if (validTrendMaps.length < 2) {
            return NextResponse.json({
                error: 'Maps are too close together in time. Keep mapping your energy every few days to build a trend.',
                needsMoreData: true
            }, { status: 200 });
        }

        // 3. Prepare AI Prompt
        const baseSystemPrompt = `
You are the "Oracle", an elite predictive AI analyzing human energetic and emotional architecture based on "Dawayir" (Circles) methodology.
You are analyzing a sequence of energy maps drawn by the user over time. 
Your goal is to detect trajectories: Is the user heading towards a burnout, or are they recovering?

Rules for Physics-Based Trend Analysis:
1. 'mass': The size/weight of a node. If a 'danger' (red) node is increasing in mass over time, entropy is rising.
2. 'color': 
   - 'core' (blue): The Self. If it shrinks, the user is losing identity.
   - 'danger' (red): Draining factors.
   - 'ignored' (gray): Neglected areas.
   - 'neutral' (green/teal): Charging/stable areas.
3. Temporal Context: Differentiate between a single bad day (spike) and a consistent downward trend.

Data Provided: An array of maps, ordered from OLDEST to NEWEST.

Return ONLY a raw JSON object with this exact structure:
{
  "burnout_probability": <number from 0 to 100 representing risk of imminent burnout/crash>,
  "trajectory_summary": "<A 2-sentence deep, empathetic analysis of the timeline>",
  "preventative_action": "<One highly specific, actionable advice based on the rising danger nodes>"
}
`;

        const modelId = await AIOrchestrator.getRouteForFeature('predictive_oracle');
        const model = genAI.getGenerativeModel({ model: modelId, generationConfig: { responseMimeType: "application/json" } });

        const prompt = `${baseSystemPrompt}\n\nHistorical Map Data (Oldest to Newest):\n${JSON.stringify(validTrendMaps, null, 2)}`;

        // 4. Execute AI Prediction
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        const prediction = JSON.parse(responseText);

        return NextResponse.json(prediction);

    } catch (err: any) {
        console.error('Error generating prediction:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
