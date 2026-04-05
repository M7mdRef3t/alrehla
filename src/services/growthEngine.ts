import { adminApi } from "./adminApi";
import { revenueEngine, type RevenueMetricSnapshot } from "./revenueEngine";

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
      spend?: number;
      roi?: number;
    }
  >;
}

class SovereignGrowthEngine {
  async getGrowthMetrics(): Promise<GrowthMetrics> {
    try {
      const rawSpend = await adminApi.fetchMarketingSpend();
      const spend = rawSpend ?? 0;
      const revenueSnapshot: RevenueMetricSnapshot = await revenueEngine.getExecutiveRevenueSnapshot();
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
      console.error("Growth Engine Error:", error);
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
      const { data: leads } = await supabase.from("marketing_leads").select("source_type, status, metadata, created_at");
      const gateways: Record<string, { count: number; acquisitions: number }> = {
        meta: { count: 0, acquisitions: 0 },
        tiktok: { count: 0, acquisitions: 0 },
        google: { count: 0, acquisitions: 0 },
        direct: { count: 0, acquisitions: 0 },
      };

      leads?.forEach((lead: any) => {
        const src = String(lead?.source_type ?? "direct").toLowerCase();
        const key = src.includes("meta") || src.includes("facebook")
          ? "meta"
          : src.includes("tiktok")
            ? "tiktok"
            : src.includes("google")
              ? "google"
              : "direct";

        gateways[key].count += 1;
        if (["activated", "converted", "customer"].includes(String(lead?.status ?? ""))) {
          gateways[key].acquisitions += 1;
        }
      });

      const totalSpend = (await adminApi.fetchMarketingSpend()) ?? 0;
      const totalLeadsCount = Object.values(gateways).reduce((sum, item) => sum + item.count, 0);
      const revenueSnapshot = await revenueEngine.getExecutiveRevenueSnapshot();
      const regions = revenueSnapshot.regionalResonance;
      
      const now = new Date();
      const twentyFourAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const leadsLast24h = (leads ?? []).filter((l: any) => l.created_at >= twentyFourAgo).length;

      const topSpreaders = [
        { name: "Sovereign Elite", count: Math.ceil(leadsLast24h * 0.15), resonance: 0.95 },
        { name: "Global Pulse", count: Math.ceil(leadsLast24h * 0.08), resonance: 0.82 }
      ];

      const gatewayHealth = Object.fromEntries(
        Object.entries(gateways).map(([key, gateway]) => {
          const resonance = gateway.count > 0 ? gateway.acquisitions / gateway.count : 0;
          const allocatedSpend = totalSpend / Math.max(Object.keys(gateways).length, 1);
          return [
            key,
            {
              resonance,
              pulse: Math.min(100, (gateway.count / 10) * 100),
              status: "open" as const,
              oracleVerdict: this.generateOracleVerdict(key, resonance),
              spend: allocatedSpend,
              roi: allocatedSpend > 0 ? ((gateway.acquisitions * revenueSnapshot.arpu - allocatedSpend) / allocatedSpend) * 100 : 0,
            },
          ];
        })
      ) as DiffusionMetrics["gatewayHealth"];

      return {
        kFactor: totalLeadsCount > 0 ? Number((Object.values(gateways).reduce((sum, item) => sum + item.acquisitions, 0) / totalLeadsCount).toFixed(2)) : 0.42,
        velocity: leadsLast24h / 24,
        regionalDiffusion: regions,
        topSpreaders,
        gatewayHealth,
      };
    } catch (error) {
      console.error("Failed to fetch Diffusion Metrics:", error);
      return this.getMockDiffusionMetrics();
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
    if (resonance > 0.45) return `البوابة ${gatewayName} في حالة رنين مثالي. استمر في ضخ الطاقة، الأرواح هنا جاهزة للتحول العميق.`;
    if (resonance > 0.25) return `تدفق مستقر من ${gatewayName}. نوصي بتحسين "تردد الرسالة الأولى" لرفع معدل الاستجابة بنسبة 10%.`;
    if (resonance > 0.1) return `تحذير: بوابة ${gatewayName} تسرب الأرواح. هناك فجوة بين النداء والوعي. راجع مسار الهبوط (Landing Page).`;
    return `بوابة ${gatewayName} خامدة تقريباً. الرنين تحت الحد الأدنى. Oracle يقترح إعادة توجيه ميزانية هذه البوابة لمسار Meta أو Direct.`;
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
export const GrowthEngine = growthEngine;
