import type { FC } from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, X, ShieldAlert, ShieldCheck, ShieldBan } from "lucide-react";
import { soundManager } from "@/services/soundManager";

type ShieldLevel = "weak" | "medium" | "strong";

interface Scenario {
    id: string;
    title: string;
    incomingAttack: string; // The request/attack
    options: {
        level: ShieldLevel;
        text: string;
        feedback: string;
        damage: number; // 0-100
    }[];
}

const SHIELD_SCENARIOS: Scenario[] = [
    {
        id: "time_vampire",
        title: "هجوم الوقت",
        incomingAttack: "ممكن نتكلم 5 دقايق؟ (وبيقعد ساعة)",
        options: [
            {
                level: "weak",
                text: "معلش أنا مشغول والله، أصل عندي... (تبرير)",
                feedback: "التبرير بيفتح باب للنقاش والاختراق. درعك اتشرخ.",
                damage: 40
            },
            {
                level: "medium",
                text: "طب نخليهم 5 دقايق بجد عشان ورايا حاجات.",
                feedback: "تفاوضت على حقك. درعك صمد بس خد خبطة.",
                damage: 15
            },
            {
                level: "strong",
                text: "مش هينفع دلوقتي. ممكن نتكلم بكرة.",
                feedback: "الـ 'لأ' الواضحة هي أقوى درع. صد كامل.",
                damage: 0
            }
        ]
    },
    {
        id: "money_leech",
        title: "استنزاف الموارد",
        incomingAttack: "محتاج سلفة عشان زنقة (للمرة العاشرة)",
        options: [
            {
                level: "weak",
                text: "والله لسه دافع قسط و... (تبرير)",
                feedback: "تخيل إنك بتدافع عن فلوسك! التبرير ضعف.",
                damage: 50
            },
            {
                level: "medium",
                text: "معيش غير مبلغ بسيط ممكن أديهولك.",
                feedback: "خسرت جزء من مواردك عشان تشتري راحة بالك.",
                damage: 25
            },
            {
                level: "strong",
                text: "مش هقدر أسلفك المرة دي. أتمنى تلاقي حل.",
                feedback: "حماية كاملة للموارد. القائد بيعرف يقول لأ.",
                damage: 0
            }
        ]
    },
    {
        id: "emotional_dump",
        title: "إغراق عاطفي",
        incomingAttack: "أنا مخنوق وعايز أحكيلك (رمي حمل)",
        options: [
            {
                level: "weak",
                text: "حبيبي مالك؟ احكيلي (وانت طاقتك صفر)",
                feedback: "فتحت بواباتك وانت معندكش طاقة. استنزاف مؤكد.",
                damage: 70
            },
            {
                level: "medium",
                text: "هسمعك بس مش هقدر أطول.",
                feedback: "حطيت حد زمني، لكن لسه استقبلت الشحنة.",
                damage: 20
            },
            {
                level: "strong",
                text: "أنا مش في حالة تسمح أسمع دلوقتي. نتكلم بعدين.",
                feedback: "حماية للذات من العدوى الشعورية. برافو.",
                damage: 0
            }
        ]
    }
];

interface ShieldSelectorProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ShieldSelector: FC<ShieldSelectorProps> = ({ isOpen, onClose }) => {
    const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
    const [shieldHealth, setShieldHealth] = useState(100);
    const [result, setResult] = useState<{ feedback: string; level: ShieldLevel } | null>(null);

    const handleSelectScenario = (scenario: Scenario) => {
        setSelectedScenario(scenario);
        setShieldHealth(100);
        setResult(null);
        soundManager.playShieldActivate();
    };

    const handleOptionSelect = (option: typeof SHIELD_SCENARIOS[0]["options"][0]) => {
        const newHealth = Math.max(0, 100 - option.damage);
        setShieldHealth(newHealth);
        setResult({ feedback: option.feedback, level: option.level });
    };

    const reset = () => {
        setSelectedScenario(null);
        setShieldHealth(100);
        setResult(null);
    };

    const getShieldIcon = () => {
        if (shieldHealth >= 80) return <ShieldCheck className="w-24 h-24 text-emerald-500" />;
        if (shieldHealth >= 40) return <ShieldAlert className="w-24 h-24 text-amber-500" />;
        return <ShieldBan className="w-24 h-24 text-rose-500" />;
    };

