import type { FC } from "react";
import { useEffect, useState } from "react";
import { Gift, PercentCircle, TrendingUp } from "lucide-react";
import {
  getEmotionalPricingStats,
  type EmotionalPricingStats,
} from "../../../../../services/emotionalPricingAnalytics";

interface EmotionalPricingCardProps {
  loading: boolean;
}

const emptyStats: EmotionalPricingStats = {
  giftsGrantedCount: 0,
  discountOffersCount: 0,
  conversionRatePercent: 0,
};

const Kpi: FC<{ title: string; value: string; icon: FC<{ className?: string }> }> = ({
  title,
  value,
  icon: Icon,
}) => (
  <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
    <div className="mb-2 flex items-center gap-2 text-slate-300">
      <Icon className="h-4 w-4 text-teal-400" />
      <span className="text-xs font-bold uppercase tracking-wide">{title}</span>
    </div>
    <p className="text-2xl font-black text-white tabular-nums">{value}</p>
  </div>
);

export const EmotionalPricingCard: FC<EmotionalPricingCardProps> = ({ loading }) => {
  const [stats, setStats] = useState<EmotionalPricingStats>(emptyStats);

  useEffect(() => {
    const refresh = () => setStats(getEmotionalPricingStats());
    refresh();
    const timer = window.setInterval(refresh, 20_000);
    return () => window.clearInterval(timer);
  }, []);

  if (loading) {
    return <div className="h-36 animate-pulse rounded-2xl bg-slate-900/40" />;
  }

  return (
    <div className="admin-glass-card rounded-2xl border border-white/5 bg-slate-950/30 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-[0.15em] text-slate-200">
          Emotional Pricing
        </h3>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Owner KPI
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Kpi title="Gifts Granted" value={stats.giftsGrantedCount.toLocaleString("en-US")} icon={Gift} />
        <Kpi
          title="Discount Offers"
          value={stats.discountOffersCount.toLocaleString("en-US")}
          icon={PercentCircle}
        />
        <Kpi title="Conversion Rate" value={`${stats.conversionRatePercent}%`} icon={TrendingUp} />
      </div>
    </div>
  );
};
