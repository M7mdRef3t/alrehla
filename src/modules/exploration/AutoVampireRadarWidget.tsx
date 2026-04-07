import type { FC } from "react";
import { useMemo } from "react";
import { Radar, Ghost, AlertOctagon } from "lucide-react";
import { useMapState } from "@/state/mapState";

export const AutoVampireRadarWidget: FC = () => {
    const nodes = useMapState((s) => s.nodes);

    const vampireList = useMemo(() => {
        const now = Date.now();
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        const sevenDaysAgo = now - SEVEN_DAYS_MS;

        const stats = nodes.map((node) => {
            // Calculate total drain in the last 7 days from transactions
            const recentDrain = (node.energyBalance?.transactions || [])
                .filter((t) => t.timestamp >= sevenDaysAgo && t.amount < 0)
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);

            return {
                id: node.id,
                label: node.label,
                recentDrain,
            };
        });

        // Sort by largest drain and take top 3
        return stats
            .filter((s) => s.recentDrain > 0)
            .sort((a, b) => b.recentDrain - a.recentDrain)
            .slice(0, 3);

    }, [nodes]);

    if (vampireList.length === 0) return null;

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mt-4 relative overflow-hidden">
            {/* Radar Sweep Effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse" />

            <div className="flex items-center gap-2 mb-3">
                <Radar className="w-5 h-5 text-rose-500" />
                <h4 className="font-bold text-sm text-slate-200">رادار مصاصي الطاقة</h4>
            </div>

            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                تحذير استباقي: هؤلاء الأشخاص هم الأكثر استنزافاً لطاقتك خلال الـ 7 أيام الماضية. يرجى توخي الحذر أو تفعيل درع الحماية قبل مقابلتهم.
            </p>

            <div className="space-y-2">
                {vampireList.map((v, index) => (
                    <div key={v.id} className="flex items-center justify-between bg-slate-800/80 rounded-lg p-2 border border-rose-500/10">
                        <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-rose-500/20 text-rose-400 flex items-center justify-center text-[10px] font-bold">
                                #{index + 1}
                            </span>
                            <span className="text-[13px] font-medium text-slate-200">{v.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-rose-400">
                            <Ghost className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold">-{v.recentDrain}</span>
                        </div>
                    </div>
                ))}
            </div>

            {vampireList.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-center gap-2 text-[10px] font-bold text-rose-500/80">
                    <AlertOctagon className="w-3.5 h-3.5" />
                    <span>ينصح بتقليل الاحتكاك المباشر أو تجميد العلاقات مؤقتاً.</span>
                </div>
            )}
        </div>
    );
};
