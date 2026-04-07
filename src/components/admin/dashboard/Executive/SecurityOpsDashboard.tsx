import type { FC } from "react";
import { useEffect, useState } from "react";
import { ShieldCheck, Activity } from "lucide-react";
import { AdminTooltip } from "../Overview/components/AdminTooltip";

import { SocialFirewall } from "../Overview/components/SocialFirewall";
import { LiveFreezeGuard } from "../Overview/components/LiveFreezeGuard";
import { AIGuardrailCard } from "../Overview/components/AIGuardrailCard";
import { SecuritySentinel } from "../Overview/components/SecuritySentinel";
import { SystemHealth } from "../Overview/components/SystemHealth";
import { RecoveryWidget } from "../Overview/components/RecoveryWidget";
import { OpsInsights } from "../Overview/components/OpsInsights";

import { fetchOverviewStats, fetchSystemHealth, fetchOwnerOpsReport, type OverviewStats, fetchOpsInsights } from "@/services/adminApi";
import type { SystemHealthReport, SecuritySignalsReport, OpsInsights as OpsInsightsType } from "@/types/admin.types";

export const SecurityOpsDashboard: FC = () => {
    const [remoteStats, setRemoteStats] = useState<OverviewStats | null>(null);
    const [systemHealth, setSystemHealth] = useState<SystemHealthReport | null>(null);
    const [securitySignals, setSecuritySignals] = useState<SecuritySignalsReport | null>(null);
    const [opsInsights, setOpsInsights] = useState<OpsInsightsType | null>(null);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const refresh = () => {
            Promise.all([fetchOverviewStats(), fetchOwnerOpsReport(), fetchOpsInsights()])
                .then(async ([overviewData, ownerOps, opsData]) => {
                    if (!mounted) return;
                    let healthData = ownerOps?.systemHealth ?? null;
                    const securityData = ownerOps?.securitySignals ?? null;

                    if (!healthData || !securityData) {
                        const legacyHealth = await fetchSystemHealth();
                        healthData = healthData ?? legacyHealth;
                    }

                    setRemoteStats(overviewData ?? null);
                    setSystemHealth(healthData ?? null);
                    setSecuritySignals(securityData ?? null);
                    setOpsInsights(opsData ?? null);
                    setInitialLoading(false);
                })
                .catch(() => {
                    if (mounted) setInitialLoading(false);
                });
        };

        refresh();
        const timer = window.setInterval(refresh, 60_000);
        return () => {
            mounted = false;
            window.clearInterval(timer);
        };
    }, []);

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="flex flex-col items-center gap-4">
                    <ShieldCheck className="w-8 h-8 text-indigo-500 animate-pulse" />
                    <p className="text-slate-500 text-sm font-bold">تفعيل بروتوكولات الحماية والأمن...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6" dir="rtl">
            <header className="admin-glass-card rounded-2xl p-6 border-slate-800 flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/5 blur-[80px] rounded-full pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10 w-full md:w-auto mb-4 md:mb-0">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                        <ShieldCheck className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-black text-white tracking-tight">أمن النظام والعمليات</h2>
                            <AdminTooltip content="مراقبة العمليات الحساسة، حماية البيانات، وإدارة أزمات النظام والتدخل الجراحي الخبيث لبيانات المجتمع." position="bottom" />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                            <p className="text-sm font-medium text-indigo-400">مراقبة حية للتهديدات والأعطال</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <LiveFreezeGuard />
                <AIGuardrailCard />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {systemHealth && <SystemHealth data={systemHealth} loading={initialLoading} />}
                {securitySignals && <SecuritySentinel data={securitySignals} loading={initialLoading} />}
            </div>

            <SocialFirewall loading={initialLoading} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {opsInsights && <OpsInsights data={opsInsights} loading={initialLoading} />}
                <RecoveryWidget />
            </div>
        </div>
    );
};
