import type { FC } from "react";
import { useEffect, useState } from "react";
import { Bot, AlertTriangle, ShieldCheck, Siren, Cpu } from "lucide-react";
import {
  getAIGuardrailSnapshot,
  subscribeAIGuardrail
} from "@/services/aiGuardrails";
import { AdminTooltip } from "./AdminTooltip";

export const AIGuardrailCard: FC = () => {
  const [snap, setSnap] = useState(getAIGuardrailSnapshot);

  useEffect(() => subscribeAIGuardrail(setSnap), []);

  const ui: { label: string; className: string; Icon: FC<{ className?: string }>; ambient: string; accent: string } =
    snap.status === "critical"
      ? { label: "خطر اقتصادي", className: "text-rose-100 bg-rose-500/20 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]", Icon: Siren, ambient: "bg-rose-500/10", accent: "text-rose-400" }
      : snap.status === "warning"
        ? { label: "تحذير استنزاف", className: "text-amber-100 bg-amber-500/20 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.3)]", Icon: AlertTriangle, ambient: "bg-amber-500/10", accent: "text-amber-400" }
        : { label: "استهلاك آمن", className: "text-teal-100 bg-teal-500/20 border-teal-500/40 shadow-[0_0_15px_rgba(20,184,166,0.3)]", Icon: ShieldCheck, ambient: "bg-teal-500/5", accent: "text-teal-400" };

  return (
    <div className={`admin-glass-card rounded-3xl border border-white/5 p-6 shadow-2xl relative overflow-hidden group transition-all duration-700 ${ui.ambient}`} dir="rtl">
      {/* Cinematic Ambient Glow */}
      <div className="absolute bottom-0 left-0 w-[200px] h-[200px] blur-[80px] rounded-full pointer-events-none opacity-50 bg-current text-white/10 group-hover:opacity-80 transition-opacity" />
      <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-slate-400/5 blur-[50px] rounded-full pointer-events-none opacity-50" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 border-b border-white/5 pb-4 relative z-10">
        <div className="flex items-start gap-4">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 shadow-lg ring-1 ring-white/5">
                <Cpu className="w-5 h-5 text-slate-300" />
            </div>
            <div>
                 <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-1">
                     حوكمة تكلفة الذكاء الاصطناعي
                     <AdminTooltip content="مراقب الاستنزاف الاقتصادي: يقيس تكلفة نداءات الـ API بتاعت المرايا وبيمنع حدوث هجمات تكبّدنا فاتورة خرافية بالغلط." position="bottom" />
                 </h3>
                 <span className="text-[10px] text-slate-500 font-mono tracking-wider flex items-center gap-2">
                     <Bot className="w-3 h-3 text-slate-400" />
                     LLM GUARDRAILS & BILLING
                 </span>
            </div>
        </div>
        
        <span className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-black uppercase tracking-widest backdrop-blur-md ${ui.className}`}>
            <ui.Icon className="w-4 h-4" />
            {ui.label}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs relative z-10 mb-4">
        <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-3 hover:bg-slate-900/80 transition-colors shadow-inner flex flex-col justify-center">
            <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">طلبات/دقيقة</p>
                <AdminTooltip content="عدد الرسائل اللي بتُرسل لـ OpenAI/Anthropic في الدقيقة الواحدة." position="bottom" />
            </div>
            <p className="text-xl font-black text-white tabular-nums drop-shadow-md">{snap.requests1m}</p>
        </div>
        
        <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-3 hover:bg-slate-900/80 transition-colors shadow-inner flex flex-col justify-center">
             <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">متوسط زمن</p>
                <AdminTooltip content="الـ AI بيرد للمستخدمين في كم ملي ثانية بالمتوسط؟ مهم جداً لمنع الـ Frustration." position="bottom" />
            </div>
            <p className="text-xl font-black text-white tabular-nums">{snap.avgLatencyMs1m}<span className="text-[8px] sm:text-[10px] font-mono text-slate-500 ml-1">MS</span></p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-3 hover:bg-slate-900/80 transition-colors shadow-inner flex flex-col justify-center">
             <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">Fallback/1M</p>
                <AdminTooltip content="عدد المرات اللي الـ AI وقع فيها والنظام رجع لردود جاهزة (قوالب) عشات التطبيق ميكراشش." position="bottom" />
            </div>
            <p className={`text-xl font-black tabular-nums transition-colors ${snap.fallbacks1m > 0 ? 'text-amber-400' : 'text-white'}`}>{snap.fallbacks1m}</p>
        </div>

        <div className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-3 hover:bg-teal-500/10 transition-colors shadow-inner flex flex-col justify-center relative overflow-hidden group/cost">
             <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-teal-400 to-transparent opacity-50 left-0" />
             <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] uppercase font-black tracking-widest text-teal-500/80">تكلفة اليوم</p>
                <AdminTooltip content="إجمالي التكلفة التقديرية (بالدولار) لعمليات الذكاء الاصطناعي النهاردة بس." position="bottom" />
            </div>
            <p className="text-xl font-black text-teal-400 tabular-nums drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]">${snap.totalCostUsdToday.toFixed(3)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-mono mb-4 relative z-10 px-1">
          <div className="flex items-center gap-2 justify-center bg-black/30 py-1.5 rounded-lg border border-white/5">
              <span className="text-slate-500">In-Flight:</span><span className="text-emerald-300 font-bold">{snap.inFlight}</span>
          </div>
          <div className="flex items-center gap-2 justify-center bg-black/30 py-1.5 rounded-lg border border-white/5">
              <span className="text-slate-500">Queued:</span><span className="text-amber-300 font-bold">{snap.queued}</span>
          </div>
          <div className="flex items-center gap-2 justify-center bg-black/30 py-1.5 rounded-lg border border-white/5">
              <span className="text-slate-500">Rate-Limited:</span><span className={`${snap.rateLimited1m > 0 ? 'text-rose-400' : 'text-slate-300'} font-bold`}>{snap.rateLimited1m}</span>
          </div>
          <div className="flex items-center gap-2 justify-center bg-black/30 py-1.5 rounded-lg border border-white/5">
              <span className="text-slate-500">Dropped:</span><span className={`${snap.queueDropped1m > 0 ? 'text-rose-400' : 'text-slate-300'} font-bold`}>{snap.queueDropped1m}</span>
          </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs relative z-10">
        <div className="rounded-2xl bg-black/40 border border-white/5 px-4 py-3 flex justify-between items-center group/bill">
            <div className="flex flex-col gap-1">
                <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5">
                    Metered Usage 
                    <AdminTooltip content="التكلفة الفعلية المحسوبة بدقة من التوكنز اللي رجعت في الـ API." position="top" />
                </p>
                <p className="text-sm font-black text-slate-300 font-mono">${snap.meteredCostUsdToday.toFixed(3)}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-white/5"><span className="text-[10px] text-slate-500">M</span></div>
        </div>
        <div className="rounded-2xl bg-black/40 border border-white/5 px-4 py-3 flex justify-between items-center group/bill">
             <div className="flex flex-col gap-1">
                <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5">
                    Estimated Cost
                    <AdminTooltip content="تكلفة افتراضية تحذيرية للحسابات اللي لسه مخلصتش رد عشان نلحق نوقف قبل ما الكارثة تحصل." position="top" />
                </p>
                <p className="text-sm font-black text-slate-300 font-mono">${snap.estimatedCostUsdToday.toFixed(3)}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-white/5"><span className="text-[10px] text-slate-500">E</span></div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-teal-500/50" />
           دقة القياس المالي للمرايا اليوم 
        </p>
        <div className="flex items-center gap-2">
            <span className="text-xs font-black text-teal-400 tabular-nums bg-teal-500/10 px-3 py-1 rounded-lg border border-teal-500/20">
                {snap.requestsToday > 0 ? Math.round((snap.meteredRequestsToday / snap.requestsToday) * 100) : 0}% 
            </span>
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-tight hidden sm:block">Coverage</span>
        </div>
      </div>
    </div>
  );
};
