import type { FC } from "react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldAlert, X, ChevronRight } from "lucide-react";
import { supabase, isSupabaseAbortError, safeGetSession } from "@/services/supabaseClient";

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
    const [isApiAvailable, setIsApiAvailable] = useState(true);

    const fetchInterventions = useCallback(async () => {
        try {
            if (!supabase || !isApiAvailable) return;
            const session = await safeGetSession();
            const res = await fetch('/api/interventions', {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            if (res.status === 404) {
                setIsApiAvailable(false);
                setItems([]);
                return;
            }
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } catch (err) {
            if (!isSupabaseAbortError(err)) console.error(err);
        }
    }, [isApiAvailable]);

    const executeAction = async (interventionId: string, actionType: string) => {
        try {
            if (!supabase || !isApiAvailable) return;
            const session = await safeGetSession();

            // 1. Record the action
            const response = await fetch('/api/micro-actions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ interventionId, actionType })
            });
            if (response.status === 404) {
                setIsApiAvailable(false);
                return;
            }

            // 2. Perform UI Side Effect
            handleUIEffect(actionType);

            // 3. Remove from UI
            setItems(prev => prev.filter(item => item.id !== interventionId));
        } catch (err) {
            if (!isSupabaseAbortError(err)) console.error(err);
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
            if (!supabase || !isApiAvailable) return;
            const session = await safeGetSession();
            const response = await fetch('/api/interventions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ id })
            });
            if (response.status === 404) {
                setIsApiAvailable(false);
                setItems([]);
                return;
            }
            setItems(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            if (!isSupabaseAbortError(err)) console.error(err);
        }
    };

    useEffect(() => {
        fetchInterventions();
    }, [fetchInterventions]);

    if (!isApiAvailable || items.length === 0) return null;

    return (
        <div className="w-full max-w-[38rem] mx-auto mb-4 space-y-3 px-4">
            <AnimatePresence>
                {items.map((item) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className={`relative p-5 rounded-3xl border flex gap-4 text-right overflow-hidden shadow-none
                            ${item.severity === 'high'
                                ? 'bg-white/[0.03] border-rose-500/10 text-white/60'
                                : 'bg-white/[0.03] border-amber-500/10 text-white/60'}
                        `}
                        style={{ backdropFilter: "blur(12px)" }}
                    >
                        {/* Status Icon (Muted) */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 
                            ${item.severity === 'high' ? 'bg-rose-500/5 text-rose-500/40' : 'bg-amber-500/5 text-amber-500/40'}`}>
                            {item.severity === 'high' ? <ShieldAlert className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        </div>

                        <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between mb-1">
                                <button onClick={() => acknowledge(item.id)} className="p-1 hover:bg-white/5 rounded-md transition-colors opacity-20">
                                    <X className="w-3 h-3" />
                                </button>
                                <span className={`text-[9px] font-black uppercase tracking-[0.2em]
                                    ${item.severity === 'high' ? 'text-rose-500/50' : 'text-amber-500/50'}
                                `}>
                                    احظة سار
                                </span>
                            </div>
                            <p className="text-xs font-bold leading-relaxed pr-2 opacity-80">
                                {item.message}
                            </p>

                            {/* suggestedActions CTA (Quiet) */}
                            {item.metadata?.suggestedActions && (
                                <div className="flex flex-wrap gap-2 justify-end pt-3">
                                    {item.metadata.suggestedActions.map((act) => (
                                        <div key={act.id} className="flex flex-col items-end gap-1">
                                            <button
                                                onClick={() => executeAction(item.id, act.id)}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 transition-all border
                                                    ${item.severity === 'high'
                                                        ? 'bg-white/[0.02] border-rose-500/10 text-white/40 hover:bg-white/5'
                                                        : 'bg-white/[0.02] border-amber-500/10 text-white/40 hover:bg-white/5'}
                                                `}
                                            >
                                                {act.label}
                                                <ChevronRight className="w-3 h-3 opacity-20" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!item.metadata?.suggestedActions && (
                                <div className="flex items-center gap-2 justify-end pt-2">
                                    <span className="text-[10px] opacity-60">اسحب تفاص</span>
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
