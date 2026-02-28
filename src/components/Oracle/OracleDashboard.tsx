import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle, AlertTriangle, Eye, TrendingUp, Users, ChevronRight, Gavel } from 'lucide-react';
import { HiveEngine, ProvenPath, SwarmMetrics } from '../../services/hiveEngine';
import { CollectiveRadar } from '../Trajectory/CollectiveRadar';
import { FirstBloodOverlay } from './FirstBloodOverlay';

export const OracleCouncilDashboard: React.FC<{ oracleId: string }> = ({ oracleId }) => {
    const [pending, setPending] = useState<ProvenPath[]>([]);
    const [metrics, setMetrics] = useState<SwarmMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPath, setSelectedPath] = useState<ProvenPath | null>(null);
    const [showFirstBlood, setShowFirstBlood] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            const [pData, mData] = await Promise.all([
                HiveEngine.getPendingTrajectories(),
                HiveEngine.getSwarmMetrics()
            ]);
            setPending(pData);
            setMetrics(mData);

            // Check if this is the first session (Audit Count = 0)
            const { data: rep } = await HiveEngine.getOracleReputation(oracleId);
            if (!rep || (rep.audit_count === 0)) {
                setShowFirstBlood(true);
            }

            setLoading(false);
        };
        loadData();
    }, []);

    const handleApprove = async (id: string) => {
        const success = await HiveEngine.approveTrajectory(id, oracleId);
        if (success) {
            setPending(prev => prev.filter(p => p.id !== id));
            setSelectedPath(null);
        }
    };

    const handleFlag = async (id: string, reason: string) => {
        const success = await HiveEngine.flagTrajectory(id, oracleId, reason);
        if (success) {
            setPending(prev => prev.filter(p => p.id !== id));
            setSelectedPath(null);
        }
    };

    if (loading) return <div className="p-12 text-center text-cyan-400">Loading Governance Core...</div>;

    if (showFirstBlood) {
        return <FirstBloodOverlay oracleId={oracleId} onComplete={() => setShowFirstBlood(false)} />;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-950 min-h-screen text-slate-100 font-sans">
            {/* Header: Command Status */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-8 bg-indigo-900/20 rounded-[2.5rem] border border-indigo-500/30 backdrop-blur-3xl shadow-2xl">
                <div>
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-400 flex items-center">
                        <Shield className="mr-4 w-10 h-10 text-cyan-400" />
                        Oracle Council Dashboard
                    </h1>
                    <p className="mt-2 text-slate-400 uppercase tracking-widest text-xs font-bold">
                        Swarm Governance Protocol v1.1.3
                    </p>
                </div>
                {metrics && (
                    <div className="flex gap-8">
                        <div className="text-center">
                            <span className="block text-[10px] text-slate-500 uppercase font-black mb-1">Resonance Factor</span>
                            <span className="text-2xl font-black text-emerald-400">{metrics.swarm_momentum.toFixed(2)}x</span>
                        </div>
                        <div className="text-center">
                            <span className="block text-[10px] text-slate-500 uppercase font-black mb-1">Active Sovereigns</span>
                            <span className="text-2xl font-black text-white">{metrics.active_sovereigns}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Pending Audit Queue */}
                <div className="lg:col-span-5 space-y-4">
                    <h3 className="flex items-center text-sm font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">
                        <Gavel className="mr-2 w-4 h-4" />
                        Audit Queue ({pending.length})
                    </h3>
                    <AnimatePresence mode="popLayout">
                        {pending.map((path) => (
                            <motion.div
                                key={path.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                onClick={() => setSelectedPath(path)}
                                className={`p-6 cursor-pointer rounded-3xl border transition-all duration-300 ${selectedPath?.id === path.id
                                    ? 'bg-indigo-600/20 border-indigo-400 shadow-indigo-500/20'
                                    : 'bg-slate-900/40 border-white/5 hover:border-white/10'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-lg font-bold text-white">{path.title}</h4>
                                    <div className="flex flex-col items-end">
                                        <ChevronRight className={`w-5 h-5 transition-transform ${selectedPath?.id === path.id ? 'rotate-90' : ''}`} />
                                        <span className="text-[8px] font-black text-indigo-400 mt-1">
                                            {path.approved_by_ids?.length || 0}/2 Approvals
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {path.tags?.map(tag => (
                                        <span key={tag} className="text-[9px] font-black px-2 py-0.5 bg-white/5 rounded-md text-slate-400 uppercase">{tag}</span>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Right Column: Path Visualizer & Gavel */}
                <div className="lg:col-span-7">
                    {selectedPath ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-8 bg-slate-900/60 rounded-[3rem] border border-white/10 backdrop-blur-xl space-y-8"
                        >
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-black text-white">Reviewing: {selectedPath.title}</h2>
                                <div className="flex gap-2">
                                    {selectedPath.approved_by_ids?.includes(oracleId) && (
                                        <span className="px-3 py-1 bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 rounded-full text-[8px] font-black uppercase">
                                            Your Approval Logged
                                        </span>
                                    )}
                                    <span className="px-4 py-1 bg-amber-400/10 border border-amber-400/30 text-amber-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                                        Consensus: {selectedPath.approved_by_ids?.length || 0}/2
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Vector Profile</h5>
                                    {metrics && <CollectiveRadar userVector={selectedPath.initial_vector} swarmMetrics={metrics} title="Trajectory DNA" />}
                                </div>
                                <div className="space-y-4">
                                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Mission Payload</h5>
                                    <div className="p-6 bg-slate-950/40 rounded-3xl border border-white/5 space-y-4 min-h-[200px] max-h-[300px] overflow-y-auto">
                                        {selectedPath.mission_data?.daily_missions?.map((m: any) => (
                                            <div key={m.day} className="p-4 bg-white/5 rounded-2xl">
                                                <span className="text-[8px] font-black text-indigo-500 uppercase">Day {m.day}</span>
                                                <p className="text-xs text-slate-300 mt-1">{m.actionable_task}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => handleApprove(selectedPath.id)}
                                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase transition-all shadow-lg shadow-emerald-500/20"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    {selectedPath.approved_by_ids?.length === 0 ? "Genesis Approve" : "Add Consensus"}
                                </button>
                                <button
                                    onClick={() => handleFlag(selectedPath.id, "Quality Control Rejection")}
                                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-red-600/20 hover:bg-red-600/30 text-red-500 border border-red-500/30 rounded-2xl font-black text-xs uppercase transition-all"
                                >
                                    <AlertTriangle className="w-4 h-4" />
                                    Flag as Noise
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-12 bg-slate-900/20 rounded-[3rem] border border-dashed border-white/10 text-slate-600">
                            <Eye className="w-16 h-16 mb-4 opacity-20" />
                            <p className="font-bold text-center">Select a pending trajectory from the queue<br />to begin the Sovereignty Audit.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
