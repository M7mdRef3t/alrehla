import { logger } from "../../services/logger";
/**
 * Gate Handoff Core
 * 
 * Minimal contract:
 * The frontend only provides the Gate Session ID and the authenticated User ID.
 * NO client claims (like "I placed 3 nodes") are passed.
 * The backend API solely queries the actual `journey_maps` Database 
 * attached to this user to verify whether the Brutal Rule passes.
 */

export const triggerMapCompletionCheck = async (gateSessionId: string, userId: string): Promise<boolean> => {
  if (!gateSessionId || !userId) return false;
  
  try {
    const response = await fetch('/api/gate/map-completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      // WE ONLY SEND THE ID AND THE TARGET IDENTITY. Total Verification is on the Server.
      body: JSON.stringify({ gateSessionId, userId })
    });
    
    return response.ok;
  } catch (e) {
    logger.error('[Gate Handoff] MapCompletion trigger failed', e);
    return false;
  }
};
