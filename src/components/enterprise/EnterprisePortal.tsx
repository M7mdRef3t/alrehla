/**
 * Standalone Enterprise Portal — بوابة المؤسسات المستقلة 🏢
 * =======================================================
 * واجهة احترافية لمسؤولي الموارد البشرية والكوتشات لإدارة المجموعات.
 */

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
    Users, Shield, BarChart3, Settings, LogOut,
    Download, Plus, Search, Filter, TrendingUp,
    ShieldAlert, BrainCircuit, Globe
} from "lucide-react";
import { loadEnterpriseData, type EnterpriseProfile } from "../../services/enterpriseAnalytics";

export const EnterprisePortal: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const data = useMemo(() => {
        const loaded = loadEnterpriseData();
        // Fallback mock if no profile
        if (!loaded.profile) {
            return {
                profile: {
                    id: "DEMO-1",
                    name: "Alpha Corp (Demo)",
                    type: "company" as const,
                    size: "medium" as const,
                    adminEmail: "admin@alpha.com",
                    joinedAt: Date.now(),
                    memberCount: 42,
                },
                metrics: {
                    avgEnergyLevel: 7.5,
                    weeklyActiveRate: 0.85,
                    stressIndex: 4.2,
                    topBoundaryPatterns: ["Work Pressure"],
                    recommendation: "Focus on team alignment sessions."
                }
            };
        }
        return loaded;
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 flex font-sans overflow-hidden">
            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: sidebarOpen ? 260 : 80 }}
                className="bg-slate-900 border-r border-slate-800 flex flex-col relative z-20"
            >
                <div className="p-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    {sidebarOpen && <span className="font-black text-xl tracking-tighter text-white">DAWAYIR B2B</span>}
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2">
                    <NavItem icon={BarChart3} label="Dashboard" active={true} collapsed={!sidebarOpen} />
                    <NavItem icon={Users} label="Members" collapsed={!sidebarOpen} />
                    <NavItem icon={BrainCircuit} label="Psych Safety" collapsed={!sidebarOpen} />
                    <NavItem icon={Globe} label="Region Analytics" collapsed={!sidebarOpen} />
                    <NavItem icon={Settings} label="Portal Settings" collapsed={!sidebarOpen} />
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button className="w-full flex items-center gap-3 p-3 text-slate-400 hover:text-white transition-colors">
                        <LogOut className="w-5 h-5" />
                        {sidebarOpen && <span className="text-sm font-bold">Logout</span>}
                    </button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-slate-950">
                {/* Header */}
                <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/50 backdrop-blur-md sticky top-0 z-10">
                    <div>
                        <h2 className="text-sm font-bold text-slate-400">Enterprise Overview</h2>
                        <h1 className="text-xl font-black text-white">{data.profile?.name}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-indigo-900/20">
                            <Plus className="w-4 h-4" />
                            Add Members
                        </button>
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                            <span className="text-xs font-bold">HR</span>
                        </div>
                    </div>
                </header>

                {/* Dashboard Body */}
                <div className="p-8 space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Active Members"
                            value={data.profile?.memberCount.toString() || "0"}
                            icon={Users}
                            trend="+12%"
                        />
                        <StatCard
                            title="Avg Energy"
                            value={`${(data.metrics?.avgEnergyLevel || 0) * 10}%`}
                            icon={TrendingUp}
                            trend="+4.2%"
                        />
                        <StatCard
                            title="Stress Index"
                            value={`${data.metrics?.stressIndex || 0}/10`}
                            icon={ShieldAlert}
                            color="text-emerald-400"
                        />
                        <StatCard
                            title="Activity Rate"
                            value={`${(data.metrics?.weeklyActiveRate || 0) * 100}%`}
                            icon={TrendingUp}
                            trend="+5%"
                        />
                    </div>

                    {/* Charts & Tables Area */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Inventory */}
                        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-lg">Operational Readiness</h3>
                                <button className="text-slate-400 hover:text-white transition-colors">
                                    <Download className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="aspect-video bg-slate-800/20 rounded-xl flex items-center justify-center border border-dashed border-slate-700">
                                <span className="text-slate-500 font-medium">[Interactive Analytics Visualization]</span>
                            </div>
                        </div>

                        {/* Recent Alerts */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                            <h3 className="font-bold text-lg mb-6">Tactical Alerts</h3>
                            <div className="space-y-4">
                                <AlertItem
                                    type="info"
                                    text="Boundary violations are trending down in Dept-X."
                                />
                                <AlertItem
                                    type="warning"
                                    text="Isolation metrics rising in remote teams."
                                />
                                <AlertItem
                                    type="success"
                                    text="Weekly Victory Report generated for HR."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Member Table Mock */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <h3 className="font-bold">Team Deployment</h3>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="text"
                                        placeholder="Search members..."
                                        className="bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors w-64"
                                    />
                                </div>
                                <button className="p-2 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors">
                                    <Filter className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="p-4">
                            <table className="w-full text-left">
                                <thead className="text-xs text-slate-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Commander ID</th>
                                        <th className="px-4 py-3 font-medium">Deployment Status</th>
                                        <th className="px-4 py-3 font-medium">Stress Resistance</th>
                                        <th className="px-4 py-3 font-medium">Last Sync</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-slate-800">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <tr key={i} className="hover:bg-slate-800/10 transition-colors">
                                            <td className="px-4 py-4 font-mono text-slate-400">#CMD-{1000 + i}</td>
                                            <td className="px-4 py-4">
                                                <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase">Active</span>
                                            </td>
                                            <td className="px-4 py-4">High</td>
                                            <td className="px-4 py-4 text-slate-500 text-xs">2 hours ago</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

const NavItem: React.FC<{ icon: any; label: string; active?: boolean; collapsed?: boolean }> = ({
    icon: Icon, label, active, collapsed
}) => (
    <button className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${active ? 'bg-indigo-600/10 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
        <Icon className="w-5 h-5 shrink-0" />
        {!collapsed && <span className="text-sm font-bold">{label}</span>}
    </button>
);

const StatCard: React.FC<{ title: string; value: string; icon: any; trend?: string; color?: string; inverse?: boolean }> = ({
    title, value, icon: Icon, trend, color = "text-white", inverse
}) => (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                <Icon className="w-5 h-5 text-slate-400" />
            </div>
            {trend && (
                <span className={`text-xs font-bold ${inverse ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {trend}
                </span>
            )}
        </div>
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        <p className={`text-2xl font-black mt-1 ${color}`}>{value}</p>
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-600/5 rounded-full blur-2xl group-hover:bg-indigo-600/10 transition-all" />
    </div>
);

const AlertItem: React.FC<{ type: 'info' | 'warning' | 'success'; text: string }> = ({ type, text }) => (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/20 border border-slate-800/50">
        <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${type === 'warning' ? 'bg-rose-500' :
            type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
            }`} />
        <p className="text-xs text-slate-400 leading-relaxed">{text}</p>
    </div>
);
