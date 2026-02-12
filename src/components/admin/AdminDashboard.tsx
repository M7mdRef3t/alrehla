import type { FC, ReactNode } from "react";
import { useEffect, useState, useRef, lazy, Suspense, useMemo, useCallback } from "react";
import {
  Activity,
  Brain,
  Workflow,
  Compass,
  Flag,
  Lock,
  LogOut,
  ShieldCheck,
  Sparkles,
  Users,
  Database,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  LineChart as LineChartIcon,
  X,
  User,
  History
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { FEATURE_FLAGS, type FeatureFlagMode } from "../../config/features";
import { useAdminState, ADMIN_ACCESS_CODE } from "../../state/adminState";
import { getEffectiveRoleFromState, useAuthState } from "../../state/authState";
import { getAggregateStats, getEventsByDay, getSessionsWithProgress, getTrackingSessionId } from "../../services/journeyTracking";
import { getLastActivity } from "../../services/notifications";
import { geminiClient } from "../../services/geminiClient";
import { usePulseState } from "../../state/pulseState";
import { getEffectiveFeatureAccess } from "../../utils/featureFlags";
import {
  fetchAdminConfig,
  fetchAiLogs,
  fetchBroadcasts,
  fetchJourneyMap,
  fetchUserStates,
  fetchUserStateDetail,
  exportUserStates,
  importUserStates,
  fetchDailyReport,
  fetchWeeklyReport,
  exportFullData,
  updateUserRole,
  fetchMissions,
  fetchOverviewStats,
  fetchUsers,
  saveAiLog,
  saveBroadcast,
  saveFeatureFlags,
  saveMission,
  saveScoring,
  saveSystemPrompt,
  rateAiLog as rateAiLogRemote,
  deleteBroadcast,
  deleteMission,
  fetchThemePalette,
  saveThemePalette,
  type ThemePalette
} from "../../services/adminApi";
import { applyThemePalette } from "../../services/themePalette";
import type { JourneyMapSnapshot, UserStateRow } from "../../services/adminApi";
import { FlowMindMap, type FlowMapActionEvent } from "./FlowMindMap";
import { buildFlowNodes, VISITOR_FLOW_LINKS, type PulseAbandonReasonFilter } from "../../data/visitorFlowWorkflow";
import { buildFlowNodeMetrics } from "../../utils/flowAnalytics";
import { isSupabaseReady, supabase } from "../../services/supabaseClient";
import { consciousnessService, type MemoryMatch } from "../../services/consciousnessService";
import { loadStoredState } from "../../services/localStore";
import {
  fetchFlowAuditLogs,
  saveFlowAuditLog,
  subscribeFlowAuditLogs,
  type FlowAuditLogEntry
} from "../../services/flowAudit";

type AdminTab = "overview" | "flow-map" | "feature-flags" | "ai-studio" | "content" | "users" | "user-state" | "consciousness";

const DataManagementModal = lazy(() =>
  import("../DataManagement").then((m) => ({ default: m.DataManagement }))
);

const NAV_ITEMS: Array<{ id: AdminTab; label: string; icon: ReactNode }> = [
  { id: "overview", label: "نبض الرحلة", icon: <Activity className="w-4 h-4" /> },
  { id: "flow-map", label: "خريطة التدفق", icon: <Compass className="w-4 h-4" /> },
  { id: "feature-flags", label: "التحكم في الزمن", icon: <Flag className="w-4 h-4" /> },
  { id: "ai-studio", label: "مختبر الذكاء", icon: <Brain className="w-4 h-4" /> },
  { id: "content", label: "إدارة المحتوى", icon: <Database className="w-4 h-4" /> },
  { id: "users", label: "شؤون المسافرين", icon: <Users className="w-4 h-4" /> },
  { id: "user-state", label: "سحابة البيانات", icon: <Database className="w-4 h-4" /> },
  { id: "consciousness", label: "أرشيف الوعي", icon: <History className="w-4 h-4" /> }
];

const DEV_ONLY_TABS: AdminTab[] = ["feature-flags", "ai-studio", "user-state"];

const getTabFromLocation = (): AdminTab => {
  if (typeof window === "undefined") return "overview";
  const params = new URLSearchParams(window.location.search);
  const tab = params.get("tab") as AdminTab | null;
  return NAV_ITEMS.some((item) => item.id === tab) ? tab! : "overview";
};

const updateTabInUrl = (tab: AdminTab) => {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("tab", tab);
  window.history.pushState({}, "", url.toString());
};

const formatNumber = (value: number | null, fallback = "—") =>
  value == null || Number.isNaN(value) ? fallback : value.toLocaleString("ar-EG");

const formatTimeAgo = (ts: number | null) => {
  if (!ts) return "—";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `منذ ${days} يوم`;
};

const AdminGate: FC<{ children: ReactNode }> = ({ children }) => {
  const adminAccess = useAdminState((s) => s.adminAccess);
  const adminCode = useAdminState((s) => s.adminCode);
  const setAdminAccess = useAdminState((s) => s.setAdminAccess);
  const setAdminCode = useAdminState((s) => s.setAdminCode);
  const authUser = useAuthState((s) => s.user);
  const roleOverride = useAuthState((s) => s.roleOverride);
  const authRole = useAuthState(getEffectiveRoleFromState);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (adminAccess && !adminCode) {
      const fallback = import.meta.env.VITE_ADMIN_CODE || ADMIN_ACCESS_CODE;
      if (fallback) setAdminCode(fallback);
    }
  }, [adminAccess, adminCode, setAdminCode]);

  useEffect(() => {
    let mounted = true;
    const allowedRoles = (import.meta.env.VITE_ADMIN_ALLOWED_ROLES || "admin,owner,superadmin,developer")
      .split(",")
      .map((r: string) => r.trim().toLowerCase())
      .filter(Boolean);

    const normalizedRole = typeof authRole === "string" ? authRole.trim().toLowerCase() : "";
    const isAllowedByRole = Boolean(normalizedRole && allowedRoles.includes(normalizedRole));

    if (isAllowedByRole) {
      if (!adminAccess) setAdminAccess(true);
      return () => {
        mounted = false;
      };
    }

    // Respect view-as overrides (ex: "user") by preventing auto-elevation from the real DB role.
    if (roleOverride) {
      if (adminAccess) {
        setAdminAccess(false);
        setAdminCode(null);
      }
      return () => {
        mounted = false;
      };
    }

    if (adminAccess) {
      return () => {
        mounted = false;
      };
    }

    if (!authUser || !supabase) {
      return () => {
        mounted = false;
      };
    }

    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authUser.id)
        .maybeSingle();
      if (!mounted) return;
      const dbRole = typeof data?.role === "string" ? data.role.trim().toLowerCase() : "";
      if (dbRole && allowedRoles.includes(dbRole)) {
        setAdminAccess(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [adminAccess, authRole, authUser, roleOverride, setAdminAccess, setAdminCode]);

  const handleLogin = () => {
    const expected = import.meta.env.VITE_ADMIN_CODE || ADMIN_ACCESS_CODE;
    if (code.trim() === expected) {
      setAdminAccess(true);
      setAdminCode(code.trim());
      setError("");
    } else {
      setError("الكود غير صحيح. جرّب تاني.");
    }
  };

  if (adminAccess) return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">بوابة القمرة</p>
            <h1 className="text-xl font-bold">لوحة التحكم</h1>
          </div>
        </div>
        <p className="text-sm text-slate-400">
          الدخول محلي على هذا الجهاز. اربطها لاحقاً بصلاحيات حقيقية.
        </p>
        <div className="space-y-2">
          <label className="text-xs text-slate-400">كود المدير</label>
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="••••••"
            className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          {error && <p className="text-xs text-rose-300">{error}</p>}
        </div>
        <button
          type="button"
          onClick={handleLogin}
          className="w-full rounded-xl bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2"
        >
          دخول القمرة
        </button>
      </div>
    </div>
  );
};

