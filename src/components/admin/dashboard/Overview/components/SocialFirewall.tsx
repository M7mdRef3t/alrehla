import type { FC } from "react";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ShieldAlert, Zap, UserX, Activity, Heart, Battery } from "lucide-react";
import { useFirewallState } from "@/domains/admin/store/firewall.store";
import { useMapState } from '@/modules/map/dawayirIndex';
import { EnergyROIEngine } from "@/services/EnergyROIEngine";
import { AdminTooltip } from "./AdminTooltip";

export const SocialFirewall: FC<{ loading: boolean }> = ({ loading }) => {
    const { isShieldActive, setShieldActive, roiData, blockedNodeIds, toggleBlockNode } = useFirewallState();
    const { nodes } = useMapState();

    useEffect(() => {
        EnergyROIEngine.recalibrateAll();
    }, [nodes]);

    const vampires = useMemo(() => {
        return nodes.filter(n => EnergyROIEngine.isEnergyVampire(n.id) && !n.isNodeArchived);
    }, [nodes, roiData]);

    if (loading) {
        return (
            <div className="space-y-6 w-full animate-pulse" dir="rtl">
                <div className="h-48 bg-slate-900/40 rounded-3xl border border-white/5" />
                <div className="h-64 bg-slate-900/40 rounded-3xl border border-white/5" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
            {/* Shield Control Center */}
            <div className={`admin-glass-card p-6 md:p-8 border transition-all duration-700 rounded-3xl backdrop-blur-xl relative overflow-hidden group shadow-2xl
                ${isShieldActive ? 'border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.15)]' : 'border-white/5 bg-slate-950/60'}`}>
                
                {/* Ambient Backlight */}
                <div className={`absolute top-0 right-0 w-[400px] h-[400px] blur-[100px] rounded-full pointer-events-none opacity-50 transition-all duration-1000 
                    ${isShieldActive ? 'bg-emerald-500/20 group-hover:bg-emerald-500/30' : 'bg-rose-500/5 group-hover:bg-rose-500/10'}`} />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 border-b border-white/5 pb-6">
                    <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-2xl shadow-lg ring-1 transition-all duration-500
                            ${isShieldActive ? 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/50 shadow-emerald-500/20' : 'bg-slate-900 text-slate-400 ring-white/5 shadow-black/50'}`}>
                            {isShieldActive ? <Shield className="w-8 h-8 drop-shadow-md" /> : <ShieldAlert className="w-8 h-8" />}
                        </div>
                        <div>
                            <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-2 mb-1">
                                درع الحماية الاجتماعي
                                <AdminTooltip content="حائط صد افتراضي (Firewall). لما المالك يفعله، بيحجب أي نشاط أو تنبيهات من عقد الـ (Energy Vampires) عشان يحافظ على استقراره الطاقي." position="bottom" />
                            </h3>
                            <p className="text-xs text-slate-400 font-bold max-w-md leading-relaxed">تفعيل حائط الصد ضد مشتتات الطاقة أثناء جلسات التركيز وحجب (Vampires). <span className="text-emerald-400">إستراتيجية الهيمنة الذاتية.</span></p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShieldActive(!isShieldActive)}
                        className={`px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 ring-1 shadow-2xl flex-shrink-0 flex items-center gap-2
                            ${isShieldActive
                                ? 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-emerald-500/40 ring-emerald-400'
                                : 'bg-slate-800 hover:bg-slate-700 text-white shadow-black/50 ring-white/10'
                            }`}
                    >
                        {isShieldActive ? <><Shield className="w-4 h-4" /> الدرع مفعل ونشط</> : <><ShieldAlert className="w-4 h-4" /> تفعيل الحماية</>}
                    </button>
                </div>

                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-5 bg-slate-900/60 rounded-2xl border border-white/5 hover:bg-slate-900/80 transition-colors shadow-inner flex flex-col justify-center">
                        <div className="flex items-center justify-between mb-2">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إحصاءات הـ ROI</p>
                             <AdminTooltip content="إجمالي الدوائر (العلاقات) اللي محرك الذكاء حسب العائد الطاقي بتاعها بناءً على التفاعلات." position="bottom" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-white tabular-nums">{Object.keys(roiData).length}</span>
                            <span className="text-[10px] text-slate-500 mb-1 font-bold">علاقة قيد التحليل</span>
                        </div>
                    </div>
                    <div className="p-5 bg-slate-900/60 rounded-2xl border border-rose-500/20 hover:bg-rose-500/5 transition-colors shadow-inner relative overflow-hidden group/vam flex flex-col justify-center">
                        <div className="absolute inset-0 bg-gradient-to-t from-rose-500/5 to-transparent opacity-0 group-hover/vam:opacity-100 transition-opacity" />
                        <div className="flex items-center justify-between mb-2 relative z-10">
                             <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">مصاصي الطاقة</p>
                             <AdminTooltip content="عدد الأشخاص اللي بيستنزفوا طاقتك أكتر بكتير من المردود الإيجابي اللي بتاخده منهم (Negative ROI)." position="bottom" />
                        </div>
                        <div className="flex items-baseline gap-2 relative z-10">
                            <span className="text-3xl font-black text-rose-400 tabular-nums drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]">{vampires.length}</span>
                            <span className="text-[10px] text-slate-500 mb-1 font-bold">عنصر شديد الخطر</span>
                        </div>
                    </div>
                    <div className="p-5 bg-slate-900/60 rounded-2xl border border-amber-500/20 hover:bg-amber-500/5 transition-colors shadow-inner relative overflow-hidden group/blk flex flex-col justify-center">
                         <div className="absolute inset-0 bg-gradient-to-t from-amber-500/5 to-transparent opacity-0 group-hover/blk:opacity-100 transition-opacity" />
                         <div className="flex items-center justify-between mb-2 relative z-10">
                             <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">مراكز محظورة</p>
                             <AdminTooltip content="الأشخاص اللي إنت منعت التطبيق إنه يظهرلك ليهم أي نشاط أو تنبيهات." position="bottom" />
                        </div>
                        <div className="flex items-baseline gap-2 relative z-10">
                            <span className="text-3xl font-black text-amber-400 tabular-nums drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">{blockedNodeIds.length}</span>
<<<<<<< HEAD
                            <span className="text-[10px] text-slate-500 mb-1 font-bold">تجاهل سيادي نشط</span>
=======
                            <span className="text-[10px] text-slate-500 mb-1 font-bold">تجاهل دائم نشط</span>
>>>>>>> feat/sovereign-final-stabilization
                        </div>
                    </div>
                </div>
            </div>

            {/* ROI Heatmap/List */}
            <div className="admin-glass-card p-6 md:p-8 border border-white/5 bg-slate-950/60 shadow-2xl rounded-3xl relative overflow-hidden group">
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none opacity-50 group-hover:opacity-100 transition-duration-1000" />
                
                <div className="flex items-center justify-between mb-8 relative z-10 border-b border-white/5 pb-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-900 rounded-xl border border-indigo-500/30 shadow-lg ring-1 ring-white/5">
                            <Activity className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-white flex items-center gap-2 mb-1">
                                خريطة العائد الطاقي (Heatmap)
                                <AdminTooltip content="ترتيب الأشخاص جوة دايرتك من الأكتر إرهاقاً للأقل إرهاقاً، بناءً على معادلة رياضية بتحسب (طول التفاعلات، درجة المشاعر، وتكرار الاستهلاك)." position="bottom" />
                            </h4>
                            <p className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">Energy ROI Index Analysis</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                    <AnimatePresence>
                    {nodes.filter(n => !n.isNodeArchived).sort((a, b) => (roiData[b.id]?.roiScore || 0) - (roiData[a.id]?.roiScore || 0)).map(node => {
                        const roi = roiData[node.id];
                        const color = EnergyROIEngine.getROIColor(node.id);
                        const isBlocked = blockedNodeIds.includes(node.id);
                        const isVamp = EnergyROIEngine.isEnergyVampire(node.id);

                        return (
                            <motion.div
                                key={node.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all shadow-sm gap-4
                                    ${isBlocked ? 'bg-amber-950/20 border-amber-500/20 opacity-70 grayscale' : 'bg-slate-900/60 border-white/5 hover:border-white/10 hover:bg-slate-900/80'}
                                    ${isVamp && !isBlocked ? 'border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.1)]' : ''}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-white shadow-lg text-lg ring-1 ring-white/20`}
                                        style={{ backgroundColor: color, filter: isBlocked ? 'grayscale(100%)' : 'none' }}
                                    >
                                        {node.label.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h5 className={`font-black tracking-wide ${isBlocked ? 'text-slate-400 line-through' : 'text-white'}`}>{node.label}</h5>
                                            {isVamp && !isBlocked && <span className="text-[9px] font-black uppercase tracking-widest bg-rose-500 text-white px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.8)]">Vampire</span>}
                                            {isBlocked && <span className="text-[9px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">Blocked</span>}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 mt-1.5 opacity-80">
                                            <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-md border border-white/5">
                                                <Battery className={`w-3 h-3 ${isVamp ? 'text-rose-400' : 'text-emerald-400'}`} />
                                                <span className="text-[10px] text-slate-300 font-mono font-bold tracking-tight">ROI: {roi?.roiScore.toFixed(1) || '0.0'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-md border border-white/5">
                                                <Zap className="w-3 h-3 text-amber-400" />
                                                <span className="text-[10px] text-slate-300 font-mono font-bold tracking-tight">Interactions: {roi?.interactionCount || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 sm:self-center self-end border-t sm:border-t-0 sm:border-l border-white/5 pt-3 sm:pt-0 sm:pl-4">
                                    <button
                                        onClick={() => toggleBlockNode(node.id)}
                                        className={`px-4 py-2 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-md
                                                ${isBlocked
                                                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 ring-1 ring-amber-500/40'
                                                : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 ring-1 ring-rose-500/20'
                                            }`}
                                        title={isBlocked ? 'إلغاء الحظر' : 'حظر التنبيهات'}
                                    >
                                        <UserX className="w-3.5 h-3.5" />
<<<<<<< HEAD
                                        {isBlocked ? 'فك العزل' : 'عزل سيادي'}
=======
                                        {isBlocked ? 'فك العزل' : 'عزل كامل'}
>>>>>>> feat/sovereign-final-stabilization
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
