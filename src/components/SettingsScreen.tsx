import type { FC, CSSProperties, MouseEvent } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Globe, Briefcase, Crown, ChevronRight,
    Zap, Star, Gift, Brain, Shield, Palette
} from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { B2BPortal } from "./B2BPortal";
import { ReferralPanel } from "./ReferralPanel";
import { PaywallGate } from "./PaywallGate";
import { DemoInjector } from "./dev/DemoInjector";
import { PrivacySecuritySettings } from "./PrivacySecuritySettings";
import { ProfileAppearanceSettings } from "./ProfileAppearanceSettings";
import { getCurrentTier, TIER_LABELS, TIER_PRICES } from "../services/subscriptionManager";
import { loadStreak } from "../services/streakSystem";
import { loadUserMemory } from "../services/userMemory";
import { getLanguage, LANGUAGE_OPTIONS } from "../services/i18n";
import { getCulturalContext, saveCulturalContext, PROFILES, type CulturalContext } from "../services/culturalAdapter";
import { syncSubscription } from "../services/subscriptionManager";
import { useJourneyState } from "../state/journeyState";
import { resolveDisplayName } from "../services/userMemory";
import { soundManager } from "../services/soundManager";
import { Volume2, VolumeX } from "lucide-react";
import { useAppOverlayState } from "../state/appOverlayState";


type SettingsSection = "main" | "language" | "b2b" | "referral" | "subscription" | "culture" | "privacy" | "appearance";
type ToggleSettingId = "sound" | "sensory";

type BaseMenuItem = {
    icon: FC<{ className?: string; style?: CSSProperties }>;
    label: string;
    value: string;
    color: string;
    badge?: string;
};

type SectionMenuItem = BaseMenuItem & {
    id: SettingsSection;
    isToggle?: false;
};

type ToggleMenuItem = BaseMenuItem & {
    id: ToggleSettingId;
    isToggle: true;
    onAction: (e: MouseEvent) => void;
};

type SettingsMenuItem = SectionMenuItem | ToggleMenuItem;

interface SettingsScreenProps {
    onClose?: () => void;
}

