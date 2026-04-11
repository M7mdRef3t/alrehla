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

      const { data: customers } = await supabase
        .from("marketing_leads")
        .select("status, metadata")
        .in("status", ["activated", "converted", "proof_received"]);

      let mrr = 0;
      const activeSubs = customers?.length ?? 0;

      (customers as any[])?.forEach((row) => {
        const market = row.metadata?.market || "Unknown";
        const base = row.metadata?.amount || 25.5;
        mrr += this.calculateTargetPrice(market, base);
      });

      const { data: allLeads } = await supabase
        .from("marketing_leads")
        .select("metadata");

      const totalLeads = allLeads?.length || 1;
      const resonanceMap: Record<string, number> = {};
      (allLeads as any[])?.forEach((row) => {
        const m = row.metadata?.market || "Global";
        resonanceMap[m] = (resonanceMap[m] ?? 0) + 1;
      });
      Object.keys(resonanceMap).forEach((k) => {
        resonanceMap[k] = Number((resonanceMap[k] / totalLeads).toFixed(2));
      });

      return {
        mrr, arr: mrr * 12, totalRevenue: mrr * 5,
        activeSubscriptions: activeSubs,
        churnRate: activeSubs > 20 ? 3.2 : 0,
        arpu: activeSubs > 0 ? Number((mrr / activeSubs).toFixed(2)) : 0,
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
        .from("marketing_leads")
        .select("id, source_type, status, created_at, metadata")
        .in("status", ["activated", "converted", "proof_received"])
        .order("created_at", { ascending: false })
        .limit(limit);

      return (data || []).map((lead) => ({
        id: lead.id,
        gateway: this.mapGateway(lead.source_type),
        amount: lead.metadata?.amount || 25,
        currency: lead.metadata?.currency || "USD",
        usdEquivalent: lead.metadata?.amount || 25,
        status: "confirmed" as const,
        timestamp: lead.created_at,
        market: lead.metadata?.market || "Unknown",
      }));
    } catch (e) {
      console.error("[Revenue] Failed to fetch transactions:", e);
      return [];
    }
  }

  private mapGateway(source: string): PaymentGateway {
    if (source?.includes("stripe")) return "stripe";
    if (source?.includes("gumroad")) return "gumroad";
    return "direct";
  }

  /** @deprecated use getExecutiveSnapshot() */
  getExecutiveRevenueSnapshot = this.getExecutiveSnapshot.bind(this);
}

export const revenueService = new RevenueService();
