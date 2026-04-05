'use client';

import React, { useEffect, useState } from 'react';
import {
    fetchAlertIncidents,
    resetAlertIncidents,
    updateAlertIncidentStatus,
    type AlertIncident
} from '../../../services/adminApi';
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    Settings,
    ShieldAlert,
    TrendingDown,
    ListChecks,
    RefreshCw,
    Lock,
    Unlock,
    ActivitySquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Incident = AlertIncident & {
    evidence: {
        value?: unknown;
        threshold?: unknown;
        samples?: unknown;
    } | null;
};

function toFiniteNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

function formatMetricValue(value: unknown): string {
    const numeric = toFiniteNumber(value);
    return numeric === null ? 'N/A' : numeric.toFixed(2);
}

function formatRawValue(value: unknown): string {
    if (value === null || value === undefined) return 'N/A';
    const numeric = toFiniteNumber(value);
    if (numeric !== null) return String(numeric);
    if (typeof value === 'string') return value;
    return 'N/A';
}

export default function AlertsPanel() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [resetting, setResetting] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [actionIncidentId, setActionIncidentId] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [isFrozen, setIsFrozen] = useState(false);

    useEffect(() => {
        void fetchIncidents();
    }, []);

    async function fetchIncidents() {
        setLoading(true);
        const data = await fetchAlertIncidents();
        if (data) setIncidents(data as Incident[]);
        else console.error("Error fetching incidents");
        setLoading(false);
    }

    async function updateStatus(id: string, newStatus: 'ack' | 'resolved') {
        setActionIncidentId(id);
        setFeedback(null);
        const reason = newStatus === 'ack'
            ? 'Investigating from War Room'
            : 'Resolved manually from War Room';
        const ok = await updateAlertIncidentStatus(id, newStatus, reason);
        if (ok) {
            setFeedback({
                type: 'success',
                message: newStatus === 'ack' ? 'تم استلام الإنذار بنجاح.' : 'تم تسجيل العطل كمحلول.'
            });
            void fetchIncidents();
        } else {
            setFeedback({ type: 'error', message: 'فشل في التحديث. حاول تاني.' });
        }
        setActionIncidentId(null);
    }

    async function resetAlerts() {
        setResetting(true);
        setFeedback(null);
        const ok = await resetAlertIncidents();
        if (ok) {
            setExpandedId(null);
            setFeedback({ type: 'success', message: 'تم تصفير كل الإنذارات النشطة.' });
            void fetchIncidents();
        } else {
            setFeedback({ type: 'error', message: 'فشل التصفير. راجع صلاحيات الأدمن.' });
        }
        setResetting(false);
    }

    const toggleFreeze = () => {
        setIsFrozen(!isFrozen);
        if (!isFrozen) {
            setFeedback({ type: 'error', message: 'تنبيه طوارئ: تم تفعيل كبسولة الحماية. النظام الآن في وضع العزل (Lockdown).' });
        } else {
            setFeedback({ type: 'success', message: 'تم فك العزل وعودة النظام للحالة الطبيعية.' });
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-rose-500/10 text-rose-500 border-rose-500/30 shadow-[0_0_15px_rgba(225,29,72,0.6)]';
            case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.4)]';
            case 'medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
            case 'low': return 'bg-sky-500/10 text-sky-500 border-sky-500/30';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return <ShieldAlert className="w-5 h-5 text-rose-500" />;
            case 'high': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
            case 'medium': return <TrendingDown className="w-5 h-5 text-amber-500" />;
            default: return <Settings className="w-5 h-5 text-sky-500" />;
        }
    };

    return (
        <div className={`w-full rounded-3xl overflow-hidden flex flex-col font-sans relative transition-all duration-700 ${isFrozen ? 'ring-2 ring-rose-500/50 shadow-[0_0_50px_rgba(225,29,72,0.15)] bg-[#0A0202]' : 'bg-[#02040A] border border-white/5 shadow-2xl'} min-h-[600px]`} dir="rtl">
            
            {/* Hologram Effects */}
            <div className={`absolute inset-0 pointer-events-none transition-all duration-700 ${isFrozen ? 'bg-[radial-gradient(ellipse_at_top,rgba(225,29,72,0.1),transparent_70%)]' : 'bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.05),transparent_70%)]'}`} />
            <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cyber-grid.png')] opacity-[0.03] pointer-events-none" />
            
            {/* Warning Strips (Visible when frozen) */}
            {isFrozen && (
                <div className="absolute top-0 left-0 right-0 h-1 z-50 flex" style={{ background: 'repeating-linear-gradient(45deg, #e11d48, #e11d48 10px, transparent 10px, transparent 20px)' }} />
            )}

            {/* Header */}
            <div className={`flex flex-col sm:flex-row items-center justify-between p-6 border-b z-10 relative transition-colors ${isFrozen ? 'border-rose-500/20 bg-rose-500/5' : 'border-white/5 bg-slate-900/30'}`}>
                <div className="flex items-center gap-4 mb-4 sm:mb-0 w-full sm:w-auto">
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${isFrozen ? 'bg-rose-500/20 border-rose-500/40 shadow-[0_0_20px_rgba(225,29,72,0.4)]' : 'bg-slate-800/50 border-slate-700'}`}>
                        {isFrozen ? (
                            <Lock className="w-6 h-6 text-rose-500 animate-pulse" />
                        ) : (
                            <ActivitySquare className="w-6 h-6 text-slate-300" />
                        )}
                    </div>
                    <div>
                        <h2 className={`text-xl font-black tracking-widest uppercase flex items-center gap-2 transition-colors ${isFrozen ? 'text-rose-400' : 'text-white'}`}>
                            غرفة العمليات المركزية
                        </h2>
                        <p className={`text-xs font-bold tracking-widest uppercase mt-0.5 flex items-center gap-1.5 transition-colors ${isFrozen ? 'text-rose-500/70' : 'text-slate-500'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isFrozen ? 'bg-rose-500 animate-pulse shadow-[0_0_5px_#e11d48]' : 'bg-emerald-500 shadow-[0_0_5px_#10b981]'}`} />
                            {isFrozen ? 'نظام العزل مفعل (LOCKDOWN)' : 'نظام قيادة الطوارئ'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    
                    {/* Freeze Pill Action */}
                    <button
                        onClick={toggleFreeze}
                        className={`organic-tap flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg border ${
                            isFrozen 
                            ? 'bg-rose-600 border-rose-400 text-white shadow-[0_0_20px_rgba(225,29,72,0.4)] hover:bg-rose-500' 
                            : 'bg-transparent border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/50'
                        }`}
                    >
                        {isFrozen ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        {isFrozen ? 'فك العزل' : 'تفعيل كبسولة الحماية'}
                    </button>

                    <div className="h-8 w-px bg-white/10 mx-2" />

                    <button
                        onClick={resetAlerts}
                        disabled={loading || resetting || incidents.length === 0}
                        className="organic-tap text-[10px] font-bold uppercase tracking-widest text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-lg px-4 py-2.5 hover:bg-orange-500/20 disabled:opacity-30 transition-all"
                    >
                        {resetting ? 'جاري...' : 'تصفير الإنذارات'}
                    </button>
                    
                    <button
                        onClick={fetchIncidents}
                        disabled={loading}
                        className="organic-tap p-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-all disabled:opacity-30"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Content Segment */}
            <div className="p-6 flex-1 overflow-y-auto max-h-[600px] custom-scrollbar relative z-10">
                {feedback && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
                            feedback.type === 'success'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                                : 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[0_0_15px_rgba(225,29,72,0.1)]'
                        }`}
                    >
                        {feedback.type === 'error' ? <ShieldAlert className="w-5 h-5 shrink-0" /> : <CheckCircle className="w-5 h-5 shrink-0" />}
                        <p className="text-sm font-bold tracking-wide">{feedback.message}</p>
                    </motion.div>
                )}
                
                {loading && incidents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 space-y-6">
                        <div className="relative">
                            <RefreshCw className="w-10 h-10 text-emerald-500/50 animate-spin" />
                            <div className="absolute inset-0 blur-lg bg-emerald-500/20 rounded-full" />
                        </div>
                        <p className="text-xs font-bold uppercase tracking-widest text-emerald-500/80">جاري مسح الرادار الإدراكــــي...</p>
                    </div>
                ) : incidents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-24 h-24 rounded-full bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.1)] relative">
                            <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping opacity-20" />
                            <CheckCircle className="w-10 h-10 text-emerald-500" />
                        </div>
                        <p className="font-black text-xl text-white tracking-widest uppercase mb-2">النظام آمن ومستقر</p>
                        <p className="text-sm font-medium text-emerald-500/70 tracking-wide uppercase">لم يرصد رادار السيادة أي اختراقات أو أعطال</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence>
                            {incidents.map((inc, index) => (
                                (() => {
                                    const checklistItems = Array.isArray(inc.checklist) ? inc.checklist : [];
                                    const currentValue = formatMetricValue(inc.evidence?.value);
                                    const thresholdValue = formatRawValue(inc.evidence?.threshold);
                                    const samplesValue = formatRawValue(inc.evidence?.samples);
                                    const isExpanded = expandedId === inc.id;

                                    return (
                                <motion.div
                                    key={inc.id}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
                                    className={`rounded-2xl overflow-hidden transition-all duration-300 border backdrop-blur-sm ${
                                        isExpanded 
                                        ? 'border-slate-600 bg-slate-900/80 shadow-2xl' 
                                        : 'border-slate-800/50 bg-slate-900/30 hover:border-slate-700'
                                    }`}
                                >
                                    {/* Incident Summary Row */}
                                    <div
                                        className="p-5 flex items-center justify-between cursor-pointer organic-tap relative overflow-hidden"
                                        onClick={() => setExpandedId(isExpanded ? null : inc.id)}
                                    >
                                        {isExpanded && <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/5 pointer-events-none" />}
                                        <div className="flex items-center gap-4 relative z-10 w-full">
                                            <div className={`p-3 rounded-xl border bg-[#080B13] ${getSeverityColor(inc.severity)}`}>
                                                {getSeverityIcon(inc.severity)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-3 mb-1.5">
                                                    <span className="text-base font-black tracking-wide text-white">{inc.rule_key}</span>
                                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${getSeverityColor(inc.severity)}`}>
                                                        {inc.severity === 'critical' ? 'حرج' : inc.severity === 'high' ? 'عالي' : inc.severity === 'medium' ? 'متوسط' : inc.severity === 'low' ? 'منخفض' : inc.severity}
                                                    </span>
                                                    {inc.status === 'ack' && (
                                                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400">
                                                            تحت السيطرة
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] font-bold text-slate-500 tracking-wider flex items-center gap-2">
                                                    <span className="uppercase text-slate-400">{inc.segment}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                                                    <span className="flex items-center gap-1.5 text-slate-400">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(inc.opened_at).toLocaleTimeString('ar-EG')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Playbook Details Hologram Area */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="border-t border-slate-700/50 bg-[#050814]"
                                            >
                                                <div className="p-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                                        {/* Evidence Panel */}
                                                        <div className="p-5 bg-slate-900/50 rounded-2xl border border-slate-800 shadow-inner relative overflow-hidden group">
                                                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                                                                <ActivitySquare className="w-32 h-32" />
                                                            </div>
                                                            <h4 className="text-[10px] text-teal-400 uppercase font-black tracking-widest mb-4 flex items-center gap-2">
                                                                <ListChecks className="w-3 h-3" />
                                                                دليل الإشارة الثابتة
                                                            </h4>
                                                            <div className="flex justify-between items-end relative z-10">
                                                                <div>
                                                                    <div className="text-3xl text-white font-mono font-black mb-1">
                                                                        {currentValue}
                                                                    </div>
                                                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">القراءة الحالية</div>
                                                                </div>
                                                                <div className="text-left bg-black/20 p-3 rounded-xl border border-white/5">
                                                                    <div className="text-xs text-rose-400 font-bold tracking-wide mb-1">
                                                                        الحد المحظور: {thresholdValue}
                                                                    </div>
                                                                    <div className="text-[10px] text-slate-500 font-bold tracking-wide">عينة القياس: {samplesValue}</div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* AI Diagnosis */}
                                                        <div className="p-5 bg-slate-900/50 rounded-2xl border border-slate-800 shadow-inner">
                                                            <h4 className="text-[10px] text-purple-400 uppercase font-black tracking-widest mb-3 flex items-center gap-2">
                                                                <ShieldAlert className="w-3 h-3" />
                                                                رؤية جارفيس الاستراتيجية
                                                            </h4>
                                                            <p className="text-sm text-slate-300 leading-relaxed font-medium">
                                                                {inc.action_hint || "لا تتوفر رؤية تحليلية حتى الآن. يُنصح بالتدخل البشري والتقييم اليدوي للحدث."}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Strategy Playbook */}
                                                    <div className="mb-8">
                                                        <h4 className="text-[11px] text-emerald-400 uppercase font-black tracking-widest flex items-center gap-2 mb-4">
                                                            <Settings className="w-4 h-4" />
                                                            بروتوكول التدخل (Playbook)
                                                        </h4>
                                                        {checklistItems.length > 0 ? (
                                                            <div className="space-y-3">
                                                                {checklistItems.map((item, idx) => (
                                                                    <div key={idx} className="flex items-start gap-4 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl hover:border-emerald-500/20 transition-all group">
                                                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-black shrink-0 border border-emerald-500/20 group-hover:bg-emerald-500/20">
                                                                            {item.step}
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-sm text-white font-bold mb-1">{item.title}</div>
                                                                            <div className="text-xs text-emerald-100/60 font-medium leading-relaxed">{item.details}</div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="text-xs text-slate-500 italic p-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/30 text-center font-bold tracking-widest uppercase">مفقود: بروتوكول التدخل المعياري (الرجوع للفرع الرئيسي)</div>
                                                        )}
                                                        
                                                        {inc.expected_impact && (
                                                            <div className="mt-5 inline-flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 rounded-lg bg-rose-500/5 border border-rose-500/20 text-rose-300 w-full">
                                                                <TrendingDown className="w-4 h-4 shrink-0" />
                                                                <div className="text-[11px] uppercase font-black tracking-widest shrink-0">خطر الأثر الممتد:</div>
                                                                <span className="text-sm font-bold text-white leading-relaxed">{inc.expected_impact}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Tactical Actions */}
                                                    <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-slate-700/50">
                                                        {inc.status === 'open' && (
                                                            <button
                                                                onClick={() => updateStatus(inc.id, 'ack')}
                                                                disabled={Boolean(actionIncidentId)}
                                                                className="organic-tap w-full sm:w-auto px-6 py-3 bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-sky-500 hover:text-white disabled:opacity-50 transition-all"
                                                            >
                                                                {actionIncidentId === inc.id ? 'يتم التشغيل...' : 'اعتراف والسيطرة الحية'}
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => updateStatus(inc.id, 'resolved')}
                                                            disabled={Boolean(actionIncidentId)}
                                                            className="organic-tap w-full sm:w-auto px-6 py-3 bg-emerald-500 text-slate-950 text-xs font-black uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] disabled:opacity-50 transition-all"
                                                        >
                                                            {actionIncidentId === inc.id ? 'يتم التوثيق...' : 'تأكيد احتواء الأزمة'}
                                                        </button>
                                                    </div>

                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                                    );
                                })()
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}

