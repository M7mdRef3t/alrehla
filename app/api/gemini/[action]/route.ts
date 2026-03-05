import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_MODEL_ORDER = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

function resolveGeminiApiKey(): string | null {
  const raw =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    "";
  const trimmed = String(raw).trim().replace(/^"|"$/g, "");
  if (!trimmed) return null;
  // Drop hidden/non-ASCII symbols that can break HTTP header encoding.
  const asciiOnly = [...trimmed].filter((char) => char.codePointAt(0)! <= 127).join("");
  if (!/^AIza[0-9A-Za-z_-]{20,}$/.test(asciiOnly)) return null;
  return asciiOnly;
}

function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = resolveGeminiApiKey();
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

function modelCandidatesFromBody(body: any): string[] {
  const requested = Array.isArray(body?.modelOrder)
    ? body.modelOrder.filter((model: unknown) => typeof model === "string" && model.trim())
    : [];
  const seeded = typeof body?.model === "string" && body.model.trim() ? [body.model.trim(), ...requested] : requested;
  return Array.from(new Set([...seeded, ...DEFAULT_MODEL_ORDER]));
}

async function runGenerateWithFallback(
  genAI: GoogleGenerativeAI,
  prompt: string,
  generationConfig: any,
  models: string[]
) {
  let lastError: unknown = null;
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig
      });
      const result = await model.generateContent(prompt);
      return result.response;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error("No model candidates available");
}

function latestUserText(contents: unknown): string {
  if (!Array.isArray(contents)) return "";
  for (let i = contents.length - 1; i >= 0; i -= 1) {
    const entry = contents[i] as { role?: string; parts?: Array<{ text?: unknown }> };
    if (entry?.role !== "user" || !Array.isArray(entry.parts)) continue;
    const text = entry.parts
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .filter(Boolean)
      .join("\n");
    if (text) return text;
  }
  return "";
}

export async function POST(req: NextRequest, ctx: { params: { action: string } }) {
  const action = String(ctx.params.action || "");
  const body = await req.json().catch(() => ({}));

  const genAI = getGeminiClient();
  if (!genAI) {
    return NextResponse.json({ error: "Gemini API key is missing or invalid" }, { status: 503 });
  }

  try {
    if (action === "generate") {
      const prompt = typeof body?.prompt === "string" ? body.prompt : "";
      if (!prompt.trim()) {
        return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
      }
      const response = await runGenerateWithFallback(
        genAI,
        prompt,
        body?.generationConfig,
        modelCandidatesFromBody(body)
      );
      return NextResponse.json({
        text: response.text(),
        usage: (response as any)?.usageMetadata ?? null
      });
    }

    if (action === "stream") {
      const prompt = typeof body?.prompt === "string" ? body.prompt : "";
      if (!prompt.trim()) {
        return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
      }
      const response = await runGenerateWithFallback(
        genAI,
        prompt,
        body?.generationConfig,
        modelCandidatesFromBody(body)
      );
      const text = response.text();
      return new NextResponse(text, {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }
      });
    }

    if (action === "tool") {
      const userText = latestUserText(body?.contents);
      if (!userText.trim()) {
        return NextResponse.json({ error: "Missing contents" }, { status: 400 });
      }
      const systemInstruction =
        typeof body?.systemInstruction === "string" ? body.systemInstruction.trim() : "";
      const prompt = systemInstruction ? `${systemInstruction}\n\n${userText}` : userText;
      const response = await runGenerateWithFallback(
        genAI,
        prompt,
        body?.generationConfig,
        modelCandidatesFromBody(body)
      );
      const text = response.text();
      return NextResponse.json({
        functionCalls: [],
        modelContent: { role: "model", parts: [{ text }] },
        text,
        usage: (response as any)?.usageMetadata ?? null
      });
    }

    if (action === "embed") {
      const text = typeof body?.text === "string" ? body.text : "";
      if (!text.trim()) {
        return NextResponse.json({ error: "Missing text" }, { status: 400 });
      }
      const requested = typeof body?.model === "string" && body.model.trim() ? body.model.trim() : null;
      const embeddingModels = Array.from(new Set([requested, "gemini-embedding-001", "text-embedding-004"].filter(Boolean)));

      let values: number[] | null = null;
      for (const modelName of embeddingModels) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName as string });
          const embeddingResult = await (model as any).embedContent(text);
          const candidate = embeddingResult?.embedding?.values;
          if (Array.isArray(candidate) && candidate.length > 0) {
            values = candidate;
            break;
          }
        } catch {
          // Try next embedding model candidate.
        }
      }
      if (!values) {
        return NextResponse.json({ error: "Embedding model unavailable" }, { status: 503 });
      }
      return NextResponse.json({ embedding: values });
    }
  } catch (error) {
    console.error(`[Gemini API] ${action} failed`, error);
    return NextResponse.json({ error: "Gemini request failed" }, { status: 502 });
  }

  return NextResponse.json({ error: "Unknown gemini action" }, { status: 404 });
}
