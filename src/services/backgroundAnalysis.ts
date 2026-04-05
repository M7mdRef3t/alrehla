import { inngestMock } from "./inngestMock";
import { pineconeMock } from "./pineconeMock";
import { useMapState } from "../state/mapState";
import { geminiClient } from "./geminiClient";
import { runtimeEnv } from "../config/runtimeEnv";

/**
 * Background Analysis Service
 * Orchesrates background jobs for relationship analysis using Inngest & Pinecone mocks.
 */

// Define the "background function" (mock)
inngestMock.on("analyze-relationship", async (rawData) => {
  if (
    !rawData ||
    typeof rawData !== "object" ||
    typeof (rawData as { nodeId?: unknown }).nodeId !== "string" ||
    typeof (rawData as { context?: unknown }).context !== "string"
  ) {
    console.error("[Background Job] Invalid payload for analyze-relationship", rawData);
    return;
  }

  const data = rawData as { nodeId: string; context: string };
  console.log(`[Background Job] Starting analysis for node: ${data.nodeId}`);
  
  try {
    // 1. Generate deep insights via Gemini (simulating real analysis)
    const prompt = `حلل العلاقة دي بعمق بناءً على السياق: ${data.context}. 
    طلع 3 نقاط فنية: (المشكلة، الشعور المخفي، المناورة المقترحة). 
    رد بـ JSON فقط: { insights: string }`;
    
    const textResponse = await geminiClient.generate(prompt);
    const insights = textResponse || "تحليل متعذر حالياً.";

    // 2. Store in Pinecone (Mock Vector DB)
    await pineconeMock.upsert([{
      id: data.nodeId,
      values: [Math.random(), Math.random(), Math.random()], // Simulated embedding
      metadata: {
        label: "Analysis Result",
        insights,
        timestamp: Date.now()
      }
    }]);

    // 3. Update MapState (Remove isAnalyzing flag and update insights)
    // We already have analyzeNode in mapState, but we might want a more specific update
    // For now, let's just clear the isAnalyzing flag to show it's done.
    useMapState.getState().updateNode(data.nodeId, {
      isAnalyzing: false,
      // In a real app, we'd store the deep insights here or in a separate store
    });

    console.log(`[Background Job] Analysis complete for node: ${data.nodeId}`);
  } catch (error) {
    console.error("[Background Job] Error during analysis:", error);
    useMapState.getState().updateNode(data.nodeId, { isAnalyzing: false });
  }
});

export const triggerBackgroundAnalysis = (nodeId: string, context: string) => {
  if (runtimeEnv.isDev) return;
  inngestMock.send({
    name: "analyze-relationship",
    data: { nodeId, context }
  });
};
