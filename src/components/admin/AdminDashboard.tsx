import type { FC, ReactNode } from "react";
import { useEffect, useState, lazy, Suspense } from "react";
import {
  Activity,
  Compass,
  Flag,
  Brain,
  Database,
  Users,
  History,
  LogOut,
  User,
  Sparkles,
  ShieldCheck,
  MessageSquare,
  Workflow,
  Pencil,
  Terminal,
  Target,
  Flame,
  Rocket
} from "lucide-react";
import { runtimeEnv } from "../../config/runtimeEnv";
import { AwarenessSkeleton } from "../AwarenessSkeleton";
import { useAdminState } from "../../state/adminState";
import { getEffectiveRoleFromState, useAuthState } from "../../state/authState";
import { isPrivilegedRole } from "../../utils/featureFlags";
import {
  fetchAdminConfig,
  fetchAiLogs,
  fetchMissions,
  fetchBroadcasts,
} from "../../services/adminApi";
import { LiveFreezePill } from "./LiveFreezePill";
import { isSupabaseReady, supabase } from "../../services/supabaseClient";
import {
  createCurrentUrl,
  getSearch,
  pushUrl,
  subscribePopstate
} from "../../services/navigation";

// Extracted Panels (Lazy Loaded for performance and dependency stability)
const OverviewPanel = lazy(() => import("./dashboard/Overview/OverviewPanel").then(m => ({ default: m.OverviewPanel })));
const FlowMapPanel = lazy(() => import("./dashboard/Flow/FlowMapPanel").then(m => ({ default: m.FlowMapPanel })));
const FeedbackPanel = lazy(() => import("./dashboard/Support/FeedbackPanel").then(m => ({ default: m.FeedbackPanel })));
const FeatureFlagsPanel = lazy(() => import("./dashboard/Features/FeatureFlagsPanel").then(m => ({ default: m.FeatureFlagsPanel })));
const ConsciousnessMap = lazy(() => import("./dashboard/Consciousness/ConsciousnessMap").then(m => ({ default: m.ConsciousnessMap })));
const AIStudioPanel = lazy(() => import("./dashboard/Intelligence/AIStudioPanel").then(m => ({ default: m.AIStudioPanel })));
const ContentPanel = lazy(() => import("./dashboard/Content/ContentPanel").then(m => ({ default: m.ContentPanel })));
const UsersPanel = lazy(() => import("./dashboard/Users/UsersPanel").then(m => ({ default: m.UsersPanel })));
const UserStatePanel = lazy(() => import("./dashboard/Data/UserStatePanel").then(m => ({ default: m.UserStatePanel })));
const ConsciousnessArchivePanel = lazy(() => import("./dashboard/Consciousness/ConsciousnessArchivePanel").then(m => ({ default: m.ConsciousnessArchivePanel })));
const B2BAnalytics = lazy(() => import("./dashboard/B2BAnalytics").then(m => ({ default: m.B2BAnalytics })));
const EntityDashboard = lazy(() => import("./dashboard/Entity/EntityDashboard").then(m => ({ default: m.EntityDashboard })));
const AIDecisionLogPanel = lazy(() => import("./AIDecisionLog").then(m => ({ default: m.AIDecisionLog })));
const HealthMonitorPanel = lazy(() => import("./HealthMonitorPanel").then(m => ({ default: m.HealthMonitorPanel })));
const AISimulatorPanel = lazy(() => import("./dashboard/Intelligence/AISimulatorPanel").then(m => ({ default: m.AISimulatorPanel })));
const CreativeDashboard = lazy(() => import("./dashboard/Intelligence/CreativeDashboard").then(m => ({ default: m.CreativeDashboard })));
const DreamsMatrixPanel = lazy(() => import("./dashboard/Intelligence/DreamsMatrixPanel").then(m => ({ default: m.DreamsMatrixPanel })));
const TheCrucible = lazy(() => import("./dashboard/Intelligence/TheCrucible").then(m => ({ default: m.TheCrucible })));
const ConsciousnessGraph = lazy(() => import("./dashboard/Intelligence/ConsciousnessGraph").then(m => ({ default: m.ConsciousnessGraph })));
const RepoIntelPanel = lazy(() => import("./dashboard/Intelligence/RepoIntelPanel"));
const FleetCommander = lazy(() => import("./dashboard/Fleet/FleetCommander").then(m => ({ default: m.FleetCommander })));
const SeoGeoAuditorPanel = lazy(() => import("./dashboard/SEO/SeoGeoAuditorPanel").then(m => ({ default: m.SeoGeoAuditorPanel })));

