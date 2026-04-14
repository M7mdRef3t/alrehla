import type { FC } from "react";
import { ArrowLeft, Target, Sparkles, CheckCircle2 } from "lucide-react";
import type { PhaseOneGoalProgress } from "@/services/adminApi";

interface PhaseOneGoalProps {
    data: PhaseOneGoalProgress | null;
    loading: boolean;
}

const ProgressBar: FC<{ label: string; current: number; target: number; color: string }> = ({ label, current, target, color }) => {
    const percentage = Math.min(100, (current / target) * 100);
    const isComplete = current >= target;
    const colorClass = color === "emerald" ? "emerald" : color === "cyan" ? "cyan" : "indigo";

    return (
        <div className="flex flex-col gap-3 w-full group">
            <div className="flex justify-between items-end text-xs font-black font-mono tracking-widest">
                <span className={`text-[10px] uppercase text-white tracking-widest bg-slate-800/80 px-3 py-1 rounded-md border border-white/10 group-hover:border-${colorClass}-500/50 transition-colors`}>
                    <span className={isComplete ? `text-${colorClass}-400 drop-shadow-[0_0_8px_currentColor]` : "text-white"}>
                        {current}
                    </span>
                    <span className="text-slate-500 mx-1">/</span>
                    <span className="text-slate-400">{target}</span>
                </span>
                <span className={`text-${colorClass}-100 group-hover:text-white transition-colors`}>{label}</span>
            </div>
            
            <div className={`relative h-2 w-full bg-slate-900/80 rounded-full overflow-hidden border border-slate-800/80 shadow-inner p-[1px]`}>
                <div
                    className={`relative h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end
                        ${isComplete 
                            ? `bg-gradient-to-l from-${colorClass}-400 to-${colorClass}-600/80 shadow-[0_0_15px_rgba(52,211,153,0.8)]` 
                            : `bg-gradient-to-l from-${colorClass}-500 to-${colorClass}-600/50 shadow-[0_0_10px_rgba(6,182,212,0.4)]`
                        }`}
                    style={{ width: `${Math.max(percentage, 5)}%` }}
                >
                    <div className="absolute right-0 w-8 h-full bg-gradient-to-l from-white/40 to-transparent blur-sm rounded-full" />
                </div>
            </div>
        </div>
    );
};