export const AdminDashboard: FC<{ onExit?: () => void }> = ({ onExit }) => {
  const [tab, setTab] = useState<AdminTab>(getTabFromLocation);
  const [showAccount, setShowAccount] = useState(false);
  const setAdminAccess = useAdminState((s) => s.setAdminAccess);
  const setAdminCode = useAdminState((s) => s.setAdminCode);
  const setFeatureFlags = useAdminState((s) => s.setFeatureFlags);
  const setSystemPrompt = useAdminState((s) => s.setSystemPrompt);
  const setScoringWeights = useAdminState((s) => s.setScoringWeights);
  const setScoringThresholds = useAdminState((s) => s.setScoringThresholds);
  const setAiLogs = useAdminState((s) => s.setAiLogs);
  const setMissions = useAdminState((s) => s.setMissions);
  const setBroadcasts = useAdminState((s) => s.setBroadcasts);
  const setPulseCheckMode = usePulseState((s) => s.setCheckInMode);
  const [remoteStatus, setRemoteStatus] = useState<"local" | "connected" | "error">(
    isSupabaseReady ? "connected" : "local"
  );
  const [remoteMessage, setRemoteMessage] = useState<string | null>(null);

  useEffect(() => {
    const handler = () => setTab(getTabFromLocation());
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  useEffect(() => {
    if (!isSupabaseReady) return;
    let cancelled = false;
    const loadRemote = async () => {
      try {
        const [config, aiLogs, missions, broadcasts] = await Promise.all([
          fetchAdminConfig(),
          fetchAiLogs(),
          fetchMissions(),
          fetchBroadcasts()
        ]);
        if (cancelled) return;
        if (config?.featureFlags) setFeatureFlags(config.featureFlags);
        if (config?.systemPrompt) setSystemPrompt(config.systemPrompt);
        if (config?.scoringWeights) setScoringWeights(config.scoringWeights);
        if (config?.scoringThresholds) setScoringThresholds(config.scoringThresholds);
        if (config?.pulseCheckMode) setPulseCheckMode(config.pulseCheckMode);
        if (aiLogs) setAiLogs(aiLogs);
        if (missions) setMissions(missions);
        if (broadcasts) setBroadcasts(broadcasts);
        setRemoteStatus("connected");
        setRemoteMessage(null);
      } catch {
        if (cancelled) return;
        setRemoteStatus("error");
        setRemoteMessage("تعذر الاتصال ببيانات Supabase. جاري عرض النسخة المحلية.");
      }
    };
    void loadRemote();
    return () => {
      cancelled = true;
    };
  }, [setFeatureFlags, setSystemPrompt, setScoringWeights, setScoringThresholds, setAiLogs, setMissions, setBroadcasts, setPulseCheckMode]);

  const aiOnline = geminiClient.isAvailable();

  const authRole = useAuthState(getEffectiveRoleFromState);
  const normalizedRole = typeof authRole === "string" ? authRole.trim().toLowerCase() : "";
  const isDeveloper = normalizedRole === "developer";

  const visibleNavItems = isDeveloper
    ? NAV_ITEMS
    : NAV_ITEMS.filter((item) => !DEV_ONLY_TABS.includes(item.id));

  const effectiveTab: AdminTab =
    !isDeveloper && DEV_ONLY_TABS.includes(tab) ? "overview" : tab;

  const handleTabChange = (next: AdminTab) => {
    const safeNext: AdminTab =
      !isDeveloper && DEV_ONLY_TABS.includes(next) ? "overview" : next;
    setTab(safeNext);
    updateTabInUrl(safeNext);
  };

  return (
    <AdminGate>
      <div className="admin-cockpit min-h-screen text-slate-800 flex relative overflow-hidden isolate">
        <aside className="admin-sidebar w-64 px-5 py-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-700 text-slate-200 flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">الرحلة</p>
              <h2 className="text-lg font-bold text-slate-100">قمرة القيادة</h2>
            </div>
          </div>
          <nav className="space-y-2">
            {visibleNavItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  effectiveTab === item.id
                    ? "bg-slate-700 text-slate-100 border border-slate-600"
                    : "text-slate-300 hover:bg-slate-800/60"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
          <div className="pt-4 border-t border-slate-700 space-y-2">
            <button
              type="button"
              onClick={() => {
                setAdminAccess(false);
                setAdminCode(null);
                onExit?.();
              }}
              className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4" />
              تسجيل خروج
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0 p-8 space-y-8">
          <header className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500">حالة النظام</p>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${aiOnline ? "bg-emerald-500" : "bg-slate-400"}`} />
                <p className="text-sm font-semibold">{aiOnline ? "الذكاء متصل" : "الذكاء غير متاح"}</p>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                {remoteStatus === "connected"
                  ? "Supabase متصل"
                  : remoteStatus === "error"
                    ? "Supabase غير متاح"
                    : "وضع محلي"}
              </p>
              {remoteMessage && (
                <p className="text-[11px] text-rose-300 mt-1">{remoteMessage}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onExit && (
                <button
                  type="button"
                  onClick={onExit}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  title="الرجوع للمنصة"
                >
                  <Compass className="w-4 h-4 text-slate-500" />
                  الرجوع
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowAccount(true)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                title="الحساب / وضع الصلاحية"
              >
                <User className="w-4 h-4 text-slate-600" />
                الحساب
              </button>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Sparkles className="w-4 h-4 text-slate-400" />
                <span>Admin Mode</span>
              </div>
            </div>
          </header>

          {effectiveTab === "overview" && <OverviewPanel />}
          {effectiveTab === "flow-map" && <FlowMapPanel />}
          {isDeveloper && effectiveTab === "feature-flags" && <FeatureFlagsPanel />}
          {isDeveloper && effectiveTab === "ai-studio" && <AIStudioPanel />}
          {effectiveTab === "content" && <ContentPanel />}
          {effectiveTab === "users" && <UsersPanel />}
          {isDeveloper && effectiveTab === "user-state" && <UserStatePanel />}
          {effectiveTab === "consciousness" && <ConsciousnessArchivePanel />}
        </main>

        <Suspense fallback={null}>
          <DataManagementModal isOpen={showAccount} onClose={() => setShowAccount(false)} />
        </Suspense>
      </div>
    </AdminGate>
  );
};

const FlowMapPanel: FC = () => {
  const [remoteStats, setRemoteStats] = useState<Awaited<ReturnType<typeof fetchOverviewStats>>>(null);
  const [pulseCloseReasonFilter, setPulseCloseReasonFilter] = useState<PulseAbandonReasonFilter>("all");
  const [auditLogs, setAuditLogs] = useState<FlowAuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);
  useEffect(() => {
    if (!isSupabaseReady) return;
    let mounted = true;
    fetchOverviewStats()
      .then((data) => {
        if (!mounted) return;
        if (data) setRemoteStats(data);
      })
      .catch(() => {
        if (!mounted) return;
        setRemoteStats(null);
      });
    return () => {
      mounted = false;
    };
  }, []);
  const flowStats = remoteStats?.flowStats;
  const pulseAbandonedByReason = useMemo(
    () => flowStats?.pulseAbandonedByReason ?? {},
    [flowStats?.pulseAbandonedByReason]
  );
  const pulseAbandonedTotal = useMemo(
    () => Object.values(pulseAbandonedByReason).reduce((sum, value) => sum + (value ?? 0), 0),
    [pulseAbandonedByReason]
  );
  const getPulseReasonPercent = useCallback(
    (count: number) => (pulseAbandonedTotal > 0 ? Math.round((count / pulseAbandonedTotal) * 100) : 0),
    [pulseAbandonedTotal]
  );
  const hasPulseReasonStats = Object.values(pulseAbandonedByReason).some((v) => (v ?? 0) > 0);
  const flowNodes = useMemo(
    () =>
      buildFlowNodes(flowStats?.byStep, {
        selectedPulseAbandonReason: pulseCloseReasonFilter,
        pulseAbandonedByReason
      }),
    [flowStats?.byStep, pulseCloseReasonFilter, pulseAbandonedByReason]
  );
  const flowNodeMetrics = useMemo(
    () => buildFlowNodeMetrics(flowNodes, VISITOR_FLOW_LINKS),
    [flowNodes]
  );
  useEffect(() => {
    let mounted = true;
    setAuditLoading(true);
    fetchFlowAuditLogs(40)
      .then((logs) => {
        if (!mounted) return;
        setAuditLogs(logs);
      })
      .finally(() => {
        if (!mounted) return;
        setAuditLoading(false);
      });
    const unsubscribe = subscribeFlowAuditLogs((entry) => {
      if (!mounted) return;
      setAuditLogs((prev) => [entry, ...prev.filter((item) => item.id !== entry.id)].slice(0, 80));
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const flowActionLabel = useCallback((action: string) => {
    const map: Record<string, string> = {
      create_node: "إضافة كارت",
      edit_node: "تعديل كارت",
      duplicate_node: "نسخ كارت",
      delete_nodes: "حذف كروت",
      reparent_node: "نقل كارت",
      lock_nodes: "قفل كروت",
      unlock_nodes: "فك قفل كروت",
      align_left: "محاذاة يسار",
      align_top: "محاذاة أعلى",
      align_right: "محاذاة يمين",
      align_bottom: "محاذاة أسفل",
      distribute_horizontal: "توزيع أفقي",
      distribute_vertical: "توزيع رأسي",
      save_default_layout: "تثبيت ترتيب افتراضي",
      restore_base_nodes: "استرجاع الكروت الأساسية",
      import_json: "استيراد JSON",
      export_json: "تصدير JSON",
      reset_map: "إعادة ضبط كاملة",
      undo: "تراجع",
      redo: "إعادة",
      filter_success: "فلتر النجاح",
      filter_failure: "فلتر الفشل",
      filter_all: "إلغاء الفلاتر"
    };
    return map[action] ?? action;
  }, []);

  const handleFlowMapAction = useCallback((event: FlowMapActionEvent) => {
    void saveFlowAuditLog({
      action: event.action,
      targetNodeId: event.nodeId ?? null,
      targetNodeTitle: event.nodeTitle ?? null,
      payload: event.payload ?? null
    }).then((entry) => {
      setAuditLogs((prev) => [entry, ...prev.filter((item) => item.id !== entry.id)].slice(0, 80));
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="admin-glass-card p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-800">خريطة تدفق الزائر</h2>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-400 bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700">
            <Workflow className="w-3.5 h-3.5" />
            Automated Workflow
          </span>
        </div>

        {flowStats && Object.keys(flowStats.byStep).length > 0 && (
          <div className="mb-5 flex flex-wrap gap-4 text-xs text-slate-600">
            {flowStats.avgTimeToActionMs != null && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                متوسط زمن القرار: <strong>{Math.round(flowStats.avgTimeToActionMs / 1000)} ثانية</strong>
              </span>
            )}
            {flowStats.addPersonCompletionRate != null && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                نسبة إتمام الإضافة: <strong>{flowStats.addPersonCompletionRate}%</strong>
              </span>
            )}
          </div>
        )}
        {hasPulseReasonStats && (
          <div className="mb-5">
            <p className="text-xs text-slate-500 mb-2">فلتر سبب الهروب من البوصلة</p>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { id: "all", label: "الكل" },
                {
                  id: "backdrop",
                  label: `الخلفية (${pulseAbandonedByReason.backdrop ?? 0} • ${getPulseReasonPercent(
                    pulseAbandonedByReason.backdrop ?? 0
                  )}%)`
                },
                {
                  id: "close_button",
                  label: `زر الإغلاق (${pulseAbandonedByReason.close_button ?? 0} • ${getPulseReasonPercent(
                    pulseAbandonedByReason.close_button ?? 0
                  )}%)`
                },
                {
                  id: "programmatic",
                  label: `برمجي (${pulseAbandonedByReason.programmatic ?? 0} • ${getPulseReasonPercent(
                    pulseAbandonedByReason.programmatic ?? 0
                  )}%)`
                }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPulseCloseReasonFilter(opt.id as PulseAbandonReasonFilter)}
                  className={`rounded-full border px-3 py-1.5 transition-colors ${
                    pulseCloseReasonFilter === opt.id
                      ? "border-rose-300 bg-rose-50 text-rose-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <FlowMindMap
          nodes={flowNodes}
          links={VISITOR_FLOW_LINKS}
          nodeMetrics={flowNodeMetrics}
          allowAddCards
          onAction={handleFlowMapAction}
        />

        <p className="mt-4 text-[11px] text-slate-400">
          Shift+Click لتحديد متعدد • كليك يمين: تعديل/نسخ/قفل/نقل/حذف • الشريط: Undo/Redo/Align/Lock/بحث/فلاتر/Snap/استيراد/تصدير
        </p>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-800">سجل تعديلات خريطة التدفق</h3>
            <span className="text-xs text-slate-500">{auditLogs.length} عملية</span>
          </div>
          {auditLoading ? (
            <p className="text-xs text-slate-500">جاري تحميل السجل...</p>
          ) : auditLogs.length === 0 ? (
            <p className="text-xs text-slate-500">لا توجد عمليات بعد.</p>
          ) : (
            <div className="space-y-2">
              {auditLogs.slice(0, 12).map((log) => (
                <div key={log.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-800">{flowActionLabel(log.action)}</span>
                    <span>{new Date(log.createdAt).toLocaleString("ar-EG", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    {log.targetNodeTitle && <span>الكارت: {log.targetNodeTitle}</span>}
                    {log.actorRole && <span>الدور: {log.actorRole}</span>}
                    {log.source === "local" && <span className="text-amber-600">محلي (fallback)</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const OverviewPanel: FC = () => {
  const stats = getAggregateStats();
  const eventsByDay = getEventsByDay();
  const sessions = getSessionsWithProgress();
  const pulseLogs = usePulseState((s) => s.logs);
  const [activeNow, setActiveNow] = useState<number | null>(null);
  const [lastActive, setLastActive] = useState<number | null>(null);
  const [remoteStats, setRemoteStats] = useState<Awaited<ReturnType<typeof fetchOverviewStats>>>(null);
  const [dailyReport, setDailyReport] = useState<Awaited<ReturnType<typeof fetchDailyReport>>>(null);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyError, setDailyError] = useState("");
  const [weeklyReport, setWeeklyReport] = useState<Awaited<ReturnType<typeof fetchWeeklyReport>>>(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [weeklyError, setWeeklyError] = useState("");
  const [themePrimary, setThemePrimary] = useState("#2dd4bf");
  const [themeAccent, setThemeAccent] = useState("#f5a623");
  const [themeNebulaBase, setThemeNebulaBase] = useState("#131640");
  const [themeNebulaAccent, setThemeNebulaAccent] = useState("#1e2a5e");
  const [themeGlassBg, setThemeGlassBg] = useState("rgba(255, 255, 255, 0.06)");
  const [themeGlassBorder, setThemeGlassBorder] = useState("rgba(255, 255, 255, 0.1)");
  const [themeSaving, setThemeSaving] = useState(false);
  const [themeMessage, setThemeMessage] = useState<string | null>(null);

  const THEME_PRESETS: Array<{
    id: string;
    label: string;
    palette: ThemePalette;
  }> = [
    {
      id: "sunrise",
      label: "🌅 وضع الشروق",
      palette: {
        primary: "#f97316", // برتقالي دافئ
        accent: "#facc15",
        nebulaBase: "#1f2937",
        nebulaAccent: "#7c2d12",
        glassBackground: "rgba(248, 250, 252, 0.08)",
        glassBorder: "rgba(248, 250, 252, 0.18)"
      }
    },
    {
      id: "midnight",
      label: "🌌 منتصف الليل",
      palette: {
        primary: "#22d3ee",
        accent: "#a855f7",
        nebulaBase: "#020617",
        nebulaAccent: "#1d2445",
        glassBackground: "rgba(15, 23, 42, 0.7)",
        glassBorder: "rgba(148, 163, 184, 0.3)"
      }
    },
    {
      id: "desert",
      label: "🏜️ وضع الصحراء",
      palette: {
        primary: "#f97316",
        accent: "#eab308",
        nebulaBase: "#422006",
        nebulaAccent: "#713f12",
        glassBackground: "rgba(250, 250, 249, 0.06)",
        glassBorder: "rgba(250, 250, 249, 0.14)"
      }
    }
  ];

  useEffect(() => {
    let mounted = true;
    getLastActivity().then((ts) => {
      if (!mounted) return;
      setLastActive(ts);
      if (!ts) {
        setActiveNow(0);
        return;
      }
      const diff = Date.now() - ts;
      setActiveNow(diff <= 5 * 60 * 1000 ? 1 : 0);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchThemePalette()
      .then((palette: ThemePalette | null) => {
        if (!mounted || !palette) return;
        if (palette.primary) setThemePrimary(palette.primary);
        if (palette.accent) setThemeAccent(palette.accent);
        if (palette.nebulaBase) setThemeNebulaBase(palette.nebulaBase);
        if (palette.nebulaAccent) setThemeNebulaAccent(palette.nebulaAccent);
        if (palette.glassBackground) setThemeGlassBg(palette.glassBackground);
        if (palette.glassBorder) setThemeGlassBorder(palette.glassBorder);
      })
      .catch(() => {
        // تجاهل الخطأ، نكمّل بالقيم الافتراضية
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSaveTheme = async () => {
    setThemeSaving(true);
    setThemeMessage(null);
    const palette: ThemePalette = {
      primary: themePrimary,
      accent: themeAccent,
      nebulaBase: themeNebulaBase,
      nebulaAccent: themeNebulaAccent,
      glassBackground: themeGlassBg,
      glassBorder: themeGlassBorder
    };
    const ok = await saveThemePalette(palette);
    if (ok) {
      applyThemePalette(palette);
      setThemeMessage("تم حفظ ألوان المنصة وتطبيقها مباشرة.");
    } else {
      setThemeMessage("تعذر حفظ الألوان حالياً. جرّب تاني بعد شوية.");
    }
    setThemeSaving(false);
  };

  useEffect(() => {
    if (!isSupabaseReady) return;
    let mounted = true;
    fetchOverviewStats()
      .then((data) => {
        if (!mounted) return;
        if (data) setRemoteStats(data);
      })
      .catch(() => {
        if (!mounted) return;
        setRemoteStats(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const avgPulse =
    pulseLogs.length > 0
      ? Math.round((pulseLogs.reduce((s, p) => s + p.energy, 0) / pulseLogs.length) * 10) / 10
      : null;

  const localGrowthData = eventsByDay.map((d) => ({
    date: d.date.slice(5),
    paths: d.pathStarts,
    nodes: d.nodesAdded
  }));

  const localZones = Object.entries(stats.byZone)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const totalUsers = remoteStats?.totalUsers ?? sessions.length;
  const activeNowValue = remoteStats?.activeNow ?? activeNow;
  const avgMoodValue = remoteStats?.avgMood ?? avgPulse;
  const aiTokensUsed = remoteStats?.aiTokensUsed ?? stats.totalTaskCompletions;
  const growthData = remoteStats?.growthData?.length ? remoteStats.growthData : localGrowthData;
  const topZones = remoteStats?.zones?.length
    ? remoteStats.zones.slice(0, 3).map((z) => [z.label, z.count] as const)
    : localZones;

  const handleDailyReport = async () => {
    setDailyLoading(true);
    setDailyError("");
    const data = await fetchDailyReport();
    if (!data) {
      setDailyError("تعذر توليد التقرير اليومي.");
    }
    setDailyReport(data);
    setDailyLoading(false);
  };

  const handleWeeklyReport = async () => {
    setWeeklyLoading(true);
    setWeeklyError("");
    const data = await fetchWeeklyReport();
    if (!data) {
      setWeeklyError("تعذر توليد التقرير الأسبوعي.");
    }
    setWeeklyReport(data);
    setWeeklyLoading(false);
  };

  const awarenessGap = remoteStats?.awarenessGap;
  const funnelSteps = remoteStats?.funnel?.steps ?? [];
  const topScenarios = remoteStats?.topScenarios ?? [];
  const emergencyLogs = remoteStats?.emergencyLogs ?? [];
  const taskFriction = remoteStats?.taskFriction ?? [];
  const weeklyRhythm = remoteStats?.weeklyRhythm;
  const flowStats = remoteStats?.flowStats;
  const pulseAbandonedByReason = flowStats?.pulseAbandonedByReason ?? {};
  const pulseAbandonedTotal = Object.values(pulseAbandonedByReason).reduce((sum, value) => sum + (value ?? 0), 0);
  const FLOW_LABELS: Record<string, string> = {
    landing_viewed: "شاهد الهبوط",
    landing_clicked_start: "ضغط يلا نبدأ",
    landing_closed: "قفل المنصة من الهبوط",
    install_clicked: "ضغط تثبيت التطبيق",
    profile_clicked: "ضغط الحساب",
    pulse_opened: "فتح البوصلة",
    pulse_abandoned: "هروب من البوصلة",
    pulse_closed_to_landing: "إغلاق البوصلة والرجوع",
    pulse_abandoned_browser_close: "إغلاق المتصفح أثناء البوصلة",
    pulse_completed: "أكمل البوصلة",
    pulse_completed_with_choices: "حفظ البوصلة مع اختيارات",
    pulse_completed_without_choices: "حفظ البوصلة بدون اختيارات",
    add_person_opened: "فتح إضافة شخص",
    add_person_dropped: "هروب من إضافة شخص",
    tools_opened: "فتح أدوات"
  };

  return (
    <div className="space-y-6">
      {awarenessGap && awarenessGap.totalGreen > 0 && (
        <div className="admin-glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-slate-600">✦</span>
            <h3 className="text-sm font-semibold text-slate-800">فجوة الوعي</h3>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-xs font-bold" title="واقع: قريب">
                قريب
              </span>
              <span className="text-slate-600">→</span>
              <span className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-xs font-bold" title="شعور: استنزاف">
                استنزاف
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-800">{awarenessGap.gapPercent}%</div>
            <p className="text-xs text-slate-600">
              من العلاقات القريبة (واقع) اكتُشفت كمستنزِفة (شعور). {awarenessGap.usersWithGap} مستخدم اكتشفوا الحقيقة الصادمة.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <StatCard title="إجمالي المسافرين" value={formatNumber(totalUsers)} hint={isSupabaseReady ? "من Supabase" : "جلسات محلية"} />
        <StatCard title="نشط الآن" value={formatNumber(activeNowValue)} hint={`آخر نشاط: ${formatTimeAgo(lastActive)}`} />
        <StatCard title="متوسط طاقة اليوم" value={formatNumber(avgMoodValue)} hint="من سجل النبض" />
        <StatCard title="استدعاءات AI" value={formatNumber(aiTokensUsed)} hint={isSupabaseReady ? "من سجل AI" : "مؤقتاً من المهام"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 admin-glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <LineChartIcon className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-800">نمو التفاعل (آخر الأيام)</h3>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
              <LineChart data={growthData}>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip />
                <Line type="monotone" dataKey="paths" stroke="#94a3b8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="nodes" stroke="#64748b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="admin-glass-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-800">مناطق الاحتكاك الأعلى</h3>
          </div>
          {topZones.length === 0 ? (
            <p className="text-xs text-slate-600">لا توجد بيانات كافية بعد.</p>
          ) : (
            <div className="space-y-2">
              {topZones.map(([zone, count]) => (
                <div key={zone} className="flex items-center justify-between text-xs text-slate-600">
                  <span>{zone}</span>
                  <span className="text-slate-800 font-semibold">{count}</span>
                </div>
              ))}
            </div>
          )}
          <div className="pt-3 border-t border-slate-200 text-xs text-slate-600">
            آخر نبضة: {formatTimeAgo(lastActive)}
          </div>
        </div>
      </div>

      {funnelSteps.length > 0 && (
        <div className="admin-glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-800">قمع التحويل (آخر 30 يوم)</h3>
          </div>
          <div className="flex flex-col gap-2">
            {funnelSteps.map((step, i) => {
              const maxCount = Math.max(1, funnelSteps[0]?.count ?? 1);
              const pct = Math.round((step.count / maxCount) * 100);
              return (
                <div key={step.key} className="flex items-center gap-3">
                  <span className="text-slate-600 text-xs w-8">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-slate-600">{step.label}</span>
                      <span className="text-slate-800 font-semibold">{formatNumber(step.count)} جلسة</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-teal-500/70 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {topScenarios.length > 0 && (
        <div className="admin-glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold">أكتر سيناريو بيتكرر</h3>
          </div>
          <p className="text-xs text-slate-400 mb-3">توزيع نوع العلاقات اللي الناس بيضيفوها (استنزاف، سجين ذهني، إلخ).</p>
          <div className="space-y-2">
            {topScenarios.map((s) => (
              <div key={s.key} className="flex items-center justify-between text-xs">
                <span className="text-slate-300">{s.label}</span>
                <span className="text-slate-200 font-semibold">{s.count} ({s.percent}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {emergencyLogs.length > 0 && (
          <div className="rounded-3xl border border-rose-500/40 bg-rose-900/20 p-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-slate-400">⛔</span>
              <h3 className="text-sm font-semibold">طلبات الاستغاثة (آخر 5)</h3>
            </div>
            <div className="space-y-2 text-xs">
              {emergencyLogs.map((log, i) => (
                <div key={i} className="flex justify-between text-slate-300">
                  <span>{log.personLabel}</span>
                  <span className="text-slate-500">{formatTimeAgo(log.createdAt ? new Date(log.createdAt).getTime() : null)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {taskFriction.length > 0 && (
          <div className="admin-glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold">المهام الأكثر هروباً</h3>
            </div>
            <p className="text-xs text-slate-400 mb-3">نسبة الهروب = بدأ ولم ينفّذ. مرتبة من الأصعب.</p>
            <div className="space-y-2">
              {taskFriction.map((t) => (
                <div key={t.label} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 truncate max-w-[80%]" title={t.label}>{t.label}</span>
                  <span className="text-slate-300 font-semibold">{t.escapeRate}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {flowStats && Object.keys(flowStats.byStep).length > 0 && (
        <div className="admin-glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold">مسارات التدفق (آخر 30 يوم)</h3>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-slate-400 mb-3">
            {flowStats.avgTimeToActionMs != null && (
              <span>متوسط زمن القرار (حتى "يلا نبدأ"): {Math.round(flowStats.avgTimeToActionMs / 1000)} ثانية</span>
            )}
            {flowStats.addPersonCompletionRate != null && (
              <span>نسبة إتمام الإضافة: {flowStats.addPersonCompletionRate}%</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(flowStats.byStep)
              .sort(([, a], [, b]) => b - a)
              .map(([step, count]) => (
                <span key={step} className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                  {FLOW_LABELS[step] ?? step}: {count}
                </span>
              ))}
          </div>
          {flowStats.pulseAbandonedByReason && Object.values(flowStats.pulseAbandonedByReason).some((v) => v > 0) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { key: "backdrop", label: "هروب بالخلفية" },
                { key: "close_button", label: "هروب بزر الإغلاق" },
                { key: "programmatic", label: "إغلاق برمجي" }
              ].map((item) => (
                <span key={item.key} className="rounded-full border border-rose-900/40 bg-rose-950/20 px-3 py-1 text-xs text-rose-200">
                  {item.label}: {pulseAbandonedByReason[item.key] ?? 0}
                  {" "}
                  ({pulseAbandonedTotal > 0 ? Math.round(((pulseAbandonedByReason[item.key] ?? 0) / pulseAbandonedTotal) * 100) : 0}%)
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {weeklyRhythm && weeklyRhythm.byDay.some((d) => d.avg != null) && (
        <div className="admin-glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold">إيقاع الطاقة الأسبوعي</h3>
          </div>
          {weeklyRhythm.lowestDayName && (
            <p className="text-xs text-slate-400 mb-3">
              يوم استنزاف الطاقة: <span className="font-semibold">{weeklyRhythm.lowestDayName}</span>
            </p>
          )}
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
              <BarChart data={weeklyRhythm.byDay} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                <XAxis dataKey="dayName" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 10]} />
                <Tooltip
                  formatter={(v: number | string | Array<number | string> | undefined) => {
                    const raw = Array.isArray(v) ? v[0] : v;
                    const numeric = typeof raw === "number" ? raw : Number(raw);
                    const safe = Number.isFinite(numeric) ? numeric : 0;
                    return [`${safe}/10`, "متوسط الطاقة"];
                  }}
                />
                <Bar
                  dataKey="avg"
                  radius={[4, 4, 0, 0]}
                  name="طاقة"
                >
                  {weeklyRhythm.byDay.map((entry) => (
                    <Cell
                      key={`bar-${entry.day}`}
                      fill={entry.day === weeklyRhythm.lowestDay ? "#f97316" : "#14b8a6"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="admin-glass-card p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">التقرير اليومي</h3>
          <button
            type="button"
            onClick={handleDailyReport}
            className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-teal-400"
            disabled={dailyLoading}
          >
            {dailyLoading ? "جاري التوليد..." : "توليد التقرير"}
          </button>
        </div>
        {dailyError && <p className="text-xs text-rose-300">{dailyError}</p>}
        {dailyReport && (
          <div className="space-y-2 text-xs text-slate-300">
            <p>تاريخ التقرير: {dailyReport.date}</p>
            <p>إجمالي الأحداث: {dailyReport.totalEvents}</p>
            <p>جلسات نشطة: {dailyReport.uniqueSessions}</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(dailyReport.typeCounts).map(([type, count]) => (
                <span key={type} className="rounded-full border border-slate-700 px-2 py-1">
                  {type}: {count}
                </span>
              ))}
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-400">أكثر الجلسات نشاطاً:</p>
              {dailyReport.topSessions.length === 0 ? (
                <p className="text-xs text-slate-500">لا توجد جلسات اليوم.</p>
              ) : (
                dailyReport.topSessions.map((row) => (
                  <div key={row.sessionId} className="text-xs text-slate-300">
                    {row.sessionId.slice(0, 14)}… — {row.total} حدث
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="admin-glass-card p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">التقرير الأسبوعي</h3>
          <button
            type="button"
            onClick={handleWeeklyReport}
            className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-teal-400"
            disabled={weeklyLoading}
          >
            {weeklyLoading ? "جاري التوليد..." : "توليد التقرير"}
          </button>
        </div>
        {weeklyError && <p className="text-xs text-rose-300">{weeklyError}</p>}
        {weeklyReport && (
          <div className="space-y-2 text-xs text-slate-300">
            <p>الفترة: {weeklyReport.from} → {weeklyReport.to}</p>
            <p>إجمالي الأحداث: {weeklyReport.totalEvents}</p>
            <p>جلسات فريدة: {weeklyReport.uniqueSessions}</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(weeklyReport.typeCounts).map(([type, count]) => (
                <span key={type} className="rounded-full border border-slate-700 px-2 py-1">
                  {type}: {count}
                </span>
              ))}
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-400">أكثر الجلسات نشاطاً:</p>
              {weeklyReport.topSessions.length === 0 ? (
                <p className="text-xs text-slate-500">لا توجد جلسات كافية.</p>
              ) : (
                weeklyReport.topSessions.map((row) => (
                  <div key={row.sessionId} className="text-xs text-slate-300">
                    {row.sessionId.slice(0, 14)}… — {row.total} حدث
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="admin-glass-card p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">ألوان المنصة (Owner)</h3>
          <button
            type="button"
            onClick={handleSaveTheme}
            disabled={themeSaving}
            className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:border-teal-400 disabled:opacity-50"
          >
            {themeSaving ? "جاري الحفظ..." : "حفظ الألوان"}
          </button>
        </div>
        <p className="text-xs text-slate-400">
          تحكم في اللون الرئيسي، اللكنة، خلفية النيبيولا، وشفافية الكروت الزجاجية. التغييرات تنطبق على كل المنصة فوراً.
        </p>
        <div className="flex flex-wrap gap-2 text-[11px]">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                const p = preset.palette;
                if (p.primary) setThemePrimary(p.primary);
                if (p.accent) setThemeAccent(p.accent);
                if (p.nebulaBase) setThemeNebulaBase(p.nebulaBase);
                if (p.nebulaAccent) setThemeNebulaAccent(p.nebulaAccent);
                if (p.glassBackground) setThemeGlassBg(p.glassBackground);
                if (p.glassBorder) setThemeGlassBorder(p.glassBorder);
                setThemeMessage(`تم تحميل ${preset.label}. اضغط "حفظ الألوان" لتثبيته على جميع المستخدمين.`);
              }}
              className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:border-teal-400 bg-slate-900/60"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1 text-xs">
            <p className="text-slate-300">اللون الرئيسي (Teal — الأزرار واللمسات الأساسية)</p>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={themePrimary}
                onChange={(e) => setThemePrimary(e.target.value)}
                className="w-10 h-10 rounded-full border border-slate-600 bg-slate-900 cursor-pointer"
              />
              <input
                type="text"
                value={themePrimary}
                onChange={(e) => setThemePrimary(e.target.value)}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-2 py-1 text-[11px] text-slate-100"
                placeholder="#2dd4bf"
              />
            </div>
          </div>
          <div className="space-y-1 text-xs">
            <p className="text-slate-300">لون اللكنة (Amber — التنبيهات والهايلايت)</p>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={themeAccent}
                onChange={(e) => setThemeAccent(e.target.value)}
                className="w-10 h-10 rounded-full border border-slate-600 bg-slate-900 cursor-pointer"
              />
              <input
                type="text"
                value={themeAccent}
                onChange={(e) => setThemeAccent(e.target.value)}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-2 py-1 text-[11px] text-slate-100"
                placeholder="#f5a623"
              />
            </div>
          </div>
          <div className="space-y-1 text-xs">
            <p className="text-slate-300">خلفية الفضاء (Nebula Base)</p>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={themeNebulaBase}
                onChange={(e) => setThemeNebulaBase(e.target.value)}
                className="w-10 h-10 rounded-full border border-slate-600 bg-slate-900 cursor-pointer"
              />
              <input
                type="text"
                value={themeNebulaBase}
                onChange={(e) => setThemeNebulaBase(e.target.value)}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-2 py-1 text-[11px] text-slate-100"
                placeholder="#131640"
              />
            </div>
          </div>
          <div className="space-y-1 text-xs">
            <p className="text-slate-300">لون توهج الخلفية (Nebula Accent)</p>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={themeNebulaAccent}
                onChange={(e) => setThemeNebulaAccent(e.target.value)}
                className="w-10 h-10 rounded-full border border-slate-600 bg-slate-900 cursor-pointer"
              />
              <input
                type="text"
                value={themeNebulaAccent}
                onChange={(e) => setThemeNebulaAccent(e.target.value)}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-2 py-1 text-[11px] text-slate-100"
                placeholder="#1e2a5e"
              />
            </div>
          </div>
          <div className="space-y-1 text-xs sm:col-span-2">
            <p className="text-slate-300">خلفية الكروت الزجاجية (Glass Background)</p>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={themeGlassBg.startsWith("#") ? themeGlassBg : "#ffffff"}
                onChange={(e) => setThemeGlassBg(e.target.value)}
                className="w-10 h-10 rounded-full border border-slate-600 bg-slate-900 cursor-pointer"
              />
              <input
                type="text"
                value={themeGlassBg}
                onChange={(e) => setThemeGlassBg(e.target.value)}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-2 py-1 text-[11px] text-slate-100"
                placeholder="rgba(255, 255, 255, 0.06)"
              />
            </div>
          </div>
          <div className="space-y-1 text-xs sm:col-span-2">
            <p className="text-slate-300">حدود الكروت الزجاجية (Glass Border)</p>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={themeGlassBorder.startsWith("#") ? themeGlassBorder : "#ffffff"}
                onChange={(e) => setThemeGlassBorder(e.target.value)}
                className="w-10 h-10 rounded-full border border-slate-600 bg-slate-900 cursor-pointer"
              />
              <input
                type="text"
                value={themeGlassBorder}
                onChange={(e) => setThemeGlassBorder(e.target.value)}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-2 py-1 text-[11px] text-slate-100"
                placeholder="rgba(255, 255, 255, 0.1)"
              />
            </div>
          </div>
        </div>
        {themeMessage && (
          <p className="text-[11px] text-slate-400">
            {themeMessage}
          </p>
        )}
      </div>
    </div>
  );
};

const FeatureFlagsPanel: FC = () => {
  const featureFlags = useAdminState((s) => s.featureFlags);
  const updateFeatureFlag = useAdminState((s) => s.updateFeatureFlag);
  const betaAccess = useAdminState((s) => s.betaAccess);
  const setBetaAccess = useAdminState((s) => s.setBetaAccess);
  const adminAccess = useAdminState((s) => s.adminAccess);
  const role = useAuthState(getEffectiveRoleFromState);
  const [saving, setSaving] = useState(false);
  const effectiveAccess = getEffectiveFeatureAccess({
    featureFlags,
    betaAccess,
    role,
    adminAccess,
    isDev: import.meta.env.DEV
  });

  return (
    <div className="space-y-6">
      <div className="admin-glass-card p-5">
        <h3 className="text-sm font-semibold mb-2">مفاتيح الإطلاق</h3>
        <p className="text-xs text-slate-400">
          غيّر حالة كل ميزة فوراً. وضع Beta يفتحها لمجموعة تجريبية فقط.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {FEATURE_FLAGS.map((flag) => {
          const mode = featureFlags[flag.key];
          return (
            <div key={flag.key} className="admin-glass-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{flag.label}</p>
                  <p className="text-xs text-slate-400 mt-1">{flag.description}</p>
                </div>
                <div className="flex gap-2">
                  {(["on", "off", "beta"] as FeatureFlagMode[]).map((opt) => {
                    if (opt === "beta" && !flag.supportsBeta) return null;
                    const active = mode === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                      onClick={async () => {
                        updateFeatureFlag(flag.key, opt);
                        if (!isSupabaseReady) return;
                        setSaving(true);
                        await saveFeatureFlags({ ...featureFlags, [flag.key]: opt });
                        setSaving(false);
                      }}
                      className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all ${
                        active
                          ? "border-teal-400 bg-teal-500/20 text-slate-200"
                          : "border-slate-700 text-slate-400 hover:border-teal-500/40"
                      }`}
                    >
                      {opt === "on" ? "ON" : opt === "off" ? "OFF" : "BETA"}
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-3">
              الحالة الحالية: {effectiveAccess[flag.key] ? "مفعّلة لهذا الجهاز" : "مقفولة لهذا الجهاز"}
            </p>
          </div>
        );
      })}
      </div>
      {saving && (
        <p className="text-xs text-slate-400">جاري حفظ الإعدادات على Supabase...</p>
      )}

      <div className="admin-glass-card p-5">
        <h4 className="text-sm font-semibold mb-2">صلاحية Beta لهذا الجهاز</h4>
        <p className="text-xs text-slate-400 mb-3">فعّلها لتجربة الميزات في وضع Beta.</p>
        <button
          type="button"
          onClick={async () => {
            const next = !betaAccess;
            setBetaAccess(next);
            if (!isSupabaseReady) return;
            await saveFeatureFlags({ ...featureFlags });
          }}
          className={`rounded-full px-4 py-2 text-xs font-semibold border ${
            betaAccess ? "border-emerald-400 bg-emerald-500/20 text-emerald-200" : "border-slate-700 text-slate-400"
          }`}
        >
          {betaAccess ? "Beta مفعّل" : "Beta مغلق"}
        </button>
      </div>
    </div>
  );
};

const AIStudioPanel: FC = () => {
  const systemPrompt = useAdminState((s) => s.systemPrompt);
  const setSystemPrompt = useAdminState((s) => s.setSystemPrompt);
  const scoringWeights = useAdminState((s) => s.scoringWeights);
  const scoringThresholds = useAdminState((s) => s.scoringThresholds);
  const setScoringWeights = useAdminState((s) => s.setScoringWeights);
  const setScoringThresholds = useAdminState((s) => s.setScoringThresholds);
  const aiLogs = useAdminState((s) => s.aiLogs);
  const addAiLog = useAdminState((s) => s.addAiLog);
  const rateAiLog = useAdminState((s) => s.rateAiLog);
  const clearAiLogs = useAdminState((s) => s.clearAiLogs);

  const [promptDraft, setPromptDraft] = useState(systemPrompt);
  const [weightsDraft, setWeightsDraft] = useState(scoringWeights);
  const [thresholdDraft, setThresholdDraft] = useState(scoringThresholds);
  const [playInput, setPlayInput] = useState("");
  const [playMessages, setPlayMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [loading, setLoading] = useState(false);

  const handleSavePrompt = async () => {
    const next = promptDraft.trim();
    setSystemPrompt(next);
    if (isSupabaseReady) {
      await saveSystemPrompt(next);
    }
  };

  const handleSaveScoring = async () => {
    setScoringWeights(weightsDraft);
    setScoringThresholds(thresholdDraft);
    if (isSupabaseReady) {
      await saveScoring(weightsDraft, thresholdDraft);
    }
  };

  const runPlayground = async () => {
    if (!playInput.trim() || loading) return;
    const userText = playInput.trim();
    setPlayMessages((prev) => [...prev, { role: "user", content: userText }]);
    setPlayInput("");
    setLoading(true);
    const prompt = `${promptDraft.trim()}\n\nالمستخدم: ${userText}\nالمساعد:`;
    const response = await geminiClient.generate(prompt);
    const finalText = response ?? "تعذر الوصول للذكاء الاصطناعي حالياً.";
    setPlayMessages((prev) => [...prev, { role: "assistant", content: finalText }]);
    const entry = {
      id: `ai_${Date.now()}`,
      createdAt: Date.now(),
      prompt: userText,
      response: finalText,
      source: "playground"
    } as const;
    addAiLog(entry);
    if (isSupabaseReady) {
      await saveAiLog(entry);
    }
    setLoading(false);
  };

  useEffect(() => {
    setPromptDraft(systemPrompt);
  }, [systemPrompt]);

  return (
    <div className="space-y-6">
      <div className="admin-glass-card p-5 space-y-3">
        <h3 className="text-sm font-semibold">System Prompt Editor</h3>
        <textarea
          value={promptDraft}
          onChange={(e) => setPromptDraft(e.target.value)}
          rows={6}
          className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 p-3 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSavePrompt}
            className="rounded-full bg-teal-500 text-slate-950 px-4 py-2 text-xs font-semibold"
          >
            حفظ التعديلات
          </button>
          <button
            type="button"
            onClick={() => setPromptDraft(systemPrompt)}
            className="rounded-full border border-slate-700 px-4 py-2 text-xs text-slate-300"
          >
            رجوع
          </button>
        </div>
      </div>

      <div className="admin-glass-card p-5 space-y-4">
        <h3 className="text-sm font-semibold">معادلة الحساب</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(["often", "sometimes", "rarely", "never"] as const).map((key) => (
            <div key={key} className="space-y-1">
              <label className="text-xs text-slate-400">{key.toUpperCase()}</label>
              <input
                type="number"
                value={weightsDraft[key]}
                onChange={(e) => setWeightsDraft((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
              />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-400">حدّ Low (≤)</label>
            <input
              type="number"
              value={thresholdDraft.lowMax}
              onChange={(e) => setThresholdDraft((prev) => ({ ...prev, lowMax: Number(e.target.value) }))}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">حدّ Medium (≤)</label>
            <input
              type="number"
              value={thresholdDraft.mediumMax}
              onChange={(e) => setThresholdDraft((prev) => ({ ...prev, mediumMax: Number(e.target.value) }))}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleSaveScoring}
          className="rounded-full bg-slate-200 text-slate-900 px-4 py-2 text-xs font-semibold"
        >
          حفظ المعادلة
        </button>
      </div>

      <div className="admin-glass-card p-5 space-y-4">
        <h3 className="text-sm font-semibold">Test Playground</h3>
        <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-3 h-52 overflow-auto space-y-2 text-xs">
          {playMessages.length === 0 && (
            <p className="text-slate-500">اكتب رسالة واختبر التغييرات فوراً.</p>
          )}
          {playMessages.map((msg, idx) => (
            <div key={idx} className={msg.role === "user" ? "text-right" : "text-left"}>
              <p className={`inline-block px-3 py-2 rounded-xl ${
                msg.role === "user" ? "bg-teal-500/20 text-slate-200" : "bg-slate-800 text-slate-200"
              }`}>
                {msg.content}
              </p>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={playInput}
            onChange={(e) => setPlayInput(e.target.value)}
            placeholder="جرّب رسالة..."
            className="flex-1 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
          />
          <button
            type="button"
            onClick={runPlayground}
            className="rounded-xl bg-teal-500 px-4 text-xs font-semibold text-slate-950 flex items-center gap-2"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            تشغيل
          </button>
        </div>
      </div>

      <div className="admin-glass-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">آخر ردود الذكاء</h3>
          <button
            type="button"
            onClick={clearAiLogs}
            className="text-xs text-slate-400 hover:text-rose-300"
          >
            مسح السجل
          </button>
        </div>
        {aiLogs.length === 0 ? (
          <p className="text-xs text-slate-500">لا يوجد سجل بعد.</p>
        ) : (
          <div className="space-y-2">
            {aiLogs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-xs">
                <p className="text-slate-400 mb-1">Prompt: {log.prompt}</p>
                <p className="text-slate-200">{log.response}</p>
                <div className="flex items-center gap-2 mt-2 text-slate-400">
                  <button
                    type="button"
                    onClick={async () => {
                      rateAiLog(log.id, "up");
                      if (isSupabaseReady) await rateAiLogRemote(log.id, "up");
                    }}
                    className={`p-1 rounded-full ${log.rating === "up" ? "text-emerald-300" : "hover:text-emerald-200"}`}
                    title="ممتاز"
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      rateAiLog(log.id, "down");
                      if (isSupabaseReady) await rateAiLogRemote(log.id, "down");
                    }}
                    className={`p-1 rounded-full ${log.rating === "down" ? "text-rose-300" : "hover:text-rose-200"}`}
                    title="سيء"
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] text-slate-500">
                    {new Date(log.createdAt).toLocaleDateString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ContentPanel: FC = () => {
  const missions = useAdminState((s) => s.missions);
  const addMission = useAdminState((s) => s.addMission);
  const removeMission = useAdminState((s) => s.removeMission);
  const broadcasts = useAdminState((s) => s.broadcasts);
  const addBroadcast = useAdminState((s) => s.addBroadcast);
  const removeBroadcast = useAdminState((s) => s.removeBroadcast);

  const [missionTitle, setMissionTitle] = useState("");
  const [missionTrack, setMissionTrack] = useState("مسار الجذور");
  const [missionDifficulty, setMissionDifficulty] = useState<Parameters<typeof addMission>[0]["difficulty"]>("سهل" as Parameters<typeof addMission>[0]["difficulty"]);

  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");

  const handleAddMission = async () => {
    if (!missionTitle.trim()) return;
    const mission: Parameters<typeof addMission>[0] = {
      id: `mission_${Date.now()}`,
      title: missionTitle.trim(),
      track: missionTrack,
      difficulty: missionDifficulty,
      createdAt: Date.now()
    };
    addMission(mission);
    if (isSupabaseReady) {
      await saveMission(mission);
    }
    setMissionTitle("");
  };

  const handleAddBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastBody.trim()) return;
    const broadcast = {
      id: `broadcast_${Date.now()}`,
      title: broadcastTitle.trim(),
      body: broadcastBody.trim(),
      createdAt: Date.now()
    } as const;
    addBroadcast(broadcast);
    if (isSupabaseReady) {
      await saveBroadcast(broadcast);
    }
    setBroadcastTitle("");
    setBroadcastBody("");
  };

  return (
    <div className="space-y-6">
      <div className="admin-glass-card p-5 space-y-3">
        <h3 className="text-sm font-semibold">مكتبة المهمات</h3>
        <div className="grid md:grid-cols-3 gap-2">
          <input
            value={missionTitle}
            onChange={(e) => setMissionTitle(e.target.value)}
            placeholder="اسم المهمة"
            className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
          />
          <select
            value={missionTrack}
            onChange={(e) => setMissionTrack(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
          >
            <option>مسار الجذور</option>
            <option>مسار الدرع</option>
            <option>مسار فن المسافة</option>
            <option>مسار الصيام الشعوري</option>
            <option>مسار الطوارئ</option>
          </select>
          <select
            value={missionDifficulty}
            onChange={(e) => setMissionDifficulty(e.target.value as Parameters<typeof addMission>[0]["difficulty"])}
            className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
          >
            <option value="سهل">سهل</option>
            <option value="متوسط">متوسط</option>
            <option value="صعب">صعب</option>
          </select>
        </div>
        <button
          type="button"
          onClick={handleAddMission}
          className="rounded-full bg-teal-500 text-slate-950 px-4 py-2 text-xs font-semibold"
        >
          إضافة مهمة
        </button>
        <div className="space-y-2">
          {missions.length === 0 && <p className="text-xs text-slate-500">لا توجد مهام مضافة بعد.</p>}
          {missions.map((m) => (
            <div key={m.id} className="flex items-center justify-between text-xs bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2">
              <div>
                <p className="font-semibold text-slate-200">{m.title}</p>
                <p className="text-slate-500">{m.track} • {m.difficulty}</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  removeMission(m.id);
                  if (isSupabaseReady) {
                    await deleteMission(m.id);
                  }
                }}
                className="text-rose-300 hover:text-rose-200"
              >
                حذف
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-glass-card p-5 space-y-3">
        <h3 className="text-sm font-semibold">رسائل الطوارئ العامة</h3>
        <input
          value={broadcastTitle}
          onChange={(e) => setBroadcastTitle(e.target.value)}
          placeholder="عنوان الرسالة"
          className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
        />
        <textarea
          value={broadcastBody}
          onChange={(e) => setBroadcastBody(e.target.value)}
          placeholder="نص الرسالة"
          rows={3}
          className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
        />
        <button
          type="button"
          onClick={handleAddBroadcast}
          className="rounded-full bg-amber-400 text-slate-950 px-4 py-2 text-xs font-semibold"
        >
          إرسال الرسالة
        </button>
        <div className="space-y-2">
          {broadcasts.length === 0 && <p className="text-xs text-slate-500">لا توجد رسائل بعد.</p>}
          {broadcasts.map((b) => (
            <div key={b.id} className="flex items-start justify-between gap-3 text-xs bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2">
              <div>
                <p className="font-semibold text-slate-200">{b.title}</p>
                <p className="text-slate-500 mt-1">{b.body}</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  removeBroadcast(b.id);
                  if (isSupabaseReady) {
                    await deleteBroadcast(b.id);
                  }
                }}
                className="text-rose-300 hover:text-rose-200"
              >
                حذف
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const UsersPanel: FC = () => {
  const [query, setQuery] = useState("");
  const sessions = getSessionsWithProgress();
  const [remoteUsers, setRemoteUsers] = useState<Awaited<ReturnType<typeof fetchUsers>>>(null);
  const [loading, setLoading] = useState(false);
  const [roleSaving, setRoleSaving] = useState<string | null>(null);
  const [godViewOpen, setGodViewOpen] = useState(false);
  const [godViewLoading, setGodViewLoading] = useState(false);
  const [godViewError, setGodViewError] = useState("");
  const [godViewSnapshot, setGodViewSnapshot] = useState<JourneyMapSnapshot | null>(null);
  const [godViewSessionId, setGodViewSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseReady) return;
    let mounted = true;
    setLoading(true);
    fetchUsers()
      .then((data) => {
        if (!mounted) return;
        setRemoteUsers(data);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filteredSessions = sessions.filter((s) => s.sessionId.toLowerCase().includes(query.toLowerCase()));
  const filteredUsers =
    remoteUsers?.filter((u) =>
      `${u.fullName} ${u.email} ${u.id}`.toLowerCase().includes(query.toLowerCase())
    ) ?? [];

  // Keep this aligned with actual auth/feature-role logic (see src/utils/featureFlags.ts and AdminGate allowed roles).
  const ROLE_OPTIONS = ["user", "admin", "developer", "owner", "superadmin"];

  const openGodView = async (sessionId: string) => {
    setGodViewSessionId(sessionId);
    setGodViewSnapshot(null);
    setGodViewError("");
    setGodViewOpen(true);
    setGodViewLoading(true);

    try {
      if (isSupabaseReady) {
        const data = await fetchJourneyMap(sessionId);
        if (data) {
          setGodViewSnapshot(data);
        } else {
          setGodViewError("لا توجد بيانات خريطة لهذه الجلسة بعد.");
        }
      } else {
        const currentSession = getTrackingSessionId();
        if (currentSession && currentSession === sessionId) {
          const stored = await loadStoredState();
          if (stored?.nodes?.length) {
            setGodViewSnapshot({
              sessionId,
              nodes: stored.nodes,
              updatedAt: Date.now()
            });
          } else {
            setGodViewError("لا توجد بيانات محلية متاحة حالياً.");
          }
        } else {
          setGodViewError("ربط Supabase غير متاح لهذه الجلسة.");
        }
      }
    } catch (error) {
      setGodViewError("حصل خطأ أثناء تحميل بيانات الخريطة.");
      if (import.meta.env.DEV) {
        console.warn("God View load failed", error);
      }
    } finally {
      setGodViewLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="admin-glass-card p-5 space-y-3">
        <h3 className="text-sm font-semibold">جدول المسافرين</h3>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث برقم الجلسة..."
          className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
        />
      </div>

      <div className="admin-glass-card p-5">
        {loading && <p className="text-xs text-slate-500">جاري تحميل المستخدمين...</p>}
        {!loading && remoteUsers && (
          <div className="space-y-2">
            {filteredUsers.length === 0 ? (
              <p className="text-xs text-slate-500">لا توجد نتائج مطابقة.</p>
            ) : (
              filteredUsers.map((user) => (
                <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 text-xs border border-slate-800 rounded-xl px-3 py-2">
                  <div>
                    <p className="font-semibold text-slate-200">{user.fullName}</p>
                    <p className="text-slate-500">{user.email}</p>
                  </div>
                  <div className="text-slate-400">
                    الدور: {user.role} • انضم {user.createdAt ? new Date(user.createdAt).toLocaleDateString("ar-EG") : "—"}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={user.role}
                      onChange={async (e) => {
                        const nextRole = e.target.value;
                        setRoleSaving(user.id);
                        const ok = await updateUserRole(user.id, nextRole);
                        if (ok) {
                          setRemoteUsers((prev) =>
                            prev ? prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u)) : prev
                          );
                        }
                        setRoleSaving(null);
                      }}
                      className="rounded-lg border border-slate-700 bg-slate-950/60 px-2 py-1 text-xs text-slate-200"
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                    {roleSaving === user.id && (
                      <span className="text-xs text-slate-500">جارٍ الحفظ...</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-teal-400"
                    onClick={() => openGodView(user.id)}
                  >
                    نظرة الإله
                  </button>
                </div>
              ))
            )}
          </div>
        )}
        {!loading && !remoteUsers && (
          <>
            {filteredSessions.length === 0 ? (
              <p className="text-xs text-slate-500">لا توجد جلسات معرّفة. فعّل وضع التتبع بالهوية.</p>
            ) : (
              <div className="space-y-2">
                {filteredSessions.map((session) => (
                  <div key={session.sessionId} className="flex flex-wrap items-center justify-between gap-3 text-xs border border-slate-800 rounded-xl px-3 py-2">
                    <div>
                      <p className="font-semibold text-slate-200">{session.sessionId}</p>
                      <p className="text-slate-500">آخر نشاط: {session.lastActivity}</p>
                    </div>
                    <div className="text-slate-400">
                      مسارات: {session.pathStarts} • مهام: {session.taskCompletions}
                    </div>
                    <button
                      type="button"
                      className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-teal-400"
                      onClick={() => openGodView(session.sessionId)}
                    >
                      نظرة الإله
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <GodViewModal
        isOpen={godViewOpen}
        onClose={() => setGodViewOpen(false)}
        loading={godViewLoading}
        error={godViewError}
        snapshot={godViewSnapshot}
        sessionId={godViewSessionId}
      />
    </div>
  );
};

const UserStatePanel: FC = () => {
  const [rows, setRows] = useState<UserStateRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<UserStateRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [fullExporting, setFullExporting] = useState(false);
  const [importError, setImportError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchUserStates()
      .then((data) => {
        if (!mounted) return;
        setRows(data);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = rows?.filter((row) => {
    const blob = `${row.deviceToken} ${row.ownerId ?? ""}`.toLowerCase();
    return blob.includes(query.toLowerCase());
  }) ?? [];

  const loadDetail = async (row: UserStateRow) => {
    setDetailLoading(true);
    setDetailError("");
    const data = await fetchUserStateDetail(
      row.ownerId ? { ownerId: row.ownerId } : { deviceToken: row.deviceToken }
    );
    if (!data) {
      setDetailError("لا توجد تفاصيل متاحة.");
      setDetail(null);
    } else {
      setDetail(data);
    }
    setDetailLoading(false);
  };

  const handleExport = async () => {
    setExporting(true);
    const data = await exportUserStates(500);
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `user-state-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    setExporting(false);
  };

  const handleFullExport = async () => {
    setFullExporting(true);
    const data = await exportFullData(5000);
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `full-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    setFullExporting(false);
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const raw = String(e.target?.result ?? "");
        const json = JSON.parse(raw);
        const rowsPayload = Array.isArray(json?.rows) ? json.rows : Array.isArray(json) ? json : [];
        if (rowsPayload.length === 0) {
          setImportError("الملف لا يحتوي على بيانات صالحة.");
          return;
        }
        setImporting(true);
        const ok = await importUserStates(rowsPayload);
        if (!ok) {
          setImportError("فشل استيراد البيانات.");
        } else {
          setImportError("");
          const refreshed = await fetchUserStates();
          setRows(refreshed);
        }
      } catch {
        setImportError("فشل قراءة ملف الاستيراد.");
      } finally {
        setImporting(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="admin-glass-card p-5 space-y-3">
        <h3 className="text-sm font-semibold">لقطات السحابة</h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-teal-400 disabled:opacity-50"
          >
            {exporting ? "جاري التصدير..." : "تصدير JSON"}
          </button>
          <button
            type="button"
            onClick={handleFullExport}
            disabled={fullExporting}
            className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-indigo-400 disabled:opacity-50"
          >
            {fullExporting ? "جاري التصدير..." : "تصدير شامل"}
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-amber-400 disabled:opacity-50"
          >
            {importing ? "جاري الاستيراد..." : "استيراد ملف"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            onChange={handleImportFile}
            className="hidden"
          />
        </div>
        {importError && <p className="text-xs text-rose-300">{importError}</p>}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث بـ device token أو user id"
          className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
        />
      </div>

      <div className="admin-glass-card p-5 space-y-3">
        {loading && <p className="text-xs text-slate-500">جاري تحميل البيانات...</p>}
        {!loading && rows && (
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <p className="text-xs text-slate-500">لا توجد نتائج.</p>
            ) : (
              filtered.map((row) => (
                <div
                  key={row.deviceToken}
                  className="flex flex-wrap items-center justify-between gap-3 text-xs border border-slate-800 rounded-xl px-3 py-2"
                >
                  <div>
                    <p className="font-mono text-slate-300 truncate max-w-[220px]" title={row.deviceToken}>
                      {row.deviceToken}
                    </p>
                    <p className="text-slate-500">user: {row.ownerId ?? "—"}</p>
                  </div>
                  <div className="text-slate-400">
                    آخر تحديث: {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString("ar-EG") : "—"}
                  </div>
                  <button
                    type="button"
                    onClick={() => loadDetail(row)}
                    className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-teal-400"
                  >
                    عرض البيانات
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="admin-glass-card p-5 space-y-3">
        <h4 className="text-sm font-semibold">تفاصيل المستخدم</h4>
        {detailLoading && <p className="text-xs text-slate-500">جاري التحميل...</p>}
        {detailError && <p className="text-xs text-rose-300">{detailError}</p>}
        {!detailLoading && detail && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400">Device: {detail.deviceToken}</p>
            <p className="text-xs text-slate-400">User: {detail.ownerId ?? "—"}</p>
            <pre className="max-h-64 overflow-y-auto rounded-xl bg-slate-950/70 p-3 text-[11px] text-slate-200">
{JSON.stringify(detail.data ?? {}, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

const ConsciousnessArchivePanel: FC = () => {
  const [items, setItems] = useState<MemoryMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<"all" | "pulse" | "chat" | "note">("all");
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [tagEdits, setTagEdits] = useState<Record<string, string>>({});
  const [noteEdits, setNoteEdits] = useState<Record<string, string>>({});

  const loadArchive = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await consciousnessService.fetchArchive({ limit: 1000 });
      setItems(data ?? []);
    } catch (e) {
      console.error("فشل تحميل أرشيف الوعي", e);
      setError("فشل تحميل الأرشيف من Supabase.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadArchive();
  }, []);

  const filteredItems =
    sourceFilter === "all"
      ? items
      : items.filter((i) => (i.source ?? "pulse") === sourceFilter);

  const handleExportCsv = () => {
    if (!items.length) return;
    setExportingCsv(true);
    try {
      const header = ["id", "created_at", "source", "user_id", "hidden", "tags", "manual_notes", "content"];
      const rows = items.map((m) => [
        m.id ?? "",
        m.created_at ?? "",
        m.source ?? "",
        m.user_id ?? "",
        m.hidden ? "true" : "false",
        Array.isArray(m.tags) ? m.tags.join("|") : "",
        m.manual_notes ?? "",
        (m.content ?? "").replace(/\s+/g, " ").slice(0, 500)
      ]);
      const csv =
        [header.join(","), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join(
          "\n"
        );
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `consciousness-archive-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExportingCsv(false);
    }
  };

  const handleExportPdf = async () => {
    if (!items.length) return;
    setExportingPdf(true);
    try {
      const JsPdfModule = await import("jspdf");
      const JsPdf = JsPdfModule.default;
      const pdf = new JsPdf({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let y = margin;

      pdf.setFont("helvetica");
      pdf.setLanguage("ar");

      pdf.setFontSize(16);
      pdf.text("أرشيف الوعي — دواير", pageWidth / 2, y, { align: "center" });
      y += 10;

      pdf.setFontSize(10);
      const dateStr = new Date().toLocaleString("ar-EG");
      pdf.text(dateStr, pageWidth / 2, y, { align: "center" });
      y += 10;

      pdf.setFontSize(11);

      const addLine = (text: string) => {
        const lines = pdf.splitTextToSize(text, pageWidth - margin * 2);
        for (const line of lines) {
          if (y + 6 > pageHeight - margin) {
            pdf.addPage();
            y = margin;
          }
          pdf.text(line, margin, y);
          y += 5;
        }
      };

      filteredItems.forEach((item, index) => {
        if (index > 0) {
          if (y + 10 > pageHeight - margin) {
            pdf.addPage();
            y = margin;
          }
          pdf.setDrawColor(148, 163, 184);
          pdf.line(margin, y, pageWidth - margin, y);
          y += 6;
        }

        pdf.setFontSize(11);
        addLine(
          `#${index + 1} | المصدر: ${item.source ?? "غير محدد"} | التاريخ: ${
            item.created_at ? new Date(item.created_at).toLocaleString("ar-EG") : "—"
          }`
        );
        pdf.setFontSize(10);
        addLine(`المحتوى: ${(item.content ?? "").slice(0, 900)}`);
      });

      pdf.save(`consciousness-archive-${Date.now()}.pdf`);
    } catch (e) {
      console.error("فشل تصدير PDF لأرشيف الوعي", e);
      setError("فشل إنشاء ملف PDF للأرشيف.");
    } finally {
      setExportingPdf(false);
    }
  };

  const handleToggleHidden = async (item: MemoryMatch) => {
    const id = item.id;
    if (!id || !supabase) return;
    setUpdatingId(id);
    try {
      const isHidden = Boolean(item.hidden);
      const { error: updateError } = await supabase
        .from("consciousness_vectors")
        .update({ hidden: !isHidden })
        .eq("id", id);
      if (updateError) {
        console.error("فشل تحديث حالة الإخفاء في الأرشيف", updateError);
        setError("فشل تحديث حالة الإخفاء في Supabase.");
      } else {
        await loadArchive();
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveMeta = async (item: MemoryMatch) => {
    const id = item.id;
    if (!id || !supabase) return;
    setSavingId(id);
    setError(null);
    try {
      const rawTags =
        tagEdits[id] ??
        (Array.isArray(item.tags) ? item.tags.join(", ") : "");
      const tags = rawTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const rawNotes =
        noteEdits[id] ?? (item.manual_notes != null ? item.manual_notes : "");
      const manualNotes = rawNotes.trim() === "" ? null : rawNotes.trim();

      const { error: updateError } = await supabase
        .from("consciousness_vectors")
        .update({
          tags: tags.length > 0 ? tags : null,
          manual_notes: manualNotes
        })
        .eq("id", id);

      if (updateError) {
        console.error("فشل حفظ الوسوم/الملاحظات في الأرشيف", updateError);
        setError("فشل حفظ الوسوم أو الملاحظات في Supabase.");
      } else {
        await loadArchive();
        // نفرّغ القيم المؤقتة بعد الحفظ الناجح
        setTagEdits((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        setNoteEdits((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="admin-glass-card p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Brain className="w-4 h-4 text-slate-400" />
              أرشيف الوعي
            </h3>
            <p className="text-xs text-slate-400">
              كل اللحظات المخزّنة من البوصلة والشات، مع إمكانية التصدير، الوسوم، والإخفاء من الواجهة.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={exportingCsv || !items.length}
              className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:border-teal-400 disabled:opacity-50"
            >
              {exportingCsv ? "جاري التصدير..." : "تصدير CSV"}
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={exportingPdf || !items.length}
              className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:border-rose-400 disabled:opacity-50"
            >
              {exportingPdf ? "جاري إنشاء PDF..." : "تصدير PDF"}
            </button>
            <button
              type="button"
              onClick={loadArchive}
              disabled={loading}
              className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:border-indigo-400 disabled:opacity-50"
            >
              إعادة تحميل
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSourceFilter("all")}
            className={`px-3 py-1 rounded-full text-[11px] ${
              sourceFilter === "all"
                ? "bg-teal-500/20 text-slate-100 border border-teal-400/50"
                : "bg-slate-900 text-slate-300 border border-slate-700"
            }`}
          >
            الكل
          </button>
          <button
            type="button"
            onClick={() => setSourceFilter("pulse")}
            className={`px-3 py-1 rounded-full text-[11px] ${
              sourceFilter === "pulse"
                ? "bg-emerald-500/20 text-emerald-100 border border-emerald-400/50"
                : "bg-slate-900 text-slate-300 border border-slate-700"
            }`}
          >
            من البوصلة
          </button>
          <button
            type="button"
            onClick={() => setSourceFilter("chat")}
            className={`px-3 py-1 rounded-full text-[11px] ${
              sourceFilter === "chat"
                ? "bg-sky-500/20 text-sky-100 border border-sky-400/50"
                : "bg-slate-900 text-slate-300 border border-slate-700"
            }`}
          >
            من الشات
          </button>
          <button
            type="button"
            onClick={() => setSourceFilter("note")}
            className={`px-3 py-1 rounded-full text-[11px] ${
              sourceFilter === "note"
                ? "bg-amber-500/20 text-amber-100 border border-amber-400/50"
                : "bg-slate-900 text-slate-300 border border-slate-700"
            }`}
          >
            ملاحظات
          </button>
        </div>
        {error && <p className="text-xs text-rose-300">{error}</p>}
        {loading && <p className="text-xs text-slate-500">جاري تحميل الأرشيف...</p>}
      </div>

      <div className="admin-glass-card p-5 space-y-3">
        {!loading && filteredItems.length === 0 && (
          <p className="text-xs text-slate-500">لا توجد لحظات في الأرشيف بعد.</p>
        )}
        <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
          {filteredItems.map((item) => (
            <div
              key={item.id ?? `${item.created_at}-${item.content?.slice(0, 20) ?? ""}`}
              className="border border-slate-800 rounded-xl px-3 py-2 text-xs space-y-1 bg-slate-950/60"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] ${
                      (item.source ?? "pulse") === "chat"
                        ? "bg-sky-500/20 text-sky-100 border border-sky-400/40"
                        : (item.source ?? "pulse") === "note"
                          ? "bg-amber-500/20 text-amber-100 border border-amber-400/40"
                          : "bg-emerald-500/20 text-emerald-100 border border-emerald-400/40"
                    }`}
                  >
                    {item.source === "chat"
                      ? "من الشات"
                      : item.source === "note"
                        ? "ملاحظة"
                        : "من البوصلة"}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleString("ar-EG")
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveMeta(item)}
                    disabled={savingId === item.id}
                    className="text-[10px] text-slate-400 hover:text-slate-100 disabled:opacity-50"
                  >
                    {savingId === item.id ? "جاري الحفظ..." : "حفظ الوسوم/الملاحظات"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleHidden(item)}
                    disabled={updatingId === item.id}
                    className="text-[10px] text-amber-300 hover:text-amber-200 disabled:opacity-50"
                  >
                    {updatingId === item.id
                      ? "جاري التحديث..."
                      : item.hidden
                        ? "إعادة إظهار في الواجهة"
                        : "إخفاء من الواجهة"}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400">الوسوم (افصل بينهم بفاصلة ,)</label>
                  <input
                    type="text"
                    value={
                      tagEdits[item.id] ??
                      (Array.isArray(item.tags) ? item.tags.join(", ") : "")
                    }
                    onChange={(e) =>
                      setTagEdits((prev) => ({
                        ...prev,
                        [item.id]: e.target.value
                      }))
                    }
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-2 py-1 text-[11px] text-slate-100"
                    placeholder="مثال: انفصال, عمل, نوم"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400">ملاحظات للمشرف</label>
                  <textarea
                    value={
                      noteEdits[item.id] ??
                      (item.manual_notes != null ? item.manual_notes : "")
                    }
                    onChange={(e) =>
                      setNoteEdits((prev) => ({
                        ...prev,
                        [item.id]: e.target.value
                      }))
                    }
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-2 py-1 text-[11px] text-slate-100 min-h-[40px] resize-none"
                    placeholder="مثال: لحظة حرجة تخص علاقة سابقة..."
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-100 whitespace-pre-wrap leading-relaxed">
                {item.content}
              </p>
              {item.user_id && (
                <p className="text-[10px] text-slate-500">user: {item.user_id}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const GodViewModal: FC<{
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  error: string;
  snapshot: JourneyMapSnapshot | null;
  sessionId: string | null;
}> = ({ isOpen, onClose, loading, error, snapshot, sessionId }) => {
  if (!isOpen) return null;

  const nodes = snapshot?.nodes ?? [];
  const ringCounts = { red: 0, yellow: 0, green: 0, grey: 0 };
  for (const node of nodes) {
    if (node.isDetached || node.detachmentMode) ringCounts.grey += 1;
    else ringCounts[node.ring] += 1;
  }

  const updatedAtLabel = snapshot?.updatedAt
    ? new Date(snapshot.updatedAt).toLocaleDateString("ar-EG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-950 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">نظرة الإله</h3>
            <p className="text-xs text-slate-400">{sessionId ?? "—"}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-slate-800">
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري تحميل الخريطة...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-3">
                  <p className="text-xs text-slate-400">إجمالي العلاقات</p>
                  <p className="text-lg font-semibold text-slate-400">{nodes.length}</p>
                </div>
                <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-3">
                  <p className="text-xs text-slate-400">أحمر</p>
                  <p className="text-lg font-semibold text-rose-300">{ringCounts.red}</p>
                </div>
                <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-3">
                  <p className="text-xs text-slate-400">أصفر</p>
                  <p className="text-lg font-semibold text-amber-300">{ringCounts.yellow}</p>
                </div>
                <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-3">
                  <p className="text-xs text-slate-400">أخضر/رمادي</p>
                  <p className="text-lg font-semibold text-emerald-300">{ringCounts.green + ringCounts.grey}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-400">
                آخر تحديث: {updatedAtLabel}
              </div>

              {nodes.length === 0 ? (
                <p className="text-sm text-slate-400">لا توجد عقد محفوظة بعد.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {nodes.slice(0, 12).map((node) => (
                    <div key={node.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                      <p className="text-sm font-semibold text-slate-100">{node.label}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        المنطقة: {node.isDetached || node.detachmentMode ? "رمادي" : node.ring === "red" ? "أحمر" : node.ring === "yellow" ? "أصفر" : "أخضر"}
                      </p>
                      {node.analysis?.score != null && (
                        <p className="text-xs text-slate-500 mt-1">تقييم: {node.analysis.score}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {nodes.length > 12 && (
                <p className="text-xs text-slate-500">عرض أول 12 علاقة فقط.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard: FC<{ title: string; value: string; hint?: string }> = ({ title, value, hint }) => (
  <div className="admin-glass-card p-5">
    <p className="text-xs text-slate-600">{title}</p>
    <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
    {hint && <p className="text-[11px] text-slate-600 mt-2">{hint}</p>}
  </div>
);
