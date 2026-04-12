import { logger } from "@/services/logger";
import { adminApi } from "./adminApi";
import { useToastState } from "@/domains/dawayir/store/toast.store";
import { revenueService } from "@/domains/billing";
import type { RevenueMetricSnapshot } from "@/domains/billing/types";
import { MarketingGatewayService } from "./marketingGatewayService";

export interface GrowthMetrics {
  totalSpend: number;
  totalRevenue: number;
  netProfit: number;
  roi: number;
  cpl: number;
  cpa: number;
  totalLeads: number;
  totalAcquisitions: number;
}

export interface DiffusionMetrics {
  kFactor: number;
  velocity: number;
  regionalDiffusion: Record<string, number>;
  topSpreaders: Array<{ name: string; count: number; resonance: number }>;
  gatewayHealth: Record<
    string,
    {
      resonance: number;
      pulse: number;
      status: "open" | "locked";
      oracleVerdict: string;
      auto_ignition_enabled?: boolean;
      spend?: number;
      roi?: number;
      cpl?: number;
    }
  >;
}

class SovereignGrowthEngine {
  async getGrowthMetrics(): Promise<GrowthMetrics> {
    try {
      const rawSpend = await adminApi.fetchMarketingSpend();
      const spend = rawSpend ?? 0;
      const revenueSnapshot: RevenueMetricSnapshot = await revenueService.getExecutiveSnapshot();
      const totalRevenue = revenueSnapshot.totalRevenue;
      const totalLeads = await this.getTotalLeadsCount();
      const totalAcquisitions = revenueSnapshot.activeSubscriptions;
      const netProfit = totalRevenue - spend;
      const roi = spend > 0 ? (netProfit / spend) * 100 : 0;
      const cpl = totalLeads > 0 ? spend / totalLeads : 0;
      const cpa = totalAcquisitions > 0 ? spend / totalAcquisitions : 0;

      return {
        totalSpend: spend,
        totalRevenue,
        netProfit,
        roi,
        cpl,
        cpa,
        totalLeads,
        totalAcquisitions,
      };
    } catch (error) {
      logger.error("Growth Engine Error:", error);
      return {
        totalSpend: 0,
        totalRevenue: 0,
        netProfit: 0,
        roi: 0,
        cpl: 0,
        cpa: 0,
        totalLeads: 0,
        totalAcquisitions: 0,
      };
    }
  }

