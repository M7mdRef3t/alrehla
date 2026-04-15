export type DiscoveryStage = 
  | "Inbox" 
  | "Needs Evidence" 
  | "Validated" 
  | "Prioritized" 
  | "In Delivery" 
  | "Shipped";

export interface DiscoveryItem {
  id: string;
  title: string;
  description: string;
  source: string; // 'user_signal', 'ops_insight', 'direct_feedback'
  stage: DiscoveryStage;
  priority: 'low' | 'medium' | 'high' | 'critical';
  facts: string[];
  interpretations: string[];
  jira_issue_url?: string;
  created_at: string;
  updated_at: string;
}
