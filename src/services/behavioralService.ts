import { supabase } from "./supabaseClient";
import type { ResourceTab } from "@/modules/growth/ResourcesCenter";

export type PatternSentiment = "positive" | "negative" | "recurring";

export interface BehavioralPattern {
  id: string;
  title: string;
  description: string;
  sentiment: PatternSentiment;
  icon: string;
  frequency: number;
  linkedQuiz?: string;
  isSensitive?: boolean;
  resourceTab?: ResourceTab;
  resourceSearch?: string;
}

export interface TimelinePoint {
  day: string;
  connection: number;
  withdrawal: number;
  stability: number;
  period: "morning" | "evening";
}

export interface BehavioralAlert {
  id: string;
  message: string;
  pattern_id: string | null;
  resource_tab: string | null;
  resource_key: string | null;
  is_read: boolean;
}

export const behavioralService = {
  async getPatterns(): Promise<BehavioralPattern[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("behavioral_patterns")
      .select("*")
      .order("frequency", { ascending: false });

    if (error) {
      console.error("Error fetching behavioral patterns:", error);
      return [];
    }

    return (data || []).map((p: any) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      sentiment: p.sentiment,
      icon: p.icon,
      frequency: p.frequency,
      linkedQuiz: p.linked_quiz,
      isSensitive: p.is_sensitive,
      resourceTab: p.resource_tab,
      resourceSearch: p.resource_search,
    }));
  },

  async getMetrics(type: "week" | "month" | "year"): Promise<TimelinePoint[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("behavioral_metrics")
      .select("day, connection, withdrawal, stability, period")
      .eq("metric_type", type)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching behavioral metrics:", error);
      return [];
    }

    return (data || []).map((m: any) => ({
      day: m.day,
      connection: m.connection,
      withdrawal: m.withdrawal,
      stability: m.stability,
      period: m.period,
    }));
  },

  async getAlerts(): Promise<BehavioralAlert[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("behavioral_alerts")
      .select("id, message, pattern_id, resource_tab, resource_key, is_read")
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error fetching behavioral alerts:", error);
      return [];
    }

    return (data || []).map((a: any) => ({
      id: a.id,
      message: a.message,
      pattern_id: a.pattern_id,
      resource_tab: a.resource_tab,
      resource_key: a.resource_key,
      is_read: a.is_read,
    }));
  },

  async acknowledgeAlert(alertId: string): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase
      .from("behavioral_alerts")
      .update({ is_read: true })
      .eq("id", alertId);

    if (error) {
      console.error("Error acknowledging behavioral alert:", error);
    }
  },
  /**
   * Subscribe to new behavioral alerts in real-time
   */
  subscribeToAlerts: (userId: string, onNewAlert: (alert: BehavioralAlert) => void) => {
    if (!supabase) return { unsubscribe: () => undefined };

    return supabase
      .channel("behavioral-alerts-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "behavioral_alerts",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onNewAlert(payload.new as BehavioralAlert);
        }
      )
      .subscribe();
  },
};
