import type { FC } from "react";
import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { AlertOctagon, TrendingUp, Lock, Radar } from "lucide-react";
import type { OverviewStats } from "@/services/admin/adminTypes";
import { AdminTooltip } from "./AdminTooltip";

interface GrowthAndFrictionProps {
    growthData: OverviewStats["growthData"];
    frictionData: OverviewStats["taskFriction"];
    loading: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="admin-glass-card p-4 rounded-xl text-xs z-50">
                <p className="text-slate-400 mb-3 font-mono font-bold border-b border-white/5 pb-2 text-center drop-shadow-md">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-4 mb-2 last:mb-0">
                        <div className="flex items-center gap-2">
                             <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color, boxShadow: `0 0 8px ${entry.color}` }} />
                             <span className="text-slate-300 capitalize font-bold">{entry.name}</span>
                        </div>
                        <span className="font-black text-white tabular-nums drop-shadow-md">{entry.value}</span>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full animate-pulse">
                <div className="lg:col-span-2 h-96 bg-slate-900/30 rounded-3xl border border-white/5" />
                <div className="h-96 bg-slate-900/30 rounded-3xl border border-white/5" />
            </div>
        );
    }

    // Filter growth data based on days
    const filteredGrowth = growthData?.slice(-daysFilter) || [];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full" dir="rtl">

            {/* Right Column: Platform Growth (Radar) */}
            <div className="lg:col-span-2 admin-glass-card p-6 md:p-8 border border-white/5 bg-slate-950/60 shadow-2xl rounded-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[150px] rounded-full pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity" />

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-white/5 pb-4 relative z-10 gap-4">
                    <div className="flex items-start gap-4">
                         <div className="p-3 bg-slate-900 rounded-xl border border-cyan-500/20 shadow-lg ring-1 ring-white/5">
                            <Radar className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
                                    رادار النمو (Growth Radar)
                                    <AdminTooltip content="مؤشر لتوسع الاستخدام جوة المنصة (إطلاق مسارات جديدة، إضافة دوائر وأهداف) مش مجرد اشتراكات. ده نمو التفاعل الحقيقي (Activation)." position="bottom" />
                                </h3>
                            </div>
                            <p className="text-[10px] text-slate-500 font-mono tracking-wider flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                                LIVE PLATFORM EXPANSION
                            </p>
                        </div>
                    </div>

                    <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/5 shadow-inner backdrop-blur-sm self-start sm:self-auto">
                        <button
                            onClick={() => setDaysFilter(7)}
                            className={`px-4 py-2 text-xs font-black tracking-widest uppercase rounded-lg transition-all drop-shadow-md ${daysFilter === 7 ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-500 hover:text-slate-300"}`}
                        >
                            آخر 7 أيام
                        </button>
                        <button
                            onClick={() => setDaysFilter(28)}
                            className={`px-4 py-2 text-xs font-black tracking-widest uppercase rounded-lg transition-all drop-shadow-md ${daysFilter === 28 ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-500 hover:text-slate-300"}`}
                        >
                            آخر 28 يوم
                        </button>
                    </div>
                </div>

                <div className="w-full relative z-10" dir="ltr" style={{ width: '100%', height: 288 }}>
                    <ResponsiveContainer width="99%" height={288}>
                        <AreaChart data={filteredGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorPaths" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorNodes" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="#64748b"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value: string) => value.split("-").slice(1).join("-")}
                            />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                            <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#ffffff20', strokeWidth: 2 }} />
                            <Area
                                type="monotone"
                                dataKey="paths"
                                name="المسارات المبدوءة"
                                stroke="#22d3ee"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorPaths)"
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#22d3ee', style: { filter: 'drop-shadow(0px 0px 5px rgba(34,211,238,0.8))' } }}
                            />
                            <Area
                                type="monotone"
                                dataKey="nodes"
                                name="الأهداف/الدوائر"
                                stroke="#818cf8"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorNodes)"
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#818cf8', style: { filter: 'drop-shadow(0px 0px 5px rgba(129,140,248,0.8))' } }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Left Column: Top Friction Areas */}
            <div className="admin-glass-card p-6 md:p-8 border border-white/5 bg-slate-950/60 shadow-2xl rounded-3xl relative overflow-hidden group flex flex-col">
                 <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-rose-500/10 blur-[100px] rounded-full pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity" />

                 <div className="mb-6 border-b border-white/5 pb-4 relative z-10">
                     <div className="flex items-start gap-4">
                        <div className="p-3 bg-slate-900 rounded-xl border border-rose-500/20 shadow-lg ring-1 ring-white/5">
                            <Lock className="w-5 h-5 text-rose-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-1">
                                اعتراض الإشارة (Friction)
                                <AdminTooltip content="أماكن الإحباط! فين المستخدم بيبدأ الإعدادات أو المسار ويقوم قافل التطبيق قبل ما يكمل؟ ده بيساعدك تصلح الكوبي رايتنج أو تسهل الـ UX هنا لتقليل التسرب." position="bottom" />
                            </h3>
                            <p className="text-[10px] text-slate-500 font-mono tracking-wider flex items-center gap-2">
                                HIGH-FRICTION DROP-OFFS
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col relative z-10">
                    {(!frictionData || frictionData.length === 0) ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-xl bg-slate-900/40 shadow-inner">
                            <div className="p-3 rounded-full bg-slate-800 mb-3 grayscale opacity-50"><AlertOctagon className="w-6 h-6 text-slate-400" /></div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">لا توجد بيانات احتكاك</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {frictionData.slice(0, 5).map((item, idx) => (
                                <div key={idx} className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 flex justify-between items-center group/fric hover:bg-slate-900/80 hover:border-rose-500/20 transition-all shadow-inner relative overflow-hidden">
                                     <div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-rose-400 to-rose-600 opacity-0 group-hover/fric:opacity-100 transition-opacity" />
                                     <div>
                                        <p className="text-xs font-black text-slate-200 group-hover/fric:text-rose-200 transition-colors">{item.label}</p>
                                        <p className="text-[10px] text-slate-500 mt-1 font-mono tracking-wider">
                                            STARTED: <span className="text-slate-300 font-bold">{item.started}</span> | FINISHED: <span className="text-emerald-400 font-bold">{item.completed}</span>
                                        </p>
                                    </div>
                                    <div className="text-left flex flex-col items-end">
                                        <span className="text-xl font-black text-rose-400 tabular-nums drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]">{item.escapeRate}%</span>
                                        <span className="text-[9px] text-rose-500/80 font-black uppercase tracking-widest bg-rose-500/10 px-2 py-0.5 rounded-md mt-1 border border-rose-500/20">هروب</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 text-center relative z-10 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500/50" /> تحليل التسريب</span>
                    <span className="text-[9px] text-slate-500 font-mono tracking-wider bg-black/30 px-2 py-1 rounded-md" dir="ltr">Live Monitoring Active</span>
                </div>
            </div>
        </div>
    );
};
