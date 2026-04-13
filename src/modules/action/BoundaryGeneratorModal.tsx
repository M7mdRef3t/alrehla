import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Sparkles, Copy, X, Loader2, MessageSquareText } from "lucide-react";
import { useMapState } from '@/modules/map/dawayirIndex';
import { geminiClient } from "@/services/geminiClient";

interface BoundaryGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    personId: string | null;
}

export const BoundaryGeneratorModal: FC<BoundaryGeneratorModalProps> = ({ isOpen, onClose, personId }) => {
    const node = useMapState((s) => s.nodes.find((n) => n.id === personId));
    const [script, setScript] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [tone, setTone] = useState<"polite" | "firm" | "professional">("polite");

    useEffect(() => {
        if (isOpen) {
            setScript(null);
            setIsGenerating(false);
        }
    }, [isOpen]);

    const generateScript = async () => {
        if (!node) return;
        setIsGenerating(true);

        const drain = node.energyBalance?.netEnergy ?? 0;
        const isArchived = node.isNodeArchived;

        const toneDesc =
            tone === "polite" ? "مهذب ولطيف ولكن واضح" :
                tone === "firm" ? "حازم ومباشر بدون اعتذار زائد" :
                    "احترافي ورسمي";

        const prompt = `
أنت خبير في التواصل الفعال ووضع الحدود الصحية.
لدي شخص اسمه "${node.label}". 
مؤخراً، التفاعل مع هذا الشخص يستنزف طاقتي بشكل كبير (رصيد الطاقة الحالي: ${drain}).
${isArchived ? "وقد قمت بوضعه في دائرة الأرشيف (المدار الصفري) مؤقتاً لحماية طاقتي." : "وهو حالياً يحتاج إلى وضع حدود لتقليل الاحتكاك."}

أحتاج رسالة (Script) باللغة العربية بأسلوب ${toneDesc}.
الهدف من الرسالة هو رسم حد أو الاعتذار عن التواصل/اللقاء في الفترة الحالية بطريقة ذكية لا تسبب مشكلة كبيرة ولكن تحمي مساحتي الشخصية.
يجب أن تكون الرسالة جاهزة للنسخ والإرسال (قصيرة ومباشرة، سطرين إلى ثلاثة كحد أقصى).
اكتب الرسالة فقط بدون أي مقدمات أو شروحات.
    `.trim();

        try {
            const result = await geminiClient.generate(prompt);
            setScript(result || "عذراً، لم أتمكن من توليد الرسالة حالياً. حاول مرة أخرى.");
        } catch {
            setScript("حدث خطأ في الاتصال بالذكاء الاصطناعي.");
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = () => {
        if (script) navigator.clipboard.writeText(script);
    };

    if (!isOpen || !node) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
                <motion.div
                    className="relative w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl"
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/5 bg-slate-800/50">
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-indigo-400" />
                            <h3 className="font-bold text-slate-100">درع الصلاحية المدعوم بالبيانات</h3>
                        </div>
                        <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-5">
                        <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                            توليد رسالة اعتذار أو رسم حدود مخصصة للتعامل مع <strong className="text-white">{node.label}</strong> بالاعتماد على بيانات طاقة علاقتكم المستنزفة.
                        </p>

                        {/* Tone Selector */}
                        <div className="flex bg-slate-800 rounded-lg p-1 mb-6">
                            {(["polite", "firm", "professional"] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTone(t)}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${tone === t ? "bg-indigo-500/20 text-indigo-300" : "text-slate-500 hover:text-slate-300"}`}
                                >
                                    {t === "polite" ? "مهذب" : t === "firm" ? "حازم" : "احترافي"}
                                </button>
                            ))}
                        </div>

                        {/* Content Area */}
                        {isGenerating ? (
                            <div className="flex flex-col items-center justify-center p-8 bg-slate-950/50 rounded-xl border border-white/5 h-40">
                                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
                                <p className="text-xs text-indigo-300/80 font-medium">جاري تحليل البيانات وصياغة الرد المناسب...</p>
                            </div>
                        ) : script ? (
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-teal-500/20 rounded-xl blur opacity-50" />
                                <div className="relative bg-slate-950 p-4 rounded-xl border border-indigo-500/20">
                                    <MessageSquareText className="w-5 h-5 text-slate-500 mb-2" />
                                    <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{script}</p>

                                    <button
                                        onClick={copyToClipboard}
                                        className="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        <Copy className="w-4 h-4" />
                                        نسخ الرسالة
                                    </button>
                                </div>
                            </div>
                        ) : null}

                        {/* Main Action */}
                        <div className="mt-6">
                            <button
                                onClick={generateScript}
                                disabled={isGenerating}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 text-white font-bold text-sm hover:from-indigo-500 hover:to-teal-500 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                            >
                                {script ? (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        إعادة الصياغة
                                    </>
                                ) : (
                                    <>
                                        <Shield className="w-4 h-4" />
                                        توليد درع الحماية
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence >
    );
};
