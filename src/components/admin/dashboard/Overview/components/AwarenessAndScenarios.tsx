import type { FC } from "react";
import { Layers, Target, Compass } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import type { OverviewStats } from "@/services/admin/adminTypes";
import { AdminTooltip } from "./AdminTooltip";

interface AwarenessAndScenariosProps {
    zones: OverviewStats["zones"];
    topScenarios: OverviewStats["topScenarios"];
    awarenessGap: OverviewStats["awarenessGap"];
    loading: boolean;
}

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899'];

export const AwarenessAndScenarios: FC<AwarenessAndScenariosProps> = ({ zones, topScenarios, awarenessGap, loading }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full opacity-50 pointer-events-none mb-6">
                <div className="h-80 bg-slate-900/30 rounded-3xl border border-white/5 animate-pulse" />
                <div className="h-80 bg-slate-900/30 rounded-3xl border border-white/5 animate-pulse" />
            </div>
        );
    }

    const zonesData = zones && zones.length > 0 ? zones.map((z, i) => ({ ...z, fill: COLORS[i % COLORS.length] })) : [];
    const scenariosData = topScenarios || [];
    const totalZonesCount = zonesData.reduce((a, b) => a + b.count, 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mb-6" dir="rtl">

            {/* Awareness Zones Distribution */}
            <div className="admin-glass-card p-6 border border-white/5 bg-slate-950/60 rounded-3xl shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity" />

                <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-4 relative z-10">
                     <div className="flex items-start gap-4">
                        <div className="p-3 bg-slate-900 rounded-xl border border-cyan-500/20 shadow-lg ring-1 ring-white/5">
                            <Layers className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-1">
                                توزيع مناطق الوعي
                                <AdminTooltip content="تحليل لدوائر الوعي (الجسدي، العقلي، الشعوري..) اللي المستخدمين متمركزين فيها وبيستخدموا التطبيق عشان يحلوها." position="bottom" />
                            </h3>
                            <p className="text-[10px] text-slate-500 font-mono tracking-wider flex items-center gap-2">
                                <Compass className="w-3 h-3" />
                                CONSCIOUSNESS DISTRIBUTION
                            </p>
                        </div>
                    </div>
                </div>

                <div className="h-64 flex flex-col md:flex-row items-center justify-center gap-8 relative z-10">
                    {zonesData.length === 0 ? (
                        <div className="flex items-center justify-center p-8 border border-dashed border-slate-800 rounded-xl bg-slate-900/40 w-full">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">لا توجد بيانات كافية</span>
                        </div>
                    ) : (
                        <>
                            <div className="w-48 h-48 relative shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={zonesData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={65}
                                            outerRadius={90}
                                            paddingAngle={4}
                                            dataKey="count"
                                            stroke="none"
                                        >
                                            {zonesData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} className="hover:opacity-80 transition-opacity" />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                            contentStyle={{ 
                                                backgroundColor: 'rgba(10, 15, 30, 0.85)', 
                                                borderColor: 'rgba(6, 182, 212, 0.2)', 
                                                borderRadius: '12px', 
                                                fontSize: '11px', 
                                                fontWeight: 'bold', 
                                                backdropFilter: 'blur(16px)', 
                                                color: '#fff', 
                                                boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.9), inset 0 1px 1px rgba(255, 255, 255, 0.05)' 
                                            }}
                                            itemStyle={{ color: '#22d3ee', fontWeight: '900', paddingTop: '4px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none drop-shadow-md">
                                    <span className="text-2xl font-black text-white">{totalZonesCount}</span>
                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">مستخدم</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2.5 w-full md:w-auto h-full overflow-y-auto pr-2 custom-scrollbar">
                                 {awarenessGap && (
                                    <div className="flex items-center justify-between p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl mb-2 shadow-inner group/gap relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-transparent opacity-0 group-hover/gap:opacity-100 transition-opacity" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-rose-300 flex items-center gap-1.5">
                                            فجوة الوعي <AdminTooltip content="معدل انفصال المستخدمين عن واقعهم (Gap between actual state vs desired state)." position="top" />
                                        </span>
                                        <span className="text-xl font-black text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)] tabular-nums relative z-10">{awarenessGap.gapPercent}%</span>
                                    </div>
                                )}
                                {zonesData.map((zone, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-slate-900/40 p-2.5 rounded-xl border border-white/5 hover:bg-slate-900/60 transition-colors w-full group/zone">
                                        <div className="flex items-center gap-3">
                                             <div className="w-3.5 h-3.5 rounded-full shadow-inner ring-1 ring-white/10" style={{ backgroundColor: zone.fill, boxShadow: `0 0 10px ${zone.fill}80` }} />
                                             <span className="text-xs font-bold text-slate-200">{zone.label}</span>
                                        </div>
                                        <span className="text-xs font-black font-mono text-slate-400 bg-black/40 px-2 py-1 rounded-md">{zone.count}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Top Scenarios */}
            <div className="admin-glass-card p-6 border border-white/5 bg-slate-950/60 rounded-3xl shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity" />

                <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-4 relative z-10">
                     <div className="flex items-start gap-4">
                        <div className="p-3 bg-slate-900 rounded-xl border border-indigo-500/20 shadow-lg ring-1 ring-white/5">
                            <Target className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-1">
                                السيناريوهات (Scenarios)
                                <AdminTooltip content="أكتر المسارات أو حالات الاستخدام اللي المستخدمين بيمهتموا يقرؤوها أو يدخلوا فيها داخل المنصة." position="bottom" />
                            </h3>
                            <p className="text-[10px] text-slate-500 font-mono tracking-wider flex items-center gap-2">
                                MOST FREQUENT ARCHETYPES
                            </p>
                        </div>
                    </div>
                </div>

                <div className="h-64 overflow-y-auto pr-2 space-y-3 relative z-10 custom-scrollbar">
                    {scenariosData.length === 0 ? (
                        <div className="flex items-center justify-center h-full border border-dashed border-slate-800 rounded-xl bg-slate-900/40 w-full">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">لا توجد بيانات سيناريوهات</span>
                        </div>
                    ) : (
                        scenariosData.map((scenario, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-slate-900/60 rounded-2xl border border-white/5 hover:bg-slate-900/80 transition-all shadow-inner group/scene">
                                <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-sm font-black text-indigo-300 shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                                        #{idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-slate-200 truncate tracking-wide">{scenario.label}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="h-1.5 flex-1 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                                                <div className="h-full bg-indigo-400 group-hover/scene:shadow-[0_0_8px_rgba(99,102,241,0.8)] transition-all" style={{ width: `${Math.min(100, (scenario.count / (scenariosData[0].count || 1)) * 100)}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-r border-white/5 pt-3 sm:pt-0 sm:pr-4 shrink-0">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest sm:mb-1">نصف القطر المنجز</span>
                                    <span className="text-lg font-black font-mono text-indigo-300 drop-shadow-md">{scenario.count}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
    );
};
