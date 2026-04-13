import type { FC } from "react";
import { useMemo } from "react";
import { useMapState } from '@/modules/map/dawayirIndex';
import type { MapNode } from "../map/mapTypes";

export const WeeklyEnergyWrapWidget: FC = () => {
    const nodes = useMapState((s) => s.nodes);

    const { totalDrain, totalCharge, topDrainer, topCharger } = useMemo(() => {
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        let drain = 0;
        let charge = 0;

        let maxDrainAmount = 0;
        let maxChargeAmount = 0;
        let dNode = null as MapNode | null;
        let cNode = null as MapNode | null;

        nodes.forEach((node) => {
            if (!node.energyBalance?.transactions) return;

            let nodeDrain = 0;
            let nodeCharge = 0;

            node.energyBalance.transactions.forEach((tx) => {
                if (tx.timestamp >= oneWeekAgo) {
                    if (tx.amount < 0) {
                        drain += Math.abs(tx.amount);
                        nodeDrain += Math.abs(tx.amount);
                    } else if (tx.amount > 0) {
                        charge += tx.amount;
                        nodeCharge += tx.amount;
                    }
                }
            });

            if (nodeDrain > maxDrainAmount) {
                maxDrainAmount = nodeDrain;
                dNode = node;
            }
            if (nodeCharge > maxChargeAmount) {
                maxChargeAmount = nodeCharge;
                cNode = node;
            }
        });

        return {
            totalDrain: drain,
            totalCharge: charge,
            topDrainer: dNode,
            topCharger: cNode,
        };
    }, [nodes]);

    if (totalDrain === 0 && totalCharge === 0) {
        return (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-slate-400 text-sm text-center">
                لا يوجد نشاط طاقي مسجل هذا الأسبوع.
            </div>
        );
    }

    const netEnergy = totalCharge - totalDrain;

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex justify-between items-center bg-slate-800/80 rounded-xl p-3">
                <div className="text-right">
                    <p className="text-xs text-slate-400 mb-1">النزيف الأسبوعي</p>
                    <div className="flex items-center gap-2">
                        <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                            +{totalCharge} شحن
                        </span>
                        <span className="text-xs bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-bold">
                            -{totalDrain} استنزاف
                        </span>
                    </div>
                </div>
                <div className="text-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">الصافي</p>
                    <p className={`text-2xl font-black ${netEnergy > 0 ? "text-emerald-400" : netEnergy < 0 ? "text-rose-400" : "text-slate-300"}`}>
                        {netEnergy > 0 ? "+" : ""}{netEnergy}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {topCharger && (
                    <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-xl p-3 text-right">
                        <p className="text-[10px] text-emerald-500 mb-1 flex items-center justify-end gap-1">
                            <span>أكبر مصدر شحن</span>
                            <span className="text-xs">⚡</span>
                        </p>
                        <p className="font-bold text-emerald-100 truncate text-sm">{topCharger.label}</p>
                    </div>
                )}

                {topDrainer && (
                    <div className="bg-rose-950/30 border border-rose-900/50 rounded-xl p-3 text-right">
                        <p className="text-[10px] text-rose-500 mb-1 flex items-center justify-end gap-1">
                            <span>أكبر مصدر استنزاف</span>
                            <span className="text-xs">🩸</span>
                        </p>
                        <p className="font-bold text-rose-100 truncate text-sm">{topDrainer.label}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
