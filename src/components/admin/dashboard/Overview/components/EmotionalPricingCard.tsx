import type { FC } from "react";
import { useEffect, useState } from "react";
import { Gift, PercentCircle, TrendingUp, Sparkles } from "lucide-react";
import {
  getEmotionalPricingStats,
  type EmotionalPricingStats,
} from "@/services/emotionalPricingAnalytics";
import { AdminTooltip } from "./AdminTooltip";

interface EmotionalPricingCardProps {
  loading: boolean;
}

const emptyStats: EmotionalPricingStats = {
  giftsGrantedCount: 0,
  discountOffersCount: 0,
  conversionRatePercent: 0,
};

const Kpi: FC<{ title: string; value: string; icon: FC<{ className?: string }>; hint: string }> = ({
  title,
  value,
  icon: Icon,
  hint
}) => (
  <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-5 hover:bg-slate-900/60 transition-colors shadow-inner group/kpi relative overflow-hidden">
    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-2xl rounded-full opacity-0 group-hover/kpi:opacity-100 transition-opacity pointer-events-none" />
    
    <div className="mb-3 flex items-center justify-between text-slate-400">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-amber-400 group-hover/kpi:scale-110 transition-transform" />
        <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
      </div>
      <AdminTooltip content={hint} position="bottom" />
    </div>
    <p className="text-3xl font-black text-white tabular-nums drop-shadow-md group-hover/kpi:text-amber-100 transition-colors">{value}</p>
  </div>
);

export const EmotionalPricingCard: FC<EmotionalPricingCardProps> = ({ loading }) => {
  const [stats, setStats] = useState<EmotionalPricingStats>(emptyStats);

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      const liveStats = await getEmotionalPricingStats();
      if (mounted) setStats(liveStats);
    };
    refresh();
    const timer = window.setInterval(refresh, 20_000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  if (loading) {
    return <div className="h-48 animate-pulse rounded-3xl bg-slate-900/40 border border-white/5" />;
  }

  return (
    <div className="admin-glass-card rounded-3xl border border-amber-500/10 bg-slate-950/60 p-6 shadow-2xl relative overflow-hidden group">
      {/* Cinematic Ambient Glow */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-amber-500/10 blur-[100px] rounded-full pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity duration-1000" />
      <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-rose-500/5 blur-[80px] rounded-full pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity duration-1000" />
        
      <div className="relative z-10 mb-6 flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 rounded-xl border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-white/5">
                <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-white leading-none mb-1 flex items-center gap-2">
                    التسعير العاطفي (Emotional Pricing)
                    <AdminTooltip 
                        content="نظام التسعير العاطفي: يقرأ حالة المستخدم ومستوى وعيه الحرج وقت الدفع (Friction) ويقدم له عروض إنقاذ (خصومات/هدايا) لمنع تسربه من الرحلة." 
                        position="left" 
                    />
                </h3>
                <span className="text-[10px] text-slate-500 font-mono tracking-wider">
                    نظام الإنقاذ الديناميكي (DYNAMIC RESCUE SYSTEM)
                </span>
            </div>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Kpi 
            title="بطاقات مجانية" 
            value={stats.giftsGrantedCount.toLocaleString("ar-EG")} 
            icon={Gift} 
            hint="عدد المرات التي استنجد فيها النظام بمنح بطاقات مجانية (Gifts) لإنقاذ أشخاص في حالة حزن/غضب شديد ولم يقدروا على الدفع."
        />
        <Kpi
          title="خصومات ذكية"
          value={stats.discountOffersCount.toLocaleString("ar-EG")}
          icon={PercentCircle}
          hint="عدد الخصومات الديناميكية (Dynamic Discounts) التي ظهرت لمن واجهوا عقبة مالية بسيطة وظهرت عليهم علامات التردد."
        />
        <Kpi 
            title="نسبة التحويل" 
            value={`${stats.conversionRatePercent}%`} 
            icon={TrendingUp} 
            hint="معدل نجاح العروض العاطفية في تحويل المترددين إلى دافعين/مسجلين فعليين بالرحلة."
        />
      </div>
    </div>
  );
};
