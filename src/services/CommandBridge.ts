import { geminiClient } from "@/services/geminiClient";

export const CommandBridge = {
  async delegateToADK(task: string, context: string) {
    // Get vertical resonance for spiritual context
    let resonanceContext = '';
    try {
      const { useHafizState, getVerticalResonanceState } = require('@/modules/hafiz/store/hafiz.store');
      const resonance = getVerticalResonanceState(useHafizState.getState().memories);
      resonanceContext = `\nالاتصال الروحي: ${resonance.label} (${Math.round(resonance.strength * 100)}%). كل ألم أفقي = عرض لانقطاع رأسي. البشر "مرايات" مش مصادر طاقة.`;
    } catch { /* fallback */ }

    const prompt = [
      "أنت مساعد قيادي داخلي في منصة \"الرحلة\" يحلل السياق ويقترح خطوات عملية.",
      "◈ المحور الرأسي: كل قرار قيادي لازم يراعي اتصال المستخدم بالمصدر." + resonanceContext,
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
