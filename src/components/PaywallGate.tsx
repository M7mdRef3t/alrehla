import type { FC } from "react";
import { motion } from "framer-motion";
import { Crown, Zap, Lock, Check } from "lucide-react";
import {
    TIER_LABELS,
    TIER_PRICES,
    type SubscriptionTier,
} from "../services/subscriptionManager";

import { stripeService } from "../services/stripeIntegration";
import { supabase } from "../services/supabaseClient";

/* ══════════════════════════════════════════
   PAYWALL GATE — بوابة الاشتراك
   تظهر عند الوصول للحد المجاني
   ══════════════════════════════════════════ */

interface PaywallGateProps {
    reason: "ai_limit" | "map_limit" | "pdf" | "training";
    onClose: () => void;
    onUpgrade?: (tier: SubscriptionTier) => void;
}

const REASON_COPY: Record<PaywallGateProps["reason"], { title: string; desc: string }> = {
    ai_limit: {
        title: "وصلت لحد رسائل اليوم",
        desc: "المستخدم المجاني يحصل على 5 رسائل يومياً مع نَواة. ارقَ للبريميوم وتحدث بلا حدود.",
    },
    map_limit: {
        title: "الخريطة وصلت للحد المجاني",
        desc: "يمكنك إضافة 3 أشخاص في الخريطة المجانية. ارقَ للبريميوم وأضف من تشاء.",
    },
    pdf: {
        title: "تصدير PDF — ميزة البريميوم",
        desc: "احفظ تقريرك الكامل كـ PDF. متاح لمستخدمي باقة البريميوم فأعلى.",
    },
    training: {
        title: "التدريب التكتيكي — ميزة البريميوم",
        desc: "محاكاة تفاعلية لتدريب مهارات الحدود. متاح لمستخدمي باقة البريميوم فأعلى.",
    },
};

const PREMIUM_FEATURES = [
    "خريطة لا محدودة",
    "نواة (AI) بلا حدود",
    "تدريب تكتيكي مخصص",
    "تقارير PDF",
    "أولوية الدعم",
];

export const PaywallGate: FC<PaywallGateProps> = ({ reason, onClose, onUpgrade: _onUpgrade }) => {
    const copy = REASON_COPY[reason];

    const handleUpgrade = async (tier: 'premium' | 'coach') => {
        try {
            if (!supabase) return;
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;

            if (!user) {
                // If not logged in, we can't do checkout
                await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: { redirectTo: window.location.origin + '/pricing' }
                });
                return;
            }

            const data = await stripeService.createCheckoutSession({
                userId: user.id,
                tier: tier
            });

            if (data?.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error("Upgrade error:", error);
            alert("حدث خطأ في الانتقال للدفع.");
        }
    };

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            <motion.div
                className="relative w-full max-w-md rounded-t-3xl overflow-hidden"
                style={{
                    background: "linear-gradient(160deg, #0f172a 0%, #1c1040 100%)",
                    border: "1px solid rgba(217,119,6,0.3)",
                    borderBottom: "none",
                }}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                dir="rtl"
            >
                {/* Header */}
                <div className="p-5 pb-3 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
                        <Lock className="w-6 h-6 text-amber-400" />
                    </div>
                    <h2 className="text-lg font-bold text-white leading-tight">{copy.title}</h2>
                    <p className="text-sm text-slate-400 mt-1 leading-[1.8]">{copy.desc}</p>
                </div>

                {/* Premium card */}
                <div className="mx-5 mb-4">
                    <div
                        className="rounded-2xl p-4"
                        style={{
                            background: "linear-gradient(135deg, rgba(217,119,6,0.15), rgba(180,83,9,0.08))",
                            border: "1px solid rgba(217,119,6,0.35)",
                        }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Crown className="w-5 h-5 text-amber-400" />
                                <span className="font-bold text-white">{TIER_LABELS.premium}</span>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-black text-amber-400">{TIER_PRICES.premium}</p>
                            </div>
                        </div>

                        <div className="space-y-1.5 mb-4">
                            {PREMIUM_FEATURES.map((f) => (
                                <div key={f} className="flex items-center gap-2">
                                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    <span className="text-sm text-slate-300">{f}</span>
                                </div>
                            ))}
                        </div>

                        <motion.button
                            onClick={() => handleUpgrade("premium")}
                            className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2"
                            style={{
                                background: "linear-gradient(135deg, #d97706, #b45309)",
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Zap className="w-4 h-4" />
                            ارقَ للبريميوم الآن
                        </motion.button>
                    </div>
                </div>

                {/* Free tier reminder */}
                <div className="px-5 pb-6 text-center">
                    <button
                        onClick={onClose}
                        className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                    >
                        استمر مجاناً (مع الحدود)
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
