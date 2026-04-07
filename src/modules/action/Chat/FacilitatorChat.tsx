"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Sparkles, Loader2, Check, Terminal } from 'lucide-react';
import { NodeData } from '@/hooks/useDawayirEngine';
import { supabase } from '@/services/supabaseClient';
import { consumeKineticTelemetryOnce, peekLatestKineticTelemetry } from '@/services/kineticTelemetry';
import { isPublicPaymentsEnabled } from '@/config/payments';
import { VoiceInput } from '@/modules/meta/VoiceInput';
import { useAppOverlayState } from '@/state/appOverlayState';
import { ShadowMemory } from '@/services/shadowMemory';

interface FacilitatorChatProps {
    focusedNode: NodeData;
    fullMap: unknown;
    onClose: () => void;
    onUpdateNode: (nodeId: string, updates: Partial<NodeData>) => void;
    onTokenBalanceChange?: (tokens: number | null) => void;
}
interface ProposedAction {
    action?: string;
    nodeId?: string;
    updates?: Partial<NodeData>;
}
type AgentResponse = {
    reply?: string;
    proposedAction?: ProposedAction | null;
    llm_latency_ms?: number;
    error?: string;
    token_warning?: string | null;
    tokens_remaining?: number | null;
};

const GUEST_GATE_MESSAGE = "يجب تسجيل الدخول للتحدث مع دواير.";

const PERSONA_TECHNICAL_ERROR =
    "دواير واجهت معضلة تقنية في النظام.. سنحاول تجاوزها بكفاءة.";
const TECHNICAL_ERROR_PATTERN = /json|payload|config|token|schema|syntax|context|provider|timeout|rate\s*limit|invalid|request|admin api/i;

function shieldTechnicalErrorMessage(rawError: unknown, fallback: string): string {
    const text = typeof rawError === "string" ? rawError.trim() : "";
    if (!text) return fallback;
    if (TECHNICAL_ERROR_PATTERN.test(text)) return PERSONA_TECHNICAL_ERROR;
    return text;
}

function formatAlgorithmicEmpathyCopy(latencyMs: number): string {
    const seconds = (latencyMs / 1000).toFixed(2);
    if (latencyMs < 1000) return "المعالجة المنطقية سريعة.. ننتظر تدفق الوعي.";
    if (latencyMs <= 2500) return `استغرق التفكير ${seconds} ثانية للوصول لهذا الاستنتاج.`;
    return `الخوارزمية تبذل جهداً كبيراً (${seconds} ثانية) لفك شفرة الإحساس.. شكراً على صبرك.`;
}

function buildGuestReply(focusedNodeLabel: string, latestMessage?: string): string {
    const normalized = String(latestMessage ?? "").trim();
    if (!normalized || normalized.includes("ترحيب")) {
        return `أهلاً بك؛ نحن بصدد تحليل "${focusedNodeLabel}" حالياً. يمكنك البدء بسرد أي معلومة تود تدوينها حوله.`;
    }

    if (normalized.includes("هو")) {
        return `يبدو أن "${focusedNodeLabel}" يشغل حيزاً من تفكيرك. أخبرني أكثر: ما هو الموقف الذي جعله يبرز في وعيك الآن؟`;
    }

    if (normalized.includes("أحب") || normalized.includes("أكره") || normalized.includes("أشعر")) {
        return `فهمت أن لديك انطباع تجاه "${focusedNodeLabel}". أخبرني المزيد عن طبيعة الشعور: هل هو إحساس بالأمان أم تهديد؟`;
    }

    return `فهمت عن "${focusedNodeLabel}": "${normalized}". سأقوم بمطابقة المعطيات مع الأنماط المخزنة في ذكائنا التكتيكي.`;
}


