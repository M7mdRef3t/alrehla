import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ShieldAlert, Zap, X, Trophy, AlertCircle, ChevronRight, CheckCircle2 } from "lucide-react";
import { useGamificationState } from "../state/gamificationState";

interface Scenario {
    id: string;
    title: string;
    description: string;
    options: {
        text: string;
        isCorrect: boolean;
        feedback: string;
        energyImpact: number;
    }[];
}

const SCENARIOS: Scenario[] = [
    {
        id: "s1",
        title: "طلب عاجل وقت الاستنزاف",
        description: "زميلك في الشغل بيتصل بيك يوم إجازتك ويطلب منك تخلص تاسك بسرعة 'عشان خاطر العيش والملح'. أنت طاقتك 10% وحاسس باحتراق.",
        options: [
            {
                text: "أوافق بس أقوله دي آخر مرة (بتحصل كل مرة).",
                isCorrect: false,
                feedback: "'دي آخر مرة' هي أكبر كذبة بنقولها لنفسنا. طاقتك هتزيد استنزاف والشخص هيتعود إن حدودك مطاطة.",
                energyImpact: -50,
            },
            {
                text: "أتجاهل المكالمة تماماً وأعمله بلوك.",
                isCorrect: false,
                feedback: "الهروب مش أصدق طريقة لرسم الحدود، ده بيخلق توتر خفي (Hidden Anxiety). المواجهة الهادية أفضل.",
                energyImpact: -10,
            },
            {
                text: "أرد وأقول بحزم: 'مقّدر الموقف، بس أنا فصلت تماماً النهارده. نتكلم بكرة في الشغل.'",
                isCorrect: true,
                feedback: "برافو! رسم الحدود المباشر والواضح. الشخص هيحترمك أكتر وطاقتك هتتحفظ.",
                energyImpact: 50,
            }
        ]
    },
    {
        id: "s2",
        title: "الابتزاز العاطفي (Guilt Trip)",
        description: "حد من قرايبك بيقولك 'إنت اتغيرت وبقيت أناني ومبقتش تسأل'، لأنك بقيت تقلل زياراتك اللي كانت بتستنزفك.",
        options: [
            {
                text: "أحس بالذنب وأروح أزورهم بكرة فوراً.",
                isCorrect: false,
                feedback: "الابتزاز العاطفي اشتغل! أنت كده بتكافئ سلوكهم السام بإنك تديهم اللي هما عايزينه على حساب صحتك.",
                energyImpact: -80,
            },
            {
                text: "أوضح بهدوء: 'أنا مش أناني، أنا بحاول أوازن حياتي عشان أقدر أكون موجود بشكل صحي للكل.'",
                isCorrect: true,
                feedback: "رد عظيم (Assertive Communication). أنت بتدافع عن مساحتك من غير هجوم.",
                energyImpact: 100,
            },
            {
                text: "أقوله 'أيوة أنا أناني' وأقفل في وشه.",
                isCorrect: false,
                feedback: "العدائية مش دايماً صح. دي بتخلق دراما جديدة هتسحب من طاقتك بعدين.",
                energyImpact: -20,
            }
        ]
    },
    {
        id: "s3",
        title: "مصاص طاقة بيعمل دراما",
        description: "صديق (Vampire) بيتصل يشتكي من نفس المشكلة للمرة الألف، وبيرفض كل الحلول وبس عايز يرمي حموله عليك.",
        options: [
            {
                text: "أسمعه بالساعات وأحاول ألاقيله حلول جديدة.",
                isCorrect: false,
                feedback: "أنت بتلعب دور 'المنقذ' (Savior Complex). ده هيخلص طاقتك وهو مش هيتغير.",
                energyImpact: -100,
            },
            {
                text: "أقلل كلامي وأقول مساحة 'أها، ربنا معاك'، وأنهي المكالمة بسرعة.",
                isCorrect: true,
                feedback: "تكتيك 'الصخرة الرمادية' (Grey Rocking) ممتاز! مبتديهوش طاقة يتغذى عليها.",
                energyImpact: 80,
            }
        ]
    }
];

