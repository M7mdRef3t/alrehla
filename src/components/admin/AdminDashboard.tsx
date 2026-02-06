import type { FC, ReactNode } from "react";
import { useEffect, useState, useRef } from "react";
import {
  Activity,
  Brain,
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
  X
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { FEATURE_FLAGS, type FeatureFlagMode } from "../../config/features";
import { useAdminState, ADMIN_ACCESS_CODE } from "../../state/adminState";
import { useAuthState } from "../../state/authState";
import { getAggregateStats, getEventsByDay, getSessionsWithProgress, getTrackingSessionId } from "../../services/journeyTracking";
import { getLastActivity } from "../../services/notifications";
import { geminiClient } from "../../services/geminiClient";
import { usePulseState } from "../../state/pulseState";
import { isFeatureEnabled } from "../../utils/featureFlags";
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
  deleteMission
} from "../../services/adminApi";
import type { JourneyMapSnapshot, UserStateRow } from "../../services/adminApi";
import { isSupabaseReady, supabase } from "../../services/supabaseClient";
import { loadStoredState } from "../../services/localStore";

type AdminTab = "overview" | "feature-flags" | "ai-studio" | "content" | "users" | "user-state";

const NAV_ITEMS: Array<{ id: AdminTab; label: string; icon: ReactNode }> = [
  { id: "overview", label: "نبض الرحلة", icon: <Activity className="w-4 h-4" /> },
  { id: "feature-flags", label: "التحكم في الزمن", icon: <Flag className="w-4 h-4" /> },
  { id: "ai-studio", label: "مختبر الذكاء", icon: <Brain className="w-4 h-4" /> },
  { id: "content", label: "إدارة المحتوى", icon: <Database className="w-4 h-4" /> },
  { id: "users", label: "شؤون المسافرين", icon: <Users className="w-4 h-4" /> },
  { id: "user-state", label: "سحابة البيانات", icon: <Database className="w-4 h-4" /> }
];

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
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (adminAccess && !adminCode) {
      const fallback = import.meta.env.VITE_ADMIN_CODE || ADMIN_ACCESS_CODE;
      if (fallback) setAdminCode(fallback);
    }
  }, [adminAccess, adminCode, setAdminCode]);

  useEffect(() => {
    if (adminAccess || !authUser || !supabase) return;
    let mounted = true;
    const allowedRoles = (import.meta.env.VITE_ADMIN_ALLOWED_ROLES || "admin,owner,superadmin")
      .split(",")
      .map((r: string) => r.trim())
      .filter(Boolean);
    supabase
      .from("profiles")
      .select("role")
      .eq("id", authUser.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!mounted) return;
        if (data?.role && allowedRoles.includes(String(data.role))) {
          setAdminAccess(true);
        }
      })
      .catch(() => {
        // ignore
      });
    return () => {
      mounted = false;
    };
  }, [adminAccess, authUser, setAdminAccess]);

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
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-300">بوابة القمرة</p>
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
            className="w-full rounded-xl bg-slate-950/60 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          {error && <p className="text-xs text-rose-300">{error}</p>}
        </div>
        <button
          type="button"
          onClick={handleLogin}
          className="w-full rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold py-2"
        >
          دخول القمرة
        </button>
      </div>
    </div>
  );
};

