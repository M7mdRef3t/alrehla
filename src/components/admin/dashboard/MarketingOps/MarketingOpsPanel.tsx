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
import { StatCard } from "../Executive/components/StatCard";
import { AdminTooltip } from "../Overview/components/AdminTooltip";

// --- Types ---

interface QuickSendLead {
  email: string;
  lead_id: string | null;
  phone: string | null;
  name: string | null;
  personalLink: string;
  emailSent: boolean;
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

// --- Constants ---
const OWNER_PHONE = "+201140111147";
const OWNER_EMAIL = "hello@alrehla.app";

// --- Helpers ---

import { getAuthToken } from "../../../../state/authState";
import { useAdminState } from "../../../../state/adminState";

function getBearerToken(): string {
  return getAuthToken() ?? useAdminState.getState().adminCode ?? "";
}

async function fetchStats(): Promise<OpsStats> {
  const res = await fetch("/api/admin/marketing-ops", {
    headers: { authorization: `Bearer ${getBearerToken()}` },
  });
  if (!res.ok) {
    throw new Error(`marketing_ops_stats_failed:${res.status}`);
  }
  return res.json() as Promise<OpsStats>;
}

async function postAction(action: string, extra?: Record<string, unknown>): Promise<{ ok: boolean; result?: unknown }> {
  const res = await fetch("/api/admin/marketing-ops", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${getBearerToken()}` },
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
  if (mins < 60) return `${mins}\u062F`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}\u0633`;
  return `${Math.floor(hrs / 24)}\u064A`;
}

function buildMessage(lead: QuickSendLead): string {
  const greeting = lead.name ? `\u0623\u0647\u0644\u0627\u064B ${lead.name}\u060C` : "\u0623\u0647\u0644\u0627\u064B\u060C";
  return `${greeting} \u0645\u0639\u0643 \u0641\u0631\u064A\u0642 \u0639\u0645\u0644 \u0627\u0644\u0631\u062D\u0644\u0629 \u{1F319}\n\u0634\u0643\u0631\u0627\u064B \u0644\u0627\u0647\u062A\u0645\u0627\u0645\u0643 \u2014 \u062E\u0631\u064A\u0637\u0629 \u0639\u0644\u0627\u0642\u0627\u062A\u0643 \u062C\u0627\u0647\u0632\u0629 \u0641\u064A \u062F\u0642\u064A\u0642\u062A\u064A\u0646.\n\u0627\u0628\u062F\u0623 \u0645\u0646 \u0647\u0646\u0627: ${lead.personalLink}`;
}

function buildEmailBody(lead: QuickSendLead): string {
  const greeting = lead.name ? `\u0623\u0647\u0644\u0627\u064B ${lead.name}\u060C` : "\u0623\u0647\u0644\u0627\u064B\u060C";
  return encodeURIComponent(
    `${greeting}\n\n\u0645\u0639\u0643 \u0641\u0631\u064A\u0642 \u0639\u0645\u0644 \u0627\u0644\u0631\u062D\u0644\u0629.\n\u0634\u0643\u0631\u0627\u064B \u0644\u0627\u0647\u062A\u0645\u0627\u0645\u0643 \u0628\u0627\u0644\u0645\u0646\u0635\u0629 \u2014 \u062E\u0631\u064A\u0637\u0629 \u0639\u0644\u0627\u0642\u0627\u062A\u0643 \u0627\u0644\u0623\u0648\u0644\u0649 \u062C\u0627\u0647\u0632\u0629 \u0641\u064A \u062F\u0642\u064A\u0642\u062A\u064A\u0646 \u0641\u0642\u0637.\n\n\u0627\u0628\u062F\u0623 \u0645\u0646 \u0647\u0646\u0627: ${lead.personalLink}\n\n\u0627\u0644\u0644\u064A\u0646\u0643 \u062F\u0647 \u062E\u0627\u0635 \u0628\u064A\u0643.\n\n\u0628\u0627\u0644\u062A\u0648\u0641\u064A\u0642 \u{1F49C}\n\u0641\u0631\u064A\u0642 \u0627\u0644\u0631\u062D\u0644\u0629`
  );
}

// --- Sub-components ---

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

// --- Collapsible Wrapper ---
function CollapsibleSection({
  title,
  icon,
  subtitle,
  tooltip,
  defaultExpanded = false,
  badge,
  children,
  headerColors = "border-white/10 bg-white/5 text-slate-300",
}: {
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  tooltip?: string;
  defaultExpanded?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
  headerColors?: string;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all duration-300 ${headerColors}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 text-right hover:bg-white/5 transition-all"
      >
        <div className="flex items-center gap-3">
          {expanded ? <ChevronUp className="w-4 h-4 opacity-70" /> : <ChevronDown className="w-4 h-4 opacity-70" />}
          {badge}
        </div>
        <div>
          <div className="flex items-center justify-end gap-2">
            {tooltip && <AdminTooltip content={tooltip} position="right" />}
            <p className="text-sm font-black flex items-center gap-1.5">{title} {icon}</p>
          </div>
          {subtitle && <p className="text-[11px] text-white/50 mt-0.5">{subtitle}</p>}
        </div>
      </button>
      {expanded && <div className="p-5 overflow-hidden animation-fade-in border-t border-white/5">{children}</div>}
    </div>
  );
}

// --- Quick Send Lead Row ---
function QuickSendRow({
  lead,
  onMarkContacted,
}: {
  lead: QuickSendLead;
  onMarkContacted: (email: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [marked, setMarked] = useState(false);
  // Track manual clicks to dim buttons individually without hiding the row
  const [clickedChannels, setClickedChannels] = useState<Set<string>>(new Set());

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

  const handleChannelClick = (channel: string) => {
    setClickedChannels((prev) => new Set([...prev, channel]));
    if (channel === 'email' && !lead.emailSent) {
      // Fire and forget: Persist to backend so it survives reload and stops the cron job
      void fetch("/api/admin/marketing-ops", {
        method: "POST",
        body: JSON.stringify({ action: "mark_email_manual_sent", leadEmail: lead.email }),
      });
    }
  };

  if (marked) return null;

  const isEmailDone = lead.emailSent || clickedChannels.has('email');

  return (
    <div className={`border border-white/5 rounded-2xl p-4 bg-slate-900/40 space-y-3 transition-opacity ${lead.emailSent ? "opacity-80" : ""}`}>
      {/* Lead Info */}
      <div className="flex items-start justify-between">
        <div className="text-right">
          <p className="text-sm font-bold text-white">{lead.name ?? "\u2014"}</p>
          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 justify-end mt-0.5">
            {lead.emailSent ? (
               <span className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded text-[9px] font-black border border-emerald-500/20" title="\u0627\u0644\u0633\u064A\u0633\u062A\u0645 \u0628\u0639\u062A \u0627\u0644\u0625\u064A\u0645\u064A\u0644 \u0628\u0627\u0644\u0641\u0639\u0644">
                \u2714\uFE0F \u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0625\u064A\u0645\u064A\u0644 \u0622\u0644\u064A\u0627\u064B
              </span>
            ) : (
                <span className="bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded text-[9px] font-black border border-amber-500/20">
                \u23F3 \u0625\u064A\u0645\u064A\u0644 \u0641\u064A \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631
              </span>
            )}
            <span>{lead.email}</span>
          </div>
          {lead.phone && (
            <p className="text-[11px] text-slate-600 font-mono flex items-center gap-1 justify-end mt-1">
              <Phone className="w-3 h-3 text-slate-500" /> {lead.phone}
            </p>
          )}
        </div>
        <button
          onClick={handleMark}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-slate-400 border border-slate-500/20 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 transition-all shrink-0"
          title="\u0625\u062E\u0641\u0627\u0621 \u0647\u0630\u0627 \u0627\u0644\u0639\u0645\u064A\u0644 \u0645\u0646 \u0627\u0644\u0642\u0627\u0626\u0645\u0629 \u0646\u0647\u0627\u0626\u064A\u0627\u064B \u0628\u0639\u062F \u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u0639\u0645\u0644 \u0645\u0639\u0647"
        >
          <CheckCheck className="w-3 h-3" />
          {"\u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u0639\u0645\u0644 (\u0623\u0631\u0634\u0641\u0629)"}
        </button>
      </div>

      {/* Quick-Send Buttons */}
      <div className="flex flex-wrap gap-2 justify-end">
        {/* WhatsApp */}
        <a
          href={`https://wa.me/${phone.replace(/\+/, "")}?text=${encodedMsg}`}
          target="_blank" rel="noopener noreferrer"
          onClick={() => handleChannelClick('whatsapp')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
            clickedChannels.has('whatsapp')
              ? "bg-slate-800 text-slate-500/50 border border-slate-800"
              : "bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 hover:bg-[#25D366]/20"
          }`}

        >
          <MessageCircle className="w-3.5 h-3.5" />
          {"\u0648\u0627\u062A\u0633\u0627\u0628"}
        </a>

        {/* Telegram by phone */}
        <a
          href={`https://t.me/${phone}`}
          target="_blank" rel="noopener noreferrer"
          onClick={() => handleChannelClick('telegram')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
            clickedChannels.has('telegram')
              ? "bg-slate-800 text-slate-500/50 border border-slate-800"
              : "bg-[#0088cc]/10 text-[#0088cc] border border-[#0088cc]/20 hover:bg-[#0088cc]/20"
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          {"\u062A\u064A\u0644\u064A\u062C\u0631\u0627\u0645"}
        </a>

        {/* SMS */}
        <a
          href={`sms:${phone}?body=${encodedMsg}`}
          onClick={() => handleChannelClick('sms')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
            clickedChannels.has('sms')
               ? "bg-slate-800 text-slate-500/50 border border-slate-800"
               : "bg-slate-500/10 text-slate-300 border border-slate-500/20 hover:bg-slate-500/20"
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          SMS
        </a>

        {/* Email (Gmail Web Fallback) */}
        <a
          href={`https://mail.google.com/mail/u/0/?view=cm&fs=1&to=${encodeURIComponent(lead.email)}&su=${encodeURIComponent("\u062E\u0637\u0648\u062A\u0643 \u0627\u0644\u0623\u0648\u0644\u0649 \u0641\u064A \u0627\u0644\u0631\u062D\u0644\u0629 \u062A\u0646\u062A\u0638\u0631\u0643 \u2726")}&body=${buildEmailBody(lead)}`}
          target="_blank" rel="noopener noreferrer"
          title={isEmailDone ? "\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0625\u064A\u0645\u064A\u0644 \u0628\u0627\u0644\u0641\u0639\u0644\u060C \u062A\u062C\u0646\u0628 \u0627\u0644\u0625\u0632\u0639\u0627\u062C!" : ""}
          onClick={(e) => {
            if (isEmailDone) e.preventDefault();
            else handleChannelClick('email');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
            isEmailDone
              ? "bg-slate-800 text-slate-500/50 cursor-not-allowed border border-slate-800"
              : "bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20"
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          {"Gmail"}
        </a>

        {/* Copy Message */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
        >
          {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "\u062A\u0645 \u0627\u0644\u0646\u0633\u062E!" : "\u0646\u0633\u062E \u0627\u0644\u0631\u0633\u0627\u0644\u0629"}
        </button>
      </div>

      {/* Link preview */}
      <p className="text-[10px] text-slate-700 font-mono truncate text-right" dir="ltr">
        {lead.personalLink}
      </p>
    </div>
  );
}

// --- Main Panel ---

export function MarketingOpsPanel() {
  const [stats, setStats] = useState<OpsStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
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
      showToast("\u0641\u0634\u0644 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", false);
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
        showToast(`${label} \u2014 \u062A\u0645 \u0628\u0646\u062C\u0627\u062D \u2705`, true);
        await load();
      } else {
        showToast(`${label} \u2014 \u0641\u0634\u0644 \u274C`, false);
      }
    } catch {
      showToast("\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u0634\u0628\u0643\u0629", false);
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
  const convRate = sent > 0 ? `${Math.round((realStarts / sent) * 100)}%` : "\u2014";

  const availableLeads = (stats?.quickSendLeads ?? []).filter((l) => !contacted.has(l.email));

  const handleExportForGemini = () => {
    if (availableLeads.length === 0) {
      showToast("\u0644\u0627 \u064A\u0648\u062C\u062F Leads \u0645\u062A\u0627\u062D\u0629 \u0644\u0644\u0646\u0633\u062E", false);
      return;
    }
    const prompt = `\u0623\u0637\u0644\u0628 \u0645\u0646\u0643 \u0625\u0631\u0633\u0627\u0644 \u0628\u0631\u064A\u062F \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0641\u0631\u062F\u064A \u0645\u0646\u0641\u0635\u0644 \u0644\u0643\u0644 \u0634\u062E\u0635 \u0645\u0646 \u0627\u0644\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629.
\u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0645\u0631\u0633\u0644: \u0641\u0631\u064A\u0642 \u0639\u0645\u0644 \u0627\u0644\u0631\u062D\u0644\u0629 <hello@alrehla.app> (\u0625\u0630\u0627 \u0623\u0645\u0643\u0646).
\u0645\u0648\u0636\u0648\u0639 \u0627\u0644\u0631\u0633\u0627\u0644\u0629: \u062E\u0631\u064A\u0637\u0629 \u0639\u0644\u0627\u0642\u0627\u062A\u0643 \u0627\u0644\u0645\u062E\u0635\u0635\u0629 \u0645\u0646 \u0627\u0644\u0631\u062D\u0644\u0629 \u{1F9ED}
\u0646\u0635 \u0627\u0644\u0631\u0633\u0627\u0644\u0629: (\u0627\u0643\u062A\u0628 \u0631\u0633\u0627\u0644\u0629 \u062A\u0631\u062D\u064A\u0628\u064A\u0629 \u0642\u0635\u064A\u0631\u0629 \u0648\u062C\u0630\u0627\u0628\u0629 \u0628\u0627\u0644\u0644\u0647\u062C\u0629 \u0627\u0644\u0645\u0635\u0631\u064A\u0629 \u062A\u062F\u0639\u0648\u0647 \u0644\u0625\u0643\u0645\u0627\u0644 \u062E\u0631\u064A\u0637\u062A\u0647\u060C \u062B\u0645 \u0636\u0639 \u0627\u0644\u0631\u0627\u0628\u0637 \u0627\u0644\u0645\u062E\u0635\u0635 \u0627\u0644\u062E\u0627\u0635 \u0628\u0647).

\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0623\u0634\u062E\u0627\u0635 (\u0645\u0646 \u0641\u0636\u0644\u0643 \u0623\u0631\u0633\u0644 \u0643\u0644 \u0631\u0633\u0627\u0644\u0629 \u0639\u0644\u0649 \u062D\u062F\u0629):
${availableLeads.map((l, i) => `${i + 1}. \u0627\u0644\u0627\u0633\u0645: ${l.name || "بدون اسم"} | \u0627\u0644\u0625\u064A\u0645\u064A\u0644: ${l.email} | \u0627\u0644\u0631\u0627\u0628\u0637: ${l.personalLink}`).join('\n')}`;

    navigator.clipboard.writeText(prompt);
    showToast("\u062A\u0645 \u0646\u0633\u062E \u0627\u0644\u0640 Prompt \u0628\u0646\u062C\u0627\u062D \u0644\u0640 Gemini \u{1F9E0}\u2728", true);
  };


  return (
    <div className="space-y-6 text-slate-200" dir="rtl">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl font-bold text-sm shadow-2xl transition-all ${toast.ok ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            {"\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0627\u0646\u062A\u0634\u0627\u0631 (Marketing Ops)"}
            <AdminTooltip content={"\u0645\u0631\u0643\u0632 \u062A\u062D\u0643\u0645 \u0634\u0627\u0645\u0644 \u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062A\u0648\u0632\u064A\u0639\u060C \u0648\u062D\u0645\u0644\u0627\u062A \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0627\u0633\u062A\u0647\u062F\u0627\u0641\u060C \u0648\u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A\u0629 \u0623\u0648 \u0627\u0644\u064A\u062F\u0648\u064A\u0629 \u0644\u062A\u0648\u0633\u064A\u0639 \u062F\u0627\u0626\u0631\u0629 \u0627\u0644\u0631\u062D\u0644\u0629."} position="bottom" />
          </h2>
          <p className="text-slate-500 text-xs mt-1">{"\u0645\u0631\u0643\u0632 \u0627\u0644\u062A\u062D\u0643\u0645 \u0641\u064A \u062D\u0645\u0644\u0627\u062A \u0627\u0644\u0640 Outreach"}</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {"\u062A\u062D\u062F\u064A\u062B"}
        </button>
      </div>

      {/* Manual Lead Entry */}
      <CollapsibleSection
        title={"\u0625\u0636\u0627\u0641\u0629 1 Lead \u064A\u062F\u0648\u064A\u0627\u064B"}
        icon={<Phone className="w-4 h-4" />}
        subtitle={"\u0625\u062F\u062E\u0627\u0644 \u0633\u0631\u064A\u0639 \u0644\u0639\u0645\u064A\u0644 \u0645\u062D\u062A\u0645\u0644"}
        defaultExpanded={false}
      >
        <ManualLeadEntry 
          onSuccess={(msg) => {
            showToast(msg, true);
            void load();
          }} 
          onError={(msg) => showToast(msg, false)} 
        />
      </CollapsibleSection>

      {/* Stats Summary */}
      <CollapsibleSection
        title={"\u0645\u0624\u0634\u0631\u0627\u062A \u0627\u0644\u0623\u062F\u0627\u0621 \u0627\u0644\u0633\u0631\u064A\u0639\u0629"}
        icon={<Activity className="w-4 h-4" />}
        subtitle={"\u0646\u0638\u0631\u0629 \u0639\u0627\u0645\u0629 \u0639\u0644\u0649 \u0627\u0644\u0625\u0631\u0633\u0627\u0644 \u0648\u0627\u0644\u062A\u062D\u0648\u064A\u0644\u0627\u062A"}
        defaultExpanded={true}
        headerColors="border-indigo-500/20 bg-indigo-500/5 text-indigo-300"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title={"\u062A\u0645 \u0627\u0644\u0625\u0631\u0633\u0627\u0644"} value={sent} icon={<CheckCircle2 className="w-5 h-5" />} glowColor="teal" tooltip={"\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u0627\u0644\u062A\u0633\u0648\u064A\u0642\u064A\u0629 \u0623\u0648 \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A\u0629 \u0627\u0644\u062A\u064A \u062A\u0645 \u062A\u0648\u0635\u064A\u0644\u0647\u0627 \u0628\u0646\u062C\u0627\u062D \u0644\u0644\u062C\u0645\u0647\u0648\u0631 \u0639\u0628\u0631 \u0643\u0644 \u0627\u0644\u0642\u0646\u0648\u0627\u062A \u0627\u0644\u0645\u062A\u0627\u062D\u0629."} />
            <StatCard title={"\u0641\u064A \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631"} value={pending} icon={<Clock className="w-5 h-5" />} glowColor="amber" tooltip={"\u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0641\u064A \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631 (Queue) \u0644\u062C\u062F\u0648\u0644\u0629 \u0627\u0644\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A \u062A\u062F\u0631\u064A\u062C\u064A\u0627\u064B \u0644\u062A\u0641\u0627\u062F\u064A \u0627\u0644\u062D\u0638\u0631."} />
            <StatCard title={"\u0641\u0634\u0644 \u0627\u0644\u062A\u0648\u0635\u064A\u0644"} value={failed} icon={<AlertCircle className="w-5 h-5" />} glowColor="rose" tooltip={"\u0627\u0644\u0640 Leads \u0627\u0644\u0644\u064A \u0648\u0627\u062C\u0647\u0648\u0627 \u0645\u0634\u0643\u0644\u0629 \u0641\u064A \u0627\u0644\u0625\u0631\u0633\u0627\u0644 (\u063A\u0627\u0644\u0628\u0627\u064B \u0628\u0633\u0628\u0628 \u0627\u0646\u062A\u0647\u0627\u0621 \u0628\u0627\u0642\u0629 \u0627\u0644\u0625\u064A\u0645\u064A\u0644 \u0623\u0648 \u0628\u0631\u064A\u062F \u063A\u064A\u0631 \u0635\u0627\u0644\u062D)."} />
            <StatCard title={"\u0628\u062F\u0623 Onboarding"} value={realStarts} icon={<TrendingUp className="w-5 h-5" />} glowColor="indigo" tooltip={"\u0627\u0644\u0639\u062F\u062F \u0627\u0644\u0641\u0639\u0644\u064A \u0644\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646 \u0627\u0644\u0644\u064A \u0636\u063A\u0637\u0648\u0627 \u0639\u0644\u0649 \u0627\u0644\u0631\u0627\u0628\u0637 \u0627\u0644\u0645\u0631\u0633\u0644 \u0648\u0628\u062F\u0623\u0648\u0627 \u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u062A\u0634\u062E\u064A\u0635 \u0641\u064A \u0645\u0646\u0635\u0629 \u0627\u0644\u0631\u062D\u0644\u0629."} />
          </div>

          <div className="rounded-2xl bg-white/[0.02] p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{"\u0645\u0639\u062F\u0644 \u0627\u0644\u062A\u062D\u0648\u064A\u0644 \u0627\u0644\u0641\u0639\u0644\u064A"}</p>
                <p className="text-4xl font-black text-white mt-1">{convRate}</p>
                <p className="text-[11px] text-slate-500 mt-1">{realStarts} {"\u0628\u062F\u0627\u064A\u0629 \u062D\u0642\u064A\u0642\u064A\u0629 \u0645\u0646"} {sent} {"\u0625\u0631\u0633\u0627\u0644"}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-black uppercase text-slate-500 mb-2">{"\u062A\u0648\u0632\u064A\u0639 \u0627\u0644\u0642\u0646\u0627\u0629"}</div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-end gap-2 text-xs">
                  <span className="text-slate-400">{c["sent"] ?? 0} {"\u0625\u064A\u0645\u064A\u0644"}</span>
                  <Mail className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <div className="flex items-center justify-end gap-2 text-xs">
                  <span className="text-slate-400">{c["simulated"] ?? 0} {"\u0648\u0627\u062A\u0633\u0627\u0628 (\u0645\u062D\u0627\u0643\u0627\u0629)"}</span>
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Email Engagement Analytics */}
      {stats?.emailMetrics && (
        <CollapsibleSection
          title={"\u062A\u062D\u0644\u064A\u0644\u0627\u062A \u0627\u0644\u0628\u0631\u064A\u062F (Email Analytics)"}
          icon={<Mail className="w-4 h-4" />}
          subtitle={"\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0640 Webhook \u0627\u0644\u0644\u062D\u0638\u064A\u0629 \u0644\u0644\u0640 Open Rate \u0648\u0627\u0644\u0640 Clicks"}
          defaultExpanded={false}
          headerColors="border-sky-500/20 bg-sky-500/5 text-sky-300"
        >
          <div className="space-y-4">
            <div className="space-y-3">
              {[
                { label: "\u0645\u0639\u062F\u0644 \u0627\u0644\u0641\u062A\u062D", rate: stats.emailMetrics.openRate, count: stats.emailMetrics.opened, color: "bg-emerald-400" },
                { label: "\u0645\u0639\u062F\u0644 \u0627\u0644\u0646\u0642\u0631", rate: stats.emailMetrics.clickRate, count: stats.emailMetrics.clicked, color: "bg-sky-400" },
                { label: "\u0645\u0639\u062F\u0644 \u0627\u0644\u0627\u0631\u062A\u062F\u0627\u062F", rate: stats.emailMetrics.bounceRate, count: stats.emailMetrics.bounced, color: "bg-rose-400" },
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

            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { label: "\u062A\u0645 \u0627\u0644\u0625\u0631\u0633\u0627\u0644", value: stats.emailMetrics.sent, color: "text-slate-300" },
                { label: "\u0623\u0644\u063A\u0648\u0627 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643", value: stats.emailMetrics.unsubscribed, color: "text-amber-400" },
                { label: "\u0634\u0643\u0627\u0648\u0649", value: stats.emailMetrics.complained, color: "text-rose-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <p className={`text-xl font-black ${color}`}>{value}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Auto Actions */}
      <CollapsibleSection
        title={"\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u062A\u0644\u0642\u0627\u0626\u064A\u0629"}
        icon={<Zap className="w-4 h-4" />}
        subtitle={"\u00AB\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u062F\u0641\u0639\u0629 \u0627\u0644\u0622\u0646\u00BB \u00B7 \u00AB\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u0631\u0641\u0648\u0636\u0629\u00BB"}
        tooltip={"\u0623\u0648\u0627\u0645\u0631 \u0644\u0644\u062A\u062D\u0643\u0645 \u0627\u0644\u064A\u062F\u0648\u064A \u0641\u064A \u0627\u0644\u0637\u0648\u0627\u0628\u064A\u0631 (Queues). \u0627\u0644\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0641\u0648\u0631\u064A \u0628\u064A\u062A\u062E\u0637\u0649 \u0627\u0644\u062C\u062F\u0648\u0644 \u0627\u0644\u0632\u0645\u0646\u064A\u060C \u0648\u0627\u0644\u0640 Reset \u0628\u064A\u0631\u062C\u0639 \u0627\u0644\u062F\u0627\u062A\u0627 \u0644\u0644\u062D\u0627\u0644\u0629 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A\u0629 \u0644\u0644\u062A\u062C\u0631\u0628\u0629 \u062A\u0627\u0646\u064A."}
        defaultExpanded={false}
        headerColors="border-amber-500/20 bg-amber-500/5 text-amber-300"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <ActionButton label={"\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u062F\u0641\u0639\u0629 \u0627\u0644\u0622\u0646"} icon={<Send className="w-4 h-4" />}
              onClick={() => handleAction("trigger_batch", "\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u062F\u0641\u0639\u0629")}
              loading={actionLoading === "trigger_batch"} variant="primary" />
            <ActionButton label={"\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u0631\u0641\u0648\u0636\u0629 \u0644\u0644\u0627\u0646\u062A\u0638\u0627\u0631"} icon={<RotateCcw className="w-4 h-4" />}
              onClick={() => handleAction("reset_failed", "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0641\u0627\u0634\u0644")}
              loading={actionLoading === "reset_failed"} variant="warning" />
          </div>
          <p className="text-[10px] text-amber-200/50">
            {"\u00AB\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u062F\u0641\u0639\u0629\u00BB \u064A\u0634\u063A\u0651\u0644 \u0627\u0644\u0640 Cron \u0641\u0648\u0631\u0627\u064B \u2014 \u064A\u062E\u0636\u0639 \u0644\u062D\u062F Resend \u0627\u0644\u064A\u0648\u0645\u064A (100 \u0625\u064A\u0645\u064A\u0644/\u064A\u0648\u0645 \u0639\u0644\u0649 \u0627\u0644\u062E\u0637\u0629 \u0627\u0644\u0645\u062C\u0627\u0646\u064A\u0629)."}
          </p>
        </div>
      </CollapsibleSection>

      {/* Quick Send Panel */}
      <CollapsibleSection
        title={"\u0625\u0631\u0633\u0627\u0644 \u064A\u062F\u0648\u064A \u0633\u0631\u064A\u0639"}
        icon={<span>{"\u{1F4F1}"}</span>}
        subtitle={"\u0648\u0627\u062A\u0633\u0627\u0628 \u00B7 \u062A\u064A\u0644\u064A\u062C\u0631\u0627\u0645 \u00B7 SMS \u00B7 \u0625\u064A\u0645\u064A\u0644 \u064A\u062F\u0648\u064A \u2014 \u0645\u062C\u0627\u0646\u0627\u064B \u062A\u0645\u0627\u0645\u0627\u064B"}
        tooltip={"\u0644\u0648\u062D\u0629 \u0627\u0644\u062F\u0639\u0645 \u0627\u0644\u0633\u0631\u064A\u0639\u060C \u062A\u0633\u0645\u062D \u0644\u0644\u0645\u0627\u0644\u0643 \u0628\u0625\u0631\u0633\u0627\u0644 \u0631\u0648\u0627\u0628\u0637 \u0645\u062E\u0635\u0635\u0629 \u0628\u0634\u0643\u0644 \u0641\u0631\u062F\u064A \u0644\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646 \u0639\u0646 \u0637\u0631\u064A\u0642 \u0642\u0646\u0648\u0627\u062A \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629 \u062E\u0627\u0631\u062C \u062D\u0635\u0629 \u0627\u0644\u0625\u064A\u0645\u064A\u0644\u0627\u062A (Quota)."}
        badge={<span className="text-[11px] text-emerald-400 font-black">{availableLeads.length} {"\u062C\u0647\u0629 \u0645\u062A\u0627\u062D\u0629"}</span>}
        defaultExpanded={true}
        headerColors="border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
      >
        <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
          {/* Info Banner & Actions */}
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex-1 rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-3 text-right text-[11px] text-emerald-200/70">
              <strong className="text-emerald-400">{"\u0643\u064A\u0641 \u064A\u0634\u062A\u063A\u0644:"}</strong> {"\u0643\u0644 \u0632\u0631\u0627\u0631 \u0628\u064A\u0641\u062A\u062D\u0644\u0643 \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0648\u0641\u064A\u0647 \u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u062C\u0627\u0647\u0632\u0629 \u0628\u0627\u0644\u0627\u0633\u0645 + \u0627\u0644\u0644\u064A\u0646\u0643 \u0627\u0644\u0634\u062E\u0635\u064A. \u0627\u0644\u0625\u064A\u0645\u064A\u0644 \u0627\u0644\u064A\u062F\u0648\u064A \u0628\u064A\u0641\u062A\u062D Gmail/Outlook \u0645\u0646 \u063A\u064A\u0631 \u0645\u0627 \u062A\u0633\u062A\u0647\u0644\u0643 \u0643\u0648\u062A\u0629 Resend."}
            </div>
            {availableLeads.length > 0 && (
              <button
                onClick={handleExportForGemini}
                className="flex flex-col items-center justify-center shrink-0 w-[100px] h-[60px] rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-300 hover:text-indigo-100 hover:border-indigo-400 hover:from-indigo-500/30 hover:to-purple-500/30 transition-all font-bold text-[10px] gap-1 shadow-[0_0_15px_-3px_rgba(99,102,241,0.2)]"
                title="\u0646\u0633\u062E \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631 \u0644\u0625\u0631\u0633\u0627\u0644\u0647\u0627 \u063A\u0628\u0631 Gemini"
              >
                <div className="flex gap-1 items-center">
                  <Copy className="w-4 h-4" />
                  <span>Gemini</span>
                </div>
                <span className="text-[9px] opacity-70">\u0646\u0633\u062E \u0627\u0644\u0640 Prompt</span>
              </button>
            )}
          </div>

          {availableLeads.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">{"\u2705 \u0643\u0644 \u0627\u0644\u0640 Leads \u0627\u0644\u062D\u0627\u0644\u064A\u064A\u0646 \u062A\u0645 \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0645\u0639\u0647\u0645 \u0623\u0648 \u062A\u0645\u062A \u0645\u0639\u0627\u0644\u062C\u062A\u0647\u0645 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B."}</p>
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
      </CollapsibleSection>

      {/* Two-col: Recent Sent + Errors */}
      <CollapsibleSection
        title={"\u0633\u062C\u0644\u0627\u062A \u0627\u0644\u0625\u0631\u0633\u0627\u0644 \u0648\u0627\u0644\u0623\u062E\u0637\u0627\u0621"}
        icon={<Clock className="w-4 h-4" />}
        subtitle={"\u0645\u0631\u0627\u0642\u0628\u0629 \u0627\u0644\u0639\u0645\u0644\u064A\u0627\u062A \u0627\u0644\u0623\u062E\u064A\u0631\u0629"}
        defaultExpanded={false}
        headerColors="border-slate-500/20 bg-slate-500/5 text-slate-300"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/5 bg-black/20 p-5">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{"\u0622\u062E\u0631 \u0631\u0633\u0627\u0626\u0644 \u0645\u0631\u0633\u0644\u0629"}</p>
            </div>
            {(stats?.recentSent ?? []).length === 0 ? (
              <p className="text-xs text-slate-600">{"\u0644\u0627 \u064A\u0648\u062C\u062F \u0625\u0631\u0633\u0627\u0644 \u0628\u0639\u062F"}</p>
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

          <div className="rounded-2xl border border-rose-500/10 bg-rose-500/5 p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{"\u0622\u062E\u0631 \u0623\u062E\u0637\u0627\u0621"}</p>
            </div>
            {(stats?.recentErrors ?? []).length === 0 ? (
              <p className="text-xs text-emerald-400">{"\u2705 \u0644\u0627 \u062A\u0648\u062C\u062F \u0623\u062E\u0637\u0627\u0621 \u062D\u0627\u0644\u064A\u0627\u064B"}</p>
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
      </CollapsibleSection>

      {/* Quota warning */}
      {failed > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3 mt-4">
          <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-300">{"\u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u0640 Quota \u0627\u0644\u064A\u0648\u0645\u064A\u061F"} ({"\u064A\u0648\u062C\u062F"} {failed} {"\u0645\u0631\u0641\u0648\u0636"})</p>
            <p className="text-xs text-amber-400/70 mt-1">
              {"\u0644\u0648 \u0627\u0644\u0633\u0628\u0628 \u0647\u0648 `429 daily_quota_exceeded`\u060C \u0627\u0636\u063A\u0637 \u00AB\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u0631\u0641\u0648\u0636\u0629\u00BB \u0645\u0646 \u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A\u0629 \u063A\u062F\u0627\u064B \u0627\u0644\u0635\u0628\u062D \u0628\u0639\u062F \u062A\u062C\u062F\u064A\u062F \u0627\u0644\u0640 Quota."}
            </p>
          </div>
        </div>
      )}

      {/* Total */}
      <div className="text-center text-[11px] text-slate-600 flex items-center justify-center gap-2 pt-6">
        <Users className="w-3.5 h-3.5" />
        {"\u0625\u062C\u0645\u0627\u0644\u064A \u0633\u062C\u0644\u0627\u062A \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631:"} {stats?.totalLeads ?? "\u2014"}
      </div>
    </div>
  );
}
