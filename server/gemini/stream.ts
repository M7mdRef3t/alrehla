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
} from "./_shared";
import {
  applyCodingOutputContractToPrompt,
  buildOutputContractViolationResponse,
  buildPromptGuardResponse,
  evaluatePrompt,
  validateCodingCommentContract
} from "./_promptGuard";

type ApiRequest = {
  method?: string;
  body?: {
    prompt?: unknown;
    generationConfig?: unknown;
    modelOrder?: unknown;
  };
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
  end: (body?: string) => void;
  write: (chunk: string) => void;
  statusCode: number;
};

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
        if (guard.coding) {
          const result = await withTimeout(model.generateContent(finalPrompt), 15_000);
          const text = result.response.text();
          const validation = validateCodingCommentContract(text);
          if (!validation.ok) {
            res.status(422).json(buildOutputContractViolationResponse(validation.violations));
            return;
          }
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.setHeader("Cache-Control", "no-store");
          res.end(text);
          return;
        }

        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        const result = await withTimeout(model.generateContentStream(finalPrompt), 15_000);
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) res.write(text);
        }
        res.end();
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
    res.statusCode = 504;
    res.end("Stream timed out");
    return;
  }
  res.statusCode = 500;
  res.end(lastError ? String(lastError) : "Stream failed");
}
