import React, { useState } from 'react';
import { Terminal, RefreshCcw, ArrowRight, ShieldAlert, Zap, Cpu } from 'lucide-react';
import { orchestrator, OrchestrationResult } from '../../../../ai/orchestrator/Core';
import { AdminTooltip } from '../Overview/components/AdminTooltip';
import { SystemSnapshot } from '../../../../ai/orchestrator/types';
import { motion, AnimatePresence } from 'framer-motion';

export const AISimulatorPanel: React.FC = () => {
    const [result, setResult] = useState<OrchestrationResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [msg, ...prev].slice(0, 10));

    const runTest = async (type: 'contradiction' | 'poisoning' | 'cascade') => {
        setIsLoading(true);
        setLogs([]);

        if (type === 'cascade') {
            addLog("🚀 [CASCADE_OVERLOAD] Simulating 5 rapid-fire crises...");

            const snapshots: SystemSnapshot[] = [
                { nodesCount: 1, unlockedMedals: 0, dailyJournalCount: 0, lastMoodScore: 5, teiScore: 50, activeRecoverySteps: 0 }, // Severity 9
                { nodesCount: 2, unlockedMedals: 1, dailyJournalCount: 1, lastMoodScore: 8, teiScore: 40, activeRecoverySteps: 0 },
                { nodesCount: 5, unlockedMedals: 2, dailyJournalCount: 5, lastMoodScore: 50, teiScore: 95, activeRecoverySteps: 0 },
                { nodesCount: 12, unlockedMedals: 3, dailyJournalCount: 10, lastMoodScore: 50, teiScore: 50, activeRecoverySteps: 0 },
                { nodesCount: 0, unlockedMedals: 0, dailyJournalCount: 0, lastMoodScore: 2, teiScore: 10, activeRecoverySteps: 0 },
            ];

            // Trigger all concurrently
            const promises = snapshots.map((s, i) =>
                orchestrator.orchestrate(s).then((res: OrchestrationResult) => {
                    addLog(`Call #${i + 1}: Trajectory: ${res.trajectory} -> Status: ${res.status}`);
                    return res;
                })
            );

            const results = await Promise.all(promises);
            setResult(results[0]); // Show first result details

        } else {
            let snapshot: SystemSnapshot;
            if (type === 'contradiction') {
                snapshot = { nodesCount: 10, unlockedMedals: 2, dailyJournalCount: 15, lastMoodScore: 15, teiScore: 92, activeRecoverySteps: 5 };
            } else {
                snapshot = { nodesCount: 5, unlockedMedals: 1, dailyJournalCount: 2, lastMoodScore: 90, teiScore: 12, activeRecoverySteps: 0 };
            }

            const res = await orchestrator.orchestrate(snapshot);
            addLog(`[SYSTEM] Trajectory: ${res.trajectory} | Status: ${res.status}`);
            setResult(res);
        }

        setIsLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button onClick={() => runTest('contradiction')} className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all text-right group">
                    <div className="flex items-center justify-between mb-2"><ShieldAlert className="w-6 h-6 text-rose-400" /><span className="text-[10px] font-black text-rose-500/50 uppercase tracking-widest">Scenario A</span></div>
                    <div className="flex items-center gap-2 justify-end">
                        <AdminTooltip content="يختبر النظام عند إدخال المستخدم لبيانات مزاج عالية جداً لكن مؤشر الأداء (TEI) الخاص به متدهور، ليرى كيف سيوازن جارفيس بينهما." position="top" />
                        <h3 className="text-lg font-bold text-rose-100">اختبار التناقض المعرفي</h3>
                    </div>
                    <p className="text-xs text-rose-400/70 mt-1">حقن بيانات متضاربة بين المزاج والأداء</p>
                </button>

                <button onClick={() => runTest('poisoning')} className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all text-right group">
                    <div className="flex items-center justify-between mb-2"><Zap className="w-6 h-6 text-amber-400" /><span className="text-[10px] font-black text-amber-500/50 uppercase tracking-widest">Scenario B</span></div>
                    <div className="flex items-center gap-2 justify-end">
                        <AdminTooltip content="محاكاة لسيناريو يقوم فيه وكيل ذكاء اصطناعي آخر بإعطاء إشارات خاطئة لنرى هل سيرصد جارفيس التسمم أم لا." position="top" />
                        <h3 className="text-lg font-bold text-amber-100">تسمم التغذية الراجعة</h3>
                    </div>
                    <p className="text-xs text-amber-400/70 mt-1">محاكاة بوت يعطي إشارات إيجابية مضللة</p>
                </button>

                <button onClick={() => runTest('cascade')} className="p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all text-right group">
                    <div className="flex items-center justify-between mb-2"><Cpu className="w-6 h-6 text-indigo-400" /><span className="text-[10px] font-black text-indigo-500/50 uppercase tracking-widest">Scenario C</span></div>
                    <div className="flex items-center gap-2 justify-end">
                        <AdminTooltip content="ضرب النظام بـ 5 أزمات نفسية في نفس اللحظة لاختبار نظام الطواريء (Concurrency) وترتيب الأولويات." position="top" />
                        <h3 className="text-lg font-bold text-indigo-100">اختناق البروتوكولات</h3>
                    </div>
                    <p className="text-xs text-indigo-400/70 mt-1">اختبار الـ Concurrency وإدارة الطوارئ</p>
                </button>

                <button
                    onClick={() => { orchestrator.activateSanctuary(); runTest('contradiction'); }}
                    className="p-6 rounded-2xl bg-slate-800/50 border border-white/10 hover:bg-slate-700 transition-all text-right group"
                >
                    <div className="flex items-center justify-between mb-2"><ShieldAlert className="w-6 h-6 text-slate-400" /><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Action</span></div>
                    <div className="flex items-center gap-2 justify-end">
                        <AdminTooltip content="إغلاق فوري لكل تدخلات الذكاء الاصطناعي وإلغاء صلاحياته كإجراء طوارئ أمني كلي." position="top" />
                        <h3 className="text-lg font-bold text-white">تفعيل وضع السكون (Kill Switch)</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">اختبار العقوبة الكبرى للأوزان (Penalty)</p>
                </button>

                <button
                    onClick={() => { orchestrator.exitSanctuary(); runTest('contradiction'); }}
                    className="p-6 rounded-2xl bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/20 transition-all text-right group"
                >
                    <div className="flex items-center justify-between mb-2"><RefreshCcw className="w-6 h-6 text-teal-400" /><span className="text-[10px] font-black text-teal-500 uppercase tracking-widest">Global Action</span></div>
                    <div className="flex items-center gap-2 justify-end">
                        <AdminTooltip content="إعادة الذكاء الاصطناعي لحالة المراقبة والعمل الطبيعية." position="top" />
                        <h3 className="text-lg font-bold text-teal-100">إيقاف وضع السكون</h3>
                    </div>
                    <p className="text-xs text-teal-400/70 mt-1">العودة لوضع المراقبة والتحسس</p>
                </button>
            </div>

            <AnimatePresence>
                {logs.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-[#0c0d1b] border border-white/5 p-5 rounded-3xl font-mono text-[11px] text-teal-500/90 space-y-2 shadow-2xl overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                            <span className="text-slate-500 font-black tracking-widest uppercase">Console: Real-time Signal Processing</span>
                            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shadow-[0_0_8px_teal]" />
                        </div>
                        {logs.map((log, i) => (
                            <p key={i} className="flex gap-3">
                                <span className="text-slate-700">[{new Date().toLocaleTimeString()}]</span>
                                <span className={log.includes('executed') ? 'text-teal-400' : 'text-amber-500'}>{`$ ${log}`}</span>
                            </p>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                    >
                        {/* Snapshot & Confidence */}
                        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-3xl">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <Terminal className="w-5 h-5 text-teal-400" />
                                    <h3 className="font-bold uppercase tracking-tight text-white">Execution Result</h3>
                                </div>
                                <div className="flex gap-2">
                                    <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${result.status === 'executed' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' :
                                        result.status === 'locked' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                            result.status === 'cooldown' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                                'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                        }`}>
                                        {result.status}
                                    </div>
                                    <div className="px-4 py-1 rounded-full bg-teal-500/10 border border-teal-500/20">
                                        <span className="text-xs font-black text-teal-400 italic">Confidence: {result.confidence}%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5">
                                    <span className="text-xs text-slate-500 uppercase font-black">Trajectory</span>
                                    <span className="text-sm font-bold text-rose-400">{result.trajectory}</span>
                                </div>
                                <div className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5">
                                    <span className="text-xs text-slate-500 uppercase font-black">Active Protocol</span>
                                    <span className="text-sm font-bold text-white">{result.protocol?.name || "NONE (Passive Standby)"}</span>
                                </div>
                            </div>

                            <div className="mt-8">
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Initial Snapshot</p>
                                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                    <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5">
                                        <p className="text-slate-500 mb-1">Mood</p>
                                        <p className="font-bold text-white">{result.snapshot.lastMoodScore}</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5">
                                        <p className="text-slate-500 mb-1">TEI</p>
                                        <p className="font-bold text-white">{result.snapshot.teiScore}</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5">
                                        <p className="text-slate-500 mb-1">Nodes</p>
                                        <p className="font-bold text-white">{result.snapshot.nodesCount}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Neural Weights & Delta */}
                        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-3xl">
                            <div className="flex items-center gap-3 mb-8">
                                <RefreshCcw className="w-5 h-5 text-indigo-400" />
                                <h3 className="font-bold uppercase tracking-tight text-white">Weight Distribution (Δ)</h3>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-black mb-1">
                                        <span className="text-slate-500 uppercase">Mood Sensor (Explicit)</span>
                                        <span className="text-white">{(result.weights.mood * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${result.weights.mood * 100}%` }}
                                            className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-black mb-1">
                                        <span className="text-slate-500 uppercase">TEI Performance (Implicit)</span>
                                        <span className="text-white">{(result.weights.tei * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${result.weights.tei * 100}%` }}
                                            className="h-full bg-teal-500 shadow-[0_0_10px_rgba(45,212,191,0.5)]"
                                        />
                                    </div>
                                </div>

                                <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 mt-10">
                                    <div className="flex items-center gap-3 mb-2">
                                        <ArrowRight className="w-4 h-4 text-indigo-400" />
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Adjustment Recommendation</p>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed italic">
                                        {result.status === 'locked' ? 'Concurrency detected. State Mutex (Lock) preserved system stability.' :
                                            result.status === 'cooldown' ? 'Cooldown period active. UX saturation prevented.' :
                                                'Based on history analysis, neural sensors are synchronized. No Δ adjustment required for this cycle.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {isLoading && (
                <div className="flex items-center justify-center p-20">
                    <RefreshCcw className="w-8 h-8 text-teal-400 animate-spin" />
                </div>
            )}
        </div>
    );
};
