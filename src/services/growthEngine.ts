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
      const { data: leads } = await supabase.from("marketing_leads").select("sourceType, status, metadata");
      const gateways: Record<string, { count: number; acquisitions: number }> = {
        meta: { count: 0, acquisitions: 0 },
        tiktok: { count: 0, acquisitions: 0 },
        google: { count: 0, acquisitions: 0 },
        direct: { count: 0, acquisitions: 0 },
      };

      leads?.forEach((lead: any) => {
        const src = String(lead?.sourceType ?? "direct").toLowerCase();
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
      const regions = { Riyadh: 0.35, Dubai: 0.28, Cairo: 0.22, London: 0.15 };
      const topSpreaders = [
        { name: "Sovereign One", count: 24, resonance: 0.98 },
        { name: "Silent Echo", count: 15, resonance: 0.88 },
        { name: "Ancient Guard", count: 11, resonance: 0.76 },
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
              roi: allocatedSpend > 0 ? ((gateway.acquisitions * 25.5 - allocatedSpend) / allocatedSpend) * 100 : 0,
            },
          ];
        })
      ) as DiffusionMetrics["gatewayHealth"];

      return {
        kFactor: totalLeadsCount > 0 ? Number((Object.values(gateways).reduce((sum, item) => sum + item.acquisitions, 0) / totalLeadsCount).toFixed(2)) : 0.42,
        velocity: totalLeadsCount / 24,
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

  monitorSustainability(): void {}

  private generateOracleVerdict(gateway: string, resonance: number): string {
    if (resonance > 0.4) return `البوابة ${gateway} تشهد رنينا عاليا جدا. الأرواح تتدفق بيسر نحو الاستنارة.`;
    if (resonance > 0.2) return `تدفق مستقر من ${gateway}. هناك حاجة لتحسين ترددات النداء لجذب المزيد.`;
    return `رنين منخفض في ${gateway}. ربما يجب إعادة معايرة البوابة أو توجيه الطاقة لمسار آخر.`;
  }

  private getMockDiffusionMetrics(): DiffusionMetrics {
    return {
      kFactor: 0.42,
      velocity: 12.5,
      regionalDiffusion: {
        Riyadh: 0.32,
        Dubai: 0.25,
        Cairo: 0.25,
        London: 0.18,
      },
      topSpreaders: [
        { name: "Sovereign One", count: 24, resonance: 0.98 },
        { name: "Silent Echo", count: 15, resonance: 0.88 },
        { name: "Ancient Guard", count: 11, resonance: 0.76 },
      ],
      gatewayHealth: {
        meta: { resonance: 0.85, pulse: 92, status: "open", oracleVerdict: "رنين السيادة في قمته" },
        tiktok: { resonance: 0.42, pulse: 65, status: "open", oracleVerdict: "تذبذب في الموجات العاطفية" },
        google: { resonance: 0.12, pulse: 15, status: "locked", oracleVerdict: "البوابة قيد التنقية" },
        direct: { resonance: 0.65, pulse: 40, status: "open", oracleVerdict: "نداء الأوفياء مستمر" },
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