interface BoundariesMinigameProps {
    isOpen: boolean;
    onClose: () => void;
}

export const BoundariesMinigame: React.FC<BoundariesMinigameProps> = ({ isOpen, onClose }) => {
    const [currentStep, setCurrentStep] = useState<number>(-1); // -1 is Intro, 0-2 are scenarios, 3 is Outro
    const [score, setScore] = useState({ correct: 0, energy: 0 });
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);

    const { addXP, awardBadge } = useGamificationState();

    if (!isOpen) return null;

    const startGame = () => setCurrentStep(0);

    const handleOptionSelect = (index: number) => {
        if (showFeedback) return;
        setSelectedOption(index);
        setShowFeedback(true);

        const option = SCENARIOS[currentStep].options[index];
        setScore(prev => ({
            correct: prev.correct + (option.isCorrect ? 1 : 0),
            energy: prev.energy + option.energyImpact
        }));
    };

    const nextStep = () => {
        setSelectedOption(null);
        setShowFeedback(false);
        if (currentStep < SCENARIOS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            setCurrentStep(SCENARIOS.length); // Outro
            finishGame();
        }
    };

    const finishGame = () => {
        const totalCorrect = score.correct + (selectedOption !== null && SCENARIOS[currentStep]?.options[selectedOption]?.isCorrect ? 1 : 0);

        // Grant Rewards
        const earnedXP = totalCorrect * 150;
        addXP(earnedXP, "إكمال التدريب التفاعلي لرسم الحدود");

        if (totalCorrect === SCENARIOS.length) {
            awardBadge("shield-master", "درع التيتانيوم", "أظهرت صلابة في حماية حدودك النفسية في جميع المواقف.", "🛡️");
        }
    };

    const resetAndClose = () => {
        setCurrentStep(-1);
        setScore({ correct: 0, energy: 0 });
        setSelectedOption(null);
        setShowFeedback(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={resetAndClose}
                className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-[500px]"
                dir="rtl"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center border border-violet-500/30">
                            <Shield className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-slate-100 text-sm">محاكي رسم الحدود (Boundaries Simulator)</h3>
                            <p className="text-[11px] text-slate-400">تدريب عملي لتقوية مناعتك النفسية</p>
                        </div>
                    </div>
                    <button onClick={resetAndClose} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 p-6 flex flex-col justify-center relative">
                    <AnimatePresence mode="wait">

                        {/* INTRO STEP */}
                        {currentStep === -1 && (
                            <motion.div
                                key="intro"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="text-center"
                            >
                                <div className="w-24 h-24 mx-auto rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-6">
                                    <ShieldAlert className="w-12 h-12 text-violet-400" />
                                </div>
                                <h1 className="text-2xl font-black text-white mb-4">اختبر صلابة دروعك النفسية</h1>
                                <p className="text-slate-400 max-w-md mx-auto mb-8 leading-relaxed text-sm">
                                    رسم الحدود مهارة بتيجي بالتدريب. في المحاكي ده، هنحطك في مواقف استنزاف حقيقية،
                                    ونشوف قراراتك هتأثر إزاي على طاقتك (Energy ROI).
                                </p>
                                <button
                                    onClick={startGame}
                                    className="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl shadow-lg shadow-violet-900/50 transition-all flex items-center justify-center gap-2 mx-auto"
                                >
                                    ابدأ المحاكاة <ChevronRight className="w-5 h-5" />
                                </button>
                            </motion.div>
                        )}

                        {/* GAMEPLAY STEPS */}
                        {currentStep >= 0 && currentStep < SCENARIOS.length && (
                            <motion.div
                                key={`scenario-${currentStep}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex flex-col h-full"
                            >
                                <div className="mb-6 flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    <span>الموقف {currentStep + 1} / {SCENARIOS.length}</span>
                                    <span className="flex items-center gap-1 text-emerald-400"><Zap className="w-4 h-4" /> طاقة الحصيلة: {score.energy > 0 ? `+${score.energy}` : score.energy}</span>
                                </div>

                                <h2 className="text-xl font-black text-violet-300 mb-2">{SCENARIOS[currentStep].title}</h2>
                                <p className="text-slate-300 mb-8 leading-relaxed text-sm bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                    {SCENARIOS[currentStep].description}
                                </p>

                                <div className="space-y-3">
                                    {SCENARIOS[currentStep].options.map((option, idx) => {
                                        let btnClass = "border-slate-700 bg-slate-800/80 hover:bg-slate-700 hover:border-violet-500/50 text-slate-200";

                                        if (showFeedback) {
                                            if (idx === selectedOption) {
                                                btnClass = option.isCorrect
                                                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-200"
                                                    : "border-rose-500 bg-rose-500/20 text-rose-200";
                                            } else {
                                                btnClass = "border-slate-800 bg-slate-900/50 text-slate-600 opacity-50";
                                            }
                                        }

                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleOptionSelect(idx)}
                                                disabled={showFeedback}
                                                className={`w-full text-right p-4 rounded-xl border transition-all duration-300 ${btnClass}`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`mt-1 w-4 h-4 rounded-full border-2 flex-shrink-0 ${showFeedback && idx === selectedOption ? (option.isCorrect ? 'border-emerald-400 bg-emerald-400' : 'border-rose-400 bg-rose-400') : 'border-slate-500'}`} />
                                                    <span className="text-sm font-medium">{option.text}</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Feedback Area */}
                                <AnimatePresence>
                                    {showFeedback && selectedOption !== null && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, height: 0 }}
                                            animate={{ opacity: 1, y: 0, height: "auto" }}
                                            className="mt-6 p-4 rounded-xl bg-slate-950/50 border border-slate-800 flex items-start gap-4"
                                        >
                                            {SCENARIOS[currentStep].options[selectedOption].isCorrect ? (
                                                <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                                            ) : (
                                                <AlertCircle className="w-8 h-8 text-rose-400 flex-shrink-0" />
                                            )}
                                            <div className="flex-1">
                                                <h4 className={`font-bold mb-1 ${SCENARIOS[currentStep].options[selectedOption].isCorrect ? "text-emerald-400" : "text-rose-400"}`}>
                                                    التفسير السلوكي:
                                                </h4>
                                                <p className="text-sm text-slate-300 leading-relaxed mb-3">
                                                    {SCENARIOS[currentStep].options[selectedOption].feedback}
                                                </p>
                                                <button
                                                    onClick={nextStep}
                                                    className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold transition-colors w-max"
                                                >
                                                    {currentStep === SCENARIOS.length - 1 ? "إنهاء التقييم" : "الموقف التالي"}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}

                        {/* OUTRO STEP */}
                        {currentStep === SCENARIOS.length && (
                            <motion.div
                                key="outro"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center"
                            >
                                <div className="w-24 h-24 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 relative">
                                    <Trophy className="w-12 h-12 text-emerald-400" />
                                    <motion.div
                                        className="absolute -inset-4 border-2 border-emerald-500/30 rounded-full"
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                </div>

                                <h1 className="text-3xl font-black text-white mb-2">انتهت المحاكاة</h1>
                                <p className="text-slate-400 mb-8">قراراتك بتعكس درجة مناعتك ومساحاتك.</p>

                                <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-8">
                                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                                        <p className="text-xs text-slate-400 mb-1">القرارات السليمة</p>
                                        <p className="text-2xl font-black text-emerald-400">{score.correct} / {SCENARIOS.length}</p>
                                    </div>
                                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                                        <p className="text-xs text-slate-400 mb-1">صافي الطاقة المتوقعة</p>
                                        <p className={`text-2xl font-black ${score.energy >= 0 ? 'text-violet-400' : 'text-rose-400'}`}>
                                            {score.energy > 0 ? `+${score.energy}` : score.energy}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4 bg-emerald-900/20 text-emerald-200 text-sm font-medium rounded-xl border border-emerald-500/20 max-w-md mx-auto mb-8">
                                    تم منحك {score.correct * 150} نقطة استبصار (XP) لتعلمك حماية حدودك!
                                </div>

                                <button
                                    onClick={resetAndClose}
                                    className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
                                >
                                    العودة للوحة القيادة
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};
