import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Globe, Briefcase, Crown, ChevronRight,
    Zap, Star, Gift
} from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { B2BPortal } from "./B2BPortal";
import { ReferralPanel } from "./ReferralPanel";
import { PaywallGate } from "./PaywallGate";
import { DemoInjector } from "./dev/DemoInjector";
import { getCurrentTier, TIER_LABELS, TIER_PRICES } from "../services/subscriptionManager";
import { loadStreak } from "../services/streakSystem";
import { loadUserMemory } from "../services/userMemory";
import { getLanguage, LANGUAGE_OPTIONS } from "../services/i18n";
import { getCulturalContext, saveCulturalContext, PROFILES, type CulturalContext } from "../services/culturalAdapter";
import { Brain, ExternalLink } from "lucide-react";
import { stripeService } from "../services/stripeIntegration";
import { supabase } from "../services/supabaseClient";
import { syncSubscription } from "../services/subscriptionManager";

/* 
   SETTINGS SCREEN  شاشة اإعدادات
   رز اتح اشخص
    */

type SettingsSection = "main" | "language" | "b2b" | "referral" | "subscription" | "culture";

interface SettingsScreenProps {
    onClose?: () => void;
}

export const SettingsScreen: FC<SettingsScreenProps> = ({ onClose }) => {
    const [section, setSection] = useState<SettingsSection>("main");
    const [showPaywall, setShowPaywall] = useState(false);

    useEffect(() => {
        syncSubscription();
    }, []);

    const tier = getCurrentTier();
    const streak = loadStreak();
    const memory = loadUserMemory();

    const menuItems = [
        {
            id: "subscription" as SettingsSection,
            icon: Crown,
            label: "ااشترا",
            value: TIER_LABELS[tier],
            color: tier === "basic" ? "#64748b" : "#d97706",
            badge: tier === "basic" ? "ار" : undefined,
        },
        {
            id: "referral" as SettingsSection,
            icon: Gift,
            label: "ادعُ ائدا",
            value: "أسبع جا  إحاة",
            color: "#818cf8",
        },
        {
            id: "language" as SettingsSection,
            icon: Globe,
            label: "اغة",
            value: LANGUAGE_OPTIONS.find(o => o.code === getLanguage())?.label ?? "اعربة",
            color: "#34d399",
        },
        {
            id: "culture" as SettingsSection,
            icon: Brain,
            label: "اف اثاف",
            value: getCulturalContext() === "arabic_family" ? "عائ عرب" : "د",
            color: "#fb7185",
        },
        {
            id: "b2b" as SettingsSection,
            icon: Briefcase,
            label: "بابة احترف",
            value: "تشات اعاج",
            color: "#60a5fa",
        },
    ];

    return (
        <div
            className="min-h-screen"
            style={{ background: "linear-gradient(160deg, #0a0f1e 0%, #0f172a 100%)" }}
            dir="rtl"
        >
            {/* Header */}
            <div className="sticky top-0 z-10 px-4 pt-safe-top pb-3 flex items-center justify-between"
                style={{ background: "rgba(10,15,30,0.9)", backdropFilter: "blur(12px)" }}>
                <AnimatePresence mode="wait">
                    {section !== "main" ? (
                        <motion.button
                            key="back"
                            onClick={() => setSection("main")}
                            className="flex items-center gap-1.5 text-slate-400 text-sm hover:text-white transition-colors"
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                        >
                            رجع
                        </motion.button>
                    ) : (
                        <motion.h1
                            key="title"
                            className="text-lg font-black text-white"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            اإعدادات
                        </motion.h1>
                    )}
                </AnimatePresence>
                {onClose && (
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-sm">
                        إغا
                    </button>
                )}
            </div>

            <div className="px-4 pb-8">
                <AnimatePresence mode="wait">

                    {/* Main menu */}
                    {section === "main" && (
                        <motion.div
                            key="main"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                        >
                            {/* Profile card */}
                            <div className="rounded-2xl p-4 mb-5 mt-2"
                                style={{
                                    background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(124,58,237,0.08))",
                                    border: "1px solid rgba(99,102,241,0.2)",
                                }}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white font-bold">
                                            {memory.preferredName ? `ا ${memory.preferredName}` : "ا ائد"}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {memory.totalSessions} جسة  {streak.currentStreak}  streak
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500">اباة احاة</p>
                                        <p className="text-sm font-bold" style={{ color: tier === "basic" ? "#64748b" : "#d97706" }}>
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
                                        whileHover={{ background: "rgba(255,255,255,0.06)" }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                            style={{ background: `${item.color}18` }}>
                                            <item.icon className="w-4.5 h-4.5" style={{ color: item.color }} />
                                        </div>
                                        <div className="flex-1 text-right">
                                            <p className="text-sm font-bold text-white">{item.label}</p>
                                            <p className="text-xs text-slate-500">{item.value}</p>
                                        </div>
                                        {item.badge && (
                                            <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                                                style={{ background: "rgba(217,119,6,0.2)", color: "#d97706" }}>
                                                {item.badge}
                                            </span>
                                        )}
                                        <ChevronRight className="w-4 h-4 text-slate-600 rotate-180" />
                                    </motion.button>
                                ))}
                            </div>

                            {/* Admin/Investor Tools */}
                            <DemoInjector />

                            {/* App info */}
                            <div className="mt-6 text-center">
                                <p className="text-xs text-slate-600">دار v2.0  عة ار </p>
                                <p className="text-xs text-slate-700 mt-0.5">ب ب ❤️ عا اعرب</p>
                            </div>
                        </motion.div>
                    )}

                    {/* Language section */}
                    {section === "language" && (
                        <motion.div
                            key="language"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="mt-4"
                        >
                            <h2 className="text-base font-bold text-white mb-1">اختر اغة</h2>
                            <p className="text-xs text-slate-500 mb-4">ست إعادة تح اتطب تطب اتغر</p>
                            <LanguageSwitcher onLanguageChange={() => { }} />
                        </motion.div>
                    )}

                    {/* B2B section */}
                    {section === "b2b" && (
                        <motion.div
                            key="b2b"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="mt-4"
                        >
                            <B2BPortal />
                        </motion.div>
                    )}

                    {/* Referral section */}
                    {section === "referral" && (
                        <motion.div
                            key="referral"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="mt-4"
                        >
                            <ReferralPanel />
                        </motion.div>
                    )}

                    {/* Subscription section */}
                    {section === "subscription" && (
                        <motion.div
                            key="subscription"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="mt-4"
                        >
                            <h2 className="text-base font-bold text-white mb-4">بات احاة</h2>

                            {/* Current tier */}
                            <div className="rounded-2xl p-4 mb-4"
                                style={{
                                    background: "rgba(99,102,241,0.1)",
                                    border: "1px solid rgba(99,102,241,0.2)",
                                }}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-400">اباة احاة</p>
                                        <p className="text-lg font-black text-white mt-0.5">{TIER_LABELS[tier]}</p>
                                    </div>
                                    <p className="text-2xl font-black text-[var(--soft-teal)]">{TIER_PRICES[tier]}</p>
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
                                    ار اآ
                                </motion.button>
                            )}

                            {tier !== "basic" && (
                                <div className="space-y-4">
                                    <div className="text-center py-4">
                                        <Star className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                                        <p className="text-sm text-slate-300">أت شتر شط ️</p>
                                        <p className="text-xs text-slate-500 mt-1">شرا دع صة</p>
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
                                        className="w-full py-3 rounded-xl border border-slate-700 text-slate-300 text-sm font-bold flex items-center justify-center gap-2 hover:bg-white/5 transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        إدارة ااشترا (افاتر)
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Culture section */}
                    {section === "culture" && (
                        <motion.div
                            key="culture"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="mt-4"
                        >
                            <h2 className="text-base font-bold text-white mb-1">اسا اثاف جارفس</h2>
                            <p className="text-xs text-slate-500 mb-4">ؤثر ذا اخار ع برة اصطحات اختارات اذاء ااصطاع تاسب بئت.</p>

                            <div className="space-y-2">
                                {(Object.keys(PROFILES) as CulturalContext[]).map((ctx) => (
                                    <button
                                        key={ctx}
                                        onClick={() => {
                                            saveCulturalContext(ctx);
                                            setSection("main");
                                        }}
                                        className="w-full flex items-center justify-between p-4 rounded-2xl text-right transition-all"
                                        style={{
                                            background: getCulturalContext() === ctx ? "rgba(251,113,133,0.1)" : "rgba(255,255,255,0.03)",
                                            border: `1px solid ${getCulturalContext() === ctx ? "rgba(251,113,133,0.3)" : "rgba(255,255,255,0.07)"}`,
                                        }}
                                    >
                                        <div className="flex-1 text-right">
                                            <p className="text-sm font-bold text-white">
                                                {ctx === "arabic_family" ? "اعائة اعربة" :
                                                    ctx === "gulf" ? "اسا اخج" :
                                                        ctx === "western" ? "Western (Individualistic)" : "عا / Universal"}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5">{PROFILES[ctx].suggestedTone}</p>
                                        </div>
                                        {getCulturalContext() === ctx && (
                                            <span className="w-2 h-2 rounded-full bg-rose-400 mr-2" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>

            {/* Paywall */}
            <AnimatePresence>
                {showPaywall && (
                    <PaywallGate
                        reason="ai_limit"
                        onClose={() => setShowPaywall(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};


