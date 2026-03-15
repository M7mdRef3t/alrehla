import type { FC } from "react";
import { useMemo } from "react";
import { Tag, TrendingDown } from "lucide-react";
import { usePulseState } from "../state/pulseState";

const TOPIC_LABELS: Record<string, string> = {
    work: "العمل",
    family: "العائلة",
    relationships: "العلاقات",
    health: "الصحة",
    finance: "المال",
    future: "المستقبل"
};

export const TopicTaxWidget: FC = () => {
    const pulseLogs = usePulseState((s) => s.logs);

    const topicStats = useMemo(() => {
        const stats: Record<string, { totalEnergy: number; count: number }> = {};

        pulseLogs.forEach((log) => {
            if (log.topics && log.topics.length > 0) {
                log.topics.forEach((topic) => {
                    if (!stats[topic]) {
                        stats[topic] = { totalEnergy: 0, count: 0 };
                    }
                    stats[topic].totalEnergy += log.energy;
                    stats[topic].count += 1;
                });
            }
        });

        const results = Object.entries(stats).map(([topic, data]) => ({
            id: topic,
            label: TOPIC_LABELS[topic] || topic,
            avgEnergy: data.totalEnergy / data.count,
            count: data.count
        }));

        // Sort by lowest average energy first (most draining)
        return results.sort((a, b) => a.avgEnergy - b.avgEnergy).slice(0, 3);
    }, [pulseLogs]);

    if (topicStats.length === 0) return null;

    return (
        <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
                <Tag className="w-5 h-5 text-indigo-400" />
                <h4 className="font-bold text-sm text-slate-200">ضريبة المواضيع (Topic Tax)</h4>
            </div>

            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                أكثر المواضيع التي تستهلك طاقتك عند مناقشتها أو التفكير فيها مؤخراً (متوسط طاقة أقل = استنزاف أعلى).
            </p>

            <div className="space-y-3 mt-4">
                {topicStats.map((topic, index) => {
                    // Normalize average energy from 0-10 to a percentage for the bar
                    const fillPercentage = Math.max(0, Math.min(100, (topic.avgEnergy / 10) * 100));
                    const isDanger = topic.avgEnergy <= 4;
                    const barColor = isDanger ? "bg-rose-500" : (topic.avgEnergy <= 6 ? "bg-amber-500" : "bg-teal-500");
                    const textColor = isDanger ? "text-rose-400" : (topic.avgEnergy <= 6 ? "text-amber-400" : "text-teal-400");

                    return (
                        <div key={topic.id} className="bg-slate-800/50 rounded-lg p-3 border border-indigo-500/10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[13px] font-bold text-slate-200">{topic.label}</span>
                                <div className={`flex items-center gap-1.5 ${textColor} font-bold text-xs`}>
                                    {isDanger && <TrendingDown className="w-3.5 h-3.5" />}
                                    <span>{topic.avgEnergy.toFixed(1)} / 10</span>
                                </div>
                            </div>

                            {/* Energy bar visualizing the average */}
                            <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${barColor} rounded-full transition-all duration-1000`}
                                    style={{ width: `${fillPercentage}%` }}
                                />
                            </div>
                            <p className="text-[9px] text-slate-500 mt-1.5 font-medium">سُجلت في {topic.count} نبضات</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
