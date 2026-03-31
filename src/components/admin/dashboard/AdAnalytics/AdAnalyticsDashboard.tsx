/**
 * Ad Analytics Dashboard — لوحة تحليل الإعلانات والتسويق الرقمي
 * ============================================================
 * Phase 1: Mock Data | Inspired by Gomarble
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  BarChart3,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  ExternalLink,
  RefreshCcw,
  Plug,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Zap,
  Eye,
  MousePointerClick,
  BrainCircuit,
  ChevronDown,
} from 'lucide-react';
import type {
  AdPlatform,
  PlatformBreakdown,
  CACAnalysis,
  AIRecommendation,
  TopAd,
} from './adAnalyticsData';
import { AdminTooltip } from '../Overview/components/AdminTooltip';
import {
  mockKPIs,
  mockDailyPerformance,
  mockPlatformBreakdown,
  mockCACAnalysis,
  mockRecommendations,
  mockTopAds,
  mockConnectedAccounts,
  PLATFORM_COLORS,
  PLATFORM_LABELS,
  formatCurrency,
  formatNumber,
} from './adAnalyticsData';

// ─── Sub-components ──────────────────────────────────────

const PlatformBadge: React.FC<{ platform: AdPlatform; size?: 'sm' | 'md' }> = ({ platform, size = 'sm' }) => {
  const color = PLATFORM_COLORS[platform];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-black uppercase tracking-wider ${
        size === 'sm' ? 'px-2.5 py-0.5 text-[9px]' : 'px-3 py-1 text-[10px]'
      }`}
      style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}30` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {PLATFORM_LABELS[platform]}
    </span>
  );
};

const ChangeIndicator: React.FC<{ value: number; invert?: boolean }> = ({ value, invert = false }) => {
  const isPositive = invert ? value < 0 : value > 0;
  const isNeutral = value === 0;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-black ${
      isNeutral ? 'text-slate-500' : isPositive ? 'text-emerald-400' : 'text-rose-400'
    }`}>
      {isNeutral ? <Minus className="w-3 h-3" /> : isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
};

const ImpactBadge: React.FC<{ impact: string }> = ({ impact }) => {
  const styles = {
    high: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    critical: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${styles[impact as keyof typeof styles] || styles.low}`}>
      {impact}
    </span>
  );
};

const TypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const icons: Record<string, React.ReactNode> = {
    budget: <DollarSign className="w-3 h-3" />,
    creative: <Sparkles className="w-3 h-3" />,
    targeting: <Target className="w-3 h-3" />,
    bidding: <BarChart3 className="w-3 h-3" />,
  };
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 text-slate-400 text-[9px] font-bold uppercase border border-white/5">
      {icons[type]} {type}
    </span>
  );
};


// ─── KPI Card ────────────────────────────────────────────

const KPICard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  change: number;
  invertChange?: boolean;
  accentColor: string;
  delay?: number;
  tooltip?: string;
}> = ({ icon, label, value, change, invertChange = false, accentColor, delay = 0, tooltip }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4, ease: 'easeOut' }}
    className="group relative bg-slate-900/40 border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-all overflow-hidden"
  >
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle at 50% 0%, ${accentColor}08, transparent 70%)` }} />
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2.5 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors" style={{ color: accentColor }}>
          {icon}
        </div>
        <ChangeIndicator value={change} invert={invertChange} />
      </div>
      <div className="mb-1">
        <span className="text-3xl font-black text-white tracking-tight">{value}</span>
      </div>
      <div className="flex items-center gap-2 mb-1">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</h4>
        {tooltip && <AdminTooltip content={tooltip} position="bottom" />}
      </div>
    </div>
  </motion.div>
);


// ─── Chart Area ──────────────────────────────────────────

const PerformanceChart: React.FC = () => {
  const [metric, setMetric] = useState<'spend' | 'conversions' | 'cac' | 'roas'>('spend');
  const data = mockDailyPerformance;
  const values = data.map(d => d[metric]);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const range = maxVal - minVal || 1;

  const metricConfig = {
    spend: { label: 'الإنفاق', color: '#2DD4BF', format: (v: number) => formatCurrency(v) },
    conversions: { label: 'التحويلات', color: '#818CF8', format: (v: number) => v.toString() },
    cac: { label: 'CAC', color: '#FB923C', format: (v: number) => `$${v.toFixed(2)}` },
    roas: { label: 'ROAS', color: '#34D399', format: (v: number) => `${v.toFixed(1)}x` },
  };

  const cfg = metricConfig[metric];

  // Build SVG path
  const width = 100;
  const height = 40;
  const padding = 2;
  const points = values.map((v, i) => ({
    x: padding + ((width - 2 * padding) / (values.length - 1)) * i,
    y: height - padding - ((v - minVal) / range) * (height - 2 * padding),
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 col-span-full"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-400" />
            Performance Trend
            <AdminTooltip content="تحليل لحركة أداء المؤشرات المختارة على مدار الأيام لفهم توجه السلوك." position="right" />
          </h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">آخر 14 يوم</p>
        </div>
        <div className="flex gap-2">
          {(Object.keys(metricConfig) as Array<keyof typeof metricConfig>).map(key => (
            <button
              key={key}
              onClick={() => setMetric(key)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                metric === key
                  ? 'bg-white/10 text-white border border-white/10'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              {metricConfig[key].label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-48 mb-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={cfg.color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={cfg.color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill={`url(#grad-${metric})`} />
          <path d={pathD} fill="none" stroke={cfg.color} strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="0.8" fill={cfg.color} opacity="0.8" />
          ))}
        </svg>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between px-1">
        {data.map((d, i) => (
          <span key={i} className="text-[8px] text-slate-600 font-mono">{d.date}</span>
        ))}
      </div>

      {/* Summary Row */}
      <div className="flex gap-6 mt-4 pt-4 border-t border-white/5">
        <div>
          <span className="text-[9px] text-slate-500 uppercase font-bold">Current</span>
          <p className="text-lg font-black text-white" style={{ color: cfg.color }}>{cfg.format(values[values.length - 1])}</p>
        </div>
        <div>
          <span className="text-[9px] text-slate-500 uppercase font-bold">Average</span>
          <p className="text-lg font-black text-slate-400">{cfg.format(values.reduce((a, b) => a + b, 0) / values.length)}</p>
        </div>
        <div>
          <span className="text-[9px] text-slate-500 uppercase font-bold">Peak</span>
          <p className="text-lg font-black text-slate-400">{cfg.format(maxVal)}</p>
        </div>
      </div>
    </motion.div>
  );
};