type AdminTab = "entity" | "overview" | "flow-map" | "feedback" | "feature-flags" | "ai-studio" | "ai-decisions" | "health-monitor" | "content" | "users" | "user-state" | "consciousness" | "consciousness-map" | "b2b-analytics" | "ai-simulator" | "ai-marketing" | "dreams-matrix" | "crucible" | "digital-twin" | "fleet" | "seo-geo" | "repo-intel";

const DataManagementModal = lazy(() =>
  import("../DataManagement").then((m) => ({ default: m.DataManagement }))
);

const NAV_ITEMS: Array<{ id: AdminTab; label: string; icon: ReactNode }> = [
  { id: "entity", label: "الكيان (DNA)", icon: <Brain className="w-4 h-4 text-teal-400" /> },
  { id: "overview", label: "نبض الرحلة", icon: <Activity className="w-4 h-4" /> },
  { id: "flow-map", label: "خريطة التدفق", icon: <Compass className="w-4 h-4" /> },
  { id: "feedback", label: "التغذية الراجعة", icon: <MessageSquare className="w-4 h-4" /> },
  { id: "feature-flags", label: "التحكم في الزمن", icon: <Flag className="w-4 h-4" /> },
  { id: "ai-studio", label: "مختبر الذكاء", icon: <Brain className="w-4 h-4" /> },
  { id: "ai-decisions", label: "قرارات الذكاء", icon: <Sparkles className="w-4 h-4 text-purple-400" /> },
  { id: "health-monitor", label: "صحة النظام", icon: <Activity className="w-4 h-4 text-cyan-400" /> },
  { id: "content", label: "إدارة المحتوى", icon: <Database className="w-4 h-4" /> },
  { id: "users", label: "شؤون المسافرين", icon: <Users className="w-4 h-4" /> },
  { id: "user-state", label: "سحابة البيانات", icon: <Database className="w-4 h-4" /> },
  { id: "consciousness", label: "أرشيف الوعي", icon: <History className="w-4 h-4" /> },
  { id: "consciousness-map", label: "خريطة الوعي", icon: <Workflow className="w-4 h-4" /> },
  { id: "b2b-analytics", label: "ذكاء المؤسسات", icon: <ShieldCheck className="w-4 h-4" /> },
  { id: "ai-simulator", label: "محاكي الأزمات", icon: <Terminal className="w-4 h-4 text-rose-400" /> },
  { id: "ai-marketing", label: "فنان الوعي", icon: <Sparkles className="w-4 h-4 text-amber-400" /> },
  { id: "seo-geo", label: "SEO / GEO", icon: <Target className="w-4 h-4 text-emerald-400" /> },
  { id: "crucible", label: "المِحك (Testing)", icon: <Flame className="w-4 h-4 text-rose-500" /> },
  { id: "dreams-matrix", label: "مصفوفة الأحلام", icon: <Target className="w-4 h-4 text-teal-400" /> },
  { id: "digital-twin", label: "التوأم الرقمي", icon: <User className="w-4 h-4 text-indigo-400" /> },
  { id: "fleet", label: "الأسطول (Fleet)", icon: <Rocket className="w-4 h-4 text-indigo-500" /> },
  { id: "repo-intel", label: "Repo Intel", icon: <Terminal className="w-4 h-4 text-teal-300" /> }
];

const DEVELOPER_PLUS_TABS: AdminTab[] = ["feature-flags", "ai-studio", "user-state"];

const getTabFromLocation = (): AdminTab => {
  const params = new URLSearchParams(getSearch());
  const tab = params.get("tab") as AdminTab | null;
  return NAV_ITEMS.some((item) => item.id === tab) ? tab! : "entity";
};

const updateTabInUrl = (tab: AdminTab) => {
  const url = createCurrentUrl();
  if (!url) return;
  url.searchParams.set("tab", tab);
  pushUrl(url);
};

