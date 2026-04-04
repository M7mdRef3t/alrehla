"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Radio,
  Orbit,
  Crosshair,
  Radar,
  Ghost,
  GitMerge
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

interface RippleNode {
  id: string;
  label: string;
  status: string;
  parentId: string | null;
}

interface OpsStats {
  ok: boolean;
  totalLeads: number;
  counts: Record<string, number>;
  uniqueEntitiesReached: number;
  channelBreakdown: Record<string, number>;
  totalDatabaseLeads: number;
  leadsBySource: Record<string, number>;
  leadsByCampaign: Record<string, number>;
  conversionsByCampaign?: Record<string, number>;
  conversionsBySource?: Record<string, number>;
  realStarts: number;
  recentErrors: Array<{ lead_email: string; channel: string; last_error: string; updated_at: string }>;
  recentSent: Array<{ lead_email: string; channel: string; sent_at: string }>;
  quickSendLeads: QuickSendLead[];
  rippleTree?: RippleNode[];
  emailMetrics?: EmailMetrics;
  rawLeads?: any[];
  flowStats?: {
    byStep: Record<string, number>;
    avgTimeToActionMs: number | null;
    addPersonCompletionRate: number | null;
    pulseAbandonedByReason?: Record<string, number>;
  } | null;
  conversionHealth?: {
    pathStarted24h: number;
    mapsGenerated24h: number;
    addPersonOpened24h: number;
    addPersonDone24h: number;
    journeyMapsTotal: number;
  } | null;
}

// --- Constants ---
const OWNER_PHONE = "+201140111147";
const OWNER_EMAIL = "hello@alrehla.app";

// --- Helpers ---

import { getAuthToken } from "../../../../state/authState";
import { useAdminState } from "../../../../state/adminState";
import { CampaignLeadsModal } from "./CampaignLeadsModal";

function getBearerToken(): string {
  return getAuthToken() ?? useAdminState.getState().adminCode ?? "";
}

