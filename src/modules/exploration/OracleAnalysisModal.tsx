"use client";

import { FC, useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, BrainCircuit, AlertTriangle, Lightbulb, Zap, Crosshair } from "lucide-react";
import { OracleService, type OracleMapAnalysis } from "@/services/oracleService";

interface OracleAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodes: any[];
    resonance: any;
}

export const OracleAnalysisModal: FC<OracleAnalysisModalProps> = ({
    isOpen,
    onClose,
    nodes,
    resonance
}) => {
    const [analysis, setAnalysis] = useState<OracleMapAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hasFetched = useRef(false);

    useEffect(() => {
        let isMounted = true;
        if (isOpen && !analysis && !hasFetched.current) {
            hasFetched.current = true;
            setIsLoading(true);
            setError(null);
            
            OracleService.analyzeMapState(nodes, resonance)
                .then(result => {
                    if (isMounted) {
                        if (result) {
                            setAnalysis(result);
                        } else {
                            setError("فشل الاتصال بالأوراكل. حاول مرة أخرى.");
                        }
                        setIsLoading(false);
                    }
                })
                .catch(err => {
                    if (isMounted) {
                        setError("حدث خطأ غير متوقع أثناء التحليل.");
                        setIsLoading(false);
                    }
                });
        }
        
        if (!isOpen) {
            hasFetched.current = false;
        }

        return () => {
            isMounted = false;
        };
    }, [isOpen, nodes, resonance, analysis]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" dir="rtl">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                    onClick={onClose}
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-[2rem] overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-800/50 bg-slate-900/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                                <BrainCircuit className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-white">التحليل الذكي (Oracle)</h2>
                                <p className="text-xs text-amber-500/70 font-bold">تحليل مبني على المبادئ الأولى للخريطة</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-6">
                                <div className="relative">
                                    <div className="absolute inset-0 blur-2xl bg-amber-500/20 rounded-full animate-pulse" />
                                    <Sparkles className="w-12 h-12 text-amber-400 animate-bounce" />
                                </div>
                                <div className="space-y-2 text-center">
                                    <h3 className="text-lg font-bold text-white">الأوراكل يقرأ خريطتك...</h3>
                                    <p className="text-sm text-slate-400">بنحلل مسارات الطاقة والعقد النفسية بناءً على المحور الرأسي</p>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                <AlertTriangle className="w-12 h-12 text-rose-500" />
                                <p className="text-rose-400 font-bold">{error}</p>
                                <button 
                                    onClick={() => { setAnalysis(null); setIsLoading(false); }}
                                    className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors text-sm font-bold mt-4"
                                >
                                    إعادة المحاولة
                                </button>
                            </div>
                        ) : analysis ? (
                            <div className="space-y-8 pb-8">
                                {/* Summary */}
                                <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Sparkles className="w-24 h-24" />
                                    </div>
                                    <h3 className="text-sm font-black text-amber-400 mb-2 flex items-center gap-2">
                                        <Zap className="w-4 h-4" /> خلاصة الخريطة
                                    </h3>
                                    <p className="text-slate-300 leading-relaxed font-tajawal relative z-10">{analysis.summary}</p>
                                </div>

                                {/* Structural Flaw & Truth */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="p-5 rounded-2xl bg-slate-800/50 border border-rose-500/20">
                                        <h3 className="text-xs font-black text-rose-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4" /> الخلل الهيكلي الأكبر
                                        </h3>
                                        <p className="text-sm text-slate-300 leading-relaxed">{analysis.structuralFlaw}</p>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-slate-800/50 border border-teal-500/20">
                                        <h3 className="text-xs font-black text-teal-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                                            <Lightbulb className="w-4 h-4" /> حقيقة كاشفة
                                        </h3>
                                        <p className="text-sm text-slate-300 leading-relaxed">{analysis.cognitiveTruth}</p>
                                    </div>
                                </div>

                                {/* Vampires */}
                                {analysis.vampires && analysis.vampires.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-black text-white flex items-center gap-2">
                                            <Crosshair className="w-4 h-4 text-rose-500" /> مصادر استنزاف الطاقة
                                        </h3>
                                        <div className="space-y-3">
                                            {analysis.vampires.map((vamp, idx) => (
                                                <div key={idx} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                                                        <span className="font-bold text-white text-sm">{vamp.name}</span>
                                                    </div>
                                                    <p className="text-xs text-rose-400/80 mb-2">{vamp.reason}</p>
                                                    <div className="px-3 py-2 bg-rose-500/10 rounded-lg border border-rose-500/20">
                                                        <p className="text-[11px] text-rose-300 font-bold"><span className="text-rose-500">الإجراء:</span> {vamp.action}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Opportunities */}
                                {analysis.opportunities && analysis.opportunities.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-black text-white flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-teal-500" /> الفرص والدعم
                                        </h3>
                                        <div className="space-y-3">
                                            {analysis.opportunities.map((opp, idx) => (
                                                <div key={idx} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="w-2 h-2 rounded-full bg-teal-500" />
                                                        <span className="font-bold text-white text-sm">{opp.name}</span>
                                                    </div>
                                                    <p className="text-xs text-teal-400/80 mb-2">{opp.reason}</p>
                                                    <div className="px-3 py-2 bg-teal-500/10 rounded-lg border border-teal-500/20">
                                                        <p className="text-[11px] text-teal-300 font-bold"><span className="text-teal-500">الإجراء:</span> {opp.action}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
