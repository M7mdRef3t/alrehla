import type { FC } from "react";
import { useState, Suspense, lazy, useMemo } from "react";
import {
    Activity,
    ArrowLeft,
    Bell,
    BookOpen,
    ClipboardList,
    Database,
    Globe,
    Layers,
    Lock,
    Share2,
    Smartphone,
    Sparkles,
    Zap,
    Rocket,
    Settings,
    Cpu,
    Eye
} from "lucide-react";
import { useAdminState } from "@/domains/admin/store/admin.store";
import { AwarenessSkeleton } from '@/modules/meta/AwarenessSkeleton';
import { useAuthState, getEffectiveRoleFromState } from "@/domains/auth/store/auth.store";
import { getEffectiveFeatureAccess, isPrivilegedRole } from "@/utils/featureFlags";
import { runtimeEnv } from "@/config/runtimeEnv";
import { FEATURE_FLAGS, type FeatureFlagKey, type FeatureFlagMode } from "@/config/features";
import { saveFeatureFlags } from "@/services/adminApi";
import { isSupabaseReady } from "@/services/supabaseClient";
import { createCurrentUrl, pushUrl, replaceUrl } from "@/services/navigation";
import { motion, AnimatePresence } from "framer-motion";

const DataManagementModal = lazy(() =>
    import('@/modules/meta/DataManagement').then((m) => ({ default: m.DataManagement }))
);

