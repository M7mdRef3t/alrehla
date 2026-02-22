import type { FC } from "react";
import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Shield, ShieldAlert, Zap, UserX, Activity, Heart, Battery } from "lucide-react";
import { useFirewallState } from "../../../../../state/firewallState";
import { useMapState } from "../../../../../state/mapState";
import { EnergyROIEngine } from "../../../../../services/EnergyROIEngine";

export const SocialFirewall: FC<{ loading: boolean }> = ({ loading }) => {
    const { isShieldActive, setShieldActive, roiData, blockedNodeIds, toggleBlockNode } = useFirewallState();
    const { nodes } = useMapState();

    useEffect(() => {
        // Recalibrate ROI on mount
        EnergyROIEngine.recalibrateAll();
    }, [nodes]);

    const vampires = useMemo(() => {
        return nodes.filter(n => EnergyROIEngine.isEnergyVampire(n.id) && !n.isNodeArchived);
    }, [nodes, roiData]);

    if (loading) return null;

    return (
        <div className="space-y-6" dir="rtl">
            {/* Shield Control */}
            <div className={`admin-glass-card p-6 border transition-all duration-500 rounded-3xl backdrop-blur-md ${isShieldActive ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5 bg-slate-950/40'}`}>
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-2xl ${isShieldActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                            {isShieldActive ? <Shield className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">درع الحماية الاجتماعي (Social Shield)</h3>
                            <p className="text-xs text-slate-400">تفعيل حائط الصد ضد مشتتات الطاقة أثناء جلسات التركيز.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShieldActive(!isShieldActive)}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg ${isShieldActive
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            }`}
                    >
                        {isShieldActive ? 'الدرع مفعل' : 'تفعيل الدرع'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-900/60 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">حالة الـ ROI</p>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-black text-white">{Object.keys(roiData).length}</span>
                            <span className="text-xs text-slate-500 mb-1">علاقة مُحللة</span>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-900/60 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">مصاصي الطاقة</p>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-black text-rose-400">{vampires.length}</span>
                            <span className="text-xs text-slate-500 mb-1">عنصر خطر</span>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-900/60 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">عقد محظورة</p>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-black text-amber-400">{blockedNodeIds.length}</span>
                            <span className="text-xs text-slate-500 mb-1">تجاهل نشط</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ROI Heatmap/List */}
            <div className="admin-glass-card p-6 border-white/5 bg-slate-950/30 rounded-3xl">
                <div className="flex items-center gap-2 mb-6">
                    <Activity className="w-5 h-5 text-indigo-400" />
                    <h4 className="text-lg font-bold text-white">العائد الطاقي للعلاقات (Relationships ROI)</h4>
                </div>

                <div className="space-y-3">
                    {nodes.filter(n => !n.isNodeArchived).sort((a, b) => (roiData[b.id]?.roiScore || 0) - (roiData[a.id]?.roiScore || 0)).map(node => {
                        const roi = roiData[node.id];
                        const color = EnergyROIEngine.getROIColor(node.id);
                        const isBlocked = blockedNodeIds.includes(node.id);

                        return (
                            <motion.div
                                key={node.id}
                                layout
                                className="flex items-center justify-between p-4 bg-slate-900/40 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg"
                                        style={{ backgroundColor: color }}
                                    >
                                        {node.label.charAt(0)}
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-slate-200">{node.label}</h5>
                                        <div className="flex items-center gap-3 mt-1">
                                            <div className="flex items-center gap-1">
                                                <Battery className="w-3 h-3 text-slate-500" />
                                                <span className="text-[10px] text-slate-400 font-mono">ROI: {roi?.roiScore.toFixed(1) || '0.0'}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Zap className="w-3 h-3 text-slate-500" />
                                                <span className="text-[10px] text-slate-400 font-mono">Int: {roi?.interactionCount || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleBlockNode(node.id)}
                                        className={`p-2 rounded-lg transition-colors ${isBlocked
                                                ? 'bg-amber-500/20 text-amber-400'
                                                : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                                            }`}
                                        title={isBlocked ? 'إلغاء الحظر' : 'حظر التنبيهات'}
                                    >
                                        <UserX className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
