import { logger } from "@/services/logger";
import React, { useState, useRef, useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, X, Send, Loader2, AlertTriangle, Sparkles } from "lucide-react";
import { geminiClient } from "@/services/geminiClient";
import { useMapState } from '@/modules/map/dawayirIndex';
import { useHafizState, getVerticalResonanceState } from '@/modules/hafiz/store/hafiz.store';
import { getReconnectionMessage } from "@/data/reconnectionMessages";
import type { ReconnectionMessage } from "@/data/reconnectionMessages";

const ReconnectionRitual = lazy(() => import('@/modules/maraya/components/ReconnectionRitual'));

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

interface TherapistChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    burnoutRisk?: boolean;
}

export const TherapistChatModal: React.FC<TherapistChatModalProps> = ({ isOpen, onClose, burnoutRisk = false }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [ritualMessage, setRitualMessage] = useState<ReconnectionMessage | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { nodes } = useMapState();
    const memories = useHafizState(s => s.memories);
    const resonance = getVerticalResonanceState(memories);

    // Start conversation when opened
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const initialGreeting = burnoutRisk
                ? "أهلاً بيك يا بطل. مؤشراتك بتقول إنك على وشك الاحتراق النفسي (Burnout). أنا هنا كمعالجك الذكي، محمد رسول الله. إيه اللي ضاغطك دلوقتي أكتر حاجة ومخليك بتنزف طاقة؟"
                : "أهلاً بيك في العيادة الذكية! أنا محمد رسول الله، معالجك النفسي. جاهز نتكلم في دوائرك ومساحاتك ونفلتر الدنيا بالمبادئ الأولى؟ احكيلي حاسس بإيه؟";

            setMessages([{ id: Date.now().toString(), role: "assistant", content: initialGreeting }]);
        }
    }, [isOpen, messages.length, burnoutRisk]);

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isTyping) return;

        const userText = input.trim();
        const userMsg: Message = { id: Date.now().toString(), role: "user", content: userText };

        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        // Gather Context
        const totalDrains = nodes.filter(n => (n.energyBalance?.netEnergy ?? 0) < 0).length;
        const totalEnergyDrain = nodes.reduce((sum, n) => {
            const nodeDrain = n.energyBalance?.transactions?.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0) || 0;
            return sum + nodeDrain;
        }, 0);

        const systemPrompt = `
أنت محمد رسول الله، لايف كوتش ومعالج نفسي خبير في العلاج المعرفي السلوكي (CBT).
مهمتك: مساعدة المستخدم على التعافي من الاستنزاف النفسي وقت الأزمات (Burnout).
أسلوبك: مصري عامي بسيط، ذكي، واقعي يحلل بناءً على المبادئ الأولى (First Principles) وبلا فلسفة معقدة.
السياق الحالي للمستخدم: 
- هل يعاني من خطر احتراق نفسي عالي؟ ${burnoutRisk ? "نعم" : "لا"}
- عدد الأشخاص الذين يستنزفونه: ${totalDrains}
- إجمالي الطاقة السلبية المنتزعة مؤخراً: ${totalEnergyDrain}

◈ المحور الرأسي — الاتصال بالمصدر ◈
- حالة الاتصال الروحي: ${resonance.label} (${Math.round(resonance.strength * 100)}%)
- أيام الورد المتتالية: ${resonance.daysActive} يوم
- آخر نشاط روحي: ${resonance.daysSinceLastActivity === 999 ? "مفيش نشاط مسجل" : resonance.daysSinceLastActivity === 0 ? "النهاردة" : `من ${resonance.daysSinceLastActivity} يوم`}

قواعد الرد:
1. استمع وتفهم المشاعر أولاً (Validation).
2. اسأل أسئلة ذكية لتفكيك الأفكار السلبية (Socratic Questioning).
3. اعرض حلاً عملياً (مثل تفعيل الرادار، نقل الشخص للدوائر الصفرية، أو قول "لا").
4. لا تطول في الرد واستخدم فقرات قصيرة جداً ومريحة للعين.

◈ قاعدة المحور الرأسي (مهمة جداً):
- أي ألم في علاقة بشرية = عرض لضعف اتصال بالمصدر. البشر "مرايات" مش مصادر طاقة.
- ${resonance.level === 'disconnected' ? "المستخدم منقطع روحياً — اسأله بلطف: إمتى آخر مرة حسيت بسلام داخلي؟ بدون وعظ." : ""}
- ${resonance.level === 'flickering' ? "المستخدم اتصاله متذبذب — شجعه يثبّت عادة بسيطة يومية (حتى لو دقيقة تأمل)." : ""}
- ${resonance.level === 'steady' ? "المستخدم اتصاله مستقر — عزز الاتصال ده واربط مشاكله بفرصة لتعميق الوعي." : ""}
- ${resonance.level === 'radiant' ? "المستخدم اتصاله مُشع — ده نقطة قوة كبيرة، ذكّره إنها أساس كل حاجة تانية." : ""}
- وجّه المستخدم بلطف لربط مشكلته بعلاقته بالمصدر. مش بأسلوب وعظي، بل بأسلوب "اكتشاف".
- استخدم لغة بسيطة: "ربنا"، "المصدر"، "اللي أكبر منك"، "السلام الداخلي". تجنب: "الدين"، "العبادة"، "الإسلام".
        `;

        const conversationContext = messages.map(m => `${m.role === 'user' ? 'المستخدم' : 'المعالج'}: ${m.content}`).join('\n');
        const finalPrompt = `${systemPrompt}\n\nتاريخ المحادثة:\n${conversationContext}\nالمستخدم: ${userText}\nالمعالج:`;

        try {
            const response = await geminiClient.generate(finalPrompt);
            if (response) {
                setMessages((prev) => [...prev, { id: Date.now().toString(), role: "assistant", content: response }]);
            } else {
                throw new Error("Empty response");
            }
        } catch (error) {
            logger.error("Therapist Chat Error:", error);
            setMessages((prev) => [...prev, { id: Date.now().toString(), role: "assistant", content: "معلش، الشبكة فصلت شوية. خد نفس عميق وجرب تبعت تاني." }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <>
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[600px] max-h-[90vh]"
                        dir="rtl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center relative">
                                    <BrainCircuit className="w-5 h-5 text-emerald-400" />
                                    {burnoutRisk && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center border border-slate-900">
                                            <AlertTriangle className="w-2.5 h-2.5 text-white" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-100 text-sm">المعالج الذكي (The Oracle)</h3>
                                    <div className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">متصل للتدخل السلوكي</p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-900/40">
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed ${msg.role === "user"
                                                ? "bg-slate-800 text-slate-200 rounded-tr-none"
                                                : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-100 rounded-tl-none shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                                            }`}
                                    >
                                        <div className="whitespace-pre-wrap">{msg.content}</div>
                                    </div>
                                </motion.div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-end">
                                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex items-center gap-3 rounded-tl-none">
                                        <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                                        <span className="text-xs text-emerald-400 font-medium animate-pulse">يحلل المعطيات...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-slate-900 border-t border-white/5">
                            {/* ◈ Reconnection CTA — when spiritually disconnected/flickering */}
                            {(resonance.level === 'disconnected' || resonance.level === 'flickering') && (
                                <button
                                    onClick={() => {
                                        const msg = getReconnectionMessage('confronted_truth');
                                        if (msg) setRitualMessage(msg);
                                    }}
                                    className="w-full mb-3 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98"
                                    style={{
                                        background: 'rgba(168, 85, 247, 0.08)',
                                        border: '1px solid rgba(168, 85, 247, 0.15)',
                                        color: '#c084fc',
                                    }}
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    خد لحظة صمت — أعد الاتصال بالمصدر
                                </button>
                            )}
                            <form onSubmit={handleSend} className="relative flex items-center gap-2">
                                <input
                                    id="therapist-chat-input"
                                    name="therapistChatInput"
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="فضفض.. أنا سامعك..."
                                    className="flex-1 bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-slate-500"
                                    disabled={isTyping}
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isTyping}
                                    className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                            <p className="text-center text-[9px] text-slate-600 mt-2 font-mono">
                                Powered by Cognitive Behavioral Logic & Gemini
                            </p>
                        </div>
                    </motion.div>
                </div >
            )}
        </AnimatePresence>

        {/* ◈ Reconnection Ritual Overlay */}
        {ritualMessage && (
            <Suspense fallback={null}>
                <ReconnectionRitual
                    message={ritualMessage}
                    onComplete={() => {
                        setRitualMessage(null);
                        // Add a gentle follow-up message
                        setMessages(prev => [...prev, {
                            id: Date.now().toString(),
                            role: 'assistant',
                            content: 'أهلاً بيك تاني. كيف حاسس دلوقتي بعد اللحظة دي؟ في فرق؟'
                        }]);
                    }}
                />
            </Suspense>
        )}
    </>
    );
};