export const FeatureFlagsPanel: FC = () => {
    const featureFlags = useAdminState((s) => s.featureFlags);
    const updateFeatureFlag = useAdminState((s) => s.updateFeatureFlag);
    const betaAccess = useAdminState((s) => s.betaAccess);
    const setBetaAccess = useAdminState((s) => s.setBetaAccess);
    const adminAccess = useAdminState((s) => s.adminAccess);
    const setAdminAccess = useAdminState((s) => s.setAdminAccess);
    const setAdminCode = useAdminState((s) => s.setAdminCode);
    const baseRole = useAuthState((s) => s.role);
    const roleOverride = useAuthState((s) => s.roleOverride);
    const setRoleOverride = useAuthState((s) => s.setRoleOverride);
    const role = useAuthState(getEffectiveRoleFromState);
    const [saving, setSaving] = useState(false);
    const [showDataTools, setShowDataTools] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("Core");

    const effectiveAccess = getEffectiveFeatureAccess({
        featureFlags,
        betaAccess,
        role,
        adminAccess,
        isDev: runtimeEnv.isDev
    });

    const openFeaturePreview = (featureKey: FeatureFlagKey) => {
        const next = createCurrentUrl();
        if (!next) return;
        if (featureKey === "global_atlas") {
            next.pathname = "/analytics";
            next.search = "";
        } else {
            next.pathname = "/";
            next.searchParams.set("previewFeature", featureKey);
        }
        pushUrl(next);
    };

    const openOwnerAction = (action: string) => {
        const next = createCurrentUrl();
        if (!next) return;
        next.pathname = "/";
        next.search = "";
        next.searchParams.set("ownerAction", action);
        pushUrl(next);
    };

    const groupedFlags = useMemo(() => {
        const groups: Record<string, typeof FEATURE_FLAGS> = {};
        FEATURE_FLAGS.forEach(flag => {
            const g = flag.group || "Core";
            if (!groups[g]) groups[g] = [];
            groups[g].push(flag);
        });
        return groups;
    }, []);

    const tabs = [
        { id: "Core", label: "النظام الأساسي", icon: <Cpu className="w-4 h-4" /> },
        { id: "AI", label: "الذكاء الاصطناعي", icon: <Sparkles className="w-4 h-4" /> },
        { id: "Insights", label: "الرؤى والتحليل", icon: <Eye className="w-4 h-4" /> }
    ];

    const sidebarActions = [
        { id: "start_journey", label: "ابدأ رحلتك", icon: <ArrowLeft className="w-4 h-4" /> },
        { id: "guided_journey", label: "الرحلة الموجهة", icon: <Layers className="w-4 h-4" /> },
        { id: "baseline_check", label: "رصد الحالة", icon: <ClipboardList className="w-4 h-4" /> },
        { id: "notifications", label: "الإشعارات", icon: <Bell className="w-4 h-4" /> },
        { id: "atlas_dashboard", label: "لوحة الأطلس", icon: <Globe className="w-4 h-4" /> },
        { id: "share_stats", label: "شارك", icon: <Share2 className="w-4 h-4" /> },
        { id: "library", label: "المكتبة", icon: <BookOpen className="w-4 h-4" /> },
        { id: "advanced_tools", label: "أدوات متقدمة", icon: <Sparkles className="w-4 h-4" /> },
        { id: "install_app", label: "تثبيت التطبيق", icon: <Smartphone className="w-4 h-4" /> },
        { id: "noise_silencing", label: "تشويش الإشارة", icon: <Lock className="w-4 h-4" /> },
    ];

    const privilegedRoleLabel = (baseRole || "owner").trim().toLowerCase();
    const viewMode = roleOverride ? roleOverride.trim().toLowerCase() : null;
    const isUserView = role === "user";
    const isRealRoleView = viewMode == null || viewMode === privilegedRoleLabel;
    const isDevRoleView = Boolean(runtimeEnv.isDev && viewMode === "developer");
    const canViewAsUser = isPrivilegedRole(baseRole);

    const stripRoleQueryParam = () => {
        try {
            const url = createCurrentUrl();
            if (!url) return;
            if (!url.searchParams.has("asRole")) return;
            url.searchParams.delete("asRole");
            replaceUrl(url, {});
        } catch {
            // ignore URL update errors
        }
    };

    const handleViewAsUser = () => {
        setAdminAccess(false);
        setAdminCode(null);
        setRoleOverride("user");
        stripRoleQueryParam();
    };

    const handleUseRealRole = () => {
        setRoleOverride(null);
        stripRoleQueryParam();
    };

    const handleUseDevRole = () => {
        if (!runtimeEnv.isDev) return;
        setRoleOverride("developer");
        stripRoleQueryParam();
    };

    return (
        <div className="space-y-8 pb-32 font-sans selection:bg-amber-500/30 text-right" dir="rtl">
            {/* Header / Mission Control */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 md:p-8 bg-slate-950/40 backdrop-blur-3xl rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-teal-500/5 opacity-50" />

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)] group-hover:shadow-[0_0_30px_rgba(245,158,11,0.2)] transition-all">
                            <Rocket className="w-6 h-6 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tight">وحدة التحكم الزمنية</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.8)] animate-pulse" />
                                <p className="text-[10px] text-slate-500 font-bold">الأنظمة مستقرة • {Object.keys(featureFlags).length} ميزة نشطة</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => setShowDataTools(true)}
                        className="p-4 rounded-2xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-95 group shadow-lg"
                        title="أدوات البيانات المتقدمة"
                    >
                        <Database className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    </button>

                    <div className="h-12 w-px bg-white/10 hidden md:block"></div>

                    <button
                        type="button"
                        onClick={async () => {
                            const next = !betaAccess;
                            setBetaAccess(next);
                            if (!isSupabaseReady) return;
                            await saveFeatureFlags({ ...featureFlags });
                        }}
                        className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-bold tracking-wide border transition-all shadow-lg active:scale-95 ${betaAccess
                            ? "bg-amber-500/10 border-amber-500/50 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                            : "bg-slate-900 border-white/5 text-slate-500 hover:border-white/10"}`}
                    >
                        <Zap className={`w-4 h-4 ${betaAccess ? "animate-bounce" : ""}`} />
                        {betaAccess ? "مسرع البيتا نشط" : "مسرع البيتا خامل"}
                    </button>
                </div>
            </header>

            {/* View Mode Controller */}
            {canViewAsUser && (
                <div className="flex flex-col gap-4">
                    <p className="text-[10px] font-bold text-slate-500 pl-2">وضع الرؤية الزمني</p>
                    <div className="p-1 px-2 bg-slate-950/40 backdrop-blur-xl rounded-2xl border border-white/5 inline-flex gap-1 self-start shadow-xl">
                        {[
                            { id: 'user', label: 'المستخدم', action: handleViewAsUser, active: isUserView, color: 'text-slate-400' },
                            { id: 'real', label: `المشرف: ${privilegedRoleLabel}`, action: handleUseRealRole, active: isRealRoleView, color: 'text-teal-400' },
                            ...(runtimeEnv.isDev ? [{ id: 'dev', label: 'المطور', action: handleUseDevRole, active: isDevRoleView, color: 'text-indigo-400' }] : [])
                        ].map(mode => (
                            <button
                                key={mode.id}
                                onClick={mode.action}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-bold transition-all relative ${mode.active
                                    ? "bg-white text-slate-950 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                                    : "text-slate-500 hover:text-slate-200 hover:bg-white/5"}`}
                            >
                                <span className="relative z-10">{mode.label}</span>
                                {mode.active && <motion.div layoutId="mode-pill" className="absolute inset-0 bg-white rounded-xl -z-0" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-all ${activeTab === tab.id
                                ? "bg-slate-800 text-white shadow-lg border border-slate-700"
                                : "text-slate-500 hover:text-slate-300 hover:bg-slate-900"
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Feature Launchpad */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {(groupedFlags[activeTab] || []).map((flag) => {
                    const mode = featureFlags[flag.key] || "off";
                    const isAllowed = effectiveAccess[flag.key];

                    return (
                        <div
                            key={flag.key}
                            className={`group relative admin-glass-card p-6 border-white/5 transition-all duration-500 overflow-hidden flex flex-col ${!isAllowed ? 'opacity-40 grayscale pointer-events-none' : 'hover:border-white/20'}`}
                        >
                            {/* Animated Background Glow */}
                            <div className={`absolute -top-12 -left-12 w-32 h-32 rounded-full blur-[60px] transition-all duration-1000 opacity-0 group-hover:opacity-40 ${mode === 'on' ? 'bg-teal-500' : mode === 'beta' ? 'bg-amber-500' : 'bg-slate-500'}`} />

                            <div className="flex items-start justify-between relative z-10 mb-6">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-xl border ${mode === 'on' ? 'bg-teal-500/10 border-teal-500/20 text-teal-400' : mode === 'beta' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-slate-900 border-white/5 text-slate-500'}`}>
                                        <Activity className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-bold text-white group-hover:translate-x-1 transition-transform truncate text-right">
                                            {flag.label}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`w-1 h-1 rounded-full ${mode === 'on' ? 'bg-teal-500' : mode === 'beta' ? 'bg-amber-500' : 'bg-slate-700'}`} />
                                            <p className="text-[9px] font-bold text-slate-500 truncate font-mono ltr">
                                                {flag.key}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className={`px-2 py-0.5 rounded text-[8px] font-bold border transition-all ${isAllowed ? 'border-teal-500/20 text-teal-500 bg-teal-500/5' : 'border-rose-500/20 text-rose-500 bg-rose-500/5'}`}>
                                    {isAllowed ? 'فعال' : 'خطأ تزامن'}
                                </div>
                            </div>

                            <p className="text-[11px] text-slate-400 leading-relaxed mb-6 flex-1 line-clamp-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                {flag.description}
                            </p>

                            <div className="space-y-4 relative z-10">
                                <div className="flex items-center gap-1 p-1 bg-slate-950/80 backdrop-blur-md rounded-xl border border-white/5 shadow-inner" dir="ltr">
                                    {(["off", "on", "beta"] as FeatureFlagMode[]).map((opt) => {
                                        if (opt === "beta" && !flag.supportsBeta) return null;
                                        const active = mode === opt;
                                        return (
                                            <button
                                                key={opt}
                                                onClick={async () => {
                                                    updateFeatureFlag(flag.key, opt);
                                                    if (!isSupabaseReady) return;
                                                    setSaving(true);
                                                    await saveFeatureFlags({ ...featureFlags, [flag.key]: opt });
                                                    setSaving(false);
                                                }}
                                                className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${active
                                                    ? opt === "on" ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/10" : opt === "beta" ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20" : "bg-white/10 text-white shadow-lg"
                                                    : "text-slate-600 hover:text-slate-400 hover:bg-white/5"
                                                    }`}
                                            >
                                                {opt}
                                            </button>
                                        )
                                    })}
                                </div>

                                <button
                                    onClick={() => openFeaturePreview(flag.key)}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-98 group flex-shrink-0"
                                >
                                    <span>محاكاة الميزة</span>
                                    <ArrowLeft className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Experience Gateways */}
            <div className="pt-10 border-t border-white/5">
                <div className="flex items-center justify-between mb-8">
                    <h4 className="text-xs font-bold text-slate-500 flex items-center gap-3">
                        <Settings className="w-4 h-4 text-indigo-500" />
                        بوابات النظام السريعة
                    </h4>
                    <span className="text-[9px] font-mono text-slate-700 italic">Core v2.4.0-stable</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {sidebarActions.map((action) => (
                        <button
                            key={action.id}
                            onClick={() => openOwnerAction(action.id)}
                            className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-slate-950/20 border border-white/5 hover:bg-white/5 hover:border-white/20 hover:-translate-y-1 hover:shadow-2xl transition-all group group overflow-hidden relative"
                        >
                            <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="p-3 rounded-xl bg-slate-900 border border-white/5 text-slate-400 group-hover:text-indigo-400 group-hover:scale-110 transition-all shadow-lg relative z-10">
                                {action.icon}
                            </div>
                            <span className="text-[9px] font-bold text-slate-500 text-center group-hover:text-slate-200 transition-colors relative z-10 px-2 line-clamp-1">{action.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Glooming Deployment Status */}
            <AnimatePresence>
                {saving && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-10 left-10 z-[60]"
                    >
                        <div className="flex items-center gap-4 px-6 py-4 bg-slate-900 border border-teal-500/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                                <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-teal-400">تطور المنطق</p>
                                <p className="text-[9px] text-slate-500 mt-0.5">جاري مزامنة الحالة الزمنية...</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Suspense fallback={<AwarenessSkeleton />}>
                <DataManagementModal
                    isOpen={showDataTools}
                    onClose={() => setShowDataTools(false)}
                />
            </Suspense>
        </div>
    );
};

