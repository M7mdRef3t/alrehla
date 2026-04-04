import type { FC } from "react";
import { useEffect, useState } from "react";
import { Activity, Zap, ShieldAlert } from "lucide-react";

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
                    <Zap className="w-8 h-8 text-emerald-500 animate-pulse drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    <p className="text-emerald-500/80 text-sm font-black uppercase tracking-widest">جاري سحب قراءات طاقة الخزانة...</p>
                </div>
            </div>
        );
    }

    const flowStats = remoteStats.flowStats;
    const errorLogs = remoteStats.emergencyLogs ?? [];

    return (
        <div className="space-y-6" dir="rtl">
            <header className="admin-glass-card rounded-2xl p-6 border-slate-800 flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 blur-[80px] rounded-full pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10 w-full md:w-auto mb-4 md:mb-0">
                    <div className="p-3 bg-slate-900 rounded-xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        <Zap className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">الخزانة السيادية (Revenue Nexus)</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                            <p className="text-sm font-medium text-emerald-400">رصد حي لتدفقات الطاقة وعوائد الاستحواذ</p>
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
