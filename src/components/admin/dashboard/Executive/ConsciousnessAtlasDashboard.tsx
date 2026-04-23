import type { FC } from "react";
import { useEffect, useState } from "react";
import { Workflow, Compass } from "lucide-react";

import { fetchOverviewStats } from "@/services/admin/adminAnalytics";
import { type OverviewStats } from "@/services/admin/adminTypes";
import { ConsciousnessMap } from "../Consciousness/ConsciousnessMap";
import { AwarenessAndScenarios } from "../Overview/components/AwarenessAndScenarios";
import { AdminTooltip } from "../Overview/components/AdminTooltip";

export const ConsciousnessAtlasDashboard: FC = () => {
    const [remoteStats, setRemoteStats] = useState<OverviewStats | null>(null);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const refresh = async () => {
            try {
                const overviewData = await fetchOverviewStats();
                if (mounted) {
                    setRemoteStats(overviewData ?? null);
                    setInitialLoading(false);
                }
            } catch {
                if (mounted) setInitialLoading(false);
            }
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
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
                <div className="relative">
                     <div className="absolute inset-0 bg-teal-500/20 blur-xl rounded-full animate-pulse" />
                     <Workflow className="w-12 h-12 text-teal-400 animate-pulse relative z-10" />
                 </div>
                <p className="text-slate-400 text-sm font-black uppercase tracking-widest text-shadow-sm">جاري تحميل خريطة الوعي والحالة...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
            <header className="admin-glass-card border-none bg-slate-950/60 shadow-2xl rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-teal-500/10 blur-[150px] rounded-full pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity duration-1000" />
                
                <div className="flex items-center gap-6 relative z-10 w-full md:w-auto mb-4 md:mb-0">
                    <div className="p-4 bg-slate-900/80 rounded-2xl border border-teal-500/20 shadow-lg ring-1 ring-white/5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-teal-500/10 opacity-50 group-hover:opacity-80 transition-opacity" />
                        <Workflow className="w-8 h-8 text-teal-400 relative z-10 hover:rotate-12 transition-transform" />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-1 flex items-center gap-3">
                            أطلس الوعي الديناميكي
                            <AdminTooltip content="مركز تحرير الوعي. الخريطة اللي قدامك بتمثل الحركات الديناميكية للوعي الجمعي للمستخدمين جوة التطبيق. النقاط البراقة بتمثل بؤر وعي عالية." position="bottom" />
                        </h2>
                        <div className="flex items-center gap-2 mt-2 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 w-fit">
                            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
                            <p className="text-xs font-black uppercase tracking-widest text-teal-400">تجسيد خريطة الوعي والمزاج العام (Live Orbit)</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Core Consciousness Map Container */}
            <div className="admin-glass-card border border-white/5 rounded-3xl overflow-hidden h-[600px] relative shadow-2xl group/map bg-[#030712] p-1">
               <div className="absolute top-4 left-4 z-20">
                   <AdminTooltip content="تقدر تحرك الخريطة دي بالماوس، وتعمل Zoom in/out عشان تراقب تشابك العلاقات وبؤر الطاقة." position="bottom" />
               </div>
               <div className="w-full h-full rounded-[20px] overflow-hidden border border-white/5 relative">
                   {/* Fallback overlay incase WebGL context isn't fully transparent feeling */}
                   <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(45,212,191,0.02),transparent_60%)] pointer-events-none" />
                   <ConsciousnessMap />
               </div>
            </div>

            <div className="mt-8 relative z-10">
                <AwarenessAndScenarios
                    zones={remoteStats?.zones ?? []}
                    topScenarios={remoteStats?.topScenarios ?? null}
                    awarenessGap={remoteStats?.awarenessGap ?? null}
                    loading={initialLoading}
                />
            </div>
        </div>
    );
};