    const getShieldColor = () => {
        if (shieldHealth >= 80) return "text-emerald-500 border-emerald-500 shadow-emerald-500/50";
        if (shieldHealth >= 40) return "text-amber-500 border-amber-500 shadow-amber-500/50";
        return "text-rose-500 border-rose-500 shadow-rose-500/50";
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded bg-blue-500/10 border border-blue-500/20">
                                    <Shield className="w-4 h-4 text-blue-500" />
                                </div>
                                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                                    نظام الدروع (NO Shield)
                                </h2>
                            </div>
                            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5">
                            {!selectedScenario ? (
                                // Scenario Selection
                                <div className="space-y-4">
                                    <p className="text-slate-300 text-sm text-center mb-4">
                                        اختر نوع الهجوم لتفعيل الدرع المناسب
                                    </p>
                                    <div className="grid gap-3">
                                        {SHIELD_SCENARIOS.map((scenario) => (
                                            <button
                                                key={scenario.id}
                                                onClick={() => handleSelectScenario(scenario)}
                                                className="flex items-center justify-between p-4 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 hover:border-slate-500 transition-all text-right group"
                                            >
                                                <span className="font-bold text-slate-200 group-hover:text-white">
                                                    {scenario.title}
                                                </span>
                                                <Shield className="w-5 h-5 text-slate-500 group-hover:text-blue-400" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : !result ? (
                                // Shield Activation (Options)
                                <div className="space-y-6">
                                    <div className="text-center space-y-2">
                                        <span className="text-xs font-mono text-rose-400">INCOMING ATTACK detected</span>
                                        <h3 className="text-xl font-bold text-white bg-rose-500/10 border border-rose-500/30 p-3 rounded-lg">
                                            "{selectedScenario.incomingAttack}"
                                        </h3>
                                    </div>

                                    <div className="flex justify-center py-4">
                                        <motion.div
                                            animate={{ scale: [1, 1.05, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className={`w-32 h-32 rounded-full border-4 flex items-center justify-center bg-slate-800 ${getShieldColor()}`}
                                            style={{ boxShadow: `0 0 20px currentColor` }}
                                        >
                                            <Shield className="w-16 h-16" />
                                        </motion.div>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-400 text-center">كيف ستتصدى للهجوم؟</p>
                                        {selectedScenario.options.map((option, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleOptionSelect(option)}
                                                className="w-full p-3 bg-slate-800 border-l-4 border-slate-600 hover:border-blue-500 hover:bg-slate-700 text-right rounded-r-lg transition-all"
                                            >
                                                {option.text}
                                            </button>
                                        ))}
                                    </div>

                                    <button onClick={reset} className="text-xs text-slate-500 hover:text-slate-300 w-full text-center">
                                        العودة للقائمة
                                    </button>
                                </div>
                            ) : (
                                // Result
                                <div className="text-center space-y-6 py-4">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className={`mx-auto w-40 h-40 rounded-full border-4 flex flex-col items-center justify-center bg-slate-800 relative ${shieldHealth >= 80 ? "border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)]" :
                                            shieldHealth >= 40 ? "border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.4)]" :
                                                "border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.4)]"
                                            }`}
                                    >
                                        {getShieldIcon()}
                                        <span className={`absolute -bottom-3 px-3 py-1 rounded-full text-xs font-bold bg-slate-900 border ${shieldHealth >= 80 ? "text-emerald-500 border-emerald-500" :
                                            shieldHealth >= 40 ? "text-amber-500 border-amber-500" :
                                                "text-rose-500 border-rose-500"
                                            }`}>
                                            Integrity: {shieldHealth}%
                                        </span>
                                    </motion.div>

                                    <div className={`p-4 rounded-xl border ${result.level === "strong" ? "bg-emerald-900/20 border-emerald-800 text-emerald-200" :
                                        result.level === "medium" ? "bg-amber-900/20 border-amber-800 text-amber-200" :
                                            "bg-rose-900/20 border-rose-800 text-rose-200"
                                        }`}>
                                        <p className="font-semibold text-lg mb-2">
                                            {result.level === "strong" ? "صد ناجح! (Perfect Block)" :
                                                result.level === "medium" ? "صد جزئي (Damage Taken)" :
                                                    "اختراق للدفاعات (Shield Crack)"}
                                        </p>
                                        <p className="text-sm opacity-90">{result.feedback}</p>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={reset}
                                            className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                                        >
                                            مناورة أخرى
                                        </button>
                                        <button
                                            onClick={onClose}
                                            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-600 transition-colors"
                                        >
                                            إنهاء التدريب
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
