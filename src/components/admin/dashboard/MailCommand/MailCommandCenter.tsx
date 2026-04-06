"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Mail, Send, FileText, BarChart3, Clock, CheckCircle,
  XCircle, Eye, MousePointer, AlertTriangle, RefreshCw,
  ChevronDown, Search, Plus, ArrowUpRight, Inbox, Zap,
  TrendingUp
} from "lucide-react";

// ═══════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════

type EmailStats = {
  period: string;
  totals: { sent: number; delivered: number; opened: number; clicked: number; bounced: number; complained: number };
  rates: { delivery: number; open: number; click: number; bounce: number };
  timeSeries: Array<{ date: string; sent: number; delivered: number; opened: number; clicked: number; bounced: number }>;
  recent: Array<{ id: string; to_email: string; subject: string; status: string; campaign_tag: string | null; created_at: string; resend_id: string | null }>;
};

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  html: string;
  preview_text: string | null;
  category: string;
  variables: Array<{ name: string; type: string; default: string }>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type EmailLog = {
  id: string;
  resend_id: string | null;
  to_email: string;
  from_email: string;
  subject: string;
  status: string;
  campaign_tag: string | null;
  template_id: string | null;
  created_at: string;
  updated_at: string;
  email_events: Array<{ id: string; event_type: string; metadata: any; created_at: string }>;
};

type TabId = "overview" | "compose" | "templates" | "logs";

// ═══════════════════════════════════════════════════
// Status Badge Component
// ═══════════════════════════════════════════════════

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  queued: { bg: "bg-slate-500/20", text: "text-slate-300", icon: <Clock className="w-3 h-3" /> },
  sent: { bg: "bg-blue-500/20", text: "text-blue-300", icon: <Send className="w-3 h-3" /> },
  delivered: { bg: "bg-teal-500/20", text: "text-teal-300", icon: <CheckCircle className="w-3 h-3" /> },
  opened: { bg: "bg-emerald-500/20", text: "text-emerald-300", icon: <Eye className="w-3 h-3" /> },
  clicked: { bg: "bg-amber-500/20", text: "text-amber-300", icon: <MousePointer className="w-3 h-3" /> },
  bounced: { bg: "bg-red-500/20", text: "text-red-300", icon: <XCircle className="w-3 h-3" /> },
  complained: { bg: "bg-rose-500/20", text: "text-rose-300", icon: <AlertTriangle className="w-3 h-3" /> },
  failed: { bg: "bg-red-500/20", text: "text-red-300", icon: <XCircle className="w-3 h-3" /> },
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.queued;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider ${style.bg} ${style.text}`}>
      {style.icon}
      {status}
    </span>
  );
}

// ═══════════════════════════════════════════════════
// Stat Card
// ═══════════════════════════════════════════════════

function StatCard({ label, value, rate, icon, color }: {
  label: string; value: number; rate?: number; icon: React.ReactNode; color: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-black/30 p-5 backdrop-blur-sm group hover:border-white/10 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">{label}</p>
          <p className={`text-3xl font-black ${color}`}>{value.toLocaleString()}</p>
          {rate !== undefined && (
            <p className="text-xs font-bold text-slate-400 mt-1">{rate}%</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color.replace("text-", "bg-")}/10 border border-white/5`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Overview Tab
// ═══════════════════════════════════════════════════

