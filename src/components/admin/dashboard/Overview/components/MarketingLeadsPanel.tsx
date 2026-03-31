import type { FC } from "react";
import { BarChart3, Target, Users } from "lucide-react";
import type { OverviewStats } from "../../../../../services/adminApi";
import { AdminTooltip } from "./AdminTooltip";

type MarketingLeadsStats = NonNullable<OverviewStats["marketingLeads"]>;

interface MarketingLeadsPanelProps {
  data: MarketingLeadsStats | null | undefined;
  loading: boolean;
}

const fmtPct = (value: number | null | undefined): string => {
  if (value == null || Number.isNaN(value)) return "-";
  return `${value}%`;
};

const EmptyList = ({ label }: { label: string }) => (
  <div className="flex items-center justify-center p-4 border border-dashed border-slate-800 rounded-xl bg-slate-900/40">
      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{label}</p>
  </div>
);

const BreakdownList = ({
  items,
  emptyLabel,
  valueClassName,
  fallbackKey
}: {
  items: Array<{ key: string; count: number }>;
  emptyLabel: string;
  valueClassName: string;
  fallbackKey: string;
}) => {
  if (items.length === 0) {
    return <EmptyList label={emptyLabel} />;
  }

  return (
    <div className="space-y-1.5 pt-1">
      {items.map((item) => (
        <div
          key={`${fallbackKey}-${item.key || "empty"}`}
          className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-950/60 px-4 py-2 hover:bg-slate-900/80 transition-colors group/item relative overflow-hidden"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/5 group-hover/item:w-full transition-all duration-500 ease-out z-0" />
          <span className="text-[11px] text-slate-300 font-medium relative z-10 font-sans">{item.key || fallbackKey}</span>
          <span className={`text-xs font-black font-mono relative z-10 px-2 py-0.5 rounded-lg bg-black/40 ${valueClassName}`}>
              {item.count}
          </span>
        </div>
      ))}
    </div>
  );
};

