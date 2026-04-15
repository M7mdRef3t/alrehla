import { useMemo, type FC } from "react";
import { Users, Target, Zap } from "lucide-react";
import type { RetentionCohortRow, UtmBreakdownEntry } from "@/services/adminApi";
import { decideVisualGeneLayout } from "@/services/visualGenes";
import { AdminTooltip } from "./AdminTooltip";
import { CollapsibleSection } from "../../../ui/CollapsibleSection";
interface MarketingAndRetentionProps {
    utmBreakdown: { sources: UtmBreakdownEntry[]; mediums: UtmBreakdownEntry[]; campaigns: UtmBreakdownEntry[] } | null | undefined;
    retentionCohorts: RetentionCohortRow[] | null | undefined;
    loading: boolean;
}

const fmtPct = (val?: number | null) => (val != null ? `${val}%` : "-");

const getColor = (val?: number | null) => {
    if (!val) return "text-slate-600";
    if (val > 50) return "text-emerald-400 font-black drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]";
    if (val > 20) return "text-teal-400 font-bold";
    if (val > 10) return "text-amber-400 font-medium";
    return "text-rose-400 opacity-80";
};

export const MarketingAndRetention: FC<MarketingAndRetentionProps> = ({ utmBreakdown, retentionCohorts, loading }) => {
    const sources = utmBreakdown?.sources || [];
    const cohorts = retentionCohorts || [];
    const sourcesGene = useMemo(
        () => decideVisualGeneLayout({ featureKey: "marketing_sources", itemCount: sources.length, fieldCount: 3 }),
        [sources.length]
    );
    const cohortsGene = useMemo(
        () => decideVisualGeneLayout({ featureKey: "retention_cohorts", itemCount: cohorts.length, fieldCount: 6 }),
        [cohorts.length]
    );

    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full opacity-50 pointer-events-none mb-6">
                <div className="h-64 bg-slate-900/30 rounded-3xl border border-white/5 animate-pulse" />
                <div className="h-64 bg-slate-900/30 rounded-3xl border border-white/5 animate-pulse" />
            </div>
        );
    }

    return (
        <CollapsibleSection title="التسويق والاستبقاء" icon={<Target className="w-5 h-5 text-teal-400" />} headerColors="border-teal-500/10 bg-slate-900/40 text-slate-300" defaultExpanded={false}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mb-6" dir="rtl">

            {/* UTM Breakdown (Sources) */}
            <div className="admin-glass-card p-6 border border-white/5 bg-slate-950/60 rounded-3xl shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity" />
                
                <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-4 relative z-10">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-slate-900 rounded-xl border border-teal-500/20 shadow-lg ring-1 ring-white/5">
                            <Target className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-1">
                                قوة مصادر الزيارات
                                <AdminTooltip content="تحليل لـ (utm_source). لو بتبعت ترافيك من تيك توك، جوجل، أو انستجرام، هنا هتتأكد بيكملوا لحد جوا ولا لأ وتشوف العدد الكلي." position="bottom" />
                            </h3>
                            <p className="text-[10px] text-slate-500 font-mono tracking-wider flex items-center gap-2">
                                تحليل منشأ الزيارات (TRAFFIC ORIGINS)
                            </p>
                        </div>
                    </div>
                </div>

                <div className={`relative z-10 ${sourcesGene.container === "grid" ? "grid grid-cols-1 gap-3" : "space-y-3"}`}>
                    {sources.length === 0 ? (
                        <div className="flex items-center justify-center p-8 border border-dashed border-slate-800 rounded-xl bg-slate-900/40">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">لا توجد بيانات للمصادر</span>
                        </div>
                    ) : (
                        sources.map((src, idx) => (
                            <div key={idx} className={`relative flex justify-between items-center px-4 rounded-xl bg-slate-900/60 border border-white/5 hover:bg-slate-900/80 transition-all overflow-hidden group/source ${sourcesGene.detail === "compact" ? "py-2.5" : "py-3"}`}>
                                <div className="absolute left-0 top-0 h-full w-1 bg-teal-500 opacity-0 group-hover/source:opacity-100 transition-opacity" />
                                <div className="flex-1">
                                    <span className="text-sm font-bold text-slate-200 block tracking-wide">{src.key || "مباشر / غير محدد"}</span>
                                    <div className="w-full bg-slate-950 mt-2 rounded-full overflow-hidden h-1 border border-white/5">
                                        <div className="h-full bg-teal-400 group-hover/source:shadow-[0_0_10px_rgba(45,212,191,0.5)] transition-all" style={{ width: `${sources[0]?.count ? (src.count / sources[0].count) * 100 : 0}%` }} />
                                    </div>
                                </div>
                                <span className="text-sm font-black font-mono text-teal-300 mr-6 px-3 py-1 bg-black/40 rounded-lg">{src.count.toLocaleString("en-US")}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Retention Cohorts */}
            <div className="admin-glass-card p-6 border border-white/5 bg-slate-950/60 rounded-3xl shadow-2xl relative overflow-hidden group">
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity" />
                
                <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-4 relative z-10">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-slate-900 rounded-xl border border-indigo-500/20 shadow-lg ring-1 ring-white/5">
                            <Users className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-1">
                                استبقاء المستخدمين (Cohorts)
                                <AdminTooltip content="دي أهم مصفوفة للنمو! بتوريك اللي اشتركوا في يوم معين (الـ Users)، كام في المية منهم رجع دخل المنصة تاني بعد يوم، و3 أيام، و7 أيام. لو الرقم بيموت بسرعة، يبقى المنتج مش بيشد الشريحة دي." position="bottom" />
                            </h3>
                            <p className="text-[10px] text-slate-500 font-mono tracking-wider flex items-center gap-2">
                                <Zap className="w-3 h-3 text-amber-500/70" />
                                الاستبقاء بعد الاستحواذ (30 يوم)
                            </p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto relative z-10 pb-2">
                    {cohorts.length === 0 ? (
                        <div className="flex items-center justify-center p-8 border border-dashed border-slate-800 rounded-xl bg-slate-900/40">
                             <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">لا توجد أجيال مستخدمين كافية</span>
                        </div>
                    ) : cohortsGene.grouping === "table" ? (
                        <table className="w-full text-right text-[11px] font-mono border-collapse" dir="ltr">
                            <thead>
                                <tr className="text-slate-500 border-b border-white/5">
                                    <th className="p-3 font-bold uppercase tracking-widest text-left">التاريخ</th>
                                    <th className="p-3 font-bold uppercase tracking-widest text-center border-r border-white/5">المستخدمين</th>
                                    <th className="p-3 font-bold uppercase tracking-widest text-center">يوم 1</th>
                                    <th className="p-3 font-bold uppercase tracking-widest text-center">يوم 3</th>
                                    <th className="p-3 font-bold uppercase tracking-widest text-center">يوم 7</th>
                                    <th className="p-3 font-bold uppercase tracking-widest text-center">يوم 30</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cohorts.map((row) => (
                                    <tr key={row.cohortDate} className="border-b border-white/5 last:border-none hover:bg-slate-900/60 transition-colors text-slate-400 group/row">
                                        <td className="p-3 font-black text-slate-200 text-left bg-slate-900/20">{row.cohortDate}</td>
                                        <td className="p-3 text-center border-r border-white/5 text-slate-300 font-bold bg-slate-900/40">{row.cohortSize}</td>
                                        <td className={`p-3 text-center ${getColor(row.d1Pct)} bg-white/[0.01] group-hover/row:bg-white/[0.02]`}>{fmtPct(row.d1Pct)}</td>
                                        <td className={`p-3 text-center ${getColor(row.d3Pct)} bg-white/[0.02] group-hover/row:bg-white/[0.03]`}>{fmtPct(row.d3Pct)}</td>
                                        <td className={`p-3 text-center ${getColor(row.d7Pct)} bg-white/[0.03] group-hover/row:bg-white/[0.04]`}>{fmtPct(row.d7Pct)}</td>
                                        <td className={`p-3 text-center ${getColor(row.d30Pct)} bg-white/[0.04] group-hover/row:bg-white/[0.05]`}>{fmtPct(row.d30Pct)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="space-y-3" dir="ltr">
                            {cohorts.map((row) => (
                                <div key={row.cohortDate} className="rounded-2xl border border-white/5 bg-slate-900/60 px-4 py-3 shadow-inner hover:bg-slate-900/80 transition-colors">
                                    <div className="mb-2 flex items-center justify-between border-b border-white/5 pb-2">
                                        <span className="text-xs font-black text-slate-200">{row.cohortDate}</span>
                                        <span className="text-[10px] text-slate-400 font-mono tracking-wider px-2 py-0.5 bg-black/30 rounded-lg">المستخدمين: <span className="text-white font-bold">{row.cohortSize}</span></span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 text-xs font-mono text-center">
                                        <div className="flex flex-col gap-1"><span className="text-[9px] text-slate-500 uppercase">D1</span><span className={getColor(row.d1Pct)}>{fmtPct(row.d1Pct)}</span></div>
                                        <div className="flex flex-col gap-1"><span className="text-[9px] text-slate-500 uppercase">D3</span><span className={getColor(row.d3Pct)}>{fmtPct(row.d3Pct)}</span></div>
                                        <div className="flex flex-col gap-1"><span className="text-[9px] text-slate-500 uppercase">D7</span><span className={getColor(row.d7Pct)}>{fmtPct(row.d7Pct)}</span></div>
                                        <div className="flex flex-col gap-1"><span className="text-[9px] text-slate-500 uppercase">D30</span><span className={getColor(row.d30Pct)}>{fmtPct(row.d30Pct)}</span></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

        </div>
        </CollapsibleSection>
    );
};
