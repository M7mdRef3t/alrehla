import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, Users, Target, CheckCircle2, AlertCircle, ArrowRight, Activity, Percent } from 'lucide-react';
import { useAdminState } from '@/domains/admin/store/admin.store';
import { getAuthToken } from "@/domains/auth/store/auth.store";

interface FunnelData {
  landing_views: number;
  onboarding_starts: number;
  activation_views: number;
  successful_payments: number;
  total_active_sessions: number;
}

function getBearerToken(): string {
  return getAuthToken() ?? "";
}

export const SovereignFunnel: React.FC = () => {
    const [data, setData] = useState<FunnelData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFunnel = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/admin/analytics/funnel', {
                    headers: {
                        'Authorization': `Bearer ${getBearerToken()}`
                    }
                });
                if (!response.ok) throw new Error('فشل جلب بيانات القمع (Funnel)');
                const json = await response.json();
                setData(json);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        void fetchFunnel();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] border border-teal-500/20 rounded-3xl bg-[#0B0F19] shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-indigo-500/5 animate-pulse" />
                <Activity className="w-12 h-12 text-teal-400 animate-spin" />
                <p className="mt-4 text-teal-300 font-bold tracking-widest text-sm uppercase">جاري استدعاء بيانات الرحلة...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 border border-rose-500/30 rounded-3xl bg-rose-950/20 flex flex-col items-center justify-center space-y-4">
                <AlertCircle className="w-10 h-10 text-rose-400" />
                <p className="text-rose-200 font-bold">{error}</p>
            </div>
        );
    }

    if (!data) return null;

    // Calculate maximum value to determine width scaling
    const maxVal = Math.max(data.landing_views, data.onboarding_starts, data.activation_views, data.successful_payments, 1);

    const steps = [
        { label: 'الزوار الجدد (الرئيسية)', value: data.landing_views, icon: Users, color: 'from-blue-500 to-cyan-400', border: 'border-blue-500/30' },
        { label: 'بدء الرحلة (Onboarding)', value: data.onboarding_starts, icon: Target, color: 'from-indigo-500 to-purple-400', border: 'border-indigo-500/30' },
        { label: 'الوصول للالتزام (Activation)', value: data.activation_views, icon: Filter, color: 'from-amber-500 to-orange-400', border: 'border-amber-500/30' },
        { label: 'تأكيد الالتزام (Proof Submitted)', value: data.successful_payments, icon: CheckCircle2, color: 'from-teal-500 to-emerald-400', border: 'border-teal-500/30' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col gap-2">
                <h2 className="text-3xl font-black text-white tracking-widest uppercase flex items-center gap-3">
                    <Activity className="w-8 h-8 text-teal-400" />
                    قمع مسار الرحلة (Journey Funnel)
                </h2>
                <p className="text-slate-400 font-medium">تحليل مسار الزوار وحساب نسب السقوط بدقة من قاعدة بيانات المنصة (آخر 30 يوم).</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Stats summary cards */}
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 shadow-inner backdrop-blur-md flex flex-col items-center text-center">
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">الزوار</p>
                    <p className="text-3xl font-black text-white mt-2">{data.landing_views}</p>
                </div>
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 shadow-inner backdrop-blur-md flex flex-col items-center text-center">
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">معدل البداية</p>
                    <p className="text-3xl font-black text-white mt-2">
                        {data.landing_views > 0 ? Math.round((data.onboarding_starts / data.landing_views) * 100) : 0}%
                    </p>
                </div>
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 shadow-inner backdrop-blur-md flex flex-col items-center text-center">
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">معدل الوصول للدفع</p>
                    <p className="text-3xl font-black text-white mt-2">
                         {data.onboarding_starts > 0 ? Math.round((data.activation_views / data.onboarding_starts) * 100) : 0}%
                    </p>
                </div>
                <div className="p-6 rounded-3xl bg-teal-500/10 border border-teal-500/30 shadow-[0_0_20px_rgba(20,184,166,0.15)] backdrop-blur-md flex flex-col items-center text-center">
                    <p className="text-sm text-teal-300 font-black uppercase tracking-wider">نسبة الإغلاق الكلية</p>
                    <p className="text-4xl font-black text-teal-400 mt-2">
                        {data.landing_views > 0 ? ((data.successful_payments / data.landing_views) * 100).toFixed(1) : 0}%
                    </p>
                </div>
            </div>

            <div className="p-8 rounded-3xl bg-[#0B0F19] border border-white/5 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />
                
                <h3 className="text-xl font-black text-white tracking-widest uppercase mb-10 relative z-10 flex items-center gap-3">
                    <Filter className="w-6 h-6 text-indigo-400" />
                    تحليل نقاط السقوط (Drop-offs)
                </h3>

                <div className="relative z-10 flex flex-col gap-6">
                    {steps.map((step, index) => {
                        const widthPercent = maxVal > 0 ? Math.max((step.value / maxVal) * 100, 5) : 0;
                        const previousStepValue = index > 0 ? steps[index - 1].value : step.value;
                        const dropOff = previousStepValue > 0 ? ((previousStepValue - step.value) / previousStepValue) * 100 : 0;
                        const conversion = previousStepValue > 0 ? (step.value / previousStepValue) * 100 : 0;

                        return (
                            <div key={step.label} className="flex flex-col md:flex-row items-center gap-4 relative">
                                {/* Left Side: Desktop Label & Value */}
                                <div className="w-full md:w-48 flex-shrink-0 flex md:flex-col justify-between md:justify-center items-center md:items-start text-right md:pr-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl bg-white/5 border ${step.border} shadow-inner`}>
                                            <step.icon className="w-5 h-5 text-white opacity-80" />
                                        </div>
                                        <p className="text-xs md:text-sm font-black text-slate-300 uppercase tracking-widest leading-tight">{step.label}</p>
                                    </div>
                                    <p className="text-2xl font-black text-white mt-1">{step.value}</p>
                                </div>

                                {/* Bar Container */}
                                <div className="flex-1 w-full bg-slate-800/40 rounded-full h-12 relative overflow-hidden backdrop-blur-sm border border-slate-700/50">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${widthPercent}%` }}
                                        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                                        className={`absolute right-0 top-0 bottom-0 bg-gradient-to-l ${step.color} rounded-full shadow-[0_0_20px_rgba(255,255,255,0.1)]`}
                                    />
                                </div>
                                
                                {/* Right Side: Conversion Info */}
                                {index > 0 && (
                                   <div className="w-full md:w-32 flex-shrink-0 flex items-center justify-between md:justify-start gap-3 bg-white/5 md:bg-transparent rounded-full px-4 py-2 md:p-0">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">التحويل</span>
                                            <span className="text-sm font-black text-emerald-400 flex items-center gap-1">
                                                {conversion.toFixed(1)}% <Percent className="w-3 h-3" />
                                            </span>
                                        </div>
                                        <div className="w-px h-6 bg-slate-700 mx-2 hidden md:block" />
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">السقوط</span>
                                            <span className="text-sm font-black text-rose-400 flex items-center gap-1">
                                                {dropOff.toFixed(1)}% <Percent className="w-3 h-3" />
                                            </span>
                                        </div>
                                   </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <div className="p-6 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 shadow-inner">
                <div className="flex items-start gap-4">
                    <ArrowRight className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
                    <div>
                        <h4 className="text-white font-black uppercase tracking-widest mb-2">كيف تقرأ هذه البيانات؟</h4>
                        <p className="text-slate-300 text-sm leading-relaxed font-medium">
                            هذه اللوحة تقرأ بيانات <strong>routing_events</strong> من قاعدة البيانات مباشرة. إذا كانت نسبة الإغلاق الكلية أقل من المتوقع، انظر إلى مرحلة "السقوط" الأكبر (غالباً ما تكون بين Onboarding و Activation). التركيز يجب أن ينصب على هذه المرحلة لتحسين معدل التحويل الكلي.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