export const MarketingLeadsPanel: FC<MarketingLeadsPanelProps> = ({ data, loading }) => {
  if (loading) {
    return <div className="mb-6 h-64 animate-pulse rounded-3xl bg-slate-900/30 border border-white/5" />;
  }

  if (!data) {
    return (
      <div className="admin-glass-card mb-6 rounded-3xl border-slate-800 bg-slate-950/40 p-10 flex flex-col items-center justify-center text-center">
        <Users className="w-8 h-8 text-slate-600 mb-2 opacity-50" />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">لا توجد داتا (Leads) متاحة للمزامنة.</p>
      </div>
    );
  }

  const topSources = data.bySource.slice(0, 5);
  const topSourceTypes = data.bySourceType.slice(0, 4);
  const topStatuses = data.byStatus.slice(0, 4);
  const topCampaigns = data.byCampaign.slice(0, 5);
  const peakDaily = data.dailyTrend.reduce((max, day) => Math.max(max, day.count), 0);

  return (
    <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2" dir="ltr">
      
      {/* Leads Engine Matrix */}
      <div className="admin-glass-card rounded-3xl border-teal-500/10 bg-slate-950/60 p-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity" />
        
        <div className="relative z-10 mb-6 flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 rounded-xl border border-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.15)] ring-1 ring-white/5">
                <Target className="h-5 w-5 text-teal-400" />
            </div>
            <div>
                 <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none mb-1 flex items-center gap-2">
                     Leads Engine
                     <AdminTooltip content="محرك العملاء: يحلل من أين يأتي الزوار الجدد (Social, Direct, Organic) والشرائح الخاصة بهم." position="right" />
                 </h3>
                 <span className="text-[10px] text-slate-500 font-mono tracking-wider">ACQUISITION FUNNEL</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 mb-6 grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Total Matrix</p>
                <AdminTooltip content="كل الزوار اللي قدرنا نرصدهم كـ (Leads) محتملين لحد دلوقتي." position="bottom" />
            </div>
            <p className="text-3xl font-black text-white tabular-nums drop-shadow-md">{data.total.toLocaleString("ar-EG")}</p>
          </div>
          <div className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-4 relative overflow-hidden shadow-inner">
            <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-widest text-teal-500 font-black">Pulse (24h)</p>
                <AdminTooltip content="زخم الـ 24 ساعة اللي فاتت، لو الرقم قل فجأة يبقى فيه هبوط في الترافيك." position="bottom" />
            </div>
            <p className="text-3xl font-black text-teal-400 drop-shadow-[0_0_12px_rgba(45,212,191,0.5)] tabular-nums">{data.last24h.toLocaleString("ar-EG")}</p>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-1 gap-4 mt-6 border-t border-white/5 pt-4">
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-600" /> Top Sources</p>
                  <AdminTooltip content="أعلى منصات جابت تواصل (مثلا تيك توك، انستجرام، جوجل)." position="left" />
              </div>
              <BreakdownList items={topSources} emptyLabel="NO SOURCES" valueClassName="text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.3)]" fallbackKey="direct" />
            </div>

            <div className="mt-2 grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-600" /> Source Types</p>
                  <AdminTooltip content="تصنيف المصادر (Social, Organic Search, Referral). بيسهل نعرف جهدنا رايح فين." position="left" />
              </div>
              <BreakdownList items={topSourceTypes} emptyLabel="NO TYPES" valueClassName="text-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.3)]" fallbackKey="website" />
            </div>
        </div>
      </div>

      {/* Conversion Nexus */}
      <div className="admin-glass-card rounded-3xl border-indigo-500/10 bg-slate-950/60 p-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity" />
        
        <div className="relative z-10 mb-6 flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 rounded-xl border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)] ring-1 ring-white/5">
                <BarChart3 className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
                 <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none mb-1 flex items-center gap-2">
                     Conversion Nexus
                     <AdminTooltip content="جودة التحويل: هل الزوار الجداد بيخشوا الرحلة بجد، ولا مجرد كليك وبيمشوا؟" position="left" />
                 </h3>
                 <span className="text-[10px] text-slate-500 font-mono tracking-wider">LEAD TRAJECTORY</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 mb-6 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-3 flex flex-col items-center justify-center relative overflow-hidden group/box">
            <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-slate-400 to-transparent opacity-50" />
            <p className="text-[10px] sm:text-xs font-black uppercase text-slate-500 mb-1 flex items-center gap-1">
                Start Rate
                <AdminTooltip content="نسبة الزوار اللي ضغطوا (انطلق) من إجمالي الزيارات." position="bottom" />
            </p>
            <p className="text-xl sm:text-2xl font-black text-white tabular-nums">{fmtPct(data.conversion.startClickRatePct)}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-3 flex flex-col items-center justify-center relative overflow-hidden group/box">
            <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50" />
            <p className="text-[10px] sm:text-xs font-black uppercase text-cyan-500/70 mb-1 flex items-center gap-1">
                Pulse Rate
                <AdminTooltip content="نسبة الزوار اللي خلصوا (فحص النبض) بنجاح والمزاج بتاعهم اتحدد." position="bottom" />
            </p>
            <p className="text-xl sm:text-2xl font-black text-cyan-400 tabular-nums drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">{fmtPct(data.conversion.pulseCompletedRatePct)}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-3 flex flex-col items-center justify-center relative overflow-hidden group/box">
            <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-50" />
            <p className="text-[10px] sm:text-xs font-black uppercase text-emerald-500/70 mb-1 flex items-center gap-1">
                Map Rate
                <AdminTooltip content="نسبة اللي قدروا يوصلوا لمراحل متقدمة ويكوّنوا عيلتهم او يضيفوا شخص." position="bottom" />
            </p>
            <p className="text-xl sm:text-2xl font-black text-emerald-400 tabular-nums drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">{fmtPct(data.conversion.mapCreatedRatePct)}</p>
          </div>
        </div>

        <div className="relative z-10 mb-6 bg-slate-900/40 p-5 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                  Daily Trend (14D)
              </p>
              <AdminTooltip content="مؤشر لتذبذب دخول الـ Leads اليومي لآخر أسبوعين. العمود الأعلى يعني يوم حققنا فيه Viral Peak." position="left" />
          </div>
          <div className="flex h-16 items-end gap-1.5 w-full">
            {data.dailyTrend.map((point) => {
              const height = peakDaily > 0 ? Math.max(8, (point.count / peakDaily) * 100) : 8;
              const isPeak = point.count === peakDaily && peakDaily > 0;
              return (
                <div
                  key={point.date}
                  title={`${point.date}: ${point.count}`}
                  className={`flex-1 rounded-t-sm transition-all duration-500 hover:bg-white hover:shadow-[0_0_10px_white] ${isPeak ? 'bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.6)]' : 'bg-slate-700/60 hover:bg-slate-500'}`}
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-1 gap-4 border-t border-white/5 pt-4">
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-600" /> Top Campaigns</p>
                  <AdminTooltip content="الحملات المربوطة بـ UTM Links (لو إنت عامل كامبين إعلاني متسمية، هتظهر نتايجها هنا)." position="left" />
              </div>
              <BreakdownList items={topCampaigns} emptyLabel="NO CAMPAIGNS" valueClassName="text-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.3)]" fallbackKey="unknown" />
            </div>

            <div className="mt-2 grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-600" /> Lead Status</p>
                  <AdminTooltip content="تصنيف الـ CRM الداخلي لمراحل الشراء (سخن، متردد، جديد)." position="left" />
              </div>
              <BreakdownList items={topStatuses} emptyLabel="NO STATUS" valueClassName="text-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.3)]" fallbackKey="new" />
            </div>
        </div>
      </div>
    </div>
  );
};
