import { logger } from "@/services/logger";
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
  Menu,
  X,
  Flame,
  Rocket,
  Briefcase,
  BarChart3,
  ClipboardList,
  TrendingUp,
  MapPin,
  PanelRightClose,
  PanelRightOpen
} from "lucide-react";
import { runtimeEnv } from "@/config/runtimeEnv";
import { AwarenessSkeleton } from '@/modules/meta/AwarenessSkeleton';
import { useAdminState } from "@/domains/admin/store/admin.store";
import { getEffectiveRoleFromState, useAuthState } from "@/domains/auth/store/auth.store";
import { isPrivilegedRole } from "@/utils/featureFlags";
import {
  fetchAdminConfig,
  fetchAiLogs,
  fetchMissions,
  fetchBroadcasts,
  fetchJourneyPaths,
} from "@/services/adminApi";
import { LiveFreezePill } from "./LiveFreezePill";
import { isSupabaseReady, supabase } from "@/services/supabaseClient";
import { AdminTooltip } from "./dashboard/Overview/components/AdminTooltip";
import {
  createCurrentUrl,
  getSearch,
  pushUrl,
  subscribePopstate
} from "@/services/navigation";
import {
  NAV_GROUPS,
  NAV_ITEMS,
  CLEAN_NAV_LABELS,
  DEVELOPER_PLUS_TABS,
  NAV_TOOLTIPS,
  type AdminTab,
  type NavGroup
} from "./adminNavigation";
import { AdminOmniSearch } from "./ui/AdminOmniSearch";
import { AdminCopilotModal } from "./dashboard/Intelligence/AdminCopilotModal";
import { DataManagement } from '@/modules/meta/DataManagement';
import { Bot, Wind } from "lucide-react";
import { SovereignOrchestrator } from "@/services/sovereignOrchestrator";
import { CommandHalo } from "./ui/CommandHalo";
import { SovereignHUD } from "./ui/SovereignHUD";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

// Extracted Panels (Lazy Loaded for performance and dependency stability)
const ExecutiveDashboard = lazy(() => import("./dashboard/Executive/ExecutiveDashboard").then(m => ({ default: m.ExecutiveDashboard })));
const GrowthRevenueDashboard = lazy(() => import("./dashboard/Executive/GrowthRevenueDashboard").then(m => ({ default: m.GrowthRevenueDashboard })));
const SecurityOpsDashboard = lazy(() => import("./dashboard/Executive/SecurityOpsDashboard").then(m => ({ default: m.SecurityOpsDashboard })));
const ConsciousnessAtlasDashboard = lazy(() => import("./dashboard/Executive/ConsciousnessAtlasDashboard").then(m => ({ default: m.ConsciousnessAtlasDashboard })));
const FlowDynamicsDashboard = lazy(() => import("./dashboard/Executive/FlowDynamicsDashboard").then(m => ({ default: m.FlowDynamicsDashboard })));
const FlowMapPanel = lazy(() => import("./dashboard/Flow/FlowMapPanel").then(m => ({ default: m.FlowMapPanel })));
const FeedbackPanel = lazy(() => import("./dashboard/Support/FeedbackPanel").then(m => ({ default: m.FeedbackPanel })));
const SupportTicketsPanel = lazy(() => import("./dashboard/Overview/components/SupportTicketsPanel").then(m => ({ default: m.SupportTicketsPanel })));
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
const SalesEnablementPanel = lazy(() => import("./dashboard/Intelligence/SalesEnablementPanel").then(m => ({ default: m.SalesEnablementPanel })));
const DreamsMatrixPanel = lazy(() => import("./dashboard/Intelligence/DreamsMatrixPanel").then(m => ({ default: m.DreamsMatrixPanel })));
const TheCrucible = lazy(() => import("./dashboard/Intelligence/TheCrucible").then(m => ({ default: m.TheCrucible })));
const ConsciousnessGraph = lazy(() => import("./dashboard/Intelligence/ConsciousnessGraph").then(m => ({ default: m.ConsciousnessGraph })));
const RepoIntelPanel = lazy(() => import("./dashboard/Intelligence/RepoIntelPanel"));
const FleetCommander = lazy(() => import("./dashboard/Fleet/FleetCommander").then(m => ({ default: m.FleetCommander })));
const SeoGeoAuditorPanel = lazy(() => import("./dashboard/SEO/SeoGeoAuditorPanel").then(m => ({ default: m.SeoGeoAuditorPanel })));
const AlertsPanel = lazy(() => import("./WarRoom/AlertsPanel"));
const LiveAdminPanel = lazy(() => import("@/modules/dawayir-live/pages/LiveAdminPanel").then(m => ({ default: m.default })));
const AdAnalyticsDashboard = lazy(() => import("./dashboard/AdAnalytics/AdAnalyticsDashboard").then(m => ({ default: m.AdAnalyticsDashboard })));
const SurveyResultsPanel = lazy(() => import("./dashboard/Data/SurveyResultsPanel").then(m => ({ default: m.SurveyResultsPanel })));
const MarketingOpsPanel = lazy(() => import("./dashboard/MarketingOps/MarketingOpsPanel").then(m => ({ default: m.MarketingOpsPanel })));
const SovereignPanel = lazy(() => import("./dashboard/Sovereign/SovereignControl").then(m => ({ default: m.SovereignControl })));
const SovereignExpansionHub = lazy(() => import("./dashboard/Executive/SovereignExpansionHub").then(m => ({ default: m.SovereignExpansionHub })));
const MapRegistryPanel = lazy(() => import("./dashboard/Content/MapRegistryPanel").then(m => ({ default: m.MapRegistryPanel })));
const MailCommandCenter = lazy(() => import("./dashboard/MailCommand/MailCommandCenter").then(m => ({ default: m.MailCommandCenter })));
const JourneyPathsPanel = lazy(() => import("./dashboard/Paths/JourneyPathsPanel").then(m => ({ default: m.JourneyPathsPanel })));
const OpsDocsPanel = lazy(() => import("./dashboard/OpsDocs/OpsDocsPanel"));
const DesignLab = lazy(() => import("./dashboard/Sovereign/DesignLab"));
const GovernanceHub = lazy(() => import("./dashboard/Sovereign/GovernanceHub").then(m => ({ default: m.GovernanceHub })));