// ─── Platform Breakdown Table ────────────────────────────

const PlatformTable: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4, duration: 0.4 }}
    className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 col-span-full"
  >
    <div className="flex items-center gap-2 mb-6">
      <h3 className="text-sm font-black text-white flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-indigo-400" />
        Platform Performance Breakdown
      </h3>
      <AdminTooltip content="تفصيل لأداء كل منصة إعلانية (ميتا، جوجل، إلخ) لمعرفة الأفضل في جلب التحويلات الموثوقة." position="left" />
    </div>

    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/5">
            {['Platform', 'Spend', 'Impressions', 'Clicks', 'CTR', 'Conversions', 'CAC', 'ROAS', 'Trend'].map(h => (
              <th key={h} className="text-[9px] font-black text-slate-500 uppercase tracking-widest pb-4 pr-4">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {mockPlatformBreakdown.map((row: PlatformBreakdown, i: number) => (
            <tr key={row.platform} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
              <td className="py-4 pr-4"><PlatformBadge platform={row.platform} size="md" /></td>
              <td className="py-4 pr-4 text-sm font-bold text-white">{formatCurrency(row.spend)}</td>
              <td className="py-4 pr-4 text-sm text-slate-400">{formatNumber(row.impressions)}</td>
              <td className="py-4 pr-4 text-sm text-slate-400">{formatNumber(row.clicks)}</td>
              <td className="py-4 pr-4 text-sm text-slate-400">{row.ctr.toFixed(2)}%</td>
              <td className="py-4 pr-4 text-sm font-bold text-white">{formatNumber(row.conversions)}</td>
              <td className="py-4 pr-4 text-sm font-bold text-amber-400">${row.cac.toFixed(2)}</td>
              <td className="py-4 pr-4 text-sm font-bold text-emerald-400">{row.roas.toFixed(1)}x</td>
              <td className="py-4 pr-4">
                {row.trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-400" />}
                {row.trend === 'down' && <TrendingDown className="w-4 h-4 text-rose-400" />}
                {row.trend === 'stable' && <Minus className="w-4 h-4 text-slate-500" />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </motion.div>
);


// ─── CAC Root Cause Analysis ─────────────────────────────

const CACAnalysisSection: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5, duration: 0.4 }}
    className="bg-slate-900/40 border border-white/5 rounded-3xl p-6"
  >
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-sm font-black text-white flex items-center gap-2">
        <BrainCircuit className="w-4 h-4 text-amber-400" />
        CAC Root Cause Analysis
        <AdminTooltip content="تحليل يعتمد على الذكاء الاصطناعي لفهم التغيرات في تكلفة اكتساب العميل (CAC)." position="right" />
      </h3>
      <span className="text-[9px] text-slate-500 font-mono">AI-powered</span>
    </div>

    <div className="space-y-4">
      {mockCACAnalysis.map((item: CACAnalysis, i: number) => (
        <div key={i} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.03] hover:border-white/[0.06] transition-all">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <ImpactBadge impact={item.impact} />
              <PlatformBadge platform={item.platform} />
            </div>
            <ChangeIndicator value={item.change} invert />
          </div>
          <h4 className="text-sm font-bold text-white mb-1" dir="rtl">{item.title}</h4>
          <p className="text-xs text-slate-500 leading-relaxed" dir="rtl">{item.description}</p>
        </div>
      ))}
    </div>
  </motion.div>
);


// ─── AI Recommendations ──────────────────────────────────

const RecommendationsSection: React.FC = () => {
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  const applyRecommendation = (id: string) => {
    setAppliedIds(prev => new Set(prev).add(id));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="bg-slate-900/40 border border-white/5 rounded-3xl p-6"
    >
      <div className="flex items-center justify-between gap-2 mb-6">
        <h3 className="text-sm font-black text-white flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-teal-400" />
          AI Smart Recommendations
          <AdminTooltip content="توصيات آلية مبنية على البيانات لتقليل التكلفة وزيادة النمو في المنصات الإعلانية." position="right" />
        </h3>
        <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 text-[9px] font-black border border-teal-500/20">
          {mockRecommendations.length} actions
        </span>
      </div>

      <div className="space-y-3">
        {mockRecommendations.map((rec: AIRecommendation) => {
          const isApplied = appliedIds.has(rec.id);
          return (
            <div
              key={rec.id}
              className={`p-4 rounded-2xl border transition-all ${
                isApplied
                  ? 'bg-teal-500/5 border-teal-500/20'
                  : 'bg-white/[0.02] border-white/[0.03] hover:border-white/[0.06]'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <ImpactBadge impact={rec.priority} />
                  <TypeBadge type={rec.type} />
                  <PlatformBadge platform={rec.platform} />
                </div>
              </div>
              <h4 className="text-sm font-bold text-white mb-1" dir="rtl">{rec.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed mb-3" dir="rtl">{rec.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-emerald-400/70 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {rec.expectedImpact}
                </span>
                <button
                  onClick={() => applyRecommendation(rec.id)}
                  disabled={isApplied}
                  className={`px-4 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                    isApplied
                      ? 'bg-teal-500/20 text-teal-400 cursor-default'
                      : 'bg-white/5 hover:bg-teal-500/20 text-white hover:text-teal-400'
                  }`}
                >
                  {isApplied ? (
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Applied</span>
                  ) : (
                    'Apply'
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};


// ─── Top Ads ─────────────────────────────────────────────

const TopAdsSection: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.6, duration: 0.4 }}
    className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 col-span-full"
  >
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-sm font-black text-white flex items-center gap-2">
        <Target className="w-4 h-4 text-rose-400" />
        Top Ads This Week
        <AdminTooltip content="أعلى الإعلانات أداءً لمعرفة المضمون (Creative) الذي يتردد صداه مع الجمهور الآن." position="right" />
      </h3>
      <span className="text-[9px] text-slate-500 font-mono">Analyze & Iterate</span>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {mockTopAds.map((ad: TopAd) => (
        <div key={ad.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.03] hover:border-white/[0.06] transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="text-sm font-bold text-white mb-1" dir="rtl">{ad.name}</h4>
              <PlatformBadge platform={ad.platform} />
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
              ad.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'
            }`}>
              {ad.status}
            </span>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div>
              <span className="text-[8px] text-slate-600 uppercase font-bold">Spend</span>
              <p className="text-xs font-bold text-white">{formatCurrency(ad.spend)}</p>
            </div>
            <div>
              <span className="text-[8px] text-slate-600 uppercase font-bold">Conv.</span>
              <p className="text-xs font-bold text-white">{ad.conversions}</p>
            </div>
            <div>
              <span className="text-[8px] text-slate-600 uppercase font-bold">CAC</span>
              <p className="text-xs font-bold text-amber-400">${ad.cac.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-[8px] text-slate-600 uppercase font-bold">ROAS</span>
              <p className="text-xs font-bold text-emerald-400">{ad.roas.toFixed(1)}x</p>
            </div>
          </div>

          {/* AI Suggestion */}
          <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
            <div className="flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-indigo-300 leading-relaxed" dir="rtl">{ad.suggestion}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </motion.div>
);


// ─── Connected Accounts ──────────────────────────────────

const ConnectedAccountsBar: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1, duration: 0.3 }}
    className="flex items-center gap-4 flex-wrap"
  >
    {mockConnectedAccounts.map(acc => (
      <div
        key={acc.platform}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 text-[10px]"
      >
        <span className={`w-2 h-2 rounded-full ${
          acc.status === 'connected' ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]' :
          acc.status === 'error' ? 'bg-rose-400' : 'bg-slate-500'
        }`} />
        <span className="font-bold text-slate-300">{PLATFORM_LABELS[acc.platform]}</span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-500 font-mono">{acc.accountId}</span>
      </div>
    ))}
    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-white/10 text-[10px] text-slate-500 hover:text-teal-400 hover:border-teal-500/30 transition-all">
      <Plug className="w-3 h-3" />
      ربط حساب جديد
    </button>
  </motion.div>
);


// ═══════════════════════════════════════════════════════════
// ─── MAIN COMPONENT ──────────────────────────────────────
// ═══════════════════════════════════════════════════════════

export const AdAnalyticsDashboard: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  return (
    <div className="space-y-8 p-2">
      {/* ── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-2">
            <BarChart3 className="w-7 h-7 text-teal-400" />
            Ad Analytics
          </h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-4">
            Cross-Platform Campaign Intelligence • AI-Powered Insights
          </p>
          <ConnectedAccountsBar />
        </div>

        <div className="flex items-center gap-3">
          <select className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-slate-300 appearance-none cursor-pointer hover:bg-white/10 transition-colors pr-8 focus:outline-none focus:border-teal-500/30">
            <option value="14d">آخر 14 يوم</option>
            <option value="7d">آخر 7 أيام</option>
            <option value="30d">آخر 30 يوم</option>
            <option value="90d">آخر 90 يوم</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 hover:border-teal-500/20 transition-all disabled:opacity-50"
          >
            <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── KPI Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={<DollarSign className="w-5 h-5" />}
          label="Total Spend"
          value={formatCurrency(mockKPIs.totalSpend)}
          change={mockKPIs.totalSpendChange}
          accentColor="#2DD4BF"
          delay={0}
          tooltip="حجم الإنفاق الإعلاني الإجمالي عبر جميع المنصات المربوطة."
        />
        <KPICard
          icon={<Users className="w-5 h-5" />}
          label="Combined CAC"
          value={`$${mockKPIs.combinedCAC.toFixed(2)}`}
          change={mockKPIs.cacChange}
          invertChange
          accentColor="#FB923C"
          delay={0.05}
          tooltip="تكلفة اكتساب العميل المدمجة (Customer Acquisition Cost) لكل المنصات. الأقل أفضل."
        />
        <KPICard
          icon={<TrendingUp className="w-5 h-5" />}
          label="ROAS"
          value={`${mockKPIs.roas.toFixed(1)}x`}
          change={mockKPIs.roasChange}
          accentColor="#34D399"
          delay={0.1}
          tooltip="العائد على الإنفاق الإعلاني (Return on Ad Spend). الرقم يعكس كل دولار أنفقته جاب كام مكانه."
        />
        <KPICard
          icon={<Target className="w-5 h-5" />}
          label="Conversions"
          value={formatNumber(mockKPIs.conversions)}
          change={mockKPIs.conversionsChange}
          accentColor="#818CF8"
          delay={0.15}
          tooltip="إجمالي التحويلات المؤكدة (تسجيلات/دفع) المنسوبة للإعلانات."
        />
      </div>

      {/* ── Performance Chart ─── */}
      <PerformanceChart />

      {/* ── Platform Table ─── */}
      <PlatformTable />

      {/* ── Analysis & Recommendations (2-col) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CACAnalysisSection />
        <RecommendationsSection />
      </div>

      {/* ── Top Ads ─── */}
      <TopAdsSection />

      {/* ── Data Source Note ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10"
      >
        <AlertTriangle className="w-4 h-4 text-amber-500/60" />
        <span className="text-[10px] text-amber-500/60 font-bold uppercase tracking-widest">
          Phase 1 — Mock Data • الربط الحقيقي مع APIs في المرحلة القادمة
        </span>
      </motion.div>
    </div>
  );
};
