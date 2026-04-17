  markGeminiRequestStart,
  withTimeout
} from "./_shared";
import { braintrustService } from "../../src/services/braintrustService";
import {
  CODING_OUTPUT_CONTRACT,
  buildPromptGuardResponse,
  buildOutputContractViolationResponse,
  evaluatePrompt,
  extractLatestUserTextFromContents,
  validateCodingCommentContract
} from "./_promptGuard";

type ApiRequest = {
  method?: string;
  body?: {
    contents?: unknown;
    tools?: unknown;
    systemInstruction?: unknown;
    generationConfig?: unknown;
    modelOrder?: unknown;
  };
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
};

type GeminiResponseWithUsage = {
  usageMetadata?: unknown;
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

  const { contents, tools, systemInstruction, generationConfig, modelOrder } = req.body ?? {};
  if (!Array.isArray(contents)) {
    res.status(400).json({ error: "Missing contents" });
    return;
  }
  const latestUserText = extractLatestUserTextFromContents(contents);
  const guard = evaluatePrompt(latestUserText);
  if (!guard.ok) {
    res.status(422).json(buildPromptGuardResponse(guard.missing));
    return;
  }
  const instructionText = typeof systemInstruction === "string" ? systemInstruction : "";
  const finalSystemInstruction = guard.coding
    ? `${instructionText}\n\n${CODING_OUTPUT_CONTRACT}`
    : (instructionText || undefined);

  const config: Record<string, unknown> =
    generationConfig && typeof generationConfig === "object"
      ? (generationConfig as Record<string, unknown>)
      : DEFAULT_GENERATION_CONFIG;
  const models: string[] = Array.isArray(modelOrder) && modelOrder.length > 0 ? modelOrder : DEFAULT_MODEL_ORDER;
  const toolConfig: ToolConfig = { functionCallingConfig: { mode: FunctionCallingMode.AUTO } };
  const safeTools = Array.isArray(tools) ? (tools as Tool[]) : undefined;

  let lastError: unknown = null;
  try {
    for (let i = 0; i < models.length; i += 1) {
      try {
        const model = getModel(client, models[i], config);
        const result = await withTimeout(model.generateContent({
          contents,
          tools: safeTools,
          systemInstruction: finalSystemInstruction,
          toolConfig
        }), 18_000);
        const response = result.response;
        const functionCalls = response.functionCalls?.() ?? [];
        const modelContent = response.candidates?.[0]?.content ?? { role: "model", parts: [] };
        const usage = (response as GeminiResponseWithUsage)?.usageMetadata ?? null;

        // Log to Braintrust
        braintrustService.logCall(
          "gemini-tool",
          { contents, tools: safeTools, systemInstruction: finalSystemInstruction, model: models[i], config },
          { functionCalls, modelContent, usage },
          { success: true }
        );

        if (functionCalls.length === 0) {
          const text = response.text();
          if (guard.coding) {
            const validation = validateCodingCommentContract(text);
            if (!validation.ok) {
              res.status(422).json(buildOutputContractViolationResponse(validation.violations));
              return;
            }
          }
          res.status(200).json({ text, modelContent, usage });
          return;
        }
        res.status(200).json({ functionCalls, modelContent, usage });
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
    res.status(504).json({ error: "Tool generation timed out" });
    return;
  }
  res.status(500).json({ error: "Tool generation failed", detail: lastError ? String(lastError) : undefined });
}
