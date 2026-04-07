
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Shield, Zap, Search, LayoutGrid, ListFilter, Radar } from 'lucide-react';
import { useFleetState } from '@/state/fleetState';
import { FleetEngine } from '@/services/fleet/FleetEngine';
import { VesselCard } from './components/VesselCard';
import { AdminTooltip } from '../Overview/components/AdminTooltip';

export const FleetCommander: React.FC = () => {
    const { vessels, activeVesselId, routingDirective, setActiveVessel, isSandboxEnforced } = useFleetState();

    useEffect(() => {
        FleetEngine.initializeFleet();
        FleetEngine.calculateDeployment();

        // Refresh deployment every minute
        const interval = setInterval(() => {
            FleetEngine.calculateDeployment();
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-8" dir="rtl">
            {/* Fleet HUD Header */}
            <div className="admin-glass-card p-8 border-indigo-500/20 bg-indigo-500/5 rounded-[2.5rem] relative overflow-hidden">
                <div className="absolute top-0 left-0 p-6 opacity-10">
                    <Rocket className="w-32 h-32 text-indigo-500 rotate-45" />
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <Rocket className="w-7 h-7 text-indigo-400" />
                            <h3 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
                                قائد الأسطول (Fleet Commander)
                                <AdminTooltip content="مركز تحكم الأسطول: يتيح توجيه حالتك الذهنية وتعيين المركبة الأنسب للمهام الحالية." position="bottom" />
                            </h3>
                        </div>
                        <p className="text-sm text-slate-400 max-w-xl">
                            إدارة المشاريع بناءً على بصمتك الطاقية. النظام بيعيد توجيهك للسفينة الأنسب لحالتك الذهنية الحالية.
                        </p>
                    </div>

                    <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 flex flex-col items-center min-w-[200px]">
                        <div className="flex items-center gap-2 mb-1">
                            <Radar className="w-4 h-4 text-teal-400 animate-pulse" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                مسار التوجيه (Routing Directive)
                                <AdminTooltip content="التوجيه التلقائي للمركبات بناءً على خوارزميات الاستقرار والنبض." position="bottom" />
                            </span>
                        </div>
                        <p className="text-xs font-bold text-teal-400 text-center uppercase">{routingDirective}</p>
                    </div>
                </div>
            </div>

            {/* Fleet Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Vessels Sidebar */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="flex justify-between items-center px-2">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                            مركبات الأسطول النشطة
                            <AdminTooltip content="المركبات الجاهزة للاستخدام للقيام بمهام بتركيز عالي." position="left" />
                        </h4>
                        <div className="flex gap-2">
                            <button className="p-2 bg-white/5 rounded-lg border border-white/5 text-slate-500 hover:text-white transition-all">
                                <Search className="w-4 h-4" />
                            </button>
                            <button className="p-2 bg-white/5 rounded-lg border border-white/5 text-slate-500 hover:text-white transition-all">
                                <ListFilter className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {vessels.map((vessel: any) => (
                            <VesselCard
                                key={vessel.id}
                                vessel={vessel}
                                isActive={activeVesselId === vessel.id}
                                onClick={() => setActiveVessel(vessel.id)}
                            />
                        ))}
                    </div>
                </div>

                {/* Status Bar / Sandbox Info */}
                <div className="space-y-6">
                    <div className="admin-glass-card p-6 border-rose-500/20 bg-rose-500/5 rounded-3xl">
                        <div className="flex items-center gap-3 mb-4">
                            <Shield className={`w-5 h-5 ${isSandboxEnforced ? 'text-rose-500 animate-pulse' : 'text-slate-600'}`} />
                            <h5 className="font-bold text-sm text-white uppercase flex items-center gap-2">
                                بروتوكول العزل (Sandbox)
                                <AdminTooltip content="وضع العزل التام: يمنع التشتت الخارجي للتركيز العميق." position="left" />
                            </h5>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed mb-6">
                            تفعيل العزل التام للمهام الحساسة. عند تفعيل الـ Sandbox، بيتم منع أي تداخل بيانات خارجي وتكثيف رادار الوعي على السفينة الحالية بس.
                        </p>
                        <div className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${isSandboxEnforced ? 'bg-rose-500/10 border-rose-500/30' : 'bg-white/5 border-white/5'
                            }`}>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isSandboxEnforced ? 'text-rose-400' : 'text-slate-500'}`}>
                                {isSandboxEnforced ? 'البروتوكول نشط' : 'البروتوكول متوقف'}
                            </span>
                        </div>
                    </div>

                    <div className="admin-glass-card p-6 border-indigo-500/20 bg-indigo-500/5 rounded-3xl">
                        <div className="flex items-center gap-3 mb-4">
                            <Zap className="w-5 h-5 text-indigo-400" />
                            <h5 className="font-bold text-sm text-white uppercase flex items-center gap-2">
                                ذكاء الأسطول (Fleet Intelligence)
                                <AdminTooltip content="استنتاجات وتوصيات لتيسير وإدارة مركباتك وطاقتك." position="left" />
                            </h5>
                        </div>
                        <ul className="space-y-4">
                            <li className="flex gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5" />
                                <p className="text-[10px] text-slate-400">تحليل المهام التحليلية يتطلب كفاءة استقرار {">"} ٧٠٪.</p>
                            </li>
                            <li className="flex gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5" />
                                <p className="text-[10px] text-slate-400">الإبداع بيتم تحفيزه في وضع الـ Flow بشكل آلي.</p>
                            </li>
                            <li className="flex gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5" />
                                <p className="text-[10px] text-slate-400">يتم تعطيل الروابط الاجتماعية في وضع الـ Recovery لحماية الطاقة.</p>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
