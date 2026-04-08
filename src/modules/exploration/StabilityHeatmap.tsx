import { logger } from "../services/logger";
import { FC, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Flame, Activity, Info } from "lucide-react";
import { supabase } from "@/services/supabaseClient";

interface StabilityItem {
    id?: string;
    label?: string;
    source?: string;
    target?: string;
    volatility_score: number;
    stability_score: number;
}

export const StabilityHeatmap: FC = () => {
    const [nodes, setNodes] = useState<StabilityItem[]>([]);
    const [selected, setSelected] = useState<StabilityItem | null>(null);

    const fetchHeatmap = async () => {
        try {
            if (!supabase) return;
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/stability-heatmap', {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNodes(data.node_stability || []);
            }
        } catch (err) {
            logger.error(err);
        }
    };

    useEffect(() => {
        fetchHeatmap();
    }, []);

    const getStatus = (score: number) => {
        if (score > 0.7) return { label: 'اشتعال عالي', color: 'bg-red-500/20 border-red-500/40 text-red-500', icon: <Flame className="w-3 h-3" /> };
        if (score > 0.4) return { label: 'تذبذب ملحوظ', color: 'bg-orange-500/20 border-orange-500/40 text-orange-500', icon: <Activity className="w-3 h-3" /> };
        return { label: 'مسار مستقر', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500', icon: <ShieldAlert className="w-3 h-3" /> };
    };

    if (nodes.length === 0) {
        return (
            <div className="w-full max-w-[38rem] mx-auto mt-6 rounded-[2rem] border border-white/8 bg-slate-950/20 p-6 text-right backdrop-blur-xl">
                <p className="text-[10px] font-black tracking-[0.24em] text-red-200/70">رادار الاستقرار</p>
                <h3 className="mt-2 text-sm font-black text-white">لسه مفيش بيانات كفاية</h3>
                <p className="mt-2 text-xs leading-6 text-slate-400">
                    أول ما يبقى فيه سجل كفاية على الخريطة، هنقدر نرسم التذبذب هنا بدل الفراغ ده.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-[38rem] mx-auto mt-6 p-6 rounded-[2.5rem] bg-slate-950/20 border border-white/5 relative overflow-hidden backdrop-blur-xl">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
                        <Flame className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-[15px] font-black text-white leading-tight">رادار الاستقرار</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Stability & Volatility Map</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
                {nodes.map((node, i) => {
                    const status = getStatus(node.volatility_score);
                    return (
                        <motion.button
                            key={node.id || i}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelected(node)}
                            className={`p-4 rounded-3xl border transition-all text-right relative overflow-hidden ${status.color}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                {status.icon}
                                <span className="text-[13px] font-black">{node.label}</span>
                            </div>
                            <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${node.volatility_score * 100}%` }}
                                    className={`h-full ${node.volatility_score > 0.6 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                />
                            </div>
                            <p className="text-[9px] mt-2 font-bold uppercase tracking-tight opacity-70">
                                تذبذب: {Math.round(node.volatility_score * 100)}%
                            </p>
                        </motion.button>
                    );
                })}
            </div>

            {/* Selected Insight */}
            <AnimatePresence mode="wait">
                {selected && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="p-5 rounded-3xl bg-white/[0.03] border border-white/10"
                    >
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-xl bg-white/5 text-white/50">
                                <Info className="w-4 h-4" />
                            </div>
                            <div className="text-right flex-1">
                                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                                    المساحة "{selected.label}" {selected.volatility_score > 0.5 ? 'بتمر بحالة عدم استقرار حادة.' : 'في حالة مستقرة حالياً.'}
                                    {selected.volatility_score > 0.5 ? ' التذبذب هنا بيشير لقرارات أو مشاعر مش ثابتة وبتستنزف طاقة كبيرة منك.' : ' ده تم مستقر وتقدر تعتمد عليه كأرضية ثابتة.'}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Background Texture */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
        </div>
    );
};
