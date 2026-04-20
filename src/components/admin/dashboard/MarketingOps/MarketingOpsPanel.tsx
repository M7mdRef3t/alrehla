'use client';

import { logger } from "@/services/logger";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  GitMerge,
  Sparkles,
  DollarSign,
  PieChart,
  Target,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Trophy,
  Repeat,
  Brain
} from "lucide-react";
import { ManualLeadEntry } from "./ManualLeadEntry";
import { OracleLeadsAnalysis } from "./OracleLeadsAnalysis";
import { WhatsAppThreadModal } from "./WhatsAppThreadModal";
import { WhatsAppActivityFeed } from "./WhatsAppActivityFeed";
import { QuickSendRow } from "./QuickSendRow";
import { SovereignGatewayCommand, AVAILABLE_GATEWAYS } from "../Sovereign/SovereignGatewayCommand";
import { StatCard } from "../Executive/components/StatCard";
import { AdminTooltip } from "../Overview/components/AdminTooltip";

import { adminApi } from "@/services/adminApi";
import { growthEngine, GrowthMetrics } from "@/services/growthEngine";

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
  deepConversionsByCampaign?: Record<string, number>;
  deepConversionsBySource?: Record<string, number>;
  revenueByCampaign?: Record<string, number>;
  revenueBySource?: Record<string, number>;
  totalRevenue?: number;
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
const OWNER_PHONE = "+201110795932";
const OWNER_EMAIL = "hello@alrehla.app";

// --- Helpers ---

import { useAuthState, getAuthToken } from "@/domains/auth/store/auth.store";
import { useAdminState } from "@/domains/admin/store/admin.store";
import { CampaignLeadsModal } from "./CampaignLeadsModal";

function getBearerToken(): string {
  return getAuthToken() ?? useAdminState.getState().adminCode ?? "";
}

