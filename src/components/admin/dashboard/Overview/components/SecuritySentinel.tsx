import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ShieldAlert, ShieldCheck, LockConfig, Shield } from "lucide-react";
import {
  sendOwnerSecurityWebhook,
  type SecuritySignalsReport
} from "../../../../../services/adminApi";
import { sendNotification } from "../../../../../services/notifications";
import { soundManager } from "../../../../../services/soundManager";
import { AdminTooltip } from "./AdminTooltip";

interface SecuritySentinelProps {
  data: SecuritySignalsReport | null;
  loading: boolean;
}

interface SecurityAlertTimelineEntry {
  id: string;
  createdAt: string;
  status: SecuritySignalsReport["status"];
  webhookDelivered: boolean;
  authFailed15m: number;
  authRateLimited15m: number;
  adminErrors15m: number;
  warnings: string[];
}

const SECURITY_ALERT_TIMELINE_KEY = "dawayir-owner-security-alert-timeline";
const MAX_TIMELINE_ITEMS = 20;

export const SecuritySentinel: FC<SecuritySentinelProps> = ({ data, loading }) => {
  const [toast, setToast] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<SecurityAlertTimelineEntry[]>([]);
  const lastCriticalAlertAtRef = useRef(0);
  const prevStatusRef = useRef<SecuritySignalsReport["status"] | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(SECURITY_ALERT_TIMELINE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SecurityAlertTimelineEntry[];
      if (Array.isArray(parsed)) setTimeline(parsed.slice(0, MAX_TIMELINE_ITEMS));
    } catch {
      // noop
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(SECURITY_ALERT_TIMELINE_KEY, JSON.stringify(timeline.slice(0, MAX_TIMELINE_ITEMS)));
    } catch {
      // noop
    }
  }, [timeline]);

  useEffect(() => {
    if (!data) return;

    const wasStatus = prevStatusRef.current;
    prevStatusRef.current = data.status;
    const isTransitionToCritical = data.status === "critical" && wasStatus !== "critical";
    if (!isTransitionToCritical) return;

    const now = Date.now();
    const withinCooldown = now - lastCriticalAlertAtRef.current < 5 * 60_000;
    if (withinCooldown) return;
    lastCriticalAlertAtRef.current = now;

    const msg = "إنذار أمني لحظي: تم رصد هجوم/ثغرة داخل المنصة.";
    setToast(msg);
    window.setTimeout(() => setToast(null), 6000);

    soundManager.playError();
    void sendNotification({
      title: "إنذار أمني في لوحة الأونر",
      body: `الحالة الحرجة فعالة. محاولات فاشلة/15د: ${data.metrics.authFailed15m}`,
      tag: "owner-security-critical",
      requireInteraction: true
    });

    void (async () => {
      const webhookDelivered = await sendOwnerSecurityWebhook({
        generatedAt: data.generatedAt,
        status: data.status,
        warnings: data.warnings.slice(0, 5),
        metrics: data.metrics
      });

      const entry: SecurityAlertTimelineEntry = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
        status: data.status,
        webhookDelivered,
        authFailed15m: data.metrics.authFailed15m,
        authRateLimited15m: data.metrics.authRateLimited15m,
        adminErrors15m: data.metrics.adminErrors15m,
        warnings: data.warnings.slice(0, 3)
      };
      setTimeline((prev) => [entry, ...prev].slice(0, MAX_TIMELINE_ITEMS));
    })();
  }, [data]);

  if (loading) {
    return (
      <div className="admin-glass-card animate-pulse space-y-4 w-full p-6 rounded-3xl border border-white/5">
         <div className="h-16 bg-slate-900/40 rounded-2xl" />
         <div className="h-32 bg-slate-900/40 rounded-2xl" />
      </div>
    );
  }

  if (!data) return null;

  const ui =
    data.status === "critical"
      ? { title: "خطر أمني", className: "text-rose-100 bg-rose-500/20 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]", Icon: ShieldAlert, ambient: "bg-rose-500/10", glow: "from-rose-500/50" }
      : data.status === "warning"
        ? { title: "تحذير أمني", className: "text-amber-100 bg-amber-500/20 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.3)]", Icon: AlertTriangle, ambient: "bg-amber-500/10", glow: "from-amber-500/50" }
        : { title: "درع الأمن مستقر", className: "text-indigo-100 bg-indigo-500/20 border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.3)]", Icon: ShieldCheck, ambient: "bg-indigo-500/5", glow: "from-indigo-500/50" };

  return (
    <div className={`admin-glass-card rounded-3xl border border-white/5 p-6 shadow-2xl relative overflow-hidden group transition-all duration-700 ${ui.ambient}`} dir="rtl">
      {/* Ambient background matching status */}
      <div className={`absolute top-0 right-0 w-[200px] h-[200px] blur-[80px] rounded-full pointer-events-none opacity-50 bg-current text-white/10 group-hover:opacity-80 transition-opacity`} />
      <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${ui.glow} to-transparent opacity-50`} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 border-b border-white/5 pb-4 relative z-10">
        <div className="flex items-start gap-4">
            <div className={`p-3 bg-slate-900 rounded-xl border border-slate-700 shadow-lg ring-1 ring-white/5 relative overflow-hidden`}>
                <div className={`absolute inset-0 ${ui.ambient} opacity-50`} />
                <Shield className="w-5 h-5 text-slate-300 relative z-10" />
            </div>
            <div>
                 <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-1">
                     الحارس الأمني (Sentinel)
                     <AdminTooltip content="مراقب داخلي للبيئة الأمنية. بيكشف لو حد بيحاول يعمل هجوم (Brute-force) على تسجيل الدخول، أو لو فيه أخطاء إدارية خطيرة في قاعدة البيانات." position="bottom" />
                 </h3>
                 <span className="text-[10px] text-slate-500 font-mono tracking-wider flex items-center gap-2">
                     THREAT DETECTION RADAR
                 </span>
            </div>
        </div>
        
        <span className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-black uppercase tracking-widest backdrop-blur-md ${ui.className}`}>
            <ui.Icon className="w-4 h-4" />
            {ui.title}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs relative z-10 mb-4">
        <div className="rounded-2xl bg-slate-900/60 p-4 border border-white/5 hover:bg-slate-900/80 transition-colors shadow-inner flex flex-col justify-center gap-1">
            <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">فشل دخول (15M)</p>
                <AdminTooltip content="عدد محاولات تسجيل الدخول الخاطئة بالرقم/الايميل في آخر ربع ساعة." position="bottom" />
            </div>
            <p className={`text-2xl font-black tabular-nums transition-colors ${data.metrics.authFailed15m > 5 ? 'text-amber-400' : 'text-white'}`}>{data.metrics.authFailed15m}</p>
        </div>
        
        <div className="rounded-2xl bg-slate-900/60 p-4 border border-white/5 hover:bg-slate-900/80 transition-colors shadow-inner flex flex-col justify-center gap-1">
            <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">حظر تلقائي (15M)</p>
                <AdminTooltip content="عدد الحسابات أو الـ IPs اللي السيرفر عملها بلوك مؤقت بسبب الهجوم." position="bottom" />
            </div>
            <p className={`text-2xl font-black tabular-nums transition-colors ${data.metrics.authRateLimited15m > 0 ? 'text-rose-400' : 'text-white'}`}>{data.metrics.authRateLimited15m}</p>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-2xl bg-slate-900/60 p-4 border border-white/5 hover:bg-slate-900/80 transition-colors shadow-inner flex flex-col justify-center gap-1">
             <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">أخطاء الصلاحيات</p>
                <AdminTooltip content="عدد المرات اللى في حد بيحاول يدخل على داتا بتاعت حد تاني." position="bottom" />
            </div>
            <p className={`text-2xl font-black tabular-nums transition-colors ${data.metrics.adminErrors15m > 0 ? 'text-rose-400' : 'text-white'}`}>{data.metrics.adminErrors15m}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          {/* Config Status */}
          <div className="rounded-2xl bg-black/30 border border-white/5 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                 <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5 hover:text-white transition-colors">
                     حالة الإعدادات السيادية <AdminTooltip content="المركز بيفحص إعدادات السيرفر نفسه (Tokens & Secrets) للتأكد إنها مش مكشوفة." position="top" />
                 </span>
            </div>
            <div className="space-y-2 text-[11px] font-mono">
                <div className="flex justify-between items-center"><span className="text-slate-400">Admin Secret:</span><span className={data.config.adminSecretStrong ? "text-emerald-400" : "text-rose-400 font-bold bg-rose-500/20 px-1 rounded"}>{data.config.adminSecretStrong ? "STRONG" : "WEAK"}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-400">Service Role:</span><span className={data.config.serviceRoleConfigured ? "text-emerald-400" : "text-rose-400 font-bold bg-rose-500/20 px-1 rounded"}>{data.config.serviceRoleConfigured ? "SECURE" : "EXPOSED"}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-400">HTTPS Transport:</span><span className={data.config.secureTransportConfigured ? "text-emerald-400" : "text-amber-400 font-bold bg-amber-500/20 px-1 rounded"}>{data.config.secureTransportConfigured ? "ACTIVE" : "INACTIVE"}</span></div>
            </div>
          </div>

          {/* Timeline and Warnings */}
          <div className="rounded-2xl bg-black/30 border border-white/5 p-4 flex flex-col justify-between h-48">
              <div className="flex items-center justify-between mb-2">
                 <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5 hover:text-white transition-colors">
                     سجل الإنذارات الحية <AdminTooltip content="سجل بآخر الثغرات/الإنذارات اللي النظام رصدها وأرسل بيها Webhook." position="top" />
                 </span>
             </div>
             
             {data.warnings.length > 0 && (
                <div className="mb-2 pb-2 border-b border-white/5">
                {data.warnings.slice(0, 2).map((w, i) => (
                    <p key={`${i}-${w}`} className="text-[10px] text-amber-300/90 leading-relaxed font-bold">• {w}</p>
                ))}
                </div>
            )}

             {timeline.length === 0 ? (
                 <div className="flex-1 flex items-center justify-center border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                     <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">لا يوجد إنذارات مسجلة</p>
                 </div>
             ) : (
                <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                    {timeline.map((item) => (
                    <div key={item.id} className="rounded-xl border border-white/5 bg-slate-900/60 px-3 py-2 text-[10px]">
                        <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${item.status === "critical" ? "text-rose-100 bg-rose-500/20" : item.status === "warning" ? "text-amber-100 bg-amber-500/20" : "text-emerald-100 bg-emerald-500/20"}`}>
                            {item.status === "critical" ? "خطر" : item.status === "warning" ? "تحذير" : "آمن"}
                        </span>
                        <span className="text-slate-500 font-mono tracking-tighter">{new Date(item.createdAt).toLocaleTimeString("ar-EG")}</span>
                        </div>
                        <p className="text-slate-400 font-mono text-[9px]">
                        wh: {item.webhookDelivered ? "sent" : "fail"} | f: {item.authFailed15m} | r: {item.authRateLimited15m}
                        </p>
                    </div>
                    ))}
                </div>
             )}
          </div>
      </div>

      {/* Emergency Toast Overlay */}
      {toast && (
        <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 rounded-xl border border-rose-400/50 bg-rose-950/90 px-6 py-3 text-sm font-black text-rose-100 shadow-[0_0_30px_rgba(244,63,94,0.5)] backdrop-blur-xl z-50 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <Siren className="w-5 h-5 text-rose-400 animate-pulse" />
          {toast}
        </div>
      )}
    </div>
  );
};