async function fetchStats(): Promise<OpsStats> {
  const state = useAdminState.getState();
  const cache = state.opsStatsCache;
  const now = Date.now();
  if (cache && now - cache.timestamp < 60_000) {
    return cache.data;
  }

  const res = await fetch("/api/admin/marketing-ops", {
    headers: { authorization: `Bearer ${getBearerToken()}` },
  });
  if (!res.ok) {
    throw new Error(`marketing_ops_stats_failed:${res.status}`);
  }
  const data = await res.json() as OpsStats;
  state.setOpsStatsCache(data);
  return data;
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

function buildMessage(lead: QuickSendLead, isGhostMode: boolean = false): string {
  const greeting = lead.name ? `\u0623\u0647\u0644\u0627\u064B ${lead.name}\u060C` : "\u0623\u0647\u0644\u0627\u064B\u060C";
  const link = isGhostMode ? `${lead.personalLink}&ghost=1` : lead.personalLink;
  if (isGhostMode) {
    return `${greeting}\n\nتم فتح خريطة علاقاتك الآن بواسطة إحدى أرواح الرحلة.\nللحفاظ على طاقة المنصة، ستتلاشى هذه الدعوة ذاتياً بعد 12 ساعة.\n\nاستخدم مفتاحك من هنا قبل نفاذ الوقت: ${link}`;
  }
  return `${greeting} \u0645\u0639\u0643 \u0641\u0631\u064A\u0642 \u0639\u0645\u0644 \u0627\u0644\u0631\u062D\u0644\u0629 \u{1F319}\n\u0634\u0643\u0631\u0627\u064B \u0644\u0627\u0647\u062A\u0645\u0627\u0645\u0643 \u2014 \u062E\u0631\u064A\u0637\u0629 \u0639\u0644\u0627\u0642\u0627\u062A\u0643 \u062C\u0627\u0647\u0632\u0629 \u0641\u064A \u062F\u0642\u064A\u0642\u062A\u064A\u0646.\n\u0627\u0628\u062F\u0623 \u0645\u0646 \u0647\u0646\u0627: ${link}`;
}

function buildEmailBody(lead: QuickSendLead, isGhostMode: boolean = false): string {
  const greeting = lead.name ? `\u0623\u0647\u0644\u0627\u064B ${lead.name}\u060C` : "\u0623\u0647\u0644\u0627\u064B\u060C";
  const link = isGhostMode ? `${lead.personalLink}&ghost=1` : lead.personalLink;
  if (isGhostMode) {
    return encodeURIComponent(
      `${greeting}\n\nتم توليد خريطة علاقاتك حصرياً بواسطة صديق من داخل الرحلة.\nهذه الإشارة تتلف ذاتياً خلال 12 ساعة للحفاظ على ندرة وطاقة المنصة.\n\nاستخدم الرابط الآتي قبل التلاشي: ${link}\n\nننتظرك في الجانب الآخر 🌑`
    );
  }
  return encodeURIComponent(
    `${greeting}\n\n\u0645\u0639\u0643 \u0641\u0631\u064A\u0642 \u0639\u0645\u0644 \u0627\u0644\u0631\u062D\u0644\u0629.\n\u0634\u0643\u0631\u0627\u064B \u0644\u0627\u0647\u062A\u0645\u0627\u0645\u0643 \u0628\u0627\u0644\u0645\u0646\u0635\u0629 \u2014 \u062E\u0631\u064A\u0637\u0629 \u0639\u0644\u0627\u0642\u0627\u062A\u0643 \u0627\u0644\u0623\u0648\u0644\u0649 \u062C\u0627\u0647\u0632\u0629 \u0641\u064A \u062F\u0642\u064A\u0642\u062A\u064A\u0646 \u0641\u0642\u0637.\n\n\u0627\u0628\u062F\u0623 \u0645\u0646 \u0647\u0646\u0627: ${link}\n\n\u0627\u0644\u0644\u064A\u0646\u0643 \u062F\u0647 \u062E\u0627\u0635 \u0628\u064A\u0643.\n\n\u0628\u0627\u0644\u062A\u0648\u0641\u064A\u0642 \u{1F49C}\n\u0641\u0631\u064A\u0642 \u0627\u0644\u0631\u062D\u0644\u0629`
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
  headerColors = "border-white/5 bg-white/[0.02] text-slate-300",
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
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl border backdrop-blur-xl overflow-hidden transition-all duration-300 ${headerColors} shadow-[0_0_15px_rgba(0,0,0,0.5)]`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 text-right hover:bg-white/5 transition-all text-right"
      >
        <div className="text-right">
          <div className="flex items-center gap-2">
            <p className="text-sm font-black flex items-center gap-2 uppercase tracking-widest">{icon} {title}</p>
            {tooltip && <AdminTooltip content={tooltip} position="bottom" />}
          </div>
          {subtitle && <p className="text-[11px] text-white/40 mt-1 uppercase tracking-widest">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          {badge}
          {expanded ? <ChevronUp className="w-4 h-4 opacity-70" /> : <ChevronDown className="w-4 h-4 opacity-70" />}
        </div>
      </button>
      <AnimatePresence>
      {expanded && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="p-5 overflow-hidden border-t border-white/5 bg-black/20"
        >
          {children}
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- Quick Send Lead Row ---
function QuickSendRow({
  lead,
  onMarkContacted,
  isGhostMode = false,
}: {
  lead: QuickSendLead;
  onMarkContacted: (email: string) => void;
  isGhostMode?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [marked, setMarked] = useState(false);
  // Track manual clicks to dim buttons individually without hiding the row
  const [clickedChannels, setClickedChannels] = useState<Set<string>>(new Set());

  const msg = buildMessage(lead, isGhostMode);
  const encodedMsg = encodeURIComponent(msg);
  const phone = lead.phone ?? OWNER_PHONE;
  const emailHref = `https://mail.google.com/mail/u/0/?view=cm&fs=1&to=${encodeURIComponent(lead.email)}&su=${encodeURIComponent(isGhostMode ? "نداء الاستيقاظ ✦" : "نداء الاستيقاظ لرحلتك ✦")}&body=${buildEmailBody(lead, isGhostMode)}`;

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
        </button>
      </div>

      {/* Quick-Send Buttons */}
      <div className="flex flex-wrap gap-2 justify-end">
        {/* WhatsApp */}
        <a
          href={`https://wa.me/${phone.replace(/\+/, "")}?text=${encodedMsg}`}
          target="_blank" rel="noopener noreferrer"
          onClick={() => handleChannelClick('whatsapp')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black tracking-widest transition-all shadow-lg ${
            clickedChannels.has('whatsapp')
              ? "bg-slate-800 text-slate-500/50 border border-slate-800"
              : "bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/30 hover:scale-105"
          }`}

        >
          <MessageCircle className="w-4 h-4" />
          SIGNAL: WHATSAPP
        </a>

        {/* Telegram by phone */}
        <a
          href={`https://t.me/${phone}`}
          target="_blank" rel="noopener noreferrer"
          onClick={() => handleChannelClick('telegram')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black tracking-widest transition-all shadow-lg ${
            clickedChannels.has('telegram')
              ? "bg-slate-800 text-slate-500/50 border border-slate-800"
              : "bg-[#0088cc]/20 text-[#0088cc] border border-[#0088cc]/30 hover:bg-[#0088cc]/30 hover:scale-105"
          }`}
        >
          <Send className="w-4 h-4" />
          SIGNAL: TELEGRAM
        </a>

        {/* SMS */}
        <a
          href={`sms:${phone}?body=${encodedMsg}`}
          onClick={() => handleChannelClick('sms')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black tracking-widest transition-all shadow-lg ${
            clickedChannels.has('sms')
               ? "bg-slate-800 text-slate-500/50 border border-slate-800"
               : "bg-slate-500/20 text-slate-300 border border-slate-500/30 hover:bg-slate-500/30 hover:scale-105"
          }`}
        >
          <Phone className="w-4 h-4" />
          SIGNAL: SMS
        </a>

        {/* Email (Gmail Web Fallback) */}
        <a
          href={emailHref}
          target="_blank" rel="noopener noreferrer"
          title={isEmailDone ? "تم بث النداء، لا تقم بتوليد ضجيج زائد." : ""}
          onClick={(e) => {
            if (isEmailDone) e.preventDefault();
            else handleChannelClick('email');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black tracking-widest transition-all shadow-lg ${
            isEmailDone
              ? "bg-slate-800 text-slate-500/50 cursor-not-allowed border border-slate-800"
              : "bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:bg-sky-500/30 hover:scale-105"
          }`}
        >
          <Mail className="w-4 h-4" />
          SIGNAL: EMAIL
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

// --- Ripple Effect Component ---
function RippleEffectGraph({ nodes }: { nodes: RippleNode[] }) {
  if (!nodes || nodes.length === 0) return <div className="text-center text-xs text-slate-500 py-8">لا توجد بيانات للأثر بعد</div>;

  const roots = nodes.filter(n => !n.parentId);
  
  const renderNode = (node: RippleNode, depth = 0) => {
    const children = nodes.filter(n => n.parentId === node.id);
    const color = node.status === 'active' ? 'text-teal-400 bg-teal-400/10 border-teal-400/30 shadow-[0_0_8px_rgba(45,212,191,0.3)]' : 
                  node.status === 'pending' ? 'text-amber-400 bg-amber-400/10 border-amber-400/30' : 
                  'text-slate-500 bg-slate-800 border-slate-700 opacity-60';

    return (
      <div key={node.id} className="relative">
        <div className={`flex items-center gap-2 my-2 w-max px-3 py-1.5 rounded-full border text-[10px] font-black tracking-widest ${color}`} style={{ marginRight: `${depth * 24}px` }}>
          <div className={`w-2 h-2 shrink-0 rounded-full ${node.status === 'active' ? 'bg-teal-400 animate-pulse' : node.status === 'pending' ? 'bg-amber-400' : 'bg-slate-500'}`} />
          <span>{node.label}</span>
        </div>
        {children.length > 0 && (
          <div className="border-r border-white/10 mr-[11px] pr-3 py-1">
            {children.map(c => renderNode(c, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-5 bg-black/20 rounded-2xl border border-white/5 overflow-x-auto min-h-[150px]" dir="rtl">
      {roots.map(r => renderNode(r, 0))}
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
  const [ghostMode, setGhostMode] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<{ type: "campaign" | "source"; value: string } | null>(null);
  const [repairLoading, setRepairLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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

  const handleRepair = async () => {
    setRepairLoading(true);
    try {
      const res = await fetch("/api/admin/marketing-ops/repair", {
        method: "POST",
        headers: { authorization: `Bearer ${getBearerToken()}` }
      });
      const data = await res.json();
      if (data.ok) {
        showToast(`تم تصحيح ${data.metaCount} ليد فيسبوك و ${data.waCount} واتساب ✅`, true);
        // Clear the cache so fetchStats forces a fresh fetch from server
        useAdminState.setState({ opsStatsCache: null });
        await load();
      } else {
        showToast("\u0641\u0634\u0644 \u0625\u0635\u0644\u0627\u0622 \u0627\u0644\u062A\u062A\u0628\u0639", false);
      }
    } catch {
      showToast("\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u0627\u062A\u0635\u0627\u0644", false);
    } finally {
      setRepairLoading(false);
    }
  };

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
  const channelBreakdown = stats?.channelBreakdown ?? {};
  const uniqueEntities = stats?.uniqueEntitiesReached ?? 0;
  const sent = (c["sent"] ?? 0) + (c["simulated"] ?? 0);
  const pending = c["pending"] ?? 0;
  const failed = (c["failed"] ?? 0);
  const realStarts = stats?.realStarts ?? 0;
  // Convert based on Unique contacts rather than total signals for better accuracy
  const convRate = uniqueEntities > 0 ? `${Math.round((realStarts / uniqueEntities) * 100)}%` : "\u2014";

  const availableLeads = (stats?.quickSendLeads ?? []).filter((l) => {
    const isNotContacted = !contacted.has(l.email);
    if (!searchQuery) return isNotContacted;
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      l.name?.toLowerCase().includes(q) || 
      l.email.toLowerCase().includes(q) || 
      l.phone?.includes(q);
    return isNotContacted && matchesSearch;
  });

  const handleExportForGemini = () => {
    if (availableLeads.length === 0) {
      showToast("\u0644\u0627 \u0644\u0627 \u064A\u0648\u062C\u062F Leads \u0645\u062A\u0627\u062D\u0629 \u0644\u0644\u0646\u0633\u062E", false);
      return;
    }
    const prompt = `\u0623\u0637\u0644\u0628 \u0645\u0646\u0643 \u0625\u0631\u0633\u0627\u0644 \u0628\u0631\u064A\u062F \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0641\u0631\u062F\u064A \u0645\u0646\u0641\u0635\u0644 \u0644\u0643\u0644 \u0634\u062E\u0635 \u0645\u0646 \u0627\u0644\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629.
\u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0645\u0631\u0633\u0644: \u0641\u0631\u064A\u0642 \u0639\u0645\u0644 \u0627\u0644\u0631\u062D\u0644\u0629 <hello@alrehla.app> (\u0625\u0630\u0627 \u0623\u0645\u0643\u0646).
\u0645\u0648\u0636\u0648\u0639 \u0627\u0644\u0631\u0633\u0627\u0644\u0629: \u062E\u0631\u064A\u0637\u0629 \u0639\u0644\u0627\u0642\u0627\u062A\u0643 \u0627\u0644\u0645\u062E\u0635\u0635\u0629 \u0645\u0646 \u0627\u0644\u0631\u062D\u0644\u0629 \u{1F9ED}
\u0646\u0635 \u0627\u0644\u0631\u0633\u0627\u0644\u0629: (\u0627\u0643\u062A\u0628 \u0631\u0633\u0627\u0644\u0629 \u062A\u0631\u062D\u064A\u0628\u064A\u0629 \u0642\u0635\u064A\u0631\u0629 \u0648\u062C\u0630\u0627\u0628\u0629 \u0628\u0627\u0644\u0644\u0644\u0647\u062C\u0629 \u0627\u0644\u0645\u0635\u0631\u064A\u0629 \u062A\u062F\u0639\u0648\u0647 \u0644\u0625\u0643\u0645\u0627\u0644 \u062E\u0631\u064A\u0637\u062A\u0647\u060C \u062B\u0645 \u0636\u0639 \u0627\u0644\u0631\u0627\u0628\u0637 \u0627\u0644\u0645\u062E\u0635\u0635 \u0627\u0644\u062E\u0627\u0635 \u0628\u0647).

\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0623\u0634\u062E\u0627\u0635 (\u0645\u0646 \u0641\u0636\u0644\u0643 \u0623\u0631\u0633\u0644 \u0643\u0644 \u0631\u0633\u0627\u0644\u0629 \u0639\u0644\u0649 \u062D\u062F\u0629):
${availableLeads.map((l, i) => `${i + 1}. \u0627\u0644\u0627\u0633\u0645: ${l.name || "بدون اسم"} | \u0627\u0644\u0625\u064A\u0645\u064A\u0644: ${l.email} | \u0627\u0644\u0631\u0627\u0628\u0637: ${l.personalLink}`).join('\n')}`;

    navigator.clipboard.writeText(prompt);
    showToast("\u062A\u0645 \u0646\u0633\u062E \u0627\u0644\u0640 Prompt \u0628\u0646\u062C\u0627\u062D \u0644\u0640 Gemini \u{1F9E0}\u2728", true);
  };


  return (
    <div className="space-y-6 text-slate-200 max-w-5xl mx-auto" dir="rtl">
      {/* Toast */}
      <AnimatePresence>
      {toast && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl font-black text-sm shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all flex items-center gap-3 uppercase tracking-widest backdrop-blur-xl border ${toast.ok ? "bg-emerald-900/50 text-emerald-400 border-emerald-500/20" : "bg-rose-900/50 text-rose-400 border-rose-500/20"}`}>
          {toast.ok ? <Orbit className="w-5 h-5 animate-spin-slow" /> : <AlertCircle className="w-5 h-5" />}
          {toast.msg}
        </motion.div>
      )}
      </AnimatePresence>

      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between mb-8 bg-slate-900/30 p-6 rounded-3xl border border-indigo-500/10 shadow-[0_0_40px_rgba(99,102,241,0.05)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-4 w-full md:w-auto mb-4 md:mb-0">
          <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
            <Radio className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-l from-indigo-400 to-purple-400 flex items-center gap-2">
              {"مصفوفة الامتداد والنداء"}
              <AdminTooltip content={"مركز القيادة الفوقي لإطلاق نداء الملاذ للأرواح المدعوة خارج النظام. يمكنك بث الترددات الحيوية من هنا، ومراقبة الـ Resonance."} position="bottom" />
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
              <p className="text-indigo-400/80 text-xs font-bold uppercase tracking-widest">{"محطة النشر وتوجيه السبل"}</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative group w-full md:w-64">
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-indigo-400/50 group-focus-within:text-indigo-400 transition-colors">
              <Crosshair className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="ابحث عن روح (الاسم، الإيميل، الهاتف)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pr-10 pl-4 text-xs font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 left-3 flex items-center text-slate-500 hover:text-white transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button 
            onClick={handleRepair} 
            disabled={repairLoading || loading}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
            title="إصلاح تتبع المصادر لليدز القديمة"
          >
            <Zap className={`w-3.5 h-3.5 ${repairLoading ? "animate-pulse" : ""}`} />
            {repairLoading ? "جاري التعميد..." : "تعميد البيانات القديمة"}
          </button>

          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-black uppercase tracking-widest hover:bg-indigo-500/20 hover:text-indigo-200 transition-all active:scale-95 disabled:opacity-50 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {"تحديث الرادار"}
          </button>
        </div>
      </div>
    </header>

      {/* Acquisition Sources */}
      <CollapsibleSection
        title={"بوابات العبور"}
        icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
        subtitle={"تحليل مصادر وتدفق الأرواح المكتسبة إلى قاعدة بيانات الملاذ."}
        defaultExpanded={true}
        headerColors="border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard 
              title={"إجمالي الأرواح المكتسبة"} 
              value={stats?.totalDatabaseLeads ?? 0} 
              icon={<Radar className="w-5 h-5" />} 
              glowColor="emerald" 
              tooltip={"إجمالي التسجيلات وقواعد البيانات المحفوظة (Leads) في الملاذ من جميع المصادر."} 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* By Campaign */}
            <div className="rounded-2xl bg-white/[0.02] p-5 border border-white/5">
              <h3 className="text-xs font-black uppercase tracking-widest text-emerald-500/80 mb-4">التدفق عبر الحملات الإعلانية</h3>
              <div className="space-y-3 relative z-10">
                {Object.entries(stats?.leadsByCampaign ?? {}).sort((a,b) => b[1] - a[1]).map(([campaign, count]) => {
                  const label = campaign === "undefined" || campaign === "unattributed" ? "بدون حملة" : campaign;
                  const maxCount = Math.max(...Object.values(stats?.leadsByCampaign ?? {}), 1);
                  const percentage = (count / maxCount) * 100;
                  const conversions = stats?.conversionsByCampaign?.[campaign] ?? 0;
                  const cr = count > 0 ? Math.round((conversions / count) * 100) : 0;
                  return (
                  <button 
                    key={campaign} 
                    onClick={() => setSelectedFilter({ type: "campaign", value: campaign })}
                    className="relative w-full flex items-center justify-between hover:bg-white/[0.05] p-2 -mx-2 rounded-lg transition-colors cursor-pointer group overflow-hidden text-right"
                  >
                    <div className="absolute top-0 right-0 h-full bg-emerald-500/10 rounded-lg transition-all duration-500 ease-out z-0" style={{ width: `${percentage}%` }} />
                    <div className="relative z-10 flex items-center gap-2">
                       <span className="text-sm font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full group-hover:bg-emerald-500/20 shadow-sm transition-colors">{count}</span>
                       {(conversions > 0) && (
                         <span className="text-[10px] font-bold text-fuchsia-400 bg-fuchsia-500/10 px-2 py-1 rounded-full" title="تحويلات فعلية (نسبة مئوية)">
                           {cr}% نسبة التحويل
                         </span>
                       )}
                    </div>
                    <span className="relative z-10 text-sm text-slate-300 truncate max-w-[50%] group-hover:text-emerald-300 transition-colors" title={label}>{label}</span>
                  </button>
                )})}
                {Object.keys(stats?.leadsByCampaign ?? {}).length === 0 && (
                   <span className="text-xs text-slate-500">لا توجد بيانات متاحة</span>
                )}
              </div>
            </div>

            {/* By Source */}
            <div className="rounded-2xl bg-white/[0.02] p-5 border border-white/5 relative overflow-hidden">
              <h3 className="text-xs font-black uppercase tracking-widest text-amber-500/80 mb-4 relative z-10">التدفق عبر القنوات</h3>
              <div className="space-y-3 relative z-10">
                {Object.entries(stats?.leadsBySource ?? {}).sort((a,b) => b[1] - a[1]).map(([source, count]) => {
                  const label = source === "undefined" || source === "unknown" ? "غير معروف" : source;
                  const maxCount = Math.max(...Object.values(stats?.leadsBySource ?? {}), 1);
                  const percentage = (count / maxCount) * 100;
                  const conversions = stats?.conversionsBySource?.[source] ?? 0;
                  const cr = count > 0 ? Math.round((conversions / count) * 100) : 0;
                  return (
                  <button 
                    key={source} 
                    onClick={() => setSelectedFilter({ type: "source", value: source })}
                    className="relative w-full flex items-center justify-between hover:bg-white/[0.05] p-2 -mx-2 rounded-lg transition-colors cursor-pointer group overflow-hidden text-right"
                  >
                    <div className="absolute top-0 right-0 h-full bg-amber-500/10 rounded-lg transition-all duration-500 ease-out z-0" style={{ width: `${percentage}%` }} />
                    <div className="relative z-10 flex items-center gap-2">
                       <span className="relative z-10 text-sm font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full group-hover:bg-amber-500/20 shadow-sm transition-colors">{count}</span>
                       {conversions > 0 && (
                         <span className="text-[10px] font-bold text-fuchsia-400 bg-fuchsia-500/10 px-2 py-1 rounded-full" title="تحويلات فعلية (نسبة مئوية)">
                           {cr}% تحويل
                         </span>
                       )}
                    </div>
                    <span className="relative z-10 text-sm text-slate-300 capitalize group-hover:text-amber-300 transition-colors">{label}</span>
                  </button>
                )})}
                 {Object.keys(stats?.leadsBySource ?? {}).length === 0 && (
                   <span className="text-xs text-slate-500">لا توجد بيانات متاحة</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Awareness Funnel (مسار الوعي) */}
      {(stats?.flowStats || stats?.conversionHealth) && (
        <CollapsibleSection
          title={"مسار الوعي"}
          icon={<Ghost className="w-5 h-5 text-indigo-400" />}
          subtitle={"رصد نقاط الاحتكاك ومعدلات هروب الأرواح في رحلة التعافي داخل الملاذ."}
          defaultExpanded={true}
          headerColors="border-indigo-500/20 bg-indigo-500/5 text-indigo-300"
        >
          <div className="space-y-8">
            {/* Pressure Gauge Funnel Visualizer */}
            <div className="relative p-6 rounded-[2.5rem] bg-slate-950/40 border border-white/5 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.03)_0%,_transparent_70%)] pointer-events-none" />
              
              <div className="flex flex-col md:flex-row items-stretch justify-between gap-4 relative z-10">
                {[
                  { label: "بدء الرحلة (24س)", value: stats.conversionHealth?.pathStarted24h ?? 0, color: "indigo" },
                  { label: "خرائط مولدة (24س)", value: stats.conversionHealth?.mapsGenerated24h ?? 0, color: "teal" },
                  { label: "شروع في الإضافة (24س)", value: stats.conversionHealth?.addPersonOpened24h ?? 0, color: "amber" },
                  { label: "إتمام وعرض (24س)", value: stats.conversionHealth?.addPersonDone24h ?? 0, color: "fuchsia" },
                ].map((step, idx, arr) => {
                  const prev = arr[idx - 1];
                  const dropoff = prev && prev.value > 0 ? Math.round((step.value / prev.value) * 100) : null;
                  const friction = dropoff !== null ? 100 - dropoff : 0;
                  const isHighPressure = friction > 60;

                  return (
                    <div key={step.label} className="flex-1 flex flex-col items-center">
                      {/* Connection & Gauge */}
                      {idx > 0 && (
                        <div className="h-8 md:h-auto md:w-full flex md:flex-row flex-col items-center justify-center relative">
                          <div className="h-full w-px md:h-px md:w-full bg-white/10" />
                          <div className="absolute flex items-center justify-center">
                            <motion.div 
                              animate={isHighPressure ? { scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] } : {}}
                              transition={{ repeat: Infinity, duration: 2 }}
                              className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest border backdrop-blur-md shadow-xl ${
                                friction > 70 ? "bg-rose-500/20 text-rose-400 border-rose-500/30" : 
                                friction > 40 ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : 
                                "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              }`}
                            >
                              الضغط: {friction}%
                            </motion.div>
                          </div>
                        </div>
                      )}

                      {/* Step Card */}
                      <div className={`w-full p-4 rounded-3xl border transition-all duration-500 ${
                        idx === 0 ? "bg-indigo-500/5 border-indigo-500/20" : "bg-white/[0.02] border-white/10"
                      }`}>
                        <div className="flex flex-col items-center text-center gap-2">
                           <div className={`text-[10px] font-black uppercase tracking-widest opacity-40`}>{step.label}</div>
                           <div className="text-2xl font-black text-white tabular-nums drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">{step.value}</div>
                           
                           {/* Small Progress Bar */}
                           {dropoff !== null && (
                             <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${dropoff}%` }}
                                 className={`h-full ${
                                   dropoff < 30 ? "bg-rose-500" : dropoff < 60 ? "bg-amber-500" : "bg-emerald-500"
                                 }`}
                               />
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Additional Global Stats Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="p-4 rounded-2xl bg-teal-500/5 border border-teal-500/10 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <Orbit className="w-5 h-5 text-teal-400" />
                   <span className="text-xs font-bold text-teal-300/60 uppercase">إجمالي الخرائط</span>
                 </div>
                 <span className="text-xl font-black text-white">{stats.conversionHealth?.journeyMapsTotal ?? 0}</span>
               </div>
            </div>

            {stats.flowStats?.addPersonCompletionRate !== undefined && stats.flowStats?.addPersonCompletionRate !== null && (
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <GitMerge className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-indigo-300 uppercase tracking-widest">معدل الانصهار والتجاوز</h4>
                    <p className="text-xs text-indigo-400/60 mt-1">نسبة الذين تجاوزوا ألم الفضفضة الخافتة وقاموا بإتمام إدخال شخص.</p>
                  </div>
                </div>
                <div className="text-3xl font-black text-white px-6">
                  {stats.flowStats.addPersonCompletionRate}%
                </div>
              </div>
            )}
            
            {stats.flowStats?.pulseAbandonedByReason && Object.keys(stats.flowStats.pulseAbandonedByReason).length > 0 && (
              <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-5 mt-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">أسباب هروب النبضة (Pulse Abandonment Friction)</h4>
                <div className="flex flex-col gap-2">
                  {Object.entries(stats.flowStats.pulseAbandonedByReason).map(([reason, count]) => (
                    <div key={reason} className="flex items-center justify-between text-xs p-2 rounded-lg bg-black/20 hover:bg-black/40 transition-colors">
                      <span className="text-rose-400 font-bold capitalize">{reason.replace(/_/g, " ")}</span>
                      <span className="text-slate-500">{count} هروب</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      <CampaignLeadsModal 
        isOpen={!!selectedFilter}
        onClose={() => setSelectedFilter(null)}
        title={
          selectedFilter 
            ? (selectedFilter.value === "undefined" || selectedFilter.value === "unattributed" || selectedFilter.value === "unknown" 
                ? (selectedFilter.type === "campaign" ? "بدون حملة" : "غير معروف") 
                : selectedFilter.value)
            : ""
        }
        leads={
          (stats?.rawLeads || []).filter(lead => {
            if (!selectedFilter) return false;
            
            // Search filter
            if (searchQuery) {
              const q = searchQuery.toLowerCase();
              const matchesSearch = 
                lead.name?.toLowerCase().includes(q) || 
                lead.email.toLowerCase().includes(q) || 
                lead.phone?.includes(q);
              if (!matchesSearch) return false;
            }

            const val = selectedFilter.type === "campaign" ? lead.campaign : lead.source_type;
            return String(val) === String(selectedFilter.value);
          })
        }
        onLeadUpdated={() => { useAdminState.setState({ opsStatsCache: null }); void load(); }}
      />

      {/* Manual Lead Entry */}
      <CollapsibleSection
        title={"توجيه إشارة لروح منفردة (Manual Entity Link)"}
        icon={<Crosshair className="w-5 h-5 text-sky-400" />}
        subtitle={"توليد مسار إتصال مباشر لمن لم يتم رصدهم."}
        defaultExpanded={false}
        headerColors="border-sky-500/20 bg-sky-500/5 text-sky-300"
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
        title={"مصفوفة استجابة الملاذ (Resonance Matrix)"}
        icon={<Radar className="w-5 h-5" />}
        subtitle={"رصد وتتبع انبعاثات الإشعاع ونسب التجاوب في محيط الإطلاق."}
        defaultExpanded={true}
        headerColors="border-purple-500/20 bg-purple-500/5 text-purple-300"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title={"إجمالي الإشارات"} value={sent} icon={<Radio className="w-5 h-5" />} glowColor="indigo" tooltip={"إجمالي حجم الرسائل التي انطلقت عبر جميع القنوات."} />
            <StatCard title={"أرواح مستهدفة (Unique)"} value={uniqueEntities} icon={<CheckCircle2 className="w-5 h-5" />} glowColor="teal" tooltip={"عدد الكيانات الفعلية (Unique Leads) التي وصلتها إشارة."} />
            <StatCard title={"طاقة قيد التوجيه"} value={pending} icon={<Clock className="w-5 h-5" />} glowColor="amber" tooltip={"الكيانات في قائمة الانتظار، جاري تحضير تردد الإرسال."} />
            <StatCard title={"استجابة حقيقية (Resonance)"} value={realStarts} icon={<TrendingUp className="w-5 h-5" />} glowColor="fuchsia" tooltip={"الأرواح التي استجابت وفتحت محطة التشخيص بالفعل (محسوبة من ضمن الأرواح المستهدفة)."} />
          </div>

          <div className="rounded-2xl bg-white/[0.02] p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{"\u0645\u0639\u062F\u0644 \u0627\u0644\u062A\u062D\u0648\u064A\u0644 \u0627\u0644\u0641\u0639\u0644\u064A"}</p>
                <p className="text-4xl font-black text-white mt-1">{convRate}</p>
                <p className="text-[11px] text-slate-500 mt-1">{realStarts} {"\u0628\u062F\u0627\u064A\u0629 \u062D\u0642\u064A\u0642\u064A\u0629 \u0645\u0646 أصل"} {uniqueEntities} {"روح فريدة"}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-black uppercase text-slate-500 mb-2">{"\u062A\u0648\u0632\u064A\u0639 \u0627\u0644\u0642\u0646\u0627\u0629"}</div>
              <div className="flex flex-col gap-1">
                {Object.entries(channelBreakdown).map(([channel, count]) => {
                  let icon = <Radio className="w-3.5 h-3.5 text-slate-400" />;
                  let color = "text-slate-400";
                  let label = channel;
                  if (channel === "email") { icon = <Mail className="w-3.5 h-3.5 text-sky-400" />; color = "text-sky-400"; label = "إيميل"; }
                  if (channel === "whatsapp") { icon = <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />; color = "text-emerald-400"; label = "واتساب"; }
                  if (channel === "sms") { icon = <Phone className="w-3.5 h-3.5 text-purple-400" />; color = "text-purple-400"; label = "رسائل نصية"; }
                  if (channel === "telegram") { icon = <Send className="w-3.5 h-3.5 text-blue-400" />; color = "text-blue-400"; label = "تيليجرام"; }
                  
                  return (
                    <div key={channel} className="flex items-center justify-end gap-2 text-xs">
                      <span className="text-slate-400 font-bold">{count} {label}</span>
                      {icon}
                    </div>
                  );
                })}
                {Object.keys(channelBreakdown).length === 0 && (
                   <span className="text-xs text-slate-600">—</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Email Engagement Analytics */}
      {stats?.emailMetrics && (
        <CollapsibleSection
          title={"مؤشرات الترددات (Frequency Analytics)"}
          icon={<Mail className="w-5 h-5 text-sky-400" />}
          subtitle={"بيانات لحظية لمعدل التجاوب (Open & Clicks) للنداءات."}
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
        title={"وحدة إصدار الأوامر الآلية (Automated Directives)"}
        icon={<Zap className="w-5 h-5 text-amber-400" />}
        subtitle={"التحكم المباشر في قنوات التوجيه وتفعيل المحاكاة للإرسال التلقائي."}
        tooltip={"وحدة أوامر تتخطى خط الزمن الحالي للإرسال أو تعيد برمجة المطرودين للانتظار مجدداً."}
        defaultExpanded={false}
        headerColors="border-amber-500/20 bg-amber-500/5 text-amber-300"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <ActionButton label={"إرسال النبضة القادمة الآن"} icon={<Send className="w-4 h-4" />}
              onClick={() => handleAction("trigger_batch", "إطلاق نبضة الإرسال")}
              loading={actionLoading === "trigger_batch"} variant="primary" />
            <ActionButton label={"إعادة الضبط للمحجوبين"} icon={<RotateCcw className="w-4 h-4" />}
              onClick={() => handleAction("reset_failed", "إعادة دمج الأخطاء")}
              loading={actionLoading === "reset_failed"} variant="warning" />
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs leading-relaxed text-amber-300/80">
            <strong>ملاحظة السيادة:</strong> إرسال النبضة يتجاهل الجدولة ويطلق الحصة المتبقية فوراً.
          </div>
        </div>
      </CollapsibleSection>

      {/* Quick Send Panel */}
      <CollapsibleSection
        title={"منصة الإطلاق المتفردة (Sovereign Summoning Hub)"}
        icon={<Orbit className="w-5 h-5 text-emerald-400" />}
        subtitle={"توجيه النداء بشكل خاص وحصري للأفراد الجدد."}
        tooltip={"بطاقات أثيرية تعزز قدرتك على دعوة الأرواح بشكل منفصل خارج حصة النظام التلقائية."}
        badge={<span className="text-[11px] bg-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-400 font-black border border-emerald-500/30 shadow-[0_0_8px_rgba(52,211,153,0.3)]">{availableLeads.length} كيانات متاحة للنداء</span>}
        defaultExpanded={true}
        headerColors="border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
      >
        <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2 pb-4">
          {/* Info Banner & Actions */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className={`flex-1 rounded-2xl border p-4 text-right text-xs leading-relaxed transition-all shadow-[inset_0_0_20px_rgba(0,0,0,0.1)] ${
              ghostMode 
               ? "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200/90" 
               : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200/80"
            }`}>
               {ghostMode 
                ? "تأثير الندرة الموقوت فعال. أزرار الإرسال ستولد روابط تتلف ذاتياً مع رسالة غامضة ومقتضبة للحفاظ على طاقة الملاذ." 
                : "توليد رسالة النداء يتم آلياً لكل كيان. استخدم هذه المنصة لدعوة المقربين بشكل شخصي عن طريق القنوات المجانية السريعة."}
            </div>

            <button
              onClick={() => setGhostMode(!ghostMode)}
              className={`flex flex-col items-center justify-center shrink-0 w-[100px] h-[60px] rounded-xl border transition-all font-bold text-[10px] gap-1 ${
                ghostMode 
                  ? "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40 shadow-[0_0_15px_-3px_rgba(217,70,239,0.3)] scale-105" 
                  : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
              }`}
            >
              <Ghost className={`w-4 h-4 ${ghostMode ? "animate-pulse" : ""}`} />
              <span>Ghost Mode</span>
            </button>

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
                isGhostMode={ghostMode}
              />
            ))
          )}
        </div>
      </CollapsibleSection>

      {/* Two-col: Recent Sent + Errors */}
      <CollapsibleSection
        title={"سجل بث النداء (Broadcast Chronicle)"}
        icon={<Clock className="w-5 h-5 text-slate-400" />}
        subtitle={"مراقبة تاريخية للإشارات المنبعثة والفشل في الوصول"}
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

      {/* Ripple Effect Tracker */}
      <CollapsibleSection
        title={"مرصد تمدد الأثر (Ripple Effect Tracker)"}
        icon={<GitMerge className="w-5 h-5 text-fuchsia-400" />}
        subtitle={"مراقبة حية لتسلسل الدعوات العنقودي بين الكيانات داخل المنصة."}
        defaultExpanded={true}
        headerColors="border-fuchsia-500/20 bg-fuchsia-500/5 text-fuchsia-300 shadow-[0_0_20px_rgba(217,70,239,0.05)] mt-4"
      >
        <RippleEffectGraph nodes={stats?.rippleTree || []} />
      </CollapsibleSection>

      {/* Total */}
      <div className="text-center text-[11px] text-slate-600 flex items-center justify-center gap-2 pt-6">
        <Users className="w-3.5 h-3.5" />
        {"\u0625\u062C\u0645\u0627\u0644\u064A \u0633\u062C\u0644\u0627\u062A \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631:"} {stats?.totalLeads ?? "\u2014"}
      </div>
    </div>
  );
}
