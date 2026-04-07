import type { FC } from "react";
import { useState } from "react";
import { AlertTriangle, RefreshCw, TrendingUp, Zap, Target, ActivitySquare } from "lucide-react";
import { motion } from "framer-motion";
import { runCronReport } from "@/services/adminApi";
import { computeConsciousRevenueMetrics } from "@/services/consciousRevenueLink";
import type { WeeklyReport } from "@/types/admin.types";
import { AdminTooltip } from "./AdminTooltip";

interface RevenueEngineCardProps {
  data: WeeklyReport | null;
  loading: boolean;
  windowDays: 7 | 14 | 30;
  onWindowChange?: (days: 7 | 14 | 30) => void;
  onRefresh?: (days?: 7 | 14 | 30) => Promise<void> | void;
}

const Metric: FC<{ label: string; value: string | number; tone?: "default" | "good" | "warn"; hint?: string; delay?: number }> = ({
  label,
  value,
  tone = "default",
  hint,
  delay = 0
}) => {
  const toneClass =
    tone === "good" ? "text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]" 
    : tone === "warn" ? "text-rose-400 drop-shadow-[0_0_15px_rgba(251,113,133,0.8)]" 
    : "text-cyan-100 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]";

  const bgBorderClass = 
    tone === "good" ? "border-emerald-500/30 bg-emerald-950/20" 
    : tone === "warn" ? "border-rose-500/30 bg-rose-950/20" 
    : "border-cyan-500/20 bg-slate-900/60";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className={`rounded-2xl border ${bgBorderClass} p-5 transition-all duration-300 hover:bg-slate-900/80 hover:-translate-y-1 shadow-[0_0_20px_rgba(0,0,0,0.5)] group/metric relative overflow-hidden`}
    >
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 blur-2xl rounded-full opacity-0 group-hover/metric:opacity-100 transition-opacity duration-700" />
        <div className="flex items-center justify-between mb-3 relative z-10">
            <p className="text-[10px] md:text-xs uppercase font-black tracking-widest text-slate-400 group-hover/metric:text-white transition-colors">{label}</p>
            {hint && <AdminTooltip content={hint} position="bottom" />}
        </div>
        <p className={`text-3xl font-black tabular-nums transition-transform duration-500 group-hover/metric:scale-110 origin-left relative z-10 ${toneClass}`}>
          {value}
        </p>
    </motion.div>
  );
};

