import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, Target, AlertTriangle, CheckCircle2, ChevronRight, RotateCcw, Brain } from 'lucide-react';
import { symptomScenariosDatabase, type ScenarioRole, type ScenarioZone } from '@/data/symptomScenarios';

interface SymptomSimulationProps {
    detectedSymptoms: string[];
    userRole?: ScenarioRole;
    userZone?: ScenarioZone;
    onComplete?: (score: number) => void;
    onClose: () => void;
}

export const SymptomSimulation: React.FC<SymptomSimulationProps> = ({
    detectedSymptoms,
    userRole = "all",
    userZone = "red",
    onComplete,
    onClose
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    // Filter scenarios based on detected symptoms, role and zone
    const relevantScenarios = useMemo(() => {
        let filtered = symptomScenariosDatabase.filter(s =>
            detectedSymptoms.includes(s.symptomId)
        );

        // Further filter by role if available
        if (userRole !== "all") {
            const roleFiltered = filtered.filter(s => s.targetRoles.includes(userRole) || s.targetRoles.includes("all"));
            if (roleFiltered.length > 0) filtered = roleFiltered;
        }

        // Filter by zone if available
        const zoneFiltered = filtered.filter(s => s.targetZones.includes(userZone));
        if (zoneFiltered.length > 0) filtered = zoneFiltered;

        // If no matches, show some general ones or high priority ones
        return filtered.length > 0 ? filtered.slice(0, 5) : symptomScenariosDatabase.slice(0, 5);
    }, [detectedSymptoms, userRole, userZone]);

    const currentScenario = relevantScenarios[currentIndex];

    // Safety check
    if (!currentScenario && !isFinished) {
        return (
            <div className="p-8 text-center text-slate-400 font-mono text-sm">
                جاري تحميل المحاكاة...
            </div>
        );
    }

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

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-10 text-center space-y-8 bg-slate-900/60 backdrop-blur-3xl rounded-3xl border border-white/5"
            >
                <div className="w-24 h-24 bg-teal-500/10 border border-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-teal-500/10">
                    <Shield className="w-12 h-12 text-teal-400" />
                </div>
                <div>
                    <h3 className="text-3xl font-black text-white tracking-tight mb-3">اكتمل التدريب</h3>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
                        {score === relevantScenarios.length
                            ? "ممتاز! قدرت تكتشف التلاعب وتحافظ على حدودك ببراعة. أنت الآن أكثر استعداداً."
                            : `نتيجة التدريب: ${Math.round((score / relevantScenarios.length) * 100)}%. الاستمرار في التدريب هيحوّلك لدرع حقيقي.`}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
                    <button
                        onClick={() => {
                            setCurrentIndex(0);
                            setScore(0);
                            setIsFinished(false);
                            setSelectedOption(null);
                            setShowFeedback(false);
                        }}
                        className="py-4 px-6 rounded-2xl bg-white/5 border border-white/10 text-white text-xs font-bold uppercase transition-all duration-300 hover:bg-white/10 flex items-center justify-center gap-2 active:scale-95"
                    >
                        <RotateCcw className="w-4 h-4" />
                        إعادة المحاكاة
                    </button>
                    <button
                        onClick={onClose}
                        className="py-4 px-6 rounded-2xl bg-amber-600 text-white text-xs font-bold uppercase transition-all duration-300 hover:bg-amber-500 shadow-xl shadow-amber-900/20 active:scale-95"
                    >
                        إنهاء التدريب
                    </button>
                </div>
            </motion.div>
        );

    return (
        <div className="flex flex-col h-full max-h-[80vh]">
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-900/60 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-lg shadow-amber-500/5">
                        <Brain className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white tracking-tight">محاكاة مواجهة الأعراض</h2>
                        <div className="flex items-center gap-1.5 mt-2">
                            {relevantScenarios.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 rounded-full transition-all duration-700 ${i <= currentIndex ? 'w-8 bg-amber-500 shadow-sm shadow-amber-500/50' : 'w-4 bg-white/5'}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <button 
                    onClick={onClose} 
                    className="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all active:scale-90"
                    title="تخطي"
                >
                    <RotateCcw className="w-4 h-4 text-slate-400" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentScenario.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="space-y-8"
                    >
                        {/* Scenario Context */}
                        <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/5 relative overflow-hidden group shadow-2xl">
                            <div className="absolute top-0 right-0 w-2 h-full bg-amber-500/20" />
                            <div className="flex items-start gap-5">
                                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                    <Brain className="w-5 h-5 text-amber-400 shrink-0" />
                                </div>
                                <div className="space-y-2 text-right flex-1">
                                    <span className="text-[10px] font-black text-amber-500/50 uppercase tracking-[0.2em]">سياق الموقف</span>
                                    <p className="text-slate-200 text-md leading-relaxed font-medium">{currentScenario.context}</p>
                                </div>
                            </div>
                        </div>

                        {/* Question */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 justify-end px-2">
                                <h3 className="text-lg font-bold text-white tracking-tight">{currentScenario.situation}</h3>
                                <Target className="w-5 h-5 text-rose-500" />
                            </div>

                            <div className="grid gap-4">
                                {currentScenario.options.map((option) => {
                                    const isSelected = selectedOption === option.id;
                                    const isCorrect = option.isCorrect;

                                    let borderColor = "border-white/5";
                                    let bgColor = "bg-white/5";
                                    let icon = null;

                                    if (showFeedback) {
                                        if (isCorrect) {
                                            borderColor = "border-teal-500/40 shadow-lg shadow-teal-500/5";
                                            bgColor = "bg-teal-500/10";
                                            icon = <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />;
                                        } else if (isSelected) {
                                            borderColor = "border-rose-500/40 shadow-lg shadow-rose-500/5";
                                            bgColor = "bg-rose-500/10";
                                            icon = <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />;
                                        }
                                    } else if (isSelected) {
                                        borderColor = "border-amber-500/40 shadow-lg shadow-amber-500/5";
                                        bgColor = "bg-amber-500/10";
                                    }

                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => handleOptionSelect(option.id)}
                                            disabled={showFeedback}
                                            className={`w-full p-5 rounded-2xl border ${borderColor} ${bgColor} text-right transition-all duration-500 flex items-center justify-between gap-5 group hover:bg-white/10 active:scale-[0.99]`}
                                        >
                                            <span className={`text-sm leading-relaxed ${isSelected ? 'text-white font-bold' : 'text-slate-300'} group-hover:text-white transition-colors flex-1`}>
                                                {option.text}
                                            </span>
                                            <div className="shrink-0">
                                              {icon || (
                                                <div className={`w-5 h-5 rounded-lg border-2 transition-all duration-500 ${isSelected ? 'bg-amber-500 border-amber-500' : 'border-white/10 group-hover:border-white/20'}`} />
                                              )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Feedback Overlay */}
                        <AnimatePresence>
                            {showFeedback && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    className={`p-6 rounded-3xl border-2 ${currentScenario.options.find(o => o.id === selectedOption)?.isCorrect ? 'bg-teal-500/10 border-teal-500/20' : 'bg-rose-500/10 border-rose-500/20'} shadow-2xl relative overflow-hidden`}
                                >
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/5 to-transparent rounded-bl-3xl opacity-20" />
                                    <div className="flex items-start gap-4 text-right justify-end relative z-10">
                                        <div className="space-y-2 flex-1">
                                            <p className="text-white font-black text-md leading-relaxed">
                                                {currentScenario.options.find(o => o.id === selectedOption)?.feedback}
                                            </p>
                                            <p className="text-slate-300/80 text-sm leading-relaxed font-medium">
                                                {currentScenario.options.find(o => o.id === selectedOption)?.explanation}
                                            </p>
                                        </div>
                                        <div className={`p-3 rounded-2xl ${currentScenario.options.find(o => o.id === selectedOption)?.isCorrect ? 'bg-teal-500/20' : 'bg-rose-500/20'} shrink-0`}>
                                            <Zap className={`w-6 h-6 ${currentScenario.options.find(o => o.id === selectedOption)?.isCorrect ? 'text-teal-400' : 'text-rose-400'}`} />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleNext}
                                        className="w-full mt-8 py-5 rounded-2xl bg-white text-slate-950 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 hover:bg-slate-100 shadow-xl active:scale-[0.98]"
                                    >
                                        المرحلة التالية
                                        <ChevronRight className="w-5 h-5" />
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
