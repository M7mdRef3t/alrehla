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
    res.status(422).json(buildPromptGuardResponse(guard.missing));
    return;
  }

  const finalPrompt = applyCodingOutputContractToPrompt(prompt);
  const config =
    generationConfig && typeof generationConfig === "object"
      ? (generationConfig as Record<string, unknown>)
      : DEFAULT_GENERATION_CONFIG;
  const models = Array.isArray(modelOrder) && modelOrder.length > 0 ? modelOrder : DEFAULT_MODEL_ORDER;

  let lastError: unknown = null;
  try {
    for (let i = 0; i < models.length; i += 1) {
      try {
        const model = getGeminiModel(client, models[i], config);
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
        res.status(200).json({ text, usage });
        return;
      } catch (error) {
        lastError = error;
        if (isRetryableModelError(error)) {
          continue;
        }
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
    res.status(504).json({ error: "Generation timed out" });
    return;
  }
  res.status(500).json({ error: "Generation failed", detail: errorMsg });
}
