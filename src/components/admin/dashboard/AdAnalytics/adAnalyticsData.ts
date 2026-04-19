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
  totalSpend: 48750,
  combinedCAC: 23.40,
  roas: 4.2,
  conversions: 2083,
  totalSpendChange: 12.5,
  cacChange: -8.3,
  roasChange: 15.2,
  conversionsChange: 22.1,
};

export const mockDailyPerformance: DailyPerformance[] = [
  { date: '03/01', spend: 1520, conversions: 68, cac: 22.35, roas: 4.1, impressions: 45000, clicks: 2100 },
  { date: '03/02', spend: 1680, conversions: 72, cac: 23.33, roas: 3.9, impressions: 48000, clicks: 2300 },
  { date: '03/03', spend: 1450, conversions: 65, cac: 22.31, roas: 4.3, impressions: 42000, clicks: 1900 },
  { date: '03/04', spend: 1890, conversions: 85, cac: 22.24, roas: 4.5, impressions: 52000, clicks: 2600 },
  { date: '03/05', spend: 1750, conversions: 78, cac: 22.44, roas: 4.2, impressions: 49000, clicks: 2400 },
  { date: '03/06', spend: 2100, conversions: 92, cac: 22.83, roas: 4.0, impressions: 58000, clicks: 2800 },
  { date: '03/07', spend: 1980, conversions: 88, cac: 22.50, roas: 4.4, impressions: 55000, clicks: 2700 },
  { date: '03/08', spend: 1650, conversions: 74, cac: 22.30, roas: 4.6, impressions: 47000, clicks: 2200 },
  { date: '03/09', spend: 2250, conversions: 98, cac: 22.96, roas: 3.8, impressions: 62000, clicks: 3000 },
  { date: '03/10', spend: 2050, conversions: 90, cac: 22.78, roas: 4.1, impressions: 57000, clicks: 2750 },
  { date: '03/11', spend: 1830, conversions: 82, cac: 22.32, roas: 4.5, impressions: 51000, clicks: 2500 },
  { date: '03/12', spend: 2380, conversions: 105, cac: 22.67, roas: 4.3, impressions: 65000, clicks: 3100 },
  { date: '03/13', spend: 2150, conversions: 95, cac: 22.63, roas: 4.2, impressions: 59000, clicks: 2850 },
  { date: '03/14', spend: 1920, conversions: 86, cac: 22.33, roas: 4.7, impressions: 53000, clicks: 2600 },
];

export const mockPlatformBreakdown: PlatformBreakdown[] = [
  {
    platform: 'google',
    platformLabel: 'Google Ads',
    spend: 22400,
    impressions: 380000,
    clicks: 18200,
    ctr: 4.79,
    conversions: 980,
    cac: 22.86,
    roas: 4.5,
    trend: 'up',
  },
  {
    platform: 'meta',
    platformLabel: 'Meta Ads',
    spend: 18200,
    impressions: 520000,
    clicks: 14800,
    ctr: 2.85,
    conversions: 750,
    cac: 24.27,
    roas: 3.8,
    trend: 'stable',
  },
  {
    platform: 'tiktok',
    platformLabel: 'TikTok Ads',
    spend: 8150,
    impressions: 290000,
    clicks: 9500,
    ctr: 3.28,
    conversions: 353,
    cac: 23.09,
    roas: 4.1,
    trend: 'up',
  },
];

export const mockCACAnalysis: CACAnalysis[] = [
  {
    title: 'ارتفاع تكلفة النقرة في حملات البحث',
    impact: 'high',
    description: 'تكلفة النقرة في Google Search ارتفعت 18% بسبب زيادة المنافسة على كلمات "تطوير ذاتي" و"كوتشنج". ننصح بتوسيع الكلمات المفتاحية لتشمل long-tail keywords.',
    change: 18,
    platform: 'google',
  },
  {
    title: 'تحسن ملحوظ في أداء Reels',
    impact: 'medium',
    description: 'حملات Reels على Meta حققت CAC أقل بـ 22% من الحملات العادية. الفيديوهات القصيرة (15 ثانية) بتحقق نتائج أفضل.',
    change: -22,
    platform: 'meta',
  },
  {
    title: 'ارتفاع مؤقت في CAC على TikTok',
    impact: 'low',
    description: 'ارتفاع طفيف (5%) في CAC بسبب اختبار audiences جديدة. متوقع أن يستقر خلال 3-5 أيام بعد انتهاء فترة التعلم.',
    change: 5,
    platform: 'tiktok',
  },
];

