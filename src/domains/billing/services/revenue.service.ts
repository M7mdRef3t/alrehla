/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Domain: Billing — Revenue Service
 *
 * ينقل منطق revenueEngine.ts للـ domain
 */

import type { TransactionSummary, RevenueMetricSnapshot, PaymentGateway } from "../types";

const MOCK_SNAPSHOT: RevenueMetricSnapshot = {
  mrr: 0, arr: 0, totalRevenue: 0,
  activeSubscriptions: 0, churnRate: 0, arpu: 0,
  regionalResonance: { Riyadh: 0, Dubai: 0, Cairo: 0, London: 0 },
};

const REGIONAL_MULTIPLIERS: Record<string, number> = {
  Riyadh: 1.1, Dubai: 1.2, Cairo: 0.4, London: 1.0,
};

class RevenueService {
  calculateTargetPrice(market: string, basePrice: number): number {
    return basePrice * (REGIONAL_MULTIPLIERS[market] ?? 1.0);
  }

  async getExecutiveSnapshot(): Promise<RevenueMetricSnapshot> {
    try {
      const { supabase } = await import("@/infrastructure/database");
      if (!supabase) return MOCK_SNAPSHOT;

      // 1. Total Revenue from completed transactions
      const { data: transactions } = await supabase
        .from("transactions")
        .select("amount, currency, status")
        .eq("status", "completed");

      let totalRevenueEgp = 0;
      (transactions || [])?.forEach((row) => {
        // Simple conversion if needed, assuming everything is logged in EGP or USD for now
        totalRevenueEgp += Number(row.amount);
      });

      // 2. Active Count (Unique users with completed transactions)
      const { data: uniqueUsers } = await supabase
        .from("transactions")
        .select("user_id")
        .eq("status", "completed");
      
      const activeSubs = new Set(uniqueUsers?.map(u => u.user_id)).size;

      // 3. Regional Resonance (Still from leads if needed, or from transactions metadata)
      const { data: allTransactions } = await supabase
        .from("transactions")
        .select("metadata");

      const totalTx = allTransactions?.length || 1;
      const resonanceMap: Record<string, number> = {};
      (allTransactions || [])?.forEach((row) => {
        const m = (row.metadata as any)?.market || "Global";
        resonanceMap[m] = (resonanceMap[m] ?? 0) + 1;
      });
      Object.keys(resonanceMap).forEach((k) => {
        resonanceMap[k] = Number((resonanceMap[k] / totalTx).toFixed(2));
      });

      return {
        mrr: totalRevenueEgp, 
        arr: totalRevenueEgp * 12, 
        totalRevenue: totalRevenueEgp,
        activeSubscriptions: activeSubs,
        churnRate: activeSubs > 20 ? 3.2 : 0,
        arpu: activeSubs > 0 ? Number((totalRevenueEgp / activeSubs).toFixed(2)) : 0,
        regionalResonance: resonanceMap,
      };
    } catch (e) {
      console.error("[Revenue] Failed to fetch snapshot:", e);
      return MOCK_SNAPSHOT;
    }
  }

  async getRecentTransactions(limit = 10): Promise<TransactionSummary[]> {
    try {
      const { supabase } = await import("@/infrastructure/database");
      if (!supabase) return [];

      const { data } = await supabase
        .from("transactions")
        .select("id, provider, status, created_at, amount, currency, metadata")
        .order("created_at", { ascending: false })
        .limit(limit);

      return (data || []).map((tx) => ({
        id: tx.id,
        gateway: this.mapGateway(tx.provider),
        amount: tx.amount,
        currency: tx.currency,
        usdEquivalent: tx.amount, // conversion logic could go here
        status: tx.status === 'completed' ? 'confirmed' : 'pending',
        timestamp: tx.created_at,
        market: (tx.metadata as any)?.market || "Unknown",
      }));
    } catch (e) {
      console.error("[Revenue] Failed to fetch transactions:", e);
      return [];
    }
  }

  private mapGateway(provider: string): PaymentGateway {
    if (provider?.includes("stripe")) return "stripe";
    if (provider?.includes("gumroad")) return "gumroad";
    if (provider?.includes("manual") || provider?.includes("vodafone")) return "manual";
    return "direct";
  }

  /** @deprecated use getExecutiveSnapshot() */
  getExecutiveRevenueSnapshot = this.getExecutiveSnapshot.bind(this);
}

export const revenueService = new RevenueService();