export default function FacilitatorChat({ focusedNode, fullMap, onClose, onUpdateNode, onTokenBalanceChange }: FacilitatorChatProps) {
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string, proposedAction?: ProposedAction, actionTaken?: boolean, llmLatencyMs?: number | null }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showAlgorithmicVulnerability, setShowAlgorithmicVulnerability] = useState(false);
    const [showUpsellOverlay, setShowUpsellOverlay] = useState(false);
    const [keyboardInsetPx, setKeyboardInsetPx] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const openOverlay = useAppOverlayState((s) => s.openOverlay);

    const shouldShowUpsell = (status: number, data: AgentResponse) =>
        status === 403 || Number(data.tokens_remaining ?? -1) === 0;
    const resolveKineticTelemetry = () => consumeKineticTelemetryOnce() ?? peekLatestKineticTelemetry();
    const publishTokenBalance = useCallback((value: unknown) => {
        if (!onTokenBalanceChange) return;
        onTokenBalanceChange(typeof value === 'number' ? value : null);
    }, [onTokenBalanceChange]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (typeof window === "undefined" || !window.visualViewport) return;
        const viewport = window.visualViewport;
        const updateKeyboardInset = () => {
            const nextInset = Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop));
            setKeyboardInsetPx(nextInset);
        };

        updateKeyboardInset();
        viewport.addEventListener("resize", updateKeyboardInset);
        viewport.addEventListener("scroll", updateKeyboardInset);
        window.addEventListener("orientationchange", updateKeyboardInset);

        return () => {
            viewport.removeEventListener("resize", updateKeyboardInset);
            viewport.removeEventListener("scroll", updateKeyboardInset);
            window.removeEventListener("orientationchange", updateKeyboardInset);
        };
    }, []);

    // Initial greeting from the AI based on the node
    useEffect(() => {
        const fetchInitialGreeting = async () => {
            setIsLoading(true);
            try {
                const { data: { session } } = await supabase?.auth.getSession() ?? { data: { session: null } };
                const userId = session?.user?.id;
                if (!userId) {
                    setMessages([{ role: 'ai', content: buildGuestReply(focusedNode.label) }]);
                    return;
                }

                const shadowContext = await ShadowMemory.getHistory(userId, 5);

                const res = await fetch('/api/chat/agent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: [{ role: 'user', content: 'مرحباً. أريد الحديث عن هذا الكيان.' }],
                        fullMap,
                        focusedNode,
                        userId,
                        kineticTelemetry: resolveKineticTelemetry(),
                        shadowContext
                    })
                });
                const data = (await res.json()) as AgentResponse;
                if (!res.ok) {
                    if (shouldShowUpsell(res.status, data)) {
                        setShowUpsellOverlay(true);
                        publishTokenBalance(0);
                        setMessages([{ role: 'ai', content: 'رصيد الوعي المخصص للتحليل الذكي قد نفد. يرجى تفعيل طاقة الرحلة للمتابعة.' }]);
                    } else if (res.status === 401 || data.error === GUEST_GATE_MESSAGE) {
                        setMessages([{ role: 'ai', content: buildGuestReply(focusedNode.label) }]);
                    } else {
                        publishTokenBalance(data.tokens_remaining);
                        setMessages([{
                            role: 'ai',
                            content: shieldTechnicalErrorMessage(data.error, 'حدث خطأ غير متوقع في الاتصال.')
                        }]);
                    }
                    return;
                }
                setShowUpsellOverlay(false);
                publishTokenBalance(data.tokens_remaining);
                const reply = typeof data.reply === "string" ? data.reply : "لم أستطع تحليل هذا الجزء حالياً.";
                const optionalWarning = typeof data.token_warning === "string" ? data.token_warning : null;
                setMessages([{
                    role: 'ai',
                    content: reply,
                    proposedAction: data.proposedAction ?? undefined,
                    llmLatencyMs: typeof data.llm_latency_ms === "number" ? data.llm_latency_ms : null
                }, ...(optionalWarning ? [{ role: 'ai' as const, content: optionalWarning }] : [])]);
            } catch (err) {
                console.error("Initial greeting failed", err);
                setMessages([{ role: 'ai', content: `حدث خطأ في محاكاة "${focusedNode.label}" في عقلي.` }]);
            } finally {
                setIsLoading(false);
            }
        };

        // Reset conversation when node changes
        setMessages([]);
        fetchInitialGreeting();
    }, [focusedNode, fullMap, publishTokenBalance]); // Re-run if they click a DIFFERENT node

    const handleApproveAction = async (msgIndex: number, action: ProposedAction) => {
        // Mark as taken
        setMessages(prev => prev.map((m, i) => i === msgIndex ? { ...m, actionTaken: true } : m));

        // Execute the UI change
        onUpdateNode(action.nodeId || focusedNode.id, action.updates ?? {});

        // Tell the AI it was done
        setIsLoading(true);
        try {
            const { data: { session } } = await supabase?.auth.getSession() ?? { data: { session: null } };
            const userId = session?.user?.id;
            if (!userId) {
                setMessages(prev => [...prev, {
                    role: 'ai',
                    content: buildGuestReply(focusedNode.label, 'لقد قمت بتحديث الإحداثيات بنجاح.')
                }]);
                return;
            }

            const shadowContext = await ShadowMemory.getHistory(userId, 5);

            const res = await fetch('/api/chat/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, { role: 'user', content: '[System: The user has approved the physical change to the map. Acknowledge this briefly and playfully.]' }],
                    fullMap,
                    focusedNode,
                    userId,
                    kineticTelemetry: resolveKineticTelemetry(),
                    shadowContext
                })
            });
            const data = (await res.json()) as AgentResponse;
            if (!res.ok) {
                if (shouldShowUpsell(res.status, data)) {
                    setShowUpsellOverlay(true);
                    publishTokenBalance(0);
                } else if (res.status === 401 || data.error === GUEST_GATE_MESSAGE) {
                    setMessages(prev => [...prev, {
                        role: 'ai',
                        content: buildGuestReply(focusedNode.label, 'لقد قمت بتحديث الإحداثيات بنجاح.')
                    }]);
                } else {
                    publishTokenBalance(data.tokens_remaining);
                    setMessages(prev => [...prev, {
                        role: 'ai',
                        content: shieldTechnicalErrorMessage(data.error, 'تعذر تطبيق التحديثات التقنية.')
                    }]);
                }
                return;
            }
            setShowUpsellOverlay(false);
            publishTokenBalance(data.tokens_remaining);
            const optionalWarning = typeof data.token_warning === "string" ? data.token_warning : null;
            setMessages(prev => [
                ...prev,
                { role: 'user', content: 'لقد قمت بتحديث الإحداثيات بنجاح. استكمل معي.' },
                {
                    role: 'ai',
                    content: typeof data.reply === "string" ? data.reply : "المهمة تمت بنجاح تكتيكي.",
                    proposedAction: data.proposedAction ?? undefined,
                    llmLatencyMs: typeof data.llm_latency_ms === "number" ? data.llm_latency_ms : null
                },
                ...(optionalWarning ? [{ role: 'ai' as const, content: optionalWarning }] : [])
            ]);
        } catch {
            // Error silently, not critical
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        const newMessages = [...messages, { role: 'user' as const, content: userMsg }];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            const { data: { session } } = await supabase?.auth.getSession() ?? { data: { session: null } };
            const userId = session?.user?.id;
            if (!userId) {
                setMessages(prev => [...prev, {
                    role: 'ai',
                    content: buildGuestReply(focusedNode.label, userMsg)
                }]);
                return;
            }

            const shadowContext = await ShadowMemory.getHistory(userId, 5);

            const res = await fetch('/api/chat/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages,
                    fullMap,
                    focusedNode,
                    userId,
                    kineticTelemetry: resolveKineticTelemetry(),
                    shadowContext
                })
            });
            const data = (await res.json()) as AgentResponse;
            if (!res.ok) {
                if (shouldShowUpsell(res.status, data)) {
                    setShowUpsellOverlay(true);
                    publishTokenBalance(0);
                } else if (res.status === 401 || data.error === GUEST_GATE_MESSAGE) {
                    setMessages(prev => [...prev, {
                        role: 'ai',
                        content: buildGuestReply(focusedNode.label, userMsg)
                    }]);
                } else {
                    publishTokenBalance(data.tokens_remaining);
                    setMessages(prev => [...prev, {
                        role: 'ai',
                        content: shieldTechnicalErrorMessage(data.error, "تعذر معالجة الرسالة.")
                    }]);
                }
                return;
            }
            setShowUpsellOverlay(false);
            publishTokenBalance(data.tokens_remaining);
            const optionalWarning = typeof data.token_warning === "string" ? data.token_warning : null;
            setMessages(prev => [...prev, {
                role: 'ai',
                content: typeof data.reply === "string" ? data.reply : "لم أتلقَّ رداً كافياً.",
                proposedAction: data.proposedAction ?? undefined,
                llmLatencyMs: typeof data.llm_latency_ms === "number" ? data.llm_latency_ms : null
            }, ...(optionalWarning ? [{ role: 'ai' as const, content: optionalWarning }] : [])]);
        } catch {
            setMessages(prev => [...prev, { role: 'ai', content: "المعذرة، حدث خطأ في النظام الصوتي." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVoiceTranscript = (text: string) => {
        const next = text.trim();
        if (!next) return;
        setInput((prev) => (prev.trim().length > 0 ? `${prev.trim()} ${next}` : next));
    };

    useEffect(() => {
        if (!showAlgorithmicVulnerability) return;
        const latestAi = [...messages]
            .reverse()
            .find((m) => m.role === "ai" && typeof m.llmLatencyMs === "number");
        if (!latestAi || typeof latestAi.llmLatencyMs !== "number") return;
        console.warn("[AlgorithmicVulnerability] Micro-copy:", formatAlgorithmicEmpathyCopy(latestAi.llmLatencyMs));
    }, [messages, showAlgorithmicVulnerability]);

    const getNodeBadgeStyle = (color: string): React.CSSProperties => {
        switch (color) {
            case 'core':
                return {
                    backgroundColor: 'var(--ring-safe-glow)',
                    color: 'var(--ring-safe)',
                    borderColor: 'var(--ring-safe)'
                };
            case 'danger':
                return {
                    backgroundColor: 'var(--ring-danger-glow)',
                    color: 'var(--ring-danger)',
                    borderColor: 'var(--ring-danger)'
                };
            case 'neutral':
                return {
                    backgroundColor: 'var(--soft-teal)',
                    color: 'var(--soft-teal)',
                    borderColor: 'var(--soft-teal)'
                };
            case 'ignored':
            default:
                return {
                    backgroundColor: 'rgba(148, 163, 184, 0.14)',
                    color: 'var(--text-muted)',
                    borderColor: 'rgba(148, 163, 184, 0.3)'
                };
        }
    };

    return (
        <div
            className="fixed bottom-0 left-0 right-0 h-[60dvh] max-h-[calc(100dvh-env(safe-area-inset-top)-0.25rem)] w-full z-40 glass-heavy flex flex-col border-white/10 animate-in slide-in-from-bottom-8 duration-500 overflow-hidden rounded-t-2xl transition-[bottom] md:absolute md:right-6 md:top-24 md:bottom-auto md:left-auto md:w-96 md:h-auto md:max-h-[70vh] md:rounded-2xl md:slide-in-from-right-8 md:z-50"
            style={keyboardInsetPx > 0 ? { bottom: `${keyboardInsetPx}px` } : undefined}
            dir="rtl"
        >
            {/* Header */}
            <div className={`px-6 py-5 flex justify-between items-center border-b border-white/5 bg-white/5 backdrop-blur-md`}>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="سحب لتغيير حجم نافذة المحادثة"
                    className="md:hidden absolute top-2 left-1/2 -translate-x-1/2 w-14 h-2 rounded-full bg-white/20 hover:bg-white/35 transition-colors"
                />
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shadow-inner">
                        <Terminal className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-black text-white text-xs uppercase tracking-widest font-mono">دواير_الميسر</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">الكيان_المستهدف:</span>
                            <span
                                className="text-[10px] px-2 py-0.5 rounded-md border font-black font-mono uppercase tracking-tighter"
                                style={getNodeBadgeStyle(focusedNode.color)}
                            >
                                {focusedNode.label}
                            </span>
                        </div>
                    </div>
                </div>
                <label className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-tight mr-auto ml-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showAlgorithmicVulnerability}
                        onChange={(e) => setShowAlgorithmicVulnerability(e.target.checked)}
                        className="accent-teal-500"
                        aria-label="الشفافية الخوارزمية"
                    />
                    الشفافية_الخوارزمية
                </label>
                <button
                    onClick={onClose}
                    className="w-11 h-11 rounded-xl bg-white/5 text-slate-400 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all"
                    aria-label="إغلاق"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Chat Area */}
            <div
                className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 relative"
                role="log"
                aria-live="polite"
                aria-relevant="additions text"
                aria-label="سجل المحادثة مع الميسر"
            >
                {messages.length === 0 && !isLoading && (
                    <div className="text-center text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] my-auto mt-20 font-mono">في_انتظار_المعطيات...</div>
                )}
                {messages.map((msg, i) => (
                    <div key={i} className={`flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed
                            ${msg.role === 'user'
                                ? 'text-white rounded-bl-sm font-medium'
                                : 'glass text-slate-200 border-white/5 rounded-br-sm shadow-inner'
                            }`}
                            style={msg.role === "user"
                                ? {
                                    background: "var(--ds-color-primary-soft)",
                                    boxShadow: "0 8px 22px var(--soft-teal)"
                                }
                                : undefined
                            }
                        >
                            {msg.content}
                        </div>
                        {msg.role === 'ai' && showAlgorithmicVulnerability && typeof msg.llmLatencyMs === 'number' && (
                            <div className="max-w-[85%] text-[11px] text-slate-400 leading-relaxed px-1">
                                {formatAlgorithmicEmpathyCopy(msg.llmLatencyMs)}
                            </div>
                        )}
                        {msg.role === 'ai' && msg.proposedAction && msg.proposedAction.action === 'UPDATE_NODE' && (
                            <div className="mr-2 mb-2 self-start">
                                {!msg.actionTaken ? (
                                    <button
                                        onClick={() => handleApproveAction(i, msg.proposedAction!)}
                                        className="text-xs px-4 py-2 bg-teal-500 text-slate-950 hover:bg-teal-400 rounded-xl font-black transition flex items-center gap-2 shadow-lg shadow-teal-500/20 uppercase tracking-tighter"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                        تطبيق التعديلات المقترحة
                                    </button>
                                ) : (
                                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 px-3 py-1.5 font-mono uppercase tracking-tighter"><Check className="w-3.5 h-3.5" /> تم_تطبيق_البروتوكول_بنجاح</span>
                                )}
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start animate-in fade-in">
                        <div className="glass border-white/5 px-6 py-4 rounded-2xl rounded-bl-sm flex gap-2 items-center">
                            <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:pb-4 bg-white/5 border-t border-white/5 backdrop-blur-md">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex items-center bg-white/5 rounded-2xl p-1.5 border border-white/10 group focus-within:border-teal-500/30 transition-all relative"
                >
                    <div className="pr-1">
                        <VoiceInput
                            onTranscript={handleVoiceTranscript}
                            disabled={isLoading || showUpsellOverlay}
                            language="ar-EG"
                        />
                    </div>
                    <input
                        id="chat-message-input"
                        name="chatMessage"
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="اكتب شيئاً أو اسأل عن هذا الكيان..."
                        aria-label="اكتب رسالتك هنا"
                        className="flex-1 bg-transparent px-4 py-3 text-sm outline-none text-white placeholder:text-slate-600"
                        disabled={isLoading || showUpsellOverlay}
                    />
                    <button
                        type="submit"
                        aria-label="إرسال الرسالة"
                        title="إرسال الرسالة"
                        disabled={isLoading || showUpsellOverlay || !input.trim()}
                        className="w-12 h-12 rounded-xl bg-teal-500 text-slate-950 flex items-center justify-center hover:bg-teal-400 disabled:opacity-20 disabled:grayscale transition-all shadow-lg shadow-teal-500/10 active:scale-95"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </form>
            </div>

            {showUpsellOverlay && (
                <div className="absolute inset-0 z-[60] bg-slate-950/92 backdrop-blur-md rounded-t-2xl md:rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-teal-300 font-black mb-3 font-mono">premium_access_required</p>
                    <h4 className="text-lg font-black text-white mb-3">رصيد الوعي نفد.. المهمة تتوقف</h4>
                    <p className="text-sm text-slate-300 leading-relaxed max-w-xs">
                        {isPublicPaymentsEnabled
                            ? "فعّل طاقة الرحلة (100 نقطة وعي) عبر نظام التفعيل اليدوي لبدء التحليل وتفكيك العقد خطوة بخطوة."
                            : "رحلة الدفع قيد التجهيز حالياً. يمكنك متابعة بناء الخريطة اليدوية حتى فتح التفعيل."}
                    </p>
                    <div className="mt-5 flex flex-col sm:flex-row items-center gap-3">
                        {isPublicPaymentsEnabled && (
                            <button
                                type="button"
                                onClick={() => { openOverlay("premiumBridge"); }}
                                className="px-5 py-2.5 rounded-xl bg-teal-500 text-slate-950 font-black hover:bg-teal-400 transition-colors"
                            >
                                افتح المسار المتقدم
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl border border-white/20 text-white font-bold hover:bg-white/10 transition-colors"
                        >
                            العودة للخريطة
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}



