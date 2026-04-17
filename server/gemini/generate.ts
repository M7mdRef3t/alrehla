import {
  DEFAULT_GENERATION_CONFIG,
  DEFAULT_MODEL_ORDER,
  canAcceptGeminiRequest,
  getClient,
  getModel,
  isRetryableModelError,
  markGeminiRequestEnd,
  markGeminiRequestStart,
  withTimeout,
  logAiTelemetry
} from "./_shared";
import { braintrustService } from "../../src/services/braintrustService";
import {
  applyCodingOutputContractToPrompt,
  buildPromptGuardResponse,
  evaluatePrompt,
  validateCodingCommentContract,
  buildOutputContractViolationResponse
} from "./_promptGuard";

type ApiRequest = { method?: string; body?: Record<string, unknown> };
type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => void;
};
type GeminiResponseWithUsage = { usageMetadata?: unknown; text: () => string };

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const startTime = Date.now();
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const client = getClient();
  if (!client) {
    res.status(503).json({ error: "Gemini not configured" });
    return;
  }
  if (!canAcceptGeminiRequest()) {
    res.status(429).json({ error: "Gemini overloaded, try again shortly" });
    return;
  }
  markGeminiRequestStart();
  console.log("[Gemini API] Request started with prompt length:", (req.body?.prompt as string)?.length);

  const { prompt, generationConfig, modelOrder, feature } = req.body ?? {};
  const featureTag = (feature as string) || "dynamic_generation";

  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "Missing prompt" });
    return;
  }
  const guard = evaluatePrompt(prompt);
  if (!guard.ok) {
    const errorMsg = "Prompt guard blocked request";
    await logAiTelemetry({
      feature: featureTag,
      model: "guard",
      latency_ms: Date.now() - startTime,
      tokens: { prompt: 0, completion: 0, total: 0 },
      success: false,
      failure_reason: "unknown",
      errorMessage: errorMsg
    });
    res.status(422).json(buildPromptGuardResponse(guard.missing));
    return;
  }

  const finalPrompt = applyCodingOutputContractToPrompt(prompt);
  const config: Record<string, unknown> =
    generationConfig && typeof generationConfig === "object"
      ? (generationConfig as Record<string, unknown>)
      : DEFAULT_GENERATION_CONFIG;
  const models: string[] = Array.isArray(modelOrder) && modelOrder.length > 0 ? modelOrder : DEFAULT_MODEL_ORDER;

  let lastError: unknown = null;
  try {
    for (let i = 0; i < models.length; i += 1) {
      try {
        const model = getModel(client, models[i], config);
        const result = await withTimeout(model.generateContent(finalPrompt), 25_000);
        console.log("[Gemini API] Content generated successfully using", models[i]);
        const response = result.response;
        const text = response.text();
        
        if (guard.coding) {
          const validation = validateCodingCommentContract(text);
          if (!validation.ok) {
            const errorMsg = "Output contract violation";
            await logAiTelemetry({
              feature: featureTag,
              model: models[i],
              latency_ms: Date.now() - startTime,
              tokens: { prompt: 0, completion: 0, total: 0 },
              success: false,
              failure_reason: "format_mismatch",
              errorMessage: errorMsg
            });
            res.status(422).json(buildOutputContractViolationResponse(validation.violations));
            return;
          }
        }
        
        const usage = (response as GeminiResponseWithUsage)?.usageMetadata ?? null;
        const promptTokens = (usage as Record<string, any>)?.promptTokenCount || 0;
        const completionTokens = (usage as Record<string, any>)?.candidatesTokenCount || 0;
        
        await logAiTelemetry({
          feature: featureTag,
          model: models[i],
          latency_ms: Date.now() - startTime,
          tokens: { prompt: promptTokens, completion: completionTokens, total: promptTokens + completionTokens },
          success: true
        });

        // Log to Braintrust
        braintrustService.logCall(
          `gemini-generate:${featureTag}`,
          { prompt: finalPrompt, model: models[i], config },
          { text, usage },
          { 
            success: true, 
            latency_ms: Date.now() - startTime,
            tokens: { prompt: promptTokens, completion: completionTokens, total: promptTokens + completionTokens }
          }
        );

        res.status(200).json({ text, usage });
        return;
      } catch (error) {
        lastError = error;
        if (isRetryableModelError(error)) {
          console.warn(`[Gemini API] Attempt with ${models[i]} failed (retryable):`, String(error).slice(0, 100));
          continue;
        }
        break;
      }
    }
  } catch (err) {
    console.error("[Gemini API] Critical error in handler loop:", err);
    lastError = err;
  } finally {
    markGeminiRequestEnd();
  }

  const errorMsg = lastError ? String(lastError) : "unknown_error";
  const latency = Date.now() - startTime;
  
  await logAiTelemetry({
    feature: featureTag,
    model: models[models.length - 1] || "unknown",
    latency_ms: latency,
    tokens: { prompt: 0, completion: 0, total: 0 },
    success: false,
    failure_reason: errorMsg.includes("gemini_timeout") ? "timeout" : "provider_error",
    errorMessage: errorMsg
  });

  // Log failure to Braintrust
  braintrustService.logCall(
    `gemini-generate:${featureTag}`,
    { prompt: finalPrompt, models, config },
    { error: errorMsg },
    { success: false, latency_ms: latency }
  );

  if (errorMsg.includes("gemini_timeout")) {
    res.status(200).json({ text: null, usage: null, fallback: true, reason: "generation_timeout" });
    return;
  }
  res.status(200).json({
    text: null,
    usage: null,
    fallback: true,
    reason: "generation_failed",
    detail: errorMsg
  });
}