const AdminGate: FC<{ children: ReactNode }> = ({ children }) => {
  const adminAccess = useAdminState((s) => s.adminAccess);
  const setAdminAccess = useAdminState((s) => s.setAdminAccess);
  const setAdminCode = useAdminState((s) => s.setAdminCode);
  const authUser = useAuthState((s) => s.user);
  const roleOverride = useAuthState((s) => s.roleOverride);
  const authRole = useAuthState(getEffectiveRoleFromState);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const allowedRoles = (runtimeEnv.adminAllowedRoles || "admin,owner,superadmin,developer")
      .split(",")
      .map((r: string) => r.trim().toLowerCase())
      .filter(Boolean);

    const normalizedRole = typeof authRole === "string" ? authRole.trim().toLowerCase() : "";
    const isAllowedByRole = Boolean(normalizedRole && allowedRoles.includes(normalizedRole));

    if (isAllowedByRole) {
      if (!adminAccess) setAdminAccess(true);
      return;
    }

    if (roleOverride) {
      if (adminAccess) {
        setAdminAccess(false);
        setAdminCode(null);
      }
      return;
    }

    if (adminAccess || !authUser || !supabase) return;

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

    return () => { mounted = false; };
  }, [adminAccess, authRole, authUser, roleOverride, setAdminAccess, setAdminCode]);

  const handleLogin = () => {
    const expected = runtimeEnv.adminCode;
    if (!expected) {
      setError("الدخول بالكود غير متاح في هذه البيئة. استخدم حساب بصلاحية مناسبة.");
      return;
    }
    if (code.trim() === expected) {
      setAdminAccess(true);
      setAdminCode(code.trim());
      setError("");
    } else {
      setError("الكود غير صحيح.");
    }
  };

  if (adminAccess) return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-teal-400" />
          <h1 className="text-xl font-bold">بوابة القمرة</h1>
        </div>
        <div className="space-y-2">
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="كود المدير"
            className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-200"
          />
          {error && <p className="text-xs text-rose-400">{error}</p>}
        </div>
        <button onClick={handleLogin} className="w-full rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold py-2 transition-colors">دخول</button>
      </div>
    </div>
  );
};

