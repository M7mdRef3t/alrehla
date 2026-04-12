import { logger } from "@/services/logger";
import { inngestMock } from "./inngestMock";
import { pineconeMock } from "./pineconeMock";
import { useMapState } from "@/domains/dawayir/store/map.store";
import { geminiClient } from "./geminiClient";
import { runtimeEnv } from "@/config/runtimeEnv";
import { consciousnessService } from "./consciousnessService";

/**
 * Background Analysis Service
 * Orchestrates async jobs for relationship analysis using Supabase pgvector.
 */

// Define the "background function" (mock)
inngestMock.on("analyze-relationship", async (rawData) => {
  if (
    !rawData ||
    typeof rawData !== "object" ||
    typeof (rawData as { nodeId?: unknown }).nodeId !== "string" ||
    typeof (rawData as { context?: unknown }).context !== "string"
  ) {
    logger.error("[Background Job] Invalid payload for analyze-relationship", rawData);
    return;
  }

  const data = rawData as { nodeId: string; context: string };
  const { nodeId, context } = data;
  console.log(`[Background Job] Starting analysis for node: ${nodeId}`);
  
  try {
    // 1. Generate deep insights via Gemini
    const prompt = `حلل العلاقة دي بعمق بناءً على السياق: ${context}. 
    طلع 3 نقاط فنية: (المشكلة، الشعور المخفي، المناورة المقترحة). 
    رد بـ JSON فقط: { "insights": "string" }`;
    
    const response = await geminiClient.generateJSON<{ insights: string }>(prompt);
    const insights = response?.insights || "تحليل متعذر حالياً.";

    // 2. Store in Supabase pgvector via consciousnessService
    await consciousnessService.saveMoment(
      null, // Implicit user if RLS allows, or rely on auth state implicitly
      `Analysis for Node ${nodeId} [Context: ${context}]: ${insights}`,
      "note" // Treating analysis as a note source
    );

    // 3. Update MapState
    useMapState.getState().updateNode(nodeId, {
      isAnalyzing: false,
    });

    console.log(`[Background Job] Analysis complete for node: ${nodeId}`);
  } catch (error) {
    logger.error("[Background Job] Error during analysis:", error);
    useMapState.getState().updateNode(nodeId, { isAnalyzing: false });
  }
});

export const triggerBackgroundAnalysis = (nodeId: string, context: string) => {
  if (runtimeEnv.isDev) return;
  
  // Trigger mock background job
  return inngestMock.send("analyze-relationship", { nodeId, context }).catch(err => {
    console.error("[Background Job Orchestrator] Unhandled rejection:", err);
  });
};