export const mockRecommendations: AIRecommendation[] = [
  {
    id: 'rec-1',
    priority: 'critical',
    title: 'أوقف حملة "Brand Awareness - Desktop" فوراً',
    description: 'هذه الحملة بتستهلك 15% من الميزانية لكن بتحقق 3% فقط من التحويلات. حوّل الميزانية لحملات Mobile.',
    expectedImpact: 'توفير ~$2,400/أسبوع مع الحفاظ على نفس التحويلات',
    platform: 'google',
    type: 'budget',
  },
  {
    id: 'rec-2',
    priority: 'high',
    title: 'اعمل A/B Test للعنوان الرئيسي',
    description: 'التحليل يشير أن العنوان "ابدأ رحلتك" أقل جاذبية من "غيّر حياتك في 30 يوم". اختبر النسخة الجديدة.',
    expectedImpact: 'تحسن متوقع 12-18% في CTR',
    platform: 'meta',
    type: 'creative',
  },
  {
    id: 'rec-3',
    priority: 'high',
    title: 'وسّع الاستهداف لجمهور Lookalike 3%',
    description: 'جمهور Lookalike 1% وصل لمرحلة التشبع. التوسع لـ 3% هيضيف ~180K مستخدم محتمل بتكلفة مشابهة.',
    expectedImpact: 'زيادة التحويلات 25-30% مع ارتفاع طفيف (~5%) في CAC',
    platform: 'meta',
    type: 'targeting',
  },
  {
    id: 'rec-4',
    priority: 'medium',
    title: 'انتقل لـ Target CPA Bidding',
    description: 'الحملات اللي بتستخدم Manual CPC بتحقق نتائج أقل بـ 20% من Target CPA. التحويل هيحسن الكفاءة تلقائياً.',
    expectedImpact: 'تخفيض CAC بـ 10-15% خلال أسبوعين',
    platform: 'google',
    type: 'bidding',
  },
];

export const mockTopAds: TopAd[] = [
  {
    id: 'ad-1',
    name: 'رحلة التحول — فيديو 15 ثانية',
    platform: 'meta',
    spend: 3200,
    conversions: 145,
    cac: 22.07,
    roas: 5.1,
    ctr: 4.2,
    status: 'active',
    suggestion: 'اعمل 3 variations بنفس الـ hook بس بـ thumbnails مختلفة',
  },
  {
    id: 'ad-2',
    name: 'اكتشف نفسك — Search Responsive',
    platform: 'google',
    spend: 2800,
    conversions: 128,
    cac: 21.88,
    roas: 4.8,
    ctr: 6.1,
    status: 'active',
    suggestion: 'أضف sitelinks extensions وcallout extensions لزيادة CTR',
  },
  {
    id: 'ad-3',
    name: 'قصة مستخدم حقيقية — TikTok',
    platform: 'tiktok',
    spend: 1800,
    conversions: 82,
    cac: 21.95,
    roas: 4.6,
    ctr: 3.8,
    status: 'active',
    suggestion: 'اعمل duet مع المستخدم الأصلي لزيادة المصداقية',
  },
  {
    id: 'ad-4',
    name: 'خصم 50% — Landing Page',
    platform: 'google',
    spend: 2100,
    conversions: 85,
    cac: 24.71,
    roas: 3.5,
    ctr: 5.2,
    status: 'active',
    suggestion: 'غيّر الـ CTA من "اشترك الآن" لـ "جرّب مجاناً" — متوقع تحسين 15%',
  },
];

export const mockConnectedAccounts: ConnectedAccount[] = [
  {
    platform: 'google',
    accountName: 'Alrehla — Google Ads',
    accountId: 'xxx-xxx-1234',
    status: 'connected',
    lastSync: '2026-03-18 18:30',
  },
  {
    platform: 'meta',
    accountName: 'Alrehla — Meta Business',
    accountId: 'act_987654321',
    status: 'connected',
    lastSync: '2026-03-18 18:25',
  },
  {
    platform: 'tiktok',
    accountName: 'Alrehla — TikTok Ads',
    accountId: 'ttads_456789',
    status: 'connected',
    lastSync: '2026-03-18 18:20',
  },
];

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
