import type { FC } from "react";
import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AlertOctagon, TrendingUp, Lock } from "lucide-react";
import type { OverviewStats } from "../../../../../services/adminApi";

interface GrowthAndFrictionProps {
    growthData: OverviewStats["growthData"];
    frictionData: OverviewStats["taskFriction"];
    loading: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs">
                <p className="text-slate-400 mb-2 font-mono">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-slate-300 capitalize">{entry.name}:</span>
                        <span className="font-bold text-white font-mono">{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export const GrowthAndFriction: FC<GrowthAndFrictionProps> = ({ growthData, frictionData, loading }) => {
    const [daysFilter, setDaysFilter] = useState<7 | 28>(7);

    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
                <div className="lg:col-span-2 h-80 bg-slate-900/40 rounded-2xl border border-slate-800 animate-pulse" />
                <div className="h-80 bg-slate-900/40 rounded-2xl border border-slate-800 animate-pulse" />
            </div>
        );
    }

    // Filter growth data based on days
    const filteredGrowth = growthData?.slice(-daysFilter) || [];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full" dir="rtl">

            {/* Growth Chart (Left in layout, but Right in LTR - wait, RTL layout means Right is Col 1 if ordered first?) */}
            {/* The image shows Chart on the Right and Friction on Left. In RTL, first element in grid is Right. */}

            {/* Right Column: Platform Growth */}
            <div className="lg:col-span-2 admin-glass-card p-6 border-white/5 bg-slate-950/30 rounded-2xl backdrop-blur-sm">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                            <span className="text-xs font-bold text-cyan-400">تحليل الميدان (Live)</span>
                        </div>
                        <h3 className="text-lg font-bold text-white">رادار النمو (Growth Radar)</h3>
                        <p className="text-xs text-slate-400">إجمالي توسع القادة (بدء المهام + رسم خريطة الجبهة)</p>
                    </div>

                    <div className="flex bg-slate-800/50 p-1 rounded-lg border border-white/5">
                        <button
                            onClick={() => setDaysFilter(7)}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${daysFilter === 7 ? "bg-emerald-500 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
                        >
                            آخر 7 أيام
                        </button>
                        <button
                            onClick={() => setDaysFilter(28)}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${daysFilter === 28 ? "bg-emerald-500 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
                        >
                            آخر 28 يومًا
                        </button>
                    </div>
                </div>

                <div className="h-64 w-full" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={filteredGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorPaths" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorNodes" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="#94a3b8"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => value.split('-').slice(1).join('-')} // Show MM-DD
                            />
                            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ffffff20' }} />
                            <Area
                                type="monotone"
                                dataKey="paths"
                                name="قادة"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorPaths)"
                            />
                            <Area
                                type="monotone"
                                dataKey="nodes"
                                name="أهداف"
                                stroke="#14b8a6"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorNodes)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Left Column: Top Friction Areas */}
            <div className="admin-glass-card p-6 border-white/5 bg-slate-950/30 rounded-2xl backdrop-blur-sm flex flex-col">
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                        <span className="text-xs font-bold text-rose-400">اعتراض الاشارة (Friction)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-slate-400" />
                        <h3 className="text-lg font-bold text-white">ثغرات الانسحاب (Drop-off)</h3>
                    </div>
                </div>

                <div className="flex-1 flex flex-col">
                    {(!frictionData || frictionData.length === 0) ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                            <AlertOctagon className="w-8 h-8 text-slate-600 mb-2 opacity-50" />
                            <p className="text-sm font-bold text-slate-500">لا توجد بيانات كافية بعد.</p>
                            <p className="text-xs text-slate-600 mt-1">يجب أن يسجل المستخدمون تفاعلات أكثر لتحديد الاحتكاك.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {frictionData.slice(0, 5).map((item, idx) => (
                                <div key={idx} className="bg-slate-900/40 p-3 rounded-xl border border-white/5 flex justify-between items-center group hover:border-rose-500/30 transition-colors">
                                    <div>
                                        <p className="text-sm font-bold text-slate-200 group-hover:text-rose-200">{item.label}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">بدأ {item.started} - أكمل {item.completed}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-black text-rose-400 tabular-nums">{item.escapeRate}%</span>
                                        <p className="text-[10px] text-rose-500/70 font-bold uppercase tracking-wider">هروب</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 text-center">
                    <p className="text-xs text-slate-500 font-mono" dir="ltr">Last pulse: 4h ago</p>
                </div>
            </div>
        </div>
    );
};
