import type { FC } from "react";
import { useState, useCallback, useEffect, useMemo } from "react";
import { Compass, Zap, Workflow, Loader2, GitGraph, AlertTriangle } from "lucide-react";
import { fetchOverviewStats, type OverviewStats } from "../../../../services/adminApi";
import { useFleetState } from "../../../../state/fleetState";
import { FlowMindMap } from "../../FlowMindMap";
import { VISITOR_FLOW_LINKS, buildFlowNodes } from "../../../../data/visitorFlowWorkflow";

export const FlowMapPanel: FC = () => {
    const [stats, setStats] = useState<OverviewStats | null>(null);
    const [loading, setLoading] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchOverviewStats();
            setStats(data);
        } catch (error) {
            console.error("Failed to load flow stats", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const { isSandboxEnforced, activeVesselId, vessels } = useFleetState();
    const activeVessel = vessels.find(v => v.id === activeVesselId);

    const { nodes, links, flowMetrics } = useMemo(() => {
        if (!stats?.flowStats?.byStep) {
            return { nodes: [], links: [], flowMetrics: null };
        }

        const nodes = buildFlowNodes(stats.flowStats.byStep, {
            pulseAbandonedByReason: stats.flowStats.pulseAbandonedByReason
        });

        // Calculate basic metrics for the cards
        const rootNode = nodes.find(n => n.id === 'root');
        const totalVisits = rootNode?.count ?? 0;

        const successActions = ['profile-success-v2', 'install-success-v2', 's2-3', 's2-4'];
        const successCount = nodes
            .filter(n => successActions.includes(n.id))
            .reduce((acc, curr) => acc + (curr.count || 0), 0);

        const conversionRate = totalVisits > 0 ? Math.round((successCount / totalVisits) * 100) : 0;
        const dropOffRate = 100 - conversionRate;

        return {
            nodes,
            links: VISITOR_FLOW_LINKS,
            flowMetrics: { totalVisits, conversionRate, dropOffRate, successCount }
        };
    }, [stats]);

    if (isSandboxEnforced) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-8 space-y-6 bg-slate-950/20 rounded-3xl border border-white/5">
                <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/30 animate-pulse">
                    <Compass className="w-10 h-10 text-indigo-500" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-indigo-400 uppercase tracking-tighter">PROTOCOL: SECURE BRIDGE ACTIVE</h2>
                    <p className="text-slate-400 max-w-md mx-auto">
                        البوصلة مقفولة حالياً على إحداثيات المشغل: <span className="text-white font-bold">{activeVessel?.title}</span>.
                        تم حجب الخرائط العامة للحفاظ على مسار السفينة ومنع الانحراف الذهني.
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="px-4 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-400 uppercase">
                        Zero Distraction Mode
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 text-slate-200" dir="rtl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="admin-glass-card p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                        <Compass className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">إجمالي الزيارات</p>
                        <p className="text-xl font-black">{flowMetrics?.totalVisits ?? 0}</p>
                    </div>
                </div>
                <div className="admin-glass-card p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <Zap className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">معدل التحويل</p>
                        <p className="text-xl font-black text-emerald-400">{flowMetrics?.conversionRate ?? 0}%</p>
                    </div>
                </div>
                <div className="admin-glass-card p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                        <Workflow className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">معدل التسرب</p>
                        <p className="text-xl font-black text-rose-400">{flowMetrics?.dropOffRate ?? 0}%</p>
                    </div>
                </div>
                <div className="admin-glass-card p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                        <GitGraph className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">عمليات ناجحة</p>
                        <p className="text-xl font-black text-indigo-400">{flowMetrics?.successCount ?? 0}</p>
                    </div>
                </div>
            </div>

            <div className="admin-glass-card p-0 h-[600px] relative overflow-hidden group">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 z-10">
                        <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
                    </div>
                )}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.05),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                {/* Flow Mind Map with data */}
                <FlowMindMap nodes={nodes} links={links} />
            </div>

            <div className="flex justify-between items-center px-2">
                <p className="text-xs text-slate-500">
                    * يتم تحديث البيانات كل 5 دقائق. الخريطة تعكس تدفق الزوار عبر السيناريوهات المختلفة.
                </p>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                    <span className="text-xs text-slate-400">مسار ناجح</span>
                    <span className="w-2 h-2 rounded-full bg-rose-500 ml-2 mr-1" />
                    <span className="text-xs text-slate-400">فشل / خروج</span>
                </div>
            </div>
        </div>
    );
};