export const RevenueEngineCard: FC<RevenueEngineCardProps> = ({
  data,
  loading,
  windowDays,
  onWindowChange,
  onRefresh
}) => {
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="admin-glass-card rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-950/50 animate-pulse pointer-events-none" />
        <div className="h-6 w-48 rounded bg-slate-800/80 mb-6 relative z-10" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 relative z-10">
          <div className="h-24 rounded-xl bg-slate-800/50" />
          <div className="h-24 rounded-xl bg-slate-800/50" />
          <div className="h-24 rounded-xl bg-slate-800/50" />
          <div className="h-24 rounded-xl bg-slate-800/50" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const exposed = Number(data.affiliate?.linkExposed ?? 0);
  const clicked = Number(data.affiliate?.linkClicked ?? 0);
  const ctr = Number(data.affiliate?.ctr ?? 0);
  const variants = data.affiliate?.variants ?? [];
  const topMissions = data.affiliate?.topMissions ?? [];
  const gate7Critical = data.gate7?.status === "critical";
  const gate7InsufficientTraffic = data.gate7?.code === "gate7_insufficient_traffic";
  const consciousMetrics = data.consciousRevenue ?? computeConsciousRevenueMetrics(data);

  const handleRefreshWeekly = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncMessage(null);
    try {
      const result = await runCronReport("weekly");
      if (!result?.ok) {
        setSyncMessage("فشل توليد التقرير الأسبوعي.");
        return;
      }
      const generated = String(result.generatedAt ?? result.reportGeneratedAt ?? "").trim();
      if (generated) setLastGeneratedAt(generated);
      await onRefresh?.(windowDays);
      setSyncMessage("تم تحديث تقرير الربحية الأسبوعي.");
    } catch {
      setSyncMessage("تعذر الاتصال أثناء توليد التقرير.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="admin-glass-card rounded-3xl p-6 shadow-2xl border-indigo-500/10 relative overflow-hidden group">
      {/* Cinematic Ambient */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none opacity-50 transition-opacity duration-1000 group-hover:opacity-80" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none opacity-50 transition-opacity duration-1000" />

      <div className="relative z-10 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 rounded-xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500/10">
                <ActivitySquare className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-white leading-none mb-1 flex items-center gap-2">
                    مفاعلات التدفق (Revenue Engine)
                    <AdminTooltip
                        content="مفاعلات التدفق: تقيس حجم وسرعة الشحنات (الترافيك) الواردة عبر روابط الاستحواذ وتأثيرها على استقرار الخزانة."
                        position="left"
                    />
                </h3>
                <span className="text-[10px] text-slate-500 font-mono tracking-wider">
                    {lastGeneratedAt
                    ? new Date(lastGeneratedAt).toLocaleString("ar-EG")
                    : new Date(data.to).toLocaleDateString("ar-EG")}
                </span>
            </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-slate-900/60 p-1 shadow-inner">
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => onWindowChange?.(days as 7 | 14 | 30)}
                className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${
                  windowDays === days
                    ? "bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                {days} أيام
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleRefreshWeekly}
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-[11px] font-black text-indigo-300 transition-all hover:bg-indigo-500/20 hover:border-indigo-400/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin text-indigo-400" : ""}`} />
            {syncing ? "جاري المزامنة..." : "تحديث البيانات"}
          </button>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Metric 
            delay={0.1}
            label="نبضات الظهور" 
            value={exposed} 
            hint="عدد مرات ظهور رابط التسجيل للمستخدمين (Impressions)." 
        />
        <Metric 
            delay={0.2}
            label="شحنات النقر" 
            value={clicked} 
            hint="عدد مرات الضغط الفعلي على الرابط والدخول للانطلاق." 
        />
        <Metric 
            delay={0.3}
            label="كفاءة التدفق (CTR)" 
            value={`${ctr}%`} 
            tone={ctr > 0 ? "good" : "default"} 
            hint="نسبة النقر للظهور (Click-Through Rate). كلما زادت، زادت كفاءة الجذب." 
        />
        <Metric
          delay={0.4}
          label="رحلة 7 (عمر التدفق)"
          value={gate7Critical ? "وضع حرج" : "مستقر"}
          tone={gate7Critical ? "warn" : "good"}
          hint="مقياس يقيم استمرارية ضخ الزوار. الوضع الحرج ينذر بجفاف المصدر."
        />
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Top Missions */}
          {topMissions.length > 0 && (
            <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-5 backdrop-blur-sm" dir="rtl">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Target className="w-4 h-4 text-cyan-400" />
                    أعلى مسارات جذب
                </p>
                <AdminTooltip content="هنا بنشوف أكتر (مهام/محتوى) جابت ضغطات فعلية مقارنة بمرات الظهور، عشان نركّز على اللي بيجيب نتيجة." position="bottom" />
              </div>
              <div className="space-y-2">
                {topMissions.map((mission) => (
                  <div key={mission.missionKey} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3 hover:bg-slate-900 transition-colors">
                    <span className="text-[11px] text-slate-300 font-medium truncate pl-2">
                      {mission.missionLabel} <span className="text-slate-600 font-mono ml-1">[{mission.ring}]</span>
                    </span>
                    <span className="text-xs font-black font-mono text-cyan-400 flex items-center gap-2">
                        {mission.ctr}%
                        <span className="text-[10px] text-slate-500 font-normal">({mission.clicked})</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Gate-7 Status Block */}
            <div className={`rounded-2xl border p-5 relative overflow-hidden flex flex-col justify-center h-full min-h-[120px] ${gate7Critical ? 'bg-rose-500/10 border-rose-500/20 text-rose-100' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-100'}`} dir="rtl">
                <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        {gate7Critical ? <AlertTriangle className="h-4 w-4 text-rose-400" /> : <TrendingUp className="h-4 w-4 text-emerald-400" />}
                        <span className="text-xs font-black uppercase tracking-wider">حالة ضخ الزوار (Gate-7)</span>
                    </div>
                </div>
                {gate7Critical ? (
                    <p className="text-[11px] leading-relaxed opacity-90 font-medium">
                        لم يتم تسجيل أي <span className="text-rose-300 font-mono">path_started</span> استهلال للمسار خلال <span className="text-rose-300 font-mono">{data.gate7?.windowHours ?? 48}h</span> الماضية. (خطر التوقف).
                    </p>
                ) : gate7InsufficientTraffic ? (
                    <p className="text-[11px] leading-relaxed opacity-90 font-medium">
                        التدفق منخفض: أحداث 48 ساعة المقاسة <span className="text-emerald-300 font-mono">({Number(data.gate7?.trafficEvents48h ?? 0)})</span>، الحد الأدنى المطلوب هو <span className="font-mono">{Number(data.gate7?.minEvents48h ?? 20)}</span>.
                    </p>
                ) : (
                    <p className="text-[11px] leading-relaxed opacity-90 font-medium flex items-center gap-2">
                        استهلال المسار (48 ساعة): <span className="text-2xl font-black text-emerald-300 font-mono tracking-tighter">{Number(data.gate7?.pathStarted48h ?? 0)}</span>
                    </p>
                )}
            </div>
          </div>
      </div>

       {consciousMetrics && (
        <motion.div 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.5, duration: 0.6 }}
         className={`relative z-10 mt-4 rounded-3xl border p-6 transition-all outline-none ${
          consciousMetrics.status === "strong" ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-50 shadow-[0_0_30px_rgba(16,185,129,0.15)]" :
          consciousMetrics.status === "watch" ? "bg-amber-500/10 border-amber-500/40 text-amber-50 shadow-[0_0_30px_rgba(245,158,11,0.15)]" :
          "bg-rose-500/10 border-rose-500/40 text-rose-50 shadow-[0_0_30px_rgba(244,63,94,0.15)]"
        }`} dir="rtl">
           <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10 relative">
               <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-black/40 ${consciousMetrics.status === "strong" ? "text-emerald-400" : consciousMetrics.status === "watch" ? "text-amber-400" : "text-rose-400"}`}>
                       <Zap className={`w-6 h-6 drop-shadow-lg ${consciousMetrics.status === "strong" ? "animate-pulse" : ""}`} />
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest text-white drop-shadow-md">تناغم الوعي مع الخزانة</span>
                    <AdminTooltip content="هذا المقياس يربط ما بين عمق الوعي الذي يحققه المستخدم وقراره الفوري بضخ طاقة (شراء). استقراره يعني أن المنصة تصنع تأثيراً مباشراً وحقيقياً." position="bottom" />
               </div>
               <span className={`text-xs font-black uppercase tracking-[0.2em] px-4 py-1.5 bg-black/50 border rounded-xl drop-shadow-xl ${consciousMetrics.status === "strong" ? "border-emerald-500/50 text-emerald-400" : consciousMetrics.status === "watch" ? "border-amber-500/50 text-amber-400" : "border-rose-500/50 text-rose-400"}`}>
                   {consciousMetrics.status === "strong" ? "تدفق مستقر" : consciousMetrics.status === "watch" ? "اضطراب طفيف" : "جفاف حرج"}
               </span>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Metric delay={0.6} label="أفق الوعي" value={`${consciousMetrics.averageConsciousnessLevel}%`} tone={consciousMetrics.averageConsciousnessLevel >= 60 ? "good" : "default"} hint="متوسط وصول المستخدمين لنقاط الوعي داخل خرائطهم." />
                <Metric delay={0.7} label="إشارة الأرباح" value={`${consciousMetrics.revenueSignal}%`} tone={consciousMetrics.revenueSignal >= 40 ? "good" : "default"} hint="إشارة الاستجابات والقرارات الشرائية المسجلة." />
                <Metric delay={0.8} label="مدى التناغم" value={`${consciousMetrics.alignmentScore}%`} tone={consciousMetrics.alignmentScore >= 70 ? "good" : consciousMetrics.alignmentScore < 45 ? "warn" : "default"} hint="التوافق النهائي للصحة الربحية لتجربة الوعي." />
           </div>
           
           <p className="text-[11px] md:text-xs leading-relaxed opacity-90 font-medium bg-black/40 p-4 rounded-xl border border-white/5 mx-auto max-w-3xl text-center shadow-inner tracking-wide">
               {consciousMetrics.note}
           </p>
        </motion.div>
      )}

      {syncMessage && (
        <div className="relative z-10 mt-4 rounded-xl border border-white/10 bg-slate-900/80 p-3 text-xs text-slate-300 text-center font-bold tracking-wide" dir="rtl">
          {syncMessage}
        </div>
      )}
    </div>
  );
};
