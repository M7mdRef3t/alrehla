import type { FC } from "react";
import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

import { RevenueEngineCard } from "../Overview/components/RevenueEngineCard";
import { EmotionalPricingCard } from "../Overview/components/EmotionalPricingCard";
import { MarketingLeadsPanel } from "../Overview/components/MarketingLeadsPanel";
import { FunnelAndEmergency } from "../Overview/components/FunnelAndEmergency";
import { ConversionDiagnosis } from "../Overview/components/ConversionDiagnosis";
import { MarketingAndRetention } from "../Overview/components/MarketingAndRetention";

import { fetchOverviewStats, type OverviewStats, fetchWeeklyReport, type WeeklyReport } from "../../../../services/adminApi";

export const GrowthRevenueDashboard: FC = () => {
    const [remoteStats, setRemoteStats] = useState<OverviewStats | null>(null);
    const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
    const [weeklyWindow, setWeeklyWindow] = useState<7 | 14 | 30>(7);
    const [initialLoading, setInitialLoading] = useState(true);

    const refreshRevenueReport = async (days: 7 | 14 | 30 = weeklyWindow) => {
        const weeklyData = await fetchWeeklyReport(days);
        setWeeklyReport(weeklyData ?? null);
        if (weeklyWindow !== days) setWeeklyWindow(days);
    };

    useEffect(() => {
        let mounted = true;
        
        const refresh = () => {
            Promise.all([fetchOverviewStats(), fetchWeeklyReport(weeklyWindow)])
                .then(([overviewData, weeklyData]) => {
                    if (!mounted) return;
                    setRemoteStats(overviewData ?? null);
                    setWeeklyReport(weeklyData ?? null);
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
    }, [weeklyWindow]);

    if (initialLoading || !remoteStats) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="flex flex-col items-center gap-4">
                    <Activity className="w-8 h-8 text-rose-500 animate-pulse" />
                    <p className="text-slate-500 text-sm font-bold">جاري تشفير مسارات الاستحواذ والنمو...</p>
                </div>
            </div>
        );
    }

    const flowStats = remoteStats.flowStats;
    const errorLogs = remoteStats.emergencyLogs ?? [];

    return (
        <div className="space-y-6" dir="rtl">
            <header className="admin-glass-card rounded-2xl p-6 border-slate-800 flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/5 blur-[80px] rounded-full pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10 w-full md:w-auto mb-4 md:mb-0">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                        <Activity className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">محرك النمو والمبيعات</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                            <p className="text-sm font-medium text-amber-400">تحليلات حية للاستحواذ والتحويل</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <RevenueEngineCard
                    data={weeklyReport}
                    loading={initialLoading}
                    windowDays={weeklyWindow}
                    onWindowChange={refreshRevenueReport}
                    onRefresh={refreshRevenueReport}
                 />
                 <EmotionalPricingCard loading={initialLoading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <MarketingLeadsPanel data={remoteStats.marketingLeads} loading={initialLoading} />
                <FunnelAndEmergency 
                  funnelData={remoteStats.funnel} 
                  emergencyData={remoteStats.emergencyLogs ?? []} 
                  loading={initialLoading} 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                 <ConversionDiagnosis data={remoteStats.conversionHealth ?? null} loading={initialLoading} />
                 <MarketingAndRetention 
                    utmBreakdown={remoteStats.utmBreakdown} 
                    retentionCohorts={remoteStats.retentionCohorts} 
                    loading={initialLoading} 
                 />
            </div>
        </div>
    );
};
