"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Mail,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Send,
  RotateCcw,
  Zap,
  TrendingUp,
  Users,
  Activity,
  Phone,
  Copy,
  CheckCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ManualLeadEntry } from "./ManualLeadEntry";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuickSendLead {
  email: string;
  lead_id: string | null;
  phone: string | null;
  name: string | null;
  personalLink: string;
}

interface EmailMetrics {
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

interface OpsStats {
  ok: boolean;
  totalLeads: number;
  counts: Record<string, number>;
  realStarts: number;
  recentErrors: Array<{ lead_email: string; channel: string; last_error: string; updated_at: string }>;
  recentSent: Array<{ lead_email: string; channel: string; sent_at: string }>;
  quickSendLeads: QuickSendLead[];
  emailMetrics?: EmailMetrics;
}

// ─── Constants ────────────────────────────────────────────────────────────────
// رقم الإرسال اليدوي للأونر
const OWNER_PHONE = "+201140111147";
const OWNER_EMAIL = "MohamedRefatMohamed@gmail.com";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SECRET =
  typeof window !== "undefined"
    ? (document.cookie.match(/admin_code=([^;]+)/)?.[1] ?? "")
    : "";

async function fetchStats(): Promise<OpsStats> {
  const res = await fetch("/api/admin/marketing-ops", {
    headers: { authorization: `Bearer ${SECRET}` },
  });
  if (!res.ok) {
    throw new Error(`marketing_ops_stats_failed:${res.status}`);
  }
  return res.json() as Promise<OpsStats>;
}

async function postAction(action: string, extra?: Record<string, unknown>): Promise<{ ok: boolean; result?: unknown }> {
  const res = await fetch("/api/admin/marketing-ops", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${SECRET}` },
    body: JSON.stringify({ action, ...extra }),
  });
  if (!res.ok) {
    throw new Error(`marketing_ops_action_failed:${res.status}`);
  }
  return res.json() as Promise<{ ok: boolean; result?: unknown }>;
}

function timeSince(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}د`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}س`;
  return `${Math.floor(hrs / 24)}ي`;
}

function buildMessage(lead: QuickSendLead): string {
  const greeting = lead.name ? `أهلاً ${lead.name}،` : "أهلاً،";
  return `${greeting} أنا موحمد من الرحلة 🌙\nشكراً لاهتمامك — خريطة علاقاتك جاهزة في دقيقتين.\nابدأ من هنا: ${lead.personalLink}`;
}

function buildEmailBody(lead: QuickSendLead): string {
  const greeting = lead.name ? `أهلاً ${lead.name}،` : "أهلاً،";
  return encodeURIComponent(
    `${greeting}\n\nأنا محمد من الرحلة.\nشكراً لاهتمامك بالمنصة — خريطة علاقاتك الأولى جاهزة في دقيقتين فقط.\n\nابدأ من هنا: ${lead.personalLink}\n\nاللينك ده خاص بيك.\n\nبالتوفيق 💜\nمحمد`
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label, value, icon, accent,
}: {
  label: string; value: number | string; icon: React.ReactNode; accent: string;
}) {
  return (
    <div className={`relative rounded-2xl border bg-slate-900/60 backdrop-blur p-5 flex flex-col gap-3 overflow-hidden border-white/5 transition-all`}>
      <div className={`w-10 h-10 rounded-xl bg-${accent}-500/10 flex items-center justify-center text-${accent}-400`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
        <p className="text-3xl font-black text-white mt-1">{value}</p>
      </div>
      <div className={`absolute right-0 top-0 w-24 h-24 rounded-full bg-${accent}-500/5 blur-2xl`} />
    </div>
  );
}

function ActionButton({
  label, icon, onClick, loading, variant,
}: {
  label: string; icon: React.ReactNode; onClick: () => void; loading: boolean; variant: "primary" | "warning" | "success";
}) {
  const colors = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white",
    warning: "bg-amber-600 hover:bg-amber-500 text-white",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white",
  };
  return (
    <button onClick={onClick} disabled={loading}
      className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${colors[variant]}`}>
      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : icon}
      {label}
    </button>
  );
}

