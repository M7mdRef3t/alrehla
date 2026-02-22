import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, Target, AlertTriangle, CheckCircle2, ChevronRight, RotateCcw, Brain, Terminal } from 'lucide-react';
import { symptomScenariosDatabase } from '../../data/symptomScenarios';

interface SymptomSimulationProps {
    detectedSymptoms: string[];
    onComplete?: (score: number) => void;
    onClose: () => void;
}

export const SymptomSimulation: React.FC<SymptomSimulationProps> = ({
    detectedSymptoms,
    onComplete,
    onClose
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    // Filter scenarios based on detected symptoms
    const relevantScenarios = useMemo(() => {
        const filtered = symptomScenariosDatabase.filter(s =>
            detectedSymptoms.includes(s.symptomId)
        );
        // If no matches, show some general ones or high priority ones
        return filtered.length > 0 ? filtered.slice(0, 3) : symptomScenariosDatabase.slice(0, 3);
    }, [detectedSymptoms]);

    const currentScenario = relevantScenarios[currentIndex];

    const handleOptionSelect = (optionId: string) => {
        if (showFeedback) return;
        setSelectedOption(optionId);
        setShowFeedback(true);

        const option = currentScenario.options.find(o => o.id === optionId);
        if (option?.isCorrect) {
            setScore(prev => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < relevantScenarios.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setShowFeedback(false);
        } else {
            setIsFinished(true);
            if (onComplete) onComplete(Math.round((score / relevantScenarios.length) * 100));
        }
    };

    if (isFinished) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 text-center space-y-6"
            >
                <div className="w-20 h-20 bg-teal-500/20 border border-teal-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-10 h-10 text-teal-400" />
                </div>
                <h3 className="text-2xl font-black text-white tracking-widest font-mono uppercase">اكتمل_البروتوكول</h3>
                <p className="text-slate-400 font-mono text-sm">
                    {score === relevantScenarios.length
                        ? "مستوى_السيادة: أقصى. لقد نجحت في الدفاع عن حدودك."
                        : `مستوى_السيادة: ${Math.round((score / relevantScenarios.length) * 100)}%. مطلوب استمرار التدريب.`}
                </p>

                <div className="grid grid-cols-2 gap-4 mt-8">
                    <button
                        onClick={() => {
                            setCurrentIndex(0);
                            setScore(0);
                            setIsFinished(false);
                            setSelectedOption(null);
                            setShowFeedback(false);
                        }}
                        className="p-4 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs uppercase hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        إعادة_المحاكاة
                    </button>
                    <button
                        onClick={onClose}
                        className="p-4 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-400 font-mono text-xs uppercase hover:bg-teal-500/30 transition-all"
                    >
                        خروج_من_المحاكاة
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="flex flex-col h-full max-h-[80vh]">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
                        <Terminal className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-white tracking-widest font-mono uppercase">محاكاة_عصبية // v1.0</h2>
                        <div className="flex items-center gap-1 mt-1">
                            {relevantScenarios.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1 w-8 rounded-full transition-all duration-500 ${i <= currentIndex ? 'bg-teal-500' : 'bg-white/10'}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                    <RotateCcw className="w-5 h-5" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentScenario.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        {/* Scenario Context */}
                        <div className="p-4 rounded-xl bg-slate-900/50 border border-indigo-500/20 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50" />
                            <div className="flex items-start gap-4">
                                <Brain className="w-5 h-5 text-indigo-400 mt-1 shrink-0" />
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter opacity-70">إدخال_السياق</span>
                                    <p className="text-slate-300 text-sm leading-relaxed">{currentScenario.context}</p>
                                </div>
                            </div>
                        </div>

                        {/* Question */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-rose-400" />
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest font-mono">الهدف: 💡 {currentScenario.situation}</h3>
                            </div>

                            <div className="grid gap-3">
                                {currentScenario.options.map((option) => {
                                    const isSelected = selectedOption === option.id;
                                    const isCorrect = option.isCorrect;

                                    let borderColor = "border-white/10";
                                    let bgColor = "bg-white/5";
                                    let icon = null;

                                    if (showFeedback) {
                                        if (isCorrect) {
                                            borderColor = "border-teal-500/50";
                                            bgColor = "bg-teal-500/10";
                                            icon = <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />;
                                        } else if (isSelected) {
                                            borderColor = "border-rose-500/50";
                                            bgColor = "bg-rose-500/10";
                                            icon = <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />;
                                        }
                                    } else if (isSelected) {
                                        borderColor = "border-indigo-500/50";
                                        bgColor = "bg-indigo-500/10";
                                    }

                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => handleOptionSelect(option.id)}
                                            disabled={showFeedback}
                                            className={`w-full p-4 rounded-xl border ${borderColor} ${bgColor} text-right transition-all duration-300 flex items-center justify-between gap-4 group hover:border-indigo-500/30`}
                                        >
                                            <span className={`text-sm ${isSelected ? 'text-white font-bold' : 'text-slate-400'} group-hover:text-white transition-colors`}>
                                                {option.text}
                                            </span>
                                            {icon || <div className="w-4 h-4 rounded-full border border-white/20 shrink-0 group-hover:border-indigo-400/50" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Feedback Overlay */}
                        <AnimatePresence>
                            {showFeedback && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-4 rounded-xl border ${currentScenario.options.find(o => o.id === selectedOption)?.isCorrect ? 'bg-teal-500/10 border-teal-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <Zap className={`w-5 h-5 mt-1 ${currentScenario.options.find(o => o.id === selectedOption)?.isCorrect ? 'text-teal-400' : 'text-rose-400'}`} />
                                        <div className="space-y-1">
                                            <p className="text-white font-bold text-sm">
                                                {currentScenario.options.find(o => o.id === selectedOption)?.feedback}
                                            </p>
                                            <p className="text-slate-400 text-xs leading-relaxed">
                                                {currentScenario.options.find(o => o.id === selectedOption)?.explanation}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleNext}
                                        className="w-full mt-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                                    >
                                        المسار_التالي
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};
