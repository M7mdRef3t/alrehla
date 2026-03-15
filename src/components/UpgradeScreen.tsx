import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Sparkles, BrainCircuit, X, Check, Lock, Star, Loader2 } from "lucide-react";
import { useAuthState } from "../state/authState";
import { supabase } from "../services/supabaseClient";
import { syncSubscription, activateSubscription } from "../services/subscriptionManager";
import { useState } from "react";

interface UpgradeScreenProps {
    isOpen: boolean;
    onClose: () => void;
}

export const UpgradeScreen: React.FC<UpgradeScreenProps> = ({ isOpen, onClose }) => {
    const { tier } = useAuthState();
    const [isUpgrading, setIsUpgrading] = useState(false);

    if (!isOpen) return null;

    const handleUpgrade = async () => {
        if (!supabase) {
            // Fallback to local
            activateSubscription('premium', 30);
            setTimeout(() => onClose(), 1500);
            return;
        }

        setIsUpgrading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                // Mock checkout by simply updating the profile to active 
                await supabase.from('profiles').update({
                    subscription_status: 'active',
                    subscription_tier: 'premium',
                    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                }).eq('id', session.user.id);

                await syncSubscription();
            } else {
                // Not logged in, local activation
                activateSubscription('premium', 30);
            }
        } catch (e) {
            console.error("Failed to upgrade:", e);
            activateSubscription('premium', 30); // fallback
        } finally {
            setIsUpgrading(false);
            setTimeout(() => {
                onClose();
            }, 500);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[500px]"
                dir="rtl"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 left-4 z-10 p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-400 rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Left Side: Visuals */}
                <div className="hidden md:flex flex-col justify-center items-center w-5/12 bg-gradient-to-b from-fuchsia-900/40 to-violet-900/40 border-l border-white/5 relative p-8 text-center overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30" />
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-x-0 bottom-0 h-64 bg-fuchsia-500/10 rounded-full blur-3xl -mb-32"
                    />

                    <Star className="w-16 h-16 text-fuchsia-400 mb-6 drop-shadow-[0_0_15px_rgba(232,121,249,0.5)]" />
                    <h2 className="text-3xl font-black text-white mb-4">ارتقِ بوعيك للمستوى الاحترافي</h2>
                    <p className="text-sm text-fuchsia-200 leading-relaxed max-w-xs">
                        احصل على أدوات الذكاء الاصطناعي الكاملة، المعالج النفسي اللحظي، ومحاكيات التطور لحماية مساحاتك بقوة.
                    </p>
                </div>

                {/* Right Side: Pricing Plans */}
                <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
                    <div className="text-center md:text-right mb-8 mt-6">
                        <h3 className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-2 flex items-center justify-center md:justify-start gap-2">
                            <Lock className="w-4 h-4" /> فتح البوابات المغلقة
                        </h3>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-100 mb-2">اختر باقة التطور الخاصة بك</h1>
                        <p className="text-sm text-slate-400">استثمر في صحتك النفسية بأسعار تعادل فنجان قهوة شهرياً.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Basic Plan */}
                        <div className={`p-6 rounded-2xl border ${tier === "free" ? "border-slate-500 bg-slate-800/50" : "border-slate-700 bg-slate-800/20"}`}>
                            <h4 className="text-lg font-bold text-slate-300 mb-1">الأساسي</h4>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-3xl font-black text-white">مجانياً</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-start gap-2 text-sm text-slate-400">
                                    <Check className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                                    <span>تتبع الدوائر الأساسية والمواقف</span>
                                </li>
                                <li className="flex items-start gap-2 text-sm text-slate-400">
                                    <Check className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                                    <span>حساب طاقة النبضات اليومية</span>
                                </li>
                                <li className="flex items-start gap-2 text-sm text-slate-400">
                                    <Check className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                                    <span>رادار مصاصي الطاقة (محدود)</span>
                                </li>
                            </ul>
                            <button
                                disabled
                                className="w-full py-3 bg-slate-700/50 text-slate-400 rounded-xl text-sm font-bold cursor-not-allowed"
                            >
                                {tier === "free" ? "باقتك الحالية" : "العودة للأساسي"}
                            </button>
                        </div>

                        {/* Pro Plan */}
                        <div className={`p-6 rounded-2xl border relative overflow-hidden ${tier === "pro" ? "border-fuchsia-500 bg-fuchsia-500/10 shadow-[0_0_20px_rgba(217,70,239,0.15)]" : "border-fuchsia-500/30 bg-slate-800 border-t-fuchsia-500"}`}>
                            {tier === "pro" && (
                                <div className="absolute top-0 right-0 bg-fuchsia-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                                    المُفعل حالياً
                                </div>
                            )}
                            <h4 className="text-lg font-bold text-fuchsia-400 mb-1 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> برو (Dawayir Pro)
                            </h4>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-3xl font-black text-white">$4.99</span>
                                <span className="text-sm text-slate-400">/ شهرياً</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-start gap-2 text-sm text-slate-300">
                                    <BrainCircuit className="w-4 h-4 text-fuchsia-400 flex-shrink-0 mt-0.5" />
                                    <span><strong>المعالج الذكي (The Oracle):</strong> تفكيك الأزمات السلوكية على مدار الساعة.</span>
                                </li>
                                <li className="flex items-start gap-2 text-sm text-slate-300">
                                    <Shield className="w-4 h-4 text-fuchsia-400 flex-shrink-0 mt-0.5" />
                                    <span><strong>محاكي الجحيم (Boundaries Simulator):</strong> تدريب عملي للنجاة من مصاصي الطاقة.</span>
                                </li>
                                <li className="flex items-start gap-2 text-sm text-slate-300">
                                    <Sparkles className="w-4 h-4 text-fuchsia-400 flex-shrink-0 mt-0.5" />
                                    <span><strong>استوديو المحتوى (AI Studio):</strong> توليد سكريبتات لا حصر لها لصناع المحتوى.</span>
                                </li>
                            </ul>

                            {tier !== "pro" ? (
                                <button
                                    onClick={handleUpgrade}
                                    disabled={isUpgrading}
                                    className="w-full py-3 bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-fuchsia-900/50 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isUpgrading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                                    {isUpgrading ? "جاري تفعيل الحساب..." : "ترقية الحساب الآن"}
                                </button>
                            ) : (
                                <button
                                    className="w-full py-3 bg-fuchsia-500 text-white rounded-xl text-sm font-bold opacity-80 cursor-default"
                                >
                                    أنت تستمتع بميزات برو!
                                </button>
                            )}
                        </div>
                    </div>

                    <p className="text-center text-xs text-slate-500 mt-6 mt-auto">
                        تُطبق ضريبة القيمة المضافة حسب بلدك. يمكن الإلغاء في أي وقت.
                    </p>
                </div>
            </motion.div>
        </div>
    );
};
