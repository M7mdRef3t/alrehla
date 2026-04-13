import type { FC } from "react";
import { AlertTriangle, Filter, User, Play, CheckCircle2 } from "lucide-react";
import type { OverviewStats } from "@/services/adminApi";
import { AdminTooltip } from "./AdminTooltip";

interface FunnelAndEmergencyProps {
    funnelData: { steps: Array<{ label: string; count: number; key: string }> } | null | undefined;
    emergencyData: OverviewStats["emergencyLogs"];
    loading: boolean;
}

const FunnelStepBar: FC<{ label: string; count: number; total: number; color: string; index: number; icon: any }> = ({ label, count, total, color, index, icon: Icon }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    const colorClass = color === 'teal' ? 'teal' : color === 'indigo' ? 'indigo' : 'cyan';

    return (
        <div className="relative group">
            {/* Connector Line */}
            {index > 0 && (
                <div className="absolute top-0 right-8 -translate-y-full h-4 w-0.5 bg-slate-800 z-0" />
            )}

            <div className="relative z-10 flex items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-white/5 hover:border-slate-700 hover:bg-slate-900/80 transition-all shadow-inner">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-white/10 shadow-lg ${color === 'teal' ? 'bg-teal-500/20 text-teal-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                    <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </div>

                <div className="flex-1 overflow-hidden relative">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-black text-white tracking-wide">{label}</span>
                        <span className="text-xs font-black font-mono text-slate-400 px-2 py-0.5 rounded-md bg-black/30 border border-white/5">{count} جلسة</span>
                    </div>

                    <div className="h-2 w-full bg-slate-950/80 rounded-full overflow-hidden border border-slate-800/50 shadow-inner">
                        <div
                            className={`relative h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.3)] bg-${colorClass}-500 group-hover:translate-x-1`}
                            style={{ width: `${Math.max(percentage, 5)}%` }}
                        >
                            <div className="absolute right-0 w-8 h-full bg-gradient-to-l from-white/40 to-transparent blur-sm rounded-full" />
                        </div>
                    </div>

                    <div className="flex justify-end mt-1">
                        <span className="text-[10px] font-black font-mono text-slate-500">{percentage.toFixed(1)}% من الإجمالي</span>
                    </div>
                </div>

                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center text-xs font-black font-mono text-slate-400 shadow-xl z-20 group-hover:bg-slate-800 transition-colors">
                    {index + 1}
                </div>
            </div>
        </div>
    );
};

export const FunnelAndEmergency: FC<FunnelAndEmergencyProps> = ({ funnelData, emergencyData, loading }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
                <div className="lg:col-span-2 h-64 bg-slate-900/30 rounded-3xl border border-white/5 animate-pulse" />
                <div className="h-48 bg-slate-900/30 rounded-3xl border border-white/5 animate-pulse" />
            </div>
        );
    }

    const steps = funnelData?.steps || [];
    const total = steps.length > 0 ? steps[0].count : 0;

    const getIcon = (key: string) => {
        if (key.includes('add') || key.includes('person')) return User;
        if (key.includes('start') || key.includes('path')) return Play;
        return CheckCircle2;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start" dir="rtl">

            {/* Funnel Section (Right/Main) */}
            <div className="lg:col-span-2 admin-glass-card p-8 border border-white/5 bg-slate-950/60 rounded-3xl shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none opacity-50 transition-opacity duration-1000 group-hover:opacity-80" />
                
                <div className="flex justify-between items-start mb-8 relative z-10 border-b border-white/5 pb-4">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-slate-900 rounded-xl border border-white/10 shadow-lg shadow-black/50 ring-1 ring-white/5">
                            <Filter className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                    قمع التحويل الكلي (30D)
                                    <AdminTooltip content="بيوضح كام واحد دخل المحطة الأولى، وكام واحد كمّل للمحطة اللي بعدها عشان نقدر نحدد فيه (Friction/تسرب) حاصل فين بالظبط." position="bottom" />
                                </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono tracking-wider flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                                القياس: نشط (ACTIVE)
                            </span>
                        </div>
                    </div>
                </div>

                <div className="space-y-5 max-w-4xl mx-auto relative z-10">
                    {steps.length === 0 ? (
                        <div className="flex items-center justify-center p-8 border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">لا توجد بيانات للقمع بعد</span>
                        </div>
                    ) : (
                        steps.map((step, idx) => (
                            <FunnelStepBar
                                key={step.key}
                                index={idx}
                                label={step.label}
                                count={step.count}
                                total={total}
                                color={idx === 0 ? 'teal' : 'indigo'}
                                icon={getIcon(step.key)}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Emergency Section (Left/Side) */}
            <div className="w-full">
                <div className="bg-slate-950/80 backdrop-blur-xl p-6 rounded-3xl border border-rose-500/20 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-transparent opacity-50" />
                    <div className="absolute bottom-0 right-0 w-48 h-48 bg-rose-500/10 blur-[60px] rounded-full pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />

                    <div className="flex justify-between items-start mb-6 relative z-10">
                         <div className="flex items-start gap-3">
                            <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20 ring-1 ring-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)] flex-shrink-0">
                                <AlertTriangle className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-rose-100 uppercase tracking-widest mb-1 flex items-center gap-2">
                                    طلبات الاستغاثة
                                    <AdminTooltip content="أي شخص بيضغط على زرار الطوارئ في شاشة عرض النتيجة بينزل هنا فوراً عشان لو محتاج تدخل بشري لإنقاذه." position="bottom" />
                                </h3>
                                <span className="text-[10px] text-rose-500 font-mono tracking-wider flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                                    رادار الطوارئ (آخر 5)
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 relative z-10 mt-6">
                        {(!emergencyData || emergencyData.length === 0) ? (
                            <div className="flex items-center justify-center py-10 border border-dashed border-rose-500/20 rounded-2xl bg-rose-500/5">
                                <span className="text-[10px] text-rose-400/50 font-bold uppercase tracking-widest text-center px-4">لا توجد نداءات حية للفصل والعبور الآن</span>
                            </div>
                        ) : (
                            emergencyData.map((log, idx) => (
                                <div key={idx} className="bg-rose-950/60 p-4 rounded-2xl border border-rose-500/20 flex justify-between items-center group/item hover:bg-rose-900/60 transition-colors shadow-inner relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-1 h-full bg-rose-500 group-hover/item:shadow-[0_0_10px_rgba(244,63,94,1)] transition-shadow" />
                                    <div>
                                        <p className="text-sm font-black text-rose-100 group-hover/item:text-white transition-colors">{log.personLabel || "مجهول"}</p>
                                        <p className="text-[10px] text-rose-400 opacity-70 font-mono mt-1 font-bold">{new Date(log.createdAt).toLocaleString("en-US")}</p>
                                    </div>
                                    <button className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-rose-500/20 hover:bg-rose-500 text-rose-200 hover:text-white rounded-lg border border-rose-500/30 transition-all shadow-md">
                                        تتبع
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};
