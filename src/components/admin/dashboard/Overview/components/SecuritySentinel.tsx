import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react";
import {
  sendOwnerSecurityWebhook,
  type SecuritySignalsReport
} from "../../../../../services/adminApi";
import { sendNotification } from "../../../../../services/notifications";
import { soundManager } from "../../../../../services/soundManager";

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

    const msg = "إنذار أمني لحظي: تم رصد ثغرة/مؤشر خطر داخل المنصة.";
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
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
        <p className="text-xs text-slate-400">جاري فحص إشارات الأمان...</p>
      </div>
    );
  }

  if (!data) return null;

  const ui =
    data.status === "critical"
      ? { title: "خطر أمني", className: "text-rose-300 bg-rose-500/15 border-rose-500/40", Icon: ShieldAlert }
      : data.status === "warning"
        ? { title: "تحذير أمني", className: "text-amber-200 bg-amber-500/15 border-amber-500/40", Icon: AlertTriangle }
        : { title: "آمن", className: "text-emerald-200 bg-emerald-500/15 border-emerald-500/40", Icon: ShieldCheck };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 space-y-4 relative">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-white">الحارس الأمني</h3>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-black ${ui.className}`}>
          <ui.Icon className="w-3 h-3" />
          {ui.title}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
        <div className="rounded-xl bg-black/20 border border-white/5 px-3 py-2">
          <p className="text-slate-500">محاولات فاشلة / 15د</p>
          <p className="text-white font-bold">{data.metrics.authFailed15m}</p>
        </div>
        <div className="rounded-xl bg-black/20 border border-white/5 px-3 py-2">
          <p className="text-slate-500">محاولات محظورة / 15د</p>
          <p className="text-white font-bold">{data.metrics.authRateLimited15m}</p>
        </div>
        <div className="rounded-xl bg-black/20 border border-white/5 px-3 py-2">
          <p className="text-slate-500">أخطاء Admin API / 15د</p>
          <p className="text-white font-bold">{data.metrics.adminErrors15m}</p>
        </div>
      </div>

      <div className="rounded-xl bg-black/20 border border-white/5 px-3 py-2 text-[11px] text-slate-300">
        <p>حالة السر الإداري: {data.config.adminSecretStrong ? "قوي" : "ضعيف/غير مضبوط"}</p>
        <p>Service Role: {data.config.serviceRoleConfigured ? "مضبوط" : "غير مضبوط"}</p>
        <p>HTTPS public URL: {data.config.secureTransportConfigured ? "مفعل" : "غير مفعل"}</p>
      </div>

      {data.warnings.length > 0 && (
        <div className="space-y-1">
          {data.warnings.slice(0, 4).map((w, i) => (
            <p key={`${i}-${w}`} className="text-xs text-amber-300/90">• {w}</p>
          ))}
        </div>
      )}

      <div className="rounded-xl bg-black/20 border border-white/5 px-3 py-2">
        <p className="text-[11px] text-slate-400 mb-2">سجل الإنذارات الأمنية (لحظي)</p>
        {timeline.length === 0 ? (
          <p className="text-xs text-slate-500">لا يوجد إنذارات مسجلة بعد.</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-auto pr-1">
            {timeline.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-lg border border-white/5 bg-white/[0.03] px-2 py-2 text-[11px]">
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-bold ${item.status === "critical" ? "text-rose-300" : item.status === "warning" ? "text-amber-300" : "text-emerald-300"}`}>
                    {item.status === "critical" ? "خطر" : item.status === "warning" ? "تحذير" : "آمن"}
                  </span>
                  <span className="text-slate-500">{new Date(item.createdAt).toLocaleString("ar-EG")}</span>
                </div>
                <p className="text-slate-400 mt-1">
                  webhook: {item.webhookDelivered ? "تم الإرسال" : "فشل/غير مضبوط"} | فاشل: {item.authFailed15m} | حظر: {item.authRateLimited15m}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div className="pointer-events-none absolute top-2 left-2 right-2 rounded-lg border border-rose-400/40 bg-rose-500/20 px-3 py-2 text-xs font-bold text-rose-100 shadow-lg backdrop-blur-md">
          {toast}
        </div>
      )}
    </div>
  );
};
