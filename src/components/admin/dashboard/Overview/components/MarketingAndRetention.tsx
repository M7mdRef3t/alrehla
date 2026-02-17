import type { FC } from "react";
import { Users, BarChart, Target } from "lucide-react";
import type { OverviewStats, RetentionCohortRow, UtmBreakdownEntry } from "../../../../../services/adminApi";

interface MarketingAndRetentionProps {
    utmBreakdown: { sources: UtmBreakdownEntry[]; mediums: UtmBreakdownEntry[]; campaigns: UtmBreakdownEntry[] } | null | undefined;
    retentionCohorts: RetentionCohortRow[] | null | undefined;
    loading: boolean;
}

const fmtPct = (val?: number | null) => (val != null ? `${val}%` : "-");

const getColor = (val?: number | null) => {
    if (!val) return "text-slate-600";
    if (val > 50) return "text-emerald-400 font-bold";
    if (val > 20) return "text-teal-400";
    if (val > 10) return "text-amber-400";
    return "text-rose-400";
};

export const MarketingAndRetention: FC<MarketingAndRetentionProps> = ({ utmBreakdown, retentionCohorts, loading }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full opacity-50 pointer-events-none mb-6">
                <div className="h-64 bg-slate-900/20 rounded-2xl animate-pulse" />
                <div className="h-64 bg-slate-900/20 rounded-2xl animate-pulse" />
            </div>
        );
    }

    const sources = utmBreakdown?.sources || [];
    const cohorts = retentionCohorts || [];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mb-6" dir="rtl">

            {/* UTM Breakdown (Sources) */}
            <div className="admin-glass-card p-6 border-white/5 bg-slate-950/30 rounded-2xl backdrop-blur-sm">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Target className="w-5 h-5 text-slate-400" />
                            <h3 className="text-lg font-bold text-white">مصادر الزيارات</h3>
                        </div>
                        <p className="text-xs text-slate-400">من أين يأتي الزوار؟</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {sources.length === 0 ? (
                        <div className="text-slate-500 text-sm text-center py-6">لا توجد بيانات للمصادر</div>
                    ) : (
                        sources.map((src, idx) => (
                            <div key={idx} className="flex justify-between items-center py-2 px-3 rounded-lg bg-slate-800/20 border border-white/5">
                                <div className="flex-1">
                                    <span className="text-sm font-bold text-slate-300 block">{src.key || "Direct"}</span>
                                    <div className="w-full bg-slate-800 mt-1 rounded-full overflow-hidden h-1">
                                        <div className="h-full bg-teal-500" style={{ width: `${sources[0]?.count ? (src.count / sources[0].count) * 100 : 0}%` }} />
                                    </div>
                                </div>
                                <span className="text-sm font-mono text-emerald-400 mr-4">{src.count}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Retention Cohorts */}
            <div className="admin-glass-card p-6 border-white/5 bg-slate-950/30 rounded-2xl backdrop-blur-sm">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Users className="w-5 h-5 text-slate-400" />
                            <h3 className="text-lg font-bold text-white">الاحتفاظ بالمستخدمين (Cohorts)</h3>
                        </div>
                        <p className="text-xs text-slate-400">نسبة العودة خلال 30 يوم</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {cohorts.length === 0 ? (
                        <div className="text-slate-500 text-sm text-center py-6">لا توجد بيانات للاحتفاظ</div>
                    ) : (
                        <table className="w-full text-right text-[10px] font-mono border-collapse" dir="ltr">
                            <thead>
                                <tr className="bg-slate-800/50 text-slate-300 border-b border-white/10">
                                    <th className="p-2 text-left">Date</th>
                                    <th className="p-2">Users</th>
                                    <th className="p-2">Day 1</th>
                                    <th className="p-2">Day 3</th>
                                    <th className="p-2">Day 7</th>
                                    <th className="p-2">Day 30</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cohorts.map((row) => (
                                    <tr key={row.cohortDate} className="border-b border-white/5 last:border-none hover:bg-white/5 transition-colors text-slate-400">
                                        <td className="p-2 font-bold text-slate-200 text-left">{row.cohortDate}</td>
                                        <td className="p-2">{row.cohortSize}</td>
                                        <td className={`p-2 ${getColor(row.d1Pct)}`}>{fmtPct(row.d1Pct)}</td>
                                        <td className={`p-2 ${getColor(row.d3Pct)}`}>{fmtPct(row.d3Pct)}</td>
                                        <td className={`p-2 ${getColor(row.d7Pct)}`}>{fmtPct(row.d7Pct)}</td>
                                        <td className={`p-2 ${getColor(row.d30Pct)}`}>{fmtPct(row.d30Pct)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

        </div>
    );
};