async function fetchStats(force = false): Promise<OpsStats> {
  const state = useAdminState.getState();
  const cache = state.opsStatsCache;
  const now = Date.now();
  
  // Cache bypass if not forced and less than 60s old
  if (!force && cache && now - cache.timestamp < 60_000) {
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
  if (mins < 60) return `${mins}د`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}س`;
  return `${Math.floor(hrs / 24)}ي`;
}

function buildMessage(lead: QuickSendLead, isGhostMode: boolean = false): string {
  const greeting = lead.name ? `أهلاً ${lead.name}،` : "أهلاً،";
  const link = isGhostMode ? `${lead.personalLink}&ghost=1` : lead.personalLink;
  if (isGhostMode) {
    return `${greeting}\n\nتم فتح خريطة علاقاتك الآن بواسطة إحدى أرواح الرحلة.\nللحفاظ على طاقة المنصة، ستتلاشى هذه الدعوة ذاتياً بعد 12 ساعة.\n\nاستخدم مفتاحك من هنا قبل نفاذ الوقت: ${link}`;
  }
  return `${greeting} معك فريق عمل الرحلة 🌙\nشكراً لاهتمامك — خريطة علاقاتك جاهزة في دقيقتين.\nابدأ من هنا: ${link}`;
}

function buildEmailBody(lead: QuickSendLead, isGhostMode: boolean = false): string {
  const greeting = lead.name ? `أهلاً ${lead.name}،` : "أهلاً،";
  const link = isGhostMode ? `${lead.personalLink}&ghost=1` : lead.personalLink;
  if (isGhostMode) {
    return encodeURIComponent(
      `${greeting}\n\nتم توليد خريطة علاقاتك حصرياً بواسطة صديق من داخل الرحلة.\nهذه الإشارة تتلف ذاتياً خلال 12 ساعة للحفاظ على ندرة وطاقة المنصة.\n\nاستخدم الرابط الآتي قبل التلاشي: ${link}\n\nننتظرك في الجانب الآخر 🌑`
    );
  }
  return encodeURIComponent(
    `${greeting}\n\nمعك فريق عمل الرحلة.\nشكراً لاهتمامك بالمنصة — خريطة علاقاتك الأولى جاهزة في دقيقتين فقط.\n\nابدأ من هنا: ${link}\n\nاللينك ده خاص بيك.\n\nبالتوفيق 💜\nفريق الرحلة`
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
        className="w-full flex items-center justify-between p-5 text-right hover:bg-white/5 transition-all cursor-default"
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

// --- Financial Components ---

function MarketingSpendConsole({ 
  onUpdate 
}: { 
  onUpdate: () => void 
}) {
  const [spend, setSpend] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const val = await adminApi.fetchMarketingSpend();
        setSpend(val ?? 0);
      } catch (e) {
        logger.error("Failed to fetch spend:", e);
      }
    }
    void load();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await adminApi.updateMarketingSpend(spend);
      setIsEditing(false);
      onUpdate();
    } catch {
      // Parent toast will handle feedback if we refresh
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 p-5 rounded-3xl bg-white/[0.03] border border-white/10 group hover:border-indigo-500/30 transition-all duration-500">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">ميزانية الإنفاق الإعلاني</p>
            {isEditing ? (
              <div className="flex items-center gap-2 mt-1">
                <input 
                  type="number" 
                  value={spend} 
                  onChange={(e) => setSpend(Number(e.target.value))}
                  className="bg-black/60 border border-indigo-500/50 rounded-xl px-3 py-1 text-2xl font-black text-white w-40 focus:outline-none focus:ring-2 ring-indigo-500/20"
                  autoFocus
                />
                <span className="text-xl font-black text-indigo-400">ج.م</span>
              </div>
            ) : (
              <p className="text-3xl font-black text-white mt-1">{(spend || 0).toLocaleString("en-US")} ج.م</p>
            )}
          </div>
        </div>
        
        {isEditing ? (
          <div className="flex gap-3">
            <button 
              onClick={handleSave} 
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg shadow-emerald-900/20"
            >
              {loading ? "جاري الحفظ..." : "تحديث"}
            </button>
            <button 
              onClick={() => setIsEditing(false)} 
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
            >
              إلغاء
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setIsEditing(true)} 
            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest border border-white/5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            تعديل المبلغ
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 px-2">
        <AlertCircle className="w-3 h-3 text-indigo-400/50" />
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 leading-none">
          يتم ربط هذا الرقم مع مركز العوائد لحساب العائد على الاستثمار الفعلي بدقة السنت.
        </p>
      </div>
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
  const [growthMetrics, setGrowthMetrics] = useState<GrowthMetrics | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<{ type: "campaign" | "source"; value: string; expandedId?: string } | null>(null);
  const [repairLoading, setRepairLoading] = useState(false);
  const [warmupLoading, setWarmupLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // WhatsApp Modal State
  const [whatsappModalObj, setWhatsappModalObj] = useState<{ 
    leadId: string; 
    phone: string; 
    name: string;
    oracleAdvice?: string;
    leadGrade?: string;
    campaign?: string;
    adSource?: string;
  } | null>(null);

  const [campaignBudgets, setCampaignBudgets] = useState<Record<string, number>>({});
  const [editingCampaign, setEditingCampaign] = useState<string | null>(null);
  const [tempBudget, setTempBudget] = useState<string>("");

  const fetchStats = async (force = false): Promise<OpsStats> => {
    const bearer = getBearerToken();
    if (!bearer) throw new Error("no_auth_token");

    const res = await fetch(`/api/admin/marketing-ops${force ? "?force=true" : ""}`, {
      headers: { authorization: `Bearer ${bearer}` }
    });
    if (!res.ok) throw new Error(`marketing_ops_failed:${res.status}`);
    return await res.json();
  };

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async (force = false) => {
    // 🛡️ Security Guard: Don't fetch if auth is not ready or no bearer token
    const authStatus = useAuthState.getState().status;
    if (authStatus === 'loading') return;
    
    const bearer = getBearerToken();
    if (!bearer) return;

    setLoading(true);
    try {
      const [data, metrics, budgets] = await Promise.all([
        fetchStats(force),
        growthEngine.getGrowthMetrics(),
        adminApi.fetchCampaignBudgets()
      ]);
      setStats(data);
      setGrowthMetrics(metrics);
      setCampaignBudgets(budgets);
    } catch (err: any) {
      if (err.message !== "no_auth_token") {
        showToast("فشل تحميل البيانات", false);
      }
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
        void load(true);
      } else {
        showToast("فشل إصلاح التتبع", false);
      }
    } catch {
      showToast("خطأ في الاتصال", false);
    } finally {
      setRepairLoading(false);
    }
  };

  useEffect(() => { 
    // 🛡️ Initial check: if already ready, load once.
    if (useAuthState.getState().status === 'ready') {
      void load();
    }

    // 👂 Subscribe to any future status changes (e.g. login)
    const unsub = useAuthState.subscribe((state) => {
      if (state.status === 'ready') {
        void load();
      }
    });
    
    return () => unsub();
  }, [load]);

  const handleAction = async (action: string, label: string, extra?: Record<string, unknown>) => {
    setActionLoading(action);
    try {
      const res = await postAction(action, extra);
      if (res.ok) {
        showToast(`${label} — تم بنجاح ✅`, true);
        void load(true);
      } else {
        showToast(`${label} — فشل ❌`, false);
      }
    } catch {
      showToast("خطأ في الشبكة", false);
    } finally {
      setActionLoading(null);
    }
  };

  const updateBudget = async (id: string, val: number) => {
    try {
      await adminApi.updateCampaignBudget(id, val);
      setCampaignBudgets(prev => ({ ...prev, [id]: val }));
      showToast(`تم تحديث ميزانية ${id} ✅`, true);
      setEditingCampaign(null);
    } catch {
      showToast("فشل تحديث الميزانية", false);
    }
  };

  const handleMarkContacted = useCallback((email: string) => {
    setContacted((prev) => new Set([...prev, email]));
    void postAction("mark_contacted", { leadEmail: email });
  }, []);

  const { c, channelBreakdown, uniqueEntities, sent, pending, failed, realStarts, convRate, vgiRate, totalLeadsCount } = useMemo(() => {
    const c = stats?.counts ?? {};
    const channelBreakdown = stats?.channelBreakdown ?? {};
    const uniqueEntities = stats?.uniqueEntitiesReached ?? 0;
    const sent = (c["sent"] ?? 0) + (c["simulated"] ?? 0);
    const pending = c["pending"] ?? 0;
    const failed = (c["failed"] ?? 0);
    const realStarts = stats?.realStarts ?? 0;
    const convRate = uniqueEntities > 0 ? `${Math.round((realStarts / uniqueEntities) * 100)}%` : "—";
    const totalLeadsCount = stats?.totalLeads ?? 0;
    const vgiRate = totalLeadsCount > 0 ? Math.round((pending / totalLeadsCount) * 100) : 0;
    
    return { c, channelBreakdown, uniqueEntities, sent, pending, failed, realStarts, convRate, vgiRate, totalLeadsCount };
  }, [stats]);

  const availableLeads = useMemo(() => {
    return (stats?.quickSendLeads ?? []).filter((l) => {
      const isNotContacted = !contacted.has(l.email);
      if (!searchQuery) return isNotContacted;
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        l.name?.toLowerCase().includes(q) || 
        l.email.toLowerCase().includes(q) || 
        l.phone?.includes(q);
      return isNotContacted && matchesSearch;
    });
  }, [stats, contacted, searchQuery]);

  const handleExportForGemini = () => {
    if (availableLeads.length === 0) {
      showToast("لا يوجد Leads متاحة للنسخ", false);
      return;
    }
    const prompt = `أطلب منك إرسال بريد إلكتروني فردي منفصل لكل شخص من القائمة التالية.
يجب أن يكون عنوان المرسل: فريق عمل الرحلة <hello@alrehla.app> (إذا أمكن).
موضوع الرسالة: خريطة علاقاتك المخصصة من الرحلة 🧭
نص الرسالة: (اكتب رسالة ترحيبية قصيرة وجذابة بالللهجة المصصية تدعوه لإكمال خريطته، ثم ضع الرابط المخصص الخاص به).

قائمة الأشخاص (من فضلك أرسل كل رسالة على حدة):
${availableLeads.map((l, i) => `${i + 1}. الاسم: ${l.name || "بدون اسم"} | الإيميل: ${l.email} | الرابط: ${l.personalLink}`).join('\n')}`;

    navigator.clipboard.writeText(prompt);
    showToast("تم نسخ الـ Prompt بنجاح لـ Gemini 🧠✨", true);
  };

  const handleVgiSafeguard = () => {
    showToast("جاري إعادة معايرة بوابات العبور وتنشيط نداء المسافرين... 🧭", true);
    setTimeout(() => load(true), 1500);
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

      {/* VGI Breach Safeguard */}
      {vgiRate > 25 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-[2rem] bg-rose-500/10 border-2 border-rose-500/30 flex flex-col md:flex-row items-center gap-6 shadow-[0_0_50px_rgba(244,63,94,0.15)] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 blur-[60px] rounded-full" />
          <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
            <Ghost className="w-8 h-8 animate-bounce" />
          </div>
          <div className="flex-1 text-center md:text-right">
            <h3 className="text-xl font-black text-rose-400 uppercase tracking-tighter mb-1">تنبيه: اتساع فجوة الوعي (VGI Critical)</h3>
            <p className="text-sm text-rose-300/70 font-bold max-w-2xl leading-relaxed">
              هناك فجوة بنسبة <span className="text-rose-400 font-black">{vgiRate}%</span> بين الأرواح التي طرقت الباب (Leads) والأنفس التي دخلت الرحلة فعلياً. 
              هذا التباين يمثل "طاقة مهدرة" أو خلل في بوابة التفعيل (Verification Flow).
            </p>
          </div>
          <button 
            onClick={handleVgiSafeguard}
            className="px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-rose-900/40 active:scale-95 whitespace-nowrap"
          >
            تنشيط بوابات العبور
          </button>
        </motion.div>
      )}

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
              {"بوابات الرحلة (النداء السِيادي)"}
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
            onClick={async () => {
              setWarmupLoading(true);
              try {
                const response = await fetch('/api/admin/meta-warmup', {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    'authorization': `Bearer ${getBearerToken()}`
                  }
                });
                const result = await response.json();
                if (result.ok) {
                  showToast("تم تنشيط اتصال Meta API بنجاح! تم استدعاء 5 نقاط اتصال ✅", true);
                } else {
                  showToast("فشل التنشيط: " + (result.error || "خطأ غير معروف"), false);
                }
              } catch (err) {
                showToast("خطأ في الاتصال بسيرفر التنشيط", false);
              } finally {
                setWarmupLoading(false);
              }
            }}
            disabled={warmupLoading || loading}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <Orbit className={`w-3.5 h-3.5 ${warmupLoading ? "animate-spin" : ""}`} />
            {warmupLoading ? "جاري التنشيط..." : "تنشيط اتصال Meta API"}
          </button>

          <button 
            onClick={async () => {
              try {
                const response = await fetch('/api/webhooks/meta-leads', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    object: 'page',
                    entry: [{
                      id: 'test_page_id',
                      time: Date.now(),
                      changes: [{
                        field: 'leadgen',
                        value: { leadgen_id: 'test_lead_id_123' }
                      }]
                    }]
                  })
                });
                const result = await response.json();
                if (result.success) {
                  showToast("تم إرسال إشارة محاكاة بنجاح! راجع الرادار بعد ثوانٍ 📡", true);
                } else {
                  showToast("فشلت المحاكاة: " + result.error, false);
                }
              } catch (err) {
                showToast("خطأ في الاتصال بالسيرفر المحاكي", false);
              }
            }}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest hover:bg-purple-500/20 transition-all active:scale-95"
          >
            <Repeat className="w-3.5 h-3.5" />
            {"محاكاة مسافر جديد"}
          </button>

          <button 
            onClick={handleRepair} 
            disabled={repairLoading || loading}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
            title="إصلاح تتبع المصادر لليدز القديمة"
          >
            <Zap className={`w-3.5 h-3.5 ${repairLoading ? "animate-pulse" : ""}`} />
            {repairLoading ? "جاري التعميد..." : "تعميد البيانات القديمة"}
          </button>

          <button onClick={() => load(true)} disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-black uppercase tracking-widest hover:bg-indigo-500/20 hover:text-indigo-200 transition-all active:scale-95 disabled:opacity-50 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {"تنشيط نبض الرحلة"}
          </button>
        </div>
      </div>
    </header>

      {/* Real-time WhatsApp Activity Feed */}
      <CollapsibleSection
        title={"نبض الملاذ اللحظي (WhatsApp Live Feed)"}
        icon={<Activity className="w-5 h-5 text-emerald-400" />}
        subtitle={"رصد حي للرواح المتواصلة مع الملاذ واستجابات الـ AI اللحظية."}
        defaultExpanded={true}
        headerColors="border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
      >
        <WhatsAppActivityFeed 
          onOpenWhatsapp={(leadId, phone, name, oracleAdvice, leadGrade, campaign, source) => 
            setWhatsappModalObj({ leadId, phone, name, oracleAdvice, leadGrade, campaign, adSource: source })
          } 
        />
      </CollapsibleSection>

      {/* Financial ROI Dashboard (New) */}
      <CollapsibleSection
        title={"اقتصاديات الرحلة والعبور"}
        icon={<DollarSign className="w-5 h-5 text-indigo-400" />}
        subtitle={"الذكاء المالي الفوقي لمراقبة كفاءة النداء وتحويل الطاقة (ROI)."}
        defaultExpanded={false}
        headerColors="border-indigo-500/20 bg-indigo-500/5 text-indigo-300"
      >
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard 
              title={"العائد على الإنفاق"} 
              value={(growthMetrics?.roi ?? 0).toFixed(1) + "%"} 
              icon={growthMetrics && growthMetrics.roi > 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />} 
              glowColor={growthMetrics && growthMetrics.roi > 0 ? "emerald" : "rose"} 
              tooltip={"نسبة الربح الصافي إلى تكلفة الإنفاق الإعلاني."} 
            />
            <StatCard 
              title={"مؤشر الفقد (VGI)"} 
              value={vgiRate + "%"} 
              icon={<Ghost className="w-5 h-5" />} 
              glowColor={vgiRate > 30 ? "rose" : "amber"} 
              tooltip={"نسبة الأرواح التي قدمت إيميلاتها وتعطل مسارها عند مرحلة تفعيل البريد (Waiting for Verification)."} 
            />
            <StatCard 
              title={"تكلفة الاستحواذ"} 
              value={(growthMetrics?.cpa ?? 0).toFixed(2) + " ج.م"} 
              icon={<Target className="w-5 h-5" />} 
              glowColor="indigo" 
              tooltip={"متوسط تكلفة تحويل ليد عادي إلى مشترك أو عميل مفعل."} 
            />
            <StatCard 
              title={"تكلفة الروح الجديدة"} 
              value={(growthMetrics?.cpl ?? 0).toFixed(2) + " ج.م"} 
              icon={<Users className="w-5 h-5" />} 
              glowColor="sky" 
              tooltip={"متوسط تكلفة الحصول على ليد واحد جديد في قاعدة البيانات."} 
            />
            <StatCard 
              title={"صافي الربح"} 
              value={(growthMetrics?.netProfit ?? 0).toLocaleString("en-US") + " ج.م"} 
              icon={<Trophy className="w-5 h-5" />} 
              glowColor="amber" 
              tooltip={"الإجمالي المتبقي بعد خصم تكاليف التسويق من الإيرادات الكلية."} 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <MarketingSpendConsole onUpdate={load} />
            
            <div className="p-6 rounded-[2.5rem] bg-slate-950/40 border border-white/5 relative overflow-hidden flex flex-col justify-center min-h-[140px]">
               <div className="absolute top-0 right-0 p-8 opacity-10">
                 <PieChart className="w-24 h-24 text-indigo-400" />
               </div>
               <h4 className="text-[10px] font-black text-indigo-400/60 uppercase tracking-[0.2em] mb-1">كفاءة النداء (ROI)</h4>
               <p className="text-2xl font-black text-emerald-400 font-mono tracking-tighter">
                 {(growthMetrics?.roi ?? 0).toFixed(1)}%
               </p>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-4 mb-2">إجمالي الإيرادات المرصودة</p>
               <h3 className="text-4xl font-black text-white tabular-nums tracking-tighter">
                 {(stats?.totalRevenue ?? 0).toLocaleString("en-US")} ج.م
               </h3>
               <div className="flex items-center gap-2 mt-4">
                 <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                 <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400/70">
                    اتصال حي مع تدفق الإيرادات
                 </p>
               </div>
            </div>
          </div>

          {(stats?.revenueByCampaign && Object.keys(stats.revenueByCampaign).length > 0) && (
            <div className="mt-8">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-400" />
                تحليل ربحية الحملات (Campaign ROI)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(stats.revenueByCampaign)
                  .sort((a, b) => b[1] - a[1])
                  .map(([campaign, revenue]) => {
                    const budget = campaignBudgets[campaign] || 0;
                    const roi = budget > 0 ? Math.round((revenue / budget) * 100) : null;
                    const isEditing = editingCampaign === campaign;

                    return (
                      <div key={campaign} className="p-5 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex flex-col gap-4 relative overflow-hidden group">
                        {roi !== null && (
                          <div className={`absolute top-4 left-4 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                            roi > 200 ? "bg-emerald-500/20 text-emerald-400" : roi > 100 ? "bg-indigo-500/20 text-indigo-400" : "bg-rose-500/20 text-rose-400"
                          }`}>
                            ROI: {roi}%
                          </div>
                        )}
                        <div className="flex flex-col">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{campaign === 'undefined' ? "بدون حملة" : campaign.replace(/_/g, ' ')}</p>
                          <p className="text-2xl font-black text-white">{revenue.toLocaleString("en-US")} <span className="text-[10px] text-slate-500">ج.م</span></p>
                        </div>

                        <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">الميزانية</span>
                            {isEditing ? (
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  type="number"
                                  value={tempBudget}
                                  onChange={(e) => setTempBudget(e.target.value)}
                                  className="w-20 bg-black/40 border border-indigo-500/40 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                                  autoFocus
                                />
                                <button onClick={() => updateBudget(campaign, Number(tempBudget))} className="text-emerald-400 hover:text-emerald-300">
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => setEditingCampaign(null)} className="text-rose-400 hover:text-rose-300">
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm font-black text-slate-400">{budget > 0 ? budget.toLocaleString("en-US") : "—"}</span>
                                <button 
                                  onClick={() => {
                                    setEditingCampaign(campaign);
                                    setTempBudget(String(budget));
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400 hover:text-indigo-300"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {roi !== null && (
                            <div className="text-right">
                              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">الصافي</span>
                              <p className={`text-sm font-black ${revenue - budget > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                {(revenue - budget).toLocaleString("en-US")}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Sovereign Gateway Command (Gateways Monitoring) */}
      <CollapsibleSection
        title={"رحلات العبور ونبض الانتشار"}
        icon={<Orbit className="w-5 h-5 text-fuchsia-400" />}
        subtitle={"مراقبة ترددات القنوات الإعلانية (Meta, TikTok, etc) والتحكم في تدفق الأرواح."}
        defaultExpanded={false}
        headerColors="border-fuchsia-500/20 bg-fuchsia-500/5 text-fuchsia-300"
      >
        <SovereignGatewayCommand
          stats={stats}
          onOpenWhatsapp={(leadId, phone, name, campaign, source) => 
            setWhatsappModalObj({ leadId, phone, name, campaign, adSource: source })
          }
          onFilterSelect={(filter) => {
            if (filter.type === "source" || filter.type === "campaign") {
              setSelectedFilter({ type: filter.type, value: filter.value, expandedId: filter.expandedId });
              // Only set searchQuery if we are NOT expanding a specific lead. 
              // Expanding a specific lead should show all leads of that source.
              if (filter.query && !filter.expandedId) {
                 setSearchQuery(filter.query);
              } else if (filter.expandedId) {
                 setSearchQuery(""); // Clear search to show the list context
              }
              return;
            }

            setSelectedFilter(null);
          }}
        />
      </CollapsibleSection>

      {/* Oracle Leads Analysis */}
      <CollapsibleSection
        title={"تحليل الذكاء الفوقي (Oracle Leads)"}
        icon={<Brain className="w-5 h-5 text-purple-400" />}
        subtitle={"تحليل النوايا، أسباب الدخول، والتوصيات لـ Meta Leads."}
        defaultExpanded={false}
        headerColors="border-purple-500/20 bg-purple-500/5 text-purple-300"
      >
        <OracleLeadsAnalysis 
           onOpenWhatsapp={(leadId, phone, name, oracleAdvice, leadGrade, campaign, source) => 
             setWhatsappModalObj({ leadId, phone, name, oracleAdvice, leadGrade, campaign, adSource: source })}
        />
      </CollapsibleSection>

      {/* Awareness Funnel */}
      {(stats?.flowStats || stats?.conversionHealth) && (
        <CollapsibleSection
          title={"مسار الوعي"}
          icon={<Ghost className="w-5 h-5 text-indigo-400" />}
          subtitle={"رصد نقاط الاحتكاك ومعدلات هروب الأرواح في رحلة التعافي داخل الملاذ."}
          defaultExpanded={false}
          headerColors="border-indigo-500/20 bg-indigo-500/5 text-indigo-300"
        >
          <div className="space-y-8">
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

                  return (
                    <div key={step.label} className="flex-1 flex flex-col items-center">
                      {idx > 0 && (
                        <div className="h-8 md:h-auto md:w-full flex md:flex-row flex-col items-center justify-center relative">
                          <div className="h-full w-px md:h-px md:w-full bg-white/10" />
                          <div className="absolute flex items-center justify-center">
                            <motion.div 
                              animate={friction > 60 ? { scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] } : {}}
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

                      <div className={`w-full p-4 rounded-3xl border transition-all duration-500 ${
                        idx === 0 ? "bg-indigo-500/5 border-indigo-500/20" : "bg-white/[0.02] border-white/10"
                      }`}>
                        <div className="flex flex-col items-center text-center gap-2">
                           <div className={`text-[10px] font-black uppercase tracking-widest opacity-40`}>{step.label}</div>
                           <div className="text-2xl font-black text-white tabular-nums">{step.value}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="p-4 rounded-2xl bg-teal-500/5 border border-teal-500/10 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <Orbit className="w-5 h-5 text-teal-400" />
                   <span className="text-xs font-bold text-teal-300/60 uppercase">إجمالي الخرائط</span>
                 </div>
                 <span className="text-xl font-black text-white">{stats.conversionHealth?.journeyMapsTotal ?? 0}</span>
               </div>
            </div>
          </div>
        </CollapsibleSection>
      )}

      <CampaignLeadsModal 
        isOpen={!!selectedFilter}
        onClose={() => setSelectedFilter(null)}
        initialExpandedId={selectedFilter?.expandedId}
        title={
          selectedFilter 
            ? (selectedFilter.value === "undefined" || selectedFilter.value === "unattributed" || selectedFilter.value === "unknown" 
                ? (selectedFilter.type === "campaign" ? "بدون حملة" : "غير معروف") 
                : (selectedFilter.type === "source" 
                    ? (AVAILABLE_GATEWAYS.find(g => g.id === selectedFilter.value)?.name || selectedFilter.value)
                    : selectedFilter.value))
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

            // Category filter (Source or Campaign)
            if (selectedFilter.type === "campaign") {
              return String(lead.campaign) === String(selectedFilter.value);
            }

            if (selectedFilter.type === "source") {
              const gw = AVAILABLE_GATEWAYS.find(g => g.id === selectedFilter.value);
              const leadSource = (lead.source_type || "").toLowerCase();
              
              if (gw) {
                // Check if leadSource matches any of the gateway's mapped keys
                return gw.sourceKeys.some(sk => leadSource === sk || leadSource.includes(sk));
              }

              // Fallback to exact match if gateway config not found
              return String(leadSource) === String(selectedFilter.value);
            }

            return false;
          })
        }
        onLeadUpdated={() => load(true)}
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
            void load(true);
          }} 
          onError={(msg) => showToast(msg, false)} 
        />
      </CollapsibleSection>

      {/* Resonance Matrix */}
      <CollapsibleSection
        title={"مصفوفة استجابة الملاذ (Resonance Matrix)"}
        icon={<Radar className="w-5 h-5" />}
        subtitle={"رصد وتتبع انبعاثات الإشعاع ونسب التجاوب في محيط الإطلاق."}
        defaultExpanded={false}
        headerColors="border-purple-500/20 bg-purple-500/5 text-purple-300"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title={"إجمالي الإشارات"} value={sent} icon={<Radio className="w-5 h-5" />} glowColor="indigo" />
            <StatCard title={"أرواح مستهدفة (Unique)"} value={uniqueEntities} icon={<CheckCircle2 className="w-5 h-5" />} glowColor="teal" />
            <StatCard title={"طاقة قيد التوجيه"} value={pending} icon={<Clock className="w-5 h-5" />} glowColor="amber" />
            <StatCard title={"استجابة حقيقية (Resonance)"} value={realStarts} icon={<TrendingUp className="w-5 h-5" />} glowColor="fuchsia" />
          </div>

          <div className="rounded-2xl bg-white/[0.02] p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{"معدل التحويل الفعلي"}</p>
                <p className="text-4xl font-black text-white mt-1">{convRate}</p>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Sovereign Summoning Hub */}
      <CollapsibleSection
        title={"منصة الإطلاق المتفردة (Sovereign Summoning Hub)"}
        icon={<Orbit className="w-5 h-5 text-emerald-400" />}
        subtitle={"توجيه النداء بشكل خاص وحصري للأفراد الجدد."}
        badge={<span className="text-[11px] bg-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-400 font-black border border-emerald-500/30">{availableLeads.length} كيانات متاحة للنداء</span>}
        defaultExpanded={false}
        headerColors="border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
      >
        <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2 pb-4">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className={`flex-1 rounded-2xl border p-4 text-right text-xs leading-relaxed transition-all ${
              ghostMode ? "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200/90" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200/80"
            }`}>
               {ghostMode 
                ? "تأثير الندرة الموقوت فعال. أزرار الإرسال ستولد روابط تتلف ذاتياً مع رسالة غامضة ومقتضبة للحفاظ على طاقة الملاذ." 
                : "توليد رسالة النداء يتم آلياً لكل كيان. استخدم هذه المنصة لدعوة المقربين بشكل شخصي عن طريق القنوات المجانية السريعة."}
            </div>

            <button
              onClick={() => setGhostMode(!ghostMode)}
              className={`flex flex-col items-center justify-center shrink-0 w-[100px] h-[60px] rounded-xl border transition-all font-bold text-[10px] gap-1 ${
                ghostMode ? "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40" : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              <Ghost className={`w-4 h-4 ${ghostMode ? "animate-pulse" : ""}`} />
              <span>Ghost Mode</span>
            </button>
          </div>

          {availableLeads.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">✅ كل الـ Leads الحاليين تم التواصل معهم أو تمت معالجتهم تلقائياً.</p>
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

      <div className="text-center text-[11px] text-slate-600 flex items-center justify-center gap-2 pt-6">
        <Users className="w-3.5 h-3.5" />
        إجمالي سجلات قائمة الانتظار: {stats?.totalLeads ?? "—"}
      </div>

      {whatsappModalObj && (
        <WhatsAppThreadModal
          leadId={whatsappModalObj.leadId}
          phone={whatsappModalObj.phone}
          name={whatsappModalObj.name}
          oracleAdvice={whatsappModalObj.oracleAdvice}
          leadGrade={whatsappModalObj.leadGrade}
          campaign={whatsappModalObj.campaign}
          adSource={whatsappModalObj.adSource}
          onClose={() => setWhatsappModalObj(null)}
        />
      )}
    </div>
  );
}
