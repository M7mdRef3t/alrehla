import { supabase } from "./supabaseClient";
import { EcosystemData } from "@/types/ecosystem";
import { logger } from "./logger";

/**
 * ProfileService
 * Atomic operations for the public.profiles table.
 */
export const ProfileService = {
  /**
   * Updates the user's bio in Supabase.
   */
  async updateBio(userId: string, bio: string) {
    if (!supabase) return { error: new Error("Supabase not initialized") };

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ bio })
        .eq("id", userId);

      if (error) {
        logger.error("❌ [ProfileService] Failed to update bio", error);
      }
      return { error };
    } catch (err) {
      logger.error("❌ [ProfileService] Unexpected error during bio update", err);
      return { error: err };
    }
  },

  /**
   * Safe merge of ecosystem data using the custom RPC.
   */
  async updateEcosystemData(data: Partial<EcosystemData>) {
    if (!supabase) return { error: new Error("Supabase not initialized") };

    try {
      const { error } = await supabase.rpc("update_profiles_ecosystem_data", {
        p_ecosystem_data: data,
      });

      if (error) {
        logger.error("❌ [ProfileService] Failed to merge ecosystem data", error);
      }
      return { error };
    } catch (err) {
      logger.error("❌ [ProfileService] Unexpected error during ecosystem sync", err);
      return { error: err };
    }
  },

  /**
   * Updates subscription status.
   */
  async updateSubscriptionStatus(userId: string, status: string) {
    if (!supabase) return { error: new Error("Supabase not initialized") };

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ subscription_status: status })
        .eq("id", userId);

      if (error) {
        logger.error("❌ [ProfileService] Failed to update subscription status", error);
      }
      return { error };
    } catch (err) {
      logger.error("❌ [ProfileService] Unexpected error during subscription update", err);
      return { error: err };
    }
  },

  /**
   * Updates display name in the profiles table.
   */
  async updateDisplayName(userId: string, displayName: string) {
    if (!supabase) return { error: new Error("Supabase not initialized") };

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: displayName })
        .eq("id", userId);

      if (error) {
        logger.error("❌ [ProfileService] Failed to update display name", error);
      }
      return { error };
    } catch (err) {
      logger.error("❌ [ProfileService] Unexpected error during name update", err);
      return { error: err };
    }
  },
  /**
   * Updates basma identity data in the profiles table.
   */
  async updateBasmaData(userId: string, basmaData: any) {
    if (!supabase) return { error: new Error("Supabase not initialized") };

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ basma_data: basmaData })
        .eq("id", userId);

      if (error) {
        logger.error("❌ [ProfileService] Failed to update basma data", error);
      }
      return { error };
    } catch (err) {
      logger.error("❌ [ProfileService] Unexpected error during basma sync", err);
      return { error: err };
    }
  },
};

