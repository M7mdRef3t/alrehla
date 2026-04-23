import type { FC } from "react";
import { AlertTriangle, Lightbulb, Activity } from "lucide-react";
import type { OverviewStats } from "@/services/admin/adminTypes";
import { AdminTooltip } from "./AdminTooltip";
import { CollapsibleSection } from "../../../ui/CollapsibleSection";
interface ConversionDiagnosisProps {
    data: OverviewStats["conversionHealth"] | undefined | null;
    loading: boolean;
}

const MetricCard: FC<{ label: string; value: number; subValue?: string; highlighted?: boolean; hint?: string }> = ({ label, value, subValue, highlighted, hint }) => (
    <div className={`p-5 rounded-2xl border flex flex-col items-center justify-center text-center h-full transition-all group/metric relative overflow-hidden
    ${highlighted ? "bg-indigo-500/10 border-indigo-500/30 hover:bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]" : "bg-slate-900/40 border-white/5 hover:bg-slate-900/60"}`}>
        {highlighted && <div className="absolute top-0 w-[150%] h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent left-1/2 -translate-x-1/2 opacity-70" />}
        <div className="flex items-center gap-1.5 justify-center mb-3">
            <span className={`text-[10px] font-black uppercase tracking-widest ${highlighted ? 'text-indigo-300' : 'text-slate-400'}`}>{label}</span>
            {hint && <AdminTooltip content={hint} position="bottom" />}
        </div>
        <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-3xl font-black text-white drop-shadow-md group-hover/metric:scale-105 transition-transform">{value}</span>
            {subValue && <span className="text-sm font-black text-emerald-400">({subValue})</span>}
        </div>
    </div>
);

