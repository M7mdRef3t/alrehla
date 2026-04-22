import { safeGetSession } from "./supabaseClient";

const NEXUS_API_URL = process.env.NEXT_PUBLIC_NEXUS_API_URL?.trim() || "";

export interface UserInsightPayload {
  content: string;
  category: string;
  energy_level: number;
  exercise_code?: string;
}

/**
 * خدمة النيكسوس السيادية
 * الربط مع الـ Backend السيادي (Django) لحفظ البيانات المشفرة
 */
class NexusService {
  private insightsRequest: Promise<any[]> | null = null;

  private getApiUrl(): string | null {
    return NEXUS_API_URL || null;
  }

  /**
   * حفظ بصيرة مستخدم في الخزنة السيادية
   */
  async saveUserInsight(payload: UserInsightPayload): Promise<boolean> {
    try {
      const apiUrl = this.getApiUrl();
      if (!apiUrl) return false;

      const session = await safeGetSession();
      const token = session?.access_token;

      if (!token) {
        console.warn("[NexusService] No access token found. Not saving insight.");
        return false;
      }

      const response = await fetch(`${apiUrl}/api/nexus/insights/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[NexusService] Failed to save insight:", errorData);
        return false;
      }

      console.log("[NexusService] Insight saved successfully to sovereign vault.");
      return true;
    } catch (error) {
      console.error("[NexusService] Network error while saving insight:", error);
      return false;
    }
  }

  /**
   * جلب بصائر المستخدم من الخزنة
   */
  async getMyInsights(): Promise<any[]> {
    if (this.insightsRequest) return this.insightsRequest;

    this.insightsRequest = this.fetchMyInsights().finally(() => {
      this.insightsRequest = null;
    });

    return this.insightsRequest;
  }

  private async fetchMyInsights(): Promise<any[]> {
    try {
      const apiUrl = this.getApiUrl();
      if (!apiUrl) return [];

      const session = await safeGetSession();
      const token = session?.access_token;

      if (!token) return [];

      const response = await fetch(`${apiUrl}/api/nexus/insights/`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.warn("[NexusService] Insights backend unavailable:", error);
      return [];
    }
  }
}

export const nexusService = new NexusService();
