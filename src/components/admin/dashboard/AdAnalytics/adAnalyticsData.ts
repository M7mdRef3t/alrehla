/**
 * Ad Analytics Mock Data & Types
 * ===============================
 * بيانات تجريبية واقعية لتحليل الحملات الإعلانية
 * Phase 1: Mock Data | Phase 2: Real API Integration
 */

// ─── Types ──────────────────────────────────────────────

export type AdPlatform = 'google' | 'meta' | 'tiktok' | 'all';

export interface KPIData {
  totalSpend: number;
  combinedCAC: number;
  roas: number;
  conversions: number;
  totalSpendChange: number;   // % change vs last period
  cacChange: number;
  roasChange: number;
  conversionsChange: number;
}

export interface DailyPerformance {
  date: string;
  spend: number;
  conversions: number;
  cac: number;
  roas: number;
  impressions: number;
  clicks: number;
}

export interface PlatformBreakdown {
  platform: AdPlatform;
  platformLabel: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  cac: number;
  roas: number;
  trend: 'up' | 'down' | 'stable';
}

export interface CACAnalysis {
  title: string;
  impact: 'high' | 'medium' | 'low';
  description: string;
  change: number; // percentage change
  platform: AdPlatform;
}

export interface AIRecommendation {
  id: string;
  priority: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
  expectedImpact: string;
  platform: AdPlatform;
  type: 'budget' | 'creative' | 'targeting' | 'bidding';
}

export interface TopAd {
  id: string;
  name: string;
  platform: AdPlatform;
  spend: number;
  conversions: number;
  cac: number;
  roas: number;
  ctr: number;
  status: 'active' | 'paused';
  suggestion: string;
}

export interface ConnectedAccount {
  platform: AdPlatform;
  accountName: string;
  accountId: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string;
}

// ─── Mock Data ──────────────────────────────────────────

export const PLATFORM_COLORS: Record<AdPlatform, string> = {
  google: '#4285F4',
  meta: '#0668E1',
  tiktok: '#FE2C55',
  all: '#2DD4BF',
};

export const PLATFORM_LABELS: Record<AdPlatform, string> = {
  google: 'Google Ads',
  meta: 'Meta Ads',
  tiktok: 'TikTok Ads',
  all: 'All Platforms',
};

export const mockKPIs: KPIData = {
  totalSpend: 0,
  combinedCAC: 0,
  roas: 0,
  conversions: 0,
  totalSpendChange: 0,
  cacChange: 0,
  roasChange: 0,
  conversionsChange: 0,
};

export const mockDailyPerformance: DailyPerformance[] = [];

export const mockPlatformBreakdown: PlatformBreakdown[] = [];

export const mockCACAnalysis: CACAnalysis[] = [];

export const mockRecommendations: AIRecommendation[] = [];

export const mockTopAds: TopAd[] = [];

export const mockConnectedAccounts: ConnectedAccount[] = [];

// ─── Utility ──────────────────────────────────────────

export function formatCurrency(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
}

export function formatNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString("en-US");
}
