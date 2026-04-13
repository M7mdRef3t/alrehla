/**
 * مولّد المسار من الذكاء الاصطناعي (Gemini).
 * عند تثبيت التشخيص يُستدعى لاستلام مسار تعافي مخصص (RecoveryPath) وتخزينه.
 */

import { geminiClient } from "@/services/geminiClient";
import type { RecoveryPath } from "@/modules/pathEngine/pathTypes";
import { runtimeEnv } from "@/config/runtimeEnv";
import { 
  buildFallbackRecoveryPath, 
  buildRecoveryPathPrompt,
  GeneratePathInput 
} from "@alrehla/masarat";

/**
 * يستدعي Gemini لتوليد مسار تعافي (3 أسابيع) مخصص للشخص والمسار.
 * النتيجة تُخزَن في العقدة (recoveryPathSnapshot) وتُعرض يوم بيوم.
 */
export async function generateRecoveryPathFromAI(
  input: GeneratePathInput
): Promise<RecoveryPath | null> {
  if (!geminiClient.isAvailable()) {
    return buildFallbackRecoveryPath(input);
  }

  const { prompt } = buildRecoveryPathPrompt(input);

  try {
    const result = await geminiClient.generateJSON<RecoveryPath>(prompt);
    if (result?.id && result?.phases?.week1) return { ...result, aiGenerated: true };
  } catch (e) {
    if (runtimeEnv.isDev) console.warn("pathGenerator: Gemini failed", e);
  }
  return buildFallbackRecoveryPath(input);
}
