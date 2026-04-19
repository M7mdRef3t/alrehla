import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/infrastructure/database/client";
import { aiGateway } from "@/infrastructure/ai/gateway";
import { DiscoveryItem } from "@/types/discovery";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const adminCode = process.env.VITE_ADMIN_ACCESS_CODE;

    if (!adminCode || authHeader !== `Bearer ${adminCode}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!aiGateway.isAvailable()) {
      return NextResponse.json({ error: "Cognitive Engine is disconnected." }, { status: 503 });
    }

    if (!supabaseAdmin) {
        return NextResponse.json({ error: "DB Disconnected" }, { status: 500 });
    }

    // Fetch Inbox & Needs Evidence items for triage
    const { data: inboxItems, error } = await supabaseAdmin
      .from("discovery_items")
      .select("*")
      .in("stage", ["Inbox", "Needs Evidence"]);

    if (error) {
      throw error;
    }

    if (!inboxItems || inboxItems.length === 0) {
      return NextResponse.json({ suggestions: [], summary: "No items present for cognitive triage." });
    }

    const payload = inboxItems.map(i => ({
      id: i.id,
      title: i.title,
      description: i.description,
      priority: i.priority,
      source: i.source,
      facts: i.facts
    }));

    const prompt = `You are "The Crucible", a Sovereign Cognitive Agent for a platform called Dawayir. 
Your mission is to analyze the Discovery Engine's Inbox.
Here is a list of unprioritized signals:
${JSON.stringify(payload, null, 2)}

Analyze the items and respond strictly in the following JSON format:
{
  "summary": "A 2-sentence overarching synthesis of what these signals indicate about the platform's current operational reality.",
  "suggestions": [
     {
        "type": "merge", // or "prioritize" or "drop"
        "targetIds": ["id1", "id2"], // which IDs are involved Let it be 1 ID if it's "prioritize" or "drop"
        "reason": "Why you suggest this.",
        "proposedPriority": "critical" // if applicable
     }
  ]
}
Do not include markdown blocks around the response, just return the JSON object directly.
`;

    // Expecting JSON
    const response = await aiGateway.generateJSON<any>({
      type: "discovery_triage",
      prompt,
      model: "gemini-2.5-flash"
    });

    if (!response.success) {
      return NextResponse.json({ error: "Cognitive Engine Analysis Failed: " + response.error }, { status: 500 });
    }

    return NextResponse.json(response.data);

  } catch (err: any) {
    console.error("[Triage Engine] Error", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
