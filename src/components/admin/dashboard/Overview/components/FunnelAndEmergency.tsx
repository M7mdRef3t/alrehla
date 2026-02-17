import type { FC } from "react";
import { AlertTriangle, Filter, User, Play, CheckCircle2 } from "lucide-react";
import type { OverviewStats } from "../../../../../services/adminApi";

interface FunnelAndEmergencyProps {
    funnelData: { steps: Array<{ label: string; count: number; key: string }> } | null | undefined;
    emergencyData: OverviewStats["emergencyLogs"];
    loading: boolean;
}

const FunnelStepBar: FC<{ label: string; count: number; total: number; color: string; index: number; icon: any }> = ({ label, count, total, color, index, icon: Icon }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;

    return (
        <div className="relative group">
            {/* Connector Line */}
            {index > 0 && (
                <div className="absolute top-0 right-8 -translate-y-full h-4 w-0.5 bg-slate-800 z-0" />
            )}

            <div className="relative z-10 flex items-center gap-4 bg-slate-900/40 p-3 rounded-xl border border-white/5 hover:border-slate-700 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${color === 'teal' ? 'bg-teal-500/20 text-teal-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                    <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-slate-200">{label}</span>
                        <span className="text-xs font-mono text-slate-400">{count} جلسة</span>
                    </div>

                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${color === 'teal' ? 'bg-teal-500' : 'bg-indigo-500'}`}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>

                    <div className="flex justify-end mt-1">
                        <span className="text-[10px] font-mono text-slate-500">{percentage.toFixed(1)}% من الإجمالي</span>
                    </div>
                </div>

                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-xs font-mono text-slate-500 shadow-xl z-20">
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
                <div className="lg:col-span-2 h-64 bg-slate-900/40 rounded-2xl border border-slate-800 animate-pulse" />
                <div className="h-48 bg-slate-900/40 rounded-2xl border border-slate-800 animate-pulse" />
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
            <div className="lg:col-span-2 admin-glass-card p-6 border-white/5 bg-slate-950/30 rounded-2xl backdrop-blur-sm">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                            <span className="text-xs font-bold text-cyan-400">تحديث مباشر</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-slate-400" />
                            <h3 className="text-lg font-bold text-white">قمع التحويل (آخر 30 يوم)</h3>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 max-w-3xl mx-auto">
                    {steps.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">لا توجد بيانات للقمع بعد</div>
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
                <div className="bg-gradient-to-br from-rose-500/10 to-transparent p-6 rounded-2xl border border-rose-500/20 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-transparent opacity-50" />

                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                <span className="text-xs font-bold text-rose-400">تحديث مباشر</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-rose-400" />
                                <h3 className="text-lg font-bold text-white">طلبات الاستغاثة (آخر 5)</h3>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 relative z-10">
                        {(!emergencyData || emergencyData.length === 0) ? (
                            <div className="text-center py-8 text-rose-300/50 text-sm font-medium border border-dashed border-rose-500/20 rounded-xl bg-rose-500/5">
                                لا توجد طلبات استغاثة حديثة
                            </div>
                        ) : (
                            emergencyData.map((log, idx) => (
                                <div key={idx} className="bg-rose-950/40 p-3 rounded-xl border border-rose-500/20 flex justify-between items-center group hover:bg-rose-900/40 transition-colors">
                                    <div>
                                        <p className="text-sm font-bold text-rose-100 group-hover:text-white">{log.personLabel || "مجهول"}</p>
                                        <p className="text-[10px] text-rose-300 opacity-70 font-mono mt-0.5">{new Date(log.createdAt).toLocaleString('ar-EG')}</p>
                                    </div>
                                    <button className="px-2 py-1 text-[10px] bg-rose-500/20 hover:bg-rose-500 text-rose-200 hover:text-white rounded border border-rose-500/30 transition-all">
                                        متابعة الحالة
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
