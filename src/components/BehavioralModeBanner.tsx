import { FC } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, TrendingUp, Zap, Target } from "lucide-react";

type BehavioralMode = "containment" | "growth" | "flow";

interface BehavioralModeBannerProps {
    mode: BehavioralMode;
    entropyScore?: number; // 0-100
}

const MODE_CONFIG = {
    containment: {
        icon: ShieldAlert,
        label: "وضع الاحتواء",
        sublabel: "احتواء",
        description: "الأنظمة ترصد فوضى عالية. المهام مُبسَّطة. ركز على خطوة واحدة فقط.",
        gradient: "from-rose-900/40 to-slate-900/60",
        border: "border-rose-500/30",
        iconColor: "text-rose-400",
        badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
        dot: "bg-rose-400",
        tip: "الإجراء الآن: اقفل أي مهمة جديدة واختر خطوة واحدة قصيرة فقط.",
    },
    growth: {
        icon: TrendingUp,
        label: "وضع النمو",
        sublabel: "نمو",
        description: "المدارات مستقرة. الطاقة متاحة للتوسع. حان وقت التحدي الكبير.",
        gradient: "from-blue-900/40 to-slate-900/60",
        border: "border-blue-500/30",
        iconColor: "text-blue-400",
        badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        dot: "bg-blue-400",
        tip: "الإجراء الآن: افتح ملفًا صعبًا واحدًا وحدد له خطوة تنفيذ خلال 15 دقيقة.",
    },
    flow: {
        icon: Target,
        label: "وضع التدفق",
        sublabel: "تدفق",
        description: "أنت في حالة تدفق كاملة. النظام في وضع المراقب الصامت.",
        gradient: "from-emerald-900/40 to-slate-900/60",
        border: "border-emerald-500/30",
        iconColor: "text-emerald-400",
        badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        dot: "bg-emerald-400",
        tip: "الإجراء الآن: نفّذ المهمة الأهم قبل أي تنقل أو تشتيت.",
    },
};

export const BehavioralModeBanner: FC<BehavioralModeBannerProps> = ({ mode, entropyScore }) => {
    const config = MODE_CONFIG[mode];
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`w-full bg-gradient-to-r ${config.gradient} border ${config.border} rounded-2xl p-4 mb-4 relative overflow-hidden`}
        >
            {/* Subtle animated glow */}
            <motion.div
                className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-30 ${config.dot}`}
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 3, repeat: Infinity }}
            />

            <div className="flex items-start gap-3 relative z-10">
                {/* Icon */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${config.badgeColor} border`}>
                    <Icon className={`w-4 h-4 ${config.iconColor}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${config.badgeColor}`}>
                            {config.label}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{config.sublabel}</span>
                        {/* Live dot */}
                        <span className="flex items-center gap-1 mr-auto">
                            <motion.span
                                className={`w-1.5 h-1.5 rounded-full ${config.dot}`}
                                animate={{ opacity: [1, 0.3, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                            <span className="text-[10px] text-slate-500">نشط</span>
                        </span>
                    </div>

                    <p className="text-sm text-slate-300 leading-relaxed mb-2">{config.description}</p>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Zap className="w-3 h-3" />
                        <span>{config.tip}</span>
                    </div>

                    {/* Entropy bar (only in containment) */}
                    {mode === "containment" && entropyScore !== undefined && (
                        <div className="mt-3">
                            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                                <span>مستوى الفوضى</span>
                                <span>{entropyScore}%</span>
                            </div>
                            <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-rose-500 to-orange-400 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${entropyScore}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