export const SettingsScreen: FC<SettingsScreenProps> = ({ onClose }) => {
    const [section, setSection] = useState<SettingsSection>("main");
    const [showPaywall, setShowPaywall] = useState(false);
    const openOverlay = useAppOverlayState((s) => s.openOverlay);

    useEffect(() => { syncSubscription(); }, []);

    const tier = getCurrentTier();
    const streak = loadStreak();
  const memory = loadUserMemory();
  const displayName = resolveDisplayName();
    const { isSoundEnabled, setSoundEnabled, isSensoryDepthEnabled, setSensoryDepthEnabled } = useJourneyState();

    useEffect(() => {
        soundManager.toggle(isSoundEnabled ?? true);
    }, [isSoundEnabled]);

    useEffect(() => {
        soundManager.toggleSensory(isSensoryDepthEnabled ?? true);
    }, [isSensoryDepthEnabled]);

    const handleToggleSound = (e: MouseEvent) => {
        e.stopPropagation();
        const next = !isSoundEnabled;
        setSoundEnabled(next);
        if (next) soundManager.playClick();
    };

    const handleToggleSensory = (e: MouseEvent) => {
        e.stopPropagation();
        const next = !isSensoryDepthEnabled;
        setSensoryDepthEnabled(next);
        if (next) soundManager.playEffect('cosmic_pulse');
    };

    const menuItems: SettingsMenuItem[] = [
        {
            id: "subscription" as SettingsSection,
            icon: Crown,
            label: "الاشتراك",
            value: TIER_LABELS[tier],
            color: tier === "basic" ? "#64748b" : "#d97706",
            badge: tier === "basic" ? "ارقَ" : undefined,
        },
        {
            id: "appearance" as SettingsSection,
            icon: Palette,
            label: "الهوية والمظهر",
            value: "تخصيص الواجهة والملف السيادي",
            color: "#e879f9",
        },
        {
            id: "referral" as SettingsSection,
            icon: Gift,
            label: "ادعُ صديقاً",
            value: "أسبوع مجاني لكل دعوة",
            color: "#818cf8",
        },
        {
            id: "sound",
            icon: isSoundEnabled ? Volume2 : VolumeX,
            label: "المؤثرات الصوتية",
            value: isSoundEnabled ? "مفعّلة" : "صامتة",
            color: isSoundEnabled ? "#f59e0b" : "#64748b",
            isToggle: true,
            onAction: handleToggleSound
        },
        {
            id: "sensory",
            icon: Zap,
            label: "العمق الحسي",
            value: isSensoryDepthEnabled ? "تجربة كاملة" : "أساسية",
            color: isSensoryDepthEnabled ? "#818cf8" : "#64748b",
            isToggle: true,
            onAction: handleToggleSensory
        },
        {
            id: "language" as SettingsSection,
            icon: Globe,
            label: "اللغة",
            value: LANGUAGE_OPTIONS.find(o => o.code === getLanguage())?.label ?? "العربية",
            color: "#34d399",
        },
        {
            id: "culture" as SettingsSection,
            icon: Brain,
            label: "السياق الثقافي",
            value: getCulturalContext() === "arabic_family" ? "عائلة عربية" : "دولي",
            color: "#fb7185",
        },
        {
            id: "b2b" as SettingsSection,
            icon: Briefcase,
            label: "بوابة المؤسسات",
            value: "للشركات والفرق",
            color: "#60a5fa",
        },
        {
            id: "privacy" as SettingsSection,
            icon: Shield,
            label: "الخصوصية والأمان",
            value: "بياناتك · الجلسات · كلمة المرور",
            color: "#14b8a6",
        },
    ];

    return (
        <div
            className="min-h-screen relative overflow-hidden"
            style={{ background: "#060914" }}
            dir="rtl"
        >
            {/* ── Cosmic Sanctuary Background ── */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0" style={{
                    background: [
                        "radial-gradient(ellipse 60% 40% at 20% 15%, rgba(124,58,237,0.1) 0%, transparent 60%)",
                        "radial-gradient(ellipse 50% 35% at 80% 85%, rgba(20,184,166,0.08) 0%, transparent 55%)"
                    ].join(", ")
                }} />
                {/* Starfield */}
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-30">
                    {[...Array(20)].map((_, i) => (
                        <motion.circle
                            key={i}
                            cx={Math.random() * 100}
                            cy={Math.random() * 100}
                            r={Math.random() * 0.2 + 0.1}
                            fill="white"
                            animate={{ opacity: [0.2, 0.8, 0.2] }}
                            transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 5 }}
                        />
                    ))}
                </svg>
            </div>

            <div className="relative z-10 min-h-screen">
            {/* Header */}
            <div
                className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between"
                style={{
                    background: "rgba(10,15,30,0.92)",
                    backdropFilter: "blur(14px)",
                    borderBottom: "1px solid rgba(255,255,255,0.06)"
                }}
            >
                <AnimatePresence mode="wait">
                    {section !== "main" ? (
                        <motion.button
                            key="back"
                            onClick={() => setSection("main")}
                            className="flex items-center gap-1.5 text-sm font-semibold"
                            style={{ color: "rgba(255,255,255,0.5)" }}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                        >
                            ← رجوع
                        </motion.button>
                    ) : (
                        <motion.h1
                            key="title"
                            className="text-lg font-black text-white"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            الإعدادات
                        </motion.h1>
                    )}
                </AnimatePresence>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-sm font-semibold"
                        style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                        إغلاق
                    </button>
                )}
            </div>

            <div className="px-4 pb-10">
                <AnimatePresence mode="wait">

                    {/* ── Main Menu ── */}
                    {section === "main" && (
                        <motion.div
                            key="main"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                        >
                            {/* Profile card */}
                            <div
                                className="rounded-2xl p-4 mb-5 mt-4"
                                style={{
                                    background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(124,58,237,0.08))",
                                    border: "1px solid rgba(99,102,241,0.2)",
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white font-bold">
                                              {displayName ? `مرحباً ${displayName}` : "مرحباً بك"}
                                        </p>
                                        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                                            {memory.totalSessions} جلسة · {streak.currentStreak} يوم متواصل
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>الباقة الحالية</p>
                                        <p
                                            className="text-sm font-bold"
                                            style={{ color: tier === "basic" ? "#64748b" : "#d97706" }}
                                        >
                                            {TIER_LABELS[tier]}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {menuItems.map((item) => (
                                    <motion.button
                                        key={item.id}
                                        onClick={(e) => (item.isToggle ? item.onAction(e) : setSection(item.id))}
                                        className="w-full flex items-center gap-3 p-4 rounded-2xl text-right"
                                        style={{
                                            background: "rgba(255,255,255,0.03)",
                                            border: "1px solid rgba(255,255,255,0.07)",
                                        }}
                                        whileHover={{ opacity: 0.85 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div
                                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                            style={{ background: `${item.color}18` }}
                                        >
                                            {(() => { const Icon = item.icon; return <Icon className="w-4 h-4" style={{ color: item.color }} />; })()}
                                        </div>
                                        <div className="flex-1 text-right">
                                            <p className="text-sm font-bold text-white">{item.label}</p>
                                            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{item.value}</p>
                                        </div>
                                        {item.isToggle ? (
                                            <div 
                                                className={`w-10 h-6 rounded-full p-1 transition-all ${
                                                    item.id === 'sound' 
                                                        ? (isSoundEnabled ? 'bg-amber-500/40' : 'bg-slate-700')
                                                        : (isSensoryDepthEnabled ? 'bg-indigo-500/40' : 'bg-slate-700')
                                                }`}
                                                onClick={item.onAction}
                                            >
                                                <motion.div 
                                                    className="w-4 h-4 rounded-full bg-white shadow-sm"
                                                    animate={{ x: (item.id === 'sound' ? isSoundEnabled : isSensoryDepthEnabled) ? -16 : 0 }}
                                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                />
                                            </div>
                                        ) : (
                                            <>
                                                {item.badge && (
                                                    <span
                                                        className="px-2 py-0.5 rounded-full text-xs font-bold"
                                                        style={{ background: "rgba(217,119,6,0.2)", color: "#d97706" }}
                                                    >
                                                        {item.badge}
                                                    </span>
                                                )}
                                                <ChevronRight className="w-4 h-4 rotate-180" style={{ color: "rgba(255,255,255,0.2)" }} />
                                            </>
                                        )}
                                    </motion.button>
                                ))}
                            </div>

                            <DemoInjector />

                            <div className="mt-8 text-center">
                                <p className="text-xs" style={{ color: "rgba(255,255,255,0.15)" }}>
                                    الرحلة v2.0 · صُنع بـ ❤️ للعالم العربي
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* ── Language ── */}
                    {section === "language" && (
                        <motion.div key="language" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="mt-4">
                            <h2 className="text-base font-bold text-white mb-1">اختر اللغة</h2>
                            <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>ستتغير واجهة التطبيق فوراً</p>
                            <LanguageSwitcher onLanguageChange={() => { }} />
                        </motion.div>
                    )}

                    {/* ── B2B ── */}
                    {section === "b2b" && (
                        <motion.div key="b2b" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="mt-4">
                            <B2BPortal />
                        </motion.div>
                    )}

                    {/* ── Referral ── */}
                    {section === "referral" && (
                        <motion.div key="referral" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="mt-4">
                            <ReferralPanel />
                        </motion.div>
                    )}

                    {/* ── Subscription ── */}
                    {section === "subscription" && (
                        <motion.div key="subscription" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="mt-4">
                            <h2 className="text-base font-bold text-white mb-4">الاشتراك الحالي</h2>

                            <div
                                className="rounded-2xl p-4 mb-4"
                                style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>الباقة الحالية</p>
                                        <p className="text-lg font-black text-white mt-0.5">{TIER_LABELS[tier]}</p>
                                    </div>
                                    <p className="text-2xl font-black" style={{ color: "var(--soft-teal, #34d399)" }}>
                                        {TIER_PRICES[tier]}
                                    </p>
                                </div>
                            </div>

                            {tier === "basic" && (
                                <motion.button
                                    onClick={() => setShowPaywall(true)}
                                    className="w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
                                    style={{ background: "linear-gradient(135deg, #d97706, #b45309)" }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Zap className="w-4 h-4" />
                                    ارقَ للباقة الآن
                                </motion.button>
                            )}

                            {tier !== "basic" && (
                                <div className="space-y-4">
                                    <div className="text-center py-4">
                                        <Star className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                                        <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>أنت مشترك نشط ⚡</p>
                                        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>شكراً لدعمك للمشروع</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            openOverlay("premiumBridge");
                                        }}
                                        className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                                        style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)" }}
                                    >
                                        <Zap className="w-4 h-4" />
                                        إدارة المسار المتقدم
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── Cultural Context ── */}
                    {section === "culture" && (
                        <motion.div key="culture" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="mt-4">
                            <h2 className="text-base font-bold text-white mb-1">السياق الثقافي لجارفيس</h2>
                            <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
                                يؤثر هذا الاختيار على المصطلحات والأمثلة التي يستخدمها الذكاء الاصطناعي لتناسب بيئتك.
                            </p>
                            <div className="space-y-2">
                                {(Object.keys(PROFILES) as CulturalContext[]).map((ctx) => (
                                    <button
                                        key={ctx}
                                        onClick={() => { saveCulturalContext(ctx); setSection("main"); }}
                                        className="w-full flex items-center justify-between p-4 rounded-2xl text-right transition-all"
                                        style={{
                                            background: getCulturalContext() === ctx ? "rgba(251,113,133,0.1)" : "rgba(255,255,255,0.03)",
                                            border: `1px solid ${getCulturalContext() === ctx ? "rgba(251,113,133,0.3)" : "rgba(255,255,255,0.07)"}`,
                                        }}
                                    >
                                        <div className="flex-1 text-right">
                                            <p className="text-sm font-bold text-white">
                                                {ctx === "arabic_family" ? "العائلة العربية" :
                                                    ctx === "gulf" ? "السياق الخليجي" :
                                                        ctx === "western" ? "Western (Individualistic)" : "عالمي / Universal"}
                                            </p>
                                            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                                                {PROFILES[ctx].suggestedTone}
                                            </p>
                                        </div>
                                        {getCulturalContext() === ctx && (
                                            <span className="w-2 h-2 rounded-full bg-rose-400 mr-2 shrink-0" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ── Privacy & Security ── */}
                    {section === "privacy" && (
                        <motion.div key="privacy" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="mt-4">
                            <PrivacySecuritySettings onBack={() => setSection("main")} />
                        </motion.div>
                    )}

                    {/* ── Appearance & Identity ── */}
                    {section === "appearance" && (
                        <motion.div key="appearance" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="mt-4">
                            <ProfileAppearanceSettings />
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>

            <AnimatePresence>
                {showPaywall && (
                    <PaywallGate reason="ai_limit" onClose={() => setShowPaywall(false)} />
                )}
            </AnimatePresence>
        </div>
        </div>
    );
};