const PathNode: FC<{ label: string; isLast?: boolean; isActive?: boolean; isCompleted?: boolean }> = ({ label, isLast, isActive, isCompleted }) => (
    <div className="flex items-center gap-1.5 group">
        <div className={`relative px-4 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all duration-300 backdrop-blur-md flex items-center gap-2
            ${isActive 
                ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-50 shadow-[0_0_15px_rgba(34,211,238,0.3)] ring-1 ring-cyan-400/30 -translate-y-0.5" 
                : isCompleted 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20" 
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            } border`}
        >
            {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            {isActive && <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />}
            {label}
        </div>
        {!isLast && (
            <div className={`w-4 h-px border-t border-dashed ${isCompleted ? "border-emerald-500/50" : "border-slate-700"}`} />
        )}
    </div>
);

export const PhaseOneGoal: FC<PhaseOneGoalProps> = ({ data, loading }) => {
    if (loading) {
        return (
            <div className="animate-pulse space-y-6 w-full p-8 admin-glass-card rounded-2xl border-slate-800 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent" />
                <div className="h-6 w-48 bg-slate-800/80 rounded mb-8" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    <div className="h-14 bg-slate-800/50 rounded-xl" />
                    <div className="h-14 bg-slate-800/50 rounded-xl" />
                    <div className="h-14 bg-slate-800/50 rounded-xl" />
                </div>
                <div className="h-4 w-full bg-slate-800/80 rounded-full" />
            </div>
        );
    }

    if (!data) return null;

    const TARGET = 10;
    const metrics = [
<<<<<<< HEAD
        { label: "مستخدمين سجلوا", current: data.registeredUsers, target: TARGET, color: "emerald" }, 
        { label: "مستخدمين ثبتوا التطبيق", current: data.installedUsers, target: TARGET, color: "cyan" },
        { label: "أشخاص مضافين على الخرائط", current: data.addedPeople, target: TARGET, color: "indigo" }
=======
        { label: "مسافرين سجلوا", current: data.registeredTravelers, target: TARGET, color: "emerald" }, 
        { label: "ثبّتوا الرحلة (PWA)", current: data.installedTravelers, target: TARGET, color: "cyan" },
        { label: "رفاق مضافين على الخرائط", current: data.addedPeers, target: TARGET, color: "indigo" }
>>>>>>> feat/sovereign-final-stabilization
    ];

    const completedGoals = metrics.filter(m => m.current >= m.target).length;
    const totalProgress = Math.min(100, metrics.reduce((acc, curr) => acc + Math.min(100, (curr.current / curr.target) * 100), 0) / 3);

    const platformPath = [
        { lbl: "الرئيسية (انطلق)", completed: totalProgress > 10 },
        { lbl: "تسجيل الدخول", completed: totalProgress > 30 },
        { lbl: "خريطة الدواير", completed: totalProgress > 50 },
<<<<<<< HEAD
        { lbl: "إضافة شخص", completed: totalProgress > 70 },
=======
        { lbl: "إضافة رفيق", completed: totalProgress > 70 },
>>>>>>> feat/sovereign-final-stabilization
        { lbl: "إحساسك تجاهه", completed: totalProgress > 85, active: true },
        { lbl: "العبور (التشخيص)", completed: totalProgress >= 100 }
    ];

    return (
        <div className="w-full space-y-8 admin-glass-card p-8 rounded-3xl border-slate-800 shadow-2xl relative overflow-hidden group" dir="rtl">
            {/* Cinematic Backgrounds */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity duration-1000" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity duration-1000" />

            {/* Header */}
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-slate-900 rounded-xl border border-white/10 shadow-lg shadow-black/50 ring-1 ring-white/5">
                        <Target className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">تتبع حي</span>
                        </div>
                        <h2 className="text-xl font-black text-white tracking-tight leading-none mb-1">الزخم الأول (Phase One)</h2>
<<<<<<< HEAD
                        <p className="text-[11px] text-slate-400 font-medium tracking-wide">الوصول لـ 10 مسجلين - 10 تثبيت - 10 خيوط واعية على الخريطة.</p>
=======
                        <p className="text-[11px] text-slate-400 font-medium tracking-wide">الوصول لـ {TARGET} مسافرين - {TARGET} تثبيت - {TARGET} رفاق على الخريطة.</p>
>>>>>>> feat/sovereign-final-stabilization
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest uppercase">الإنجاز:</span>
                    <div className="px-5 py-2.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-sm font-black text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)] flex items-center gap-2">
                        {completedGoals} / 3
                        <span className="text-[10px] text-emerald-500 opacity-60">أهداف</span>
                    </div>
                </div>
            </div>

            {/* Progress Bars Grid */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                {metrics.map((m, idx) => (
                    <div key={idx} className="bg-slate-950/40 p-5 rounded-2xl border border-white/5 hover:border-slate-700 hover:bg-slate-900/60 transition-colors shadow-inner">
                        <ProgressBar {...m} />
                    </div>
                ))}
            </div>

            {/* Total Progress Holistic view */}
            <div className="relative z-10 bg-slate-950/50 p-6 rounded-2xl border border-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.05)] overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-cyan-400/10 blur-3xl pointer-events-none" />
                
                <div className="flex justify-between items-end mb-4 relative z-10">
                    <div>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1">إغلاق المسار (Holistic Progress)</span>
                        <span className="text-[10px] text-slate-500">حالة المسار الكلية للرحلة.</span>
                    </div>
                    <span className="text-2xl font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-emerald-400">
                        {totalProgress.toFixed(0)}%
                    </span>
                </div>
                
                <div className="h-1.5 w-full bg-[#0A0F1C] rounded-full overflow-hidden border border-white/5 relative z-10">
                    <div
                        className="h-full bg-gradient-to-l from-cyan-400 via-emerald-400 to-indigo-500 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(34,211,238,0.5)] relative"
                        style={{ width: `${totalProgress}%` }}
                    >
                         <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white/50 to-transparent blur-md translate-x-1/2" />
                    </div>
                </div>
            </div>

            {/* Platform Path Timeline */}
            <div className="relative z-10 pt-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-5 flex items-center gap-2">
                    <span className="w-4 h-px bg-slate-600" />
                    مسار التدفق الإدراكي للزائر
                </h3>
                <div className="flex flex-wrap gap-2 justify-start items-center pb-2">
                    {platformPath.map((step, idx) => (
                        <PathNode 
                            key={idx} 
                            label={step.lbl} 
                            isLast={idx === platformPath.length - 1} 
                            isActive={step.active && !step.completed} 
                            isCompleted={step.completed} 
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
