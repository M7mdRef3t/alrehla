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
  deleteMission
} from "../../services/adminApi";
import type { JourneyMapSnapshot, UserStateRow } from "../../services/adminApi";
import { isSupabaseReady, supabase } from "../../services/supabaseClient";
import { loadStoredState } from "../../services/localStore";

type AdminTab = "overview" | "feature-flags" | "ai-studio" | "content" | "users" | "user-state";

const NAV_ITEMS: Array<{ id: AdminTab; label: string; icon: ReactNode }> = [
  { id: "overview", label: "Ù†Ø¨Ø¶ Ø§Ù„Ø±Ø­Ù„Ø©", icon: <Activity className="w-4 h-4" /> },
  { id: "feature-flags", label: "Ø§Ù„ØªØ­ÙƒÙ… ÙÙŠ Ø§Ù„Ø²Ù…Ù†", icon: <Flag className="w-4 h-4" /> },
  { id: "ai-studio", label: "Ù…Ø®ØªØ¨Ø± Ø§Ù„Ø°ÙƒØ§Ø¡", icon: <Brain className="w-4 h-4" /> },
  { id: "content", label: "Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø­ØªÙˆÙ‰", icon: <Database className="w-4 h-4" /> },
  { id: "users", label: "Ø´Ø¤ÙˆÙ† Ø§Ù„Ù…Ø³Ø§ÙØ±ÙŠÙ†", icon: <Users className="w-4 h-4" /> },
  { id: "user-state", label: "Ø³Ø­Ø§Ø¨Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª", icon: <Database className="w-4 h-4" /> }
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

const formatNumber = (value: number | null, fallback = "â€”") =>
  value == null || Number.isNaN(value) ? fallback : value.toLocaleString("ar-EG");

const formatTimeAgo = (ts: number | null) => {
  if (!ts) return "â€”";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ø§Ù„Ø¢Ù†";
  if (mins < 60) return `Ù…Ù†Ø° ${mins} Ø¯Ù‚ÙŠÙ‚Ø©`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Ù…Ù†Ø° ${hours} Ø³Ø§Ø¹Ø©`;
  const days = Math.floor(hours / 24);
  return `Ù…Ù†Ø° ${days} ÙŠÙˆÙ…`;
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
      setError("Ø§Ù„ÙƒÙˆØ¯ ØºÙŠØ± ØµØ­ÙŠØ­. Ø¬Ø±Ù‘Ø¨ ØªØ§Ù†ÙŠ.");
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
            <p className="text-sm text-slate-300">Ø¨ÙˆØ§Ø¨Ø© Ø§Ù„Ù‚Ù…Ø±Ø©</p>
            <h1 className="text-xl font-bold">Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…</h1>
          </div>
        </div>
        <p className="text-sm text-slate-400">
          Ø§Ù„Ø¯Ø®ÙˆÙ„ Ù…Ø­Ù„ÙŠ Ø¹Ù„Ù‰ Ù‡Ø°Ø§ Ø§Ù„Ø¬Ù‡Ø§Ø². Ø§Ø±Ø¨Ø·Ù‡Ø§ Ù„Ø§Ø­Ù‚Ø§Ù‹ Ø¨ØµÙ„Ø§Ø­ÙŠØ§Øª Ø­Ù‚ÙŠÙ‚ÙŠØ©.
        </p>
        <div className="space-y-2">
          <label className="text-xs text-slate-400">ÙƒÙˆØ¯ Ø§Ù„Ù…Ø¯ÙŠØ±</label>
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="â€¢â€¢â€¢â€¢â€¢â€¢"
            className="w-full rounded-xl bg-slate-950/60 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          {error && <p className="text-xs text-rose-300">{error}</p>}
        </div>
        <button
          type="button"
          onClick={handleLogin}
          className="w-full rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold py-2"
        >
          Ø¯Ø®ÙˆÙ„ Ø§Ù„Ù‚Ù…Ø±Ø©
        </button>
      </div>
    </div>
  );
};

export const AdminDashboard: FC<{ onExit?: () => void }> = ({ onExit }) => {
  const [tab, setTab] = useState<AdminTab>(getTabFromLocation);
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
        setRemoteMessage("ØªØ¹Ø°Ø± Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ø¨ÙŠØ§Ù†Ø§Øª Supabase. Ø¬Ø§Ø±ÙŠ Ø¹Ø±Ø¶ Ø§Ù„Ù†Ø³Ø®Ø© Ø§Ù„Ù…Ø­Ù„ÙŠØ©.");
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
              <p className="text-xs text-slate-400">Ø§Ù„Ø±Ø­Ù„Ø©</p>
              <h2 className="text-lg font-bold">Ù‚Ù…Ø±Ø© Ø§Ù„Ù‚ÙŠØ§Ø¯Ø©</h2>
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
              ØªØ³Ø¬ÙŠÙ„ Ø®Ø±ÙˆØ¬
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0 p-6 space-y-6">
          <header className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-400">Ø­Ø§Ù„Ø© Ø§Ù„Ù†Ø¸Ø§Ù…</p>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${aiOnline ? "bg-emerald-400" : "bg-rose-400"}`} />
                <p className="text-sm font-semibold">{aiOnline ? "Ø§Ù„Ø°ÙƒØ§Ø¡ Ù…ØªØµÙ„" : "Ø§Ù„Ø°ÙƒØ§Ø¡ ØºÙŠØ± Ù…ØªØ§Ø­"}</p>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {remoteStatus === "connected"
                  ? "Supabase Ù…ØªØµÙ„"
                  : remoteStatus === "error"
                    ? "Supabase ØºÙŠØ± Ù…ØªØ§Ø­"
                    : "ÙˆØ¶Ø¹ Ù…Ø­Ù„ÙŠ"}
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
      setDailyError("ØªØ¹Ø°Ø± ØªÙˆÙ„ÙŠØ¯ Ø§Ù„ØªÙ‚Ø±ÙŠØ± Ø§Ù„ÙŠÙˆÙ…ÙŠ.");
    }
    setDailyReport(data);
    setDailyLoading(false);
  };

  const handleWeeklyReport = async () => {
    setWeeklyLoading(true);
    setWeeklyError("");
    const data = await fetchWeeklyReport();
    if (!data) {
      setWeeklyError("ØªØ¹Ø°Ø± ØªÙˆÙ„ÙŠØ¯ Ø§Ù„ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ÙŠ.");
    }
    setWeeklyReport(data);
    setWeeklyLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù…Ø³Ø§ÙØ±ÙŠÙ†" value={formatNumber(totalUsers)} hint={isSupabaseReady ? "Ù…Ù† Supabase" : "Ø¬Ù„Ø³Ø§Øª Ù…Ø­Ù„ÙŠØ©"} />
        <StatCard title="Ù†Ø´Ø· Ø§Ù„Ø¢Ù†" value={formatNumber(activeNowValue)} hint={`Ø¢Ø®Ø± Ù†Ø´Ø§Ø·: ${formatTimeAgo(lastActive)}`} />
        <StatCard title="Ù…ØªÙˆØ³Ø· Ø·Ø§Ù‚Ø© Ø§Ù„ÙŠÙˆÙ…" value={formatNumber(avgMoodValue)} hint="Ù…Ù† Ø³Ø¬Ù„ Ø§Ù„Ù†Ø¨Ø¶" />
        <StatCard title="Ø§Ø³ØªØ¯Ø¹Ø§Ø¡Ø§Øª AI" value={formatNumber(aiTokensUsed)} hint={isSupabaseReady ? "Ù…Ù† Ø³Ø¬Ù„ AI" : "Ù…Ø¤Ù‚ØªØ§Ù‹ Ù…Ù† Ø§Ù„Ù…Ù‡Ø§Ù…"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-2 mb-4">
            <LineChartIcon className="w-4 h-4 text-teal-300" />
            <h3 className="text-sm font-semibold">Ù†Ù…Ùˆ Ø§Ù„ØªÙØ§Ø¹Ù„ (Ø¢Ø®Ø± Ø§Ù„Ø£ÙŠØ§Ù…)</h3>
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
            <h3 className="text-sm font-semibold">Ù…Ù†Ø§Ø·Ù‚ Ø§Ù„Ø§Ø­ØªÙƒØ§Ùƒ Ø§Ù„Ø£Ø¹Ù„Ù‰</h3>
          </div>
          {topZones.length === 0 ? (
            <p className="text-xs text-slate-400">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨ÙŠØ§Ù†Ø§Øª ÙƒØ§ÙÙŠØ© Ø¨Ø¹Ø¯.</p>
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
            Ø¢Ø®Ø± Ù†Ø¨Ø¶Ø©: {formatTimeAgo(lastActive)}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Ø§Ù„ØªÙ‚Ø±ÙŠØ± Ø§Ù„ÙŠÙˆÙ…ÙŠ</h3>
          <button
            type="button"
            onClick={handleDailyReport}
            className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-teal-400"
            disabled={dailyLoading}
          >
            {dailyLoading ? "Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªÙˆÙ„ÙŠØ¯..." : "ØªÙˆÙ„ÙŠØ¯ Ø§Ù„ØªÙ‚Ø±ÙŠØ±"}
          </button>
        </div>
        {dailyError && <p className="text-xs text-rose-300">{dailyError}</p>}
        {dailyReport && (
          <div className="space-y-2 text-xs text-slate-300">
            <p>ØªØ§Ø±ÙŠØ® Ø§Ù„ØªÙ‚Ø±ÙŠØ±: {dailyReport.date}</p>
            <p>Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø£Ø­Ø¯Ø§Ø«: {dailyReport.totalEvents}</p>
            <p>Ø¬Ù„Ø³Ø§Øª Ù†Ø´Ø·Ø©: {dailyReport.uniqueSessions}</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(dailyReport.typeCounts).map(([type, count]) => (
                <span key={type} className="rounded-full border border-slate-700 px-2 py-1">
                  {type}: {count}
                </span>
              ))}
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-400">Ø£ÙƒØ«Ø± Ø§Ù„Ø¬Ù„Ø³Ø§Øª Ù†Ø´Ø§Ø·Ø§Ù‹:</p>
              {dailyReport.topSessions.length === 0 ? (
                <p className="text-xs text-slate-500">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¬Ù„Ø³Ø§Øª Ø§Ù„ÙŠÙˆÙ….</p>
              ) : (
                dailyReport.topSessions.map((row) => (
                  <div key={row.sessionId} className="text-xs text-slate-300">
                    {row.sessionId.slice(0, 14)}â€¦ â€” {row.total} Ø­Ø¯Ø«
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Ø§Ù„ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ÙŠ</h3>
          <button
            type="button"
            onClick={handleWeeklyReport}
            className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-teal-400"
            disabled={weeklyLoading}
          >
            {weeklyLoading ? "Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªÙˆÙ„ÙŠØ¯..." : "ØªÙˆÙ„ÙŠØ¯ Ø§Ù„ØªÙ‚Ø±ÙŠØ±"}
          </button>
        </div>
        {weeklyError && <p className="text-xs text-rose-300">{weeklyError}</p>}
        {weeklyReport && (
          <div className="space-y-2 text-xs text-slate-300">
            <p>Ø§Ù„ÙØªØ±Ø©: {weeklyReport.from} â†’ {weeklyReport.to}</p>
            <p>Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø£Ø­Ø¯Ø§Ø«: {weeklyReport.totalEvents}</p>
            <p>Ø¬Ù„Ø³Ø§Øª ÙØ±ÙŠØ¯Ø©: {weeklyReport.uniqueSessions}</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(weeklyReport.typeCounts).map(([type, count]) => (
                <span key={type} className="rounded-full border border-slate-700 px-2 py-1">
                  {type}: {count}
                </span>
              ))}
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-400">Ø£ÙƒØ«Ø± Ø§Ù„Ø¬Ù„Ø³Ø§Øª Ù†Ø´Ø§Ø·Ø§Ù‹:</p>
              {weeklyReport.topSessions.length === 0 ? (
                <p className="text-xs text-slate-500">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¬Ù„Ø³Ø§Øª ÙƒØ§ÙÙŠØ©.</p>
              ) : (
                weeklyReport.topSessions.map((row) => (
                  <div key={row.sessionId} className="text-xs text-slate-300">
                    {row.sessionId.slice(0, 14)}â€¦ â€” {row.total} Ø­Ø¯Ø«
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
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
        <h3 className="text-sm font-semibold mb-2">Ù…ÙØ§ØªÙŠØ­ Ø§Ù„Ø¥Ø·Ù„Ø§Ù‚</h3>
        <p className="text-xs text-slate-400">
          ØºÙŠÙ‘Ø± Ø­Ø§Ù„Ø© ÙƒÙ„ Ù…ÙŠØ²Ø© ÙÙˆØ±Ø§Ù‹. ÙˆØ¶Ø¹ Beta ÙŠÙØªØ­Ù‡Ø§ Ù„Ù…Ø¬Ù…ÙˆØ¹Ø© ØªØ¬Ø±ÙŠØ¨ÙŠØ© ÙÙ‚Ø·.
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
              Ø§Ù„Ø­Ø§Ù„Ø© Ø§Ù„Ø­Ø§Ù„ÙŠØ©: {effectiveAccess[flag.key] ? "Ù…ÙØ¹Ù‘Ù„Ø© Ù„Ù‡Ø°Ø§ Ø§Ù„Ø¬Ù‡Ø§Ø²" : "Ù…Ù‚ÙÙˆÙ„Ø© Ù„Ù‡Ø°Ø§ Ø§Ù„Ø¬Ù‡Ø§Ø²"}
            </p>
          </div>
        );
      })}
      </div>
      {saving && (
        <p className="text-xs text-slate-400">Ø¬Ø§Ø±ÙŠ Ø­ÙØ¸ Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø¹Ù„Ù‰ Supabase...</p>
      )}

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
        <h4 className="text-sm font-semibold mb-2">ØµÙ„Ø§Ø­ÙŠØ© Beta Ù„Ù‡Ø°Ø§ Ø§Ù„Ø¬Ù‡Ø§Ø²</h4>
        <p className="text-xs text-slate-400 mb-3">ÙØ¹Ù‘Ù„Ù‡Ø§ Ù„ØªØ¬Ø±Ø¨Ø© Ø§Ù„Ù…ÙŠØ²Ø§Øª ÙÙŠ ÙˆØ¶Ø¹ Beta.</p>
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
          {betaAccess ? "Beta Ù…ÙØ¹Ù‘Ù„" : "Beta Ù…ØºÙ„Ù‚"}
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
    const prompt = `${promptDraft.trim()}\n\nØ§Ù„Ù…Ø³ØªØ®Ø¯Ù…: ${userText}\nØ§Ù„Ù…Ø³Ø§Ø¹Ø¯:`;
    const response = await geminiClient.generate(prompt);
    const finalText = response ?? "ØªØ¹Ø°Ø± Ø§Ù„ÙˆØµÙˆÙ„ Ù„Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ Ø­Ø§Ù„ÙŠØ§Ù‹.";
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
            Ø­ÙØ¸ Ø§Ù„ØªØ¹Ø¯ÙŠÙ„Ø§Øª
          </button>
          <button
            type="button"
            onClick={() => setPromptDraft(systemPrompt)}
            className="rounded-full border border-slate-700 px-4 py-2 text-xs text-slate-300"
          >
            Ø±Ø¬ÙˆØ¹
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
        <h3 className="text-sm font-semibold">Ù…Ø¹Ø§Ø¯Ù„Ø© Ø§Ù„Ø­Ø³Ø§Ø¨</h3>
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
            <label className="text-xs text-slate-400">Ø­Ø¯Ù‘ Low (â‰¤)</label>
            <input
              type="number"
              value={thresholdDraft.lowMax}
              onChange={(e) => setThresholdDraft((prev) => ({ ...prev, lowMax: Number(e.target.value) }))}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Ø­Ø¯Ù‘ Medium (â‰¤)</label>
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
          Ø­ÙØ¸ Ø§Ù„Ù…Ø¹Ø§Ø¯Ù„Ø©
        </button>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
        <h3 className="text-sm font-semibold">Test Playground</h3>
        <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-3 h-52 overflow-auto space-y-2 text-xs">
          {playMessages.length === 0 && (
            <p className="text-slate-500">Ø§ÙƒØªØ¨ Ø±Ø³Ø§Ù„Ø© ÙˆØ§Ø®ØªØ¨Ø± Ø§Ù„ØªØºÙŠÙŠØ±Ø§Øª ÙÙˆØ±Ø§Ù‹.</p>
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
            placeholder="Ø¬Ø±Ù‘Ø¨ Ø±Ø³Ø§Ù„Ø©..."
            className="flex-1 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
          />
          <button
            type="button"
            onClick={runPlayground}
            className="rounded-xl bg-teal-500 px-4 text-xs font-semibold text-slate-950 flex items-center gap-2"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            ØªØ´ØºÙŠÙ„
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Ø¢Ø®Ø± Ø±Ø¯ÙˆØ¯ Ø§Ù„Ø°ÙƒØ§Ø¡</h3>
          <button
            type="button"
            onClick={clearAiLogs}
            className="text-xs text-slate-400 hover:text-rose-300"
          >
            Ù…Ø³Ø­ Ø§Ù„Ø³Ø¬Ù„
          </button>
        </div>
        {aiLogs.length === 0 ? (
          <p className="text-xs text-slate-500">Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ø³Ø¬Ù„ Ø¨Ø¹Ø¯.</p>
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
                    title="Ù…Ù…ØªØ§Ø²"
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
                    title="Ø³ÙŠØ¡"
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
  const [missionTrack, setMissionTrack] = useState("Ù…Ø³Ø§Ø± Ø§Ù„Ø¬Ø°ÙˆØ±");
  const [missionDifficulty, setMissionDifficulty] = useState<Parameters<typeof addMission>[0]["difficulty"]>("Ø³Ù‡Ù„" as Parameters<typeof addMission>[0]["difficulty"]);

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
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <h3 className="text-sm font-semibold">Ù…ÙƒØªØ¨Ø© Ø§Ù„Ù…Ù‡Ù…Ø§Øª</h3>
        <div className="grid md:grid-cols-3 gap-2">
          <input
            value={missionTitle}
            onChange={(e) => setMissionTitle(e.target.value)}
            placeholder="Ø§Ø³Ù… Ø§Ù„Ù…Ù‡Ù…Ø©"
            className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
          />
          <select
            value={missionTrack}
            onChange={(e) => setMissionTrack(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
          >
            <option>Ù…Ø³Ø§Ø± Ø§Ù„Ø¬Ø°ÙˆØ±</option>
            <option>Ù…Ø³Ø§Ø± Ø§Ù„Ø¯Ø±Ø¹</option>
            <option>Ù…Ø³Ø§Ø± ÙÙ† Ø§Ù„Ù…Ø³Ø§ÙØ©</option>
            <option>Ù…Ø³Ø§Ø± Ø§Ù„ØµÙŠØ§Ù… Ø§Ù„Ø´Ø¹ÙˆØ±ÙŠ</option>
            <option>Ù…Ø³Ø§Ø± Ø§Ù„Ø·ÙˆØ§Ø±Ø¦</option>
          </select>
          <select
            value={missionDifficulty}
            onChange={(e) => setMissionDifficulty(e.target.value as Parameters<typeof addMission>[0]["difficulty"])}
            className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
          >
            <option value="Ø³Ù‡Ù„">Ø³Ù‡Ù„</option>
            <option value="Ù…ØªÙˆØ³Ø·">Ù…ØªÙˆØ³Ø·</option>
            <option value="ØµØ¹Ø¨">ØµØ¹Ø¨</option>
          </select>
        </div>
        <button
          type="button"
          onClick={handleAddMission}
          className="rounded-full bg-teal-500 text-slate-950 px-4 py-2 text-xs font-semibold"
        >
          Ø¥Ø¶Ø§ÙØ© Ù…Ù‡Ù…Ø©
        </button>
        <div className="space-y-2">
          {missions.length === 0 && <p className="text-xs text-slate-500">Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ù‡Ø§Ù… Ù…Ø¶Ø§ÙØ© Ø¨Ø¹Ø¯.</p>}
          {missions.map((m) => (
            <div key={m.id} className="flex items-center justify-between text-xs bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2">
              <div>
                <p className="font-semibold text-slate-200">{m.title}</p>
                <p className="text-slate-500">{m.track} â€¢ {m.difficulty}</p>
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
                Ø­Ø°Ù
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <h3 className="text-sm font-semibold">Ø±Ø³Ø§Ø¦Ù„ Ø§Ù„Ø·ÙˆØ§Ø±Ø¦ Ø§Ù„Ø¹Ø§Ù…Ø©</h3>
        <input
          value={broadcastTitle}
          onChange={(e) => setBroadcastTitle(e.target.value)}
          placeholder="Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ø±Ø³Ø§Ù„Ø©"
          className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
        />
        <textarea
          value={broadcastBody}
          onChange={(e) => setBroadcastBody(e.target.value)}
          placeholder="Ù†Øµ Ø§Ù„Ø±Ø³Ø§Ù„Ø©"
          rows={3}
          className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
        />
        <button
          type="button"
          onClick={handleAddBroadcast}
          className="rounded-full bg-amber-400 text-slate-950 px-4 py-2 text-xs font-semibold"
        >
          Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø±Ø³Ø§Ù„Ø©
        </button>
        <div className="space-y-2">
          {broadcasts.length === 0 && <p className="text-xs text-slate-500">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø±Ø³Ø§Ø¦Ù„ Ø¨Ø¹Ø¯.</p>}
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
                Ø­Ø°Ù
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
          setGodViewError("Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨ÙŠØ§Ù†Ø§Øª Ø®Ø±ÙŠØ·Ø© Ù„Ù‡Ø°Ù‡ Ø§Ù„Ø¬Ù„Ø³Ø© Ø¨Ø¹Ø¯.");
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
            setGodViewError("Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨ÙŠØ§Ù†Ø§Øª Ù…Ø­Ù„ÙŠØ© Ù…ØªØ§Ø­Ø© Ø­Ø§Ù„ÙŠØ§Ù‹.");
          }
        } else {
          setGodViewError("Ø±Ø¨Ø· Supabase ØºÙŠØ± Ù…ØªØ§Ø­ Ù„Ù‡Ø°Ù‡ Ø§Ù„Ø¬Ù„Ø³Ø©.");
        }
      }
    } catch (error) {
      setGodViewError("Ø­ØµÙ„ Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ ØªØ­Ù…ÙŠÙ„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø®Ø±ÙŠØ·Ø©.");
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
        <h3 className="text-sm font-semibold">Ø¬Ø¯ÙˆÙ„ Ø§Ù„Ù…Ø³Ø§ÙØ±ÙŠÙ†</h3>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ø§Ø¨Ø­Ø« Ø¨Ø±Ù‚Ù… Ø§Ù„Ø¬Ù„Ø³Ø©..."
          className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
        />
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
        {loading && <p className="text-xs text-slate-500">Ø¬Ø§Ø±ÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†...</p>}
        {!loading && remoteUsers && (
          <div className="space-y-2">
            {filteredUsers.length === 0 ? (
              <p className="text-xs text-slate-500">Ù„Ø§ ØªÙˆØ¬Ø¯ Ù†ØªØ§Ø¦Ø¬ Ù…Ø·Ø§Ø¨Ù‚Ø©.</p>
            ) : (
              filteredUsers.map((user) => (
                <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 text-xs border border-slate-800 rounded-xl px-3 py-2">
                  <div>
                    <p className="font-semibold text-slate-200">{user.fullName}</p>
                    <p className="text-slate-500">{user.email}</p>
                  </div>
                  <div className="text-slate-400">
                    Ø§Ù„Ø¯ÙˆØ±: {user.role} â€¢ Ø§Ù†Ø¶Ù… {user.createdAt ? new Date(user.createdAt).toLocaleDateString("ar-EG") : "â€”"}
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
                      <span className="text-xs text-slate-500">Ø¬Ø§Ø±Ù Ø§Ù„Ø­ÙØ¸...</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-teal-400"
                    onClick={() => openGodView(user.id)}
                  >
                    Ù†Ø¸Ø±Ø© Ø§Ù„Ø¥Ù„Ù‡
                  </button>
                </div>
              ))
            )}
          </div>
        )}
        {!loading && !remoteUsers && (
          <>
            {filteredSessions.length === 0 ? (
              <p className="text-xs text-slate-500">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¬Ù„Ø³Ø§Øª Ù…Ø¹Ø±Ù‘ÙØ©. ÙØ¹Ù‘Ù„ ÙˆØ¶Ø¹ Ø§Ù„ØªØªØ¨Ø¹ Ø¨Ø§Ù„Ù‡ÙˆÙŠØ©.</p>
            ) : (
              <div className="space-y-2">
                {filteredSessions.map((session) => (
                  <div key={session.sessionId} className="flex flex-wrap items-center justify-between gap-3 text-xs border border-slate-800 rounded-xl px-3 py-2">
                    <div>
                      <p className="font-semibold text-slate-200">{session.sessionId}</p>
                      <p className="text-slate-500">Ø¢Ø®Ø± Ù†Ø´Ø§Ø·: {session.lastActivity}</p>
                    </div>
                    <div className="text-slate-400">
                      Ù…Ø³Ø§Ø±Ø§Øª: {session.pathStarts} â€¢ Ù…Ù‡Ø§Ù…: {session.taskCompletions}
                    </div>
                    <button
                      type="button"
                      className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-teal-400"
                      onClick={() => openGodView(session.sessionId)}
                    >
                      Ù†Ø¸Ø±Ø© Ø§Ù„Ø¥Ù„Ù‡
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
      setDetailError("Ù„Ø§ ØªÙˆØ¬Ø¯ ØªÙØ§ØµÙŠÙ„ Ù…ØªØ§Ø­Ø©.");
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
          setImportError("Ø§Ù„Ù…Ù„Ù Ù„Ø§ ÙŠØ­ØªÙˆÙŠ Ø¹Ù„Ù‰ Ø¨ÙŠØ§Ù†Ø§Øª ØµØ§Ù„Ø­Ø©.");
          return;
        }
        setImporting(true);
        const ok = await importUserStates(rowsPayload);
        if (!ok) {
          setImportError("ÙØ´Ù„ Ø§Ø³ØªÙŠØ±Ø§Ø¯ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª.");
        } else {
          setImportError("");
          const refreshed = await fetchUserStates();
          setRows(refreshed);
        }
      } catch {
        setImportError("ÙØ´Ù„ Ù‚Ø±Ø§Ø¡Ø© Ù…Ù„Ù Ø§Ù„Ø§Ø³ØªÙŠØ±Ø§Ø¯.");
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
        <h3 className="text-sm font-semibold">Ù„Ù‚Ø·Ø§Øª Ø§Ù„Ø³Ø­Ø§Ø¨Ø©</h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-teal-400 disabled:opacity-50"
          >
            {exporting ? "Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØµØ¯ÙŠØ±..." : "ØªØµØ¯ÙŠØ± JSON"}
          </button>
          <button
            type="button"
            onClick={handleFullExport}
            disabled={fullExporting}
            className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-indigo-400 disabled:opacity-50"
          >
            {fullExporting ? "Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØµØ¯ÙŠØ±..." : "ØªØµØ¯ÙŠØ± Ø´Ø§Ù…Ù„"}
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-amber-400 disabled:opacity-50"
          >
            {importing ? "Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø§Ø³ØªÙŠØ±Ø§Ø¯..." : "Ø§Ø³ØªÙŠØ±Ø§Ø¯ Ù…Ù„Ù"}
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
          placeholder="Ø§Ø¨Ø­Ø« Ø¨Ù€ device token Ø£Ùˆ user id"
          className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
        />
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        {loading && <p className="text-xs text-slate-500">Ø¬Ø§Ø±ÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª...</p>}
        {!loading && rows && (
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <p className="text-xs text-slate-500">Ù„Ø§ ØªÙˆØ¬Ø¯ Ù†ØªØ§Ø¦Ø¬.</p>
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
                    <p className="text-slate-500">user: {row.ownerId ?? "â€”"}</p>
                  </div>
                  <div className="text-slate-400">
                    Ø¢Ø®Ø± ØªØ­Ø¯ÙŠØ«: {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString("ar-EG") : "â€”"}
                  </div>
                  <button
                    type="button"
                    onClick={() => loadDetail(row)}
                    className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-teal-400"
                  >
                    Ø¹Ø±Ø¶ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <h4 className="text-sm font-semibold">ØªÙØ§ØµÙŠÙ„ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…</h4>
        {detailLoading && <p className="text-xs text-slate-500">Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ù…ÙŠÙ„...</p>}
        {detailError && <p className="text-xs text-rose-300">{detailError}</p>}
        {!detailLoading && detail && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400">Device: {detail.deviceToken}</p>
            <p className="text-xs text-slate-400">User: {detail.ownerId ?? "â€”"}</p>
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
    : "â€”";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Ù†Ø¸Ø±Ø© Ø§Ù„Ø¥Ù„Ù‡</h3>
            <p className="text-xs text-slate-400">{sessionId ?? "â€”"}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-slate-800">
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Ø¬Ø§Ø±ÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø®Ø±ÙŠØ·Ø©...
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
                  <p className="text-xs text-slate-400">Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø¹Ù„Ø§Ù‚Ø§Øª</p>
                  <p className="text-lg font-semibold text-teal-300">{nodes.length}</p>
                </div>
                <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-3">
                  <p className="text-xs text-slate-400">Ø£Ø­Ù…Ø±</p>
                  <p className="text-lg font-semibold text-rose-300">{ringCounts.red}</p>
                </div>
                <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-3">
                  <p className="text-xs text-slate-400">Ø£ØµÙØ±</p>
                  <p className="text-lg font-semibold text-amber-300">{ringCounts.yellow}</p>
                </div>
                <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-3">
                  <p className="text-xs text-slate-400">Ø£Ø®Ø¶Ø±/Ø±Ù…Ø§Ø¯ÙŠ</p>
                  <p className="text-lg font-semibold text-emerald-300">{ringCounts.green + ringCounts.grey}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-400">
                Ø¢Ø®Ø± ØªØ­Ø¯ÙŠØ«: {updatedAtLabel}
              </div>

              {nodes.length === 0 ? (
                <p className="text-sm text-slate-400">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¹Ù‚Ø¯ Ù…Ø­ÙÙˆØ¸Ø© Ø¨Ø¹Ø¯.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {nodes.slice(0, 12).map((node) => (
                    <div key={node.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                      <p className="text-sm font-semibold text-slate-100">{node.label}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Ø§Ù„Ù…Ù†Ø·Ù‚Ø©: {node.isDetached || node.detachmentMode ? "Ø±Ù…Ø§Ø¯ÙŠ" : node.ring === "red" ? "Ø£Ø­Ù…Ø±" : node.ring === "yellow" ? "Ø£ØµÙØ±" : "Ø£Ø®Ø¶Ø±"}
                      </p>
                      {node.analysis?.score != null && (
                        <p className="text-xs text-slate-500 mt-1">ØªÙ‚ÙŠÙŠÙ…: {node.analysis.score}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {nodes.length > 12 && (
                <p className="text-xs text-slate-500">Ø¹Ø±Ø¶ Ø£ÙˆÙ„ 12 Ø¹Ù„Ø§Ù‚Ø© ÙÙ‚Ø·.</p>
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
