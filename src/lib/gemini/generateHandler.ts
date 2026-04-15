import {
  DEFAULT_GENERATION_CONFIG,
  DEFAULT_MODEL_ORDER,
  canAcceptGeminiRequest,
  getGeminiClient,
  getGeminiModel,
  isRetryableModelError,
  markGeminiRequestEnd,
  markGeminiRequestStart,
  withTimeout
} from "./shared";
import {
  applyCodingOutputContractToPrompt,
  buildPromptGuardResponse,
  evaluatePrompt,
  validateCodingCommentContract,
  buildOutputContractViolationResponse
} from "./promptGuard";

type ApiRequest = { method?: string; body?: Record<string, unknown> };
type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => void;
};
type GeminiResponseWithUsage = { usageMetadata?: unknown; text: () => string };

export default async function generateHandler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const client = getGeminiClient();
  if (!client) {
    res.status(503).json({ error: "Gemini not configured (API key missing)" });
    return;
  }
  if (!canAcceptGeminiRequest()) {
    res.status(429).json({ error: "Gemini overloaded, try again shortly" });
    return;
  }
  markGeminiRequestStart();

  const { prompt, generationConfig, modelOrder } = req.body ?? {};
  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "Missing prompt" });
    return;
  }
  
  const guard = evaluatePrompt(prompt);
  if (!guard.ok) {
    console.warn("[Gemini API] Prompt Guard REJECTED prompt due to missing constraints:", guard.missing, "Prompt preview:", prompt.substring(0, 50));
    res.status(422).json(buildPromptGuardResponse(guard.missing));
    return;
  }

  const finalPrompt = applyCodingOutputContractToPrompt(prompt);
  const config =
    generationConfig && typeof generationConfig === "object"
      ? (generationConfig as Record<string, unknown>)
      : DEFAULT_GENERATION_CONFIG;
  const models = Array.isArray(modelOrder) && modelOrder.length > 0 ? modelOrder : DEFAULT_MODEL_ORDER;
  console.log("[Gemini API] Starting generation with models:", models);

  let lastError: unknown = null;
  try {
    for (let i = 0; i < models.length; i += 1) {
      const modelName = models[i];
      console.log(`[Gemini API] Trying model [${i + 1}/${models.length}]: ${modelName}`);
      try {
        const model = getGeminiModel(client, modelName, config);
        const result = await withTimeout(model.generateContent(finalPrompt), 20_000);
        const response = result.response;
        const text = response.text();
        
        if (guard.coding) {
          const validation = validateCodingCommentContract(text);
          if (!validation.ok) {
            res.status(422).json(buildOutputContractViolationResponse(validation.violations));
            return;
          }
        }
        
        const usage = (response as GeminiResponseWithUsage)?.usageMetadata ?? null;
        console.log(`[Gemini API] ✅ Success with model: ${modelName}`);
        res.status(200).json({ text, usage });
        return;
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error(`[Gemini API] ❌ Model ${modelName} failed:`, errMsg);
        lastError = error;
        if (isRetryableModelError(error)) {
          console.warn(`[Gemini API] Error is retryable, trying next model...`);
          continue;
        }
        console.error(`[Gemini API] Error is NOT retryable, stopping fallback chain.`);
        break;
      }
    }
  } catch (err) {
    lastError = err;
  } finally {
    markGeminiRequestEnd();
  }

  const errorMsg = lastError instanceof Error ? lastError.message : String(lastError || "unknown_error");
  if (errorMsg.includes("gemini_timeout")) {
    // Keep client UX stable: return soft fallback instead of hard 504 noise.
    res.status(200).json({ text: null, usage: null, fallback: true, reason: "generation_timeout" });
    return;
  }
  res.status(200).json({ text: null, usage: null, fallback: true, reason: "generation_failed", detail: errorMsg });
}
