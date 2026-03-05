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
    RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types
type Incident = AlertIncident & {
    evidence: any;
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

    useEffect(() => {
        void fetchIncidents();
        // Realtime subscription could be added here
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
                message: newStatus === 'ack' ? 'Incident acknowledged.' : 'Incident resolved.'
            });
            void fetchIncidents();
        } else {
            setFeedback({ type: 'error', message: 'Failed to update incident. Try again.' });
        }
        setActionIncidentId(null);
    }

    async function resetAlerts() {
        setResetting(true);
        setFeedback(null);
        const ok = await resetAlertIncidents();
        if (ok) {
            setExpandedId(null);
            setFeedback({ type: 'success', message: 'All active alerts were reset.' });
            void fetchIncidents();
        } else {
            setFeedback({ type: 'error', message: 'Reset failed. Check admin permissions.' });
        }
        setResetting(false);
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return <ShieldAlert className="w-5 h-5 text-red-500" />;
            case 'high': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
            case 'medium': return <TrendingDown className="w-5 h-5 text-yellow-500" />;
            default: return <Settings className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <div className="w-full bg-[#0d0d0d] border border-white/5 rounded-xl overflow-hidden flex flex-col font-sans" dir="rtl">

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#141414]">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/10 rounded-lg">
                        <ShieldAlert className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-white font-medium">Alert Radar (War Room)</h2>
                        <p className="text-sm text-gray-500">Active Signals & Incidents</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {incidents.length > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-sm text-red-500 font-medium">{incidents.length} Active</span>
                        </div>
                    )}
                    <button
                        onClick={resetAlerts}
                        disabled={loading || resetting || incidents.length === 0}
                        className="px-3 py-1.5 text-xs text-orange-300 bg-orange-500/10 border border-orange-500/20 rounded-lg hover:bg-orange-500/15 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                        {resetting ? 'Resetting...' : 'Reset Mock Alerts'}
                    </button>
                    <button
                        onClick={fetchIncidents}
                        disabled={loading}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 overflow-y-auto max-h-[600px] custom-scrollbar">
                {feedback && (
                    <div
                        className={`mb-4 text-xs px-3 py-2 rounded-lg border ${feedback.type === 'success'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                                : 'bg-red-500/10 border-red-500/20 text-red-300'
                            }`}
                    >
                        {feedback.message}
                    </div>
                )}
                {loading && incidents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-gray-500 space-y-4">
                        <RefreshCw className="w-6 h-6 animate-spin opacity-50" />
                        <p className="text-sm">Scanning signals...</p>
                    </div>
                ) : incidents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                        <div className="w-16 h-16 rounded-full bg-[#1A1A1A] border border-white/5 flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-green-500/50" />
                        </div>
                        <p className="font-medium text-white mb-1">Systems Normal</p>
                        <p className="text-sm">No active incidents detected by the radar.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence>
                            {incidents.map((inc) => (
                                (() => {
                                    const checklistItems = Array.isArray(inc.checklist) ? inc.checklist : [];
                                    const currentValue = formatMetricValue(inc.evidence?.value);
                                    const thresholdValue = formatRawValue(inc.evidence?.threshold);
                                    const samplesValue = formatRawValue(inc.evidence?.samples);
                                    return (
                                <motion.div
                                    key={inc.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                                    className={`border rounded-lg overflow-hidden transition-colors ${expandedId === inc.id ? 'border-white/20 bg-[#161616]' : 'border-white/5 bg-[#121212] hover:border-white/10'
                                        }`}
                                >
                                    {/* Row Summary */}
                                    <div
                                        className="p-4 flex items-center justify-between cursor-pointer"
                                        onClick={() => setExpandedId(expandedId === inc.id ? null : inc.id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            {getSeverityIcon(inc.severity)}
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-white font-medium">{inc.rule_key}</span>
                                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getSeverityColor(inc.severity)}`}>
                                                        {inc.severity}
                                                    </span>
                                                    {inc.status === 'ack' && (
                                                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded border bg-blue-500/10 border-blue-500/20 text-blue-500">
                                                            Acknowledged
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-400 flex items-center gap-2">
                                                    <span>Segment: <span className="text-gray-300">{inc.segment}</span></span>
                                                    <span className="w-1 h-1 rounded-full bg-gray-700" />
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(inc.opened_at).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Detail (Playbook) */}
                                    {expandedId === inc.id && (
                                        <div className="border-t border-white/5 p-4 bg-[#0a0a0a]">

                                            {/* Context & Signal */}
                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div className="p-3 bg-[#111] rounded-lg border border-white/5">
                                                    <h4 className="text-xs text-gray-500 uppercase font-bold mb-2">Signal Evidence</h4>
                                                    <div className="flex justify-between items-end">
                                                        <div>
                                                            <div className="text-2xl text-white font-medium">
                                                                {currentValue}
                                                            </div>
                                                            <div className="text-xs text-gray-500">Current Value</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-sm text-red-400 font-medium">
                                                                Threshold: {thresholdValue}
                                                            </div>
                                                            <div className="text-xs text-gray-500">Samples: {samplesValue}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-3 bg-[#111] rounded-lg border border-white/5">
                                                    <h4 className="text-xs text-gray-500 uppercase font-bold mb-2">AI Summary</h4>
                                                    <p className="text-sm text-gray-300 leading-relaxed">
                                                        {inc.action_hint || "No specific hint provided."}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Playbook */}
                                            <div className="mb-6">
                                                <h4 className="text-sm text-white font-medium flex items-center gap-2 mb-3">
                                                    <ListChecks className="w-4 h-4 text-emerald-500" />
                                                    Recommended Playbook
                                                </h4>
                                                {checklistItems.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {checklistItems.map((item, idx) => (
                                                            <div key={idx} className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-lg hover:border-white/10 transition">
                                                                <div className="w-6 h-6 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xs font-bold shrink-0">
                                                                    {item.step}
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm text-white font-medium mb-1">{item.title}</div>
                                                                    <div className="text-xs text-gray-400">{item.details}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-gray-500 italic">No specific playbook defined for this rule.</div>
                                                )}
                                                {inc.expected_impact && (
                                                    <div className="mt-4 text-xs inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                                        <TrendingDown className="w-3 h-3" />
                                                        Expected Impact: <span className="font-bold">{inc.expected_impact}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                                                {inc.status === 'open' && (
                                                    <button
                                                        onClick={() => updateStatus(inc.id, 'ack')}
                                                        disabled={Boolean(actionIncidentId)}
                                                        className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed transition"
                                                    >
                                                        {actionIncidentId === inc.id ? 'Updating...' : 'Acknowledge (Investigating)'}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => updateStatus(inc.id, 'resolved')}
                                                    disabled={Boolean(actionIncidentId)}
                                                    className="px-4 py-2 bg-[#222] hover:bg-[#333] text-white text-sm font-medium rounded-lg border border-white/10 disabled:opacity-60 disabled:cursor-not-allowed transition"
                                                >
                                                    {actionIncidentId === inc.id ? 'Updating...' : 'Mark as Resolved'}
                                                </button>
                                            </div>

                                        </div>
                                    )}
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
