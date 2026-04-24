'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Circle, Sparkles, Shield, MessageCircle, Heart, Brain, Target } from 'lucide-react';
import {
    generateActionPlan,
    loadPlan,
    toggleAction,
    getCategoryLabel,
    getCompletionPercent,
    type ActionPlan,
    type MicroAction,
} from '@/services/actionPlanEngine';

interface ActionPlanDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    insightMessage: string;
    nodes: Array<{ id: string; label: string; color?: string; size?: string; mass?: number }>;
}

const CATEGORY_ICON: Record<MicroAction['category'], typeof Shield> = {
    boundary: Shield,
    communication: MessageCircle,
    'self-care': Heart,
    awareness: Brain,
    decision: Target,
};

const CATEGORY_COLOR: Record<MicroAction['category'], string> = {
    boundary: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
    communication: 'text-blue-400 bg-blue-500/15 border-blue-500/30',
    'self-care': 'text-rose-400 bg-rose-500/15 border-rose-500/30',
    awareness: 'text-purple-400 bg-purple-500/15 border-purple-500/30',
    decision: 'text-teal-400 bg-teal-500/15 border-teal-500/30',
};

export function ActionPlanDrawer({ isOpen, onClose, insightMessage, nodes }: ActionPlanDrawerProps) {
    const [plan, setPlan] = useState<ActionPlan | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        // Try loading existing plan first
        const existing = loadPlan();
        if (existing && existing.actions.length > 0) {
            setPlan(existing);
        } else {
            // Generate new plan
            const newPlan = generateActionPlan(insightMessage, nodes);
            setPlan(newPlan);
        }
    }, [isOpen, insightMessage, nodes]);

    const handleToggle = useCallback((actionId: string) => {
        const updated = toggleAction(actionId);
        if (updated) setPlan({ ...updated });
    }, []);

    const handleRegenerate = useCallback(() => {
        const newPlan = generateActionPlan(insightMessage, nodes);
        setPlan(newPlan);
    }, [insightMessage, nodes]);

    if (!plan) return null;

    const completionPercent = getCompletionPercent(plan);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed top-0 right-0 h-full w-full max-w-md z-50 overflow-y-auto"
                        style={{
                            background: 'rgba(6,10,22,0.95)',
                            borderLeft: '1px solid rgba(255,255,255,0.08)',
                            backdropFilter: 'blur(32px)',
                        }}
                        dir="rtl"
                    >
                        {/* Header */}
                        <div className="sticky top-0 z-10 px-6 pt-6 pb-4" style={{ background: 'rgba(6,10,22,0.95)', backdropFilter: 'blur(20px)' }}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-teal-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-white tracking-tight">خطة العمل</h2>
                                        <p className="text-[10px] text-slate-500 font-bold">خطوات يومية مرتبطة بخريطتك</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-xl hover:bg-white/5 transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">الإنجاز</span>
                                    <span className="text-[11px] font-black text-teal-400 font-mono">{completionPercent}%</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${completionPercent}%` }}
                                        transition={{ duration: 0.6, ease: 'easeOut' }}
                                        className="h-full rounded-full"
                                        style={{
                                            background: completionPercent === 100
                                                ? 'linear-gradient(90deg, #2dd4bf, #34d399)'
                                                : 'linear-gradient(90deg, rgba(45,212,191,0.6), rgba(45,212,191,0.3))',
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions List */}
                        <div className="px-6 pb-6 space-y-3">
                            {plan.actions.map((action, idx) => {
                                const Icon = CATEGORY_ICON[action.category];
                                const colorClass = CATEGORY_COLOR[action.category];

                                return (
                                    <motion.div
                                        key={action.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.08 }}
                                        className={`p-4 rounded-2xl border transition-all duration-300 ${
                                            action.isCompleted
                                                ? 'bg-teal-500/5 border-teal-500/20'
                                                : 'bg-white/[0.03] border-white/[0.06] hover:border-white/10'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Toggle */}
                                            <button
                                                onClick={() => handleToggle(action.id)}
                                                className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110 active:scale-90"
                                            >
                                                {action.isCompleted ? (
                                                    <CheckCircle2 className="w-5 h-5 text-teal-400" />
                                                ) : (
                                                    <Circle className="w-5 h-5 text-slate-600 hover:text-slate-400" />
                                                )}
                                            </button>

                                            <div className="flex-1 min-w-0">
                                                {/* Category Badge */}
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black ${colorClass}`}>
                                                        <Icon className="w-2.5 h-2.5" />
                                                        {getCategoryLabel(action.category)}
                                                    </span>
                                                    {action.linkedNodeLabel && (
                                                        <span className="text-[9px] text-slate-600 font-bold">← {action.linkedNodeLabel}</span>
                                                    )}
                                                </div>

                                                {/* Title */}
                                                <h4 className={`text-sm font-bold mb-1 leading-relaxed ${
                                                    action.isCompleted ? 'text-slate-500 line-through' : 'text-white'
                                                }`}>
                                                    {action.title}
                                                </h4>

                                                {/* Description */}
                                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                                    {action.description}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}

                            {/* Regenerate Button */}
                            <button
                                onClick={handleRegenerate}
                                className="w-full mt-4 py-3 border border-dashed border-teal-500/20 rounded-2xl text-[10px] font-black text-teal-500/40 hover:text-teal-400 hover:border-teal-500/40 active:bg-teal-500/5 transition-all flex items-center justify-center gap-2"
                            >
                                <Sparkles className="w-3 h-3" />
                                ولّد خطة جديدة
                            </button>

                            {/* Completion Message */}
                            <AnimatePresence>
                                {completionPercent === 100 && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="mt-4 p-5 rounded-2xl text-center"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(45,212,191,0.08), rgba(52,211,153,0.08))',
                                            border: '1px solid rgba(45,212,191,0.2)',
                                        }}
                                    >
                                        <div className="text-3xl mb-2">🏆</div>
                                        <h3 className="text-sm font-black text-teal-400 mb-1">أنجزت كل الخطوات!</h3>
                                        <p className="text-[11px] text-slate-400">كل خطوة صغيرة هي انتصار في رحلتك. استمر.</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