// ─── Quick Send Lead Row ──────────────────────────────────────────────────────
function QuickSendRow({
  lead,
  onMarkContacted,
}: {
  lead: QuickSendLead;
  onMarkContacted: (email: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [marked, setMarked] = useState(false);
  const msg = buildMessage(lead);
  const encodedMsg = encodeURIComponent(msg);
  const phone = lead.phone ?? OWNER_PHONE;

  const handleCopy = () => {
    void navigator.clipboard.writeText(msg).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleMark = async () => {
    setMarked(true);
    onMarkContacted(lead.email);
  };

  if (marked) return null;

  return (
    <div className="border border-white/5 rounded-2xl p-4 bg-slate-900/40 space-y-3">
      {/* Lead Info */}
      <div className="flex items-start justify-between">
        <div className="text-right">
          <p className="text-sm font-bold text-white">{lead.name ?? "—"}</p>
          <p className="text-[11px] text-slate-500 font-mono">{lead.email}</p>
          {lead.phone && (
            <p className="text-[11px] text-slate-600 font-mono flex items-center gap-1 justify-end mt-0.5">
              <Phone className="w-3 h-3" /> {lead.phone}
            </p>
          )}
        </div>
        <button
          onClick={handleMark}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10 transition-all"
        >
          <CheckCheck className="w-3 h-3" />
          تم التواصل
        </button>
      </div>

      {/* Quick-Send Buttons */}
      <div className="flex flex-wrap gap-2">
        {/* WhatsApp */}
        <a
          href={`https://wa.me/${phone.replace(/\+/, "")}?text=${encodedMsg}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-all"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          واتساب
        </a>

        {/* Telegram by phone */}
        <a
          href={`https://t.me/${phone}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-[#0088cc]/10 text-[#0088cc] border border-[#0088cc]/20 hover:bg-[#0088cc]/20 transition-all"
        >
          <Send className="w-3.5 h-3.5" />
          تيليجرام
        </a>

        {/* SMS */}
        <a
          href={`sms:${phone}?body=${encodedMsg}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-slate-500/10 text-slate-300 border border-slate-500/20 hover:bg-slate-500/20 transition-all"
        >
          <Phone className="w-3.5 h-3.5" />
          SMS
        </a>

        {/* Email (bypasses quota!) */}
        <a
          href={`mailto:${lead.email}?from=${OWNER_EMAIL}&subject=${encodeURIComponent("خطوتك الأولى في الرحلة تنتظرك ✦")}&body=${buildEmailBody(lead)}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-all"
        >
          <Mail className="w-3.5 h-3.5" />
          إيميل يدوي
        </a>

        {/* Copy Message */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
        >
          {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "تم النسخ!" : "نسخ الرسالة"}
        </button>
      </div>

      {/* Link preview */}
      <p className="text-[10px] text-slate-700 font-mono truncate text-right" dir="ltr">
        {lead.personalLink}
      </p>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function MarketingOpsPanel() {
  const [stats, setStats] = useState<OpsStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [showQuickSend, setShowQuickSend] = useState(true);
  const [contacted, setContacted] = useState<Set<string>>(new Set());
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchStats();
      setStats(data);
    } catch {
      showToast("فشل تحميل البيانات", false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleAction = async (action: string, label: string, extra?: Record<string, unknown>) => {
    setActionLoading(action);
    try {
      const res = await postAction(action, extra);
      if (res.ok) {
        showToast(`${label} — تم بنجاح ✅`, true);
        await load();
      } else {
        showToast(`${label} — فشل ❌`, false);
      }
    } catch {
      showToast("خطأ في الشبكة", false);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkContacted = (email: string) => {
    setContacted((prev) => new Set([...prev, email]));
    void postAction("mark_contacted", { leadEmail: email });
  };

  const c = stats?.counts ?? {};
  const sent = (c["sent"] ?? 0) + (c["simulated"] ?? 0);
  const pending = c["pending"] ?? 0;
  const failed = (c["failed"] ?? 0);
  const realStarts = stats?.realStarts ?? 0;
  const convRate = sent > 0 ? `${Math.round((realStarts / sent) * 100)}%` : "—";

  const availableLeads = (stats?.quickSendLeads ?? []).filter((l) => !contacted.has(l.email));

  return (
    <div className="space-y-8 text-slate-200" dir="rtl">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl font-bold text-sm shadow-2xl transition-all ${toast.ok ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Marketing Ops</h2>
          <p className="text-slate-500 text-xs mt-1">مركز التحكم في حملات الـ Outreach</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          تحديث
        </button>
      </div>

      {/* Manual Lead Entry */}
      <ManualLeadEntry 
        onSuccess={(msg) => {
          showToast(msg, true);
          void load();
        }} 
        onError={(msg) => showToast(msg, false)} 
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="تم الإرسال" value={sent} icon={<CheckCircle2 className="w-5 h-5" />} accent="emerald" />
        <StatCard label="في الانتظار" value={pending} icon={<Clock className="w-5 h-5" />} accent="amber" />
        <StatCard label="فشل" value={failed} icon={<AlertCircle className="w-5 h-5" />} accent="rose" />
        <StatCard label="بدأ Onboarding" value={realStarts} icon={<TrendingUp className="w-5 h-5" />} accent="indigo" />
      </div>

      {/* ── Email Engagement Analytics ─────────────────────────────────── */}
      {stats?.emailMetrics && (
        <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-5 space-y-4 backdrop-blur">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 flex items-center justify-center">
              <Mail className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email Analytics</p>
              <p className="text-xs text-slate-400">بيانات حقيقية من الـ Webhook</p>
            </div>
          </div>

          {/* Rate bars */}
          <div className="space-y-3">
            {[
              { label: "معدل الفتح", rate: stats.emailMetrics.openRate, count: stats.emailMetrics.opened, color: "bg-emerald-400" },
              { label: "معدل النقر", rate: stats.emailMetrics.clickRate, count: stats.emailMetrics.clicked, color: "bg-sky-400" },
              { label: "معدل الارتداد", rate: stats.emailMetrics.bounceRate, count: stats.emailMetrics.bounced, color: "bg-rose-400" },
            ].map(({ label, rate, count, color }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-400">{label}</span>
                  <span className="text-xs font-black text-white">{rate}% <span className="text-slate-500 font-medium">({count})</span></span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${color}`}
                    style={{ width: `${Math.min(rate, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Summary row */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { label: "تم الإرسال", value: stats.emailMetrics.sent, color: "text-slate-300" },
              { label: "ألغوا الاشتراك", value: stats.emailMetrics.unsubscribed, color: "text-amber-400" },
              { label: "شكاوى", value: stats.emailMetrics.complained, color: "text-rose-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <p className={`text-xl font-black ${color}`}>{value}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-5 flex items-center justify-between backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">معدل التحويل الفعلي</p>
            <p className="text-4xl font-black text-white mt-1">{convRate}</p>
            <p className="text-[11px] text-slate-500 mt-1">{realStarts} بداية حقيقية من {sent} إرسال</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-black uppercase text-slate-500 mb-2">توزيع القناة</div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-end gap-2 text-xs">
              <span className="text-slate-400">{c["sent"] ?? 0} إيميل</span>
              <Mail className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="flex items-center justify-end gap-2 text-xs">
              <span className="text-slate-400">{c["simulated"] ?? 0} واتساب (محاكاة)</span>
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Auto Actions */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-5 space-y-4 backdrop-blur">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">إجراءات تلقائية</p>
        <div className="flex flex-wrap gap-3">
          <ActionButton label="إرسال الدفعة الآن" icon={<Send className="w-4 h-4" />}
            onClick={() => handleAction("trigger_batch", "إرسال الدفعة")}
            loading={actionLoading === "trigger_batch"} variant="primary" />
          <ActionButton label="إعادة المرفوضة للانتظار" icon={<RotateCcw className="w-4 h-4" />}
            onClick={() => handleAction("reset_failed", "إعادة الفاشل")}
            loading={actionLoading === "reset_failed"} variant="warning" />
        </div>
        <p className="text-[10px] text-slate-600">
          «إرسال الدفعة» يشغّل الـ Cron فوراً — يخضع لحد Resend اليومي (100 إيميل/يوم على الخطة المجانية).
        </p>
      </div>

      {/* ─── QUICK SEND PANEL ──────────────────────────────────────── */}
      <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 overflow-hidden">
        <button
          onClick={() => setShowQuickSend(!showQuickSend)}
          className="w-full flex items-center justify-between p-5 text-right hover:bg-indigo-500/10 transition-all"
        >
          <div className="flex items-center gap-2">
            {showQuickSend ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-indigo-400" />}
            <span className="text-[11px] text-slate-500">{availableLeads.length} lead متاح</span>
          </div>
          <div>
            <p className="text-sm font-black text-indigo-300">📱 إرسال يدوي سريع</p>
            <p className="text-[11px] text-slate-500">واتساب · تيليجرام · SMS · إيميل يدوي — مجاناً تماماً</p>
          </div>
        </button>

        {showQuickSend && (
          <div className="px-5 pb-5 space-y-3 max-h-[600px] overflow-y-auto">
            {/* Info Banner */}
            <div className="rounded-xl border border-indigo-500/10 bg-indigo-500/5 p-3 text-right text-[11px] text-slate-500">
              <strong className="text-indigo-400">كيف يشتغل:</strong> كل زرار بيفتحلك التطبيق وفيه الرسالة جاهزة بالاسم + اللينك الشخصي. الإيميل اليدوي بيفتح Gmail/Outlook من غير ما تستهلك كوتة Resend.
            </div>

            {availableLeads.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">✅ كل الـ Leads الحاليين تم التواصل معهم أو تمت معالجتهم تلقائياً.</p>
            ) : (
              availableLeads.map((lead) => (
                <QuickSendRow
                  key={lead.email}
                  lead={lead}
                  onMarkContacted={handleMarkContacted}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Two-col: Recent Sent + Errors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-5 backdrop-blur">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">آخر رسائل مرسلة</p>
          </div>
          {(stats?.recentSent ?? []).length === 0 ? (
            <p className="text-xs text-slate-600">لا يوجد إرسال بعد</p>
          ) : (
            <div className="space-y-2">
              {(stats?.recentSent ?? []).map((row, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-2 border-b border-white/5 last:border-0">
                  <span className="text-slate-500 text-[10px]">{timeSince(row.sent_at)}</span>
                  <div className="text-right">
                    <p className="text-slate-300 font-mono text-[11px] truncate max-w-[180px]">{row.lead_email}</p>
                    <p className="text-[10px] text-slate-600 capitalize">{row.channel}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-rose-500/10 bg-rose-500/5 p-5 backdrop-blur">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">آخر أخطاء</p>
          </div>
          {(stats?.recentErrors ?? []).length === 0 ? (
            <p className="text-xs text-emerald-400">✅ لا توجد أخطاء حالياً</p>
          ) : (
            <div className="space-y-2">
              {(stats?.recentErrors ?? []).map((row, i) => (
                <div key={i} className="text-xs py-2 border-b border-white/5 last:border-0 text-right">
                  <p className="text-slate-300 font-mono text-[11px]">{row.lead_email}</p>
                  <p className="text-rose-400/80 text-[10px] mt-0.5 line-clamp-2">{row.last_error}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quota warning */}
      {failed > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
          <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-300">تجاوز الـ Quota اليومي؟</p>
            <p className="text-xs text-amber-400/70 mt-1">
              لو السبب هو `429 daily_quota_exceeded`، اضغط «إعادة المرفوضة» غداً الصبح بعد تجديد الـ Quota.
              أو استخدم «إرسال يدوي سريع» للتواصل المباشر من غير ما تنتظر الكوتة.
            </p>
          </div>
        </div>
      )}

      {/* Total */}
      <div className="text-center text-[11px] text-slate-600 flex items-center justify-center gap-2">
        <Users className="w-3.5 h-3.5" />
        إجمالي سجلات قائمة الانتظار: {stats?.totalLeads ?? "—"}
      </div>
    </div>
  );
}
