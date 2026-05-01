'use client';

import { logger } from "@/services/logger";
import { analyticsService } from '@/domains/analytics';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatInterface from '@/modules/action/Chat/ChatInterface';
import CanvasComponent from '@/modules/exploration/Canvas/CanvasComponent';
import FacilitatorChat from '@/modules/action/Chat/FacilitatorChat';
import { useDawayirEngine, NodeData } from '@/hooks/useDawayirEngine';
import { Zap as Sparkles, Zap } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { AutomagicEventPopup } from '@/modules/exploration/Map/AutomagicEventPopup';
import { AccessManager, SubscriptionInfo } from '../billing/AccessManager';
import { SymptomSimulation } from '@/modules/action/Chat/SymptomSimulation';
import { useAIOrchestration } from '@/hooks/useAIOrchestration';
import { useGestureSanctuary } from '@/hooks/useGestureSanctuary';
import { GenesisOnboarding } from '@/modules/meta/GenesisOnboarding';
import { signInWithGoogleAtPath } from '@/services/authService';

import { PaywallModal } from './components/PaywallModal';
import { OracleModal, type OraclePrediction } from './components/OracleModal';
import { ActionPlanDrawer } from './components/ActionPlanDrawer';
import { TimelineDrawer } from './components/TimelineDrawer';
import { MapSettingsModal } from './components/MapSettingsModal';

