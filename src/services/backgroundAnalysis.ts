import { useMapState } from "@/state/mapState";
import { geminiClient } from "./geminiClient";
import { runtimeEnv } from "@/config/runtimeEnv";
import { consciousnessService } from "./consciousnessService";

/**
 * Background Analysis Service
 * Orchestrates async jobs for relationship analysis using Supabase pgvector.
 */

const analyzeRelationshipAsync = async (nodeId: string, context: string) => {
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
    console.error("[Background Job] Error during analysis:", error);
    useMapState.getState().updateNode(nodeId, { isAnalyzing: false });
  }
};

export const triggerBackgroundAnalysis = (nodeId: string, context: string) => {
  if (runtimeEnv.isDev) return;
  
  // Return the promise so specific environments can track it if needed
  return analyzeRelationshipAsync(nodeId, context).catch(err => {
    console.error("[Background Job Orchestrator] Unhandled rejection:", err);
  });
};