export const AdminDashboard: FC<{ onExit?: () => void }> = ({ onExit }) => {
  const [tab, setTab] = useState<AdminTab>(getTabFromLocation);
  const setAdminAccess = useAdminState((s) => s.setAdminAccess);
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

  const handleTabChange = (next: AdminTab) => {
    setTab(next);
    updateTabInUrl(next);
  };

  const aiOnline = geminiClient.isAvailable();

  return (
    <AdminGate>
      <div className="min-h-screen bg-slate-950 text-white flex">
        <aside className="w-64 bg-slate-950 border-r border-slate-800 px-4 py-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">الرحلة</p>
              <h2 className="text-lg font-bold">قمرة القيادة</h2>
            </div>
          </div>
          <nav className="space-y-2">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
                  tab === item.id
                    ? "bg-teal-500/20 text-teal-200 border border-teal-500/40"
                    : "text-slate-300 hover:bg-slate-900"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <button
              type="button"
              onClick={() => {
                setAdminAccess(false);
                setAdminCode(null);
                onExit?.();
              }}
              className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-slate-900"
            >
              <LogOut className="w-4 h-4" />
              تسجيل خروج
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0 p-6 space-y-6">
          <header className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-400">حالة النظام</p>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${aiOnline ? "bg-emerald-400" : "bg-rose-400"}`} />
                <p className="text-sm font-semibold">{aiOnline ? "الذكاء متصل" : "الذكاء غير متاح"}</p>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
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
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Sparkles className="w-4 h-4 text-teal-300" />
              <span>Admin Mode</span>
            </div>
          </header>

          {tab === "overview" && <OverviewPanel />}
          {tab === "feature-flags" && <FeatureFlagsPanel />}
          {tab === "ai-studio" && <AIStudioPanel />}
          {tab === "content" && <ContentPanel />}
          {tab === "users" && <UsersPanel />}
          {tab === "user-state" && <UserStatePanel />}
        </main>
      </div>
    </AdminGate>
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="إجمالي المسافرين" value={formatNumber(totalUsers)} hint={isSupabaseReady ? "من Supabase" : "جلسات محلية"} />
        <StatCard title="نشط الآن" value={formatNumber(activeNowValue)} hint={`آخر نشاط: ${formatTimeAgo(lastActive)}`} />
        <StatCard title="متوسط طاقة اليوم" value={formatNumber(avgMoodValue)} hint="من سجل النبض" />
        <StatCard title="استدعاءات AI" value={formatNumber(aiTokensUsed)} hint={isSupabaseReady ? "من سجل AI" : "مؤقتاً من المهام"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-2 mb-4">
            <LineChartIcon className="w-4 h-4 text-teal-300" />
            <h3 className="text-sm font-semibold">نمو التفاعل (آخر الأيام)</h3>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip />
                <Line type="monotone" dataKey="paths" stroke="#14b8a6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="nodes" stroke="#f97316" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-300" />
            <h3 className="text-sm font-semibold">مناطق الاحتكاك الأعلى</h3>
          </div>
          {topZones.length === 0 ? (
            <p className="text-xs text-slate-400">لا توجد بيانات كافية بعد.</p>
          ) : (
            <div className="space-y-2">
              {topZones.map(([zone, count]) => (
                <div key={zone} className="flex items-center justify-between text-xs text-slate-300">
                  <span>{zone}</span>
                  <span className="text-teal-200 font-semibold">{count}</span>
                </div>
              ))}
            </div>
          )}
          <div className="pt-3 border-t border-slate-800 text-xs text-slate-400">
            آخر نبضة: {formatTimeAgo(lastActive)}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
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

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
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
    </div>
  );
};

const FeatureFlagsPanel: FC = () => {
  const featureFlags = useAdminState((s) => s.featureFlags);
  const updateFeatureFlag = useAdminState((s) => s.updateFeatureFlag);
  const betaAccess = useAdminState((s) => s.betaAccess);
  const setBetaAccess = useAdminState((s) => s.setBetaAccess);
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
        <h3 className="text-sm font-semibold mb-2">مفاتيح الإطلاق</h3>
        <p className="text-xs text-slate-400">
          غيّر حالة كل ميزة فوراً. وضع Beta يفتحها لمجموعة تجريبية فقط.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {FEATURE_FLAGS.map((flag) => {
          const mode = featureFlags[flag.key];
          return (
            <div key={flag.key} className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
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
                          ? "border-teal-400 bg-teal-500/20 text-teal-200"
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
              الحالة الحالية: {isFeatureEnabled(mode, betaAccess) ? "مفعّلة لهذا الجهاز" : "مقفولة لهذا الجهاز"}
            </p>
          </div>
        );
      })}
      </div>
      {saving && (
        <p className="text-xs text-slate-400">جاري حفظ الإعدادات على Supabase...</p>
      )}

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
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
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
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

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
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

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
        <h3 className="text-sm font-semibold">Test Playground</h3>
        <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-3 h-52 overflow-auto space-y-2 text-xs">
          {playMessages.length === 0 && (
            <p className="text-slate-500">اكتب رسالة واختبر التغييرات فوراً.</p>
          )}
          {playMessages.map((msg, idx) => (
            <div key={idx} className={msg.role === "user" ? "text-right" : "text-left"}>
              <p className={`inline-block px-3 py-2 rounded-xl ${
                msg.role === "user" ? "bg-teal-500/20 text-teal-200" : "bg-slate-800 text-slate-200"
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

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
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
  const [missionDifficulty, setMissionDifficulty] = useState<"سهل" | "متوسط" | "صعب">("سهل");

  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");

  const handleAddMission = async () => {
    if (!missionTitle.trim()) return;
    const mission = {
      id: `mission_${Date.now()}`,
      title: missionTitle.trim(),
      track: missionTrack,
      difficulty: missionDifficulty,
      createdAt: Date.now()
    } as const;
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
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
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
            onChange={(e) => setMissionDifficulty(e.target.value as "سهل" | "متوسط" | "صعب")}
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

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
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

  const ROLE_OPTIONS = ["user", "admin", "editor", "moderator", "owner"];

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
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <h3 className="text-sm font-semibold">جدول المسافرين</h3>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث برقم الجلسة..."
          className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
        />
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
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
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
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

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
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

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
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
        className="w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-xl"
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
                  <p className="text-lg font-semibold text-teal-300">{nodes.length}</p>
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
  <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
    <p className="text-xs text-slate-400">{title}</p>
    <p className="text-2xl font-bold text-white mt-1">{value}</p>
    {hint && <p className="text-[11px] text-slate-500 mt-2">{hint}</p>}
  </div>
);
