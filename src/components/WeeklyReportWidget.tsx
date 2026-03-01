import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, TrendingUp, Zap, Target, Quote, ChevronRight, Lock, AlertCircle, RefreshCw, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { supabase } from "../services/supabaseClient";

interface WeeklyReport {
    id: string;
    summary_data: {
        avgMood: string;
        avgEnergy: string;
        topStress: string;
        daysLogged: number;
        insightCount: number;
        trajectory?: {
            status: 'up' | 'down' | 'stable';
            moodDelta: string;
            energyDelta: string;
        }
    };
    report_result: {
        wave_pattern: string;
        pattern_insight: string;
        next_maneuver: string;
        final_word: string;
    };
    start_date: string;
    end_date: string;
}

export const WeeklyReportWidget: FC = () => {
    const [report, setReport] = useState<WeeklyReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<{ code: string; message: string } | null>(null);

    const fetchReport = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: { session } } = await supabase!.auth.getSession();
            const res = await fetch('/api/report/weekly', {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });

            const data = await res.json();
            if (res.ok) {
                setReport(data);
            } else {
                setError({ code: data.error, message: data.message });
            }
        } catch (err) {
            console.error(err);
            setError({ code: 'FETCH_ERROR', message: 'فشل في استلام التقرير' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    if (loading) return <WeeklySkeleton />;

    if (error?.code === 'INSUFFICIENT_DATA') return (
        <div className="rounded-[1.5rem] p-6 bg-white/5 border border-white/10 text-right relative overflow-hidden">
            <div className="flex items-center gap-3 justify-end mb-4">
                <h3 className="text-sm font-bold text-white">تقرير المحطة الأسبوعي</h3>
                <Lock className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
                {error.message}
            </p>
            <div className="flex gap-2 justify-end">
                {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-1 rounded-full bg-white/10" />
                ))}
            </div>
        </div>
    );

    if (!report) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2rem] p-5 md:p-8 text-right bg-slate-900/40 border border-white/10 backdrop-blur-2xl relative overflow-hidden shadow-2xl"
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

            <div className="flex items-start justify-between mb-8">
                <div className="flex flex-col items-start gap-2">
                    <span className="px-3 py-1 rounded-full bg-indigo-500 text-[9px] md:text-[10px] font-black text-white uppercase tracking-tighter">Premium</span>
                    {report.summary_data.trajectory && (
                        <TrajectoryBadge trajectory={report.summary_data.trajectory} />
                    )}
                </div>
                <div className="text-right">
                    <h3 className="text-lg md:text-xl font-black text-white mb-1">تقرير المحطة</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2 justify-end">
                        {new Date(report.start_date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                        <Calendar className="w-3 h-3" />
                    </p>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
                <StatBox label="متوسط الموود" value={`${report.summary_data.avgMood}/5`} icon={TrendingUp} color="text-emerald-400" />
                <StatBox label="مستوى الطاقة" value={`${report.summary_data.avgEnergy}/5`} icon={Zap} color="text-amber-400" />
                <StatBox label="أكبر ضغط" value={report.summary_data.topStress} icon={AlertCircle} color="text-rose-400" />
                <StatBox label="تحليلات الخريطة" value={report.summary_data.insightCount} icon={Target} color="text-indigo-400" />
            </div>

            <div className="space-y-8">
                <section>
                    <div className="flex items-center gap-2 justify-end mb-3">
                        <p className="text-[10px] md:text-[11px] font-bold text-indigo-400 uppercase tracking-wider">نمط الموجة</p>
                        <div className="w-8 h-[1px] bg-indigo-500/30" />
                    </div>
                    <p className="text-sm text-slate-200 leading-[1.8] font-medium pr-4 border-r-2 border-indigo-500/20">
                        {report.report_result.wave_pattern}
                    </p>
                </section>

                <section>
                    <div className="flex items-center gap-2 justify-end mb-3">
                        <p className="text-[10px] md:text-[11px] font-bold text-blue-400 uppercase tracking-wider">رؤية الأنماط</p>
                        <div className="w-8 h-[1px] bg-blue-500/30" />
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 md:p-5 border border-white/5 hover:border-blue-500/20 transition-all group">
                        <p className="text-[12px] md:text-[13px] text-slate-300 leading-relaxed italic pr-2">
                            {report.report_result.pattern_insight}
                        </p>
                    </div>
                </section>

                <section className="relative">
                    <div className="flex items-center gap-2 justify-end mb-3">
                        <p className="text-[10px] md:text-[11px] font-bold text-emerald-400 uppercase tracking-wider">المناورة القادمة</p>
                        <div className="w-8 h-[1px] bg-emerald-500/30" />
                    </div>
                    <div className="bg-emerald-500/5 rounded-2xl p-4 md:p-5 border border-emerald-500/20 flex gap-4 items-center justify-end">
                        <p className="text-[12px] md:text-[13px] text-emerald-100 font-bold flex-1 leading-relaxed">
                            {report.report_result.next_maneuver}
                        </p>
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
                        </div>
                    </div>
                </section>

                <div className="pt-6 border-t border-white/5 text-center mt-4">
                    <Quote className="w-5 h-5 md:w-6 md:h-6 text-indigo-500/20 mx-auto mb-3" />
                    <p className="text-base md:text-lg font-black bg-gradient-to-r from-indigo-300 to-indigo-100 bg-clip-text text-transparent italic">
                        "{report.report_result.final_word}"
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

const StatBox: FC<{ label: string; value: any; icon: any; color: string }> = ({ label, value, icon: Icon, color }) => (
    <div className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-end gap-1">
        <Icon className={`w-3 h-3 md:w-3.5 md:h-3.5 ${color} mb-1`} />
        <span className="text-[8px] md:text-[9px] text-slate-500 font-bold uppercase tracking-tighter">{label}</span>
        <span className="text-xs md:text-sm font-black text-white">{value}</span>
    </div>
);

const TrajectoryBadge: FC<{ trajectory: NonNullable<WeeklyReport['summary_data']['trajectory']> }> = ({ trajectory }) => {
    const isUp = trajectory.status === 'up';
    const isDown = trajectory.status === 'down';

    return (
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-bold border transition-all ${isUp ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                isDown ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                    'bg-slate-500/10 border-slate-500/20 text-slate-400'
            }`}>
            {isUp ? <ArrowUpRight className="w-3 h-3" /> : isDown ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            <span>مسار {isUp ? 'تصاعدي' : isDown ? 'تراجعي' : 'مستقر'}</span>
            <span className="opacity-50">({trajectory.moodDelta})</span>
        </div>
    );
};

const WeeklySkeleton: FC = () => (
    <div className="rounded-[2rem] p-8 bg-white/5 border border-white/10 space-y-8 animate-pulse text-right">
        <div className="flex justify-between items-start">
            <div className="w-24 h-6 bg-white/10 rounded-full" />
            <div className="space-y-2 flex flex-col items-end">
                <div className="w-32 h-6 bg-white/10 rounded-lg" />
                <div className="w-20 h-3 bg-white/5 rounded-full" />
            </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl" />)}
        </div>
        <div className="space-y-4">
            <div className="w-24 h-3 bg-white/10 rounded-full ml-auto" />
            <div className="w-full h-24 bg-white/5 rounded-2xl" />
        </div>
    </div>
);
