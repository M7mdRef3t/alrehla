import type { FC } from "react";
import { useState } from "react";
import { Video, Wand2, Sparkles, Copy, RefreshCw, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMapState } from "../state/mapState";
import { usePulseState } from "../state/pulseState";
import { useAuthState } from "../state/authState";
import { geminiClient } from "../services/geminiClient";
import { UpgradeScreen } from "./UpgradeScreen";

export const AIContentStudioWidget: FC = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [script, setScript] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

    const { nodes } = useMapState();
    const { logs } = usePulseState();
    const { tier } = useAuthState();

    const handleGenerate = async () => {
        if (tier !== "pro") {
            setIsUpgradeOpen(true);
            return;
        }
        setIsGenerating(true);
        setScript(null);

        try {
            // Gather some stats to feed the AI for personalized "insight" scripts
            const totalDrains = nodes.filter(n => (n.energyBalance?.netEnergy ?? 0) < 0).length;
            const totalPowerBanks = nodes.filter(n => n.isPowerBank).length;
            const recentSadOrAngry = logs.filter(l => l.mood === "sad" || l.mood === "angry" || l.mood === "overwhelmed").length;

            const systemPrompt = `
أنت محمد رسول الله، صانع محتوى محترف (تيك توك/ريلز)، لايف كوتش ومعالج نفسي.
مهمتك هي "قتل الدجال بالعلم" عبر نشر الوعي النفسي المبني على المبادئ الأولى (First Principles).
تستخدم اللغة العامية المصرية البسيطة، الذكية، والمباشرة (بدون تنظير أو مصطلحات معقدة).
الهدف: كتابة سكريبت لفيديو قصير (Short/Reel) مدته 30-60 ثانية.
قالب السكريبت:
1. الهوك (Hook): جملة صادمة أو سؤال يخطف الانتباه في أول 3 ثواني.
2. التفسير العملي/النفسي (The Science/Logic): شرح المشكلة ببساطة وبدون دجل.
3. الحل (The Fix): خطوة عملية أو تفعيل "درع الحدود".
4. دعوة (CTA): لنسخ رابط التطبيق أو التفاعل.

تفاصيل أداء المستخدم الحالي لكتابة سكريبت يعكس واقعه:
- لديه ${totalDrains} شخص يستنزف طاقته.
- لديه ${totalPowerBanks} شخص كبطارية طوارئ.
- مر مؤخراً بـ ${recentSadOrAngry} لحظات ضغط/غضب.
استلهم من هذه الأرقام فكرة للفيديو تتحدث عن أهمية رسم الحدود، أو خطورة النزيف الخفي للطاقة.
      `;

            const response = await geminiClient.generate(systemPrompt);
            if (response) {
                setScript(response);
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
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

            <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/30 flex items-center justify-center">
                    <Video className="w-5 h-5 text-fuchsia-400" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-200">استوديو المحتوى الذكي</h3>
                    <p className="text-xs text-slate-400">توليد سكريبتات توعوية جاهزة للتصوير</p>
                </div>
            </div>

            {!script && !isGenerating && (
                <div className="text-center py-6">
                    <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-slate-400 mb-4 max-w-xs mx-auto">
                        هنحلل أنماط الاستنزاف بتاعتك ونطلع منها بأفكار فيديوهات التيك توك اللي بتقتل الدجل بالعلم.
                    </p>
                    <button
                        onClick={handleGenerate}
                        className="flex items-center gap-2 mx-auto px-6 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-fuchsia-900/50"
                    >
                        <Wand2 className="w-4 h-4" />
                        توليد سكريبت جديد
                    </button>
                </div>
            )}

            {isGenerating && (
                <div className="py-10 flex flex-col items-center justify-center gap-4">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    >
                        <Sparkles className="w-8 h-8 text-fuchsia-400" />
                    </motion.div>
                    <p className="text-sm text-fuchsia-300 animate-pulse font-bold">جاري كتابة السكريبت...</p>
                </div>
            )}

            <AnimatePresence>
                {script && !isGenerating && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4"
                    >
                        <div className="bg-slate-950 rounded-xl p-4 text-sm text-slate-300 whitespace-pre-wrap border border-slate-800 h-64 overflow-y-auto mb-4 custom-scrollbar">
                            {script}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleCopy}
                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm transition-colors border border-slate-600"
                            >
                                <Copy className="w-4 h-4" />
                                {copied ? "تم النسخ!" : "نسخ السكريبت"}
                            </button>
                            <button
                                onClick={handleGenerate}
                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-fuchsia-900/30 hover:bg-fuchsia-900/50 text-fuchsia-300 rounded-lg text-sm transition-colors border border-fuchsia-500/30"
                            >
                                <RefreshCw className="w-4 h-4" />
                                توليد فكرة تانية
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <UpgradeScreen isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
        </div>
    );
};