export const AdminDashboard: FC<{ onExit?: () => void }> = ({ onExit }) => {
  const [tab, setTab] = useState<AdminTab>(getTabFromLocation);
  const [showAccount, setShowAccount] = useState(false);
  const authUser = useAuthState((s) => s.user);
  const adminAccess = useAdminState((s) => s.adminAccess);
  const setAdminAccess = useAdminState((s) => s.setAdminAccess);
  const setAdminCode = useAdminState((s) => s.setAdminCode);
  const isContentEditingEnabled = useAdminState((s) => s.isContentEditingEnabled);
  const toggleContentEditing = useAdminState((s) => s.toggleContentEditing);
  const setFeatureFlags = useAdminState((s) => s.setFeatureFlags);
  const setSystemPrompt = useAdminState((s) => s.setSystemPrompt);
  const setScoringWeights = useAdminState((s) => s.setScoringWeights);
  const setScoringThresholds = useAdminState((s) => s.setScoringThresholds);
  const setAiLogs = useAdminState((s) => s.setAiLogs);
  const setMissions = useAdminState((s) => s.setMissions);
  const setBroadcasts = useAdminState((s) => s.setBroadcasts);

  useEffect(() => {
    const handler = () => setTab(getTabFromLocation());
    return subscribePopstate(handler);
  }, []);

  useEffect(() => {
    if (!isSupabaseReady) return;
    const loadRemote = async () => {
      try {
        const [config, aiLogs, missions, broadcasts] = await Promise.all([
          fetchAdminConfig(),
          fetchAiLogs(),
          fetchMissions(),
          fetchBroadcasts()
        ]);
        if (config?.featureFlags) setFeatureFlags(config.featureFlags);
        if (config?.systemPrompt) setSystemPrompt(config.systemPrompt);
        if (config?.scoringWeights) setScoringWeights(config.scoringWeights);
        if (config?.scoringThresholds) setScoringThresholds(config.scoringThresholds);
        if (aiLogs) setAiLogs(aiLogs);
        if (missions) setMissions(missions);
        if (broadcasts) setBroadcasts(broadcasts);
      } catch (err) {
        console.error("Admin data load error", err);
      }
    };
    void loadRemote();
  }, [setFeatureFlags, setSystemPrompt, setScoringWeights, setScoringThresholds, setAiLogs, setMissions, setBroadcasts]);

  const authRole = useAuthState(getEffectiveRoleFromState);
  const baseRole = useAuthState((s) => s.role);
  const canSeeAdvancedTabs = isPrivilegedRole(baseRole) || adminAccess;

  const visibleNavItems = canSeeAdvancedTabs
    ? NAV_ITEMS
    : NAV_ITEMS.filter((item) => !DEVELOPER_PLUS_TABS.includes(item.id));

  const effectiveTab: AdminTab =
    !canSeeAdvancedTabs && DEVELOPER_PLUS_TABS.includes(tab) ? "entity" : tab;

  const handleTabChange = (next: AdminTab) => {
    setTab(next);
    updateTabInUrl(next);
  };

  const activeTabItem = NAV_ITEMS.find((item) => item.id === effectiveTab);

  return (
    <AdminGate>
      <div className="admin-cockpit min-h-screen bg-[#05060f] text-slate-200 flex relative isolate selection:bg-teal-500/30 font-sans">
        <aside className="admin-sidebar sticky top-0 h-screen w-72 flex-shrink-0 border-r border-white/5 bg-slate-950/40 backdrop-blur-3xl flex flex-col z-20 overflow-hidden select-none">
          <div className="p-8 border-b border-white/5 relative group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(45,212,191,0.3)] group-hover:shadow-[0_0_30px_rgba(45,212,191,0.5)] transition-all">
                <Workflow className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-black tracking-tighter text-white leading-none mb-1">COMMAND</h1>
                <p className="text-[10px] font-black text-teal-400/80 uppercase tracking-widest leading-none">Center Alpha</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 py-8 space-y-2 custom-scrollbar">
            {visibleNavItems.map((item) => {
              const isActive = effectiveTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group ${isActive
                    ? "bg-white/10 text-white shadow-[inset_0_0_1px_rgba(255,255,255,0.2)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl transition-colors ${isActive ? "text-teal-400 bg-teal-400/10" : "text-slate-500 group-hover:text-slate-300"}`}>
                      {item.icon}
                    </div>
                    <span className={`text-[11px] font-bold uppercase tracking-wider transition-all ${isActive ? "translate-x-1" : "group-hover:translate-x-0.5"}`}>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>

          <footer className="p-4 border-t border-white/5 space-y-3 bg-slate-950/20">
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-white truncate uppercase tracking-tight">{authUser?.email?.split('@')[0] || "OPERATOR"}</p>
                <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">{authRole}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setAdminAccess(false);
                setAdminCode(null);
                onExit?.();
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-[10px] font-bold text-slate-500 hover:text-rose-400 transition-colors uppercase tracking-widest group"
            >
              <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              <span>Detach Interface</span>
            </button>
          </footer>
        </aside>

        <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
          <header className="h-24 border-b border-white/5 bg-slate-950/20 backdrop-blur-3xl flex items-center justify-between px-10 flex-shrink-0 z-10">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                  <span>SYSTEM</span>
                  <span className="w-1 h-1 rounded-full bg-slate-700" />
                  <span>{activeTabItem?.id || "ROOT"}</span>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase">
                  {activeTabItem?.label}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <LiveFreezePill />
              <button
                onClick={() => toggleContentEditing(!isContentEditingEnabled)}
                className={`p-3 rounded-2xl border transition-all active:scale-95 group shadow-lg ${isContentEditingEnabled
                  ? "bg-teal-500/20 border-teal-500/50 text-teal-300"
                  : "bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/10"
                  }`}
              >
                <Pencil className="w-5 h-5 group-hover:-rotate-12 transition-transform" />
              </button>
              <button
                onClick={() => setShowAccount(true)}
                className="p-3 rounded-2xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all active:scale-95 group shadow-lg"
              >
                <Database className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar relative bg-[#05060f]/20">
            <div className="max-w-7xl mx-auto pb-20">
              <Suspense fallback={<div>Loading...</div>}>
                {effectiveTab === "entity" && <EntityDashboard />}
                {effectiveTab === "overview" && <OverviewPanel />}
                {effectiveTab === "flow-map" && <FlowMapPanel />}
                {effectiveTab === "feedback" && <FeedbackPanel />}
                {effectiveTab === "feature-flags" && <FeatureFlagsPanel />}
                {effectiveTab === "ai-studio" && <AIStudioPanel />}
                {effectiveTab === "ai-decisions" && <AIDecisionLogPanel maxDecisions={100} />}
                {effectiveTab === "health-monitor" && <HealthMonitorPanel />}
                {effectiveTab === "content" && <ContentPanel />}
                {effectiveTab === "users" && <UsersPanel />}
                {effectiveTab === "user-state" && <UserStatePanel />}
                {effectiveTab === "consciousness" && <ConsciousnessArchivePanel />}
                {effectiveTab === "consciousness-map" && <ConsciousnessMap />}
                {effectiveTab === "b2b-analytics" && <B2BAnalytics />}
                {effectiveTab === "ai-simulator" && <AISimulatorPanel />}
                {effectiveTab === "ai-marketing" && <CreativeDashboard />}
                {effectiveTab === "seo-geo" && <SeoGeoAuditorPanel />}
                {effectiveTab === "crucible" && <TheCrucible />}
                {effectiveTab === "dreams-matrix" && <DreamsMatrixPanel />}
                {effectiveTab === "digital-twin" && <ConsciousnessGraph />}
                {effectiveTab === "fleet" && <FleetCommander />}
                {effectiveTab === "repo-intel" && <RepoIntelPanel />}
              </Suspense>
            </div>
          </div>
        </main>

        <Suspense fallback={<AwarenessSkeleton />}>
          <DataManagementModal isOpen={showAccount} onClose={() => setShowAccount(false)} accountOnly />
        </Suspense>
      </div>
    </AdminGate>
  );
};


