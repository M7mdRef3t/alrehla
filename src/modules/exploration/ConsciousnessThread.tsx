import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, Zap, Calendar, ChevronDown, Sparkles, MessageCircle, Trophy } from "lucide-react";
import { supabase } from "@/services/supabaseClient";

interface ThreadEvent {
    id: string;
    date: string;
    type: 'report' | 'insight' | 'pulse' | 'action' | 'milestone';
    report_result?: {
        wave_pattern?: string;
        final_word?: string;
    };
    result?: {
        summary?: string;
        recommendations?: string[];
    };
    mood?: number;
    stress_tag?: string;
    note?: string;
    mode?: string;
    action_type?: string;
    impact_score?: number | string;
    milestone_type?: string;
    milestone_label?: string;
}

export const ConsciousnessThread: FC = () => {
    const [events, setEvents] = useState<ThreadEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const fetchThread = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase!.auth.getSession();
            const res = await fetch('/api/consciousness-thread', {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEvents(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) fetchThread();
    }, [isOpen]);

    return (
        <div className="w-full max-w-[38rem] mx-auto mt-4 px-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <History className="w-4 h-4" />
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-bold text-white">خط اع (Consciousness Thread)</p>
                        <p className="text-[10px] text-slate-500">سج تطر بصرت از</p>
                    </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-6 pb-20 relative px-2">
                            {/* Vertical Line */}
                            <div className="absolute top-0 right-7 bottom-0 w-[2px] bg-gradient-to-b from-indigo-500/40 via-blue-500/20 to-transparent" />

                            {loading ? (
                                <div className="py-20 text-center text-slate-500 text-xs animate-pulse font-medium">جار استرجاع ذرات اع...</div>
                            ) : events.length > 0 ? (
                                <div className="space-y-12">
                                    {events.map((ev, idx) => (
                                        <ThreadItem key={ev.id || idx} event={ev} />
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 text-center text-slate-500 text-xs">بداة رحة اع..  تب اتارخ بعد.</div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const ThreadItem: FC<{ event: ThreadEvent }> = ({ event }) => {
    const isReport = event.type === 'report';
    const isInsight = event.type === 'insight';
    const isPulse = event.type === 'pulse';
    const isAction = event.type === 'action';
    const isMilestone = event.type === 'milestone';

    const Icon = isMilestone ? Trophy : isReport ? Calendar : isInsight ? Sparkles : isAction ? Zap : MessageCircle;
    const colorClass = isMilestone ? 'bg-amber-400 shadow-amber-500/60' : isReport ? 'bg-indigo-500 shadow-indigo-500/40' : isInsight ? 'bg-blue-500 shadow-blue-500/40' : isAction ? 'bg-orange-500 shadow-orange-500/40' : 'bg-emerald-500 shadow-emerald-500/40';

    const getActionLabel = (type?: string) => {
        if (type === 'red_orbit_analysis') return 'تح دار أحر';
        if (type === 'quick_journal') return 'تفرغ شاعر';
        if (type === 'rebalance_circles') return 'إعادة تزع ادائر';
        return 'إجراء ع';
    }

    return (
        <div className="relative pr-12 md:pr-14 pl-2">
            <div className={`absolute -right-1.5 top-0 w-3 h-3 rounded-full ${colorClass} shadow-lg z-10 border-2 border-slate-900`} />

            <div className="text-right">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                    {new Date(event.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex items-center gap-2 justify-end mb-3">
                        <span className={`text-[10px] font-black uppercase ${isMilestone ? 'text-amber-400' : isReport ? 'text-indigo-400' : isInsight ? 'text-blue-400' : isAction ? 'text-orange-400' : 'text-emerald-400'}`}>
                            {isMilestone ? 'إجاز تطر' : isReport ? 'ترر أسبع' : isInsight ? 'بصرة خرطة' : isAction ? 'إجراء تعد' : 'بض خاطرة'}
                        </span>
                        <Icon className="w-3 h-3 opacity-50" />
                    </div>

                    {isMilestone && (
                        <div className="text-right py-1">
                            <div className="flex items-center gap-2 justify-end mb-2">
                                <p className="text-[13px] text-amber-100 font-black leading-tight">
                                    {event.milestone_label}
                                </p>
                            </div>
                            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 inline-block text-[10px] text-amber-200/80">
                                {event.milestone_type === 'shadow_breakthrough' && ' سر ط تائ'}
                                {event.milestone_type === 'behavioral_diversity' && ' تسع ج اأفعا'}
                                {event.milestone_type === 'stability_recovery' && '️ استعادة ااتزا افس'}
                            </div>
                        </div>
                    )}

                    {isReport && event.report_result && (
                        <div>
                            <p className="text-[13px] text-white font-bold leading-relaxed mb-1 line-clamp-2">{event.report_result.wave_pattern}</p>
                            <p className="text-[11px] text-indigo-300 italic">" {event.report_result.final_word} "</p>
                        </div>
                    )}

                    {isInsight && event.result && (
                        <div>
                            <p className="text-[12px] text-slate-300 leading-relaxed mb-2 line-clamp-2">{event.result.summary}</p>
                            <div className="flex flex-wrap gap-1 justify-end">
                                {event.result.recommendations?.slice(0, 2).map((r: string, i: number) => (
                                    <span key={i} className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[9px] font-medium">{r}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {isAction && (
                        <div>
                            <div className="flex items-center gap-3 justify-end mb-2">
                                <p className="text-[12px] text-orange-100 font-bold">{getActionLabel(event.action_type)}</p>
                                <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center">
                                    <Zap className="w-3 h-3 text-orange-400" />
                                </div>
                            </div>

                            {event.impact_score !== undefined && event.impact_score !== null && (
                                <div className="flex items-center gap-2 justify-end pt-1 pr-9">
                                    <span className={`text-[10px] font-bold ${Number(event.impact_score) > 0 ? 'text-emerald-400' : Number(event.impact_score) < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                                        {Number(event.impact_score) > 0 ? ' تأثر إجاب' : Number(event.impact_score) < 0 ? ' تأثر سب' : '️ بد أثر'}
                                        {' '} ({Number(event.impact_score) > 0 ? '+' : ''}{event.impact_score})
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {isPulse && (
                        <div>
                            <div className="flex items-center gap-2 justify-end mb-2">
                                <span className="text-[10px] text-slate-500">د {event.mood}/5</span>
                                <Zap className={`w-3 h-3 ${event.mood && event.mood > 3 ? 'text-yellow-400' : 'text-slate-600'}`} />
                            </div>
                            <p className="text-[12px] text-slate-200 leading-relaxed pr-2 border-r border-emerald-500/30">
                                {event.note || `سجت ضغط  ع: ${event.stress_tag}`}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