export const ConversionDiagnosis: FC<ConversionDiagnosisProps> = ({ data, loading }) => {
    if (loading) {
        return (
            <div className="animate-pulse space-y-4 w-full p-8 bg-slate-900/40 rounded-3xl border border-white/5">
                <div className="h-6 w-32 bg-slate-800/80 rounded mb-6" />
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 h-32 bg-slate-800/50 rounded-2xl" />
                <div className="h-20 bg-slate-800/30 rounded-2xl" />
            </div>
        );
    }

    if (!data) return null;

    const conversionRate = data.addPersonOpened > 0
        ? Math.round((data.addPersonDoneShowOnMap / data.addPersonOpened) * 100)
        : 0;

    // Generate warnings dynamically
    const warnings = [];
    if (data.pathStarted24h === 0) warnings.push("خطر الزخم: لا توجد أي بدايات مسار خلال آخر 24 ساعة.");
    if (data.journeyMapsTotal === 0) warnings.push("خطر قاعدة البيانات: لا توجد خرائط محفوظة حتى الآن على السيرفر.");
    if (data.addPersonOpened > 0 && conversionRate < 10) warnings.push("تسرب حرج: نسبة إكمال إضافة شخص منخفضة جدًا (أقل من 10%).");

    const hasWarnings = warnings.length > 0;

    return (
        <CollapsibleSection title="تشخيص التحويل والصحة" icon={<Activity className="w-5 h-5 text-slate-300" />} headerColors="border-indigo-500/10 bg-slate-900/40 text-slate-300" defaultExpanded={false}>
            <div className="w-full space-y-6 admin-glass-card p-8 rounded-3xl border border-white/5 bg-slate-950/60 shadow-2xl relative overflow-hidden group" dir="rtl">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-slate-500/5 blur-[100px] rounded-full pointer-events-none opacity-50 transition-opacity duration-1000 group-hover:opacity-80" />

            {/* Header */}
            <div className="flex justify-between items-start mb-4 relative z-10 border-b border-white/5 pb-4">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 shadow-lg ring-1 ring-white/5">
                        <Activity className="w-5 h-5 text-slate-300" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                تشخيص التحويل والصحة
                                <AdminTooltip content="تحليل لـ (نقاط الانكسار) داخل النظام نفسه، بيوريك المستخدمين بيسقطوا في أي خطوة بالضبط جوة الكور بلاتفورم." position="bottom" />
                            </h3>
                            {hasWarnings && (
                                <span className="bg-rose-500/10 text-rose-400 text-[10px] px-3 py-1 rounded-xl border border-rose-500/30 font-black shadow-[0_0_15px_rgba(244,63,94,0.15)] ml-2">
                                    تحذير حي
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono tracking-wider flex items-center gap-2">
                            التشخيص: قيد العمل (DIAGNOSTICS: RUNNING)
                        </span>
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-10">
                <MetricCard label="بدايات 24 ساعة" value={data.pathStarted24h} hint="كام واحد فعلّ زر انطلق خلال آخر يوم" />
                <MetricCard label="إجمالي الخرائط" value={data.journeyMapsTotal} hint="المستخدمين اللي وصلوا لنهاية التسجيل وتم حفظ إدراكهم كخريطة" />
                <MetricCard label="فتح إضافة شخص" value={data.addPersonOpened} hint="عدد الضغطات الحقيقية على كارت (مساحة آمنة جديدة) أو البلس" />
                <MetricCard
                    label="إضافة وإنهاء للشاشة"
                    value={data.addPersonDoneShowOnMap}
                    subValue={`${conversionRate}%`}
                    highlighted
                    hint="هنا الذهب: المقياس اللي بيقول إنت بتعرف تحول شخص فتح الكارت لشخص كتب وكمّل للاخر."
                />
                <MetricCard label="شراء باقات (BETA)" value={0} hint="عدد اللي اشتروا خطط متقدمة (نظام مقفول حالياً)" />
            </div>

            {/* Warnings Section */}
            {hasWarnings && (
                <div className="bg-rose-950/50 border border-rose-500/20 rounded-2xl p-5 flex flex-col gap-3 relative z-10 shadow-inner">
                    <div className="absolute right-0 top-0 w-1 h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
                    {warnings.map((w, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-rose-100 text-xs font-medium pl-2">
                            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                            <span className="leading-relaxed">{w}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* AI Suggestions Section */}
            <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-6 relative z-10 shadow-inner group/intel">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                        <Lightbulb className="w-4 h-4 text-indigo-400 group-hover/intel:text-indigo-300 transition-colors" />
                    </div>
                    <h4 className="text-xs font-black uppercase text-indigo-200 tracking-widest flex items-center gap-2">
                        الإجراءات الذكية المقترحة (AI Intel)
                        <AdminTooltip content="التوصيات دي بيوفرها الـ System Architect بتاعك بناءً على القرايات اللي حصلت في وقتها." position="top" />
                    </h4>
                </div>
                <div className="space-y-3 pl-2 pr-6 border-r-2 border-indigo-500/20 flex flex-col gap-2">
                    <p className="text-[11px] font-bold text-slate-300 leading-relaxed hover:text-white transition-colors flex items-start gap-2 before:content-['•'] before:text-indigo-500">
                        فعّل حملة دفع فورية: رسالة واضحة بعد إضافة الشخص بزر واحد &quot;ابدأ المسار الآن&quot;.
                    </p>
                    <p className="text-[11px] font-bold text-slate-300 leading-relaxed hover:text-white transition-colors flex items-start gap-2 before:content-['•'] before:text-indigo-500">
                        راجع نقطة حفظ الخريطة: نفّذ اختبار داخلي (إضافة شخص - تحديث - تأكد من ظهور الخريطة بعد إعادة الدخول).
                    </p>
                    <p className="text-[11px] font-bold text-slate-300 leading-relaxed hover:text-white transition-colors flex items-start gap-2 before:content-['•'] before:text-indigo-500">
                        بسّط خطوه إضافة الشخص: قلّل الحقول إلزامية واجعل الإكمال في خطوة واحده لتقليل تسرب القمع.
                    </p>
                </div>
            </div>
        </div>
        </CollapsibleSection>
    );
};
