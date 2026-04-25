import { geminiClient } from "@/services/geminiClient";

export const CommandBridge = {
  async delegateToADK(task: string, context: string) {
    const prompt = [
      "أنت مساعد قيادي داخلي يحلل السياق ويقترح خطوات عملية.",
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
    }>(prompt, "command_delegate");

    return result ?? {
      summary: "Command fallback: no AI response available.",
      actions: [],
      risks: ["AI delegate unavailable"],
    };
  },
};