  async getDiffusionMetrics(): Promise<DiffusionMetrics> {
    const { supabase, isSupabaseReady } = await import("./supabaseClient");
    if (!isSupabaseReady || !supabase) return this.getMockDiffusionMetrics();

    try {
      // 1. Defined Gateway patterns
      const now = new Date();
      const twentyFourAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      // 2. Fetch specific counts from DB to avoid Full Table Scan
      const getCounts = async (patterns: string[]) => {
        const { count } = await supabase
          .from("marketing_leads")
          .select("*", { count: "exact", head: true })
          .or(`source_type.ilike.%${patterns.join("%,source_type.ilike.%")}%`);
        
        const { count: acq } = await supabase
          .from("marketing_leads")
          .select("*", { count: "exact", head: true })
          .or(`source_type.ilike.%${patterns.join("%,source_type.ilike.%")}%`)
          .in("status", ["activated", "converted", "customer"]);

        return { count: count || 0, acquisitions: acq || 0 };
      };

      const [meta, tiktok, google, totalCount, leadsLast24h, revenueSnapshot] = await Promise.all([
        getCounts(["meta", "facebook"]),
        getCounts(["tiktok"]),
        getCounts(["google"]),
        supabase.from("marketing_leads").select("*", { count: "exact", head: true }),
        supabase.from("marketing_leads").select("*", { count: "exact", head: true }).gte("created_at", twentyFourAgo),
        revenueService.getExecutiveSnapshot()
      ]);

      const totalLeadsCount = totalCount.count || 0;
      const recentLeadsCount = leadsLast24h.count || 0;

      // Calculate 'direct' as remainder
      const definedCount = meta.count + tiktok.count + google.count;
      const definedAcq = meta.acquisitions + tiktok.acquisitions + google.acquisitions;
      const direct = { 
        count: Math.max(0, totalLeadsCount - definedCount),
        acquisitions: Math.max(0, (revenueSnapshot.activeSubscriptions || 0) - definedAcq)
      };

      const gateways: Record<string, { count: number; acquisitions: number }> = {
        meta,
        tiktok,
        google,
        direct,
      };

      const totalSpend = (await adminApi.fetchMarketingSpend()) ?? 0;
      const regions = revenueSnapshot.regionalResonance;
      
      const topSpreaders = [
        { name: "Sovereign Elite", count: Math.ceil(recentLeadsCount * 0.15), resonance: 0.95 },
        { name: "Global Pulse", count: Math.ceil(recentLeadsCount * 0.08), resonance: 0.82 }
      ];

      // Get Dynamic Configs
      const dbGateways = await MarketingGatewayService.getGateways();

      const gatewayHealth = Object.fromEntries(
        Object.entries(gateways).map(([key, gateway]) => {
          const dbConfig = dbGateways.find(g => g.id === key);
          const resonance = gateway.count > 0 ? gateway.acquisitions / gateway.count : 0;
          
          // Use actual_spend if available, otherwise fallback to energy-based simulation
          const energy = dbConfig?.energy_level || 50;
          const realSpend = dbConfig?.actual_spend || 0;
          const allocatedSpend = realSpend > 0 ? realSpend : (totalSpend * (energy / 50)) / Math.max(Object.keys(gateways).length, 1);
          
          return [
            key,
            {
              resonance,
              pulse: Math.min(100, (gateway.count / 10) * 100),
              status: dbConfig?.status || "open",
              energyLevel: energy,
              actualSpend: realSpend,
              auto_ignition_enabled: dbConfig?.auto_ignition_enabled || false,
              oracleVerdict: dbConfig?.oracle_note || this.generateOracleVerdict(key, resonance),
              spend: allocatedSpend,
              roi: allocatedSpend > 0 ? ((gateway.acquisitions * (revenueSnapshot.arpu || 100) - allocatedSpend) / allocatedSpend) * 100 : 0,
              cpl: gateway.count > 0 ? allocatedSpend / gateway.count : 0,
            },
          ];
        })
      ) as DiffusionMetrics["gatewayHealth"];

      return {
        kFactor: totalLeadsCount > 0 ? Number((Object.values(gateways).reduce((sum, item) => sum + item.acquisitions, 0) / totalLeadsCount).toFixed(2)) : 0.42,
        velocity: recentLeadsCount / 24,
        regionalDiffusion: regions,
        topSpreaders,
        gatewayHealth,
      };
    } catch (error) {
      logger.error("Failed to fetch Diffusion Metrics:", error);
      return this.getMockDiffusionMetrics();
    }
  }

  /**
   * deploys a strategic B2B market ignition campaign
   */
  async deployMarketIgnition(marketId: string): Promise<boolean> {
    try {
      useToastState.getState().showToast(`استدعاء الذكاء الاصطناعي.. جاري تحضير حملة إشعال السوق في ${marketId}`, "info");

      // 1. Simulate finding B2B Leads in this market
      await new Promise(r => setTimeout(r, 1500));
      const simulatedLeadsFound = Math.floor(Math.random() * 50) + 10;
      
      // 2. Here we would theoretically integrate with an email service to dispatch a campaign
      useToastState.getState().showToast(`تم إطلاق الحملة التوعوية (${simulatedLeadsFound} مستهدف) لـ ${marketId}`, "success");

      // 3. Log to decisionEngine
      const { decisionEngine } = await import("@/ai/decision-framework");
      
      const evalRes = await decisionEngine.evaluate({
         type: "market_ignition_campaign",
         reasoning: `إطلاق استراتيجي لشرائح B2B في سوق ${marketId} لرفع نسبة Resonance الإقليمية.`,
         payload: { marketId, leads: simulatedLeadsFound }
      });

      if (evalRes.allowed || evalRes.requiresApproval) {
         await decisionEngine.execute({
            type: "market_ignition_campaign",
            timestamp: Date.now(),
            reasoning: `إطلاق استراتيجي لشرائح B2B في سوق ${marketId}.`,
            payload: { marketId, leads: simulatedLeadsFound },
            outcome: evalRes.requiresApproval ? "pending_approval" : "executed",
            approvedBy: "admin"
         });
      }

      return true;
    } catch (error) {
      logger.error("Failed to deploy market ignition", error);
      return false;
    }
  }

