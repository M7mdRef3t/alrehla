import type { FC } from "react";
import { useState } from "react";
import { Video, Wand2, Sparkles, Copy, RefreshCw, Layers, Zap, ShieldAlert, Brain, History, ChevronRight, ChevronLeft, ThumbsUp, ThumbsDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMapState } from "@/state/mapState";
import { usePulseState } from "@/state/pulseState";
import { useAuthState } from "@/state/authState";
import { geminiClient } from "@/services/geminiClient";
import { UpgradeScreen } from '@/modules/exploration/UpgradeScreen';
import { trackEvent, AnalyticsEvents } from "@/services/analytics";
import { useEffect } from "react";
import { feedbackService } from "@/services/feedbackService";

export const AIContentStudioWidget: FC = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [script, setScript] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

    // New Customization States
    const [topic, setTopic] = useState<"energy" | "toxic" | "mindset">("energy");
    const [tone, setTone] = useState<"deep" | "direct" | "sarcastic">("direct");
    
    // History State
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(-1);

    // Feedback State: Track if current script in view is rated
    const [ratedScripts, setRatedScripts] = useState<Record<number, 'up' | 'down'>>({});

    const { nodes } = useMapState();
    const { logs } = usePulseState();
    const { tier } = useAuthState();

    useEffect(() => {
        trackEvent(AnalyticsEvents.AI_STUDIO_OPENED);
    }, []);

    const handleGenerate = async () => {
        if (tier !== "pro") {
            setIsUpgradeOpen(true);
            return;
        }
        setIsGenerating(true);
        setScript(null);

        try {
            const totalDrains = nodes.filter(n => (n.energyBalance?.netEnergy ?? 0) < 0).length;
            const totalPowerBanks = nodes.filter(n => n.isPowerBank).length;
            const recentSadOrAngry = logs.filter(l => l.mood === "sad" || l.mood === "angry" || l.mood === "overwhelmed").length;

            const toneMap = {
                deep: "هادي وعميق نفسياً بتبني مفاهيم بدل ما تهدم",
                direct: "مباشر وتحدي واضح بيفوق اللي قدامه",
                sarcastic: "ساخر وصادم بيضرب الدجل بذكاء"
            };

            const topicMap = {
                energy: "نزيف الطاقة والاحتراق النفسي",
                toxic: "العلاقات السامة واختراق الحدود",
                mindset: "تصحيح مفاهيم التنمية البشرية بالدليل والمبادئ الأولى"
            };

            const systemPrompt = `
أنت محمد رسول الله، صانع محتوى محترف (تيك توك/ريلز)، لايف كوتش ومعالج نفسي.
مهمتك هي "قتل الدجال بالعلم" عبر نشر الوعي النفسي المبني على المبادئ الأولى (First Principles).
الأسلوب: مصري عامي بسيط وذكي (${toneMap[tone]}).
الموضوع المستهدف: ${topicMap[topic]}.

الهدف: كتابة سكريبت لفيديو قصير (Short/Reel) مدته 30-60 ثانية.
قالب السكريبت:
1. عنوان مقترح (Text on screen): يكتب على الشاشة في أول الفيديو.
2. الهوك (Hook): جملة صادمة تخطف الانتباه في أول 3 ثواني.
3. التفسير العلمي/المنطقي (The Logic): شرح أصل المشكلة (Root Cause) ببساطة.
4. الحل أو المبدأ (The Fix): خطوة عملية أو تغيير فكري فوري.
5. دعوة (CTA): لنسخ رابط التطبيق أو التفاعل، بأسلوب محمد رسول الله.

بيانات المستخدم الحالي كمصدر إلهام (لتعكس واقعه لو لزم الأمر مع موضوع الفيديو):
- الأشخاص المستنزفين للطاقة عنده: ${totalDrains} شخص.
- البطاريات الداعمة: ${totalPowerBanks} شخص.
- لحظات الضغط الأخيرة: ${recentSadOrAngry} مرة.
`;

            const response = await geminiClient.generate(systemPrompt);
            if (response) {
                setScript(response);
                setHistory(prev => {
                    const newHistory = [response, ...prev].slice(0, 5);
                    return newHistory;
                });
                setHistoryIndex(0);

                trackEvent(AnalyticsEvents.AI_STUDIO_GENERATED, {
                    topic,
                    tone,
                    drains_count: totalDrains,
                    battery_count: totalPowerBanks
                });
            } else {
                setScript("حدث خطأ أثناء الاتصال بعقل محمد رسول الله الاصطناعي. جرب تاني.");
            }
        } catch (err) {
            console.error("AI Content Studio Error:", err);
            setScript("حصلت مشكلة في توليد السكريبت. خد نفس وجرب كمان شوية.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        if (!script) return;
        navigator.clipboard.writeText(script);
        setCopied(true);
        trackEvent(AnalyticsEvents.AI_STUDIO_COPIED, { topic, tone });
        setTimeout(() => setCopied(false), 2000);
    };

    const navigateHistory = (dir: 1 | -1) => {
        const newIndex = historyIndex + dir;
        if (newIndex >= 0 && newIndex < history.length) {
            setHistoryIndex(newIndex);
            setScript(history[newIndex]);
            trackEvent(AnalyticsEvents.AI_STUDIO_HISTORY_NAVIGATED, { direction: dir === 1 ? 'back' : 'forward' });
        }
    };

    const handleFeedback = async (rating: 'up' | 'down') => {
        if (!script || ratedScripts[historyIndex]) return;

        const res = await feedbackService.submit({
            content: script,
            rating,
            source: 'ai_content_studio',
            metadata: { topic, tone, historyIndex }
        });

        if (res.success) {
            setRatedScripts(prev => ({ ...prev, [historyIndex]: rating }));
            trackEvent(AnalyticsEvents.PUNITIVE_FEEDBACK_GIVEN, { // Reusing event or we can add new one
                studio_rating: rating,
                topic,
                tone
            });
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

            <div className="flex items-center justify-between mb-5 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/30 flex items-center justify-center">
                        <Video className="w-5 h-5 text-fuchsia-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-200">استوديو المحتوى الذكي</h3>
                        <p className="text-xs text-slate-400">توليد سكريبتات توعوية مُخصصة</p>
                    </div>
                </div>
                {history.length > 1 && !isGenerating && script && (
                    <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
                        <button 
                            disabled={historyIndex >= history.length - 1}
                            onClick={() => navigateHistory(1)}
                            className="p-1 hover:bg-slate-700 rounded text-slate-400 disabled:opacity-30 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <History className="w-3.5 h-3.5 text-fuchsia-400 opacity-70" />
                        <button 
                            disabled={historyIndex <= 0}
                            onClick={() => navigateHistory(-1)}
                            className="p-1 hover:bg-slate-700 rounded text-slate-400 disabled:opacity-30 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Customization Controls */}
            {!isGenerating && !script && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 mb-6 relative z-10">
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">موضوع الفيديو</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => setTopic("energy")} className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-all ${topic === 'energy' ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800'}`}>
                                <Zap className="w-4 h-4" />
                                <span className="text-[10px] font-bold">الطاقة</span>
                            </button>
                            <button onClick={() => setTopic("toxic")} className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-all ${topic === 'toxic' ? 'bg-rose-500/10 border-rose-500/50 text-rose-400' : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800'}`}>
                                <ShieldAlert className="w-4 h-4" />
                                <span className="text-[10px] font-bold">الحدود</span>
                            </button>
                            <button onClick={() => setTopic("mindset")} className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-all ${topic === 'mindset' ? 'bg-teal-500/10 border-teal-500/50 text-teal-400' : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800'}`}>
                                <Brain className="w-4 h-4" />
                                <span className="text-[10px] font-bold">المبادئ</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">نبرة الصوت (Tone)</label>
                        <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
                            <button onClick={() => setTone("deep")} className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-all ${tone === 'deep' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}>
                                عميق وهادي
                            </button>
                            <button onClick={() => setTone("direct")} className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-all ${tone === 'direct' ? 'bg-fuchsia-600 border-fuchsia-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-300'}`}>
                                مباشر وتحدي
                            </button>
                            <button onClick={() => setTone("sarcastic")} className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-all ${tone === 'sarcastic' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}>
                                ساخر وصادم
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {!script && !isGenerating && (
                <div className="text-center pb-2">
                    <button
                        onClick={handleGenerate}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-fuchsia-900/50"
                    >
                        <Wand2 className="w-4 h-4" />
                        توليد سكريبت بالعلم
                    </button>
                </div>
            )}

            {isGenerating && (
                <div className="py-12 flex flex-col items-center justify-center gap-4">
                    <motion.div
                        animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    >
                        <Sparkles className="w-8 h-8 text-fuchsia-400 drop-shadow-[0_0_15px_rgba(232,121,249,0.5)]" />
                    </motion.div>
                    <p className="text-sm text-fuchsia-300 animate-pulse font-bold tracking-wide">جاري كتابة السكريبت والتوليف...</p>
                </div>
            )}

            <AnimatePresence mode="wait">
                {script && !isGenerating && (
                    <motion.div
                        key={historyIndex}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                        className="mt-2"
                    >
                        <div className="bg-slate-950 rounded-xl p-4 text-[13px] leading-relaxed text-slate-200 whitespace-pre-wrap border border-slate-700/50 h-56 overflow-y-auto mb-4 custom-scrollbar shadow-inner">
                            {script}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleCopy}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-bold transition-colors border border-slate-600 shadow-sm"
                            >
                                <Copy className="w-4 h-4" />
                                {copied ? "تم النسخ بنجاح!" : "نسخ السكريبت"}
                            </button>
                            <button
                                onClick={() => setScript(null)}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-fuchsia-900/30 hover:bg-fuchsia-900/50 text-fuchsia-300 rounded-xl text-sm font-bold transition-colors border border-fuchsia-500/30 shadow-sm"
                            >
                                <RefreshCw className="w-4 h-4" />
                                تعديل وتوليد تاني
                            </button>
                        </div>

                        {/* Feedback UI */}
                        <div className="mt-4 pt-4 border-t border-slate-700/30 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">هل السكريبت عجبك؟</span>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => handleFeedback('up')}
                                    disabled={!!ratedScripts[historyIndex]}
                                    className={`p-2 rounded-lg border transition-all ${ratedScripts[historyIndex] === 'up' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30'}`}
                                >
                                    <ThumbsUp className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                    onClick={() => handleFeedback('down')}
                                    disabled={!!ratedScripts[historyIndex]}
                                    className={`p-2 rounded-lg border transition-all ${ratedScripts[historyIndex] === 'down' ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:text-rose-400 hover:border-rose-500/30'}`}
                                >
                                    <ThumbsDown className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <UpgradeScreen isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
        </div>
    );
};
