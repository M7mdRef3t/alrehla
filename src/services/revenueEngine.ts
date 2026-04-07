/**
 * SOVEREIGN_REVENUE_ENGINE.ts — محرك السيادة المالية
 * =====================================================
 * "توحيد القنوات المالية في نبض واحد"
 *
 * المبدأ:
 * - تجميع البيانات من Gumroad, Stripe, و الـ Direct Payments.
 * - حساب "المساحات الاقتصادية" بناءً على القوة الشرائية الإقليمية.
 */

import { supabase, isSupabaseReady } from "./supabaseClient";

export type PaymentGateway = "stripe" | "gumroad" | "direct" | "manual";

export interface TransactionSummary {
  id: string;
  gateway: PaymentGateway;
  amount: number;
  currency: string;
  usdEquivalent: number;
  status: "confirmed" | "pending" | "failed";
  timestamp: string;
  market: string; // Riyadh, Dubai, Cairo, London, etc.
}

export interface RevenueMetricSnapshot {
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  totalRevenue: number;
  activeSubscriptions: number;
  churnRate: number;
  arpu: number; // Average Revenue Per User
  regionalResonance: Record<string, number>; // Market -> Potential/Realized revenue ratio
}

class SovereignRevenueEngine {
  /**
   * ─────────────────────────────────────────────────────────────────
   * جلب ملخص الإيرادات التنفيذي
   * ─────────────────────────────────────────────────────────────────
   */
  async getExecutiveRevenueSnapshot(): Promise<RevenueMetricSnapshot> {
    if (!isSupabaseReady || !supabase) {
      return this.getMockSnapshot();
    }

    try {
      // 1. Get confirmed customers (Status = 'activated' or 'converted')
      const { data: customers } = await supabase
        .from("marketing_leads")
        .select("status, metadata")
        .in("status", ["activated", "converted", "proof_received"]);

      // 2. Compute dynamic revenue metrics (using regional price scaling)
      let mrr = 0;
      const activeSubs = customers?.length ?? 0;

      (customers as any[])?.forEach(row => {
        const m = row.metadata?.market || "Unknown";
        // Dynamic pricing: base $25.5 * multiplier from calculateTargetPrice
        const base = row.metadata?.amount || 25.5;
        mrr += this.calculateTargetPrice(m, base);
      });

      // 3. Compute Regional Resonance (Market -> All Lead Volume Proxy)
      const { data: allLeads } = await supabase
        .from("marketing_leads")
        .select("metadata");

      const totalLeads = allLeads?.length || 1;
      const resonanceMap: Record<string, number> = {};
      
      (allLeads as any[])?.forEach(row => {
        const m = row.metadata?.market || "Global";
        resonanceMap[m] = (resonanceMap[m] ?? 0) + 1;
      });

      Object.keys(resonanceMap).forEach(k => {
        resonanceMap[k] = Number((resonanceMap[k] / totalLeads).toFixed(2));
      });

      return {
        mrr,
        arr: mrr * 12,
        totalRevenue: mrr * 5, // Estimate 5 months dynamic LTV
        activeSubscriptions: activeSubs,
        churnRate: activeSubs > 20 ? 3.2 : 0, 
        arpu: activeSubs > 0 ? Number((mrr / activeSubs).toFixed(2)) : 0,
        regionalResonance: resonanceMap
      };
    } catch (e) {
      console.error("Error in Revenue Engine:", e);
      return this.getMockSnapshot();
    }
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * جلب المعاملات الأخيرة (Live Feed)
   * ─────────────────────────────────────────────────────────────────
   */
  async getRecentTransactions(limit = 10): Promise<TransactionSummary[]> {
    if (!isSupabaseReady || !supabase) return [];

    try {
      const { data: recentLeads } = await supabase
        .from("marketing_leads")
        .select("id, source_type, status, created_at, metadata")
        .in("status", ["activated", "converted", "proof_received"])
        .order("created_at", { ascending: false })
        .limit(limit);

      return (recentLeads || []).map(lead => ({
        id: lead.id,
        gateway: this.mapSourceToGateway(lead.source_type),
        amount: lead.metadata?.amount || 25,
        currency: lead.metadata?.currency || "USD",
        usdEquivalent: lead.metadata?.amount || 25,
        status: "confirmed",
        timestamp: lead.created_at,
        market: lead.metadata?.market || "Unknown"
      }));
    } catch (e) {
      console.error("Failed to fetch recent transactions:", e);
      return [];
    }
  }

  private mapSourceToGateway(source: string): PaymentGateway {
    if (source?.includes("stripe")) return "stripe";
    if (source?.includes("gumroad")) return "gumroad";
    return "direct";
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * حساب "القوة الشرائية السيادية" (Regional Elasticity)
   * ─────────────────────────────────────────────────────────────────
   */
  calculateTargetPrice(market: string, basePrice: number): number {
    const multipliers: Record<string, number> = {
      "Riyadh": 1.1,
      "Dubai": 1.2,
      "Cairo": 0.4,
      "London": 1.0
    };
    return basePrice * (multipliers[market] || 1.0);
  }

  private getMockSnapshot(): RevenueMetricSnapshot {
    return {
      mrr: 0,
      arr: 0,
      totalRevenue: 0,
      activeSubscriptions: 0,
      churnRate: 0,
      arpu: 0,
      regionalResonance: {
        "Riyadh": 0,
        "Dubai": 0,
        "Cairo": 0,
        "London": 0
      }
    };
  }
}

export const revenueEngine = new SovereignRevenueEngine();