const DataManagementModal = lazy(() => Promise.resolve({ default: DataManagement }));

const getTabFromLocation = (): AdminTab => {
  const params = new URLSearchParams(getSearch());
  const tab = params.get("tab") as AdminTab | null;
  return NAV_ITEMS.some((item) => item.id === tab) ? tab! : "sovereign";
};

const updateTabInUrl = (tab: AdminTab) => {
  const url = createCurrentUrl();
  if (!url) return;
  url.searchParams.set("tab", tab);
  pushUrl(url);
};

const ADMIN_SIDEBAR_VISIBILITY_KEY = "admin-dashboard-sidebar-visible";

const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return (
    target.isContentEditable ||
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select"
  );
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleLogin = async () => {
    const normalizedCode = code.trim();
    if (!normalizedCode) {
      setError("أدخ د ادر.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin?path=alerts", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${normalizedCode}`
        }
      });

      if (!response.ok) {
        setError("اد غر صحح.");
        return;
      }

      setAdminAccess(true);
      setAdminCode(normalizedCode);
      setError("");
    } catch {
      setError("تعذر اتح  اد حاا.");
      } finally {
      setIsSubmitting(false);
    }
  };

  if (adminAccess) return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-slate-200 flex items-center justify-center p-6 relative isolate overflow-hidden transition-colors duration-500">
      {/* Cinematic Background effect */}
      <div className="absolute inset-0 z-0 bg-cover bg-center opacity-20 nebula-bg pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#030712] via-[#030712]/90 to-transparent pointer-events-none" />
      
      <div className="w-full max-w-md rounded-3xl border border-teal-500/30 bg-[#0B0F19] p-8 space-y-8 relative z-10 shadow-[0_0_80px_rgba(20,184,166,0.2)] ring-1 ring-white/5">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500/20 to-indigo-500/20 border border-teal-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(20,184,166,0.3)]">
            <ShieldCheck className="w-8 h-8 text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-widest uppercase font-sans">الوصول السيادي</h1>
            <p className="text-sm text-teal-400/80 tracking-wider font-bold mt-1">مركز القيادة المتقدم</p>
          </div>
        </div>
        
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleLogin();
          }}
        >
          <input
            type="text"
            autoComplete="username"
            value="admin"
            readOnly
            tabIndex={-1}
            aria-hidden="true"
            className="hidden"
          />
          <div className="space-y-2 cursor-text text-right" onClick={(e) => (e.currentTarget.lastChild as HTMLInputElement)?.focus()}>
            <label className="text-xs uppercase tracking-widest font-black text-slate-400 px-1">رمز العبور</label>
            <input
              type="password"
              autoComplete="new-password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="••••••••••••••••"
              className="w-full rounded-xl bg-[#111827] border border-slate-700/80 px-4 py-4 text-base text-teal-300 placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-center tracking-[0.3em] font-mono shadow-inner"
              dir="ltr"
            />
          </div>
          {error && <p className="text-sm text-rose-400 font-bold text-center mt-2">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed font-black uppercase tracking-wider py-4 transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] border border-teal-400/50"
          >
            {isSubmitting ? "جاري المصادقة..." : "بدء الاتصال"}
          </button>
        </form>
      </div>
    </div>
  );
};

const CollapsibleSidebarGroup: FC<{
  group: NavGroup;
  visibleItemsInGroup: Array<{ id: AdminTab; label: string; icon: ReactNode }>;
  effectiveTab: AdminTab;
  handleTabChange: (next: AdminTab) => void;
}> = ({ group, visibleItemsInGroup, effectiveTab, handleTabChange }) => {
  // Auto-expand if the active tab is inside this group
  const isActiveGroup = visibleItemsInGroup.some(item => item.id === effectiveTab);
  const [expanded, setExpanded] = useState(isActiveGroup);

  return (
    <div className="space-y-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-800/40 rounded-xl transition-colors focus:outline-none group cursor-pointer"
      >
        <span className="text-xs font-black text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 uppercase tracking-widest transition-colors">
          {group.title}
        </span>
        <span className="text-slate-400 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-transform">
          {expanded ? <X className="w-3 h-3 opacity-50" /> : <Menu className="w-3 h-3 opacity-50 scale-x-125" />}
        </span>
      </button>
      
      {expanded && (
        <div className="space-y-1.5 pt-1 animate-in slide-in-from-top-2 fade-in duration-200">
          {visibleItemsInGroup.map((item) => {
            const isActive = effectiveTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group/item cursor-pointer ${
                  isActive
                    ? "bg-slate-800/80 border-l border-teal-500/50 text-white shadow-md shadow-slate-900/50"
                    : "border-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg transition-colors shadow-sm ${isActive ? "text-teal-400 bg-teal-500/20 ring-1 ring-teal-500/30" : "text-slate-500 group-hover/item:text-slate-300 bg-slate-900/50 shadow-inner border border-white/5"}`}>
                    {item.icon}
                  </div>
                  <span className={`text-sm font-black tracking-wide transition-all ${isActive ? "text-white" : "group-hover/item:-translate-x-0.5"}`}>
                    {CLEAN_NAV_LABELS[item.id] ?? item.label}
                  </span>
                </div>
                <div className={`mr-auto transition-opacity duration-300 flex items-center z-10 ${isActive ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100'}`} onClick={(e) => e.stopPropagation()}>
                  <AdminTooltip content={NAV_TOOLTIPS[item.id] || "القسم مخصص للإدارة المركزية"} position="bottom" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const AdminDashboard: FC<{ onExit?: () => void }> = ({ onExit }) => {
  const [tab, setTab] = useState<AdminTab>(getTabFromLocation);
  const [showAccount, setShowAccount] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarVisible, setIsDesktopSidebarVisible] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const storedValue = window.localStorage.getItem(ADMIN_SIDEBAR_VISIBILITY_KEY);
    return storedValue !== "hidden";
  });
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
  const setJourneyPaths = useAdminState((s) => s.setJourneyPaths);
  const resonanceScore = useAdminState((s) => s.resonanceScore);
  const latestFriction = useAdminState((s) => s.latestFriction);

  // 🔱 Resonance Intelligence Observer
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    
    // Status Logic
    const isHarmony = resonanceScore >= 80;
    const isStable = resonanceScore >= 50 && resonanceScore < 80;
    const isFriction = resonanceScore >= 25 && resonanceScore < 50;
    const isCrisis = resonanceScore < 25;

    // Mapping Colors
    let primary = "#2dd4bf"; // Default Teal (Harmony)
    let glow = "rgba(45, 212, 191, 0.1)";
    let speed = "3s";

    if (isStable) {
      primary = "#6366f1"; // Indigo
      glow = "rgba(99, 102, 241, 0.05)";
      speed = "4s";
    } else if (isFriction) {
      primary = "#f59e0b"; // Amber
      glow = "rgba(245, 158, 11, 0.1)";
      speed = "6s";
    } else if (isCrisis) {
      primary = "#f43f5e"; // Rose
      glow = "rgba(244, 63, 94, 0.15)";
      speed = "8s";
    }

    // Apply to CSS Engine
    root.style.setProperty("--admin-resonance-primary", primary);
    root.style.setProperty("--admin-resonance-glow", glow);
    root.style.setProperty("--admin-pulse-speed", speed);

  }, [resonanceScore]);

  // 🔱 Sovereign Orchestrator Evaluator
  useEffect(() => {
    if (!adminAccess) return;
    const interval = setInterval(() => {
      void SovereignOrchestrator.evaluateIntelligence();
    }, 15000); // evaluate every 15 seconds
    
    // Initial evaluation
    void SovereignOrchestrator.evaluateIntelligence();
    
    return () => clearInterval(interval);
  }, [adminAccess]);

  useEffect(() => {
    const handler = () => setTab(getTabFromLocation());
    return subscribePopstate(handler);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      ADMIN_SIDEBAR_VISIBILITY_KEY,
      isDesktopSidebarVisible ? "visible" : "hidden"
    );
  }, [isDesktopSidebarVisible]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleKeydown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;

      const isToggleShortcut =
        (event.ctrlKey && event.key.toLowerCase() === "b") ||
        (!event.ctrlKey && !event.metaKey && !event.altKey && event.key === "[");

      if (!isToggleShortcut) return;

      event.preventDefault();

      if (window.innerWidth >= 1024) {
        setIsDesktopSidebarVisible((current) => !current);
        return;
      }

      setIsSidebarOpen((current) => !current);
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  useEffect(() => {
    if (!isSupabaseReady) return;
    const loadRemote = async () => {
      try {
        const [config, aiLogs, missions, broadcasts, journeyPaths] = await Promise.all([
          fetchAdminConfig(),
          fetchAiLogs(),
          fetchMissions(),
          fetchBroadcasts(),
          fetchJourneyPaths()
        ]);
        if (config?.featureFlags) setFeatureFlags(config.featureFlags);
        if (config?.systemPrompt) setSystemPrompt(config.systemPrompt);
        if (config?.scoringWeights) setScoringWeights(config.scoringWeights);
        if (config?.scoringThresholds) setScoringThresholds(config.scoringThresholds);
        if (aiLogs) setAiLogs(aiLogs);
        if (missions) setMissions(missions);
        if (broadcasts) setBroadcasts(broadcasts);
        if (journeyPaths) setJourneyPaths(journeyPaths);
      } catch (err) {
        logger.error("Admin data load error", err);
      }
    };
    void loadRemote();
  }, [setFeatureFlags, setSystemPrompt, setScoringWeights, setScoringThresholds, setAiLogs, setMissions, setBroadcasts, setJourneyPaths]);

  const authRole = useAuthState(getEffectiveRoleFromState);
  const baseRole = useAuthState((s) => s.role);
  const canSeeAdvancedTabs = isPrivilegedRole(baseRole) || adminAccess;

  const effectiveTab: AdminTab =
    !canSeeAdvancedTabs && DEVELOPER_PLUS_TABS.includes(tab) ? "entity" : tab;

  const handleTabChange = (next: AdminTab) => {
    setTab(next);
    updateTabInUrl(next);
    setIsSidebarOpen(false);
  };

  const activeTabItem = NAV_ITEMS.find((item) => item.id === effectiveTab);
  const isDesktopSidebarHidden = !isDesktopSidebarVisible;

  return (
    <AdminGate>
      <CommandHalo />
      <AdminCopilotModal />
      <div className="admin-cockpit sovereign-pulse-fast min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-slate-200 flex flex-col lg:flex-row relative isolate selection:bg-teal-500/30 font-sans overflow-hidden transition-colors duration-500">
        
        {/* Mobile Top Stats Bar */}
        <div className="lg:hidden w-full flex justify-between items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-2 px-4 shadow-sm text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest z-10 shrink-0 transition-colors">
          <div className="flex items-center gap-2">
             <Activity className="w-3 h-3 text-teal-500 dark:text-teal-400" />
             <span>نبض متصل</span> 
          </div>
          <div className="flex items-center gap-2">
             <Wind className="w-3 h-3 text-amber-400" />
             <span>استقرار</span>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        <div
          className={`fixed inset-0 z-40 bg-[#030712]/80 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${
            isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />

        <aside
          className={`
            admin-sidebar fixed lg:sticky top-0 right-0 h-screen flex-shrink-0 border-l bg-white dark:bg-[#0B0F19]
            flex flex-col z-50 overflow-hidden select-none shadow-[0_30px_80px_rgba(2,6,23,0.55)]
            transition-[transform,width,opacity,border-color,box-shadow,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
            ${
              isSidebarOpen
                ? "translate-x-0 w-72 border-slate-800/80 opacity-100 lg:translate-x-0"
                : "translate-x-full w-72 border-transparent opacity-0 pointer-events-none lg:pointer-events-auto"
            }
            ${isDesktopSidebarVisible ? "lg:w-72 lg:translate-x-0 lg:opacity-100 lg:border-slate-800/80" : "lg:w-0 lg:translate-x-full lg:opacity-0 lg:border-transparent"}
          `}
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-teal-400/20 to-transparent opacity-70" />
          <div className="p-6 lg:p-8 border-b border-slate-200 dark:border-slate-800/80 relative group flex items-center justify-between bg-slate-50 dark:bg-[#080B14] transition-colors duration-500">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.3)] ring-1 ring-white/10">
                <Workflow className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white leading-none mb-1">القيادة</h1>
                <p className="text-xs font-bold text-teal-600 dark:text-teal-400/80 uppercase tracking-widest leading-none">مركز ألفا</p>
              </div>
            </div>
            <button
              className="p-2 bg-slate-800/50 rounded-lg text-slate-300 hover:text-white transition-colors border border-slate-700/50"
              onClick={() => {
                if (window.innerWidth >= 1024) {
                  setIsDesktopSidebarVisible(false);
                  return;
                }
                setIsSidebarOpen(false);
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 py-8 space-y-8 custom-scrollbar">
            {NAV_GROUPS.map((group) => {
              const visibleItemsInGroup = canSeeAdvancedTabs
                ? group.items
                : group.items.filter((item) => !DEVELOPER_PLUS_TABS.includes(item.id));
              
              if (visibleItemsInGroup.length === 0) return null;

              return (
                <CollapsibleSidebarGroup
                  key={group.title}
                  group={group}
                  visibleItemsInGroup={visibleItemsInGroup}
                  effectiveTab={effectiveTab}
                  handleTabChange={handleTabChange}
                />
              );
            })}
          </nav>

          <footer className="p-5 border-t border-slate-200 dark:border-slate-800/80 space-y-3 bg-slate-50 dark:bg-[#080B14] transition-colors duration-500">
            <div className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 shadow-inner">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/10 dark:from-indigo-500/20 to-purple-500/10 dark:to-purple-500/20 flex items-center justify-center border border-indigo-500/20 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">{authUser?.email?.split('@')[0] || "مُشغِّل"}</p>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest">{authRole}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setAdminAccess(false);
                setAdminCode(null);
                onExit?.();
              }}
              className="w-full flex items-center gap-3 justify-center bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900/50 rounded-xl px-4 py-3 text-xs font-black text-slate-400 hover:text-rose-400 transition-all uppercase tracking-widest group shadow-sm"
            >
              <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>قطع الاتصال</span>
            </button>
          </footer>
        </aside>

        {!isDesktopSidebarVisible && (
          <button
            type="button"
            onClick={() => setIsDesktopSidebarVisible(true)}
            className="hidden lg:flex fixed right-0 top-6 z-40 items-center justify-center rounded-l-xl border-y border-l border-slate-200 dark:border-slate-700/70 bg-white dark:bg-[#0B0F19] p-3 text-slate-400 dark:text-slate-500 shadow-[0_4px_24px_rgba(0,0,0,0.05)] transition-all duration-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500/30 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:pr-4 group active:scale-95 origin-right"
            aria-label="إظهار القائمة الجانبية"
            title="إظهار القائمة الجانبية (Ctrl+B أو [)"
          >
            <PanelRightOpen className="w-5 h-5 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110 group-hover:-translate-x-1" />
          </button>
        )}

        <main
          className={`flex-1 min-w-0 flex flex-col h-screen overflow-hidden transition-[padding,max-width] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
            isDesktopSidebarVisible ? "lg:pr-0" : "lg:pr-6"
          }`}
        >
          <header
            className={`h-20 lg:h-28 border-b bg-white dark:bg-[#0B0F19] flex items-center justify-between px-6 lg:px-12 flex-shrink-0 z-10 transition-[border-color,background-color,box-shadow] duration-500 shadow-md ${
              isDesktopSidebarHidden
                ? "border-slate-200 dark:border-slate-700/70 shadow-[0_10px_40px_rgba(15,23,42,0.18)]"
                : "border-slate-200 dark:border-slate-800/80"
            }`}
          >
            <div className="flex items-center gap-4 lg:gap-8">
              <button
                type="button"
                className="lg:hidden p-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all shadow-sm"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>
              {isDesktopSidebarVisible && (
                <button
                  type="button"
                  className="hidden lg:flex items-center justify-center p-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-300 dark:hover:border-rose-500/30 hover:shadow-[0_0_15px_rgba(244,63,94,0.15)] transition-all duration-300 group active:scale-95"
                  onClick={() => setIsDesktopSidebarVisible(false)}
                  aria-label="إخفاء القائمة الجانبية"
                  title="إخفاء القائمة الجانبية (Ctrl+B أو [)"
                >
                  <PanelRightClose className="w-5 h-5 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110 group-hover:translate-x-1" />
                </button>
              )}
              <div className="flex flex-col">
                <h2 className="text-xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1 font-sans">
                  {activeTabItem?.label || "لوحة القيادة"}
                </h2>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-500 animate-[pulse-ring_2s_infinite]" />
                  <span className="text-xs font-bold text-teal-600 dark:text-teal-400/80 uppercase tracking-widest hidden sm:inline-block">تم تأسيس الاتصال السيادي</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 lg:gap-6">
              <SovereignHUD />

              <div className="h-8 w-px bg-slate-800 hidden lg:block mx-2" />

              <AdminTooltip content={isContentEditingEnabled ? "إيقاف التحرير المباشر" : "تفعيل التحرير المباشر في الموقع"} position="bottom">
                <button
                  onClick={() => {
                    const newValue = !isContentEditingEnabled;
                    toggleContentEditing(newValue);
                    if (newValue) {
                      window.open("/", "_blank");
                    }
                  }}
                  className={`p-3 lg:p-4 rounded-xl lg:rounded-2xl border transition-all active:scale-95 group shadow-lg ${isContentEditingEnabled
                    ? "bg-teal-500/20 border-teal-500/50 text-teal-600 dark:text-teal-300 ring-1 ring-teal-500/30"
                    : "bg-slate-100 dark:bg-[#111827] border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                >
                  <Pencil className="w-5 h-5 group-hover:-rotate-12 transition-transform" />
                </button>
              </AdminTooltip>

              <AdminTooltip content="المساعد الإداري (Copilot): استعلم سريعاً عن حالة المنصة. الأرقام والشكاوي." position="bottom">
                <button
                  onClick={() => useAdminState.getState().setCopilotOpen(true)}
                  className="p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700/80 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-teal-300 dark:hover:border-teal-500/50 transition-all active:scale-95 group shadow-lg"
                >
                  <Bot className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              </AdminTooltip>

              <AdminTooltip content="إدارة بيانات النظام (Data Management): لوحة لعمل نسخ احتياطية (JSON/PDF)، ومزامنة البيانات محلياً أو سحابياً." position="bottom">
                <button
                  onClick={() => setShowAccount(true)}
                  className="p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all active:scale-95 group shadow-lg"
                >
                  <Database className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </button>
              </AdminTooltip>

              <div className="h-8 w-px bg-slate-800 hidden lg:block mx-1" />
              <ThemeToggle />
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 lg:p-12 custom-scrollbar relative bg-[#030712] inset-shadow-sm transition-colors duration-500">
            {/* The Architectural Grid Pattern */}
            <div className={`pointer-events-none absolute inset-0 transition-opacity duration-500 z-0 ${isDesktopSidebarHidden ? "opacity-100" : "opacity-0"}`} style={{
              backgroundImage: 'linear-gradient(rgba(20, 184, 166, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(20, 184, 166, 0.03) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              backgroundPosition: 'center center'
            }} />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/5 blur-[120px] rounded-full pointer-events-none z-0"></div>
            
            <div className="max-w-7xl mx-auto pb-20 relative z-10">
              <Suspense fallback={<div>Loading...</div>}>
                {effectiveTab === "sovereign" && <SovereignPanel />}
                {effectiveTab === "entity" && <EntityDashboard />}
                {effectiveTab === "exec-overview" && <ExecutiveDashboard />}
                {effectiveTab === "growth-revenue" && <GrowthRevenueDashboard />}
                {effectiveTab === "security-ops" && <SecurityOpsDashboard />}
                {effectiveTab === "consciousness-atlas" && <ConsciousnessAtlasDashboard />}
                {effectiveTab === "flow-dynamics" && <FlowDynamicsDashboard />}
                {effectiveTab === "war-room" && <AlertsPanel />}
                {effectiveTab === "flow-map" && <FlowMapPanel />}
                {effectiveTab === "journey-paths" && <JourneyPathsPanel />}
                {effectiveTab === "ops-docs" && <OpsDocsPanel />}
                {effectiveTab === "map-registry" && <MapRegistryPanel />}
                {effectiveTab === "feature-flags" && <FeatureFlagsPanel />}
                {effectiveTab === "ai-studio" && <AIStudioPanel />}
                {effectiveTab === "ai-decisions" && <AIDecisionLogPanel maxDecisions={100} />}
                {effectiveTab === "health-monitor" && <HealthMonitorPanel />}
                {effectiveTab === "content" && <ContentPanel />}
                {effectiveTab === "users-state" && (
                  <div className="space-y-8">
                    <UsersPanel />
                    <UserStatePanel />
                  </div>
                )}
                {effectiveTab === "consciousness" && <ConsciousnessArchivePanel />}
                {effectiveTab === "consciousness-map" && <ConsciousnessMap />}
                {effectiveTab === "b2b-analytics" && <B2BAnalytics />}
                {effectiveTab === "ai-simulator" && <AISimulatorPanel />}
                {effectiveTab === "ai-marketing" && <CreativeDashboard />}
                {effectiveTab === "sales-enablement" && <SalesEnablementPanel />}
                {effectiveTab === "seo-geo" && <SeoGeoAuditorPanel />}
                {effectiveTab === "crucible" && <TheCrucible />}
                {effectiveTab === "dreams-matrix" && <DreamsMatrixPanel />}
                {effectiveTab === "digital-twin" && <ConsciousnessGraph />}
                {effectiveTab === "fleet" && <FleetCommander />}
                {effectiveTab === "repo-intel" && <RepoIntelPanel />}
                {effectiveTab === "dawayir-live" && <LiveAdminPanel />}
                {effectiveTab === "ad-analytics" && <AdAnalyticsDashboard />}
                {effectiveTab === "feedback-survey" && (
                  <div className="space-y-8">
                    <FeedbackPanel />
                    <SurveyResultsPanel />
                  </div>
                )}
                {effectiveTab === "support-tickets" && <SupportTicketsPanel />}
                {effectiveTab === "marketing-ops" && <MarketingOpsPanel />}
                {effectiveTab === "expansion-hub" && <SovereignExpansionHub />}
                {effectiveTab === "mail-command" && <MailCommandCenter />}
                {effectiveTab === "design-lab" && <DesignLab />}
                {effectiveTab === "governance-ledger" && <GovernanceHub />}
              </Suspense>
            </div>
          </div>
        </main>

        <Suspense fallback={<AwarenessSkeleton />}>
          <DataManagementModal isOpen={showAccount} onClose={() => setShowAccount(false)} accountOnly={false} />
        </Suspense>
      </div>
    </AdminGate>
  );
};
