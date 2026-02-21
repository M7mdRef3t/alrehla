"use client";

import React, { useState, useEffect } from 'react';
import ChatInterface from '../../components/Chat/ChatInterface';
import CanvasComponent from '../../components/Canvas/CanvasComponent';
import FacilitatorChat from '../../components/Chat/FacilitatorChat';
import { useDawayirEngine, NodeData } from '../../hooks/useDawayirEngine';
import { Sparkles, AlertCircle, Heart, ArrowLeft, Loader2, Save, Check, Share2, Activity, Zap, Shield, Clock, Terminal } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { AutomagicEventPopup } from '../../components/Map/AutomagicEventPopup';
import { AccessManager, SubscriptionInfo } from '../billing/AccessManager';

export default function DawayirApp() {
    const { data, isLoading, isSaving, error, analyzeAnswers, saveMap } = useDawayirEngine();
    const [showPaywall, setShowPaywall] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [hasActiveCoach, setHasActiveCoach] = useState(false);
    const [isShared, setIsShared] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [sourceStory, setSourceStory] = useState<string | null>(null);
    const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null);

    // Predictive AI State
    const [isOracleLoading, setIsOracleLoading] = useState(false);
    const [oraclePrediction, setOraclePrediction] = useState<any>(null); // To store burnout_probability etc.
    const [showOracleModal, setShowOracleModal] = useState(false);

    // AI Facilitator State (Phase 3)
    const [focusedNode, setFocusedNode] = useState<NodeData | null>(null);
    const [pendingNodeUpdate, setPendingNodeUpdate] = useState<{ id: string; updates: Partial<NodeData> } | null>(null);

    const handleUpdateNode = (nodeId: string, updates: Partial<NodeData>) => {
        setPendingNodeUpdate({ id: nodeId, updates });

        // Also update the local focusedNode state 
        if (focusedNode && focusedNode.id === nodeId) {
            setFocusedNode({ ...focusedNode, ...updates } as NodeData);
        }
    };

    useEffect(() => {
        // Check for URL parameters
        if (typeof window !== 'undefined') {
            const searchParams = new URLSearchParams(window.location.search);
            const source = searchParams.get('source');
            if (source) {
                setSourceStory(source);
            }
        }
        if (supabase) {
            const loadAccess = async (userId: string) => {
                const info = await AccessManager.getSubscriptionStatus(userId);
                setSubInfo(info);
                checkCoachConnection(userId);
            };

            supabase.auth.getSession().then(({ data: { session } }) => {
                setUser(session?.user || null);
                if (session?.user) {
                    loadAccess(session.user.id);
                }
            });

            const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
                setUser(session?.user || null);
                if (session?.user) {
                    loadAccess(session.user.id);
                } else {
                    setSubInfo(null);
                }
            });

            return () => subscription.unsubscribe();
        }
    }, []);

    const checkCoachConnection = async (userId: string) => {
        if (!supabase) return;
        const { data, error } = await supabase
            .from('coach_connections')
            .select('id')
            .eq('client_id', userId)
            .eq('status', 'active')
            .limit(1);

        if (!error && data && data.length > 0) {
            setHasActiveCoach(true);
        }
    };

    const handleCallOracle = async () => {
        if (!user) {
            setShowPaywall(true);
            return;
        }
        if (!subInfo?.features.hasAiOracle) {
            setShowPaywall(true);
            return;
        }

        setIsOracleLoading(true);
        try {
            const res = await fetch('/api/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id }),
            });
            const data = await res.json();

            setOraclePrediction(data);
            setShowOracleModal(true);
        } catch (error) {
            console.error("Failed to query the Oracle:", error);
            alert("حدث خطأ أثناء تحليل المسار الزمني الخاص بك.");
        } finally {
            setIsOracleLoading(false);
        }
    };

    const handleShareWithCoach = async () => {
        if (!data?.id || !supabase) return;
        setIsSharing(true);
        const { error } = await supabase
            .from('dawayir_maps')
            .update({ shared_with_coach: true })
            .eq('id', data.id);

        setIsSharing(false);
        if (!error) setIsShared(true);
    };

    const handleNotifyCoach = async () => {
        if (!user || !oraclePrediction || !supabase) return;

        // This is a "Zero-Touch" proactive alert. 
        // We add a record to a notifications or alerts table that the coach dashboard can listen to.
        // For the MVP, we can reuse the dawayir_maps metadata or a separate alert.
        // Let's assume a simple update to the map that flags it as 'urgent_alert'.

        setIsSharing(true);
        const { error } = await supabase
            .from('dawayir_maps')
            .update({
                shared_with_coach: true,
                metadata: {
                    ...(data?.metadata || {}),
                    urgent_alert: true,
                    alert_reason: 'High Burnout Risk Detected',
                    burnout_probability: oraclePrediction.burnout_probability
                }
            })
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);

        setIsSharing(false);
        if (!error) {
            alert("تم إرسال تنبيه عاجل للكوتش الخاص بك. سيتم التواصل معك قريباً.");
            setShowOracleModal(false);
        }
    };

    const handleGoogleLogin = async () => {
        if (!supabase) return;
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/dawayir'
            }
        });
    };

    const handleSave = async () => {
        if (!user) {
            setShowPaywall(true);
            return;
        }
        await saveMap("خريطة التقييم الأولي");
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center font-sans overflow-hidden relative">

            {/* Cosmic Background Elements */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.05)_0%,transparent_70%)]" />
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-teal-500/5 blur-[120px] rounded-full" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />
            </div>

            {/* Navbar Minimalist - Tactical Style */}
            <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center bg-transparent z-10 pointer-events-auto">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-teal-400" />
                    </div>
                    <h1 className="text-xl font-black text-white tracking-widest font-mono uppercase">DAWAYIR_PROTO</h1>
                </div>
                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                            <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                            <span className="text-xs font-bold text-slate-300 font-mono tracking-tighter uppercase">{user.email?.split('@')[0]}</span>
                        </div>
                    ) : (
                        <button onClick={handleGoogleLogin} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2 backdrop-blur-sm">
                            <span className="font-mono uppercase tracking-widest">AUTH_GATE</span> <ArrowLeft className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className="w-full max-w-5xl px-4 flex flex-col items-center flex-grow justify-center relative mt-16 mb-8">

                {/* Error Handling */}
                {error && (
                    <div className="mb-6 px-4 py-3 bg-red-50 text-red-600 rounded-lg shadow-sm border border-red-100 text-sm max-w-md text-center">
                        {error}
                    </div>
                )}

                {/* Phase 1: The Chat Hook */}
                {!data && (
                    <div className="w-full flex-grow flex items-center justify-center animate-in fade-in zoom-in duration-500 relative z-10">
                        <div className="w-full max-w-2xl">
                            <div className="text-center mb-10">
                                {sourceStory === 'story-1' ? (
                                    <>
                                        <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
                                            مرحباً بك في مساحة السيادة
                                        </h2>
                                        <p className="text-slate-400 font-medium max-w-lg mx-auto">
                                            استلهاماً من رحلة استعادة السيطرة، دعنا نرصد مواطن النزيف في مجالك...
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-500/5 mb-6">
                                            <Zap className="w-3 h-3 text-teal-400" />
                                            <span className="text-[10px] font-black text-teal-300 uppercase tracking-[0.2em] font-mono">RADAR_INITIATED</span>
                                        </div>
                                        <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">اكتشف ثغرات طاقتك في 60 ثانية</h2>
                                        <p className="text-slate-400 font-medium">لا تفكر كثيراً... اترك بروتوكولات الوعي تعمل.</p>
                                    </>
                                )}
                            </div>
                            <div className="glass rounded-[2rem] p-1 border-white/5 relative group overflow-hidden">
                                <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-500/20 to-transparent top-0 animate-scan" />
                                <ChatInterface
                                    onAnalyze={(answers) => analyzeAnswers(answers, subInfo?.features.maxMapNodes || 7)}
                                    isLoading={isLoading}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Phase 2: The Canvas (Aha Moment) */}
                {data && (
                    <div className="w-full h-full flex flex-col relative animate-in slide-in-from-bottom-8 fade-in duration-700">

                        <div className="absolute z-20 top-4 left-1/2 -translate-x-1/2 glass px-6 py-4 border-white/10 max-w-xl text-center shadow-2xl">
                            <p className="text-white font-bold leading-relaxed flex items-center gap-3">
                                <Zap className="w-5 h-5 text-teal-400 animate-pulse" />
                                {data.insight_message}
                            </p>
                        </div>

                        <div className="w-full h-[70vh] rounded-2xl overflow-hidden relative">
                            <CanvasComponent
                                data={data}
                                onNodeClick={(node) => {
                                    if (subInfo?.features.hasFacilitatorAssistance) {
                                        setFocusedNode(node);
                                    } else {
                                        setShowPaywall(true);
                                    }
                                }}
                                pendingNodeUpdate={pendingNodeUpdate}
                            />

                            {/* Phase 3: The AI Facilitator (Glass-morphic Chat) */}
                            {focusedNode && subInfo?.features.hasFacilitatorAssistance && (
                                <FacilitatorChat
                                    focusedNode={focusedNode}
                                    fullMap={data}
                                    onClose={() => setFocusedNode(null)}
                                    onUpdateNode={handleUpdateNode}
                                />
                            )}

                            {/* Action Overlay */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col md:flex-row gap-4">
                                {(!data.id) && (
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="px-6 py-3 bg-teal-500 text-slate-950 rounded-xl shadow-lg shadow-teal-500/20 hover:bg-teal-400 transition-all duration-300 font-black text-xs flex items-center justify-center gap-2 uppercase tracking-widest"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        {isSaving ? 'DATA_SYNCING...' : 'SECURE_MAP'}
                                    </button>
                                )}
                                {(data.id && hasActiveCoach) && (
                                    <button
                                        onClick={handleShareWithCoach}
                                        disabled={isSharing || isShared}
                                        className={`px-6 py-3 border rounded-xl shadow-lg transition-all duration-300 font-black text-xs flex items-center justify-center gap-2 uppercase tracking-widest
                                            ${isShared
                                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 cursor-default'
                                                : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20'}`}
                                    >
                                        {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : (isShared ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />)}
                                        {isSharing ? 'UPLOADING...' : (isShared ? 'PROTO_SHARED' : 'SHARE_WITH_HQ')}
                                    </button>
                                )}
                                {/* Personal Oracle Control (Proactive AI) */}
                                {user && data.id && (
                                    <button
                                        onClick={handleCallOracle}
                                        disabled={isOracleLoading}
                                        className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl shadow-md hover:bg-white/10 transition-all duration-300 font-black text-xs flex items-center justify-center gap-2 uppercase tracking-widest"
                                    >
                                        {isOracleLoading ? "DECODING..." : "ANALYZE_ENERGY"}
                                        <Sparkles className="w-4 h-4 text-teal-400" />
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowPaywall(true)}
                                    className="px-8 py-3 bg-gray-900 text-white rounded-full shadow-lg shadow-gray-900/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 font-semibold"
                                >
                                    ابدأ إعادة الهيكلة (النسخة الكاملة)
                                </button>
                            </div>
                        </div>

                        {/* Automagic Event Notification Popup */}
                        <AutomagicEventPopup />

                    </div>
                )}

                {/* Phase 3: The Paywall Modal (Minimalist) */}
                {showPaywall && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
                        <div className="glass-heavy p-8 max-w-md w-full relative text-center border-teal-500/20">
                            <button
                                onClick={() => setShowPaywall(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-white"
                            >
                                <ArrowLeft className="w-5 h-5 rotate-180" />
                            </button>
                            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-6">
                                <Shield className="w-8 h-8 text-teal-400" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">النظام هنا لخدمتك</h3>
                            <p className="text-slate-400 mb-8 leading-relaxed text-sm font-medium">
                                النسخة المجانية منحتك التشخيص. لكي تبدأ في بناء الحدود التلقائية، تتبع التطور، والحصول على أدوات الوعي الذكية.. ارفع مستوى اشتراكك الآن.
                            </p>
                            <div className="space-y-4">
                                <button onClick={handleGoogleLogin} className="w-full py-4 bg-teal-500 text-slate-950 rounded-xl font-black shadow-lg shadow-teal-500/20 hover:bg-teal-400 transition-all flex items-center justify-center gap-3">
                                    <Check className="w-5 h-5" />
                                    سجل عبر Google مجاناً
                                </button>
                                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">ACCESS_PROTOCOL: $9/MONTH</div>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Oracle Loading Overlay */}
            {isOracleLoading && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4 animate-in fade-in duration-200" dir="rtl">
                    <div className="glass-heavy p-10 max-w-sm w-full border-teal-500/30 flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-8 relative">
                            <div className="absolute inset-0 bg-teal-500/20 rounded-full animate-ping opacity-30"></div>
                            <div className="absolute inset-0 border-2 border-teal-500/20 rounded-full animate-spin duration-[3s]" />
                            <Sparkles className="w-12 h-12 text-teal-400 animate-pulse" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight font-mono">DECODING_TRAJECTORY</h3>
                        <p className="text-slate-400 text-sm leading-relaxed font-medium">نقوم بمعالجة خرائط وعيك التاريخية واستخراج المؤشرات التنبؤية، لحظات من فضلك.</p>
                    </div>
                </div>
            )}

            {/* Predictive Oracle Modal (Smart Notifications) */}
            {showOracleModal && oraclePrediction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-in fade-in duration-200" dir="rtl">
                    <div className="glass-heavy p-8 max-w-lg w-full relative overflow-hidden border-teal-500/20">

                        {/* Status Header based on Calibration */}
                        {oraclePrediction.needsMoreData ? (
                            <div className="mb-8 flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-white/5 border border-white/10 text-slate-400 rounded-2xl flex items-center justify-center mb-6"><Clock className="w-10 h-10" /></div>
                                <h2 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">DATA_INCOMPLETE</h2>
                                <p className="text-slate-400 font-medium">{oraclePrediction.error}</p>
                            </div>
                        ) : oraclePrediction.burnout_probability > 60 ? (
                            <div className="mb-8 flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-2xl flex items-center justify-center mb-6 animate-pulse"><AlertCircle className="w-10 h-10" /></div>
                                <h2 className="text-2xl font-black text-rose-400 mb-3 uppercase tracking-tight">BURNOUT_PROBABILITY: {oraclePrediction.burnout_probability}%</h2>
                                <div className="p-5 bg-rose-500/5 rounded-2xl border border-rose-500/20 mb-6 text-right w-full">
                                    <p className="text-rose-200/80 text-sm leading-[1.8] font-bold">{oraclePrediction.trajectory_summary}</p>
                                </div>
                                <div className="w-full text-right p-6 glass border-white/5 shadow-inner">
                                    <h4 className="font-black text-teal-400 mb-3 flex items-center gap-2 text-xs uppercase tracking-widest font-mono">
                                        <Terminal className="w-4 h-4" /> PREVENTATIVE_PROTOCOL:
                                    </h4>
                                    <p className="text-slate-200 text-sm leading-relaxed font-medium">{oraclePrediction.preventative_action}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="mb-8 flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-2xl flex items-center justify-center mb-6"><Heart className="w-10 h-10" /></div>
                                <h2 className="text-2xl font-black text-emerald-400 mb-3 uppercase tracking-tight">SYSTEM_STABLE: {oraclePrediction.burnout_probability}%</h2>
                                <div className="p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 mb-6 text-right w-full">
                                    <p className="text-emerald-200/80 text-sm leading-[1.8] font-bold">{oraclePrediction.trajectory_summary}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowOracleModal(false)}
                                className="flex-1 py-4 bg-white/5 border border-white/10 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white/10 transition-all font-mono"
                            >
                                CLOSE_DAEMON
                            </button>
                            {hasActiveCoach && oraclePrediction?.burnout_probability > 60 && (
                                <button
                                    onClick={handleNotifyCoach}
                                    disabled={isSharing}
                                    className="flex-1 py-4 bg-rose-500 text-slate-950 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-rose-400 transition-all flex items-center justify-center gap-2"
                                >
                                    {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                                    NOTIFY_HQ
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

