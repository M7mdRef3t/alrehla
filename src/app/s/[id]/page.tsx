"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, History, Flame, Activity, Lock } from "lucide-react";

/**
 * 👑 DOCUMENT OF TRANSFORMATION (وثيقة التحول)
 * ─────────────────────────────────────────────────────────────────────────────
 * Final Iconic Surgery: Breathing Space & Hairline Weights.
 * Authority through Silence.
 */

export default function SharedEvolutionPage({ params }: { params: { id: string } }) {
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`/api/share/${params.id}`)
            .then(res => res.ok ? res.json() : Promise.reject())
            .then(d => setData(d))
            .catch(() => setError("عذراً، هذا الرابط منتهي الصلاحية أو غير صالح."));
    }, [params.id]);

    if (error) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
                <Lock className="w-10 h-10 text-white/[0.03] mb-6" />
                <h1 className="text-lg font-black text-white/80 mb-2">الرؤية محجوبة</h1>
                <p className="text-[#8A8A8A] font-medium max-w-sm text-[10px]">{error}</p>
            </div>
        );
    }

    if (!data) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <div className="w-6 h-6 border-[1px] border-white/5 border-t-white/20 rounded-full animate-spin" />
        </div>
    );

    const generatedAt = new Date(data.created_at || new Date()).toLocaleDateString('ar-EG', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    const monthName = new Date(data.created_at || new Date()).toLocaleDateString('ar-EG', {
        month: 'long', year: 'numeric'
    });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen bg-[#050505] text-[#D6D6D6] selection:bg-white/10 overflow-x-hidden p-8 md:p-32 font-sans text-right"
        >
            <div className="max-w-2xl mx-auto space-y-32">

                {/* 0️⃣ CONTEXT LAYER: Barely Visible One-liner */}
                <div className="text-center opacity-30">
                    <p className="text-[9px] text-[#8A8A8A] font-medium tracking-tight">
                        Dawayir is a behavioral analysis system that maps psychological patterns using daily pulse data.
                    </p>
                </div>

                {/* 1️⃣ ABOVE THE FOLD: Clinical Header */}
                <header className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center text-md font-black text-white/40 mb-10">
                        {data.owner_initials}
                    </div>
                    <h1 className="text-2xl font-black text-[#FFFFFF] mb-3 tracking-tighter">وثيقة تحول</h1>
                    <p className="text-[9px] text-[#8A8A8A] font-black uppercase tracking-[0.3em] opacity-60">
                        تقرير مبني على بيانات سلوكية حقيقية
                    </p>
                </header>

                {/* 2️⃣ STRONGEST TRANSFORMATION: High-Breathing Hero */}
                <section className="text-center py-32 border-y border-white/[0.03]">
                    <p className="text-[9px] font-black text-[#8A8A8A] uppercase tracking-widest mb-8 opacity-40">أقوى تحول مرصود</p>
                    <h2 className="text-2xl font-black text-[#FFFFFF] leading-[1.4] max-w-sm mx-auto">
                        {data.strongest_transformation || "استقرار هيكلي في كافة الدوائر المرصودة"}
                    </h2>
                </section>

                {/* 3️⃣ EVOLUTION DRIFTS & HOTSPOTS */}
                <div className="grid md:grid-cols-2 gap-24">
                    <div className="space-y-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-[9px] text-[#8A8A8A] font-bold opacity-30">
                                <span>↑ تحسن</span>
                                <span className="mx-1">/</span>
                                <span>↓ تدهور</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-[10px] font-black text-[#8A8A8A] uppercase tracking-widest opacity-60">مسار التغير (Drift)</h3>
                                <Activity className="w-3.5 h-3.5 text-[#8A8A8A] opacity-40" />
                            </div>
                        </div>
                        <div className="space-y-8">
                            {(data.evidence?.drift || []).map((d: any, i: number) => (
                                <div key={i} className="flex items-end justify-between border-b-[0.5px] border-white/[0.05] pb-5">
                                    <span className="text-[11px] font-black text-emerald-500 opacity-60">↑ {Math.round(d.drift * 100)}%</span>
                                    <div className="text-right">
                                        <p className="text-[13px] font-black text-[#FFFFFF]">{d.source}</p>
                                        <p className="text-[9px] text-[#8A8A8A] opacity-40">تأثير على {d.target}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-10">
                        <div className="flex items-center justify-end gap-3">
                            <h3 className="text-[10px] font-black text-[#8A8A8A] uppercase tracking-widest opacity-60">بؤر التذبذب</h3>
                            <Flame className="w-3.5 h-3.5 text-[#8A8A8A] opacity-40" />
                        </div>
                        <div className="space-y-8">
                            {(data.evidence?.hotspots || []).map((h: any, i: number) => (
                                <div key={i} className="flex items-end justify-between border-b-[0.5px] border-white/[0.05] pb-5">
                                    <span className="text-[11px] font-black text-amber-500 opacity-40">
                                        {Math.round(h.volatility * 100)}%
                                    </span>
                                    <div className="text-right">
                                        <p className="text-[13px] font-black text-[#FFFFFF]">{h.label}</p>
                                        <p className="text-[9px] text-[#8A8A8A] opacity-40">مستوى تذبذب مرتفع</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 4️⃣ MILESTONES: Minimal Dots */}
                {data.milestones && data.milestones.length > 0 && (
                    <section className="flex flex-col items-center pt-10">
                        <div className="flex items-center gap-16">
                            {(data.milestones || []).slice(0, 3).map((m: any, i: number) => (
                                <div key={i} className="flex flex-col items-center gap-4">
                                    <div className="w-1 h-1 rounded-full bg-amber-500 opacity-30 shadow-none" />
                                    <div className="text-center">
                                        <p className="text-[9px] font-black text-[#FFFFFF] uppercase tracking-tight opacity-80">{m.milestone_label}</p>
                                        <p className="text-[8px] text-[#8A8A8A] font-bold mt-1 opacity-30">{monthName}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 5️⃣ STORY SUMMARY */}
                <section className="py-24 border-t border-white/[0.02] flex flex-col items-center">
                    <p className="text-md font-medium text-[#D6D6D6] leading-loose italic max-w-sm text-center opacity-70">
                        "{data.story?.wave_pattern || 'نمط استقرار وتراكم هادئ'}"
                    </p>
                </section>

                {/* 6️⃣ FOOTER: Authority Signature */}
                <footer className="pt-32 pb-16 flex flex-col items-center text-center">
                    <div className="flex items-center gap-2 mb-6 text-[#8A8A8A] font-black text-[8px] uppercase tracking-[0.4em] opacity-20">
                        <span>Dawayir Document</span>
                        <div className="w-1 h-1 rounded-full bg-white/20" />
                        <span>v1.0</span>
                    </div>
                    <div className="space-y-3">
                        <p className="text-[8px] font-bold text-[#8A8A8A] opacity-40 tracking-wider">
                            Generated by Dawayir Behavioral Intelligence System
                        </p>
                        <p className="text-[8px] font-medium text-[#8A8A8A] opacity-20 capitalize">
                            Issued on {generatedAt}
                        </p>
                        <div className="flex items-center gap-1.5 text-[8px] font-bold text-[#8A8A8A] opacity-20 mt-6 justify-center">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            <span>This document expires automatically after 7 days from issuance.</span>
                        </div>
                    </div>
                </footer>
            </div>

            <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] pointer-events-none" />
        </motion.div>
    );
}
