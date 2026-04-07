import { logger } from "../../services/logger";
import { supabase } from '@/services/supabaseClient';
import type { GateState } from './types'; // We will define this next

export const upsertGateSession = async (state: GateState) => {
  try {
    if (!supabase) {
      return;
    }

    const payload = {
      id: state.sessionId,
      source_area: state.sourceArea,
      email: state.email,
      pain_point: state.painPoint,
      intent: state.intent,
      commitment_level: state.commitment,
    };

    // Use upsert so we can seamlessly update layer1 and layer2 data
    const { error } = await supabase
      .from('gate_sessions')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      logger.error('[Gate DB] Upsert Error', error);
    }
  } catch (err) {
    logger.error('[Gate DB] Exception', err);
  }
};