function OverviewTab({ stats, isLoading, onRefresh }: { stats: EmailStats | null; isLoading: boolean; onRefresh: () => void }) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-white/[0.02] animate-pulse border border-white/5" />
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20 text-slate-500">
        <Inbox className="w-12 h-12 mx-auto mb-4 opacity-40" />
        <p className="font-bold">لا توجد بيانات بعد</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="المرسل" value={stats.totals.sent} icon={<Send className="w-5 h-5 text-blue-400" />} color="text-blue-400" />
        <StatCard label="التوصيل" value={stats.totals.delivered} rate={stats.rates.delivery} icon={<CheckCircle className="w-5 h-5 text-teal-400" />} color="text-teal-400" />
        <StatCard label="الفتح" value={stats.totals.opened} rate={stats.rates.open} icon={<Eye className="w-5 h-5 text-emerald-400" />} color="text-emerald-400" />
        <StatCard label="النقر" value={stats.totals.clicked} rate={stats.rates.click} icon={<MousePointer className="w-5 h-5 text-amber-400" />} color="text-amber-400" />
      </div>

      {/* Bounce/Complaint Alert */}
      {(stats.totals.bounced > 0 || stats.totals.complained > 0) && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
          <div className="flex items-center gap-3 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-black text-sm">تنبيه: {stats.totals.bounced} ارتداد، {stats.totals.complained} شكوى</span>
          </div>
        </div>
      )}

      {/* Simple Bar Chart */}
      {stats.timeSeries.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-black/20 p-6">
          <h3 className="text-sm font-black text-slate-300 mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-400" />
            الإرسال اليومي
          </h3>
          <div className="flex items-end gap-1 h-40">
            {stats.timeSeries.map((day, i) => {
              const maxSent = Math.max(...stats.timeSeries.map(d => d.sent), 1);
              const height = (day.sent / maxSent) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="absolute -top-8 bg-slate-800 text-[10px] font-bold text-slate-300 px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {day.date.slice(5)} — {day.sent} إرسال
                  </div>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-teal-500/60 to-teal-400/30 border border-teal-500/20 transition-all hover:from-teal-500/80 hover:to-teal-400/50"
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  {i % 5 === 0 && (
                    <span className="text-[9px] text-slate-600 mt-1">{day.date.slice(5)}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Sends */}
      <div className="rounded-2xl border border-white/5 bg-black/20 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h3 className="text-sm font-black text-slate-300">آخر الإرسالات</h3>
          <button onClick={onRefresh} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        {stats.recent.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">لا توجد إرسالات بعد</div>
        ) : (
          <div className="divide-y divide-white/5">
            {stats.recent.map((email) => (
              <div key={email.id} className="px-6 py-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate">{email.subject}</p>
                    <p className="text-xs text-slate-500 mt-1 truncate">{email.to_email}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={email.status} />
                    <span className="text-[10px] text-slate-600 font-mono">
                      {new Date(email.created_at).toLocaleDateString("ar-EG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Compose Tab
// ═══════════════════════════════════════════════════

function ComposeTab({ templates, onSent }: { templates: EmailTemplate[]; onSent: () => void }) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [campaignTag, setCampaignTag] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const activeTemplate = templates.find(t => t.id === selectedTemplate);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setHtml(template.html);
      // Initialize variables
      const vars: Record<string, string> = {};
      (template.variables || []).forEach((v: any) => {
        vars[v.name] = v.default || "";
      });
      setVariables(vars);
    }
  };

  const getHydratedHtml = () => {
    let result = html;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    }
    return result;
  };

  const handleSend = async () => {
    if (!to.trim() || !subject.trim()) {
      setResult({ ok: false, message: "أدخل المستلم والموضوع" });
      return;
    }

    setIsSending(true);
    setResult(null);

    try {
      const recipients = to.split(",").map(e => e.trim()).filter(Boolean);
      const body: any = {
        to: recipients.length === 1 ? recipients[0] : recipients,
        subject,
        campaignTag: campaignTag || undefined,
      };

      if (selectedTemplate) {
        body.templateId = selectedTemplate;
        body.variables = variables;
      } else {
        body.html = html;
      }

      const res = await fetch("/api/admin/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.ok) {
        setResult({ ok: true, message: `✅ تم إرسال ${data.sent} من ${data.total} إيميل بنجاح` });
        onSent();
      } else {
        setResult({ ok: false, message: `❌ فشل: ${data.error || "خطأ غير معروف"}` });
      }
    } catch (err: any) {
      setResult({ ok: false, message: `❌ خطأ في الاتصال: ${err?.message}` });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Template Selector */}
      <div className="space-y-2">
        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">اختر قالب (اختياري)</label>
        <div className="relative">
          <select
            value={selectedTemplate}
            onChange={(e) => handleTemplateSelect(e.target.value)}
            className="w-full appearance-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all"
          >
            <option value="">كتابة حرة (بدون قالب)</option>
            {templates.filter(t => t.is_active).map(t => (
              <option key={t.id} value={t.id}>{t.name} — {t.category}</option>
            ))}
          </select>
          <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* Template Variables */}
      {activeTemplate && activeTemplate.variables?.length > 0 && (
        <div className="rounded-2xl border border-teal-500/10 bg-teal-500/5 p-5 space-y-4">
          <p className="text-[11px] font-black uppercase tracking-widest text-teal-400">متغيرات القالب</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeTemplate.variables.map((v: any) => (
              <div key={v.name} className="space-y-1">
                <label className="text-xs font-bold text-slate-400">{`{{${v.name}}}`}</label>
                <input
                  type="text"
                  value={variables[v.name] || ""}
                  onChange={(e) => setVariables(prev => ({ ...prev, [v.name]: e.target.value }))}
                  placeholder={v.default || v.name}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50 transition-all"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recipients */}
      <div className="space-y-2">
        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">المستلم(ون) — افصل بفاصلة</label>
        <input
          type="text"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="email@example.com, another@example.com"
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all"
          dir="ltr"
        />
      </div>

      {/* Subject */}
      <div className="space-y-2">
        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">الموضوع</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="موضوع الإيميل..."
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all"
        />
      </div>

      {/* HTML Content (only when no template) */}
      {!selectedTemplate && (
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">محتوى HTML</label>
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            rows={12}
            placeholder="<div>...</div>"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all resize-none"
            dir="ltr"
          />
        </div>
      )}

      {/* Campaign Tag */}
      <div className="space-y-2">
        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">تاغ الحملة (اختياري)</label>
        <input
          type="text"
          value={campaignTag}
          onChange={(e) => setCampaignTag(e.target.value)}
          placeholder="مثال: onboarding-reminder-apr"
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all"
          dir="ltr"
        />
      </div>

      {/* Preview */}
      {(html || selectedTemplate) && (
        <div className="space-y-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 text-xs font-black text-teal-400 hover:text-teal-300 transition-colors"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? "إخفاء المعاينة" : "معاينة الإيميل"}
          </button>
          {showPreview && (
            <div className="rounded-2xl border border-white/10 bg-white overflow-hidden max-h-[500px] overflow-y-auto">
              <div dangerouslySetInnerHTML={{ __html: getHydratedHtml() }} />
            </div>
          )}
        </div>
      )}

      {/* Send Button */}
      <div className="flex items-center gap-4 pt-4">
        <button
          onClick={handleSend}
          disabled={isSending || !to.trim() || !subject.trim()}
          className="flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-sm uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 active:scale-[0.98]"
        >
          {isSending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {isSending ? "جاري الإرسال..." : "إرسال"}
        </button>
        {result && (
          <p className={`text-sm font-bold ${result.ok ? "text-teal-400" : "text-red-400"}`}>
            {result.message}
          </p>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Templates Tab
// ═══════════════════════════════════════════════════

function TemplatesTab({ templates, onRefresh }: { templates: EmailTemplate[]; onRefresh: () => void }) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", subject: "", html: "", preview_text: "", category: "marketing" });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name || !form.subject || !form.html) return;
    setIsSaving(true);

    try {
      const url = "/api/admin/email/templates";
      const method = editingId ? "PATCH" : "POST";
      const body = editingId ? { id: editingId, ...form } : form;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowCreate(false);
        setEditingId(null);
        setForm({ name: "", subject: "", html: "", preview_text: "", category: "marketing" });
        onRefresh();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingId(template.id);
    setForm({
      name: template.name,
      subject: template.subject,
      html: template.html,
      preview_text: template.preview_text || "",
      category: template.category,
    });
    setShowCreate(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا القالب؟")) return;
    await fetch("/api/admin/email/templates", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-300">
          {templates.length} قالب
        </h3>
        <button
          onClick={() => { setShowCreate(true); setEditingId(null); setForm({ name: "", subject: "", html: "", preview_text: "", category: "marketing" }); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-black hover:bg-teal-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          قالب جديد
        </button>
      </div>

      {/* Create/Edit Form */}
      {showCreate && (
        <div className="rounded-2xl border border-teal-500/20 bg-black/40 p-6 space-y-4">
          <h4 className="text-sm font-black text-teal-400">{editingId ? "تعديل القالب" : "قالب جديد"}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="اسم القالب"
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500/50 transition-all"
            />
            <select
              value={form.category} onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))}
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500/50 transition-all appearance-none"
            >
              <option value="marketing">تسويقي</option>
              <option value="transactional">معاملات</option>
              <option value="follow_up">متابعة</option>
              <option value="onboarding">ترحيب</option>
              <option value="notification">إشعار</option>
            </select>
          </div>
          <input
            type="text" value={form.subject} onChange={(e) => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="الموضوع"
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500/50 transition-all"
          />
          <input
            type="text" value={form.preview_text} onChange={(e) => setForm(p => ({ ...p, preview_text: e.target.value }))} placeholder="نص المعاينة (Preview Text)"
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500/50 transition-all"
          />
          <textarea
            value={form.html} onChange={(e) => setForm(p => ({ ...p, html: e.target.value }))} rows={10} placeholder="<div>HTML...</div>"
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-teal-500/50 transition-all resize-none"
            dir="ltr"
          />
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black transition-all disabled:opacity-50"
            >
              {isSaving ? "جاري الحفظ..." : "حفظ"}
            </button>
            <button onClick={() => { setShowCreate(false); setEditingId(null); }}
              className="px-6 py-2.5 rounded-xl border border-white/10 text-slate-400 text-xs font-black hover:bg-white/5 transition-all"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((t) => (
          <div key={t.id} className={`rounded-2xl border bg-black/20 p-5 space-y-3 transition-all hover:border-white/10 ${t.is_active ? "border-white/5" : "border-red-500/20 opacity-60"}`}>
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-black text-white">{t.name}</h4>
                <p className="text-xs text-slate-500 mt-1">{t.subject}</p>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-white/5 px-2 py-1 rounded-lg">{t.category}</span>
            </div>
            {t.variables?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {t.variables.map((v: any, i: number) => (
                  <span key={i} className="text-[10px] font-mono text-teal-400/70 bg-teal-500/10 px-2 py-0.5 rounded">{`{{${v.name}}}`}</span>
                ))}
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={() => handleEdit(t)} className="text-[11px] font-bold text-slate-400 hover:text-teal-400 transition-colors">تعديل</button>
              <button onClick={() => handleDelete(t.id)} className="text-[11px] font-bold text-slate-400 hover:text-red-400 transition-colors">حذف</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Logs Tab
// ═══════════════════════════════════════════════════

function LogsTab() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20", status: statusFilter });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/email/logs?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { void fetchLogs(); }, [fetchLogs]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="بحث بالإيميل أو الموضوع..."
            className="w-full rounded-xl border border-white/10 bg-black/30 pr-10 pl-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500/50 transition-all"
          />
        </div>
        <select
          value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500/50 appearance-none transition-all"
        >
          <option value="all">كل الحالات</option>
          <option value="sent">مرسل</option>
          <option value="delivered">وصل</option>
          <option value="opened">مفتوح</option>
          <option value="clicked">مضغوط</option>
          <option value="bounced">مرتد</option>
          <option value="failed">فاشل</option>
        </select>
      </div>

      <p className="text-xs text-slate-500 font-bold">{total} إيميل — صفحة {page}</p>

      {/* Logs Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-white/[0.02] animate-pulse border border-white/5" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Mail className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-bold text-sm">لا توجد سجلات</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="rounded-2xl border border-white/5 bg-black/20 overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                className="w-full px-5 py-4 flex items-center justify-between text-right hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <StatusBadge status={log.status} />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{log.subject}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{log.to_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {log.campaign_tag && (
                    <span className="text-[10px] font-mono text-slate-500 bg-white/5 px-2 py-0.5 rounded">{log.campaign_tag}</span>
                  )}
                  <span className="text-[10px] text-slate-600">
                    {new Date(log.created_at).toLocaleDateString("ar-EG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${expandedId === log.id ? "rotate-180" : ""}`} />
                </div>
              </button>

              {/* Expanded Events Timeline */}
              {expandedId === log.id && (
                <div className="px-5 pb-4 pt-1 border-t border-white/5">
                  {log.email_events?.length > 0 ? (
                    <div className="space-y-2 mt-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2">الخط الزمني</p>
                      {log.email_events
                        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                        .map((ev) => (
                          <div key={ev.id} className="flex items-center gap-3 text-xs">
                            <StatusBadge status={ev.event_type} />
                            <span className="text-slate-500 font-mono text-[10px]">
                              {new Date(ev.created_at).toLocaleString("ar-EG", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                            </span>
                            {ev.metadata?.click_url && (
                              <a href={ev.metadata.click_url} target="_blank" rel="noreferrer" className="text-teal-400/70 hover:text-teal-300 flex items-center gap-1">
                                <ArrowUpRight className="w-3 h-3" />{ev.metadata.click_url.substring(0, 40)}...
                              </a>
                            )}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 py-2">لا توجد أحداث بعد</p>
                  )}
                  <div className="mt-3 pt-3 border-t border-white/5 text-[10px] text-slate-600 font-mono flex gap-4">
                    <span>ID: {log.id.substring(0, 8)}</span>
                    {log.resend_id && <span>SMTP: {log.resend_id}</span>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg border border-white/10 text-xs font-bold text-slate-400 hover:bg-white/5 disabled:opacity-30 transition-all"
          >
            السابق
          </button>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={logs.length < 20}
            className="px-4 py-2 rounded-lg border border-white/10 text-xs font-bold text-slate-400 hover:bg-white/5 disabled:opacity-30 transition-all"
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Main: Mail Command Center
// ═══════════════════════════════════════════════════

const TABS: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
  { id: "overview", label: "نظرة عامة", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "compose", label: "إرسال جديد", icon: <Send className="w-4 h-4" /> },
  { id: "templates", label: "القوالب", icon: <FileText className="w-4 h-4" /> },
  { id: "logs", label: "السجل", icon: <Clock className="w-4 h-4" /> },
];

export function MailCommandCenter() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const res = await fetch("/api/admin/email/stats?period=30d");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("[MailCommand] Stats fetch error:", err);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/email/templates");
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (err) {
      console.error("[MailCommand] Templates fetch error:", err);
    }
  }, []);

  useEffect(() => {
    void fetchStats();
    void fetchTemplates();
  }, [fetchStats, fetchTemplates]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20">
          <Mail className="w-7 h-7 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">مركز قيادة البريد</h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">Sovereign Mail Command</p>
        </div>
        <div className="mr-auto flex items-center gap-2">
          <Zap className="w-4 h-4 text-teal-400" />
          <span className="text-[10px] font-black text-teal-500 uppercase tracking-widest">⚡ Sovereign SMTP Engine</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-0.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-xs font-black transition-all ${
              activeTab === t.id
                ? "bg-white/5 text-white border-b-2 border-teal-500"
                : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "overview" && (
          <OverviewTab stats={stats} isLoading={isLoadingStats} onRefresh={fetchStats} />
        )}
        {activeTab === "compose" && (
          <ComposeTab templates={templates} onSent={() => { void fetchStats(); }} />
        )}
        {activeTab === "templates" && (
          <TemplatesTab templates={templates} onRefresh={fetchTemplates} />
        )}
        {activeTab === "logs" && (
          <LogsTab />
        )}
      </div>
    </div>
  );
}

export default MailCommandCenter;
