import {
  DEFAULT_GENERATION_CONFIG,
  DEFAULT_MODEL_ORDER,
  canAcceptGeminiRequest,
  getClient,
  getModel,
  isRetryableModelError,
  markGeminiRequestEnd,
  markGeminiRequestStart,
  withTimeout
} from "./_shared.js";
import {
  applyCodingOutputContractToPrompt,
  buildPromptGuardResponse,
  evaluatePrompt,
  validateCodingCommentContract,
  buildOutputContractViolationResponse
} from "./_promptGuard.js";

type ApiRequest = { method?: string; body?: Record<string, unknown> };
type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => void;
};
type GeminiResponseWithUsage = { usageMetadata?: unknown; text: () => string };

export default async function handler(req: ApiRequest, res: ApiResponse) {
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
  const config = generationConfig ?? DEFAULT_GENERATION_CONFIG;
  const models: string[] = Array.isArray(modelOrder) && modelOrder.length > 0 ? modelOrder : DEFAULT_MODEL_ORDER;

  let lastError: unknown = null;
  try {
    for (let i = 0; i < models.length; i += 1) {
      try {
        const model = getModel(client, models[i], config);
        const result = await withTimeout(model.generateContent(finalPrompt), 15_000);
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
  } finally {
    markGeminiRequestEnd();
  }

  if (String(lastError).includes("gemini_timeout")) {
    res.status(504).json({ error: "Generation timed out" });
    return;
  }
  res.status(500).json({ error: "Generation failed", detail: lastError ? String(lastError) : undefined });
}
