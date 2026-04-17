export type DiscoveryStage =
  | "Inbox"
  | "Needs Evidence"
  | "Validated"
  | "Prioritized"
  | "In Delivery"
  | "Shipped"
  | "Dropped";

export interface DiscoveryItem {
  id: string;
  title: string;
  description: string;
  /** 'user_signal' | 'ops_insight' | 'direct_feedback' | 'market_research' | 'competitor_intel' */
  source: string;
  stage: DiscoveryStage;
  priority: "low" | "medium" | "high" | "critical";

  // Original fields
  facts: string[];
  interpretations: string[];
  jira_issue_url?: string;

  // Extended PRD fields (added in migration: tighten_discovery_items_rls)
  signal_source?: string;
  funnel_stage?: string;
  business_goal?: string;
  /** 1 (low) to 5 (high) */
  confidence?: number;
  evidence?: string[];
  hypothesis?: string;
  risk?: string;
  next_step?: string;
  execution_link?: string;
  tags?: string[];

  created_at: string;
  updated_at: string;
}

