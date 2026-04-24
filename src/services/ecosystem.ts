import { supabase } from "./supabaseClient";
import { EcosystemData, ProductId } from "@/types/ecosystem";
import { ProfileService } from "./profileService";
import { logger } from "./logger";

// Simple debounce implementation to prevent hammering the DB on every keypress/click
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_DELAY_MS = 2000; // 2 seconds

let pendingUpdateData: Partial<EcosystemData> = {};

/**
 * EcosystemSyncService
 * Responsible for pushing local satellite state up to the shared Hub (Alrehla).
 */
export class EcosystemSyncService {
    /**
     * Queues an update to the ecosystem_data field in the profiles table.
     * Uses an RPC to perform a safe JSONB merge.
     * Includes a debounce to batch rapid updates (e.g., adding multiple map nodes quickly).
     */
    static syncState(data: Partial<EcosystemData>, immediate = false): void {
        if (!supabase) return;

        // Merge incoming data with any pending data
        pendingUpdateData = {
            ...pendingUpdateData,
            ...data,
            satellite_metrics: {
                ...pendingUpdateData.satellite_metrics,
                ...data.satellite_metrics,
            },
            current_context: data.current_context ?? pendingUpdateData.current_context
        };

        if (immediate) {
            if (debounceTimer) clearTimeout(debounceTimer);
            void this.executeSync();
        } else {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                void this.executeSync();
            }, DEBOUNCE_DELAY_MS);
        }
    }

    private static async executeSync() {
        if (!supabase) return;
        if (Object.keys(pendingUpdateData).length === 0) return;

        const dataToSync = { ...pendingUpdateData };
        pendingUpdateData = {}; // Clear pending queue

        try {
            const { error } = await ProfileService.updateEcosystemData(dataToSync);

            if (error) {
                // logger.error already called inside ProfileService
            }
        } catch (err) {
             logger.error("❌ [EcosystemSync] Unexpected error during sync", err);
        }
    }

    /**
     * Helper specifically for updating metrics belonging to a single satellite.
     */
    static updateSatelliteMetrics(productId: ProductId, metrics: any) {
        this.syncState({
            satellite_metrics: {
                [productId]: metrics
            }
        });
    }

    /**
     * Mark a satellite as active for this user.
     */
    static markSatelliteActive(productId: ProductId) {
        // Since we are doing a deep merge in the RPC, we might need a specific way to append to arrays, 
        // but for now, sending the context is a good start. 
        // A more robust implementation would fetch first, append, then save, or handle array append in RPC.
        this.syncState({
            current_context: {
                last_product: productId,
                state: 'active',
                timestamp: new Date().toISOString()
            }
        });
    }
}
