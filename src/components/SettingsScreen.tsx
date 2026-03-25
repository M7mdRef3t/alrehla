import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Globe, Briefcase, Crown, ChevronRight,
    Zap, Star, Gift, Brain, ExternalLink, Shield
} from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { B2BPortal } from "./B2BPortal";
import { ReferralPanel } from "./ReferralPanel";
import { PaywallGate } from "./PaywallGate";
import { DemoInjector } from "./dev/DemoInjector";
import { PrivacySecuritySettings } from "./PrivacySecuritySettings";
import { getCurrentTier, TIER_LABELS, TIER_PRICES } from "../services/subscriptionManager";
import { loadStreak } from "../services/streakSystem";
import { loadUserMemory } from "../services/userMemory";
import { getLanguage, LANGUAGE_OPTIONS } from "../services/i18n";
import { getCulturalContext, saveCulturalContext, PROFILES, type CulturalContext } from "../services/culturalAdapter";
import { stripeService } from "../services/stripeIntegration";
import { supabase } from "../services/supabaseClient";
import { syncSubscription } from "../services/subscriptionManager";

type SettingsSection = "main" | "language" | "b2b" | "referral" | "subscription" | "culture" | "privacy";

interface SettingsScreenProps {
    onClose?: () => void;
}

export const SettingsScreen: FC<SettingsScreenProps> = ({ onClose }) => {
    const [section, setSection] = useState<SettingsSection>("main");
    const [showPaywall, setShowPaywall] = useState(false);

    useEffect(() => { syncSubscription(); }, []);

    const tier = getCurrentTier();
    const streak = loadStreak();
    const memory = loadUserMemory();

    const menuItems = [
        {
            id: "subscription" as SettingsSection,
            icon: Crown,
            label: "الاشتراك",
            value: TIER_LABELS[tier],
            color: tier === "basic" ? "#64748b" : "#d97706",
            badge: tier === "basic" ? "ارقَ" : undefined,
        },
        {
            id: "referral" as SettingsSection,
            icon: Gift,
            label: "ادعُ صديقاً",
            value: "أسبوع مجاني لكل دعوة",
            color: "#818cf8",
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
            className="min-h-screen"
            style={{ background: "linear-gradient(160deg, #0a0f1e 0%, #0f172a 100%)" }}
            dir="rtl"
        >
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
                                            {memory.preferredName ? `مرحباً ${memory.preferredName}` : "مرحباً بك"}
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

                            {/* Menu items */}
                            <div className="space-y-2">
                                {menuItems.map((item) => (
                                    <motion.button
                                        key={item.id}
                                        onClick={() => setSection(item.id)}
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
                                        {item.badge && (
                                            <span
                                                className="px-2 py-0.5 rounded-full text-xs font-bold"
                                                style={{ background: "rgba(217,119,6,0.2)", color: "#d97706" }}
                                            >
                                                {item.badge}
                                            </span>
                                        )}
                                        <ChevronRight className="w-4 h-4 rotate-180" style={{ color: "rgba(255,255,255,0.2)" }} />
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
                                        onClick={async () => {
                                            if (!supabase) return;
                                            const { data: { session } } = await supabase.auth.getSession();
                                            if (!session?.user) return;
                                            const data = await stripeService.createPortalSession({
                                                userId: session.user.id,
                                                returnUrl: window.location.href
                                            });
                                            if (data?.url) window.location.href = data.url;
                                        }}
                                        className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                                        style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)" }}
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        إدارة الاشتراك (الفواتير)
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

                </AnimatePresence>
            </div>

            <AnimatePresence>
                {showPaywall && (
                    <PaywallGate reason="ai_limit" onClose={() => setShowPaywall(false)} />
                )}
            </AnimatePresence>
        </div>
    );
};
