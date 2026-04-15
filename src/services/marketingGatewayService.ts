import { supabase, supabaseAdmin } from "@/services/supabaseClient";
import { logger } from "@/services/logger";
import { MetaAdsService } from "./integrations/metaAdsService";
import { GoogleAdsService } from "./integrations/googleAdsService";

export interface MarketingGateway {
    id: string;
    name: string;
    status: "open" | "locked" | "restricted";
    energy_level: number;
    actual_spend: number;
    auto_ignition_enabled: boolean;
    last_recalibrated_at: string;
    oracle_note?: string;
    spend?: number; // Calculated field from growth engine
}

function getDefaultGateways(): MarketingGateway[] {
    return [
        { id: "meta", name: "رحلة ميتا", status: "open", energy_level: 50, actual_spend: 0, auto_ignition_enabled: false, last_recalibrated_at: new Date().toISOString() },
        { id: "tiktok", name: "رحلة تيك توك", status: "open", energy_level: 50, actual_spend: 0, auto_ignition_enabled: false, last_recalibrated_at: new Date().toISOString() },
        { id: "google", name: "رحلة جوجل / الموقع", status: "open", energy_level: 50, actual_spend: 0, auto_ignition_enabled: false, last_recalibrated_at: new Date().toISOString() },
        { id: "direct", name: "الرحلة المباشرة", status: "open", energy_level: 50, actual_spend: 0, auto_ignition_enabled: false, last_recalibrated_at: new Date().toISOString() }
    ];
}

export class MarketingGatewayService {
    static async getGateways(): Promise<MarketingGateway[]> {
        const client = supabaseAdmin || supabase;

        // On production user domains we may not have service-role credentials.
        // Return safe defaults instead of throwing to keep dashboards functional.
        if (!client) {
            logger.warn("Marketing gateways fallback: Supabase client not initialized.");
            return getDefaultGateways();
        }

        const { data, error } = await client
            .from("marketing_gateways")
            .select("*");

        if (error) {
            logger.error("Error fetching marketing gateways:", error);
            return getDefaultGateways();
        }

        return data || [];
    }

    static async updateGateway(id: string, updates: Partial<MarketingGateway>) {
        const client = supabaseAdmin || supabase;
        if (!client) throw new Error("Supabase client not initialized");
        const { error } = await client
            .from("marketing_gateways")
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq("id", id);

        if (error) {
            logger.error(`Error updating gateway ${id}:`, error);
            throw error;
        }
    }

    static async recalibrate(id: string, note: string) {
        return this.updateGateway(id, {
            last_recalibrated_at: new Date().toISOString(),
            oracle_note: note
        });
    }

    static async syncRealSpend() {
        try {
            const [metaSpend, googleSpend] = await Promise.all([
                MetaAdsService.getRecentSpend(),
                GoogleAdsService.getRecentSpend()
            ]);

            // Update Meta
            await this.updateGateway("meta", { actual_spend: metaSpend });
            // Update Google
            await this.updateGateway("google", { actual_spend: googleSpend });

            logger.log(`Synced real spend: Meta=$${metaSpend}, Google=$${googleSpend}`);
            return { metaSpend, googleSpend };
        } catch (error) {
            logger.error("Failed to sync real spend:", error);
            throw error;
        }
    }
}