export default function DawayirApp() {
    useAIOrchestration();
    const { isSanctuary, exitSanctuary, gestureHandlers } = useGestureSanctuary();

    const { data, isLoading, isSaving, error, analyzeAnswers, saveMap, loadMap } = useDawayirEngine();
    const [showPaywall, setShowPaywall] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [hasActiveCoach, setHasActiveCoach] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null);
    const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
    const [awarenessTokens, setAwarenessTokens] = useState<number | null>(null);

    // Predictive AI State
    const [isOracleLoading, setIsOracleLoading] = useState(false);
    const [oraclePrediction, setOraclePrediction] = useState<any>(null); 
    const [showOracleModal, setShowOracleModal] = useState(false);
    const [showSimulation, setShowSimulation] = useState(false);
    const [showActionPlan, setShowActionPlan] = useState(false);
    const [showTimeline, setShowTimeline] = useState(false);
    const [showMapSettings, setShowMapSettings] = useState(false);
    const [mapSettings, setMapSettings] = useState({
        showGrid: true,
        showLabels: true,
    });

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
        if (typeof window !== 'undefined') {
            const searchParams = new URLSearchParams(window.location.search);
            // ... source logic
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get('surface') === 'weather-funnel') {
            const weatherContextRaw = window.sessionStorage.getItem('weather_context');
            if (weatherContextRaw) {
                try {
                    const weatherCtx = JSON.parse(weatherContextRaw);
                    if (weatherCtx && weatherCtx.weatherLevel) {
                        window.sessionStorage.removeItem('weather_context');
                        
                        const patternLine = weatherCtx.patternName
                            ? `النمط السلوكي المكتشف: "${weatherCtx.patternName}" — ${weatherCtx.patternDescription || ''}`
                            : `مستوى الاستنزاف: ${weatherCtx.overallHeadline}`;
                        
                        const costLine = weatherCtx.weeklyHoursCost
                            ? `الثمن الأسبوعي: ~${weatherCtx.weeklyHoursCost} ساعة طاقة ذهنية تذهب لـ${weatherCtx.drainZoneName || weatherCtx.dominantSource}`
                            : `مصدر الاستنزاف الرئيسي: ${weatherCtx.dominantSource}`;

                        const insightLine = weatherCtx.coreInsight || weatherCtx.behavioralExplanation || '';

                        const aiAnswers = [
                            `الدائرة المستنزفة: ${weatherCtx.drainZoneName || weatherCtx.dominantSource}`,
                            patternLine,
                            costLine,
                            insightLine ? `التشخيص الجذري: ${insightLine}` : '',
                        ].filter(Boolean);
                        
                        analyzeAnswers(aiAnswers, subInfo?.features.maxMapNodes || 7);

                        analyticsService.track('weather_bridge_landed', {
                            status: 'success',
                            level: weatherCtx.weatherLevel,
                            pattern: weatherCtx.patternName,
                            zone: weatherCtx.drainZoneName || weatherCtx.dominantSource,
                            client_event_id: weatherCtx.client_event_id
                        });
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
                await loadMap(userId);
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
        } finally {
            setIsOracleLoading(false);
        }
    };

    const handleNotifyCoach = async () => {
        if (!user || !oraclePrediction || !supabase) return;

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
        await saveMap(user.id, "خريطة التقييم الأولي");
    };
    const shouldBlockForGenesis = Boolean(user && isOnboarded === false);
    const isOnboardingStateLoading = Boolean(user && isOnboarded === null);

    return (
        <div
            className="h-[100dvh] w-full text-slate-200 font-sans overflow-hidden relative"
            style={{ background: "#020408", colorScheme: "dark" }}
            {...gestureHandlers}
        >
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
                        <div aria-hidden style={{ position:"absolute", width:480, height:480, borderRadius:"50%", background:"radial-gradient(circle, rgba(45,212,191,0.06) 0%, transparent 65%)", top:"50%", left:"50%", transform:"translate(-50%,-50%)", pointerEvents:"none" }} />
                        <motion.div
                            initial={{ scale: 0.85, opacity: 0, filter: "blur(8px)" }}
                            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                            className="text-center space-y-6 p-8 max-w-xs"
                            onClick={(e) => e.stopPropagation()}
                        >
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

            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div style={{ position:"absolute", width:700, height:700, borderRadius:"50%", background:"radial-gradient(circle, rgba(20,184,166,0.11) 0%, transparent 70%)", top:"-15%", right:"-8%", animation:"av-orb-drift 38s ease-in-out infinite alternate" }} />
                <div style={{ position:"absolute", width:560, height:560, borderRadius:"50%", background:"radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 70%)", bottom:"-18%", left:"-10%", animation:"av-orb-drift 52s ease-in-out infinite alternate-reverse" }} />
                <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle, rgba(245,158,11,0.055) 0%, transparent 70%)", top:"40%", left:"30%", animation:"av-orb-drift 44s ease-in-out infinite alternate" }} />
                <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.016) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.016) 1px, transparent 1px)", backgroundSize:"68px 68px", WebkitMaskImage:"radial-gradient(ellipse 85% 80% at 50% 50%, black 20%, transparent 100%)", maskImage:"radial-gradient(ellipse 85% 80% at 50% 50%, black 20%, transparent 100%)", opacity:0.55 }} />
            </div>

            <div className="w-full h-full flex flex-col overflow-hidden relative">
                {shouldBlockForGenesis && user?.id && (
                    <GenesisOnboarding
                        userId={user.id}
                        onCompleted={() => {
                            setIsOnboarded(true);
                        }}
                    />
                )}

                {!shouldBlockForGenesis && !isOnboardingStateLoading && !data && (
                    <div className="flex-1 w-full flex items-center justify-center px-4 py-8 animate-in fade-in zoom-in duration-500 relative z-10">
                        <div className="w-full max-w-xl">
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-5" style={{ borderColor:"rgba(20,184,166,0.3)", background:"rgba(20,184,166,0.08)", color:"#5eead4" }}>
                                    <Zap className="w-3 h-3" />
                                    <span className="text-[10px] font-black tracking-[0.18em] uppercase">تشخيص سريع</span>
                                </div>
                                <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">اكتشف ثغرات طاقتك في 60 ثانية</h2>
                                <p className="font-medium" style={{ color:"#8faab8" }}>خذ وقتك. لا توجد إجابة صح أو غلط.</p>
                            </div>
                            <div className="rounded-[2rem] p-1 relative group overflow-hidden" style={{ border:"1px solid rgba(255,255,255,0.09)", background:"rgba(8,12,22,0.88)", backdropFilter:"blur(28px)" }}>
                                <ChatInterface
                                    onAnalyze={(answers) => analyzeAnswers(answers, subInfo?.features.maxMapNodes || 7)}
                                    isLoading={isLoading}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {!shouldBlockForGenesis && !isOnboardingStateLoading && data && (
                    <div className="w-full h-full flex flex-col relative animate-in slide-in-from-bottom-8 fade-in duration-700">
                        <div className="w-full h-full overflow-hidden relative z-0">
                            <CanvasComponent
                                data={data}
                                onNodeClick={(node) => {
                                    setFocusedNode(node);
                                }}
                                pendingNodeUpdate={pendingNodeUpdate}
                                settings={mapSettings}
                            />
                        </div>

                        <div className="absolute inset-0 pointer-events-none z-50">
                            <div className="absolute bottom-10 left-10 pointer-events-auto px-5 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3">
                                <div className="w-6 h-6 rounded-lg bg-teal-500/20 flex items-center justify-center">
                                    <Zap size={14} className="text-teal-400" />
                                </div>
                                <span className="text-[11px] font-bold text-slate-300" dir="rtl">اسحب أي شخص لتغيير موقعه في الخريطة</span>
                            </div>
                        </div>
                            {/* Phase 3: The AI Facilitator */}
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

                        {/* Automagic Event Notification Popup */}
                        <AutomagicEventPopup />

                        {/* Action Plan Drawer */}
                        {data && (
                            <ActionPlanDrawer
                                isOpen={showActionPlan}
                                onClose={() => setShowActionPlan(false)}
                                insightMessage={data.insight_message || ''}
                                nodes={data.nodes}
                            />
                        )}

                        {/* Timeline Drawer */}
                        <TimelineDrawer
                            isOpen={showTimeline}
                            onClose={() => setShowTimeline(false)}
                            userId={user?.id || null}
                        />

                        <MapSettingsModal
                            isOpen={showMapSettings}
                            onClose={() => setShowMapSettings(false)}
                            settings={mapSettings}
                            onUpdateSettings={setMapSettings}
                            onResetMap={() => {
                                window.location.reload();
                            }}
                        />

                    </div>
                )}

                {/* Phase 3: The Paywall Modal (Minimalist) */}
                {showPaywall && (
                    <PaywallModal 
                        onClose={() => setShowPaywall(false)} 
                        onGoogleLogin={handleGoogleLogin} 
                    />
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
                <OracleModal 
                    prediction={oraclePrediction}
                    hasActiveCoach={hasActiveCoach}
                    isSharing={isSharing}
                    onClose={() => setShowOracleModal(false)}
                    onNotifyCoach={handleNotifyCoach}
                />
            )}

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
                                }}
                            />
                        </div>
                    </div>
                )
            }
        </div >
    );
}


