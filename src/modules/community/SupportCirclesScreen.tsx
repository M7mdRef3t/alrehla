"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sparkles, MessageCircle, Lock, Users, Activity, X } from 'lucide-react';
import { getActiveCircles, getSharedWisdom, SupportCircle, SharedWisdom } from '../../services/communityService';

/**
 * Support Circles Screen
 * =======================
 * مساحة دوائر الدعم المجهولة والمشاركة الآمنة
 */

export default function SupportCirclesScreen() {
    const [circles, setCircles] = useState<SupportCircle[]>([]);
    const [wisdom, setWisdom] = useState<SharedWisdom[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'circles' | 'wisdom'>('circles');

    useEffect(() => {
        async function loadData() {
            const [c, w] = await Promise.all([
                getActiveCircles(),
                getSharedWisdom()
            ]);
            setCircles(c);
            setWisdom(w);
            setIsLoading(false);
        }
        loadData();
    }, []);

    if (isLoading) {
        return (
            <div className="w-full min-h-[100dvh] flex items-center justify-center" style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}>
                <div className="w-8 h-8 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div
            className="w-full min-h-[100dvh] pb-24 text-white overflow-hidden"
            style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}
            dir="rtl"
        >
            {/* Header */}
            <header className="px-6 py-8 border-b border-indigo-500/10 bg-black/20 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                            مجتمع الدعم المجهول
                        </h1>
                        <p className="text-xs text-indigo-300/70 font-medium">مساحة آمنة جداً. بلا أسماء. بلا أحكام.</p>
                    </div>
                </div>

                <div className="flex gap-2 mt-6 p-1 rounded-xl bg-indigo-950/40 border border-indigo-500/20">
                    <button
                        onClick={() => setActiveTab('circles')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'circles' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        الدوائر الحية
                    </button>
                    <button
                        onClick={() => setActiveTab('wisdom')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'wisdom' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        حكمة الشارع
                    </button>
                </div>
            </header>

            <main className="p-6">
                <AnimatePresence mode="wait">
                    {activeTab === 'circles' ? (
                        <motion.div
                            key="tab-circles"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            {/* Call to action card */}
                            <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col gap-3 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mt-10 -mr-10" />
                                <Lock className="w-6 h-6 text-indigo-400 mb-1" />
                                <h2 className="text-base font-bold">كل شيء هنا سري!</h2>
                                <p className="text-xs text-slate-300 leading-relaxed">النقاشات لا تظهر لأي شخص خارج الدائرة. نحن نضمن أمان وخصوصية مساحتك للتعافي.</p>
                            </div>

                            {circles.map(c => (
                                <CircleCard key={c.id} circle={c} />
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="tab-wisdom"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4"
                        >
                            <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-between mb-2">
                                <div>
                                    <h3 className="font-bold text-teal-400 text-sm">شارك حكمتك مع اللي ماشيين نفس الكوبري</h3>
                                    <p className="text-xs text-slate-400 mt-1">تجاربك في التعافي مهمة. ابعتلنا تجربتك مجهولة الهوية.</p>
                                </div>
                                <Sparkles className="w-6 h-6 text-teal-400 opacity-50" />
                            </div>

                            {wisdom.map(w => (
                                <WisdomCard key={w.id} wisdom={w} />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

// Subcomponents

const CircleCard = ({ circle }: { circle: SupportCircle }) => {
    return (
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700 hover:border-indigo-500/50 transition-colors flex flex-col gap-4">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-base mb-1 text-white">{circle.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-[90%]">{circle.description}</p>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 shrink-0">
                    <Users className="w-3 h-3 text-indigo-400" />
                    <span>{circle.membersCount} / {circle.maxMembers}</span>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {circle.rules.map(r => (
                    <span key={r} className="text-[10px] px-2 py-0.5 rounded border border-slate-700 text-slate-400 bg-slate-900/50">
                        • {r}
                    </span>
                ))}
            </div>

            <button className="w-full py-3 rounded-xl bg-indigo-600 font-bold text-xs text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2">
                <MessageCircle className="w-4 h-4" />
                طلب الانضمام مجهولاً
            </button>
        </div>
    );
};

const WisdomCard = ({ wisdom }: { wisdom: SharedWisdom }) => {
    return (
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700 relative">
            <div className="absolute top-4 left-4 flex flex-col items-center">
                <button className="p-1 rounded bg-slate-700/50 hover:bg-teal-500/20 text-slate-400 hover:text-teal-400 transition-colors">
                    ▲
                </button>
                <span className="text-[10px] font-bold text-teal-400 my-1">{wisdom.helpfulCount}</span>
            </div>

            <h4 className="font-bold text-slate-200 text-sm mb-3">📍 نمط: {wisdom.topic}</h4>

            <div className="mb-4 pr-0 pl-10 text-sm text-slate-300 leading-relaxed font-normal">
                "{wisdom.story}"
            </div>

            <div className="p-3 pl-10 rounded-xl bg-teal-500/10 border-r-2 border-teal-500 text-xs text-slate-200 leading-relaxed font-bold">
                💡 <span className="text-teal-300 mr-1">الحل أو التكتيك المجرب:</span> {wisdom.strategy}
            </div>

            <div className="mt-3 text-[10px] text-slate-500 flex items-center justify-end gap-1">
                نصيحة مجتمعية <Activity className="w-3 h-3" />
            </div>
        </div>
    );
};
