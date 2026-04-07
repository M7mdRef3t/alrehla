import React from 'react';
import { motion } from 'framer-motion';
import { ClientTrajectory } from '@/services/trajectoryEngine';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ExperienceTrajectoryProps {
    trajectory: ClientTrajectory;
}

export const ExperienceTrajectory: React.FC<ExperienceTrajectoryProps> = ({ trajectory }) => {
    const points = trajectory.points;
    const maxScore = 100;

    // Simple SVG Path generator for the trend line
    const generatePath = () => {
        if (points.length < 2) return "";
        const width = 300;
        const height = 100;
        const stepX = width / (points.length - 1);

        return points.map((p, i) => {
            const x = i * stepX;
            const y = height - (p.entropy_score / maxScore * height);
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(" ");
    };

    const getTrendIcon = () => {
        switch (trajectory.currentTrend) {
            case 'improving': return <TrendingDown className="w-4 h-4 text-emerald-500" />;
            case 'declining': return <TrendingUp className="w-4 h-4 text-rose-500" />;
            default: return <Minus className="w-4 h-4 text-slate-400" />;
        }
    };

    const getTrendText = () => {
        switch (trajectory.currentTrend) {
            case 'improving': return 'تحسن مستقر';
            case 'declining': return 'تصاعد في الفوضى';
            default: return 'استقرار';
        }
    };

    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm overflow-hidden relative">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">مسار الإنتروبيا النفسية</h5>
                    <div className="flex items-center gap-2">
                        {getTrendIcon()}
                        <span className="text-sm font-bold text-slate-700">{getTrendText()}</span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-black text-slate-900">{trajectory.riskProbability}%</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">المستوى الحالي</div>
                </div>
            </div>

            <div className="h-24 w-full relative mt-4">
                <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Background Path */}
                    <path
                        d={`${generatePath()} L 300 100 L 0 100 Z`}
                        fill="url(#gradient)"
                        className="animate-in fade-in duration-1000"
                    />

                    {/* Line Path */}
                    <motion.path
                        d={generatePath()}
                        fill="none"
                        stroke="rgb(99, 102, 241)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                    />

                    {/* Points */}
                    {points.map((p, i) => {
                        const width = 300;
                        const height = 100;
                        const stepX = width / (points.length - 1);
                        const x = i * stepX;
                        const y = height - (p.entropy_score / maxScore * height);
                        return (
                            <circle
                                key={i}
                                cx={x}
                                cy={y}
                                r="4"
                                className={`${p.entropy_score > 70 ? 'fill-rose-500' : 'fill-indigo-500'} stroke-white stroke-2 shadow-sm`}
                            />
                        );
                    })}
                </svg>
            </div>

            <div className="mt-4 flex justify-between text-[10px] text-slate-400 font-bold">
                <span>بداية القياس</span>
                <span>الآن</span>
            </div>
        </div>
    );
};
