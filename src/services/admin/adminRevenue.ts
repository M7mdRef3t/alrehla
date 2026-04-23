/**
 * adminRevenue.ts — Revenue metrics + pending intents + the adminApi namespace object.
 */

import { logger } from "@/services/logger";
import { revenueService } from "@/domains/billing";
import { supabase, isSupabaseReady } from "../supabaseClient";
import { runtimeEnv } from "@/config/runtimeEnv";
import { callAdminApi } from "./adminCore";
import { fetchMarketingSpend, updateMarketingSpend, fetchCampaignBudgets, updateCampaignBudget } from "./adminSettings";
import { fetchOverviewStats } from "./adminAnalytics";
import { fetchOwnerAlerts } from "./adminSupport";
import type { PendingIntent, SovereignExecutiveReport } from "./adminTypes";

// ─── Revenue Metrics ────────────────────────────────────────────────
export async function getRevenueMetrics(): Promise<any | null> {
  if (runtimeEnv.isDev) {
    const snapshot = await revenueService.getExecutiveSnapshot();
    return {
      mrr: snapshot.mrr,
      arr: snapshot.arr,
      churnRate: snapshot.churnRate,
      totalUsers: snapshot.activeSubscriptions,
      breakdown: {
        free: 0,
        premium: snapshot.activeSubscriptions,
        coach: 0
      }
    };
  }

  const apiData = await callAdminApi<{ ok: boolean; metrics: any }>("revenue/metrics", {
    method: "GET"
  });
  if (apiData?.ok && apiData.metrics) {
    return apiData.metrics;
  }

  const snapshot = await revenueService.getExecutiveSnapshot();
  return {
    mrr: snapshot.mrr,
    arr: snapshot.arr,
    churnRate: snapshot.churnRate,
    totalUsers: snapshot.activeSubscriptions,
    breakdown: {
      free: 0,
      premium: snapshot.activeSubscriptions,
      coach: 0
    }
  };
}

// ─── Sovereign Executive Report ─────────────────────────────────────
export async function fetchSovereignExecutiveReport(): Promise<SovereignExecutiveReport> {
  try {
    const [revenue, recentTransactions] = await Promise.all([revenueService.getExecutiveSnapshot(), revenueService.getRecentTransactions(10)]);
    return { revenue, recentTransactions };
  } catch (e) {
    logger.error("fetchSovereignExecutiveReport error:", e);
    return null;
  }
}

// ─── Pending Intents ────────────────────────────────────────────────
export const fetchPendingIntents = async (): Promise<PendingIntent[]> => {
    if (!isSupabaseReady || !supabase) return [];
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select('*, users!transactions_user_id_fkey(email, full_name, phone_number)')
            .in('status', ['pending', 'pending_review'])
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error('Error fetching pending intents:', error);
            return [];
        }

        return (data || []).map((t: any) => ({
            id: t.id,
            userId: t.user_id,
            amount: t.amount,
            currency: t.currency,
            status: t.status,
            createdAt: t.created_at,
            updatedAt: t.updated_at,
            userEmail: t.users?.email,
            userName: t.users?.full_name,
            userPhone: t.users?.phone_number
        }));
    } catch (err) {
        console.error('Exception fetching pending intents:', err);
        return [];
    }
};

export const approvePendingIntent = async (intentId: string, userId: string, adminId: string): Promise<boolean> => {
    if (!isSupabaseReady || !supabase) return false;
    try {
        // 1. Trigger Activation Engine via RPC
        const { data: result, error: rpcError } = await supabase.rpc("activate_founding_cohort_seat", {
            p_user_id: userId,
            p_provider: "oracle_dashboard",
            p_payment_ref: `manual_approve_${adminId}_${Date.now()}`
        });

        if (rpcError) {
            console.error('[AdminAPI] RPC Failed for intent approval:', rpcError);
            return false;
        }

        // 2. Mark the transaction as completed
        const { error: txError } = await supabase
            .from("transactions")
            .update({ 
                status: "completed", 
                metadata: { 
                    verified_via: 'oracle_dashboard', 
                    approved_by: adminId,
                    verified_at: new Date().toISOString() 
                } 
            })
            .eq("id", intentId);

        if (txError) {
            console.error('[AdminAPI] Failed to update transaction status:', txError);
            return false;
        }

        return true;
    } catch (err) {
        console.error('Exception approving intent:', err);
        return false;
    }
};

export const flagPendingIntent = async (intentId: string, reason: string): Promise<boolean> => {
    if (!isSupabaseReady || !supabase) return false;
    try {
        const { error } = await supabase
            .from("transactions")
            .update({ 
                status: "flagged", 
                metadata: { 
                    flagged_reason: reason,
                    flagged_at: new Date().toISOString() 
                } 
            })
            .eq("id", intentId);

        return !error;
    } catch (err) {
        console.error('Exception flagging intent:', err);
        return false;
    }
};

// ─── Legacy Namespace Object ────────────────────────────────────────
export const adminApi = {
  fetchMarketingSpend,
  updateMarketingSpend,
  fetchCampaignBudgets,
  updateCampaignBudget,
  fetchOverviewStats,
  fetchOwnerAlerts,
  fetchPendingIntents,
  approvePendingIntent,
  callAdminApi,
  upsertMarketingLead: async (lead: any) => {
    if (!isSupabaseReady || !supabase) return { success: false, error: 'Supabase not ready' };
    const { data, error } = await supabase
      .from('marketing_leads')
      .upsert(lead, { onConflict: 'email' })
      .select();
    return { success: !error, data, error };
  }
};
