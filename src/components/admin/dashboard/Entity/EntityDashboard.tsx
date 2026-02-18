import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, BookOpen, Cpu, Shield, Users, BarChart2, GitBranch, Edit3, Save, Sparkles } from "lucide-react";
import { NervousSystem, EntityArtifact } from "../../../../services/nervousSystem";
import { useVictoryEngine } from "../../../../services/victoryEngineStore";
import { usePulseState } from "../../../../state/pulseState";
import { AutoOptimizer } from "../../../../services/autoOptimizer";

export function EntityDashboard() {
    const [activeTab, setActiveTab] = useState<"soul" | "pulse" | "structure" | "experience">("soul");
    const [constitution, setConstitution] = useState<string>("");
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState("");
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState<string | null>(null);

    useEffect(() => {
        // Load initial data
        const art = NervousSystem.getArtifact("constitution");
        setConstitution(art.content || "Loading...");
        setEditedContent(art.content || "");
    }, []);

    const handleSave = () => {
        NervousSystem.updateArtifact("constitution", editedContent);
        setConstitution(editedContent);
        setIsEditing(false);
    };

    const handleSync = async () => {
        setIsSyncing(true);
        setSyncMessage("Scanning neural link for strategic shifts...");

        try {
            const result = await NervousSystem.syncFromAgent();
            setSyncMessage(result.message);

            // Refresh data
            const art = NervousSystem.getArtifact("constitution");
            setConstitution(art.content || "");

            setTimeout(() => setSyncMessage(null), 4000);
        } catch {
            setSyncMessage("Neural Link Failed.");
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="h-full bg-slate-900 text-slate-200 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-400 flex items-center gap-3">
                        <Cpu className="w-8 h-8 text-teal-500" />
                        The Autopoietic Entity
                        <span className="text-xs font-mono text-slate-500 bg-slate-800 px-2 py-1 rounded-md border border-slate-700">v31.0-LIVE</span>
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Self-Managed Organism Dashboard</p>
                </div>

                {/* Status Indicators */}
                <div className="flex gap-4 items-center">
                    {syncMessage && (
                        <div className="px-3 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-lg text-xs font-mono animate-pulse">
                            {syncMessage}
                        </div>
                    )}

                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all uppercase tracking-wider ${isSyncing ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30 cursor-wait" : "bg-indigo-600 hover:bg-indigo-500 text-white border-transparent hover:shadow-[0_0_15px_rgba(99,102,241,0.5)]"}`}
                    >
                        <Cpu className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                        {isSyncing ? "Scanning..." : "Sync from Agent"}
                    </button>

                    <div className="flex flex-col items-end">
                        <span className="text-xs text-slate-500 uppercase tracking-widest">System Health</span>
                        <span className="text-emerald-400 font-mono font-bold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            OPTIMAL
                        </span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-xs text-slate-500 uppercase tracking-widest">Last Sync</span>
                        <span className="text-slate-300 font-mono">Just now</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-900/30">
                <TabButton id="soul" label="01. The Soul" icon={BookOpen} active={activeTab} onClick={setActiveTab} />
                <TabButton id="pulse" label="02. The Pulse" icon={Activity} active={activeTab} onClick={setActiveTab} />
                <TabButton id="structure" label="03. The Structure" icon={GitBranch} active={activeTab} onClick={setActiveTab} />
                <TabButton id="experience" label="04. Experience" icon={Users} active={activeTab} onClick={setActiveTab} />
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-slate-900/50 p-6 relative">
                <AnimatePresence mode="wait">
                    {activeTab === "soul" && (
                        <motion.div
                            key="soul"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="max-w-4xl mx-auto"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">The Living Constitution</h3>
                                    <p className="text-slate-400 text-sm">Real-time render of the entity's core values.</p>
                                </div>
                                <button
                                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                    className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-all ${isEditing ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"}`}
                                >
                                    {isEditing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                                    {isEditing ? "Commit Changes" : "Edit Source"}
                                </button>
                            </div>

                            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                                <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                                    <span className="ml-2 text-xs font-mono text-slate-600">artifacts/constitution.md</span>
                                </div>
                                {isEditing ? (
                                    <textarea
                                        value={editedContent}
                                        onChange={(e) => setEditedContent(e.target.value)}
                                        className="w-full h-[60vh] bg-slate-950 text-slate-300 p-6 font-mono text-sm leading-relaxed focus:outline-none resize-none"
                                        spellCheck={false}
                                    />
                                ) : (
                                    <pre className="p-6 text-slate-300 font-mono text-sm leading-relaxed whitespace-pre-wrap overflow-x-auto">
                                        {constitution}
                                    </pre>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "pulse" && <PulseDashboard />}
                    {activeTab === "structure" && <StructureDashboard />}
                    {activeTab === "experience" && <ExperienceDashboard />}
                </AnimatePresence>
            </div>
        </div>
    );
}

function TabButton({ id, label, icon: Icon, active, onClick }: any) {
    const isActive = active === id;
    return (
        <button
            onClick={() => onClick(id)}
            className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all ${isActive ? "border-teal-500 text-teal-400 bg-teal-500/5" : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"}`}
        >
            <Icon className={`w-4 h-4 ${isActive ? "text-teal-500" : "text-slate-500"}`} />
            <span className="font-medium text-sm tracking-wide uppercase">{label}</span>
        </button>
    )
}

function PulseDashboard() {
    const { totalXp, currentRank } = useVictoryEngine(); // Mock or real hook
    // Assuming these exist, if not we'll mock for UI
    const victories = 12;
    const activeNodes = 45;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <StatCard title="Growth Velocity" value="+12%" trend="up" subtitle="vs last week" color="emerald" />
            <StatCard title="Active Commanders" value="1,240" trend="up" subtitle="+84 new this month" color="teal" />
            <StatCard title="Total XP Generated" value={totalXp?.toLocaleString() ?? "0"} subtitle="Global System Entropy" color="violet" />

            <div className="col-span-1 md:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 h-[400px] flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent" />
                <p className="text-slate-500 text-sm font-mono absolute top-4 left-4">LIVE_VICTORY_STREAM.json</p>
                <div className="text-center">
                    <Activity className="w-16 h-16 text-teal-500/20 mx-auto mb-4" />
                    <p className="text-slate-400">Live Growth Chart Visualization Placeholder</p>
                </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-slate-300 font-bold mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    Recent Victories
                </h3>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-3 items-start p-3 rounded-lg bg-slate-800/80 border border-slate-700/50">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 animate-pulse" />
                            <div>
                                <p className="text-sm text-slate-200 font-medium">Commander #8292 broke a loop</p>
                                <p className="text-xs text-slate-500">2 mins ago • Gravity Mass -40%</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function StructureDashboard() {
    const taskArtifact = NervousSystem.getArtifact("task");
    const [suggestions, setSuggestions] = useState<any[]>([]);

    const handleRunOptimizer = () => {
        const results = AutoOptimizer.analyzeSystem();
        setSuggestions(results);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-white">System Architecture</h3>
                    <p className="text-slate-400 text-sm">Live sync from `task.md`.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleRunOptimizer}
                        className="px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold hover:bg-indigo-500/30 transition-all flex items-center gap-2"
                    >
                        <Cpu className="w-3 h-3" />
                        Run Auto-Optimizer
                    </button>
                    <div className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-mono flex items-center gap-2">
                        <GitBranch className="w-3 h-3" />
                        origin/main
                    </div>
                </div>
            </div>

            {suggestions.length > 0 && (
                <div className="mb-6 space-y-2">
                    {suggestions.map(s => (
                        <div key={s.id} className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Sparkles className="w-4 h-4 text-indigo-400" />
                                <span className="text-sm text-indigo-200">{s.description}</span>
                            </div>
                            <button
                                onClick={() => AutoOptimizer.applySuggestion(s.id)}
                                className="text-xs bg-indigo-500 text-white px-2 py-1 rounded hover:bg-indigo-600"
                            >
                                Apply Fix
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 font-mono text-sm leading-relaxed text-slate-400 whitespace-pre-wrap">
                {taskArtifact.content}
            </div>
        </div>
    )
}

function ExperienceDashboard() {
    return (
        <div className="max-w-4xl mx-auto text-center py-20">
            <Users className="w-24 h-24 text-slate-700 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-slate-300 mb-2">Pain Points Heatmap</h3>
            <p className="text-slate-500 max-w-md mx-auto">
                The Autopoietic Entity is currently gathering data to generate the user friction heatmap.
            </p>
            <div className="mt-8 inline-block px-6 py-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 font-mono text-xs">
                WAITING_FOR_DATA_STREAM...
            </div>
        </div>
    )
}

function StatCard({ title, value, trend, subtitle, color }: any) {
    const colors: Record<string, string> = {
        emerald: "text-emerald-400",
        teal: "text-teal-400",
        violet: "text-violet-400"
    };
    const activeColor = colors[color] || "text-slate-200";

    return (
        <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-xl relative overflow-hidden group hover:border-slate-600 transition-all">
            <h4 className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-2">{title}</h4>
            <div className="flex items-end gap-3 mb-1">
                <span className={`text-3xl font-bold ${activeColor} font-mono`}>{value}</span>
                {trend && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 mb-1.5`}>
                        {trend === "up" ? "▲" : "▼"}
                    </span>
                )}
            </div>
            <p className="text-slate-500 text-xs">{subtitle}</p>
        </div>
    )
}
