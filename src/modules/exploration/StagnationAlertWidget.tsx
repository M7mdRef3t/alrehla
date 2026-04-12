import type { FC } from "react";
import { useMemo } from "react";
import { AlertTriangle, Clock } from "lucide-react";
import { useMapState } from "@/domains/dawayir/store/map.store";

export const StagnationAlertWidget: FC = () => {
    const nodes = useMapState((s) => s.nodes);

    const stagnantNodes = useMemo(() => {
        const now = Date.now();
        return nodes
            .filter((n) => {
                if (!n.lastRingChangeAt) return false;
                const timeInState = now - n.lastRingChangeAt;
                // The thresholds mirror what is in useHiddenFootprint
                if (n.isNodeArchived && timeInState >= 10 * 60 * 1000) return true;
                if (n.ring === "red" && timeInState >= 2 * 60 * 1000) return true;
                if (n.ring === "yellow" && timeInState >= 5 * 60 * 1000) return true;
                return false;
            })
            .map((n) => ({
                id: n.id,
                label: n.label,
                type: n.isNodeArchived ? "zeroCircle" : n.ring,
            }));
    }, [nodes]);

    if (stagnantNodes.length === 0) return null;

    return (
        <div className="bg-rose-950/40 border border-rose-900/60 rounded-xl p-4 mt-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-start gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="flex-1 text-right">
                    <h4 className="font-bold text-sm text-rose-200 mb-1">تنبيه: البصمة الخفية للركود</h4>
                    <p className="text-xs leading-relaxed text-rose-300/80 mb-3">
                        السيستم بيسجل غرامة سحب طاقة من رصيدك لأن العلاقات دي معلقة في مناطق خطرة بدون اتخاذ قرار:
                    </p>

                    <div className="space-y-2">
                        {stagnantNodes.map((n) => (
                            <div key={n.id} className="flex items-center justify-between bg-rose-950/50 rounded-lg py-1.5 px-3">
                                <span className="text-xs text-rose-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {n.type === "zeroCircle" ? "-1 طاقة" : n.type === "red" ? "-5 طاقة" : "-2 طاقة"}
                                </span>
                                <span className="font-bold text-[13px] text-white">{n.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
