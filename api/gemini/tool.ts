import { FunctionCallingMode, type ToolConfig } from "@google/generative-ai";
import { DEFAULT_GENERATION_CONFIG, DEFAULT_MODEL_ORDER, getClient, getModel, isRetryableModelError } from "./_shared.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const client = getClient();
  if (!client) {
    res.status(503).json({ error: "Gemini not configured" });
    return;
  }

  const { contents, tools, systemInstruction, generationConfig, modelOrder } = req.body ?? {};
  if (!Array.isArray(contents)) {
    res.status(400).json({ error: "Missing contents" });
    return;
  }

  const config = generationConfig ?? DEFAULT_GENERATION_CONFIG;
  const models: string[] = Array.isArray(modelOrder) && modelOrder.length > 0 ? modelOrder : DEFAULT_MODEL_ORDER;
  const toolConfig: ToolConfig = { functionCallingConfig: { mode: FunctionCallingMode.AUTO } };

  let lastError: unknown = null;
  for (let i = 0; i < models.length; i += 1) {
    try {
      const model = getModel(client, models[i], config);
      const result = await model.generateContent({
        contents,
        tools,
        systemInstruction: systemInstruction ?? undefined,
        toolConfig
      });
      const response = result.response;
      const functionCalls = response.functionCalls?.() ?? [];
      const modelContent = response.candidates?.[0]?.content ?? { role: "model", parts: [] };

      if (functionCalls.length === 0) {
        res.status(200).json({ text: response.text(), modelContent });
        return;
      }
      res.status(200).json({ functionCalls, modelContent });
      return;
    } catch (error) {
      lastError = error;
      if (isRetryableModelError(error)) {
        continue;
      }
      break;
    }
  }

  res.status(500).json({ error: "Tool generation failed", detail: lastError ? String(lastError) : undefined });
}
