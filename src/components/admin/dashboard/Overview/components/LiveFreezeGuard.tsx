import type { FC } from "react";
import { useEffect, useState } from "react";
import { AlertTriangle, ShieldCheck, Siren, Activity } from "lucide-react";
import {
  getPerformanceWatchdogSnapshot,
  startPerformanceWatchdog,
  subscribePerformanceWatchdog,
  type WatchdogSnapshot
} from "@/services/performanceWatchdog";
import { AdminTooltip } from "./AdminTooltip";

const fmtTime = (ts: number | null): string => {
  if (!ts) return "لا يوجد";
  return new Date(ts).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
};

export const LiveFreezeGuard: FC = () => {
  const [snap, setSnap] = useState<WatchdogSnapshot>(getPerformanceWatchdogSnapshot);

  useEffect(() => {
    startPerformanceWatchdog();
    return subscribePerformanceWatchdog(setSnap);
  }, []);

  const statusUi =
    snap.status === "critical"
      ? { label: "حرج جداً (خطر الإغلاق)", className: "text-rose-100 bg-rose-500/20 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]", Icon: Siren, ambient: "bg-rose-500/10" }
      : snap.status === "warning"
        ? { label: "تحذير (محاولات تجميد)", className: "text-amber-100 bg-amber-500/20 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.3)]", Icon: AlertTriangle, ambient: "bg-amber-500/5" }
<<<<<<< HEAD
        : { label: "مستقر استقرار سيادي", className: "text-emerald-100 bg-emerald-500/20 border-emerald-500/40 shadow-[0_0_15px_rgba(52,211,153,0.3)]", Icon: ShieldCheck, ambient: "bg-emerald-500/5" };
=======
        : { label: "مستقر تماماً", className: "text-emerald-100 bg-emerald-500/20 border-emerald-500/40 shadow-[0_0_15px_rgba(52,211,153,0.3)]", Icon: ShieldCheck, ambient: "bg-emerald-500/5" };
>>>>>>> feat/sovereign-final-stabilization

  return (
    <div className={`admin-glass-card rounded-3xl border border-white/5 p-6 shadow-2xl relative overflow-hidden group transition-all duration-700 ${statusUi.ambient}`}>
      {/* Ambient background matching status */}
      <div className="absolute top-0 right-0 w-[200px] h-[200px] blur-[80px] rounded-full pointer-events-none opacity-50 transition-opacity bg-current text-white/10 group-hover:opacity-80 mix-blend-screen" />
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 border-b border-white/5 pb-4 relative z-10">
        <div className="flex items-start gap-4">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 shadow-lg ring-1 ring-white/5">
                <Activity className="w-5 h-5 text-slate-300" />
            </div>
            <div>
                 <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-1">
                     مراقب التهنيج اللحظي
                     <AdminTooltip content="مراقب داخلي (Watchdog) بيشيك على المعالج بتاع البراوزر كل دقيقة. لو حسّ إن التطبيق هنّج أو فيه بطء شديد، بيضرب إنذار هنا." position="bottom" />
                 </h3>
                 <span className="text-[10px] text-slate-500 font-mono tracking-wider flex items-center gap-2">
                     FRONTEND PERFORMANCE MONITOR
                 </span>
            </div>
        </div>
        
        <span className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-black uppercase tracking-widest backdrop-blur-md ${statusUi.className}`}>
            <statusUi.Icon className="w-4 h-4" />
            {statusUi.label}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-xs relative z-10">
        <div className="rounded-2xl bg-slate-900/60 p-3 border border-white/5 hover:bg-slate-900/80 transition-colors shadow-inner flex flex-col justify-center">
            <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">Avg Lag</p>
                <AdminTooltip content="متوسط التأخير اللي بيحصل في استجابة الأزرار أو التفاعلات (Latency)." position="bottom" />
            </div>
            <p className="text-xl font-black text-white tabular-nums">{snap.avgLagMs}<span className="text-[8px] sm:text-[10px] font-mono text-slate-500 ml-1">MS</span></p>
        </div>
        
        <div className="rounded-2xl bg-slate-900/60 p-3 border border-white/5 hover:bg-slate-900/80 transition-colors shadow-inner flex flex-col justify-center">
            <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">P95 Lag</p>
                <AdminTooltip content="تأخير أسوأ 5% من الحالات (عشان نضمن إن محدش بيتظلم بجهاز ضعيف)." position="bottom" />
            </div>
            <p className="text-xl font-black text-white tabular-nums drop-shadow-md">{snap.p95LagMs}<span className="text-[8px] sm:text-[10px] font-mono text-slate-500 ml-1">MS</span></p>
        </div>
        
        <div className="rounded-2xl bg-slate-900/60 p-3 border border-white/5 hover:bg-slate-900/80 transition-colors shadow-inner flex flex-col justify-center">
            <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">L.Tasks (1M)</p>
                <AdminTooltip content="عدد المهام الثقيلة جداً (أكثر من 50 ملي ثانية) اللي عطلّت الجهاز في آخر دقيقة." position="bottom" />
            </div>
            <p className={`text-xl font-black tabular-nums transition-colors ${snap.longTasks1m > 10 ? 'text-rose-400' : 'text-white'}`}>{snap.longTasks1m}</p>
        </div>
        
        <div className="rounded-2xl bg-slate-900/60 p-3 border border-white/5 hover:bg-slate-900/80 transition-colors shadow-inner flex flex-col justify-center">
            <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">Freezes (1M)</p>
                <AdminTooltip content="حالات التجميد الكامل الشاشة (اللي خلت التطبيق مبيتحركش كلياً)." position="bottom" />
            </div>
            <p className={`text-xl font-black tabular-nums transition-colors ${snap.freezes1m > 0 ? 'text-rose-500' : 'text-emerald-400'}`}>{snap.freezes1m}</p>
        </div>

        <div className="col-span-2 lg:col-span-1 border border-white/5 p-3 rounded-2xl flex flex-col justify-center items-center text-center bg-slate-900/30">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1.5 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-500" /> آخر رصد تجمد</p>
            <p className="text-xs font-black font-mono text-slate-300 px-2 py-1 bg-black/40 rounded-lg">{fmtTime(snap.lastFreezeAt)}</p>
        </div>
      </div>
    </div>
  );
};
