import type { FC } from "react";
import { useEffect, useState } from "react";
import { Activity, Zap, ShieldAlert, Zap as Sparkles } from "lucide-react";
import { motion } from "framer-motion";

import { RevenueEngineCard } from "../Overview/components/RevenueEngineCard";
import { EmotionalPricingCard } from "../Overview/components/EmotionalPricingCard";
import { MarketingLeadsPanel } from "../Overview/components/MarketingLeadsPanel";
import { FunnelAndEmergency } from "../Overview/components/FunnelAndEmergency";
import { ConversionDiagnosis } from "../Overview/components/ConversionDiagnosis";
import { MarketingAndRetention } from "../Overview/components/MarketingAndRetention";
import { SupportTicketsPanel } from "../Overview/components/SupportTicketsPanel";
import { PromoCodesPanel } from "../Overview/components/PromoCodesPanel";

import { fetchOverviewStats } from "@/services/admin/adminAnalytics";
import { type OverviewStats, type WeeklyReport } from "@/services/admin/adminTypes";
import { fetchWeeklyReport } from "@/services/admin/adminReports";

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
            <header className="admin-glass-card rounded-3xl p-8 border-slate-700/50 flex flex-col md:flex-row items-center justify-between relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div className="absolute -top-10 -right-10 w-80 h-80 bg-emerald-500/15 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-teal-500/15 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent pointer-events-none" />
                <div className="flex items-center gap-5 relative z-10 w-full md:w-auto mb-4 md:mb-0">
                    <div className="p-4 bg-white/5 backdrop-blur-xl rounded-2xl border border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.25)]">
                        <Zap className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">خزانة الرحلة (Revenue Nexus)</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                            <p className="text-sm font-medium text-emerald-400">رصد حي لتدفقات الطاقة وعوائد الاستحواذ</p>
                        </div>
                    </div>
                </div>
            </header>
            
            {/* Business Harmony Index (LTV/CAC Resonance) */}
            <div className="hud-glass p-8 rounded-3xl border-emerald-500/20 relative overflow-hidden group bg-[#0B0F19]/40 backdrop-blur-3xl shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                <div className="hud-edge-accent top-0 right-0" />
                <div className="hud-edge-accent bottom-0 left-0" />
                
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-2 text-emerald-400">
                            <Activity className="w-5 h-5 animate-pulse" />
                            <h3 className="text-lg font-black uppercase tracking-tighter">مؤشر تناغم الأعمال (Business Harmony Index)</h3>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
                            قياس التوازن الحيوي بين تكلفة الاستحواذ (CAC) والقيمة التراكمية (LTV). رنين مرتفع يعني نمو ذاتي مستدام بدون إهدار طاقة.
                        </p>
                        <div className="flex gap-6 pt-2">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">كفاءة الاستحواذ</span>
                                <span className="text-xl font-bold text-white">عالية (High)</span>
                            </div>
                            <div className="w-px h-10 bg-white/5" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">رنين القيمة (LTV)</span>
                                <span className="text-xl font-bold text-white">4.2x <span className="text-xs text-emerald-500 font-black">+12%</span></span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center p-6 bg-white/5 backdrop-blur-2xl rounded-3xl border border-emerald-500/20 min-w-[200px] shadow-[0_0_30px_rgba(16,185,129,0.05)] hover:border-emerald-500/40 hover:shadow-[0_0_40px_rgba(16,185,129,0.15)] transition-all duration-500">
                        <div className="relative mb-3">
                            <motion.div 
                                animate={{ scale: [1, 1.05, 1], rotate: [0, 5, 0] }}
                                transition={{ duration: 6, repeat: Infinity }}
                                className="w-20 h-20 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 flex items-center justify-center"
                            >
                                <span className="text-2xl font-black text-emerald-400">92%</span>
                            </motion.div>
                        </div>
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] animate-resonance-glow px-5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]">رنين فائق</span>
                    </div>
                </div>
            </div>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SupportTicketsPanel />
                <PromoCodesPanel />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <MarketingLeadsPanel data={remoteStats.potentialTravelers} loading={initialLoading} />
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
