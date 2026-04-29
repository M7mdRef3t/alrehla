import type { FC } from "react";
import { useEffect, useState } from "react";
import { ShieldAlert, Activity } from "lucide-react";
import { AdminTooltip } from "../Overview/components/AdminTooltip";

import AlertsPanel from "../../WarRoom/AlertsPanel";
import { SocialFirewall } from "../Overview/components/SocialFirewall";
import { LiveFreezeGuard } from "../Overview/components/LiveFreezeGuard";
import { AIGuardrailCard } from "../Overview/components/AIGuardrailCard";
import { SecuritySentinel } from "../Overview/components/SecuritySentinel";
import { SystemHealth } from "../Overview/components/SystemHealth";
import { RecoveryWidget } from "../Overview/components/RecoveryWidget";
import { OpsInsights } from "../Overview/components/OpsInsights";
import { TruthCallerMiniFeed } from "../Users/TruthCallerMiniFeed";

import { fetchOverviewStats } from "@/services/admin/adminAnalytics";
import { fetchSystemHealth, fetchOwnerOpsReport, fetchOpsInsights } from "@/services/admin/adminReports";
import { type OverviewStats } from "@/services/admin/adminTypes";
import type { SystemHealthReport, SecuritySignalsReport, OpsInsights as OpsInsightsType } from "@/types/admin.types";

export const CommandWarRoom: FC = () => {
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
                    <ShieldAlert className="w-8 h-8 text-rose-500 animate-pulse" />
                    <p className="text-slate-500 text-sm font-bold tracking-widest uppercase">تفعيل بروتوكولات غرفة العمليات المركزية...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto" dir="rtl">
            
            {/* Proactive Intervention Radar */}
            <TruthCallerMiniFeed />
            
            {/* Primary Radar - Alerts */}
            <AlertsPanel />

            {/* Sub-System Diagnostics */}
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
