import { logger } from "@/services/logger";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle, AlertTriangle, Eye, TrendingUp, Users, ChevronRight, Gavel, Zap, Activity, BarChart3, Globe, Database, UserPlus, Clock, Brain } from 'lucide-react';
import { HiveEngine, ProvenPath, SwarmMetrics } from '@/services/hiveEngine';
import { fetchUsers, AdminUserRow, fetchOverviewStats, OverviewStats } from '@/services/adminApi';
import { CollectiveRadar } from '@/modules/exploration/Trajectory/CollectiveRadar';
import { FirstBloodOverlay } from './FirstBloodOverlay';
import { BehavioralRadar } from './BehavioralRadar';

export const OracleCouncilDashboard: React.FC<{ oracleId: string }> = ({ oracleId }) => {
    const [pending, setPending] = useState<ProvenPath[]>([]);
    const [metrics, setMetrics] = useState<SwarmMetrics | null>(null);
    const [users, setUsers] = useState<AdminUserRow[]>([]);
    const [stats, setStats] = useState<OverviewStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPath, setSelectedPath] = useState<ProvenPath | null>(null);
    const [showFirstBlood, setShowFirstBlood] = useState(false);
    const [activeTab, setActiveTab] = useState<'audit' | 'sovereigns' | 'vitals' | 'radar'>('audit');

    useEffect(() => {
        const loadData = async () => {
            try {
                const [pData, mData, uData, sData] = await Promise.all([
                    HiveEngine.getPendingTrajectories(),
                    HiveEngine.getSwarmMetrics(),
                    fetchUsers(),
                    fetchOverviewStats()
                ]);
                setPending(pData);
                setMetrics(mData);
                if (uData) setUsers(uData);
                if (sData) setStats(sData);

                // Check if this is the first session (Audit Count = 0)
                const { data: rep } = await HiveEngine.getOracleReputation(oracleId);
                if (!rep || (rep.audit_count === 0)) {
                    setShowFirstBlood(true);
                }
            } catch (err) {
                logger.error("Oracle Dashboard load error:", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [oracleId]);

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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-8 bg-[var(--soft-teal)]/20 rounded-[2.5rem] border border-[var(--soft-teal)] backdrop-blur-3xl shadow-2xl">
                <div>
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-[var(--soft-teal)] flex items-center">
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

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-4 p-2 bg-slate-900/60 rounded-[2rem] border border-white/5 w-fit backdrop-blur-md shadow-inner">
                <button
                    onClick={() => setActiveTab('audit')}
                    className={`px-8 py-3 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all duration-500 ${activeTab === 'audit' ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-500 hover:text-white'}`}
                >
                    <Gavel className="w-4 h-4" />
                    Audit Queue
                </button>
                <button
                    onClick={() => setActiveTab('sovereigns')}
                    className={`px-8 py-3 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all duration-500 ${activeTab === 'sovereigns' ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-white'}`}
                >
                    <Activity className="w-4 h-4" />
                    Sovereign Watch
                </button>
                <button
                    onClick={() => setActiveTab('vitals')}
                    className={`px-8 py-3 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all duration-500 ${activeTab === 'vitals' ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-lg shadow-purple-500/20' : 'text-slate-500 hover:text-white'}`}
                >
                    <BarChart3 className="w-4 h-4" />
                    System Vitals
                </button>
                <button
                    onClick={() => setActiveTab('radar')}
                    className={`px-8 py-3 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all duration-500 ${activeTab === 'radar' ? 'bg-gradient-to-r from-orange-600 to-amber-700 text-white shadow-lg shadow-orange-500/20' : 'text-slate-500 hover:text-white'}`}
                >
                    <Zap className="w-4 h-4" />
                    Behavioral Radar
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'audit' && (
                    <motion.div
                        key="audit"
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: -10 }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                    >
                        {/* Left Column: Pending Audit Queue */}
                        <div className="lg:col-span-5 space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="flex items-center text-sm font-black text-cyan-400 uppercase tracking-[0.2em]">
                                    <Gavel className="mr-2 w-4 h-4" />
                                    Audit Queue ({pending.length})
                                </h3>
                                <span className="text-[10px] text-slate-500 font-bold uppercase py-1 px-3 bg-white/5 rounded-full border border-white/10">Priority: High</span>
                            </div>
                            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-3 custom-scrollbar">
                                {pending.map((path) => (
                                    <motion.div
                                        key={path.id}
                                        layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        onClick={() => setSelectedPath(path)}
                                        className={`p-6 cursor-pointer rounded-[2rem] border transition-all duration-500 ${selectedPath?.id === path.id
                                            ? 'bg-gradient-to-br from-cyan-900/40 to-slate-900/60 border-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.15)]'
                                            : 'bg-slate-900/20 border-white/5 hover:border-white/20'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="text-lg font-bold text-white leading-tight">{path.title}</h4>
                                            <ChevronRight className={`w-5 h-5 transition-transform duration-500 ${selectedPath?.id === path.id ? 'rotate-90 text-cyan-400' : 'text-slate-600'}`} />
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {path.tags?.map(tag => (
                                                <span key={tag} className="text-[9px] font-black px-3 py-1 bg-cyan-400/5 border border-cyan-400/10 rounded-full text-cyan-400 uppercase tracking-tighter">{tag}</span>
                                            ))}
                                            <span className="ml-auto text-[8px] font-black text-slate-500 uppercase tracking-[0.1em]">
                                                {path.approved_by_ids?.length || 0}/2 Approvals
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Right Column: Path Visualizer & Gavel */}
                        <div className="lg:col-span-7">
                            {selectedPath ? (
                                <div className="p-8 bg-slate-900/40 rounded-[3.5rem] border border-white/10 backdrop-blur-2xl space-y-10 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[100px] -mr-32 -mt-32" />
                                    <div className="relative z-10 flex justify-between items-center">
                                        <div>
                                            <h2 className="text-3xl font-black text-white tracking-tighter">Reviewing Profile</h2>
                                            <p className="text-sm text-cyan-400/80 font-medium uppercase tracking-widest mt-1">{selectedPath.title}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="px-5 py-2 bg-slate-950/80 border border-white/10 rounded-2xl flex flex-col items-end">
                                                <span className="text-[8px] text-slate-500 font-black uppercase">Consensus Status</span>
                                                <span className="text-xs font-black text-amber-400">{selectedPath.approved_by_ids?.length || 0}/2</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-4">
                                            <h5 className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5 pb-3">
                                                <Globe className="w-3 h-3" /> Trajectory DNA
                                            </h5>
                                            <div className="p-4 bg-slate-950/40 rounded-[2.5rem] border border-white/5">
                                                {metrics && <CollectiveRadar userVector={selectedPath.initial_vector} swarmMetrics={metrics} title="" />}
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <h5 className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5 pb-3">
                                                <Database className="w-3 h-3" /> Mission Payload
                                            </h5>
                                            <div className="p-6 bg-slate-950/40 rounded-[2.5rem] border border-white/5 space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar">
                                                {selectedPath.mission_data?.daily_missions?.map((m: { day: number; actionable_task: string }) => (
                                                    <div key={m.day} className="p-5 bg-white/5 border border-white/5 rounded-3xl group/item hover:border-cyan-500/30 transition-all duration-300">
                                                        <div className="flex justify-between mb-2">
                                                            <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">Day {m.day}</span>
                                                            <Zap className="w-3 h-3 text-cyan-400 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                                        </div>
                                                        <p className="text-xs leading-relaxed text-slate-300 font-medium">{m.actionable_task}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-6">
                                        <button
                                            onClick={() => handleApprove(selectedPath.id)}
                                            className="flex-[2] flex items-center justify-center gap-3 py-5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-3xl font-black text-sm uppercase transition-all duration-500 shadow-xl shadow-emerald-900/20 active:scale-95 group/btn"
                                        >
                                            <CheckCircle className="w-5 h-5 group-hover/btn:scale-125 transition-transform" />
                                            Genesis Endorsement
                                        </button>
                                        <button
                                            onClick={() => handleFlag(selectedPath.id, "Quality Control Rejection")}
                                            className="flex-1 flex items-center justify-center gap-3 py-5 bg-slate-950 border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-3xl font-black text-[10px] uppercase transition-all duration-500 group/btn"
                                        >
                                            <AlertTriangle className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
                                            Flag Noise
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-20 bg-slate-950/40 rounded-[4rem] border-2 border-dashed border-white/5 text-slate-600">
                                    <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                        <Eye className="w-10 h-10 opacity-20" />
                                    </div>
                                    <p className="font-black uppercase tracking-[0.2em] text-[10px] text-center max-w-xs leading-loose">
                                        Select a pending trajectory from the queue<br />
                                        <span className="text-slate-700">Audit Protocol Initiation Pending...</span>
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'sovereigns' && (
                    <motion.div
                        key="sovereigns"
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: -10 }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        className="space-y-8"
                    >
                        <div className="flex justify-between items-center">
                            <h3 className="flex items-center text-sm font-black text-emerald-400 uppercase tracking-[0.2em]">
                                <Users className="mr-3 w-5 h-5" />
                                Active Sovereigns ({users.length})
                            </h3>
                            <button onClick={() => window.location.reload()} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-emerald-400">
                                <Activity className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {users.map((user) => (
                                <motion.div
                                    key={user.id}
                                    whileHover={{ y: -5 }}
                                    className="p-8 bg-slate-900/40 rounded-[2.5rem] border border-white/5 hover:border-emerald-500/30 transition-all duration-500 group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-emerald-500/10 transition-colors" />
                                    <div className="relative z-10 space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                                                <UserPlus className="w-5 h-5 text-emerald-400" />
                                            </div>
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.05)]' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]'}`}>
                                                {user.role}
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-white group-hover:text-emerald-400 transition-colors tracking-tight">{user.fullName}</h4>
                                            <p className="text-[11px] text-slate-500 font-mono italic mt-1 truncate">{user.email}</p>
                                        </div>
                                        <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Resonance</span>
                                                <span className="text-xs font-black text-emerald-400 mt-1">Prime Active</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Temporal</span>
                                                <span className="text-[10px] font-bold text-slate-300 mt-1 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-EG') : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'vitals' && (
                    <motion.div
                        key="vitals"
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: -10 }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        className="space-y-10"
                    >
                        <h3 className="flex items-center text-sm font-black text-purple-400 uppercase tracking-[0.2em]">
                            <BarChart3 className="mr-3 w-5 h-5" />
                            Swarm Reality Pulse
                        </h3>

                        {stats && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                {[
                                    { label: 'Total Sovereigns', value: stats.totalUsers?.toLocaleString() || '0', icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
                                    { label: 'Neural Activity', value: stats.activeNow?.toLocaleString() || '0', icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                                    { label: 'Avg Swarm Energy', value: stats.avgMood?.toFixed(1) || '', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
                                    { label: 'AI Cognitive Load', value: (stats.aiTokensUsed || 0) > 1000 ? `${((stats.aiTokensUsed || 0) / 1000).toFixed(1)}k` : stats.aiTokensUsed || '0', icon: Brain, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
                                ].map((item, i) => (
                                    <motion.div
                                        key={item.label}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className={`p-10 ${item.bg} rounded-[3rem] border ${item.border} backdrop-blur-xl relative overflow-hidden group`}
                                    >
                                        <item.icon className={`absolute -bottom-6 -right-6 w-32 h-32 ${item.color} opacity-5 group-hover:opacity-10 transition-all duration-700 group-hover:scale-110`} />
                                        <div className="relative z-10">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">{item.label}</p>
                                            <p className={`text-5xl font-black ${item.color} tracking-tighter`}>{item.value}</p>
                                            <div className="mt-6 flex items-center gap-2">
                                                <TrendingUp className={`w-4 h-4 ${item.color}`} />
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Real-time Stream</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
                            <div className="lg:col-span-8 p-10 bg-slate-900/40 rounded-[4rem] border border-white/5 backdrop-blur-3xl relative group overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
                                <div className="flex justify-between items-center mb-10">
                                    <h4 className="text-xl font-black text-white uppercase tracking-tighter">Growth Matrix</h4>
                                    <div className="flex gap-4">
                                        <span className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase"><span className="w-2 h-2 rounded-full bg-cyan-500" /> Nodes Added</span>
                                        <span className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Paths Started</span>
                                    </div>
                                </div>
                                <div className="h-64 flex items-end gap-3 px-4">
                                    {(stats?.growthData || []).slice(-14).map((d) => (
                                        <div key={d.date} className="flex-1 flex flex-col items-center gap-2 group/bar">
                                            <div className="relative w-full flex flex-col items-center gap-1 h-full justify-end">
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${Math.min(d.nodes * 2, 80)}px` }}
                                                    className="w-full bg-cyan-500/30 rounded-t-lg group-hover/bar:bg-cyan-400/50 transition-colors border-t border-cyan-400/30"
                                                />
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${Math.min(d.paths * 5, 120)}px` }}
                                                    className="w-full bg-emerald-500/30 rounded-t-lg group-hover/bar:bg-emerald-400/50 transition-colors border-t border-emerald-400/30"
                                                />
                                            </div>
                                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter rotate-45 mt-2">{d.date.slice(5)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="lg:col-span-4 p-10 bg-gradient-to-br from-indigo-900/20 to-slate-900/40 rounded-[4rem] border border-white/10 backdrop-blur-3xl space-y-8">
                                <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-4 text-center">System Awareness</h4>
                                <div className="space-y-6">
                                    {(stats?.zones || []).slice(0, 5).map(zone => (
                                        <div key={zone.label} className="space-y-2">
                                            <div className="flex justify-between text-[10px] uppercase font-black tracking-widest px-2">
                                                <span className="text-slate-400">{zone.label}</span>
                                                <span className="text-indigo-400">{zone.count} Logs</span>
                                            </div>
                                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min((zone.count / (stats?.totalUsers || 1)) * 100, 100)}%` }}
                                                    className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'radar' && (
                    <motion.div
                        key="radar"
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: -10 }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                    >
                        <BehavioralRadar />
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

