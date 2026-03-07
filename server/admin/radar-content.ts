import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIOrchestrator } from "../../src/services/aiOrchestrator";
import { parseJsonBody, verifyAdmin } from "./_shared";
import type { AdminRequest, AdminResponse } from "./_shared";

type RadarPulse = {
  global_phoenix_avg: number;
  kinetic_distribution: Record<string, number>;
  healing_velocity: number;
  ai_workload_avg: number;
  generated_at: string;
};

function normalizeIdeas(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as { ideas?: unknown };
    if (Array.isArray(parsed?.ideas)) {
      return parsed.ideas.map((x) => String(x).trim()).filter(Boolean).slice(0, 3);
    }
  } catch {
    // fallback parsing below
  }

  return raw
    .split("\n")
    .map((line) => line.replace(/^[-\d.)\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 3);
}

export async function handleRadarContent(req: AdminRequest, res: AdminResponse) {
  if (!(await verifyAdmin(req, res))) return;
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = await parseJsonBody(req);
  const pulse = (body?.pulse ?? null) as RadarPulse | null;
  if (!pulse) {
    res.status(400).json({ error: "Missing pulse payload" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    res.status(503).json({
      error: "AI content oracle unavailable",
      source: "not_configured",
      is_live: false,
      model: "none",
      usedFallback: false
    });
    return;
  }

  try {
    const modelId = await AIOrchestrator.getRouteForFeature("admin_radar_content");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelId || "gemini-2.5-pro",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
You are a senior content strategist.
Based on the aggregated platform pulse below, infer the most urgent emotional challenge users are facing today.
Then propose exactly 3 short-form Reel ideas for Mohamed Refaat that are practical, direct, and compassionate.
Do not use fluff.

DATA:
${JSON.stringify(pulse)}

Return JSON only in this exact shape:
{"insight":"string","ideas":["idea1","idea2","idea3"]}
    `.trim();

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const ideas = normalizeIdeas(text);
    let insight = "";
    try {
      const parsed = JSON.parse(text) as { insight?: string };
      insight = String(parsed?.insight || "").trim();
    } catch {
      insight = "";
    }

    if (ideas.length === 0) {
      res.status(502).json({
        error: "Content generation returned no ideas",
        insight,
        source: "empty_generation",
        is_live: false,
        model: modelId,
        usedFallback: false
      });
      return;
    }

    res.status(200).json({
      ideas,
      insight,
      source: "gemini",
      is_live: true,
      model: modelId,
      usedFallback: false
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "generation_failed";
    res.status(502).json({
      error: message,
      source: "generation_failed",
      is_live: false,
      model: "none",
      usedFallback: false
    });
  }
}




