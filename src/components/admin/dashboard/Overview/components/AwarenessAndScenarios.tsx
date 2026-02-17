import type { FC } from "react";
import { Layers, MapPin, Target } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, YAxis } from "recharts";
import type { OverviewStats } from "../../../../../services/adminApi";

interface AwarenessAndScenariosProps {
    zones: OverviewStats["zones"];
    topScenarios: OverviewStats["topScenarios"];
    awarenessGap: OverviewStats["awarenessGap"];
    loading: boolean;
}

const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#ef4444', '#a855f7'];

export const AwarenessAndScenarios: FC<AwarenessAndScenariosProps> = ({ zones, topScenarios, awarenessGap, loading }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full opacity-50 pointer-events-none mb-6">
                <div className="h-64 bg-slate-900/20 rounded-2xl animate-pulse" />
                <div className="h-64 bg-slate-900/20 rounded-2xl animate-pulse" />
            </div>
        );
    }

    const zonesData = zones && zones.length > 0 ? zones.map((z, i) => ({ ...z, fill: COLORS[i % COLORS.length] })) : [];
    const scenariosData = topScenarios || [];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mb-6" dir="rtl">

            {/* Awareness Zones Distribution */}
            <div className="admin-glass-card p-6 border-white/5 bg-slate-950/30 rounded-2xl backdrop-blur-sm">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Layers className="w-5 h-5 text-slate-400" />
                            <h3 className="text-lg font-bold text-white">توزيع مناطق الوعي</h3>
                        </div>
                        <p className="text-xs text-slate-400">توزيع المستخدمين حسب مستوى الوعي الحالي</p>
                    </div>
                    {awarenessGap && (
                        <div className="text-left">
                            <span className="text-[10px] text-slate-500 block">فجوة الوعي</span>
                            <span className="text-sm font-bold text-rose-400 font-mono">{awarenessGap.gapPercent}%</span>
                        </div>
                    )}
                </div>

                <div className="h-64 flex flex-col md:flex-row items-center justify-center gap-8">
                    {zonesData.length === 0 ? (
                        <div className="text-slate-500 text-sm">لا توجد بيانات كافية</div>
                    ) : (
                        <>
                            <div className="w-48 h-48 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={zonesData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="count"
                                        >
                                            {zonesData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} stroke="rgba(0,0,0,0.1)" />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                                            itemStyle={{ color: '#e2e8f0' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="text-2xl font-bold text-white">{zonesData.reduce((a, b) => a + b.count, 0)}</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                {zonesData.map((zone, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-xs">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.fill }} />
                                        <span className="text-slate-300 font-medium">{zone.label}</span>
                                        <span className="text-slate-500 font-mono">({zone.count})</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Top Scenarios */}
            <div className="admin-glass-card p-6 border-white/5 bg-slate-950/30 rounded-2xl backdrop-blur-sm">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Target className="w-5 h-5 text-slate-400" />
                            <h3 className="text-lg font-bold text-white">السيناريوهات الأكثر شيوعاً</h3>
                        </div>
                        <p className="text-xs text-slate-400">أي المسارات يفضلها المستخدمون؟</p>
                    </div>
                </div>

                <div className="h-64 overflow-y-auto pr-2 space-y-3">
                    {scenariosData.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-500 text-sm">لا توجد بيانات سيناريوهات</div>
                    ) : (
                        scenariosData.map((scenario, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl border border-white/5 hover:bg-slate-800/60 transition-colors">
                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                                    {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-200 truncate">{scenario.label}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="h-1.5 flex-1 bg-slate-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (scenario.count / (scenariosData[0].count || 1)) * 100)}%` }} />
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-sm font-bold text-white block">{scenario.count}</span>
                                    <span className="text-[10px] text-slate-500 block">اكتمال</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
    );
};
