import { logger } from "@/services/logger";
/**
 * Gate Handoff Core
 * 
 * Minimal contract:
 * The frontend only provides the Gate Session ID and the authenticated User ID.
 * NO client claims (like "I placed 3 nodes") are passed.
 * The backend API solely queries the actual `journey_maps` Database 
 * attached to this user to verify whether the Brutal Rule passes.
 */

import { supabase } from '@/services/supabaseClient';

export const triggerMapCompletionCheck = async (gateSessionId: string): Promise<boolean> => {
  if (!gateSessionId) return false;
  
  try {
    if (!supabase) return false;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return false;

    const response = await fetch('/api/gate/map-completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      // WE ONLY SEND THE GATE ID. Total Verification is on the Server.
      body: JSON.stringify({ gateSessionId })
    });
    
    return response.ok;
  } catch (e) {
    logger.error('[Gate Handoff] MapCompletion trigger failed', e);
    return false;
  }
};
