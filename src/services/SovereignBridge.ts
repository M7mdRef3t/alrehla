import { geminiClient } from "@/services/geminiClient";

export const SovereignBridge = {
  async delegateToADK(task: string, context: string) {
    const prompt = [
      "أنت مساعد سيادي داخلي يحلل السياق ويقترح خطوات عملية.",
      "المهمة:",
      task,
      "السياق:",
      context,
      "أرجع JSON فقط بالشكل {\"summary\":\"...\",\"actions\":[\"...\"],\"risks\":[\"...\"]}",
    ].join("\n\n");

    const result = await geminiClient.generateJSON<{
      summary?: string;
      actions?: string[];
      risks?: string[];
    }>(prompt, "sovereign_delegate");

    return result ?? {
      summary: "Sovereign fallback: no AI response available.",
      actions: [],
      risks: ["AI delegate unavailable"],
    };
  },
};
