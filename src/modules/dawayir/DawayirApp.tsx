'use client';

import { logger } from "@/services/logger";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatInterface from '@/modules/action/Chat/ChatInterface';
import CanvasComponent from '@/modules/exploration/Canvas/CanvasComponent';
import FacilitatorChat from '@/modules/action/Chat/FacilitatorChat';
import { useDawayirEngine, NodeData } from '@/hooks/useDawayirEngine';
import { Sparkles, AlertCircle, Heart, ArrowLeft, Loader2, Save, Check, Share2, Activity, Zap, Shield, Clock, Terminal, Brain } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { AutomagicEventPopup } from '@/modules/exploration/Map/AutomagicEventPopup';
import { AccessManager, SubscriptionInfo } from '../billing/AccessManager';
import { SymptomSimulation } from '@/modules/action/Chat/SymptomSimulation';
import { Typewriter } from '@/modules/meta/UI/Typewriter';
import { useAIOrchestration } from '@/hooks/useAIOrchestration';
import { useGestureSanctuary } from '@/hooks/useGestureSanctuary';
import { GenesisOnboarding } from '@/modules/meta/GenesisOnboarding';
import { signInWithGoogleAtPath } from '@/services/authService';

export default function DawayirApp() {
    useAIOrchestration();
    const { isSanctuary, exitSanctuary, gestureHandlers } = useGestureSanctuary();

    const { data, isLoading, isSaving, error, analyzeAnswers, saveMap } = useDawayirEngine();
    const [showPaywall, setShowPaywall] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [hasActiveCoach, setHasActiveCoach] = useState(false);
    const [isShared, setIsShared] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [sourceStory, setSourceStory] = useState<string | null>(null);
    const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null);
    const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
    const [awarenessTokens, setAwarenessTokens] = useState<number | null>(null);

    // Predictive AI State
    const [isOracleLoading, setIsOracleLoading] = useState(false);
    const [oraclePrediction, setOraclePrediction] = useState<any>(null); // To store burnout_probability etc.
    const [showOracleModal, setShowOracleModal] = useState(false);
    const [showSimulation, setShowSimulation] = useState(false);

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
    }, []);

    // Hook-to-Convo Bridge (Weather -> Dawayir)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get('surface') === 'weather-funnel') {
            const weatherContextRaw = window.sessionStorage.getItem('weather_context');
            if (weatherContextRaw) {
                try {
                    const weatherCtx = JSON.parse(weatherContextRaw);
                    if (weatherCtx && weatherCtx.weatherLevel) {
                        // Prevent infinite loop on remount
                        window.sessionStorage.removeItem('weather_context');
                        
                        const aiAnswers = [
                            `المجالات التي تشغل تفكيري: ${weatherCtx.dominantSource} (تحديداً العلاقات المستنزفة)`,
                            `مستوى الاستنزاف: حالة ${weatherCtx.weatherLevel} - ${weatherCtx.overallHeadline}`,
                            `الحاجة التي أتجنبها: ${weatherCtx.behavioralExplanation}`
                        ];
                        
                        // Fire analysis automatically, acting as if the user completed the chat
                            analyzeAnswers(aiAnswers, subInfo?.features.maxMapNodes || 7);
                    }
                } catch (e) {
                    logger.error("Failed to parse weather context", e);
                }
            }
        }
         
    }, [analyzeAnswers, subInfo]);

    useEffect(() => {
        if (supabase) {
            const client = supabase;
            const loadOnboardingState = async (userId: string) => {
                const { data: profile, error } = await client
                    .from('profiles')
                    .select('is_onboarded, awareness_tokens')
                    .eq('id', userId)
                    .maybeSingle();

                if (error) {
                    setIsOnboarded(false);
                    setAwarenessTokens(null);
                    return;
                }
                setIsOnboarded(Boolean(profile?.is_onboarded));
                setAwarenessTokens(typeof profile?.awareness_tokens === 'number' ? profile.awareness_tokens : null);
            };

            const loadAccess = async (userId: string) => {
                const [info] = await Promise.all([
                    AccessManager.getSubscriptionStatus(userId),
                    loadOnboardingState(userId)
                ]);
                setSubInfo(info);
                await checkCoachConnection(userId);
            };

            client.auth.getSession().then(({ data: { session } }) => {
                setUser(session?.user || null);
                if (session?.user) {
                    void loadAccess(session.user.id);
                } else {
                    setIsOnboarded(null);
                    setAwarenessTokens(null);
                }
            });

            const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
                setUser(session?.user || null);
                if (session?.user) {
                    void loadAccess(session.user.id);
                } else {
                    setSubInfo(null);
                    setIsOnboarded(null);
                    setAwarenessTokens(null);
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
            logger.error("Failed to query the Oracle:", error);
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
        await signInWithGoogleAtPath('/dawayir');
    };

    const handleSave = async () => {
        if (!user) {
            setShowPaywall(true);
            return;
        }
        await saveMap("خريطة التقييم الأولي");
    };
    const shouldBlockForGenesis = Boolean(user && isOnboarded === false);
    const isOnboardingStateLoading = Boolean(user && isOnboarded === null);
    const tokenDisplay = typeof awarenessTokens === 'number' ? Math.max(awarenessTokens, 0) : null;
    const tokenToneClass = tokenDisplay === null
        ? 'bg-white/5 border-white/10 text-slate-300'
        : tokenDisplay <= 20
            ? 'bg-rose-500/15 border-rose-400/40 text-rose-200'
            : tokenDisplay <= 40
                ? 'bg-amber-500/15 border-amber-400/40 text-amber-200'
                : 'bg-teal-500/15 border-teal-400/40 text-teal-200';

    return (
        <div
            className="h-screen w-full text-slate-200 font-sans overflow-hidden relative"
            style={{ background: "#020408", colorScheme: "dark" }}
            {...gestureHandlers}
        >
            {/* Sanctuary Overlay — Cinematic Void */}
            <AnimatePresence>
                {isSanctuary && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="absolute inset-0 z-[100] flex flex-col items-center justify-center"
                        style={{ background: "rgba(1,2,7,0.95)", backdropFilter: "blur(28px)" }}
                        onClick={exitSanctuary}
                        dir="rtl"
                    >
                        {/* Ambient teal orb */}
                        <div aria-hidden style={{ position:"absolute", width:480, height:480, borderRadius:"50%", background:"radial-gradient(circle, rgba(45,212,191,0.06) 0%, transparent 65%)", top:"50%", left:"50%", transform:"translate(-50%,-50%)", pointerEvents:"none" }} />

                        <motion.div
                            initial={{ scale: 0.85, opacity: 0, filter: "blur(8px)" }}
                            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                            className="text-center space-y-6 p-8 max-w-xs"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Pulse rings */}
                            <div className="relative flex items-center justify-center mx-auto" style={{ width: 96, height: 96 }}>
                                <motion.div
                                    className="absolute rounded-full"
                                    style={{ width: 96, height: 96, border: "1px solid rgba(45,212,191,0.12)" }}
                                    animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.15, 0.5] }}
                                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                                />
                                <motion.div
                                    className="absolute rounded-full"
                                    style={{ width: 66, height: 66, border: "1px solid rgba(45,212,191,0.22)" }}
                                    animate={{ scale: [1, 1.1, 1], opacity: [0.7, 0.3, 0.7] }}
                                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                                />
                                <div
                                    className="relative z-10 rounded-full flex items-center justify-center"
                                    style={{ width: 42, height: 42, background: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.28)", boxShadow: "0 0 24px rgba(45,212,191,0.18)" }}
                                >
                                    <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: "#2dd4bf", boxShadow: "0 0 14px rgba(45,212,191,0.9)" }} />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h2 className="text-2xl font-black text-white tracking-tight">الكون واقف معاك</h2>
                                <p className="text-sm leading-relaxed font-medium" style={{ color: "rgba(148,163,184,0.65)" }}>
                                    كل حاجة متوقفة دلوقتي. خذ نفسًا وارجع لما تكون جاهز.
                                </p>
                            </div>

                            <button
                                onClick={exitSanctuary}
                                className="text-[11px] font-black uppercase tracking-[0.28em] transition-colors"
                                style={{ color: "rgba(45,212,191,0.4)" }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(45,212,191,0.85)"; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(45,212,191,0.4)"; }}
                            >
                                الضغط للعودة
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cinematic ambient background */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div style={{ position:"absolute", width:700, height:700, borderRadius:"50%", background:"radial-gradient(circle, rgba(20,184,166,0.11) 0%, transparent 70%)", top:"-15%", right:"-8%", animation:"av-orb-drift 38s ease-in-out infinite alternate" }} />
                <div style={{ position:"absolute", width:560, height:560, borderRadius:"50%", background:"radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 70%)", bottom:"-18%", left:"-10%", animation:"av-orb-drift 52s ease-in-out infinite alternate-reverse" }} />
                <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle, rgba(245,158,11,0.055) 0%, transparent 70%)", top:"40%", left:"30%", animation:"av-orb-drift 44s ease-in-out infinite alternate" }} />
                <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.016) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.016) 1px, transparent 1px)", backgroundSize:"68px 68px", WebkitMaskImage:"radial-gradient(ellipse 85% 80% at 50% 50%, black 20%, transparent 100%)", maskImage:"radial-gradient(ellipse 85% 80% at 50% 50%, black 20%, transparent 100%)", opacity:0.55 }} />
            </div>

            {/* Navbar — fixed 60px */}
            <div className="absolute top-0 left-0 w-full h-[60px] px-4 sm:px-6 flex justify-between items-center z-40 pointer-events-auto" style={{ background:"rgba(2,4,8,0.88)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-teal-400" />
                    </div>
                    <h1 className="text-xl font-black text-white tracking-tight">دواير</h1>
                </div>
                <div className="flex items-center gap-4">
                    {user ? (
                        <>
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md ${tokenToneClass}`}>
                                <span className="text-xs font-black font-mono tracking-tight">{`${tokenDisplay ?? '--'}/100 طاقة`}</span>
                            </div>
                            <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                                <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                                <span className="text-xs font-bold text-slate-300 font-mono tracking-tighter uppercase">{user.email?.split('@')[0]}</span>
                            </div>
                        </>
                    ) : (
                        <button onClick={handleGoogleLogin} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2 backdrop-blur-sm">
                            <span className="tracking-wide">تسجيل الدخول</span> <ArrowLeft className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Content area — below navbar */}
            <div className="w-full flex flex-col overflow-hidden relative" style={{ height:"calc(100vh - 60px)", marginTop:"60px" }}>
                {shouldBlockForGenesis && user?.id && (
                    <GenesisOnboarding
                        userId={user.id}
                        onCompleted={() => {
                            setIsOnboarded(true);
                            console.info("[GenesisFlow] guard_released", { userId: user.id });
                        }}
                    />
                )}

                {/* Error Handling */}
                {!shouldBlockForGenesis && !isOnboardingStateLoading && error && (
                    <div className="mb-6 px-4 py-3 bg-red-50 text-red-600 rounded-lg shadow-sm border border-red-100 text-sm max-w-md text-center">
                        {error}
                    </div>
                )}
                {!shouldBlockForGenesis && isOnboardingStateLoading && (
                    <div className="px-5 py-3 rounded-2xl" style={{ background:"rgba(6,10,22,0.8)", border:"1px solid rgba(255,255,255,0.08)" }}>
                        <span className="text-xs text-slate-400 tracking-wide">جاري تجهيز ملفك الشخصي...</span>
                    </div>
                )}

                {/* Phase 1: The Chat Hook */}
                {!shouldBlockForGenesis && !isOnboardingStateLoading && !data && (
                    <div className="flex-1 w-full flex items-center justify-center px-4 py-8 animate-in fade-in zoom-in duration-500 relative z-10">
                        <div className="w-full max-w-xl">
                            <div className="text-center mb-6">
                                {sourceStory === 'story-1' ? (
                                    <>
                                        <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
                                            مرحباً بك في مساحة السيادة
                                        </h2>
                                        <p className="font-medium max-w-lg mx-auto" style={{ color:"#8faab8" }}>
                                            استلهاماً من رحلة استعادة السيطرة، دعنا نرصد مواطن النزيف في مجالك...
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-5" style={{ borderColor:"rgba(20,184,166,0.3)", background:"rgba(20,184,166,0.08)", color:"#5eead4" }}>
                                            <Zap className="w-3 h-3" />
                                            <span className="text-[10px] font-black tracking-[0.18em] uppercase">تشخيص سريع</span>
                                        </div>
                                        <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">اكتشف ثغرات طاقتك في 60 ثانية</h2>
                                        <p className="font-medium" style={{ color:"#8faab8" }}>خذ وقتك. لا توجد إجابة صح أو غلط.</p>
                                    </>
                                )}
                            </div>
                            <div className="rounded-[2rem] p-1 relative group overflow-hidden" style={{ border:"1px solid rgba(255,255,255,0.09)", background:"rgba(8,12,22,0.88)", backdropFilter:"blur(28px)" }}>
                                <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-500/25 to-transparent top-0 animate-scan" />
                                <ChatInterface
                                    onAnalyze={(answers) => analyzeAnswers(answers, subInfo?.features.maxMapNodes || 7)}
                                    isLoading={isLoading}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Phase 2: The Canvas (Aha Moment) */}
                {!shouldBlockForGenesis && !isOnboardingStateLoading && data && (
                    <div className="w-full h-full flex flex-col relative animate-in slide-in-from-bottom-8 fade-in duration-700">

                        {/* Insight Card — dark glass */}
                        <div className="absolute z-20 top-4 left-1/2 -translate-x-1/2 max-w-2xl w-[calc(100%-2rem)] shadow-2xl overflow-hidden rounded-2xl" style={{ background:"rgba(6,10,22,0.88)", border:"1px solid rgba(20,184,166,0.2)", backdropFilter:"blur(24px)" }}>
                            <div className="absolute top-0 left-0 w-1 h-full bg-teal-500/40" />
                            <div className="absolute top-0 right-0 w-1 h-full bg-teal-500/40" />
                            <div className="flex items-start gap-4 text-right px-6 py-4" dir="rtl">
                                <Activity className="w-5 h-5 text-teal-400 mt-1 shrink-0 animate-pulse" />
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black tracking-[0.12em] block mb-1" style={{ color:"#5eead4" }}>تم استخلاص البصيرة</span>
                                    <p className="text-white font-bold leading-relaxed text-sm">
                                        <Typewriter text={data.insight_message} speed={40} />
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Tactical HUD Left — dark glass */}
                        <div className="absolute z-20 left-4 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-4">
                            <div className="p-4 space-y-4 w-44 rounded-2xl" style={{ background:"rgba(6,10,22,0.82)", border:"1px solid rgba(255,255,255,0.07)", backdropFilter:"blur(20px)" }}>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black text-slate-500 tracking-wide">مستوى التشتت</span>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: "65%" }}
                                            className="h-full bg-rose-500/50"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                                        <span className="text-[9px] block text-slate-500">نقاط الرصد</span>
                                        <span className="text-sm font-black text-white font-mono">{data.nodes.length}</span>
                                    </div>
                                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                                        <span className="text-[9px] block text-slate-500">الروابط الحية</span>
                                        <span className="text-sm font-black text-white font-mono">{data.edges.length}</span>
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-white/5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] text-slate-500">حالة القراءة</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                                    </div>
                                    <span className="text-[10px] font-bold text-teal-400">مستقرة</span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full h-full overflow-hidden relative">
                            <CanvasComponent
                                data={data}
                                onNodeClick={(node) => {
                                    setFocusedNode(node);
                                }}
                                pendingNodeUpdate={pendingNodeUpdate}
                            />

                            {/* Phase 3: The AI Facilitator (Glass-morphic Chat) */}
                            {focusedNode && (
                                <>
                                    <button
                                        type="button"
                                        aria-label="إغلاق الشات والعودة للخريطة"
                                        onClick={() => setFocusedNode(null)}
                                        className="md:hidden absolute inset-0 z-30 bg-slate-950/35 backdrop-blur-[1px]"
                                    />
                                    <FacilitatorChat
                                        focusedNode={focusedNode}
                                        fullMap={data}
                                        onClose={() => setFocusedNode(null)}
                                        onUpdateNode={handleUpdateNode}
                                        onTokenBalanceChange={setAwarenessTokens}
                                    />
                                </>
                            )}

                            {/* Action Overlay */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col md:flex-row gap-4">
                                {(!data.id) && (
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <button
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="px-6 py-3 bg-teal-500 text-slate-950 rounded-xl shadow-lg shadow-teal-500/20 hover:bg-teal-400 transition-all duration-300 font-black text-xs flex items-center justify-center gap-2 uppercase tracking-widest"
                                        >
                                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            {isSaving ? 'جاري حفظ الخريطة...' : 'حفظ الخريطة'}
                                        </button>

                                        {data?.detected_symptoms && data.detected_symptoms.length > 0 && (
                                            <button
                                                onClick={() => setShowSimulation(true)}
                                                className="px-6 py-3 bg-[var(--soft-teal)]/20 border border-[var(--soft-teal)] text-[var(--soft-teal)] rounded-xl shadow-lg hover:bg-[var(--soft-teal)]/20 transition-all duration-300 font-black text-xs flex items-center justify-center gap-2 uppercase tracking-widest group"
                                            >
                                                <Brain className="w-4 h-4 group-hover:animate-pulse" />
                                                ابدأ تدريبك الآن
                                            </button>
                                        )}
                                    </div>
                                )}
                                {(data.id && hasActiveCoach) && (
                                    <button
                                        onClick={handleShareWithCoach}
                                        disabled={isSharing || isShared}
                                        className={`px-6 py-3 border rounded-xl shadow-lg transition-all duration-300 font-black text-xs flex items-center justify-center gap-2 uppercase tracking-widest
                                            ${isShared
                                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 cursor-default'
                                                : 'bg-[var(--soft-teal)]/10 text-[var(--soft-teal)] border-[var(--soft-teal)] hover:bg-[var(--soft-teal)]/20'}`}
                                    >
                                        {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : (isShared ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />)}
                                        {isSharing ? 'جاري الرفع...' : (isShared ? 'تمت المشاركة' : 'مشاركة مع الكوتش')}
                                    </button>
                                )}
                                {/* Personal Oracle Control (Proactive AI) */}
                                {user && data.id && (
                                    <button
                                        onClick={handleCallOracle}
                                        disabled={isOracleLoading}
                                        className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl shadow-md hover:bg-white/10 transition-all duration-300 font-black text-xs flex items-center justify-center gap-2 uppercase tracking-widest"
                                    >
                                        {isOracleLoading ? "جاري التحليل..." : "تحليل الطاقة"}
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
                        <div className="p-8 max-w-md w-full relative text-center rounded-3xl" style={{ background:"rgba(6,10,22,0.92)", border:"1px solid rgba(20,184,166,0.2)", backdropFilter:"blur(32px)" }}>
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
                                <div className="text-[10px] text-slate-500 tracking-[0.08em]">خطة الوصول: ٩ دولار/شهريًا</div>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Oracle Loading Overlay */}
            {isOracleLoading && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4 animate-in fade-in duration-200" dir="rtl">
                    <div className="p-10 max-w-sm w-full flex flex-col items-center justify-center text-center rounded-3xl" style={{ background:"rgba(6,10,22,0.92)", border:"1px solid rgba(20,184,166,0.25)", backdropFilter:"blur(32px)" }}>
                        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-8 relative">
                            <div className="absolute inset-0 bg-teal-500/20 rounded-full animate-ping opacity-30"></div>
                            <div className="absolute inset-0 border-2 border-teal-500/20 rounded-full animate-spin duration-[3s]" />
                            <Sparkles className="w-12 h-12 text-teal-400 animate-pulse" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-3 tracking-tight">جاري تحليل المسار</h3>
                        <p className="text-slate-400 text-sm leading-relaxed font-medium">نقوم بمعالجة خرائط وعيك التاريخية واستخراج المؤشرات التنبؤية، لحظات من فضلك.</p>
                    </div>
                </div>
            )}

            {/* Predictive Oracle Modal (Smart Notifications) */}
            {showOracleModal && oraclePrediction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-in fade-in duration-200" dir="rtl">
                    <div className="p-8 max-w-lg w-full relative overflow-hidden rounded-3xl" style={{ background:"rgba(6,10,22,0.92)", border:"1px solid rgba(20,184,166,0.2)", backdropFilter:"blur(32px)" }}>

                        {/* Status Header based on Calibration */}
                        {oraclePrediction.needsMoreData ? (
                            <div className="mb-8 flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-white/5 border border-white/10 text-slate-400 rounded-2xl flex items-center justify-center mb-6"><Clock className="w-10 h-10" /></div>
                                <h2 className="text-2xl font-black text-white mb-3 tracking-tight">البيانات غير مكتملة</h2>
                                <p className="text-slate-400 font-medium">{oraclePrediction.error}</p>
                            </div>
                        ) : oraclePrediction.burnout_probability > 60 ? (
                            <div className="mb-8 flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-2xl flex items-center justify-center mb-6 animate-pulse"><AlertCircle className="w-10 h-10" /></div>
                                <h2 className="text-2xl font-black text-rose-400 mb-3 tracking-tight">احتمالية الإرهاق: {oraclePrediction.burnout_probability}%</h2>
                                <div className="p-5 bg-rose-500/5 rounded-2xl border border-rose-500/20 mb-6 text-right w-full">
                                    <p className="text-rose-200/80 text-sm leading-[1.8] font-bold">{oraclePrediction.trajectory_summary}</p>
                                </div>
                                <div className="w-full text-right p-6 rounded-2xl shadow-inner" style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)" }}>
                                    <h4 className="font-black text-teal-400 mb-3 flex items-center gap-2 text-xs uppercase tracking-widest font-mono">
                                        <Terminal className="w-4 h-4" /> خطوة وقائية:
                                    </h4>
                                    <p className="text-slate-200 text-sm leading-relaxed font-medium">{oraclePrediction.preventative_action}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="mb-8 flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-2xl flex items-center justify-center mb-6"><Heart className="w-10 h-10" /></div>
                                <h2 className="text-2xl font-black text-emerald-400 mb-3 tracking-tight">الوضع مستقر: {oraclePrediction.burnout_probability}%</h2>
                                <div className="p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 mb-6 text-right w-full">
                                    <p className="text-emerald-200/80 text-sm leading-[1.8] font-bold">{oraclePrediction.trajectory_summary}</p>
                                </div>
                            </div>
                        )
                        }

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowOracleModal(false)}
                                className="flex-1 py-4 bg-white/5 border border-white/10 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white/10 transition-all font-mono"
                            >
                                إغلاق
                            </button>
                            {hasActiveCoach && oraclePrediction?.burnout_probability > 60 && (
                                <button
                                    onClick={handleNotifyCoach}
                                    disabled={isSharing}
                                    className="flex-1 py-4 bg-rose-500 text-slate-950 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-rose-400 transition-all flex items-center justify-center gap-2"
                                >
                                    {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                                    إخطار الكوتش
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )
            }

            {/* Tactical Training Simulation Overlay */}
            {
                showSimulation && data?.detected_symptoms && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4 animate-in fade-in duration-300" dir="rtl">
                        <div className="max-w-2xl w-full relative overflow-hidden rounded-3xl" style={{ background:"rgba(6,10,22,0.92)", border:"1px solid rgba(20,184,166,0.3)", backdropFilter:"blur(32px)", boxShadow:"0 0 40px rgba(20,184,166,0.12)" }}>
                            <SymptomSimulation
                                detectedSymptoms={data.detected_symptoms}
                                onClose={() => setShowSimulation(false)}
                                onComplete={(score) => {
                                    console.warn("Training complete with score:", score);
                                    // Could update user stats or meta-data here
                                }}
                            />
                        </div>
                    </div>
                )
            }
        </div >
    );
}


