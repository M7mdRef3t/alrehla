import type { FC } from "react";
import { CheckCircle2, Circle, ArrowLeft } from "lucide-react";
import type { PhaseOneGoalProgress } from "../../../../../services/adminApi";

interface PhaseOneGoalProps {
    data: PhaseOneGoalProgress | null;
    loading: boolean;
}

const ProgressBar: FC<{ label: string; current: number; target: number; color: string }> = ({ label, current, target, color }) => {
    const percentage = Math.min(100, (current / target) * 100);
    const isComplete = current >= target;

    return (
        <div className="flex flex-col gap-2 w-full">
            <div className="flex justify-between items-end text-xs font-bold font-mono">
                <span className={isComplete ? `text-${color}-400` : "text-slate-400"}>
                    {current}/{target}
                </span>
                <span className="text-slate-300">{label}</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out bg-${color}-500 ${isComplete && "shadow-[0_0_10px_rgba(16,185,129,0.5)]"}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>{percentage.toFixed(0)}%</span>
            </div>
        </div>
    );
};

const PathNode: FC<{ label: string; isLast?: boolean }> = ({ label, isLast }) => (
    <div className="flex items-center gap-2">
        <div className="px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-300 whitespace-nowrap hover:bg-slate-700 transition-colors cursor-default">
            {label}
        </div>
        {!isLast && <ArrowLeft className="w-3 h-3 text-slate-600" />}
    </div>
);

export const PhaseOneGoal: FC<PhaseOneGoalProps> = ({ data, loading }) => {
    if (loading) {
        return (
            <div className="animate-pulse space-y-6 w-full p-6 bg-slate-900/40 rounded-2xl border border-slate-800">
                <div className="h-6 w-48 bg-slate-800 rounded mb-8" />
                <div className="grid grid-cols-3 gap-8 mb-8">
                    <div className="h-12 bg-slate-800 rounded" />
                    <div className="h-12 bg-slate-800 rounded" />
                    <div className="h-12 bg-slate-800 rounded" />
                </div>
                <div className="h-4 w-full bg-slate-800 rounded" />
            </div>
        );
    }

    if (!data) return null;

    const TARGET = 10;
    const metrics = [
        { label: "مستخدمين سجلوا", current: data.registeredUsers, target: TARGET, color: "emerald" }, // Using emerald explicitly for all successful bars as per design
        { label: "مستخدمين ثبتوا التطبيق", current: data.installedUsers, target: TARGET, color: "emerald" },
        { label: "أشخاص مضافين على الخرائط", current: data.addedPeople, target: TARGET, color: "emerald" }
    ];

    const completedGoals = metrics.filter(m => m.current >= m.target).length;
    const totalProgress = metrics.reduce((acc, curr) => acc + Math.min(100, (curr.current / curr.target) * 100), 0) / 3;

    const platformPath = [
        "الصفحة الرئيسية (زر انطلق)",
        "شاشة ضبط البوصلة",
        "شاشة تسجيل الدخول",
        "شاشة الخرائط",
        "خريطة العائلة - إضافة شخص",
        "رسائل الترحيب عند دخول الخريطة",
        "إضافة شخص",
        "الاستكشاف السريع",
        "إحساسك مع الشخص ده",
        "الواقع الفعلي",
        "النتيجة"
    ];

    return (
        <div className="w-full space-y-8" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-xs font-bold text-cyan-400">تحديث مباشر</span>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1">هدف المرحلة الأولى</h2>
                    <p className="text-xs text-slate-400">هدفنا 10 تسجيل - 10 تثبيت - 10 أشخاص مضافين على الخرائط.</p>
                </div>

                <div className="px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300">
                    {completedGoals}/3 أهداف مكتملة
                </div>
            </div>

            {/* Progress Bars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {metrics.map((m, idx) => (
                    <div key={idx} className="bg-slate-900/20 p-4 rounded-xl border border-white/5">
                        <ProgressBar {...m} />
                    </div>
                ))}
            </div>

            {/* Total Progress */}
            <div className="bg-slate-900/20 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-300">تقدم المرحلة بالكامل</span>
                    <span className="text-xs font-bold font-mono text-cyan-400">{totalProgress.toFixed(0)}%</span>
                </div>
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-l from-cyan-500 to-emerald-500 transition-all duration-1000 ease-out"
                        style={{ width: `${totalProgress}%` }}
                    />
                </div>
            </div>

            {/* Platform Path */}
            <div className="pt-4 border-t border-white/5">
                <h3 className="text-xs font-bold text-slate-400 mb-4">مسار المنصة في هذه المرحلة</h3>
                <div className="flex flex-wrap gap-2 justify-start items-center overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {platformPath.map((step, idx) => (
                        <PathNode key={idx} label={step} isLast={idx === platformPath.length - 1} />
                    ))}
                </div>
            </div>
        </div>
    );
};
