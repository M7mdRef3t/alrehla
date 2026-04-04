"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Users, Activity, Clock, LogOut, ChevronLeft, AlertTriangle, ShieldAlert, Sparkles, Brain, Search, LayoutDashboard, Settings, Bell } from 'lucide-react';
import { getClients } from '../../services/b2bService';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithGoogleAtPath } from '../../services/authService';

// Mock AI Insights for the B2B portal
const MOCK_ORACLE_INSIGHTS = [
    { risk: 85, tip: "   .         .      .", trend: "up" },
    { risk: 40, tip: "      .   '  '  .", trend: "stable" },
    { risk: 15, tip: "  .          .", trend: "down" },
];

import { AccessManager, SubscriptionInfo } from '../billing/AccessManager';
import { TrajectoryEngine, ClientTrajectory } from '../../services/trajectoryEngine';
import { ExperienceTrajectory } from '../../components/B2B/ExperienceTrajectory';
import { DispatcherEngine } from '../../services/dispatcherEngine';
import { CoachAlertCenter } from '../../components/B2B/CoachAlertCenter';

export default function CoachDashboard() {
    const [coach, setCoach] = useState<any>(null);
    const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null);
    const [clients, setClients] = useState<any[]>([]);
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTrajectory, setSelectedTrajectory] = useState<ClientTrajectory | null>(null);
    const [isTrajectoryLoading, setIsTrajectoryLoading] = useState(false);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [showAlerts, setShowAlerts] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            if (!supabase) {
                setIsLoading(false);
                return;
            }
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setCoach(session.user);

                const info = await AccessManager.getSubscriptionStatus(session.user.id);
                setSubInfo(info);

                if (info.tier === 'coach') {
                    // Fetch real clients from Supabase
                    const myClients = await getClients();
                    const mappedClients = myClients.map((c, i) => {
                        const insight = MOCK_ORACLE_INSIGHTS[i % MOCK_ORACLE_INSIGHTS.length];
                        return {
                            id: c.clientCode,
                            name: c.clientAlias,
                            email: ' ',
                            status: 'active',
                            lastUpdate: new Date(c.linkedAt).toLocaleDateString("ar-EG"),
                            pulseScore: Math.floor(Math.random() * 5) + 3,
                            burnoutProbability: insight.risk,
                            aiTip: insight.tip,
                            trend: insight.trend
                        };
                    });
                    // Sort by risk (triage)
                    setClients(mappedClients.sort((a, b) => b.burnoutProbability - a.burnoutProbability));

                    // Fetch Alerts
                    const myAlerts = await DispatcherEngine.getCoachAlerts(session.user.id);
                    setAlerts(myAlerts);
                }
            }
            setIsLoading(false);
        };
        checkAuth();
    }, []);

    const fetchAlerts = async () => {
        if (!coach) return;
        const myAlerts = await DispatcherEngine.getCoachAlerts(coach.id);
        setAlerts(myAlerts);
    };

    if (isLoading) {
        return <div className="min-h-screen bg-white flex items-center justify-center font-bold text-slate-400">جاري تحميل لوحة التحكم...</div>;
    }

    const handleLogout = async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    const filteredClients = clients.filter(c => c.name.includes(searchQuery));

    const handleSelectClient = async (client: any) => {
        setSelectedClient(client);
        setIsTrajectoryLoading(true);
        try {
            const trajectory = await TrajectoryEngine.getClientTrajectory(client.id);
            setSelectedTrajectory(trajectory);
        } catch (e) {
            console.error("Failed to load trajectory", e);
            setSelectedTrajectory(null);
        } finally {
            setIsTrajectoryLoading(false);
        }
    };

    if (!coach) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-[var(--soft-teal)]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Activity className="w-8 h-8 text-[var(--soft-teal)]" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">سجّل دخولك كمدرب</h2>
                    <p className="text-slate-500 mb-8 leading-relaxed">لوحة الكوتش متاحة بعد تسجيل الدخول فقط.</p>
                    <button
                        onClick={() => {
                            void signInWithGoogleAtPath('/coach');
                        }}
                        className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-900/20"
                    >
                        تسجيل الدخول بـ Google
                    </button>
                </div>
            </div>
        );
    }

    if (!subInfo) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin w-10 h-10 border-4 border-[var(--soft-teal)] border-t-transparent rounded-full" />
            </div>
        );
    }

    if (subInfo.tier !== 'coach') {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center" dir="rtl">
                <div className="w-20 h-20 bg-[var(--soft-teal)]/10 text-[var(--soft-teal)] rounded-3xl flex items-center justify-center mb-6 border border-[var(--soft-teal)] shadow-sm">
                    <ShieldAlert className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-4">الوصول للمدربين فقط</h1>
                <p className="text-gray-600 max-w-md leading-relaxed mb-8">
                    حسابك الحالي لا يحتوي على باقة الكوتش. فعّل باقة المدرب لفتح لوحة التحكم وإدارة العملاء.
                </p>
                <div className="flex gap-4">
                    <a href="/" className="px-8 py-4 bg-white text-gray-900 border border-gray-200 rounded-2xl font-bold hover:bg-gray-50 transition">الرجوع للرئيسية</a>
                    <a href="/pricing" className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition shadow-lg shadow-gray-900/20">ترقية الباقة</a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-slate-50 font-sans" dir="rtl">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-l border-slate-200 flex flex-col shrink-0 relative z-20 shadow-sm">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--soft-teal)] to-violet-600 text-white flex items-center justify-center font-bold shadow-md shadow-[var(--soft-teal)]">
                            <Brain className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="font-black text-slate-900 tracking-tight">Dawayir<span className="text-[var(--soft-teal)]">Pro</span></h1>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Clinical Dashboard</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
                    <button className="flex items-center gap-3 w-full p-3.5 rounded-xl bg-[var(--soft-teal)]/10 text-[var(--soft-teal)] font-bold transition-colors">
                        <Users className="w-5 h-5" />
                        <span className="flex-1 text-right"> / </span>
                    </button>
                    <button
                        onClick={() => setShowAlerts(!showAlerts)}
                        className={`flex items-center gap-3 w-full p-3.5 rounded-xl transition-colors relative ${showAlerts ? 'bg-rose-50 text-rose-700 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-bold'}`}
                    >
                        <Bell className={`w-5 h-5 ${alerts.length > 0 && !showAlerts ? 'animate-bounce text-rose-500' : ''}`} />
                        <span className="flex-1 text-right"> </span>
                        {alerts.length > 0 && (
                            <span className="absolute left-3 top-3 w-5 h-5 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full font-black border-2 border-white shadow-sm">
                                {alerts.length}
                            </span>
                        )}
                    </button>
                    <button className="flex items-center gap-3 w-full p-3.5 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-bold transition-colors">
                        <Clock className="w-5 h-5" />
                        <span className="flex-1 text-right"> </span>
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden shrink-0 border-2 border-white shadow-sm">
                            <img src={coach.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${coach.email}&background=e2e8f0&color=64748b`} alt="" />
                        </div>
                        <div className="min-w-0">
                            <div className="truncate text-sm font-bold text-slate-900">{coach.user_metadata?.full_name || ' '}</div>
                            <div className="truncate text-xs text-slate-500">{coach.email}</div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="flex-1 flex items-center justify-center p-2.5 rounded-xl text-slate-500 hover:bg-slate-200 border border-slate-200 transition-colors">
                            <Settings className="w-4 h-4" />
                        </button>
                        <button onClick={handleLogout} className="flex-[3] flex items-center justify-center gap-2 p-2.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 font-bold transition-colors">
                            <LogOut className="w-4 h-4" /> 
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10 w-full">
                {/* Floating Alert Center */}
                <AnimatePresence>
                    {showAlerts && (
                        <div className="absolute right-4 top-20 z-50">
                            <CoachAlertCenter alerts={alerts} onRefresh={fetchAlerts} />
                        </div>
                    )}
                </AnimatePresence>
                <AnimatePresence mode="wait">
                    {selectedClient ? (
                        /* Client Detail View */
                        <motion.div
                            key="client-view"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex-1 flex flex-col h-full bg-slate-50 relative"
                        >
                            <header className="px-8 py-6 border-b border-slate-200 bg-white z-10 shrink-0 shadow-sm shadow-slate-200/50">
                                <div className="flex justify-between items-center w-full mb-6">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setSelectedClient(null)}
                                            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-600"
                                        >
                                            <ChevronLeft className="w-5 h-5 -ml-1" />
                                        </button>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h2 className="text-2xl font-black text-slate-900">{selectedClient.name}</h2>
                                                <span className="px-2.5 py-1 bg-[var(--soft-teal)]/10 text-[var(--soft-teal)] text-[10px] font-black tracking-widest uppercase rounded-full border border-[var(--soft-teal)]">
                                                    ID: {selectedClient.id.substring(0, 6)}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-slate-500 mt-1"> :   ({selectedClient.lastUpdate})</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-900/20 transition-all">
                                              
                                        </button>
                                    </div>
                                </div>

                                {/* AI Oracle Banner */}
                                <div className={`w-full p-5 rounded-2xl border-2 flex items-start gap-5 ${selectedClient.burnoutProbability >= 75
                                    ? 'bg-rose-50 border-rose-100'
                                    : 'bg-[var(--soft-teal)]/10 border-[var(--soft-teal)]'
                                    }`}>
                                    <div className={`p-3 rounded-xl shrink-0 mt-0.5 shadow-sm ${selectedClient.burnoutProbability >= 75
                                        ? 'bg-rose-100 text-rose-600 border border-rose-200'
                                        : 'bg-[var(--soft-teal)]/15 text-[var(--soft-teal)] border border-[var(--soft-teal)]'
                                        }`}>
                                        {selectedClient.burnoutProbability >= 75 ? <ShieldAlert className="w-7 h-7" /> : <Sparkles className="w-7 h-7" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <h4 className={`text-base font-black ${selectedClient.burnoutProbability >= 75 ? 'text-rose-900' : 'text-[var(--soft-teal)]'}`}>
                                                      (AI Triage)
                                                </h4>
                                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${selectedClient.burnoutProbability >= 75
                                                    ? 'bg-rose-200 text-rose-800 border-rose-300'
                                                    : 'bg-[var(--soft-teal)]/20 text-[var(--soft-teal)] border-[var(--soft-teal)]'
                                                    }`}>
                                                     : {selectedClient.burnoutProbability}%
                                                </span>
                                            </div>
                                        </div>
                                        <p className={`text-sm leading-relaxed font-medium ${selectedClient.burnoutProbability >= 75 ? 'text-rose-800' : 'text-[var(--soft-teal)]'}`}>
                                            {selectedClient.aiTip}
                                        </p>

                                        <div className="mt-4 flex gap-3">
                                            {selectedClient.burnoutProbability >= 75 && (
                                                <button className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-rose-700 transition">
                                                     " " 
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleSelectClient(selectedClient)}
                                                className={`px-4 py-2 bg-white text-xs font-bold rounded-lg shadow-sm border transition ${selectedClient.burnoutProbability >= 75 ? 'text-rose-700 border-rose-200 hover:bg-rose-50' : 'text-[var(--soft-teal)] border-[var(--soft-teal)] hover:bg-[var(--soft-teal)]/10'
                                                    }`}>
                                                  
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Trajectory Chart Section */}
                                {selectedTrajectory && (
                                    <div className="mt-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                        <ExperienceTrajectory trajectory={selectedTrajectory} />
                                    </div>
                                )}
                            </header>

                            <div className="flex-1 p-8 overflow-y-auto">
                                <div className="bg-slate-200/50 border-2 border-dashed border-slate-300 rounded-3xl h-full min-h-[500px] flex flex-col items-center justify-center text-slate-500">
                                    <Brain className="w-16 h-16 text-slate-300 mb-4" />
                                    <p className="font-bold text-lg">  (Therapist View)</p>
                                    <p className="text-sm mt-2 max-w-sm text-center">    React Flow   ""        (Privacy-First).</p>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        /* Dashboard Overview */
                        <motion.div
                            key="dashboard-overview"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 overflow-y-auto p-8"
                        >
                            <header className="mb-10 flex justify-between items-end">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 mb-2"> </h2>
                                    <p className="text-slate-500 font-medium text-lg">       .</p>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 right-0 pl-3 flex items-center bg-white rounded-xl border border-slate-200 px-3 pointer-events-none">
                                        <Search className="h-5 w-5 text-slate-400" />
                                    </div>
                                <input
                                    id="coach-dashboard-query"
                                    name="coachDashboardQuery"
                                    type="text"
                                        placeholder="   ..."
                                        className="pl-4 pr-10 py-3 block w-72 rounded-xl border-slate-200 bg-white font-medium focus:ring-[var(--soft-teal)] focus:border-[var(--soft-teal)] shadow-sm"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </header>

                            {/* Quick Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1"> </div>
                                        <div className="text-4xl font-black text-slate-900">{clients.length} <span className="text-lg text-slate-400 font-bold">/ 50</span></div>
                                    </div>
                                    <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                                        <Users className="w-6 h-6 text-slate-400" />
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-rose-500 to-red-600 p-6 rounded-3xl shadow-md border border-red-500 flex items-center justify-between text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10" />
                                    <div className="relative z-10">
                                        <div className="text-sm font-bold text-rose-100 uppercase tracking-widest mb-1">   (Triage)</div>
                                        <div className="text-4xl font-black">{clients.filter(c => c.burnoutProbability >= 70).length}</div>
                                    </div>
                                    <div className="relative z-10 w-14 h-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                        <AlertTriangle className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1"> </div>
                                        <div className="text-4xl font-black text-slate-900">4 <span className="text-lg text-emerald-500 font-bold ml-1"></span></div>
                                    </div>
                                    <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                                        <Activity className="w-6 h-6 text-emerald-500" />
                                    </div>
                                </div>
                            </div>

                            {/* Client List (Triage System) */}
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <h3 className="font-bold text-slate-900 text-lg">  (  )</h3>
                                    <button className="text-sm text-[var(--soft-teal)] font-bold hover:text-[var(--soft-teal)] transition-colors flex items-center gap-2 bg-[var(--soft-teal)]/10 px-4 py-2 rounded-lg border border-[var(--soft-teal)]">
                                        +   
                                    </button>
                                </div>

                                <div className="divide-y divide-slate-100">
                                    {filteredClients.length === 0 ? (
                                        <div className="p-12 text-center text-slate-500 font-medium">    .</div>
                                    ) : filteredClients.map(client => (
                                        <motion.div
                                            key={client.id}
                                            whileHover={{ backgroundColor: "rgba(248, 250, 252, 1)" }}
                                            onClick={() => client.status === 'active' && setSelectedClient(client)}
                                            className={`px-8 py-5 flex items-center gap-6 transition-colors ${client.status === 'active' ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                                        >
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 shadow-sm border ${client.burnoutProbability >= 70
                                                ? 'bg-rose-50 text-rose-600 border-rose-200'
                                                : client.burnoutProbability <= 30
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                    : 'bg-[var(--soft-teal)]/10 text-[var(--soft-teal)] border-[var(--soft-teal)]'
                                                }`}>
                                                {client.name.charAt(0)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1.5">
                                                    <h4 className="font-black text-slate-900 text-lg truncate">{client.name}</h4>
                                                    {client.burnoutProbability >= 70 && (
                                                        <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-bold uppercase tracking-widest border border-rose-200">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> 
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="w-4 h-4" />  : {client.lastUpdate}
                                                    </span>
                                                    <span className="text-slate-300">|</span>
                                                    <span className="font-mono text-xs tracking-wider">ID:{client.id.substring(0, 8)}</span>
                                                </div>
                                            </div>

                                            {/* Pulse Score */}
                                            {client.status === 'active' && (
                                                <div className="flex items-center gap-8 shrink-0">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1"> </span>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full ${client.burnoutProbability >= 70 ? 'bg-rose-500' :
                                                                        client.burnoutProbability >= 40 ? 'bg-amber-400' : 'bg-emerald-400'
                                                                        }`}
                                                                    style={{ width: `${client.burnoutProbability}%` }}
                                                                />
                                                            </div>
                                                            <span className={`font-black w-8 text-left ${client.burnoutProbability >= 70 ? 'text-rose-600' :
                                                                client.burnoutProbability >= 40 ? 'text-amber-500' : 'text-emerald-500'
                                                                }`}>
                                                                {client.burnoutProbability}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-400 group-hover:bg-white group-hover:border-slate-300 transition-colors">
                                                        <ChevronLeft className="w-5 h-5" />
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}




