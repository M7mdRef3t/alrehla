import { inngestMock } from "./inngestMock";
import { pineconeMock } from "./pineconeMock";
import { useMapState } from "../state/mapState";
import { geminiClient } from "./geminiClient";

/**
 * Background Analysis Service
 * Orchesrates background jobs for relationship analysis using Inngest & Pinecone mocks.
 */

// Define the "background function" (mock)
inngestMock.on("analyze-relationship", (async (data: unknown) => {
  const { nodeId, context } = data as { nodeId: string; context: string };
  console.log(`[Background Job] Starting analysis for node: ${nodeId}`);
  
  try {
    // 1. Generate deep insights via Gemini (simulating real analysis)
    const prompt = `حلل العلاقة دي بعمق بناءً على السياق: ${context}. 
    طلع 3 نقاط فنية: (المشكلة، الشعور المخفي، المناورة المقترحة). 
    رد بـ JSON فقط: { insights: string }`;
    
    const textResponse = await geminiClient.generate(prompt);
    const insights = textResponse || "تحليل متعذر حالياً.";

    // 2. Store in Pinecone (Mock Vector DB)
    await pineconeMock.upsert([{
      id: nodeId,
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
    useMapState.getState().updateNode(nodeId, {
      isAnalyzing: false,
      // In a real app, we'd store the deep insights here or in a separate store
    });

    console.log(`[Background Job] Analysis complete for node: ${nodeId}`);
  } catch (error) {
    console.error("[Background Job] Error during analysis:", error);
    useMapState.getState().updateNode(nodeId, { isAnalyzing: false });
  }
}) as Parameters<typeof inngestMock.on>[1]);

export const triggerBackgroundAnalysis = (nodeId: string, context: string) => {
  inngestMock.send({
    name: "analyze-relationship",
    data: { nodeId, context }
  });
};