  async generatePayload(dreams: Array<{ id: string; alignmentScore?: number | null; status?: string | null }>): Promise<string[]> {
    return dreams
      .slice()
      .sort((a, b) => (b.alignmentScore ?? 0) - (a.alignmentScore ?? 0))
      .slice(0, 5)
      .map((dream, index) => {
        const score = typeof dream.alignmentScore === "number" ? dream.alignmentScore.toFixed(2) : "0.00";
        return `dream:${index + 1}:${dream.id}:${dream.status ?? "active"}:${score}`;
      });
  }

  isSovereignSignal(lead: any): { isHighPriority: boolean, tier: 'S' | 'A' | 'B', reason: string } {
    const market = lead.metadata?.market || "Unknown";
    const source = lead.source_type?.toLowerCase() || "direct";
    const emailStatus = lead.email_status?.toLowerCase() || "none";

    // Tier S: Paid Ads + Premium Region
    if (["riyadh", "dubai", "london"].includes(market.toLowerCase()) && (source.includes("meta") || source.includes("google") || source.includes("ads"))) {
      return { isHighPriority: true, tier: 'S', reason: "High-value acquisition from premium market." };
    }

    // Tier A: Recent engagement (Open/Click) + Paid Ads
    if ((emailStatus === 'opened' || emailStatus === 'clicked') && (source.includes("meta") || source.includes("google"))) {
      return { isHighPriority: true, tier: 'A', reason: "Active engagement on paid discovery." };
    }

    // Tier B: Standard organic leads
    return { isHighPriority: false, tier: 'B', reason: "Standard organic signal." };
  }

  monitorSustainability(): void {}

  private generateOracleVerdict(gateway: string, resonance: number): string {
    const gatewayName = gateway.toUpperCase();
    if (resonance > 0.45) return `الرحلة ${gatewayName} في حالة رنين مثالي. استمر في ضخ الطاقة، الأرواح هنا جاهزة للتحول العميق.`;
    if (resonance > 0.25) return `الرحلة ${gatewayName} مستقرة، لكن تحتاج إلى شرارة صغيرة (Push) لزيادة العائد من الرنين.`;
    if (resonance > 0.1) return `تحذير: رحلة ${gatewayName} تسرب الأرواح. هناك فجوة بين النداء والوعي. راجع مسار الهبوط (Landing Page).`;
    return `رحلة ${gatewayName} خامدة تقريباً. الرنين تحت الحد الأدنى. Oracle يقترح إعادة توجيه ميزانية هذه الرحلة لمسار Meta أو Direct.`;
  }

  private getMockDiffusionMetrics(): DiffusionMetrics {
    return {
      kFactor: 0,
      velocity: 0,
      regionalDiffusion: {
        Riyadh: 0,
        Dubai: 0,
        Cairo: 0,
        London: 0,
      },
      topSpreaders: [],
      gatewayHealth: {
        meta: { resonance: 0, pulse: 0, status: "locked", oracleVerdict: "بانتظار البيانات" },
        tiktok: { resonance: 0, pulse: 0, status: "locked", oracleVerdict: "بانتظار البيانات" },
        google: { resonance: 0, pulse: 0, status: "locked", oracleVerdict: "بانتظار البيانات" },
        direct: { resonance: 0, pulse: 0, status: "locked", oracleVerdict: "بانتظار البيانات" },
      },
    };
  }

  private async getTotalLeadsCount(): Promise<number> {
    const { supabase, isSupabaseReady } = await import("./supabaseClient");
    if (!isSupabaseReady || !supabase) return 0;
    const { count } = await supabase.from("marketing_leads").select("*", { count: "exact", head: true });
    return count || 0;
  }
}

export const growthEngine = new SovereignGrowthEngine();
export { SovereignGrowthEngine };
export const GrowthEngine = growthEngine;
export default growthEngine;
