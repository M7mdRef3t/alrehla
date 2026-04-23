import { logger } from "@/services/logger";
import { useMapState } from '@/modules/map/dawayirIndex';
import { runtimeEnv } from "@/config/runtimeEnv";

/**
 * Background Analysis Service
 * Orchestrates async jobs for relationship analysis using real API endpoints.
 */

export const triggerBackgroundAnalysis = async (nodeId: string, context: string) => {
  if (runtimeEnv.isDev) return;
  
  try {
    console.log(`[Background Job Orchestrator] Sending analysis request for node: ${nodeId}`);
    
    // We do not await this fully on the client so it acts as a "fire and forget" background trigger.
    // However, we handle the promise to update the UI state.
    fetch("/api/dawayir/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nodeId, context }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        console.log(`[Background Job Orchestrator] Analysis completed successfully for node: ${nodeId}`);
      } else {
        console.error(`[Background Job Orchestrator] Analysis failed:`, data.error);
      }
    })
    .catch(err => {
      console.error("[Background Job Orchestrator] Fetch error:", err);
    })
    .finally(() => {
      // Update MapState when done
      useMapState.getState().updateNode(nodeId, {
        isAnalyzing: false,
      });
    });

  } catch (err) {
    logger.error("[Background Job Orchestrator] Unhandled error:", err);
    useMapState.getState().updateNode(nodeId, { isAnalyzing: false });
  }
};

