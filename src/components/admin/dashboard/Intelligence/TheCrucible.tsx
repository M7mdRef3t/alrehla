import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Flame,
    Zap,
    Shield,
    Target,
    Activity,
    Loader2,
    Music,
    Sparkles,
    Play,
    Timer,
    AlertTriangle,
    Gamepad2,
    Eye
} from "lucide-react";
import { useSynthesisState } from "@/state/synthesisState";
import { useFlowState } from "@/state/flowState";
import { useGrowthState } from "@/state/growthState";
import { usePredictiveState } from "@/state/predictiveState";
import { CreativeSeedEngine } from "@/services/CreativeSeedEngine";
import { MajazEngine } from "@/services/audio/MajazEngine";
import { RefractionEngine, RefractionTask } from "@/services/telemetry/RefractionEngine";
import { EntropyGame } from "./EntropyGame";

export const TheCrucible: FC = () => {
    const [activeTest, setActiveTest] = useState<"brand" | "social" | "overclock" | "refraction" | "game" | null>(null);
    const [refractionTask, setRefractionTask] = useState<RefractionTask | null>(null);
    const { activeSeed, isGenerating, setGenerating, setActiveSeed, saveSeed, audioVolume } = useSynthesisState();
    const { focusScore, interactionRate, isCleanRoomActive, toggleCleanRoom } = useFlowState();
    const { isOverclocking, setOverclock } = useGrowthState();
    const [timer, setTimer] = useState(3600); // 60 mins

    const runBrandSynthesis = async () => {
        setActiveTest("brand");
        setGenerating(true);
        const seed = await CreativeSeedEngine.generateSeed(
            "alrehla-crucible",
            "هوية الرحلة: القصة قصتك",
            "تصميم واجهة مستخدم (UI) تعبر عن الوعي السيبراني والنمو الروحي."
        );
        if (seed) {
            saveSeed(seed);
            setActiveSeed(seed);
        }
        setGenerating(false);
    };

    const startOverclockTest = () => {
        setActiveTest("overclock");
        setOverclock(true, 1.5);
        toggleCleanRoom(true);
        MajazEngine.startLoop();
    };

    const runRefractionOracle = async () => {
        setActiveTest("refraction");
        setGenerating(true);
        const task = await RefractionEngine.generateTask();
        setRefractionTask(task);
        setGenerating(false);
    };

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header */}
            <div className="admin-glass-card p-6 border-rose-500/20 bg-rose-500/5 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Flame className="w-24 h-24 text-rose-500" />
                </div>
                <h3 className="text-2xl font-black text-rose-400 flex items-center gap-2 mb-2">
                    <Flame className="w-6 h-6 animate-pulse" />
                    المِحك (The Crucible)
                </h3>
                <p className="text-sm text-slate-400 max-w-2xl">
                    بيئة الاختبار الميداني. هنا المفاعل بيتخلص من حالة الـ Idling وبيدخل في مرحلة الطحن الفعلي للبيانات والمشاريع.
                </p>
            </div>

            {/* Test Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button
                    onClick={runBrandSynthesis}
                    className={`admin-glass-card p-6 border-teal-500/20 bg-teal-500/5 rounded-2xl text-right hover:border-teal-500/40 transition-all group ${activeTest === "brand" ? 'ring-2 ring-teal-500/50' : ''}`}
                >
                    <Sparkles className="w-8 h-8 text-teal-400 mb-4 group-hover:scale-110 transition-transform" />
                    <h4 className="font-black text-teal-400 mb-1">Brand Synthesis</h4>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">اختبار محرك التخليق على هوية الرحلة</p>
                </button>

                <button
                    onClick={() => setActiveTest("social")}
                    className={`admin-glass-card p-6 border-amber-500/20 bg-amber-500/5 rounded-2xl text-right hover:border-amber-500/40 transition-all group ${activeTest === "social" ? 'ring-2 ring-amber-500/50' : ''}`}
                >
                    <Shield className="w-8 h-8 text-amber-400 mb-4 group-hover:scale-110 transition-transform" />
                    <h4 className="font-black text-amber-400 mb-1">Social Calibration</h4>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">سيميليشن حقيقي لـ Energy Vampire</p>
                </button>

                <button
                    onClick={startOverclockTest}
                    className={`admin-glass-card p-6 border-indigo-500/20 bg-indigo-500/5 rounded-2xl text-right hover:border-indigo-500/40 transition-all group ${activeTest === "overclock" ? 'ring-2 ring-indigo-500/50' : ''}`}
                >
                    <Zap className="w-8 h-8 text-indigo-400 mb-4 group-hover:scale-110 transition-transform" />
                    <h4 className="font-black text-indigo-400 mb-1">Overclocking</h4>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">ساعة إنتاجية مكثفة</p>
                </button>

                <button
                    onClick={runRefractionOracle}
                    className={`admin-glass-card p-6 border-rose-500/20 bg-rose-500/5 rounded-2xl text-right hover:border-rose-500/40 transition-all group ${activeTest === "refraction" ? 'ring-2 ring-rose-500/50' : ''}`}
                >
                    <Eye className="w-8 h-8 text-rose-400 mb-4 group-hover:scale-110 transition-transform" />
                    <h4 className="font-black text-rose-400 mb-1">Content Oracle</h4>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">تحويل الفوضى لمهمة إبداعية</p>
                </button>

                <button
                    onClick={() => setActiveTest("game")}
                    className={`admin-glass-card p-6 border-teal-500/20 bg-teal-500/5 rounded-2xl text-right hover:border-teal-500/40 transition-all group ${activeTest === "game" ? 'ring-2 ring-teal-500/50' : ''}`}
                >
                    <Gamepad2 className="w-8 h-8 text-teal-400 mb-4 group-hover:scale-110 transition-transform" />
                    <h4 className="font-black text-teal-400 mb-1">Quantum Stability</h4>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">اختبار توازنك في لُعبة تفاعلية</p>
                </button>
            </div>

            {/* Test Environment Area */}
            <AnimatePresence mode="wait">
                {activeTest && (
                    <motion.div
                        key={activeTest}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="admin-glass-card p-8 border-white/5 bg-slate-950/40 rounded-3xl min-h-[400px]"
                    >
                        {activeTest === "brand" && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h5 className="text-xl font-bold text-teal-400 flex items-center gap-2">
                                        <Sparkles className="w-5 h-5" />
                                        نتائج التخليق: هوية الرحلة
                                    </h5>
                                    {isGenerating && <Loader2 className="w-5 h-5 animate-spin text-teal-500" />}
                                </div>

                                {activeSeed ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="p-4 bg-slate-900/60 rounded-2xl border border-teal-500/10">
                                                <p className="text-[10px] font-black text-teal-500 uppercase mb-2">Visual Hierarchy Concept</p>
                                                <p className="text-sm text-slate-300 leading-relaxed italic">
                                                    {activeSeed.drafts.find(d => d.type === 'visual')?.content}
                                                </p>
                                            </div>
                                            <div className="p-4 bg-slate-900/60 rounded-2xl border border-indigo-500/10">
                                                <p className="text-[10px] font-black text-indigo-500 uppercase mb-2">The Core Philosophy</p>
                                                <p className="text-sm text-slate-400 leading-relaxed font-mono">
                                                    {activeSeed.drafts.find(d => d.type === 'concept')?.content}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="p-6 bg-slate-900/80 rounded-2xl border border-teal-500/20">
                                            <p className="text-[10px] font-black text-teal-400 uppercase mb-4">Script Draft (The Hook)</p>
                                            <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line max-h-96 overflow-y-auto thin-scrollbar">
                                                {activeSeed.drafts.find(d => d.type === 'script')?.content}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                                        <p>المحرك جاهز لبدء التخليق..</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTest === "overclock" && (
                            <div className="flex flex-col items-center justify-center space-y-8 py-10">
                                <div className="relative w-48 h-48 flex items-center justify-center">
                                    <svg className="w-full h-full -rotate-90">
                                        <circle cx="96" cy="96" r="90" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-slate-800" />
                                        <circle cx="96" cy="96" r="90" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray={565.5} strokeDashoffset={565.5 * (1 - (timer / 3600))} className="text-rose-500 transition-all duration-1000" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-4xl font-black text-white">
                                            {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                                        </span>
                                        <span className="text-[10px] text-rose-500 font-black uppercase tracking-widest">Crucible Active</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-3xl">
                                    <div className="p-4 bg-slate-900/80 rounded-2xl border border-rose-500/20 flex flex-col items-center">
                                        <Activity className="w-5 h-5 text-rose-400 mb-2" />
                                        <p className="text-[10px] text-slate-500 font-bold uppercase">Focus Score</p>
                                        <p className="text-xl font-black text-white">{(focusScore * 100).toFixed(0)}%</p>
                                    </div>
                                    <div className="p-4 bg-slate-900/80 rounded-2xl border border-indigo-500/20 flex flex-col items-center">
                                        <Zap className="w-5 h-5 text-indigo-400 mb-2" />
                                        <p className="text-[10px] text-slate-500 font-bold uppercase">Interaction</p>
                                        <p className="text-xl font-black text-white">{interactionRate} eps</p>
                                    </div>
                                    <div className="p-4 bg-slate-900/80 rounded-2xl border border-teal-500/20 flex flex-col items-center">
                                        <Music className="w-5 h-5 text-teal-400 mb-2" />
                                        <p className="text-[10px] text-slate-500 font-bold uppercase">Neural Sync</p>
                                        <p className="text-xl font-black text-white">{Math.round(audioVolume * 100)}%</p>
                                    </div>
                                    <div className="p-4 bg-slate-900/80 rounded-2xl border border-amber-500/20 flex flex-col items-center">
                                        <Shield className="w-5 h-5 text-amber-400 mb-2" />
                                        <p className="text-[10px] text-slate-500 font-bold uppercase">Firewall</p>
                                        <p className="text-xl font-black text-white">PROTECTED</p>
                                    </div>
                                </div>

                                <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl flex items-center gap-4 max-w-xl">
                                    <AlertTriangle className="w-6 h-6 text-rose-500 animate-pulse" />
                                    <p className="text-xs text-rose-200 italic">
                                        "تحذير: الـ Sensory Hijack مفعل. أي توقف عن التفاعل لمدة 10 ثواني هيؤدي لتشويش الرؤية. ركز على حمولتك الإبداعية!"
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTest === "social" && (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-6">
                                <Shield className="w-16 h-16 text-amber-500/20 mb-4" />
                                <p className="text-center max-w-md">نظام الـ Social Calibration بيسمح لك برصد "علاقة استنزاف" حقيقية واختبار رد فعل الـ Firewall عليها.</p>
                                <button className="px-8 py-3 bg-amber-600 text-slate-950 font-black rounded-xl hover:bg-amber-500 transition-all uppercase text-xs">
                                    ابدأ المحاكاة الحية
                                </button>
                            </div>
                        )}

                        {activeTest === "refraction" && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h5 className="text-xl font-bold text-rose-400 flex items-center gap-2">
                                        <Eye className="w-5 h-5" />
                                        أوراكل المحتوى (Refraction Engine)
                                    </h5>
                                    {isGenerating && <Loader2 className="w-5 h-5 animate-spin text-rose-500" />}
                                </div>

                                {refractionTask ? (
                                    <div className="max-w-2xl mx-auto space-y-8 py-10">
                                        <div className="space-y-4 text-center">
                                            <span className="px-4 py-1.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-widest border border-rose-500/20">
                                                {refractionTask.strategy} Perspective
                                            </span>
                                            <h2 className="text-3xl font-black text-white">{refractionTask.title}</h2>
                                            <p className="text-lg text-slate-400 leading-relaxed italic">{refractionTask.description}</p>
                                        </div>

                                        <div className="flex justify-center gap-10">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[9px] text-slate-500 font-bold uppercase mb-1">Target</span>
                                                <span className="text-sm font-bold text-rose-300">{refractionTask.targetEmotion}</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-[9px] text-slate-500 font-bold uppercase mb-1">Time</span>
                                                <span className="text-sm font-bold text-white">{refractionTask.estimatedMinutes} mins</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-center pt-8">
                                            <button className="px-10 py-4 bg-rose-600 text-white font-black rounded-2xl hover:bg-rose-500 transition-all shadow-xl shadow-rose-900/20">
                                                ابدأ مهمة الانكسار الآن
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-center">
                                        <p>الأوراكل بيحلل الفوضى الحالية..</p>
                                        <button onClick={runRefractionOracle} className="mt-4 text-rose-400 font-bold uppercase text-[10px] underline underline-offset-4">توليد يدوي</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTest === "game" && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h5 className="text-xl font-bold text-teal-400 flex items-center gap-2">
                                        <Gamepad2 className="w-5 h-5" />
                                        توازن الكوانتم (Quantum Stability Game)
                                    </h5>
                                </div>
                                <EntropyGame />
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
