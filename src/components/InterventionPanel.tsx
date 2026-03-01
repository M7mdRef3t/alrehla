import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldAlert, X, ChevronRight, Sparkles, ZapOff } from "lucide-react";
import { supabase } from "../services/supabaseClient";

interface Intervention {
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
    created_at: string;
    metadata?: {
        suggestedActions?: Array<{ id: string; label: string; icon: string; badge?: string }>;
    };
}

export const InterventionPanel: FC = () => {
    const [items, setItems] = useState<Intervention[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchInterventions = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase!.auth.getSession();
            const res = await fetch('/api/interventions', {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const executeAction = async (interventionId: string, actionType: string) => {
        try {
            const { data: { session } } = await supabase!.auth.getSession();

            // 1. Record the action
            await fetch('/api/micro-actions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ interventionId, actionType })
            });

            // 2. Perform UI Side Effect
            handleUIEffect(actionType);

            // 3. Remove from UI
            setItems(prev => prev.filter(item => item.id !== interventionId));
        } catch (err) {
            console.error(err);
        }
    };

    const handleUIEffect = (type: string) => {
        // Placeholder for real UI triggers
        if (type === 'red_orbit_analysis') {
            window.dispatchEvent(new CustomEvent('map:focus-ring', { detail: { ring: 'red' } }));
        } else if (type === 'quick_journal') {
            window.dispatchEvent(new CustomEvent('ui:open-journal'));
        } else if (type === 'rebalance_circles') {
            window.dispatchEvent(new CustomEvent('ui:open-rebalance'));
        }
    };

    const acknowledge = async (id: string) => {
        try {
            const { data: { session } } = await supabase!.auth.getSession();
            await fetch('/api/interventions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ id })
            });
            setItems(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchInterventions();
    }, []);

    if (items.length === 0) return null;

    return (
        <div className="w-full max-w-[38rem] mx-auto mb-4 space-y-3 px-4">
            <AnimatePresence>
                {items.map((item) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`relative p-5 rounded-2xl border flex gap-4 text-right overflow-hidden shadow-xl
                            ${item.severity === 'high'
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-100'
                                : 'bg-amber-500/10 border-amber-500/20 text-amber-100'}
                        `}
                    >
                        {/* Status Icon */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 
                            ${item.severity === 'high' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {item.severity === 'high' ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        </div>

                        <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between mb-1">
                                <button onClick={() => acknowledge(item.id)} className="p-1 hover:bg-white/5 rounded-md transition-colors">
                                    <X className="w-3 h-3 opacity-50" />
                                </button>
                                <span className={`text-[10px] font-black uppercase tracking-widest
                                    ${item.severity === 'high' ? 'text-rose-400' : 'text-amber-400'}
                                `}>
                                    تنبيه المسار
                                </span>
                            </div>
                            <p className="text-sm font-bold leading-relaxed pr-2">
                                {item.message}
                            </p>

                            {/* suggestedActions CTA */}
                            {item.metadata?.suggestedActions && (
                                <div className="flex flex-wrap gap-2 justify-end pt-3">
                                    {item.metadata.suggestedActions.map((act) => (
                                        <div key={act.id} className="flex flex-col items-end gap-1">
                                            {act.badge && (
                                                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full mb-1 border tracking-tight
                                                    ${(act.badge.includes('جريئة') || act.badge.includes('نمط'))
                                                        ? 'bg-blue-500/20 border-blue-500/40 text-blue-300 animate-pulse'
                                                        : item.severity === 'high'
                                                            ? 'bg-rose-500/20 border-rose-500/30 text-rose-300'
                                                            : 'bg-amber-500/20 border-amber-500/30 text-amber-300'}
                                                `}>
                                                    {act.badge}
                                                </span>
                                            )}
                                            <button
                                                onClick={() => executeAction(item.id, act.id)}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1.5 transition-all
                                                    ${act.badge?.includes('جريئة') || act.badge?.includes('نمط')
                                                        ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20'
                                                        : item.severity === 'high'
                                                            ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20'
                                                            : 'bg-amber-500 text-slate-900 hover:bg-amber-600 shadow-lg shadow-amber-500/20'}
                                                `}
                                            >
                                                {act.label}
                                                <ChevronRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!item.metadata?.suggestedActions && (
                                <div className="flex items-center gap-2 justify-end pt-2">
                                    <span className="text-[10px] opacity-60">اسحب للتفاصيل</span>
                                    <ChevronRight className="w-3 h-3 opacity-40" />
                                </div>
                            )}
                        </div>

                        {/* Decorative Background */}
                        <div className={`absolute -bottom-4 -left-4 w-20 h-20 blur-[30px] opacity-20 pointer-events-none rounded-full
                             ${item.severity === 'high' ? 'bg-rose-500' : 'bg-amber-500'}
                        `} />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
